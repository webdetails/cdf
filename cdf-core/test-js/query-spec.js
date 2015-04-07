/*!
* Copyright 2002 - 2015 Webdetails, a Pentaho company.  All rights reserved.
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

define(["cdf/dashboard/Query", "cdf/lib/jquery", "cdf/Dashboard.Clean"], function(Query, $, Dashboard) {


    /**
     * ## The Query class
     */
    describe("The Query class #", function() {
      /**
       * ## The Query class # Calls the query callback
       */
      it("Calls the query callback", function() {
        var ajax = spyOn($,"ajax").and.callFake(function(options){
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
        var ajax = spyOn($,"ajax");
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
      /**
       * ## The Query class # Allows static params in query parameters
       */
      it("Allows static params in query parameters", function() {
        /*var ajax = spyOn($,"extend").and.callFake(function(a, b, c, d){
          return c;
        });*/
        var d = new Dashboard();
        var CpkQuery = new Query({
          endpoint: "getPluginMetadata",
          pluginId: "sparkl",
          stepName: "OUTPUT",
          kettleOutput: "Inferred",
          queryType: "cpk"
        }, null, d);

        var CdaQuery = new Query({
          dataAccessId: "foo",
          path:"bar"
        }, null, d);

        var params = {
          myParam1: true,
          myParam2: "'test'",
          myParam3: "test",
          myParam4: "['test1', 'test2']",
          myParam5: "[test1, test2]",
          myParam6: undefined,
          myParam7: function() {
            return "myParam8FuncReturn"
          },
          myParam8: 1,
          myParam9: ["test1"],
          myParam10: [1, 2, 3],
          myParam11: {
            test1: "test1",
            test2: "test2"
          },
          myParam12: ["test1;test2;test3"]
        };

        var cpkQueryDefinition = CpkQuery.buildQueryDefinition(params);

        expect(cpkQueryDefinition.hasOwnProperty('parammyParam1')).toBe(true);
        expect(cpkQueryDefinition.hasOwnProperty('parammyParam2')).toBe(true);
        expect(cpkQueryDefinition.hasOwnProperty('parammyParam3')).toBe(true);
        expect(cpkQueryDefinition.hasOwnProperty('parammyParam4')).toBe(true);
        expect(cpkQueryDefinition.hasOwnProperty('parammyParam5')).toBe(true);
        expect(cpkQueryDefinition.hasOwnProperty('parammyParam6')).toBe(false);
        expect(cpkQueryDefinition.hasOwnProperty('parammyParam7')).toBe(true);
        expect(cpkQueryDefinition.hasOwnProperty('parammyParam8')).toBe(true);
        expect(cpkQueryDefinition.hasOwnProperty('parammyParam9')).toBe(true);
        expect(cpkQueryDefinition.hasOwnProperty('parammyParam10')).toBe(true);
        expect(cpkQueryDefinition.hasOwnProperty('parammyParam11')).toBe(true);
        expect(cpkQueryDefinition.hasOwnProperty('parammyParam12')).toBe(true);

        expect(cpkQueryDefinition.parammyParam1).toBe(true);
        expect(cpkQueryDefinition.parammyParam2).toBe("'test'");
        expect(cpkQueryDefinition.parammyParam3).toBe("test");
        expect(cpkQueryDefinition.parammyParam4).toBe("['test1', 'test2']");
        expect(cpkQueryDefinition.parammyParam5).toBe("[test1, test2]");
        expect(cpkQueryDefinition.parammyParam7).toBe("myParam8FuncReturn");
        expect(cpkQueryDefinition.parammyParam8).toBe(1);
        expect(cpkQueryDefinition.parammyParam9).toBe('["test1"]');
        expect(cpkQueryDefinition.parammyParam10).toBe('[1,2,3]');
        expect(cpkQueryDefinition.parammyParam11).toBe('{"test1":"test1","test2":"test2"}');
        expect(cpkQueryDefinition.parammyParam12).toBe('["test1;test2;test3"]');

        var cdaQueryDefinition = CdaQuery.buildQueryDefinition(params);

        expect(cdaQueryDefinition.hasOwnProperty('parammyParam1')).toBe(true);
        expect(cdaQueryDefinition.hasOwnProperty('parammyParam2')).toBe(true);
        expect(cdaQueryDefinition.hasOwnProperty('parammyParam3')).toBe(true);
        expect(cdaQueryDefinition.hasOwnProperty('parammyParam4')).toBe(true);
        expect(cdaQueryDefinition.hasOwnProperty('parammyParam5')).toBe(true);
        expect(cdaQueryDefinition.hasOwnProperty('parammyParam6')).toBe(false);
        expect(cdaQueryDefinition.hasOwnProperty('parammyParam7')).toBe(true);
        expect(cdaQueryDefinition.hasOwnProperty('parammyParam8')).toBe(true);
        expect(cdaQueryDefinition.hasOwnProperty('parammyParam9')).toBe(true);
        expect(cdaQueryDefinition.hasOwnProperty('parammyParam10')).toBe(true);
        expect(cdaQueryDefinition.hasOwnProperty('parammyParam11')).toBe(true);
        expect(cdaQueryDefinition.hasOwnProperty('parammyParam12')).toBe(true);

        expect(cdaQueryDefinition.parammyParam1).toBe(true);
        expect(cdaQueryDefinition.parammyParam2).toBe("'test'");
        expect(cdaQueryDefinition.parammyParam3).toBe("test");
        expect(cdaQueryDefinition.parammyParam4).toBe("['test1', 'test2']");
        expect(cdaQueryDefinition.parammyParam5).toBe("[test1, test2]");
        expect(cdaQueryDefinition.parammyParam7).toBe("myParam8FuncReturn");
        expect(cdaQueryDefinition.parammyParam8).toBe(1);
        expect(cdaQueryDefinition.parammyParam9[0]).toBe('test1');
        expect(cdaQueryDefinition.parammyParam10[0]).toBe(1);
        expect(cdaQueryDefinition.parammyParam10[1]).toBe(2);
        expect(cdaQueryDefinition.parammyParam10[2]).toBe(3);
        expect(cdaQueryDefinition.parammyParam11.test1).toBe('test1');
        expect(cdaQueryDefinition.parammyParam11.test2).toBe('test2');
        expect(cdaQueryDefinition.parammyParam12).toBe('"test1;test2;test3"');
      });
    });



});