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

define([
  './CommentsComponent.ext',
  '../lib/mustache',
  'amd!../lib/underscore',
  'amd!../lib/backbone',
  './BaseComponent',
  '../Logger',
  '../lib/jquery',
  'css!./CommentsComponent'
], function(CommentsComponentExt, Mustache, _, Backbone, BaseComponent, Logger, $) {

  var CommentsComponent = BaseComponent.extend({
  
    processing: function() {
  
      var myself = {};
  
      myself.defaults = {
        dataTemplates: {

          comments:
            '<div class="commentsDetails">' +
            ' {{#user}} {{{user}}}, {{/user}} {{{createdOn}}}' +
            '</div>' +
            '<div class="commentsBody">' +
            ' <div class="comment">' +
            '   {{{comment}}}' +
            ' </div>' +
            ' {{#user}}' +
            ' <div class="operation">' +
            ' {{#permissions.deletePermission}}' +
            '   <div class="delete">X</div>' +
            ' {{/permissions.deletePermission}}' +
            ' {{#permissions.archive}}' +
            '  <div class="archive">X</div>' +
            ' {{/permissions.archive}}' +
            ' </div>' +
            ' {{/user}}' +
            '</div>',

          addComments:
            '<div class="commentsAdd">' +
            '{{#add}}' +
            ' <div class="addComment">Add Comment</div>' +
            ' <div class="addCommentWrapper">' +
            '   <textarea class=addCommentText></textarea>' +
            '   <div class="commentsButtons">' +
            '   <div class="saveComment">Save</div>' +
            '   <div class="cancelComment">Cancel</div>' +
            '   </div>' +
            ' </div>' +
            '{{/add}}' +
            '</div>',

          paginateComments:
            '<div class="paginate commentPaginate"> ' +
            '{{#active}}' +
            ' <div class="navigateRefresh"> Refresh </div>' +
            ' <div class="navigatePrevious"> Newest Comments </div>' +
            ' <div class="navigateNext"> Oldest Comments </div>' +
            '{{/active}}' +
            '</div>'
        }
      };
  
      // Process operations
      myself.operations = {
  
        processOperation: function(operation, comment, collection, callback, defaults) {
          var options = {};
          switch(operation) {
            case 'LIST_ALL' :
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
            url: CommentsComponentExt.getComments(operation),
            success: function(data) {
              myself.requestResponse(data, operation, collection, callback);
            },
            dataType: 'json'
          };
          ajaxOpts = _.extend( {}, ajaxOpts, options);
          $.ajax(ajaxOpts);
        },
  
        resetCollection: function(result) {
          var paginate = myself.options.paginate;
          var start = paginate.activePageNumber * paginate.pageCommentsSize;
          var end = ((start + paginate.pageCommentsSize) < result.length)
            ? (start + paginate.pageCommentsSize) : result.length;
          var commentsArray = [];
  
          for(var idx = start; idx < end; idx++) {
            var singleComment = new myself.CommentModel(result[idx]);
            commentsArray.push(singleComment)
          }
          return commentsArray;
        },
  
        requestResponse: function (json, operation, collection, callback) {
          if((operation == 'LIST_ALL') || (operation == 'LIST_ACTIVE')) {
            var paginate = myself.options.paginate;
            if(paginate.activePageNumber > 0) {
              if((paginate.activePageNumber+1) > Math.ceil(json.result.length/paginate.pageCommentsSize)) {
               paginate.activePageNumber--;
             }
            }
            myself.options.queryResult = json.result;
            collection.reset(this.resetCollection(json.result));

            if(paginate.activePageNumber == 0
              && ((json) 
              && (typeof json.result != 'undefined'))
              && (json.result.length == 0)) {

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
                }}];

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
  
        render: function() {
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
          _.bindAll(
            this,
            'render',
            'addComment',
            'saveComment',
            'cancelComment',
            'renderComments',
            'renderSingeComment',
            'addComment',
            'saveComment',
            'cancelComment',
            'navigateNext',
            'navigatePrevious',
            'commentsUpdateNotification'
          );

          this.collection = collection;
  
          this.collection.on('reset', this.renderComments);
          this.collection.on('commentsUpdateNotification', this.commentsUpdateNotification);
  
          this.render();
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

        renderComments: function() {
          var $commentsElem = $('#' + myself.options.htmlObject + ' > div .commentsGroup');
          $commentsElem.empty();
          _(this.collection.models).each(function(comment) {
            $commentsElem.append(this.renderSingeComment(comment));
          }, this);
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
            };
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
          };
          setInterval(function() {
            myself.commentsCollection.trigger('commentsUpdateNotification');
          }, myself.options.interval);
        }
  
      };
  
      return myself;
  
    },
  
    /*
     * Process component
     */
  
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
        Logger.error("Fatal - no page definition passed");
        return;
      }

      this.processing().start({
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
      });
    }
  });

  return CommentsComponent;
});
