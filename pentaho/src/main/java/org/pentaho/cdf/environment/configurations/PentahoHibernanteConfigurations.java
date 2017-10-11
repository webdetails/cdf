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

package org.pentaho.cdf.environment.configurations;

import org.hibernate.cfg.Configuration;
import org.pentaho.cdf.CdfConstants;
import org.pentaho.cdf.environment.CdfEngine;
import org.pentaho.platform.repository.hibernate.HibernateUtil;

import pt.webdetails.cpf.repository.api.IBasicFile;

public class PentahoHibernanteConfigurations implements IHibernateConfigurations {

  public static final String COMMENTS_HBM_FILE = "Comments.hbm.xml";
  public static final String STORAGE_HBM_FILE = "Storage.hbm.xml";

  @Override
  public Configuration getConfiguration() {
    return HibernateUtil.getConfiguration();
  }

  @Override
  public IBasicFile getCommentsConfigurationFile() {
    return CdfEngine.getPluginSystemReader( CdfConstants.PLUGIN_HIBERNATE_DIR ).fetchFile( COMMENTS_HBM_FILE );
  }

  @Override
  public IBasicFile getStorageConfigurationFile() {
    return CdfEngine.getPluginSystemReader( CdfConstants.PLUGIN_HIBERNATE_DIR ).fetchFile( STORAGE_HBM_FILE );
  }

}
