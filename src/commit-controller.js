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
 * commiting elements to MMS. Also sets up routes.
 */


// NPM Modules
const axios = require('axios');

// MCF Modules
const elementController = M.require('controllers.element-controller');
const orgController = M.require('controllers.organization-controller');
const projectController = M.require('controllers.project-controller');
const branchController = M.require('controllers.branch-controller');
const config = M.config.server.plugins.plugins['mms-adapter'].mms;
const mcfUtils = M.require('lib.utils');
const errors = M.require('lib.errors');
const { getStatusCode } = M.require('lib.errors');

// MMS Adapter Modules
const MMSFormatter = require('./formatter.js');
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

    // Check if organization exist in MMS
    let mmsOrg = await getMMSOrganization(organization);
    if (!mmsOrg) {
      mmsOrg = await createMMSOrganization(req.user, orgMCF[0]);
    }

    // Check if project exists in MMS
    let mmsProj = await getMMSProject(project);
    if (!mmsProj) {
      mmsProj = await createMMSProject(req.user, projMCF[0]);
    }

    // Check if branch exists in MMS
    let mmsBranch = await getMMSBranch(project, branch);
    if (!mmsBranch) {
      mmsBranch = await createMMSBranch(req.user, project, branchMCF[0]);
    }

    // the element object being updated
    const formattedUpdatedElement = MMSFormatter.mmsElement(req.user, updatedElement);

    // Add all valid updated fields to formattedUpdatedElement
    // eslint-disable-next-line
    for (const [key, value] of Object.entries(updatedElement)) {
      if (validUpdateFields.includes(key)) {
        formattedUpdatedElement[key] = updatedElement[key];
      }
    }

    // Remove properties that are not needed.
    // If these properties get updated, the element gets deleted
    // WARNING/NOTE: This is a limitation of MMS and we are constrained to this implementation...
    delete formattedUpdatedElement.ownerId;
    delete formattedUpdatedElement._projectId;
    delete formattedUpdatedElement._refId;
    delete formattedUpdatedElement._creator;
    delete formattedUpdatedElement._created;
    delete formattedUpdatedElement._modifier;
    delete formattedUpdatedElement._modified;
    delete formattedUpdatedElement._editable;

    // Create or update the element
    const mmsElement = await createUpdateMMSElement(project, branch, formattedUpdatedElement);

    res.locals.statusCode = 200;
    res.locals.message = JSON.stringify({
      org: mmsOrg,
      proj: mmsProj,
      branch: mmsBranch,
      element: mmsElement
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
    const mmsToken = req.get('MMS-TOKEN');
    if (mmsToken) {
      const org = await createMMSOrganization(req.user, req.body, mmsToken);
      res.locals.statusCode = 200;
      res.locals.message = { org };
    }
    else {
      throw new M.ServerError('mms_token does not exit in user session. Unable to create MMS organization');
    }
  }
  catch (error) {
    M.log.error(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

async function postProj(req, res, next) {
  try {
    const mmsToken = req.get('MMS-TOKEN');
    if (mmsToken) {
      const proj = await createMMSProject(req.user, req.body, mmsToken);
      res.locals.statusCode = 200;
      res.locals.message = { proj };
    }
    else {
      throw new M.ServerError('mms_token does not exit in user session. Unable to create MMS project');
    }
  }
  catch (error) {
    M.log.error(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

async function postBranch(req, res, next) {
  try {
    const mmsToken = req.get('MMS-TOKEN');
    if (mmsToken) {
      const projId = req.body.projectId;
      const branchObj = req.body.branchObj;
      const branch = await createMMSBranch(req.user, projId, branchObj, mmsToken);
      res.locals.statusCode = 200;
      res.locals.message = { branch };
    }
    else {
      throw new M.ServerError('mms_token does not exit in user session. Unable to create MMS branch');
    }
  }
  catch (error) {
    M.log.error(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

async function postElement(req, res, next) {
  try {
    const projId = req.body.projectId;
    const branchId = req.body.branchId;
    const formattedUpdatedElement = MMSFormatter.mmsElement(req.user, req.body.element);
    const mmsToken = req.get('MMS-TOKEN');
    
    if (mmsToken) {
      const mmsElement = await createUpdateMMSElement(projId, branchId, formattedUpdatedElement, mmsToken);
      res.locals.statusCode = 200;
      res.locals.message = { mmsElement };
    }
    else {
      throw new M.ServerError('mms_token does not exit in user session. Unable to create MMS project');
    }
  }
  catch (error) {
    M.log.error(error.message);
    res.locals.statusCode = getStatusCode(error);
    res.locals.message = error.message;
  }
  next();
}

// *********************************************** //
// ***************** GET FUNCTIONS *************** //
// *********************************************** //

/**
 * @description GETs an MMS organization.
 *
 * @param {string} orgId - The organization id.
 *
 * @returns {object} An MMS formatted organization.
 */
async function getMMSOrganization(orgId) {
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
    M.log.error(error);
    throw new M.ServerError('Error getting organization from MMS');
  }
}

/**
 * @description GETs an MMS project.
 *
 * @param {string} projectId - The project id.
 *
 * @returns {object} An MMS formatted project.
 */
async function getMMSProject(projectId) {
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
    M.log.error(error);
    throw new M.ServerError('Error getting project from MMS');
  }
}

/**
 * @description GETs an MMS ref/branch.
 *
 * @param {string} projectId - The project id.
 * @param {string} branchId - The ref/branch id.
 *
 * @returns {object} An MMS formatted ref/branch.
 */
async function getMMSBranch(projectId, branchId) {
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
    M.log.error(error);
    throw new M.ServerError('Error getting branch from MMS');
  }
}

/**
 * @description GETs an MMS elements.
 *
 * @param {string} projectId - The project id.
 * @param {string} branchId - The ref/branch id.
 *
 * @returns {object} An MMS formatted element.
 */
async function getMMSElements(projectId, branchId) {
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
    M.log.error(error);
    throw new M.ServerError('Error getting elements from MMS');
  }
}


// *********************************************** //
// *************** CREATE FUNCTIONS ************** //
// *********************************************** //

/**
 * @description CREATES an MMS organization.
 *
 * @param {object} user - The requesting user.
 * @param {object} orgObj - The mcf org object.
 * @param {string} token - The MMS token.
 *
 * @returns {object} An MMS organization.
 */
async function createMMSOrganization(user, orgObj, token) {
  try {
    let url = `${config.url}:${config.port}/orgs`;
    if (!config.port) {
      url = `${config.url}/orgs`;
    }
    // formatting organization
    const formattedOrg = MMSFormatter.mmsOrg(user, orgObj);
    formattedOrg.type = 'org';
    // creating the organization
    const org = await axios({
      method: 'post',
      url: url,
      headers: { Authorization: `Bearer ${token}` },
      data: {
        orgs: [
          formattedOrg
        ]
      }
    });
    return org.data.orgs[0];
  }
  catch (error) {
    M.log.error(error);
    throw new M.ServerError('Error creating MMS organization: ' + error);
  }
}

/**
 * @description CREATES an MMS project.
 *
 * @param {object} user - The requesting user.
 * @param {object} projectObj - The mcf project object.
 * @param {string} token - The MMS token.
 *
 * @returns {object} An MMS project.
 */
async function createMMSProject(user, projectObj, token) {
  try {
    let url = `${config.url}:${config.port}/projects`;
    if (!config.port) {
      url = `${config.url}/projects`;
    }
    // formatting project
    const formattedProj = MMSFormatter.mmsProject(user, projectObj);
    const project = {
      id: formattedProj.id,
      orgId: formattedProj.orgId,
      name: formattedProj.name
    }

    // creating the project
    const proj = await axios({
      method: 'post',
      url: url,
      headers: { Authorization: `Bearer ${token}` },
      data: {
        projects: [
          project
        ]
      }
    });

    return proj.data.projects[0];
  }
  catch (error) {
    M.log.error(error);
    throw new M.ServerError('Error creating MMS project');
  }
}

/**
 * @description CREATES an MMS ref/branch.
 *
 * @param {object} user - The requesting user.
 * @param {string} projectId - The project id.
 * @param {object} branchObj - The mcf branch object.
 * @param {string} token - The MMS token.
 *
 * @returns {object} An MMS ref/branch.
 */
async function createMMSBranch(user, projectId, branchObj, token) {
  try {
    let url = `${config.url}:${config.port}/projects/${projectId}/refs`;
    if (!config.port) {
      url = `${config.url}/projects/${projectId}/refs`;
    }

    // formatting organization
    const formattedBranch = MMSFormatter.mmsRef(user, branchObj);
    formattedBranch.type = 'branch';
    // creating the organization
    const branch = await axios({
      method: 'post',
      url: url,
      headers: { Authorization: `Bearer ${token}` },
      data: {
        refs: [
          formattedBranch
        ]
      }
    });
    return branch.data.refs[0];
  }
  catch (error) {
    M.log.error(error);
    throw new M.ServerError('Error creating MMS ref/branch');
  }
}

/**
 * @description CREATES an MMS element.
 *
 * @param {string} projectId - The project id.
 * @param {string} branchId - The ref/branch id.
 * @param {object} mmsFormattedElementObj - The MMS formatted element object.
 * @param {string} token - The MMS token.
 *
 * @returns {object} An MMS element.
 */
async function createUpdateMMSElement(projectId, branchId, mmsFormattedElementObj, token) {
  try {
    let url = `${config.url}:${config.port}/projects/${projectId}/refs/${branchId}/elements`;
    if (!config.port) {
      url = `${config.url}/projects/${projectId}/refs/${branchId}/elements`;
    }
    // creating the element
    const element = await axios({
      method: 'post',
      url: url,
      headers: { Authorization: `Bearer ${token}` },
      data: {
        elements: [
          mmsFormattedElementObj
        ]
      }
    });
    return element.data.elements[0];
  }
  catch (error) {
    M.log.error(error);
    throw new M.ServerError('Error creating MMS element. Element probably never changed.');
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

    const mmsProj = await getMMSProject(projectid);
    if (!mmsProj) {
      res.locals.statusCode = 404;
      res.locals.message = 'Project does not exist in MMS';
    }

    const mmsBranch = await getMMSBranch(projectid, branchid);
    if (!mmsBranch) {
      res.locals.statusCode = 404;
      res.locals.message = 'Branch does not exist in MMS';
    }

    const mmsElements = await getMMSElements(projectid, branchid);
    const foundElement = mmsElements.find(ele => ele.id === elementid);

    if (!foundElement) {
      res.locals.statusCode = 404;
      res.locals.message = 'Element does not exist in MMS';
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
    M.log.error(error);
    throw new M.ServerError('Error getting commits from MMS for element '+elementid);
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
    return commit.data.commit[0];
  }
  catch (error) {
    M.log.error(error);
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
