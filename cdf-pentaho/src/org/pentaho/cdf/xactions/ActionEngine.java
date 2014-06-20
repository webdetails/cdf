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

package org.pentaho.cdf.xactions;

import java.io.OutputStream;
import java.util.HashMap;
import java.util.Iterator;

import org.pentaho.cdf.util.Parameter;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.IRuntimeContext;
import org.pentaho.platform.api.engine.ISolutionEngine;
import org.pentaho.platform.engine.services.solution.SolutionHelper;

public class ActionEngine {

  private static ActionEngine engine = new ActionEngine();

  public static ActionEngine getInstance() {
    return engine;
  }

  @SuppressWarnings( "unchecked" )
  public boolean execute( IParameterProvider requestParams, IPentahoSession userSession, OutputStream out ) {

    String solutionName = requestParams.getStringParameter( Parameter.SOLUTION, "" );
    String actionPath = requestParams.getStringParameter( Parameter.PATH, "" );
    String actionName = requestParams.getStringParameter( Parameter.ACTION, "" );
    actionPath = actionPath.startsWith( "/" ) || solutionName.endsWith( "/" ) ? actionPath : "/" + actionPath;
    actionPath = actionPath.endsWith( "/" ) || actionName.startsWith( "/" ) ? actionPath : actionPath + "/";

    Iterator<String> keys = requestParams.getParameterNames();
    HashMap<String, String> parameters = new HashMap<String, String>();
    while ( keys.hasNext() ) {
      String key = keys.next();
      parameters.put( key, requestParams.getStringParameter( key, null ) );
    }

    ISolutionEngine engine =
        SolutionHelper.execute( "executeAction", userSession, solutionName + actionPath + actionName, parameters, out );
    int status = engine.getExecutionContext().getStatus();

    return status == IRuntimeContext.RUNTIME_STATUS_SUCCESS;
  }

}
