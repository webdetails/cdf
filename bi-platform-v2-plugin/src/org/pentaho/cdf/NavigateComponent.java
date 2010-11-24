/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package org.pentaho.cdf;

import java.util.Hashtable;
import java.util.List;

import javax.xml.parsers.ParserConfigurationException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Document;
import org.dom4j.Node;
import org.dom4j.io.DOMReader;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.platform.api.engine.ICacheManager;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.repository.ISolutionRepository;
import org.pentaho.platform.engine.core.system.PentahoBase;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.web.servlet.SolutionRepositoryService;

/**
 * @author pedro
 */
@SuppressWarnings("serial")
public class NavigateComponent extends PentahoBase {

  private static final String NAVIGATOR = "navigator";
  private static final String CONTENTLIST = "contentList";
  private static final String TYPE_DIR = "FOLDER";
  private static final String TYPE_XACTION = "XACTION";
  private static final String TYPE_URL = "URL";
  private static final String TYPE_XCDF = "XCDF";
  private static final String TYPE_WCDF = "WCDF";
  private static final String TYPE_PRPT = "PRPT";
  private static final String CACHE_NAVIGATOR = "CDF_NAVIGATOR_JSON";
  private static final String CACHE_REPOSITORY_DOCUMENT = "CDF_REPOSITORY_DOCUMENT";
  protected static final Log logger = LogFactory.getLog(NavigateComponent.class);
  IPentahoSession userSession;
  ICacheManager cacheManager;
  boolean cachingAvailable;
  String contextPath;


  public NavigateComponent(final IPentahoSession userSession, String contextPath) {

    this.userSession = userSession;
    cacheManager = PentahoSystem.getCacheManager(userSession);
    cachingAvailable = cacheManager != null && cacheManager.cacheEnabled();
    this.contextPath = contextPath;

  }

  public String getNavigationElements(final String mode, final String solution, final String path) throws JSONException, ParserConfigurationException {


    if (mode.equals(NAVIGATOR)) {
      return getNavigatorJSON(solution, path);

    } else if (mode.equals(CONTENTLIST)) {
      return getContentListJSON(solution, path);

    } else {
      logger.warn("Invalid mode: " + mode);
      return "";
    }


  }

  @Override
  public Log getLogger() {
    return logger;
  }

  private Document getRepositoryDocument(final IPentahoSession userSession) throws ParserConfigurationException {      //
    Document repositoryDocument;
    if (cachingAvailable && (repositoryDocument = (Document) cacheManager.getFromSessionCache(userSession, CACHE_REPOSITORY_DOCUMENT)) != null) {
      getLogger().debug("Repository Document found in cache");
      return repositoryDocument;
    } else {
      //System.out.println(Calendar.getInstance().getTime() + ": Getting repository Document");
      final DOMReader reader = new DOMReader();
      repositoryDocument = reader.read(new SolutionRepositoryService().getSolutionRepositoryDoc(userSession, new String[0]));
      cacheManager.putInSessionCache(userSession, CACHE_REPOSITORY_DOCUMENT, repositoryDocument);
      //System.out.println(Calendar.getInstance().getTime() + ": Repository Document Returned");
    }
    return repositoryDocument;
  }

  private String getNavigatorJSON(final String solution, final String path) {

    String jsonString = null;

    if (cachingAvailable && (jsonString = (String) cacheManager.getFromSessionCache(userSession, CACHE_NAVIGATOR)) != null) {
      debug("Navigator found in cache");
    } else {

      try {

        final Document navDoc = getRepositoryDocument(this.userSession);

        // Get it and build the tree
        final JSONObject json = new JSONObject();

        final Node tree = navDoc.getRootElement();
        final JSONArray array = processTree(tree, "/");
        json.put("solution", array.get(0));

        jsonString = json.toString(2);
        // Store in cache:
        cacheManager.putInSessionCache(userSession, CACHE_NAVIGATOR, jsonString);

        //System.out.println(Calendar.getInstance().getTime() + ": Returning Navigator");

      } catch (Exception e) {
        System.out.println("Error: " + e.getClass().getName() + " - " + e.getMessage());
        warn("Error: " + e.getClass().getName() + " - " + e.getMessage());
      }
    }

    return jsonString;


  }


