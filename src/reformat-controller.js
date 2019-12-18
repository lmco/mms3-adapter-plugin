/**
 * Classification: UNCLASSIFIED
 *
 * @module src.reformat-controller
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber
 *
 * @author Leah De Laurell
 * @author Austin Bieber
 *
 * @description The controller which contains the main middleware logic for
 * converting MMS3 formatted data to MCF format, calling MCF controller
 * functions, and then formatting the response data back into the MMS3 format.
 */

// MBEE Modules
const BranchController = M.require('controllers.branch-controller');
const ElementController = M.require('controllers.element-controller');
const OrgController = M.require('controllers.organization-controller');
const ProjectController = M.require('controllers.project-controller');
// TODO: Consider moving getPublicData usage to formatter.js
const { getPublicData } = M.require('lib.get-public-data');

// Adapter Modules
const formatter = require('./formatter.js');

// Export the module
module.exports = {
	getOrg,
	getOrgs,
	postOrgs,
	getProject,
	getProjects,
	postProjects,
	getBranches,
	getMounts,
	getGroups,
	getElement,
	getDocuments
};

/**
 * @description Gets a single organizations by id which a requesting user has
 * access to. Returns an array containing the single organization, properly
 * formatted for the MMS3 API.
 * @async
 *
 * @param {object} req - The request object.
 * @param {object} req.user - The requesting user object. This object is used to
 * find the organizations that the specific user has access to.
 * @param {object} req.params.orgid - The ID of the organization to find.
 *
 * @returns {Promise<object[]>} An array of properly formatted organization
 * objects.
 */
async function getOrg(req) {
	// Grab all the orgs from controller
	const orgs = await OrgController.find(req.user, req.params.orgid);
	// Return all the public data of orgs
	// TODO: Ensure ONLY expected fields are returned
	return orgs.map((org) => getPublicData(org, 'org'));
}

/**
 * @description Gets all organizations a requesting user has access to. Returns
 * an array of organizations, properly formatted for the MMS3 API.
 * @async
 *
 * @param {object} req - The request object.
 * @param {object} req.user - The requesting user object. This object is used to
 * find the organizations that the specific user has access to.
 *
 * @returns {Promise<object[]>} An array of properly formatted organization
 * objects.
 */
async function getOrgs(req) {
	// Grab all the orgs from controller
	const orgs = await OrgController.find(req.user);
	// Return all the public data of orgs
	// TODO: Ensure ONLY expected fields are returned
	return orgs.map((org) => getPublicData(org, 'org'));
}

/**
 * @description Creates multiple organizations.
 * @async
 *
 * @param {object} req - The request object.
 * @param {object} req.user - The requesting user object.
 * @param {object} req.body - An object which should contain data used to create
 * new organizations.
 *
 * @returns {Promise<object[]>} An array of properly formatted organization
 * objects.
 */
async function postOrgs(req) {
	const orgData = req.body.orgs;
	const bodyKeys = Object.keys(req.body);

	// Add each additional property in the request body to each org.
	orgData.forEach((o) => {
		// Define the custom data field
		o.custom = {};

		// Add each key to custom data
		bodyKeys.forEach((k) => {
			if (k !== 'orgs') {
				o.custom[k] = req.body[k];
			}
		});
	});

	// Create the orgs
	const orgs = await OrgController.create(req.user, orgData);

	// Return all the public data of orgs
	// TODO: Ensure ONLY expected fields are returned
	return orgs.map((org) => getPublicData(org, 'org'));
}

/**
 * @description Gets a single project on a specific org which a requesting user
 * has access to. Returns a single found project, properly formatted for the
 * MMS3 API.
 * @async
 *
 * @param {object} req - The request object.
 * @param {object} req.user - The requesting user object. This object is used to
 * find the projects that the specific user has access to.
 * @param {string} req.params.orgid - The ID of the organization to find
 * project on.
 * @param {string} req.params.projectid - The ID of the project to find.
 *
 * @returns {Promise<object[]>} An array of properly formatted project objects.
 */
async function getProject(req) {
	// Grab the specific project from the controller
	const project = await ProjectController.find(req.user, req.params.orgid,
		req.params.projectid);

	// Return all the public data of projects
	// TODO: Ensure ONLY expected fields are returned
	return project.map((p) => getPublicData(p, 'project'));
}

/**
 * @description Gets all projects on a specific org which a requesting user has
 * access to. Returns an array of projects, properly formatted for the MMS3 API.
 * @async
 *
 * @param {object} req - The request object.
 * @param {object} req.user - The requesting user object. This object is used to
 * find the projects that the specific user has access to.
 * @param {string} req.params.orgid - The ID of the organization to find
 * projects on.
 *
 * @returns {Promise<object[]>} An array of properly formatted project objects.
 */
async function getProjects(req) {
	// Grab all the projects from controller
	const projects = await ProjectController.find(req.user, req.params.orgid);
	// Return all the public data of projects
	// TODO: Ensure ONLY expected fields are returned
	return projects.map((project) => getPublicData(project, 'project'));
}

