/**
 * @classification UNCLASSIFIED
 *
 * @module test.205-element-mock-api-tests
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
 * @description Verifies that the element API endpoints are functioning correctly.
 */

// NPM modules
const chai = require('chai');

// MBEE modules
const ElementController = M.require('controllers.element-controller');
const ProjectController = M.require('controllers.project-controller');
const mcfUtils = M.require('lib.utils');
const jmi = M.require('lib.jmi-conversions');

// Adapter modules
const APIController = require('../../src/api-controller.js');
const utils = require('../../src/utils.js');
const namespace = utils.customDataNamespace;
const sjm = require('../../src/sjm.js');

/* --------------------( Test Data )-------------------- */
// Variables used across test functions
const testUtils = M.require('lib.test-utils');
const next = testUtils.next;
let adminUser = null;
let org = null;
let projectID = null;
const branchID = 'master';
const mountedProjectData = {
  id: 'mounted_test_project',
  name: 'mounted_test_project'
};
const testElements = [
  {
    id: 'test_elem_001',
    parent: 'model',
    custom: {
      [namespace]: {
        _appliedStereotypeIds: sjm.documentStereotypeID,
        ownedAttributeIds: [
          'test_oa_elem_003',
          'test_oa_elem_004',
          'test_oa_elem_005'
        ]
      }
    }
  },
  {
    id: 'test_elem_002',
    parent: 'model',
    custom: {
      [namespace]: {
        _appliedStereotypeIds: sjm.documentStereotypeID
      }
    }
  },
  {
    id: 'test_oa_elem_003',
    parent: 'model',
    custom: {
      [namespace]: {
        typeId: 'test_typeId_3',
        aggregation: 'test_aggregation_3',
        associationId: 'test_elem_006'
      }
    }
  },
  {
    id: 'test_oa_elem_004',
    parent: 'model',
    custom: {
      [namespace]: {
        typeId: 'test_typeId_4',
        aggregation: 'test_aggregation_4'
      }
    }
  },
  {
    id: 'test_oa_elem_005',
    parent: 'model',
    custom: {
      [namespace]: {
        typeId: 'test_typeId_5',
        aggregation: 'test_aggregation_5'
      }
    }
  },
  {
    id: 'test_elem_006',
    parent: 'model',
    custom: {
      [namespace]: {
        ownedEndIds: 'test_elem_007'
      }
    }
  },
  {
    id: 'test_elem_007',
    parent: 'model',
    custom: {
      [namespace]: {
        typeId: 'test_elem_001'
      }
    }
  },
  {
    id: 'test_group_elem_008',
    parent: 'model',
    custom: {
      [namespace]: {
        _isGroup: 'true'
      }
    }
  },
  {
    id: 'test_mount_elem_009',
    parent: 'model',
    type: 'Mount',
    custom: {
      [namespace]: {
        mountedElementProjectId: mountedProjectData.id,
        mountedRefId: 'master'
      }
    }
  },
  {
    id: 'test_mount_elem_010',
    parent: 'model'
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
   * Before: Run before all tests. Creates the admin user and test org.
   */
  before(async () => {
    try {
      adminUser = await testUtils.createTestAdmin();
      org = await testUtils.createTestOrg(adminUser);
      const project = await testUtils.createTestProject(adminUser, org._id);
      projectID = mcfUtils.parseID(project._id).pop();

      // Create second project to test the mounted element search capability
      await ProjectController.create(adminUser, org._id, mountedProjectData);
      // Create test element data
      await ElementController.create(adminUser, org._id, projectID, branchID,
        testElements.slice(0, 9));
      await ElementController.create(adminUser, org._id, mountedProjectData.id, branchID,
        testElements.slice(9));
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
  it('should find an element', getElement);
  it('should find an element on a mounted project', getMountedElement);
  it('should create elements', createElements);
  it('should update elements', updateElements);
  it('should update multiple elements simultaneously including updates to the parent field',
    updateParent);
  it('should handle a re-ordering of _childViews by re-ordering the ownedAttributeIds on the '
    + 'same element', updateChildViewOrder);
  it('should handle a move of a _childView from one element to another by searching for the '
    + 'ownedEnd element referenced by the association element referenced by the _childView element'
    + 'and changing its typeId to point at the new parent of the _childView', childViewRelationship);
  it('should search for elements based on the ids provided in the body of the request',
    putElements);
  it('should delete elements', deleteElements);
  it('should search for elements', searchElements);
  it('should return all mounts', getMounts);
  it('should return all groups', getGroups);
  it('should return all documents', getDocuments);
});

/* --------------------( Tests )-------------------- */
/**
 * @description Verifies that the getElement function successfully finds an element.
 *
 * @param {Function} done - The Mocha callback.
 */
function getElement(done) {
  const elemData = testElements[0];
  const params = {
    projectid: projectID,
    refid: branchID,
    elementid: 'test_elem_001'
  };
  const body = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };
  testUtils.createResponse(res);

  res.send = async function(_data) {
    const elements = _data.elements;
    const element = elements[0];
    chai.expect(element.id).to.equal(elemData.id);
    chai.expect(element.ownerId).to.equal(elemData.parent);
    chai.expect(element._projectId).to.equal(projectID);
    chai.expect(element._refId).to.equal(branchID);
    chai.expect(element._creator).to.equal(adminUser._id);
    chai.expect(element._modifier).to.equal(adminUser._id);
    chai.expect(element._editable).to.equal(true);
    chai.expect(element.ownedAttributeIds).to.have.members([
      'test_oa_elem_003', 'test_oa_elem_004', 'test_oa_elem_005'
    ]);

    done();
  };

  APIController.getElement(req, res, next(req, res));
}

/**
 * @description Verifies that the getElement function successfully finds an element that belongs
 * to a separate project if that project is a mount of the current project.
 *
 * @param {Function} done - The Mocha callback.
 */
function getMountedElement(done) {
  const elemData = testElements[9];
  const params = {
    projectid: projectID,
    refid: branchID,
    elementid: 'test_mount_elem_010'
  };
  const body = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };
  testUtils.createResponse(res);

  res.send = async function(_data) {
    const elements = _data.elements;
    const element = elements[0];
    chai.expect(element.id).to.equal(elemData.id);
    chai.expect(element.ownerId).to.equal(elemData.parent);
    chai.expect(element._projectId).to.equal(mountedProjectData.id);
    chai.expect(element._refId).to.equal(branchID);
    chai.expect(element._creator).to.equal(adminUser._id);
    chai.expect(element._modifier).to.equal(adminUser._id);
    chai.expect(element._editable).to.equal(true);

    done();
  };

  APIController.getElement(req, res, next(req, res));
}

/**
 * @description Verifies that the postElements function successfully creates an element.
 *
 * @param {Function} done - The Mocha callback.
 */
function createElements(done) {
  const elemData = {
    id: 'test_elem_011',
    parent: 'model',
    testing: 'testing'
  };
  const params = {
    projectid: projectID,
    refid: branchID
  };
  const body = { elements: [elemData] };
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };
  testUtils.createResponse(res);

  res.send = async function(_data) {
    const elements = _data.elements;
    const element = elements[0];
    chai.expect(element.id).to.equal(elemData.id);
    chai.expect(element.ownerId).to.equal(elemData.parent);
    chai.expect(element._projectId).to.equal(projectID);
    chai.expect(element._refId).to.equal(branchID);
    chai.expect(element._creator).to.equal(adminUser._id);
    chai.expect(element._modifier).to.equal(adminUser._id);
    chai.expect(element._editable).to.equal(true);
    chai.expect(element.testing).to.equal('testing');

    done();
  };

  APIController.postElements(req, res, next(req, res));
}

