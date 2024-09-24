/*!
 * Copyright 2002 - 2019 Webdetails, a Hitachi Vantara company. All rights reserved.
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

package org.pentaho.cdf.xactions;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.cdf.util.CdfHttpServletRequestWrapper;
import org.pentaho.cdf.utils.CorsUtil;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.IRuntimeContext;
import org.pentaho.platform.api.engine.ISolutionEngine;
import org.pentaho.platform.api.repository2.unified.IUnifiedRepository;
import org.pentaho.platform.api.repository2.unified.RepositoryFile;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.engine.services.solution.SolutionHelper;
import org.pentaho.platform.util.messages.LocaleHelper;
import org.pentaho.platform.web.http.api.resources.XactionUtil;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class ActionEngine {

  private static final Log logger = LogFactory.getLog( ActionEngine.class );
  private static final ActionEngine instance = new ActionEngine();

  public static ActionEngine getInstance() {
    return instance;
  }

  public ActionEngine() {
    logger.info( "Creating ActionEngine instance" );
  }

  @Deprecated
  public boolean executeAction( String resource, IPentahoSession userSession, OutputStream out,
      HashMap<String, String> params ) {
    ISolutionEngine engine = SolutionHelper.execute( "executeAction", userSession, resource, params, out );
    int status = engine.getExecutionContext().getStatus();

    return status == IRuntimeContext.RUNTIME_STATUS_SUCCESS;
  }

  public boolean executeAction( String path, String contentType, HttpServletRequest httpServletRequest,
      HttpServletResponse httpServletResponse, IPentahoSession userSession, HashMap<String, String> params )
    throws IOException {

    boolean success = false;

    try {

      IUnifiedRepository unifiedRepository = PentahoSystem.get( IUnifiedRepository.class, null );
      RepositoryFile file = unifiedRepository.getFile( path );

      CdfHttpServletRequestWrapper request = new CdfHttpServletRequestWrapper( httpServletRequest );
      if ( params != null ) {
        Iterator<Map.Entry<String, String>> it = params.entrySet().iterator();
        while ( it.hasNext() ) {
          Map.Entry<String, String> entry = it.next();
          request.addParameter( entry.getKey(), entry.getValue() );
        }
      }

      String buffer = XactionUtil.execute( contentType, file, request, httpServletResponse, userSession, null );

      if ( !StringUtils.isEmpty( buffer ) ) {
        httpServletResponse.getOutputStream().write( buffer.getBytes( LocaleHelper.getSystemEncoding() ) );
      }

      CorsUtil.getInstance().setCorsHeaders( httpServletRequest, httpServletResponse );

      success = true;

    } catch ( Throwable t ) {
      logger.error( t );
      httpServletResponse.sendError( HttpServletResponse.SC_INTERNAL_SERVER_ERROR, t.getMessage() );
    }

    return success;
  }
}
