/**
 * Classification: UNCLASSIFIED
 *
 * @module src.utils
 *
 * @copyright Copyright (C) 2019, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Austin Bieber
 *
 * @author Leah De Laurell
 * @author Austin Bieber
 *
 * @description Defines and exports utility functions used throughout the
 * plugin.
 */

// NPM modules
const nodemailer = require("nodemailer");
const { execSync } = require('child_process');

// MBEE modules
const Project = M.require('models.project');
const Element = M.require('models.element');
const mcfUtils = M.require('lib.utils');

// variable to be exported
const customDataNamespace = 'CameoMDK';

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
	const projects = await Project.find({});

	const projectID = projects.filter(p =>
		p._id.endsWith(`${mcfUtils.ID_DELIMITER}${req.params.projectid}`)
	).map(p => p._id);

	if (projectID.length > 1) {
		throw new M.ServerError('Multiple projects with the same ID exist. Please'
			+ 'contact your local administrator.', 'error')
	}
	else if (projectID.length === 0) {
		throw new M.NotFoundError(`The project ${req.params.projectid} was not found.`)
	}

	// Modify the requesting object
	req.params.orgid = mcfUtils.parseID(projectID[0])[0];
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
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
	next();
}

/**
 * @description Checks the request query for the key alf_ticket, and if it
 * exists, it removes the ticket and adds an auth header for token auth
 *
 * @param {object} req - The request object to parse/modify.
 * @param {object} res - THe response object.
 * @param {Function} next - The callback function to call after completion of
 * the function.
 */
function handleTicket(req, res, next) {
	if (req.query.alf_ticket) {
		// Parse token from URI encoding
		const token = decodeURIComponent(req.query.alf_ticket);

		req.headers.authorization = `Bearer ${token}`;
	}
	next();
}

/**
 * @description TODO
 *
 * @param req
 * @param res
 * @param next
 */
function formatTicketRequest(req, res, next) {
	// Parse token from URI encoding
	const token = decodeURIComponent(req.params[0]);

	req.headers.authorization = `Bearer ${token}`;
	next();
}

/**
 * @description TODO
 *
 * @param array
 * @param callback
 * @returns {Promise<void>}
 */
async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		// eslint-disable-next-line no-await-in-loop
		await callback(array[index], index, array);
	}
}


/**
 * @description TODO
 *
 * @param reqUser
 * @param orgID
 * @param projID
 * @param branchID
 * @param elements
 * @returns {Promise<void>}
 */
async function generateChildViews(reqUser, orgID, projID, branchID, elements) {
	const viewStereotype = '_18_0beta_9150291_1392290067481_33752_4359';
	const docStereotype = '_17_0_2_3_87b0275_1371477871400_792964_43374';

	let ownedAttributesToFind = [];

	// Make list of ids to find
	elements.forEach((elem) => {
		// If element has an applied stereotype of View or Document
		if (elem.custom[customDataNamespace] && elem.custom[customDataNamespace]._appliedStereotypeIds
			&& (elem.custom[customDataNamespace]._appliedStereotypeIds.includes(viewStereotype)
				|| elem.custom[customDataNamespace]._appliedStereotypeIds.includes(docStereotype))
			&& elem.custom[customDataNamespace].hasOwnProperty('ownedAttributeIds')) {
			// Initialize childViews on the element
			elem.custom[customDataNamespace]._childViews = [];

			// Add ownedAttributeIDs to find (generate the full _id from the id in the same step)
			ownedAttributesToFind.push(...elem.custom[customDataNamespace].ownedAttributeIds.map((id) => {
				return mcfUtils.createID(orgID, projID, branchID, id)
			}));
		}
	});

	// Find the ownedAttribute elements in a single batch request
	const oaElems = await Element.find({ _id: { $in: ownedAttributesToFind } });

	// Create the child views
	const childViews = {};
	oaElems.forEach((e) => {
		const id = mcfUtils.parseID(e._id).pop();
		if (!childViews.hasOwnProperty(id)) {
			childViews[id] = {
				id: e.custom[customDataNamespace].typeId,
				aggregation: e.custom[customDataNamespace].aggregation,
				propertyId: id
			}
		}
	});

	// Add the child views to their respective elements
	elements.forEach((elem) => {
		if (elem.custom[customDataNamespace] && elem.custom[customDataNamespace].hasOwnProperty('_childViews')) {
			elem.custom[customDataNamespace].ownedAttributeIds.forEach((id) => {
				if (childViews.hasOwnProperty(id)) {
					elem.custom[customDataNamespace]._childViews.push(childViews[id]);
				}
			})
		}
	});
}

/**
 * @description Prunes and extracts the HTML section from mms's export HTML request.
 *
 * @param {object} body - Object that includes the html body and css style.
 *
 * @returns prunedHtml - The pruned HTML body.
 */
function pruneHtml(body) {
  // Extract HTML from body
  let rawHTMLString = body.body;
  
  // Remove HTML comments tags
  let pruneHtml = rawHTMLString.replace(/(?!<\")\<\!\-\- [^\<]+ \-\-\>(?!\")/g, '');

  // Return the pruned html
  return pruneHtml;
}

/**
 * @description Generate PDF file based on HTML file.
 *
 * @param fullHtmlFilePath - String path of the html file.
 * @param fullPdfFilePath - String path of the generated pdf file.
 */
async function convertHtml2Pdf(fullHtmlFilePath, fullPdfFilePath) {
	// Use admin to run PDF conversion
  const userAuth = `--auth-user=${M.config.server.defaultAdminUsername}`;
  const passAuth = `--auth-password=${M.config.server.defaultAdminPassword}`;
  const config =  M.config.server.plugins.plugins['mms3-adapter'];
  const exec =config.pdf.exec;
  
  // Generate the conversion command
  const command = `${exec} ${fullHtmlFilePath} -o ${fullPdfFilePath} --insecure ${userAuth} ${passAuth}`;
  const stdout = execSync(command);
  
  // Log command
  M.log.info(`Executing... ${command}  ${stdout.toString()}`);
}

/**
 * @description Emails user with an url link.
 *
 * @param userEmail - The requesting user's email.
 * @param link - The URL link to be included in the email.
 */
async function emailBlobLink(userEmail, link) {
	try {
    // Get adapter configuration
    const config =  M.config.server.plugins.plugins['mms3-adapter'];

    // Create mail transporter
    let transporter = nodemailer.createTransport({
      host: config.emailServerUrl,
      port: config.emailServerPort,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Hard code user message
    const message = 'HTML to .PDF generation succeeded.\n\n' +
      `You can access the .PDF file at: ${link}`;
    
    // Create the transporter and send the email
    await transporter.sendMail({
      from: '"mbee support" <mbee-support.fc-space@lmco.com>', // sender address
      to: userEmail,
      subject: "HTML to .pdf generation completed.",           // Subject line
      text: message                                            // plain text body
    });
    
    // Log user email
    M.log.info(`Emailing user: ${userEmail}.`);
    
  }
	catch (error) {
    M.log.warn(error);
    throw new M.ServerError('Failed to sent user email.', 'error');
	}
}

// Export the module
module.exports = {
	getOrgId,
	addHeaders,
	handleTicket,
	formatTicketRequest,
	asyncForEach,
	generateChildViews,
	customDataNamespace,
  pruneHtml,
  convertHtml2Pdf,
  emailBlobLink
};
