/*!
 * Copyright 2002 - 2018 Webdetails, a Hitachi Vantara company. All rights reserved.
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

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import pt.webdetails.cpf.Util;
import pt.webdetails.cpf.bean.IBeanFactory;
import pt.webdetails.cpf.bean.AbstractBeanFactory;
import pt.webdetails.cpf.exceptions.InitializationException;
import pt.webdetails.cpf.repository.api.IReadAccess;
import pt.webdetails.cpf.repository.api.IUserContentAccess;

public class CdfEngine {

  protected static Log logger = LogFactory.getLog( CdfEngine.class );
  private static CdfEngine instance;
  private ICdfEnvironment environment;

  static {
    instance = new CdfEngine();
    try {
      initialize();
    } catch ( Exception ex ) {
      logger.fatal( "Error initializing CdeEngine: " + Util.getExceptionDescription( ex ) );
    }
  }

  private CdfEngine() {
    logger.debug( "Starting ElementEngine" );
  }

  private CdfEngine( ICdfEnvironment environment ) {
    this();
    this.environment = environment;
  }

  public static CdfEngine getInstance() {
    return instance;
  }

  public static ICdfEnvironment getEnvironment() {
    return getInstance().environment;
  }

  public static IReadAccess getPluginSystemReader( String path ) {
    return getEnvironment().getContentAccessFactory().getPluginSystemReader( path );
  }

  public static IReadAccess getPluginRepositoryReader( String path ) {
    return getEnvironment().getContentAccessFactory().getPluginRepositoryReader( path );
  }

  public static IUserContentAccess getUserContentReader( String path ) {
    return getEnvironment().getContentAccessFactory().getUserContentAccess( path );
  }

  private static void initialize() throws InitializationException {
    if ( instance.environment == null ) {

      IBeanFactory factory = new AbstractBeanFactory() {
        @Override
        public String getSpringXMLFilename() {
          return "cdf.spring.xml";
        }
      };

      // try to get the environment from the configuration
      // will return the DefaultEnvironment by default
      ICdfEnvironment env = instance.getConfiguredEnvironment( factory );

      if ( env != null ) {
        env.init( factory );
      }

      instance.environment = env;
    }
  }

  protected synchronized ICdfEnvironment getConfiguredEnvironment( IBeanFactory factory )
    throws InitializationException {

    String simpleName = ICdfEnvironment.class.getSimpleName();

    Object obj = factory.getBean( simpleName );

    if ( obj != null && obj instanceof ICdfEnvironment ) {
      return (ICdfEnvironment) obj;
    } else {
      String msg = "No bean found for " + simpleName;
      logger.fatal( msg );
      throw new InitializationException( msg, null );
    }
  }
}
