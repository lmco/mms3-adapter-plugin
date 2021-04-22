# Contributing to MMS Adapter

**Contents**
- [Reporting Bugs](#reporting-bugs)
- [Pull Requests](#pull-requests)
  - [Linter](#linter)
  - [Tests](#tests)
  - [Errors](#errors)
- [Contributors](#contributors)

### Reporting Bugs
To report any bugs found in the software, please open a new issue on the 
[MMS Adapter GitHub](https://github.com/Open-MBEE/mms-adapter-plugin/issues/new). 
It is important that you provide as much information as possible to help us reproduce 
and fix the bug. The following information will be expected in all bug reports:

- A detailed description of the issue
- MBEE Version (found in the package.json file of your MBEE directory)
- MMS Adapter Version (found in [package.json](./package.json))
- Node Version (found by running `node -v`)
- Database Version

Any additional information which may be useful in reproducing the bug would be
greatly appreciated, such as details from the running configuration or the stack
trace of the error.

**If you believe the bug to be a security vulnerability, do not report it on
GitHub.** Instead, email the same information above to
[mbee-software.fc-space@lmco.com](mailto:mbee-software.fc-space@lmco.com). To
see more information about security vulnerability reporting, see the 
[SECURITY.md](./SECURITY.md).

### Pull Requests
As an open-sourced project, this plugin is open to contributions from community members
who wish to enhance or fix portions of the software. Below are some guidelines
to follow which will help your pull request be approved and ultimately keep the
code base clean, readable, and maintainable.

#### Linter
Currently, this plugin does not have an eslint file of its own. It relies on using the 
`.eslintrc` within an existing MCF configuration. To run the linter, execute the following 
command in a terminal within the mcf project directory:

```bash
 node mbee lint ./plugins/src/*
```

#### Tests
The current tests included with this plugin are not comprehensive, but intended to provide 
testing of essential functionality for proper handling of model data.  The PDF generation 
and MMS commit features do not have any tests as of yet.  

The tests in this plugin must be run via the MCF script using the following command:
 
```bash
 node mbee test --plugin mms-adapter
```

#### Errors
Throughout the code, the plugin leverages the global `M` object with custom 
errors defined within `MCF ./app/lib/errors.js`. Each of these errors is associated 
with a specific HTTP status code which will be sent in response from the API. 
These errors are attached to the global M object. Example usage is as follows:

```
  try {
    ...
  }
  catch(error) {
    throw new M.ServerError('Error creating MMS organization');
  }
```

All code merged in which has access to the global M object is expected to use
these custom errors. The only code which may not have access to the M object
would be found in the [scripts](./scripts).

### Contributors
Thanks to all of the following people who have directly contributed code to 
the MMS Adapter Plugin:

- Connor Doyle
- Austin Bieber
- Leah De Laurell
- Phillip Lee
- Donte McDaniel
- Jimmy Eckstein
