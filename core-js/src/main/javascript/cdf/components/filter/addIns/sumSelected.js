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
  '../../../lib/jquery',
  'amd!../../../lib/underscore',
  '../../../lib/mustache',
  '../../../Dashboard.Clean',
  '../../../AddIn'
], function($, _, Mustache, Dashboard, AddIn) {

  'use strict';

  var sumSelected = {
    name: 'sumSelected',
    label: 'Sum the values of the selected items',
    defaults: {
      ignoreInvalid: false
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
          var v = m.get('value');

          if (!_.isFinite(v) && options.ignoreInvalid) {
            v = 0;
          }
          return memo + v;
        }, 0)
        .value();

      var filter = st.model.isRoot() ? '.filter-root-selection-value' : '.filter-group-selection-value';
      return $tgt.find(filter + ':eq(0)').html(total === 0 ? '' : total);
    }
  };
  Dashboard.registerGlobalAddIn('FilterComponent', 'renderRootSelection', new AddIn(sumSelected));
  Dashboard.registerGlobalAddIn('FilterComponent', 'renderGroupSelection', new AddIn(sumSelected));

  return sumSelected;

});
