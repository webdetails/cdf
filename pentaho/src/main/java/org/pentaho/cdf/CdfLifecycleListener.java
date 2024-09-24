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

package org.pentaho.cdf;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.cdf.environment.CdfEngine;
import org.pentaho.platform.api.engine.PluginLifecycleException;

import pt.webdetails.cpf.PluginEnvironment;
import pt.webdetails.cpf.SimpleLifeCycleListener;

public class CdfLifecycleListener extends SimpleLifeCycleListener {

  private static final Log logger = LogFactory.getLog( CdfLifecycleListener.class );

  public void loaded() throws PluginLifecycleException {
    ClassLoader contextCL = Thread.currentThread().getContextClassLoader();
    try {
      Thread.currentThread().setContextClassLoader( this.getClass().getClassLoader() );
    } catch ( Exception e ) {
      logger.error( "Error setting context class loader", e );
    } finally {
      Thread.currentThread().setContextClassLoader( contextCL );
    }
  }

  @Override
  public PluginEnvironment getEnvironment() {
    return (PluginEnvironment) CdfEngine.getEnvironment();
  }
  
  @Override
  public void unLoaded() throws PluginLifecycleException {  
  }
  
  
}
