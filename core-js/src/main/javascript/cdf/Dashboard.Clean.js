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


/**
 * @class cdf."Dashboard.Clean"
 * @amd cdf/Dashboard.Clean
 * @summary Represents a clean (no css engine) dashboard.
 * @classdesc Represents a clean (no css engine) dashboard aggregating all
 *            the classes in the Dashboard hierarchy. It's a specialization of
 *            the base abstract {@link cdf.dashboard.Dashboard|Dashboard} class.
 * @see {@link cdf.dashboard.Dashboard|Dashboard}
 * @extends cdf.dashboard.Dashboard
 * @example
 *
 *      require(['cdf/Dashboard.Clean', 'cdf/components/ButtonComponent'],
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
define(['./Dashboard'], function(Dashboard) {

  return Dashboard;

});
