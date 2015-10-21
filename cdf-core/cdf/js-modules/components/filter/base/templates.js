/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
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
  'cdf/lib/mustache',
  './BaseFilter',
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
  BaseFilter,
  GroupSkeleton,
  GroupTemplate,
  ItemTemplate,
  RootFooter,
  RootHeader,
  RootOverlay,
  RootSkeleton,
  RootTemplate
) {
  function _loadTemplate(name, source) {
    BaseFilter.templates[name] = source;
    Mustache.parse(BaseFilter.templates[name]);
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

  return BaseFilter;
});
