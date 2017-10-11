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

define([
  '../../../lib/mustache',
  'text!../templates/Group-skeleton.html',
  'text!../templates/Group-template.html',
  'text!../templates/Item-template.html',
  'text!../templates/Root-footer.html',
  'text!../templates/Root-header.html',
  'text!../templates/Root-overlay.html',
  'text!../templates/Root-skeleton.html',
  'text!../templates/Root-template.html'
], function(
  Mustache,
  GroupSkeleton,
  GroupTemplate,
  ItemTemplate,
  RootFooter,
  RootHeader,
  RootOverlay,
  RootSkeleton,
  RootTemplate
) {
  var templates = {};
  function _loadTemplate(name, source) {
    templates[name] = source;
    Mustache.parse(templates[name]);
  }

  _loadTemplate("Group-skeleton", GroupSkeleton);
  _loadTemplate("Group-template", GroupTemplate);
  _loadTemplate("Item-template", ItemTemplate);
  _loadTemplate("Root-footer", RootFooter);
  _loadTemplate("Root-header", RootHeader);
  _loadTemplate("Root-overlay", RootOverlay);
  _loadTemplate("Root-skeleton", RootSkeleton);
  _loadTemplate("Root-template", RootTemplate);
  _loadTemplate(undefined, "No template");

  return templates;
});
