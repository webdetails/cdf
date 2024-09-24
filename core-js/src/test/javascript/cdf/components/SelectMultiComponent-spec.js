/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/

define([
  "cdf/Dashboard.Clean",
  "cdf/components/SelectMultiComponent",
  "cdf/lib/jquery"
], function(Dashboard, SelectMultiComponent, $) {

  /**
   * ## The Select Multi Component
   */
  describe("The Select Multi Component #", function() {
  
    var dashboard = new Dashboard();
  
    dashboard.addParameter('selectMultiComponentParameter', [1, 2, 3]);    
    
    dashboard.init();

    var selectMultiComponent = new SelectMultiComponent({
      name: "selectMultiComponent",
      type: "selectMultiComponent",
      htmlObject: "sampleObjectSelectMulti",
      parameter: "selectMultiComponentParameter" 
    });
  
    dashboard.addComponent(selectMultiComponent);
  
    /**
     * ## The Select Multi Component # allows a dashboard to execute update
     */
    it("allows a dashboard to execute update", function(done) {
      spyOn(selectMultiComponent, 'update').and.callThrough();
      spyOn($, "ajax").and.callFake(function() {
        return {responseXML: "<test/>"};
      });

      // listen to cdf:postExecution event
      selectMultiComponent.once("cdf:postExecution", function() {
        expect(selectMultiComponent.update).toHaveBeenCalled();
        done();
      });

      dashboard.update(selectMultiComponent);
    });
  });
});
