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
/**
 * Event Handlers {@link http://usejsdoc.org/about-plugins.html#event-handlers}
 *
 * Based on the same plugin `eventHandler.js` that common-ui-jsdoc-template assembly provides.
 *
 * Changed the way class and constructor summary are calculated, to take into account
 * the usage of the `summary` tag.
 */
exports.handlers = {
  newDoclet: newDoclet
};

// ---- Events

function newDoclet( event ) {
  const doclet = event.doclet;

  let description = null;
  switch ( doclet.kind ) {
    case "class":
      doclet.classSummary = doclet.summary || _getSummary( doclet.classdesc );
      doclet.constructorSummary = doclet.summary || _getSummary( doclet.description );
      break;
    case "interface":
      description = doclet.description || doclet.classdesc;
      break;
    default:
      description = doclet.description;
  }

  if ( !doclet.summary ) doclet.summary = _getSummary( description );
}

// ---- Private

function _getSummary( description ) {
  const isDescriptionEmpty = description == null || description === "";
  if ( isDescriptionEmpty ) return "";

  const SUMMARY = 0;
  const SUMMARY_END = 1;

  const match = description.split(/((\.?<\/p>)(?:$|\s)?)/);
  return match[SUMMARY] + (match[SUMMARY_END] || "");
}
