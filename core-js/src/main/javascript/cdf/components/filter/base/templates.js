/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


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
