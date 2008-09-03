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
 * Created Feb 15, 2006
 * @author wseyler
 */
package org.pentaho.plugin.jfreechart;

import java.awt.Color;
import java.awt.Font;
import java.awt.Image;
import java.awt.Paint;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Node;
import org.jfree.chart.title.TextTitle;
import org.jfree.data.UnknownKeyException;
import org.jfree.data.general.DefaultPieDataset;
import org.jfree.ui.RectangleEdge;
import org.pentaho.commons.connection.IPentahoDataTypes;
import org.pentaho.commons.connection.IPentahoResultSet;
import org.pentaho.commons.connection.PentahoDataTransmuter;
import org.pentaho.core.session.IPentahoSession;
import org.pentaho.messages.Messages;

public class PieDatasetChartDefinition extends DefaultPieDataset implements ChartDefinition {

    /**
     *
     */
    private static final long serialVersionUID = 1L;
    private static final String INTERIOR_GAP_NODE_NAME = "interior-gap"; //$NON-NLS-1$
    private static final String START_ANGLE_NODE_NAME = "start-angle"; //$NON-NLS-1$
    private static final String LABEL_FONT_NODE_NAME = "label-font"; //$NON-NLS-1$
    private static final String LABEL_PAINT_NODE_NAME = "label-paint"; //$NON-NLS-1$
    private static final String LABEL_BACKGROUND_PAINT_NODE_NAME = "label-background-paint"; //$NON-NLS-1$
    private static final String LABEL_GAP_NODE_NAME = "label-gap"; //$NON-NLS-1$
    private static final String SLICE_NODE_NAME = "slice"; //$NON-NLS-1$
    private static final String EXPLODE_SLICE_NODE_NAME = "explode-slices"; //$NON-NLS-1$

    // JFreeChart Customizations
    private String title = ""; //$NON-NLS-1$
    private String noDataMessage = null;
    private RectangleEdge titlePosition = RectangleEdge.TOP;
    private Font titleFont = TextTitle.DEFAULT_FONT;
    private List subTitles = new ArrayList();
    private List explodeSlices = new ArrayList();
    private Paint chartBackgroundPaint = Color.WHITE;
    private Image chartBackgroundImage = null;
    private boolean borderVisible = false;
    private Paint borderPaint = Color.BLACK;
    private int width = 200;
    private int height = 200;

    // Plot Customizations
    private Paint plotBackgroundPaint = Color.WHITE;
    private Image plotBackgroundImage = null;
    private Paint[] paintSequence = null;
    private boolean legendIncluded = true;
    private boolean threeD = false;
    private boolean displayLabels = true;

    // PiePlot Customizations
    private double interiorGap = 0.25;
    private double startAngle = 90.0;
    private Font labelFont = new Font("SansSerif", Font.PLAIN, 10); //$NON-NLS-1$
    private Paint labelPaint = Color.BLACK;
    private Paint labelBackgroundPaint = new Color(255, 255, 204);
    private double labelGap = 0.10;

    // Other stuff
    private IPentahoSession session;
    private Font legendFont = null;
    private boolean legendBorderVisible = true;
    private Float backgroundAlpha;
    private Float foregroundAlpha;

    /**
     *
     */
    public PieDatasetChartDefinition(IPentahoSession session) {
        super();
        this.session = session;
    }

    /**
     * @param data
     */
    public PieDatasetChartDefinition(IPentahoResultSet data, boolean byRow, IPentahoSession session) {
        this(session);
        if (byRow) {
            setDataByRow(data);
        } else {
            setDataByColumn(data);
        }
    }

    public PieDatasetChartDefinition(IPentahoResultSet data, boolean byRow, Node chartAttributes, IPentahoSession session) {
        this(data, byRow, session);
        setChartAttributes(chartAttributes);
    }

    public static Log getLogger() {
        return LogFactory.getLog(PieDatasetChartDefinition.class);
    }

