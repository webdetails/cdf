
var SimpleAutoCompleteComponent = BaseComponent.extend({

    ph: undefined,
    completionCallback: undefined,

    update: function() {
      this.ph = $("#" + this.htmlObject).empty();
      this.input = $("<input type='text'>").appendTo(this.ph);
      this.query = new Query(this.queryDefinition);
      var myself = this;
      this.input.autocomplete({
        source:function(term,callback){return myself.triggerQuery(term,callback);}
      });
    },

    handleQuery: function(callback) {
      var myself = this;
      return function(values) {
        if(typeof myself.postFetch == "function") {
          var changedValues = myself.postFetch(values);
          values = changedValues || values;
        };
        var results = values.resultset.map(function(e){return e[0];});
        callback(results);
      }
    },

    triggerQuery: function(term,callback){
      var params = $.extend([],this.parameters);
      params.push([this.termParam,term]);
      if(term.length >= this.minTextLength) {
        this.query.fetchData(params,this.handleQuery(callback));
      } else {
        callback([]);
      }
    }
})


