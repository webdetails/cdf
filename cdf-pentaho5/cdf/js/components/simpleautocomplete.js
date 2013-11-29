/*!
* Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
* 
* This software was developed by Webdetails and is provided under the terms
* of the Mozilla Public License, Version 2.0, or any later version. You may not use
* this file except in compliance with the license. If you need a copy of the license,
* please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
*
* Software distributed under the Mozilla Public License is distributed on an "AS IS"
* basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
* the license for the specific language governing your rights and limitations.
*/

var SimpleAutoCompleteComponent = BaseComponent.extend({

    ph: undefined,
    completionCallback: undefined,

    update: function() {
      var myself = this;
      if(this.ph == undefined) {
      this.ph = $("#" + this.htmlObject).empty();
      this.input = $("<input type='text'>").appendTo(this.ph);
      this.query = Dashboards.getQuery(this.queryDefinition);
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
