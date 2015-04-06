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
    var query = new Query({dataAccessId: "foo", path:"bar"});
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

    var query = new Query({dataAccessId: "foo", path:"bar"});
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


  it("Allows static params in query parameters", function() {
    var CpkQuery = new Query({
      endpoint: "getPluginMetadata",
      pluginId: "sparkl",
      stepName: "OUTPUT",
      kettleOutput: "Inferred",
      queryType: "cpk"
    });

    var CdaQuery = new Query({
      dataAccessId: "foo",
      path:"bar"
    });

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