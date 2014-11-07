/**
 * ## The Comments Component
 */
describe("The Comments Component #", function(){
  var commentComponent = window.CommentsComponent = new CommentsComponent();
  var commentComponentOperations = commentComponent.processing().operations;
  $.extend(commentComponent, {
    name: "commentComponent",
    type: "commentsComponent",
    htmlObject: "commentComponent",
    parameter: "commentTestParameter"
  });

  var collection = new Backbone.Collection();
  var callback = function(){return true;};

  /**
   * ## The Comments Component # processOperation
   */
  describe("processOperation", function(){
    /**
     * ## The Comments Component # processOperation should list all comments
     */
    it("should list all comments", function(done){
      spyOn(commentComponentOperations, "requestProcessing").and.callThrough();
      commentComponentOperations.processOperation(
        "LIST_ALL",
        null,
        collection,
        callback,
        {page: "generic", paginate: {firstResult: 0, maxResults: 100}}
      );
      setTimeout(function(){
        expect(commentComponentOperations.requestProcessing).toHaveBeenCalledWith(
          {data: {action: "list", page: "generic", firstResult: 0, maxResults: 100, where: false}},
          "LIST_ALL",
          collection,
          callback
        );
        done();
      }, 100);
    });
    /**
     * ## The Comments Component # processOperation should list active comments
     */
    it("should list active comments", function(done){
      spyOn(commentComponentOperations, "requestProcessing").and.callThrough();
      commentComponentOperations.processOperation(
        "LIST_ACTIVE",
        null,
        collection,
        callback,
        {page: "generic", paginate: {firstResult: 0, maxResults: 100}});
      setTimeout(function(){
        expect(commentComponentOperations.requestProcessing).toHaveBeenCalledWith(
          {data: {action: "list", page: "generic", firstResult: 0, maxResults: 100}},
          "LIST_ACTIVE",
          collection,
          callback
        );
        done();
      }, 100);
    });
    /**
     * ## The Comments Component # processOperation should get last comment
     */
    it("should get the last comment", function(done){
      spyOn(commentComponentOperations, "requestProcessing").and.callThrough();
      commentComponentOperations.processOperation(
        "GET_LAST",
        null,
        collection,
        callback,
        {page: "generic", paginate: {firstResult: 0, maxResults: 1}}
      );
      setTimeout(function(){
        expect(commentComponentOperations.requestProcessing).toHaveBeenCalledWith(
          {data: {action: "list", page: "generic", firstResult: 0, maxResults: 1}},
          "GET_LAST",
          collection,
          callback
        );
        done();
      }, 100);
    });
    /**
     * ## The Comments Component # processOperation should delete a comment
     */
    it("should delete a comment", function(done){
      spyOn(commentComponentOperations, "requestProcessing").and.callThrough();
      commentComponentOperations.processOperation(
        "DELETE_COMMENT",
        1,
        collection,
        callback,
        {page: "generic", paginate: {firstResult: 0, maxResults: 100}}
      );
      setTimeout(function(){
        expect(commentComponentOperations.requestProcessing).toHaveBeenCalledWith(
          {data: {action: "delete", page: "generic", commentId: 1}},
          "DELETE_COMMENT",
          collection,
          callback
        );
        done();
      }, 100);
    });
    /**
     * ## The Comments Component # processOperation should archive a comment
     */
    it("should archive a comment", function(done){
      spyOn(commentComponentOperations, "requestProcessing").and.callThrough();
      commentComponentOperations.processOperation(
        "ARCHIVE_COMMENT",
        1,
        collection,
        callback,
        {page: "generic", paginate: {firstResult: 0, maxResults: 100}});
      setTimeout(function(){
        expect(commentComponentOperations.requestProcessing).toHaveBeenCalledWith(
          {data: {action: "archive", page: "generic", commentId: 1}},
          "ARCHIVE_COMMENT",
          collection,
          callback
        );
        done();
      }, 100);
    });
    /**
     * ## The Comments Component # processOperation should add a comment
     */
    it("should add a comment", function(done){
      spyOn(commentComponentOperations, "requestProcessing").and.callThrough();
      commentComponentOperations.processOperation(
        "ADD_COMMENT",
        "test comment",
        collection,
        callback,
        {page: "generic", paginate: {firstResult: 0, maxResults: 100}});
      setTimeout(function(){
        expect(commentComponentOperations.requestProcessing).toHaveBeenCalledWith(
          {data: {action: "add", page: "generic", comment: "test comment"}},
          "ADD_COMMENT",
          collection,
          callback
        );
        done();
      }, 100);
    });
  });
  /**
   * ## The Comments Component # requestProcessing
   */
  describe("requestProcessing", function(){
    /**
     * ## The Comments Component # requestProcessing should use cache-buster to avoid browser caching
     */
    it("should use cache-buster to avoid browser caching", function(done){
      spyOn(jQuery, "ajax").and.callThrough();
      commentComponentOperations.requestProcessing(
        {data: {action: "list", page: "generic", firstResult: 0, maxResults: 100, where: false}},
        "LIST_ALL",
        collection,
        callback);
      setTimeout(function(){
        expect(jQuery.ajax.calls.mostRecent().args[0].url).toMatch(
          /dummy\/plugin\/pentaho-cdf\/api\/comments\/list\?ts=[0-9]+/
        );
        done();
      }, 100);
    });
  });
});