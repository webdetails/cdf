package org.pentaho.cdf;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.security.InvalidParameterException;
import java.util.Date;
import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Properties;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.pentaho.platform.api.engine.IActionSequenceResource;
import org.pentaho.platform.api.engine.ILogger;
import org.pentaho.platform.api.engine.IMimeTypeListener;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.engine.IUITemplater;
import org.pentaho.platform.api.repository.IContentItem;
import org.pentaho.platform.api.repository.ISolutionRepository;
import org.pentaho.platform.engine.core.solution.ActionInfo;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.engine.services.actionsequence.ActionResource;
import org.pentaho.platform.engine.services.solution.BaseContentGenerator;
import org.pentaho.platform.util.web.MimeHelper;
import org.pentaho.platform.util.xml.dom4j.XmlDom4JHelper;

import pt.webdetails.cdf.NavigateComponent;

/**
 * This is the main class of the CDF plugin.  It handles all requests to 
 * /pentaho/content/pentaho-cdf.  These requests include:
 * 
 * - JSONSolution
 * - GetCDFResource
 * - .xcdf requests
 * - js files
 * - files within resources 
 * 
 * @author Will Gorman (wgorman@pentaho.com)
 */
public class CdfContentGenerator extends BaseContentGenerator {

  private static final long serialVersionUID = 5608691656289862706L;

  public static final String PLUGIN_NAME = "pentaho-cdf"; //$NON-NLS-1$
  
  public static final String JSON_SOLUTION = "/JSONSolution"; //$NON-NLS-1$
  
  private static final String MIMETYPE = "text/html"; //$NON-NLS-1$
  
  private static final String SCRIPT_PATH = "/js/"; //$NON-NLS-1$
  
  private static final String RESOURCE_PATH = "/resources/"; //$NON-NLS-1$
  
  private static final String GET_CDF_RESOURCE = "/GetCDFResource"; //$NON-NLS-1$
  
