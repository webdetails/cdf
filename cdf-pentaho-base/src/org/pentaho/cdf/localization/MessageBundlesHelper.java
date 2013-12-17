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

package org.pentaho.cdf.localization;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Locale;

import org.pentaho.cdf.CdfConstants;
import org.pentaho.platform.engine.core.solution.ActionInfo;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.util.messages.LocaleHelper;

/**
 * Created by IntelliJ IDEA. User: sramazzina Date: 7-lug-2010 Time: 11.27.43 To change this template use File |
 * Settings | File Templates.
 */
public class MessageBundlesHelper {

  private String baseUrl;
  private String globalBaseMessageFile;
  private String targetDashboardCacheDir;
  private String targetDashboardBaseMsgFile;
  private String sourceDashboardBaseMsgFile;
  private static final String PENTAHO_CDF_GLOBAL_LANGUAGES_DIR = "pentaho-cdf/resources/languages";
  private static final String PENTAHO_CDF_DIR = "pentaho-cdf/";
  private String languagesCacheUrl;

  public MessageBundlesHelper( String dashboardSolution, String dashboardPath, String dashboardsMessagesBaseFilename ) {
    init( CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME, dashboardSolution, dashboardPath,
        dashboardsMessagesBaseFilename );
  }

  public MessageBundlesHelper( String dashboardSolutionPath, String dashboardsMessagesBaseFilename ) {
    init( CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME, dashboardSolutionPath, dashboardsMessagesBaseFilename );
  }

  public void saveI18NMessageFilesToCache() throws IOException {
    createCacheDirIfNotExists( targetDashboardCacheDir );
    copyStdGlobalMessageFileToCache();
    if ( sourceDashboardBaseMsgFile != null ) {
      appendMessageFiles( sourceDashboardBaseMsgFile, globalBaseMessageFile, targetDashboardBaseMsgFile );
    } else {
      appendMessageFiles( globalBaseMessageFile, targetDashboardBaseMsgFile );
    }
  }

  public String getMessageFilesCacheUrl() {
    return languagesCacheUrl.replace( File.separator, "/" );
  }

  protected void init( String baseGlobalMessageSetFilename, String dashboardSolution, String dashboardPath,
      String dashboardsMessagesBaseFilename ) {

    baseUrl = PentahoSystem.getApplicationContext().getSolutionPath( "" );
    globalBaseMessageFile =
        baseUrl
            + ActionInfo.buildSolutionPath( "system", PENTAHO_CDF_GLOBAL_LANGUAGES_DIR, baseGlobalMessageSetFilename );
    languagesCacheUrl = CdfConstants.BASE_CDF_CACHE_DIR + File.separator + dashboardSolution + dashboardPath;
    targetDashboardCacheDir =
        baseUrl + File.separator + ActionInfo.buildSolutionPath( "system", PENTAHO_CDF_DIR + languagesCacheUrl, "" );
    // Name the dashboard target i18n messages file. If we have a dashboard specific language file it will be named
    // the same otherwise it will have the name of the global message file. The target message file contains globals and
    // local translations
    // (if the dashboard has a specific set of translations) or the name of the global one if no translations are
    // specified.
    // This way we eliminate fake error messages that are given by the unexpected unavailability of message files.
    targetDashboardBaseMsgFile =
        baseUrl
            + File.separator
            + ActionInfo.buildSolutionPath( "system", PENTAHO_CDF_DIR + languagesCacheUrl,
                ( dashboardsMessagesBaseFilename != null ? dashboardsMessagesBaseFilename
                    : baseGlobalMessageSetFilename ) );
    if ( dashboardsMessagesBaseFilename != null )
      sourceDashboardBaseMsgFile =
          baseUrl + File.separator
              + ActionInfo.buildSolutionPath( dashboardSolution, dashboardPath, dashboardsMessagesBaseFilename );
  }

