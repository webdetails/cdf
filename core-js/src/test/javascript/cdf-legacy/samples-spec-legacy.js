/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/
/**
 * ## Unmanaged Component Samples #
 */
describe("Unmanaged Component Samples #", function() {
  var myDashboard = _.extend({},Dashboards);

  var mhello = window.mhello = {
    name: "mhello",
    type: "HelloBase",
    testFlag: 0,
    htmlObject: 'mhello',
    executeAtStart: true,
    myFunction: function(){}
  };

  var uhello = window.uhello = {
    name: "uhello",
    type: "HelloUnmanaged",
    htmlObject: 'uhello',
    executeAtStart: true,
    myFunction: function(){}
  };

  var mquery = window.mquery = {
    name: "mquery",
    type: "HelloQueryBase",
    htmlObject: 'mquery',
    executeAtStart: true,
    queryDefinition: {
      path: "",
      dataAccessId: ""
    }
  };

  var uquery = window.uquery = {
    name: "uquery",
    type: "HelloQueryUnmanaged",
    htmlObject: 'uquery',
    executeAtStart: true,
    queryDefinition: {
      path: "",
      dataAccessId: ""
    }
  };

  var componentList = [
    window.mhello,
    window.uhello
    //mquery,
    //uquery
  ];

  myDashboard.addComponents(componentList);
  describe("dasda", function(){
    /**
     * ## Unmanaged Component Samples # updates components
     */
    it("Updates components",function(done){
      spyOn(mhello, 'myFunction');
      spyOn(uhello, 'myFunction');

      //update all components of this test 'mhello', 'uhelllo'
      myDashboard.update(componentList);

      //Data To Validate
      var dataToValidate = function() {
        expect(mhello.myFunction.calls.count()).toEqual(1);
        expect(uhello.myFunction.calls.count()).toEqual(1);
        done();
      }

      setTimeout(dataToValidate, 100);
    });
  });
});
