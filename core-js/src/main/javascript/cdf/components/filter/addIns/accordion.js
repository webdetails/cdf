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
  '../../../Dashboard.Clean',
  '../../../AddIn'
], function(Dashboard, AddIn) {

  'use strict';

  /*
   * Emulate accordion behaviour on a group of filters
   *
   * When the user expands a filter, a global event on the "Dashboard" object is issued.
   * The filters configured to use this addIn will listen to the event and
   * close themselves accordingly
   */
  var accordion = {
    name: 'accordion',
    label: 'Makes all filters behave as an accordion',
    defaults: {
      group: 'filters'
    },
    implementation: function($tgt, st, options) {
      st.model.on('change:isCollapsed', function(model, newState) {
        if (newState === false) {
          return st.dashboard.trigger('filters:close', model, options);
        }
      });
      st.model.listenTo(st.dashboard, 'filters:close', function(model, opts) {
        if (opts.group === options.group) {
          if (model !== st.model) {
            if (st.model.get('isDisabled') === false) {
              return st.model.set('isCollapsed', true);
            }
          }
        }
      });
    }
  };
  Dashboard.registerGlobalAddIn('FilterComponent', 'postUpdate', new AddIn(accordion));

  return accordion;

});
