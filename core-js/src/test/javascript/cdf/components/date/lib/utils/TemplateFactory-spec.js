define([
  'cdf/lib/mustache', 'amd!cdf/lib/underscore', 'cdf/components/date/lib/utils/TemplateFactory'
], function(Mustache, _, TemplateFactory) {

  describe("The TemplateFactory #", function() {

    it("should call underscore partial", function() {
      var template = 'test_template';
      var fakeFnTamplate = function() {
        return template;
      };
      spyOn(_, 'partial').and.returnValue(fakeFnTamplate);

      var templateFactory = new TemplateFactory(template);

      expect(_.partial).toHaveBeenCalledWith(Mustache.render, template);
      expect(templateFactory).toBe(fakeFnTamplate);
    });

  });
});
