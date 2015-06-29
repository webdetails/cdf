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

package org.pentaho.cdf.views;

import java.util.List;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.utils.JsonUtil;
import pt.webdetails.cpf.persistence.IPersistenceEngine;
import pt.webdetails.cpf.persistence.ISimplePersistence;
import pt.webdetails.cpf.persistence.PersistenceEngine;
import pt.webdetails.cpf.persistence.SimplePersistence;
import pt.webdetails.cpf.persistence.Filter;

public class ViewsEngine {

  private static final Log logger = LogFactory.getLog( ViewsEngine.class );

  private static ViewsEngine instance;

  /**
   * Implementation for server version 4.8
   */
  public enum Operation {
    GETVIEW( "GETVIEW" ), LISTVIEWS( "LISTVIEWS" ), LISTALLVIEWS( "LISTALLVIEWS" ), SAVEVIEW( "SAVEVIEW" ), DELETEVIEW(
        "DELETEVIEW" ), UNKNOWN( "UNKNOWN" );

    @SuppressWarnings( "unused" )
    private final String operation;

    private Operation( String operation ) {
      this.operation = operation;
    }

    public static Operation get( String operation ) {
      try {
        return valueOf( operation.toUpperCase() );
      } catch ( Exception e ) {
        logger.error( e );
        return UNKNOWN;
      }
    }
  }

  protected ViewsEngine() {
    // initialize orientDb and initialize org.pentaho.cdf.views.View
    IPersistenceEngine pe;
    try {
      pe = getPersistenceEngine();
      if ( pe != null && !pe.classExists( View.class.getName() ) ) {
        pe.initializeClass( View.class.getName() );
      }
    } catch ( Exception e ) {
      // Intended general exception catch - do not want any PersistenceEngine initialization exception
      // to bubble up
      logger.error( "Error while initializing Views Engine. CDF will work but no views will be available", e );
    }

  }

  protected IPersistenceEngine getPersistenceEngine() {
    return PersistenceEngine.getInstance();
  }


  protected ISimplePersistence getSimplePersistence() {
    return SimplePersistence.getInstance();
  }


  public static synchronized ViewsEngine getInstance() {
    if ( instance == null ) {
      instance = new ViewsEngine();
    }
    return instance;
  }

  public JSONObject getView( String name, String user ) throws JSONException {

    if ( StringUtils.isEmpty( name ) ) {
      return JsonUtil.makeJsonErrorResponse( "Error getting view, empty name parameter", true );
    } else if ( StringUtils.isEmpty( user ) ) {
      return JsonUtil.makeJsonErrorResponse( "Error getting view, unknown user", true );
    }

    try {
      ISimplePersistence sp = getSimplePersistence();
      Filter filter = new Filter();
      filter.where( "name" ).equalTo( name ).and().where( "user" ).equalTo( user );
      List<View> views = sp.load( View.class, filter );

      if ( views != null && views.size() > 0 ) {
        return JsonUtil.makeJsonSuccessResponse( views.get( 0 ).toJSON() );
      } else {
        return JsonUtil.makeJsonErrorResponse( "Error, no view found with name '" + name + "'", true );
      }
    } catch ( Exception e ) {
      logger.error( e );
      return JsonUtil.makeJsonErrorResponse( "Error getting view '" + name + "' for user '" + user + "'", true );
    }
  }

  public JSONObject listViews( String user ) throws JSONException {
    if ( StringUtils.isEmpty( user ) ) {
      return JsonUtil.makeJsonErrorResponse( "Error getting view, unknown user", true );
    }

    try {
      ISimplePersistence sp = getSimplePersistence();
      Filter filter = new Filter();
      filter.where( "user" ).equalTo( user );
      List<View> views = sp.load( View.class, filter );

      if ( views != null ) {
        JSONArray arr = new JSONArray();
        for ( View v : views ) {
          arr.put( v.toJSON() );
        }
        return JsonUtil.makeJsonSuccessResponse( arr );
      } else {
        return JsonUtil.makeJsonErrorResponse( "Error listing views for user '" + user + "'", true );
      }
    } catch ( Exception e ) {
      logger.error( e );
      return JsonUtil.makeJsonErrorResponse( "Error listing views for user '" + user + "'", true );
    }
  }

  public JSONObject listAllViews() throws JSONException {
    try {
      ISimplePersistence sp = getSimplePersistence();
      List<View> views = sp.loadAll( View.class );

      if ( views != null ) {
        JSONArray arr = new JSONArray();
        for ( View v : views ) {
          arr.put( v.toJSON() );
        }
        return JsonUtil.makeJsonSuccessResponse( arr );
      } else {
        return JsonUtil.makeJsonErrorResponse( "Error listing all views", true );
      }
    } catch ( Exception e ) {
      logger.error( e );
      return JsonUtil.makeJsonErrorResponse( "Error listing all views", true );
    }
  }

  public JSONObject saveView( String name, String view, String user ) throws JSONException {
    if ( StringUtils.isEmpty( name ) ) {
      return JsonUtil.makeJsonErrorResponse( "Error saving view, empty name parameter", true );
    } else if ( StringUtils.isEmpty( view ) ) {
      return JsonUtil.makeJsonErrorResponse( "Error saving view, empty view parameter", true );
    } else if ( StringUtils.isEmpty( user ) ) {
      return JsonUtil.makeJsonErrorResponse( "Error saving view, unknown user", true );
    }
    View viewObj = new View();
    try {
      IPersistenceEngine pe = getPersistenceEngine();
      JSONObject jSONObj = new JSONObject( view );
      viewObj.fromJSON( jSONObj );
      if ( StringUtils.isEmpty( viewObj.getName() ) || !viewObj.getName().equals( name ) ) {
        return JsonUtil.makeJsonErrorResponse( "Error saving view, unknown user", true );
      }

      viewObj.setUser( user );

      JSONObject res = pe.store( viewObj );

      if ( res == null ) {
        return JsonUtil.makeJsonErrorResponse( "Error persisting view '" + name + "'", true );
      }

      if ( res.getBoolean( JsonUtil.JsonField.RESULT.getValue() ) ) {
        jSONObj.put( "id", res.getString( "id" ) );
        return JsonUtil.makeJsonSuccessResponse( jSONObj );
      } else {
        return JsonUtil.makeJsonErrorResponse( res.getString( "errorMessage" ), true );
      }
    } catch ( Exception e ) {
      logger.error( e );
      return JsonUtil.makeJsonErrorResponse( "Error saving view '" + name + "'", true );
    }
  }

  public JSONObject deleteView( String name, String user ) throws JSONException {
    if ( StringUtils.isEmpty( name ) ) {
      return JsonUtil.makeJsonErrorResponse( "Error deleting view, empty name parameter", true );
    } else if ( StringUtils.isEmpty( user ) ) {
      return JsonUtil.makeJsonErrorResponse( "Error deleting view, unknown user", true );
    }

    try {
      Filter filter = new Filter();
      filter.where( "user" ).equalTo( user ).and().where( "name" ).equalTo( name );
      ISimplePersistence sp = getSimplePersistence();
      sp.delete( View.class, filter );

      JSONObject res = new JSONObject();
      res.put( "name", name );
      return JsonUtil.makeJsonSuccessResponse( res );
    } catch ( Exception e ) {
      logger.error( e );
      return JsonUtil.makeJsonErrorResponse( "Error deleting view '" + name + "'", true );
    }
  }
}
