/**
 * ## The Query class
 */
describe("The Query class #", function() {
  /**
   * ## The Query class # Calls the query callback
   */
  it("Calls the query callback", function() {
    var ajax = spyOn(jQuery,"ajax").and.callFake(function(options){
      options.success();
    });
    var query = new Query({dataAccessId: "foo", path:"bar"});
    var handler = {
      success: function(){}
    }
    spyOn(handler,"success");
    query.fetchData({},handler.success);
    expect(handler.success).toHaveBeenCalled();
  });
  /**
   * ## The Query class # Allows overriding AJAX settings
   */
  it("Allows overriding AJAX settings", function() {
    var ajax = spyOn(jQuery,"ajax");

    var query = new Query({dataAccessId: "foo", path:"bar"});
    query.setAjaxOptions({
      type: "GET",
      async: true
    });
    query.fetchData({},function(){});

    //var settings = ajax.mostRecent.args[0];
    var settings = ajax.calls.mostRecent().args[0];

    expect(settings.type).toEqual("GET");
    expect(settings.async).toBeTruthy();
  });
});