    private void setChartAttributes(Node chartAttributes) {
        if (chartAttributes == null) {
            return;
        }
        // set the chart background
        setChartBackground(chartAttributes.selectSingleNode(CHART_BACKGROUND_NODE_NAME));

        // set the plot background
        setPlotBackground(chartAttributes.selectSingleNode(PLOT_BACKGROUND_NODE_NAME));

        // do we want a legend
        setLegendIncluded(chartAttributes.selectSingleNode(INCLUDE_LEGEND_NODE_NAME));

        // get the chart title
        setTitle(chartAttributes.selectSingleNode(TITLE_NODE_NAME));

        // set the alfa layers
        setBackgroundAlpha(chartAttributes.selectSingleNode(BACKGROUND_ALPHA_NODE_NAME));
        
        setForegroundAlpha(chartAttributes.selectSingleNode(FOREGROUND_ALPHA_NODE_NAME));


        // get the chart subtitles
        // A list of <subtitle> nodes should not be allowed to exist as a child of the main XML element (for XML schema to 
        // be well constructed and validate the XML . 
        // We have deprecated <subtitle> as a child of the main node , and now require a <subtitles> parent node 
        // under which <subtitle> can exist. 



        List subtitles = chartAttributes.selectNodes(SUBTITLE_NODE_NAME);

        if ((subtitles == null) || (subtitles.isEmpty())) {
            Node subTitlesNode = chartAttributes.selectSingleNode(SUBTITLES_NODE_NAME);
            if (subTitlesNode != null) {
                subtitles = subTitlesNode.selectNodes(SUBTITLE_NODE_NAME);
            }
        } else {
            // log a deprecation warning for this property...
            getLogger().warn(Messages.getString("CHART.WARN_DEPRECATED_CHILD", SUBTITLE_NODE_NAME, SUBTITLES_NODE_NAME));//$NON-NLS-1$ 
            getLogger().warn(Messages.getString("CHART.WARN_PROPERTY_WILL_NOT_VALIDATE", SUBTITLE_NODE_NAME));//$NON-NLS-1$  
        }

        if (subtitles != null) {
            addSubTitles(subtitles);
        }

        // get the chart's exploded sections

        List slicesNodes = null;
        Node slicesNode = chartAttributes.selectSingleNode(EXPLODE_SLICE_NODE_NAME);
        if (slicesNode != null) {
            slicesNodes = slicesNode.selectNodes(SLICE_NODE_NAME);
        }

        if (slicesNodes != null) {
            addExplodedSlices(slicesNodes);
        }

        // get the paint sequence
        setPaintSequence(chartAttributes.selectSingleNode(PALETTE_NODE_NAME));

        // get the 3D value
        setThreeD(chartAttributes.selectSingleNode(THREED_NODE_NAME));

        // set the width
        setWidth(chartAttributes.selectSingleNode(WIDTH_NODE_NAME));

        // set the height
        setHeight(chartAttributes.selectSingleNode(HEIGHT_NODE_NAME));

        // set the border on or off
        setBorderVisible(chartAttributes.selectSingleNode(CHART_BORDER_VISIBLE_NODE_NAME));

        // set the border Paint
        setBorderPaint(JFreeChartEngine.getPaint(chartAttributes.selectSingleNode(CHART_BORDER_PAINT_NODE_NAME)));

        // set the title location
        setTitlePosition(chartAttributes.selectSingleNode(TITLE_POSITION_NODE_NAME));

        // set the title font
        setTitleFont(chartAttributes.selectSingleNode(TITLE_FONT_NODE_NAME));

        // set the interior gap
        setInteriorGap(chartAttributes.selectSingleNode(INTERIOR_GAP_NODE_NAME));

        // set the start angle
        setStartAngle(chartAttributes.selectSingleNode(START_ANGLE_NODE_NAME));

        // set if we want labels
        setDisplayLabels(chartAttributes.selectSingleNode(DISPLAY_LABELS_NODE_NAME));

        // set the label font
        setLabelFont(chartAttributes.selectSingleNode(LABEL_FONT_NODE_NAME));

        // set the label paint
        setLabelPaint(JFreeChartEngine.getPaint(chartAttributes.selectSingleNode(LABEL_PAINT_NODE_NAME)));

        // set the label background paint
        setLabelBackgroundPaint(JFreeChartEngine.getPaint(chartAttributes.selectSingleNode(LABEL_BACKGROUND_PAINT_NODE_NAME)));

        // set the label gap
        setLabelGap(chartAttributes.selectSingleNode(LABEL_GAP_NODE_NAME));

        // set legend font
        setLegendFont(chartAttributes.selectSingleNode(LEGEND_FONT_NODE_NAME));

        // set legend border visible
        setLegendBorderVisible(chartAttributes.selectSingleNode(DISPLAY_LEGEND_BORDER_NODE_NAME));
    }

    private void setDataByColumn(IPentahoResultSet data) {
        setDataByRow(PentahoDataTransmuter.pivot(data));
    }

