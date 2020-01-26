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
 * @author Austin Bieber
 * @author Leah De Laurell
 * @author Connor Doyle
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
const mcfUtils = M.require('lib.utils');
const Branch = M.require('models.branch');
const mcfJMI = M.require('lib.jmi-conversions');

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
	getBranch,
	getBranches,
	postBranches,
	getMounts,
	getGroups,
	postElements,
	putElements,
	deleteElements,
	getElement,
	getDocuments
};

/**
 * @description Gets a single organization by id which a requesting user has
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
 * @description Gets a specific branch by ID. Returns the single branch in an
 * array, properly formatted for the MMS3 API.
 * @async
 *
 * @param {object} req - The request object.
 * @param {object} req.user - The requesting user object. This object is used to
 * find the branches that the specific user has access to.
 * @param {string} req.params.orgid - The ID of the organization containing the
 * project.
 * @param {string} req.params.projectid - The ID of the project to find the
 * branch on.
 * @param {string} req.params.refid - The ID of the ref (branch) to find.
 *
 * @returns {Promise<object[]>} An array of properly formatted branch objects.
 */
async function getBranch(req) {
	// Grab all the branches from controller
	const branches = await BranchController.find(req.user, req.params.orgid,
		req.params.projectid, req.params.refid);

	// Format data for MMS API response and return
	return branches.map(b => formatter.ref(b));
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

	// Format data for MMS API response and return
	return branches.map(b => formatter.ref(b));
}

/**
 * @description Creates multiple refs (branches) under a specified project.
 * @async
 *
 * @param {object} req - The request object.
 * @param {object} req.user - The requesting user object.
 * @param {string} req.params.orgid - The ID of the organization containing the
 * project.
 * @param {string} req.params.projectid - The ID of the project to create the
 * refs (branches) under.
 * @param {object} req.body - An object which should contain data used to create
 * new refs (branches).
 *
 * @returns {Promise<object[]>} An array of properly formatted ref objects.
 */
