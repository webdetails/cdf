/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

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
