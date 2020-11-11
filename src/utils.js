/**
 * @classification UNCLASSIFIED
 *
 * @module src.utils
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
 * @author Leah De Laurell
 * @author Austin Bieber
 *
 * @description Defines and exports utility functions used throughout the
 * plugin.
 */

// NPM modules
const nodemailer = require('nodemailer');
const { exec } = require('child_process');

// MBEE modules
const Project = M.require('models.project');
const Element = M.require('models.element');
const mcfUtils = M.require('lib.utils');

// Adapter modules
const sjm = require('./sjm.js');

// Variable that defines the
const customDataNamespace = 'CameoMDK';

/**
 * @description Retrieves an AdapterSession object from the database, based on
 * the username of the user in the request object. If an AdapterSession is
 * found, the request parameter "orgid" is set equal to the session's org. This
 * is done as a workaround to MMS3 endpoints not containing the org ID. Modifies
 * the request object by reference.
 * @async
 *
 * @param {object} req - The request object.
 * @param {object} req.user - The requesting user's information.
 * @param {string} req.user._id - The username of the requesting user, used to
 * lookup the AdapterSession document.
 */
async function getOrgId(req) {
  const projects = await Project.find({});

  const projectID = projects
  .filter(p => p._id.endsWith(`${mcfUtils.ID_DELIMITER}${req.params.projectid}`))
  .map(p => p._id);

  if (projectID.length > 1) {
    throw new M.ServerError('Multiple projects with the same ID exist. Please'
      + 'contact your local administrator.', 'error');
  }
  else if (projectID.length === 0) {
    throw new M.NotFoundError(`The project ${req.params.projectid} was not found.`);
  }

  // Modify the requesting object
  req.params.orgid = mcfUtils.parseID(projectID[0])[0];
}

/**
 * @description Adds headers which VE and MDK expect to the request and response
 * objects. Modifies each object by reference.
 *
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {Function} next - A callback function to move onto the next middleware
 * function.
 */
function addHeaders(req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
}

/**
 * @description Checks the request query for the key alf_ticket, and if it
 * exists, it removes the ticket and adds an auth header for token auth.
 *
 * @param {object} req - The request object to parse/modify.
 * @param {object} res - THe response object.
 * @param {Function} next - The callback function to call after completion of
 * the function.
 */
function handleTicket(req, res, next) {
  if (req.query.alf_ticket) {
    // Parse token from URI encoding
    const token = decodeURIComponent(req.query.alf_ticket);

    req.headers.authorization = `Bearer ${token}`;
  }
  next();
}

/**
 * @description Decodes the token from the request parameters and adds it into an
 * auth header.
 *
 * @param {object} req - The request object.
 * @param {object} res - THe response object.
 * @param {Function} next - The callback function to call after completion of
 * the function.
 */
function formatTicketRequest(req, res, next) {
  // Parse token from URI encoding
  const token = decodeURIComponent(req.params[0]);

  req.headers.authorization = `Bearer ${token}`;
  next();
}

/**
 * @description A synchronous forEach function for general usage. For each item in the iterable
 * provided, this function will run the callback synchronously.
 *
 * @param {Array} array - The array of iterables.
 * @param {Function} callback - The function to run on each iterable.
 */
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    // eslint-disable-next-line no-await-in-loop
    await callback(array[index], index, array);
  }
}

/**
 * @description This replicates a functionality of MMS by searching for, creating, and adding child
 * views to the specified elements. Certain elements, including document and view elements, are
 * expected by View Editor to have a field called _childViews containing an array of objects that
 * have an id, aggregation, and propertyId. These child views are calculated by searching for the
 * elements specified in the ownedAttributeIds field of the original element. These ownedAttribute
 * elements are then converted into child views by taking the typeId as the id, the aggregation as
 * the aggregation, and the id as the typeId.
 *
 * @param {object} reqUser - The requesting user.
 * @param {string} orgID - The id of the organization to search on.
 * @param {string} projID - The id of the project to search on.
 * @param {string} branchID - The id of the branch/ref to search on.
 * @param {object[]} elements - The elements to generate child views for.
 */
