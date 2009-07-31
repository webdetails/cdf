package org.pentaho.cdf;

import java.io.*;

import java.security.InvalidParameterException;
import java.util.Date;
import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Properties;
import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.ParserConfigurationException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.export.Export;
import org.pentaho.cdf.export.ExportCSV;
import org.pentaho.cdf.export.ExportExcel;
import org.pentaho.platform.api.engine.IActionSequenceResource;
import org.pentaho.platform.api.engine.ILogger;
import org.pentaho.platform.api.engine.IMimeTypeListener;
import org.pentaho.platform.api.engine.IOutputHandler;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.engine.IPluginResourceLoader;
import org.pentaho.platform.api.engine.IUITemplater;
import org.pentaho.platform.api.repository.IContentItem;
import org.pentaho.platform.api.repository.ISolutionRepository;
import org.pentaho.platform.engine.core.solution.ActionInfo;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.engine.services.actionsequence.ActionResource;
import org.pentaho.platform.engine.services.solution.BaseContentGenerator;
import org.pentaho.platform.util.web.MimeHelper;
import org.pentaho.platform.util.xml.dom4j.XmlDom4JHelper;



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

	private static final Log logger = LogFactory.getLog(CdfContentGenerator.class);

	public static final String PLUGIN_NAME = "pentaho-cdf"; //$NON-NLS-1$

	private static final String MIMETYPE = "text/html"; //$NON-NLS-1$

	// Possible actions 
	public static final String RENDER_HTML = "/RenderHTML";
	public static final String RENDER_XCDF = "/RenderXCDF";
	public static final String JSON_SOLUTION = "/JSONSolution"; //$NON-NLS-1$
	public static final String GET_CDF_RESOURCE = "/GetCDFResource"; //$NON-NLS-1$
	public static final String EXPORT = "/Export"; //$NON-NLS-1$
	public static final String SETTINGS = "/Settings"; //$NON-NLS-1$
	public static final String CALLACTION = "/CallAction"; //$NON-NLS-1$  

	// CDF Resource BaseURL
	private static final String BASE_URL_TAG = "@BASE_URL@";
	private static final String BASE_URL = "/" + PentahoSystem.getApplicationContext().getBaseUrl().split("[/]+")[2];

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

		String urlPath = pathParams.getStringParameter( "path", null); //$NON-NLS-1$

		findMethod(urlPath,contentItem,out);

	}

	private void findMethod(String urlPath,IContentItem contentItem, OutputStream out) throws Exception{

		// Each block will call a different method. If in the future this extends a lot we can think
		// about using reflection for class loading, but I don't expect that to happen.

		IParameterProvider requestParams = parameterProviders.get( IParameterProvider.SCOPE_REQUEST );

		if (urlPath.equals(RENDER_XCDF) ){

			renderXcdf(out, requestParams);

		}
		else if (urlPath.equals(JSON_SOLUTION)){

			jsonSolution(out, requestParams);	          
		}

		else  if (urlPath.equals(GET_CDF_RESOURCE)){

			getCDFResource(urlPath, contentItem, out, requestParams);
		}
		
		else if (urlPath.equals(RENDER_HTML)){

			renderHtml(out, requestParams);
		}
		
		else if (urlPath.equals(EXPORT)){
			exportFile(requestParams, outputHandler);
		}
		
		else if (urlPath.equals(SETTINGS)){
			cdfSetttings(requestParams, out);
		}
		
		else if (urlPath.equals(CALLACTION)){
			callAction(requestParams, out);
		}
		
		else{
			// we'll be providing the actual content with cache
			returnResource(urlPath, contentItem, out);	

		}

	}
	
	private void renderXcdf(OutputStream out, IParameterProvider requestParams) throws Exception {
		IMimeTypeListener mimeTypeListener = outputHandler.getMimeTypeListener();
		if( mimeTypeListener != null ) {
			mimeTypeListener.setMimeType( MIMETYPE );
		}

		String solution = requestParams.getStringParameter("solution", null); //$NON-NLS-1$
		String path = requestParams.getStringParameter("path", null); //$NON-NLS-1$
		String template = requestParams.getStringParameter("template", null); //$NON-NLS-1$

		String action = requestParams.getStringParameter("action", null); //$NON-NLS-1$
		renderXCDFDashboard( out, solution, path, action, template );
	}
	
	private void jsonSolution(OutputStream out, IParameterProvider requestParams)throws JSONException, ParserConfigurationException {
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
		pw.flush();
	}
	
	private void getCDFResource(String urlPath, IContentItem contentItem, OutputStream out, IParameterProvider requestParams) 
	throws Exception {
		if( requestParams == null ) {
			error( Messages.getErrorString("CdfContentGenerator.ERROR_0004_NO_REQUEST_PARAMS") ); //$NON-NLS-1$
			throw new InvalidParameterException( Messages.getString("CdfContentGenerator.ERROR_0017_NO_REQUEST_PARAMS") );  //$NON-NLS-1$
		}

		String resource = requestParams.getStringParameter("resource", null); //$NON-NLS-1$
		contentItem.setMimeType(MimeHelper.getMimeTypeFromFileName(urlPath));
		getSolutionFile(resource, out, this);
		return;
	}
	
	private void renderHtml(OutputStream out, IParameterProvider requestParams) throws Exception {
		IMimeTypeListener mimeTypeListener = outputHandler.getMimeTypeListener();
		if( mimeTypeListener != null ) {
			mimeTypeListener.setMimeType( MIMETYPE );
		}

		String solution = requestParams.getStringParameter("solution", null); //$NON-NLS-1$
		String template = requestParams.getStringParameter("template", null); //$NON-NLS-1$
		String path = requestParams.getStringParameter("path", null); //$NON-NLS-1$
		String templateName = requestParams.getStringParameter("dashboard",null);
		renderHtmlDashboard(out,solution,path,templateName == null ? "template.html" : templateName ,template);
	}

	private void returnResource(String urlPath, IContentItem contentItem, OutputStream out) throws Exception {
		IParameterProvider pathParams = parameterProviders.get( "path" ); //$NON-NLS-1$
		contentItem.setMimeType(MimeHelper.getMimeTypeFromFileName(urlPath));

		IPluginResourceLoader resLoader = PentahoSystem.get(IPluginResourceLoader.class, null);
		String maxAge = resLoader.getPluginSetting(CdfContentGenerator.class,"pentaho-cdf/max-age" );         
		HttpServletResponse response = (HttpServletResponse) pathParams.getParameter("httpresponse");
		if( maxAge != null && response != null) {
			response.setHeader( "Cache-Control","max-age=" + maxAge);
		}

		getContent( urlPath, out, this );
	}

	public void renderXCDFDashboard(OutputStream out, String solution, String path, String action, String template) throws Exception {

		String fullPath = ActionInfo.buildSolutionPath(solution, path, action);

		ISolutionRepository repository = PentahoSystem.get(ISolutionRepository.class, userSession);
		String templateName = null;
		if (repository.resourceExists(fullPath, ISolutionRepository.ACTION_EXECUTE)) {
			ActionResource resource = new ActionResource("", IActionSequenceResource.SOLUTION_FILE_RESOURCE, "text/xml", 
					fullPath); 
			String dashboardMetadata = repository.getResourceAsString(resource, ISolutionRepository.ACTION_EXECUTE);
			Document doc = DocumentHelper.parseText(dashboardMetadata);
			templateName = XmlDom4JHelper.getNodeText( "/cdf/template", doc, "");
            // If a "style" tag exists, use that one
            if(doc.selectSingleNode("/cdf/style") != null ){
                template = XmlDom4JHelper.getNodeText("/cdf/style", doc);
            }
		}
		renderHtmlDashboard(out,solution,path,templateName,template);
	}

	public void renderHtmlDashboard(OutputStream out, String solution, String path, String templateName, String template) throws Exception {

		if (template == null || template.equals("")) {
			template = "";
		} else {
			template = "-"+template;
		}

		ISolutionRepository repository = PentahoSystem.get(ISolutionRepository.class, userSession);

		String intro = ""; //$NON-NLS-1$
		String footer = ""; //$NON-NLS-1$

		String dashboardTemplate = "template-dashboard" + template + ".html"; //$NON-NLS-1$

		IUITemplater templater = PentahoSystem.get(IUITemplater.class, userSession);
		if (templater != null) {
			ActionResource templateResource = new ActionResource("", IActionSequenceResource.SOLUTION_FILE_RESOURCE, "text/xml", "system/" + PLUGIN_NAME + "/" + dashboardTemplate); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
			String templateContent = repository.getResourceAsString(templateResource, ISolutionRepository.ACTION_EXECUTE);
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

		if(templateName != null){
			if (templateName.startsWith("/") || templateName.startsWith("\\")) { //$NON-NLS-1$ //$NON-NLS-2$
				fullTemplatePath = templateName;
			} else {
				fullTemplatePath = ActionInfo.buildSolutionPath(solution, path, templateName);
			}
		}

		if (fullTemplatePath != null && repository.resourceExists(fullTemplatePath, ISolutionRepository.ACTION_EXECUTE)) {
			resource = new ActionResource("", IActionSequenceResource.SOLUTION_FILE_RESOURCE, "text/xml", //$NON-NLS-1$ //$NON-NLS-2$ 
					fullTemplatePath); 
		} else {
			resource = new ActionResource("", IActionSequenceResource.SOLUTION_FILE_RESOURCE, "text/xml", //$NON-NLS-1$ //$NON-NLS-2$ 
					"system/" + PLUGIN_NAME + "/default-dashboard-template.html"); //$NON-NLS-1$ //$NON-NLS-2$
		}

		dashboardContent = repository.getResourceAsString(resource, ISolutionRepository.ACTION_EXECUTE);

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

            String key = null;
            String type = null;

			if(scriptkey.indexOf("Script") != -1 && scriptkey.indexOf("commonLibraries") == -1 ){
				key = scriptkey.replaceAll("Script$","");
                type = "script";
            }
			else if(scriptkey.indexOf("Link") != -1 && scriptkey.indexOf("commonLibraries") == -1 ){
				key = scriptkey.replaceAll("Link$","");
                type = "link";
            }
            else{
                continue;
            }
			
            int keyIndex = dashboardContent.indexOf(key);
            if(keyIndex != -1) {
                if(matchComponent(keyIndex, key, dashboardContent)){
                    Hashtable component = new Hashtable();
                    component.put(type,resources.getProperty(scriptkey).split(","));
                    javaScriptLibrary  = concatFiles(javaScriptLibrary,addedFiles,component);
                }
            }
		}		

		//Concat libraries to html head content
		intro = intro.substring(0,headIndex+6) + javaScriptLibrary + intro.substring(headIndex+7,length-1);
		if (logger.isDebugEnabled()) {
		  logger.debug("*** Finish: " + (new Date().getTime() - startDate.getTime()));
		}
		PrintWriter pw = new PrintWriter(out);
		pw.println(intro);
		pw.println("<div id=\"dashboardContent\">");
		pw.println(dashboardContent);
		pw.println("</div>");
		pw.println(footer);
		pw.flush();
	}
	
	private void exportFile(IParameterProvider requestParams,IOutputHandler outputHandler) {
		
		try {
			
			ByteArrayOutputStream out = new ByteArrayOutputStream();
		
			ServiceCallAction serviceCallAction = ServiceCallAction.getInstance();
			if(serviceCallAction.execute(requestParams, userSession, out)){
		
				String exportType = requestParams.getStringParameter("exportType", "excel");
			
				Export export = exportType.equals("csv") ? new ExportCSV(outputHandler) : new ExportExcel(outputHandler);
					
				export.exportFile(new JSONObject(out.toString()));
			}
		
		} catch (IOException e) {
			e.printStackTrace();
		} catch (JSONException e) {
			e.printStackTrace();
		}
		
	}
	
	private void cdfSetttings(IParameterProvider requestParams,OutputStream out) throws IOException, JSONException{
		
		String method = requestParams.getStringParameter("method", null);
		String key = requestParams.getStringParameter("key", null);

		if(method.equals("set")){
			CdfSettings.getInstance().setValue(key,requestParams.getParameter("value"),userSession);
		}
		else{
				Object value = CdfSettings.getInstance().getValue(key, userSession);
				PrintWriter pw = new PrintWriter(out);
				pw.println(value!= null ? value.toString() : "");
				pw.flush();
		}
	}
	
	private void callAction(IParameterProvider requestParams,OutputStream out) throws JSONException {
	
		ServiceCallAction serviceCallAction = ServiceCallAction.getInstance();
		serviceCallAction.execute(requestParams, userSession, out);
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
						includeString += "<script language=\"javascript\" type=\"text/javascript\" src=\"" + includeFiles[i].replaceAll(BASE_URL_TAG,BASE_URL) + "\"></script>" + newLine;
					else
						includeString += "<link rel=\"stylesheet\" href=\"" + includeFiles[i].replaceAll(BASE_URL_TAG,BASE_URL) + "\" type=\"text/css\" />";
						
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

	
	public void getContent( String fileName, OutputStream out, ILogger logger ) throws Exception {

		// write out the scripts
		// TODO support caching
		String path = PentahoSystem.getApplicationContext().getSolutionPath( "system/" + PLUGIN_NAME + fileName ); //$NON-NLS-1$ //$NON-NLS-2$
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
		InputStream in = repository.getResourceInputStream(resourcePath, true, ISolutionRepository.ACTION_EXECUTE);
		byte buff[] = new byte[4096];
		int n = in.read( buff );
		while( n != -1 ) {
			out.write(buff, 0, n);
			n = in.read( buff );
		}
		in.close();
	}

}
