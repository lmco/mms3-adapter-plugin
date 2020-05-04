// /**
//  * @classification UNCLASSIFIED
//  *
//  * @module test.502a-org-mock-core-tests
//  *
//  * @copyright Copyright (C) 2018, Lockheed Martin Corporation
//  *
//  * @license MIT
//  *
//  * @owner Connor Doyle
//  *
//  * @author Connor Doyle
//  *
//  * @description
//  */
//
// // NPM modules
// const chai = require('chai');
//
// // MBEE modules
// const APIController = M.require('controllers.api-controller');
// const jmi = M.require('lib.jmi-conversions');
//
// /* --------------------( Test Data )-------------------- */
// // Variables used across test functions
// const testUtils = M.require('lib.test-utils');
// const testData = testUtils.importTestData('test_data.json');
// const next = testUtils.next;
// let adminUser = null;
//
// /* --------------------( Main )-------------------- */
// /**
//  * The "describe" function is provided by Mocha and provides a way of wrapping
//  * or grouping several "it" tests into a single group. In this case, the name of
//  * that group (the first parameter passed into describe) is derived from the
//  * name of the current file.
//  */
// describe(M.getModuleName(module.filename), () => {
//   /**
//    * Before: Run before all tests. Creates the admin user.
//    */
//   before(async () => {
//     try {
//       adminUser = await testUtils.createTestAdmin();
//     }
//     catch (error) {
//       M.log.error(error);
//       // Expect no error
//       chai.expect(error).to.equal(null);
//     }
//   });
//
//   /**
//    * After: Delete admin user.
//    */
//   after(async () => {
//     try {
//       await testUtils.removeTestAdmin();
//     }
//     catch (error) {
//       M.log.error(error);
//       // Expect no error
//       chai.expect(error).to.equal(null);
//     }
//   });
//
//   /* Execute tests */
//   it('should POST multiple orgs', postOrgs);
//   it('should GET an org', getOrg);
//   it('should GET multiple orgs', getOrgs);
//   it('should GET all orgs', getAllOrgs);
// });
//
// /* --------------------( Tests )-------------------- */
// /**
//  * @description Verifies mock POST request to create multiple organizations.
//  *
//  * @param {Function} done - The mocha callback.
//  */
// function postOrgs(done) {
//   // Create request object
//   const orgData = [
//     testData.orgs[1],
//     testData.orgs[2]
//   ];
//   const params = {};
//   const method = 'POST';
//   const req = testUtils.createRequest(adminUser, params, orgData, method);
//
//   // Set response as empty object
//   const res = {};
//
//   // Verifies status code and headers
//   testUtils.createResponse(res);
//
//   // Verifies the response data
//   res.send = function send(_data) {
//     // Verify response body
//     const postedOrgs = JSON.parse(_data);
//     chai.expect(postedOrgs.length).to.equal(orgData.length);
//
//     // Convert foundProjects to JMI type 2 for easier lookup
//     const jmi2Orgs = jmi.convertJMI(1, 2, postedOrgs, 'id');
//     // Loop through each project data object
//     orgData.forEach((orgDataObject) => {
//       const postedOrg = jmi2Orgs[orgDataObject.id];
//
//       // Verify project created properly
//       chai.expect(postedOrg.id).to.equal(orgDataObject.id);
//       chai.expect(postedOrg.name).to.equal(orgDataObject.name);
//       chai.expect(postedOrg.custom).to.deep.equal(orgDataObject.custom || {});
//       chai.expect(postedOrg.permissions[adminUser._id]).to.equal('admin');
//
//       // Verify additional properties
//       chai.expect(postedOrg.createdBy).to.equal(adminUser._id);
//       chai.expect(postedOrg.lastModifiedBy).to.equal(adminUser._id);
//       chai.expect(postedOrg.createdOn).to.not.equal(null);
//       chai.expect(postedOrg.updatedOn).to.not.equal(null);
//       chai.expect(postedOrg.archived).to.equal(false);
//
//       // Verify specific fields not returned
//       chai.expect(postedOrg).to.not.have.any.keys('archivedOn', 'archivedBy',
//         '__v', '_id');
//     });
//
//     // Expect the statusCode to be 200
//     chai.expect(res.statusCode).to.equal(200);
//
//     done();
//   };
//
//   // POST multiple orgs
//   APIController.postOrgs(req, res, next(req, res));
// }
//
// /**
//  * @description Verifies mock GET request to get an organization.
//  *
//  * @param {Function} done - The mocha callback.
//  */
// function getOrg(done) {
//   // Create request object
//   const body = {};
//   const params = { orgid: testData.orgs[0].id };
//   const method = 'GET';
//   const req = testUtils.createRequest(adminUser, params, body, method);
//
//   // Set response as empty object
//   const res = {};
//
//   // Verifies status code and headers
//   testUtils.createResponse(res);
//
//   // Verifies the response data
//   res.send = function send(_data) {
//     // Verify response body
//     const foundOrg = JSON.parse(_data);
//     chai.expect(foundOrg.id).to.equal(testData.orgs[0].id);
//     chai.expect(foundOrg.name).to.equal(testData.orgs[0].name);
//     chai.expect(foundOrg.custom).to.deep.equal(testData.orgs[0].custom || {});
//     chai.expect(foundOrg.permissions[adminUser._id]).to.equal('admin');
//
//     // Verify additional properties
//     chai.expect(foundOrg.createdBy).to.equal(adminUser._id);
//     chai.expect(foundOrg.lastModifiedBy).to.equal(adminUser._id);
//     chai.expect(foundOrg.createdOn).to.not.equal(null);
//     chai.expect(foundOrg.updatedOn).to.not.equal(null);
//     chai.expect(foundOrg.archived).to.equal(false);
//
//     // Verify specific fields not returned
//     chai.expect(foundOrg).to.not.have.any.keys('archivedOn', 'archivedBy',
//       '__v', '_id');
//
//     // Expect the statusCode to be 200
//     chai.expect(res.statusCode).to.equal(200);
//
//     done();
//   };
//
//   // GET an org
//   APIController.getOrg(req, res, next(req, res));
// }
//
// /**
//  * @description Verifies mock GET request to get multiple organizations.
//  *
//  * @param {Function} done - The mocha callback.
//  */
// function getOrgs(done) {
//   const orgData = [
//     testData.orgs[1],
//     testData.orgs[2],
//     testData.orgs[3]
//   ];
//   // Create request object
//   const params = {};
//   const method = 'GET';
//   const req = testUtils.createRequest(adminUser, params, orgData, method);
//
//   // Set response as empty object
//   const res = {};
//
//   // Verifies status code and headers
//   testUtils.createResponse(res);
//
//   // Verifies the response data
//   res.send = function send(_data) {
//     // Verifies length of response body
//     const foundOrgs = JSON.parse(_data);
//     chai.expect(foundOrgs.length).to.equal(orgData.length);
//
//     // Convert foundOrgs to JMI type 2 for easier lookup
//     const jmi2Orgs = jmi.convertJMI(1, 2, foundOrgs, 'id');
//
//     // Loop through each org data object
//     orgData.forEach((orgDataObject) => {
//       const foundOrg = jmi2Orgs[orgDataObject.id];
//
//       // Verify org created properly
//       chai.expect(foundOrg.id).to.equal(orgDataObject.id);
//       chai.expect(foundOrg.name).to.equal(orgDataObject.name);
//       chai.expect(foundOrg.custom).to.deep.equal(orgDataObject.custom || {});
//       chai.expect(foundOrg.permissions[adminUser._id]).to.equal('admin');
//
//       // Verify additional properties
//       chai.expect(foundOrg.createdBy).to.equal(adminUser._id);
//       chai.expect(foundOrg.lastModifiedBy).to.equal(adminUser._id);
//       chai.expect(foundOrg.createdOn).to.not.equal(null);
//       chai.expect(foundOrg.updatedOn).to.not.equal(null);
//       chai.expect(foundOrg.archived).to.equal(false);
//
//       // Verify specific fields not returned
//       chai.expect(foundOrg).to.not.have.any.keys('archivedOn', 'archivedBy',
//         '__v', '_id');
//     });
//
//     // Expect the statusCode to be 200
//     chai.expect(res.statusCode).to.equal(200);
//
//     done();
//   };
//
//   // GET all orgs
//   APIController.getOrgs(req, res, next(req, res));
// }
//
// /**
//  * @description Verifies mock GET request to get all organizations.
//  *
//  * @param {Function} done - The mocha callback.
//  */
// function getAllOrgs(done) {
//   const orgData = [
//     testData.orgs[0],
//     testData.orgs[1],
//     testData.orgs[2],
//     testData.orgs[3]
//   ];
//
//   // Create request object
//   const body = {};
//   const params = {};
//   const method = 'GET';
//   const req = testUtils.createRequest(adminUser, params, body, method);
//
//   // Set response as empty object
//   const res = {};
//
//   // Verifies status code and headers
//   testUtils.createResponse(res);
//
//   // Verifies the response data
//   res.send = function send(_data) {
//     // Verifies length of response body
//     const foundOrgs = JSON.parse(_data);
//
//     // Convert foundOrgs to JMI type 2 for easier lookup
//     const jmi2Orgs = jmi.convertJMI(1, 2, foundOrgs, 'id');
//
//     // Loop through each org data object
//     orgData.forEach((orgDataObject) => {
//       const foundOrg = jmi2Orgs[orgDataObject.id];
//
//       // Verify org created properly
//       chai.expect(foundOrg.id).to.equal(orgDataObject.id);
//       chai.expect(foundOrg.name).to.equal(orgDataObject.name);
//       chai.expect(foundOrg.custom).to.deep.equal(orgDataObject.custom || {});
//       chai.expect(foundOrg.permissions[adminUser._id]).to.equal('admin');
//
//       // Verify additional properties
//       chai.expect(foundOrg.createdBy).to.equal(adminUser._id);
//       chai.expect(foundOrg.lastModifiedBy).to.equal(adminUser._id);
//       chai.expect(foundOrg.createdOn).to.not.equal(null);
//       chai.expect(foundOrg.updatedOn).to.not.equal(null);
//       chai.expect(foundOrg.archived).to.equal(false);
//
//       // Verify specific fields not returned
//       chai.expect(foundOrg).to.not.have.any.keys('archivedOn', 'archivedBy',
//         '__v', '_id');
//     });
//
//     // Expect the statusCode to be 200
//     chai.expect(res.statusCode).to.equal(200);
//
//     done();
//   };
//
//   // GET all orgs
//   APIController.getOrgs(req, res, next(req, res));
// }
/**
 * @classification UNCLASSIFIED
 *
 * @module test.200-general-mock-api-tests
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license MIT
 *
 * @owner Connor Doyle
 *
 * @author Connor Doyle
 *
 * @description
 */

// NPM modules
const chai = require('chai');

// MBEE modules
const jmi = M.require('lib.jmi-conversions');

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
  const params = {orgid: org._id};
  const body = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };

  testUtils.createResponse(res);

  res.send = function send(body) {
    const orgs = body.orgs;
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
  const orgData = testData.orgs[1];
  const params = {};
  const body = orgData;
  const method = 'POST';
  console.log(orgData)
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };

  testUtils.createResponse(res);

  res.send = async function send(data) {
    chai.expect(data.id).to.equal(orgData.id);
    chai.expect(data.name).to.equal(orgData.name);

    done();
  };
  APIController.postOrgs(req, res, next(req, res));
}