/**
 * @description Verifies that the postElements function successfully updates an element.
 *
 * @param {Function} done - The Mocha callback.
 */
function updateElements(done) {
  const elemData = {
    id: 'test_elem_011',
    testing: 'testing update'
  };
  const params = {
    projectid: projectID,
    refid: branchID
  };
  const body = { elements: [elemData] };
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };
  testUtils.createResponse(res);

  res.send = async function(_data) {
    const elements = _data.elements;
    const element = elements[0];
    chai.expect(element.id).to.equal(elemData.id);
    chai.expect(element.ownerId).to.equal('model');
    chai.expect(element._projectId).to.equal(projectID);
    chai.expect(element._refId).to.equal(branchID);
    chai.expect(element._creator).to.equal(adminUser._id);
    chai.expect(element._modifier).to.equal(adminUser._id);
    chai.expect(element._editable).to.equal(true);
    chai.expect(element.testing).to.equal('testing update');

    done();
  };

  APIController.postElements(req, res, next(req, res));
}

/**
 * @description Verifies that the postElements function successfully updates multiple elements
 * simultaneously that include updates to element parents which are normally not permitted to
 * be made in bulk.
 *
 * @param {Function} done - The Mocha callback.
 */
function updateParent(done) {
  const elemData = [
    {
      id: 'test_elem_003',
      parent: 'test_elem_002'
    },
    {
      id: 'test_elem_004',
      parent: 'test_elem_003'
    }];
  const params = {
    projectid: projectID,
    refid: branchID
  };
  const body = { elements: elemData };
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };
  testUtils.createResponse(res);

  res.send = async function(_data) {
    const foundElements = _data.elements;
    chai.expect(foundElements.length).to.equal(2);
    const foundElementsJMI = jmi.convertJMI(1, 2, foundElements, 'id');
    elemData.forEach((elem) => {
      const foundElement = foundElementsJMI[elem.id];
      chai.expect(foundElement.id).to.equal(elem.id);
      chai.expect(foundElement.ownerId).to.equal(elem.parent);
    });

    done();
  };

  APIController.postElements(req, res, next(req, res));
}

