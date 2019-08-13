// Import all the needed things
const express = require('express');
const app = express();
const auth = M.require('lib.auth');
const APIController = M.require('controllers.api-controller');
const AdaptorSessionModel = require('./adaptor-session-model');
const ReformatController = require('./reformat-controller/reformat-controller');
const Errors = M.require('lib.errors');
const db = M.require('lib.db');


// This is the route for login from ve
// Re directs to the authentication modules
// Authenticates the user and passes it back to ve
app.route('/login')
.post(
	auth.authenticate,
	auth.doLogin,
	(req, res, next) => {
		console.log(`${req.method}: ${req.originalUrl}`);
		db.connect()
		.then(() => {
			const session = new AdaptorSessionModel({ name: 'leah' });
			return session.save();
		})
		.then(() => {
			addHeaders(req, res);
			return res.status(200).send({token: req.session.token});
		})
		.catch((error) => {
			return res.status(500).send('Session failed to create.');
		})
	}
)
.options(
	(req, res, next) => {
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
		ReformatController.getProjects(req)
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
app.route('/orgs/:orgid/projects/:projectid/refs')
.get(
	auth.authenticate,
	(req, res, next) => {
		console.log(`${req.method}: ${req.originalUrl}`);
		ReformatController.getBranches(req)
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
app.route('/orgs/:orgid/projects/:projectid/refs/:refid/mounts')
.get(
	auth.authenticate,
	(req, res, next) => {
		console.log(`${req.method}: ${req.originalUrl}`);
		ReformatController.getMounts(req)
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
app.route('/orgs/:orgid/projects/:projectid/refs/:refid/groups')
.get(
	auth.authenticate,
	(req, res, next) => {
		console.log(`${req.method}: ${req.originalUrl}`);
		ReformatController.getGroups(req)
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