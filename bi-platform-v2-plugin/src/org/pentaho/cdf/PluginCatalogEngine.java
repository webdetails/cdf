package org.pentaho.cdf;

import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Node;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.util.xml.dom4j.XmlDom4JHelper;

import java.io.File;
import java.io.FilenameFilter;
import java.io.IOException;
import java.util.Hashtable;
import java.util.List;

public class PluginCatalogEngine {

  public static final String PLUGIN_DIR = PentahoSystem.getApplicationContext().getSolutionPath("system/");
  public String path;
  private static PluginCatalogEngine _engine;
  private Hashtable<String, String> pluginPool;

  public PluginCatalogEngine() {
    this.path = PLUGIN_DIR;
    catalogPlugins(PLUGIN_DIR);
  }

  public PluginCatalogEngine(final String path) {
    this.path = path;
    catalogPlugins(path);
  }

  public static PluginCatalogEngine getInstance() {
    if (_engine == null) _engine = new PluginCatalogEngine();
    return _engine;
  }

  public void refresh() {
    catalogPlugins(this.path);
  }

  public Hashtable<String, String> getPlugins() {
    return pluginPool;
  }

  private void catalogPlugins(final String path) {

    /*
    * Search the project-.../solution/system/
    * for the folders that contain a plugin.xml
    * file
     */

    final File systemFolder = new File(path);

    /*
    * Hashtable pluginPool:
    * Key = file type
    * Object = command to run the assigned file type
    */

    pluginPool = new Hashtable<String, String>();

    /* xaction case is added manually because it doesnt need a plugin to be runnable */
    pluginPool.put("xaction", "ViewAction?solution={solution}&path={path}&action={name}");

    final FilenameFilter subFolders = new FilenameFilter() {
      public boolean accept(final File systemFolder, final String name) {
        final File plugin = new File(systemFolder.getPath() + "/" + name + "/plugin.xml");
        return plugin.exists() && plugin.canRead();

      }
    };
    final String[] listPlugins = systemFolder.list(subFolders);

    /*
     * Open the plugin.xml files
     * in the previous folder list to
     * check for a run command for the
     * associated file type
    */

    for (final String plugin : listPlugins) {
      final String pluginFolder = PLUGIN_DIR + plugin + "/plugin.xml";

      try {
        final Document xml = XmlDom4JHelper.getDocFromFile(new File(pluginFolder), null);

        final List<Node> list = xml.selectNodes("//content-type[@type]");

        String readType = null;
        final String rawUrl;

        for (final Node node : list) {
          readType = XmlDom4JHelper.getNodeText("@type", node);
        }


        if (readType != null) {
          rawUrl = xml.selectSingleNode("//operation/id[text()='RUN']/../command").getText();

          pluginPool.put(readType, rawUrl);
        }

      } catch (DocumentException e) {
        e.printStackTrace();
      } catch (IOException e) {
        e.printStackTrace();
      }

    }


  }
}
