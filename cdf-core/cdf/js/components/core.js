/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

BaseComponent = Base.extend(Backbone.Events).extend({

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

  clear : function() {
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
     * `_events` contains the event bindings for the Backbone Event mixin
     * and may also point back to the dashboard. We want to clone that as well,
     * but have to be careful about it.
     */
    dashboard = this.dashboard;
    callbacks = this._events;
    delete this.dashboard;
    delete this._events;
    that = $.extend(true,{},this);
    that.dashboard = this.dashboard = dashboard;
    this._events = callbacks;
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
    Dashboards.log("BaseComponent.setAddInDefaults was removed. You should call setAddInOptions or Dashboards.setAddInDefaults");
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

/*******
 * Comments Component
 ********/

var CommentsComponent = BaseComponent.extend({

  processing: function () {

    var myself = {};

    myself.defaults = {
      dataTemplates: {
        comments:         '<div class="commentsDetails">'+
                          ' {{#user}} {{{user}}}, {{/user}} {{{createdOn}}}'+
                          '</div>'+
                          '<div class="commentsBody">'+
                          ' <div class="comment">'+
                          '   {{{comment}}}'+
                          ' </div>'+
                          ' {{#user}}'+
                          ' <div class="operation">'+
                          ' {{#permissions.deletePermission}}'+
                          '   <div class="delete">X</div>' +
                          ' {{/permissions.deletePermission}}'+
                          ' {{#permissions.archive}}'+
                          '  <div class="archive">X</div>' +
                          ' {{/permissions.archive}}'+
                          ' </div>'+
                          ' {{/user}}'+
                          '</div>'
                          ,

        addComments:      '<div class="commentsAdd">'+
                          '{{#add}}'+
                          ' <div class="addComment">Add Comment</div>'+
                          ' <div class="addCommentWrapper">'+
                          '   <textarea class=addCommentText></textarea>'+
                          '   <div class="commentsButtons">'+
                          '   <div class="saveComment">Save</div>'+
                          '   <div class="cancelComment">Cancel</div>'+
                          '   </div>'+
                          ' </div>'+
                          '{{/add}}'+
                          '</div>'
                          ,

        paginateComments: '<div class="paginate commentPaginate"> '+
                          '{{#active}}'+
                          ' <div class="navigateRefresh"> Refresh </div>'+
                          ' <div class="navigatePrevious"> Newest Comments </div>'+
                          ' <div class="navigateNext"> Oldest Comments </div>'+
                          '{{/active}}'+
                          '</div>'
      }

    };

    // Process operations
    myself.operations = {

      processOperation: function(operation, comment, collection, callback, defaults) {
        var options = {};
        switch(operation) {
          case 'LIST_ALL':
            options = {data: {action: 'list', page: defaults.page, firstResult: defaults.paginate.firstResult, maxResults: defaults.paginate.maxResults, where: false}};
            break;

          case 'LIST_ACTIVE':
            options = {data: {action: 'list', page: defaults.page, firstResult: defaults.paginate.firstResult, maxResults: defaults.paginate.maxResults}};
            break;

          case 'GET_LAST':
            options = {data: {action: 'list', page: defaults.page, firstResult: 0, maxResults: 1}};
            break;

          case 'DELETE_COMMENT':
            options = {data: {action: 'delete', page: defaults.page, commentId: comment}};
            break;

          case 'ARCHIVE_COMMENT':
            options = {data: {action: 'archive', page: defaults.page, commentId: comment}};
            break;

          case 'ADD_COMMENT':
            options = {data: {action: 'add', page: defaults.page, comment: comment}};
            break;
        }

        this.requestProcessing(options, operation, collection, callback);
      },

      requestProcessing: function(options, operation, collection, callback) {
        var myself = this;
        options = options || {};
        var ajaxOpts = {
          type: 'GET',
          url: wd.cdf.endpoints.getComments(operation),
          success: function(data) {
            myself.requestResponse(data, operation, collection, callback)
          },
          dataType: 'json'
        };
        ajaxOpts = _.extend({}, ajaxOpts, options);
        $.ajax(ajaxOpts);
      },

      resetCollection: function(result) {
        var paginate = myself.options.paginate;
        var start = paginate.activePageNumber * paginate.pageCommentsSize;
        var end = ((start+paginate.pageCommentsSize) < result.length) ? (start + paginate.pageCommentsSize) : result.length;
        var commentsArray = [];

        for(var idx = start; idx < end; idx++) {
          var singleComment = new myself.CommentModel(result[idx]);
          commentsArray.push(singleComment)
        }
        return commentsArray;
      },

      requestResponse: function(json, operation, collection, callback) {
        if((operation == 'LIST_ALL') || (operation == 'LIST_ACTIVE')) {
          var paginate = myself.options.paginate;
          if(paginate.activePageNumber > 0) {
            if((paginate.activePageNumber + 1) > Math.ceil(json.result.length / paginate.pageCommentsSize))
             paginate.activePageNumber--;
          }
          myself.options.queryResult = json.result;
          collection.reset(this.resetCollection(json.result));
          if((paginate.activePageNumber == 0) && ((json) && (typeof json.result != 'undefined')) && (json.result.length == 0)) {
            json.result = [{
              id: 0,
              comment: 'No Comments to show!',
              createdOn: '',
              elapsedMinutes: '',
              isArchived: false,
              isDeleted: false,
              isMe: true,
              page: '',
              user: '',
              permissions: {
                add: false,
                archive: false,
                remove: false
              }
            }];
            if((collection) && (typeof collection != 'undefined')) {
              collection.reset(this.resetCollection(json.result));
            }
          }
        }
        if((callback) && (typeof callback != 'undefined')) {
          callback.apply(this, [json, collection]);
        }
      }
    };

    myself.CommentModel = Backbone.Model.extend({
        defaults: {
          id: 0,
          comment: 'Guest User',
          createdOn: '',
          elapsedMinutes: '',
          isArchived: false,
          isDeleted: false,
          isMe: true,
          page: 'comments',
          user: 'comments',
          permissions: {}
        },

        initialize: function() {
          this.set('permissions', myself.options.permissions);
        }

    });

    myself.CommentView = Backbone.View.extend({
      tagName: 'div',
      className: 'commentView',

      events: {
        "click .delete": "deleteComment",
        "click .archive": "archiveComment"
      },

      initialize: function(model) {
        _.bindAll(this, 'render', 'deleteComment', 'archiveComment');
        this.model = model;
      },

      render: function(){
        this.$el.append(Mustache.render(myself.defaults.dataTemplates.comments, this.attributes));
        return this.$el;
      },

      deleteComment: function() {
        var callback = function(data, collection) {
          myself.operations.processOperation('LIST_ACTIVE', null, collection, null, myself.options);
        };
        myself.operations.processOperation('DELETE_COMMENT', this.model.get('id'), this.model.collection, callback, myself.options);
      },

      archiveComment: function() {
        var callback = function(data, collection) {
          myself.operations.processOperation('LIST_ACTIVE', null, collection, null, myself.options);
        };
        myself.operations.processOperation('ARCHIVE_COMMENT', this.model.get('id'), this.model.collection, callback, myself.options);
      }

    });

    myself.CommentsCollection = Backbone.Collection.extend({
      model: myself.CommentModel
    });

    myself.CommentsView = Backbone.View.extend({
      tagName: 'div',
      className: 'commentComponent',

      events: {
        "click .addComment": "addComment",
        "click .saveComment": "saveComment",
        "click .cancelComment": "cancelComment",
        "click .navigatePrevious": "navigatePrevious",
        "click .navigateNext": "navigateNext",
        "click .navigateRefresh": "navigateRefresh"
      },

      initialize: function(collection) {
         _.bindAll(this, 'render',
                         'addComment',
                         'saveComment',
                         'cancelComment',
                         'renderSingeComment',
                         'addComment',
                         'saveComment',
                         'cancelComment',
                         'navigateNext',
                         'navigatePrevious',
                         'commentsUpdateNotification');

        this.collection = collection;

        this.collection.on('reset', this.renderComments, this);
        this.collection.on('commentsUpdateNotification', this.commentsUpdateNotification);

        this.render();
      },

      renderComments: function() {
        var $commentsElem = $('#' + myself.options.htmlObject + ' > div .commentsGroup');
        $commentsElem.empty();
        _(this.collection.models).each(function(comment) {
          $commentsElem.append(this.renderSingeComment(comment));
        }, this);
      },

      render: function() {
        var $renderElem = $('#' + myself.options.htmlObject);
        var $commentsElem = $('<div/>').addClass('commentsGroup');
        _(this.collection.models).each(function(comment) {
          $commentsElem.append(this.renderSingeComment(comment));
        }, this);
        var $add = $(Mustache.render(myself.defaults.dataTemplates.addComments, myself.options.permissions));
        var $paginate = $(Mustache.render(myself.defaults.dataTemplates.paginateComments, myself.options.paginate));
        this.$el.empty().append($commentsElem, $add, $paginate);
        $renderElem.html(this.$el);
        this.updateNavigateButtons();
      },

      renderSingeComment: function(comment) {
        var singleCommentView = new myself.CommentView(comment);
        return singleCommentView.render();
      },

      addComment: function() {
        this.showAddComment();
      },

      saveComment: function() {
        var self = this;
        var text = this.$el.find('.addCommentText').val();
        var callback = function(data, collection) {
          self.hideAddComment();
          var paginate = myself.options.paginate;
          paginate.activePageNumber = 0;
          myself.operations.processOperation('LIST_ACTIVE', null, collection, null, myself.options);
        };
        myself.operations.processOperation('ADD_COMMENT', text, this.collection, callback, myself.options);

      },

      cancelComment: function() {
        this.hideAddComment();
      },

      navigateNext: function() {
        var paginate = myself.options.paginate;
        var start = paginate.activePageNumber * paginate.pageCommentsSize;
        if((start + paginate.pageCommentsSize) < myself.options.queryResult.length) {
          paginate.activePageNumber++;
          this.collection.reset(myself.operations.resetCollection(myself.options.queryResult));
        }
        this.commentsUpdateNotification();
        this.updateNavigateButtons();
      },

      navigatePrevious: function() {
        var paginate = myself.options.paginate;
        var start = paginate.activePageNumber;
        if(paginate.activePageNumber > 0) {
          paginate.activePageNumber--;
          this.collection.reset(myself.operations.resetCollection(myself.options.queryResult));
        }
        this.commentsUpdateNotification();
        this.updateNavigateButtons();
      },

      navigateRefresh: function() {
        var paginate = myself.options.paginate;
        myself.options.paginate.activePageNumber = 0;
        myself.operations.processOperation('LIST_ACTIVE', null, this.collection, null, myself.options);
        $('div.navigateRefreshPopup:first').remove();
        $('div.navigateRefresh:first').stop();
      },

      updateNavigateButtons: function() {
        var paginate = myself.options.paginate;
        $('.navigatePrevious').addClass("disabled");
        $('.navigateNext').addClass("disabled");
        if(paginate.activePageNumber > 0) {
          $('.navigatePrevious').removeClass("disabled");
        }
        if((paginate.activePageNumber + 1) < Math.ceil(myself.options.queryResult.length / paginate.pageCommentsSize)) {
          $('.navigateNext').removeClass("disabled");
        }
      },

      commentsUpdateNotification: function() {
        if(myself.options.queryResult.length > 0) {
          var lastCommentDate = myself.options.queryResult[0].createdOn;
          var callback = function(data) {
            if(data.result.length > 0) {
              if(!!(data.result[0].createdOn == lastCommentDate)) {
              } else {
                var refreshBtn = $('div.navigateRefresh:first');
                if(!($('div.navigateRefreshPopup:first').length)) {
                  var popup = $("<div>")
                    .attr('class', 'navigateRefreshPopup')
                    .css('position', 'absolute')
                    .html('New comments, please refresh!')
                    .hide();

                  refreshBtn.prepend(popup);
                  var refreshBtnPos = refreshBtn.position();

                  popup
                    .offset({
                      top: refreshBtnPos.top - (popup.height() + refreshBtn.height() / 2),
                      left: refreshBtnPos.left + refreshBtn.width() / 2 - popup.width() / 2})
                    .toggle("bounce", {times: 3}, "slow");

                  var btnHighlighter = setInterval(function() {
                    refreshBtn.effect('highlight', {color: '#c0c0c0'}, 2000);
                  }, 4000);

                  refreshBtn.on('click', function() { clearInterval(btnHighlighter); });
                }
              }
            }
          }
          myself.operations.processOperation('GET_LAST', null, null, callback, myself.options);
        }
      },

      showAddComment: function() {
        this.$el.find('.addCommentWrapper').show();
        this.$el.find('.paginate').hide();
        this.$el.find('.addCommentText').val('');
      },

      hideAddComment: function() {
        this.$el.find('.addCommentWrapper').hide();
        this.$el.find('.paginate').show();
        this.$el.find('.addCommentText').val('');
      }

    });

    myself.start = function(options) {
      myself.options = options;
      myself.defaults = _.extend({}, myself.defaults, options.defaults);

      myself.commentsCollection = new myself.CommentsCollection();
      myself.operations.processOperation('LIST_ACTIVE', null, myself.commentsCollection, null, myself.options);
      myself.commentsView = new myself.CommentsView(myself.commentsCollection);

      if(myself.options.intervalActive) {
        var refresh = function() {
          myself.operations.processOperation('LIST_ACTIVE', null, myself.commentsCollection, null, myself.options);
        }
        setInterval(function () { myself.commentsCollection.trigger('commentsUpdateNotification'); }, myself.options.interval);
      }

    };

    return myself;
  },

  /*****
   * Process component
   *****/
  update: function() {

    // Set page start and length for pagination
    this.paginateActive = (typeof this.paginate == 'undefined') ? true : this.paginate;
    this.pageCommentsSize = (typeof this.pageCommentsSize == 'undefined') ? 10 : this.pageCommentsSize;
    this.firstResult = (typeof this.firstResult == 'undefined') ? 0 : this.firstResult;
    this.maxResults  = (typeof this.maxResults  == 'undefined') ? 100 : this.maxResults;
    this.interval  = (typeof this.interval  == 'undefined') ? 60000 : this.interval;
    this.intervalActive  = (typeof this.intervalActive  == 'undefined') ? true : this.intervalActive;

    this.addPermission = (typeof this.addPermission == 'undefined') ? true : this.addPermission;
    this.deletePermission = (typeof this.deletePermission == 'undefined') ? false : this.deletePermission;
    this.archivePermission = (typeof this.archivePermission == 'undefined') ? true : this.archivePermission;

    this.options = (typeof this.options == 'undefined') ? {} : this.options;

    // set the page name for the comments
    if(this.page == undefined) {
      Dashboards.log("Fatal - no page definition passed", "error");
      return;
    }
    options = {
      htmlObject: this.htmlObject,
      page: this.page,
      intervalActive: this.intervalActive,
      interval: this.interval,
      paginate: {
        active: this.paginateActive,
        activePageNumber: 0,
        pageCommentsSize: this.pageCommentsSize,
        firstResult: this.firstResult,
        maxResults: this.maxResults
      },
      permissions: {
        add: this.addPermission,
        deletePermission: this.deletePermission,
        archive: this.archivePermission
      },
      defaults: this.options
    }

    this.processing().start(options);
  }

});

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
        fade: 250,
        content: this._tooltip
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

    var query = this.queryState = this.query = Dashboards.getQuery( queryDef);
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
   * - this.triggerAjax({url: url, data: params, ...},callback, ajaxParameters);
   * In the second case, you can add any other jQuery.Ajax parameters you desire
   * to the object, but triggerAjax will take control over the success and error
   * callbacks.
   * If passed, the supplied ajaxParameters will be passed to the default ajax call
   */
  triggerAjax: function(url,params,callback,_ajaxParameters) {
    if(!this.preExec()) {
      return;
    }
    var silent = this.isSilent();
    if (!silent){
      this.block();
    };
    var ajaxParameters = $.extend({
      async: true
    },_ajaxParameters);
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

    if(this.isRunning){
      this.dashboard.decrementRunningCalls();
      this.isRunning = false;
    }
  },

  isSilent: function (){
    return (this.lifecycle) ? !!this.lifecycle.silent : false;
  }
});

var QueryComponent = UnmanagedComponent.extend({
  visible: false,
  update : function() {
    var myself = this;

    if(myself.warnOnce) {
      myself.warnOnce();
    }

    var cd = myself.queryDefinition;
    var asyncMode = myself.asynchronousMode || false;
    var redraw = _.bind(myself.render, myself);
    if(cd == null) {
      Dashboards.log("Fatal - No query definition passed","error");
      return;
    }

    if(asyncMode) {
      this.triggerQuery(cd, redraw);

    } else {
      QueryComponent.makeQuery(myself, function (values) {
        // We need to make sure we're getting data from the right place,
        // depending on whether we're using CDA

        var changedValues;
        if((typeof(myself.postFetch) == 'function')) {
          changedValues = myself.postFetch(values);
        }

        if(changedValues != null) {
          values = changedValues;
        }

        myself.result = values.resultset != undefined ? values.resultset : values;
        if (typeof values.resultset != "undefined") {
          myself.metadata = values.metadata;
          myself.queryInfo = values.queryInfo;
        }

        myself.synchronous(redraw, values);
      });
    }
  },

  render: function(data) {
    if(this.resultvar != null) {
      Dashboards.setParameter(this.resultvar, data.resultset);
    }
  },

  warnOnce: function() {
    Dashboards.log("Warning: QueryComponent behaviour is due to change. See " +
    "http://www.webdetails.org/redmine/projects/cdf/wiki/QueryComponent" +
    " for more information");
    delete(this.warnOnce);
  }
}, {

  /**
   * @deprecated
   * @param object
   * @param successCallback
   */
  makeQuery: function(object, successCallback) {

    if (this.warnOnce) {this.warnOnce();}
    var cd = object.queryDefinition;
    if (cd == undefined) {
      Dashboards.log("Fatal - No query definition passed","error");
      return;
    }
    var query = Dashboards.getQuery( cd );
    object.queryState = query;

    // Force synchronous queries
    query.setAjaxOptions({async: false});

    if(!successCallback) {
      successCallback = function(values) {
        // We need to make sure we're getting data from the right place,
        // depending on whether we're using CDA

        var changedValues = undefined;
        if((typeof(object.postFetch)=='function')) {
          changedValues = object.postFetch(values);
        }

        if (changedValues != undefined) {
          values = changedValues;
        }

        if (object.resultvar != undefined) {
          Dashboards.setParameter(object.resultvar, object.result);
        }

        object.result = values.resultset != undefined ? values.resultset: values;
        if (typeof values.resultset != "undefined") {
          object.metadata = values.metadata;
          object.queryInfo = values.queryInfo;
        }
      }
    }

    query.fetchData(object.parameters, successCallback);
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
    var parameters = this.parameters || [];
    this.customfunction(parameters);
  }
});

var ActionComponent = UnmanagedComponent.extend({
  _docstring: function (){
    return "Abstract class for components calling a query/endpoint";
    /**
       By default, uses a UnmanagedComponent.synchronous() lifecycle.
       Methods/properties defined in CDE for all child classes:

       this.actionDefinition (datasource used to trigger the action)
       this.actionParameters (parameters to be passed to the datasource)
       this.successCallback(data)
       this.failureCallback()

       Each descendant is expected to override this.render()

       Notes:
       - in this.actionParameters, static values should be quoted, in order to survive the "eval" in Dashboards.getParameterValue

    */
  },

  update: function () {
    /**
       Entry-point of the component, manages the actions. Follows a synchronous cycle by default.
    */
    var render = _.bind(this.render, this);
    if( _.isUndefined(this.manageCallee) || this.manageCallee) {
      this.synchronous(render);
    } else {
      render();
    }

  },

  triggerAction: function () {
    /**
       Calls the endpoint, passing any parameters.
       This method is typically bound to the "click" event of the component.
    */
    var params = Dashboards.propertiesArrayToObject( this.actionParameters ),
        failureCallback =  (this.failureCallback) ?  this.failureCallback : function (){},
        successCallback = this.successCallback ?  this.successCallback : function (){};
    var success = _.bind(function() {
        this.unblock();
        successCallback.apply(this, arguments);
      }, this);
    var failure = _.bind(function() {
        this.unblock();
        failureCallback.apply(this, arguments);
      }, this);
    this.block();
    return Dashboards.getQuery(this.actionDefinition).fetchData(params, success, failure);
  },

  hasAction: function(){
    /**
       Detect if the endpoint associated with the Action is defined
    */
    if ( ! this.actionDefinition ){
      return false;
    }
    if (Dashboards.detectQueryType){
      return !! Dashboards.detectQueryType(this.actionDefinition);
    } else {
      return !! this.actionDefinition.queryType && Dashboards.hasQuery(this.actionDefinition.queryType);
    }
  }
});
