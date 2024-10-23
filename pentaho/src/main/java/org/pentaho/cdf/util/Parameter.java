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


package org.pentaho.cdf.util;

import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;

import jakarta.servlet.http.HttpServletRequest;

import org.apache.commons.lang.StringUtils;
import org.pentaho.platform.api.engine.IParameterProvider;

public class Parameter {

  public static final String ACTION = "action"; //$NON-NLS-1$
  public static final String PAGE = "page"; //$NON-NLS-1$
  public static final String COMMENT = "comment"; //$NON-NLS-1$
  public static final String COMMENT_ID = "commentId"; //$NON-NLS-1$
  public static final String VALUE = "value"; //$NON-NLS-1$
  public static final String STORAGE_VALUE = "storageValue"; //$NON-NLS-1$
  public static final String SOLUTION = "solution"; //$NON-NLS-1$
  public static final String PATH = "path"; //$NON-NLS-1$
  public static final String FULL_PATH = "fullPath"; //$NON-NLS-1$
  public static final String FILE = "file"; //$NON-NLS-1$
  public static final String TEMPLATE = "template"; //$NON-NLS-1$
  public static final String MODE = "mode"; //$NON-NLS-1$
  public static final String METHOD = "method"; //$NON-NLS-1$
  public static final String NAME = "name"; //$NON-NLS-1$
  public static final String VIEW = "view"; //$NON-NLS-1$
  public static final String VIEW_ID = "viewId"; //$NON-NLS-1$
  public static final String RESOURCE = "resource"; //$NON-NLS-1$
  public static final String FIRST_RESULT = "firstResult"; //$NON-NLS-1$
  public static final String MAX_RESULTS = "maxResults"; //$NON-NLS-1$
  public static final String DELETED = "deleted"; //$NON-NLS-1$
  public static final String ARCHIVED = "archived"; //$NON-NLS-1$
  public static final String DEBUG = "debug"; //$NON-NLS-1$
  public static final String DASHBOARD = "dashboard"; //$NON-NLS-1$
  public static final String CALLBACK = "callback"; //$NON-NLS-1$
  public static final String CONTENT_TYPE = "contentType"; //$NON-NLS-1$
  public static final String EXPORT_TYPE = "exportType"; //$NON-NLS-1$
  public static final String DEPTH = "depth"; //$NON-NLS-1$
  public static final String SHOW_HIDDEN_FILES = "showHiddenFiles"; //$NON-NLS-1$
  public static final String DASHBOARD_CONTENT = "dashboardContent"; //$NON-NLS-1$
  public static final String DASHBOARD_TYPE = "dashboardType"; //$NON-NLS-1$
  public static final String ABSOLUTE = "absolute"; //$NON-NLS-1$
  public static final String ROOT = "root"; //$NON-NLS-1$
  public static final String SCHEME = "scheme"; //$NON-NLS-1$
  public static final String KEY = "key"; //$NON-NLS-1$
  public static final String NAVIGATOR = "navigator"; //$NON-NLS-1$
  public static final String CONTENT_LIST = "contentList"; //$NON-NLS-1$
  public static final String SOLUTION_TREE = "solutionTree"; //$NON-NLS-1$  
  public static final String QUERY_TYPE = "queryType"; //$NON-NLS-1$
  public static final String QUERY = "query"; //$NON-NLS-1$  
  public static final String CATALOG = "catalog"; //$NON-NLS-1$ 
  public static final String JNDI = "jndi"; //$NON-NLS-1$
  public static final String USER = "user"; //$NON-NLS-1$
  public static final String LOAD_THEME = "loadTheme"; //$NON-NLS-1$

  /**
   * extracts all parameter from a given http request
   * 
   * @param request
   *          HttpServletRequest
   * @return HashMap where (key,value) = (paramName, paramValue)
   */
  public static HashMap<String, String> asHashMap( HttpServletRequest request ) {

    HashMap<String, String> params = new HashMap<String, String>();

    if ( request != null && request.getParameterMap() != null && request.getParameterMap().size() > 0 ) {
      @SuppressWarnings( "rawtypes" )
      Enumeration enumeration = request.getParameterNames();

      while ( enumeration.hasMoreElements() ) {
        String param = (String) enumeration.nextElement();
        params.put( param, request.getParameter( param ) );
      }
    }
    return params;
  }

  /**
   * extracts all parameter from a given IParameterProvider
   * 
   * @param parameterProvider
   *          IParameterProvider
   * @return HashMap where (key,value) = (paramName, paramValue)
   */
  public static HashMap<String, String> asHashMap( IParameterProvider parameterProvider ) {

    HashMap<String, String> params = new HashMap<String, String>();

    if ( parameterProvider != null ) {

      @SuppressWarnings( "unchecked" )
      Iterator<String> it = parameterProvider.getParameterNames();

      while ( it.hasNext() ) {
        String paramName = it.next();

        if ( StringUtils.isEmpty( paramName ) ) {
          continue;
        }

        if ( parameterProvider.hasParameter( paramName ) ) {

          Object paramValue = parameterProvider.getParameter( paramName );

          if ( paramValue == null ) {
            continue;
          }

          params.put( paramName, paramValue.toString() );
        }
      }
    }

    return params;
  }
}
