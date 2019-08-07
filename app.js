const express = require('express');
const app = express();
const auth = M.require('lib.auth');
const APIController = M.require('controllers.api-controller');


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

app.route('/mms/login/token')
.get(
	auth.authenticate,
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

app.use('*', (req, res, next) => {
	console.log(`${req.method}: ${req.originalUrl}`);
	return res.status(501).send('Not Implemented');
});

function addHeaders(req, res) {
	res.header('Access-Control-Allow-Origin', req.headers.origin);
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

module.exports = app;