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

// copied from jquery.i18n.properties.supported.languages.js due to jquery lib conflicts
// also fixed bug where the settings.path was not used to get the file path

define([
  "../lib/jquery",
  "amd!./jquery.i18n"
], function($) {
  var hasSupportedLanguages;

  var originalI18nProperties = $.i18n.properties;
  $.i18n.properties = function(settings) {
    settings.language = supportedLocale(settings);

    if (hasSupportedLanguages) {
      executeOriginalI18nProperties(settings)
    }
  };

  var originalI18nBrowserLang = $.i18n.browserLang;
  $.i18n.browserLang = function() {
    return null;
  };


  // get supported locale from _supported_languages.properties - it would be '', 'xx' or 'xx_XX'
  var supportedLocale = function(settings) {
    if (settings.language == null || settings.language === "") {
      settings.language = originalI18nBrowserLang();
    }

    if (settings.language == null) {
      settings.language = "";
    }

    var encoding = settings.encoding != null ? settings.encoding : "UTF-8";

    var path = settings.path != null ? settings.path : "";
    var supportedLanguagesUrl = path + settings.name + "_supported_languages.properties";

    var resultLocale;
    $.ajax({
      type: 'GET',
      url: supportedLanguagesUrl,
      async: false,

      xhrFields: {
        withCredentials: true
      },

      cache: settings.cache,
      contentType: 'text/plain;charset=' + encoding,
      dataType: 'text',

      success: function(data) {
        resultLocale = parseSupportedLanguagesFile(data, settings.language);

        hasSupportedLanguages = true;
      },

      error: function (xhr/*, ajaxOptions, thrownError*/) {
        hasSupportedLanguages = false;

        var isStatusNotFound = xhr.status === 404;
        if (isStatusNotFound) {
          resultLocale = settings.language;
        }
      }
    });

    return resultLocale;
  };

  var parseSupportedLanguagesFile = function(data, language) {
    var locale;
    if (language.length >= 2) {
      locale = language.substring(0, 2);
    }

    var country;
    if (language.length >= 5) {
      country = language.substring(0, 5);
    }

    if (data != null) {  // added if due to tests
      var result = null;

      var lines = data.split( /\n/ );
      for (var i = 0; i < lines.length; i++) {
        var supportedLocale = lines[i];

        var lang = supportedLocale.substr(0, supportedLocale.indexOf("="));
        if (lang === locale && result == null) {
          result = locale;
        }

        if (lang === country) {
          result = country;
        }
      }

      if (result == null) {
        result = "";
      }

      return result;
    }
  };

  var executeOriginalI18nProperties = function(settings) {
    // temporarily switching default type to GET, original_i18n will need it
    // we can do this here because up until the actual ajax call,
    // originalI18nProperties is synchronous
    $.ajaxSetup({
      type: 'GET',
      xhrFields: {
        withCredentials: true
      }
    });

    originalI18nProperties(settings);

    $.ajaxSetup({
      type: 'POST',
      xhrFields: {
        withCredentials: true
      }
    });
  };

  return $;
});