  @SuppressWarnings("unchecked")
  private JSONArray processTree(final Node tree, final String parentPath) {

    final String xPathDir = "./file[@isDirectory='true']"; //$NON-NLS-1$
    JSONArray array = null;

    try {

      final List nodes = tree.selectNodes(xPathDir); //$NON-NLS-1$
      if (!nodes.isEmpty()) {
        array = new JSONArray();
      }

      final String[] parentPathArray = parentPath.split("/");
      final String solutionName = parentPathArray.length > 2 ? parentPathArray[2] : "";
      final String solutionPath = parentPathArray.length > 3 ? parentPath.substring(parentPath.indexOf(solutionName) + solutionName.length() + 1, parentPath.length()) + "/" : "";

      for (final Object node1 : nodes) {

        final Node node = (Node) node1;
        final JSONObject json = new JSONObject();
        JSONObject jsonChild = new JSONObject();
        JSONArray children = null;
        JSONArray files = null;
        String name = node.valueOf("@name");

        if (parentPathArray.length > 0) {


          final String localizedName = node.valueOf("@localized-name");
          final String description = node.valueOf("@description");
          final boolean visible = node.valueOf("@visible").equals("true");
          final boolean isDirectory = node.valueOf("@isDirectory").equals("true");
          final String path = solutionName.length() == 0 ? "" : solutionPath + name;
          final String solution = solutionName.length() == 0 ? name : solutionName;

          json.put("id", parentPath + "/" + name);
          json.put("name", name);
          json.put("solution", solution);
          json.put("path", path);
          json.put("type", TYPE_DIR);
          json.put("visible", visible);
          json.put("title", visible ? localizedName : "Hidden");
          json.put("description", description);


          if (visible && isDirectory) {
            children = processTree(node, parentPath + "/" + name);
            files = new JSONArray();

            //Process directory wcdf/xcdf files
            final List fileNodes = node.selectNodes("./file[@isDirectory='false'][ends-with(string(@name),'.xcdf') or ends-with(string(@name),'.wcdf')]");

            for (final Object fileNode : fileNodes) {

              final Node chilNode = (Node) fileNode;
              name = chilNode.valueOf("@name");
              final String type = name.substring(name.lastIndexOf(".") + 1, name.length());

              jsonChild = new JSONObject();
              jsonChild.put("file", name);
              jsonChild.put("solution", json.get("solution"));
              jsonChild.put("path", json.get("path"));
              jsonChild.put("type", type);
              jsonChild.put("visible", chilNode.valueOf("@visible").equals("true"));
              jsonChild.put("title", chilNode.valueOf("@localized-name"));
              jsonChild.put("description", chilNode.valueOf("@description"));
              files.put(jsonChild);
            }
            json.put("files", files);
          }

        } else {
          // root dir
          json.put("id", tree.valueOf("@path"));
          json.put("name", solutionName);
          json.put("path", solutionPath);
          json.put("visible", true);
          json.put("title", "Solution");
          children = processTree(tree, tree.valueOf("@path"));
        }

        //System.out.println("  Processing getting children ");
        if (children != null) {
          json.put("folders", children);
        }

        array.put(json);

      }

    } catch (Exception e) {
      System.out.println("Error: " + e.getClass().getName() + " - " + e.getMessage());
      warn("Error: " + e.getClass().getName() + " - " + e.getMessage());
    }

    return array;
  }

