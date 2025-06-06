/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/


package org.pentaho.cdf;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.cdf.environment.CdfEngine;
import org.pentaho.cdf.util.Parameter;
import org.pentaho.platform.web.servlet.ServletBase;
import pt.webdetails.cpf.MimeTypeHandler;
import pt.webdetails.cpf.repository.api.IReadAccess;
import pt.webdetails.cpf.utils.MimeTypes;
import pt.webdetails.cpf.utils.PluginIOUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class GetCDFResource extends ServletBase {

  private static final long serialVersionUID = 8251622066287622726L;

  private static final Log logger = LogFactory.getLog( GetCDFResource.class );

  /**
   * Processes requests for both HTTP <code>GET</code> and <code>POST</code> methods.
   *
   * @param request  servlet request
   * @param response servlet response
   */
  protected void processRequest( HttpServletRequest request, HttpServletResponse response ) throws IOException {

    IReadAccess systemAccess = CdfEngine.getPluginSystemReader( null );
    String resource = request.getParameter( Parameter.RESOURCE ); //$NON-NLS-1$

    if ( StringUtils.isEmpty( resource ) ) {
      error( Messages.getErrorString( "GetResource.ERROR_0001_RESOURCE_PARAMETER_MISSING" ) ); //$NON-NLS-1$
      response.setStatus( HttpServletResponse.SC_SERVICE_UNAVAILABLE );
      return;
    }

    if ( !systemAccess.fileExists( resource ) ) {
      error( Messages.getErrorString( "GetResource.ERROR_0003_RESOURCE_MISSING", resource ) ); //$NON-NLS-1$
      response.setStatus( HttpServletResponse.SC_SERVICE_UNAVAILABLE );
      return;
    }

    InputStream in = systemAccess.getFileInputStream( resource );
    String mimeType = MimeTypeHandler.getMimeTypeFromFileName( resource );

    if ( StringUtils.isEmpty( mimeType ) ) {
      // Hard coded to PNG because BIRT does not give us a mime type at all...
      response.setContentType( MimeTypes.PNG );
    }

    response.setContentType( mimeType );
    response.setCharacterEncoding( CdfEngine.getEnvironment().getSystemEncoding() );
    response.setHeader( "expires", "0" ); //$NON-NLS-1$ //$NON-NLS-2$
    // Open the input and output streams
    OutputStream out = response.getOutputStream();
    try {
      // Copy the contents of the file to the output stream
      PluginIOUtils.writeOutAndFlush( out, in );
    } finally {
      if ( in != null ) {
        in.close();
      }
      if ( out != null ) {
        out.close();
      }
    }
  }

  public Log getLogger() {
    return logger;
  }

  // <editor-fold defaultstate="collapsed"
  // desc="HttpServlet methods. Click on the + sign on the left to edit the code.">

  /**
   * Handles the HTTP <code>GET</code> method.
   *
   * @param request  servlet request
   * @param response servlet response
   */
  @Override
  protected void doGet( HttpServletRequest request, HttpServletResponse response ) {
    handleRequest( request, response, "GET" );
  }

  /**
   * Handles the HTTP <code>POST</code> method.
   *
   * @param request  servlet request
   * @param response servlet response
   */
  @Override
  protected void doPost( HttpServletRequest request, HttpServletResponse response ) {
    handleRequest( request, response, "POST" );
  }

  private void handleRequest( HttpServletRequest request, HttpServletResponse response, String method ) {
    try {
      processRequest( request, response );
    } catch ( IOException e ) {
      logger.error( "Error processing " + method + " request: ", e );
      response.setStatus( HttpServletResponse.SC_INTERNAL_SERVER_ERROR );
      response.setContentType( "text/plain; charset=UTF-8" );
      try {
        response.getWriter().write( Messages.getErrorString( "GenericServlet.ERROR_0006_ERROR_PROCESSING_REQUEST" ) );
      } catch ( IOException ioException ) {
        logger.error( "Error writing error response", ioException );
      }
    }
  }

  /**
   * Returns a short description of the servlet.
   */
  @Override
  public String getServletInfo() {
    return "Short description";
  } // </editor-fold>
}
