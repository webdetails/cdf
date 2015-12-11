define([
  '../lib/base/BaseModel'
], function(BaseModel) {
  'use strict';

  return (new BaseModel({
    inputFormat: 'YYYY-MM-DD',
    inputParameters: [ 'granularity' , 'precision' , 'start' , 'end']
  }));

});