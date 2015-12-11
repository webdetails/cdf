define([
  '../../utils/TemplateFactory'
], function ( TemplateFactory ){
  'use strict';
    
  var template =
    '<div class="custom-range-block">' +
    '  <div class="custom-range-label range-label">' +
    '    <span> {{{ labels.customRange }}} </span> ' +
    '  </div> ' +
    '  {{#isOpen}}' +
    '    <div class="custom-range-dropdown dropdown"> ' +
    '      <div class="precisions-container"> ' +
    '        <div class="precisions-header header-label">{{{ labels.selectedPeriod }}}</div>' +
    '        <div class="precisions-body"></div>' +
    '      </div> ' +
    '      <div class="calendars-container"> ' +
    '        <div class="start-calendar-dialog-container">' +
    '          <div class="start-calendar-dialog-header header-label">{{{ labels.startDate }}}</div> '+
    '          <div class="start-calendar-dialog"></div>'+
    '        </div> ' +
    '        <div class="end-calendar-dialog-container">' +
    '          <div class="end-calendar-dialog-header header-label">{{{ labels.endDate }}}</div> '+
    '          <div class="end-calendar-dialog"></div>'+
    '        </div> ' +
    '      </div> ' +
    '      <div class="granularities-container {{foldClass}} {{#isGranularitiesOpen}}open{{/isGranularitiesOpen}} ">' +
    '        <div class="granularities-header header-label">{{{ labels.granularity }}}</div>' +
    '        <div class="granularities-body">' +
    '          <div class="granularities-display" >' +
    '            {{selectedGranularityDisplay}}' +
    '          </div>' +
    '          {{#isGranularitiesOpen}}' +
    '            <div class="granularities-dropdown">' +
    '            </div>' +
    '          {{/isGranularitiesOpen}}' +
    '        </div>' +
    '      </div> ' +
    '    </div> ' +
    '  {{/isOpen}}' +
    '</div>';
  
  return TemplateFactory(template);
});