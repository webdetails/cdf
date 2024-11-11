/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/


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
    var locale, localeLower;
    if (language.length >= 2) {
      locale = language.substring(0, 2);
      localeLower = locale.toLowerCase();
    }

    var country, countryLower;
    if (language.length >= 5) {
      country = language.substring(0, 5);
      countryLower = country.toLowerCase();
    }

    if (data != null) {  // added if due to tests
      var result = null;

      var lines = data.split( /\n/ );
      for (var i = 0; i < lines.length; i++) {
        var supportedLocale = lines[i];

        var lang = supportedLocale.substr(0, supportedLocale.indexOf("="));
        var langLower = lang.toLowerCase();

        if (langLower === localeLower && result == null) {
          result = lang;
        }

        if (langLower === countryLower) {
          result = lang;
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