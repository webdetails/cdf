/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package org.pentaho.cdf;

import java.io.IOException;
import java.util.Iterator;
import java.util.List;
import java.util.StringTokenizer;

import org.dom4j.Element;
import org.pentaho.platform.engine.core.system.PentahoBase;
import org.pentaho.platform.api.repository.ISolutionRepository;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.api.engine.ICacheManager;
import org.pentaho.platform.repository.solution.SolutionRepositoryBase;
import org.pentaho.platform.util.xml.dom4j.XmlDom4JHelper;
import org.apache.commons.logging.LogFactory;
import org.apache.commons.logging.Log;
import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.Node;
import org.dom4j.XPath;
import org.pentaho.platform.api.engine.ISolutionFile;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.XML;
import org.json.JSONException;

/**
 *
 * @author pedro
 */
public class NavigateComponent extends PentahoBase {

	private static final String NAVIGATOR = "navigator";
	private static final String CONTENTLIST = "contentList";
	private static final String TYPE_DIR = "FOLDER";
	private static final String TYPE_XACTION = "XACTION";
	private static final String TYPE_URL = "URL";
	private static final String CACHE_NAVIGATOR = "CDF_NAVIGATOR_JSON";
	protected static final Log logger = LogFactory.getLog(NavigateComponent.class);
    ISolutionRepository solutionRepository = null;
    IPentahoSession userSession;
    ICacheManager cacheManager;
    boolean cachingAvailable;
    
    public NavigateComponent(IPentahoSession userSession) {
        
        solutionRepository = PentahoSystem.get(ISolutionRepository.class,userSession);// PentahoSystem.getSolutionRepository(userSession);// g etSolutionRepository(userSession);
        this.userSession = userSession;
        cacheManager = PentahoSystem.getCacheManager(userSession);
        cachingAvailable = cacheManager != null && cacheManager.cacheEnabled();

    }
    
