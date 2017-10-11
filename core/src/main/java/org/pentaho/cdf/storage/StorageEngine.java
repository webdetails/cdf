/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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

package org.pentaho.cdf.storage;

import java.util.Calendar;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.hibernate.Query;
import org.hibernate.Session;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.InvalidCdfOperationException;
import org.pentaho.cdf.PluginHibernateException;
import org.pentaho.cdf.environment.CdfEngine;
import org.pentaho.cdf.utils.JsonUtil;
import org.pentaho.cdf.utils.PluginHibernateUtil;

import pt.webdetails.cpf.Util;
import pt.webdetails.cpf.repository.api.IBasicFile;

public class StorageEngine implements StorageEngineInterface {

  private static final Log logger = LogFactory.getLog( StorageEngine.class );
  private static StorageEngineInterface instance;

  public static enum Operation {
    READ( "READ" ), STORE( "STORE" ), DELETE( "DELETE" ), UNKNOWN( "UNKNOWN" );

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
  }

  public static synchronized StorageEngineInterface getInstance() {
    if ( instance == null ) {
      PluginHibernateUtil.initialize();
      instance = new StorageEngine();
    }
    return instance;
  }

  public StorageEngine() {
    try {
      logger.info( "Creating StorageEngine instance" );
      initialize();
    } catch ( PluginHibernateException ex ) {
      logger.fatal( "Could not create StorageEngine: " + Util.getExceptionDescription( ex ) ); //$NON-NLS-1$
      return;
    }
  }

  @Override
  public JSONObject store( String value, String user ) throws JSONException, InvalidCdfOperationException,
    PluginHibernateException {

    if ( StringUtils.isEmpty( value ) ) {
      logger.error( "Parameter 'storageValue' cannot be empty" );
      throw new InvalidCdfOperationException( "Parameter 'storageValue' cannot be empty" );
    }

    logger.debug( "Storing user entry" );

    // if we have one, get it. Otherwise, create a new one
    Session session = getSession();
    session.beginTransaction();

    Query query =
        session.getNamedQuery( "org.pentaho.cdf.storage.StorageEntry.getStorageForUser" ).setString( "user", user );
    StorageEntry storageEntry = (StorageEntry) query.uniqueResult();

    if ( storageEntry == null ) {
      storageEntry = new StorageEntry();
      storageEntry.setUser( user );
    }

    storageEntry.setStorageValue( value );
    storageEntry.setLastUpdatedDate( Calendar.getInstance().getTime() );

    session.save( storageEntry );
    session.flush();
    session.getTransaction().commit();
    session.close();

    return JsonUtil.makeJsonSuccessResponse( Boolean.TRUE );
  }

  @Override
  public JSONObject read( String user ) throws JSONException, InvalidCdfOperationException, PluginHibernateException {

    logger.debug( "Reading storage" );

    Session session = getSession();

    Query query =
        session.getNamedQuery( "org.pentaho.cdf.storage.StorageEntry.getStorageForUser" ).setString( "user", user );

    StorageEntry storageEntry = (StorageEntry) query.uniqueResult();

    // Return it, or an empty value
    String result = storageEntry != null ? storageEntry.getStorageValue() : "{}";
    session.close();

    return JsonUtil.makeJsonSuccessResponse( result );
  }

  @Override
  public JSONObject delete( String user ) throws JSONException, InvalidCdfOperationException, PluginHibernateException {

    logger.debug( "Deleting storage for user " + user );

    Session session = getSession();
    session.beginTransaction();

    Query query =
        session.getNamedQuery( "org.pentaho.cdf.storage.StorageEntry.getStorageForUser" ).setString( "user", user );
    StorageEntry storageEntry = (StorageEntry) query.uniqueResult();

    if ( storageEntry != null ) {
      session.delete( storageEntry );

    }
    session.flush();
    session.getTransaction().commit();
    session.close();

    return JsonUtil.makeJsonSuccessResponse( Boolean.TRUE );
  }

  private synchronized Session getSession() throws PluginHibernateException {
    return PluginHibernateUtil.getSession();
  }

  private void initialize() throws PluginHibernateException {

    try {

      // Get storage hbm file
      IBasicFile storageHbmFile = CdfEngine.getEnvironment().getHibernateConfigurations().getStorageConfigurationFile();

      if ( storageHbmFile == null || storageHbmFile.getContents() == null ) {
        logger.error( "Unable to find storage hbm file" );
        throw new PluginHibernateException( "Unable to find storage hbm file", null );
      }

      // Close session and rebuild
      PluginHibernateUtil.closeSession();
      PluginHibernateUtil.getConfiguration().addInputStream( storageHbmFile.getContents() );
      PluginHibernateUtil.rebuildSessionFactory();

    } catch ( Exception e ) {
      logger.error( "Unable to initialize storage engine", e );
      throw new PluginHibernateException( "Unable to initialize storage engine", e );
    }
  }
}
