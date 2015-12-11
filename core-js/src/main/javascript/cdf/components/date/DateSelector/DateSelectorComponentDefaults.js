define([
  '../lib/base/BaseModel'
], function(BaseModel) {
  'use strict';

  var defaults = {
    inputFormat: 'YYYY-MM-DD',
    inputParameters: [ 'date' ]
  };

  return ( new BaseModel( defaults ) );
});