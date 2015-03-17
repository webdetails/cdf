/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */


/**
 * Represents a bootstrap dashboard. It's a specialization of the base abstract Dashboard class.
 * Require as cdf/Dashboard.Bootstrap
 *
 * @class Dashboard.Bootstrap
 * @extends Dashboard
 */

define([
  './Dashboard',
  'amd!./lib/bootstrap',
  'css!cdf/lib/font-awesome/css/font-awesome.css',
  './lib/html5shiv',
  './lib/respond'],
  function(Dashboard) {

  return Dashboard;

});
