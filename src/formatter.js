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
 * @description Exports functions which format MDK requests into MCF-friendly objects
 * and MCF objects into MMS3 objects
 * format.
 */

// MCF Modules
const ElementController = M.require('controllers.element-controller');
const mcfUtils = M.require('lib.utils');
const { getPublicData } = M.require('lib.get-public-data');

// Adapter modules
const namespace = require('./utils').customDataNamespace;

module.exports = {
	mcfOrg,
	mcfProject,
	mcfBranch,
	mcfElements,
	mmsOrg,
	mmsProject,
	mmsRef,
	mmsElement
};

/**
 *
 * @param org
 * @returns {*}
 */
function mcfOrg(org) {
	// Define known MCF fields
	const knownKeys = ['id', 'name', 'custom'];

	// Define the custom data field
	org.custom = {
		[namespace]: {}
	};

	// Add extra keys to custom data
	Object.keys(org).forEach((k) => {
		if (!knownKeys.includes(k)) {
			proj.custom[namespace][k] = org[k];
			delete org[k];
		}
	});

	return org;
}

/**
 *
 * @param proj
 * @returns {*}
 */
function mcfProject(proj) {
	// Define known MCF fields
	const knownKeys = ['id', 'name', 'custom'];

	// Define the custom data field
	proj.custom = {
		[namespace]: {}
	};

	// Add extra keys to custom data
	Object.keys(proj).forEach((k) => {
		if (!knownKeys.includes(k)) {
			proj.custom[namespace][k] = proj[k];
			delete proj[k];
		}
	});

	return proj;
}

/**
 *
 * @param branch
 * @returns {*}
 */
function mcfBranch(branch) {
	// Define known MCF fields
	const knownKeys = ['id', 'name', 'source', 'custom'];

	// Define the custom data field
	branch.custom = {
		[namespace]: {}
	};

	if (branch.id !== 'master') branch.source = branch.parentRefId;

	// Add extra keys to custom data
	Object.keys(branch).forEach((k) => {
		if (!knownKeys.includes(k)) {
			branch.custom[namespace][k] = branch[k];
			delete branch[k];
		}
	});

	return branch;
}

/**
 * @description
 * @async
 *
 * @param {object} req - The request object. Used for its orgid, projectid, and refid parameters.
 * @param {object} elements - The elements to format.
 * @returns The formatted element
 */
async function mcfElements(req, elements) {
	const mcfFields = ['id', 'name', 'documentation', 'type', 'parent', 'source', 'target', 'project', 'branch', 'artifact', 'custom'];
	const promises = [];

	elements.forEach((elem) => {
		elem.custom = {
			[namespace]: {}
		};
		Object.keys(elem).forEach( (field) => {
			// Handle ownerId/parent
			if (field === 'ownerId' && elem[field] !== undefined && elem[field] !== null) {
				elem.parent = elem.ownerId;
				// Check if the parent is also being created
				if (!elements.map((e) => e.id).includes(elem.parent)) {
					promises.push(ElementController.find(req.user, req.params.orgid, req.params.projectid,
						req.params.refid, elem.parent)
						.then((parent) => {
							if (parent.length === 0) delete elem.parent;
						}));
				}
			}

			if (!mcfFields.includes(field)) {
				elem.custom[namespace][field] = elem[field];
				delete elem[field]
			}
		});
		// Sometimes Cameo wants to store the value as null
		if (elem.target === null) {
			elem.custom[namespace].target = null;
			delete elem.target;
		}
		// Sometimes Cameo wants to store nothing; null for these fields will result in the fields
		// not being returned in mmsElement()
		if (!elem.hasOwnProperty('name')) {
			elem.custom[namespace].name = null;
		}
		if (!elem.hasOwnProperty('documentation')) {
			elem.custom[namespace].documentation = null;
		}
	});

	await Promise.all(promises);
}

/**
 * @description Formats an MCF org into an MMS3 org.
 *
 * @param {object} orgObj - The MCF org to format
 *
 * @returns {object} An MMS3 formatted org.
 */
function mmsOrg(reqUser, orgObj) {
	// TODO: Handle _elasticId
	const org = getPublicData(reqUser, orgObj, 'org');

	return {
		id: org.id,
		name: org.name
	};
}

/**
 * @description Formats an MCF project into an MMS3 project.
 *
 * @param {object} reqUser
 * @param {object} projObj - The MCF project to format
 *
 * @returns {object} An MMS3 formatted project.
 */
function mmsProject(reqUser, projObj) {
	// Get the public data of the project
	const proj = getPublicData(reqUser, projObj, 'project');

	// TODO: Handle categoryId, _elasticId

	// TODO: convert custom[namespace] into fields

	return {
		type: 'Project',
		name: proj.name,
		id: proj.id,
		_creator: proj.createdBy,
		_created: proj.createdOn,
		_modifier: proj.lastModifiedBy,
		_modified: proj.updatedOn,
		_projectId: proj.id,
		_refId: 'master',
		orgId: proj.org
	}
}

/**
 * @description Formats an MCF branch into an MMS3 ref.
 *
 * @param {object} branchObj - The MCF branch to format
 *
 * @returns {object} An MMS3 formatted ref.
 */
function mmsRef(reqUser, branchObj) {
	// Get the public data of the branch
	console.log('-------')
	console.log(branchObj)
	const publicBranch = getPublicData(reqUser, branchObj, 'branch');
	console.log(publicBranch)
	// Note: _elasticId is MMS-only

	// TODO: convert custom[namespace] into fields

	const branch = {
		id: publicBranch.id,
		name: publicBranch.name,
		type: (publicBranch.tag) ? 'tag' : 'Branch',
		parentRefId: (publicBranch.source) ? publicBranch.source : 'master',
		_modified: publicBranch.updatedOn,
		_modifier: publicBranch.lastModifiedBy
	};

	if (publicBranch.custom.hasOwnProperty(namespace)) {
		Object.keys(publicBranch.custom[namespace]).forEach((field) => {
			branch[field] = publicBranch.custom[namespace][field];
		});
	}

	return branch;
}

/**
 * @description Formats an MCF element into an MMS3 element.
 *
 * @param {object} elemObj - The MCF element to format.
 *
 * @returns {object} An MMS3 formatted element.
 */
function mmsElement(reqUser, elemObj) {
	// Get the public data of the element
	const elemPublicData = getPublicData(reqUser, elemObj, 'element');

	// TODO: use this or get rid of it
	const knownFields = ['documentation', 'type', 'ownerID', 'name', '_projectId', '_refId',
		'_creator', '_created', '_modifier', '_modified', '_editable'];

	const elem = {
		id: elemPublicData.id,
		documentation: elemPublicData.documentation,
		type: elemPublicData.type,
		ownerId: (elemPublicData.parent === null) ? null : mcfUtils.parseID(elemPublicData.parent).pop(),
		name: elemPublicData.name,
		_projectId: mcfUtils.parseID(elemPublicData.project).pop(),
		_refId: mcfUtils.parseID(elemPublicData.branch).pop(),
		_creator: elemPublicData.createdBy,
		_created: elemPublicData.createdOn,
		_modifier: elemPublicData.lastModifiedBy,
		_modified: elemPublicData.updatedOn,
		_editable: true
	};

	// Handle custom
	Object.keys(elemObj.custom[namespace]).forEach((field) => {
		elem[field] = elemObj.custom[namespace][field];
	});

	// Remove the name if it was set to null
	if (elem.name === null) {
		delete elem.name;
	}
	// Remove the documentation if it was set to null
	if (elem.documentation === null) {
		delete elem.documentation;
	}

	return elem;
}
