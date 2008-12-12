/*
 * This program is free software; you can redistribute it and/or modify it under the 
 * terms of the GNU General Public License, version 2 as published by the Free Software 
 * Foundation.
 *
 * You should have received a copy of the GNU General Public License along with this 
 * program; if not, you can obtain a copy at http://www.gnu.org/licenses/gpl-2.0.html 
 * or from the Free Software Foundation, Inc., 
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 *
 * Copyright 2006 - 2008 Pentaho Corporation.  All rights reserved. 
 * 
 * Created Feb 13, 2006
 * @author wseyler
 */

package org.pentaho.platform.uifoundation.chart;

import org.jfree.chart.imagemap.StandardURLTagFragmentGenerator;
import org.jfree.data.general.Dataset;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.engine.services.runtime.TemplateUtil;
import org.jfree.data.time.TimeSeriesCollection;
import org.pentaho.commons.connection.IPentahoResultSet;

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

  public PentahoChartURLTagFragmentGenerator(final String urlFragment, final Dataset dataset,
      final String parameterName, final String outerParameterName) {
    super();

    this.urlFragment = urlFragment;
    this.dataset = dataset;
    this.parameterName = parameterName;
    this.outerParameterName = outerParameterName;
    this.urlTarget = "pentaho_popup";//$NON-NLS-1$ 
    this.useBaseUrl = true;
  }

  public PentahoChartURLTagFragmentGenerator(IPentahoResultSet data,final String urlFragment, final String urlTarget,
      final boolean useBaseUrl, final Dataset dataset, final String parameterName, final String outerParameterName) {
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

  public PentahoChartURLTagFragmentGenerator(final String urlTemplate, final Dataset dataDefinition,
      final String paramName) {
    this(urlTemplate, dataDefinition, paramName, ""); //$NON-NLS-1$
  }

  @Override
  public String generateURLFragment(final String urlText) {
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

      // Handle " in the urlFragment
      urlTemplate += urlFragment.replaceAll("\"", "%22") + "\""; //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ 

      int startIdx;
      if (urlText.indexOf(PentahoChartURLTagFragmentGenerator.CATEGORY_TAG) != -1) {
        startIdx = urlText.indexOf(PentahoChartURLTagFragmentGenerator.CATEGORY_TAG)
            + PentahoChartURLTagFragmentGenerator.CATEGORY_TAG.length();
      } else {
        startIdx = 0;
      }

      int endIdx;
      if (urlText.indexOf('&', startIdx) != -1) {
        endIdx = urlText.indexOf('&', startIdx);
      } else {
        endIdx = urlText.length();
      }

      String value = urlText.substring(startIdx, endIdx).trim();
      urlTemplate = TemplateUtil.applyTemplate(urlTemplate, parameterName, value);

      if ((dataset instanceof CategoryDatasetChartDefinition)
          || (dataset instanceof XYZSeriesCollectionChartDefinition)) {

        if (urlText.indexOf(PentahoChartURLTagFragmentGenerator.SERIES_TAG) != -1) {
          startIdx = urlText.indexOf(PentahoChartURLTagFragmentGenerator.SERIES_TAG)
              + PentahoChartURLTagFragmentGenerator.SERIES_TAG.length();
        } else {
          startIdx = 0;
        }

        if (urlText.indexOf('&', startIdx) != -1) {
          endIdx = urlText.indexOf('&', startIdx);
        } else {
          endIdx = urlText.length();
        }

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
