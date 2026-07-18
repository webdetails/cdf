/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 - 2026 by Pentaho Canada Inc. : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2030-06-15
 ******************************************************************************/



package org.pentaho.cdf.environment.packager;

import java.util.List;

public interface ICdfHeadersProvider {

  public String getHeaders( String dashboardType, boolean isDebugMode, List<String> componentTypes );

  public String getHeaders( String dashboardType, boolean isDebugMode, String absRoot, List<String> componentTypes );
}
