/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

package org.pentaho.cdf.export;

import java.io.IOException;
import java.io.OutputStream;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.Messages;
import org.pentaho.platform.engine.core.system.PentahoBase;
import org.pentaho.platform.web.http.HttpOutputHandler;

@SuppressWarnings("serial")
public abstract class Export extends PentahoBase implements IExport
{

  protected static final Log logger = LogFactory.getLog(Export.class);
  protected HttpOutputHandler httpHandler = null;
  protected OutputStream outputStream = null;

  public Export(final OutputStream out) throws IOException
  {
    this.outputStream = out;
  }

  ;

  public Log getLogger()
  {
    return logger;
  }

  public void exportFile(JSONObject resultSet)
  {


    try
    {

      JSONArray metaData = resultSet.getJSONArray("metadata");
      JSONArray values = resultSet.getJSONArray("values");

      String[][] results = new String[1][1];
      results[0][0] = "No results Returned";

      int nCols = 0, nRows = 0;
      if (metaData.length() > 0 && (nRows = values.length()) > 0 && values.length() > 0 && (nCols = values.getJSONArray(0).length()) > 0)
      {

        results = new String[nRows + 1][nCols + 1];
        results[0][0] = "";
        for (int i = 0; i < metaData.length(); i++)
        {
          results[0][i + 1] = metaData.getString(i);
        }
        for (int i = 0; i < nRows; i++)
        {
          JSONArray row = values.getJSONArray(i);
          for (int j = 0; j < nCols; j++)
          {
            results[i + 1][j] = row.getString(j);
          }
        }
      }

      export(results);

    }
    catch (JSONException e)
    {
      logger.error(Messages.getErrorString("CdfExpor.ERROR_0001_PARSING_RESULTS"));
    }
  }

  public boolean isDouble(String obj)
  {
    try
    {
      Double.parseDouble(obj);
    }
    catch (NumberFormatException e)
    {
      return false;
    }
    return true;
  }
}
