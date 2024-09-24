/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/

// Module aggregating all the classes in the dashboard hierarchy.

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
  './queries/SolrQuery',
  './components/BaseComponent',
  './components/UnmanagedComponent',
  'css!./theme/Dashboard'
], function(Dashboard) {

  return Dashboard;

});
