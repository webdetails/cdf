/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


package org.pentaho.cdf.environment.broker;

import java.util.List;

import org.json.JSONObject;

public interface ICdfInterPluginBroker {

  public void addCdaQueries( JSONObject queries, String cdaPath );

  public List<String> listCdaQueries( String cda );

  public String executeCdaQuery( String path, String id );
}
