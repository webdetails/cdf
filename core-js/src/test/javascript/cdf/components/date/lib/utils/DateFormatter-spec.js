define([
  'cdf/lib/moment', 'cdf/components/date/lib/utils/DateFormatter'
], function(moment, DateFormatter) {

  describe("The DateFormatter #", function() {
    var dateFormatter = new DateFormatter();

    it("should format by a granularity object as a single date", function() {
      var startDateByMoment = moment(new Date(2015, 11, 11));
      var localFormatter = {
        'month': 'MM',
        '_separator': ' -- '
      };
      dateFormatter.setFormats(localFormatter);
      expect(dateFormatter.getFormats()).toBe(localFormatter);

      var result = dateFormatter.format(startDateByMoment, 'month');
      expect(result).toBe('12');
    });

  });
});
