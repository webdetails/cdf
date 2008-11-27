/*
 * Copyright 2006 Pentaho Corporation.  All rights reserved.
 * This software was developed by Pentaho Corporation and is provided under the terms
 * of the Mozilla Public License, Version 1.1, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://www.mozilla.org/MPL/MPL-1.1.txt. The Original Code is the Pentaho
 * BI Platform.  The Initial Developer is Pentaho Corporation.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 *
 * Created Feb 13, 2006
 * @author wseyler
 */

package org.pentaho.plugin.jfreechart;

import org.jfree.chart.imagemap.StandardURLTagFragmentGenerator;
import org.jfree.data.general.Dataset;
import org.pentaho.core.system.PentahoSystem;
import org.pentaho.core.util.TemplateUtil;
import org.pentaho.commons.connection.IPentahoResultSet;
import org.jfree.data.time.TimeSeriesCollection;

public class PentahoChartURLTagFragmentGenerator extends StandardURLTagFragmentGenerator {
  private static final String SERIES_TAG = "series="; //$NON-NLS-1$

  private static final String CATEGORY_TAG = "category="; //$NON-NLS-1$

  String urlFragment;

  Dataset dataset;

  String parameterName;

  String outerParameterName;

  String urlTarget;

  boolean useBaseUrl;
  
  IPentahoResultSet data;

  public PentahoChartURLTagFragmentGenerator(String urlFragment, Dataset dataset, String parameterName,
      String outerParameterName) {
    super();

    this.urlFragment = urlFragment;
    this.dataset = dataset;
    this.parameterName = parameterName;
    this.outerParameterName = outerParameterName;
    this.urlTarget = "pentaho_popup";//$NON-NLS-1$ 
    this.useBaseUrl = true;
  }

  public PentahoChartURLTagFragmentGenerator(IPentahoResultSet data,String urlFragment, String urlTarget, boolean useBaseUrl, Dataset dataset,
      String parameterName, String outerParameterName) {
    super();
    this.urlFragment = urlFragment;
    this.dataset = dataset;
    this.parameterName = parameterName;
    this.outerParameterName = outerParameterName;
    this.urlTarget = urlTarget;
    this.useBaseUrl = useBaseUrl;
    this.data = data;
    if(dataset instanceof TimeTableXYDatasetChartDefinition)
    	this.data.beforeFirst();
  }

  public PentahoChartURLTagFragmentGenerator(String urlTemplate, Dataset dataDefinition, String paramName) {
    this(urlTemplate, dataDefinition, paramName, ""); //$NON-NLS-1$
  }

  public String generateURLFragment(String urlText) {
    if (urlFragment != null) {

      String urlTemplate = " href=\""; //$NON-NLS-1$

      // do not add ase URL if script
      boolean isScript = urlFragment.startsWith("javascript:"); //$NON-NLS-1$ 

      // If isScript is true, ignore useBaseURL parameter...
      if (!isScript) {
        if (useBaseUrl) {
          urlTemplate += PentahoSystem.getApplicationContext().getBaseUrl();

        }
      }

      urlTemplate += urlFragment + "\""; //$NON-NLS-1$

      int startIdx;
      if (urlText.indexOf(CATEGORY_TAG) != -1)
        startIdx = urlText.indexOf(CATEGORY_TAG) + CATEGORY_TAG.length();
      else
        startIdx = 0;

      int endIdx;
      if (urlText.indexOf('&', startIdx) != -1)
        endIdx = urlText.indexOf('&', startIdx);
      else
        endIdx = urlText.length();

      String value = urlText.substring(startIdx, endIdx).trim();
      urlTemplate = TemplateUtil.applyTemplate(urlTemplate, parameterName, value);

      if (dataset instanceof CategoryDatasetChartDefinition || dataset instanceof XYZSeriesCollectionChartDefinition) {

        if (urlText.indexOf(SERIES_TAG) != -1)
          startIdx = urlText.indexOf(SERIES_TAG) + SERIES_TAG.length();
        else
          startIdx = 0;

        if (urlText.indexOf('&', startIdx) != -1)
          endIdx = urlText.indexOf('&', startIdx);
        else
          endIdx = urlText.length();

        value = urlText.substring(startIdx, endIdx).trim();
        urlTemplate = TemplateUtil.applyTemplate(urlTemplate, outerParameterName, value);

      }
      
      if(dataset instanceof TimeSeriesCollection || dataset instanceof TimeTableXYDatasetChartDefinition) {
    	  Object[] rowData = data.next();
    	  String seriesName = (String) rowData[0];
    	  value = seriesName;
    	  if(dataset instanceof TimeSeriesCollection || urlTemplate.indexOf("index.html") == -1)
    		  urlTemplate = TemplateUtil.applyTemplate(urlTemplate, outerParameterName, value);
    	  else{	
    		  urlTemplate = urlTemplate.substring(0,urlTemplate.indexOf("index.html")) + "{PARAMETER}')\"";
    		  urlTemplate = TemplateUtil.applyTemplate(urlTemplate, "PARAMETER", value);
    	  }
      }

      if (!isScript) {
        urlTemplate = urlTemplate + " target=\"" + urlTarget + "\""; //$NON-NLS-1$//$NON-NLS-2$ 
      }

      return urlTemplate;

    } else {
      return super.generateURLFragment(urlText);
    }
  }
}
