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


define(['./Dashboard'], function (Dashboard) {
    /**
     * A module representing a extension to Dashboard module for i18n.
     * @module Dashboard.i18n
     */
    Dashboard.implement({
    
      /**
       * Method used by the Dashboard constructor for i18n initialization
       * Reference to current language code . Used in every place where jquery
       * plugins used in CDF hasm native internationalization support (ex: Datepicker)
       *
       * @private
       */
      _initI18n: function(){
        this.i18nCurrentLanguageCode = null;
        this.i18nSupport = null;  // Reference to i18n objects
      },
    
      /**
       * @param lc
       * @param i18nRef
       */
      setI18nSupport: function(lc, i18nRef) {
        // Update global reference to i18n objects if needed
        if (i18nRef !== "undefined" && lc !== "undefined") {
          this.i18nCurrentLanguageCode = lc;
          this.i18nSupport = i18nRef;
        }
      }
    
    
    });
    
});    