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
 * @author Leah De Laurell
 * @author Austin Bieber
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
const { logRoute } = M.require('lib.middleware');

// Adapter modules
const ReformatController = require('./src/reformat-controller');
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
	(req, res, next) => res.status(200).send({ data: { ticket: req.session.token } })
)
.options(
	logRoute,
	utils.addHeaders,
	(req, res, next) => res.sendStatus(200)
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
	(req, res, next) => {
		req.headers.authorization = `Bearer ${req.params[0]}`;
		next();
	},
	authenticate,
	logRoute,
	utils.addHeaders,
	(req, res, next) => res.status(200).send({ username: req.user._id })
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
	(req, res, next) => {
		ReformatController.getOrgs(req)
		.then((orgs) => {
			return res.status(200).send({ orgs: orgs });
		})
		.catch((error) => {
			return res.status(getStatusCode(error)).send(error.message);
		})
	}
)
.post(
	utils.handleTicket,
	authenticate,
	logRoute,
	utils.addHeaders,
	(req, res, next) => {
		ReformatController.postOrgs(req)
		.then((orgs) => {
			return res.status(200).send({ orgs: orgs });
		})
		.catch((error) => {
			return res.status(getStatusCode(error)).send(error.message);
		})
	}
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
	(req, res, next) => {
		ReformatController.getOrg(req)
		.then((orgs) => {
			return res.status(200).send({ orgs: orgs });
		})
		.catch((error) => {
			return res.status(getStatusCode(error)).send(error.message);
		})
	}
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
	(req, res, next) => {
		// Grab the project information
		ReformatController.getProjects(req)
		.then((projects) => {
			return res.status(200).send({ projects: projects });
		})
		.catch((error) => {
			return res.status(getStatusCode(error)).send(error.message);
		})
	}
)
.post(
	utils.handleTicket,
	authenticate,
	logRoute,
	utils.addHeaders,
	(req, res, next) => {
		// Create the projects
		ReformatController.postProjects(req)
		.then((projects) => {
			return res.status(200).send({ projects: projects });
		})
		.catch((error) => {
			return res.status(getStatusCode(error)).send(error.message);
		})
	}
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
		(req, res, next) => {
			// Set the orgid to null, specifying to find all projects
			req.params.orgid = null;

			// Find the projects
			ReformatController.getProjects(req)
			.then((projects) => {
				return res.status(200).send({ projects: projects });
			})
			.catch((error) => {
				return res.status(getStatusCode(error)).send(error.message);
			});
		}
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
	(req, res, next) => {
		utils.getOrgId(req)
		.then(() => ReformatController.getProject(req))
		.then((projects) => {
			return res.status(200).send({ projects: projects });
		})
		.catch((error) => {
			console.log(error);
			if (getStatusCode(error) === 404) {
				return res.status(getStatusCode(error)).send({});
			}
			return res.status(getStatusCode(error)).send(error.message);
		});
	}
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
 */
router.route('/projects/:projectid/refs')
.get(
	utils.handleTicket,
	authenticate,
	logRoute,
	utils.addHeaders,
	(req, res, next) => {
		// Grabs the org id from the session user
		utils.getOrgId(req)
		// Grabs the branches information
		.then(() => ReformatController.getBranches(req))
		.then((branches) => {
			return res.status(200).send({refs: branches});
		})
		.catch((error) => {
			return res.status(getStatusCode(error)).send(error.message);
		})
	}
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
	(req, res, next) => {
		// Adds the orgID to the request
		utils.getOrgId(req)
		// Grabs the branch information
		.then(() => ReformatController.getBranch(req))
		.then((branches) => {
			return res.status(200).send({ refs: branches });
		})
		.catch((error) => {
			return res.status(getStatusCode(error)).send(error.message);
		})
	}
);

// TODO: Document this route
router.route('/projects/:projectid/refs/:refid/mounts')
.get(
	authenticate,
	logRoute,
	utils.addHeaders,
	(req, res, next) => {
		// Grabs the org id from the session user
		utils.getOrgId(req)
		// Grabs the mounts information
		.then(() => ReformatController.getMounts(req))
		.then((projects) => {
			return res.status(200).send({ projects: projects });
		})
		.catch((error) => {
			return res.status(getStatusCode(error)).send(error.message);
		})
	}
);

// TODO: Document this route
router.route('/projects/:projectid/refs/:refid/groups')
.get(
	authenticate,
	logRoute,
	utils.addHeaders,
	(req, res, next) => {
		// Grabs the org id from the session user
		utils.getOrgId(req)
		// Grab the group information
		.then(() => ReformatController.getGroups(req))
		.then((groups) => {
			return res.status(200).send({groups: groups});
		})
		.catch((error) => {
			return res.status(getStatusCode(error)).send(error.message);
		})
	}
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
	authenticate,
	logRoute,
	utils.addHeaders,
	(req, res, next) => {
		// Grabs the org id from the session user
		utils.getOrgId(req)
		// Grabs the mounts information
		.then(() => ReformatController.getElement(req))
		.then((elements) => {
			return res.status(200).send({ elements: elements });
		})
		.catch((error) => {
			return res.status(getStatusCode(error)).send(error.message);
		})
	}
);


// TODO: Document this route
router.route('/projects/:projectid/refs/:refid/documents')
.get(
	authenticate,
	logRoute,
	utils.addHeaders,
	(req, res, next) => {
		// Grabs the org id from the session user
		utils.getOrgId(req)
		// Grabs the mounts information
		.then(() => ReformatController.getDocuments(req))
		.then((documents) => {
			return res.status(200).send({ documents: documents });
		})
		.catch((error) => {
			return res.status(getStatusCode(error)).send(error.message);
		})
	}
);

// This is all the other routes that get hit
// Throwing an error saying no
app.use('*', (req, res, next) => {
	console.log(`${req.method}: ${req.originalUrl}`);
	return res.status(501).send('Not Implemented');
});


// Export the module
module.exports = app;
