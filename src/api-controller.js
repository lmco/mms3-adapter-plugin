/**
 * @classification UNCLASSIFIED
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
 * @author Austin Bieber
 *
 * @description Handles API functions.
 */

// Node modules
const fs = require('fs');
const path = require('path');

// NPM modules
const multer = require('multer');
const upload = multer().single('file');

// MBEE modules
const OrgController = M.require('controllers.organization-controller');
const ProjectController = M.require('controllers.project-controller');
const BranchController = M.require('controllers.branch-controller');
const Branch = M.require('models.branch');
const ElementController = M.require('controllers.element-controller');
const ArtifactController = M.require('controllers.artifact-controller');
const { getStatusCode } = M.require('lib.errors');
const mcfUtils = M.require('lib.utils');
const jmi = M.require('lib.jmi-conversions');
const errors = M.require('lib.errors');

// Adapter modules
const format = require('./formatter.js');
const utils = require('./utils.js');
const sjm = require('./sjm.js');
const namespace = utils.customDataNamespace;


/**
 * @description Formats the session token so that it can be cleanly represented in URIS.
 * Returns the token nested in an object: { data: { ticket: token } }.
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
 */
function postLogin(req, res, next) {
  res.locals.statusCode = 200;

  // Reformat the token for use in URIs
  const token = encodeURIComponent(req.session.token);
  res.locals.message = { data: { ticket: token } };
  next();
}

/**
 * @description Responds with a 200 status code, used for OPTIONS requests. For some reason,
 * View Editor needs OPTIONS endpoints to be available for most of the endpoints it makes
 * requests to.
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
 */
function optionsDefault(req, res, next) {
  res.locals.statusCode = 200;
  next();
}

/**
 * @description Returns the id of the user based on authentication of the session token calculated
 * in previous middleware in the format: { username: userID }.
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
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
 * @param {Function} next - Middleware callback to trigger the next function.
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
 * @param {Function} next - Middleware callback to trigger the next function.
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
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
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
 * @param {Function} next - Middleware callback to trigger the next function.
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
 * @param {Function} next - Middleware callback to trigger the next function.
 */