async function generateChildViews(reqUser, orgID, projID, branchID, elements) {
  const docStereotype = sjm.documentStereotypeID;
  const viewStereotype = sjm.viewStereotypeID;

  const ownedAttributesToFind = [];

  // Make list of ids to find
  elements.forEach((elem) => {
    // If element has an applied stereotype of View or Document
    if (elem.custom[customDataNamespace] && elem.custom[customDataNamespace]._appliedStereotypeIds
      && (elem.custom[customDataNamespace]._appliedStereotypeIds.includes(viewStereotype)
      || elem.custom[customDataNamespace]._appliedStereotypeIds.includes(docStereotype))
      && elem.custom[customDataNamespace].hasOwnProperty('ownedAttributeIds')) {
      // Initialize childViews on the element
      elem.custom[customDataNamespace]._childViews = [];

      // Add ownedAttributeIDs to find (generate the full _id from the id in the same step)
      ownedAttributesToFind
      .push(...(elem.custom[customDataNamespace].ownedAttributeIds
      .map((id) => mcfUtils.createID(orgID, projID, branchID, id))
      ));
    }
  });

  // Find the ownedAttribute elements in a single batch request
  const oaElems = await Element.find({ _id: { $in: ownedAttributesToFind } });

  // Create the child views
  const childViews = {};
  oaElems.forEach((e) => {
    const id = mcfUtils.parseID(e._id).pop();
    if (!childViews.hasOwnProperty(id)) {
      childViews[id] = {
        id: e.custom[customDataNamespace].typeId,
        aggregation: e.custom[customDataNamespace].aggregation,
        propertyId: id
      };
    }
  });

  // Add the child views to their respective elements
  elements.forEach((elem) => {
    if (elem.custom[customDataNamespace] && elem.custom[customDataNamespace].hasOwnProperty('_childViews')) {
      elem.custom[customDataNamespace].ownedAttributeIds.forEach((id) => {
        if (childViews.hasOwnProperty(id)) {
          elem.custom[customDataNamespace]._childViews.push(childViews[id]);
        }
      });
    }
  });
}

/**
 * @description Generate PDF file based on HTML file.
 *
 * @param {string} fullHtmlFilePath - String path of the html file.
 * @param {string} fullPdfFilePath - String path of the generated pdf file.
 */
async function convertHtml2Pdf(fullHtmlFilePath, fullPdfFilePath) {
  const config = M.config.server.plugins.plugins['mms3-adapter'];
  const execCmd = config.pdf.exec;

  // Generate the conversion command
  const command = `${execCmd} ${fullHtmlFilePath} -o ${fullPdfFilePath} --insecure`;

  // Execute and log command
  M.log.info(`Executing... ${command}`);
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        M.log.error(stdout.toString());
        M.log.error(stderr.toString());
        return reject(`exec error: ${err}`);
      }
      return resolve();
    });
  });
}

/**
 * @description Emails user with an url link.
 *
 * @param {string} userEmail - The requesting user's email.
 * @param {string} link - The URL link to be included in the email.
 */
async function emailBlobLink(userEmail, link) {
  try {
    // Get adapter configuration
    const config = M.config.server.plugins.plugins['mms3-adapter'];

    // Create mail transporter
    const transporter = nodemailer.createTransport({
      host: config.emailServerUrl,
      port: config.emailServerPort,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });

    // Hard code user message
    const message = 'HTML to .PDF generation succeeded.\n\n'
      + `You can access the .PDF file at: ${link}`;

    // Create the transporter and send the email
    await transporter.sendMail({
      from: ` "mbee support" <${config.supportEmail}>`, // sender address
      to: userEmail,
      subject: 'HTML to .pdf generation completed.',           // Subject line
      text: message                                            // plain text body
    });

    // Log user email
    M.log.info(`Emailed user: ${userEmail}.`);
  }
  catch (error) {
    M.log.warn(error);
    throw new M.ServerError('Failed to send user email.', 'error');
  }
}

/**
 * @description Translates an ElasticSearch query into a MongoDB query.
 *
 * @param {Object} query - The ElasticSearch query.
 * @returns MongoDB query.
 */
