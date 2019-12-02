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
`http://localhost:6233/plugins/mms3-adapter/login`.

### View Editor Configuration
ADD DOCUMENTATION HERE

### MDK Configuration
ADD DOCUMENTATION HERE
