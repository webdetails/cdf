package org.pentaho.cdf.environment.broker;

import java.util.List;

import org.json.JSONObject;

public interface ICdfInterPluginBroker {

  public void addCdaQueries( JSONObject queries, String cdaPath );
  
  public List<String> listCdaQueries( String cda );

  public String executeCdaQuery( String path, String id );
}