function translateElasticSearchQuery(query) {
  console.log('Initial ES query')
  console.log(query)
  // Initialize MongoDB query object
  let q = {};

  // Check for filter
  if (query.bool && query.bool.filter) {
    // Easiest scenario: filtering for a single element
    if (query.bool.filter[0].term && query.bool.filter[0].term.id) {
      q = {
        _id: new RegExp(query.bool.filter[0].term.id),
        project: new RegExp(query.bool.filter[1].term._projectId)
      };
      console.log('filter query')
      console.log(q)
    }
    // Otherwise, process the filter
    else if (query.bool.filter) {

    }
  }

  // TODO: handle the project metatypes query

  // There are 5 options unless it's an advanced search:
  // "all"                    bool: { should: [ { term: { id: { value: VALUE } } }, { multi_match: { query: VALUE, fields: FIELDS } } }
  // "name or documentation"  match: { [name or documentation]: { query: VALUE } }
  // "id"                     term: { id: VALUE }
  // "values"                 multi_match: { query: VALUE, fields: FIELDS }
  // "metatypes"              bool: { should: [ { terms: { _appliedStereotypeIds: VALUE_1 } }, { terms: { type: VALUE_2 } } ], minimum_should_match: 1 }
  // *** If it's an advanced search, it will look like this:
  // AND:                     bool: { must: [ CLAUSE_1, CLAUSE_2 ] }
  // OR:                      bool: { should: [ CLAUSE_1, CLAUSE_2 ], minimum_should_match: 1 }
  // AND NOT:                 bool: { must: [ CLAUSE_1, { bool: { must_not: CLAUSE_2 } } ] }
  if (query.bool) {
    // Test whether it's an AND or AND NOT
    if (query.bool.must) {
      if (Array.isArray(query.bool.must)) {
        // Test if AND
        if (!(query.bool.must[1].bool && query.bool.must[1].bool.must_not)) {
          const q1 = translateElasticSearchQuery(query.bool.must[0]);
          const q2 = translateElasticSearchQuery(query.bool.must[1]);
          q = {
            ...q,
            ...q1,
            ...q2
          };
          return q;
        }
        // Test if AND NOT
        else if (query.bool.must[1].bool && query.bool.must[1].bool.must_not) {
          const q1 = translateElasticSearchQuery(query.bool.must[0]);
          const q2 = translateElasticSearchQuery(query.bool.must[1].bool.must_not);
          q = {
            ...q,
            ...q1,
            '$nin': { ...q2 }
          };
          return q;
        }
      }
      // otherwise it would be query.bool.must.bool; just start translating from there
      else {
        const q1 = translateElasticSearchQuery(query.bool.must);
        q = {
          ...q,
          ...q1
        };
        return q;
      }
    }
    // Test if it's an OR
    else if (query.bool.should
      && !(Array.isArray(query.bool.should) && ((query.bool.should[0].term && query.bool.should[1].multi_match) || (query.bool.should[0].terms && query.bool.should[1].terms)))) {
      // Test if array
      console.log('OR')
      if (Array.isArray(query.bool.should) && !((query.bool.should[0].term && query.bool.should[1].multi_match) || (query.bool.should[0].terms && query.bool.should[1].terms))) {
        console.log('OR array')
        const q1 = translateElasticSearchQuery(query.bool.should[0]);
        const q2 = translateElasticSearchQuery(query.bool.should[1]);
        q = {
          ...q,
          '$or': [...q1, ...q2]
        };
        return q;
      }
      // run query on value if not an array
      else {
        console.log('OR object')
        const q1 = translateElasticSearchQuery(query.bool.should);
        q = {
          ...q,
          ...q1
        };
        return q
      }
    }
    // Treat it like a normal query
    else {
      console.log('normal query')
      // Determine if "all" or "metatypes" query
      if (query.bool.should) {
        // All scenario
        if ((query.bool.should[0].term.id || query.bool.should[0].term.id) && query.bool.should[1].multi_match) {
          const searchTerm = query.bool.should[0].id && query.bool.should[0].id.value
            ? query.bool.should[0].id.value
            : query.bool.should[0].term.id.value;
          // TODO: determine if different fields can be given different weights with MongoDB
          q = {
            ...q,
            '$or': [
            { _id: searchTerm },
            { name: searchTerm },
            { documentation: searchTerm },
            { [`custom[${customDataNamespace}].defaultValue`]: searchTerm },
            { [`custom[${customDataNamespace}].value`]: searchTerm },
            { [`custom[${customDataNamespace}].specification`]: searchTerm }
          ]};
          return q;
        }
        // Metatypes scenario
        else if (query.bool.should[0].terms && query.bool.should[1].terms) {
          const searchTerm1 = query.bool.should[0].terms._appliedStereotypeIds;
          const searchTerm2 = query.bool.should[1].terms.type;
          q = {
            ...q,
            '$or': [
              { [`custom[${customDataNamespace}]._appliedStereotypeIds`]: searchTerm1 },
              { type: searchTerm2 }
          ]};
          return q;
        }
      }
      // Determine if "name" or "documentation" query
      else if (query.match) {
        let searchTerm;
        if (query.match.name) {
          searchTerm = query.match.name;
          q = {
            ...q,
            name: searchTerm
          };
          return q;
        }
        else if (query.match.documentation) {
          searchTerm = query.match.documentation;
          q = {
            ...q,
            documentation: searchTerm
          };
          return q;
        }
      }
      // Determine if "id" query
      else if (query.term) {
        const searchTerm = query.term.id;
        q = {
          ...q,
          _id: searchTerm
        };
        return q;
      }
      // Determine if "values" query
      else if (query.multi_match) {
        const searchTerm = query.multi_match.query;
        q = {
          ...q,
          '$or': [
          { [`custom[${customDataNamespace}].defaultValue`]: searchTerm },
          { [`custom[${customDataNamespace}].value`]: searchTerm },
          { [`custom[${customDataNamespace}].specification`]: searchTerm }
        ]};
        return q;
      }
    }
  }

  return q;
}

