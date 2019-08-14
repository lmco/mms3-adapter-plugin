// Import all the needed things
const express = require('express');
const app = express();
const auth = M.require('lib.auth');
const APIController = M.require('controllers.api-controller');
const AdaptorSessionModel = require('./adaptor-session-model');
const ReformatController = require('./reformat-controller/reformat-controller');
const Errors = M.require('lib.errors');
const utils = require('./utils.js');




// This is the route for login from ve
// Re directs to the authentication modules
// Authenticates the user and passes it back to ve
app.route('/login')
.post(
	auth.authenticate,
	auth.doLogin,
	(req, res, next) => {
		console.log(`${req.method}: ${req.originalUrl}`);
		addHeaders(req, res);
		return res.status(200).send({token: req.session.token});
	}
)
.options(
	(req, res, next) => {
		console.log('hello');
		console.log(`${req.method}: ${req.originalUrl}`);
		addHeaders(req, res);
		return res.sendStatus(200);
	}
);

// This is the token login 
// Verifying that the login was successful
// Then grabs the username and passes back
// to ve
app.route('/mms/login/token/*')
.get(
	auth.authenticate,
	(req, res, next) => {
		console.log(`${req.method}: ${req.originalUrl}`);
		addHeaders(req, res);
		return res.status(200).send({username: req.user.username});
	}
)

// This is the route for orgs
// This is go and grab all of the org data
// From mcf and return that data to ve
app.route('/orgs')
.get(
	auth.authenticate,
	(req, res, next) => {
		console.log(`${req.method}: ${req.originalUrl}`);
		ReformatController.getOrgs(req)
		.then((orgs) => {
			addHeaders(req, res);
			return res.status(200).send({orgs: orgs});
		})
		.catch((error) => {
			addHeaders(req, res);
			return res.status(Errors.getStatusCode(error)).send(error.message);
		})
	}
)

// This is the route for projects in a specific org
// This is go and grab all of the project data
// From mcf and return that data to ve
app.route('/orgs/:orgid/projects')
.get(
	auth.authenticate,
	(req, res, next) => {
		console.log(`${req.method}: ${req.originalUrl}`);
		const session = {
			user: req.user.username,
			org: req.params.orgid
		};

		// Find or replace the session for user trying to use ve
		// This will either create a new mongo document with orgid in db
		AdaptorSessionModel.replaceOne({ user: req.user.username }, session, { upsert: true })
		// Grab the project information
		.then(() => ReformatController.getProjects(req))
		.then((projects) => {
			addHeaders(req, res);
			return res.status(200).send({projects: projects});
		})
		.catch((error) => {
			addHeaders(req, res);
			return res.status(Errors.getStatusCode(error)).send(error.message);
		})
	}
)

// This is the route for branches in a specific project
// This is go and grab all of the branch data
// From mcf and return that data to ve as refs
app.route('/projects/:projectid/refs')
.get(
	auth.authenticate,
	(req, res, next) => {
		console.log(`${req.method}: ${req.originalUrl}`);

		// Grabs the org id from the session user
		utils.getOrgId(req)
		// Grabs the branches information
		.then(() => ReformatController.getBranches(req))
		.then((branches) => {
			addHeaders(req, res);
			return res.status(200).send({refs: branches});
		})
		.catch((error) => {
			addHeaders(req, res);
			return res.status(Errors.getStatusCode(error)).send(error.message);
		})
	}
)

// This is the route for branches in a specific project
// This is go and grab all of the branch data
// From mcf and return that data to ve as refs
app.route('/projects/:projectid/refs/:refid/mounts')
.get(
	auth.authenticate,
	(req, res, next) => {
		console.log(`${req.method}: ${req.originalUrl}`);

		// Grabs the org id from the session user
		utils.getOrgId(req)
		// Grabs the mounts information
		.then(() => ReformatController.getMounts(req))
		.then((projects) => {
			addHeaders(req, res);
			return res.status(200).send({ projects: projects });
		})
		.catch((error) => {
			addHeaders(req, res);
			return res.status(Errors.getStatusCode(error)).send(error.message);
		})
	}
)

// This is the route for branches in a specific project
// This is go and grab all of the branch data
// From mcf and return that data to ve as refs
app.route('/projects/:projectid/refs/:refid/groups')
.get(
	auth.authenticate,
	(req, res, next) => {
		console.log(`${req.method}: ${req.originalUrl}`);
		// Grabs the org id from the session user
		utils.getOrgId(req)
		// Grab the group information
		.then(() => ReformatController.getGroups(req))
		.then((groups) => {
			addHeaders(req, res);
			return res.status(200).send({groups: groups});
		})
		.catch((error) => {
			addHeaders(req, res);
			return res.status(Errors.getStatusCode(error)).send(error.message);
		})
	}
)

// This is the route for elements specifically one
app.route('/projects/:projectid/refs/:refid/elements/:elementid')
.get(
	auth.authenticate,
	(req, res, next) => {
		console.log(`${req.method}: ${req.originalUrl}`);

		// Grabs the org id from the session user
		utils.getOrgId(req)
		// Grabs the mounts information
		.then(() => ReformatController.getElement(req))
		.then((projects) => {
			addHeaders(req, res);
			return res.status(200).send({ projects: projects });
		})
		.catch((error) => {
			addHeaders(req, res);
			return res.status(Errors.getStatusCode(error)).send(error.message);
		})
	}
)

// This is all the other routes that get hit
// Throwing an error saying no
app.use('*', (req, res, next) => {
	console.log(`${req.method}: ${req.originalUrl}`);
	return res.status(501).send('Not Implemented');
});

// This is a function for our headers
// There were some issues when passing between servers
// These fixed the issue
function addHeaders(req, res) {
	res.header('Access-Control-Allow-Origin', req.headers.origin);
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}


// Export the module
module.exports = app;