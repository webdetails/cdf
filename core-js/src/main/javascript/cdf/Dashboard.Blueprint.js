/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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

/**
 * @class cdf."Dashboard.Blueprint"
 * @amd cdf/Dashboard.Blueprint
 * @summary Represents a {@link http://www.blueprintcss.org|Blueprint} dashboard.
 * @classdesc Represents a {@link http://www.blueprintcss.org|Blueprint}
 *            dashboard aggregating all the classes in the Dashboard
 *            hierarchy. It's a specialization of the base abstract
 *            {@link cdf.dashboard.Dashboard|Dashboard} class.
 * @see {@link cdf.dashboard.Dashboard|Dashboard}
 * @see {@link http://www.blueprintcss.org|Blueprint}
 * @extends cdf.dashboard.Dashboard
 * @example
 *
 *      require(['cdf/Dashboard.Blueprint', 'cdf/components/ButtonComponent'],
 *        function(Dashboard, ButtonComponent) {
 *          var dashboard = new Dashboard();
 *
 *          dashboard.addParameter("input", "");
 *
 *          dashboard.addComponent(new ButtonComponent({
 *            name: "buttonComponent",
 *            type: "button",
 *            listeners:[],
 *            htmlObject: "buttonObject",
 *            label: "A button",
 *            expression: function() {
 *              this.setLabel('Yes, a clickable button');
 *              alert('Button was clicked');
 *            },
 *            executeAtStart: true,
 *            preChange: function() { return true; },
 *            postChange: function() { return true; },
 *            successCallback: function(data) {},
 *            failureCallback: function() {}
 *          }));
 *          dashboard.init();
 *      });
 */
define([
  './Dashboard',
  'css!./lib/blueprint/screen'
], function(Dashboard) {
  
  return Dashboard;

});
