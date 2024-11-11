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


package org.pentaho.cdf.storage;

import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.InvalidCdfOperationException;
import org.pentaho.cdf.PluginHibernateException;

/**
 * The interface is not quite useful on runtime.
 * It has been introduced for the purpose of it is to
 * provide ability to mock the StorageEngine in tests.
 * @author Mikhail_Tseu
 *
 */
public interface StorageEngineInterface {
  JSONObject store( String value, String user ) throws JSONException,
                                                       InvalidCdfOperationException,
                                                       PluginHibernateException;

  JSONObject read( String user ) throws JSONException,
                                        InvalidCdfOperationException,
                                        PluginHibernateException;

  JSONObject delete( String user ) throws JSONException,
                                          InvalidCdfOperationException,
                                          PluginHibernateException;
}
