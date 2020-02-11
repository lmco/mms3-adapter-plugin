/**
 * Classification: UNCLASSIFIED
 *
 * @module src.api-controller
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description Handles API functions.
 */


// MBEE modules
const OrgController = M.require('controllers.organization-controller');
const ProjectController = M.require('controllers.project-controller');
const BranchController = M.require('controllers.branch-controller');
const Branch = M.require('models.branch');
const ElementController = M.require('controllers.element-controller');
const { getStatusCode } = M.require('lib.errors');
const mcfJMI = M.require('lib.jmi-conversions');
const mcfUtils = M.require('lib.utils');
const errors = M.require('lib.errors');

// Adapter modules
const format = require('./formatter.js');
const utils = require('./utils.js');


/**
 * @description Formats the session token so that it can be cleanly represented in URIS.
 * Returns the token nested in an object: { data: { ticket: token } }
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
function postLogin(req, res, next) {
  res.locals.statusCode = 200;

  // Reformat the token for use in URIs
  const token = encodeURIComponent(req.session.token);
  res.locals.message = { data: { ticket: token } };
  next();
}

/**
 * @description Responds with a 200 status code, used for OPTIONS requests to login endpoints.
 * Not sure we need both optionsLogin and optionsDefault.
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
function optionsLogin(req, res, next) {
  res.locals.statusCode = 200;
  next();
}

/**
 * @description Responds with a 200 status code, used for OPTIONS requests. Not sure we need both
 * optionsLogin and optionsDefault.
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
function optionsDefault(req, res, next) {
    res.locals.statusCode = 200;
    next();
}

/**
 * @description Returns the id of the user based on authentication of the session token calculated
 * in previous middleware in the format: { username: userID }
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
function getTicket(req, res, next) {
  res.locals.statusCode = 200;
  res.locals.message = { username: req.user._id };
  next();
}

/**
 * @description Gets a single organization by id which a requesting user has access to. Returns
 * the org formatted as an MMS3 org in the MMS3 API style: { orgs: [foundOrg] }.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getOrg(req, res, next) {
  try {
    // Grab the org
    const orgs = await OrgController.find(req.user, req.params.orgid);

    // Return the public data of the org in MMS format
    const data = orgs.map((org) => format.mmsOrg(req.user, org));

    // Set the status code and response message
    res.locals.statusCode = 200;
    res.locals.message = { orgs: data };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description Gets all organizations a requesting user has access to. Returns the orgs formatted
 * as MMS3 orgs in the MMS3 API style: { orgs: [...foundOrgs] }.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getOrgs(req, res, next) {
  try {
    // Grab all the orgs
    const orgs = await OrgController.find(req.user);

    // Return the public data of orgs in MMS format
    const data = orgs.map((org) => format.mmsOrg(req.user, org));

    // Set the status code and response message
    res.locals.statusCode = 200;
    res.locals.message = { orgs: data };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description Creates multiple organizations and returns them formatted as MMS3 orgs in the
 * in the MMS3 API style: { orgs: [...createdOrgs] }.
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function postOrgs(req, res, next) {
  try {
    // Format the org data for MCF
    const orgData = req.body.orgs.map((org) => format.mcfOrg(org));

    // Create the orgs
    const orgs = await OrgController.create(req.user, orgData);

    // Return the public data of the created orgs in MMS format
    const data = orgs.map((org) => format.mmsOrg(req.user, org));

    // Set the status code and response message
    res.locals.statusCode = 200;
    res.locals.message = { orgs: data };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description Gets all projects on a specific org which a requesting user has
 * access to. Returns the projects formatted as MMS3 projects in the MMS3 API style:
 * { projects: [...foundProjects] }.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getProjects(req, res, next) {
  try {
    // Grab all the projects from controller
    const projects = await ProjectController.find(req.user, req.params.orgid);

    // Return the public data of projects in MMS format
    const data = projects.map((project) => format.mmsProject(req.user, project));

    // Set the status code and response message
    res.locals.statusCode = 200;
    res.locals.message = { projects: data };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description Creates multiple projects under a specified organization and returns the created
 * projects formatted as MMS3 projects in the MMS3 API style: { projects: [...createdProjects] }.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function postProjects(req, res, next) {
  try {
    // TODO: validate req.body.projects

    // Format the project data for MCF
    const projData = req.body.projects.map((project) => format.mcfProject(project));

    // Create the projects
    const projects = await ProjectController.create(req.user, req.params.orgid, projData);

    // Return the public data of the newly created projects in MMS format
    const data = projects.map((project) => format.mmsProject(req.user, project));

    // Set the status code and response message
    res.locals.statusCode = 200;
    res.locals.message = { projects: data };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description Gets all projects a requesting user has access to. Returns the projects formatted
 * as MMS3 projects in the MMS3 API style: { projects: [...foundProjects] }.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getAllProjects(req, res, next) {
  // Set the orgid to null, specifying to find all projects
  req.params.orgid = null;
  await getProjects(req, res, next);
}

/**
 * @description Gets a single project on a specific org which a requesting user has access to.
 * Returns the project formatted as MMS3 project in the MMS3 API style: { projects: [foundProject] }
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getProject(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // Grab the specific project from the controller
    const project = await ProjectController.find(req.user, req.params.orgid,
      req.params.projectid);

    // Return the public data of project in MMS format
    const data = project.map((p) => format.mmsProject(req.user, p));

    // Set the status code and response message
    res.locals.statusCode = 200;
    res.locals.message = { projects: data };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = (getStatusCode(error) === 404)
      ? { projects: [] }
      : error.message;
  }
  next();
}

/**
 * @description Gets all MCF branches (MMS3 refs) on a specific project which a requesting user
 * has access to. Returns the branches formatted as MMS3 refs in the MMS3 API style:
 * { refs: [...foundBranches] }
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getRefs(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // Grab all the branches from controller
    const branches = await BranchController.find(req.user, req.params.orgid, req.params.projectid);

    // Return the public data of the branches in MMS format
    const data = branches.map(b => format.mmsRef(req.user, b));

    // Set the status code and response message
    res.locals.statusCode = 200;
    res.locals.message = { refs: data };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description Creates multiple MCF branches (MMS3 refs) under a specified project. Returns the
 * branches formatted as MMS3 refs in the MMS3 API style: { refs: [...createdBranches] }.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function postRefs(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // TODO: validate req.body.refs

    // Format the branch data for MCF
    const branches = req.body.refs.map((branch) => format.mcfBranch(branch));

    const results = [];
    const promises = [];

    const ids = branches.map((b) => mcfUtils.createID(req.params.orgid,
      req.params.projectid, b.id));

    const findQuery = { _id: { $in: ids }};
    const foundBranches = await Branch.find(findQuery);

    const foundBranchIDs = foundBranches.map(b => mcfUtils.parseID(b._id).pop());
    branches.forEach((branch) => {
      // Handle branches to update
      if (foundBranchIDs.includes(branch.id)) {
        promises.push(
          BranchController.update(req.user, req.params.orgid, req.params.projectid, branch)
            .then((updatedBranch) => {
              results.push(updatedBranch[0]);
            })
        );
      }
      // Handle branches to create
      else {
        promises.push(
          BranchController.create(req.user, req.params.orgid, req.params.projectid, branch)
            .then((createdBranch) => {
              results.push(createdBranch[0]);
            })
        );
      }
    });

    await Promise.all(promises);

    // Return public data of branches in MMS format
    const data = results.map((b) => format.mmsRef(req.user, b));

    // Set the status code and response message
    res.locals.statusCode = 200;
    res.locals.message = { refs: data };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description Gets a specific MCF branch (MMS3 ref) by ID. Returns the branch formatted as an MMS3 ref
 * in the MMS3 API style: { refs: [foundBranch] }.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getRef(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // Grab the branch from controller
    const branches = await BranchController.find(req.user, req.params.orgid,
      req.params.projectid, req.params.refid);

    // Return the public data of the branch in MMS format
    const data = branches.map(b => format.mmsRef(req.user, b));

    // Set the status code and response message
    res.locals.statusCode = 200;
    res.locals.message = { refs: data };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description Gets all mounts (referenced projects) of the specified project. Returns the found
 * projects formatted as MMS3 projects in the MMS3 API style: { projects: [...foundProjects] }.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getMounts(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // TODO: Eventually add in the ability to look at the project
    //  references that the elements reference that are not the current
    //  project and push those projects to array for mounts
    //  HOWTO: Any elements whose source or target does not start with org:project
    //  4 pieces: check source field regex for

    // TODO also: It would be really nice if the MCF did this for us and stored the mounts in a field
    //  in the project model

    // First, get the owning project
    const projects = await ProjectController.find(req.user, req.params.orgid, req.params.projectid);

    // Get every element on the branch
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

    const mounts = projects.map((p) => format.mmsProject(req.user, p));

    // Set the status code and response message
    res.locals.statusCode = 200;
    res.locals.message = { projects: mounts};
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next()
}

/**
 * @description TODO
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getGroups(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // Find all elements on the branch with the _isGroup field
    const groupQuery = { "custom._isGroup": "true" };
    const foundGroups = await ElementController.find(req.user, req.params.orgid, req.params.projectid,
      req.params.refid, groupQuery);

    // Return the public data of the group elements in MMS format
    const data = foundGroups.map((e) => format.mmsElement(req.user, e));

    console.log(`There were ${foundGroups.length} groups returned for GET /groups`);

    // Set the status code and response message
    res.locals.statusCode = 200;
    res.locals.message = { groups: data };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description Creates or replaces elements on the MCF. Returns the created elements formatted
 * as MMS3 elements in the MMS3 API style: { elements: [createdElements] }.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function postElements(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // TODO: validate req.body.elements

    console.log(`There were ${req.body.elements.length} elements posted from MDK`);

    // Format the elements for MCF
    const elements = req.body.elements;
    await format.mcfElements(req, elements);

    const results = await ElementController.createOrReplace(req.user, req.params.orgid, req.params.projectid,
      req.params.refid, elements);

    console.log(`There were ${results.length} elements created/replaced`);
    const data = results.map((e) => format.mmsElement(req.user, e));

    // Set the status code and response message
    res.locals.statusCode = 200;
    res.locals.message = { elements: data };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description This API endpoint does not actually function as you would expect PUT
 * to function. Instead of a create or replace request, MDK is actually requesting a
 * find operation by providing element ids. This function attempts to find elements
 * using the IDs passed in through the body of the request and returns all found elements
 * in the MMS3 api format: { elements: [...foundElements] }
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function putElements(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // Define options and ids
    let options;

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

    // Add custom.* query options
    if (req.query) {
      Object.keys(req.query).forEach((k) => {
        // If the key starts with custom., add it to the validOptions object
        if (k.startsWith('custom.')) {
          validOptions[k] = 'string';
        }
      });
    }

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

    // TODO: validation on req.body.elements

    const elements = req.body.elements;
    const elemIDs = elements.map((e) => e.id);
    console.log(`There were ${elements.length} elements requested via PUT`);

    // Search for the elements
    const foundElements = await ElementController.find(req.user, req.params.orgid,
      req.params.projectid, req.params.refid, elemIDs, options);

    console.log(`There were ${foundElements.length} elements returned for PUT`);

    // Return the public data of the elements in MMS format
    const data = foundElements.map((e) => format.mmsElement(req.user, e));

    // Set the status code and response message
    res.locals.statusCode = 200;
    res.locals.message = { elements: data };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description Deletes elements by ID and returns the IDs of the successfully
 * deleted elements in the MMS3 API format: { elements: [...deletedIDs] }
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function deleteElements(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    const elements = req.body.elements;
    const elemIDs = elements.map((e) => e.id);

    // Delete the elements; get the element ids back
    const deletedElements = await ElementController.remove(req.user, req.params.orgid,
      req.params.projectid, req.params.refid, elemIDs);

    // Set the status code and response message
    res.locals.statusCode = 200;
    res.locals.message = { elements: deletedElements };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description Gets a single element by ID and returns it in the MMS3 API format.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getElement(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // TODO: Handle the extended query parameter
    // Grabs an element from controller
    const elements = await ElementController.find(req.user, req.params.orgid, req.params.projectid, req.params.refid, req.params.elementid);

    // If no elements are found, throw an error
    if (elements.length === 0)  {
      throw new M.NotFoundError(`Element ${req.params.elementid} not found.`, 'warn');
    }

    // Format the element object
    const data = format.mmsElement(req.user, elements[0]);

    res.locals.statusCode = 200;
    res.locals.message = { elements: data };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

// TODO
async function getElementCfids(req, res, next) {
  return res.status(501).send('Not Implemented');
}

/**
 * @description Returns all documents on a specified branch. This function still
 * needs to be implemented.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getDocuments(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // TODO: figure out what documents are
    const data = [];

    res.locals.statusCode = 200;
    res.locals.message = { documents: data };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description The commits object is an array of every commit on the project. Each commit object
 * has an id, a _creator, and a _created field.  Because commits are not yet implemented in MCF,
 * this function will query the latest commits object and return it to give the impression that
 * MCF is at the latest commit.
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getCommits(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // TODO: Figure out what to do about commits
    const result = {
      commits: [
        {
          id: 'id',
          _creator: "creator",
          _created: "date"
        }
      ]
    };

    res.locals.statusCode = 200;
    res.locals.message = { commits: [] };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}


module.exports = {
  postLogin,
  optionsLogin,
  optionsDefault,
  getTicket,
  getOrg,
  getOrgs,
  postOrgs,
  getProjects,
  postProjects,
  getAllProjects,
  getProject,
  getRefs,
  postRefs,
  getRef,
  getMounts,
  getGroups,
  postElements,
  putElements,
  deleteElements,
  getElement,
  getElementCfids,
  getDocuments,
  getCommits
};
