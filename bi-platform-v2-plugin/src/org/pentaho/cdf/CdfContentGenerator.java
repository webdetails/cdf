package org.pentaho.cdf;

import java.io.*;
import java.lang.reflect.Method;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.Charset;
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
import javax.xml.parsers.ParserConfigurationException;
import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import static javax.ws.rs.core.MediaType.APPLICATION_XML;
import static javax.ws.rs.core.MediaType.APPLICATION_FORM_URLENCODED;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONArray;




import org.pentaho.cdf.comments.CommentsEngine;
import org.pentaho.cdf.context.DashboardContextApi;
import org.pentaho.cdf.export.Export;
import org.pentaho.cdf.export.ExportCSV;
import org.pentaho.cdf.export.ExportExcel;
import org.pentaho.cdf.localization.MessageBundlesHelper;
import org.pentaho.cdf.storage.StorageEngine;
import org.pentaho.cdf.views.ViewsEngine;
import org.pentaho.platform.api.engine.IActionSequenceResource;
import org.pentaho.platform.api.engine.ILogger;
import org.pentaho.platform.api.engine.IMimeTypeListener;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.IPluginResourceLoader;
import org.pentaho.platform.api.engine.IUITemplater;
import org.pentaho.platform.api.repository2.unified.RepositoryFile;
import org.pentaho.platform.api.repository2.unified.RepositoryFileTree;
import org.pentaho.platform.api.repository.IContentItem;
import org.pentaho.platform.repository2.unified.fileio.RepositoryFileContentItem;
import org.pentaho.platform.repository2.unified.fileio.RepositoryFileOutputHandler;
//import org.pentaho.platform.api.repository.ISolutionRepository;
import org.pentaho.platform.engine.core.solution.ActionInfo;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.engine.services.solution.BaseContentGenerator;
import org.pentaho.platform.plugin.services.pluginmgr.PluginClassLoader;
import org.pentaho.platform.util.messages.LocaleHelper;
import org.pentaho.platform.util.web.MimeHelper;
import org.pentaho.platform.util.xml.dom4j.XmlDom4JHelper;


