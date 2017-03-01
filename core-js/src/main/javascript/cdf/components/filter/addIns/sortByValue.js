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
  '../../../Dashboard.Clean',
  '../../../AddIn'
], function(_, Dashboard, AddIn) {

  'use strict';

  /*
   * Sorts items/groups by value
   */
  var sortByValue = {
    name: 'sortByValue',
    label: 'Sort items by value',
    defaults: {
      ascending: false
    },
    implementation: function($tgt, st, options) {
      var result = st.model.get('value');
      if (!_.isNumber(result)) {
        return 0;
      }

      if (options.ascending) {
        return result;
      } else {
        return -1 * result;
      }
    }
  };
  Dashboard.registerGlobalAddIn('FilterComponent', 'sortItem', new AddIn(sortByValue));
  Dashboard.registerGlobalAddIn('FilterComponent', 'sortGroup', new AddIn(sortByValue));

  return sortByValue;
});
