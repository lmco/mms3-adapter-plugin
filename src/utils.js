/**
 * Classification: UNCLASSIFIED
 *
 * @module src.utils
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
 * @description Defines and exports utility functions used throughout the
 * plugin.
 */

// Adapter modules
const AdapterSession = require('./adapter-session-model');

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
	try {
		const session = await AdapterSession.findOne({ user: req.user._id });

		if (!session) {
			// Throw error that user does not have permissions on
			throw new M.PermissionError('User does not have a session.', 'warn');
		}

		// Modify the requesting object
		req.params.orgid = session.org;
	}

	catch(error) {
		// Throw server error
		throw new M.ServerError('Something went wrong.', 'warn');
	}
}

/**
 * @description Adds headers which VE and MDK expect to the request and response
 * objects. Modifies each object by reference.
 *
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - A callback function to move onto the next middleware
 * function.
 */
function addHeaders(req, res, next) {
	res.header('Access-Control-Allow-Origin', req.headers.origin);
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	next();
}

// Export the module
module.exports = {
	getOrgId,
	addHeaders
};
