/**
 * ## The Comments Component
 */
describe("The Comments Base Component #", function() {
  var myDashboard = _.extend({}, Dashboards);

  var comment = "test comment";
  var commentId = 1;
  var collection = "test";
  var callback = "test";
  var defaults = { page: "generic", paginate: {firstResult: 1, maxResults: 100} };

  /* next two vars to be set before each operation test */
  var operation = undefined;
  var options = undefined;

  myDashboard.addParameter('commentTestParameter', comment );

  var commentComponent = window.CommentsComponent = new CommentsComponent();
  var commentComponentOperations = commentComponent.processing().operations;
  $.extend(commentComponent, {
      name: "commentComponent",
      type: "commentsComponent",
      htmlObject: 'commentComponent',
      parameter: "commentTestParameter"
  });
  myDashboard.addComponent(commentComponent);

  /**
  * ## The Comments Component # Check processOperation - list all comments
  */
  operation = "LIST_ALL";
  options = {data: { action: "list", page: defaults.page, firstResult: defaults.paginate.firstResult, maxResults: defaults.paginate.maxResults, where: false} };
  it("Check processOperation - list all comments", function(done) {
    spyOn(commentComponentOperations, 'requestProcessing').and.callThrough();
    commentComponentOperations.processOperation(operation, comment, collection, callback, defaults);
    setTimeout(function() {
      expect(commentComponentOperations.requestProcessing).toHaveBeenCalledWith( options, operation, collection, callback );
      done();
    }, 100);

  });

  /**
  * ## The Comments Component # Check processOperation - list active comments
  */
  operation = "LIST_ACTIVE";
  options = {data: { action: "list", page: defaults.page, firstResult: defaults.paginate.firstResult, maxResults: defaults.paginate.maxResults } };
  it("Check processOperation - list active comments", function(done) {
    spyOn(commentComponentOperations, 'requestProcessing').and.callThrough();
    commentComponentOperations.processOperation(operation, comment, collection, callback, defaults);
    setTimeout(function() {
      expect(commentComponentOperations.requestProcessing).toHaveBeenCalledWith( options, operation, collection, callback );
      done();
    }, 100);
  });

  /**
  * ## The Comments Component # Check processOperation - get last comment
  */
  operation = "GET_LAST";
  options = { data: { action: "list", page: defaults.page, firstResult: 0, maxResults: 1 } };
  it("Check processOperation - get last comment", function(done) {
    spyOn(commentComponentOperations, 'requestProcessing').and.callThrough();
    commentComponentOperations.processOperation(operation, comment, collection, callback, defaults);
    setTimeout(function() {
      expect(commentComponentOperations.requestProcessing).toHaveBeenCalledWith( options, operation, collection, callback );
      done();
    }, 100);
  });

  /**
  * ## The Comments Component # Check processOperation - delete comment
  */
  operation = "DELETE_COMMENT";
  options = { data: { action: "delete", page: defaults.page, commentId: commentId } };
  it("Check processOperation - delete comment", function(done) {
    spyOn(commentComponentOperations, 'requestProcessing').and.callThrough();
    commentComponentOperations.processOperation(operation, comment, collection, callback, defaults);
    setTimeout(function() {
      expect(commentComponentOperations.requestProcessing).toHaveBeenCalledWith( options, operation, collection, callback );
      done();
    }, 100);
  });

  /**
  * ## The Comments Component # Check processOperation - archive comment
  */
  operation = "ARCHIVE_COMMENT";
  options = { data: { action: "archive", page: defaults.page, commentId: commentId } };
  it("Check processOperation - archive comment", function(done) {
    spyOn(commentComponentOperations, 'requestProcessing').and.callThrough();
    commentComponentOperations.processOperation(operation, comment, collection, callback, defaults);
    setTimeout(function() {
      expect(commentComponentOperations.requestProcessing).toHaveBeenCalledWith( options, operation, collection, callback );
      done();
    }, 100);
  });

  /**
  * ## The Comments Component # Check processOperation - add comment
  */
  operation = "ADD_COMMENT";
  options = { data: { action: "add", page: defaults.page, comment: comment } };
  it("Check processOperation - add comment", function(done) {
    spyOn(commentComponentOperations, 'requestProcessing').and.callThrough();
    commentComponentOperations.processOperation(operation, comment, collection, callback, defaults);
    setTimeout(function() {
      expect(commentComponentOperations.requestProcessing).toHaveBeenCalledWith( options, operation, collection, callback );
      done();
    }, 100);
  });

  /**
  * ## The Comments Component # Validate URL construction of list comments operation with cache-buster parameter
  */
  operation = "LIST_ALL";
  options = {data: { action: "list", page: defaults.page, firstResult: defaults.paginate.firstResult, maxResults: defaults.paginate.maxResults, where: false} };
  it("Validate URL construction of list comments operation with cache-buster parameter", function(done) {
    spyOn(jQuery, "ajax").and.callThrough();
    commentComponentOperations.requestProcessing( options, operation, collection, callback );
    setTimeout(function() {
      expect(jQuery.ajax.calls.mostRecent().args[0].url).toMatch(/dummy\/plugin\/pentaho-cdf\/api\/comments\/list\?ts=[0-9]+/);
      done();
    }, 100);
  });

});