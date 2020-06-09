# MMS3 Adapter Security

**Contents**
- [Reporting Security Vulnerabilities](#reporting-security-vulnerabilities)
- [Disclosure and Security Update Policy](#disclosure-and-security-update-policy)
- [Known Gaps and Issues](#known-gaps-and-issues)

## Reporting Security Vulnerabilities
If a security related issue is identified in the open source version MBEE,
please email
[mbee-software.fc-space@lmco.com](mailto:mbee-software.fc-space@lmco.com).
This will notify the Lockheed Martin MBEE Software Engineering team of the
issue.

When disclosing a vulnerability, please provide the following information:

- Server information: any environment details that can be provided about the 
instance of MBEE on which the vulnerability was identified on.
- The MBEE version (can be retrieved from the MBEE `/about` page)
- The MMS3 Adapter Plugin version
- Whether or not the original source code has been modified. Details about any modifications
can be helpful, if that information can be provided.
- A detailed description of the issue (the more detail, the better) so our team
can quickly reproduce the issue.
- Organization(s) impacted/affected.

## Disclosure and Security Update Policy
If and when security-related updates are made to the MMS3 Adapter Plugin, refer 
to `CHANGELOG.md` for instructions on how to mitigate the issue.

## Known Gaps and Issues

### PDF Export
PrincePDF is used to generate PDFs. The MMS3 Adapter plugin
receives html from the [View Editor](https://github.com/Open-MBEE/ve) application which
historically has included links to retrieve artifacts from MMS with an `alf_ticket` included. 
MMS would then send the html to Prince.  The issue arises with the handling of the `alf_ticket` in the MMS3
Adapter Plugin.  Because the intention was to avoid using Alfresco while maintaining
backwards API compatibility, we kept support for the `alf_ticket` query parameter but
re-purposed it into a bearer token.  When sending html to Prince for PDF generation,
we currently create a new bearer token with an expiry time of 24 hours, because of
reports that the generation can take exceptionally long periods of time for
exceptionally large models.  Currently there is no way to destroy or invalidate
a bearer token in the MCF backend once it is created, meaning this token will
continue to exist regardless of how soon the PDF generation is finished.  In a
future release of MCF, we plan to implement a way for admins to manage, i.e. view
and destroy, all currently active bearer tokens.  Until then, this plugin will
generate an indestructible 24hr token every time a PDF generation is requested.

### PDF Email 
Intended to leverage an SMTP relay. Currently no TLS/SSL support.

### SDVC Connection
The current plugin configuration does not allow for TLS/SSL support.
