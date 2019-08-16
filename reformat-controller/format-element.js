const utils = M.require('lib.utils');

// Export the module
module.exports = function formatElement(elemObj) {
	console.log(elemObj);
	return {
		id: utils.parseID(elemObj._id).pop(),
		documentation: elemObj.documentation,
		type: elemObj.type,
		ownerId: (elemObj.parent === null) ? null : utils.parseID(elemObj.parent).pop(),
		name: elemObj.name,
		_projectId: utils.parseID(elemObj.project).pop(),
		_refId: utils.parseID(elemObj.branch).pop(),
		_creator: elemObj.createdBy,
		_created: elemObj.createdOn,
		_modifier: elemObj.lastModifiedBy,
		_modified: elemObj.updatedOn,
		_editable: true
	};
}