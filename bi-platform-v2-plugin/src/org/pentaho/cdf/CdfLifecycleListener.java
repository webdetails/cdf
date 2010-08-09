package org.pentaho.cdf;

import org.pentaho.cdf.utils.PluginHibernateUtil;
import org.pentaho.platform.api.engine.IPluginLifecycleListener;
import org.pentaho.platform.api.engine.PluginLifecycleException;
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
