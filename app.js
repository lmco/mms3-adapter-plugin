// Import all the needed things
const express = require('express');
const app = express();
const auth = M.require('lib.auth');
const APIController = M.require('controllers.api-controller');
const ReformatController = require('./reformat-controller/reformat-controller');
const Errors = M.require('lib.errors');


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
.options(
	(req, res, next) => {
		console.log(`${req.method}: ${req.originalUrl}`);
		addHeaders(req, res);
		return res.sendStatus(200);
	}
);

// This is the route for orgs
// This is go and grab all of the org data
// From mcf and return that data to ve
app.route('/orgs')
.get(
	auth.authenticate,
	(req, res, next) => {
		console.log(`${req.method}: ${req.originalUrl}`);
		ReformatController.getOrgs()
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
.options(
	(req, res, next) => {
		console.log(`${req.method}: ${req.originalUrl}`);
		addHeaders(req, res);
		return res.sendStatus(200);
	}
);

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