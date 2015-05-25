/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
package org.pentaho.cdf.environment;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.cdf.environment.factory.CoreBeanFactory;
import org.pentaho.cdf.environment.factory.ICdfBeanFactory;

import pt.webdetails.cpf.Util;
import pt.webdetails.cpf.exceptions.InitializationException;
import pt.webdetails.cpf.repository.api.IReadAccess;
import pt.webdetails.cpf.repository.api.IUserContentAccess;

public class CdfEngine {

  protected static Log logger = LogFactory.getLog( CdfEngine.class );
  private static CdfEngine instance;
  private ICdfEnvironment environment;

  private CdfEngine() {
    logger.debug( "Starting ElementEngine" );
  }

  private CdfEngine( ICdfEnvironment environment ) {
    this();
    this.environment = environment;
  }

  public static CdfEngine getInstance() {

    if ( instance == null ) {
      instance = new CdfEngine();
    }

    try {
      initialize();
    } catch ( Exception ex ) {
      logger.fatal( "Error initializing CdeEngine: " + Util.getExceptionDescription( ex ) );
    }

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

      ICdfBeanFactory factory = new CoreBeanFactory();

      // try to get the environment from the configuration
      // will return the DefaultEnvironment by default
      ICdfEnvironment env = instance.getConfiguredEnvironment( factory );

      if ( env != null ) {
        env.init( factory );
      }

      instance.environment = env;
    }
  }

  protected synchronized ICdfEnvironment getConfiguredEnvironment( ICdfBeanFactory factory )
    throws InitializationException {

    String simpleName = ICdfEnvironment.class.getSimpleName();

    Object obj = new CoreBeanFactory().getBean( simpleName );

    if ( obj != null && obj instanceof ICdfEnvironment ) {
      return (ICdfEnvironment) obj;
    } else {
      String msg = "No bean found for " + simpleName;
      logger.fatal( msg );
      throw new InitializationException( msg, null );
    }
  }
}
