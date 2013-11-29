package org.pentaho.cdf.environment.packager;

public interface ICdfHeadersProvider {
  
  public String getHeaders( String dashboardType, boolean isDebugMode, boolean includeExtra );
  
  public String getHeaders( String dashboardType, boolean isDebugMode, String absRoot, boolean includeExtra );
  
}
