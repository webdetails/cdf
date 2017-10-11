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

package org.pentaho.cdf.storage;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.security.SecurityHelper;

/**
 * The Storage REST API allows client to specify user in request parameters
 * The class encapsulates the logic how to handle such impersonation request
 * @author Mikhail_Tseu
 * */
class ImpersonationHandler {
  private static final Log logger = LogFactory.getLog( ImpersonationHandler.class );

  static class CdfStorageApiImpersonationException extends Exception {
    private static final long serialVersionUID = 1L;

    public CdfStorageApiImpersonationException() {
      super();
    }

    public CdfStorageApiImpersonationException( String msg ) {
      super( msg );
    }

    public CdfStorageApiImpersonationException( String msg, Throwable cause ) {
      super( msg, cause );
    }
  }

  static String getUserName( String impersonat ) throws CdfStorageApiImpersonationException {
    IPentahoSession session = PentahoSessionHolder.getSession();
    // obtain currently logged in user
    if ( session != null ) {
      String sessUser = session.getName();

      if ( StringUtils.isEmpty( impersonat ) ) {
        return sessUser;
      }

      if ( sessUser.equals( impersonat ) ) {
        // if there is no actual impersonation requested
        // it's ok to move on with the specified user
        return impersonat;
      } else {
        // check if currently logged in user has Admin privileges
        boolean isAdmin = SecurityHelper.getInstance().isPentahoAdministrator( session );
        if ( isAdmin ) {
          // Admin has the ability to work on behalf of other user
          if ( logger.isWarnEnabled() ) {
            logger.warn( "User " + sessUser + " has been impersonated as " + impersonat );
          }
          return impersonat;
        } else {
          // otherwise currently logged in user will be used
          // regardless of what impersonated one was requested
          if ( logger.isErrorEnabled() ) {
            logger.error( "User " + sessUser + " has been denied to be impersonated as " + impersonat
                + " - no Admin permission." );
          }
          return sessUser;
        }
      }
    }

    if ( logger.isErrorEnabled() ) {
      logger.error( "Impersanation as user " + impersonat + " has been denied. No session" );
    }
    throw new CdfStorageApiImpersonationException();
  }
}
