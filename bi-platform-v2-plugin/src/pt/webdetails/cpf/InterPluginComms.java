/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

package pt.webdetails.cpf;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.platform.api.engine.IContentGenerator;
import org.pentaho.platform.api.engine.IOutputHandler;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.IPluginManager;
import org.pentaho.platform.engine.core.output.SimpleOutputHandler;
import org.pentaho.platform.engine.core.solution.SimpleParameterProvider;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.core.system.PentahoSystem;

/**
 *
 * @author pdpi
 */
public class InterPluginComms
{
  
  
  public static class Plugin {
    
    public final static Plugin CDA = new Plugin("cda", "cda");
    public final static Plugin CDE = new Plugin("pentaho-cdf-dd", "pentaho-cdf-dd");
    public final static Plugin CDC = new Plugin("cdc", "cdc");
    public final static Plugin CDF = new Plugin("pentaho-cdf", "Pentaho Community Dashboard Framework");
    
    private String name;
    private String title;
    
    public String getName() {
      return name;
    }

    public String getTitle() {
      return title;
    }
    
    public Plugin(String name, String title){
      this.name = name;
      this.title = title;
    }
    
  }

  private static final Log logger = LogFactory.getLog(InterPluginComms.class);
  
  
  public static boolean isPluginAvailable(String plugin) {
      IPentahoSession userSession = PentahoSessionHolder.getSession();
    IPluginManager pluginManager = PentahoSystem.get(IPluginManager.class, userSession);
    IContentGenerator contentGenerator;
    try
    {
      contentGenerator = pluginManager.getContentGenerator(plugin, userSession);
    }
    catch (Exception e)
    {
      return false;
    }
    return contentGenerator != null ? true : false;
  }
  public static String callPlugin(Plugin plugin, String method, Map<String, Object> params){
    return callPlugin(plugin, method, params, false);
  }

  public static String callPlugin(Plugin plugin, String method, Map<String, Object> params, boolean switchClassLoader)
  {
    IParameterProvider requestParams = new SimpleParameterProvider(params);
    return callPlugin(plugin, method, requestParams, switchClassLoader);

  }

  public static String callPlugin(Plugin plugin, String method, IParameterProvider params, boolean switchClassLoader)
  {

    IPentahoSession userSession = PentahoSessionHolder.getSession();
    IPluginManager pluginManager = PentahoSystem.get(IPluginManager.class, userSession);
    IContentGenerator contentGenerator;
    try
    {
      contentGenerator = pluginManager.getContentGenerator(plugin.getName(), userSession);
    }
    catch (Exception e)
    {
      logger.error("Failed to acquire " + plugin.getName() + " plugin: " + e.toString());
      return null;
    }
    if(contentGenerator == null){
      logger.error("Failed to acquire " + plugin.getName() + " plugin.");
      return null;
    }
    
    if(switchClassLoader){
      ClassLoader currentClassLoader = Thread.currentThread().getContextClassLoader();
      try{
        ClassLoader pluginClassLoader = pluginManager.getClassLoader(plugin.getTitle());
        
        if(pluginClassLoader != null) Thread.currentThread().setContextClassLoader(pluginClassLoader);
        else logger.error("Couldn't fetch PluginClassLoader for " + plugin.getTitle());
        
        return callPlugin(userSession, contentGenerator, method, params);
      } 
      finally{
        Thread.currentThread().setContextClassLoader(currentClassLoader);
      }
    }
    else {
      return callPlugin(userSession, contentGenerator, method, params);
    }
    
  }


  
  public static String callPlugin(IPentahoSession userSession, IContentGenerator contentGenerator, String method, Map<String, Object> params)
  {
    IParameterProvider requestParams = new SimpleParameterProvider(params);
    return callPlugin(userSession, contentGenerator, method, requestParams);
  }
  public static String callPlugin(IPentahoSession userSession, IContentGenerator contentGenerator, String method, IParameterProvider params)
  {
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    IParameterProvider requestParams = params;
    Map<String, Object> pathMap = new HashMap<String, Object>();
    pathMap.put("path", "/" + method);
    IParameterProvider pathParams = new SimpleParameterProvider(pathMap);
    Map<String, IParameterProvider> paramProvider = new HashMap<String, IParameterProvider>();
    paramProvider.put(IParameterProvider.SCOPE_REQUEST, requestParams);
    paramProvider.put("path", pathParams);


    return callPlugin(userSession, contentGenerator, outputStream, paramProvider);
  }
  public static String callPlugin(IPentahoSession userSession, IContentGenerator contentGenerator, OutputStream outputStream, Map<String, IParameterProvider> paramProvider)
  {
    IOutputHandler outputHandler = new SimpleOutputHandler(outputStream, false);
    try
    {
      contentGenerator.setSession(userSession);
      contentGenerator.setOutputHandler(outputHandler);
      contentGenerator.setParameterProviders(paramProvider);
      contentGenerator.createContent();
      return outputStream.toString();
    }
    catch (Exception e)
    {
      logger.error("Failed to execute call to plugin: " + e.toString());
      return null;
    }
  }
}
