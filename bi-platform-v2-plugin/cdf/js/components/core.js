BaseComponent = Base.extend({
  //type : "unknown",
  visible: true,
  clear : function() {
    $("#"+this.htmlObject).empty();
  },
  clone: function(parameterRemap,componentRemap,htmlRemap) {
    var that;
    that = $.extend(true,{},this);
    if (that.parameters) {
      that.parameters = that.parameters.map(function(param){
        if (param[1] in parameterRemap) {
          return [param[0],parameterRemap[param[1]]];
        } else {
          return param;
        }
      });
    }
    if (that.components) {
      that.components = that.components.map(function(comp){
        if (comp in componentRemap) {
          return componentRemap[comp];
        } else {
          return comp;
        }
      });
    }
    that.htmlObject = !that.htmlObject? undefined : htmlRemap[that.htmlObject];
    if (that.listeners) {
      that.listeners = that.listeners.map(function(param){
        if (param in parameterRemap) {
          return parameterRemap[param];
        } else {
          return param;
        }
      });
    }
    if (that.parameter && that.parameter in parameterRemap) {
      that.parameter = parameterRemap[that.parameter];
    }
    return that;
  },
  getAddIn: function (slot,addIn) {
    var type = typeof this.type == "function" ? this.type() : this.type;
    return Dashboards.getAddIn(type,slot,addIn);
  },
  hasAddIn: function (slot,addIn) {
    var type = typeof this.type == "function" ? this.type() : this.type;
    return Dashboards.hasAddIn(type,slot,addIn);
  },
  getValuesArray : function() {


    var jXML;
    if ( typeof(this.valuesArray) == 'undefined' || this.valuesArray.length == 0) {
      if(typeof(this.queryDefinition) != 'undefined'){

        var vid = (this.queryDefinition.queryType == "sql")?"sql":"none";
        if((this.queryDefinition.queryType == "mdx") && (!this.valueAsId)){
          vid = "mdx";
        } else if (this.queryDefinition.dataAccessId !== undefined && !this.valueAsId) {
          vid = 'cda';
        }
        QueryComponent.makeQuery(this);
        var myArray = new Array();
        for(p in this.result) if(this.result.hasOwnProperty(p)){
          switch(vid){
            case "sql":
              myArray.push([this.result[p][0],this.result[p][1]]);
              break;
            case "mdx":
              myArray.push([this.result[p][1],this.result[p][0]]);
              break;
            case 'cda':
              myArray.push([this.result[p][0],this.result[p][1]]);
              break;
            default:
              myArray.push([this.result[p][0],this.result[p][0]]);
              break;
          }
        }
        return myArray;
      } else {

        //go through parameter array and update values
        var p = new Array(this.parameters?this.parameters.length:0);
        for(var i= 0, len = p.length; i < len; i++){
          var key = this.parameters[i][0];
          var value = this.parameters[i][1] == "" || this.parameters[i][1] == "NIL" ? this.parameters[i][2] : Dashboards.getParameterValue(this.parameters[i][1]);
          p[i] = [key,value];
        }

        //execute the xaction to populate the selector
        var myself=this;
        if (this.url) {
          var arr = {};
          $.each(p,function(i,val){
            arr[val[0]]=val[1];
          });
          jXML = Dashboards.parseXActionResult(myself, Dashboards.urlAction(this.url, arr));
        } else {
          jXML = Dashboards.callPentahoAction(myself, this.solution, this.path, this.action, p,null);
        }
        //transform the result int a javascript array
        var myArray = this.parseArray(jXML, false);
        return myArray;
      }
    } else {
      return this.valuesArray;
    }
  },
  parseArray : function(jData,includeHeader){

    if(jData === null){
      return []; //we got an error...
    }

    if($(jData).find("CdaExport").size() > 0){
      return this.parseArrayCda(jData, includeHeader);
    }

    var myArray = new Array();

    var jHeaders = $(jData).find("COLUMN-HDR-ITEM");
    if (includeHeader && jHeaders.size() > 0 ){
      var _a = new Array();
      jHeaders.each(function(){
        _a.push($(this).text());
      });
      myArray.push(_a);
    }

    var jDetails = $(jData).find("DATA-ROW");
    jDetails.each(function(){
      var _a = new Array();
      $(this).children("DATA-ITEM").each(function(){
        _a.push($(this).text());
      });
      myArray.push(_a);
    });

    return myArray;

  },
  parseArrayCda : function(jData,includeHeader){
    //ToDo: refactor with parseArray?..use as parseArray?..
    var myArray = new Array();

    var jHeaders = $(jData).find("ColumnMetaData");
    if (jHeaders.size() > 0 ){
      if(includeHeader){//get column names
        var _a = new Array();
        jHeaders.each(function(){
          _a.push($(this).attr("name"));
        });
        myArray.push(_a);
      }
    }

    //get contents
    var jDetails = $(jData).find("Row");
    jDetails.each(function(){
      var _a = new Array();
      $(this).children("Col").each(function(){
        _a.push($(this).text());
      });
      myArray.push(_a);
    });

    return myArray;

  },

  setAddInDefaults: function(slot,addIn,defaults) {
    var type = typeof this.type == "function" ? this.type() : this.type;
    Dashboards.setAddInDefaults(type,slot,addIn,defaults)
  },
  setAddInOptions: function(slot, addIn,options) {
    if(!this.addInOptions) {
      this.addInOptions = {};
    }

    if (!this.addInOptions[slot]) {
      this.addInOptions[slot] = {};
    }
    this.addInOptions[slot][addIn] = options
  },

  getAddInOptions: function(slot,addIn) {
    var opts = null;
    try {
      opts = this.addInOptions[slot][addIn];
    } catch (e) {
      /* opts is still null, no problem */
    }
    /* opts is falsy if null or undefined */
    return opts || {};
  }
});






