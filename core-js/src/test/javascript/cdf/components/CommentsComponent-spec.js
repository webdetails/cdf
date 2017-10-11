/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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
  "cdf/Dashboard.Clean",
  "cdf/components/CommentsComponent",
  "cdf/lib/jquery",
  "amd!cdf/lib/backbone"
], function(Dashboard, CommentsComponent, $, Backbone) {

  /**
   * ## The Comments Component
   */
  describe("The Comments Component #", function() {

    var dashboard = new Dashboard();

    dashboard.init();

    var commentsComponent = new CommentsComponent({
      name: "commentsComponent",
      type: "commentsComponent",
      page: "generic",
      htmlObject: "sampleObjectComments",
      executeAtStart: true,
      preChange: function() { return true; },
      postChange: function() { return true; },
      tooltip: "My first dashboard"
    });

    dashboard.addComponent(commentsComponent);

    var commentsComponentProcessing = commentsComponent.processing();
    var commentsComponentOperations = commentsComponentProcessing.operations;

    var collection = new Backbone.Collection();
    var callback = function() { return true; };

    /**
     * ## The Comments Component # allows dashboards to execute updates
     */
    it("allows dashboards to execute updates", function(done) {
      spyOn(commentsComponent, 'update').and.callThrough();
      spyOn(commentsComponentOperations, "requestProcessing").and.callThrough();
      spyOn($, "ajax").and.callFake(function(params) {
        params.success({
          result: [],
          status: "success"
        });
      });

      // listen to cdf:postExecution event
      commentsComponent.once("cdf:postExecution", function() {
        expect(commentsComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(commentsComponent);
    });

    /**
     * ## The Comments Component # processOperation
     */
    describe("processOperation", function() {

      /**
       * ## The Comments Component # processOperation should list all comments
       */
      it("should list all comments", function() {
        spyOn($, "ajax").and.callFake(function(params) {
          params.success({
            result: [],
            status: "success"
          });
        });
        commentsComponentProcessing.start({
          htmlObject: "sampleObject",
          page: "generic",
          intervalActive: true,
          interval: 60000,
          paginate: {
            active: true,
            activePageNumber: 0,
            pageCommentsSize: 10,
            firstResult: 0,
            maxResults: 100
          },
          permissions: {
            add: true,
            deletePermission: true,
            archive: false
          },
          defaults: {}
        });
        spyOn(commentsComponentOperations, "requestProcessing").and.callThrough();
        commentsComponentOperations.processOperation(
          "LIST_ALL",
          null,
          collection,
          callback,
          {page: "generic", paginate: {firstResult: 0, maxResults: 100}}
        );
        expect(commentsComponentOperations.requestProcessing).toHaveBeenCalledWith(
          {data: {action: "list", page: "generic", firstResult: 0, maxResults: 100, where: false}},
          "LIST_ALL",
          collection,
          callback
        );
      });

      /**
       * ## The Comments Component # processOperation should list active comments
       */
      it("should list active comments", function(done) {
        spyOn($, "ajax").and.callFake(function(params) {
          params.success({
            result: [{
              comment: "test2",
              createdOn: "2014-09-30 19:50:57",
              elapsedMinutes: 1412,
              id: 3,
              isArchived: false,
              isDeleted: false,
              isMe: true,
              page: "generic",
              user: "admin"
            },
            {
              comment: "test",
              createdOn: "2014-09-30 19:47:29",
              elapsedMinutes: 1416,
              id: 2,
              isArchived: false,
              isDeleted: false,
              isMe: true,
              page: "generic",
              user: "admin"
            }],
            status: "success"
          });
        });
        commentsComponentProcessing.start({
          htmlObject: "sampleObject",
          page: "generic",
          intervalActive: true,
          interval: 60000,
          paginate: {
            active: true,
            activePageNumber: 0,
            pageCommentsSize: 10,
            firstResult: 0,
            maxResults: 100
          },
          permissions: {
            add: true,
            deletePermission: true,
            archive: false
          },
          defaults: {}
        });
        spyOn(commentsComponentOperations, "requestProcessing").and.callThrough();
        commentsComponentOperations.processOperation(
          "LIST_ACTIVE",
          null,
          collection,
          callback,
          {page: "generic", paginate: {firstResult: 0, maxResults: 100}});
        expect(commentsComponentOperations.requestProcessing).toHaveBeenCalledWith(
          {data: {action: "list", page: "generic", firstResult: 0, maxResults: 100}},
          "LIST_ACTIVE",
          collection,
          callback
        );
        done();
      });

      /**
       * ## The Comments Component # processOperation should get last comment
       */
      it("should get the last comment", function(done) {
        spyOn($, "ajax").and.callFake(function(params) {
          params.success({
            result: [{
              comment: "test2",
              createdOn: "2014-09-30 19:50:57",
              elapsedMinutes: 1412,
              id: 3,
              isArchived: false,
              isDeleted: false,
              isMe: true,
              page: "generic",
              user: "admin"
            }],
            status: "success"
          });
        });
        commentsComponentProcessing.start({
          htmlObject: "sampleObject",
          page: "generic",
          intervalActive: true,
          interval: 60000,
          paginate: {
            active: true,
            activePageNumber: 0,
            pageCommentsSize: 10,
            firstResult: 0,
            maxResults: 100
          },
          permissions: {
            add: true,
            deletePermission: true,
            archive: false
          },
          defaults: {}
        });
        spyOn(commentsComponentOperations, "requestProcessing").and.callThrough();
        commentsComponentOperations.processOperation(
          "GET_LAST",
          null,
          collection,
          callback,
          {page: "generic", paginate: {firstResult: 0, maxResults: 1}}
        );
        expect(commentsComponentOperations.requestProcessing).toHaveBeenCalledWith(
          {data: {action: "list", page: "generic", firstResult: 0, maxResults: 1}},
          "GET_LAST",
          collection,
          callback
        );
        done();
      });

      /**
       * ## The Comments Component # processOperation should delete a comment
       */
      it("should delete a comment", function(done) {
        spyOn($, "ajax").and.callFake(function(params) {
          params.success({
            result: [{
              comment: "test2",
              createdOn: "2014-09-30 19:50:57",
              elapsedMinutes: 1412,
              id: 3,
              isArchived: false,
              isDeleted: true,
              isMe: true,
              page: "generic",
              user: "admin"
            }],
            status: "success"
          });
        });
        commentsComponentProcessing.start({
          htmlObject: "sampleObject",
          page: "generic",
          intervalActive: true,
          interval: 60000,
          paginate: {
            active: true,
            activePageNumber: 0,
            pageCommentsSize: 10,
            firstResult: 0,
            maxResults: 100
          },
          permissions: {
            add: true,
            deletePermission: true,
            archive: false
          },
          defaults: {}
        });
        spyOn(commentsComponentOperations, "requestProcessing").and.callThrough();
        commentsComponentOperations.processOperation(
          "DELETE_COMMENT",
          1,
          collection,
          callback,
          {page: "generic", paginate: {firstResult: 0, maxResults: 100}}
        );
        expect(commentsComponentOperations.requestProcessing).toHaveBeenCalledWith(
          {data: {action: "delete", page: "generic", commentId: 1}},
          "DELETE_COMMENT",
          collection,
          callback
        );
        done();
      });

      /**
       * ## The Comments Component # processOperation should archive a comment
       */
      it("should archive a comment", function(done) {
        spyOn($, "ajax").and.callFake(function(params) {
          params.success({
            result: [{
              comment: "test2",
              createdOn: "2014-09-30 19:50:57",
              elapsedMinutes: 1412,
              id: 3,
              isArchived: true,
              isDeleted: false,
              isMe: true,
              page: "generic",
              user: "admin"
            }],
            status: "success"
          });
        });
        commentsComponentProcessing.start({
          htmlObject: "sampleObject",
          page: "generic",
          intervalActive: true,
          interval: 60000,
          paginate: {
            active: true,
            activePageNumber: 0,
            pageCommentsSize: 10,
            firstResult: 0,
            maxResults: 100
          },
          permissions: {
            add: true,
            deletePermission: true,
            archive: false
          },
          defaults: {}
        });
        spyOn(commentsComponentOperations, "requestProcessing").and.callThrough();
        commentsComponentOperations.processOperation(
          "ARCHIVE_COMMENT",
          1,
          collection,
          callback,
          {page: "generic", paginate: {firstResult: 0, maxResults: 100}});
        expect(commentsComponentOperations.requestProcessing).toHaveBeenCalledWith(
          {data: {action: "archive", page: "generic", commentId: 1}},
          "ARCHIVE_COMMENT",
          collection,
          callback
        );
        done();
      });

      /**
       * ## The Comments Component # processOperation should add a comment
       */
      it("should add a comment", function(done) {
        spyOn($, "ajax").and.callFake(function(params) {
          params.success({
            result: [{
              comment: "test comment",
              createdOn: "2014-10-02 15:09:18",
              elapsedMinutes: 0,
              id: 4,
              isArchived: false,
              isDeleted: false,
              isMe: true,
              page: "generic",
              user: "admin"
            }],
            status: "success"
          });
        });
        commentsComponentProcessing.start({
          htmlObject: "sampleObject",
          page: "generic",
          intervalActive: true,
          interval: 60000,
          paginate: {
            active: true,
            activePageNumber: 0,
            pageCommentsSize: 10,
            firstResult: 0,
            maxResults: 100
          },
          permissions: {
            add: true,
            deletePermission: true,
            archive: false
          },
          defaults: {}
        });
        spyOn(commentsComponentOperations, "requestProcessing").and.callThrough();
        commentsComponentOperations.processOperation(
          "ADD_COMMENT",
          "test comment",
          collection,
          callback,
          {page: "generic", paginate: {firstResult: 0, maxResults: 100}});
        expect(commentsComponentOperations.requestProcessing).toHaveBeenCalledWith(
          {data: {action: "add", page: "generic", comment: "test comment"}},
          "ADD_COMMENT",
          collection,
          callback
        );
        done();
      });
    });

    /**
     * ## The Comments Component # requestProcessing
     */
    describe("requestProcessing", function() {
      /**
       * ## The Comments Component # requestProcessing should use cache-buster to avoid browser caching
       */
      it("should use cache-buster to avoid browser caching", function() {
        spyOn($, "ajax").and.callFake(function(params) {
          params.success({
            result: [],
            status: "success"
          });
        });
        commentsComponentOperations.requestProcessing(
          {data: {action: "list", page: "generic", firstResult: 0, maxResults: 100, where: false}},
          "LIST_ALL",
          collection,
          callback);
        expect($.ajax.calls.mostRecent().args[0].url).toMatch(/comments\/list\?ts=[0-9]+/);
      });
    });
  });
});
