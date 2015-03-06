/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

define(['./Dashboard', './Dashboard.ext', 'amd!../lib/underscore', '../lib/moment', '../lib/CCC/cdo', '../lib/cdf.jquery.i18n'],
    function(Dashboard, DashboardExt, _, moment, cdo, $) {
  /**
   * A module representing a extension to Dashboard module for i18n.
   * @module Dashboard.i18n
   */
  Dashboard.implement({
  
    /**
     * Method used by the Dashboard constructor for i18n initialization
     * Reference to current language code . Used in every place where jquery
     * plugins used in CDF has native internationalization support (ex: Datepicker)
     *
     * @private
     */
    _initI18n: function() {
      var myself = this;
      myself.i18nCurrentLanguageCode = undefined;
      myself.i18nSupport = {};  // Reference to i18n objects

      //gets localization from templates
      $.i18n.properties({
        name: 'Messages',
        path: DashboardExt.getStaticResource("resources/languages/"),
        mode: 'map',
        language: SESSION_LOCALE,
        callback: function(){
          $.i18n.properties({
            name: 'Messages',
            mode: 'map',
            type: 'GET',
            language: SESSION_LOCALE,
            callback: function(){
              myself.setI18nSupport(SESSION_LOCALE, $.i18n);
            }
          });
        }
      });

      var formProvider = cdo.format.language(SESSION_LOCALE);
      cdo.format.language(formProvider);
      moment.locale(SESSION_LOCALE);
    },
  
    /**
     * @param lc
     * @param i18nRef
     */
    setI18nSupport: function(lc, i18nRef) {
      this.i18nCurrentLanguageCode = lc;
      _.extend(this.i18nSupport, i18nRef);
    }
  
  });
    
});