  @Override
  public void createContent() throws Exception {
    
    // make sure we have an output stream, cannot do anything without one
    OutputStream out = null;
    if( outputHandler == null ) {
      error( Messages.getErrorString("CdfContentGenerator.ERROR_0001_NO_OUTPUT_HANDLER") ); //$NON-NLS-1$
      throw new InvalidParameterException( Messages.getString("CdfContentGenerator.ERROR_0001_NO_OUTPUT_HANDLER") );  //$NON-NLS-1$
    }

    IContentItem contentItem = outputHandler.getOutputContentItem( "response", "content", "", instanceId, MIMETYPE); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$

    if( contentItem == null ) {
      error( Messages.getErrorString("CdfContentGenerator.ERROR_0002_NO_CONTENT_ITEM") ); //$NON-NLS-1$
      throw new InvalidParameterException( Messages.getString("CdfContentGenerator.ERROR_0002_NO_CONTENT_ITEM") );  //$NON-NLS-1$
    }
    
    out = contentItem.getOutputStream( null );
    if( out == null ) {
      error( Messages.getErrorString("CdfContentGenerator.ERROR_0003_NO_OUTPUT_STREAM") ); //$NON-NLS-1$
      throw new InvalidParameterException( Messages.getString("CdfContentGenerator.ERROR_0003_NO_OUTPUT_STREAM") );  //$NON-NLS-1$
    }

    // see if we have any url path after us on the URL, e.g. pentaho/content/pentaho-cdf/JSONSolution, etc
    IParameterProvider pathParams = parameterProviders.get( "path" ); //$NON-NLS-1$
    
    // get the request parameters
    IParameterProvider requestParams = parameterProviders.get( IParameterProvider.SCOPE_REQUEST );
    
    if( pathParams != null ) {
      String urlPath = pathParams.getStringParameter( "path", null); //$NON-NLS-1$
      
      if( StringUtils.isNotEmpty( urlPath ) ) {
        
        // load json solution navigator
        if (urlPath.startsWith(JSON_SOLUTION)) {
          if( requestParams == null ) {
            error( Messages.getErrorString("CdfContentGenerator.ERROR_0004_NO_REQUEST_PARAMS") ); //$NON-NLS-1$
            throw new InvalidParameterException( Messages.getString("CdfContentGenerator.ERROR_0017_NO_REQUEST_PARAMS") );  //$NON-NLS-1$
          }
          
          String solution = requestParams.getStringParameter("solution", null); //$NON-NLS-1$
          String path = requestParams.getStringParameter("path", null); //$NON-NLS-1$
          String mode = requestParams.getStringParameter("mode", null); //$NON-NLS-1$
          NavigateComponent nav = new NavigateComponent(userSession);
          String json = nav.getNavigationElements(mode, solution, path);
          PrintWriter pw = new PrintWriter(out);
          pw.println(json);
          return;
        }
        
        if (urlPath.startsWith(GET_CDF_RESOURCE)) {
          if( requestParams == null ) {
            error( Messages.getErrorString("CdfContentGenerator.ERROR_0004_NO_REQUEST_PARAMS") ); //$NON-NLS-1$
            throw new InvalidParameterException( Messages.getString("CdfContentGenerator.ERROR_0017_NO_REQUEST_PARAMS") );  //$NON-NLS-1$
          }
          
          String resource = requestParams.getStringParameter("resource", null); //$NON-NLS-1$
          contentItem.setMimeType(MimeHelper.getMimeTypeFromFileName(urlPath));
          getSolutionFile(resource, out, this);
          return;
          
        }
        
        // assume this to be a relative path within the theme
        if( urlPath.startsWith( SCRIPT_PATH )  || urlPath.startsWith(RESOURCE_PATH)) { 
          // return top level scripts, e.g. pentaho/dashboards/script/default/...
          contentItem.setMimeType(MimeHelper.getMimeTypeFromFileName(urlPath));
          getContent( urlPath, PLUGIN_NAME, out, this );
          return;
        } 
        
      }
    }
    
    if( requestParams == null ) {
      error( Messages.getErrorString("CdfContentGenerator.ERROR_0017_NO_REQUEST_PARAMS") ); //$NON-NLS-1$
      throw new InvalidParameterException( Messages.getString("CdfContentGenerator.ERROR_0017_NO_REQUEST_PARAMS") );  //$NON-NLS-1$
    }
    
    IMimeTypeListener mimeTypeListener = outputHandler.getMimeTypeListener();
    if( mimeTypeListener != null ) {
      mimeTypeListener.setMimeType( MIMETYPE );
    }
   
    String solution = requestParams.getStringParameter("solution", null); //$NON-NLS-1$
    String path = requestParams.getStringParameter("path", null); //$NON-NLS-1$
    String action = requestParams.getStringParameter("action", null); //$NON-NLS-1$
    String template = requestParams.getStringParameter("template", null); //$NON-NLS-1$

    // now render it as HTML
    renderDashboard( out, solution, path, action, template );
  }
  
