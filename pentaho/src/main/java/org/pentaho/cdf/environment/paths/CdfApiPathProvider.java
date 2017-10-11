/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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

package org.pentaho.cdf.environment.paths;

import pt.webdetails.cpf.Util;
import pt.webdetails.cpf.context.api.IUrlProvider;

public class CdfApiPathProvider implements ICdfApiPathProvider {

  private IUrlProvider urlProvider;

  public CdfApiPathProvider( IUrlProvider urlProvider ) {
    this.urlProvider = urlProvider;
  }

  @Override
  public String getRendererBasePath() {
    return Util.joinPath( urlProvider.getPluginBaseUrl(), "renderer" );
  }

  @Override
  public String getPluginStaticBaseUrl() {
    return urlProvider.getPluginStaticBaseUrl();
  }

  @Override
  public String getViewActionUrl() {
    return "ViewAction?path={path}/{name}";
  }

  @Override
  public String getWebappContextRoot() {
    return urlProvider.getWebappContextRoot();
  }

  @Override
  public String getResourcesBasePath() {
    return Util.joinPath( urlProvider.getPluginBaseUrl(), "resources" );
  }
}
