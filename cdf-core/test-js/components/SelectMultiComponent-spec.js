/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

define(["cdf/Dashboard.Clean", "cdf/components/SelectMultiComponent"],
  function(Dashboard, SelectMultiComponent) {

  /**
   * ## The Select Multi Component
   */
  describe("The Select Multi Component #", function() {
  
    var dashboard = new Dashboard();
  
    dashboard.addParameter('selectMultiComponentParameter', [1, 2, 3]);    
    
    dashboard.init();

    var multiSelectComponent = new SelectMultiComponent(dashboard, {
      name: "selectMultiComponent",
      type: "selectMultiComponent",
      htmlObject: "sampleObject",
      parameter: "selectMultiComponentParameter" 
    });
  
    dashboard.addComponent(multiSelectComponent);
  
    /**
     * ## The Select Multi Component # Draws the options
     */
    it("Draws the options", function(done) {
      spyOn(multiSelectComponent, 'update');
      dashboard.update(multiSelectComponent);
      setTimeout(function() {
        expect(multiSelectComponent.update).toHaveBeenCalled();
        done();
      }, 100);
    });
  });
});
