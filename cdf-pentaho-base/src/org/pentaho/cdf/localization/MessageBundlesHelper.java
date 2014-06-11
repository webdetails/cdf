/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
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

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang.StringUtils;
import org.pentaho.cdf.CdfConstants;
import org.pentaho.cdf.environment.CdfEngine;
import pt.webdetails.cpf.Util;
import pt.webdetails.cpf.repository.api.IBasicFile;
import pt.webdetails.cpf.repository.api.IRWAccess;
import pt.webdetails.cpf.repository.api.IReadAccess;
import pt.webdetails.cpf.repository.api.IUserContentAccess;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

public class MessageBundlesHelper {

  private String globalBaseMessageFile;
  private String targetDashboardCacheDir;
  private String targetDashboardBaseMsgFile;
  private String sourceDashboardBaseMsgFile;
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
    return FilenameUtils.separatorsToUnix( languagesCacheUrl );
  }

  protected void init( String baseGlobalMessageSetFilename, String dashboardSolution, String dashboardPath,
                       String dashboardsMessagesBaseFilename ) {

    globalBaseMessageFile = Util.joinPath( CdfConstants.BASE_GLOBAL_MESSAGE_SET_URL, baseGlobalMessageSetFilename );
    languagesCacheUrl = Util.joinPath( CdfConstants.BASE_CDF_CACHE_DIR, dashboardSolution + dashboardPath );
    targetDashboardCacheDir = getMessageFilesCacheUrl();
    // Name the dashboard target i18n messages file. If we have a dashboard specific language file it will be named
    // the same otherwise it will have the name of the global message file. The target message file contains globals and
    // local translations
    // (if the dashboard has a specific set of translations) or the name of the global one if no translations are
    // specified.
    // This way we eliminate fake error messages that are given by the unexpected unavailability of message files.
    targetDashboardBaseMsgFile = Util.joinPath( languagesCacheUrl,
      ( dashboardsMessagesBaseFilename != null ? dashboardsMessagesBaseFilename : baseGlobalMessageSetFilename ) );
    if ( !StringUtils.isEmpty( dashboardsMessagesBaseFilename ) ) {
      sourceDashboardBaseMsgFile = Util.joinPath( dashboardSolution, dashboardPath, dashboardsMessagesBaseFilename );
    }
  }

  protected void init( String baseGlobalMessageSetFilename, String dashboardSolutionPath,
                       String dashboardsMessagesBaseFilename ) {

    globalBaseMessageFile = Util.joinPath( CdfConstants.BASE_GLOBAL_MESSAGE_SET_URL, baseGlobalMessageSetFilename );
    languagesCacheUrl = Util.joinPath( CdfConstants.BASE_CDF_CACHE_DIR, dashboardSolutionPath );
    targetDashboardCacheDir = getMessageFilesCacheUrl();
    // Name the dashboard target i18n messages file. If we have a dashboard specific language file it will be named
    // the same otherwise it will have the name of the global message file. The target message file contains globals and
    // local translations
    // (if the dashboard has a specific set of translations) or the name of the global one if no translations are
    // specified.
    // This way we eliminate fake error messages that are given by the unexpected unavailability of message files.
    targetDashboardBaseMsgFile =
      Util.joinPath( languagesCacheUrl, ( dashboardsMessagesBaseFilename != null ? dashboardsMessagesBaseFilename
        : baseGlobalMessageSetFilename ) );
    if ( !StringUtils.isEmpty( dashboardsMessagesBaseFilename ) ) {
      sourceDashboardBaseMsgFile = Util.joinPath( dashboardSolutionPath, dashboardsMessagesBaseFilename );
    }
  }

  protected void createCacheDirIfNotExists( String targetDashboardCacheDir ) {
    if ( !getSystemReader().fileExists( targetDashboardCacheDir ) ) {
      getSystemWriter().createFolder( targetDashboardCacheDir );
    }
  }

  protected void appendMessageFiles( String globalBaseMessageFile, String targetDashboardBaseMsgFile )
    throws IOException {
    appendMessageFiles( null, globalBaseMessageFile, targetDashboardBaseMsgFile );
  }

  protected void appendMessageFiles( String sourceDashboardBaseMsgFile, String globalBaseMessageFile,
                                     String targetDashboardBaseMsgFile ) throws IOException {

    String localeSuffix = "_" + CdfEngine.getEnvironment().getLocale().getLanguage();

    targetDashboardBaseMsgFile = !targetDashboardBaseMsgFile.endsWith( localeSuffix ) ?
      targetDashboardBaseMsgFile + localeSuffix : targetDashboardBaseMsgFile;
    IBasicFile fBaseMsgGlobal = getSystemReader().fetchFile(
      globalBaseMessageFile + "_" + CdfEngine.getEnvironment().getLocale().getLanguage() + ".properties" );

    String theLine;
    if ( !getSystemReader().fileExists( targetDashboardBaseMsgFile + ".properties" ) ) {

      File tempMessageFile = null;
      String locale = CdfEngine.getEnvironment().getLocale().getLanguage();

      try {

        // we append the content of global and base message files here,
        // then we write the end result to targetDashboardBaseMsgFile
        String tempMessageFileName = "tempMessageFile_" + System.currentTimeMillis();
        tempMessageFile = new File( tempMessageFileName );
        BufferedWriter bwTempBaseMsgTarget = new BufferedWriter( new FileWriter( tempMessageFile, true ) );

        // If localized global message file doesn't exists then use the standard base global message file
        // and generate a fake global message file. So this way we're sure that we always have the file
        String globalBaseMessageFileName = globalBaseMessageFile + "_" + locale + ".properties";

        if ( !getSystemReader().fileExists( globalBaseMessageFileName ) ) {

          InputStream content = new ByteArrayInputStream( StringUtils.EMPTY.getBytes() );

          if( getSystemReader().fileExists( globalBaseMessageFile + ".properties" ) ){
            content = getSystemReader().fetchFile( globalBaseMessageFile + ".properties" ).getContents();
          }

          getSystemWriter().saveFile( globalBaseMessageFileName, content );
          fBaseMsgGlobal = getSystemReader().fetchFile( globalBaseMessageFileName );
        }

        BufferedReader brBaseMsgGlobal = new BufferedReader( new InputStreamReader( fBaseMsgGlobal.getContents() ) );
        while ( ( theLine = brBaseMsgGlobal.readLine() ) != null ) {
          bwTempBaseMsgTarget.write( theLine + "\n" );
        }
        brBaseMsgGlobal.close();

        // Append specific message file only if it exists otherwise just use the global message files
        if ( !StringUtils.isEmpty( sourceDashboardBaseMsgFile ) ) {

          IBasicFile msgFile = null;

          if ( getUserContentReader().fileExists( sourceDashboardBaseMsgFile + "_" + locale + ".properties" ) ) {

            // a local Messages_<locale>.properties exists
            msgFile = getUserContentReader().fetchFile( sourceDashboardBaseMsgFile + "_" + locale + ".properties" );

          } else if( getUserContentReader().fileExists( sourceDashboardBaseMsgFile + ".properties" ) ) {

            // a local Messages_<locale>.properties does not exist, but a local Messages.properties does
            msgFile = getUserContentReader().fetchFile( sourceDashboardBaseMsgFile + ".properties" );
          }

          if( msgFile != null && msgFile.getContents() != null ){
            BufferedReader brBaseMsgDashboard = new BufferedReader( new InputStreamReader( msgFile.getContents() ) );
            while ( ( theLine = brBaseMsgDashboard.readLine() ) != null ) {
              bwTempBaseMsgTarget.write( theLine + "\n" );
            }
            brBaseMsgDashboard.close();
          }
        }
        bwTempBaseMsgTarget.close();

        getSystemWriter()
          .saveFile( targetDashboardBaseMsgFile + ".properties", new FileInputStream( tempMessageFile ) );

      } finally {

        if ( tempMessageFile != null && tempMessageFile.exists() ) {
          tempMessageFile.delete();
        }
      }
    }
  }

  protected void copyStdGlobalMessageFileToCache() throws IOException {

    String standardGlobalMessageFilename = CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME + ".properties";

    String standardGlobalMessageFilenamePath = Util.joinPath( CdfConstants.BASE_GLOBAL_MESSAGE_SET_URL,
      standardGlobalMessageFilename );

    // failsafe: if somehow Message.properties does not exist at
    // CdfConstants.BASE_GLOBAL_MESSAGE_SET_URL, create it blank
    if ( !getSystemReader().fileExists( standardGlobalMessageFilenamePath ) ) {
      getSystemWriter().saveFile( standardGlobalMessageFilenamePath, new ByteArrayInputStream( "".getBytes() ) );
    }

    IBasicFile fromFile = getSystemReader().fetchFile( standardGlobalMessageFilenamePath );
    String toFile = Util.joinPath( targetDashboardCacheDir, standardGlobalMessageFilename );

    if ( getSystemWriter().fileExists( toFile ) ) {
      return;
    }

    getSystemWriter().saveFile( toFile, fromFile.getContents() );
  }

  private IReadAccess getSystemReader() {
    return CdfEngine.getPluginSystemReader( null );
  }

  private IRWAccess getSystemWriter() {
    return CdfEngine.getEnvironment().getContentAccessFactory().getPluginSystemWriter( null );
  }

  private IUserContentAccess getUserContentReader() {
    return CdfEngine.getUserContentReader( null );
  }
}
