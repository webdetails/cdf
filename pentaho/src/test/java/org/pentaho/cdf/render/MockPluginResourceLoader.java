/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

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