/**
 * @description Verifies that the postElements function successfully re-orders the
 * ownedAttributeIds of an element when it gets an update to the order of its
 * _childViews.
 *
 * @param {Function} done - The Mocha callback.
 */
function updateChildViewOrder(done) {
  const params = {
    orgid: org._id,
    projectid: projectID,
    refid: branchID
  };
  const body = {
    elements: [
      {
        id: 'test_elem_001',
        _childViews: [
          {
            id: 'test_typeId_4',
            aggregation: 'test_aggregation_4',
            propertyId: 'test_oa_elem_004'
          },
          {
            id: 'test_typeId_3',
            aggregation: 'test_aggregation_3',
            propertyId: 'test_oa_elem_003'
          },
          {
            id: 'test_typeId_5',
            aggregation: 'test_aggregation_5',
            propertyId: 'test_oa_elem_005'
          }
        ]
      }
    ]
  };
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };
  testUtils.createResponse(res);

  res.send = async function(_data) {
    const updatedElements = _data.elements;
    const updatedElement = updatedElements[0];

    const elements = await ElementController.find(adminUser, org._id, projectID, branchID,
      updatedElement.id);
    const element = elements[0];

    chai.expect(element.custom[namespace].ownedAttributeIds[0]).to.equal('test_oa_elem_004');
    chai.expect(element.custom[namespace].ownedAttributeIds[1]).to.equal('test_oa_elem_003');
    chai.expect(element.custom[namespace].ownedAttributeIds[2]).to.equal('test_oa_elem_005');

    done();
  };

  APIController.postElements(req, res, next(req, res));
}

/**
 * @description When a child view is moved from its current parent to a new parent, there are
 * additional elements that track that relationship, so they must also be modified. This test
 * verifies that the additional modifications are also occurring in the postElements function.
 *
 * @param {Function} done - The Mocha callback.
 */