import pt.webdetails.cpf.audit.CpfAuditHelper;
import pt.webdetails.cpf.repository.RepositoryAccess;
import pt.webdetails.cpf.web.CpfHttpServletResponse;
import pt.webdetails.cpf.SimpleContentGenerator;
import pt.webdetails.packager.Packager;



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
    public static final String PLUGIN_NAME = "pentaho-cdf"; //$NON-NLS-1$
    private static final String MIMETYPE = "text/html"; //$NON-NLS-1$
    public static final String SOLUTION_DIR = "cdf";
    // Possible actions
    private static final String RENDER_HTML = "/RenderHTML";
    private static final String VIEWS = "/Views";
    private static final String RENDER_XCDF = "/RenderXCDF";
    private static final String JSON_SOLUTION = "/JSONSolution"; //$NON-NLS-1$
    private static final String GET_CDF_RESOURCE = "/GetCDFResource"; //$NON-NLS-1$
    private static final String EXPORT = "/Export"; //$NON-NLS-1$
    private static final String SETTINGS = "/Settings"; //$NON-NLS-1$
    private static final String CALLACTION = "/CallAction"; //$NON-NLS-1$
    private static final String CLEAR_CACHE = "/ClearCache"; //$NON-NLS-1$
    private static final String COMMENTS = "/Comments"; //$NON-NLS-1$
    private static final String STORAGE = "/Storage"; //$NON-NLS-1$
    private static final String GETHEADERS = "/GetHeaders"; //$NON-NLS-1$
    private static final String CONTEXT = "/Context"; //$NON-NLS-1$
    private static final String MIME_HTML = "text/html";
    private static final String MIME_CSS = "text/css";
    private static final String MIME_JS = "text/javascript";
    private static final String MIME_PLAIN = "text/plain";
    private static final String MIME_CSV = "text/csv";
    private static final String MIME_XLS = "application/vnd.ms-excel";
    // CDF Resource Relative URL
    private static final String RELATIVE_URL_TAG = "@RELATIVE_URL@";
    
    //SUGAR
    private static final String FILE_EXTENSION = ".xcdf";
    public String RELATIVE_URL;
    private Packager packager;
    public static String ENCODING = "UTF-8";
    
    private static final String NAVIGATOR = "navigator";
    private static final String CONTENTLIST = "contentList";
    private static final String SOLUTIONTREE = "solutionTree";
    private static final String TYPE_FOLDER = "FOLDER";
    private static final String HIDDEN_DESC = "Hidden";
    private static final String ROOT_FOLDER_PATH = "/";
  
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
        IParameterProvider pathParams;
        IParameterProvider requestParams = null;
        String filePath = "";
        String payload = "";
        String template = "";
        //outputHandler = new RepositoryFileOutputHandler(null);
        
        logger.info("[Timing] CDF content generator took over: " + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));
        try {
            if(parameterProviders.get("path") != null){
                pathParams = parameterProviders.get("path");
                requestParams = parameterProviders.get(IParameterProvider.SCOPE_REQUEST);
                filePath = pathParams.getStringParameter("path", null);
                template = requestParams.getStringParameter("template", null);
                
                Object parameter = pathParams.getParameter("httprequest");
                
                if(parameter != null && ((HttpServletRequest) parameter).getContextPath() != null){
                    RELATIVE_URL = ((HttpServletRequest) parameter).getContextPath();
                }
            } else {
                RELATIVE_URL = getBaseUrl();
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
            
            contentItem = outputHandler.getOutputContentItem("response", "content", instanceId, MIME_HTML);
            out = contentItem.getOutputStream(null);

            // If callbacks is properly setup, we assume we're being called from another plugin
            if (this.callbacks != null && callbacks.size() > 0 && HashMap.class.isInstance(callbacks.get(0))) {
                HashMap<String, Object> iface = (HashMap<String, Object>) callbacks.get(0);
                out = (OutputStream) iface.get("output");
                filePath = "/" + (String) iface.get("method");
                payload = (String) iface.get("payload");
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
            
            //findMethod(method, contentItem, out, payload);

        } catch (Exception e) {
            logger.error("Error creating cdf content: ", e);
        }
    }

    private void findMethod(final String urlPath, final IContentItem contentItem, final OutputStream out, String payload) throws Exception {

        // Each block will call a different method. If in the future this extends a lot we can think
        // about using reflection for class loading, but I don't expect that to happen.

        final IParameterProvider requestParams = parameterProviders.get(IParameterProvider.SCOPE_REQUEST);
        final IParameterProvider pathParams = parameterProviders.get("pathparams");


        if (urlPath.equals(RENDER_XCDF)) { //JA ESTA

            //renderXcdf(out, requestParams);

        } else if (urlPath.equals(JSON_SOLUTION)) { //DEIXAR PARA O FIM

            jsonSolution(out, requestParams);
        } else if (urlPath.equals(EXPORT)) { //Chama uma XACTion - não funciona
            exportFile(requestParams, out);
        } else if (urlPath.equals(CALLACTION)) { //Chama uma XAction - nao funciona
            callAction(requestParams, out);
        } else if (urlPath.endsWith(FILE_EXTENSION)) {
            renderXcdf(out, requestParams, urlPath, requestParams.getStringParameter("template", null));
            //renderXCDFDashboard(requestParams, out, ); //$NON-NLS-1$
        } else {
            // we'll be providing the actual content with cache
            logger.warn("Getting resources through content generator is deprecated, please use static resources: " + urlPath);
            returnResource(urlPath, contentItem, out);
        }
    }


    private void renderXcdf(final OutputStream out, final IParameterProvider requestParams, final String xcdfFilePath, String template) throws Exception {
        long start = System.currentTimeMillis();

        UUID uuid = CpfAuditHelper.startAudit(PLUGIN_NAME, xcdfFilePath, getObjectName(), this.userSession, this, requestParams);

        try {
            final IMimeTypeListener mimeTypeListener = outputHandler.getMimeTypeListener();
            if (mimeTypeListener != null) {
                mimeTypeListener.setMimeType(MIMETYPE);
            }

            renderXCDFDashboard(requestParams, out, xcdfFilePath, template);

            long end = System.currentTimeMillis();
            CpfAuditHelper.endAudit(PLUGIN_NAME, xcdfFilePath, getObjectName(), this.userSession, this, start, uuid, end);

        } catch (Exception e) {
            long end = System.currentTimeMillis();
            CpfAuditHelper.endAudit(PLUGIN_NAME, xcdfFilePath, getObjectName(), this.userSession, this, start, uuid, end);
            throw e;
        }
    }
    
    public void renderXCDFDashboard(final IParameterProvider requestParams, final OutputStream out, final String xcdfFilePath, String template) throws Exception {
        long start = System.currentTimeMillis();

        UUID uuid = CpfAuditHelper.startAudit(PLUGIN_NAME, xcdfFilePath, getObjectName(), this.userSession, this, requestParams);
        try {

            final IMimeTypeListener mimeTypeListener = outputHandler.getMimeTypeListener();
            if (mimeTypeListener != null) {
                mimeTypeListener.setMimeType(MIMETYPE);
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
            CpfAuditHelper.endAudit(PLUGIN_NAME, xcdfFilePath, getObjectName(), this.userSession, this, start, uuid, end);

        } catch (Exception e) {
            e.printStackTrace();
            long end = System.currentTimeMillis();
            CpfAuditHelper.endAudit(PLUGIN_NAME, xcdfFilePath, getObjectName(), this.userSession, this, start, uuid, end);
            throw e;
        }

  }
    
//esquece
    private void jsonSolution(final OutputStream out, final IParameterProvider requestParams) throws JSONException, ParserConfigurationException {
        if (requestParams == null) {
            error(Messages.getErrorString("CdfContentGenerator.ERROR_0004_NO_REQUEST_PARAMS")); //$NON-NLS-1$
            throw new InvalidParameterException(Messages.getString("CdfContentGenerator.ERROR_0017_NO_REQUEST_PARAMS")); //$NON-NLS-1$
        }

        final String solution = requestParams.getStringParameter("solution", null); //$NON-NLS-1$
        final String path = requestParams.getStringParameter("path", null); //$NON-NLS-1$
        final String mode = requestParams.getStringParameter("mode", null); //$NON-NLS-1$
        final String contextPath = ((HttpServletRequest) parameterProviders.get("path").getParameter("httprequest")).getContextPath();
        final NavigateComponent nav = new NavigateComponent(userSession, contextPath);
        final String json = nav.getNavigationElements(mode, solution, path);

        final PrintWriter pw = new PrintWriter(out);

        // jsonp?
        String callback = requestParams.getStringParameter("callback", null);
        if (callback != null) {
            pw.println(callback + "(" + json + ");");

        } else {
            pw.println(json);
        }

        pw.flush();
    }

    //compatibilidade
    @GET
    @Path("/getCDFResource")
    @Consumes({ APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED })
    public void getCDFResource(
            @QueryParam("resource") String resource, 
            @QueryParam("path") String path, 

            @Context HttpServletResponse servletResponse, 
            @Context HttpServletRequest servletRequest) throws Exception {
        
        getResponse().setHeader("Content-Type", MimeHelper.getMimeTypeFromFileName(resource));
        try {
            getSolutionFile(resource, servletResponse.getOutputStream(), this);
        } catch (SecurityException e) {
            getResponse().sendError(HttpServletResponse.SC_FORBIDDEN);
        }
    }


    private void returnResource(final String urlPath, final IContentItem contentItem, final OutputStream out) throws Exception {
        final IParameterProvider pathParams = parameterProviders.get("path"); //$NON-NLS-1$
        contentItem.setMimeType(MimeHelper.getMimeTypeFromFileName(urlPath));

        final IPluginResourceLoader resLoader = PentahoSystem.get(IPluginResourceLoader.class, null);
        final String maxAge = resLoader.getPluginSetting(CdfContentGenerator.class, "settings/max-age");
        final HttpServletResponse response = (HttpServletResponse) pathParams.getParameter("httpresponse");
        if (maxAge != null && response != null) {
            response.setHeader("Cache-Control", "max-age=" + maxAge);
        }

        getContent(urlPath, out, this);
    }

    private void exportFile(final IParameterProvider requestParams, final OutputStream output) {

        try {

            final ByteArrayOutputStream out = new ByteArrayOutputStream();

            final ServiceCallAction serviceCallAction = ServiceCallAction.getInstance();
            if (serviceCallAction.execute(requestParams, userSession, out)) {

                final String exportType = requestParams.getStringParameter("exportType", "excel");

                Export export;

                if (exportType.equals("csv")) {
                    export = new ExportCSV(output);
                    setResponseHeaders(MIME_CSV, 0, "export" + export.getExtension());
                } else {
                    export = new ExportExcel(output);
                    setResponseHeaders(MIME_XLS, 0, "export" + export.getExtension());
                }

                export.exportFile(new JSONObject(out.toString()));
            }

        } catch (IOException e) {
            logger.error("IOException  exporting file", e);
        } catch (JSONException e) {
            logger.error("JSONException exporting file", e);
        }

    }



    private void callAction(final IParameterProvider requestParams, final OutputStream out) {

        final ServiceCallAction serviceCallAction = ServiceCallAction.getInstance();
        serviceCallAction.execute(requestParams, userSession, out);
    }

    @Override
    public Log getLogger() {
        // TODO Auto-generated method stub
        return null;
    }

    public String concatFiles(String includeString, final Hashtable filesAdded, final Hashtable files) {
//TODO: is this used?
        final String newLine = System.getProperty("line.separator");
        final Enumeration keys = files.keys();
        while (keys.hasMoreElements()) {

            final String key = (String) keys.nextElement();
            final String[] includeFiles = (String[]) files.get(key);

            for (int i = 0; i < includeFiles.length; i++) {
                if (!filesAdded.containsKey(includeFiles[i])) {

                    filesAdded.put(includeFiles[i], '1');
                    if (key.equals("script")) {
                        includeString += "<script language=\"javascript\" type=\"text/javascript\" src=\"" + includeFiles[i].replaceAll(RELATIVE_URL_TAG, RELATIVE_URL) + "\"></script>" + newLine;
                    } else {
                        includeString += "<link rel=\"stylesheet\" href=\"" + includeFiles[i].replaceAll(RELATIVE_URL_TAG, RELATIVE_URL) + "\" type=\"text/css\" />";
                    }
                }
            }
        }

        return includeString;
    }

    public boolean matchComponent(int keyIndex, final String key, final String content) {

        for (int i = keyIndex - 1; i > 0; i--) {
            if (content.charAt(i) == ':' || content.charAt(i) == '"' || ("" + content.charAt(i)).trim().equals("")) {
                // noinspection UnnecessaryContinue
                continue;
            } else {
                if ((i - 3) > 0 && content.substring((i - 3), i + 1).equals("type")) {
                    return true;
                }

                break;
            }
        }

        keyIndex = content.indexOf(key, keyIndex + key.length());
        if (keyIndex != -1) {
            return matchComponent(keyIndex, key, content);
        }

        return false;
    }

    public void getContent(final String fileName, final OutputStream out, final ILogger logger) throws Exception {

        // write out the scripts
        // TODO support caching
        final String path = PentahoSystem.getApplicationContext().getSolutionPath("system/" + PLUGIN_NAME + fileName); //$NON-NLS-1$ //$NON-NLS-2$
        final File file = new File(path);

        final InputStream in = FileUtils.openInputStream(file);
        try {
            IOUtils.copy(in, out);
        } finally {
            IOUtils.closeQuietly(in);
        }
    }

    public void getSolutionFile(final String resourcePath, final OutputStream out, final ILogger logger) throws Exception {
        final IPluginResourceLoader resLoader = PentahoSystem.get(IPluginResourceLoader.class, null);
        final String formats = resLoader.getPluginSetting(this.getClass(), "settings/resources/downloadable-formats");

        List<String> allowedFormats = Arrays.asList(StringUtils.split(formats, ','));
        String extension = resourcePath.replaceAll(".*\\.(.*)", "$1");
        if (allowedFormats.indexOf(extension) < 0) {
            // We can't provide this type of file
            throw new SecurityException("Not allowed");
        }
        RepositoryAccess repositoryAccess = RepositoryAccess.getRepository(userSession);
        
        //final ISolutionRepository repository = PentahoSystem.get(ISolutionRepository.class, userSession);
        final InputStream in = repositoryAccess.getResourceInputStream(resourcePath, RepositoryAccess.FileAccess.EXECUTE);
        try {
            IOUtils.copy(in, out);
        } finally {
            IOUtils.closeQuietly(in);
        }
    }

    @GET
    @Path("/getHeaders")
    @Produces("text/html")
    public void getHeaders(@QueryParam("dashboardContent") String dashboardContent,
                            
                           @Context HttpServletResponse servletResponse, 
                           @Context HttpServletRequest servletRequest) throws Exception{       
        try {
            CdfHtmlTemplateRenderer renderer = new CdfHtmlTemplateRenderer();
            renderer.getHeaders(dashboardContent, servletResponse.getOutputStream());
        } catch (IOException ex){
            
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
        @QueryParam("path") @DefaultValue("/") String path, 
        @QueryParam("depth") @DefaultValue("-1") int depth, 
        @QueryParam("showHiddenFiles") @DefaultValue("false") boolean showHiddenFiles,
        @QueryParam("mode") @DefaultValue("*") String mode,
            @Context HttpServletResponse servletResponse, 
            @Context HttpServletRequest servletRequest) throws InvalidCdfOperationException  {
      
      RepositoryFileTree tree = RepositoryAccess.getRepository(userSession).getRepositoryFileTree(path, depth, showHiddenFiles, "*");

      if(tree != null){
        
        try{  
          
          JSONObject jsonRoot = new JSONObject();

          if (mode.equalsIgnoreCase(NAVIGATOR)) {
            
        	JSONObject json = new JSONObject();
            processTree(tree, json, false);
            jsonRoot.put("solution", json);
              
            } else if (mode.equalsIgnoreCase(CONTENTLIST)) {
              
              jsonRoot = repositoryFileToJSONObject(tree.getFile());
              jsonRoot.put("content", new JSONArray());
              jsonRoot.remove("files");
              jsonRoot.remove("folders");
              
              processContentListTree(tree, jsonRoot);
              
            } else if (mode.equalsIgnoreCase(SOLUTIONTREE)) {
              
            	JSONObject json = new JSONObject();
                processTree(tree, json, true);
                jsonRoot.put("solution", json);
            } 
                    
          final PrintWriter pw = new PrintWriter(servletResponse.getOutputStream());
          pw.println(jsonRoot);
                pw.flush();
                
        }catch(Throwable t){
        throw new InvalidCdfOperationException(t.getMessage());
        }
      }
    }
    
    private JSONObject repositoryFileToJSONObject(RepositoryFile repositoryFile) throws JSONException {
      
      if(repositoryFile != null){
      
        JSONObject json = new JSONObject();
        json.put("id", repositoryFile.getId());
            json.put("name", wrapString(repositoryFile.getName()));
            json.put("path", repositoryFile.getPath());
            json.put("visible", !repositoryFile.isHidden());
            json.put("title", repositoryFile.isHidden() ? HIDDEN_DESC : wrapString(repositoryFile.getTitle()));
            json.put("description", wrapString(repositoryFile.getDescription()));
            json.put("creatorId", wrapString(repositoryFile.getCreatorId()));
            json.put("locked", repositoryFile.isLocked());
            
            if(repositoryFile.isFolder()){
              json.put("type", TYPE_FOLDER); 
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
        
        for (final RepositoryFileTree childNode : tree.getChildren()){
          
          processTree(childNode, childJson, includeAllFiles);         
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
        for (final RepositoryFileTree childNode : tree.getChildren()){
          
          processContentListTree(childNode, json);         
        }       
      }
    } 
    
    private void init() throws Exception {
        String rootdir = PentahoSystem.getApplicationContext().getSolutionPath("system/" + PLUGIN_NAME);
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
                scriptsList.set(i, fname.replaceAll(RELATIVE_URL_TAG + "/content/pentaho-cdf", ""));
            }
            packager.registerPackage("scripts", Packager.Filetype.JS, rootdir, rootdir + "/js/scripts.js", scriptsList.toArray(new String[scriptsList.size()]));
        }

        if (!stylesAvailable) {
            stylesList.clear();
            stylesList.addAll(Arrays.asList(blueprintResources.get("commonLibrariesLink").toString().split(",")));
            for (int i = 0; i < stylesList.size(); i++) {
                String fname = stylesList.get(i);
                stylesList.set(i, fname.replaceAll(RELATIVE_URL_TAG + "/content/pentaho-cdf", ""));
            }
            packager.registerPackage("styles", Packager.Filetype.CSS, rootdir, rootdir + "/js/styles.css", stylesList.toArray(new String[stylesList.size()]));
        }
        if (!mobileScriptsAvailable) {
            scriptsList.clear();
            scriptsList.addAll(Arrays.asList(mobileResources.get("commonLibrariesScript").toString().split(",")));
            for (int i = 0; i < scriptsList.size(); i++) {
                String fname = scriptsList.get(i);
                scriptsList.set(i, fname.replaceAll(RELATIVE_URL_TAG + "/content/pentaho-cdf", ""));
            }
            packager.registerPackage("scripts-mobile", Packager.Filetype.JS, rootdir, rootdir + "/js/scripts-mobile.js", scriptsList.toArray(new String[scriptsList.size()]));
        }

        if (!mobileStylesAvailable) {
            stylesList.clear();
            stylesList.addAll(Arrays.asList(mobileResources.get("commonLibrariesLink").toString().split(",")));
            for (int i = 0; i < stylesList.size(); i++) {
                String fname = stylesList.get(i);
                stylesList.set(i, fname.replaceAll(RELATIVE_URL_TAG + "/content/pentaho-cdf", ""));
            }
            packager.registerPackage("styles-mobile", Packager.Filetype.CSS, rootdir, rootdir + "/js/styles-mobile.css", stylesList.toArray(new String[stylesList.size()]));
        }
    }

    private static String getBaseUrl() {

        String baseUrl;
        try {
            // Note - this method is deprecated and returns different values in 3.6
            // and 3.7. Change this in future versions -- but not yet
// getFullyQualifiedServerUeRL only available from 3.7
//      URI uri = new URI(PentahoSystem.getApplicationContext().getFullyQualifiedServerURL());
            URI uri = new URI(PentahoSystem.getApplicationContext().getBaseUrl());
            baseUrl = uri.getPath();
            if (!baseUrl.endsWith("/")) {
                baseUrl += "/";
            }
        } catch (URISyntaxException ex) {
            logger.fatal("Error building BaseURL from " + PentahoSystem.getApplicationContext().getBaseUrl(), ex);
            baseUrl = "";
        }

        return baseUrl;

    }
    
    public String getPluginName(){
        return PLUGIN_NAME;
    }
    
    private String wrapString(String value){
      if(value == null) return "";
      else return value;
    }
    
}