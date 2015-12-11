define([
  'amd!../../../../lib/underscore',
  '../base/BaseEvents'
], function ( _ , BaseEvents ){

  function getDefaultFormat ( grain ){
    var map = {
      day: 'YYYY-MM-DD',
      month: 'YYYY-MM',
      week: 'YYYY-[W]ww',
      isoWeek: 'YYYY-[W]ww',
      quarter: 'YYYY-[Q]Q',
      year: 'YYYY',
      dayOfWeek: 'ddd',
      _separator: ' - '
    };
    return map[grain];
  }

  function dateFormatter ( date , format ){
    return date.format( format );
  }

  function getSharedRegex () {
    return /(\{(.*?)\})/g;
  }
  function getTokensRegex (){
    return  /[{}]/g;
  }
  function getShortFormat ( start , end , format ){
    return _.reduce( format.match( getSharedRegex() ) , function ( memo , match ){
      var isShared = dateFormatter( start , match ) == dateFormatter( end , match );
      return memo.replace( isShared ? match : getTokensRegex() , "" );
    }, format );
  }
  function getLongFormat ( start , end, format ){
    return format.replace( getTokensRegex() , "" );
  }

  function rangeFormatter( start , end , format, particle ){
    var shortStart = dateFormatter( start , getShortFormat( start, end, format ) ),
      longStart = dateFormatter( start , getLongFormat( start, end, format )),
      longEnd = dateFormatter( end , getLongFormat( start, end, format) );
    return ( longStart == longEnd ) ? longStart : shortStart + particle + longEnd;
  }

  function defaultFormatter ( start , end , grain ){
    return rangeFormatter( start , end , getDefaultFormat(grain) || getDefaultFormat('day') );
  }


  // Public
  function format ( start , end, granularity ){
    var opts = this.getFormats();

    function formatter ( start , end , granularity ){
      var ft = _.isObject(opts) && opts[granularity],
        particle = opts['_separator'] || getDefaultFormat('_separator');
      return _.isFunction( ft ) ? ft( start , end , granularity ) :
        _.isString( ft )   ? rangeFormatter( start , end , ft , particle ) :
          defaultFormatter( start , end , granularity );
    }

    return ( _.isFunction( opts ) ? opts : formatter )( start , end , granularity );
  }
  function setFormats( formats ){
    this.formats = formats;
  }
  function getFormats(){
    return this.formats;
  }

  // Constructor
  function RangeFormatter ( formats ){
    this.setFormats( formats );
  }

  // Exports
  return BaseEvents.extend({
    constructor: RangeFormatter,
    setFormats: setFormats,
    getFormats: getFormats,
    format: format
  });

});