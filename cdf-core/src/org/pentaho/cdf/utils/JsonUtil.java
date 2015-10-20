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

package org.pentaho.cdf.utils;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONException;
import org.json.JSONObject;

public class JsonUtil {

  private static final Log logger = LogFactory.getLog( JsonUtil.class );

  public enum JsonField {
    STATUS( "status" ), MESSAGE( "message" ), RESULT( "result" );

    @SuppressWarnings( "unused" )
    private final String value;

    private JsonField( String field ) {
      this.value = field;
    }

    public String getValue() {
      return this.value;
    }
  }
  public enum JsonStatus {
    SUCCESS( "success" ), ERROR( "error" );

    @SuppressWarnings( "unused" )
    private final String value;

    private JsonStatus( String status ) {
      this.value = status;
    }

    public String getValue() {
      return this.value;
    }
  }

  public static JSONObject makeJsonErrorResponse( String errorMessage, boolean logErrorMessage ) {
    JSONObject json = new JSONObject();
    try {
      json.put( JsonField.STATUS.value, JsonStatus.ERROR.value );

      if ( !StringUtils.isEmpty( errorMessage ) ) {
        json.put( JsonField.MESSAGE.value, errorMessage );
        if ( logErrorMessage ) {
          logger.error( errorMessage );
        }
      }
    } catch ( JSONException e ) {
      logger.error( e );
    }
    return json;
  }

  public static JSONObject makeJsonSuccessResponse( Object payload ) throws JSONException {
    if ( payload == null ) {
      return new JSONObject();
    }
    try {
      if ( payload instanceof String ) {
        return new JSONObject( payload.toString() );
      }
      JSONObject json = new JSONObject();
      json.put( JsonField.STATUS.value, JsonStatus.SUCCESS.value );
      json.put( JsonField.RESULT.value, payload );
      return json;
    } catch ( JSONException e ) {
      logger.error( e );
      throw e;
    }
  }

  public static boolean isSuccessResponse( JSONObject json ) {
    try {
      return json != null && JsonStatus.SUCCESS.getValue().equals( json.get( JsonField.STATUS.getValue() ) );
    } catch ( JSONException e ) {
      logger.error( e );
    }
    return false;
  }
}
