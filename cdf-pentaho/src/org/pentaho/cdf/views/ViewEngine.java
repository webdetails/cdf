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

package org.pentaho.cdf.views;

import java.util.List;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.security.SecurityHelper;

import pt.webdetails.cpf.persistence.Filter;
import pt.webdetails.cpf.persistence.PersistenceEngine;
import pt.webdetails.cpf.persistence.SimplePersistence;

/**
 * 
 * @author pdpi
 */
public class ViewEngine {

  private static ViewEngine instance;
  private static final Log logger = LogFactory.getLog( ViewEngine.class );

  public static enum Operation {
    GET_VIEW( "GETVIEW" ), LIST_VIEWS( "LISTVIEWS" ), LIST_ALL_VIEWS( "LISTALLVIEWS" ), SAVE_VIEW( "SAVEVIEW" ), DELETE_VIEW(
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
        // do nothing
      }
      return UNKNOWN;
    }
  };

  private ViewEngine() {
    // initialize orientDb and initialize org.pentaho.cdf.views.View
    PersistenceEngine pe = PersistenceEngine.getInstance();
    if ( !pe.classExists( View.class.getName() ) ) {
      pe.initializeClass( View.class.getName() );
    }
  }

  public synchronized static ViewEngine getInstance() {
    if ( instance == null ) {
      instance = new ViewEngine();
    }
    return instance;
  }

  public View getView( String name ) {
    IPentahoSession userSession = PentahoSessionHolder.getSession();
    SimplePersistence sp = SimplePersistence.getInstance();
    Filter filter = new Filter();
    filter.where( "name" ).equalTo( name ).and().where( "user" ).equalTo( userSession.getName() );
    List<View> views = sp.load( View.class, filter );

    return ( views != null && views.size() > 0 ) ? views.get( 0 ) : null;
  }

  public JSONObject listViews() {
    IPentahoSession userSession = PentahoSessionHolder.getSession();
    SimplePersistence sp = SimplePersistence.getInstance();
    Filter filter = new Filter();
    filter.where( "user" ).equalTo( userSession.getName() );
    List<View> views = sp.load( View.class, filter );
    JSONObject obj = new JSONObject();
    JSONArray arr = new JSONArray();
    for ( View v : views ) {
      arr.put( v.toJSON() );
    }
    try {
      obj.put( "views", arr );
      obj.put( "status", "ok" );
    } catch ( JSONException e ) {
    }
    return obj;
  }

  public JSONObject listAllViews() {
    JSONObject response = new JSONObject();
    IPentahoSession userSession = PentahoSessionHolder.getSession();
    if ( !SecurityHelper.isPentahoAdministrator( userSession ) ) {
      try {
        response.put( "status", "error" );
        response.put( "message", "You need to be an administrator to poll all views" );
      } catch ( JSONException e ) {
      }
      return response;
    }
    SimplePersistence sp = SimplePersistence.getInstance();
    Filter filter = new Filter();
    filter.where( "user" ).equalTo( userSession.getName() );
    List<View> views = sp.loadAll( View.class );
    JSONArray arr = new JSONArray();
    for ( View v : views ) {
      arr.put( v.toJSON() );
    }
    try {
      response.put( "views", arr );
      response.put( "status", "ok" );
    } catch ( JSONException e ) {
    }
    return response;
  }

  public String saveView( String view ) {
    View viewObj = new View();
    IPentahoSession userSession = PentahoSessionHolder.getSession();

    try {
      JSONObject json = new JSONObject( view );
      viewObj.fromJSON( json );
      viewObj.setUser( userSession.getName() );
      PersistenceEngine pe = PersistenceEngine.getInstance();
      pe.store( viewObj );
    } catch ( JSONException e ) {
      logger.error( e );
      return "error";
    }
    return "ok";
  }

  public String deleteView( String name ) {
    IPentahoSession userSession = PentahoSessionHolder.getSession();
    try {
      Filter filter = new Filter();
      filter.where( "user" ).equalTo( userSession.getName() ).and().where( "name" ).equalTo( name );
      SimplePersistence.getInstance().delete( View.class, filter );
      return "ok";
    } catch ( Exception e ) {
      return "error";
    }
  }

  public void listReports() {
  }

  public void saveReport() {
  }
}
