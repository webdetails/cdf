package org.pentaho.cdf;

import java.io.InputStream;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Document;
import org.pentaho.platform.api.engine.IFileInfo;
import org.pentaho.platform.api.engine.ISolutionFile;
import org.pentaho.platform.api.engine.SolutionFileMetaAdapter;
import org.pentaho.platform.engine.core.solution.FileInfo;
import org.pentaho.platform.util.xml.dom4j.XmlDom4JHelper;

/**
 * Parses a Dom4J document and creates an IFileInfo object containing the
 * xcdf info.
 * 
 * @author Will Gorman (wgorman@pentaho.com)
 */
public class CdfFileInfoGenerator extends SolutionFileMetaAdapter {

  private Log logger = LogFactory.getLog(CdfFileInfoGenerator.class);

  public CdfFileInfoGenerator() {
  }

  @Override
  public IFileInfo getFileInfo(ISolutionFile solutionFile, InputStream in) {
    // TODO Auto-generated method stubT
    Document doc = null;
    try {
      doc = XmlDom4JHelper.getDocFromStream(in);
    } catch (Exception e) {
      logger.error(Messages.getErrorString("CdfFileInfoGenerator.ERROR_0001_PARSING_XCDF"), e); //$NON-NLS-1$
      return null;
    }
    if (doc == null) {
      logger.error(Messages.getErrorString("CdfFileInfoGenerator.ERROR_0001_PARSING_XCDF")); //$NON-NLS-1$
      return null;
    }
    
    String result = "dashboard";  //$NON-NLS-1$

    String author = XmlDom4JHelper.getNodeText("/cdf/author", doc, "");  //$NON-NLS-1$ //$NON-NLS-2$
    String description = XmlDom4JHelper.getNodeText("/cdf/description", doc, "");  //$NON-NLS-1$ //$NON-NLS-2$
    String icon = XmlDom4JHelper.getNodeText("/cdf/icon", doc, "");  //$NON-NLS-1$ //$NON-NLS-2$
    String title = XmlDom4JHelper.getNodeText("/cdf/title", doc, "");  //$NON-NLS-1$ //$NON-NLS-2$

    IFileInfo info = new FileInfo();
    info.setAuthor(author);
    info.setDescription(description);
    info.setDisplayType(result);
    info.setIcon(icon);
    info.setTitle(title);
    return info;
  }
}
