var SESSION_NAME = "dummy";
var CONTEXT_PATH = "/pentaho/";
var SESSION_LOCALE = "en";
// Mock BA server 'pentaho' object
var pentaho = {
  visualizations: [{id: "sampleViz"}],
  VizController: function(id) {
    this.id = id;
  },
  DataTable: function(data) {
    this.data = data;
  }
};
pentaho.VizController.prototype.setDomNode = function(p1) {};
pentaho.VizController.prototype.setDataTable = function(p1) {};
pentaho.VizController.prototype.setVisualization = function(p1, p2) {};
pentaho.visualizations.getById = function(p1) {};
