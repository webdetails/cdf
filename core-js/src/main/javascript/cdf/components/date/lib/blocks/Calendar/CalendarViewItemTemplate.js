define([
	'../../utils/TemplateFactory'
], function ( TemplateFactory ){
	'use strict';
	
	var template =
    '<td>' +
    '  <div class="{{#isSelected}}selected {{/isSelected}}{{#isDisabled}}disabled {{/isDisabled}}{{#isCurrentPeriod}}current-period {{/isCurrentPeriod}}{{^isCurrentPeriod}}outside-period {{/isCurrentPeriod}}" ' +
    '       {{#isSelected}}selected {{/isSelected}}{{#isDisabled}}disabled {{/isDisabled}}{{#isCurrentPeriod}}current-period {{/isCurrentPeriod}}{{^isCurrentPeriod}}outside-period {{/isCurrentPeriod}} >' +
    '    {{{ label }}}' +
    '  </div>' +
    '</td>';
    
  return TemplateFactory(template);
});