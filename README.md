# MMS3 Adapter Plugin
The MMS3 Adapter Plugin is a plugin designed to be run within MBEE Core Framework (MCF). 
It exposes a MMS3 compatible interface from MCF. It mimics the MMS3 API endpoints, to 
allow for a seamless transition between MMS3 and MCF formatted data. Each endpoint 
accepts data in the same format which MMS3 would expect and returns data in the same 
format which MMS3 would.

## Prerequisites

#### Node.js
NPM comes with Node.js; just install packages with NPM to get started. 
Node version 10.15.0 or greater is required.
See [nodejs.org](https://nodejs.org/en/) for information on Node.js.

#### MBEE Core Framework (MCF)
An installation of MCF is required. It is hosted here: https://github.com/lmco/mbee. 
Please refer to the `README.md` for installation instructions.

#### PrincePDF
For PDF generation, [Prince](https://www.princexml.com/) will have to be installed 
separately with its executable path, file directory, and filename template included. 
See [PDF Export Configuration](#pdf-export-configuration) section below.

#### Structured Data Version Control (SDVC) Configuration
To track element commit history this plugin leverages [MMS SDVC](https://github.com/Open-MBEE/mms).
Follow linked installation instructions within the `README.md` to deploy.

#### Source Code
This source code can be cloned and referenced by the MCF config from your local directory 
or by adding an MCF config reference to the hosted repo.

##### Clone
1. Clone the MBEE code by running: `git clone https://github.com/Open-MBEE/mms3-adapter-plugin`. 
2. Enter the directory with `cd mms3-adapter-plugin`.

##### MCF Config References
```json
"mms3-adapter": {
  "source": "https://github.com/Open-MBEE/mms3-adapter-plugin.git",
  "title": "MMS3 Adapter",
  "name": "mms3-adapter"
}
```

## Getting Started
The requirements for installing the MMS3 Adapter Plugin are simple: a running
copy of MCF, version 0.10 or greater. To install the plugin, add the following
to the **plugins.plugins** section of the running MCF configuration, ensure
**plugins.enabled** is set to true, and restart MCF.

```json
"mms3-adapter": {
  "source": "https://github.com/Open-MBEE/mms3-adapter-plugin.git",
  "title": "MMS3 Adapter",
  "name": "mms3-adapter",
  "sdvc": {
    "url": "SDVC_HOST",
    "port": "SDVC_PORT",
    "auth": {
      "username": "SDVC_USERNAME",
      "password": "SDVC_PASSWORD"
    }
  },
  "emailServerUrl": "email.server.com",
  "emailServerPort": "25",
  "senderAddress": "pdf_sender@server.com",
  "pdf": {
    "directory": "/tmp",
    "filename": "tmp.output",
    "exec": "/path/to/prince/executable"
  }
}
```

### Structured Data Version Control (SDVC) Configuration
To leverage SDVC commit tracking, supply the plugin config the following information:

```json
"mms3-adapter": {
  "sdvc": {
    "url": "SDVC_HOST",
    "port": "SDVC_PORT",
    "auth": {
      "username": "SDVC_USERNAME",
      "password": "SDVC_PASSWORD"
    }
  }
}
```

**NOTE**: This plugin does not have a UI component. This commit tracking is handled 
in a separate application. See [MMS SDVC](https://github.com/Open-MBEE/mms) for 
more detailed information.

### PDF Export Configuration
This plugin allows documents (HTML format) to be exported as a PDF. This plugin 
uses Prince, a PDF conversion engine, to generate the PDF file. When the 
conversion is completed, an email is sent to the requesting user with an artifact
link to download the PDF. 

To set up PDF export, supply the configuration with the following information:

```
"mms3-adapter": {
  "emailServerUrl": "MAIL_SERVER",
  "emailServerPort": "MAIL_PORT",
  "senderAddress": "SENDER_EMAIL",
  "pdf": {
    "directory": "/tmp",             # Location to store the documents. (HTML, PDF) 
    "filename": "tmp.output",        # Filename template prepended to each file.
    "exec": "PRINCE_PATH"            # Prince executable path.
  }
}
```

### Accessing Endpoints
Once the plugin is installed and MCF is restarted, all normal MMS3 API endpoints
should be accessible through the MCF API. Simply append
`/plugins/mms3-adapter` to the normal MMS3 endpoint to access that endpoint in
MCF. For example, to login through the MMS3 API on a localhost server on port
6233, the POST request route would look like 
`http://localhost:6233/plugins/mms3-adapter/api/login`.

### View Editor Configuration
To get the MMS3 Adapter working with View Editor, follow the instructions below.
Please note that the instructions below assume you are running an **unmodified**
instance of View Editor from the [Open-MBEE GitHub](https://github.com/Open-MBEE/ve).

1. Clone the Open-MBEE instance of VE into a directory titled angular-mms.
    ```bash
    git clone https://github.com/Open-MBEE/ve.git angular-mms
    ```
2. Follow instructions 1-5 in the VE README and ensure that the hostname value
   in the `angular-mms-grunt-servers.json` is the url of your MCF server (ex: 
   'localhost').

   2a. If you receive an error during the NPM install, try running the following
   command to fix git URLs and re-run the npm install:
   
   ```
   git config --global url."https://".insteadOf git://
   ```
   
3. Modify the following lines in the view editor code

   3a. In `app/js/mms/app.js` replace lines 49 and 50 with the following. This
   allows View Editor to point to your MCF server.
   
   ```javascript
   URLServiceProvider.setMmsUrl('http://{your-mcf-host}:{your-mcf-port}/plugins/mms3-adapter/alfresco/service');
   URLServiceProvider.setBaseUrl('http://{your-mcf-host}:{your-mcf-port}/plugins/mms3-adapter/alfresco/service');
   ```
   3b. In `src/services/AuthorizationServices.js` replace line 25 with the
   following line. This allows View Editor to NOT point to alfresco for user
   authorization.
   
   ```javascript
   var loginURL = URLService.getRoot() + '/api/login';
   ```
   3c. In `app/mms.html`, comment out line 14 which attempts to load
   `/mms-ts/tsperspectives/TSWebView.css`. This file is nowhere to be found...
   
4. To avoid a self signed certificate error when using grunt, create a file in
   the root `angular-mms` directory called `.bowerrc`. The contents of the should
   be a JSON object, containing a single key, `ca`, pointing to your certificate.
   
   ```json
   {
     "ca": "path/to/your/RootCertificationAuthority.pem"   
   }
    ```
   
5. Run the command `grunt server:ems` to start VE on port `9000`.

### Cameo Configuration
If you are using NoMagic’s Cameo Enterprise Architecture along with OpenMBEE’s MDK and 
you want to upload your model to MCF as you would to MMS3, you will have to give the 
root element of your model in Cameo the “MMS url”. This should be:

```
http://{your-mcf-host}:{your-mcf-port}/plugins/mms3-adapter
```

There is some small modification needed to be made to the MDK in order to parse the
url correctly as MDK by default cuts off everything after the port.

### Known Issues

See `SECURITY.md` for Known Issues.

## Reporting Vulnerabilities and Bugs

If an issue is identified in MBEE, please email
[mbee-software.fc-space@lmco.com](mailto:mbee-software.fc-space@lmco.com).
Refer to **SECURITY.md** for more information.

