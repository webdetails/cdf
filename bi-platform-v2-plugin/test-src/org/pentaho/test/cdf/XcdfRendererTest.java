package org.pentaho.test.cdf;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

import junit.framework.Assert;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.pentaho.cdf.XcdfRenderer;
import org.pentaho.platform.api.engine.IPentahoDefinableObjectFactory;
import org.pentaho.platform.api.engine.IPluginResourceLoader;
import org.pentaho.platform.api.repository2.unified.IUnifiedRepository;
import org.pentaho.platform.api.repository2.unified.RepositoryFile;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.repository2.ClientRepositoryPaths;
import org.pentaho.platform.repository2.unified.fileio.RepositoryFileWriter;
import org.pentaho.test.platform.engine.core.MicroPlatform;


public class XcdfRendererTest {


  private static MicroPlatform mp = new MicroPlatform();

  private static MicroPlatform.RepositoryModule repo;
  
  private String publicDir = ClientRepositoryPaths.getPublicFolderPath();

  @BeforeClass
  public static void beforeClass() throws Exception {
    mp.define(IPluginResourceLoader.class, MockPluginResourceLoader.class, IPentahoDefinableObjectFactory.Scope.GLOBAL);
    repo = mp.getRepositoryModule();
    repo.up();
  }

  @AfterClass
  public static void afterClass() {
    repo.down();
  }

  @Before
  public void beforeTest() {
    repo.login("joe", "acme");
  }

  @After
  public void afterTest() {
    repo.logout();
  }

  @Test
  public void testGetFileAsText() throws Exception {
    File pluginFolder = new File("bi-platform-v2-plugin");
    if (pluginFolder.exists()) {
      pluginFolder = new File(pluginFolder, "test-resource");
    } else {
      pluginFolder = new File("test-resource");
    }
    
    IUnifiedRepository unifiedRepository = PentahoSystem.get(IUnifiedRepository.class, null);
    MockPluginResourceLoader resourceLoader = (MockPluginResourceLoader)PentahoSystem.get(IPluginResourceLoader.class, null);
    resourceLoader.setRootDir(pluginFolder);
    
    String filePath = publicDir + "/test-file1.xcdf";
    RepositoryFileWriter writer = new RepositoryFileWriter(filePath, "UTF-8");
    writer.write("<cdf><title>Start Here</title><author>Webdetails</author><description>Start Here</description><icon></icon><template>test-file2.html</template></cdf>");
    writer.close();
    RepositoryFile xcdfFile = unifiedRepository.getFile(filePath);
    
    filePath = publicDir + "/test-file2.html";
    writer = new RepositoryFileWriter(filePath, "UTF-8");
    writer.write("<div><p>hello world</p></div>");
    writer.close();
    RepositoryFile templateFile = unifiedRepository.getFile(filePath);

    XcdfRenderer xcdfRenderer = new XcdfRenderer() {
      protected File getTemplateFile() {
        String fileName = "template-dashboard";
        if (getTemplate() != null) {
          fileName = fileName + "-" + getTemplate();
        }
        fileName = fileName + ".html";
        return new File(getPluginRootDir(), fileName);
      }
      
      protected List<String> getUserRoles() {
        return new ArrayList<String>();
      }
      
      protected void generateStorage(OutputStream outputStream) {
        
      }
    };
    System.out.println("Using plugin folder: " + pluginFolder.getAbsolutePath());
    xcdfRenderer.setPluginRootDir(pluginFolder);
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    Assert.assertNotNull(xcdfFile);
    xcdfRenderer.setOutputStream(outputStream);
    xcdfRenderer.setTemplate("mantle");
    xcdfRenderer.setRepositoryFile(xcdfFile);
    xcdfRenderer.setBaseUrl("/pentaho");
    xcdfRenderer.setUserSession(PentahoSessionHolder.getSession());
    xcdfRenderer.execute();
    
    String dashboard = outputStream.toString("UTF-8");
    Assert.assertTrue(dashboard.indexOf("hello world") >= 0);
  }

}
