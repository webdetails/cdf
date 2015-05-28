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

define(["cdf/Logger"], function(Logger) {

  /**
   * ## The CDF Logger
   */
  describe("Logger", function() {

    var consoleOriginal = window.console;

    // make sure console.exception is defined
    if(!window.console.exception) {
      window.console.exception = function() {};
    }

    /**
     * ## The CDF Logger # logs messages of supported type
     */
    it("logs messages of supported types", function() {
      spyOn(window.console, "debug");
      Logger.log("foo", "debug");
      expect(console.debug).toHaveBeenCalledWith("[debug] WD: foo");

      spyOn(window.console, "log");
      Logger.log("foo", "log");
      expect(console.log).toHaveBeenCalledWith("[log] WD: foo");

      spyOn(window.console, "info");
      Logger.log("foo", "info");
      expect(console.info).toHaveBeenCalledWith("[info] WD: foo");

      spyOn(window.console, "warn");
      Logger.log("foo", "warn");
      expect(console.warn).toHaveBeenCalledWith("[warn] WD: foo");

      spyOn(window.console, "error");
      Logger.log("foo", "error");
      expect(console.error).toHaveBeenCalledWith("[error] WD: foo");

      spyOn(window.console, "exception");
      Logger.log("foo", "exception");
      expect(console.exception).toHaveBeenCalledWith("[exception] WD: foo");
    });

    /**
     * ## The CDF framework # defaults to type 'info'
     */
    it("defaults to type 'info'", function() {
      spyOn(window.console, "info");
      Logger.log("foo");
      expect(console.info).toHaveBeenCalledWith("[info] WD: foo");
    });

    /**
     * ## The CDF Logger # logs type 'error' if 'exception' is unsupported
     */
    it("logs type 'error' if 'exception' is unsupported", function() {
      window.console["exception"] = undefined;

      spyOn(window.console, "error");
      Logger.log({stack: "foo"}, "exception");
      expect(console.error).toHaveBeenCalledWith("[error] WD: foo");

      window.console["exception"] = function() {};
    });

    /**
     * ## The CDF Logger # logs exception objects
     */
    it("logs exception objects", function() {
      spyOn(window.console, "exception");
      Logger.log({stack: "foo"}, "exception");
      expect(console.exception).toHaveBeenCalledWith("[exception] WD: [object Object]");
    });

    /**
     * ## The CDF Logger # logs messages with css styling rules
     */
    it("logs messages with css styling rules", function() {
      spyOn(window.console, "info");
      Logger.log("foo", "info", "color: blue");
      expect(console.info).toHaveBeenCalledWith("%c[info] WD: foo", "color: blue");
    });

    // restore window.console
    window.console = consoleOriginal;
  });
});
