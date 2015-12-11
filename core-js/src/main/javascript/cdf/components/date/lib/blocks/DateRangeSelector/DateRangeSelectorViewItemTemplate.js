define([
	'../../utils/TemplateFactory'
], function ( TemplateFactory ){
	'use strict';
	
	var template =
    '<div class="selector {{#isSelected}}selected{{/isSelected}}"  {{#isSelected}}selected{{/isSelected}}></div>';
  
  return TemplateFactory(template);
});