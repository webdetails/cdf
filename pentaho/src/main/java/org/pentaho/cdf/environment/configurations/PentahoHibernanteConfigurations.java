/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/


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
