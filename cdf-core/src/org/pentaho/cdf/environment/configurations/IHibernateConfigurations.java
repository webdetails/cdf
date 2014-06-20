package org.pentaho.cdf.environment.configurations;

import org.hibernate.cfg.Configuration;

import pt.webdetails.cpf.repository.api.IBasicFile;

public interface IHibernateConfigurations {

  public Configuration getConfiguration();

  public IBasicFile getStorageConfigurationFile();

  public IBasicFile getCommentsConfigurationFile();
  
}
