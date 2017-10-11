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

package org.pentaho.cdf.context.autoinclude;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Document;
import org.dom4j.Node;
import org.pentaho.platform.util.xml.dom4j.XmlDom4JHelper;

/**
 * &lt;autoinclude&gt; entry.
 */
class AutoIncludeConfig {

  private static final Log log = LogFactory.getLog( AutoIncludeConfig.class );

  private Node node;
  private Pattern cdaRegex;
  private Pattern dataAccessIdRegex;

  public AutoIncludeConfig( Node autoInclude ) throws PatternSyntaxException {
    node = autoInclude;
    String re = XmlDom4JHelper.getNodeText( "cda", autoInclude, "" );
    cdaRegex = Pattern.compile( re );
    // TODO: not used. ditch?
    re = XmlDom4JHelper.getNodeText( "ids", autoInclude, ".*" );
    dataAccessIdRegex = Pattern.compile( re );
  }

  public Pattern getCdaRegex() {
    return cdaRegex;
  }

  public Pattern getDataAccessIdRegex() {
    return dataAccessIdRegex;
  }

  @SuppressWarnings( "unchecked" )
  public List<Node> getDashboardRules() {
    return node.selectNodes( "dashboards/*" );
  }

  @Override
  public String toString() {
    return node.asXML();
  }

  public static List<AutoIncludeConfig> getAutoIncludeConfigs( Document config ) {
    @SuppressWarnings( "unchecked" )
    List<Node> includes = config.selectNodes( "//autoincludes/autoinclude" );
    List<AutoIncludeConfig> autoIncludeConfigs = new ArrayList<AutoIncludeConfig>();
    for ( Node include : includes ) {
      try {
        autoIncludeConfigs.add( new AutoIncludeConfig( include ) );
        if ( log.isTraceEnabled() ) {
          log.trace( "read:\n " + include.asXML() );
        }
      } catch ( PatternSyntaxException e ) {
        log.error( "Bad regular expression in " + include.asXML() );
      }
    }
    if ( log.isDebugEnabled() ) {
      log.debug( autoIncludeConfigs.size() + " autoinclude entries read." );
    }
    return autoIncludeConfigs;
  }
}
