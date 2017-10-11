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

package org.pentaho.cdf;

import static javax.ws.rs.core.MediaType.WILDCARD;

import java.io.IOException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import org.apache.commons.lang.StringUtils;
import org.pentaho.cdf.environment.CdfEngine;
import org.pentaho.cdf.utils.CorsUtil;
import org.pentaho.platform.api.engine.IPluginManager;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.web.http.api.resources.PluginResource;

@Path( "/pentaho-cdf/api/resources" )
public class ResourcesApi {

  @GET
  @Path( "/{path: [^?]+ }" )
  @Produces( { WILDCARD } )
  public Response getSystemResource( @PathParam( "path" ) String path, @Context HttpServletRequest request,
                                     @Context HttpServletResponse response )
    throws IOException {

    String pluginId = CdfEngine.getEnvironment().getPluginId();

    IPluginManager pluginManager = PentahoSystem.get( IPluginManager.class );

    if ( !StringUtils.isEmpty( path ) && pluginManager.isPublic( pluginId, path ) ) {

      Response readFileResponse = new PluginResource( response ).readFile( pluginId, path );
      CorsUtil.getInstance().setCorsHeaders( request, response );
      if ( readFileResponse.getStatus() != Status.NOT_FOUND.getStatusCode() ) {
        return readFileResponse;
      }
    }

    return Response.status( Status.NOT_FOUND ).build();
  }

}
