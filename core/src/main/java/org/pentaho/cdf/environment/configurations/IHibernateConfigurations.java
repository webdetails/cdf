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

import pt.webdetails.cpf.repository.api.IBasicFile;

public interface IHibernateConfigurations {

  public Configuration getConfiguration();

  public IBasicFile getStorageConfigurationFile();

  public IBasicFile getCommentsConfigurationFile();
}
