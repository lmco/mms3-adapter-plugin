/**
 * Classification: UNCLASSIFIED
 *
 * @module src.adapter-session-model
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
 * @description Defines the Adapter Session Model. Used to store the ID of the
 * org a user's current session is on. Helps to resolve issue of MMS3 endpoints
 * not including the org ID.
 */

// MBEE modules
const db = M.require('db');

const AdapterSessionSchema = new db.Schema({
	_id: {
		type: 'String'
	},
	user: {
		type: 'String',
		unique: true
	},
	org: {
		type: 'String'
	}
});

module.exports = new db.Model('AdapterSession', AdapterSessionSchema, 'adapter_session');