function childViewRelationship(done) {
  const params = {
    orgid: org._id,
    projectid: projectID,
    refid: branchID
  };
  const body = {
    elements: [
      {
        id: 'test_elem_001',
        _childViews: [
          {
            id: 'test_typeId_4',
            aggregation: 'test_aggregation_4',
            propertyId: 'test_oa_elem_004'
          },
          {
            id: 'test_typeId_5',
            aggregation: 'test_aggregation_5',
            propertyId: 'test_oa_elem_005'
          }
        ]
      },
      {
        id: 'test_elem_002',
        _childViews: [
          {
            id: 'test_typeId_3',
            aggregation: 'test_aggregation_3',
            propertyId: 'test_oa_elem_003'
          }
        ]
      }
    ]
  };
  const method = 'POST';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };
  testUtils.createResponse(res);

  res.send = async function(_data) {
    // Extract elements
    const updatedElements = _data.elements;
    const updatedElemIDs = updatedElements.map((e) => e.id);
    chai.expect(updatedElemIDs).to.have.members(['test_elem_001', 'test_elem_002', 'test_elem_007']);

    const oldParents = await ElementController.find(adminUser, org._id, projectID, branchID, 'test_elem_001');
    const oldParent = oldParents[0];
    oldParent.id = mcfUtils.parseID(oldParent._id).pop();

    const newParents = await ElementController.find(adminUser, org._id, projectID, branchID, 'test_elem_002');
    const newParent = newParents[0];
    newParent.id = mcfUtils.parseID(newParent._id).pop();

    chai.expect(oldParent.custom[namespace].hasOwnProperty('ownedAttributeIds')).to.equal(true);
    chai.expect(oldParent.custom[namespace].ownedAttributeIds).to.have.members(['test_oa_elem_004', 'test_oa_elem_005']);
    chai.expect(oldParent.custom[namespace].ownedAttributeIds).to.not.have.members(['test_oa_elem_003']);

    chai.expect(newParent.custom[namespace].hasOwnProperty('ownedAttributeIds')).to.equal(true);
    chai.expect(newParent.custom[namespace].ownedAttributeIds).to.have.members(['test_oa_elem_003']);

    const cvs = await ElementController.find(adminUser, org._id, projectID, branchID, 'test_oa_elem_003');
    const cv = cvs[0];
    const associationID = cv.custom[namespace].associationId;

    const associations = await ElementController.find(adminUser, org._id, projectID, branchID,
      associationID);
    const association = associations[0];
    const ownedEndID = association.custom[namespace].ownedEndIds;

    const ownedEnds = await ElementController.find(adminUser, org._id, projectID, branchID,
      ownedEndID);
    const ownedEnd = ownedEnds[0];

    chai.expect(ownedEnd.custom[namespace].typeId).to.equal(newParent.id);

    done();
  };

  APIController.postElements(req, res, next(req, res));
}

/**
 * @description Verifies that the putElements function successfully finds elements based on
 * the ids provided in the body of the request.
 *
 * @param {Function} done - The Mocha callback.
 */
function putElements(done) {
  const elemData = testElements.slice(0, 3);
  const params = {
    projectid: projectID,
    refid: branchID
  };
  const body = {
    elements: [
      {
        id: 'test_elem_001'
      },
      {
        id: 'test_elem_002'
      },
      {
        id: 'test_oa_elem_003'
      }
    ]
  };
  const method = 'PUT';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };
  testUtils.createResponse(res);

  res.send = function(_data) {
    const createdElements = jmi.convertJMI(1, 2, _data.elements, 'id');
    elemData.forEach((elem) => {
      const createdElement = createdElements[elem.id];
      chai.expect(createdElement.id).to.equal(elem.id);
      chai.expect(createdElement.ownerId).to.equal(elem.parent);
    });

    done();
  };

  APIController.putElements(req, res, next(req, res));
}

/**
 * @description Verifies that the deleteElements function successfully deletes an element.
 *
 * @param {Function} done - The Mocha callback.
 */