    private void setDataByRow(IPentahoResultSet data) {
        if (data == null) {
            noDataMessage = Messages.getString("CHART.USER_NO_DATA_AVAILABLE"); //$NON-NLS-1$
            return; // No data so we've got nothing to set
        // TODO come up with some sort of error strategy here.
        }
        boolean hasColumnHeaders = data.getMetaData().getColumnHeaders() != null;
        if (!hasColumnHeaders) {
            data = PentahoDataTransmuter.transmute(data, false);
        }
        String[] columnHeaders = null;
        try {
            columnHeaders = PentahoDataTransmuter.getCollapsedHeaders(IPentahoDataTypes.AXIS_COLUMN, data, '|');
        } catch (Exception e) {
            // should really NEVER get here
            e.printStackTrace();
        }
        int row = 0;
        if (!hasColumnHeaders) {
            data.next();
            row = 1;
        }
        Object[] rowData = data.next();
        while (rowData != null && row < data.getRowCount() + 1) {
            for (int column = 0; column < rowData.length; column++) {
                if (rowData[column] instanceof Number) {

                    Number currentNumber = null;
                    try { // If value has been set then we get it
                        currentNumber = getValue(columnHeaders[column]);
                    } catch (UnknownKeyException uke) { // else we just set it
                        // to zero
                        currentNumber = new Double(0.0);
                    }
                    if (currentNumber == null) {
                        currentNumber = new Double(0.0);
                    }
                    double currentValue = currentNumber.doubleValue();

                    double newValue = ((Number) rowData[column]).doubleValue();
                    setValue(columnHeaders[column], new Double(newValue + currentValue));
                }
            }
            rowData = data.next();
            row++;
        }

        if ((data.getRowCount() > 0) && (this.getItemCount() <= 0)) {
            noDataMessage = Messages.getString("CHART.USER_INCORRECT_DATA_FORMAT"); //$NON-NLS-1$
        }

    }

    public void setHeight(Node heightNode) {
        if (heightNode != null) {
            setHeight(Integer.parseInt(heightNode.getText()));
        }
    }

    /**
     * @param height
     *            The height to set.
     */
    public void setHeight(int height) {
        this.height = height;
    }

    public int getHeight() {
        return height;
    }

    public void setWidth(Node widthNode) {
        if (widthNode != null) {
            setWidth(Integer.parseInt(widthNode.getText()));
        }
    }

    /**
     * @param width
     *            The width to set.
     */
    public void setWidth(int width) {
        this.width = width;
    }

    public int getWidth() {
        return width;
    }

    public void setTitle(Node chartTitleNode) {
        if (chartTitleNode != null) {
            setTitle(chartTitleNode.getText());
        }
    }

    /**
     * @param title
     *            The title to set.
     */
    public void setTitle(String title) {
        this.title = title;
    }

    public String getTitle() {
        return title;
    }

    public void setTitleFont(Font titleFont) {
        this.titleFont = titleFont;
    }

    public void setTitleFont(Node titleFontNode) {
        Font font = JFreeChartEngine.getFont(titleFontNode);
        if (font != null) {
            setTitleFont(font);
        }
    }

    public Font getTitleFont() {
        return titleFont;
    }

    public void addSubTitles(List subTitleNodes) {
        if (subTitleNodes != null) {
            Iterator iter = subTitleNodes.iterator();
            while (iter.hasNext()) {
                addSubTitle(((Node) iter.next()).getText());
            }
        }
    }

    public void addSubTitle(String subTitle) {
        subTitles.add(subTitle);
    }

    public List getSubtitles() {
        return subTitles;
    }

    public void addExplodedSlices(List nodes) {
        if (nodes != null) {
            Iterator iter = nodes.iterator();
            while (iter.hasNext()) {
                addExplodedSlice(((Node) iter.next()).getText());
            }
        }
    }

    public void addExplodedSlice(String slice) {
        explodeSlices.add(slice);
    }

    public List getExplodedSlices() {
        return explodeSlices;
    }

