/**
 * ## The Select Component
 */
describe("The Select Component #", function() {

  var myDashboard = _.extend({},Dashboards);

  //myDashboard.setParameterValue('selectorTestParameter',1);
  //myDashboard.setParameterValue('multiSelectTestParameter',[1,2,3]);

  var selectComponent = window.selectComponent = {
    name: "selectComponent",
    type: "CommentsComponent",
    htmlObject: 'selectComponent',
    parameter: {
      "selectorTestParameter" : 1
    }
  };

  var multiSelectComponent = window.multiSelectComponent = {
    name: "multiSelectComponent",
    type: "CommentsComponent",
    htmlObject: 'multiSelectComponent',
    parameter: {
      "multiSelectTestParameter" : [1,2,3]
    }
  };

  var components = [
    window.selectComponent,
    window.multiSelectComponent
  ];

  myDashboard.addComponents(components);

  /**
   * ## The Select Component # Draws the options
   */
  it("Draws the options", function(done) {
    spyOn(selectComponent, 'update');
    myDashboard.update(selectComponent);
    setTimeout(function(){
      expect(selectComponent.update).toHaveBeenCalled();
      done();
    }, 100);
  });
  /**
   * ## The Select Component # Holds the correct value
   */
  it("Holds the correct value", function() {
    var comp = myDashboard.getComponentByName("selectComponent");
    expect(comp.parameter['selectorTestParameter']).toEqual(1);
  });
  /**
   * ## The Select Component # Allows overriding AJAX settings
   */
  it("Allows overriding AJAX settings", function() {
    var ajax = spyOn(jQuery,"ajax");

    var query = new Query({dataAccessId: "foo", path:"bar"});
    query.setAjaxOptions({
      type: "GET",
      async: true
    });
    query.fetchData({},function(){});
    var settings = ajax.calls.mostRecent().args[0];

    expect(settings.type).toEqual("GET");
    expect(settings.async).toBeTruthy();
  });
});

