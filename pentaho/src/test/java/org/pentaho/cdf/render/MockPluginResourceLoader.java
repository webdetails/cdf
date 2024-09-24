/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/

package org.pentaho.cdf.render;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.util.List;
import java.util.ResourceBundle;

import org.pentaho.platform.api.engine.IPluginResourceLoader;

public class MockPluginResourceLoader implements IPluginResourceLoader {

  File rootDir;

  public MockPluginResourceLoader() {
  }

  public void setRootDir(File rootDir) {
    this.rootDir = rootDir;
  }

  public List<URL> findResources(Class<?> pluginClass, String namePattern) {
    throw new UnsupportedOperationException();
  }

  public List<URL> findResources(ClassLoader classLoader, String namePattern) {
    throw new UnsupportedOperationException();
  }

  public String getPluginSetting(Class<?> pluginClass, String key, String defaultValue) {
    throw new UnsupportedOperationException();
  }

  public String getPluginSetting(Class<?> pluginClass, String key) {
    throw new UnsupportedOperationException();
  }

  public String getPluginSetting(ClassLoader pluginClassLoader, String key, String defaultValue) {
    throw new UnsupportedOperationException();
  }

  public byte[] getResourceAsBytes(Class<? extends Object> pluginClass, String resourcePath) {
    throw new UnsupportedOperationException();
  }

  public InputStream getResourceAsStream(Class<?> pluginClass, String resourcePath) {
    InputStream inputStream = null;
    try {
      inputStream = new FileInputStream(new File(rootDir, resourcePath));
    } catch (FileNotFoundException e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    }
    return inputStream;
  }

  public InputStream getResourceAsStream(ClassLoader classLoader, String resourcePath) {
    throw new UnsupportedOperationException();
  }

  public String getResourceAsString(Class<? extends Object> pluginClass, String resourcePath, String charsetName)
      throws UnsupportedEncodingException {
    throw new UnsupportedOperationException();
  }

  public String getResourceAsString(Class<? extends Object> pluginClass, String resourcePath)
      throws UnsupportedEncodingException {
    throw new UnsupportedOperationException();
  }

  public ResourceBundle getResourceBundle(Class<?> pluginClass, String baseName) {
    throw new UnsupportedOperationException();
  }

}
