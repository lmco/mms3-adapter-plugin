// Import all the needed things
const mongoose = require('mongoose');
mongoose.set('debug', true);

const AdaptorSessionSchema = new mongoose.Schema({
	name: String
});

module.exports = mongoose.model('AdaptorSession', AdaptorSessionSchema); 
