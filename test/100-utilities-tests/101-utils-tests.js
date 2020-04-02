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

// NPM modules
const chai = require('chai');

// MBEE modules
const ElementController = M.require('controllers.element-controller');
const mcfTestUtils = M.require('lib.test-utils');
const mcfUtils = M.require('lib.utils');

// Plugin modules
const utils = require('../../src/utils.js');
const namespace = utils.customDataNamespace;

// Global variables
let adminUser;
let org;
let project;
let projID;
const branchID = 'master';
const elements = [
  {
    id: 'test_doc_1',
    parent: 'model',
    custom: {
      [namespace]: {
        _appliedStereotypeIds: [
          '_17_0_2_3_87b0275_1371477871400_792964_43374'
        ],
        ownedAttributeIds: [
          'test_oa_elem1',
          'test_oa_elem2',
          'test_oa_elem3'
        ]
      }
    }
  },
  {
    id: 'test_oa_elem1',
    parent: 'model',
    custom: {
      [namespace]: {
        typeId: 'test_typeId1',
        aggregation: 'test_ag1'
      }
    }
  },
  {
    id: 'test_oa_elem2',
    parent: 'model',
    custom: {
      [namespace]: {
        typeId: 'test_typeId2',
        aggregation: 'test_ag2'
      }
    }
  },
  {
    id: 'test_oa_elem3',
    parent: 'model',
    custom: {
      [namespace]: {
        typeId: 'test_typeId3',
        aggregation: 'test_ag3'
      }
    }
  }
];

/* --------------------( Main )-------------------- */
/**
 * The "describe" function is provided by Mocha and provides a way of wrapping
 * or grouping several "it" tests into a single group. In this case, the name of
 * that group (the first parameter passed into describe) is derived from the
 * name of the current file.
 */
describe(M.getModuleName(module.filename), () => {

  /**
   * Before: Create admin user, test org, test project, and test elements.
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

      // Create test elements
      await ElementController.create(adminUser, org._id, projID, branchID, elements);
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
  it('should handle the ticket in the request parameters', formatTicketRequest);
  it('should generate child views for document and view elements', generateChildViews);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verfiy that the utils.getOrgId function adds the org id to the request parameters.
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
 * @description Verify that the utils.addHeaders function adds headers to the response object.
 */
async function responseHeaders() {
  const req = {
    headers: {
      origin: 'test'
    }
  };
  const res = {
    headers: {},
    header: function(key, val) {
      this.headers[key] = val;
    }
  };
  const next = function() {
    chai.expect(res.headers['Access-Control-Allow-Origin']).to.equal('test');
    chai.expect(res.headers['Access-Control-Allow-Credentials']).to.equal('true');
    chai.expect(res.headers['Access-Control-Allow-Headers']).to.equal('Origin, X-Requested-With, Content-Type, Accept, Authorization');
    chai.expect(res.headers['Access-Control-Allow-Methods']).to.equal('GET, POST, OPTIONS, PUT, DELETE');
  };
  utils.addHeaders(req, res, next);
}

/**
 * @description
 */
async function handleTicket() {
  const req = {
    headers: {
      authorization: {}
    },
    query: {
      alf_ticket: 'test%20auth'
    }
  };
  const next = function() {
    chai.expect(req.headers.authorization).to.equal('Bearer test auth')
  };
  utils.handleTicket(req, null, next);
}

/**
 * @description
 */
async function formatTicketRequest() {
  const req = {
    headers: {
      authorization: {}
    },
    params: ['test%20auth']
  };
  const next = function() {
    chai.expect(req.headers.authorization).to.equal('Bearer test auth')
  };
  utils.formatTicketRequest(req, null, next);
}

/**
 * @description
 */
async function generateChildViews() {
  // Initialize variables to validate found child views against
  const ids = elements.map((e) => e.custom[namespace].typeId).filter((id) => id);
  const aggregations = elements.map((e) => e.custom[namespace].aggregation).filter((ag) => ag);
  const propertyIds = elements.map((e) => e.id).filter((id) => id !== 'test_doc_1');

  // Call the utils function to generate child views
  await utils.generateChildViews(adminUser, org._id, projID, branchID, elements);

  // Verify that child views have been created
  elements.forEach((elem) => {
    if (elem.custom[namespace].hasOwnProperty('_appliedStereotypeIds')
      && elem.custom[namespace]._appliedStereotypeIds.includes('_17_0_2_3_87b0275_1371477871400_792964_43374')) {
      chai.expect(elem.custom[namespace].hasOwnProperty('_childViews')).to.equal(true);
      const childViews = elem.custom[namespace]._childViews;
      childViews.forEach((cv) => {
        chai.expect(ids.includes(cv.id)).to.equal(true);
        chai.expect(aggregations.includes(cv.aggregation)).to.equal(true);
        chai.expect(propertyIds.includes(cv.propertyId)).to.equal(true);
      })
    }
  })
}