    public void setChartBackground(Node chartBackgroundNode) {
        if (chartBackgroundNode != null) {
            Node backgroundTypeNode = chartBackgroundNode.selectSingleNode(BACKGROUND_TYPE_ATTRIBUTE_NAME);
            if (backgroundTypeNode != null) {
                String backgroundTypeStr = backgroundTypeNode.getText();
                if (COLOR_TYPE_NAME.equalsIgnoreCase(backgroundTypeStr)) {
                    setChartBackgroundPaint(JFreeChartEngine.getPaint(chartBackgroundNode));
                    setChartBackgroundImage((Image) null);
                } else if (IMAGE_TYPE_NAME.equalsIgnoreCase(backgroundTypeStr)) {
                    setChartBackgroundImage(chartBackgroundNode);
                    setChartBackgroundPaint(null);
                } else if (TEXTURE_TYPE_NAME.equalsIgnoreCase(backgroundTypeStr)) {
                    setChartBackgroundPaint(JFreeChartEngine.getTexturePaint(chartBackgroundNode, getWidth(), getHeight(),
                            getSession()));
                    setChartBackgroundImage((Image) null);
                } else if (GRADIENT_TYPE_NAME.equalsIgnoreCase(backgroundTypeStr)) {
                    setChartBackgroundPaint(JFreeChartEngine.getGradientPaint(chartBackgroundNode, getWidth(), getHeight()));
                    setChartBackgroundImage((Image) null);
                }
            }
        }
    }

    /**
     * @param backgroundPaint
     *            The backgroundPaint to set.
     */
    public void setChartBackgroundPaint(Paint chartBackgroundPaint) {
        if (chartBackgroundPaint != null) {
            this.chartBackgroundPaint = chartBackgroundPaint;
        }
    }

    public Paint getChartBackgroundPaint() {
        return chartBackgroundPaint;
    }

    public void setChartBackgroundImage(Node chartBackgroundImageNode) {
        setChartBackgroundImage(JFreeChartEngine.getImage(chartBackgroundImageNode, getSession()));
    }

    /**
     * @param chartBackgroundImage
     *            The chartBackgroundImage to set.
     */
    public void setChartBackgroundImage(Image chartBackgroundImage) {
        this.chartBackgroundImage = chartBackgroundImage;
    }

    public Image getChartBackgroundImage() {
        return chartBackgroundImage;
    }

    public void setBorderVisible(Node borderVisibleNode) {
        if (borderVisibleNode != null) {
            String boolStr = borderVisibleNode.getText();
            Boolean booleanValue = new Boolean(boolStr);
            setBorderVisible(booleanValue.booleanValue());
        }
    }

    /**
     * @param borderVisible
     *            The borderVisible to set.
     */
    public void setBorderVisible(boolean borderVisible) {
        this.borderVisible = borderVisible;
    }

    public boolean isBorderVisible() {
        return borderVisible;
    }

    public Paint getBorderPaint() {
        return borderPaint;
    }

    /**
     * @param borderPaint
     *            The borderPaint to set.
     */
    public void setBorderPaint(Paint borderPaint) {
        if (borderPaint != null) {
            this.borderPaint = borderPaint;
        }
    }

    public void setTitlePosition(Node titlePositionNode) {
        if (titlePositionNode != null) {
            String titlePositionStr = titlePositionNode.getText();
            if ("top".equalsIgnoreCase(titlePositionStr)) { //$NON-NLS-1$
                setTitlePosition(RectangleEdge.TOP);
            } else if ("left".equalsIgnoreCase(titlePositionStr)) { //$NON-NLS-1$
                setTitlePosition(RectangleEdge.LEFT);
            } else if ("bottom".equalsIgnoreCase(titlePositionStr)) { //$NON-NLS-1$
                setTitlePosition(RectangleEdge.BOTTOM);
            } else if ("right".equalsIgnoreCase(titlePositionStr)) { //$NON-NLS-1$
                setTitlePosition(RectangleEdge.RIGHT);
            }
        }
    }

    /**
     * @param titlePosition
     *            The titlePosition to set.
     */
    public void setTitlePosition(RectangleEdge titlePosition) {
        this.titlePosition = titlePosition;
    }

    public RectangleEdge getTitlePosition() {
        return titlePosition;
    }

    public void setPaintSequence(Node paletteNode) {
        if (paletteNode != null) {
            List colorNodes = paletteNode.selectNodes(COLOR_NODE_NAME);
            Paint[] paints = new Paint[colorNodes.size()];
            for (int i = 0; i < colorNodes.size(); i++) {
                paints[i] = JFreeChartEngine.getPaint((Node) colorNodes.get(i));
            }
            setPaintSequence(paints);
        }
    }

