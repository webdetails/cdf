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

package org.pentaho.cdf.util;

import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;

/**
 * CdfHttpServletRequestWrapper allows for an addable request parameter map
 */
public class CdfHttpServletRequestWrapper extends HttpServletRequestWrapper {

  // see http://docs.oracle.com/javaee/6/api/javax/servlet/ServletRequest.html#getParameterMap()
  private HashMap<String, String[]> paramMap = new HashMap<String, String[]>();

  public CdfHttpServletRequestWrapper( HttpServletRequest request ) {
    super( request );
  }

  // see http://docs.oracle.com/javaee/6/api/javax/servlet/ServletRequest.html#getParameter(java.lang.String)
  @Override
  public String getParameter( String key ) {
    // if we added one, return that one
    if ( paramMap.containsKey( key ) ) {

      /*
       * docs.oracle.com: "If you use this method with a multivalued parameter, the value returned is equal to the first
       * value in the array returned by getParameterValues"
       */
      return paramMap.get( key )[0];
    }
    // otherwise return what's in the original request
    return super.getRequest().getParameter( key );
  }

  // see http://docs.oracle.com/javaee/6/api/javax/servlet/ServletRequest.html#getParameterMap()
  @Override
  @SuppressWarnings( { "rawtypes", "unchecked" } )
  public Map getParameterMap() {

    if ( paramMap.size() == 0 ) {
      return super.getRequest().getParameterMap();

    } else {

      HashMap fullParamMap = new HashMap();
      fullParamMap.putAll( super.getRequest().getParameterMap() );
      fullParamMap.putAll( paramMap );

      return Collections.unmodifiableMap( fullParamMap );
    }
  }

  // see http://docs.oracle.com/javaee/6/api/javax/servlet/ServletRequest.html#getParameterNames()
  @Override
  @SuppressWarnings( { "rawtypes", "unchecked" } )
  public Enumeration getParameterNames() {

    if ( paramMap.size() == 0 ) {
      return super.getRequest().getParameterNames();

    } else {

      // get original keys set
      Set<String> keys = new HashSet<String>( Collections.list( super.getRequest().getParameterNames() ) );

      // add ours
      keys.addAll( paramMap.keySet() );

      return Collections.enumeration( keys );
    }
  }

  // see http://docs.oracle.com/javaee/6/api/javax/servlet/ServletRequest.html#getParameterValues(java.lang.String)
  @Override
  public String[] getParameterValues( String key ) {
    // if we added one, return that one
    if ( paramMap.containsKey( key ) ) {
      return paramMap.get( key );
    }
    // otherwise return what's in the original request
    return super.getRequest().getParameterValues( key );
  }

  public void addParameter( String name, String value ) {
    addParameter( name, new String[] { value } );
  }

  public void addParameter( String name, String[] value ) {
    paramMap.put( name, value );
  }

  public void addParameters( HashMap<String, String[]> params ) {
    paramMap.putAll( params );
  }

}
