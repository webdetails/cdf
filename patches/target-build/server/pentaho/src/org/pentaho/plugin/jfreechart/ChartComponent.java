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
 * @created Nov 17, 2005 
 * @author William Seyler
 */
package org.pentaho.plugin.jfreechart;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Element;
import org.dom4j.Node;
import org.jfree.chart.ChartRenderingInfo;
import org.jfree.chart.ChartUtilities;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.entity.StandardEntityCollection;
import org.jfree.chart.imagemap.ImageMapUtilities;
import org.jfree.chart.imagemap.StandardToolTipTagFragmentGenerator;
import org.jfree.data.general.Dataset;
import org.pentaho.commons.connection.IPentahoResultSet;
import org.pentaho.core.repository.IContentItem;
import org.pentaho.core.solution.IActionResource;
import org.pentaho.core.system.PentahoSystem;
import org.pentaho.core.util.XmlHelper;
import org.pentaho.messages.Messages;
import org.pentaho.plugin.ComponentBase;

public class ChartComponent extends ComponentBase {
  private static final long serialVersionUID = 9050456842938084174L;

  private static final String CHART_NAME_PROP = "chart-name"; //$NON-NLS-1$

  private static final String CHART_OUTPUT = "chart-object"; //$NON-NLS-1$

  private static final String CHART_TYPE = "CHART-OBJECT"; //$NON-NLS-1$

  private static final String CHART_DATA_PROP = "chart-data"; //$NON-NLS-1$

  // Root xml tag for chart attributes when chart is generated via an action sequence
  private static final String CHART_ATTRIBUTES_PROP = "chart-attributes"; //$NON-NLS-1$

  // This member added for compatibility to dashboard chart definitions 
  // Root xml tag for chart attributes when chart is generated via a dashboard
  private static final String ALTERNATIVE_CHART_ATTRIBUTES_PROP = "chart"; //$NON-NLS-1$

  private static final String BY_ROW_PROP = "by-row"; //$NON-NLS-1$

  private static final String URL_TEMPLATE = "url-template"; //$NON-NLS-1$

  private static final String PARAMETER_NAME = "paramName"; //$NON-NLS-1$

  private static final String OUTER_PARAMETER_NAME = "series-name"; //$NON-NLS-1$

  private static final String OUTPUT_TYPE_PROP = "output-type"; //$NON-NLS-1$

  private static final String CHART_FILE_NAME_OUTPUT = "chart-filename"; //$NON-NLS-1$

  private static final String HTML_MAPPING_OUTPUT = "chart-mapping"; //$NON-NLS-1$

  private static final String HTML_MAPPING_HTML = "chart-map-html"; //$NON-NLS-1$

  private static final String BASE_URL_OUTPUT = "base-url"; //$NON-NLS-1$

  private static final String HTML_IMG_TAG = "image-tag"; //$NON-NLS-1$

  private static final String SVG_TYPE = "SVG"; //$NON-NLS-1$

  private static final String PNG_BYTES_TYPE = "png-bytes"; //$NON-NLS-1$

  private static final String TEMP_DIRECTORY = "system/tmp/"; //$NON-NLS-1$

  private static final String FILENAME_PREFIX = "tmp_chart_"; //$NON-NLS-1$

  private static final String USE_BASE_URL_TAG = "use-base-url"; //$NON-NLS-1$

  private static final String URL_TARGET_TAG = "url-target"; //$NON-NLS-1$

  private static final String PNG_EXTENSION = ".png"; //$NON-NLS-1$

  private static final String SVG_EXTENSION = ".svg"; //$NON-NLS-1$

  private static final String MAP_EXTENSION = ".map"; //$NON-NLS-1$

  private static final int FILE_NAME = 0;

  private static final int MAP_NAME = 1;

  public static final String FOREGROUND_ALPHA = "foreground-alpha"; //$NON-NLS-1$

  public static final String BACKGROUND_ALPHA = "background-alpha"; //$NON-NLS-1$
  
  public Log getLogger() {
    return LogFactory.getLog(ChartComponent.class);
  }

  protected boolean validateSystemSettings() {
    // This component does not have any system settings to validate
    return true;
  }

