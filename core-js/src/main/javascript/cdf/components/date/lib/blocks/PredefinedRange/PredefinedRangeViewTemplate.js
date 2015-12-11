define([
	'../../utils/TemplateFactory'
], function ( TemplateFactory ){
	'use strict';
	
	var template =
    '<div class="predefined-range-block range-label">' +
    '  <span>{{ label }}</span>' +
    '</div>';
  
  return TemplateFactory(template);
});