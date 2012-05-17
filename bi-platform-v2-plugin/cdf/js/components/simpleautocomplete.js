
var SimpleAutoCompleteComponent = BaseComponent.extend({

    ph: undefined,
    completionCallback: undefined,

    update: function() {
      var myself = this;
      if(this.ph == undefined) {
      this.ph = $("#" + this.htmlObject).empty();
      this.input = $("<input type='text'>").appendTo(this.ph);
      this.query = new Query(this.queryDefinition);
      var myself = this;
      this.input.autocomplete({
        source:function(obj,callback){return myself.triggerQuery(obj.term,callback);}
      });
      this.input.change(function(){
        Dashboards.processChange(myself.name);
      }).keyup(function(event){
        if (event.keyCode == 13) {
          Dashboards.processChange(myself.name);
        }
      });
}
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
      var termVal = "'" + term+ "'";
      if(this.searchParam){
        params.push([this.searchParam, termVal]);
      }
      else if (params.length > 0){
        this.parameters[0][1] = termVal;
      }
      if(term.length >= this.minTextLength) {
        this.query.fetchData(params,this.handleQuery(callback));
      } else {
        callback([]);
      }
    },
    getValue: function() {
      return this.input.val();
    }
});
