define([
	'./RangeFormatter'
],function ( RangeFormatter ){
  'use strict';

  // Public
  function format ( start , granularity ){
    return this.base.call( this, start, start, granularity );
  }

  //Exports
  return RangeFormatter.extend({
    format: format
  });

});