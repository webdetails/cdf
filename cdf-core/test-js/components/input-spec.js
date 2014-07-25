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
    minTextLenght: 0,
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
   * ## The Autocomplete Component # Trigger query called on input change
   */
  it("Trigger Called on input change", function(done){
     spyOn(autocompleteComponent, 'queryServer').and.callFake(function(){
      this.result = {
        "metadata":["Sales"],
        "values":[
          ["AV Stores, Co.","157807.80999999994"],
          ["Anna's Decorations, Ltd","153996.12999999998"],
          ["Auto Canal+ Petit","93170.66"],
          ["Alpha Cognac","70488.43999999999"],
          ["Auto Associés & Cie.","64834.32000000001"],
          ["Australian Collectables, Ltd","64591.460000000014"],
          ["Australian Gift Network, Co","59469.12"],
          ["Auto-Moto Classics Inc.","26479.260000000002"],
          ["Atelier graphique","24179.96"]]
      }
    });
    spyOn(autocompleteComponent.textbox, "val").and.returnValue("a");
    myDashboard.update(autocompleteComponent);
    autocompleteComponent.autoBoxOpt.getList(autocompleteComponent.textbox, {});

    setTimeout(function(){
      expect(autocompleteComponent.queryServer).toHaveBeenCalled();
      done();
    }, 100);
  });

});