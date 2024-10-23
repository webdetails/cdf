/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


package org.pentaho.cdf.storage;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.hibernate.query.Query;
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

import java.util.Calendar;

public class StorageEngine implements StorageEngineInterface {

  private static final Log logger = LogFactory.getLog( StorageEngine.class );
  private static final StorageEngineInterface instance;

  static {
    PluginHibernateUtil.initialize();
    instance = new StorageEngine();
  }

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

  public static StorageEngineInterface getInstance() {
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
        session.getNamedQuery( "org.pentaho.cdf.storage.StorageEntry.getStorageForUser" ).setParameter( "user", user );
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
        session.getNamedQuery( "org.pentaho.cdf.storage.StorageEntry.getStorageForUser" ).setParameter( "user", user );

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
        session.getNamedQuery( "org.pentaho.cdf.storage.StorageEntry.getStorageForUser" ).setParameter( "user", user );
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
