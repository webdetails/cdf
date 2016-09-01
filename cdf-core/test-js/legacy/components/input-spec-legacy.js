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
  
  /**
 * ## The Checkbox Component
 */
describe("The Multibutton Component #", function(){

  var dashboard = _.extend({}, Dashboards);
  var htmlObject = "sampleMultiButtonComponentObject";

  dashboard.addParameter("region", "");

  var multiButtonComponent = window.MultiButtonComponent = new MultiButtonComponent();
  $.extend(multiButtonComponent, {
    name: "multiButtonComponent",
    type: "multiButtonComponent",
    parameters: [],
    path: "/fake/regions.xaction",
    parameter: "region",
    separator: ",&nbsp;",
    valueAsId: true,
    valuesArray: [["Button1","b1"],["Button2","b2"],["Button3","b3"]],
    isMultiple: false,
    htmlObject: htmlObject,
    executeAtStart: true,
    postChange: function() {
      this.testCounter = this.testCounter ? this.testCounter + 1 : 1;
      return "you chose: " + this.dashboard.getParameterValue(this.parameter);
    }
  });
  MultiButtonComponent.prototype = {};
  MultiButtonComponent.prototype.clickButton = function() {};
  dashboard.addComponent(multiButtonComponent);

  var $htmlObject = $('<div />').attr('id', htmlObject);

//  beforeEach(function() {
//    // add an element where the button will be inserted
//    $('body').append($htmlObject);
//  });
//
//  afterEach(function() {
//    $htmlObject.remove();
//  });

  /**
   * ## The Multi Button Component # draw() function behaves correctly
   */
  describe("draw() function behaves correctly #", function() {
    beforeEach(function() {
      multiButtonComponent.isMultiple = false;
      spyOn($, "ajax").and.callFake(function() {
        return {responseXML: "<test/>"};
      });
    });

    /**
     * ## The Multi Button Component # draw() function behaves correctly # with one element in values array
     */
    describe("with one element in values array #", function() {
      beforeEach(function() {
        multiButtonComponent.valuesArray = [["Button1","b1"]];
      });

      /**
       * ## The Multi Button Component # draw() function behaves correctly # with one element in values array # with the current value equals to the first value
       */
      it("with the current value equals to the first value", function(done) {
        dashboard.setParameter("region", "b1");

        spyOn(Dashboards, 'fireChange');

        // listen to cdf:postExecution event
        multiButtonComponent.once("cdf:postExecution", function() {
          expect(Dashboards.fireChange).not.toHaveBeenCalled();
          done();
        });

        dashboard.update(multiButtonComponent);
      });

      /**
       * ## The Multi Button Component # draw() function behaves correctly # with one element in values array # with the current value does not equal to the first value
       */
      it("with the current value does not equal to the first value", function(done) {
        dashboard.setParameter("region", "b2");

        spyOn(Dashboards, 'fireChange');

        // listen to cdf:postExecution event
        multiButtonComponent.once("cdf:postExecution", function() {
          expect(Dashboards.fireChange).toHaveBeenCalled();
          done();
        });

        dashboard.update(multiButtonComponent);
      });
    });

    /**
     * ## The Multi Button Component # draw() function behaves correctly # with several elements in values array
     */
    describe("with several elements in values array #", function() {
      beforeEach(function() {
        multiButtonComponent.valuesArray = [["Button1","b1"],["Button2","b2"],["Button3","b3"]];
      });

      /**
       * ## The Multi Button Component # draw() function behaves correctly # with several elements in values array # with the current value equals to the first value
       */
      it("with the current value equals to the first value", function(done) {
        dashboard.setParameter("region", "b1");

        spyOn(Dashboards, 'fireChange');

        // listen to cdf:postExecution event
        multiButtonComponent.once("cdf:postExecution", function() {
          expect(Dashboards.fireChange).not.toHaveBeenCalled();
          done();
        });

        dashboard.update(multiButtonComponent);
      });

      /**
       * ## The Multi Button Component # draw() function behaves correctly # with several elements in values array # with the current value does not equal to the first value
       */
      describe("with the current value does not equal to the first value", function(done) {
        /**
         * ## The Multi Button Component # draw() function behaves correctly # with several elements in values array # with the current value does not equal to the first value # with the current value is present in values array
         */
        it("with the current value is present in values array", function(done) {
          dashboard.setParameter("region", "b2");

          spyOn(Dashboards, 'fireChange');

          // listen to cdf:postExecution event
          multiButtonComponent.once("cdf:postExecution", function() {
            expect(Dashboards.fireChange).not.toHaveBeenCalled();
            done();
          });

          dashboard.update(multiButtonComponent);
        });

        /**
         * ## The Multi Button Component # draw() function behaves correctly # with several elements in values array # with the current value does not equal to the first value # with the current value is not present in values array
         */
        it("with the current value is not present in values array", function(done) {
          dashboard.setParameter("region", "b4");

          spyOn(Dashboards, 'fireChange');

          // listen to cdf:postExecution event
          multiButtonComponent.once("cdf:postExecution", function() {
            expect(Dashboards.fireChange).not.toHaveBeenCalled();
            done();
          });

          dashboard.update(multiButtonComponent);
        });
      });
    });

    /**
     * ## The Multi Button Component # draw() function behaves correctly # with no elements in values array
     */
    it("with no elements in values array", function(done) {
      multiButtonComponent.valuesArray = [];
      dashboard.setParameter("region", undefined);

      spyOn(Dashboards, 'fireChange');

      // listen to cdf:postExecution event
      multiButtonComponent.once("cdf:postExecution", function() {
        expect(Dashboards.fireChange).not.toHaveBeenCalled();
        done();
      });

      dashboard.update(multiButtonComponent);
    });
  });

});