    /**
     * @param paintSequence
     *            The paintSequence to set.
     */
    public void setPaintSequence(Paint[] paintSequence) {
        this.paintSequence = paintSequence;
    }

    public Paint[] getPaintSequence() {
        return paintSequence;
    }

    public void setPlotBackground(Node plotBackgroundNode) {
        if (plotBackgroundNode != null) {
            Node backgroundTypeNode = plotBackgroundNode.selectSingleNode(BACKGROUND_TYPE_ATTRIBUTE_NAME);
            if (backgroundTypeNode != null) {
                String backgroundTypeStr = backgroundTypeNode.getText();
                if (COLOR_TYPE_NAME.equalsIgnoreCase(backgroundTypeStr)) {
                    setPlotBackgroundPaint(JFreeChartEngine.getPaint(plotBackgroundNode));
                    setPlotBackgroundImage((Image) null);
                } else if (IMAGE_TYPE_NAME.equalsIgnoreCase(backgroundTypeStr)) {
                    setPlotBackgroundImage(plotBackgroundNode);
                    setPlotBackgroundPaint(null);
                } else if (TEXTURE_TYPE_NAME.equalsIgnoreCase(backgroundTypeStr)) {
                    setPlotBackgroundPaint(JFreeChartEngine.getTexturePaint(plotBackgroundNode, getWidth(), getHeight(),
                            getSession()));
                    setPlotBackgroundImage((Image) null);
                } else if (GRADIENT_TYPE_NAME.equalsIgnoreCase(backgroundTypeStr)) {
                    setPlotBackgroundPaint(JFreeChartEngine.getGradientPaint(plotBackgroundNode, getWidth(), getHeight()));
                    setPlotBackgroundImage((Image) null);
                }
            }
        }
    }

    public void setPlotBackgroundPaint(Paint plotBackgroundPaint) {
        if (plotBackgroundPaint != null) {
            this.plotBackgroundPaint = plotBackgroundPaint;
        }
    }

    public Paint getPlotBackgroundPaint() {
        return plotBackgroundPaint;
    }

    /**
     * @param plotBackgroundImage
     *            The plotBackgroundImage to set.
     */
    public void setPlotBackgroundImage(Image plotBackgroundImage) {
        this.plotBackgroundImage = plotBackgroundImage;
    }

    public void setPlotBackgroundImage(Node plotBackgroundImageNode) {
        setPlotBackgroundImage(JFreeChartEngine.getImage(plotBackgroundImageNode, getSession()));
    }

    public Image getPlotBackgroundImage() {
        return plotBackgroundImage;
    }

    public void setLegendIncluded(Node legendNode) {
        if (legendNode != null) {
            String boolStr = legendNode.getText();
            Boolean booleanValue = new Boolean(boolStr);
            setLegendIncluded(booleanValue.booleanValue());
        }
    }

    /**
     * @param legendIncluded
     *            The legendIncluded to set.
     */
    public void setLegendIncluded(boolean legendIncluded) {
        this.legendIncluded = legendIncluded;
    }

    public boolean isLegendIncluded() {
        return legendIncluded;
    }

    public void setThreeD(Node threeDNode) {
        if (threeDNode != null) {
            String boolStr = threeDNode.getText();
            Boolean booleanValue = new Boolean(boolStr);
            setThreeD(booleanValue.booleanValue());
        }
    }

    /**
     * @param threeD
     *            The threeD to set.
     */
    public void setThreeD(boolean threeD) {
        this.threeD = threeD;
    }

    public boolean isThreeD() {
        return threeD;
    }

    private void setInteriorGap(Node interiorGapNode) {
        if (interiorGapNode != null) {
            String gapNodeStr = interiorGapNode.getText();
            Double doubleValue = new Double(gapNodeStr);
            setInteriorGap(doubleValue.doubleValue());
        }
    }

    /**
     * @param interiorGap
     *            The interiorGap to set.
     */
    public void setInteriorGap(double interiorGap) {
        this.interiorGap = interiorGap;
    }

    public double getInteriorGap() {
        return interiorGap;
    }

    private void setStartAngle(Node startAngleNode) {
        if (startAngleNode != null) {
            String gapNodeStr = startAngleNode.getText();
            Double doubleValue = new Double(gapNodeStr);
            setStartAngle(doubleValue.doubleValue());
        }
    }

    /**
     * @param startAngle
     *            The startAngle to set.
     */
    public void setStartAngle(double startAngle) {
        this.startAngle = startAngle;
    }

