const express = require('express');
const app = express();

app.use('*', (req, res, next) => {
	console.log(`${req.method}: ${req.baseUrl}`);
	return res.status(501).send('Not Implemented');
});

module.exports = app;