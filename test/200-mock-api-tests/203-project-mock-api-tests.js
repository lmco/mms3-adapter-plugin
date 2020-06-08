/**
 * @classification UNCLASSIFIED
 *
 * @module test.203-project-mock-api-tests
 *
 * @copyright Copyright (C) 2020, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description Verifies that the project API endpoints are functioning correctly.
 */

// NPM modules
const chai = require('chai');

// MBEE modules
const mcfUtils = M.require('lib.utils');

// Adapter modules
const APIController = require('../../src/api-controller');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const next = testUtils.next;
let adminUser = null;
let org = null;
let projectID = null;
let project2ID = 'test_project_2';

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
      const project = await testUtils.createTestProject(adminUser, org._id);
      projectID = mcfUtils.parseID(project._id).pop();
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
      await testUtils.removeTestAdmin();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /* Execute tests */
  it('should post a project', postProjects);
  it('should get a project', getProject);
  it('should get projects on an org', getProjects);
  it('should get all projects', getAllProjects);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies that the postProjects function successfully creates a project.
 *
 * @param {Function} done - The mocha callback.
 */
function postProjects(done) {
  const params = {
    orgid: org._id
  };
  const body = {
    projects: [
      {
        id: project2ID,
        name: project2ID
      }
    ]
  };
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };

  testUtils.createResponse(res);

  res.send = function send(_data) {
    const projects = _data.projects;
    chai.expect(projects.length).to.equal(1);
    const project = projects[0];
    chai.expect(project.id).to.equal(project2ID);

    done();
  };
  APIController.postProjects(req, res, next(req, res));
}

/**
 * @description Verifies that the getProject function successfully finds a project.
 *
 * @param {Function} done - The mocha callback.
 */
function getProject(done) {
  const params = {
    orgid: org._id,
    projectid: projectID
  };
  const body = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };

  testUtils.createResponse(res);

  res.send = function send(_data) {
    const projects = _data.projects;
    chai.expect(projects.length).to.equal(1);
    const project = projects[0];
    chai.expect(project.id).to.equal(projectID);

    done();
  };
  APIController.getProject(req, res, next(req, res));
}

/**
 * @description Verifies that the getProjects function successfully finds projects.
 *
 * @param {Function} done - The mocha callback.
 */
function getProjects(done) {
  const params = {
    orgid: org._id,
  };
  const body = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };

  testUtils.createResponse(res);

  res.send = function send(_data) {
    const projects = _data.projects;
    chai.expect(projects.length).to.equal(2);
    const project = projects[0];
    chai.expect(project.id).to.equal(projectID);

    done();
  };
  APIController.getProjects(req, res, next(req, res));
}

/**
 * @description Verifies that the getAllProjects function successfully finds all projects.
 *
 * @param {Function} done - The mocha callback.
 */
function getAllProjects(done) {
  const params = {};
  const body = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };

  testUtils.createResponse(res);

  res.send = function send(_data) {
    const projects = _data.projects;
    chai.expect(projects.length).to.be.at.least(2);
    const projectIDs = projects.map((p) => p.id);
    chai.expect(projectIDs.includes(projectID)).to.equal(true);

    done();
  };
  APIController.getAllProjects(req, res, next(req, res));
}
