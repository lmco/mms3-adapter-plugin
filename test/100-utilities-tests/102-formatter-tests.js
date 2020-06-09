/**
 * @classification UNCLASSIFIED
 *
 * @module test.102-formatter-tests.js
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
 * @author Connor Doyle
 *
 * @description Tests the formatter.js file.
 */


// NPM modules
const chai = require('chai');

// MBEE modules
const BranchController = M.require('controllers.branch-controller');
const ElementController = M.require('controllers.element-controller');
const mcfTestUtils = M.require('lib.test-utils');
const mcfUtils = M.require('lib.utils');

// Plugin modules
const utils = require('../../src/utils.js');
const format = require('../../src/formatter.js');
const namespace = utils.customDataNamespace;

// Global variables
let adminUser;
let org;
let project;
let projID;
const branchID = 'master';
let branch;
let element;
const elemID = 'model';

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Create admin user, test org, project, branch, and element.
   */
  before(async () => {
    try {
      // Create test admin
      adminUser = await mcfTestUtils.createTestAdmin();
      // Set global test organization
      org = await mcfTestUtils.createTestOrg(adminUser);
      // Set global test project
      project = await mcfTestUtils.createTestProject(adminUser, org._id);
      projID = mcfUtils.parseID(project._id).pop();
      // Set the global branch
      const branches = await BranchController.find(adminUser, org._id, projID, branchID);
      branch = branches[0];
      // Set global test element
      const elements = await ElementController.find(adminUser, org._id, projID, branchID, elemID);
      element = elements[0];
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: Delete admin user and test org.
   */
  after(async () => {
    try {
      await mcfTestUtils.removeTestOrg();
      await mcfTestUtils.removeTestAdmin();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  it('should convert incoming org data into mcf format', mcfOrg);
  it('should convert incoming project data into mcf format', mcfProject);
  it('should convert incoming branch data into mcf format', mcfBranch);
  it('should convert incoming element data into mcf format', mcfElements);
  it('should convert internal org data into mms format', mmsOrg);
  it('should convert internal project data into mms format', mmsProject);
  it('should convert internal branch data into mms format', mmsRef);
  it('should convert internal element data into mms format', mmsElement);
  it('should convert internal artifact data into mms format', mmsArtifact);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies that formatter.js can take an MCF org and convert it into an MMS org.
 */
async function mcfOrg() {
  const mdkOrg = {
    id: 'test-id',
    name: 'test-org',
    property1: 'test1',
    property2: 'test2',
    property3: 'test3'
  };

  const formattedOrg = format.mcfOrg(mdkOrg);

  chai.expect(formattedOrg.id).to.equal('test-id');
  chai.expect(formattedOrg.name).to.equal('test-org');
  chai.expect(formattedOrg.custom[namespace].property1).to.equal('test1');
  chai.expect(formattedOrg.custom[namespace].property2).to.equal('test2');
  chai.expect(formattedOrg.custom[namespace].property3).to.equal('test3');
}

/**
 * @description Verifies that formatter.js can take an MMS project and convert it into
 * an MCF project.
 */
async function mcfProject() {
  const mdkProj = {
    id: 'test-id',
    name: 'test-proj',
    property1: 'test1',
    property2: 'test2',
    property3: 'test3'
  };

  const proj = format.mcfProject(mdkProj);

  chai.expect(proj.id).to.equal('test-id');
  chai.expect(proj.custom[namespace].property1).to.equal('test1');
  chai.expect(proj.custom[namespace].property2).to.equal('test2');
  chai.expect(proj.custom[namespace].property3).to.equal('test3');
}

/**
 * @description Verifies that formatter.js can take an MMS ref and convert it into an MCF branch.
 */
async function mcfBranch() {
  const mdkRef = {
    id: 'test-id',
    name: 'test-ref',
    property1: 'test1',
    property2: 'test2',
    property3: 'test3'
  };

  const ref = format.mcfBranch(mdkRef);

  chai.expect(ref.id).to.equal('test-id');
  chai.expect(ref.name).to.equal('test-ref');
  chai.expect(ref.custom[namespace].property1).to.equal('test1');
  chai.expect(ref.custom[namespace].property2).to.equal('test2');
  chai.expect(ref.custom[namespace].property3).to.equal('test3');
}

/**
 * @description Verifies that formatter.js can take an array of MMS elements and convert them
 * into MCF elements.
 */
async function mcfElements() {
  const req = {
    user: adminUser,
    params: {
      orgid: org._id,
      projectid: projID,
      refid: branchID
    }
  };

  const mdkElems = [{
    id: 'test-id',
    name: 'test-elem',
    ownerId: 'test-parent',
    property1: 'test1',
    property2: 'test2',
    property3: 'test3'
  }];

  await format.mcfElements(req, mdkElems);

  chai.expect(mdkElems[0].id).to.equal('test-id');
  chai.expect(mdkElems[0].name).to.equal('test-elem');
  chai.expect(mdkElems[0].custom[namespace].property1).to.equal('test1');
  chai.expect(mdkElems[0].custom[namespace].property2).to.equal('test2');
  chai.expect(mdkElems[0].custom[namespace].property3).to.equal('test3');
}

/**
 * @description Verifies that formatter.js can take an MCF org and convert it into an MMS org.
 */
async function mmsOrg() {
  const convertedOrg = await format.mmsOrg(adminUser, org);

  chai.expect(convertedOrg.id).to.equal(org._id);
  chai.expect(convertedOrg.name).to.equal(org.name);
}

/**
 * @description Verifies that formatter.js can take an MCF project and convert it into
 * an MMS project.
 */
async function mmsProject() {
  project.custom = {
    [namespace]: {
      property1: 'test1',
      property2: 'test2',
      property3: 'test3'
    }
  };

  const convertedProject = await format.mmsProject(adminUser, project);

  chai.expect(convertedProject.id).to.equal(projID);
  chai.expect(convertedProject.name).to.equal(project.name);
  chai.expect(convertedProject._creator).to.equal(project.createdBy);
  chai.expect(convertedProject._modifier).to.equal(null);
  chai.expect(convertedProject._modified).to.equal(undefined);
  chai.expect(convertedProject._projectId).to.equal(projID);
  chai.expect(convertedProject._refId).to.equal(branchID);
  chai.expect(convertedProject.orgId).to.equal(org._id);
  chai.expect(convertedProject.categoryId).to.equal(null);
  chai.expect(convertedProject._mounts).to.deep.equal([]);
  chai.expect(convertedProject._editable).to.equal(true);
  chai.expect(convertedProject.property1).to.equal('test1');
  chai.expect(convertedProject.property2).to.equal('test2');
  chai.expect(convertedProject.property3).to.equal('test3');
}

/**
 * @description Verifies that formatter.js can take an MCF branch and convert it into
 * an MMS ref.
 */
async function mmsRef() {
  branch.custom = {
    [namespace]: {
      property1: 'test1',
      property2: 'test2',
      property3: 'test3'
    }
  };

  const convertedRef = format.mmsRef(adminUser, branch);

  chai.expect(convertedRef.id).to.equal(branchID);
  chai.expect(convertedRef.name).to.equal(branch.name);
  chai.expect(convertedRef._modifier).to.equal(null);
  chai.expect(convertedRef.property1).to.equal('test1');
  chai.expect(convertedRef.property2).to.equal('test2');
  chai.expect(convertedRef.property3).to.equal('test3');
}

/**
 * @description Verifies that formatter.js can take an MCF element and convert it into
 * an MMS element.
 */
async function mmsElement() {
  element.custom = {
    [namespace]: {
      property1: 'test1',
      property2: 'test2',
      property3: 'test3'
    }
  };

  const convertedElement = format.mmsElement(adminUser, element);

  chai.expect(convertedElement.id).to.equal(elemID);
  chai.expect(convertedElement.name).to.equal(element.name);
  chai.expect(convertedElement.documentation).to.equal(element.documentation);
  chai.expect(convertedElement.ownerId).to.equal(element.parent);
  chai.expect(convertedElement._projectId).to.equal(projID);
  chai.expect(convertedElement._refId).to.equal(branchID);
  chai.expect(convertedElement._creator).to.equal(element.createdBy);
  chai.expect(convertedElement._modifier).to.equal(null);
  chai.expect(convertedElement._editable).to.equal(true);
  chai.expect(convertedElement.property1).to.equal('test1');
  chai.expect(convertedElement.property2).to.equal('test2');
  chai.expect(convertedElement.property3).to.equal('test3');
}

/**
 * @description Verifies that formatter.js can take an MCF artifact and convert it into
 * an MMS artifact.
 */
async function mmsArtifact() {
  const artObj = {
    _id: mcfUtils.createID(org._id, projID, branchID, 'test-artifact'),
    id: 'test-artifact',
    project: mcfUtils.createID(org._id, projID),
    branch: mcfUtils.createID(org._id, projID, branchID),
    location: 'test',
    filename: 'test',
    strategy: 'local',
    createdBy: 'test_admin',
    custom: {
      [namespace]: {
        property1: 'test1',
        property2: 'test2',
        property3: 'test3'
      }
    }
  };

  const convertedArtifact = format.mmsArtifact(adminUser, artObj);

  chai.expect(convertedArtifact.id).to.equal(artObj.id);
  chai.expect(convertedArtifact._projectId).to.equal(projID);
  chai.expect(convertedArtifact._refId).to.equal(branchID);
  chai.expect(convertedArtifact.artifactLocation).to.equal(
    `/projects/${projID}/refs/${branchID}/artifacts/blob/${artObj.id}`
  );
  chai.expect(convertedArtifact._creator).to.equal(artObj.createdBy);
  chai.expect(convertedArtifact._modifier).to.equal(null);
  chai.expect(convertedArtifact._editable).to.equal(true);
  chai.expect(convertedArtifact.property1).to.equal('test1');
  chai.expect(convertedArtifact.property2).to.equal('test2');
  chai.expect(convertedArtifact.property3).to.equal('test3');
}
