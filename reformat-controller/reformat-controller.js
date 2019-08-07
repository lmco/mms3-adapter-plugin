// These are helper functions that help define
// how the data gets passed in and returned to ve
// Export the module
module.exports = {
	getOrgs
};

const OrgController = M.require('controllers.organization-controller');

async function getOrgs(req) {
	try {
		return await OrgController.find(req.user);
	}
	catch(error) {
		throw error;
	} 
}
