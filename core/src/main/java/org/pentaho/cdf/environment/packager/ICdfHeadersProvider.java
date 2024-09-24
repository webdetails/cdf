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

package org.pentaho.cdf.environment.packager;

import java.util.List;

public interface ICdfHeadersProvider {

  public String getHeaders( String dashboardType, boolean isDebugMode, List<String> componentTypes );

  public String getHeaders( String dashboardType, boolean isDebugMode, String absRoot, List<String> componentTypes );
}
