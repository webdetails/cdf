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

import java.io.File;
import java.io.FilenameFilter;
import java.util.Hashtable;
import java.util.List;

import org.dom4j.Document;
import org.dom4j.Node;
import org.pentaho.cdf.environment.CdfEngine;
import org.pentaho.platform.engine.core.system.PentahoSystem;

import pt.webdetails.cpf.repository.api.IContentAccessFactory;
import pt.webdetails.cpf.repository.api.IReadAccess;
import pt.webdetails.cpf.utils.XmlDom4JUtils;

public class PluginCatalogEngine {

  public static final String PLUGIN_DIR = PentahoSystem.getApplicationContext().getSolutionPath( "system/" );
  public String path;
  private static PluginCatalogEngine engine;
  private Hashtable<String, String> pluginPool;

  private static final String PLUGIN_XML = "plugin.xml";

  public PluginCatalogEngine() {
    this.path = PLUGIN_DIR;
    catalogPlugins( PLUGIN_DIR );
  }

  public PluginCatalogEngine( final String path ) {
    this.path = path;
    catalogPlugins( path );
  }

  public static PluginCatalogEngine getInstance() {
    if ( engine == null )
      engine = new PluginCatalogEngine();
    return engine;
  }

  public void refresh() {
    catalogPlugins( this.path );
  }

  public Hashtable<String, String> getPlugins() {
    return pluginPool;
  }

  private void catalogPlugins( final String path ) {

    /*
     * Search the project-.../solution/system/ for the folders that contain a plugin.xml file
     */

    final File systemFolder = new File( path );

    /*
     * Hashtable pluginPool: Key = file type Object = command to run the assigned file type
     */

    pluginPool = new Hashtable<String, String>();

    /* xaction case is added manually because it doesnt need a plugin to be runnable */
    pluginPool.put( "xaction", "ViewAction?solution={solution}&path={path}&action={name}" );

    final FilenameFilter subFolders = new FilenameFilter() {
      public boolean accept( final File systemFolder, final String name ) {
        final File plugin = new File( systemFolder.getPath() + "/" + name + "/" + PLUGIN_XML );
        return plugin.exists() && plugin.canRead();

      }
    };
    final String[] listPlugins = systemFolder.list( subFolders );

    /*
     * Open the plugin.xml files in the previous folder list to check for a run command for the associated file type
     */

    final IContentAccessFactory accessFactory = CdfEngine.getEnvironment().getContentAccessFactory();

    for ( final String plugin : listPlugins ) {

      try {

        IReadAccess pluginSystemAccess = accessFactory.getOtherPluginSystemReader( plugin, null );

        final Document xml = XmlDom4JUtils.getDocumentFromFile( pluginSystemAccess, PLUGIN_XML );

        final List<Node> list = xml.selectNodes( "//content-type[@type]" );

        String readType = null;
        final String rawUrl;

        for ( final Node node : list ) {
          readType = XmlDom4JUtils.getNodeText( "@type", node );
        }

        if ( readType != null ) {
          rawUrl = xml.selectSingleNode( "//operation/id[text()='RUN']/../command" ).getText();

          pluginPool.put( readType, rawUrl );
        }

      } catch ( Exception e ) {
        e.printStackTrace();
      }
    }
  }
}
