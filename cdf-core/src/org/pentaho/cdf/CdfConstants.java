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

package org.pentaho.cdf;

public class CdfConstants {

  // CDF localization related constants
  public static final String BASE_GLOBAL_MESSAGE_SET_FILENAME = "Messages";
  public static final String BASE_CDF_CACHE_DIR = "tmp/.cache";
  public static final String BASE_GLOBAL_MESSAGE_SET_URL = "resources/languages/";

  public static final String GLOBAL_MESSAGES_PROPERTIES_FILE = " messages.properties";

  public static final String PLUGIN_RESOURCES_DIR = "resources/";
  public static final String PLUGIN_LANGUAGES_DIR = PLUGIN_RESOURCES_DIR + "languages/";
  public static final String PLUGIN_HIBERNATE_DIR = PLUGIN_RESOURCES_DIR + "hibernate/";

  public static final String PLUGIN_SETTINGS_DOWNLOADABLE_FORMATS = "settings/resources/downloadable-formats";
  public static final String PLUGIN_SETTINGS_HIBERNATE_AVAILABLE = "settings/hibernate-available";

  public static final String DEFAULT_DASHBOARD_TEMPLATE_HTML = "default-dashboard-template.html";
  public static final String DEFAULT_DASHBOARD_STYLE = "mantle";

  public static final String BLUEPRINT = "blueprint";
  public static final String MOBILE = "mobile";
  public static final String BOOTSTRAP = "bootstrap";
  
  public static final String INCLUDES_DIR = "/includes";
  
  public static final String COMPONENT_TYPE_DATERANGEINPUT = "dateRangeInput";
  public static final String COMPONENT_TYPE_TABLECOMPONENT = "tableComponent";
  public static final String COMPONENT_TYPE_TIMEPLOT = "timePlot";
  public static final String COMPONENT_TYPE_AUTOCOMPLETEBOX = "autocompleteBox";
  public static final String COMPONENT_TYPE_MAP = "map";
  public static final String[] DASHBOARD_COMPONENT_TYPES = {COMPONENT_TYPE_DATERANGEINPUT, COMPONENT_TYPE_TABLECOMPONENT,
    COMPONENT_TYPE_TIMEPLOT, COMPONENT_TYPE_AUTOCOMPLETEBOX, COMPONENT_TYPE_MAP};
}
