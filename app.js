/**
 * @classification UNCLASSIFIED
 *
 * @module app
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
 * @author Austin Bieber
 * @author Leah De Laurell
 *
 * @description The application entry point for the MMS3 Adapter. Handles router
 * initialization and all routing.
 */

// NPM modules
const express = require('express');
const app = express();
const router = express.Router();

// MBEE modules
const { authenticate, doLogin } = M.require('lib.auth');
const { logRoute, logResponse, respond, disableUserAPI } = M.require('lib.middleware');
const { version, login, whoami, getUsers } = M.require('controllers.api-controller');

// Adapter modules
const APIController = require('./src/api-controller');
const CommitController = require('./src/commit-controller');
const utils = require('./src/utils.js');

// We do this because MDK automatically appends '/alfresco/service' to the base MMS url.
// It's simpler to add this here than to have to modify MDK
app.use('/alfresco/service', router);

/**
 * @swagger
 * /api/login:
 *   post:
 *     tags:
 *       - general
 *     description: Authenticates a user using the MCF auth module and returns
 *        a response containing a session token.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 *   options:
 *     tags:
 *       - general
 *     description: Returns a response containing headers which specify the
 *        allowed headers for POST.
 *     responses:
 *       200:
 *         description: OK
 */
router.route('/api/login')
.post(
  authenticate,
  logRoute,
  doLogin,
  utils.addHeaders,
  APIController.postLogin,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /api/login/ticket:
 *   post:
 *     tags:
 *       - general
 *     description: Authenticates a user using the MCF auth module and returns
 *        a response containing a bearer token.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 *   options:
 *     tags:
 *       - general
 *     description: Returns a response containing headers which specify the
 *        allowed headers for POST.
 *     responses:
 *       200:
 *         description: OK
 */
router.route('/api/login/ticket')
.post(
  authenticate,
  logRoute,
  doLogin,
  utils.addHeaders,
  login,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);


/**
 * @swagger
 * /mms/login/ticket/*:
 *   get:
 *     tags:
 *       - general
 *     description: Verifies a token is valid through the MCF auth module and
 *        returns the user's username if successful.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.route('/mms/login/ticket/*')
.get(
  utils.formatTicketRequest,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.getTicket,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /api/version:
 *   get:
 *     tags:
 *       - general
 *     description: Returns the application version as JSON.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK, Succeeded to get version.
 *       401:
 *         description: Unauthorized, Failed to get version due to not being
 *                      logged in.
 *       500:
 *         description: Internal Server Error, Failed to get version due to
 *                      server side issue.
 */
router.route('/api/version')
.get(
  authenticate,
  logRoute,
  utils.addHeaders,
  version,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /api/users/whoami:
 *   get:
 *     tags:
 *       - users
 *     description: Returns the currently logged in user's public information.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: minified
 *         description: If true, the returned JSON is minified. If false, the
 *                      returned JSON is formatted based on the format specified
 *                      in the config. The default value is false.
 *         in: query
 *         type: boolean
 *         default: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET current user information and returns
 *                      user public data.
 *       401:
 *         description: Unauthorized, Failed to GET user information due to not
 *                      being logged in.
 *       403:
 *         description: Forbidden, Failed to GET user information due to not
 *                      having permissions.
 *       404:
 *         description: Not Found, Failed to GET current user information due to
 *                      not finding user.
 *       500:
 *         description: Internal Server Error, Failed to GET user info due to
 *                      server side issue.
 */
router.route('/api/users/whoami')
.get(
  authenticate,
  logRoute,
  utils.addHeaders,
  whoami,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /api/users/{username}:
 *   get:
 *     tags:
 *       - users
 *     description: Finds and returns a users public data.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: username
 *         description: The username of the user to find.
 *         required: true
 *         type: string
 *         in: path
 *       - name: populate
 *         description: Comma separated list of values to be populated on return
 *                      of the object. [archivedBy, lastModifiedBy, createdBy]
 *         in: query
 *         type: string
 *         required: false
 *       - name: archived
 *         description: If true, archived objects will be also be searched
 *                      through.
 *         in: query
 *         type: boolean
 *       - name: fields
 *         description: Comma separated list of specific fields to return. By
 *                      default the username field is returned. To specifically
 *                      NOT include a field, include a '-' in front of the field
 *                      (-name). [admin, archived, archivedBy, archivedOn,
 *                      createdBy, createdOn, custom, email, fname,
 *                      lastModifiedBy, lname, username, preferredName,
 *                      updatedOn]
 *         in: query
 *         type: string
 *       - name: minified
 *         description: If true, the returned JSON is minified. If false, the
 *                      returned JSON is formatted based on the format specified
 *                      in the config. The default value is false.
 *         in: query
 *         type: boolean
 *         default: false
 *     responses:
 *       200:
 *         description: OK, Succeeded to GET user, returns user's public data.
 *       400:
 *         description: Bad Request, Failed to GET user due to invalid data.
 *       401:
 *         description: Unauthorized, Failed to GET user due to not being logged
 *                      in.
 *       403:
 *         description: Forbidden, Failed to GET user due to not having
 *                      permissions.
 *       404:
 *         description: Not Found, Failed to GET user due to user not existing.
 *       500:
 *         description: Internal Server Error, Failed to GET user due to server
 *                      side issue.
 */
router.route('/api/users/:username')
.get(
  authenticate,
  logRoute,
  disableUserAPI,
  utils.addHeaders,
  getUsers,
  (req, res, next) => {
    // Put the message into object format
    const users = JSON.parse(res.locals.message);
    const user = users[0];
    res.locals.message = JSON.stringify(user);
    next();
  },
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

// TODO: Document this route. Seems to only be used by View Editor
router.route('/connection/jms')
.get(
  utils.addHeaders,
  (req, res, next) => {
    res.status(200).send();
  }
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /orgs:
 *   get:
 *     tags:
 *       - organizations
 *     description: Finds and returns an array of organizations which the
 *        requesting user has at least read access on. Returns the organizations
 *        formatted for the MMS3 API.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.route('/orgs')
.get(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.getOrgs,
  logResponse,
  respond
)
.post(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.postOrgs,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /orgs/{orgid}:
 *   get:
 *     tags:
 *       - organizations
 *     description: Finds and returns an array containing a single organization.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.route('/orgs/:orgid')
.get(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.getOrg,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /orgs/{orgid}/projects:
 *   get:
 *     tags:
 *       - projects
 *     description: Finds and returns an array of projects under the specified
 *        org which the requesting user has at least read access on. Returns the
 *        projects formatted for the MMS3 API.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: orgid
 *         description: The ID of the organization which contains the searched
 *                      projects.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.route('/orgs/:orgid/projects')
.get(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.getProjects,
  logResponse,
  respond
)
.post(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.postProjects,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /projects:
 *   get:
 *     tags:
 *       - projects
 *     description: Finds and returns an array containing all projects the user
 *        has at least read access on. Returns the projects formatted for the
 *        MMS3 API.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.route('/projects')
.get(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.getAllProjects,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /projects/{projectid}:
 *   get:
 *     tags:
 *       - projects
 *     description: Finds and returns an array containing a single project
 *        object. Returns the project formatted for the MMS3 API.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project to find.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.route('/projects/:projectid')
.get(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.getProject,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /projects/{projectid}/refs:
 *   get:
 *     tags:
 *       - branches
 *     description: Finds and returns an array of branches under the specified
 *        project. Returns the branches (refs) formatted for the MMS3 API.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project which contains the searched
 *                      branches/refs.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *   post:
 *     tags:
 *       - branches
 *     description: Creates multiple branches under the specified project.
 *        Returns the branches (refs) formatted for the MMS3 API.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project which contains the searched
 *                      branches/refs.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.route('/projects/:projectid/refs')
.get(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.getRefs,
  logResponse,
  respond
)
.post(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.postRefs,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /projects/{projectid}/refs/{refid}:
 *   get:
 *     tags:
 *       - branches
 *     description: Finds and returns a single branch from the refid provided in
 *        the request params. Returns the branch (ref) formatted for the MMS3
 *        API.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project which contains the searched
 *                      branch/ref.
 *         in: path
 *         required: true
 *         type: string
 *       - name: refid
 *         description: The ID of the ref to find.
 *         in: path
 *         required: true
 *         type: string
 *       - name: alf_ticket
 *         description: A token passed in the query, used for authorization.
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.route('/projects/:projectid/refs/:refid')
.get(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.getRef,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /projects/{projectid}/refs/{refid}/mounts:
 *   get:
 *     tags:
 *       - elements
 *       - projects
 *     description: Finds all elements of type "Mount" and looks for the project referenced
 *                  in their "mountedElementProjectId" field. Finds all projects referenced by all
 *                  "Mount" elements and returns the found projects.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project which contains the searched
 *                      branch/ref.
 *         in: path
 *         required: true
 *         type: string
 *       - name: refid
 *         description: The ID of the ref to find.
 *         in: path
 *         required: true
 *         type: string
 *       - name: alf_ticket
 *         description: A token passed in the query, used for authorization.
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.route('/projects/:projectid/refs/:refid/mounts')
.get(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.getMounts,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /projects/{projectid}/refs/{refid}/groups:
 *   get:
 *     tags:
 *       - elements
 *     description: Finds all elements that have a field "_isGroup" with the value of true.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project which contains the searched
 *                      branch/ref.
 *         in: path
 *         required: true
 *         type: string
 *       - name: refid
 *         description: The ID of the ref to find.
 *         in: path
 *         required: true
 *         type: string
 *       - name: alf_ticket
 *         description: A token passed in the query, used for authorization.
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.route('/projects/:projectid/refs/:refid/groups')
.get(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.getGroups,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /projects/{projectid}/refs/{refid}/elements/{elementid}/commits:
 *   get:
 *     tags:
 *       - elements
 *       - projects
 *     description: Finds all commits for a given element.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project which contains the searched
 *                      branch/ref.
 *         in: path
 *         required: true
 *         type: string
 *       - name: refid
 *         description: The ID of the ref to find.
 *         in: path
 *         required: true
 *         type: string
 *       - name: elementid
 *         description: The ID of the searched element.
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *   
 */
router.route('/projects/:projectid/refs/:refid/elements/:elementid/commits')
.get(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.getElementCommits,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /projects/{projectid}/refs/{refid}/elements:
 *   post:
 *     tags:
 *       - elements
 *     description: Creates or replaces elements
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project which contains the branch/ref.
 *         in: path
 *         required: true
 *         type: string
 *       - name: refid
 *         description: The ID of the ref to post elements to.
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         in: body
 *         description: An array of objects containing new element data.
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               documentation:
 *                  type: string
 *               type:
 *                 type: string
 *       - name: alf_ticket
 *         description: A token passed in the query, used for authorization.
 *         in: query
 *         required: false
 *         type: string
 *   put:
 *     tags:
 *       - elements
 *     description: Rather than create or replace, as would be expected from a PUT request,
 *                   this request actually functions as a search. The body of the request
 *                   contains ids of elements, which are searched for and returned.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project which contains the branch/ref.
 *         in: path
 *         required: true
 *         type: string
 *       - name: refid
 *         description: The ID of the ref to search on.
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         in: body
 *         description: An array of objects containing element ids to search for.
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *       - name: alf_ticket
 *         description: A token passed in the query, used for authorization.
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *   delete:
 *     tags:
 *       - elements
 *     description: Deletes the specified elements
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project which contains the branch/ref.
 *         in: path
 *         required: true
 *         type: string
 *       - name: refid
 *         description: The ID of the ref to delete elements on.
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         in: body
 *         description: An array of objects containing element ids to delete.
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *       - name: alf_ticket
 *         description: A token passed in the query, used for authorization.
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.route('/projects/:projectid/refs/:refid/elements')
.post(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.postElements,
  logResponse,
  respond
)
.put(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.putElements,
  logResponse,
  respond
)
.delete(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.deleteElements,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /projects/{projectid}/refs/{refid}/search:
 *   put:
 *     tags:
 *       - elements
 *     description: Rather than create or replace, as would be expected from a PUT request,
 *                   this request actually functions as a search. The body of the request
 *                   contains ids of elements, which are searched for and returned.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project which contains the branch/ref.
 *         in: path
 *         required: true
 *         type: string
 *       - name: refid
 *         description: The ID of the ref to search on.
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         in: body
 *         description: An array of objects containing element ids to search for.
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *       - name: alf_ticket
 *         description: A token passed in the query, used for authorization.
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *
 */
router.route('/projects/:projectid/refs/:refid/search')
.put(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.putElementSearch,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /projects/{projectid}/refs/{refid}/elements/{elementid}:
 *   get:
 *     tags:
 *       - elements
 *     description: Finds and returns a single element under the specified
 *        project and ref (branch). Returns the element formatted for the MMS3
 *        API.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project containing the specified ref
 *            (branch).
 *         in: path
 *         required: true
 *         type: string
 *       - name: refid
 *         description: The ID of the ref (branch) containing the specified
 *            element.
 *         in: path
 *         required: true
 *         type: string
 *       - name: elementid
 *         description: The ID of the searched element.
 *         in: path
 *         required: true
 *         type: string
 *       - name: alf_ticket
 *         description: A token passed in the query, used for authorization.
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.route('/projects/:projectid/refs/:refid/elements/:elementid')
.get(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.getElement,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /projects/{projectid}/refs/{refid}/elements/{elementid}/cfids:
 *   get:
 *     tags:
 *       - elements
 *     description: The functionality of this endpoint is still a work in progress.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project containing the specified ref/branch.
 *         in: path
 *         required: true
 *         type: string
 *       - name: refid
 *         description: The ID of the ref/branch to search on.
 *         in: path
 *         required: true
 *         type: string
 *       - name: alf_ticket
 *         description: A token passed in the query, used for authorization.
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Returns an empty array. This is the only response returned at the moment.
 *       500:
 *         description: Internal Server Error
 */
router.route('/projects/:projectid/refs/:refid/elements/:elementid/cfids')
.get(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.getElementCfids,
  logResponse,
  respond
);

/**
 * @swagger
 * /projects/{projectid}/refs/{refid}/documents:
 *   get:
 *     tags:
 *       - elements
 *     description: Returns all documents on a specified branch. Searches for all elements that
 *                  have the field "_appliedStereotypeIds" which contain the id
 *                  "_17_0_2_3_87b0275_1371477871400_792964_43374". Returns all elements that
 *                  meet the search criteria.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project containing the specified ref/branch.
 *         in: path
 *         required: true
 *         type: string
 *       - name: refid
 *         description: The ID of the ref/branch to search on.
 *         in: path
 *         required: true
 *         type: string
 *       - name: alf_ticket
 *         description: A token passed in the query, used for authorization.
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.route('/projects/:projectid/refs/:refid/documents')
.get(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.getDocuments,
  logResponse,
  respond
);

/**
 * @swagger
 * /projects/{projectid}/refs/{refid}/commits:
 *   get:
 *     tags:
 *       - commits
 *     description: The functionality of this endpoint is still a work in progress.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project containing the specified ref/branch.
 *         in: path
 *         required: true
 *         type: string
 *       - name: refid
 *         description: The ID of the ref/branch to search on.
 *         in: path
 *         required: true
 *         type: string
 *       - name: alf_ticket
 *         description: A token passed in the query, used for authorization.
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Returns an empty array. This is the only response returned at the moment.
 *       500:
 *         description: Internal Server Error
 */
router.route('/projects/:projectid/refs/:refid/commits')
.get(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.getCommits,
  logResponse,
  respond
);

/**
 * @swagger
 * /projects/{projectid}/refs/{refid}/artifacts:
 *   post:
 *     tags:
 *       - artifacts
 *     description: Posts artifact blobs to the MCF storage directory and creates artifact
 *                  documents to store metadata for the blobs.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project containing the specified ref/branch.
 *         in: path
 *         required: true
 *         type: string
 *       - name: refid
 *         description: The ID of the ref/branch to search on.
 *         in: path
 *         required: true
 *         type: string
 *       - name: alf_ticket
 *         description: A token passed in the query, used for authorization.
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 *   put:
 *     tags:
 *       - artifacts
 *     description: Searches for and returns artifact blobs based on the artifact ids sent in
 *                  the body of the request.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project containing the specified ref/branch.
 *         in: path
 *         required: true
 *         type: string
 *       - name: refid
 *         description: The ID of the ref/branch to search on.
 *         in: path
 *         required: true
 *         type: string
 *       - name: alf_ticket
 *         description: A token passed in the query, used for authorization.
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.route('/projects/:projectid/refs/:refid/artifacts')
.post(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.postArtifact,
  logResponse,
  respond
)
.put(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.putArtifacts,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /projects/{projectid}/refs/{refid}/artifacts:
 *   get:
 *     tags:
 *       - artifacts
 *     description: Retrieves an artifact blob.
 *     produces:
 *       - application/octet-stream
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project containing the specified ref/branch.
 *         in: path
 *         required: true
 *         type: string
 *       - name: refid
 *         description: The ID of the ref/branch to search on.
 *         in: path
 *         required: true
 *         type: string
 *       - name: blobid
 *         description: The ID of the artifact blob to retrieve.
 *         in: path
 *         required: true
 *         type: string
 *       - name: alf_ticket
 *         description: A token passed in the query, used for authorization.
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.route('/alfresco/projects/:projectid/refs/:refid/artifacts/blob/:blobid')
.get(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.getBlob,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /projects/{projectid}/refs/{refid}/convert:
 *   get:
 *     tags:
 *       - pdf
 *     description: Converts View Editor's HTML post into a downloadable PDF artifact.
 *        Requesting users should receive an email to download the PDF file.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: projectid
 *         description: The ID of the project containing the specified ref/branch.
 *         in: path
 *         required: true
 *         type: string
 *       - name: refid
 *         description: The ID of the ref/branch to search on.
 *         in: path
 *         required: true
 *         type: string
 *       - name: alf_ticket
 *         description: A token passed in the query, used for authorization.
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Ok.
 *       500:
 *         description: Internal Server Error
 */
router.route('/projects/:projectid/refs/:refid/convert')
.post(
  utils.handleTicket,
  authenticate,
  logRoute,
  utils.addHeaders,
  APIController.postHtml2Pdf,
  logResponse,
  respond
)
.options(
  logRoute,
  utils.addHeaders,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /commit/orgs/:orgid/projects/:projectid/branches/:branchid:
 *   put:
 *     tags:
 *       - general
 *     description: Handles the commit.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 *   options:
 *     tags:
 *       - general
 *     description: Returns the org, project, branch, and element that was committed.
 *     responses:
 *       200:
 *         description: OK
 */
router.route('/commit/orgs/:orgid/projects/:projectid/branches/:branchid')
.put(
  authenticate,
  logRoute,
  doLogin,
  CommitController.handleCommit,
  logResponse,
  respond
)
.options(
  logRoute,
  APIController.optionsDefault,
  logResponse,
  respond
);

/**
 * @swagger
 * /projects/:projectid/refs/:refid/elements/:elementid
 *   get:
 *     parameters:
 *       - name: commitId
 *         description: The ID of the commit.
 *         required: true
 *         type: string
 *     tags:
 *       - general
 *     description: get a commit by Id.
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 *   options:
 *     tags:
 *       - general
 *     description: Returns the commit.
 *     responses:
 *       200:
 *         description: OK
 */
router.route('/projects/:projectid/refs/:refid/elements/:elementid')
.put(
  authenticate,
  logRoute,
  doLogin,
  CommitController.getCommitById,
  logResponse,
  respond
)
.options(
  logRoute,
  APIController.optionsDefault,
  logResponse,
  respond
);

// For all other routes that get hit, return an error stating "Not Implemented"
app.use('*', (req, res, next) => {
  M.log.info(`Request for route not implemented: ${req.method}: ${req.originalUrl}`);
  return res.status(501).send('Not Implemented');
});


// Export the module
module.exports = app;
