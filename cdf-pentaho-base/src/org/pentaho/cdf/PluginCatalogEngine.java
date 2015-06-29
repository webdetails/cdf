/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
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

package org.pentaho.cdf;

import java.util.Hashtable;
import java.util.List;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Document;
import org.dom4j.Node;
import org.pentaho.cdf.environment.CdfEngine;

import pt.webdetails.cpf.plugins.Plugin;
import pt.webdetails.cpf.plugins.PluginsAnalyzer;
import pt.webdetails.cpf.repository.api.IContentAccessFactory;
import pt.webdetails.cpf.repository.api.IReadAccess;
import pt.webdetails.cpf.utils.XmlDom4JUtils;

public class PluginCatalogEngine {

  private static final Log logger = LogFactory.getLog( PluginCatalogEngine.class );

  public String path;
  private static PluginCatalogEngine engine;
  private Hashtable<String, String> pluginPool;

  private static final String PLUGIN_XML = "plugin.xml";

  public PluginCatalogEngine() {
    catalogPlugins();
  }

  public static PluginCatalogEngine getInstance() {
    if ( engine == null ) {
      engine = new PluginCatalogEngine();
    }
    return engine;
  }

  public void refresh() {
    catalogPlugins();
  }

  public Hashtable<String, String> getPlugins() {
    return pluginPool;
  }

  private void catalogPlugins() {

    /*
     * Hashtable pluginPool: Key = file type Object = command to run the assigned file type
     */
    pluginPool = new Hashtable<String, String>();

    /* xaction case is added manually because it doesn't need a plugin to be runnable */
    pluginPool.put( "xaction", "ViewAction?solution={solution}&path={path}&action={name}" );

    List<Plugin> installedPlugins = new PluginsAnalyzer().getInstalledPlugins();

    if ( installedPlugins == null ) {
      logger.error( "PluginCatalogEngine found zero installed plugins" );
      return;
    }

    final IContentAccessFactory accessFactory = CdfEngine.getEnvironment().getContentAccessFactory();

    for ( final Plugin plugin : installedPlugins ) {

      try {
        IReadAccess pluginSystemAccess = accessFactory.getOtherPluginSystemReader( plugin.getId(), null );

        /*
         * Open the plugin.xml files in the plugin folder list to check for a run command for the associated file type
         */
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
        logger.error( "error while resolving plugin.xml for pluginId " + plugin, e );
      }
    }
  }
}
