/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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

/*
 * Javascript sprintf
 * http://www.webtoolkit.info/
 */

define(['./Utils'], function(utils) {

  /**
   * @class cdf.dashboard.Sprintf
   * @amd cdf/dashboard/Sprintf
   * @staticClass
   * @summary Sprintf implementation for javascript.
   * @classdesc Sprintf implementation for javascript.
   *            The class returns a function that can be called to format
   *            a string according to the Sprintf specs.
   *
   *
   *     require(["cdf/dashboard/Sprintf"], function(Sprintf) {
   *       var firstName = "John";
   *       var info = Sprintf("%s %s is %d years old!", firstName, "Doe", 42);
   *       //info == "John Doe is 42 years old!"
   *     });
   *
   * @see http://www.webtoolkit.info/javascript_sprintf.html
   */
  var sprintfWrapper = /** @lends cdf.dashboard.Sprintf# */ {

    /**
     * @summary Formats a string according to the Sprintf specs.
     * @description Formats a string according to the Sprintf specs.
     *
     * @param {...string} string The string containing the regular expression followed
     *                    by string representations of the values to be processed.
     * @return {?string} The new string or `null`.
     * @ignore
     */
    init: function () {

      if(typeof arguments == 'undefined') {
        return null;
      }
      if(arguments.length < 1) {
        return null;
      }
      if(typeof arguments[0] != 'string') {
        return null;
      }
      if(typeof RegExp == 'undefined') {
        return null;
      }

      var string = arguments[0];
      var exp = new RegExp(/(%([%]|(\-)?(\+|\x20)?(0)?(\d+)?(\.(\d)?)?([bcdfosxX])))/g);
      var matches = new Array();
      var strings = new Array();
      var convCount = 0;
      var stringPosStart = 0;
      var stringPosEnd = 0;
      var matchPosEnd = 0;
      var newString = '';
      var match = null;

      while((match = exp.exec(string))) {
        if(match[9]) {
          convCount += 1;
        }

        stringPosStart = matchPosEnd;
        stringPosEnd = exp.lastIndex - match[0].length;
        strings[strings.length] = string.substring(stringPosStart, stringPosEnd);

        matchPosEnd = exp.lastIndex;

        var negative = parseInt(arguments[convCount]) < 0;
        if(!negative) {
          negative = parseFloat(arguments[convCount]) < 0;
        }

        matches[matches.length] = {
          match: match[0],
          left: match[3] ? true : false,
          sign: match[4] || '',
          pad: match[5] || ' ',
          min: match[6] || 0,
          precision: match[8],
          code: match[9] || '%',
          negative: negative,
          argument: String(arguments[convCount])
        };
      }
      strings[strings.length] = string.substring(matchPosEnd);

      if(matches.length == 0) {
        return string;
      }
      if((arguments.length - 1) < convCount) {
        return null;
      }

      match = null;
      var i = null;

      for(i = 0; i < matches.length; i++) {
        var m = matches[i];
        var substitution;
        if(m.code == '%') {
          substitution = '%'
        } else if(m.code == 'b') {
          m.argument = String(Math.abs(parseInt(m.argument)).toString(2));
          substitution = sprintfWrapper.convert(m, true);
        } else if(m.code == 'c') {
          m.argument = String(String.fromCharCode(parseInt(Math.abs(parseInt(m.argument)))));
          substitution = sprintfWrapper.convert(m, true);
        } else if(m.code == 'd') {
          m.argument = utils.toFormatedString(String(Math.abs(parseInt(m.argument))));
          substitution = sprintfWrapper.convert(m);
        } else if(m.code == 'f') {
          m.argument = utils.toFormatedString(String(Math.abs(parseFloat(m.argument)).toFixed(m.precision ? m.precision : 6)));
          substitution = sprintfWrapper.convert(m);
        } else if(m.code == 'o') {
          m.argument = String(Math.abs(parseInt(m.argument)).toString(8));
          substitution = sprintfWrapper.convert(m);
        } else if(m.code == 's') {
          m.argument = m.argument.substring(0, m.precision ? m.precision : m.argument.length);
          substitution = sprintfWrapper.convert(m, true);
        } else if(m.code == 'x') {
          m.argument = String(Math.abs(parseInt(m.argument)).toString(16));
          substitution = sprintfWrapper.convert(m);
        } else if(m.code == 'X') {
          m.argument = String(Math.abs(parseInt(m.argument)).toString(16));
          substitution = sprintfWrapper.convert(m).toUpperCase();
        } else {
          substitution = m.match;
        }

        newString += strings[i];
        newString += substitution;
      }

      newString += strings[i];

      return newString;
    },

    convert: function(match, nosign) {
      if(nosign) {
        match.sign = '';
      } else {
        match.sign = match.negative ? '-' : match.sign;
      }
      var l = match.min - match.argument.length + 1 - match.sign.length;
      var pad = new Array(l < 0 ? 0 : l).join(match.pad);
      if(!match.left) {
        if(match.pad == '0' || nosign) {
          return match.sign + pad + match.argument;
        } else {
          return pad + match.sign + match.argument;
        }
      } else {
        if(match.pad == '0' || nosign) {
          return match.sign + match.argument + pad.replace(/0/g, ' ');
        } else {
          return match.sign + match.argument + pad;
        }
      }
    }
  };

  return sprintfWrapper.init;

});
