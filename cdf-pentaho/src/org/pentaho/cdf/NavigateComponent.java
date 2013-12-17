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

import java.util.Hashtable;
import java.util.List;

import javax.xml.parsers.ParserConfigurationException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Document;
import org.dom4j.Node;
import org.dom4j.io.DOMReader;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.util.Parameter;
import org.pentaho.platform.api.engine.ICacheManager;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.repository.ISolutionRepositoryService;
import org.pentaho.platform.engine.core.system.PentahoSystem;

/**
 * @author pedro
 */
public class NavigateComponent {

  private static final String TYPE_DIR = "FOLDER";
  private static final String CACHE_NAVIGATOR = "CDF_NAVIGATOR_JSON";
  private static final String CACHE_SOLUTIONTREE = "CDF_SOLUTIONTREE_JSON";
  private static final String CACHE_REPOSITORY_DOCUMENT = "CDF_REPOSITORY_DOCUMENT";

  protected static final Log logger = LogFactory.getLog( NavigateComponent.class );
  IPentahoSession userSession;
  ICacheManager cacheManager;
  boolean cachingAvailable;
  String contextPath;

  public NavigateComponent( final IPentahoSession userSession, String contextPath ) {
    this.userSession = userSession;
    cacheManager = PentahoSystem.getCacheManager( userSession );
    cachingAvailable = cacheManager != null && cacheManager.cacheEnabled();
    this.contextPath = contextPath;

  }

  public String getNavigationElements( final String mode, final String solution, final String path )
    throws JSONException, ParserConfigurationException {

    if ( mode.equals( Parameter.NAVIGATOR ) ) {
      return getNavigatorJSON( solution, path );
    } else if ( mode.equals( Parameter.CONTENT_LIST ) ) {
      return getContentListJSON( solution, path );
    } else if ( mode.equals( Parameter.SOLUTION_TREE ) ) {
      return getSolutionTreeJSON();
    } else {
      logger.warn( "Invalid mode: " + mode );
      return "";
    }

  }

  private Document getRepositoryDocument( final IPentahoSession userSession ) throws ParserConfigurationException { //
    Document repositoryDocument;
    if ( cachingAvailable
        && ( repositoryDocument = (Document) cacheManager.getFromSessionCache( userSession, CACHE_REPOSITORY_DOCUMENT ) ) != null ) {
      logger.debug( "Repository Document found in cache" );
      return repositoryDocument;
    } else {
      // System.out.println(Calendar.getInstance().getTime() + ": Getting repository Document");
      final DOMReader reader = new DOMReader();
      repositoryDocument =
          reader.read( PentahoSystem.get( ISolutionRepositoryService.class, userSession ).getSolutionRepositoryDoc(
              userSession, new String[0] ) );

      cacheManager.putInSessionCache( userSession, CACHE_REPOSITORY_DOCUMENT, repositoryDocument );
      // System.out.println(Calendar.getInstance().getTime() + ": Repository Document Returned");
    }
    return repositoryDocument;
  }

  private String getNavigatorJSON( final String solution, final String path ) {

    String jsonString = null;

    if ( cachingAvailable
        && ( jsonString = (String) cacheManager.getFromSessionCache( userSession, CACHE_NAVIGATOR ) ) != null ) {
      logger.debug( "Navigator found in cache" );
    } else {

      try {

        final Document navDoc = getRepositoryDocument( this.userSession );

        // Get it and build the tree
        final JSONObject json = new JSONObject();

        final Node tree = navDoc.getRootElement();
        final JSONArray array = processTree( tree, "/", false );
        json.put( "solution", array.get( 0 ) );

        jsonString = json.toString( 2 );
        // Store in cache:
        cacheManager.putInSessionCache( userSession, CACHE_NAVIGATOR, jsonString );

        // System.out.println(Calendar.getInstance().getTime() + ": Returning Navigator");

      } catch ( Exception e ) {
        System.out.println( "Error: " + e.getClass().getName() + " - " + e.getMessage() );
        logger.warn( "Error: " + e.getClass().getName() + " - " + e.getMessage() );
      }
    }

    return jsonString;

  }

