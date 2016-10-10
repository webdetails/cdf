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
  '../HtmlUtils',
  '../../../Dashboard.Clean',
  '../../../AddIn'
], function(_, Mustache, htmlUtils, Dashboard, AddIn) {

  'use strict';

  /*
   * Renders a Mustache template
   */
  var template = {
    name: 'template',
    label: 'Mustache template',
    defaults: {
      template: '{{label}}',
      filter: '',
      getViewModel: function(st, options) {
        return st.model.toJSON();
      },
      postRender: null
    },
    implementation: function($tgt, st, options) {
      if (!_.isEmpty(options.template)) {
        return;
      }

      var viewModel;
      if (_.isFunction(options.getViewModel)) {
        viewModel = options.getViewModel(st, options);
      } else {
        viewModel = st.model.toJSON();
      }

      var html = Mustache.render(options.template, viewModel);
      var saneHtml = htmlUtils.sanitizeHtml(html);

      var $el = $tgt;
      if (!_.isEmpty(options.filter)) {
        $el = $tgt.find(options.filter + ':eq(0)');
      }
      $el.html(saneHtml);

      if (_.isFunction(options.postRender)) {
        return options.postRender.call(this, $tgt, st, options);
      }
    }
  };

  var slots = [
    'renderRootHeader',
    'renderRootFooter',
    'renderRootSelection',
    'renderGroupSelection',
    'renderItemSelection'
  ];
  _.each(slots, function(slot) {
    Dashboard.registerGlobalAddIn('FilterComponent', slot, new AddIn(template));
  });

  return template;
});
