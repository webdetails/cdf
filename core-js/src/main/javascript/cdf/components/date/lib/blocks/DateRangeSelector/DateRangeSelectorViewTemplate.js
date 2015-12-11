define([
  '../../utils/TemplateFactory'
], function ( TemplateFactory ){
  'use strict';
  
  var template =
    '<div class="date-range-selector-block">' +
    '  <div class="range-display">' +
    '    <span> {{{ rangeDisplay }}} </span> ' +
    '  </div> ' +
    '  {{#isDropdownOpen}}' +
    '  <div class="date-range-selector-dropdown dropdown"> ' +
    '    {{#areActionsOnTop}}' +
    '    <div class="buttons-container buttons-container-top clearfix">' +
    '      <div class="button-container cancel-button-container">' +
    '        <button class="cancel-button">{{labels.cancelButton}}</button>' +
    '      </div>' +
    '      <div class="button-container apply-button-container">' +
    '        <button class="apply-button {{^hasRangeChanged}}disabled{{/hasRangeChanged}}" ' +
    '                {{^hasRangeChanged}}disabled{{/hasRangeChanged}}>{{labels.applyButton}}</button>' +
    '      </div>' +
    '    </div>' +
    '    {{/areActionsOnTop}}' +
    '    <div class="selectors-container"> ' +
    '      <div class="selectors-header header-label">{{labels.intervals}}</div>'+
    '      <div class="selectors-body"></div>' +
    '    </div> ' +
    '    {{^areActionsOnTop}}' +
    '    <div class="buttons-container buttons-container-bottom clearfix">' +
    '      <div class="button-container cancel-button-container">' +
    '        <button class="cancel-button">{{labels.cancelButton}}</button>' +
    '      </div>' +
    '      <div class="button-container apply-button-container">' +
    '        <button class="apply-button {{^hasRangeChanged}}disabled{{/hasRangeChanged}}" ' +
    '                {{^hasRangeChanged}}disabled{{/hasRangeChanged}}>{{labels.applyButton}}</button>' +
    '      </div>' +
    '    </div>' +
    '    {{/areActionsOnTop}}' +
    '  </div> ' +
    '  {{/isDropdownOpen}}' +
    '</div>';

  return TemplateFactory(template);
});