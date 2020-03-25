/**
 * Classification: UNCLASSIFIED
 *
 * @module test.11-utils-tests.js
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
   * Before: Create admin user, test org, and test project.
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

  /**
   * After: Remove admin user and test org.
   */
  after(async () => {
    try {
      // Remove organization
      await mcfTestUtils.removeTestOrg();
      await mcfTestUtils.removeTestAdmin();
    }
    catch (error) {

    }
  });

  it('should find and set the org id in the request parameters', getOrgID);
  it('should set the response headers', responseHeaders);
  it('should handle the ticket in the query', handleTicket);
});

/* --------------------( Tests )-------------------- */
/**
 * @description
 */
async function getOrgID() {
  const req = {
    params: {
      projectid: mcfUtils.parseID(project._id).pop()
    }
  };

  // Call the getOrgId function
  await utils.getOrgId(req);

  // Expect the utils function to have added an orgid parameter to the req object
  chai.expect(req.params.orgid).to.equal(org._id);
}

/**
 * @description
 */
async function responseHeaders() {

}

/**
 * @description
 */
async function handleTicket() {

}

/**
 * @description
 */
async function formatTicketRequest() {

}

/**
 * @description
 */
async function generateChildViews() {

}
