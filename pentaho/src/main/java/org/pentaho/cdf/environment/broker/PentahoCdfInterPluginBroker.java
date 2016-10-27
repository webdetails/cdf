/*!
 * Copyright 2002 - 2016 Webdetails, a Pentaho company. All rights reserved.
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

package org.pentaho.cdf.environment.broker;

import java.io.StringReader;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Node;
import org.dom4j.io.SAXReader;
import org.json.JSONObject;
import org.json.JSONException;

import pt.webdetails.cpf.InterPluginCall;
import pt.webdetails.cpf.utils.XmlParserFactoryProducer;

public class PentahoCdfInterPluginBroker implements ICdfInterPluginBroker {

  private static final Log logger = LogFactory.getLog( PentahoCdfInterPluginBroker.class );
  private static PentahoCdfInterPluginBroker instance;

  public static PentahoCdfInterPluginBroker getInstance() {
    if ( instance == null ) {
      instance = new PentahoCdfInterPluginBroker();
    }
    return instance;
  }

  @Override
  public void addCdaQueries( JSONObject queries, String cdaPath ) {
    List<String> dataAccessIds = listCdaQueries( cdaPath );
    // String idPattern = (String) cda.selectObject("string(ids)");
    if ( logger.isDebugEnabled() ) {
      logger.debug( String.format( "data access ids for %s:( %s )", cdaPath, StringUtils.join(
          dataAccessIds.iterator(), ", " ) ) );
    }
    for ( String id : dataAccessIds ) {
      String reply = executeCdaQuery( cdaPath, id );
      try {
        queries.put( id, new JSONObject( reply ) );
      } catch ( JSONException e ) {
        logger.error( "Failed to add query " + id + " to contex object" );
      }
    }
  }

  @Override
  public String executeCdaQuery( String path, String id ) {
    Map<String, Object> params = new HashMap<String, Object>();
    params.put( "dataAccessId", id );
    params.put( "path", path );
    logger.info( "[Timing] Executing autoinclude query: "
        + ( new SimpleDateFormat( "HH:mm:ss.SSS" ) ).format( new Date() ) );
    InterPluginCall ipc = new InterPluginCall( InterPluginCall.CDA, "doQueryInterPluginOld", params );
    String reply = ipc.callInPluginClassLoader();
    logger.info( "[Timing] Done executing autoinclude query: "
        + ( new SimpleDateFormat( "HH:mm:ss.SSS" ) ).format( new Date() ) );
    return reply;
  }

  @Override
  public List<String> listCdaQueries( String cda ) {
    SAXReader reader = XmlParserFactoryProducer.getSAXReader( null );
    List<String> queryOutput = new ArrayList<String>();
    try {
      Map<String, Object> params = new HashMap<String, Object>();

      params.put( "path", cda );
      params.put( "outputType", "xml" );
      InterPluginCall ipc = new InterPluginCall( InterPluginCall.CDA, "listQueriesInterPluginOld", params );
      String reply = ipc.call();
      Document queryList = reader.read( new StringReader( reply ) );
      @SuppressWarnings( "unchecked" )
      List<Node> queries = queryList.selectNodes( "//ResultSet/Row/Col[1]" );
      for ( Node query : queries ) {
        queryOutput.add( query.getText() );
      }
    } catch ( DocumentException e ) {
      return null;
    }
    return queryOutput;
  }
}
