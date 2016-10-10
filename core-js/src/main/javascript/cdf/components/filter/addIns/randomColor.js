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

  var randomColor = {
    name: 'randomColor',
    label: 'Programmatically sets a random color',
    defaults: {
      filter: '.filter-item-body'
    },
    implementation: function($tgt, model, options) {
      return $tgt.find(options.filter).css({
        color: "rgb(" + _.random(255) + "," + _.random(255) + "," + _.random(255) + ")"
      });
    }
  };

  Dashboard.registerGlobalAddIn('FilterComponent', 'renderItemSelection', new AddIn(randomColor));

  return randomColor;
});