var TextComponent = BaseComponent.extend({
  update : function() {
    $("#"+this.htmlObject).html(this.expression());
  }
});




var CommentsComponent = BaseComponent.extend({
  update : function() {

    // Set page start and length - for pagination
    if(typeof this.firstResult == 'undefined'){
      this.firstResult = 0;
    }
    if(typeof this.maxResults == 'undefined'){
      this.maxResults = 4;
    }

    if (this.page == undefined){
     Dashboards.log("Fatal - no page definition passed","error");
      return;
    }

    this.firePageUpdate();

  },
  firePageUpdate: function(json){

    // Clear previous table
    var placeHolder = $("#"+this.htmlObject);
    placeHolder.empty();
    placeHolder.append('<div class="cdfCommentsWrapper ui-widget"><dl class="cdfCommentsBlock"/></div>');
    var myself = this;
    var args = {
      action: "list",
      page: this.page,
      firstResult: this.firstResult,
      maxResults: this.maxResults + 1 // Add 1 to maxResults for pagination look-ahead
    };
    $.getJSON(webAppPath + "/content/pentaho-cdf/Comments", args, function(json) {
      myself.processCommentsList(json);
    });
  },

  processCommentsList : function(json)
  {
    // Add the possibility to add new comments
    var myself = this;
    var placeHolder = $("#"+this.htmlObject + " dl ");
    myself.addCommentContainer = $('<dt class="ui-widget-header comment-body"><textarea/></dt>'+
      '<dl class="ui-widget-header comment-footer">'+
      '<a class="cdfAddComment">Add Comment</a>'+
      ' <a class="cdfCancelComment">Cancel</a></dl>'
      );
    myself.addCommentContainer.find("a").addClass("ui-state-default");
    myself.addCommentContainer.find("a").hover(
      function(){
        $(this).addClass("ui-state-hover");
      },
      function(){
        $(this).removeClass("ui-state-hover");
      }
      )

    // Cancel
    $(".cdfCancelComment",myself.addCommentContainer).bind('click',function(e){
      myself.addCommentContainer.hide("slow");
      myself.addCommentContainer.find("textarea").val('');
    });

    // Add comment
    $(".cdfAddComment",myself.addCommentContainer).bind('click',function(e){
      var tarea = $("textarea",myself.addCommentContainer);
      var code = tarea.val();
      tarea.val('');
      var args = {
        action: "add",
        page: myself.page,
        comment: code
      };
      $.getJSON(webAppPath + "/content/pentaho-cdf/Comments", args, function(json) {
        myself.processCommentsAdd(json);
      });
      myself.addCommentContainer.hide("slow");
    });

    myself.addCommentContainer.hide();
    myself.addCommentContainer.appendTo(placeHolder);

    // Add comment option
    var addCodeStr = '<div class="cdfAddComment"><a> Add comment</a></div>';

    $(addCodeStr).insertBefore(placeHolder).bind('click',function(e){
      myself.addCommentContainer.show("slow");
      $("textarea",myself.addCommentContainer).focus();
    });

    if (typeof json.error != 'undefined' || typeof json.result == 'undefined') {
      placeHolder.append('<span class="cdfNoComments">There was an error processing comments</span>' );
      json.result = [];
    } else
    if (json.result.length == 0 ){
      placeHolder.append('<span class="cdfNoComments">No comments yet</span>' );
    }
    $.each(json.result.slice(0,this.maxResults), // We drop the lookahead item, if any
      function(i,comment){
        var bodyClass = comment.isMe?"ui-widget-header":"ui-widget-content";
        placeHolder.append('<dt class="'+ bodyClass +' comment-body"><p>'+comment.comment+'</p></dt>');
        placeHolder.append('<dl class="ui-widget-header comment-footer ">'+comment.user+ ",  " + comment.createdOn +  '</dl>');

      });


    // Add pagination support;
    var paginationContent = $('<div class="cdfCommentsPagination ui-helper-clearfix"><ul class="ui-widget"></ul></div>');
    var ul = $("ul",paginationContent);
    if(this.firstResult > 0){
      ul.append('<li class="ui-state-default ui-corner-all"><span class="cdfCommentPagePrev ui-icon ui-icon-carat-1-w"></a></li>');
      ul.find(".cdfCommentPagePrev").bind("click",function(){
        myself.firstResult -= myself.maxResults;
        myself.firePageUpdate();
      });
    }
    // check if we got a lookahead hit
    if(this.maxResults < json.result.length) {
      ul.append('<li class="ui-state-default ui-corner-all"><span class="cdfCommentPageNext ui-icon ui-icon-carat-1-e"></a></li>');
      ul.find(".cdfCommentPageNext").bind("click",function(){
        myself.firstResult += myself.maxResults;
        myself.firePageUpdate();
      });
    }
    paginationContent.insertAfter(placeHolder);


  },
  processCommentsAdd: function(json){
    // json response
    var result = json.result;
    var placeHolder = $("#"+this.htmlObject + " dl ");

    var container = $('<dt class="ui-widget-header comment-body">'+ result.comment +'</dt>'+
      '<dl class="ui-widget-header comment-footer">'+ result.user +
      ", " + result.createdOn + '</dl>'
      );
    container.hide();
    container.insertAfter($("dl:eq(0)",placeHolder));
    container.show("slow");
    this.update();
  }
}
);


