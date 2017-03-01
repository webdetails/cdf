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
  './template',
  '../../../lib/jquery',
  '../../../lib/mustache',
  '../../../Dashboard.Clean',
  '../../../AddIn'
], function(templateAddIn, $, Mustache, Dashboard, AddIn) {

  'use strict';

  var template = "{{#reachedSelectionLimit}}" +
    "<div class=\"filter-root-notification\">" +
    "  <div class=\"filter-root-notification-icon\" />" +
    "  <div class=\"filter-root-notification-text\">" +
    "    {{message.beforeLimit}}" +
    "    <span class=\"filter-notification-highlight\">" +
    "      {{Root.options.selectionStrategy.limit}}" +
    "    </span>" +
    "    {{message.afterLimit}}" +
    "  </div>" +
    "</div>" +
    "{{/reachedSelectionLimit}}";

  var notificationSelectionLimit = $.extend(true, {}, templateAddIn, {
    name: 'notificationSelectionLimit',
    label: 'Notification that the selection limit has been reached',
    help: 'Acts on the footer of the Root view',
    defaults: {
      filter: '.filter-root-footer',
      template: template,
      message: {
        beforeLimit: "The selection limit (",
        afterLimit: ") for specific items has been reached."
      }
    }
  });
  Dashboard.registerGlobalAddIn('FilterComponent', 'renderRootSelection',
    new AddIn(notificationSelectionLimit));

  return notificationSelectionLimit;

});