function deleteElements(done) {
  const params = {
    projectid: projectID,
    refid: branchID
  };
  const body = {
    elements: [
      {
        id: 'test_elem_011'
      }
    ]
  };
  const method = 'DELETE';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };
  testUtils.createResponse(res);

  res.send = async function(_data) {
    const elements = _data.elements;
    const foundElements = await ElementController.find(adminUser, org._id, projectID,
      branchID, elements);
    chai.expect(foundElements.length).to.equal(0);

    done();
  };

  APIController.deleteElements(req, res, next(req, res));
}

/**
 * @description Verifies that the putElementSearch function offers limited functionality for
 * interpreting an elasticSearch query from View Editor.  The function is still a work in
 * progress. It will only work for one type of query, but that query appears to be the
 * most common.
 *
 * @param {Function} done - The Mocha callback.
 */
function searchElements(done) {
  const params = {
    projectid: projectID,
    refid: branchID
  };
  const body = {
    query: {
      bool: {
        filter: [
          {
            term: {
              id: 'test_elem_001'
            }
          },
          {
            term: {
              _projectId: projectID
            }
          }
        ]
      }
    }
  };
  const method = 'PUT';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };
  testUtils.createResponse(res);

  res.send = function(_data) {
    const elements = _data.elements;
    const element = elements[0];
    chai.expect(element.id).to.equal('test_elem_001');
    chai.expect(element._projectId).to.equal(projectID);

    done();
  };

  APIController.putElementSearch(req, res, next(req, res));
}

/**
 * @description Verifies that the getMounts function successfully finds the mounted projects of
 * the current project. This is done by first searching for elements of type 'Mount'.
 *
 * @param {Function} done - The Mocha callback.
 */
function getMounts(done) {
  const params = {
    projectid: projectID,
    refid: branchID
  };
  const body = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };
  testUtils.createResponse(res);

  res.send = function(_data) {
    const projects = _data.projects;
    chai.expect(projects.length).to.equal(2);
    const projectIDs = projects.map((p) => p.id);
    chai.expect(projectIDs).to.have.members([projectID, mountedProjectData.id]);

    done();
  };

  APIController.getMounts(req, res, next(req, res));
}

/**
 * @description Verifies that the getGroups function successfully finds elements that have the
 * property "_isGroup" set to "true".
 *
 * @param {Function} done - The Mocha callback.
 */
function getGroups(done) {
  const elemData = testElements[7];
  const params = {
    projectid: projectID,
    refid: branchID
  };
  const body = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };
  testUtils.createResponse(res);

  res.send = function(_data) {
    const elements = _data.groups;
    const element = elements[0];
    chai.expect(element.id).to.equal(elemData.id);
    chai.expect(element._isGroup).to.equal('true');

    done();
  };

  APIController.getGroups(req, res, next(req, res));
}

/**
 * @description Verifies that the getDocuments function successfully returns all elements that
 * have the document stereotype id _17_0_2_3_87b0275_1371477871400_792964_43374 included in
 * their _appliedStereotypeIds field.
 *
 * @param {Function} done - The Mocha callback.
 */
function getDocuments(done) {
  const elemData = testElements.slice(0, 2);
  const params = {
    projectid: projectID,
    refid: branchID
  };
  const body = {};
  const method = 'GET';
  const req = testUtils.createRequest(adminUser, params, body, method);
  const res = {
    locals: {}
  };
  testUtils.createResponse(res);

  res.send = function(_data) {
    const foundElements = _data.documents;
    chai.expect(foundElements.length).to.equal(2);
    const foundElementsJMI = jmi.convertJMI(1, 2, foundElements, 'id');
    elemData.forEach((elem) => {
      const foundElement = foundElementsJMI[elem.id];
      chai.expect(foundElement.id).to.equal(elem.id);
      chai.expect(foundElement._appliedStereotypeIds).to.equal(sjm.documentStereotypeID);
      chai.expect(foundElement.hasOwnProperty('_childViews')).to.equal(true);
      chai.expect(foundElement.hasOwnProperty('ownedAttributeIds')).to.equal(true);
    });

    done();
  };

  APIController.getDocuments(req, res, next(req, res));
}
