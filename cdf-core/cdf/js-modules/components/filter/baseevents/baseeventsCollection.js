/* jshint devel:true */

define([ 
  './baseevents'],
  function( BaseEvents ) {

        var BaseCollection = BaseEvents.convertClass(Array, {

          push: function() {
            var ret = this.base.apply(this, arguments),
                args = [].slice.call(arguments);
            for (var i = 0, len = args.length; i < len; i++) {
              this.trigger('add', args[i], ret - len + i);
            }
            this.trigger('change');
            return ret;
          },

          pop: function() {
            var ret = this.base.apply(this, arguments);
            this.trigger('remove', ret, this.length);
            this.trigger('change');
            return ret;
          }
        });


   return BaseCollection;
});

