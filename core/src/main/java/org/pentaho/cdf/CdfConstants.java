/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


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
  public static final String PLUGIN_SETTINGS_LEGACY_DASHBOARD_CONTEXT = "settings/legacy-dashboard-context";

  //CORS util constants
  public static final String PLUGIN_SETTINGS_ALLOW_CROSS_DOMAIN_RESOURCES = "settings/allow-cross-domain-resources";
  public static final String PLUGIN_SETTINGS_CROSS_DOMAIN_RESOURCES_WHITELIST = "settings/cross-domain-resources-whitelist";

  public static final String DEFAULT_DASHBOARD_TEMPLATE_HTML = "default-dashboard-template.html";
  public static final String DEFAULT_DASHBOARD_STYLE = "mantle";

  public static final String BLUEPRINT = "blueprint";
  public static final String MOBILE = "mobile";
  public static final String BOOTSTRAP = "bootstrap";
  public static final String CLEAN = "clean";

  public static final String INCLUDES_DIR = "/includes";

  public static final String COMPONENT_TYPE_DATERANGEINPUT = "dateRangeInput";
  public static final String COMPONENT_TYPE_TABLE = "tableComponent";
  public static final String COMPONENT_TYPE_TIMEPLOT = "timePlot";
  public static final String COMPONENT_TYPE_AUTOCOMPLETEBOX = "autocompleteBox";
  public static final String COMPONENT_TYPE_MAP = "map";

  public static final String COMPONENT_TYPE_DATERANGEINPUT_REGEX = "daterangeinput";
  public static final String COMPONENT_TYPE_TABLE_REGEX = "table";
  public static final String COMPONENT_TYPE_TIMEPLOT_REGEX = "timeplot";
  public static final String COMPONENT_TYPE_AUTOCOMPLETE_REGEX = "(simple)?autocomplete";
  public static final String COMPONENT_TYPE_MAP_REGEX = "(new)?map";

  public static final String INLINE_SCRIPT =
      "<script language=\"javascript\" type=\"text/javascript\">\n{0}\n</script>";

  public static final String[][] DASHBOARD_COMPONENT_TYPES = {
      { COMPONENT_TYPE_DATERANGEINPUT_REGEX, COMPONENT_TYPE_DATERANGEINPUT },
      { COMPONENT_TYPE_TABLE_REGEX, COMPONENT_TYPE_TABLE },
      { COMPONENT_TYPE_TIMEPLOT_REGEX, COMPONENT_TYPE_TIMEPLOT },
      { COMPONENT_TYPE_AUTOCOMPLETE_REGEX, COMPONENT_TYPE_AUTOCOMPLETEBOX },
      { COMPONENT_TYPE_MAP_REGEX, COMPONENT_TYPE_MAP } };
}
