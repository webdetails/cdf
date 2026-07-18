/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 - 2026 by Pentaho Canada Inc. : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2030-06-15
 ******************************************************************************/



package org.pentaho.cdf.environment.paths;

public interface ICdfApiPathProvider {

  /**
   * @return abs path to renderer api, no trailing slash
   */
  public String getRendererBasePath();

  /**
   * @return abs path to static content access
   */
  public String getPluginStaticBaseUrl();

  /**
   * @return abs path to static content access
   */
  public String getViewActionUrl();

  /**
   * @return full webapp path
   */
  public String getWebappContextRoot();

  /**
   * @return plugin resource url
   */
  public String getResourcesBasePath();

}
