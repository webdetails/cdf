package org.pentaho.cdf;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.util.Parameter;
import org.pentaho.cdf.utils.JsonUtil;
import org.pentaho.platform.api.repository2.unified.RepositoryFile;
import org.pentaho.platform.api.repository2.unified.RepositoryFileTree;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;

/**
 * @author pedro
 */
public class NavigateComponent {

  private static final Log logger = LogFactory.getLog( NavigateComponent.class );

  private static final String TYPE_FOLDER = "FOLDER"; //$NON-NLS-1$
  private static final String HIDDEN_DESC = "Hidden"; //$NON-NLS-1$

  public static JSONObject getJSONSolution( String path, int depth, boolean showHiddenFiles, String mode ) {
    JSONObject jsonRoot = new JSONObject();

    try {

      RepositoryFileTree tree = null;
      // TODO
        /*  RepositoryAccess.getRepository( PentahoSessionHolder.getSession() ).getRepositoryFileTree( path, depth,
              showHiddenFiles, "*" );*/

      if ( tree != null ) {

        if ( mode.equalsIgnoreCase( Parameter.NAVIGATOR ) ) {

          JSONObject json = new JSONObject();
          processTree( tree, json, false );
          jsonRoot.put( "solution", json );

        } else if ( mode.equalsIgnoreCase( Parameter.CONTENT_LIST ) ) {

          jsonRoot = repositoryFileToJSONObject( tree.getFile() );
          jsonRoot.put( "content", new JSONArray() );
          jsonRoot.remove( "files" );
          jsonRoot.remove( "folders" );
          processContentListTree( tree, jsonRoot );

        } else if ( mode.equalsIgnoreCase( Parameter.SOLUTION_TREE ) ) {

          JSONObject json = new JSONObject();
          processTree( tree, json, true );
          jsonRoot.put( "solution", json );
        }
      }
    } catch ( Exception e ) {
      logger.error( e );
      jsonRoot = JsonUtil.makeJsonErrorResponse( e.getMessage(), false );
    }
    return jsonRoot;
  }

  public static void processTree( final RepositoryFileTree tree, final JSONObject json, boolean includeAllFiles )
    throws Exception {

    JSONObject childJson = repositoryFileToJSONObject( tree.getFile() );

    if ( !tree.getFile().isFolder() ) {

      // is file

      if ( includeAllFiles ) {

        json.append( "files", childJson );

      } else {

        // only wcdf/xcdf files
        String type = childJson.getString( "type" ) != null ? childJson.getString( "type" ).toLowerCase() : null;
        if ( "wcdf".equals( type ) || "xcdf".equals( type ) ) {
          json.append( "files", childJson );
        }
      }

    } else {

      // is folder
      json.append( "folders", childJson );

      if ( tree.getChildren() != null ) {
        for ( final RepositoryFileTree childNode : tree.getChildren() ) {

          processTree( childNode, childJson, includeAllFiles );
        }
      }
    }
  }

  public static void processContentListTree( final RepositoryFileTree tree, final JSONObject json ) throws Exception {

    JSONObject childJson = repositoryFileToJSONObject( tree.getFile() );

    if ( !tree.getFile().isFolder() ) {

      // is file
      json.append( "content", childJson );

    } else {

      // is folder
      if ( tree.getChildren() != null ) {
        for ( final RepositoryFileTree childNode : tree.getChildren() ) {

          processContentListTree( childNode, json );
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

        json.put( "link", StringUtils.defaultString( "/api/repos/" + file.getPath().replaceAll( "/", ":" )
            + "/generatedContent" ) );

        int dot = file.getName().lastIndexOf( '.' );
        if ( dot > 0 ) {
          json.put( "type", file.getName().substring( dot + 1 ) );
        }
      }

      return json;
    }

    return null;
  }
}