var QueryComponent = BaseComponent.extend({
  visible: false,
  update : function() {
    QueryComponent.makeQuery(this);
  },
  warnOnce: function() {
  Dashboards.log("Warning: QueryComponent behaviour is due to change. See " +
    "http://http://www.webdetails.org/redmine/projects/cdf/wiki/QueryComponent" + 
    " for more information");
    delete(this.warnOnce);
  }
},
{
  makeQuery: function(object){

    if (this.warnOnce) {this.warnOnce();}
    var cd = object.queryDefinition;
    if (cd == undefined){
     Dashboards.log("Fatal - No query definition passed","error");
      return;
    }
    var query = new Query(cd);
    object.queryState = query;

    query.fetchData(object.parameters, function(values) {
      // We need to make sure we're getting data from the right place,
      // depending on whether we're using CDA

      changedValues = undefined;
      object.metadata = values.metadata;
      object.result = values.resultset != undefined ? values.resultset: values;
      object.queryInfo = values.queryInfo;
      if((typeof(object.postFetch)=='function')){
        changedValues = object.postFetch(values);
      }
      if (changedValues != undefined){
        values = changedValues;

      }

      if (object.resultvar != undefined){
        Dashboards.setParameter(object.resultvar, object.result);
      }
      object.result = values.resultset != undefined ? values.resultset: values;
      if (typeof values.resultset != "undefined"){
        object.metadata = values.metadata;
        object.queryInfo = values.queryInfo;
      }
    });

  }
}
);

var MdxQueryGroupComponent = BaseComponent.extend({
  visible: false,
  update : function() {
    OlapUtils.updateMdxQueryGroup(this);
  }
});


var FreeformComponent = BaseComponent.extend({
  update : function() {
    this.customfunction(this.parameters || []);
  }
});
