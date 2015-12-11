define([
	'../../utils/TemplateFactory'
], function ( TemplateFactory ){
	'use strict';
	
	var template =
    '<div class="precision-button" title="{{tooltip}}"><div class="precision-button-label">{{{label}}}</div></div>';
  
  return TemplateFactory(template);
});