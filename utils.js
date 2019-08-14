const AdaptorSessionModel = require('./adaptor-session-model');

// Export the module
module.exports = {
	getOrgId
};

// This function grabs the org id from the session model of the user
async function getOrgId(req) {
	try {
		const session = await AdaptorSessionModel.findOne({ user: req.user.username });

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