// These are helper functions that help define
// how the data gets passed in and returned to ve
// Import all the data
const OrgController = M.require('controllers.organization-controller');
const ProjectController = M.require('controllers.project-controller');
const BranchController = M.require('controllers.branch-controller');
const ElementModel = M.require('models.element');
const GetPublicData = M.require('lib.get-public-data');

// Export the module
module.exports = {
	getOrgs,
	getProjects,
	getBranches,
	getMounts,
	getGroups
};

// This is the get orgs function
async function getOrgs(req) {
	try {
		// Grab all the orgs from controller
		const orgs = await OrgController.find(req.user);
		// Return all the public data of orgs
		return orgs.map((org) => GetPublicData.getPublicData(org, 'org'));
	}
	catch(error) {
		// Throw error
		throw error;
	} 
}

// This is the get projects function
async function getProjects(req) {
	try {
		// Grab all the projects from controller
		const projects = await ProjectController.find(req.user, req.params.orgid);
		// Return all the public data of projects
		return projects.map((project) => GetPublicData.getPublicData(project, 'project'));
	}
	catch(error) {
		// Throw error
		throw error;
	} 
}

// This is the get branches function
async function getBranches(req) {
    try {
    	// Grab all the branches from controller
		const branches = await BranchController.find(req.user, req.params.orgid, req.params.projectid);
		// Return all the public data of branches in ve form
		return branches.map((branch) => {
			// Get public data of branches
			const publicData = GetPublicData.getPublicData(branch, 'branch');
			// Verify if a tag
			if (branch.tag) {
				// Add type field as a tag
				publicData.type = 'Tag';
			}
			else {
				// Add type field as a branch
				publicData.type = 'Branch';
			}

			// Return public data
			return publicData;
		});
	}
	catch(error) {
		// Throw error
		throw error;
	} 
}

// This is the gets the mounts of a project
async function getMounts(req) {
    try {
    	// TODO: Eventually add in the ability to look at the project
    	// references that the elements reference that are not the current
    	// project and push those projects to array for mounts
    	// HOWTO: Any elements whos source or target does not start with org:project
    	// 4 pieces: check soure field regex for 
    	return [];
	}
	catch(error) {
		// Throw error
		throw error;
	} 
}

// This is the gets the groups of a ref
async function getGroups(req) {
    try {
    	// TODO: Eventually add in the ability to look at the project
    	// references that the elements reference that are not the current
    	// project and push those projects to array for mounts
    	// HOWTO: Any elements whos source or target does not start with org:project
    	// 4 pieces: check soure field regex for 
    	return [];
	}
	catch(error) {
		// Throw error
		throw error;
	} 
}
