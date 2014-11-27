/**
 * ## The prpt Component
 */
describe("The prpt Component #", function() {

  var myDashboard = _.extend({}, Dashboards);

  var optionData = {
    funcValue: 2,
    value: 'one',
    funcArray: [1,'two'],
    array: [1,'two'],
    path: "fakePath/report.prpt",
    paginate: true,
    usePost:false,
    showParameters: true,
    iframe: true,
    executeAtStart: true,
    staticValue: "staticValue"
  };

  myDashboard.addParameter( 'funcValue', function() { return  optionData.funcValue; } );
  myDashboard.addParameter( 'value', optionData.value );
  myDashboard.addParameter( 'funcArray', function() { return  optionData.funcArray; } );
  myDashboard.addParameter( 'array', optionData.array );

  var prptComponent = window.PrptComponent = new PrptComponent();
  $.extend(prptComponent, {
    name: "prptComponent",
    type: "prpt",
    htmlObject: "placeholder",
    path: optionData.path,
    parameters: [['funcValue','funcValue'],['value','value'],['funcArray','funcArray'],
      ['array','array'],['staticValue', 'staticValue']],
    paginate: optionData.paginate,
    usePost:optionData.usePost,
    showParameters: optionData.showParameters,
    iframe: optionData.iframe,
    executeAtStart: optionData.executeAtStart
  });

  myDashboard.addComponent( prptComponent );

  /**
   * ## The prpt Component # Update Called
   */
  it("Update Called", function(done){
    spyOn( prptComponent, 'update').and.callThrough();
    spyOn( prptComponent, 'setIframeUrl');
    myDashboard.update( prptComponent );
    setTimeout(function(){
      expect( prptComponent.update ).toHaveBeenCalled();
      expect( prptComponent.setIframeUrl ).toHaveBeenCalled();
      done();
    }, 100);
  });

  /**
   * ## The prpt Component # Verify returned value from getOptions
   */
  it("Verify returned value from getOptions", function() {
    var options = prptComponent.getOptions();

    expect( options.path ).toEqual( optionData.path );
    expect( options.showParameters ).toEqual( optionData.showParameters );
    expect( options.paginate ).toEqual( optionData.paginate );
    expect( options.autoSubmit ).toEqual( optionData.autoSubmit || optionData.executeAtStart || false );
    expect( options['dashboard-mode'] ).toEqual( !optionData.iframe );
    expect( options.renderMode ).toEqual( 'REPORT' );
    expect( options.htmlProportionalWidth ).toEqual( false );
    expect( options.funcValue ).toEqual( optionData.funcValue );
    expect( options.value ).toEqual( optionData.value );
    expect( options.funcArray ).toEqual( optionData.funcArray );
    expect( options.array ).toEqual( optionData.array );
    expect( options.staticValue ).toEqual( optionData.staticValue );
    expect( options['output-target'] ).toEqual( 'table/html;page-mode=page' );
    expect( options['accepted-page'] ).toEqual( 0 );
  });

  /**
   * ## The prpt Component # Verify returned value from getParams
   */
  it("Verify returned value from getParams", function() {
    var params = prptComponent.getParams();

    expect( params['output-target'] ).toEqual( 'table/html;page-mode=page' );
    expect( params['accepted-page'] ).toEqual( 0 );
    expect( params.funcValue ).toEqual( optionData.funcValue );
    expect( params.value ).toEqual( optionData.value );
    expect( params.funcArray ).toEqual( optionData.funcArray );
    expect( params.array ).toEqual( optionData.array );
    expect( params.staticValue ).toEqual( optionData.staticValue );
  });

  /**
   * ## The prpt Component # Verify returned value from getReportOptions
   */
  it("Verify returned value from getReportOptions", function() {
    var reportOptions = prptComponent.getReportOptions();

    expect( reportOptions.path ).toEqual( optionData.path );
    expect( reportOptions.showParameters ).toEqual( optionData.showParameters );
    expect( reportOptions.paginate ).toEqual( optionData.paginate );
    expect( reportOptions.autoSubmit ).toEqual( optionData.autoSubmit || optionData.executeAtStart || false );
    expect( reportOptions['dashboard-mode'] ).toEqual( !optionData.iframe );
    expect( reportOptions.renderMode ).toEqual( 'REPORT' );
    expect( reportOptions.htmlProportionalWidth ).toEqual( false );
    expect( reportOptions['output-target'] ).toEqual( 'table/html;page-mode=page' );
    expect( reportOptions['accepted-page'] ).toEqual( 0 );
  });

});