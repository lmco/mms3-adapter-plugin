/**
 * @classification UNCLASSIFIED
 *
 * @module test.init
 *
 * @license
 * Copyright 2020 Lockheed Martin Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @owner Connor Doyle
 *
 * @author Austin Bieber
 *
 * @description Runs asynchronous initialization functions before any tests are
 * run.
 */

// MCF modules
const Artifact = M.require('models.artifact');
const Branch = M.require('models.branch');
const Element = M.require('models.element');
const Organization = M.require('models.organization');
const Project = M.require('models.project');
const ServerData = M.require('models.server-data');
const User = M.require('models.user');
const Webhook = M.require('models.webhook');
const db = M.require('db');

// Before function, is run before any tests are run
before(async () => {
  try {
    // Connect to the database
    await db.connect();

    // Initialize all models
    await Promise.all([Artifact.init(), Branch.init(), Element.init(),
      Organization.init(), Project.init(), ServerData.init(), User.init(),
      Webhook.init()]);
  }
  catch (error) {
    M.log.error(error);
    process.exit(1);
  }
});

// After function, is run after all tests are run
after(async () => {
  try {
    // Disconnect from the database
    await db.disconnect();
  }
  catch (error) {
    M.log.error(error);
    process.exit(1);
  }
});
