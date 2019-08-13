// Import all the needed things
const mongoose = require('mongoose');

const AdaptorSessionSchema = new mongoose.Schema({
	user: {
		type: String,
		unique: true
	},
	org: String,
	project: String
});

module.exports = mongoose.model('AdaptorSession', AdaptorSessionSchema); 
