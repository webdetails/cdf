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

define([
  '../Logger',
  './Dashboard',
  './Dashboard.ext',
  '../lib/moment',
  '../lib/CCC/cdo',
  '../lib/cdf.jquery.i18n'
], function(Logger, Dashboard, DashboardExt, moment, cdo, $) {

  /**
   * @class cdf.dashboard.Dashboard.i18n
   * @amd cdf/dashboard/Dashboard.i18n
   * @classdesc A class representing an extension to the Dashboard class for handling
   *            internationalization and localization.
   * @ignore
   */
  Dashboard.implement(/** @lends cdf.dashboard.Dashboard# */{

    /**
     * Method used by the Dashboard constructor for i18n initialization
     * Reference to current language code . Used in every place where jquery
     * plugins used in CDF has native internationalization support (ex: Datepicker).
     *
     * @private
     */
    _initI18n: function() {
      var myself = this;
      myself.i18nCurrentLanguageCode = undefined;
      //when correctly initiated, prop will be replaced
      myself.i18nSupport = {
      prop: function(text) {
        Logger.warn("i18n support wasn't properly initiated. Is the file messages_supported_languages.properties present?");
        return text;
      }}; // Reference to i18n objects

      var normalizeLocale = function(sessionLocale) {
        if(!sessionLocale) {
          return;
        }
        var bits = sessionLocale.split('-');
        if(bits.length > 1) {
          return bits.join('_');
        }
        return sessionLocale;
      };
      var normalizedLocale = normalizeLocale(SESSION_LOCALE);
      //gets localization from templates
      $.i18n.properties({
        name: 'messages',
        path: DashboardExt.getStaticResource("resources/languages/"),
        mode: 'map',
        language: normalizedLocale,
        callback: function() {
          $.i18n.properties({
            path: myself.getMessagesPath(),
            name: 'messages',
            mode: 'map',
            type: 'GET',
            language: normalizedLocale,
            callback: function() {
              myself.setI18nSupport(normalizedLocale, $.i18n);
            }
          });
        }
      });

      var formProvider = cdo.format.language(normalizedLocale);
      cdo.format.language(formProvider);
      moment.locale(normalizedLocale);
    },

    /**
     * Sets the current locale and i18n options.
     *
     * @param {string} lc Locale code.
     * @param {Object} i18nRef Additional i18 options.
     */
    setI18nSupport: function(lc, i18nRef) {
      this.i18nCurrentLanguageCode = lc;
      $.extend(this.i18nSupport, i18nRef);
    },

    /**
     * Gets the path from which to load the locale-specific properties files.
     *
     * @return {string} The path to the dashboard's locale-specific text files.
     * @abstract
     */
    getMessagesPath: function() {
      // meant to be overriden, or return undefined
    }

  });
});