  @SuppressWarnings("unchecked")
  private String getContentListJSON(final String _solution, final String _path) {

    String jsonString = null;
    JSONArray array = null;

    try {

      final JSONObject contentListJSON = new JSONObject();

      final Document navDoc = getRepositoryDocument(this.userSession);
      final Node tree = navDoc.getRootElement();
      final String xPathDir = "./file[@name='" + _solution + "']"; //$NON-NLS-1$

      List nodes = tree.selectNodes(xPathDir); //$NON-NLS-1$
      if (!nodes.isEmpty() && nodes.size() == 1) {

        array = new JSONArray();

        //Add Folder
        final Node node = getDirectoryNode((Node) nodes.get(0), _path);
        JSONObject json = new JSONObject();
        json.put("name", node.valueOf("@name"));
        json.put("id", _solution + "/" + _path);
        json.put("solution", _solution);
        json.put("path", _path);
        json.put("type", TYPE_DIR);
        json.put("visible", false);
        json.put("title", "Hidden");
        array.put(json);

        nodes = node.selectNodes("./file");

        //Add Folder Content
        for (final Object node1 : nodes) {

          final Node chilNode = (Node) node1;
          final String name = chilNode.valueOf("@name");
          final String localizedName = chilNode.valueOf("@localized-name");
          final String description = chilNode.valueOf("@description");
          final String type = chilNode.valueOf("@isDirectory").equals("true") ? TYPE_DIR : name.endsWith(".xaction") ? TYPE_XACTION : name.endsWith(".url") ? TYPE_URL : name.endsWith(".xcdf") ? TYPE_XCDF : name.endsWith(".wcdf") ? TYPE_WCDF : name.endsWith(".prpt") ? TYPE_PRPT : null;
          final boolean visible = chilNode.valueOf("@visible").equals("true");

          if (type != null) {

            /* Get the hashTable that contains the pairs:  supported-file-type -> associated url to use */
            final Hashtable<String, String> readAbility = PluginCatalogEngine.getInstance().getPlugins();
            String link = "";
            String relativeUrl = contextPath;
            
            if(relativeUrl.endsWith("/")) {
              relativeUrl = relativeUrl.substring(0, relativeUrl.length() - 1);
            }
            final String path = type.equals(TYPE_DIR) ? (_path.length() > 0 ? _path + "/" + name : name) : _path;
            final String url = (type != null && type.equals(TYPE_URL)) ? (!chilNode.valueOf("@url").startsWith("http") && !chilNode.valueOf("@url").startsWith(relativeUrl) && !chilNode.valueOf("@url").startsWith("/") ? /*CdfContentGenerator.BASE_URL +*/ "/" + chilNode.valueOf("@url") : chilNode.valueOf("@url")) : null;

            /*create the link*/
            final String lowType = type.toLowerCase();
            if (readAbility.containsKey(lowType)) {

              String s = "/" + readAbility.get(lowType);

              /* Replace the generic variable names for the variable values */
              s = s.replace("{solution}", _solution);
              s = s.replace("{path}", path);
              s = s.replace("{name}", name);
              s = s.replaceAll("&amp;", "&");

              link = link + s;
            }


            /*else if (type.equals(TYPE_WCDF)) {
              link = link + "/content/pentaho-cdf-dd/Render?solution=" + _solution + "&path=" + path + "&file=" + name;
            } else if (type.equals(TYPE_XCDF)) {
              link = link + "/content/pentaho-cdf/RenderXCDF?solution=" + _solution + "&path=" + path + "&action=" + name; 
            } else if (type.equals(TYPE_XACTION)) {
              link = link + "/ViewAction?solution=" + _solution + "&path=" + path + "&action=" + name;
            }*/


            json = new JSONObject();
            json.put("name", name);
            json.put("id", _solution + "/" + _path + "/" + name);
            json.put("solution", _solution);
            json.put("path", path);
            json.put("type", type);
            json.put("visible", visible);
            json.put("title", localizedName);
            json.put("description", description);
            json.put("link", link);
            if (type.equals(TYPE_PRPT)) json.put("prpt", name);
            if (type.equals(TYPE_XCDF) || type.equals(TYPE_WCDF)) json.put("file", name);
            if (type.equals(TYPE_XACTION)) json.put("action", name);
            if (type.equals(TYPE_URL)) json.put("url", url);
            array.put(json);
          }
        }
      }

      contentListJSON.put("content", array);
      jsonString = contentListJSON.toString(2);
    }
    catch (Exception e) {
      System.out.println("Error: " + e.getClass().getName() + " - " + e.getMessage());
      warn("Error: " + e.getClass().getName() + " - " + e.getMessage());
    }

    //debug("Finished processing tree");
    return jsonString;

  }

  @SuppressWarnings("unchecked")
  private Node getDirectoryNode(Node node, final String _path) {

    final String[] pathArray = _path.split("/");
    if (pathArray.length > 0) {

      final String path = pathArray[0];
      final String xPathDir = "./file[@name='" + path + "']"; //$NON-NLS-1$
      final List nodes = node.selectNodes(xPathDir); //$NON-NLS-1$
      if (!nodes.isEmpty() && nodes.size() == 1) {
        node = (Node) nodes.get(0);
        if (!_path.equals(path))
          node = getDirectoryNode(node, _path.substring(_path.indexOf(path) + path.length() + 1, _path.length()));

      } else
        return node;

    }

    return node;
  }
}
