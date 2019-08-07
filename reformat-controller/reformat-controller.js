// These are helper functions that help define
// how the data gets passed in and returned to ve
// Export the module
module.exports = {
	getOrgs,
	getProjects
};

const OrgController = M.require('controllers.organization-controller');
const ProjectController = M.require('controllers.project-controller');

async function getOrgs(req) {
	try {
		return await OrgController.find(req.user);
	}
	catch(error) {
		throw error;
	} 
}

async function getProjects(req) {
	try {
		return await ProjectController.find(req.user, req.params.orgid);
	}
	catch(error) {
		throw error;
	} 
}
