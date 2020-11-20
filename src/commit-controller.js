/**
 * @classification UNCLASSIFIED
 *
 * @module src.commit-controller
 *
 * @license
 * Copyright 2020 Lockheed Martin Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @owner Donte McDaniel
 *
 * @author Donte McDaniel
 *
 * @description Handles API Commit functions. Initializes a PUT request for
 * commiting elements to SDVC. Also sets up routes.
 */


// NPM Modules
const axios = require('axios');

// MBEE Modules
const elementController = M.require('controllers.element-controller');
const orgController = M.require('controllers.organization-controller');
const projectController = M.require('controllers.project-controller');
const branchController = M.require('controllers.branch-controller');
const config = M.config.server.plugins.plugins['mms3-adapter'].sdvc;
const mcfUtils = M.require('lib.utils');
const errors = M.require('lib.errors');
const { getStatusCode } = M.require('lib.errors');

// MMS3 Adapter Modules
const mms3Formatter = require('./formatter.js');
const validUpdateFields = ['name', 'documentation', 'custom', 'archived', 'parent', 'type',
  'source', 'target', 'artifact'];

/**
 * @description Returns the org, project, branch, and element that was committed.
 *
 * @param {object} req - Request express object.
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
 */
async function handleCommit(req, res, next) {
  try {
    // Test that the field exists.
    if (config === undefined) {
      throw new Error('Configuration file is not defined. Please reference README.md');
    }

    // Setting variables
    const organization = req.params.orgid;
    const project = req.params.projectid;
    const branch = req.params.branchid;

    // Check if body exists
    if (Object.keys(req.body).length === 0) {
      throw new M.DataFormatError('No element to commit');
    }

    // Check if organization exists in MCF
    const orgMCF = await orgController.find(req.user, organization);
    if (orgMCF.length === 0) {
      throw new M.NotFoundError(`Organization ${organization} does not exist`);
    }

    // Check if project exists in MCF
    const projMCF = await projectController.find(req.user, organization, project);
    if (projMCF.length === 0) {
      throw new M.NotFoundError(`Project ${project} does not exist`);
    }

    // Check if branch exists in MCF
    const branchMCF = await branchController.find(req.user, organization, project, branch);
    if (branchMCF.length === 0) {
      throw new M.NotFoundError(`Branch ${branch} does not exist`);
    }

    const updatedElement = req.body;
    if (!updatedElement._id) {
      updatedElement._id = updatedElement.id;
    }
    const id = mcfUtils.parseID(updatedElement._id).pop();

    // Getting the current element from the mcf database
    const currentElement = await elementController.find(req.user, organization, project, branch,
      id);
    if (!currentElement) {
      throw new M.NotFoundError(`Element ${updatedElement._id} does not exist in mcf database`);
    }

    // Check if organization exist in MMS3 SDVC
    let sdvcOrg = await getSDVCOrganization(organization);
    if (!sdvcOrg) {
      sdvcOrg = await createSDVCOrganization(req.user, orgMCF[0]);
    }

    // Check if project exists in MMS3 SDVC
    let sdvcProj = await getSDVCProject(project);
    if (!sdvcProj) {
      sdvcProj = await createSDVCProject(req.user, projMCF[0]);
    }

    // Check if branch exists in MMS3 SDVC
    let sdvcBranch = await getSDVCBranch(project, branch);
    if (!sdvcBranch) {
      sdvcBranch = await createSDVCBranch(req.user, project, branchMCF[0]);
    }

    // the element object being updated
    const formattedUpdatedElement = mms3Formatter.mmsElement(req.user, updatedElement);

    // Add all valid updated fields to formattedUpdatedElement
    // eslint-disable-next-line
    for (const [key, value] of Object.entries(updatedElement)) {
      if (validUpdateFields.includes(key)) {
        formattedUpdatedElement[key] = updatedElement[key];
      }
    }

    // Remove properties that are not needed.
    // If these properties get updated, the element gets deleted
    // WARNING/NOTE: This is a limitation of SDVC and we are constrained to this implementation...
    delete formattedUpdatedElement.ownerId;
    delete formattedUpdatedElement._projectId;
    delete formattedUpdatedElement._refId;
    delete formattedUpdatedElement._creator;
    delete formattedUpdatedElement._created;
    delete formattedUpdatedElement._modifier;
    delete formattedUpdatedElement._modified;
    delete formattedUpdatedElement._editable;

    // Create or update the element
    const sdvcElement = await createUpdateSDVCElement(project, branch, formattedUpdatedElement);

    res.locals.statusCode = 200;
    res.locals.message = JSON.stringify({
      org: sdvcOrg,
      proj: sdvcProj,
      branch: sdvcBranch,
      element: sdvcElement
    });
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = errors.getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

async function postOrg(req, res, next) {
  try {
    const org = await createSDVCOrganization(req.user, req.body);
    res.locals.statusCode = 200;
    res.locals.message = { org };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

async function postProj(req, res, next) {
  try {
    const proj = await createSDVCProject(req.user, req.body);
    res.locals.statusCode = 200;
    res.locals.message = { proj };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

async function postBranch(req, res, next) {
  try {
    const projId = req.body.projectId;
    const branchObj = req.body.branchObj;
    const branch = await createSDVCBranch(req.user, projId, branchObj);
    res.locals.statusCode = 200;
    res.locals.message = { branch };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

async function postElement(req, res, next) {
  try {
    const projId = req.body.projectId;
    const branchId = req.body.branchId;
    const formattedUpdatedElement = mms3Formatter.mmsElement(req.user, req.body.element);
    const sdvcElement = await createUpdateSDVCElement(projId, branchId, formattedUpdatedElement);
    
    res.locals.statusCode = 200;
    res.locals.message = { sdvcElement };
  }
  catch (error) {
    M.log.warn(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

// *********************************************** //
// ***************** GET FUNCTIONS *************** //
// *********************************************** //

/**
 * @description GETs an MMS3 organization.
 *
 * @param {string} orgId - The organization id.
 *
 * @returns {object} An MMS3 formatted organization.
 */
async function getSDVCOrganization(orgId) {
  try {
    let url = `${config.url}:${config.port}/orgs`;
    if (!config.port) {
      url = `${config.url}/orgs`;
    }
    
    const org = await axios({
      method: 'get',
      url: url,
      auth: {
        username: config.auth.username,
        password: config.auth.password
      }
    });

    const organization = org.data.orgs.find(org => org.id === orgId);
    if ([organization].length < 1) {
      return false;
    }
    else {
      return organization;
    }
  }
  catch (error) {
    throw new M.ServerError('Error getting organization from SDVC');
  }
}

/**
 * @description GETs an MMS3 project.
 *
 * @param {string} projectId - The project id.
 *
 * @returns {object} An MMS3 formatted project.
 */
async function getSDVCProject(projectId) {
  try {
    let url = `${config.url}:${config.port}/projects`;
    if (!config.port) {
      url = `${config.url}/projects`;
    }

    const project = await axios({
      method: 'get',
      url: url,
      auth: {
        username: config.auth.username,
        password: config.auth.password
      }
    });
    const proj = project.data.projects.find(proj => proj.id === projectId);
    
    if ([proj].length < 1) {
      return false;
    }
    else {
      return proj;
    }
  }
  catch (error) {
    throw new M.ServerError('Error getting project from SDVC');
  }
}

/**
 * @description GETs an MMS3 ref/branch.
 *
 * @param {string} projectId - The project id.
 * @param {string} branchId - The ref/branch id.
 *
 * @returns {object} An MMS3 formatted ref/branch.
 */
async function getSDVCBranch(projectId, branchId) {
  try {
    let url = `${config.url}:${config.port}/projects/${projectId}/refs/${branchId}`;
    if (!config.port) {
      url = `${config.url}/projects/${projectId}/refs/${branchId}`;
    }
    const branch = await axios({
      method: 'get',
      url: url,
      auth: {
        username: config.auth.username,
        password: config.auth.password
      }
    });
    const ref = branch.data.refs.find(branch => branch.id === branchId);
    
    if ([ref].length < 1) {
      return false;
    }
    else {
      return ref;
    }
  }
  catch (error) {
    throw new M.ServerError('Error getting branch from SDVC');
  }
}

/**
 * @description GETs an MMS3 elements.
 *
 * @param {string} projectId - The project id.
 * @param {string} branchId - The ref/branch id.
 *
 * @returns {object} An MMS3 formatted element.
 */
async function getSDVCElements(projectId, branchId) {
  try {
    let url = `${config.url}:${config.port}/projects/${projectId}/refs/${branchId}/elements`;
    if (!config.port) {
      url = `${config.url}/projects/${projectId}/refs/${branchId}/elements`;
    }
    const elements = await axios({
      method: 'get',
      url: url,
      auth: {
        username: config.auth.username,
        password: config.auth.password
      }
    });
    
    if (elements.data.elements.length < 1) {
      return false;
    }
    else {
      return elements.data.elements;
    }
  }
  catch (error) {
    throw new M.ServerError('Error getting elements from SDVC');
  }
}


// *********************************************** //
// *************** CREATE FUNCTIONS ************** //
// *********************************************** //

/**
 * @description CREATES an MMS3 organization.
 *
 * @param {object} user - The requesting user.
 * @param {object} orgObj - The mcf org object.
 *
 * @returns {object} An MMS3 organization.
 */
async function createSDVCOrganization(user, orgObj) {
  try {
    let url = `${config.url}:${config.port}/orgs`;
    if (!config.port) {
      url = `${config.url}/orgs`;
    }
    // formatting organization
    const formattedOrg = mms3Formatter.mmsOrg(user, orgObj);
    formattedOrg.type = 'org';
    // creating the organization
    const org = await axios({
      method: 'post',
      url: url,
      auth: {
        username: config.auth.username,
        password: config.auth.password
      },
      data: {
        orgs: [
          formattedOrg
        ]
      }
    });
    return org.data.orgs[0];
  }
  catch (error) {
    throw new M.ServerError('Error creating MMS3 SDVC organization: ' + error);
  }
}

/**
 * @description CREATES an MMS3 project.
 *
 * @param {object} user - The requesting user.
 * @param {object} projectObj - The mcf project object.
 *
 * @returns {object} An MMS3 project.
 */
async function createSDVCProject(user, projectObj) {
  try {
    let url = `${config.url}:${config.port}/projects`;
    if (!config.port) {
      url = `${config.url}/projects`;
    }
    // formatting project
    const formattedProj = mms3Formatter.mmsProject(user, projectObj);
    const project = {
      id: formattedProj.id,
      orgId: formattedProj.orgId,
      name: formattedProj.name
    }
    // creating the project
    const proj = await axios({
      method: 'post',
      url: url,
      auth: {
        username: config.auth.username,
        password: config.auth.password
      },
      data: {
        projects: [
          project
        ]
      }
    });

    return proj.data.projects[0];
  }
  catch (error) {
    throw new M.ServerError('Error creating MMS3 SDVC project');
  }
}

/**
 * @description CREATES an MMS3 ref/branch.
 *
 * @param {object} user - The requesting user.
 * @param {string} projectId - The project id.
 * @param {object} branchObj - The mcf branch object.
 *
 * @returns {object} An MMS3 ref/branch.
 */
async function createSDVCBranch(user, projectId, branchObj) {
  try {
    let url = `${config.url}:${config.port}/projects/${projectId}/refs`;
    if (!config.port) {
      url = `${config.url}/projects/${projectId}/refs`;
    }
    // formatting organization
    const formattedBranch = mms3Formatter.mmsRef(user, branchObj);
    formattedBranch.type = 'branch';
    // creating the organization
    const branch = await axios({
      method: 'post',
      url: url,
      auth: {
        username: config.auth.username,
        password: config.auth.password
      },
      data: {
        refs: [
          formattedBranch
        ]
      }
    });
    return branch.data.refs[0];
  }
  catch (error) {
    throw new M.ServerError('Error creating mms3 sdvc ref/branch');
  }
}

/**
 * @description CREATES an MMS3 element.
 *
 * @param {string} projectId - The project id.
 * @param {string} branchId - The ref/branch id.
 * @param {object} mmsFormattedElementObj - The mms3 formatted element object.
 *
 * @returns {object} An MMS3 element.
 */
async function createUpdateSDVCElement(projectId, branchId, mmsFormattedElementObj) {
  try {
    let url = `${config.url}:${config.port}/projects/${projectId}/refs/${branchId}/elements`;
    if (!config.port) {
      url = `${config.url}/projects/${projectId}/refs/${branchId}/elements`;
    }
    // creating the element
    const element = await axios({
      method: 'post',
      url: url,
      auth: {
        username: config.auth.username,
        password: config.auth.password
      },
      data: {
        elements: [
          mmsFormattedElementObj
        ]
      }
    });
    return element.data.elements[0];
  }
  catch (error) {
    throw new M.ServerError('Error creating mms3 sdvc element. Element probably never changed.');
  }
}

/**
 * @description Gets element commits
 * @async
 *
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
 * @param {string} projectid - The project id.
 * @param {string} branchid - The ref/branch id.
 * @param {string} elementid - The element id.
 */
async function getCommitsByElement(res, next, projectid, branchid, elementid) {
  try {
    let url = `${config.url}:${config.port}/projects/${projectid}/refs/${branchid}/elements/${elementid}/commits`;
    if (!config.port) {
      url = `${config.url}/projects/${projectid}/refs/${branchid}/elements/${elementid}/commits`;
    }

    const sdvcProj = await getSDVCProject(projectid);
    if (!sdvcProj) {
      res.locals.statusCode = 404;
      res.locals.message = 'Project does not exist in SDVC';
    }

    const sdvcBranch = await getSDVCBranch(projectid, branchid);
    if (!sdvcBranch) {
      res.locals.statusCode = 404;
      res.locals.message = 'Branch does not exist in SDVC';
    }

    const sdvcElements = await getSDVCElements(projectid, branchid);
    const foundElement = sdvcElements.find(ele => ele.id === elementid);

    if (!foundElement) {
      res.locals.statusCode = 404;
      res.locals.message = 'Element does not exist in SDVC';
    }

    const commits = await axios({
      method: 'get',
      url: url,
      auth: {
        username: config.auth.username,
        password: config.auth.password
      }
    });
    res.locals.statusCode = 200;
    res.locals.message = JSON.stringify(commits.data.commits);
  }
  catch (error) {
    throw new M.ServerError('Error getting commits from SDVC for element '+elementid);
  }
  next();
}

/**
 * @description Gets commit by Id.
 * @async
 *
 * @param {object} res - Response express object.
 * @param {Function} next - Middleware callback to trigger the next function.
 */
async function getCommitById(req, res, next) {
  try {
    const projectId = req.params.projectid;
    const refId = req.params.refid;
    const elementId = req.params.elementid;
    const commitId = req.query.commitId;

    let url = `${config.url}:${config.port}/projects/${projectId}/refs/${refId}/elements`;
    if (!config.port) {
      url = `${config.url}/projects/${projectId}/refs/${refId}/elements`;
    }
    // creating the element
    const commit = await axios({
      method: 'get',
      url: url,
      params: {
        commitId: commitId
      },
      auth: {
        username: config.auth.username,
        password: config.auth.password
      }
    });
    console.log(commit.data);
    return commit.data.commit[0];
  }
  catch (error) {
    throw new M.ServerError('Error getting commit by commitId');
  }
}

module.exports = {
  handleCommit,
  getCommitsByElement,
  postOrg,
  postProj,
  postBranch,
  postElement,
  getCommitById
};
