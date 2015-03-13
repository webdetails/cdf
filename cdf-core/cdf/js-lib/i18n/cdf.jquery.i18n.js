/*!
 * Copyright 2010 - 2014 Pentaho Corporation.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

//copied from jquery.i18n.properties.supported.languages.js due to jquery lib conflicts
// also fixed bug where the settings.path was not used to get the file path

define(["../lib/jquery", "amd!./jquery.i18n"], function($) {
  var original_i18n = $.i18n.properties;
  var original_browserLang = $.i18n.browserLang;
  var hasSupportedLanguages;
  $.i18n.properties = function(settings) {

    if(settings.language === null || settings.language == '' || settings.language == undefined) {
      settings.language = original_browserLang();
    }
    if(settings.language === null || settings.language == undefined) {settings.language='';}

    settings.language = supportedLocale(settings);
    if (hasSupportedLanguages) {
      original_i18n(settings);
    }
  };
  $.i18n.browserLang = function() {
    return null;
  };
  // get supported locale from _supported_languages.properties - it would be '', 'xx' or 'xx_XX'
  var supportedLocale = function(settings) {
    var resultLocale;
    $.ajax({
      url:        (settings.path != undefined ? settings.path : "") + settings.name + "_supported_languages.properties",
      async:      false,
      cache:      settings.cache,
      contentType:'text/plain;charset='+ settings.encoding,
      dataType:   'text',
      success:    function(data, status) {
        resultLocale = parseData(data, settings.language);
        hasSupportedLanguages = true;
      },
      error:function (xhr, ajaxOptions, thrownError){
        hasSupportedLanguages = false;
        if(xhr.status==404) {
          resultLocale = settings.language;
        }
      }
    });
    return resultLocale;
  };

  var parseData = function(data, language) {
    var locale, country, result;
    if (language.length >= 2) {
      locale = language.substring(0, 2);
    }
    if (language.length >= 5) {
      country = language.substring(0, 5);
    }
    if(data != undefined) {  // added if due to tests
      var parameters = data.split( /\n/ );
      for(var i=0; i<parameters.length; i++ ) {
        var lang = parameters[i].substr(0, parameters[i].indexOf("="));
        if (lang == locale && result == undefined) {
          result = locale;
        }
        if (lang == country) {
          result = country;
        }
      }
      if (result == undefined) {
        result = "";
      }
      return result;
    }
  };

  return $;
});