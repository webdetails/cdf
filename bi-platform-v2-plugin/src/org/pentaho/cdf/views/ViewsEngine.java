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
import pt.webdetails.cpf.persistence.IPersistenceEngine;
import pt.webdetails.cpf.persistence.ISimplePersistence;
import pt.webdetails.cpf.persistence.PersistenceEngine;
import pt.webdetails.cpf.persistence.SimplePersistence;
import pt.webdetails.cpf.persistence.Filter;


/**
 * @author pdpi
 */
public class ViewsEngine {

  private static ViewsEngine instance;
  private static final Log logger = LogFactory.getLog( ViewsEngine.class );

  protected ViewsEngine() {
    //initialize orientDb and initialize org.pentaho.cdf.views.View
    IPersistenceEngine pe = null;
    try {
      pe = getPersistenceEngine();
      if ( pe != null && !pe.classExists( ViewEntry.class.getName() ) ) {
        pe.initializeClass( ViewEntry.class.getName() );
      }
    } catch ( Exception e ) {
      //Intended general exception catch - do not want any PersistenceEngine initialization exception
      //to bubble up
      logger.error( "Error while initializing Views Engine. CDF will work but no views will be available", e );
    }

  }

  protected IPersistenceEngine getPersistenceEngine() {
    return PersistenceEngine.getInstance();
  }


  protected ISimplePersistence getSimplePersistence() {
    return SimplePersistence.getInstance();
  }

  protected IPentahoSession getSession() {
    return PentahoSessionHolder.getSession();
  }


  public static synchronized ViewsEngine getInstance() {
    if ( instance == null ) {
      instance = new ViewsEngine();
    }
    return instance;
  }

  public ViewEntry getView( String id ) {
    IPentahoSession userSession = getSession();
    ISimplePersistence sp;
    try {
      sp = getSimplePersistence();
      Filter filter = new Filter();
      filter.where( "name" ).equalTo( id ).and().where( "user" ).equalTo( userSession.getName() );
      List<ViewEntry> views = sp.load( ViewEntry.class, filter );

      return ( views != null && views.size() > 0 ) ? views.get( 0 ) : null;
    } catch ( Exception e ) {
      logger.error( "Error while getting view.", e );
      return null;
    }

  }

  public JSONObject listViews() {
    IPentahoSession userSession = getSession();
    ISimplePersistence sp;
    JSONObject obj = new JSONObject();
    JSONArray arr = new JSONArray();

    try {
      sp = getSimplePersistence();
      Filter filter = new Filter();
      filter.where( "user" ).equalTo( userSession.getName() );
      List<ViewEntry> views = sp.load( ViewEntry.class, filter );
      for ( ViewEntry v : views ) {
        arr.put( v.toJSON() );
      }
    } catch ( Exception e ) {
      logger.error( "Error while listing views", e );
      try {
        obj.put( "views", arr );
        obj.put( "status", "error" );
      } catch ( JSONException je ) {
        logger.warn( "Exception while writing result to json object", je );
      }
      return obj;
    }

    try {
      obj.put( "views", arr );
      obj.put( "status", "ok" );
    } catch ( JSONException e ) {
      logger.warn( "Exception while writing result to json object", e );
    }
    return obj;
  }

  public JSONObject saveView( String viewContent ) {
    ViewEntry view = new ViewEntry();
    IPentahoSession userSession = getSession();
    JSONObject obj = new JSONObject();

    try {
      JSONObject json = new JSONObject( viewContent );
      view.fromJSON( json );
      view.setUser( userSession.getName() );
      IPersistenceEngine pe = null;
      try {
        pe = getPersistenceEngine();
      } catch ( Exception e ) {
        logger.error( "Exception while getting persistence engine. View Will not be saved", e );
      }
      if ( pe != null ) {
        pe.store( view );
        try {
          obj.put( "status", "ok" );
        } catch ( JSONException e ) {
          logger.warn( "Exception while writing result to json object", e );
        }
      } else {
        try {
          obj.put( "status", "error" );
        } catch ( JSONException ex ) {
          logger.warn( "Exception while writing result to json object", ex );
        }
      }

    } catch ( JSONException e ) {
      logger.error( e );
      try {
        obj.put( "status", "error" );
      } catch ( JSONException ex ) {
        logger.warn( "Exception while writing result to json object", ex );
      }
    }

    return obj;
  }

  public JSONObject deleteView( String name ) {
    IPentahoSession userSession = getSession();
    JSONObject obj = new JSONObject();

    try {
      Filter filter = new Filter();
      filter.where( "user" ).equalTo( userSession.getName() ).and().where( "name" ).equalTo( name );
      ISimplePersistence sp = getSimplePersistence();
      sp.delete( ViewEntry.class, filter );
      try {
        obj.put( "status", "ok" );
      } catch ( JSONException e ) {
        logger.warn( "Exception while writing result to json object", e );
      }
    } catch ( Exception e ) {
      logger.error( e );
      try {
        obj.put( "status", "error" );
      } catch ( JSONException ex ) {
        logger.warn( "Exception while writing result to json object", e );
      }
    }

    return obj;
  }

  public void listReports() {
  }

  public void saveReport() {
  }
}
