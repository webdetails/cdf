var VisualizationAPIComponent = UnmanagedComponent.extend({

  update: function () {

    var render = _.bind(this.render, this);
    this.triggerQuery(this.queryDefinition, render);

  },

  render: function (data) {

    var vizDiv = this.placeholder()[0];
    var visualization = this.getVisualization();
    var vizOptions = this.getVizOptions();
    var gDataTable = this.createGoogleDataTable(data);


    var controller = new pentaho.VizController(0);
    controller.setDomNode(vizDiv);
    controller.setDataTable(gDataTable);
    controller.setVisualization(visualization, vizOptions);

  },

  getVizOptions: function () {
    var options = {};
    $.each(this.vizOptions, function (i, v) {
      var key = v[0], value = Dashboards.getParameterValue( v[1] );
      options[key] = value;
    });
    return options;
  },

  getVisualization: function () {
    return pentaho.visualizations.getById(this.vizId);
  },

  createGoogleDataTable: function (resultJson) {
    return new pentaho.DataTable(resultJson);
  }

});
