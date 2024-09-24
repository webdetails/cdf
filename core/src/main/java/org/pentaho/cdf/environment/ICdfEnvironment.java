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

import java.util.Locale;

import org.pentaho.cdf.environment.broker.ICdfInterPluginBroker;
import org.pentaho.cdf.environment.configurations.IHibernateConfigurations;
import org.pentaho.cdf.environment.packager.ICdfHeadersProvider;
import org.pentaho.cdf.environment.paths.ICdfApiPathProvider;
import org.pentaho.cdf.environment.templater.ITemplater;

import pt.webdetails.cpf.PluginEnvironment;
import pt.webdetails.cpf.bean.IBeanFactory;
import pt.webdetails.cpf.exceptions.InitializationException;
import pt.webdetails.cpf.repository.api.IContentAccessFactory;
import pt.webdetails.cpf.resources.IResourceLoader;

public interface ICdfEnvironment {

  public void init( IBeanFactory factory ) throws InitializationException;

  public void refresh();

  public String getApplicationBaseUrl();

  public Locale getLocale();

  public String getSystemEncoding();

  public IResourceLoader getResourceLoader();

  public IContentAccessFactory getContentAccessFactory();

  public String getPluginId();

  PluginEnvironment getPluginEnv();

  public ICdfApiPathProvider getPathProvider();

  public String getApplicationBaseContentUrl();

  public String getRepositoryBaseContentUrl();

  public IHibernateConfigurations getHibernateConfigurations();

  public ICdfHeadersProvider getCdfHeadersProvider();

  public ITemplater getTemplater();

  public ICdfInterPluginBroker getCdfInterPluginBroker();

  public String getCdfPluginRepositoryDir();

  public String getSystemDir();
}
