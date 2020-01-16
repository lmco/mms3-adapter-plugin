/**
 * Classification: UNCLASSIFIED
 *
 * @module src.formatter
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber
 *
 * @author Austin Bieber
 * @author Leah De Laurell
 *
 * @description Exports functions which format MCF objects into the MMS3 API
 * format.
 */

// MCF Modules
const mcfUtils = M.require('lib.utils');
const { getPublicData } = M.require('lib.get-public-data');

module.exports = {
	org,
	project,
	ref,
	element
};

/**
 * @description Formats an MCF org into an MMS3 org.
 *
 * @param {object} orgObj - The MCF org to format
 *
 * @returns {object} An MMS3 formatted org.
 */
function org(orgObj) {
	// TODO: Handle _elasticId
	return {
		id: orgObj._id,
		name: orgObj.name
	};
}

/**
 * @description Formats an MCF project into an MMS3 project.
 *
 * @param {object} projObj - The MCF project to format
 *
 * @returns {object} An MMS3 formatted project.
 */
function project(projObj) {
	// TODO: Handle twcId, categoryId, _elasticId
	return {
		type: 'Project',
		name: projObj.name,
		id: mcfUtils.parseID(projObj._id).pop(),
		_creator: projObj.createdBy,
		_created: projObj.createdOn,
		_modifier: projObj.lastModifiedBy,
		_modified: projObj.updatedOn,
		_projectId: mcfUtils.parseID(projObj._id).pop(),
		_refId: 'master',
		orgId: projObj.org
	}
}

/**
 * @description Formats an MCF branch into an MMS3 ref.
 *
 * @param {object} branchObj - The MCF branch to format
 *
 * @returns {object} An MMS3 formatted ref.
 */
function ref(branchObj) {
	// Format branch object for return from MCF API
	const publicBranch = getPublicData(branchObj, 'branch');

	// Note: _elasticId is MMS-only

	return {
		id: publicBranch.id,
		name: publicBranch.name,
		type: (publicBranch.tag) ? 'tag' : 'Branch',
		twcId: (publicBranch.custom.twcId) ? publicBranch.custom.twcId : null, // TODO: not sure about null here
		parentRefId: (publicBranch.source) ? publicBranch.source : 'master',
		_modified: publicBranch.updatedOn,
		_modifier: publicBranch.lastModifiedBy
	};
}

/**
 * @description Formats an MCF element into an MMS3 element.
 *
 * @param {object} elemObj - The MCF element to format.
 *
 * @returns {object} An MMS3 formatted element.
 */
function element(elemObj) {
	const knownFields = ['documentation', 'type', 'ownerID', 'name', '_projectId', '_refId',
		'_creator', '_created', '_modifier', '_modified', '_editable'];
	//TODO: const twcFields = [];

	const elem = {
		id: mcfUtils.parseID(elemObj._id).pop(),
		documentation: elemObj.documentation,
		type: elemObj.type,
		ownerId: (elemObj.parent === null) ? null : mcfUtils.parseID(elemObj.parent).pop(),
		name: elemObj.name,
		_projectId: mcfUtils.parseID(elemObj.project).pop(),
		_refId: mcfUtils.parseID(elemObj.branch).pop(),
		_creator: elemObj.createdBy,
		_created: elemObj.createdOn,
		_modifier: elemObj.lastModifiedBy,
		_modified: elemObj.updatedOn,
		_editable: true
	};

	// handle custom
	Object.keys(elemObj.custom).forEach((field) => {
		//TODO: if (twcFields.includes(field)) {
		elem[field] = elemObj.custom[field];
	});

	// remove the name if it was set to null
	if (elem.name === null) {
		delete elem.name;
	}
	// remove the documentation if it was set to null
	if (elem.documentation === null) {
		delete elem.documentation;
	}

	return elem;
}
