/**
 * ## The Autocomplete Component
 */
describe("The Autocomplete Component #", function() {

  var myDashboard = _.extend({}, Dashboards);
  myDashboard.addParameter('autocompleteTestParameter', 1);

  var autocompleteComponent = window.AutocompleteBoxComponent = new AutocompleteBoxComponent();
  $.extend(autocompleteComponent, {
    name: "autocompleteComponent",
    type: "AutoCompleteBoxComponent",
    htmlObject: 'autocompleteComponent',
    parameter: "autocompleteTestParameter",
    matchType: "fromStart",
    selectMulti: true,
    showApplyButton: true,
    minTextLength: 0,
    scrollHeight: 250,
    reloadOnUpdate:true,
    autoUpdateTimeout:3000,
    executeAtStart: true,
    autoUpdateFunction: function(){
      if(!autocompleteTestParameter){
        autocompleteTestParameter="";
      }
      console.log("!update");
      var inputValue=$("#autoboxInput").val();
      console.log("inputValue;"+inputValue);
      console.log("clients;"+autocompleteTestParameter);
      if(autocompleteTestParameter!=inputValue){
        autocompleteTestParameter=inputValue;
        Dashboards.update(autocompleteComponent);
      }
    }
  });

  myDashboard.addComponent(autocompleteComponent);

  /**
   * ## The Autocomplete Component # Update Called
   */
  it("Update Called", function(done){
    spyOn(autocompleteComponent, 'update').and.callThrough();
    myDashboard.update(autocompleteComponent);
    setTimeout(function(){
      expect(autocompleteComponent.update).toHaveBeenCalled();
      done();
    }, 100);
  });

  /**
   * ## The Autocomplete Component # List construction after autocomplete search
   */
  it("List construction after autocomplete search", function(done) {
    var expectedResult = [
      "AV Stores, Co.",
      "Anna's Decorations",
      "Auto Canal+ Petit"
    ];

    spyOn(autocompleteComponent, 'queryServer').and.callFake(function(){
      this.result = [
        ["AV Stores, Co."],
        ["Anna's Decorations"],
        ["Auto Canal+ Petit"],
        ["Euro+ Shopping Channel"],
        ["La Rochelle Gifts"]
      ]
    });

    var returnedList = [];
    autocompleteComponent.search({term:'a'}, function(list) {
      returnedList = list;
    });

    setTimeout(function(){
      expect(autocompleteComponent.queryServer).toHaveBeenCalled();
      expect(returnedList).toEqual(expectedResult);
      done();
    }, 100);
  });

  /**
   * ## The Autocomplete Component # Select and Remove Values
   */
  it("Select and Remove Values", function() {
    autocompleteComponent.selectedValues = [];

    autocompleteComponent.selectValue("value1");
    expect(autocompleteComponent.selectedValues).toEqual(["value1"]);

    autocompleteComponent.selectValue("value2");
    expect(autocompleteComponent.selectedValues).toEqual(["value1", "value2"]);

    autocompleteComponent.removeValue("value1");
    expect(autocompleteComponent.selectedValues).toEqual(["value2"]);

    autocompleteComponent.removeValue("value2");
    expect(autocompleteComponent.selectedValues).toEqual([]);
  });

  /**
   * ## The Autocomplete Component # Get Options
   */
  it("Get Options", function() {
    var options = autocompleteComponent.getOptions();

    expect(options.appendTo).toEqual('.autocomplete-container');
    expect(options.minLength).toEqual(autocompleteComponent.minTextLength);
    expect(typeof options.source).toEqual('function');
    expect(typeof options.focus).toEqual('function');
    expect(typeof options.open).toEqual('function');
    expect(typeof options.close).toEqual('function');
  });
});

/**
 * ## The DateInput Component
 */
describe("The DateInput Component #", function() {

  var myDashboard = _.extend({}, Dashboards);
  var onOpen = false;
  var onClose = false;

  myDashboard.addParameter('dateInputTestParameter', "");

  var dateInputComponent = window.DateInputComponent = new DateInputComponent();
  $.extend(dateInputComponent, {
    name: "dateInputComponent",
    type: "dateInputComponent",
    htmlObject: 'dateInputComponent',
    parameter: "dateInputTestParameter",
    dateFormat: "yy-mm-dd",
    startDate: "2006-05-31",
    endDate: "TODAY",
    onOpenEvent: function() {
      onOpen = true;
    },
    onCloseEvent: function() {
      onClose = true;
    },
    executeAtStart: true
  });

  myDashboard.addComponent(dateInputComponent);


  /**
   * ## The DateInput Component # Update Called
   */
  it("Update Called", function(done) {
    spyOn(dateInputComponent, 'update').and.callThrough();
    myDashboard.update(dateInputComponent);
    setTimeout(function(){
      expect(dateInputComponent.update).toHaveBeenCalled();
      done();
    }, 100);
  });

  /**
   * ## The DateInput Component # Trigger onOpenEvent and onCloseEvent called
   */
  it("Trigger onOpenEvent and onCloseEvent called", function(done) {
    spyOn(dateInputComponent, 'update').and.callThrough();
    myDashboard.update(dateInputComponent);
    dateInputComponent.triggerOnOpen();
    dateInputComponent.triggerOnClose();

    setTimeout(function(){
      expect(dateInputComponent.update).toHaveBeenCalled();
      expect(onOpen).toBeTruthy();
      expect(onClose).toBeTruthy();
      done();
    }, 100);
  });
});