  protected boolean validateAction() {
    // See if we have chart data
    if (!isDefinedInput(CHART_DATA_PROP)) {
      inputMissingError(CHART_DATA_PROP);
      return false;
    }
    // See if we have chart attributes
    if (!isDefinedInput(CHART_ATTRIBUTES_PROP)) {
      if (!isDefinedResource(CHART_ATTRIBUTES_PROP)) {
        inputMissingError(CHART_ATTRIBUTES_PROP);
        return false;
      }
    }

    // Anything else should be optional
    return true;
  }

  public void done() {
  }

  protected boolean executeAction() {
    int height = -1;
    int width = -1;
    String title = "";//$NON-NLS-1$ 

    IPentahoResultSet data = (IPentahoResultSet) getInputValue(CHART_DATA_PROP);
    String urlTemplate = (String) getInputValue(URL_TEMPLATE);

    Node chartAttributes = null;
    String chartAttributeString = null;

    // Attempt to get chart attributes as an input string or as a resource file
    // If these don't trip, then we assume the chart attributes are defined in
    // the component-definition of the chart action. 

    if (getInputNames().contains(CHART_ATTRIBUTES_PROP)) {
      chartAttributeString = getInputStringValue(CHART_ATTRIBUTES_PROP);
    } else if (isDefinedResource(CHART_ATTRIBUTES_PROP)) {
      IActionResource resource = getResource(CHART_ATTRIBUTES_PROP);
      chartAttributeString = getResourceAsString(resource);
    }

    // Realize chart attributes as an XML document
    if (chartAttributeString != null) {

      Node chartDocument = XmlHelper.getDocFromString(chartAttributeString);
      chartAttributes = chartDocument.selectSingleNode(CHART_ATTRIBUTES_PROP);

      // This line of code handles a discrepancy between the schema of a chart definition
      // handed to a dashboard versus a ChartComponent schema. The top level node for the dashboard charts 
      // is <chart>, whereas the ChartComponent expects <chart-attributes>. 

      // TODO: 
      // This discrepancy should be resolved when we have ONE chart solution. 

      if (chartAttributes == null) {
        chartAttributes = chartDocument.selectSingleNode(ALTERNATIVE_CHART_ATTRIBUTES_PROP);
      }
    }

    // Default chart attributes are in the component-definition section of the action definition. 
    if (chartAttributes == null) {
      chartAttributes = getComponentDefinition(true).selectSingleNode(CHART_ATTRIBUTES_PROP);
    }

    // URL click-through attributes (useBaseURL, target) are only processed IF we 
    // have an urlTemplate attribute 
    if (urlTemplate == null || urlTemplate.length() == 0) {
      if (chartAttributes.selectSingleNode(URL_TEMPLATE) != null) {
        urlTemplate = chartAttributes.selectSingleNode(URL_TEMPLATE).getText();
      }
    }

    // These parameters are replacement variables parsed into the 
    // urlTemplate specifically when we have a URL that is a drill-through
    // link in a chart intended to drill down into the chart data. 
    String parameterName = (String) getInputValue(PARAMETER_NAME);
    if (parameterName == null || parameterName.length() == 0) {
      if (chartAttributes.selectSingleNode(PARAMETER_NAME) != null) {
        parameterName = chartAttributes.selectSingleNode(PARAMETER_NAME).getText();
      }
    }

    // These parameters are replacement variables parsed into the 
    // urlTemplate specifically when we have a URL that is a drill-through
    // link in a chart intended to drill down into the chart data. 
    String outerParameterName = (String) getInputValue(OUTER_PARAMETER_NAME);
    if (outerParameterName == null || outerParameterName.length() == 0) {
      if (chartAttributes.selectSingleNode(OUTER_PARAMETER_NAME) != null) {
        outerParameterName = chartAttributes.selectSingleNode(OUTER_PARAMETER_NAME).getText();
      }
    }

    String chartType = chartAttributes.selectSingleNode(ChartDefinition.TYPE_NODE_NAME).getText();

    // --------------- This code allows inputs to override the chartAttributes
    // of width, height, and title
    Object widthObj = getInputValue(ChartDefinition.WIDTH_NODE_NAME);
    if (widthObj != null) {
      width = Integer.parseInt(widthObj.toString());
      if (width != -1) {
        if (chartAttributes.selectSingleNode(ChartDefinition.WIDTH_NODE_NAME) == null) {
          ((Element) chartAttributes).addElement(ChartDefinition.WIDTH_NODE_NAME);
        }
        chartAttributes.selectSingleNode(ChartDefinition.WIDTH_NODE_NAME).setText(Integer.toString(width));
      }
    }
    Object heightObj = getInputValue(ChartDefinition.HEIGHT_NODE_NAME);
    if (heightObj != null) {
      height = Integer.parseInt(heightObj.toString());
      if (height != -1) {
        if (chartAttributes.selectSingleNode(ChartDefinition.HEIGHT_NODE_NAME) == null) {
          ((Element) chartAttributes).addElement(ChartDefinition.HEIGHT_NODE_NAME);
        }
        chartAttributes.selectSingleNode(ChartDefinition.HEIGHT_NODE_NAME).setText(Integer.toString(height));
      }
    }
    Object titleObj = getInputValue(ChartDefinition.TITLE_NODE_NAME);
    if (titleObj != null) {
      if (chartAttributes.selectSingleNode(ChartDefinition.TITLE_NODE_NAME) == null) {
        ((Element) chartAttributes).addElement(ChartDefinition.TITLE_NODE_NAME);
      }
      chartAttributes.selectSingleNode(ChartDefinition.TITLE_NODE_NAME).setText(titleObj.toString());
    }
    // ----------------End of Override

    // ---------------Feed the Title and Subtitle information through the input substitution
    Node titleNode = chartAttributes.selectSingleNode(ChartDefinition.TITLE_NODE_NAME);
    if (titleNode != null) {
      String titleStr = titleNode.getText();
      if (titleStr != null) {
        title = titleStr;
        String newTitle = applyInputsToFormat(titleStr);
        titleNode.setText(newTitle);
      }
    }

    List subtitles = chartAttributes.selectNodes(ChartDefinition.SUBTITLE_NODE_NAME); 
    
    if ((subtitles == null) ||(subtitles.isEmpty())){
      Node subTitlesNode = chartAttributes.selectSingleNode(ChartDefinition.SUBTITLES_NODE_NAME); 
      if (subTitlesNode != null){
        subtitles = chartAttributes.selectNodes(ChartDefinition.SUBTITLE_NODE_NAME); 
      }
    }else{
      // log a deprecation warning for this property...
      getLogger().warn(Messages.getString("CHART.WARN_DEPRECATED_CHILD", ChartDefinition.SUBTITLE_NODE_NAME, ChartDefinition.SUBTITLES_NODE_NAME));//$NON-NLS-1$ 
      getLogger().warn(Messages.getString("CHART.WARN_PROPERTY_WILL_NOT_VALIDATE", ChartDefinition.SUBTITLE_NODE_NAME));//$NON-NLS-1$  
    }

    if (subtitles != null){
      for (Iterator iter = subtitles.iterator(); iter.hasNext();) {
        Node subtitleNode = (Node) iter.next();
        if (subtitleNode != null) {
          String subtitleStr = subtitleNode.getText();
          if (subtitleStr != null) {
            String newSubtitle = applyInputsToFormat(subtitleStr);
            subtitleNode.setText(newSubtitle);
          }
        }
      }
    }

    //----------------End of Format

    // Determine if we are going to read the chart data set by row or by column
    boolean byRow = false;
    if (getInputStringValue(BY_ROW_PROP) != null) {
      byRow = Boolean.valueOf(getInputStringValue(BY_ROW_PROP)).booleanValue();
    }

    // TODO Figure out why these overrides are called here. Seems like we are doing the same thing we just did above, but 
    // could possibly step on the height and width values set previously. 

    if (height == -1) {
      height = (int) getInputLongValue(CHART_ATTRIBUTES_PROP + "/" + ChartDefinition.HEIGHT_NODE_NAME, 50); //$NON-NLS-1$
    }
    if (width == -1) {
      width = (int) getInputLongValue(CHART_ATTRIBUTES_PROP + "/" + ChartDefinition.WIDTH_NODE_NAME, 100); //$NON-NLS-1$      
    }

    if (title.length() <= 0)
      title = getInputStringValue(CHART_ATTRIBUTES_PROP + "/" + ChartDefinition.TITLE_NODE_NAME); //$NON-NLS-1$

    // Select the right dataset to use based on the chart type
    // Default to category dataset
    String datasetType = ChartDefinition.CATAGORY_DATASET_STR;
    boolean isStacked = false;
    Node datasetTypeNode = chartAttributes.selectSingleNode(ChartDefinition.DATASET_TYPE_NODE_NAME);
    if (datasetTypeNode != null) {
      datasetType = datasetTypeNode.getText();
    }
    Dataset dataDefinition = null;
    if (ChartDefinition.XY_SERIES_COLLECTION_STR.equalsIgnoreCase(datasetType)) {
      dataDefinition = new XYSeriesCollectionChartDefinition(data, byRow, chartAttributes, getSession());
    } else if (ChartDefinition.TIME_SERIES_COLLECTION_STR.equalsIgnoreCase(datasetType)) {

      Node stackedNode = chartAttributes.selectSingleNode(ChartDefinition.STACKED_NODE_NAME);
      if (stackedNode != null) {
        isStacked = Boolean.valueOf(stackedNode.getText()).booleanValue();
      }
      if ((isStacked) && (ChartDefinition.AREA_CHART_STR.equalsIgnoreCase(chartType))) {
        dataDefinition = new TimeTableXYDatasetChartDefinition(data, byRow, chartAttributes, getSession());
      } else {
        dataDefinition = new TimeSeriesCollectionChartDefinition(data, byRow, chartAttributes, getSession());
      }
    } else if (ChartDefinition.PIE_CHART_STR.equalsIgnoreCase(chartType)) {
      dataDefinition = new PieDatasetChartDefinition(data, byRow, chartAttributes, getSession());
    } else if (ChartDefinition.DIAL_CHART_STR.equalsIgnoreCase(chartType)) {
      dataDefinition = new DialWidgetDefinition(data, byRow, chartAttributes, width, height, getSession());
    } else if (ChartDefinition.BAR_LINE_CHART_STR.equalsIgnoreCase(chartType)) {
      dataDefinition = new BarLineChartDefinition(data, byRow, chartAttributes, getSession());
    } else if (ChartDefinition.BUBBLE_CHART_STR.equalsIgnoreCase(chartType)) {
      dataDefinition = new XYZSeriesCollectionChartDefinition(data, byRow, chartAttributes, getSession());
    } else {
      dataDefinition = new CategoryDatasetChartDefinition(data, byRow, chartAttributes, getSession());
    }

    // Determine what we are sending back - Default to OUTPUT_PNG output
    // OUTPUT_PNG = the chart gets written to a file in .png format
    // OUTPUT_SVG = the chart gets written to a file in .svg (XML) format
    // OUTPUT_CHART = the chart in a byte stream gets stored as as an IContentItem
    // OUTPUT_PNG_BYTES = the chart gets sent as a byte stream in .png format

    int outputType = JFreeChartEngine.OUTPUT_PNG;

    if (getInputStringValue(OUTPUT_TYPE_PROP) != null) {
      if (SVG_TYPE.equalsIgnoreCase(getInputStringValue(OUTPUT_TYPE_PROP))) {
        outputType = JFreeChartEngine.OUTPUT_SVG;
      } else if (CHART_TYPE.equalsIgnoreCase(getInputStringValue(OUTPUT_TYPE_PROP))) {
        outputType = JFreeChartEngine.OUTPUT_CHART;
      } else if (PNG_BYTES_TYPE.equalsIgnoreCase(getInputStringValue(OUTPUT_TYPE_PROP))) {
        outputType = JFreeChartEngine.OUTPUT_PNG_BYTES;
      }
    }

    JFreeChart chart = null;

    switch (outputType) {

      /**************************** OUTPUT_PNG_BYTES *********************************************/
      case JFreeChartEngine.OUTPUT_PNG_BYTES:

        chart = JFreeChartEngine.getChart(dataDefinition, title, "", width, height, this); //$NON-NLS-1$

        // TODO Shouldn't the mime types and other strings here be constant somewhere? Where do we 
        // put this type of general info ?

        String mimeType = "image/png"; //$NON-NLS-1$
        IContentItem contentItem = getOutputItem("chartdata", mimeType, ".png"); //$NON-NLS-1$ //$NON-NLS-2$
        contentItem.setMimeType(mimeType);
        try {

          OutputStream output = contentItem.getOutputStream(getActionName());
          ChartUtilities.writeChartAsPNG(output, chart, width, height);

        } catch (Exception e) {
          error(Messages.getErrorString("ChartComponent.ERROR_0004_CANT_CREATE_IMAGE"), e); //$NON-NLS-1$
          return false;
        }

        break;

      /**************************** OUTPUT_SVG && OUTPUT_PNG *************************************/
      case JFreeChartEngine.OUTPUT_SVG:
        // intentionally fall through to PNG

      case JFreeChartEngine.OUTPUT_PNG:

        // Don't include the map in a file if HTML_MAPPING_HTML is specified, as that 
        // param sends the map back on the outputstream as a string
        boolean includeMapFile = !isDefinedOutput(HTML_MAPPING_HTML);

        File[] fileResults = createTempFile(outputType, includeMapFile);

        if (fileResults == null) {
          error(Messages.getErrorString("ChartComponent.ERROR_0003_CANT_CREATE_TEMP_FILES")); //$NON-NLS-1$
          return false;
        }

        String chartId = fileResults[FILE_NAME].getName().substring(0, fileResults[FILE_NAME].getName().indexOf('.'));
        String filePathWithoutExtension = TEMP_DIRECTORY + chartId;
        PrintWriter printWriter = new PrintWriter(new StringWriter());
        ChartRenderingInfo info = new ChartRenderingInfo(new StandardEntityCollection());

        JFreeChartEngine.saveChart(dataDefinition, title,
            "", filePathWithoutExtension, width, height, outputType, printWriter, info, this); //$NON-NLS-1$

        //Creating the image map
        boolean useBaseUrl = true;
        String urlTarget = "pentaho_popup"; //$NON-NLS-1$

        // Prepend the base url to the front of every drill through link
        if (chartAttributes.selectSingleNode(USE_BASE_URL_TAG) != null) {
          Boolean booleanValue = new Boolean(chartAttributes.selectSingleNode(USE_BASE_URL_TAG).getText());
          useBaseUrl = booleanValue.booleanValue();
        }

        // What target for link? _parent, _blank, etc. 
        if (chartAttributes.selectSingleNode(URL_TARGET_TAG) != null) {
          urlTarget = chartAttributes.selectSingleNode(URL_TARGET_TAG).getText();
        }
        
        String mapString  = null;
        if (includeMapFile) {
          try {
            String mapId = fileResults[MAP_NAME].getName().substring(0, fileResults[MAP_NAME].getName().indexOf('.'));
            mapString = ImageMapUtilities.getImageMap(mapId, info, new StandardToolTipTagFragmentGenerator(),
                new PentahoChartURLTagFragmentGenerator(data,urlTemplate, urlTarget, useBaseUrl, dataDefinition, parameterName,
                    outerParameterName));

            BufferedWriter out = new BufferedWriter(new FileWriter(fileResults[MAP_NAME]));
            out.write(mapString);
            out.flush();
            out.close();
          } catch (IOException e) {
            error(Messages.getErrorString("ChartComponent.ERROR_0001_CANT_WRITE_MAP", fileResults[MAP_NAME].getPath())); //$NON-NLS-1$
            return false;
          } catch (Exception e) {
            error(e.getLocalizedMessage(), e);
            return false;
          }
        }

        /*******************************************************************************************************
         * Legitimate outputs for the ChartComponent in an action sequence:
         * 
         *  CHART_OUTPUT (chart-output)
         *  Stores the chart in the content repository as an IContentItem.
         *  
         *  CHART_FILE_NAME_OUTPUT (chart-filename)
         *  Returns the name of the chart file, including the file extension (with no path information)
         *  as a String. 
         * 
         *  HTML_MAPPING_OUTPUT (chart-mapping)
         *  Returns the name of the file that the map has been saved to, including the file extension
         *  (with no path information) as a String.
         * 
         *  HTML_MAPPING_HTML (chart-map-html)
         *  Returns the chart image map HTML as a String.
         * 
         *  BASE_URL_OUTPUT (base-url)
         *  Returns the web app's base URL (ie., http://localhost:8080/pentaho) as a String.
         * 
         *  HTML_IMG_TAG (image-tag)
         *  Returns the HTML snippet including the image map, image (<IMG />) tag for the chart image
         *  with src, width, height and usemap attributes defined.
         *  
         *******************************************************************************************************/

        // Now set the outputs
        Set outputs = getOutputNames();

        if (outputs != null && outputs.size() > 0) {

          Iterator iter = outputs.iterator();
          while (iter.hasNext()) {

            String outputName = (String) iter.next();
            String outputValue = null;

            if (outputName.equals(CHART_FILE_NAME_OUTPUT)) {

              outputValue = fileResults[FILE_NAME].getName();

            } else if (outputName.equals(HTML_MAPPING_OUTPUT)) {

              outputValue = fileResults[MAP_NAME].getName();

            } else if (outputName.equals(HTML_MAPPING_HTML)) {

              outputValue = mapString;

            } else if (outputName.equals(BASE_URL_OUTPUT)) {

              outputValue = PentahoSystem.getApplicationContext().getBaseUrl();

            } else if (outputName.equals(HTML_IMG_TAG)) {

              outputValue = mapString;

              outputValue += "<img border=\"0\" "; //$NON-NLS-1$
              outputValue += "width=\"" + width + "\" "; //$NON-NLS-1$//$NON-NLS-2$
              outputValue += "height=\"" + height + "\" "; //$NON-NLS-1$//$NON-NLS-2$
              outputValue += "usemap=\"#" + fileResults[MAP_NAME].getName().substring(0, fileResults[MAP_NAME].getName().indexOf('.')) + "\" "; //$NON-NLS-1$//$NON-NLS-2$
              outputValue += "src=\"" + PentahoSystem.getApplicationContext().getBaseUrl() + "getImage?image=" + fileResults[FILE_NAME].getName() + "\"/>"; //$NON-NLS-1$//$NON-NLS-2$ //$NON-NLS-3$

            }

            if (outputValue != null) {
              setOutputValue(outputName, outputValue);
            }
          }
        }

        break;

      /************************** OUTPUT_CHART && DEFAULT *************************************/
      case JFreeChartEngine.OUTPUT_CHART:
        // intentionally fall through to default

      default:

        String chartName = CHART_OUTPUT;
        if (isDefinedInput(CHART_NAME_PROP)) {
          chartName = getInputStringValue(CHART_NAME_PROP);
        }
        chart = JFreeChartEngine.getChart(dataDefinition, title, "", width, height, this); //$NON-NLS-1$
        setOutputValue(chartName, chart);

        break;
    }

    return true;
  }

