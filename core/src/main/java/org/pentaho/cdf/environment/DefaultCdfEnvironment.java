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