  private String getSolutionTreeJSON() {

    String jsonString = null;

    if ( cachingAvailable
        && ( jsonString = (String) cacheManager.getFromSessionCache( userSession, CACHE_SOLUTIONTREE ) ) != null ) {
      logger.debug( "SolutionTree found in cache" );
    } else {

      try {

        final Document navDoc = getRepositoryDocument( this.userSession );

        // Get it and build the tree
        final JSONObject json = new JSONObject();

        final Node tree = navDoc.getRootElement();
        final JSONArray array = processTree( tree, "/", true );
        json.put( "solution", array.get( 0 ) );

        jsonString = json.toString( 2 );
        // Store in cache:
        cacheManager.putInSessionCache( userSession, CACHE_SOLUTIONTREE, jsonString );

      } catch ( Exception e ) {
        System.out.println( "Error: " + e.getClass().getName() + " - " + e.getMessage() );
        logger.warn( "Error: " + e.getClass().getName() + " - " + e.getMessage() );
      }
    }

    return jsonString;

  }

  @SuppressWarnings( "unchecked" )
  private JSONArray processTree( final Node tree, final String parentPath, boolean includeAllFiles ) {

    final String xPathDir = "./file[@isDirectory='true']"; //$NON-NLS-1$
    JSONArray array = null;

    try {

      final List nodes = tree.selectNodes( xPathDir ); //$NON-NLS-1$
      if ( !nodes.isEmpty() ) {
        array = new JSONArray();
      }

      final String[] parentPathArray = parentPath.split( "/" );
      final String solutionName = parentPathArray.length > 2 ? parentPathArray[2] : "";
      final String solutionPath =
          parentPathArray.length > 3 ? parentPath.substring( parentPath.indexOf( solutionName ) + solutionName.length()
              + 1, parentPath.length() )
              + "/" : "";

      for ( final Object node1 : nodes ) {

        final Node node = (Node) node1;
        final JSONObject json = new JSONObject();
        JSONArray children = null;
        String name = node.valueOf( "@name" );

        if ( parentPathArray.length > 0 ) {

          final String localizedName = node.valueOf( "@localized-name" );
          final String description = node.valueOf( "@description" );
          final boolean visible = node.valueOf( "@visible" ).equals( "true" );
          final boolean isDirectory = node.valueOf( "@isDirectory" ).equals( "true" );
          final String path = solutionName.length() == 0 ? "" : solutionPath + name;
          final String solution = solutionName.length() == 0 ? name : solutionName;

          json.put( "id", parentPath + "/" + name );
          json.put( "name", name );
          json.put( "solution", solution );
          json.put( "path", path );
          json.put( "type", TYPE_DIR );
          json.put( "visible", visible );
          json.put( "title", visible ? localizedName : "Hidden" );
          json.put( "description", description );

          if ( visible && isDirectory ) {
            children = processTree( node, parentPath + "/" + name, includeAllFiles );
            json.put( "files", new JSONArray() );

            // Process directory wcdf/xcdf files
            List<Node> fileNodes;
            if ( includeAllFiles ) {
              fileNodes = node.selectNodes( "./file[@isDirectory='false']" );

            } else {
              fileNodes =
                  node.selectNodes( "./file[@isDirectory='false'][ends-with(string(@name),'.xcdf') or ends-with(string(@name),'.wcdf')]" );
            }

            for ( final Node fileNode : fileNodes ) {

              processFileNode( json, fileNode, "files" );

            }
          }

        } else {
          // root dir
          json.put( "id", tree.valueOf( "@path" ) );
          json.put( "name", solutionName );
          json.put( "path", solutionPath );
          json.put( "visible", true );
          json.put( "title", "Solution" );
          children = processTree( tree, tree.valueOf( "@path" ), includeAllFiles );
        }

        // System.out.println("  Processing getting children ");
        if ( children != null ) {
          json.put( "folders", children );
        }

        array.put( json );

      }

    } catch ( Exception e ) {
      System.out.println( "Error: " + e.getClass().getName() + " - " + e.getMessage() );
      logger.warn( "Error: " + e.getClass().getName() + " - " + e.getMessage() );
    }

    return array;
  }

