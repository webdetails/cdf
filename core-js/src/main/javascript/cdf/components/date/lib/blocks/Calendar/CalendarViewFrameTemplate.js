define([
	'../../utils/TemplateFactory'
], function ( TemplateFactory ){
	'use strict';
	
  var template =
    '<div class="calendar-block">' +
    '  <table>' +
    '    <thead class="calendar-header"></thead>' +
    '    <tbody class="calendar-body"></tbody>' +
    '  </table>' +
    '</div>';

  return TemplateFactory(template);
});