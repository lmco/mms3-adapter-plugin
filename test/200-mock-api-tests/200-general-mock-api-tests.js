/**
 * @classification UNCLASSIFIED
 *
 * @module test.200-general-mock-api-tests
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
 * @description This tests general api endpoints of the plugin.
 */

// NPM modules
const chai = require('chai');

// Adapter modules
const APIController = require('../../src/api-controller');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const next = testUtils.next;
let adminUser = null;

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {
  /**
   * Before: Run before all tests. Creates the admin user.
   */
  before(async () => {
    try {
      adminUser = await testUtils.createTestAdmin();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /**
   * After: Delete admin user.
   */
  after(async () => {
    try {
      await testUtils.removeTestAdmin();
    }
    catch (error) {
      M.log.error(error);
      // Expect no error
      chai.expect(error).to.equal(null);
    }
  });

  /* Execute tests */
  it('should return a token from the request session as a ticket in the response', postLogin);
  it('should verify that a token is valid and return the associated username', ticketLogin);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies that a token is returned from the session as a ticket.
 *
 * @param {Function} done - The mocha callback.
 */
function postLogin(done) {
  const req = testUtils.createRequest(adminUser, {}, null, null);
  const res = {
    locals: {}
  };
  const token = 'abc';
  req.session.token=token;
  testUtils.createResponse(res);
  res.send = function send(body) {
    chai.expect(body.hasOwnProperty('data')).to.equal(true);
    chai.expect(body.data.hasOwnProperty('ticket')).to.equal(true);
    chai.expect(body.data.ticket).to.equal(token);
    done();
  };
  APIController.postLogin(req, res, next(req, res));
}

/**
 * @description Verifies that the username is returned from a login request.
 *
 * @param {Function} done - The mocha callback.
 */
function ticketLogin(done) {
  const req = testUtils.createRequest(adminUser, {}, null, null);
  const res = {
    locals: {}
  };

  testUtils.createResponse(res);
  res.send = function send(body) {
    chai.expect(body.hasOwnProperty('username')).to.equal(true);
    chai.expect(body.username).to.equal('test_admin');
    done();
  };
  APIController.getTicket(req, res, next(req, res));
}
