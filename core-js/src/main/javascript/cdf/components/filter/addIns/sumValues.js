/*!
 * Copyright 2002 - 2016 Webdetails, a Pentaho company. All rights reserved.
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
  'amd!../../../lib/underscore',
  '../../../lib/mustache',
  '../../../Dashboard.Clean',
  '../../../AddIn'
], function(_, Mustache, Dashboard, AddIn) {

  'use strict';

  /*
   * Sums the values of all the descendants
   */
  var sumValues = {
    name: 'sumValues',
    label: 'Sums the values of the selected items',
    defaults: {
      formatValue: function(total, st, options) {
        return Mustache.render('{{total}}', {
          total: total
        });
      }
    },
    implementation: function($tgt, st, options) {

      var total = st.model.flatten()
        .filter(function(m) {
          return m.children() == null;
        })
        .filter(function(m) {
          return m.getSelection() === true;
        })
        .reduce(function(memo, m) {
          return memo + m.get('value');
        }, 0)
        .value();

      var filter = st.model.isRoot() ? '.filter-root-selection-value' : '.filter-group-selection-value';
      var html;
      if (_.isFinite(total)) {
        html = options.formatValue(total);
      } else {
        html = '';
      }
      return $tgt.find(filter + ':eq(0)').html(html);
    }
  };
  Dashboard.registerGlobalAddIn('FilterComponent', 'renderRootSelection', new AddIn(sumValues));
  Dashboard.registerGlobalAddIn('FilterComponent', 'renderGroupSelection', new AddIn(sumValues));

  return sumValues;
});
