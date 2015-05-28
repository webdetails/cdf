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

package org.pentaho.cdf.context.autoinclude;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Document;
import org.dom4j.Node;
import org.pentaho.cdf.CdfConstants;
import org.pentaho.cdf.environment.CdfEngine;

import pt.webdetails.cpf.Util;
import pt.webdetails.cpf.repository.api.IBasicFile;
import pt.webdetails.cpf.repository.api.IBasicFileFilter;
import pt.webdetails.cpf.repository.api.IReadAccess;
import pt.webdetails.cpf.repository.util.RepositoryHelper;

/**
 * AutoIncludes add cda query results to dashboard context.<br>
 * Each instance refers to a matched cda file.<br> 
 * Full documentation for the functionality in 
 * plugin-samples/pentaho-cdf/30-documentation/40-advanced/autoincludes
 **/
public class AutoInclude {

  private static final Log log = LogFactory.getLog( AutoInclude.class );

  private static String pluginIncludesDir;
  private String cdaFile;
  private Matcher cdaMatcher;
  private List<DashboardMatchRule> dashboardRules;

  public AutoInclude() {
  }

  private static String getPluginIncludesDir() {
    if ( pluginIncludesDir == null ) {
      pluginIncludesDir = CdfEngine.getEnvironment().getCdfPluginRepositoryDir() + CdfConstants.INCLUDES_DIR;
    }
    return pluginIncludesDir;
  }

  /**
   * 
   * @param cdaPath
   * @param cdaMatcher
   * @param dashboardRuleNodes
   */
  public AutoInclude( String cdaPath, Matcher cdaMatcher, List<Node> dashboardRuleNodes ) {
    this();

    this.cdaFile = cdaPath;
    this.dashboardRules = new ArrayList<DashboardMatchRule>();
    this.cdaMatcher = cdaMatcher;
    for ( Node node : dashboardRuleNodes ) {
      try {
        DashboardMatchRule rule = new DashboardMatchRule( this.cdaMatcher, node );
        this.dashboardRules.add( rule );
      } catch ( Exception e ) {
        log.error( e );
      }
    }
  }

  public boolean canInclude( String dashboardPath ) {
    boolean canInclude = false;
    // each rule overrides the previous one
    for ( DashboardMatchRule rule : dashboardRules ) {
      canInclude = rule.canInclude( dashboardPath, canInclude );
    }
    if ( log.isDebugEnabled() && canInclude ) {
      log.debug( cdaFile + " to be included in " + dashboardPath );
    }
    return canInclude;
  }

  public String getCdaPath() {
    return cdaFile;
  }

  @Override
  public String toString() {
    return cdaFile
        + ( ( dashboardRules != null )
            ? ( " [" + StringUtils.join( dashboardRules.iterator(), ", " ) + "]" )
            : ( "[]" ) );
  }

  public static List<AutoInclude> buildAutoIncludeList( Document config, IReadAccess cdaRoot ) {
    long start = System.currentTimeMillis();
    List<AutoIncludeConfig> autoIncludeConfigs = AutoIncludeConfig.getAutoIncludeConfigs( config );
    // find cda files matching
    List<Pattern> cdaRegexList = new ArrayList<Pattern>();
    for ( AutoIncludeConfig autoInc : autoIncludeConfigs ) {
      cdaRegexList.add( autoInc.getCdaRegex() );
    }
    List<IBasicFile> cdaFiles = getCdaFiles( cdaRegexList, cdaRoot );
    List<String> cdaPaths = new ArrayList<String>();
    for ( IBasicFile cda : cdaFiles ) {
      cdaPaths.add( cda.getPath() );
    }
    if ( log.isDebugEnabled() ) {
      log.debug( String.format( "%d cda files from %d rules", cdaPaths.size(), cdaRegexList.size() ) );
    }
    // create auto-includes
    List<AutoInclude> result = new ArrayList<AutoInclude>();
    for ( AutoIncludeConfig aiConfig : autoIncludeConfigs ) {
      result.addAll( processAutoIncludes( aiConfig, cdaPaths ) );
    }
    if ( log.isDebugEnabled() ) {
      log.debug( String.format( "AutoInclude list(%d) built in %s", result.size(), Util.getElapsedSeconds( start ) ) );
      log.trace( "AutoInclude list: \n\t" + StringUtils.join( result.iterator(), "\n\t" ) );
    }
    return result;
  }

  private static List<IBasicFile> getCdaFiles( final List<Pattern> cdaPathRegexes, IReadAccess cdaRoot ) {
    IBasicFileFilter cdaFilter = new IBasicFileFilter() {
      @Override
      public boolean accept( IBasicFile file ) {
        for ( Pattern regex : cdaPathRegexes ) {
          if ( regex.matcher( RepositoryHelper.joinPaths( getPluginIncludesDir(), file.getPath() ) ).matches() ) {
            return true;
          }
        }
        return false;
      }
    };
    long start = System.currentTimeMillis();
    List<IBasicFile> cdaFiles =
        cdaRoot.listFiles( null, cdaFilter, IReadAccess.DEPTH_ALL, false );
    if ( log.isDebugEnabled() ) {
      log.debug( String.format( "%d matching cda files found (%s)", cdaFiles.size(), Util.getElapsedSeconds( start ) ) );
    }
    return cdaFiles;
  }

  private static List<AutoInclude> processAutoIncludes( AutoIncludeConfig config, List<String> cdaPaths ) {
    List<AutoInclude> autoIncludes = new ArrayList<AutoInclude>();
    for ( String cdaPath : cdaPaths ) {
      cdaPath = RepositoryHelper.joinPaths( getPluginIncludesDir(), cdaPath );
      Matcher matcher = config.getCdaRegex().matcher( cdaPath );
      if ( matcher.matches() ) {
        AutoInclude include = new AutoInclude( cdaPath, matcher, config.getDashboardRules() );
        autoIncludes.add( include );
      }
    }
    return autoIncludes;
  }

}