/**
 * @description
 *
 * @param query
 */
async function viewEditorMetatypesQuery(query){
  let eQ = {};
  let sQ = {};

  let elemField;
  let elemFieldSize;
  let elemProjId;
  let elemRefId;
  let elemStereotypeFilter;
  let elemTypeFilter;

  let stereotypeField;
  let stereotypeFieldSize;
  let stereotypeProjId;
  let stereotypeRefId;
  let stereotypeExistsField;
  let stereotypeStereotypeFilter;
  let stereotypeTypeFilter;

  if (query.elements) {
    // ----- Handle the aggs field ----- //
    if (query.elements.aggs) {
      // ----- These variables determine which field to run the aggregate on, and how many results to return ---- //
      if (query.elements.aggs.types && query.elements.aggs.types.terms && query.elements.aggs.types.terms.field) {
        elemField = query.elements.aggs.types.terms.field;
        elemFieldSize = query.elements.aggs.types.terms.size
      }
    }

    // ----- Handle the filters ----- //
    if (query.elements.filter && query.elements.filter.bool) {
      // ----- These variables will store values that the query MUST match ----- //
      if (query.elements.filter.bool.must) {
        elemProjId = query.elements.filter.bool.must[0].term._projectId;
        elemRefId = query.elements.filter.bool.must[1].term._refId;
      }
      // ----- These variables will store values that the query MUST NOT match ----- //
      if (query.elements.filter.bool.must_not) {
        elemStereotypeFilter = query.elements.filter.bool.must_not[0].terms._appliedStereotypeIds;
        elemTypeFilter = query.elements.filter.bool.must_not[1].terms.type;
      }
    }
  }
  if (query.stereotypedElements) {
    // ----- Handle the aggs field ----- //
    if (query.stereotypedElements.aggs) {
      // ----- These variables determine which field to run the aggregate on, and how many results to return ---- //
      if (query.stereotypedElements.aggs.stereotypeIds && query.stereotypedElements.aggs.stereotypeIds.terms) {
        stereotypeField = query.stereotypedElements.aggs.stereotypeIds.terms.field;
        stereotypeFieldSize = query.stereotypedElements.aggs.stereotypeIds.terms.size
      }
    }

    // ----- Handle the filters ----- //
    if (query.stereotypedElements.filter && query.stereotypedElements.filter.bool) {
      // ----- These variables will store values that the query MUST match ----- //
      if (query.stereotypedElements.filter.bool.must) {
        stereotypeProjId = query.stereotypedElements.filter.bool.must[0].term._projectId;
        stereotypeRefId = query.stereotypedElements.filter.bool.must[1].term._refId;
        stereotypeExistsField = query.stereotypedElements.filter.bool.must[2].exists.field;
      }
      // ----- These variables will store values that the query MUST NOT match ----- //
      if (query.stereotypedElements.filter.bool.must_not) {
        stereotypeStereotypeFilter = query.stereotypedElements.filter.bool.must_not[0].terms._appliedStereotypeIds;
        stereotypeTypeFilter = query.stereotypedElements.filter.bool.must_not[1].terms.type;
      }
    }
  }

  // Note - the elemField should be 'type' and the elemFieldSize should be 20
  // Construct a query that will take the top 20 types among elements on a certain project, excluding elements
  //  that match the values
  eQ = {
    project: new RegExp(elemProjId),
    branch: new RegExp(elemRefId),
    type: {
      '$nin': elemTypeFilter
    },
    [`custom[${customDataNamespace}]._appliedStereotypeIds`]: {
      '$nin': elemStereotypeFilter
    }
  };

  sQ = {
    project: new RegExp(stereotypeProjId),
    branch: new RegExp(stereotypeRefId),
    type: {
      '$nin': stereotypeTypeFilter
    },
    [`custom[${customDataNamespace}]._appliedStereotypeIds`]: { '$exists': true, '$nin': stereotypeStereotypeFilter }
  };


  const elemMatchResults = await Element.find(eQ);
  const elemTypes = {};
  for (let i = 0; i < elemMatchResults.length; i++) {
    if (elemMatchResults[i].type !== '') {
      elemTypes[elemMatchResults[i].type] = elemTypes[elemMatchResults[i].type]
        ? elemTypes[elemMatchResults[i].type] + 1
        : 1;
    }
  }

  const elemBuckets = [];
  for (let i = 0; i < 20; i++) {
    const maxVal = Math.max(...Object.values(elemTypes));
    const type = Object.keys(elemTypes)[Object.values(elemTypes).indexOf(maxVal)];
    elemBuckets.push({ key: type, doc_count: maxVal });
    delete elemTypes[type];
  }

  const stereotypeMatchResults = await Element.find(sQ);
  const stereoTypes = {};
  for (let i = 0; i < stereotypeMatchResults.length; i++) {
    console.log(stereotypeMatchResults[i])
    for (let j = 0; j < stereotypeMatchResults[i].custom[customDataNamespace]._appliedStereotypeIds.length; j++) {
      stereoTypes[stereotypeMatchResults[i].custom[customDataNamespace]._appliedStereotypeIds[j]] = stereoTypes[stereotypeMatchResults[i].custom[customDataNamespace]._appliedStereotypeIds[j]]
        ? stereoTypes[stereotypeMatchResults[i].custom[customDataNamespace]._appliedStereotypeIds[j]] + 1
        : 1;
    }
  }
  console.log(stereoTypes)
  const stereoBuckets = [];
  for (let i = 0; i < 20; i++) {
    const maxVal = Math.max(...Object.values(stereoTypes));
    const _stereotypeId = Object.keys(stereoTypes)[Object.values(stereoTypes).indexOf(maxVal)];
    stereoBuckets.push({ key: _stereotypeId, doc_count: maxVal });
    delete stereoTypes[_stereotypeId];
  }


  return {
    aggregations: {
      elements: {
        types: {
          buckets: elemBuckets
        }
      },
      stereotypedElements: {
        stereotypeIds: {
          buckets: stereoBuckets
        }
      }
    }
  };
}

// Export the module
module.exports = {
  getOrgId,
  addHeaders,
  handleTicket,
  formatTicketRequest,
  asyncForEach,
  generateChildViews,
  customDataNamespace,
  convertHtml2Pdf,
  emailBlobLink,
  translateElasticSearchQuery,
  viewEditorMetatypesQuery
};
