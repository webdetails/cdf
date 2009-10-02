/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package org.pentaho.cdf;

import java.util.Iterator;
import java.util.List;
import javax.xml.parsers.ParserConfigurationException;
import org.pentaho.platform.engine.core.system.PentahoBase;
import org.pentaho.platform.api.repository.ISolutionRepository;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.api.engine.ICacheManager;
import org.pentaho.platform.web.servlet.SolutionRepositoryService;
import org.apache.commons.logging.LogFactory;
import org.apache.commons.logging.Log;
import org.dom4j.Document;
import org.dom4j.Node;
import org.dom4j.io.DOMReader;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;

/**
 *
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
	private static final String CACHE_NAVIGATOR = "CDF_NAVIGATOR_JSON";
	private static final String CACHE_REPOSITORY_DOCUMENT = "CDF_REPOSITORY_DOCUMENT";
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
    
    public String getNavigationElements(String mode, String solution, String path) throws JSONException, ParserConfigurationException {


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
    private Document getRepositoryDocument(IPentahoSession userSession) throws ParserConfigurationException {    	//
    	 Document repositoryDocument;
    	if (cachingAvailable && (repositoryDocument = (Document) cacheManager.getFromSessionCache(userSession, CACHE_REPOSITORY_DOCUMENT)) != null){
    		getLogger().debug("Repository Document found in cache");
    		return repositoryDocument;
    	}
    	else{
    		//System.out.println(Calendar.getInstance().getTime() + ": Getting repository Document");
    		DOMReader reader = new DOMReader();
    		repositoryDocument =  reader.read(new SolutionRepositoryService().getSolutionRepositoryDoc(userSession,new String [0]));
    		cacheManager.putInSessionCache(userSession, CACHE_REPOSITORY_DOCUMENT, repositoryDocument);
    		//System.out.println(Calendar.getInstance().getTime() + ": Repository Document Returned");
    	}
		return repositoryDocument;
	}

    private String getNavigatorJSON(String solution, String path) {

        String jsonString = null;

        if (cachingAvailable && (jsonString = (String) cacheManager.getFromSessionCache(userSession, CACHE_NAVIGATOR)) != null) {
        	debug("Navigator found in cache");
        } else {
        	
			try {
				
				Document navDoc = getRepositoryDocument(this.userSession);
           
	            // Get it and build the tree
	            JSONObject json = new JSONObject();
	
	            Node tree = navDoc.getRootElement();
	            JSONArray array = processTree(tree,"/");
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
	private JSONArray processTree(Node tree,String parentPath)  {

        String xPathDir =  "./file[@isDirectory='true']" ; //$NON-NLS-1$
        JSONArray array = null;
        
        try {
            
        	List nodes = tree.selectNodes(xPathDir); //$NON-NLS-1$
            if (!nodes.isEmpty()) {
                array = new JSONArray();
            }
        
            String[] parentPathArray = parentPath.split("/");
            String solutionName = parentPathArray.length > 2 ? parentPathArray[2] : ""; 
            String solutionPath = parentPathArray.length > 3 ? parentPath.substring(parentPath.indexOf(solutionName) + solutionName.length()+1,parentPath.length()) + "/" : "";

            Iterator nodeIterator = nodes.iterator();
            while (nodeIterator.hasNext()) {
                
            	Node node = (Node) nodeIterator.next();
                JSONObject json = new JSONObject();
                JSONObject jsonChild = new JSONObject();
                JSONArray children = null;
                JSONArray files = null;
                String name = node.valueOf("@name");
               
                if (parentPathArray.length > 0){
                	
                	
                    String localizedName = node.valueOf("@localized-name");
                	String description = node.valueOf("@description");
                	boolean visible = node.valueOf("@visible").equals("true");
                	boolean isDirectory = node.valueOf("@isDirectory").equals("true");
                	
	                json.put("id",parentPath + "/" + name );
	                json.put("name", name);
	                json.put("solution", solutionName.length() == 0 ? name : solutionName);
	                json.put("path", solutionName.length() == 0 ? "" : solutionPath + name);
	                json.put("type", TYPE_DIR);
                	json.put("visible", visible);
                    json.put("title", visible ? localizedName:  "Hidden" );
                    json.put("description",description);
                	
                    if (visible && isDirectory){
                    	children = processTree(node,parentPath + "/" + name);
                    	files = new JSONArray();
                    	
                    	//Process directory wcdf/xcdf files
                    	List fileNodes = node.selectNodes("./file[@isDirectory='false'][ends-with(string(@name),'.xcdf') or ends-with(string(@name),'.wcdf')]");
                    	
                    	Iterator fileNodesIterator = fileNodes.iterator();
                        while (fileNodesIterator.hasNext()) {
                        	
                        	Node chilNode = (Node) fileNodesIterator.next();
                        	name = chilNode.valueOf("@name");
                        	String type = name.substring(name.lastIndexOf(".")+1,name.length());	
                        		
                        	jsonChild = new JSONObject();
                        	jsonChild.put("file", name);
                        	jsonChild.put("solution",json.get("solution"));
                        	jsonChild.put("path",json.get("path"));
                        	jsonChild.put("type",type);
                        	jsonChild.put("visible", chilNode.valueOf("@visible").equals("true"));
                        	jsonChild.put("title",  chilNode.valueOf("@localized-name"));
                        	jsonChild.put("description",  chilNode.valueOf("@description"));
                        	files.put(jsonChild);
                        }
                        json.put("files",files);
                    }
                    
                } else {
                    // root dir
 	                json.put("id",tree.valueOf("@path"));
 	                json.put("name", solutionName);
 	                json.put("path", solutionPath);
                    json.put("visible", true);
                    json.put("title", "Solution");
                    children = processTree(tree,tree.valueOf("@path"));
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
	private String getContentListJSON(String _solution, String _path) {
    	
    	 String jsonString = null;
    	 JSONArray array = null;
    	  
    	 try {
    		 
	    	 JSONObject contentListJSON = new JSONObject();
	    	 
	    	 Document navDoc = getRepositoryDocument(this.userSession);
	    	 Node tree = navDoc.getRootElement();
	    	 String xPathDir =  "./file[@name='" + _solution + "']" ; //$NON-NLS-1$
            
        	 List nodes = tree.selectNodes(xPathDir); //$NON-NLS-1$
             if (!nodes.isEmpty() && nodes.size() == 1) {

            	 array = new JSONArray();

            	 //Add Folder
            	 Node node = getDirectoryNode((Node) nodes.get(0),_path);
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
	        	 Iterator nodeIterator = nodes.iterator();
	        	 	
	             //Add Folder Content
	        	 while (nodeIterator.hasNext()) {
                     
                 	Node chilNode = (Node) nodeIterator.next();
                 	String name = chilNode.valueOf("@name");
                 	String localizedName = chilNode.valueOf("@localized-name");
                 	String description = chilNode.valueOf("@description");
                 	String type =  chilNode.valueOf("@isDirectory").equals("true") ? TYPE_DIR :name.endsWith(".xaction") ? TYPE_XACTION :name.endsWith(".url") ? TYPE_URL : name.endsWith(".xcdf") ? TYPE_XCDF : name.endsWith(".wcdf") ? TYPE_WCDF : null;
                 	boolean visible = chilNode.valueOf("@visible").equals("true");
                 		 
                 	if(type != null){
                 		
                 		String path = type.equals(TYPE_DIR) ? (_path.length() > 0 ? _path + "/" + name : name) : _path;
                        String url = type != null && type.equals(TYPE_URL) ? (!chilNode.valueOf("@url").startsWith("http") && !chilNode.valueOf("@url").startsWith(CdfContentGenerator.BASE_URL) && !chilNode.valueOf("@url").startsWith("/") ? CdfContentGenerator.BASE_URL + "/" + chilNode.valueOf("@url") : chilNode.valueOf("@url") ) : null;
						
                        json = new JSONObject();
						json.put("name", name);
						json.put("id", _solution + "/" + _path + "/" + name);
						json.put("solution", _solution);
						json.put("path",path);
						json.put("type",type);
						json.put("visible", visible);
						json.put("title", localizedName);
						json.put("description", description);
						if(type.equals(TYPE_XCDF) || type.equals(TYPE_WCDF)) json.put("file",name);
						if(type.equals(TYPE_XACTION)) json.put("action", name);
						if(type.equals(TYPE_URL)) json.put("url",url);
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
	private Node getDirectoryNode(Node node ,String _path){
    	
    	String[] pathArray = _path.split("/");
    	if(pathArray.length > 0){
    		
    		String path = pathArray[0];
    		 String xPathDir =  "./file[@name='" + path + "']" ; //$NON-NLS-1$
    		 List nodes = node.selectNodes(xPathDir); //$NON-NLS-1$
    		 if (!nodes.isEmpty() && nodes.size() == 1) {
    			 node = (Node) nodes.get(0);
    			 if(!_path.equals(path))
    				 node = getDirectoryNode(node,_path.substring(_path.indexOf(path)+ path.length() + 1,_path.length()));
            	 
             }
             else
            	 return node;

    	}
    	
    	return node;
    }
}
