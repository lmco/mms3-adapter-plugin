/**
 * @classification UNCLASSIFIED
 *
 * @module test.204-ref-mock-api-tests
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
 * @description Verifies that the ref API endpoints are functioning correctly.
 */

// NPM modules
const chai = require('chai');

// MCF modules
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
const branch2ID = 'branch2';

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
  it('should post a ref', postRefs);
  it('should get a ref', getRef);
  it('should get refs', getRefs);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies that the postRefs function successfully creates a branch.
 *
 * @param {Function} done - The mocha callback.
 */
function postRefs(done) {
  const params = {
    orgid: org._id,
    projectid: projectID
  };
  const body = {
    refs: [
      {
        id: branch2ID,
        parentRefId: 'master'
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
    const branches = _data.refs;
    const branch = branches[0];
    chai.expect(branch.id).to.equal(branch2ID);

    done();
  };
  APIController.postRefs(req, res, next(req, res));
}

/**
 * @description Verifies that the getRef function successfully finds a branch.
 *
 * @param {Function} done - The mocha callback.
 */
function getRef(done) {
  const params = {
    orgid: org._id,
    projectid: projectID,
    refid: 'master'
  };
  const body = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };

  testUtils.createResponse(res);

  res.send = function send(_data) {
    const branches = _data.refs;
    chai.expect(branches.length).to.equal(1);
    const branch = branches[0];
    chai.expect(branch.id).to.equal('master');

    done();
  };
  APIController.getRef(req, res, next(req, res));
}

/**
 * @description Verifies that the getRefs function successfully finds branches.
 *
 * @param {Function} done - The mocha callback.
 */
function getRefs(done) {
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
    const branches = _data.refs;
    chai.expect(branches.length).to.equal(2);
    const branchIDs = branches.map((b) => b.id);
    chai.expect(branchIDs).to.have.members(['master', branch2ID]);

    done();
  };
  APIController.getRefs(req, res, next(req, res));
}