    public String getNavigationElements(String mode, String solution, String path) throws JSONException {


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

    private String getNavigatorJSON(String solution, String path) throws JSONException {

        String jsonString = null;

        if (cachingAvailable && (jsonString = (String) cacheManager.getFromSessionCache(userSession, CACHE_NAVIGATOR)) != null) {
            debug("Navigator found in cache");
        } else {
            Document navDoc = solutionRepository.getSolutionTree(ISolutionRepository.ACTION_EXECUTE);

            // Get it and build the tree

            JSONObject json = new JSONObject();

            Node tree = navDoc.getRootElement();
            JSONArray array = processTree(tree);
            json.put("solution", array.get(0));

            jsonString = json.toString(2);
            // Store in cache:
            cacheManager.putInSessionCache(userSession, CACHE_NAVIGATOR, jsonString);
        }

        return jsonString;


    }

    private JSONArray processTree(Node tree) throws JSONException {


        String xPathDir = "./branch[@isDir='true']"; //$NON-NLS-1$
        JSONArray array = null;

        try {
            List nodes = tree.selectNodes(xPathDir); //$NON-NLS-1$
            if (!nodes.isEmpty()) {
                array = new JSONArray();
            }

            Iterator nodeIterator = nodes.iterator();
            while (nodeIterator.hasNext()) {
                Node node = (Node) nodeIterator.next();
                boolean processChildren = true;


                // String name = node.getText();
                String path = node.valueOf("@id");
                String name = node.valueOf("branchText");
                //debug("Processing branch: " + path);

                JSONObject json = new JSONObject();
                json.put("name", name);
                json.put("id", path);
                // put solution and path

                String[] pathArray = path.split("\\/");
                path = path.replace(pathArray[1], "solution");

                String solutionName = pathArray.length > 2 ? pathArray[2] : "";
                String solutionPath = pathArray.length > 3 ? path.substring(path.indexOf("/", 10) + 1) : "";
                json.put("solution", solutionName);
                json.put("path", solutionPath);
                json.put("type", TYPE_DIR);

                if (path.startsWith("/solution/")) {
                    String resourcePath = path.substring(9);
                    //try {
                    String resourceName = resourcePath + "/" + SolutionRepositoryBase.INDEX_FILENAME;
                    if (solutionRepository.resourceExists(resourceName)) {
                        System.out.println("Processing folder " + resourcePath);

                        ISolutionFile file = solutionRepository.getFileByPath(resourceName);
                        Document indexFile = solutionRepository.getResourceAsDocument(resourceName);
                        solutionRepository.localizeDoc(indexFile, file);

                        boolean visible = Boolean.parseBoolean(indexFile.valueOf("/index/visible"));
                        json.put("visible", visible);
                        json.put("title", indexFile.valueOf("/index/name"));
                        json.put("description", indexFile.valueOf("/index/description"));
                        if (!visible) {
                            processChildren = false;
                        }
                    //System.out.println("... done processing folder " + resourcePath);

                    } else {
                        json.put("visible", false);
                        json.put("title", "Hidden");

                        processChildren = false;

                    }

                } else {
                    // root dir
                    json.put("visible", true);
                    json.put("title", "Solution");
                }

                //System.out.println("  Processing getting children ");
                if (processChildren) {
                    JSONArray children = processTree(node);
                    if (children != null) {
                        json.put("folders", children);
                    }
                }

                array.put(json);

            }

        } catch (Exception e) {
            System.out.println("Error: " + e.getClass().getName() + " - " + e.getMessage());
            warn("Error: " + e.getClass().getName() + " - " + e.getMessage());
        }

        return array;
    }

    private String getContentListJSON(String _solution, String _path) throws JSONException {

        Document navDoc = solutionRepository.getSolutionTree(ISolutionRepository.ACTION_EXECUTE);

        // Get it and build the tree

        JSONObject contentListJSON = new JSONObject();

        Node tree = navDoc.getRootElement();

        String solutionPrefix = tree.valueOf("/tree/branch/@id");
        StringBuffer _id = new StringBuffer(solutionPrefix);
        if (_solution.length() > 0) {
            _id.append("/" + _solution);
        }
        if (_path.length() > 0) {
            _id.append("/" + _path);
        }

        //branch[@id='/solution/admin' and @isDir='true']/leaf
        String xPathDirBranch = "//branch[@id='" + _id.toString() + "' and @isDir='true']/branch";
        String xPathDirLeaf = "//branch[@id='" + _id.toString() + "' and @isDir='true']/leaf";

        JSONArray array = null;

        // Iterate through branches

        try {
            
            List nodes = tree.selectNodes(xPathDirBranch); //$NON-NLS-1$
            if (!nodes.isEmpty()) {
                array = new JSONArray();
            }

            Iterator nodeIterator = nodes.iterator();
            while (nodeIterator.hasNext()) {
                Node node = (Node) nodeIterator.next();

                // String name = node.getText();
                String path = node.valueOf("@id");
                String name = node.valueOf("branchText");
                //debug("Processing branch: " + path);

                JSONObject json = new JSONObject();
                json.put("name", name);
                json.put("id", path);
                json.put("solution", _solution);
                json.put("path", _path + (_path.length() > 0 ? "/" : "") + name);
                json.put("type", TYPE_DIR);

                if (path.startsWith((solutionPrefix + "/"))) {
                    String resourcePath = path.substring(9);
                    //try {
                    String resourceName = resourcePath + "/" + SolutionRepositoryBase.INDEX_FILENAME;
                    if (solutionRepository.resourceExists(resourceName)) {
                        System.out.println("Processing folder " + resourcePath);

                        ISolutionFile file = solutionRepository.getFileByPath(resourceName);
                        Document indexFile = solutionRepository.getResourceAsDocument(resourceName);
                        solutionRepository.localizeDoc(indexFile, file);

                        json.put("visible", new Boolean(indexFile.valueOf("/index/visible")));
                        json.put("title", indexFile.valueOf("/index/name"));
                        json.put("description", indexFile.valueOf("/index/description"));

                    //System.out.println("... done processing folder " + resourcePath);

                    } else {
                        json.put("visible", false);
                        json.put("title", "Hidden");

                    }

                } else {
                    // root dir
                    json.put("visible", true);
                    json.put("title", "Solution");
                }

                array.put(json);

            }

        } catch (Exception e) {
            System.out.println("Error: " + e.getClass().getName() + " - " + e.getMessage());
            warn("Error: " + e.getClass().getName() + " - " + e.getMessage());
        }

        // Iterate through leaves

        try {
            List nodes = tree.selectNodes(xPathDirLeaf); //$NON-NLS-1$
            if (array == null && !nodes.isEmpty()) {
                array = new JSONArray();
            }

            Iterator nodeIterator = nodes.iterator();
            while (nodeIterator.hasNext()) {
                Element node = (Element) nodeIterator.next();

                // String name = node.getText();
                String path = node.valueOf("path");
                String name = node.valueOf("leafText");

                JSONObject json = new JSONObject();
                json.put("name", name);
                json.put("id", path);
                json.put("solution", _solution);
                json.put("path", _path);
                json.put("action", name);

                // we only care for: .xactions and .url files
                if (name.toLowerCase().endsWith(".xaction")) {

                    json.put("type", TYPE_XACTION);

                    String resourcePath = path.replace(solutionPrefix,"solution").substring(9);

                    String resourceName = resourcePath;
                    if (solutionRepository.resourceExists(resourceName)) {
                        System.out.println("Processing file " + resourcePath);

                        ISolutionFile file = solutionRepository.getFileByPath(resourceName);
                        Document indexFile = solutionRepository.getResourceAsDocument(resourceName);
                        solutionRepository.localizeDoc(indexFile, file);

                        json.put("visible", indexFile.selectNodes("/action-sequence/documentation/result-type").size() == 0 || indexFile.valueOf("/action-sequence/documentation/result-type").equals("none") ? Boolean.FALSE : Boolean.TRUE);
                        json.put("title", indexFile.valueOf("/action-sequence/title"));
                        json.put("description", indexFile.valueOf("/action-sequence/documentation/description"));

                    //System.out.println("... done processing folder " + resourcePath);

                    } else {
                        json.put("visible", false);
                        json.put("title", "Hidden");
                    }


                } else if (name.toLowerCase().endsWith(".url")) {

                    json.put("type", TYPE_URL);
                    String resourcePath = path.replace(solutionPrefix,"solution").substring(9);
                    String resourceName = resourcePath;
                    ISolutionFile file = solutionRepository.getFileByPath(resourceName);
                    processUrl(file, node, resourceName);
                    json.put("visible", new Boolean(node.valueOf("file/@visible")));
                    json.put("title", node.valueOf("file/title"));
                    json.put("description", node.valueOf("file/description"));
                    json.put("url", node.valueOf("file/url"));

                } else { //ignore other files
                    continue;
                }
                array.put(json);


            }

        } catch (Exception e) {
            System.out.println("Error: " + e.getClass().getName() + " - " + e.getMessage());
            warn("Error: " + e.getClass().getName() + " - " + e.getMessage());
        }



        contentListJSON.put("content", array);

        String jsonString = contentListJSON.toString(2);
        //debug("Finished processing tree");

        //RepositoryFile file = (RepositoryFile) getFileByPath(fullPath);

        return jsonString;

    }

    private void processUrl(ISolutionFile file, Element parentNode, String resourceName) {

        // parse the .url file to get the contents
        try {
            String urlContent = solutionRepository.getResourceAsString(resourceName);
            StringTokenizer tokenizer = new StringTokenizer(urlContent, "\n"); //$NON-NLS-1$
            String title = null;
            String url = null;
            String description = null;
            String target = null;
            while (tokenizer.hasMoreTokens()) {
                String line = tokenizer.nextToken();
                int pos = line.indexOf('=');
                if (pos > 0) {
                    String name = line.substring(0, pos);
                    String value = line.substring(pos + 1);
                    if ((value != null) && (value.length() > 0) && (value.charAt(value.length() - 1) == '\r')) {
                        value = value.substring(0, value.length() - 1);
                    }
                    if ("URL".equalsIgnoreCase(name)) { //$NON-NLS-1$
                        url = value;
                    }
                    if ("name".equalsIgnoreCase(name)) { //$NON-NLS-1$
                        title = value;
                    }
                    if ("description".equalsIgnoreCase(name)) { //$NON-NLS-1$
                        description = value;
                    }
                    if ("target".equalsIgnoreCase(name)) { //$NON-NLS-1$
                        target = value;
                    }
                }
            }
            if (url != null) {
                // now create an entry for the database
                Element dirNode = parentNode.addElement("file"); //$NON-NLS-1$
                dirNode.addAttribute("type", TYPE_URL); //$NON-NLS-1$
                dirNode.addElement("filename").setText(title); //$NON-NLS-1$
                dirNode.addElement("title").setText(title); //$NON-NLS-1$
                if (target != null) {
                    dirNode.addElement("target").setText(target); //$NON-NLS-1$
                }
                if (description != null) {
                    dirNode.addElement("description").setText(description); //$NON-NLS-1$
                }
                dirNode.addElement("url").setText(url); //$NON-NLS-1$
                dirNode.addAttribute("visible", "true"); //$NON-NLS-1$ //$NON-NLS-2$
                solutionRepository.localizeDoc(dirNode, file);
            }
        } catch (IOException e) {
            warn("Error processing url file: " + e.getClass().getName() + " - " + e.getMessage());
        }
    }
}
