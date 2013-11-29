package org.pentaho.cdf.environment.factory;

public interface ICdfBeanFactory {

  public Object getBean( String id );

  public boolean containsBean( String id );

  public String[] getBeanNamesForType( @SuppressWarnings( "rawtypes" ) Class clazz );

}
