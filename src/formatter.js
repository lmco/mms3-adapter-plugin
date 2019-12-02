/**
 * Classification: UNCLASSIFIED
 *
 * @module src.formatter
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description Exports functions which format MCF objects into the MMS3 API
 * format.
 */

const mcfUtils = M.require('lib.utils');

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
	// TODO
	return orgObj;
}

/**
 * @description Formats an MCF project into an MMS3 project.
 *
 * @param {object} projObj - The MCF project to format
 *
 * @returns {object} An MMS3 formatted project.
 */
function project(projObj) {
	// TODO
	return projObj;
}

/**
 * @description Formats an MCF branch into an MMS3 ref.
 *
 * @param {object} branchObj - The MCF branch to format
 *
 * @returns {object} An MMS3 formatted ref.
 */
function ref(branchObj) {
	// TODO
	return branchObj;
}

/**
 * @description Formats an MCF element into an MMS3 element.
 *
 * @param {object} elemObj - The MCF element to format.
 *
 * @returns {object} An MMS3 formatted element.
 */
function element(elemObj) {
	return {
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
}