/**
 * @description Creates multiple projects under a specified organization.
 * @async
 *
 * @param {object} req - The request object.
 * @param {object} req.user - The requesting user object.
 * @param {string} req.params.orgid - The ID of the organization to create the
 * projects under.
 * @param {object} req.body - An object which should contain data used to create
 * new projects.
 *
 * @returns {Promise<object[]>} An array of properly formatted project objects.
 */
async function postProjects(req) {
	const projData = req.body.projects;

	// Add each field
	projData.forEach((p) => {
		const knownKeys = ['id', 'name'];

		// Define the custom data field
		p.custom = {};

		// Add extra keys to custom data
		Object.keys(p).forEach((k) => {
			if (!knownKeys.includes(k)) {
				p.custom[k] = p[k];
				delete p[k];
			}
		});
	});

	// Create the projects
	const projects = await ProjectController.create(req.user, req.params.orgid, projData);

	// Return all the public data of the newly created projects
	// TODO: Ensure ONLY expected fields are returned
	return projects.map((project) => getPublicData(project, 'project'));
}

/**
 * @description Gets all branches on a specific project which a requesting user
 * has access to. Returns an array of branches, properly formatted for the MMS3
 * API.
 * @async
 *
 * @param {object} req - The request object.
 * @param {object} req.user - The requesting user object. This object is used to
 * find the branches that the specific user has access to.
 * @param {string} req.params.orgid - The ID of the organization containing the
 * project.
 * @param {string} req.params.projectid - The ID of the project to find branches
 * on.
 *
 * @returns {Promise<object[]>} An array of properly formatted branch objects.
 */
async function getBranches(req) {
  // Grab all the branches from controller
	const branches = await BranchController.find(req.user, req.params.orgid, req.params.projectid);
	// Return all the public data of branches in ve form
	// TODO: Ensure ONLY expected fields are returned
	return branches.map((branch) => {
		// Get public data of branches
		const publicData = getPublicData(branch, 'branch');
		// Verify if a tag
		if (branch.tag) {
			// Add type field as a tag
			publicData.type = 'Tag';
		}
		else {
			// Add type field as a branch
			publicData.type = 'Branch';
		}

		// Return public data
		return publicData;
	});
}

/**
 * @description Gets all mounts (referenced projects) and returns the requested
 * project, containing an array of the mounts (referenced projects). Returns
 * the project formatted properly for the MMS3 API.
 * @async
 *
 * @param {object} req - The request object.
 * @param {object} req.user - The requesting user object. This object is used to
 * find the branches that the specific user has access to.
 * @param {string} req.params.orgid - The ID of the organization containing the
 * project.
 * @param {string} req.params.projectid - The ID of the project to find mounts
 * on.
 *
 * @returns {Promise<object[]>} An array containing the found project, which
 * includes a field _mounts. This field contains an array of referenced project
 * objects.
 */
async function getMounts(req) {
  // TODO: Eventually add in the ability to look at the project
  //  references that the elements reference that are not the current
  //  project and push those projects to array for mounts
  //  HOWTO: Any elements whose source or target does not start with org:project
  //  4 pieces: check source field regex for
  const projects = await ProjectController.find(req.user, req.params.orgid, req.params.projectid);
  return projects.map((p) => {
    let retObj = getPublicData(p, 'project');
    retObj._mounts = [];
    return retObj;
  });
}

/**
 * @description Returns a refs (branches) groups. At this point in time we still
 * do not know the purpose of groups. For this reason, an empty array is all
 * that is being returned for now.
 * @async
 *
 * @param {object} req - The request object.
 *
 * @returns {Promise<object[]>} An empty array.
 */
async function getGroups(req) {
	// TODO: Figure out what groups are used for, how to get them from MCF and
	//  implement this function!
	return [];
}

/**
 * @description Gets a single element by ID and returns it, properly formatted
 * for the MMS3 API.
 * @async
 *
 * @param {object} req - The request object.
 * @param {object} req.user - The requesting user object. This object is used to
 * find the branches that the specific user has access to.
 * @param {string} req.params.orgid - The ID of the organization containing the
 * project.
 * @param {string} req.params.projectid - The ID of the project containing the
 * ref (branch).
 * @param {string} req.params.refid - The ID of the ref (branch) containing the
 * element.
 * @param {string} req.params.elementid - The ID of the element to find.
 * @param {boolean} req.query.extended - A query option which is currently not
 * supported.
 *
 * @returns {Promise<object>} Returns a properly formatted element object.
 */
async function getElement(req) {
	// TODO: Handle the extended query parameter
	// Grabs an element from controller
	const elements = await ElementController.find(req.user, req.params.orgid, req.params.projectid, req.params.refid, req.params.elementid);

	// If no elements are found, throw an error
	if (elements.length === 0)  {
		throw new M.NotFoundError(`Element ${req.params.elementid} not found.`, 'warn');
	}

  // Format the element object
  return formatter.element(elements[0]);
}

/**
 * @description Returns all documents on a specified branch. This function still
 * needs to be implemented.
 * @async
 *
 * @param {object} req - The request object.
 *
 * @returns {Promise<object[]>} Returns an empty array.
 */
async function getDocuments(req) {
	// TODO: Understand documents and implement this function
  return [];
}
