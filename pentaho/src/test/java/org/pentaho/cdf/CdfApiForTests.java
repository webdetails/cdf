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

package org.pentaho.cdf;

import org.json.JSONException;

public class CdfApiForTests extends CdfApi {
  @Override
  protected String writeJSONSolution(
    String path,
    int depth,
    boolean showHiddenFiles,
    String mode ) throws JSONException {
    return null;
  }
}