async function postBranches(req) {
	const results = [];
	const promises = [];

	const branches = req.body.refs;
	const ids = branches.map(b => mcfUtils.createID(req.params.orgid,
		req.params.projectid, b.id));

	const findQuery = { _id: { $in: ids }};
	const foundBranches = await Branch.find(findQuery);

	const foundBranchIDs = foundBranches.map(b => mcfUtils.parseID(b._id).pop());
	branches.forEach((b) => {
		// Format into MCF branch object
		const branch = {
			id: b.id,
			name: b.name,
			// Ignoring type because mcf branches don't have the type field
			custom: {
				twcId: b.twcId,
				parentRefId: b.parentRefId
			}
		};
		if (branch.id !== 'master') branch.source = b.parentRefId;

		// TODO: Evaluate if this needs to be more like a create or replace function
		//  i.e. should the original branch be replaced instead of updated?
		//  Currently the MCF does not have a createOrReplace function for branches
		// Handle branches to update
		if (foundBranchIDs.includes(b.id)) {
			promises.push(
				BranchController.update(req.user, req.params.orgid, req.params.projectid, branch)
				.then((updatedBranch) => {
					results.push(updatedBranch[0]);
				}));
		}
		// Handle branches to create
		else {
			promises.push(
				BranchController.create(req.user, req.params.orgid, req.params.projectid, branch)
				.then((createdBranch) => {
					results.push(createdBranch[0]);
				}));
		}
	});

	await Promise.all(promises);

	// format back into twc refs and return
	return results.map((b) => formatter.ref(b));
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

	// TODO also: It would be really nice if the MCF did this for us and stored the mounts in a field
	//  in the project model

	// First, get the owning project
  const projects = await ProjectController.find(req.user, req.params.orgid, req.params.projectid);

  // Get every element on that project
	// TODO: does this api route include a branchid?  I hope so
	/*const elements = await ElementController.find(req.user, req.params.orgid, req.params.projectid,
		req.params.refid);

	const projectsToFind = [];

	// Check the source/target of every element on that project for references to other projects
	elements.forEach((e) => {
		if (e.source) {
			const parts = e.source.split(mcfUtils.ID_DELIMITER);
			if (parts[1] !== req.params.projectid) projectsToFind.push(parts[1]);
		}
		if (e.target) {
			const parts = e.target.split(mcfUtils.ID_DELIMITER);
			if (parts[1] !== req.params.projectid) projectsToFind.push(parts[1]);
		}
	});

	const referencedProjects = await ProjectController.find(req.user, req.params.orgid, projectsToFind);
	projects.concat(referencedProjects);*/

	// TODO: Does this need to be recursive to find projects that the referenced projects reference?

  return projects.map((p) => {
    let project = getPublicData(p, 'project');
    return {
			type: 'Project',
			name: project.name,
			id: mcfUtils.parseID(project._id).pop(),
			twcId: project.custom.twcId,
			categoryId: null,
			_creator: project.createdBy,
			_created: project.createdOn,
			_modifier: project.lastModifiedBy,
			_modified: project.updatedOn,
			_projectId: mcfUtils.parseID(project._id).pop(),
			_refId: "master",
			orgId: project.org,
			_mounts: [],
			_editable: true
		};
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
 * @description Creates or replaces elements to the MCF.
 * @async
 *
 * @param {object} req - The request object.
 * @param {object} req.user - The requesting user object. This object is used to
 * find the branches that the specific user has access to.
 * @param {string} req.params.orgid - The ID of the organization containing the
 * project.
 * @param {string} req.params.projectid - The ID of the project containing the
 * ref (branch).
 * @param {string} req.params.refid - The ID of the ref (branch) to put elements to.
 * @param {object} req.body.elements - The elements to be created or replaced.
 *
 * @returns The created elements
 */
async function postElements(req) {
	//const results = [];
	const promises = [];

	const elements = req.body.elements;
	console.log(`There were ${elements.length} elements posted from MDK`);

	// console.log('MDK JSON for POST Elements')
	// console.log(elements)

	const mcfFields = ['id', 'name', 'documentation', 'type', 'parent', 'source', 'target', 'project', 'branch', 'artifact', 'custom'];

	// Format the elements for MCF
	elements.forEach((element) => {
		element.custom = {};
		Object.keys(element).forEach( (field) => {
			// Handle ownerId/parent
			if (field === 'ownerId' && element[field] !== undefined && element[field] !== null) {
				element.parent = element.ownerId;
				// Check if the parent is also being created
				if (!elements.map((e) => e.id).includes(element.parent)) {
					promises.push(ElementController.find(req.user, req.params.orgid, req.params.projectid,
						req.params.refid, element.parent)
						.then((parent) => {
							if (parent.length === 0) delete element.parent;
						}));
				}
			}

			if (!mcfFields.includes(field)) {
				element.custom[field] = element[field];
				delete element[field]
			}
		});
		// Sometimes Cameo wants to store the value as null
		if (element.target === null) {
			element.custom.target = null;
			delete element.target;
		}
		// Sometimes Cameo wants to store nothing; null for these fields will result in the fields
		// not being returned from formatter.js
		if (!element.hasOwnProperty('name')) {
			element.custom.name = null;
		}
		if (!element.hasOwnProperty('documentation')) {
			element.custom.documentation = null;
		}
	});

	await Promise.all(promises);

	const results = await ElementController.createOrReplace(req.user, req.params.orgid, req.params.projectid,
		req.params.refid, elements);

	console.log(`There were ${results.length} elements created/replaced`);
	return results.map((e) => formatter.element(e));

}

/**
 * @description Attempts to find elements by IDs passed in through the body of the
 * request. Returns the founds elemetns.
 * @async
 *
 * @param {object} req - The request object.
 * @param {object} req.user - The requesting user object. This object is used to
 * find the branches that the specific user has access to.
 * @param {string} req.params.orgid - The ID of the organization containing the
 * project.
 * @param {string} req.params.projectid - The ID of the project containing the
 * ref (branch).
 * @param {string} req.params.refid - The ID of the ref (branch) to put elements to.
 * @param {object[]} req.body.elements - An array of elements to find.
 *
 * @returns The found elements.
 */
async function putElements(req) {
  // Define options and ids
  // Note: Undefined if not set
  let options;
  let format;
  let minified = false;
	const results = [];

	const elements = req.body.elements;
	const elemIDs = elements.map((e) => e.id);

	console.log(`There were ${elements.length} elements requested via PUT`);
  // Define valid option and its parsed type
  const validOptions = {
    //MMS3 Compatible options
    alf_ticket: 'string',
    depth: 'number',
    //Standard MCF Options
    populate: 'array',
    archived: 'boolean',
    includeArchived: 'boolean',
    subtree: 'boolean',
    fields: 'array',
    limit: 'number',
    skip: 'number',
    sort: 'string',
    ids: 'array',
    format: 'string',
    minified: 'boolean',
    parent: 'string',
    source: 'string',
    target: 'string',
    type: 'string',
    name: 'string',
    createdBy: 'string',
    lastModifiedBy: 'string',
    archivedBy: 'string',
    artifact: 'string'
  };

  // Loop through req.query
  if (req.query) {
    Object.keys(req.query).forEach((k) => {
      // If the key starts with custom., add it to the validOptions object
      if (k.startsWith('custom.')) {
        validOptions[k] = 'string';
      }
    });
  }

  // Sanity Check: there should always be a user in the request
  if (!req.user) return noUserError(req, res, next);

  // Attempt to parse query options
  try {
    // Extract options from request query
    options = mcfUtils.parseOptions(req.query, validOptions);
    // Remove MMS3 ticket from find
    delete options.alf_ticket;
    // Convert MMS3 depth to MCF
    //TODO: Introduce depth to subtree functionality in core MCF or build custom depth search here
    if (options.depth !== 0) {
      options.subtree = true;
    }
    delete options.depth;
  }
  catch (error) {
    // Error occurred with options, report it
    return mcfUtils.formatResponse(req, res, error.message, errors.getStatusCode(error), next);
  }

  // Check query for element IDs
  //if (options.ids) {
  //  elemIDs = options.ids;
  //  delete options.ids;
  //}

	// console.log('MDK JSON for PUT Elements')
	// console.log(elements)

	// See if the elements already exist
	const foundElements = await ElementController.find(req.user, req.params.orgid,
		req.params.projectid, req.params.refid, elemIDs, options);
	foundElements.forEach((e) => e._id = mcfUtils.parseID(e._id).pop());
	const foundElementIDs = foundElements.map((e) => mcfUtils.parseID(e._id).pop());
	const foundElementsJMI = mcfJMI.convertJMI(1, 2, foundElements);
	const mcfFields = ['id', 'name', 'documentation', 'type', 'parent', 'source', 'target', 'project', 'branch', 'artifact'];

	//Add subtree elements to request array
  if (options.subtree) {
    foundElementIDs.forEach((foundID) => {
      const foundSubElement = {};
      foundSubElement.id = foundID;
      if (!elemIDs.includes(foundID)) {
        elements.push(foundSubElement);
      }
    });
  }

  //Format the elements for mcf
	elements.forEach((element) => {
		element.custom = {};
		Object.keys(element).forEach((field) => {
			if (!mcfFields.includes(field)) {
				element.custom[field] = element[field];
				delete element[field]
			}
		});
		if (foundElementIDs.includes(element.id)) {
			// Return the element that already exists
			results.push(foundElementsJMI[element.id]);
		}
	});

	console.log(`There were ${results.length} elements returned for PUT`);

	return results.map((e) => formatter.element(e));
}

/**
 * @description Deletes elements by ID.
 * @async
 *
 * @param {object} req - The request object.
 * @param {object} req.user - The requesting user object. This object is used to
 * find the branches that the specific user has access to.
 * @param {string} req.params.orgid - The ID of the organization containing the
 * project.
 * @param {string} req.params.projectid - The ID of the project containing the
 * ref (branch).
 * @param {string} req.params.refid - The ID of the ref (branch) to put elements to.
 * @param {object[]} req.body.elements - An array of elements to find.
 *
 * @returns The IDs of the deleted elements
 */
async function deleteElements(req) {
	const elements = req.body.elements;
	const elemIDs = elements.map((e) => e.id);

	const deletedElements = await ElementController.remove(req.user, req.params.orgid,
		req.params.projectid, req.params.refid, elemIDs);

	return deletedElements;
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