  protected void init( String baseGlobalMessageSetFilename, String dashboardSolutionPath,
      String dashboardsMessagesBaseFilename ) {

    baseUrl = PentahoSystem.getApplicationContext().getSolutionPath( "" );
    globalBaseMessageFile =
        baseUrl
            + ActionInfo.buildSolutionPath( "system", PENTAHO_CDF_GLOBAL_LANGUAGES_DIR, baseGlobalMessageSetFilename );
    languagesCacheUrl = CdfConstants.BASE_CDF_CACHE_DIR + File.separator + dashboardSolutionPath;
    targetDashboardCacheDir =
        baseUrl + File.separator + ActionInfo.buildSolutionPath( "system", PENTAHO_CDF_DIR + languagesCacheUrl, "" );
    // Name the dashboard target i18n messages file. If we have a dashboard specific language file it will be named
    // the same otherwise it will have the name of the global message file. The target message file contains globals and
    // local translations
    // (if the dashboard has a specific set of translations) or the name of the global one if no translations are
    // specified.
    // This way we eliminate fake error messages that are given by the unexpected unavailability of message files.
    targetDashboardBaseMsgFile =
        baseUrl
            + File.separator
            + ActionInfo.buildSolutionPath( "system", PENTAHO_CDF_DIR + languagesCacheUrl,
                ( dashboardsMessagesBaseFilename != null ? dashboardsMessagesBaseFilename
                    : baseGlobalMessageSetFilename ) );
    if ( dashboardsMessagesBaseFilename != null )
      sourceDashboardBaseMsgFile =
          baseUrl + File.separator
              + ActionInfo.buildSolutionPath( "", dashboardSolutionPath, dashboardsMessagesBaseFilename );
  }

  protected void createCacheDirIfNotExists( String targetDashboardCacheDir ) {
    File fBaseMsgTargetDir = new File( targetDashboardCacheDir );
    if ( !fBaseMsgTargetDir.exists() ) {
      fBaseMsgTargetDir.mkdirs();
    }
  }

  protected void appendMessageFiles( String globalBaseMessageFile, String targetDashboardBaseMsgFile )
    throws IOException {
    appendMessageFiles( null, globalBaseMessageFile, targetDashboardBaseMsgFile );
  }

  protected void appendMessageFiles( String sourceDashboardBaseMsgFile, String globalBaseMessageFile,
      String targetDashboardBaseMsgFile ) throws IOException {

    Locale locale = LocaleHelper.getLocale();
    targetDashboardBaseMsgFile = targetDashboardBaseMsgFile + "_" + locale.getLanguage();
    File fBaseMsgGlobal = new File( globalBaseMessageFile + "_" + locale.getLanguage() + ".properties" );
    File fBaseMsgTarget = new File( targetDashboardBaseMsgFile + ".properties" );

    String theLine;
    if ( !fBaseMsgTarget.exists() ) {
      fBaseMsgTarget.createNewFile();
      BufferedWriter bwBaseMsgTarget = new BufferedWriter( new FileWriter( fBaseMsgTarget, true ) );
      // If localized global message file doesn't exists then use the standard base global message file
      // and generate a fake global message file. So this way we're sure that we always have the file
      if ( !fBaseMsgGlobal.exists() )
        fBaseMsgGlobal = new File( globalBaseMessageFile + ".properties" );
      BufferedReader brBaseMsgGlobal = new BufferedReader( new FileReader( fBaseMsgGlobal ) );
      while ( ( theLine = brBaseMsgGlobal.readLine() ) != null ) {
        bwBaseMsgTarget.write( theLine + "\n" );
      }
      brBaseMsgGlobal.close();

      // Append specific message file only if it exists otherwise just use the global message files
      if ( sourceDashboardBaseMsgFile != null ) {
        sourceDashboardBaseMsgFile = sourceDashboardBaseMsgFile + "_" + locale.getLanguage();
        File fBaseMsgDashboard = new File( sourceDashboardBaseMsgFile + ".properties" );
        if ( fBaseMsgDashboard.exists() ) {
          BufferedReader brBaseMsgDashboard = new BufferedReader( new FileReader( fBaseMsgDashboard ) );
          while ( ( theLine = brBaseMsgDashboard.readLine() ) != null ) {
            bwBaseMsgTarget.write( theLine + "\n" );
          }
          brBaseMsgDashboard.close();
        }
      }
      bwBaseMsgTarget.close();
    }
  }

  protected void copyStdGlobalMessageFileToCache() throws IOException {

    String standardGlobalMessageFilename = CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME + ".properties";
    String fromFile =
        baseUrl
            + ActionInfo.buildSolutionPath( "system", PENTAHO_CDF_GLOBAL_LANGUAGES_DIR, standardGlobalMessageFilename );
    String toFile = targetDashboardCacheDir + "/" + standardGlobalMessageFilename;

    File outputFile = new File( toFile );
    if ( outputFile.exists() )
      return;
    outputFile.createNewFile();

    File inputFile = new File( fromFile );

    FileReader in = new FileReader( inputFile );
    FileWriter out = new FileWriter( outputFile );
    int c;

    while ( ( c = in.read() ) != -1 )
      out.write( c );

    in.close();
    out.close();

  }
}