  private void processFileNode( JSONObject json, Node fileNode, String placeholder ) throws JSONException {

    /* Get the hashTable that contains the pairs: supported-file-type -> associated url to use */
    final Hashtable<String, String> readAbility = PluginCatalogEngine.getInstance().getPlugins();
    String link = "";
    String _solution = json.getString( "solution" );
    String _path = json.getString( "path" );
    String relativeUrl = contextPath;

    String name = fileNode.valueOf( "@name" );
    final String type = name.substring( name.lastIndexOf( "." ) + 1, name.length() );

    if ( relativeUrl.endsWith( "/" ) ) {
      relativeUrl = relativeUrl.substring( 0, relativeUrl.length() - 1 );
    }
    final String path = type.equals( TYPE_DIR ) ? ( _path.length() > 0 ? _path + "/" + name : name ) : _path;

    /* create the link */
    final String lowType = type.toLowerCase();
    if ( readAbility.containsKey( lowType ) ) {

      String s = "/" + readAbility.get( lowType );

      /* Replace the generic variable names for the variable values */
      s = s.replace( "{solution}", _solution );
      s = s.replace( "{path}", path );
      s = s.replace( "{name}", name );
      s = s.replaceAll( "&amp;", "&" );

      link = link + s;

      JSONObject file = new JSONObject();
      file.put( "file", name );
      file.put( "solution", json.get( "solution" ) );
      file.put( "path", json.get( "path" ) );
      file.put( "type", type );
      file.put( "visible", fileNode.valueOf( "@visible" ).equals( "true" ) );
      file.put( "title", fileNode.valueOf( "@localized-name" ) );
      file.put( "description", fileNode.valueOf( "@description" ) );
      file.put( "link", link );

      json.append( placeholder, file );
      return;
    } else {
      // If we don't know this, don't return it
      return;
    }

  }

  private String getContentListJSON( final String _solution, final String _path ) {

    String jsonString = null;
    JSONArray array = null;

    try {

      final JSONObject json = new JSONObject();

      final Document navDoc = getRepositoryDocument( this.userSession );
      final Node tree = navDoc.getRootElement();
      final String xPathDir = "./file[@name='" + _solution + "']"; //$NON-NLS-1$

      List nodes = tree.selectNodes( xPathDir ); //$NON-NLS-1$
      if ( !nodes.isEmpty() && nodes.size() == 1 ) {

        // Add Folder
        final Node node = getDirectoryNode( (Node) nodes.get( 0 ), _path );
        json.put( "name", node.valueOf( "@name" ) );
        json.put( "id", _solution + "/" + _path );
        json.put( "solution", _solution );
        json.put( "path", _path );
        json.put( "type", TYPE_DIR );
        json.put( "visible", false );
        json.put( "title", "Hidden" );

        array = new JSONArray();
        json.put( "content", array );

        nodes = node.selectNodes( "./file" );

        // Add Folder Content

        for ( final Object fileNode : nodes ) {
          processFileNode( json, (Node) fileNode, "content" );
        }

      }

      jsonString = json.toString( 2 );
    } catch ( Exception e ) {
      System.out.println( "Error: " + e.getClass().getName() + " - " + e.getMessage() );
      logger.warn( "Error: " + e.getClass().getName() + " - " + e.getMessage() );
    }

    // debug("Finished processing tree");
    return jsonString;

  }

  private Node getDirectoryNode( Node node, final String _path ) {

    final String[] pathArray = _path.split( "/" );
    if ( pathArray.length > 0 ) {

      final String path = pathArray[0];
      final String xPathDir = "./file[@name='" + path + "']"; //$NON-NLS-1$
      final List nodes = node.selectNodes( xPathDir ); //$NON-NLS-1$
      if ( !nodes.isEmpty() && nodes.size() == 1 ) {
        node = (Node) nodes.get( 0 );
        if ( !_path.equals( path ) ) {
          node = getDirectoryNode( node, _path.substring( _path.indexOf( path ) + path.length() + 1, _path.length() ) );
        }

      } else {
        return node;
      }

    }

    return node;
  }
}
