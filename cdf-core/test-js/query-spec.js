/*!
* Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
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

define(["dashboard/Query", "jquery", "Dashboard"], function(Query, jQuery, Dashboard) {


    /**
     * ## The Query class
     */
    describe("The Query class #", function() {
      /**
       * ## The Query class # Calls the query callback
       */
      it("Calls the query callback", function() {
        var ajax = spyOn(jQuery,"ajax").and.callFake(function(options){
          options.success();
        });
        
        var d = new Dashboard();
        var query = new Query({dataAccessId: "foo", path:"bar"}, null,d);
        var handler = {
          success: function(){}
        }
        spyOn(handler,"success");
        query.fetchData({},handler.success);
        expect(handler.success).toHaveBeenCalled();
      });
      /**
       * ## The Query class # Allows overriding AJAX settings
       */
      it("Allows overriding AJAX settings", function() {
        var ajax = spyOn(jQuery,"ajax");
        var d = new Dashboard();
        var query = new Query({dataAccessId: "foo", path:"bar"},null, d);
        query.setAjaxOptions({
          type: "GET",
          async: true
        });
        query.fetchData({},function(){});
    
        //var settings = ajax.mostRecent.args[0];
        var settings = ajax.calls.mostRecent().args[0];
    
        expect(settings.type).toEqual("GET");
        expect(settings.async).toBeTruthy();
      });
    });



});