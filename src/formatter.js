/**
 * @classification UNCLASSIFIED
 *
 * @module src.formatter
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
 * @owner Connor Doyle
 *
 * @author Austin Bieber
 * @author Leah De Laurell
 *
 * @description Exports functions which format MDK requests into MCF-friendly objects
 * and MCF objects into MMS3 objects.
 */

// MCF Modules
const ElementController = M.require('controllers.element-controller');
const mcfUtils = M.require('lib.utils');
const { getPublicData } = M.require('lib.get-public-data');

// Adapter modules
const utils = require('./utils');
const namespace = utils.customDataNamespace;

module.exports = {
  mcfOrg,
  mcfProject,
  mcfBranch,
  mcfElements,
  mmsOrg,
  mmsProject,
  mmsRef,
  mmsElement,
  mmsArtifact
};

/**
 * @description Formats an MMS org into an MCF org.
 *
 * @param {object} org - The org to format.
 *
 * @returns {object} The formatted org.
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
      org.custom[namespace][k] = org[k];
      delete org[k];
    }
  });

  return org;
}

/**
 * @description Formats an MMS project into an MCF project.
 *
 * @param {object} proj - The project to format.
 *
 * @returns {object} The formatted project.
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
 * @description Formats an MMS ref into an MCF branch.
 *
 * @param {object} branch - The branch to format.
 *
 * @returns {object} The formatted branch.
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
 * @description Formats an MMS element into an MCF element.
 * @async
 *
 * @param {object} req - The request object. Used for its orgid, projectid, and refid parameters.
 * @param {object} elements - The elements to format.
 *
 * @returns {object} The formatted element.
 */
async function mcfElements(req, elements) {
  const mcfFields = ['id', 'name', 'documentation', 'type', 'parent', 'source', 'target', 'project', 'branch', 'artifact', 'custom'];
  const promises = [];

  elements.forEach((elem) => {
    elem.custom = {
      [namespace]: {}
    };
    Object.keys(elem).forEach((field) => {
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
        delete elem[field];
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
 * @param {object} reqUser - The requesting user.
 * @param {object} orgObj - The MCF org to format.
 *
 * @returns {object} An MMS3 formatted org.
 */
function mmsOrg(reqUser, orgObj) {
  // Get the public data of the org
  const org = getPublicData(reqUser, orgObj, 'org');

  return {
    id: org.id,
    name: org.name
  };
}

/**
 * @description Formats an MCF project into an MMS3 project.
 *
 * @param {object} reqUser - The requesting user.
 * @param {object} projObj - The MCF project to format.
 *
 * @returns {object} An MMS3 formatted project.
 */
function mmsProject(reqUser, projObj) {
  // Get the public data of the project
  const proj = getPublicData(reqUser, projObj, 'project');

  const project = {
    type: 'Project',
    name: proj.name,
    id: proj.id,
    _creator: proj.createdBy,
    _created: proj.createdOn,
    _modifier: proj.lastModifiedBy,
    _modified: proj.updatedOn,
    _projectId: proj.id,
    _refId: 'master',
    orgId: projObj.org
  };

  // TODO: find out if these fields are added in through the custom data upon initialization
  //  of the project / reevaluate this
  project.categoryId = null;
  project._mounts = [];
  project._editable = true;

  if (proj.custom.hasOwnProperty(namespace)) {
    Object.keys(proj.custom[namespace]).forEach((field) => {
      project[field] = proj.custom[namespace][field];
    });
  }

  return project;
}

/**
 * @description Formats an MCF branch into an MMS3 ref.
 *
 * @param {object} reqUser - The requesting user.
 * @param {object} branchObj - The MCF branch to format.
 *
 * @returns {object} An MMS3 formatted ref.
 */
function mmsRef(reqUser, branchObj) {
  // Get the public data of the branch
  const publicBranch = getPublicData(reqUser, branchObj, 'branch');

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
 * @param {object} reqUser - The requesting user.
 * @param {object} elemObj - The MCF element to format.
 *
 * @returns {object} An MMS3 formatted element.
 */
function mmsElement(reqUser, elemObj) {
  // Get the public data of the element
  const elemPublicData = getPublicData(reqUser, elemObj, 'element');

  const elem = {
    id: elemPublicData.id,
    documentation: elemPublicData.documentation,
    type: elemPublicData.type,
    ownerId: (elemPublicData.parent === null)
      ? null
      : mcfUtils.parseID(elemPublicData.parent).pop(),
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
  if (typeof elemObj.custom[namespace] === 'object') {
    Object.keys(elemObj.custom[namespace]).forEach((field) => {
      elem[field] = elemObj.custom[namespace][field];
    });
  }

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

/**
 * @description Formats an MCF artifact into an MMS3 artifact.
 *
 * @param {object} reqUser - The requesting user.
 * @param {object} artifact - The MCF artifact to format.
 *
 * @returns {object} An MMS3 formatted artifact.
 */
function mmsArtifact(reqUser, artifact) {
  // Get the public data of the artifact
  const artPublicData = getPublicData(reqUser, artifact, 'artifact');

  const projID = mcfUtils.parseID(artPublicData.project).pop();
  const refID = mcfUtils.parseID(artPublicData.branch).pop();

  const returnObj = {
    id: artPublicData.id,
    location: artPublicData.location,
    filename: artPublicData.filename,
    artifactLocation: `/projects/${projID}/refs/${refID}/artifacts/blob/${artPublicData.id}`,
    _projectId: projID,
    _refId: refID,
    _creator: artPublicData.createdBy,
    _created: artPublicData.createdOn,
    _modifier: artPublicData.lastModifiedBy,
    _modified: artPublicData.updatedOn,
    _editable: true
  };

  // Handle custom
  Object.keys(artifact.custom[namespace]).forEach((field) => {
    returnObj[field] = artifact.custom[namespace][field];
  });

  return returnObj;
}
