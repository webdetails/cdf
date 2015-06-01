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

define(["cdf/components/SelectBaseComponent"], function(SelectBaseComponent) {

  describe("The Select Base Component #", function() {

    describe("scrolling style", function() {

      var styleRegexp = "overflow-y:(\\s*)scroll";

      function createPhMock() {
        var mock = {html: function() { } };
        spyOn(mock, 'html');
        return mock;
      }

      function createComponent(reserved, phMock) {
        return new SelectBaseComponent({
          size: reserved,
          placeholder: function() { return phMock; },

          /* stubs */
          _getParameterValue: function() { return null; },
          _doAutoFocus: function() { },
          _listenElement: function() { }
        });
      }

      it("should add nothing if values' amount is less than reserved visible number", function() {
        var reserved = 5;
        var phMock = createPhMock();

        var cmp = createComponent(reserved, phMock);
        cmp.draw([]);

        expect(phMock.html).toHaveBeenCalled();
        expect(phMock.html.calls.argsFor(0)).not.toMatch(styleRegexp);
      });

      it("should add nothing if values' amount is equal to reserved visible number", function() {
        var reserved = 1;
        var phMock = createPhMock();

        var cmp = createComponent(reserved, phMock);
        cmp.draw(['1']);

        expect(phMock.html).toHaveBeenCalled();
        expect(phMock.html.calls.argsFor(0)).not.toMatch(styleRegexp);
      });

      it("should add mandatory scroll if values' amount is greater than reserved visible number", function() {
        var reserved = 1;
        var phMock = createPhMock();

        var cmp = createComponent(reserved, phMock);
        cmp.draw(['1', '2']);

        expect(phMock.html).toHaveBeenCalled();
        expect(phMock.html.calls.argsFor(0)).toMatch(styleRegexp);
      });

    });

  });

});