async function postProjects(req, res, next) {
  try {
    // Format the project data for MCF
    const projData = req.body.projects.map((project) => format.mcfProject(project));

    // Create the projects
    const projects = await ProjectController.create(req.user, req.params.orgid, projData);

    // Give each project a view_instances_bin
    await utils.asyncForEach(projects, async (project) => {
      const projectID = mcfUtils.parseID(project._id).pop();
      const elem = {
        id: `view_instances_bin_${projectID}`,
        name: 'View Instances Bin',
        parent: 'model'
      };
      // Create the view_instances_bin
      await ElementController.create(req.user, req.params.orgid, projectID, 'master', elem);
    });

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
 * @param {Function} next - Middleware callback to trigger the next function.
 */
async function getAllProjects(req, res, next) {
  // Set the orgid to null, specifying to find all projects
  req.params.orgid = null;
  await getProjects(req, res, next);
}

/**
 * @description Gets a single project on a specific org which a requesting user has access to.
 * Returns the project formatted as MMS3 project in the MMS3 API style:
 * { projects: [foundProject] }.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
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
 * { refs: [...foundBranches] }.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
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
 * @param {Function} next - Middleware callback to trigger the next function.
 */
async function postRefs(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // Format the branch data for MCF
    const branches = req.body.refs.map((branch) => format.mcfBranch(branch));

    const results = [];
    const promises = [];

    const ids = branches.map((b) => mcfUtils.createID(req.params.orgid,
      req.params.projectid, b.id));

    const findQuery = { _id: { $in: ids } };
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
 * @description Gets a specific MCF branch (MMS3 ref) by ID. Returns the branch formatted as
 * an MMS3 ref in the MMS3 API style: { refs: [foundBranch] }.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
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
 * @param {Function} next - Middleware callback to trigger the next function.
 */
async function getMounts(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // First get the owning project
    const mounts = await ProjectController.find(req.user, req.params.orgid, req.params.projectid);

    // Get all "Mount" elements
    const options = { type: 'Mount' };
    const mountElements = await ElementController.find(req.user, req.params.orgid,
      req.params.projectid, req.params.refid, options);

    // Find the mounted projects
    const mountedProjectsToFind = mountElements
    .map((e) => e.custom[namespace].mountedElementProjectId)
    .filter((id) => id);

    let mountedProjects;
    try {
      mountedProjects = await ProjectController.find(req.user, req.params.orgid,
        mountedProjectsToFind);
    }
    catch (error) {
      M.log.info('No mounted projects found');
    }

    if (mountedProjects) mounts.push(...mountedProjects);

    const formattedMounts = mounts.map((p) => format.mmsProject(req.user, p));

    // Set the status code and response message
    res.locals.statusCode = 200;
    res.locals.message = { projects: formattedMounts };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description Gets all elements that have a field "_isGroup" with a value of true.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
 */
async function getGroups(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // Find all elements on the branch with the _isGroup field
    const groupQuery = { [`custom.${namespace}._isGroup`]: 'true' };
    const foundGroups = await ElementController.find(req.user, req.params.orgid,
      req.params.projectid, req.params.refid, groupQuery);

    // Return the public data of the group elements in MMS format
    const data = foundGroups.map((e) => format.mmsElement(req.user, e));

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
 * @description Creates or updates elements on the MCF. Returns the created elements formatted
 * as MMS3 elements in the MMS3 API style: { elements: [createdElements] }.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
 */
async function postElements(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // Format the elements for MCF
    const elements = req.body.elements;
    await format.mcfElements(req, elements);

    const elemIDs = elements.map((e) => e.id);

    // Check to see if any of the elements exist already
    const foundElements = await ElementController.find(req.user, req.params.orgid,
      req.params.projectid, req.params.refid, elemIDs);
    const foundIDs = foundElements.map((e) => {
      e._id = mcfUtils.parseID(e._id).pop();
      return e._id;
    });
    const foundJMI = jmi.convertJMI(1, 2, foundElements);

    // Divide the incoming elements into elements that need to be created and elements that need
    // to be updated
    const createElements = elements.filter((e) => !foundIDs.includes(e.id));
    let updateElements = elements.filter((e) => foundIDs.includes(e.id));

    let createdElements = [];
    let updatedElements = [];
    const individualUpdates = [];
    const deletedChildViews = {};
    const addedChildViews = {};

    // Create elements if there are any elements to be created
    if (createElements.length !== 0) {
      createdElements = await ElementController.create(req.user, req.params.orgid,
        req.params.projectid, req.params.refid, createElements);
    }

    if (updateElements.length !== 0) {
      updateElements.forEach((update) => {
        const existing = foundJMI[update.id];

        // This was needed for creating elements but causes issues with updating elements
        if (update.custom[namespace].hasOwnProperty('name')) delete update.custom[namespace].name;
        if (update.custom[namespace].hasOwnProperty('documentation')) {
          delete update.custom[namespace].documentation;
        }

        // Additional processing for updates to child views
        if (update.custom[namespace].hasOwnProperty('_childViews')) {
          const cvUpdate = update.custom[namespace]._childViews;

          // Verify that the _childViews update is valid
          if (Array.isArray(cvUpdate) && cvUpdate.every((v) => typeof v.id === 'string'
            && typeof v.aggregation === 'string' && typeof v.propertyId === 'string')) {
            // Initialize the ownedAttributeIds field on the update
            update.custom[namespace].ownedAttributeIds = [];
            // Add ownedAttributeIds to the update in order corresponding to the _childViews update
            for (let i = 0; i < cvUpdate.length; i++) {
              update.custom[namespace].ownedAttributeIds.push(cvUpdate[i].propertyId);
            }
          }
          else {
            throw new M.DataFormatError('Invalid update to _childViews field.', 'warn');
          }
          // Check if a child view is being added or removed by comparing existing and
          // updated ownedAttributeIds
          if (existing.custom[namespace] && existing.custom[namespace].ownedAttributeIds) {
            const oldIDs = existing.custom[namespace].ownedAttributeIds;
            const newIDs = update.custom[namespace].ownedAttributeIds;

            // If not every new id is in the list of old ids, an old id has been deleted
            if (!oldIDs.every((id) => newIDs.includes(id))) {
              const deletedIDs = oldIDs.filter((id) => !newIDs.includes(id));
              deletedIDs.forEach((id) => {
                // Associate the existing element with the deleted childView; it will be used later
                deletedChildViews[id] = existing;
              });
            }
            // If not every old id is in the list of new ids, a new id has been added
            if (!newIDs.every((id) => oldIDs.includes(id))) {
              const addedIDs = newIDs.filter((id) => !oldIDs.includes(id));
              addedIDs.forEach((id) => {
                addedChildViews[id] = update.id;
              });
            }
          }
        }

        // Special logic for update elements: custom data is normally replaced in an update
        // operation.  Here, however, we want to keep the data that's already there and only
        // add new fields.  TBD: deleting fields.
        if (existing.custom && existing.custom[namespace]) {
          Object.keys(existing.custom[namespace]).forEach((key) => {
            if (!Object.keys(update.custom[namespace]).includes(key)
              && !(update.hasOwnProperty('name') && key === 'name')) {
              update.custom[namespace][key] = existing.custom[namespace][key];
            }
          });
        }

        // Updates to elements' parents cannot be made in bulk
        if (update.hasOwnProperty('parent')) {
          individualUpdates.push(update);
        }
      });

      // When a view has been moved, i.e. deleted from one element and added to another element,
      // we must also make updates to a special relationship element that is linked to the view.
      if (Object.keys(addedChildViews).length > 0) {
        await utils.asyncForEach(Object.keys(addedChildViews), async (key) => {
          // If a view was added that was also deleted, additional updates must be made
          if (Object.keys(deletedChildViews).includes(key)) {
            // First find the child view element
            const cvElems = await ElementController.find(req.user, req.params.orgid,
              req.params.projectid, req.params.refid, key);
            // Then find the association element
            const associations = await ElementController.find(req.user, req.params.orgid,
              req.params.projectid, req.params.refid, cvElems[0].custom[namespace].associationId);
            // Then find the element referenced by the association element's ownedEndId
            const ownedEnds = await ElementController.find(req.user, req.params.orgid,
              req.params.projectid, req.params.refid,
              associations[0].custom[namespace].ownedEndIds);
            // Initialize the update to the ownedEnd element.  The typeId of this element needs to
            // point to the id of the new view element that the child view has been added to.
            const update = {
              id: mcfUtils.parseID(ownedEnds[0]._id).pop(),
              custom: {
                [namespace]: {
                  typeId: addedChildViews[key]
                }
              }
            };
            const oldView = deletedChildViews[key];
            // Make sure to save the custom data of the element
            Object.keys(oldView.custom[namespace]).forEach((field) => {
              if (!Object.keys(update.custom[namespace]).includes(field)
                && !(update.hasOwnProperty('name') && key === 'name')) {
                update.custom[namespace][field] = oldView.custom[namespace][field];
              }
            });
            // Add the update to a list of updates to be made
            individualUpdates.push(update);
          }
        });
      }

      // If there are elements that need to be updated individually, remove them from the bulk list
      // and run individual updates
      if (individualUpdates.length !== 0) {
        const individualIDs = individualUpdates.map((e) => e.id);
        updateElements = updateElements.filter((e) => !individualIDs.includes(e.id));

        await utils.asyncForEach(individualUpdates, async (individualUpdate) => {
          const updatedElement = await ElementController.update(req.user, req.params.orgid,
            req.params.projectid, req.params.refid, individualUpdate);
          updatedElements = updatedElements.concat(updatedElement);
        });
      }

      // Update elements in bulk
      if (updateElements.length !== 0) {
        const bulkUpdatedElements = await ElementController.update(req.user, req.params.orgid,
          req.params.projectid, req.params.refid, updateElements);
        updatedElements = updatedElements.concat(bulkUpdatedElements);
      }
    }

    const results = createdElements.concat(updatedElements);

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
 * in the MMS3 api format: { elements: [...foundElements] }.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
 */
async function putElements(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // Define options and ids
    let options;

    // Define valid option and its parsed type
    const validOptions = {
      alf_ticket: 'string',
      depth: 'number'
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
      if (options.depth !== 0) {
        options.subtree = true;
      }
      delete options.depth;
    }
    catch (error) {
      // Error occurred with options, report it
      return mcfUtils.formatResponse(req, res, error.message, errors.getStatusCode(error), next);
    }

    const elements = req.body.elements;
    // .filter because sometimes VE sends { id: null } and this will cause an error
    const elemIDs = elements.map((e) => e.id).filter((id) => id);

    // Search for the elements
    const foundElements = await ElementController.find(req.user, req.params.orgid,
      req.params.projectid, req.params.refid, elemIDs, options);

    // Generate the child views of the element if there are any
    await utils.generateChildViews(req.user, req.params.orgid, req.params.projectid,
      req.params.refid, foundElements);

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
 * deleted elements in the MMS3 API format: { elements: [...deletedIDs] }.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
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
 * @description This function is a work in progress. It is expected to mirror the MMS search
 * endpoint which accepts a formatted ElasticSearch query, runs that query on its own
 * ElasticSearch database, and then returns the results of that query. This function is
 * awaiting a small re-write of View Editor's search function to send a more generic query
 * format than specifically formatted ElasticSearch queries.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
 */
async function putElementSearch(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);
    let projID = req.params.projectid;
    const branchID = req.params.refid;
    let elemID;

    if (req.body.query) {
      elemID = req.body.query.bool.filter[0].term.id;
      projID = req.body.query.bool.filter[1].term._projectId;
    }

    const elements = await ElementController.find(req.user, req.params.orgid, projID, branchID,
      elemID);

    // Generate the child views of the element if there are any
    await utils.generateChildViews(req.user, req.params.orgid, projID, branchID, elements);

    // Return the public data of the elements in MMS format
    const data = elements.map((e) => format.mmsElement(req.user, e));

    // Set the status code and response message
    res.locals.statusCode = 200;
    res.locals.message = { elements: data };
  }
  catch (error) {
    M.log.warn(error.message);
    const statusCode = getStatusCode(error);
    if (statusCode === 404) {
      res.locals.statusCode = 200;
      res.locals.message = {
        elements: [],
        messages: {
          code: 404,
          id: req.params.elementid,
          message: error.message
        }
      };
    }
    else {
      res.locals.statusCode = statusCode;
      res.locals.message = error.message;
    }
  }
  next();
}

/**
 * @description Gets a single element by ID and returns it in the MMS3 API format.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
 */
async function getElement(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // This is code for View Editor
    // For some reason, View Editor expects to be able to query for elements on different projects
    // by providing the CURRENT project in the parameters. There seems to be no indication that
    // the element is expected to be found on a separate project, but it is. So now it is necessary
    // to loop through all the project mounts and look for the element everywhere

    let elements = [];

    // If the element is found on the current project, great
    // Grabs an element from controller
    elements = await ElementController.find(req.user, req.params.orgid, req.params.projectid,
      req.params.refid, req.params.elementid);

    // If the element isn't found, look for it on the mounts
    if (elements.length === 0) {
      // Get all the mounts
      const mounts = await ElementController.find(req.user, req.params.orgid,
        req.params.projectid, req.params.refid, { type: 'Mount' });
      if (mounts.length !== 0) {
        // Now loop through the mounts and try to find the original element
        await utils.asyncForEach(mounts, async (mount) => {
          const projID = mount.custom[namespace].mountedElementProjectId;
          const refID = mount.custom[namespace].mountedRefId;

          // Check that the project and branch exist first
          const foundProject = await ProjectController.find(req.user, req.params.orgid, projID);
          if (foundProject.length === 0) return;
          const foundBranch = await BranchController.find(req.user, req.params.orgid, projID,
            refID);
          if (foundBranch.length === 0) return;

          // Look for the element
          const foundElements = await ElementController.find(req.user, req.params.orgid, projID,
            refID, req.params.elementid);
          if (foundElements.length !== 0) {
            elements.push(foundElements[0]);
          }
        });
      }
    }

    // If no elements are found, throw an error
    if (elements.length === 0) {
      throw new M.NotFoundError(`Element ${req.params.elementid} not found.`, 'warn');
    }

    // Generate the child views of the element if there are any
    await utils.generateChildViews(req.user, req.params.orgid, req.params.projectid,
      req.params.refid, elements);

    // Format the element object, return it inside an array
    const data = [format.mmsElement(req.user, elements[0])];

    res.locals.statusCode = 200;
    res.locals.message = { elements: data };
  }
  catch (error) {
    M.log.warn(error.message);
    const statusCode = getStatusCode(error);
    if (statusCode === 404) {
      res.locals.statusCode = 200;
      res.locals.message = {
        elements: [],
        messages: {
          code: 404,
          id: req.params.elementid,
          message: error.message
        }
      };
    }
    else {
      res.locals.statusCode = statusCode;
      res.locals.message = error.message;
    }
  }
  next();
}

/**
 * @description This endpoint still needs to be implemented. It is expected to return
 * the ids of all cross-referenced elements on the project.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
 */
async function getElementCfids(req, res, next) {
  res.locals.message = { elementIds: [] };
  res.locals.statusCode = 200;
  next();
}

/**
 * @description Returns all documents on a specified branch.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
 */
async function getDocuments(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // The only way to find documents is to use this hard-coded ID created by the SysML community
    // several years ago and set to be replaced in the next year or so.
    const documentStereotypeID = sjm.documentStereotypeID;
    const documentQuery = { [`custom.${namespace}._appliedStereotypeIds`]: documentStereotypeID };
    const documentElements = await ElementController.find(req.user, req.params.orgid,
      req.params.projectid, req.params.refid, documentQuery);

    // Generate the child views of the element if there are any
    await utils.generateChildViews(req.user, req.params.orgid, req.params.projectid,
      req.params.refid, documentElements);

    // Convert elements into MMS3 format
    const formattedDocs = documentElements.map((e) => format.mmsElement(req.user, e));

    res.locals.statusCode = 200;
    res.locals.message = { documents: formattedDocs };
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
 * this function only returns an empty array.
 * @async
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
 */
async function getCommits(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

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

/**
 * @description Processes and stores an artifact blob while also creating an artifact
 * document containing metadata on the blob. Intended to handle png and svg files.
 * @async
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {Function} next - Middleware callback to trigger the next function.
 */
async function postArtifacts(req, res, next) {
  // Grabs the org id from the session user
  await utils.getOrgId(req);

  await upload(req, res, async function(err) {
    const fileType = req.file.mimetype === 'image/png' ? 'png' : 'svg';
    const artifactMetadata = {
      id: req.body.id,
      location: `${req.params.orgid}/${req.params.projectid}`,
      filename: `${req.body.id}.${fileType}`,
      custom: {
        [namespace]: req.body
      }
    };
    artifactMetadata.custom[namespace].contentType = req.file.mimetype;

    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      M.log.error(err);
      const error = new M.ServerError('Artifact upload failed.', 'warn');
      return mcfUtils.formatResponse(req, res, error.message, errors.getStatusCode(error), next);
    }

    // Sanity Check: file is required
    if (!req.file) {
      const error = new M.DataFormatError('Artifact Blob file must be defined.', 'warn');
      return mcfUtils.formatResponse(req, res, error.message, getStatusCode(error), next);
    }

    try {
      await ArtifactController.create(req.user, req.params.orgid,
        req.params.projectid, req.params.refid, artifactMetadata);
      const blobResult = await ArtifactController.postBlob(req.user, req.params.orgid,
        req.params.projectid, artifactMetadata, req.file.buffer);

      // Sets the message to the blob data and the status code to 200
      res.locals = {
        message: blobResult,
        statusCode: 200
      };
    }
    catch (error) {
      M.log.warn(error.message);
      res.locals.statusCode = getStatusCode(error);
      res.locals.message = error.message;
    }
  });
  next();
}

/**
 * @description Searches for artifact metadata documents.
 * @async
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {Function} next - Middleware callback to trigger the next function.
 */
async function putArtifacts(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    const artIDs = req.body.artifacts.map((artifact) => artifact.id);

    const artifacts = await ArtifactController.find(req.user, req.params.orgid,
      req.params.projectid, req.params.refid, artIDs);

    const data = artifacts.map((a) => format.mmsArtifact(req.user, a));

    res.locals.statusCode = 200;
    res.locals.message = { artifacts: data };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description Retrieves an artifact blob.
 * @async
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {Function} next - Middleware callback to trigger the next function.
 */
async function getBlob(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    const artifacts = await ArtifactController.find(req.user, req.params.orgid,
      req.params.projectid, req.params.refid, req.params.blobid);
    const artifact = artifacts[0];

    const blob = await ArtifactController.getBlob(req.user, req.params.orgid,
      req.params.projectid, artifact);

    res.locals.statusCode = 200;
    res.locals.message = blob;
    res.locals.contentType = artifact.custom[namespace].contentType;
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description This function converts a html document into a PDF.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {Function} next - Middleware callback to trigger the next function
 *
 * @returns {Promise}
 */
async function postHtml2Pdf(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);
    
    // Get plugin configuration
    const pluginCfg =  M.config.server.plugins.plugins['mms3-adapter'];
    const filename = pluginCfg.pdf.filename;
    const directory = pluginCfg.pdf.directory;
    
    // Extract request body
    const body = req.body;

    // Filter and prune HTML
    let prunedHtml = utils.pruneHtml(body);
    
    // Define HTML/PDF file paths
    const tempHtmlFileName = `${filename}_${Date.now()}.html`;
    const tempPdfFileName = `${filename}_${Date.now()}.pdf`;
    const fullHtmlFilePath = path.join(directory, tempHtmlFileName);
    const fullPdfFilePath = path.join(directory, tempPdfFileName);
  
    // Write the HTML file to storage
    fs.writeFile(fullHtmlFilePath, prunedHtml, async(err) => {
      // Check for error
      if (err) throw new M.OperationError(`Could not export PDF: ${err} `, 'warn');
      
      // Convert HTML to PDF
      await utils.convertHtml2Pdf(fullHtmlFilePath, fullPdfFilePath);
      
      // Read the generated pdf file
      const pdfBlob = fs.readFileSync(fullPdfFilePath);
  
      // Define artifact blob meta data
      const artifactMetadata = {
        id: req.body.id,
        location: `${req.params.orgid}/${req.params.projectid}`,
        filename: tempPdfFileName
      };
      
      // Store the artifact blob
      await ArtifactController.postBlob(req.user, req.params.orgid,
          req.params.projectid, artifactMetadata, pdfBlob);
  
      // Get server url
      let serverUrl = req.headers.host;
      
      // Create artifact link
      let link = `http://${serverUrl}/api/orgs/${req.params.orgid}/projects/${req.params.projectid}/artifacts/blob` +
                  `?location=${artifactMetadata.location}&filename=${artifactMetadata.filename}`;
      // Check user email
      if (req.user.email){
        // Email user
        await utils.emailBlobLink(req.user.email,link);
      }
    });
    // Set status code
    res.locals.statusCode = 200;
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
  putElementSearch,
  getElement,
  getElementCfids,
  getDocuments,
  getCommits,
  postArtifacts,
  putArtifacts,
  getBlob,
  postHtml2Pdf
};
