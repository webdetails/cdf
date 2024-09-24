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

import java.io.Serializable;
import java.util.Map;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.util.Parameter;
import org.pentaho.cdf.utils.JsonUtil;
import org.pentaho.platform.api.repository2.unified.IUnifiedRepository;
import org.pentaho.platform.api.repository2.unified.RepositoryFile;
import org.pentaho.platform.api.repository2.unified.RepositoryFileTree;
import org.pentaho.platform.engine.core.system.PentahoSystem;

import pt.webdetails.cpf.repository.util.RepositoryHelper;

public class NavigateComponent {

  private static final Log logger = LogFactory.getLog( NavigateComponent.class );

  private static final String TYPE_FOLDER = "FOLDER"; //$NON-NLS-1$
  private static final String HIDDEN_DESC = "Hidden"; //$NON-NLS-1$

  private static final String SEPARATOR = String.valueOf( RepositoryHelper.SEPARATOR );

  public static JSONObject getJSONSolution( String path, int depth, boolean showHiddenFiles, String mode ) {
    JSONObject jsonRoot = new JSONObject();

    try {
      path = StringUtils.defaultIfEmpty( path, SEPARATOR );
      RepositoryFileTree tree = PentahoSystem.get( IUnifiedRepository.class ).getTree( path, depth, "*", false );

      if ( tree != null ) {

        if ( mode.equalsIgnoreCase( Parameter.NAVIGATOR ) ) {

          JSONObject json = new JSONObject();
          processTree( tree, json, false, showHiddenFiles, path );
          jsonRoot.put( "solution", json );

        } else if ( mode.equalsIgnoreCase( Parameter.CONTENT_LIST ) ) {

          jsonRoot = repositoryFileToJSONObject( tree.getFile() );
          jsonRoot.put( "content", new JSONArray() );
          jsonRoot.remove( "files" );
          jsonRoot.remove( "folders" );
          processContentListTree( tree, jsonRoot, showHiddenFiles, path );

        } else if ( mode.equalsIgnoreCase( Parameter.SOLUTION_TREE ) ) {

          JSONObject json = new JSONObject();
          processTree( tree, json, true, showHiddenFiles, path );
          jsonRoot.put( "solution", json );
        }
      }
    } catch ( Exception e ) {
      logger.error( e );
      jsonRoot = JsonUtil.makeJsonErrorResponse( e.getMessage(), false );
    }
    return jsonRoot;
  }

  public static void processTree( final RepositoryFileTree tree, final JSONObject json, boolean includeAllFiles,
                                  boolean showHiddenFiles, String rootDir )
    throws Exception {

    rootDir = StringUtils.defaultIfEmpty( rootDir, SEPARATOR );

    if ( !showHiddenFiles && tree.getFile().isHidden() ) {
      return;
    }

    JSONObject childJson = repositoryFileToJSONObject( tree.getFile() );

    if ( !tree.getFile().isFolder() ) {

      // is file

      if ( includeAllFiles ) {

        json.append( "files", childJson );

      } else {

        // only wcdf/xcdf files
        String type = StringUtils.defaultIfEmpty( childJson.getString( "type" ), StringUtils.EMPTY );
        if ( "wcdf".equalsIgnoreCase( type ) || "xcdf".equalsIgnoreCase( type ) ) {
          json.append( "files", childJson );
        }
      }

    } else {

      // is folder

      json.append( "folders", childJson );

      if ( tree.getChildren() != null ) {
        for ( final RepositoryFileTree childNode : tree.getChildren() ) {

          if ( rootDir.equals( tree.getFile().getPath() ) ) {
            // do this only on first level children folders: check if they are system folders
            if ( isSystemFolder( childNode ) ) {
              return;
            }
          }

          processTree( childNode, childJson, includeAllFiles, showHiddenFiles, rootDir );
        }
      }
    }
  }

  public static void processContentListTree( final RepositoryFileTree tree, final JSONObject json,
                                             boolean showHiddenFiles, String rootDir ) throws Exception {

    JSONObject childJson = repositoryFileToJSONObject( tree.getFile() );

    if ( !tree.getFile().isFolder() ) {

      // is file

      if ( !showHiddenFiles && tree.getFile().isHidden() ) {
        return;
      }

      json.append( "content", childJson );

    } else {

      // is folder

      if ( !rootDir.equals( tree.getFile().getPath() ) ) {
        json.append( "content", childJson );
      }

      if ( tree.getChildren() != null ) {
        for ( final RepositoryFileTree childNode : tree.getChildren() ) {

          processContentListTree( childNode, json, showHiddenFiles, rootDir );
        }
      }
    }
  }

  public static JSONObject repositoryFileToJSONObject( RepositoryFile file ) throws JSONException {

    if ( file != null ) {

      JSONObject json = new JSONObject();
      json.put( "id", file.getId() );
      json.put( "name", StringUtils.defaultString( file.getName() ) );
      json.put( "path", StringUtils.defaultString( file.getPath() ) );
      json.put( "visible", !file.isHidden() );
      json.put( "title", file.isHidden() ? HIDDEN_DESC : StringUtils.defaultString( file.getTitle() ) );
      json.put( "description", StringUtils.defaultString( file.getDescription() ) );
      json.put( "creatorId", StringUtils.defaultString( file.getCreatorId() ) );
      json.put( "locked", file.isLocked() );

      if ( file.isFolder() ) {
        json.put( "type", TYPE_FOLDER );
        json.put( "files", new JSONArray() );
        json.put( "folders", new JSONArray() );

      } else {
        json.put( "link", StringUtils
          .defaultString( "/api/repos/" + file.getPath().replaceAll( SEPARATOR, ":" ) + "/generatedContent" ) );
        json.put( "type", FilenameUtils.getExtension( file.getName() ) );

      }

      return json;
    }

    return null;
  }

  private static boolean isSystemFolder( RepositoryFileTree folder ) {

    if ( folder != null && folder.getFile() != null && folder.getFile().isFolder() ) {

      Map<String, Serializable> meta =
        PentahoSystem.get( IUnifiedRepository.class ).getFileMetadata( folder.getFile().getId() );
      return meta.containsKey( IUnifiedRepository.SYSTEM_FOLDER )
        ? (Boolean) meta.get( IUnifiedRepository.SYSTEM_FOLDER ) : false;

    }
    return false;
  }
}
