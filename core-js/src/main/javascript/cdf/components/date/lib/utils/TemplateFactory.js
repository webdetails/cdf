define([
	'../../../../lib/mustache',
	'amd!../../../../lib/underscore'
], function ( Mustache , _ ){
	'use strict';

	function TemplateFactory( template ){
		return _.partial( Mustache.render , template );
	}
	
	return TemplateFactory;
});