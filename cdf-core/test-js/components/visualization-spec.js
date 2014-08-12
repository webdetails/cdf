/**
 * ## pentaho Object Mock
 */

var pentaho = pentaho || {};

_.extend(pentaho, {
  visualizations: [ { id: "sampleViz" } ],
  VizController: function( id ) {
    this.id = id;
  },
  DataTable: function( data ) {
    this.data = data;
  }
});

pentaho.VizController.prototype.setDomNode = function( p1 ) {};
pentaho.VizController.prototype.setDataTable = function( p1 ) {};
pentaho.VizController.prototype.setVisualization = function( p1, p2 ) {};
pentaho.visualizations.getById = function( p1 ) {};

/**
 * ## The VisualizationAPI Component
 */
describe("The VisualizationAPI Component #", function() {

  var myDashboard = _.extend({}, Dashboards);

  myDashboard.addParameter('optionParameter', "value");

  var visualizationAPIComponent = window.VisualizationAPIComponent = new VisualizationAPIComponent();
  $.extend(visualizationAPIComponent, {
    name: "visualizationAPIComponent",
    type: "visualizationAPI",
    vizId: "sampleViz",
    vizOptions: [["param1", "optionParameter"]],
    htmlObject: 'visualizationAPIComponent',
    queryDefinition: {
      dataAccessId: "dataAccessTestId",
      path: "/test/path",
      showValue: true
    },
    executeAtStart: true
  });

  myDashboard.addComponent( visualizationAPIComponent );

  /**
   * ## The VisualizationAPI Component # Update Called
   */
  it("Update Called", function(done){
    spyOn( visualizationAPIComponent, 'update').and.callThrough();
    myDashboard.update( visualizationAPIComponent );
    setTimeout(function(){
      expect( visualizationAPIComponent.update ).toHaveBeenCalled();
      done();
    }, 100);
  });

  /**
   * ## The VisualizationAPI Component # Render Called With Cda Query Data
   */
  it("Render Called With Cda Query Data", function(done) {
    spyOn(visualizationAPIComponent, 'update').and.callThrough();
    spyOn(visualizationAPIComponent, 'triggerQuery').and.callThrough();
    var ajax = spyOn(jQuery, "ajax").and.callFake(function(options) {
      options.success({
        resultset: "queryResults"
      });
    });
    spyOn(visualizationAPIComponent, 'render');
    visualizationAPIComponent.update();
    setTimeout(function() {
      expect(visualizationAPIComponent.update).toHaveBeenCalled();
      expect(visualizationAPIComponent.triggerQuery).toHaveBeenCalled();
      expect(visualizationAPIComponent.render).toHaveBeenCalledWith({ resultset : 'queryResults' });
      done();
    }, 100);
  });

  /**
   * ## The VisualizationAPI Component # Check all component functions
   */
  it("Check all component functions", function(done) {
    spyOn(visualizationAPIComponent, 'update').and.callThrough();
    spyOn(visualizationAPIComponent, 'triggerQuery').and.callThrough();
    var ajax = spyOn(jQuery, "ajax").and.callFake(function(options) {
      options.success({
        resultset: "queryResults"
      });
    });
    spyOn(visualizationAPIComponent, 'render').and.callThrough();
    spyOn(visualizationAPIComponent, 'getVisualization' ).and.callThrough();
    spyOn(pentaho.visualizations, 'getById');
    spyOn(visualizationAPIComponent, 'getVizOptions' );
    spyOn(visualizationAPIComponent, 'createGoogleDataTable' );

    visualizationAPIComponent.update();
    setTimeout(function() {
      expect(visualizationAPIComponent.update).toHaveBeenCalled();
      expect(visualizationAPIComponent.triggerQuery).toHaveBeenCalled();
      expect(visualizationAPIComponent.render).toHaveBeenCalledWith({ resultset : 'queryResults' });

      expect(visualizationAPIComponent.getVisualization).toHaveBeenCalled();
      expect(pentaho.visualizations.getById).toHaveBeenCalledWith( "sampleViz" );
      expect(visualizationAPIComponent.getVizOptions).toHaveBeenCalled();
      expect(visualizationAPIComponent.createGoogleDataTable).toHaveBeenCalledWith( {resultset: 'queryResults'} );
      done();
    }, 100);
  });

});