  /**
   * renders a .xcdf file.  This replaces Dashboards.jsp.
   * 
   * @param out the output stream to write to
   * @param solution the xcdf solution folder
   * @param path the xcdf path within a solution
   * @param action the xcdf 
   * @param template the parent CDF template, either "" or "-mantle" 
   * @throws Exception
   */
  public void renderDashboard(OutputStream out, String solution, String path, String action, String template) throws Exception {
    
    String fullPath = ActionInfo.buildSolutionPath(solution, path, action);
    
    if (template == null || template.equals("")) {
      template = "";
    } else {
      template = "-"+template;
    }

    ISolutionRepository repository = PentahoSystem.get(ISolutionRepository.class, userSession);
    // String baseUrl = PentahoSystem.getApplicationContext().getBaseUrl();
    // String hrefUrl = baseUrl + "content/" + PLUGIN_NAME; //$NON-NLS-1$

    String intro = ""; //$NON-NLS-1$
    String footer = ""; //$NON-NLS-1$

    String dashboardTemplate = "template-dashboard" + template + ".html"; //$NON-NLS-1$
    
    IUITemplater templater = PentahoSystem.get(IUITemplater.class, userSession);
    if (templater != null) {
        ActionResource templateResource = new ActionResource("", IActionSequenceResource.SOLUTION_FILE_RESOURCE, "text/xml", "system/" + PLUGIN_NAME + "/" + dashboardTemplate); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
        String templateContent = repository.getResourceAsString(templateResource);
        String sections[] = templater.breakTemplateString(templateContent, "", userSession); //$NON-NLS-1$
        if (sections != null && sections.length > 0) {
            intro = sections[0];
        }
        if (sections != null && sections.length > 1) {
            footer = sections[1];
        }
    } else {
        intro = Messages.getErrorString("CdfContentGenerator.ERROR_0005_BAD_TEMPLATE_OBJECT");
    }

    String dashboardContent = "";

    ActionResource resource;

    String fullTemplatePath = null;
    
    if (repository.resourceExists(fullPath)) {
      resource = new ActionResource("", IActionSequenceResource.SOLUTION_FILE_RESOURCE, "text/xml", //$NON-NLS-1$ //$NON-NLS-2$ 
          fullPath); 
      String dashboardMetadata = dashboardContent = repository.getResourceAsString(resource);
      Document doc = DocumentHelper.parseText(dashboardMetadata);
      String templateName = XmlDom4JHelper.getNodeText( "/cdf/template", doc, "");  //$NON-NLS-1$ //$NON-NLS-2$

      if (templateName.startsWith("/") || templateName.startsWith("\\")) { //$NON-NLS-1$ //$NON-NLS-2$
        fullTemplatePath = templateName;
      } else {
        fullTemplatePath = ActionInfo.buildSolutionPath(solution, path, templateName);
      }
    }
    if (fullTemplatePath != null && repository.resourceExists(fullTemplatePath)) {
      resource = new ActionResource("", IActionSequenceResource.SOLUTION_FILE_RESOURCE, "text/xml", //$NON-NLS-1$ //$NON-NLS-2$ 
          fullTemplatePath); 
    } else {
      resource = new ActionResource("", IActionSequenceResource.SOLUTION_FILE_RESOURCE, "text/xml", //$NON-NLS-1$ //$NON-NLS-2$ 
          "system/" + PLUGIN_NAME + "/default-dashboard-template.html"); //$NON-NLS-1$ //$NON-NLS-2$
    }
    
    dashboardContent = repository.getResourceAsString(resource);

    intro = intro.replaceAll("\\{load\\}", "onload=\"load()\""); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$

    intro = intro.replaceAll("\\{body-tag-unload\\}", "");

    /************************************************/
    /*      Add cdf libraries 
    /************************************************/

    Date startDate = new Date();
    int headIndex = intro.indexOf("<head>");
    int length = intro.length();
    Hashtable addedFiles = new Hashtable();
    
    //Read resource file properties
    File file = new File(PentahoSystem.getApplicationContext().getSolutionPath(
        "system/"+PLUGIN_NAME+"/resources.txt" ));
    
    Properties resources = new Properties();
    resources.load(new FileInputStream(file));
  
    // Add common libraries
    Hashtable commonLibraries = new Hashtable();
    commonLibraries.put("script",resources.getProperty("commonLibrariesScript","").split(","));
    commonLibraries.put("link",resources.getProperty("commonLibrariesLink","").split(","));
    String javaScriptLibrary = concatFiles("",addedFiles, commonLibraries);

    //Add extra components libraries
    Enumeration resourceKeys = resources.propertyNames();
    while (resourceKeys.hasMoreElements()) {
    
      String scriptkey = (String) resourceKeys.nextElement();
      
      if(scriptkey.indexOf("Script") != -1 && scriptkey.indexOf("commonLibraries") == -1 ){
    
        String key = scriptkey.replaceAll("Script","");
        String linkKey = scriptkey.replaceAll("Script","Link");
      
        int keyIndex = dashboardContent.indexOf(key);
        if(keyIndex != -1) {
          if(matchComponent(keyIndex, key, dashboardContent)){
            Hashtable component = new Hashtable();
            component.put("link",resources.getProperty(linkKey,"").split(","));
            component.put("script",resources.getProperty(scriptkey,"").split(","));
            javaScriptLibrary  = concatFiles(javaScriptLibrary,addedFiles,component);
          }
        }
      }
    }

    // adjust the relative path of pentahoRoot
    javaScriptLibrary += "<script>Dashboards.pentahoRoot='../';</script>\n";

    //Concat libraries to html head content
    intro = intro.substring(0,headIndex-1) + javaScriptLibrary + intro.substring(headIndex,length-1);
    
    // clean up any references to pentaho-styles, replaced with references to plugin folder
    intro = intro.replaceAll("/pentaho-style", "/pentaho/content/" + PLUGIN_NAME + RESOURCE_PATH + "style");
    dashboardContent = dashboardContent.replaceAll("/pentaho-style", "/pentaho/content/" + PLUGIN_NAME + RESOURCE_PATH + "style");    
    footer = footer.replaceAll("/pentaho-style", "/pentaho/content/" + PLUGIN_NAME + RESOURCE_PATH + "style");
    
    // update the url of the cdf location
    intro = intro.replaceAll("GetCDFResource", PLUGIN_NAME + "/GetCDFResource");
    dashboardContent = dashboardContent.replaceAll("GetCDFResource", PLUGIN_NAME + "/GetCDFResource");
    footer = footer.replaceAll("GetCDFResource", PLUGIN_NAME + "/GetCDFResource");
    
    System.out.println("*** Finish: " + (new Date().getTime() - startDate.getTime()));
    PrintWriter pw = new PrintWriter(out);
    pw.println(intro);
    pw.println("<div id=\"dashboardContent\">");
    pw.println(dashboardContent);
    pw.println("</div>");
    pw.println(footer);
    pw.flush();
  }

