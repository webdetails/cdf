package org.pentaho.cdf.environment.packager;

import java.util.List;

public interface ICdfHeadersProvider {
  
  public String getHeaders( String dashboardType, boolean isDebugMode, List<String> componentTypes );
  
  public String getHeaders( String dashboardType, boolean isDebugMode, String absRoot, List<String> componentTypes );
  
}
