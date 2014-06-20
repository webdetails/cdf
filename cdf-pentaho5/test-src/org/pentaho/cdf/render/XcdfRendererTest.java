/*!
* Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
*
* This software was developed by Webdetails and is provided under the terms
* of the Mozilla Public License, Version 2.0, or any later version. You may not use
* this file except in compliance with the license. If you need a copy of the license,
* please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
*
* Software distributed under the Mozilla Public License is distributed on an "AS IS"
* basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
* the license for the specific language governing your rights and limitations.
*/

package org.pentaho.cdf.render;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.util.ArrayList;
import java.util.List;

import junit.framework.Assert;

import org.junit.*;
import org.pentaho.cdf.render.XcdfRenderer;
//import org.pentaho.platform.api.engine.IPentahoDefinableObjectFactory;
import org.pentaho.platform.api.engine.IPluginResourceLoader;
//import org.pentaho.platform.api.engine.IUserRoleListService;
import org.pentaho.platform.api.repository2.unified.IUnifiedRepository;
import org.pentaho.platform.api.repository2.unified.RepositoryFile;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.engine.core.system.StandaloneSession;
//import org.pentaho.platform.engine.security.userrole.ws.MockUserRoleListService;
import org.pentaho.platform.repository2.ClientRepositoryPaths;
import org.pentaho.platform.repository2.unified.fileio.RepositoryFileOutputStream;
import org.pentaho.platform.repository2.unified.fileio.RepositoryFileWriter;
//import org.pentaho.platform.repository2.unified.fs.FileSystemBackedUnifiedRepository;
//import org.pentaho.test.platform.engine.core.MicroPlatform;


public class XcdfRendererTest {


 // private static MicroPlatform mp = new MicroPlatform();
  
  private String publicDir = ClientRepositoryPaths.getPublicFolderPath();

  @BeforeClass
  public static void beforeClass() throws Exception {
    
//    mp.define(IPluginResourceLoader.class, MockPluginResourceLoader.class, IPentahoDefinableObjectFactory.Scope.GLOBAL);
//    mp.define(IUnifiedRepository.class, FileSystemBackedUnifiedRepository.class);
//    mp.define(IUserRoleListService.class, MockUserRoleListService.class);
}

  @AfterClass
  public static void afterClass() {
  }

  @Before
  public void beforeTest() {
    PentahoSessionHolder.setSession(new StandaloneSession());
  }

  @After
  public void afterTest() {
  }

  @Test
  @Ignore
  //This test is broken - it's referencing old APIS - no point in making it run due to refactoring in progress
  public void testGetFileAsText() throws Exception {
    File pluginFolder = new File("bi-platform-v2-plugin");
    if (pluginFolder.exists()) {
      pluginFolder = new File(pluginFolder, "test-resource");
    } else {
      pluginFolder = new File("test-resource");
    }
    
    IUnifiedRepository unifiedRepository = PentahoSystem.get(IUnifiedRepository.class, null);
    MockPluginResourceLoader resourceLoader = null; //(MockPluginResourceLoader)PentahoSystem.get(IPluginResourceLoader.class, null);
    resourceLoader.setRootDir(pluginFolder);
    
    String filePath = publicDir + "/test-file1.xcdf";
    //RepositoryFileWriter writer = new RepositoryFileWriter(filePath, "UTF-8");
    OutputStreamWriter writer = null; //new OutputStreamWriter(new RepositoryFileOutputStream(filePath, false, true, unifiedRepository));
    writer.write("<cdf><title>Start Here</title><author>Webdetails</author><description>Start Here</description><icon></icon><template>test-file2.html</template></cdf>");
    writer.close();
    RepositoryFile xcdfFile = unifiedRepository.getFile(filePath);
    
    filePath = publicDir + "/test-file2.html";
    writer = new RepositoryFileWriter(filePath, "UTF-8");
    writer.write("<div><p>hello world</p></div>");
    writer.close();
    RepositoryFile templateFile = unifiedRepository.getFile(filePath);


    /*
    XcdfRenderer xcdfRenderer = new XcdfRenderer() {
      protected File getTemplateFile() {
        String fileName = "template-dashboard";
        if ( getTemplate() != null) {
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
    };       */

    /*
    XcdfRenderer xcdfRenderer = null;
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
    */
  }

}
