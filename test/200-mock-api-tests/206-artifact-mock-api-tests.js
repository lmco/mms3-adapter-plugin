/**
 * @classification UNCLASSIFIED
 *
 * @module test.206-artifact-mock-api-tests
 *
 * @copyright Copyright (C) 2020, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description Verifies that the artifact API endpoints are functioning correctly.
 */

// Node modules
const fs = require('fs');
const path = require('path');

// NPM modules
const chai = require('chai');

// MBEE modules
const mcfUtils = M.require('lib.utils');
const ProjectController = M.require('controllers.project-controller');

// Adapter modules
const APIController = require('../../src/api-controller.js');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const testData = testUtils.importTestData('test_data.json');
const next = testUtils.next;
let adminUser = null;
let org = null;
let projectID = null;
let branchID = 'master';


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
      const projects = await ProjectController.create(adminUser, org._id, {
        id: 'test_project',
        name: 'test_project'
      });
      const project = projects[0];
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
  it('should post an artifact', postArtifact);
  it('should get artifact documents', putArtifacts);
  it('should get an artifact blob', getBlob);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies that the postArtifact function successfully creates an artifact
 * document and stores an artifact blob.
 *
 * @param {Function} done - The Mocha callback.
 */
function postArtifact(done) {
  const artData = testData.artifacts[0];
  const params = {
    projectid: projectID,
    refid: branchID,
  };
  const body = {
    id: artData.id
  };
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };
  testUtils.createResponse(res);

  // Attach the file to request
  const artifactPath = path.join(M.root, artData.location, artData.filename);
  req.file = {
    buffer: fs.readFileSync(artifactPath)
  };

  res.send = async function(_data) {
    const artifact = _data;
    chai.expect(artifact.id).to.equal(artData.id);
    chai.expect(artifact.location).to.equal(`${org._id}/${projectID}`);
    chai.expect(artifact.filename).to.equal(`${artData.id}.svg`);

    done();
  };

  APIController.postArtifact(req, res, next(req, res));
}

/**
 * @description Verifies that the putArtifacts function successfully retrieves an artifact
 * document based on the ids provided in the body of the request.
 *
 * @param {Function} done - The Mocha callback.
 */
function putArtifacts(done) {
  const artData = testData.artifacts[0];
  const params = {
    projectid: projectID,
    refid: branchID,
  };
  const body = {
    artifacts: [
      {
        id: artData.id
      }
    ]
  };
  const method = 'PUT';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };
  testUtils.createResponse(res);

  // Attach the file to request
  const artifactPath = path.join(M.root, artData.location, artData.filename);
  req.file = {
    buffer: fs.readFileSync(artifactPath)
  };

  res.send = async function(_data) {
    const artifacts = _data.artifacts;
    chai.expect(artifacts.length).to.equal(1);
    const artifact = artifacts[0];
    chai.expect(artifact.id).to.equal(artData.id);
    chai.expect(artifact.location).to.equal(`${org._id}/${projectID}`);
    chai.expect(artifact.filename).to.equal(`${artData.id}.svg`);
    chai.expect(artifact.artifactLocation).to.equal(`/projects/${projectID}/refs/master/artifacts/blob/${artData.id}`);
    chai.expect(artifact._projectId).to.equal(projectID);
    chai.expect(artifact._refId).to.equal('master');
    chai.expect(artifact._creator).to.equal(adminUser._id);

    done();
  };

  APIController.putArtifacts(req, res, next(req, res));
}

/**
 * @description Verifies that the getBlob function successfully returns an artifact blob.
 *
 * @param {Function} done - The Mocha callback.
 */
function getBlob(done) {
  const artData = testData.artifacts[0];
  const params = {
    projectid: projectID,
    refid: branchID,
    blobid: artData.id
  };
  const body = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };
  testUtils.createResponse(res);

  // Get the blob for comparison
  const artifactPath = path.join(M.root, artData.location, artData.filename);
  const actualBlob =  fs.readFileSync(artifactPath);

  res.send = async function(_data) {
    chai.expect(_data).to.deep.equal(actualBlob);

    done();
  };

  APIController.getBlob(req, res, next(req, res));
}