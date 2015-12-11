define([
  '../../utils/TemplateFactory'
], function ( TemplateFactory ){
  'use strict';
    
  var template =
    '<div class="custom-date-block {{foldClass}} {{#isDialogOpen}}open{{/isDialogOpen}}">' +
    '  <div class="date-display">' +
    '    {{{displayDate}}}' +
    '  </div>'+
    '  {{#isDialogOpen}}' +
    '    <div class="calendar-dialog">' +
    '    </div>' +
    '  {{/isDialogOpen}}' +
    '</div>';

  return TemplateFactory(template);
});