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


package org.pentaho.cdf.environment;

import pt.webdetails.cpf.PluginEnvironment;
import pt.webdetails.cpf.Util;

public abstract class DefaultCdfEnvironment extends PluginEnvironment implements ICdfEnvironment {

  private static final String PLUGIN_REPOSITORY_DIR = "cdf";
  private static final String PLUGIN_ID = "pentaho-cdf";
  private static final String SYSTEM_DIR = "system";
  private static final String CONTENT = "content";

  public String getPluginRepositoryDir() {
    return PLUGIN_REPOSITORY_DIR;
  }

  public String getPluginId() {
    return PLUGIN_ID;
  }

  public String getSystemDir() {
    return SYSTEM_DIR;
  }

  public String getApplicationBaseContentUrl() {
    return Util.joinPath( getApplicationBaseUrl(), CONTENT, getPluginId() ) + "/";
  }

  public String getRepositoryBaseContentUrl() {
    return Util.joinPath( getApplicationBaseUrl(), CONTENT, getPluginId() ) + "/res/";
  }
}
