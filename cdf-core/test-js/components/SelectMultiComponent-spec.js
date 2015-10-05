/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

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
