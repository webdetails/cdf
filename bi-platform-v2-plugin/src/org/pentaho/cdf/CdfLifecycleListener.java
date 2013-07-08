package org.pentaho.cdf;

import org.pentaho.cdf.utils.PluginHibernateUtil;
import org.pentaho.platform.api.engine.IPluginLifecycleListener;
import org.pentaho.platform.api.engine.PluginLifecycleException;
import pt.webdetails.cpf.persistence.PersistenceEngine;
import org.pentaho.cdf.views.View;

/**
 * This class inits Cda plugin within the bi-platform
 * @author gorman
 *
 */
public class CdfLifecycleListener implements IPluginLifecycleListener
{

  public void init() throws PluginLifecycleException
  {
    // Initialize plugin

	  //initialize orientDb and initialize org.pentaho.cdf.views.View
	  PersistenceEngine pe = PersistenceEngine.getInstance();
	  if (!pe.classExists(View.class.getName())) {
		  pe.initializeClass(View.class.getName());
	  }
          
    PluginHibernateUtil.initialize();
  }


  public void loaded() throws PluginLifecycleException
  {
    ClassLoader contextCL = Thread.currentThread().getContextClassLoader();
    try
    {
      Thread.currentThread().setContextClassLoader(this.getClass().getClassLoader());
    }
    catch (Exception e)
    {
    }
    finally
    {
      Thread.currentThread().setContextClassLoader(contextCL);
    }
  }


  public void unLoaded() throws PluginLifecycleException
  {
  }
}
