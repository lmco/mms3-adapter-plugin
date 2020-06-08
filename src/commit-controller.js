/**
 * @classification UNCLASSIFIED
 *
 * @module src.commit-controller
 * 
 * @copyright Copyright (C) 2020, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Donte McDaniel
 *
 * @author Donte McDaniel
 *
 * @description Handles API Commit functions. Initializes a PUT request for
 * commiting elements to SDVC. Also sets up routes.
 */

'use strict';

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
        const currentElement = await elementController.find(req.user, organization, project, branch, id);
        if (!currentElement) {
            throw new M.NotFoundError(`Element ${updatedElement._id} does not exist in mcf database`);
        }

        // Check if organization exist in MMS3 SDVC
        let sdvcOrg = await getSDVCOrganization(organization);
        if (!sdvcOrg) {
            sdvcOrg = await createSDVCOrganization(req.user, orgMCF[0]);
            if (!sdvcOrg) {
                throw new M.ServerError('Error creating mms3 sdvc organization');
            }
        }

        // Check if project exists in MMS3 SDVC
        let sdvcProj = await getSDVCProject(project);
        if (!sdvcProj) {
            sdvcProj = await createSDVCProject(req.user, projMCF[0]);
            if (!sdvcProj) {
                throw new M.ServerError('Error creating mms3 sdvc project');
            }
        }

        // Check if branch exists in MMS3 SDVC
        let sdvcBranch = await getSDVCBranch(project, branch);
        if (!sdvcBranch) {
            sdvcBranch = await createSDVCBranch(req.user, project, branchMCF[0]);
            if (!sdvcBranch) {
                throw new M.ServerError('Error creating mms3 sdvc ref/branch');
            }
        }

        const formattedUpdatedElement = mms3Formatter.mmsElement(req.user, updatedElement); // the element object being updated

        // Add all valid updated fields to formattedUpdatedElement
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
        
        if (!sdvcElement) {
            throw new M.ServerError('Error creating mms3 sdvc element. Element probably never changed.');
        }

        res.locals.statusCode = 200;
        res.locals.message = JSON.stringify({
            org: sdvcOrg,
            proj: sdvcProj,
            branch: sdvcBranch,
            element: sdvcElement
        });
        next();
    }
    catch (error) {
        return mcfUtils.formatResponse(req, res, error.message, errors.getStatusCode(error), next);
    }
}
  
/*************************************************/
/****************** GET FUNCTIONS ****************/
/*************************************************/

/**
 * @description GETs an MMS3 organization.
 *
 * @param {string} orgId - The organization id.
 *
 * @returns {object} An MMS3 formatted organization.
 */
async function getSDVCOrganization(orgId) {
    try {
        const org = await axios({
            method: 'get',
            url: `${config.url}:${config.port}/orgs/${orgId}`,
            auth: {
                username: config.auth.username,
                password: config.auth.password
            },
        });
        if (org.data.orgs.length < 1) {
            return false;
        }
        else {
            return org.data.orgs[0];
        }
    }
    catch(error) {
        return false;
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
        const project = await axios({
            method: 'get',
            url: `${config.url}:${config.port}/projects/${projectId}`,
            auth: {
                username: config.auth.username,
                password: config.auth.password
            },
        });
        if (project.data.projects.length < 1) {
            return false;
        }
        else {
            return project.data.projects[0];
        }
    }
    catch(error) {
        return false;
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
        const branch = await axios({
            method: 'get',
            url: `${config.url}:${config.port}/projects/${projectId}/refs/${branchId}`,
            auth: {
                username: config.auth.username,
                password: config.auth.password
            },
        });
        if (branch.data.refs.length < 1) {
            return false;
        }
        else {
            return branch.data.refs[0];
        }
    }
    catch(error) {
        return false;
    }
}

/**
 * @description GETs an MMS3 element.
 *
 * @param {string} projectId - The project id.
 * @param {string} branchId - The ref/branch id.
 * @param {string} elementId - The element id.
 *
 * @returns {object} An MMS3 formatted element.
 */
async function getSDVCElement(projectId, branchId, elementId) {
    try {
        const element = await axios({
            method: 'get',
            url: `${config.url}:${config.port}/projects/${projectId}/refs/${branchId}/elements/${elementId}`,
            auth: {
                username: config.auth.username,
                password: config.auth.password
            },
        });
        if (element.data.elements.length < 1) {
            return false;
        }
        else {
            return element.data.elements[0];
        }
    }
    catch(error) {
        return false;
    }
}

/*************************************************/
/***************** CREATE FUNCTIONS **************/
/*************************************************/

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
        // formatting organization
        const formattedOrg = mms3Formatter.mmsOrg(user, orgObj);
        formattedOrg.type = 'org';
        // creating the organization
        const org = await axios({
            method: 'post',
            url: `${config.url}:${config.port}/orgs`,
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
    catch(error) {
        return false;
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
        // formatting project
        const formattedProj = mms3Formatter.mmsProject(user, projectObj);
        formattedProj.type = 'project';
        // creating the project
        const proj = await axios({
            method: 'post',
            url: `${config.url}:${config.port}/projects`,
            auth: {
                username: config.auth.username,
                password: config.auth.password
            },
            data: {
                projects: [
                    formattedProj
                ]
            }
        });
        return proj.data.projects[0];
    }
    catch(error) {
        return false;
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
        // formatting organization
        const formattedBranch = mms3Formatter.mmsRef(user, branchObj);
        formattedBranch.type = 'branch';
        // creating the organization
        const branch = await axios({
            method: 'post',
            url: `${config.url}:${config.port}/projects/${projectId}/refs`,
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
    catch(error) {
        return false;
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
        // creating the element
        const element = await axios({
            method: 'post',
            url: `${config.url}:${config.port}/projects/${projectId}/refs/${branchId}/elements`,
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
    catch(error) {
        return false;
    } 
}

module.exports = {
    handleCommit
};
