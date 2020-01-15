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
const { getStatusCode } = M.require('lib.errors');

// Adapter modules
const ReformatController = require('./reformat-controller');
const utils = require('./utils.js');


/**
 * @description
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
 * @description
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
 * @description
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
 * @description
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getOrgs(req, res, next) {
  try {
    const orgs = await ReformatController.getOrgs(req);
    res.locals.statusCode = 200;
    res.locals.message = { orgs: orgs };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function postOrgs(req, res, next) {
  try {
    const orgs = await ReformatController.postOrgs(req);
    res.locals.statusCode = 200;
    res.locals.message = {orgs: orgs};
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getProjects(req, res, next) {
  try {
    // Grab the project information
    const projects = await ReformatController.getProjects(req);
    res.locals.statusCode = 200;
    res.locals.message = { projects: projects };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function postProjects(req, res, next) {
  try {
    // Post the project information
    const projects = await ReformatController.postProjects(req);
    res.locals.statusCode = 200;
    res.locals.message = { projects: projects };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description
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
 * @description
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getProject(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);
    const projects = await ReformatController.getProject(req);
    res.locals.statusCode = 200;
    res.locals.message = { projects: projects };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    if (getStatusCode(error) !== 404) {
      res.locals.message = error.message;
    }
  }
  next();
}

/**
 * @description
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getRefs(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);
    // Grabs the branches
    const branches = await ReformatController.getBranches(req);
    res.locals.statusCode = 200;
    res.locals.message = { refs: branches };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function postRefs(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);
    // Posts the branches
    const branches = await ReformatController.postBranches(req);

    res.locals.statusCode = 200;
    res.locals.message = { refs: branches };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getRef(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);
    // Grabs the branch
    const branches = await ReformatController.getBranch(req);
    res.locals.statusCode = 200;
    res.locals.message = { refs: branches };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getMounts(req, res, next) {
  // Grabs the org id from the session user
  await utils.getOrgId(req);

  // Grabs all the projects that this project references
  const mounts = await ReformatController.getMounts(req);

  res.locals.statusCode = 200;
  res.locals.message = { projects: mounts};
  next()
}

/**
 * @description
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getGroups(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);
    // Grab the group information
    const groups = await ReformatController.getGroups(req);
    res.locals.statusCode = 200;
    res.locals.message = { groups: groups };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function postElements(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // posts or updates the elements
    const elements = await ReformatController.postElements(req);

    res.locals.statusCode = 200;
    res.locals.message = { elements: elements };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function putElements(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    // MDK does not use PUT properly....
    // This actually functions like a search....
    const elements = await ReformatController.putElements(req);

    res.locals.statusCode = 200;
    res.locals.message = { elements: elements };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description TODO
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function deleteElements(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);

    const elements = await ReformatController.deleteElements(req);

    res.locals.statusCode = 200;
    res.locals.message = { elements: elements };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getElement(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);
    // Grabs the elements
    const elements = await ReformatController.getElement(req);
    res.locals.statusCode = 200;
    res.locals.message = { elements: elements };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

/**
 * @description
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function
 */
async function getDocuments(req, res, next) {
  try {
    // Grabs the org id from the session user
    await utils.getOrgId(req);
    // Grabs the mounts information
    const documents = await ReformatController.getDocuments(req);
    res.locals.statusCode = 200;
    res.locals.message = { documents: documents };
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
  getTicket,
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
  getDocuments,
  getCommits
};