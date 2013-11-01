package org.pentaho.cdf.render;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

import org.apache.commons.io.FilenameUtils;
import org.dom4j.Document;
import org.pentaho.platform.api.action.IVarArgsAction;
import org.pentaho.platform.api.repository2.unified.RepositoryFile;
import org.pentaho.platform.plugin.services.pluginmgr.PluginClassLoader;
import org.pentaho.platform.util.xml.dom4j.XmlDom4JHelper;
import org.pentaho.platform.web.http.api.resources.IFileResourceRenderer;
import pt.webdetails.cpf.repository.RepositoryAccess;

public class XcdfRenderer extends CdfHtmlTemplateRenderer implements IFileResourceRenderer, IVarArgsAction {

 
  RepositoryFile jcrXcdfFile = null;
  File xcdfFile = null;
  

  public void setRepositoryFile(RepositoryFile arg0) {
    jcrXcdfFile = arg0;
    if (jcrXcdfFile != null) {
      xcdfFile = null;
    }
  }
  

  
  public void setFile(File xcdfFile) {
    this.xcdfFile = xcdfFile;
    if (this.xcdfFile != null) {
      setRepositoryFile(null);
    }
  }
  

  protected InputStream getSourceInputStream() throws IOException {
    InputStream inputStream = null;
    RepositoryAccess repositoryAccess = RepositoryAccess.getRepository();
    
    if (jcrXcdfFile != null) {
        inputStream = repositoryAccess.getResourceInputStream(jcrXcdfFile.getPath());//.getId());
    } else {
        inputStream = new FileInputStream(xcdfFile);
    }
    return inputStream;
  }
  
  public void execute() throws Exception {
    RepositoryAccess repositoryAccess = RepositoryAccess.getRepository();
    if (jcrXcdfFile != null) {
      final Document doc = XmlDom4JHelper.getDocFromStream(getSourceInputStream());

      // Get message file base name if any
      if (doc.selectSingleNode("/cdf/messages") != null) //$NON-NLS-1$
      {
        setMsgsFileBaseName(XmlDom4JHelper.getNodeText("/cdf/messages", doc)); //$NON-NLS-1$
      }

      // If a "style" tag exists, use that one
      if (doc.selectSingleNode("/cdf/style") != null) //$NON-NLS-1$
      {
        setTemplate(XmlDom4JHelper.getNodeText("/cdf/style", doc)); //$NON-NLS-1$
      }

      String dashboardFileName = XmlDom4JHelper.getNodeText("/cdf/template", doc, ""); //$NON-NLS-1$
      if ((dashboardFileName == null) || (dashboardFileName.trim().length() == 0)) {
        File pluginDir = ((PluginClassLoader) this.getClass().getClassLoader()).getPluginDir();
        super.setFile(new File(pluginDir, "default-dashboard-template.html")); //$NON-NLS-1$
      } else if (dashboardFileName.startsWith("\\")) { //$NON-NLS-1$

      } else {
        String parentDir = FilenameUtils.getFullPathNoEndSeparator(jcrXcdfFile.getPath());
        dashboardFileName = FilenameUtils.separatorsToUnix(FilenameUtils.concat(parentDir, dashboardFileName));
        super.setRepositoryFile(repositoryAccess.getRepositoryFile(dashboardFileName, RepositoryAccess.FileAccess.READ));
      }
      
      super.execute();
    } else {
      getOutputStream().write("Can not open file".getBytes("UTF-8")); //$NON-NLS-1$ //$NON-NLS-2$
    }
  }
}
