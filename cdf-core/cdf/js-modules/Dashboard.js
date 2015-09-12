/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

define([
  './dashboard/Dashboard',
  './dashboard/Dashboard.context',
  './dashboard/Dashboard.addIns',
  './dashboard/Dashboard.bookmarkable',
  './dashboard/Dashboard.components',
  './dashboard/Dashboard.i18n',
  './dashboard/Dashboard.legacy',
  './dashboard/Dashboard.lifecycle',
  './dashboard/Dashboard.notifications',
  './dashboard/Dashboard.parameters',
  './dashboard/Dashboard.storage',
  './dashboard/Dashboard.dataSources',
  './dashboard/Dashboard.query',
  './dashboard/Dashboard.views',
  './queries/BaseQuery',
  './queries/CpkQuery',
  './queries/CdaQuery',
  './queries/XmlaQuery',
  './queries/LegacyQuery',
  './components/BaseComponent',
  './components/UnmanagedComponent',
  'css!./Dashboard'],
  function(Dashboard) {

  return Dashboard;

});
