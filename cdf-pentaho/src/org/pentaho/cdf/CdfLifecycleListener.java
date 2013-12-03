/*!
 * Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
 * 
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

package org.pentaho.cdf;

import org.pentaho.cdf.environment.CdfEngine;
import org.pentaho.cdf.utils.PluginHibernateUtil;
import org.pentaho.platform.api.engine.PluginLifecycleException;

import pt.webdetails.cpf.PluginEnvironment;
import pt.webdetails.cpf.SimpleLifeCycleListener;

public class CdfLifecycleListener extends SimpleLifeCycleListener {

  public void init() throws PluginLifecycleException {
    // Initialize plugin
    PluginHibernateUtil.initialize();
  }

  public void loaded() throws PluginLifecycleException {
    ClassLoader contextCL = Thread.currentThread().getContextClassLoader();
    try {
      Thread.currentThread().setContextClassLoader( this.getClass().getClassLoader() );
    } catch ( Exception e ) {
    } finally {
      Thread.currentThread().setContextClassLoader( contextCL );
    }
  }

  public void unLoaded() throws PluginLifecycleException {
  }

  @Override
  public PluginEnvironment getEnvironment() {
    return (PluginEnvironment) CdfEngine.getEnvironment();
  }
}