  @Override
  public Log getLogger() {
    // TODO Auto-generated method stub
    return null;
  }

  public String concatFiles(String includeString, Hashtable filesAdded, Hashtable files){
    
    String newLine = System.getProperty("line.separator");
    Enumeration keys = files.keys();
    while (keys.hasMoreElements()) {
      
      String key = (String) keys.nextElement();
      String includeFiles[] = (String[]) files.get(key);
      
      for(int i = 0; i < includeFiles.length; i++){
        if(! filesAdded.containsKey(includeFiles[i])){
          
          filesAdded.put(includeFiles[i],'1');
          if(key.equals("script"))
            includeString += "<script language=\"javascript\" type=\"text/javascript\" src=\"" +  includeFiles[i] + "\"></script>" + newLine;
          else
            includeString += "<link rel=\"stylesheet\" href=\"" + includeFiles[i] + "\" type=\"text/css\" />";
            
        }
      }
    }
    
    return includeString;
  }

  public boolean matchComponent(int keyIndex, String key, String content){
  
    for(int i = keyIndex-1; i > 0; i--){
      if(content.charAt(i) == ':' || content.charAt(i) == '"' || new String(""+ content.charAt(i)).trim().equals(""))
        continue;
      else{
        if( (i-3) > 0 && content.substring((i-3),i+1).equals("type"))
          return true;
          
        break;
      }
    }
      
    keyIndex = content.indexOf(key,keyIndex +  key.length());
    if(keyIndex != -1) 
      return matchComponent(keyIndex,key,content);
        
    return false;
  }
  
  /**
   * gets content from within the plugin folder
   * 
   * @param fileName the location within the plugin
   * @param pluginName the plugin name.
   * @param out the output stream to write to
   * @param logger
   * @throws Exception
   */
  public void getContent( String fileName, String pluginName, OutputStream out, ILogger logger ) throws Exception {

    // write out the scripts
    // TODO support caching
    String path = PentahoSystem.getApplicationContext().getSolutionPath( "system/" + pluginName + fileName ); //$NON-NLS-1$ //$NON-NLS-2$
    File file = new File( path );
    InputStream in = new FileInputStream( file );
    byte buff[] = new byte[4096];
    int n = in.read( buff );
    while( n != -1 ) {
      out.write(buff, 0, n);
      n = in.read( buff );
    }
    in.close();
  }
  
  public void getSolutionFile( String resourcePath, OutputStream out, ILogger logger ) throws Exception {
    ISolutionRepository repository = PentahoSystem.get(ISolutionRepository.class, userSession);
    InputStream in = repository.getResourceInputStream(resourcePath, true);
    byte buff[] = new byte[4096];
    int n = in.read( buff );
    while( n != -1 ) {
      out.write(buff, 0, n);
      n = in.read( buff );
    }
    in.close();
  }
  
}
