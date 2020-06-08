/**
 * @classification UNCLASSIFIED
 *
 * @module test.202-org-mock-api-tests
 *
 * @copyright Copyright (C) 2020, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description Verifies that the organization API endpoints are functioning correctly.
 */

// NPM modules
const chai = require('chai');

// MBEE modules
const Org = M.require('models.organization');

// Adapter modules
const APIController = require('../../src/api-controller');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
const next = testUtils.next;
let adminUser = null;
let org = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Run before all tests. Creates the admin user and test org.
   */
  before(async () => {
    try {
      adminUser = await testUtils.createTestAdmin();
      org = await testUtils.createTestOrg(adminUser);
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: Run after all tests. Delete admin user and test org.
   */
  after(async () => {
    try {
      await testUtils.removeTestOrg();
      await Org.deleteMany({ _id: testData.orgs[2].id});
      await testUtils.removeTestAdmin();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /* Execute tests */
  it('should find and return all the orgs that the requesting user has access to', getOrgs);
  it('should find and return the requested organization if the user has permission', getOrg);
  it('should post an org', postOrgs);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies that the getOrgs function can successfully return all orgs associated
 * with the requesting user.
 *
 * @param {Function} done - The mocha callback.
 */
function getOrgs(done) {
  const params = {};
  const body = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };

  testUtils.createResponse(res);

  res.send = function send(body) {
    const orgs = body.orgs;
    chai.expect(orgs.length).to.be.at.least(2);
    chai.expect(orgs.some((o) => o.id === 'default')).to.equal(true);
    chai.expect(orgs.some((o) => o.id === org._id));

    done();
  };
  APIController.getOrgs(req, res, next(req, res));
}

/**
 * @description Verifies that the getOrg function can successfully return an org.
 *
 * @param {Function} done - The mocha callback.
 */
function getOrg(done) {
  const params = { orgid: org._id };
  const body = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };

  testUtils.createResponse(res);

  res.send = function send(_data) {
    const orgs = _data.orgs;
    chai.expect(orgs.length).to.equal(1);
    chai.expect(orgs[0].id).to.equal(org._id);
    chai.expect(orgs[0].name).to.equal(org.name);

    done();
  };
  APIController.getOrg(req, res, next(req, res));
}

/**
 * @description Verifies that the postOrgs function successfully creates an org.
 *
 * @param {Function} done - The mocha callback.
 */
function postOrgs(done) {
  const orgData = testData.orgs[2];
  const params = {};
  const body = {
    orgs: [
      orgData
    ]
  };
  const method = 'POST';

  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };

  testUtils.createResponse(res);

  res.send = async function send(_data) {
    const orgs = _data.orgs;
    const createdOrg = orgs[0];
    chai.expect(createdOrg.id).to.equal(orgData.id);
    chai.expect(createdOrg.name).to.equal(orgData.name);

    done();
  };
  APIController.postOrgs(req, res, next(req, res));
}