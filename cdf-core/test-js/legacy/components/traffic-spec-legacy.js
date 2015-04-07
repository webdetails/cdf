/**
 * ## The Traffic Component
 */
describe("The Traffic Component #", function() {
    var myDashboard = _.extend({}, Dashboards);

  myDashboard.addParameter('trafficTestParameter', 1);

    var trafficComponent = window.trafficComponent = new TrafficComponent();
    $.extend(trafficComponent, {
        name: "trafficComponent",
        type: "UnmanagedComponent",
        htmlObject: 'trafficComponent',
        trafficDefinition: {
            dataAccessId: "dataAccessTestId",
            intervals: [
                10,
                20
            ],
            path: "/test/path",
            showValue: true
        },
        parameter: "trafficTestParameter"
    });
    myDashboard.addComponent(trafficComponent);

  /**
   * ## The Traffic Component # Updates
   */
    it("Updates", function(done) {
        spyOn(trafficComponent, 'update');
        myDashboard.update(trafficComponent);
        setTimeout(function() {
            expect(trafficComponent.update).toHaveBeenCalled();
            done();
        }, 100);
    });

  /**
   * ## The Traffic Component # Uses CDA
   */
    it("Uses CDA", function(done) {
        spyOn(trafficComponent, 'update').and.callThrough();
        spyOn(trafficComponent, 'doQuery').and.callThrough();
        var ajax = spyOn(jQuery, "ajax").and.callFake(function(options) {
            options.success({
                resultset: "queryResults"
            });
        });
        spyOn(trafficComponent, 'trafficLight');
        trafficComponent.update();
        setTimeout(function() {
            expect(trafficComponent.update).toHaveBeenCalled();
            expect(trafficComponent.doQuery).toHaveBeenCalled();
            expect(trafficComponent.trafficLight).toHaveBeenCalledWith("queryResults");
            done();
        }, 100);
    });

  /**
   * ## The Traffic Component # Uses XActions
   */
    it("Uses XActions", function(done) {
        trafficComponent.trafficDefinition.path = false;
        spyOn(trafficComponent, 'update').and.callThrough();
        spyOn(trafficComponent, 'doQuery').and.callThrough();
        spyOn(Dashboards, "callPentahoAction").and.callFake(function() {
            trafficComponent.trafficLight("queryResults", true);
        });
        spyOn(trafficComponent, 'trafficLight');
        trafficComponent.update();
        setTimeout(function() {
            expect(trafficComponent.update).toHaveBeenCalled();
            expect(trafficComponent.doQuery).toHaveBeenCalled();
            expect(Dashboards.callPentahoAction).toHaveBeenCalled();
            expect(trafficComponent.trafficLight).toHaveBeenCalledWith("queryResults", true);
            done();
        }, 100);
    });

});