  public boolean init() {
    // nothing to do here really
    return true;
  }

  /**
   * @return String that represents the file path to a temporary file
   */
  protected File[] createTempFile(int outputType, boolean includeMapFile) {
    File[] results;
    if (includeMapFile) {
      results = new File[2];
    } else {
      results = new File[1];
    }

    String extension = outputType == JFreeChartEngine.OUTPUT_SVG ? SVG_EXTENSION : PNG_EXTENSION;

    try {
      File file = File.createTempFile(FILENAME_PREFIX, extension, new File(PentahoSystem.getApplicationContext()
          .getFileOutputPath(TEMP_DIRECTORY)));
      file.deleteOnExit();
      results[FILE_NAME] = file;
      if (includeMapFile) {
        file = File.createTempFile(FILENAME_PREFIX, MAP_EXTENSION, new File(PentahoSystem.getApplicationContext()
            .getFileOutputPath(TEMP_DIRECTORY)));
        file.deleteOnExit();
        results[MAP_NAME] = file;
      }
    } catch (IOException e) {
      return null;
    }
    return results;
  }

  protected String getSolutionRelativePath(String fullPath) {
    String prefix = PentahoSystem.getApplicationContext().getSolutionPath(""); //$NON-NLS-1$
    // Next line was added for PLATFORM-828
    prefix = prefix.replaceAll("\\\\", "\\\\\\\\"); //$NON-NLS-1$ //$NON-NLS-2$
    String result = fullPath.replaceFirst(prefix, ""); //$NON-NLS-1$
    return result;
  }
}
