# MMS3 Adapter Plugin
The MMS3 Adapter Plugin is a plugin designed to be run on MCF/MMS4. It mimics
the MMS3 API endpoints, to allow for a seamless transition between MMS3 and MMS4
formatted data. Each endpoint accepts data in the same format which MMS3 would
expect, and returns data in the same format which MMS3 would.

### Installation
The requirements for installing the MMS3 Adapter Plugin are simple: a running
copy of MCF, version 0.10 or greater. To install the plugin, add the following
to the **plugins.plugins** section of the running configuration, ensure
**plugins.enabled** is set to true, and restart MCF.

```json
"mms3-adapter": {
  "source": "https://gitlab.us.lmco.com/mbx/mbee/plugins/mms3-adapter.git",
  "title": "MMS3 Adapter",
  "name": "mms3-adapter"
}
```

### Accessing Endpoints
Once the plugin is installed and MCF is restarted, all normal MMS3 API endpoints
should be accessible through the MCF API. Simply append
**/plugins/mms3-adapter** to the normal MMS3 endpoint to access that endpoint in
MCF. For example, to login through the MMS3 API on a localhost server on port
6233, the POST request route would look like 
`http://localhost:6233/plugins/mms3-adapter/api/login`.

### View Editor Configuration
To get the MMS3 Adapter working with View Editor, follow the instructions below.
Please note that the instructions below assuming you are running an unmodified
instance of View Editor from the Open-MBEE GitHub.

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
   URLServiceProvider.setMmsUrl('http://{your-mcf-host}:{your-mcf-port}/plugins/mms3-adapter');
   URLServiceProvider.setBaseUrl('http://{your-mcf-host}:{your-mcf-port}/plugins/mms3-adapter');
   ```
   3b. In `src/services/AuthorizationServices.js` replace line 25 with the
   following line. This allows View Editor to NOT point to alfresco for user
   authorization.
   
   ```javascript
   var loginURL = URLService.getRoot() + '/api/login';
   ```
4. To avoid a self signed certificate error when using grunt, create a file in
the root `angular-mms` directory called `.bowerrc`. The contents of the should
be a JSON object, containing a single key, `ca`, pointing to your Lockheed 
Martin certificate.
    ```json
    {
      "ca": "path/to/your/LockheedMartinRootCertificationAuthority.pem"   
    }
    ```
5. Run the command `grunt server:ems` to start VE on port 9000

### MDK Configuration
ADD DOCUMENTATION HERE
