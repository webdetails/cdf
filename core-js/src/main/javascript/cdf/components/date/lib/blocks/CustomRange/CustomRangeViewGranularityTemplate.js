define([
	'../../utils/TemplateFactory'
], function ( TemplateFactory ){
	'use strict';
	
	var template =
    '<div class="custom-range-granularity {{#isSelected}}selected{{/isSelected}}" {{#isSelected}}selected{{/isSelected}}>' +
    '  {{label}}' +
    '</div>';
  
  return TemplateFactory(template);
});