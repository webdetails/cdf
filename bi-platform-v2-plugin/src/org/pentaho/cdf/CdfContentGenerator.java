/*!
* Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
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

package org.pentaho.cdf;

import java.io.*;
import java.lang.reflect.Method;
import java.security.InvalidParameterException;
import java.text.SimpleDateFormat;
import java.util.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import static javax.ws.rs.core.MediaType.APPLICATION_XML;
import static javax.ws.rs.core.MediaType.APPLICATION_FORM_URLENCODED;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.io.FilenameUtils;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONArray;

import org.pentaho.cdf.context.ContextEngine;
import org.pentaho.cdf.export.Export;
import org.pentaho.cdf.export.ExportCSV;
import org.pentaho.cdf.export.ExportExcel;
import org.pentaho.cdf.render.CdfHtmlTemplateRenderer;
import org.pentaho.cdf.render.XcdfRenderer;
import org.pentaho.cdf.xactions.ActionEngine;
import org.pentaho.platform.api.engine.IMimeTypeListener;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.IPluginResourceLoader;
import org.pentaho.platform.api.repository2.unified.RepositoryFile;
import org.pentaho.platform.api.repository2.unified.RepositoryFileTree;
import org.pentaho.platform.api.repository.IContentItem;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.util.web.MimeHelper;

import pt.webdetails.cpf.audit.CpfAuditHelper;
import pt.webdetails.cpf.repository.RepositoryAccess;
import pt.webdetails.cpf.SimpleContentGenerator;
import pt.webdetails.packager.Packager;
import org.pentaho.cdf.utils.Util;



/**
 * This is the main class of the CDF plugin. It handles all requests to
 * /pentaho/content/pentaho-cdf. These requests include:
 * <p/>
 * - JSONSolution - GetCDFResource - .xcdf requests - js files - files within
 * resources
 *
 * @author Will Gorman (wgorman@pentaho.com)
 */

@Path("/pentaho-cdf/api")
public class CdfContentGenerator extends SimpleContentGenerator {

  private static final long serialVersionUID = 5608691656289862706L;
  private static final Log logger = LogFactory.getLog(CdfContentGenerator.class);
    
  public String RELATIVE_URL;
  private Packager packager;

  public boolean cdfResource;

