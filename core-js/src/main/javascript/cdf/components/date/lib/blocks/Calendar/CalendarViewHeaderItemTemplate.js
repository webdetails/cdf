define([
	'../../utils/TemplateFactory'
], function ( TemplateFactory ){
	'use strict';
	
  var template =
    '<th>' +
    '  {{{ label }}}' +
    '</th>';
    
  return TemplateFactory(template);
});