    public double getStartAngle() {
        return startAngle;
    }

    private void setLabelFont(Node labelFontNode) {
        Font font = JFreeChartEngine.getFont(labelFontNode);
        if (font != null) {
            setLabelFont(font);
        }
    }

    public void setLabelFont(Font font) {
        labelFont = font;
    }

    public Font getLabelFont() {
        // TODO Auto-generated method stub
        return labelFont;
    }

    /**
     * @param labelPaint
     *            The labelPaint to set.
     */
    public void setLabelPaint(Paint labelPaint) {
        if (labelPaint != null) {
            this.labelPaint = labelPaint;
        }
    }

    /**
     * @return Returns the labelPaint.
     */
    public Paint getLabelPaint() {
        return labelPaint;
    }

    public Paint getLabelBackgroundPaint() {
        // TODO Auto-generated method stub
        return labelBackgroundPaint;
    }

    /**
     * @param labelBackgroundPaint
     *            The labelBackgroundPaint to set.
     */
    public void setLabelBackgroundPaint(Paint labelBackgroundPaint) {
        if (labelBackgroundPaint != null) {
            this.labelBackgroundPaint = labelBackgroundPaint;
        }
    }

    public double getLabelGap() {
        return labelGap;
    }

    /**
     * @param node
     *            The labelGap to set.
     */
    public void setLabelGap(Node labelGapNode) {
        if (labelGapNode != null) {
            String gapNodeStr = labelGapNode.getText();
            Double doubleValue = new Double(gapNodeStr);
            setLabelGap(doubleValue.doubleValue());
        }
    }

    public void setLabelGap(double labelGap) {
        this.labelGap = labelGap;
    }

    public boolean isDisplayLabels() {
        return displayLabels;
    }

    public void setDisplayLabels(Node threeDNode) {
        if (threeDNode != null) {
            String boolStr = threeDNode.getText();
            Boolean booleanValue = new Boolean(boolStr);
            setDisplayLabels(booleanValue.booleanValue());
        }
    }

    public void setDisplayLabels(boolean displayLabels) {
        this.displayLabels = displayLabels;
    }

    public IPentahoSession getSession() {
        return session;
    }

    public void setSession(IPentahoSession session) {
        this.session = session;
    }

    /**
     * Return the java.awt.Font to be used to display the legend items
     *
     * @return Font The font for the legend items
     */
    public Font getLegendFont() {
        // TODO Auto-generated method stub
        return legendFont;
    }

    /**
     * Set java.awt.Font to be used to display the legend items
     *
     * @param Font The java.awt.Font for the legend items
     */
    public void setLegendFont(Font legendFont) {
        this.legendFont = legendFont;
    }

    public void setLegendFont(Node legendFontNode) {
        Font font = JFreeChartEngine.getFont(legendFontNode);
        if (font != null) {
            setLegendFont(font);
        }
    }

    public void setLegendBorderVisible(Node legendBorderVisibleNode) {
        if (legendBorderVisibleNode != null) {
            boolean legBorderVisible = (new Boolean(legendBorderVisibleNode.getText())).booleanValue();
            setLegendBorderVisible(legBorderVisible);
        }
    }

    /**
     * @param boolean legendBorderVisible
     *        Set the visibility of the legend border.
     */
    public void setLegendBorderVisible(boolean legendBorderVisible) {
        this.legendBorderVisible = legendBorderVisible;
    }

    /**
     * Return the boolen that states if the legend border is visible
     *
     * @return boolean Is the legend border visible
     */
    public boolean isLegendBorderVisible() {
        // TODO Auto-generated method stub
        return legendBorderVisible;
    }

    public String getNoDataMessage() {
        return noDataMessage;
    }

    public Float getBackgroundAlpha() {
        return backgroundAlpha;
    }

    public void setBackgroundAlpha(Node backgroundAlphaNode) {
        if (backgroundAlphaNode != null) {
            Float backgroundAlphaValue = new Float(backgroundAlphaNode.getText());
            this.backgroundAlpha = backgroundAlphaValue;
        }

    }
    
    public Float getForegroundAlpha() {
        return foregroundAlpha;
    }

    public void setForegroundAlpha(Node foregroundAlphaNode) {
        if (foregroundAlphaNode != null) {
            Float foregroundAlphaValue = new Float(foregroundAlphaNode.getText());
            this.foregroundAlpha = foregroundAlphaValue;
        }

    }
}
