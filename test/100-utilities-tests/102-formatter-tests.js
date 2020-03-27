/**
 * Classification: UNCLASSIFIED
 *
 * @module test.102-formatter-tests.js
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description Tests the utils.js file
 */

// Node modules
const fs = require('fs');
const path = require('path');

// NPM modules
const chai = require('chai');

// MBEE modules
const OrgController = M.require('controllers.organization-controller');
const ProjectController = M.require('controllers.project-controller');
const mcfTestUtils = M.require('lib.test-utils');
const mcfTestData = mcfTestUtils.importTestData('test_data.json');
const mcfUtils = M.require('lib.utils');

// Plugin modules
const utils = require('../../src/utils.js');
const format = require('../../src/formatter.js');

// Global variables
let adminUser;
let org;
let project;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {

  /**
   * Before: Create admin user.
   */
  before(async () => {
    try {
      // Create test admin
      adminUser = await mcfTestUtils.createTestAdmin();
      // Set global test organization
      org = await mcfTestUtils.createTestOrg(adminUser);
      // Set global test project
      project = await mcfTestUtils.createTestProject(adminUser, org._id);
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  after(async () => {
    try {
      // Remove organization
      // Note: Projects under organization will also be removed
      await mcfTestUtils.removeTestOrg();
      await mcfTestUtils.removeTestAdmin();
    }
    catch (error) {

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
 * @description
 */
async function mcfOrg() {
  const mdkOrg = {
    id: 'test-id',
    name: 'test-org',
    property1: 'test1',
    property2: 'test2',
    property3: 'test3'
  };

  const org = format.mcfOrg(mdkOrg);

  chai.expect(org.id).to.equal('test-id');
  chai.expect(org.name).to.equal('test-name');
  chai.expect(org.custom[utils.customDataNamespace].property1).to.equal('test1');
  chai.expect(org.custom[utils.customDataNamespace].property2).to.equal('test2');
  chai.expect(org.custom[utils.customDataNamespace].property3).to.equal('test3');
}

/**
 * @description
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
  chai.expect(proj.name).to.equal('test-proj');
  chai.expect(proj.custom[utils.customDataNamespace].property1).to.equal('test1');
  chai.expect(proj.custom[utils.customDataNamespace].property2).to.equal('test2');
  chai.expect(proj.custom[utils.customDataNamespace].property3).to.equal('test3');
}

/**
 * @description
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
  chai.expect(ref.custom[utils.customDataNamespace].property1).to.equal('test1');
  chai.expect(ref.custom[utils.customDataNamespace].property2).to.equal('test2');
  chai.expect(ref.custom[utils.customDataNamespace].property3).to.equal('test3');
}

/**
 * @description
 */
async function mcfElements() {
  const mdkElem = {
    id: 'test-id',
    name: 'test-elem',
    ownerId: 'test-parent',

  }

}

/**
 * @description
 */
async function mmsOrg() {

}

/**
 * @description
 */
async function mmsProject() {

}

/**
 * @description
 */
async function mmsRef() {

}

/**
 * @description
 */
async function mmsElement() {

}

/**
 * @description
 */
async function mmsArtifact() {

}