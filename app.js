/**
 * Classification: UNCLASSIFIED
 *
 * @module app
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 * @author Austin Bieber <austin.j.bieber@lmco.com>
 *
 * @description The main application for the MMS3 Adapter. Handles router
 * initialization and all routing.
 */

// Import all the needed things
const express = require('express');
const app = express();

// MBEE modules
const auth = M.require('lib.auth');
const Errors = M.require('lib.errors');
const middleware = M.require('lib.middleware');

// Adapter modules
const AdaptorSessionModel = require('./src/adapter-session-model');
const ReformatController = require('./src/reformat-controller');
const utils = require('./src/utils.js');

/**
 * @swagger
 * /login:
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
app.route('/login')
.post(
	auth.authenticate,
	middleware.logRoute,
	auth.doLogin,
	utils.addHeaders,
	(req, res, next) => {
		return res.status(200).send({ token: req.session.token });
	}
)
.options(
	middleware.logRoute,
	utils.addHeaders,
	(req, res, next) => {
		return res.sendStatus(200);
	}
);


/**
 * @swagger
 * /mms/login/token/*:
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
app.route('/mms/login/token/*')
.get(
	auth.authenticate,
	middleware.logRoute,
	utils.addHeaders,
	(req, res, next) => {
		return res.status(200).send({ username: req.user._id });
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
app.route('/orgs')
.get(
	auth.authenticate,
	middleware.logRoute,
	utils.addHeaders,
	(req, res, next) => {
		ReformatController.getOrgs(req)
		.then((orgs) => {
			return res.status(200).send({orgs: orgs});
		})
		.catch((error) => {
			return res.status(Errors.getStatusCode(error)).send(error.message);
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
app.route('/orgs/:orgid/projects')
.get(
	auth.authenticate,
	middleware.logRoute,
	utils.addHeaders,
	(req, res, next) => {
		const session = {
			user: req.user._id,
			org: req.params.orgid
		};

		// Find or replace the session for user trying to use ve
		// This will either create a new mongo document with orgid in db
		AdaptorSessionModel.replaceOne({ user: req.user._id }, session, { upsert: true })
		// Grab the project information
		.then(() => ReformatController.getProjects(req))
		.then((projects) => {
			return res.status(200).send({projects: projects});
		})
		.catch((error) => {
			return res.status(Errors.getStatusCode(error)).send(error.message);
		})
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
app.route('/projects/:projectid/refs')
.get(
	auth.authenticate,
	middleware.logRoute,
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
			return res.status(Errors.getStatusCode(error)).send(error.message);
		})
	}
);

// TODO: Document this route
app.route('/projects/:projectid/refs/:refid/mounts')
.get(
	auth.authenticate,
	middleware.logRoute,
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
			return res.status(Errors.getStatusCode(error)).send(error.message);
		})
	}
);

// TODO: Document this route
app.route('/projects/:projectid/refs/:refid/groups')
.get(
	auth.authenticate,
	middleware.logRoute,
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
			return res.status(Errors.getStatusCode(error)).send(error.message);
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
app.route('/projects/:projectid/refs/:refid/elements/:elementid')
.get(
	auth.authenticate,
	middleware.logRoute,
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
			return res.status(Errors.getStatusCode(error)).send(error.message);
		})
	}
);


// TODO: Document this route
app.route('/projects/:projectid/refs/:refid/documents')
.get(
	auth.authenticate,
	middleware.logRoute,
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
			return res.status(Errors.getStatusCode(error)).send(error.message);
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
