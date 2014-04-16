package org.pentaho.cdf.utils;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONException;
import org.json.JSONObject;

public class JsonUtil {

  public static class JsonFields {
    public static final String STATUS = "status";
    public static final String MESSAGE = "message";
    public static final String RESULT_PAYLOAD = "result";
  }

  public static class JsonResult {
    public static final String SUCCESS = "sucess";
    public static final String ERROR = "error";
  }

  private static final Log logger = LogFactory.getLog( JsonUtil.class );

  public static JSONObject makeJsonErrorResponse( String errorMessage, boolean logErrorMessage ) {
    JSONObject json = new JSONObject();
    try {
      json.put( JsonFields.STATUS, JsonResult.ERROR );

      if ( !StringUtils.isEmpty( errorMessage ) ) {
        json.put( JsonFields.MESSAGE, errorMessage );
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
    JSONObject json = new JSONObject();
    try {
      json.put( JsonFields.STATUS, JsonResult.SUCCESS );

      if ( payload != null ) {
        json.put( JsonFields.RESULT_PAYLOAD, payload );
      }
    } catch ( JSONException e ) {
      logger.error( e );
      throw e;
    }
    return json;
  }

  public static boolean isSuccessResponse( JSONObject json ) {
    try {
      return json != null && JsonResult.SUCCESS.equals( json.get( JsonFields.STATUS ) );
    } catch ( JSONException e ) {
      logger.error( e );
    }
    return false;
  }

}
