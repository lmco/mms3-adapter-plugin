/**
 * Classification: UNCLASSIFIED
 *
 * @module app
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber
 *
 * @author Austin Bieber
 * @author Leah De Laurell
 *
 * @description The main application for the MMS3 Adapter. Handles router
 * initialization and all routing.
 */

// NPM modules
const express = require('express');
const app = express();
const router = express.Router();

// MBEE modules
const { authenticate, doLogin } = M.require('lib.auth');
const { getStatusCode } = M.require('lib.errors');
const { logRoute, logResponse, respond } = M.require('lib.middleware');

// Adapter modules
const APIController = require('./src/api-controller');
const utils = require('./src/utils.js');

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
	APIController.optionsLogin,
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
);

// TODO: Document this route. Seems to only be used by View Editor
router.route('/connection/jms')
.get(
	utils.addHeaders,
	(req, res, next) => {
		res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, authorization');
		res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
		res.status(200).send();
	}
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
	APIController.getOrgs,
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
);

// TODO: Document this route
router.route('/projects/:projectid/refs/:refid/mounts')
.get(
	utils.handleTicket,
	authenticate,
	logRoute,
	utils.addHeaders,
	APIController.getMounts,
	logResponse,
	respond
);

// TODO: Document this route
router.route('/projects/:projectid/refs/:refid/groups')
.get(
	utils.handleTicket,
	authenticate,
	logRoute,
	utils.addHeaders,
	APIController.getGroups,
	logResponse,
	respond
);

// TODO: documentation
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
);


// TODO: Document this route and eventually find a solution for documents
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

// TODO: Document this route and eventually find a solution for commits
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

// This is all the other routes that get hit
// Throwing an error saying no
app.use('*', (req, res, next) => {
	console.log(`Request for route not implemented: ${req.method}: ${req.originalUrl}`);
	return res.status(501).send('Not Implemented');
});


// Export the module
module.exports = app;