  public CdfContentGenerator() {
    try {
      this.init();
    } catch (Exception e) {
      logger.error("Failed to initialize CDF");
    }
  }

  
  @Override
  public void createContent() throws Exception {
    OutputStream out;
    final IContentItem contentItem;
    IParameterProvider pathParams = parameterProviders.get("path");
    IParameterProvider requestParams = parameterProviders.get(IParameterProvider.SCOPE_REQUEST);
    String filePath = "";
    String template = "";

    if(isCdfResource()){
      String path = requestParams.getStringParameter("path", null);
      String resource = requestParams.getStringParameter("resource", null);

      getResource(resource, path, getResponse());
      return;
    }


    logger.info("[Timing] CDF content generator took over: " + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));
    try {
      if(parameterProviders.get("path") != null){


        filePath = pathParams.getStringParameter("path", null);
        template = requestParams.getStringParameter("template", null);

        Object parameter = pathParams.getParameter("httprequest");

        if(parameter != null && ((HttpServletRequest) parameter).getContextPath() != null){
          RELATIVE_URL = ((HttpServletRequest) parameter).getContextPath();
        }
      } else {
        RELATIVE_URL = Utils.getBaseUrl();
                  /* If we detect an empty string, things will break.
                   * If we detect an absolute url, things will *probably* break.
                   * In either of these cases, we'll resort to Catalina's context,
                   * and its getContextPath() method for better results.
                   */
        if ("".equals(RELATIVE_URL) || RELATIVE_URL.matches("^http://.*")) {
          Object context = PentahoSystem.getApplicationContext().getContext();
          Method getContextPath = context.getClass().getMethod("getContextPath", null);
          if (getContextPath != null) {
            RELATIVE_URL = getContextPath.invoke(context, null).toString();
          }
        }
      }

      if (RELATIVE_URL.endsWith("/")) {
        RELATIVE_URL = RELATIVE_URL.substring(0, RELATIVE_URL.length() - 1);
      }

      contentItem = outputHandler.getOutputContentItem("response", "content", instanceId, CdfConstants.MIME_HTML);
      out = contentItem.getOutputStream(null);

      // If callbacks is properly setup, we assume we're being called from another plugin
      if (this.callbacks != null && callbacks.size() > 0 && HashMap.class.isInstance(callbacks.get(0))) {
        HashMap<String, Object> iface = (HashMap<String, Object>) callbacks.get(0);
        out = (OutputStream) iface.get("output");
        filePath = "/" + (String) iface.get("method");
        this.userSession = this.userSession != null ? this.userSession : (IPentahoSession) iface.get("usersession");
      }

      // make sure we have a workable state
      if (outputHandler == null) {
        error(Messages.getErrorString("CdfContentGenerator.ERROR_0001_NO_OUTPUT_HANDLER")); //$NON-NLS-1$
        throw new InvalidParameterException(Messages.getString("CdfContentGenerator.ERROR_0001_NO_OUTPUT_HANDLER")); //$NON-NLS-1$
      } else if (contentItem == null) {
        error(Messages.getErrorString("CdfContentGenerator.ERROR_0002_NO_CONTENT_ITEM")); //$NON-NLS-1$
        throw new InvalidParameterException(Messages.getString("CdfContentGenerator.ERROR_0002_NO_CONTENT_ITEM")); //$NON-NLS-1$
      } else if (out == null) {
        error(Messages.getErrorString("CdfContentGenerator.ERROR_0003_NO_OUTPUT_STREAM")); //$NON-NLS-1$
        throw new InvalidParameterException(Messages.getString("CdfContentGenerator.ERROR_0003_NO_OUTPUT_STREAM")); //$NON-NLS-1$
      }

      if(filePath.isEmpty()){
        logger.error("Calling cdf with an empty method");
      }

      if(requestParams != null){
        renderXcdf(out, requestParams, filePath, template);
      }

    } catch (Exception e) {
      logger.error("Error creating cdf content: ", e);
    }
  }

  private void renderXcdf(final OutputStream out, final IParameterProvider requestParams, final String xcdfFilePath, String template) throws Exception {
    long start = System.currentTimeMillis();

    UUID uuid = CpfAuditHelper.startAudit(CdfConstants.PLUGIN_NAME, xcdfFilePath, getObjectName(), this.userSession, this, requestParams);

    try {
      final IMimeTypeListener mimeTypeListener = outputHandler.getMimeTypeListener();
      if (mimeTypeListener != null) {
        mimeTypeListener.setMimeType(CdfConstants.MIME_HTML);
      }

      renderXCDFDashboard(requestParams, out, xcdfFilePath, template == null ? "mantle" : template);

      long end = System.currentTimeMillis();
      CpfAuditHelper.endAudit(CdfConstants.PLUGIN_NAME, xcdfFilePath, getObjectName(), this.userSession, this, start, uuid, end);

    } catch (Exception e) {
      long end = System.currentTimeMillis();
      CpfAuditHelper.endAudit(CdfConstants.PLUGIN_NAME, xcdfFilePath, getObjectName(), this.userSession, this, start, uuid, end);
      throw e;
    }
  }

  public void renderXCDFDashboard(final IParameterProvider requestParams, final OutputStream out, final String xcdfFilePath, String template) throws Exception {
    long start = System.currentTimeMillis();

    UUID uuid = CpfAuditHelper.startAudit(CdfConstants.PLUGIN_NAME, xcdfFilePath, getObjectName(), this.userSession, this, requestParams);
    try {

      final IMimeTypeListener mimeTypeListener = outputHandler.getMimeTypeListener();
      if (mimeTypeListener != null) {
        mimeTypeListener.setMimeType(CdfConstants.MIME_HTML);
      }

      XcdfRenderer xcdfRenderer = new XcdfRenderer();

      RepositoryAccess repositoryAccess = RepositoryAccess.getRepository(userSession);
      RepositoryFile xcdfFile = repositoryAccess.getRepositoryFile(xcdfFilePath, RepositoryAccess.FileAccess.READ);

      if (xcdfFile != null) {
        xcdfRenderer.setRequestParams(requestParams);
        xcdfRenderer.setOutputStream(out);
        xcdfRenderer.setRepositoryFile(xcdfFile);
        xcdfRenderer.setTemplate(template);
        xcdfRenderer.setFilePath(xcdfFilePath);
        xcdfRenderer.setDebug(requestParams.hasParameter("debug")
                && requestParams.getParameter("debug").toString().equals("true"));
        xcdfRenderer.setBaseUrl((requestParams.hasParameter("root") ? "http://"
                + requestParams.getParameter("root").toString() : "")
                + RELATIVE_URL);
        xcdfRenderer.setUserSession(userSession);

        Map<String, Object> parameterMap = new HashMap<String, Object>();
        Iterator it = requestParams.getParameterNames();
        while (it.hasNext()) {
          String p = (String) it.next();
          if (p.indexOf("parameters") == 0) {
            parameterMap.put(p, requestParams.getParameter(p));
          }
        }
        xcdfRenderer.setVarArgs(parameterMap);
        xcdfRenderer.execute();

        setResponseHeaders(xcdfRenderer.getMimeType(null), 0, null);
      } else {
        out.write("Can not open file".getBytes("UTF-8")); //$NON-NLS-1$ //$NON-NLS-2$
      }
      long end = System.currentTimeMillis();
      CpfAuditHelper.endAudit(CdfConstants.PLUGIN_NAME, xcdfFilePath, getObjectName(), this.userSession, this, start, uuid, end);

    } catch (Exception e) {
      e.printStackTrace();
      long end = System.currentTimeMillis();
      CpfAuditHelper.endAudit(CdfConstants.PLUGIN_NAME, xcdfFilePath, getObjectName(), this.userSession, this, start, uuid, end);
      throw e;
    }

  }

  @GET
  @Path("/getResource")
  @Consumes({ APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED })
  public void getResource(@QueryParam(CdfConstants.PARAM_RESOURCE) String resource,
		  				  @QueryParam(CdfConstants.PARAM_PATH) String path,
          				  @Context HttpServletResponse servletResponse) throws Exception {
    try {
    
      if(!Util.isEmpty(resource) && Util.isEmpty(path)){
    	  //legacy calls used resource param; 5.0 calls use path param
    	  path = resource;
      }
      
      path = path != null && path.endsWith("/content") ? path.substring(0, path.indexOf("/content")) : path;
      
      servletResponse.setHeader("Content-Type", MimeHelper.getMimeTypeFromFileName(path));

      final IPluginResourceLoader resLoader = PentahoSystem.get(IPluginResourceLoader.class, null);
      final String formats = resLoader.getPluginSetting(this.getClass(), "settings/resources/downloadable-formats");

      List<String> allowedFormats = Arrays.asList(StringUtils.split(formats, ','));
      String extension = path.replaceAll(".*\\.(.*)", "$1");
      if (allowedFormats.indexOf(extension) < 0) {
        // We can't provide this type of file
        throw new SecurityException("Not allowed");
      }
      RepositoryAccess repositoryAccess = RepositoryAccess.getRepository(PentahoSessionHolder.getSession());

      final InputStream in = repositoryAccess.getResourceInputStream(path, RepositoryAccess.FileAccess.EXECUTE);
      
      try {
        IOUtils.copy(in, servletResponse.getOutputStream());
        servletResponse.getOutputStream().flush();
      } finally {
        IOUtils.closeQuietly(in);
      }
    } catch (SecurityException e) {
    	servletResponse.sendError(HttpServletResponse.SC_FORBIDDEN);
    }
  }
  
  @GET
  @Path("/export")
  @Consumes({ APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED })
  public void export(@QueryParam(CdfConstants.PARAM_SOLUTION) String solution,
		  			 @QueryParam(CdfConstants.PARAM_PATH) String path,
		  			 @QueryParam(CdfConstants.PARAM_ACTION) String action,
		  			 @QueryParam(CdfConstants.PARAM_CONTENT_TYPE) @DefaultValue(CdfConstants.MIME_HTML) String contentType,
                     @QueryParam(CdfConstants.PARAM_EXPORT_TYPE) @DefaultValue(CdfConstants.EXCEL) String exportType,
                     @Context HttpServletRequest servletRequest,
                     @Context HttpServletResponse servletResponse) throws Exception{
	  
	  String value = "";

	  if(!Util.isEmpty(solution) || !Util.isEmpty(action)){
		  //legacy call using solution, path, action request parameters
		  value = concatSolutionAndPathAndAction(solution, path, action);
		  
	  }else if (!Util.isEmpty(path)){
		  // 5.0 call using path
		 value = path;
	  }
	  
      if(ActionEngine.getInstance().executeAction(value, contentType, servletRequest, servletResponse, PentahoSessionHolder.getSession(), Util.getRequestParameters(servletRequest), outputHandler.getMimeTypeListener())){
        Export export;

        if ("csv".equalsIgnoreCase(exportType)) {
          export = new ExportCSV(servletResponse.getOutputStream());
          setResponseHeaders(CdfConstants.MIME_CSV, 0, "export" + export.getExtension());
        } else {
          export = new ExportExcel(servletResponse.getOutputStream());
          setResponseHeaders(CdfConstants.MIME_XLS, 0, "export" + export.getExtension());
        }

        export.exportFile(new JSONObject(servletResponse.getOutputStream()));
      }
  }

  @GET
  @Path("/callAction")
  public void callAction(@QueryParam(CdfConstants.PARAM_SOLUTION) String solution,
						 @QueryParam(CdfConstants.PARAM_PATH) String path,
						 @QueryParam(CdfConstants.PARAM_ACTION) String action,
		  				 @QueryParam(CdfConstants.PARAM_CONTENT_TYPE) @DefaultValue(CdfConstants.MIME_HTML) String contentType,
                         @Context HttpServletRequest servletRequest,
                         @Context HttpServletResponse servletResponse) throws Exception{
	  
	  String value = "";
	  
	  if(!Util.isEmpty(solution) || !Util.isEmpty(action)){
		  //legacy call using solution, path, action request parameters
		  value = concatSolutionAndPathAndAction(solution, path, action);
		  
	  }else if (!Util.isEmpty(path)){
		  // 5.0 call using path
		 value = path;
	  }
	  
	  ActionEngine.getInstance().executeAction(value, contentType, servletRequest, servletResponse, PentahoSessionHolder.getSession(), Util.getRequestParameters(servletRequest), outputHandler.getMimeTypeListener());
  }
  
  @GET
  @Path("/viewAction")
  public void viewAction(@QueryParam(CdfConstants.PARAM_SOLUTION) String solution,
						 @QueryParam(CdfConstants.PARAM_PATH) String path,
						 @QueryParam(CdfConstants.PARAM_ACTION) String action,
		  				 @QueryParam(CdfConstants.PARAM_CONTENT_TYPE) @DefaultValue(CdfConstants.MIME_HTML) String contentType,
                         @Context HttpServletRequest servletRequest,
                         @Context HttpServletResponse servletResponse) throws Exception{
	  
	  String value = "";
	  
	  if(!Util.isEmpty(solution) || !Util.isEmpty(action)){
		  //legacy call using solution, path, action request parameters
		  value = concatSolutionAndPathAndAction(solution, path, action);
		  
	  }else if (!Util.isEmpty(path)){
		  // 5.0 call using path
		 value = path;
	  }
      
      ActionEngine.getInstance().executeAction(value, contentType, servletRequest, servletResponse, PentahoSessionHolder.getSession(), Util.getRequestParameters(servletRequest), outputHandler.getMimeTypeListener());
  }

  @GET
  @Path("/getHeaders")
  @Produces("text/html")
  public String getHeaders(@QueryParam("dashboardContent") @DefaultValue("") String dashboardContent,
                           @QueryParam("dashboardType") String dashboardType,
                           @QueryParam("debug") @DefaultValue("false") boolean debug) throws Exception {
    try {
      CdfHtmlTemplateRenderer renderer = new CdfHtmlTemplateRenderer();
      if (renderer.getBaseUrl() == null) {
        renderer.setBaseUrl( StringUtils.removeEnd( Utils.getBaseUrl(), "/") );
        renderer.setDebug(debug);
        renderer.setTemplate(dashboardType);
      }
      return renderer.getHeaders(dashboardContent);
    } catch (IOException ex){
      logger.error("getHeaders: " + ex.getMessage(), ex);
      throw ex;
    }
  }

  @GET
  @Path("/ping")
  @Produces("text/plain")
  @Consumes({ APPLICATION_XML, APPLICATION_JSON })
  public Response ping() throws InvalidCdfOperationException  {
    return Response.ok().build();
  }

  @GET
  @Path("/getJSONSolution")
  @Produces(APPLICATION_JSON)
  @Consumes({ APPLICATION_XML, APPLICATION_JSON })
  public void getJSONSolution(
		  @QueryParam(CdfConstants.PARAM_SOLUTION) String solution,
		  @QueryParam(CdfConstants.PARAM_PATH) @DefaultValue(CdfConstants.DIR_SEPARATOR) String path,
		  @QueryParam(CdfConstants.PARAM_ACTION) String action,
          @QueryParam(CdfConstants.PARAM_DEPTH) @DefaultValue("-1") int depth,
          @QueryParam(CdfConstants.PARAM_SHOW_HIDDEN_FILES) @DefaultValue("false") boolean showHiddenFiles,
          @QueryParam(CdfConstants.PARAM_MODE) @DefaultValue("*") String mode,
          @Context HttpServletResponse servletResponse) throws InvalidCdfOperationException  {

	String value = "";
	  
	if(!Util.isEmpty(solution) || !Util.isEmpty(action)){
	  //legacy call using solution, path, action request parameters
	  value = concatSolutionAndPathAndAction(solution, path, action);
		  
	}else if (!Util.isEmpty(path)){
	  // 5.0 call using path
	 value = path;
	}  
	  
    RepositoryFileTree tree = RepositoryAccess.getRepository(PentahoSessionHolder.getSession()).getRepositoryFileTree(value, depth, showHiddenFiles, "*");

    if(tree != null) {
      try {
        JSONObject jsonRoot = new JSONObject();

        if (mode.equalsIgnoreCase(CdfConstants.NAVIGATOR)) {
          JSONObject json = new JSONObject();
          processTree(tree, json, false);
          jsonRoot.put("solution", json);
        } else if (mode.equalsIgnoreCase(CdfConstants.CONTENTLIST)) {
          jsonRoot = repositoryFileToJSONObject(tree.getFile());
          jsonRoot.put("content", new JSONArray());
          jsonRoot.remove("files");
          jsonRoot.remove("folders");

          processContentListTree(tree, jsonRoot);
        } else if (mode.equalsIgnoreCase(CdfConstants.SOLUTIONTREE)) {
          JSONObject json = new JSONObject();
          processTree(tree, json, true);
          jsonRoot.put("solution", json);
        }

        final PrintWriter pw = new PrintWriter(servletResponse.getOutputStream());
        pw.println(jsonRoot);
        pw.flush();

      } catch(Throwable t){
        throw new InvalidCdfOperationException(t.getMessage());
      }
    }
  }

  @GET
  @Path("/getContext")
  @Consumes({ APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED })
  public String getContext(@QueryParam(CdfConstants.PARAM_PATH) @DefaultValue(CdfConstants.EMPTY_STRING) String path,
						 @QueryParam(CdfConstants.PARAM_ACTION) @DefaultValue(CdfConstants.EMPTY_STRING) String action,
                         @DefaultValue(CdfConstants.EMPTY_STRING) @QueryParam(CdfConstants.PARAM_VIEW_ID) String viewId,
                         @Context HttpServletRequest servletRequest){
      return ContextEngine.getInstance().getContext(path, viewId, action, Util.getRequestParameters(servletRequest));
  }

  @GET
  @Path("/clearCache")
  @Consumes({ APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED })
  public void clearCache(@Context HttpServletResponse servletResponse) {
    try {
      ContextEngine.getInstance().clearCache();
      writeOut(servletResponse.getOutputStream(), "Cache Cleared");
    } catch (IOException e) {
      logger.error("failed to clear CDFcache");
    }
  }

  private JSONObject repositoryFileToJSONObject(RepositoryFile repositoryFile) throws JSONException {

    if(repositoryFile != null){

      JSONObject json = new JSONObject();
      json.put("id", repositoryFile.getId());
      json.put("name", wrapString(repositoryFile.getName()));
      json.put("path", repositoryFile.getPath());
      json.put("visible", !repositoryFile.isHidden());
      json.put("title", repositoryFile.isHidden() ? CdfConstants.HIDDEN_DESC : wrapString(repositoryFile.getTitle()));
      json.put("description", wrapString(repositoryFile.getDescription()));
      json.put("creatorId", wrapString(repositoryFile.getCreatorId()));
      json.put("locked", repositoryFile.isLocked());

      if(repositoryFile.isFolder()){
        json.put("type", CdfConstants.TYPE_FOLDER);
        json.put("files", new JSONArray());
        json.put("folders", new JSONArray());
      }else{

        json.put("link", wrapString("/api/repos/" + repositoryFile.getPath().replaceAll("/", ":") + "/generatedContent"));

        int dot = repositoryFile.getName().lastIndexOf('.');
        if(dot > 0){
          json.put("type", repositoryFile.getName().substring(dot+1));
        }
      }

      return json;
    }

    return null;
  }

  private void processTree(final RepositoryFileTree tree, final JSONObject json, boolean includeAllFiles) throws Exception{

    JSONObject childJson = repositoryFileToJSONObject(tree.getFile());

    if(!tree.getFile().isFolder()){

      //is file

      if(includeAllFiles){

        json.append("files", childJson);

      }else{

        // only wcdf/xcdf files
        String type = childJson.getString("type") != null ? childJson.getString("type").toLowerCase() : null;
        if("wcdf".equals(type) || "xcdf".equals(type)){
          json.append("files", childJson);
        }
      }

    }else{

      //is folder
      json.append("folders", childJson);

      if(tree.getChildren() != null){
        for (final RepositoryFileTree childNode : tree.getChildren()){

          processTree(childNode, childJson, includeAllFiles);
        }
      }
    }
  }

  private void processContentListTree(final RepositoryFileTree tree, final JSONObject json) throws Exception{

    JSONObject childJson = repositoryFileToJSONObject(tree.getFile());

    if(!tree.getFile().isFolder()){

      //is file
      json.append("content", childJson);

    }else{

      //is folder
      if(tree.getChildren() != null){
        for (final RepositoryFileTree childNode : tree.getChildren()){

          processContentListTree(childNode, json);
        }
      }
    }
  }

  private void init() throws Exception {
    String rootdir = PentahoSystem.getApplicationContext().getSolutionPath("system/" + CdfConstants.PLUGIN_NAME);
    final File blueprintFile = new File(rootdir + "/resources-blueprint.txt");
    final File mobileFile = new File(rootdir + "/resources-mobile.txt");

    final Properties blueprintResources = new Properties();
    blueprintResources.load(new FileInputStream(blueprintFile));
    final Properties mobileResources = new Properties();
    mobileResources.load(new FileInputStream(mobileFile));
    ArrayList<String> scriptsList = new ArrayList<String>();
    ArrayList<String> stylesList = new ArrayList<String>();

    this.packager = Packager.getInstance();

    boolean scriptsAvailable = packager.isPackageRegistered("scripts");
    boolean stylesAvailable = packager.isPackageRegistered("styles");
    boolean mobileScriptsAvailable = packager.isPackageRegistered("scripts-mobile");
    boolean mobileStylesAvailable = packager.isPackageRegistered("styles-mobile");
    if (!scriptsAvailable) {
      scriptsList.clear();
      scriptsList.addAll(Arrays.asList(blueprintResources.get("commonLibrariesScript").toString().split(",")));
      for (int i = 0; i < scriptsList.size(); i++) {
        String fname = scriptsList.get(i);
        scriptsList.set(i, fname.replaceAll(CdfConstants.RELATIVE_URL_TAG + "/content/pentaho-cdf", ""));
      }
      packager.registerPackage("scripts", Packager.Filetype.JS, rootdir, rootdir + "/js/scripts.js", scriptsList.toArray(new String[scriptsList.size()]));
    }

    if (!stylesAvailable) {
      stylesList.clear();
      stylesList.addAll(Arrays.asList(blueprintResources.get("commonLibrariesLink").toString().split(",")));
      for (int i = 0; i < stylesList.size(); i++) {
        String fname = stylesList.get(i);
        stylesList.set(i, fname.replaceAll(CdfConstants.RELATIVE_URL_TAG + "/content/pentaho-cdf", ""));
      }
      packager.registerPackage("styles", Packager.Filetype.CSS, rootdir, rootdir + "/js/styles.css", stylesList.toArray(new String[stylesList.size()]));
    }
    if (!mobileScriptsAvailable) {
      scriptsList.clear();
      scriptsList.addAll(Arrays.asList(mobileResources.get("commonLibrariesScript").toString().split(",")));
      for (int i = 0; i < scriptsList.size(); i++) {
        String fname = scriptsList.get(i);
        scriptsList.set(i, fname.replaceAll(CdfConstants.RELATIVE_URL_TAG + "/content/pentaho-cdf", ""));
      }
      packager.registerPackage("scripts-mobile", Packager.Filetype.JS, rootdir, rootdir + "/js/scripts-mobile.js", scriptsList.toArray(new String[scriptsList.size()]));
    }

    if (!mobileStylesAvailable) {
      stylesList.clear();
      stylesList.addAll(Arrays.asList(mobileResources.get("commonLibrariesLink").toString().split(",")));
      for (int i = 0; i < stylesList.size(); i++) {
        String fname = stylesList.get(i);
        stylesList.set(i, fname.replaceAll(CdfConstants.RELATIVE_URL_TAG + "/content/pentaho-cdf", ""));
      }
      packager.registerPackage("styles-mobile", Packager.Filetype.CSS, rootdir, rootdir + "/js/styles-mobile.css", stylesList.toArray(new String[stylesList.size()]));
    }
  }

  public String getPluginName(){
    return CdfConstants.PLUGIN_NAME;
  }

  private String wrapString(String value){
    if(value == null) return "";
    else return value;
  }
  
  private String concatSolutionAndPathAndAction(String solution, String path, String action){
	  
	  if(Util.isEmpty(solution) && Util.isEmpty(path) && Util.isEmpty(action)){
		  return null;
	  }
	  
	  if(solution != null){
		  if(solution.trim().startsWith(CdfConstants.DIR_SEPARATOR)){ solution = solution.trim().replaceFirst(CdfConstants.DIR_SEPARATOR, ""); }
		  if(solution.trim().endsWith(CdfConstants.DIR_SEPARATOR)){ solution = solution.trim().substring(0, solution.lastIndexOf(CdfConstants.DIR_SEPARATOR)); }
	  }
	  
	  if(path != null){
		  if(path.trim().startsWith(CdfConstants.DIR_SEPARATOR)){ path = path.trim().replaceFirst(CdfConstants.DIR_SEPARATOR, ""); }
		  if(path.trim().endsWith(CdfConstants.DIR_SEPARATOR)){ path = path.trim().substring(0, path.lastIndexOf(CdfConstants.DIR_SEPARATOR)); }
	  }
	  
	  if(action != null){
		  if(action.trim().startsWith(CdfConstants.DIR_SEPARATOR)){ action = action.trim().replaceFirst(CdfConstants.DIR_SEPARATOR, ""); }
		  if(action.trim().endsWith(CdfConstants.DIR_SEPARATOR)){ action = action.trim().substring(0, action.lastIndexOf(CdfConstants.DIR_SEPARATOR)); }
	  }
	  
	  // a) request params contain solution, path and action
	  if(!Util.isEmpty(solution) && !Util.isEmpty(path) && !Util.isEmpty(action)){
		  return solution + CdfConstants.DIR_SEPARATOR + path + CdfConstants.DIR_SEPARATOR + action;
	  
		// b) request params contain solution and path (path already includes action file)
	  } else if(!Util.isEmpty(solution) && !Util.isEmpty(path)){
		  return solution + CdfConstants.DIR_SEPARATOR + path;
	  
		// c) request params contain solution and action (no path used)
	  } else if(!Util.isEmpty(solution) && !Util.isEmpty(action)){
		  return solution + CdfConstants.DIR_SEPARATOR + action;		  
	  }
	  
	  return null;
  }

  public boolean isCdfResource() {
    return cdfResource;
  }

  public void setCdfResource(boolean cdfResource) {
    this.cdfResource = cdfResource;
  }
}