BaseComponent = Base.extend({
  //type : "unknown",
  visible: true,
  isManaged: true,
  timerStart: 0,
  timerSplit: 0,
  elapsedSinceSplit: -1,
  elapsedSinceStart: -1,
  logColor: undefined,
  //valueAsId:
  //valuesArray:
  //autoFocus: false,

  placeholder: function(selector) {
    var ho = this.htmlObject;
    return ho ? $("#"+ ho + (selector ? (" " + selector) : "")) : $();
  },

  focus: function() {
    try {
      this
        .placeholder("*:first")
        .focus();
    } catch(ex) { /* Swallow, maybe hidden. */ }
  },

  _doAutoFocus: function() {
    if(this.autoFocus) {
      delete this.autoFocus;
      this.focus();
    }
  },

  clear: function() {
    this.placeholder().empty();
  },

  copyEvents: function(target,events) {
    _.each(events,function(evt, evtName){
      var e = evt,
          tail = evt.tail;
      while((e = e.next) !== tail) {
        target.on(evtName,e.callback,e.context);
      }
    })
  },

  clone: function(parameterRemap,componentRemap,htmlRemap) {
    var that, dashboard, callbacks;
    /*
     * `dashboard` points back to this component, so we need to remove it from
     * the original component before cloning, lest we enter an infinite loop.
     * `_callbacks` contains the event bindings for the Backbone Event mixin
     * and may also point back to the dashboard. We want to clone that as well,
     * but have to be careful about it.
     */
    dashboard = this.dashboard;
    callbacks = this._callbacks;
    delete this.dashboard;
    delete this._callbacks;
    that = $.extend(true,{},this);
    that.dashboard = this.dashboard = dashboard;
    this._callbacks = callbacks;
    this.copyEvents(that,callbacks);

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
          jXML = Dashboards.callPentahoAction(myself, this.path, p,null);
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
  },

  startTimer: function(){

    this.timerStart = new Date();
    this.timerSplit = new Date();

  },

  splitTimer: function(){

    // Sanity check, in case this component doesn't follow the correct workflow
    if(this.elapsedSinceStart === -1 || this.elapsedSinceSplit === -1){
      this.startTimer();
    }

    var now = new Date();

    this.elapsedSinceStart = now.getTime() - this.timerStart.getTime();
    this.elapsedSinceSplit = now.getTime() - this.timerSplit.getTime();

    this.timerSplit = now;
    return this.getTimerInfo();
  },

  formatTimeDisplay: function(t){
    return Math.log(t)/Math.log(10)>=3?Math.round(t/100)/10+"s":t+"ms";
  },

  getTimerInfo: function(){

      return {
        timerStart: this.timerStart,
        timerSplit: this.timerSplit,
        elapsedSinceStart: this.elapsedSinceStart,
        elapsedSinceStartDesc: this.formatTimeDisplay(this.elapsedSinceStart),
        elapsedSinceSplit: this.elapsedSinceSplit,
        elapsedSinceSplitDesc: this.formatTimeDisplay(this.elapsedSinceSplit)
      }

  },

  /*
   * This method assigns and returns a unique and somewhat randomish color for
   * this log. The goal is to be able to track cdf lifecycle more easily in
   * the console logs. We're returning a Hue value between 0 and 360, a range between 0
   * and 75 for saturation and between 45 and 80 for value
   *
   */

  getLogColor: function(){

    if (this.logColor){
      return this.logColor;
    }
    else{
      // generate a unique,

      var hashCode = function(str){
        var hash = 0;
        if (str.length == 0) return hash;
        for (i = 0; i < str.length; i++) {
          var chr = str.charCodeAt(i);
          hash = ((hash<<5)-hash)+chr;
          hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
      }

      var hash = hashCode(this.name).toString();
      var hueSeed = hash.substr(hash.length-6,2) || 0;
      var saturationSeed = hash.substr(hash.length-2,2) || 0;
      var valueSeed = hash.substr(hash.length-4,2) || 0;

      this.logColor = Dashboards.hsvToRgb(360/100*hueSeed, 75/100*saturationSeed, 45 + (80-45)/100*valueSeed);
      return this.logColor;

    }


  }

});

var TextComponent = BaseComponent.extend({
  update : function() {
    this.placeholder().html(this.expression());
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
    var placeHolder = this.placeholder();
    placeHolder.empty();
    placeHolder.append('<div class="cdfCommentsWrapper ui-widget"><dl class="cdfCommentsBlock"/></div>');
    var myself = this;
    var args = {
      page: this.page,
      firstResult: this.firstResult,
      maxResults: this.maxResults + 1 // Add 1 to maxResults for pagination look-ahead
    };
    $.getJSON(webAppPath + "/plugin/pentaho-cdf/api/comments/list", args, function(json) {
      myself.processCommentsList(json);
    });
  },

  processCommentsList : function(json)
  {
    // Add the possibility to add new comments
    var myself = this;
    var placeHolder = this.placeholder("dl ");
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
        page: myself.page,
        comment: code
      };
      $.getJSON(webAppPath + "/plugin/pentaho-cdf/api/comments/add", args, function(json) {
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
    var placeHolder = this.placeholder("dl ");

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

    query.fetchData(object.parameters == undefined ? [] : object.parameters, function(values) {
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

var ManagedFreeformComponent = BaseComponent.extend({
  update : function() {
    this.customfunction(this.parameters || []);
  }
});


/*
 * UnmanagedComponent is an advanced version of the BaseComponent that allows
 * control over the core CDF lifecycle for implementing components. It should
 * be used as the base class for all components that desire to implement an
 * asynchronous lifecycle, as CDF cannot otherwise ensure that the postExecution
 * callback is correctly handled.
 */
var UnmanagedComponent = BaseComponent.extend({
  isManaged: false,
  isRunning: false,

  /*
   * Handle calling preExecution when it exists. All components extending
   * UnmanagedComponent should either use one of the three lifecycles declared
   * in this class (synchronous, triggerQuery, triggerAjax), or call this method
   * explicitly at the very earliest opportunity. If preExec returns a falsy
   * value, component execution should be cancelled as close to immediately as
   * possible.
   */
  preExec: function() {
    /*
     * runCounter gets incremented every time we run a query, allowing us to
     * determine whether the query has been called again after us.
     */
    if(typeof this.runCounter == "undefined") {
      this.runCounter = 0;
    }
    var ret;
    if (typeof this.preExecution == "function") {
      try {
        ret = this.preExecution();
        ret = typeof ret == "undefined" || ret;
      } catch(e){
        this.error( Dashboards.getErrorObj('COMPONENT_ERROR').msg, e);
        this.dashboard.log(e,"error");
        ret = false;
      }
    } else {
      ret = true;
    }
    this.trigger('cdf cdf:preExecution', this, ret);
    return ret;
  },

  /*
   * Handle calling postExecution when it exists. All components extending
   * UnmanagedComponent should either use one of the three lifecycles declared
   * in this class (synchronous, triggerQuery, triggerAjax), or call this method
   * explicitly immediately before yielding control back to CDF.
   */
  postExec: function() {
    if(typeof this.postExecution == "function") {
      this.postExecution();
    }
    this.trigger('cdf cdf:postExecution', this);
  },

  drawTooltip: function() {
    if (this.tooltip) {
      this._tooltip = typeof this.tooltip == "function" ?
          this.tooltip():
          this.tooltip;
    }
  },
  showTooltip: function() {
    if(typeof this._tooltip != "undefined") {
      this.placeholder().attr("title",this._tooltip).tooltip({
        delay:0,
        track: true,
        fade: 250
      });
    }
  },

  /*
   * The synchronous lifecycle handler closely resembles the core CDF lifecycle,
   * and is provided as an alternative for components that desire the option to
   * alternate between a synchronous and asynchronous style lifecycles depending
   * on external configuration (e.g. if it can take values from either a static
   * array or a query). It take the component drawing method as a callback.
   */
  synchronous: function(callback, args) {
    if (!this.preExec()) {
      return;
    }
    var silent = this.isSilent();
    if(!silent) {
      this.block();
    }
    setTimeout(_.bind(function(){
      try{
        /* The caller should specify what 'this' points at within the callback
         * via a Function#bind or _.bind. Since we need to pass a 'this' value
         * to call, the component itself is the only sane value to pass as the
         * callback's 'this' as an alternative to using bind.
         */
        callback.call(this, args || []);
        this.drawTooltip();
        this.postExec();
        this.showTooltip();
      } catch(e){
        this.error(Dashboards.getErrorObj('COMPONENT_ERROR').msg, e );
        this.dashboard.log(e,"error");
      } finally {
        if(!silent) {
          this.unblock();
        }
      }
    },this), 10);
  },

  /*
   * The triggerQuery lifecycle handler builds a lifecycle around Query objects.
   *
   * It takes a query definition object that is passed directly into the Query
   * constructor, and the component rendering callback, and implements the full
   * preExecution->block->render->postExecution->unblock lifecycle. This method
   * detects concurrent updates to the component and ensures that only one
   * redraw is performed.
   */
  triggerQuery: function(queryDef, callback, userQueryOptions) {
    if(!this.preExec()) {
      return;
    }
    var silent = this.isSilent();
    if (!silent){
      this.block();
    };
    userQueryOptions = userQueryOptions || {};
    /*
     * The query response handler should trigger the component-provided callback
     * and the postExec stage if the call wasn't skipped, and should always
     * unblock the UI
     */
    var success = _.bind(function(data) {
      callback(data);
      this.postExec();
    },this);
    var always = _.bind(function (){
      if (!silent){
        this.unblock();
      }
    }, this);
    var handler = this.getSuccessHandler(success, always),
        errorHandler = this.getErrorHandler();

    var query = this.queryState = this.query = new Query(queryDef);
    var ajaxOptions = {
      async: true
    }
    if(userQueryOptions.ajax) {
      _.extend(ajaxOptions,userQueryOptions.ajax);
    }
    query.setAjaxOptions(ajaxOptions);
    if(userQueryOptions.pageSize){
      query.setPageSize(userQueryOptions.pageSize);
    }
    query.fetchData(this.parameters, handler, errorHandler);
  },

  /*
   * The triggerAjax method implements a lifecycle based on generic AJAX calls.
   * It implements the full preExecution->block->render->postExecution->unblock
   * lifecycle.
   *
   * triggerAjax can be used with either of the following call conventions:
   * - this.triggerAjax(url,params,callback);
   * - this.triggerAjax({url: url, data: params, ...},callback);
   * In the second case, you can add any other jQuery.Ajax parameters you desire
   * to the object, but triggerAjax will take control over the success and error
   * callbacks.
   */
  triggerAjax: function(url,params,callback) {
    if(!this.preExec()) {
      return;
    }
    var silent = this.isSilent();
    if (!silent){
      this.block();
    };
    var ajaxParameters = {
      async: true
    };
    /* Detect call convention used and adjust parameters */
    if (typeof callback != "function") {
      callback = params;
      _.extend(ajaxParameters,url);
    } else {
      _.extend(ajaxParameters,{
        url: url,
        data: params
      });
    }
    var success = _.bind(function(data){
      callback(data);
      this.trigger('cdf cdf:render',this,data);
      this.postExec();
    },this);
    var always = _.bind(function (){
      if (!silent){
        this.unblock();
      }
    }, this);
    ajaxParameters.success = this.getSuccessHandler(success,always);
    ajaxParameters.error = this.getErrorHandler();
    jQuery.ajax(ajaxParameters);
  },


  /*
   * Increment the call counter, so we can keep track of the order in which
   * requests were made.
   */
  callCounter: function() {
    return ++this.runCounter;
  },

  /* Trigger an error event on the component. Takes as arguments the error
   * message and, optionally, a `cause` object.
   * Also
   */
  error: function(msg, cause) {
    msg = msg || Dashboards.getErrorObj('COMPONENT_ERROR').msg;
    if (!this.isSilent()){
      this.unblock();
    };
    this.errorNotification({
      error: cause,
      msg: msg
    });
    this.trigger("cdf cdf:error", this, msg , cause || null);
  },
  /*
   * Build a generic response handler that runs the success callback when being
   * called in response to the most recent AJAX request that was triggered for
   * this component (as determined by comparing counter and this.runCounter),
   * and always calls the always callback. If the counter is not provided, it'll
   * be generated automatically.
   *
   * Accepts the following calling conventions:
   *
   * - this.getSuccessHandler(counter, success, always)
   * - this.getSuccessHandler(counter, success)
   * - this.getSuccessHandler(success, always)
   * - this.getSuccessHandler(success)
   */
  getSuccessHandler: function(counter,success,always) {

    if (arguments.length === 1) {
    /* getSuccessHandler(success) */
      success = counter;
      counter = this.callCounter();
    } else if (typeof counter == 'function') {
      /* getSuccessHandler(success,always) */
      always = success;
      success = counter;
      counter = this.callCounter();
    }
    return _.bind(function(data) {
        var newData;
        if(counter >= this.runCounter) {
          try {
            if(typeof this.postFetch == "function") {
              newData = this.postFetch(data);
              this.trigger('cdf cdf:postFetch',this,data);
              data = typeof newData == "undefined" ? data : newData;
            }
            success(data);
          } catch(e) {
            this.error(Dashboards.getErrorObj('COMPONENT_ERROR').msg, e);
            this.dashboard.log(e,"error");
          }
        }
        if(typeof always == "function") {
          always();
        }
    },
    this);
  },

  getErrorHandler: function() {
    return  _.bind(function() {
      var err = Dashboards.parseServerError.apply(this, arguments );
      this.error( err.msg, err.error );
    },
    this);
  },
  errorNotification: function (err, ph) {
    ph = ph || (this.htmlObject ? this.placeholder() : undefined);
    var name = this.name.replace('render_', '');
    err.msg = err.msg + ' (' + name + ')';
    Dashboards.errorNotification( err, ph );
  },

  /*
   * Trigger UI blocking while the component is updating. Default implementation
   * uses the global CDF blockUI, but implementers are encouraged to override
   * with per-component blocking where appropriate (or no blocking at all in
   * components that support it!)
   */
  block: function() {
    if(!this.isRunning){
      this.dashboard.incrementRunningCalls();
      this.isRunning = true;
    }
  },

  /*
   * Trigger UI unblock when the component finishes updating. Functionality is
   * defined as undoing whatever was done in the block method. Should also be
   * overridden in components that override UnmanagedComponent#block.
   */
  unblock: function() {
    if(this.isRunning) {
      this.dashboard.decrementRunningCalls();
      this.isRunning = false;
    }
  },

  isSilent: function (){
    return (this.lifecycle) ? !!this.lifecycle.silent : false;
  }
});

var FreeformComponent = UnmanagedComponent.extend({

  update: function() {
    var render = _.bind(this.render,this);
    if(typeof this.manageCallee == "undefined" || this.manageCallee) {
      this.synchronous(render);
    } else {
      render();
    }
  },

  render : function() {
    var parameters =this.parameters || [];
    this.customfunction(parameters);
  }
});

