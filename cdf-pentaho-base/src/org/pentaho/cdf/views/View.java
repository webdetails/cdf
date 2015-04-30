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

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import pt.webdetails.cpf.persistence.Persistable;
import sun.misc.BASE64Decoder;
import sun.misc.BASE64Encoder;

public class View implements Persistable {

  private static final Log logger = LogFactory.getLog( View.class );

  private Map<String, Object> parameters;
  private Map<String, Object> userData;
  private List<String> unboundParams;
  private String name, key, user, description;
  private String solution, path, file;
  private Date timestamp;

  public String getSolution() {
    return solution;
  }

  public void setSolution( String solution ) {
    this.solution = solution;
  }

  public String getPath() {
    return path;
  }

  public void setPath( String path ) {
    this.path = path;
  }

  public String getFile() {
    return file;
  }

  public void setFile( String file ) {
    this.file = file;
  }

  public void setParameter( String name, Object value ) {
    parameters.put( name, value );
  }

  public Object getParameter( String name ) {
    return parameters.get( name );
  }

  public void setUserData( String name, Object value ) {
    userData.put( name, value );
  }

  public Object getUserData( String name ) {
    return userData.get( name );
  }

  public String getName() {
    return name;
  }

  public void setName( String name ) {
    this.name = name;
  }

  public String getUser() {
    return user;
  }

  public void setUser( String user ) {
    this.user = user;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription( String description ) {
    this.description = description;
  }

  public Date getTimestamp() {
    return timestamp;
  }

  public void setTimestamp( Date timestamp ) {
    this.timestamp = timestamp;
  }

  public String getKey() {
    return key;
  }

  public void setKey( String key ) {
    this.key = key;
  }

  public JSONObject toJSON() {
    try {
      BASE64Encoder base64Encoder = new BASE64Encoder();

      JSONObject json = new JSONObject();
      json.put( "description", description );
      json.put( "name", name );
      json.put( "id", key );
      json.put( "timestamp", timestamp == null ? 0 : timestamp.getTime() );
      json.put( "user", user );
      json.put( "unbound", new JSONArray( unboundParams ) );
      String p = new String( base64Encoder.encode( new JSONObject( parameters ).toString( 2 ).getBytes() ) );
      json.put( "params", p );
      if ( userData != null ) {
        String u = new String( base64Encoder.encode( new JSONObject( userData ).toString( 2 ).getBytes() ) );
        json.put( "userData", u );
      }
      json.put( "solution", solution );
      json.put( "path", path );
      json.put( "file", file );
      return json;
    } catch ( JSONException e ) {
      logger.error( e );
      return null;
    }
  }

  public void fromJSON( JSONObject json ) throws JSONException {
    try {
      BASE64Decoder base64Decoder = new BASE64Decoder();

      String _description, _name, _key, _user, _solution, _path, _file;
      Date _timestamp;
      JSONObject jsonUserData, jsonParams;
      Map<String, Object> _params = new HashMap<String, Object>(), _userData = new HashMap<String, Object>();
      _description = json.optString( "description" );
      _name = json.getString( "name" );
      _key = json.isNull( "id" ) ? null : json.optString( "id" );
      _timestamp = new Date( json.optLong( "timestamp", 0 ) );
      _user = json.getString( "user" );
      _solution = json.optString( "solution" );
      _path = json.optString( "path" );
      _file = json.optString( "file" );
      String p = json.getString( "params" );
      try {
        jsonParams = new JSONObject( new String( base64Decoder.decodeBuffer( p ) ) );
      } catch ( IOException e ) {
        logger.error( e );
        throw new JSONException( e );
      }
      JSONArray jsonUnbound = json.getJSONArray( "unbound" );
      String[] keys = JSONObject.getNames( jsonParams );
      if ( keys != null ) {
        for ( String k : keys ) {
          _params.put( k, jsonParams.get( k ) );
        }
      }
      List<String> _unbound = new ArrayList<String>();
      for ( int i = 0; i < jsonUnbound.length(); i++ ) {
        _unbound.add( jsonUnbound.getString( i ) );
      }

      if ( json.has( "userData" ) ) {
        String u = json.getString( "userData" );
        try {
          jsonUserData = new JSONObject( new String( base64Decoder.decodeBuffer( u ) ) );
        } catch ( IOException e ) {
          logger.error( e );
          throw new JSONException( e );
        }
        String[] userDataKeys = JSONObject.getNames( jsonUserData );
        if ( userDataKeys != null ) {
          for ( String k : userDataKeys ) {
            _userData.put( k, jsonUserData.get( k ) );
          }
        }
      } else {
        _userData = null;
      }
      name = _name;
      user = _user;
      description = _description;
      key = _key;
      timestamp = _timestamp;
      parameters = _params;
      userData = _userData;
      unboundParams = _unbound;
      solution = _solution;
      path = _path;
      file = _file;
    } catch ( JSONException e ) {
      logger.error( e );
    }
  }
}
