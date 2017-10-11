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
