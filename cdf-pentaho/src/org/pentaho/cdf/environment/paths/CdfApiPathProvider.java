package org.pentaho.cdf.environment.paths;

import org.apache.commons.lang.StringUtils;

import pt.webdetails.cpf.context.api.IUrlProvider;

public class CdfApiPathProvider implements ICdfApiPathProvider {

  // in 4.x there is only ContentGenerator
  private String pluginPath;
  private IUrlProvider urlProvider;

  public CdfApiPathProvider( IUrlProvider urlProvider ) {
    this.pluginPath = StringUtils.removeEnd( urlProvider.getPluginBaseUrl(), "/" );
    this.urlProvider = urlProvider;
  }

  @Override
  public String getRendererBasePath() {
    return pluginPath;
  }

  @Override
  public String getPluginStaticBaseUrl() {
    return StringUtils.removeEnd( urlProvider.getPluginBaseUrl(), "/" );
  }

  @Override
  public String getViewActionUrl() {
    return "ViewAction?solution={solution}&path={path}&action={name}";
  }

  @Override
  public String getWebappContextRoot() {
    return urlProvider.getWebappContextRoot();
  }

  @Override
  public String getResourcesBasePath() {
    return pluginPath;
  }
}
