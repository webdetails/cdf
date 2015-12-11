define([
	'../../utils/TemplateFactory'
], function ( TemplateFactory ){
	'use strict';
	
	var template =
    '<div class="calendar-dialog-block {{#precision}}precision-{{precision}}{{/precision}}">' +
    '  <div class="precisions-container clearfix">' +
    '  </div>'+
    '  <div class="calendar-container">' +
    '  </div>' +
    '</div>';

  return TemplateFactory(template);
});