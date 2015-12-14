define([
  'cdf/lib/moment', 'cdf/components/date/lib/utils/RangeFormatter'
], function(moment, RangeFormatter) {

  describe("The RangeFormatter #", function() {
    var rangeFormatter = new RangeFormatter();
    var startDate = new Date(2015, 11, 11);
    var startDateByMoment = moment(startDate);
    var granularity = 'month';

    it("should format by a custom function", function() {
      var expectedResult = startDate + " - " + startDate;
      var localFormatter = function(start, end) {
        return expectedResult;
      };
      rangeFormatter.setFormats(localFormatter);
      expect(rangeFormatter.getFormats()).toBe(localFormatter);

      var result = rangeFormatter.format(startDate, startDate);
      expect(result).toBe(expectedResult);
    });

    it("should format by a granularity function", function() {
      var expectedResult = startDateByMoment + " - " + startDateByMoment;
      var localFormatter = {
        'month': function(start, end) {
          return expectedResult;
        },
        '_separator': ' -- '
      };
      rangeFormatter.setFormats(localFormatter);
      expect(rangeFormatter.getFormats()).toBe(localFormatter);

      var result = rangeFormatter.format(startDateByMoment, startDateByMoment, granularity);
      expect(result).toBe(expectedResult);
    });

    it("should format by a granularity object", function() {
      var localFormatter = {
        'month': 'MM',
        '_separator': ' -- '
      };
      rangeFormatter.setFormats(localFormatter);
      expect(rangeFormatter.getFormats()).toBe(localFormatter);

      var end = moment(new Date(2016, 3, 1));
      var result = rangeFormatter.format(startDateByMoment, end, granularity);
      expect(result).toBe('12 -- 04');
    });

    it("should format by a granularity object with applying regexp", function() {
      var localFormatter = {
        'month': '[Q]Q{, YYYY}',
        '_separator': ' -- '
      };
      rangeFormatter.setFormats(localFormatter);
      expect(rangeFormatter.getFormats()).toBe(localFormatter);

      var end = moment(new Date(2016, 3, 1));
      var result = rangeFormatter.format(startDateByMoment, end, granularity);
      expect(result).toBe('Q4, 2015 -- Q2, 2016');
    });

    it("should format by a default formatter as a single date", function() {
      var localFormatter = {};
      rangeFormatter.setFormats(localFormatter);
      expect(rangeFormatter.getFormats()).toBe(localFormatter);

      var result = rangeFormatter.format(startDateByMoment, startDateByMoment, granularity);
      expect(result).toBe('2015-12');
    });

    it("should format by a default formatter", function() {
      var localFormatter = {};
      rangeFormatter.setFormats(localFormatter);
      expect(rangeFormatter.getFormats()).toBe(localFormatter);

      var endDateByMoment = moment(new Date(2016, 3, 1));
      var result = rangeFormatter.format(startDateByMoment, endDateByMoment, 'incorrect_key');
      expect(result).toBe('2015-12-11 - 2016-04-01');
    });
  });
});
