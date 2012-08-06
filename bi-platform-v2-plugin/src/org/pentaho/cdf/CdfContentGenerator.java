package org.pentaho.cdf;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.lang.reflect.Method;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.Charset;
import java.security.InvalidParameterException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;
import java.util.UUID;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.ParserConfigurationException;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.comments.CommentsEngine;
import org.pentaho.cdf.export.Export;
import org.pentaho.cdf.export.ExportCSV;
import org.pentaho.cdf.export.ExportExcel;
import org.pentaho.cdf.localization.MessageBundlesHelper;
import org.pentaho.cdf.storage.StorageEngine;
import org.pentaho.cdf.utils.CdfAuditHelper;
import org.pentaho.platform.api.engine.ILogger;
import org.pentaho.platform.api.engine.IMimeTypeListener;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.IPluginResourceLoader;
import org.pentaho.platform.api.engine.IUITemplater;
import org.pentaho.platform.api.repository.IContentItem;
import org.pentaho.platform.api.repository2.unified.IUnifiedRepository;
import org.pentaho.platform.api.repository2.unified.RepositoryFile;
import org.pentaho.platform.api.repository2.unified.data.simple.SimpleRepositoryFileData;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.engine.services.solution.BaseContentGenerator;
import org.pentaho.platform.plugin.services.pluginmgr.PluginClassLoader;
import org.pentaho.platform.util.messages.LocaleHelper;
import org.pentaho.platform.util.web.MimeHelper;

import pt.webdetails.packager.Packager;

/**
 * This is the main class of the CDF plugin.  It handles all requests to
 * /pentaho/content/pentaho-cdf.  These requests include:
 * <p/>
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
  public static final String SOLUTION_DIR = "cdf";
  // Possible actions
  private static final String RENDER_HTML = "/RenderHTML"; //$NON-NLS-1$
  private static final String RENDER_XCDF = "/RenderXCDF"; //$NON-NLS-1$
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
  private static final String MIME_HTML = "text/html"; //$NON-NLS-1$
  private static final String MIME_CSS = "text/css"; //$NON-NLS-1$
  private static final String MIME_JS = "text/javascript"; //$NON-NLS-1$
  private static final String MIME_PLAIN = "text/plain"; //$NON-NLS-1$
  private static final String MIME_CSV = "text/csv"; //$NON-NLS-1$
  private static final String MIME_XLS = "application/vnd.ms-excel"; //$NON-NLS-1$

  // CDF Resource Relative URL
  private static final String RELATIVE_URL_TAG = "@RELATIVE_URL@"; //$NON-NLS-1$
  public String RELATIVE_URL;
  private Packager packager;
  public static String ENCODING = "UTF-8";

  public CdfContentGenerator() {
    try {
      this.init();
    } catch (Exception e) {
      logger.error("Failed to initialize CDF"); //$NON-NLS-1$
    }
  }

  @Override
  public void createContent() throws Exception {
    final OutputStream out;
    final IContentItem contentItem;
    final IParameterProvider pathParams;
    final String method;
    final String payload;
    logger.info("[Timing] CDF content generator took over: "
        + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));
    try {
      if (parameterProviders.get("path") != null && parameterProviders.get("path").getParameter("httprequest") != null
          && ((HttpServletRequest) parameterProviders.get("path").getParameter("httprequest")).getContextPath() != null) {
        RELATIVE_URL = ((HttpServletRequest) parameterProviders.get("path").getParameter("httprequest"))
            .getContextPath();
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

      // If callbacks is properly setup, we assume we're being called from another plugin
      if (this.callbacks != null && callbacks.size() > 0 && HashMap.class.isInstance(callbacks.get(0))) {
        HashMap<String, Object> iface = (HashMap<String, Object>) callbacks.get(0);
        pathParams = parameterProviders.get("path");
        contentItem = outputHandler.getOutputContentItem("response", "content", instanceId, MIME_HTML); //$NON-NLS-1$
        out = (OutputStream) iface.get("output"); //$NON-NLS-1$
        method = "/" + (String) iface.get("method"); //$NON-NLS-1$
        payload = (String) iface.get("payload"); //$NON-NLS-1$
        this.userSession = this.userSession != null ? this.userSession : (IPentahoSession) iface.get("usersession"); //$NON-NLS-1$
      } else { // if not, we handle the request normally
        pathParams = parameterProviders.get("path");
        contentItem = outputHandler.getOutputContentItem("response", "content", instanceId, MIME_HTML);
        out = contentItem.getOutputStream(null);
        method = pathParams.getStringParameter("path", null);
        payload = "";
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

      findMethod(method, contentItem, out, payload);

    } catch (Exception e) {
      e.printStackTrace();
      logger.error("Error creating cdf content: " + e.getMessage()); //$NON-NLS-1$
    }
  }

  private void findMethod(final String urlPath, final IContentItem contentItem, final OutputStream out, String payload)
      throws Exception {

    // Each block will call a different method. If in the future this extends a lot we can think
    // about using reflection for class loading, but I don't expect that to happen.

    final IParameterProvider requestParams = parameterProviders.get(IParameterProvider.SCOPE_REQUEST);

    if (urlPath.equals(RENDER_XCDF)) {
      RepositoryFile xcdfFile = PentahoSystem.get(IUnifiedRepository.class, null).getFileById(
          requestParams.getStringParameter("id", null));
      renderXCDFDashboard(requestParams, out, xcdfFile.getPath(), requestParams.getStringParameter("template", null)); //$NON-NLS-1$
    } else if (urlPath.equals(JSON_SOLUTION)) {
      jsonSolution(out, requestParams);
    } else if (urlPath.equals(GET_CDF_RESOURCE)) {
      getCDFResource(urlPath, contentItem, out, requestParams);
    } else if (urlPath.equals(RENDER_HTML)) {
      renderHtml(out, requestParams);
    } else if (urlPath.equals(EXPORT)) {
      exportFile(requestParams, out);
    } else if (urlPath.equals(SETTINGS)) {
      cdfSettings(requestParams, out);
    } else if (urlPath.equals(CALLACTION)) {
      callAction(requestParams, out);
    } else if (urlPath.equals(COMMENTS)) {
      processComments(requestParams, out);
    } else if (urlPath.equals(STORAGE)) {
      processStorage(requestParams, out);
    } else if (urlPath.equals(CONTEXT)) {
      generateContext(requestParams, out);
    } else if (urlPath.equals(CLEAR_CACHE)) {
      clearCache(requestParams, out);
    } else if (urlPath.equals(GETHEADERS)) {
      if (!payload.equals("")) {
        getHeaders(payload, requestParams, out);
      } else {
        getHeaders(requestParams, out);
      }
    } else if (urlPath.endsWith(".xcdf")) {
      renderXCDFDashboard(requestParams, out, urlPath, requestParams.getStringParameter("template", null)); //$NON-NLS-1$
    } else {
      // we'll be providing the actual content with cache
      logger.warn("Getting resources through content generator is deprecated, please use static resources: " + urlPath);
      returnResource(urlPath, contentItem, out);
    }
  }

  private void generateContext(final IParameterProvider requestParams, final OutputStream out) throws Exception {

    DashboardContext context = new DashboardContext(userSession);
    out.write(context.getContext(requestParams).getBytes(ENCODING));
  }

  private void generateStorage(final IParameterProvider requestParams, final OutputStream out) throws Exception {

    final StringBuilder s = new StringBuilder();
    s.append("\n<script language=\"javascript\" type=\"text/javascript\">\n"); //$NON-NLS-1$
    s.append("  Dashboards.storage = ");
    s.append(StorageEngine.getInstance().read(requestParams, userSession)).append("\n");
    s.append("</script>\n");
    // setResponseHeaders(MIME_PLAIN,0,null);
    out.write(s.toString().getBytes(ENCODING));

  }

/*
  private void renderXcdf(final OutputStream out, final IParameterProvider requestParams) throws Exception {
    long start = System.currentTimeMillis();

    final String solution = requestParams.getStringParameter("solution", null); //$NON-NLS-1$
    final String path = requestParams.getStringParameter("path", null); //$NON-NLS-1$
    final String template = requestParams.getStringParameter("template", null); //$NON-NLS-1$
    final String action = requestParams.getStringParameter("action", null); //$NON-NLS-1$

    UUID uuid = CpfAuditHelper.startAudit(PLUGIN_NAME, requestParams.getParameter("action").toString(),
        getObjectName(), this.userSession, this, requestParams);

    try {
      final IMimeTypeListener mimeTypeListener = outputHandler.getMimeTypeListener();
      if (mimeTypeListener != null) {
        mimeTypeListener.setMimeType(MIMETYPE);
      }

      renderXCDFDashboard(requestParams, out, solution, path, action, template);

      long end = System.currentTimeMillis();
      CpfAuditHelper.endAudit(PLUGIN_NAME, requestParams.getParameter("action").toString(), getObjectName(),
          this.userSession, this, start, uuid, end);

    } catch (Exception e) {
      long end = System.currentTimeMillis();
      CpfAuditHelper.endAudit(PLUGIN_NAME, requestParams.getParameter("action").toString(), getObjectName(),
          this.userSession, this, start, uuid, end);
      throw e;
    }
  }
*/
  
  private void jsonSolution(final OutputStream out, final IParameterProvider requestParams) throws JSONException,
      ParserConfigurationException {
    if (requestParams == null) {
      error(Messages.getErrorString("CdfContentGenerator.ERROR_0004_NO_REQUEST_PARAMS")); //$NON-NLS-1$
      throw new InvalidParameterException(Messages.getString("CdfContentGenerator.ERROR_0017_NO_REQUEST_PARAMS")); //$NON-NLS-1$
    }

    final String solution = requestParams.getStringParameter("solution", null); //$NON-NLS-1$
    final String path = requestParams.getStringParameter("path", null); //$NON-NLS-1$
    final String mode = requestParams.getStringParameter("mode", null); //$NON-NLS-1$
    final String contextPath = ((HttpServletRequest) parameterProviders.get("path").getParameter("httprequest"))
        .getContextPath();
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

  private void getCDFResource(final String urlPath, final IContentItem contentItem, final OutputStream out,
      final IParameterProvider requestParams) throws Exception {
    if (requestParams == null) {
      error(Messages.getErrorString("CdfContentGenerator.ERROR_0004_NO_REQUEST_PARAMS")); //$NON-NLS-1$
      throw new InvalidParameterException(Messages.getString("CdfContentGenerator.ERROR_0017_NO_REQUEST_PARAMS")); //$NON-NLS-1$
    }

    final String resource = requestParams.getStringParameter("resource", null); //$NON-NLS-1$
    contentItem.setMimeType(MimeHelper.getMimeTypeFromFileName(resource));
    //TODO: unused
    //    String[] allowedRoots = new String[2];
    //    allowedRoots[0] = PentahoSystem.getApplicationContext().getSolutionPath("system/" + PLUGIN_NAME);
    //    allowedRoots[1] = PentahoSystem.getApplicationContext().getSolutionPath(SOLUTION_DIR);
    final HttpServletResponse response = (HttpServletResponse) parameterProviders.get("path").getParameter(
        "httpresponse");
    try {
      getSolutionFile(resource, out, this);
    } catch (SecurityException e) {
      response.sendError(HttpServletResponse.SC_FORBIDDEN);
    }
  }

  private void renderHtml(final OutputStream out, final IParameterProvider requestParams) throws Exception {
    CdfHtmlTemplateRenderer htmlRenderer = new CdfHtmlTemplateRenderer();

    final IMimeTypeListener mimeTypeListener = outputHandler.getMimeTypeListener();
    if (mimeTypeListener != null) {
      mimeTypeListener.setMimeType(MIMETYPE);
    }

    htmlRenderer.setOutputStream(out);

    String fileId = requestParams.getStringParameter("id", null);
    if ((fileId == null) || (fileId.trim().length() == 0)) {
      File pluginDir = ((PluginClassLoader) this.getClass().getClassLoader()).getPluginDir();
      htmlRenderer.setFile(new File(pluginDir, "default-dashboard-template.html"));
    } else if (fileId.startsWith("\\")) { //$NON-NLS-1$

    } else {
      htmlRenderer.setRepositoryFile(PentahoSystem.get(IUnifiedRepository.class, null).getFile(fileId));
    }

    htmlRenderer.setTemplate(requestParams.getStringParameter("template", null));
    htmlRenderer.setDebug(requestParams.hasParameter("debug")
        && requestParams.getParameter("debug").toString().equals("true"));
    htmlRenderer.setBaseUrl((requestParams.hasParameter("root") ? "http://"
        + requestParams.getParameter("root").toString() : "")
        + RELATIVE_URL);
    htmlRenderer.setUserSession(userSession);
    htmlRenderer.setMsgsFileBaseName(requestParams.getStringParameter("messages", null));

    Map<String, Object> parameterMap = new HashMap<String, Object>();
    Iterator it = requestParams.getParameterNames();
    while (it.hasNext()) {
      String p = (String) it.next();
      if (p.indexOf("parameters") == 0) {
        parameterMap.put(p, requestParams.getParameter(p));
      }
    }
    htmlRenderer.setVarArgs(parameterMap);

    htmlRenderer.execute();

    setResponseHeaders(htmlRenderer.getMimeType(null), 0, null);

  }

  public void renderXCDFDashboard(final IParameterProvider requestParams, final OutputStream out,
      final String xcdfFilePath, String template) throws Exception {
    long start = System.currentTimeMillis();

    UUID uuid = CdfAuditHelper.startAudit(FilenameUtils.getName(xcdfFilePath), getObjectName(), this.userSession, this);
    try {

      final IMimeTypeListener mimeTypeListener = outputHandler.getMimeTypeListener();
      if (mimeTypeListener != null) {
        mimeTypeListener.setMimeType(MIMETYPE);
      }

      XcdfRenderer xcdfRenderer = new XcdfRenderer();

      IUnifiedRepository unifiedRepository = PentahoSystem.get(IUnifiedRepository.class, null);
      RepositoryFile xcdfFile = unifiedRepository.getFile(xcdfFilePath);
      if (xcdfFile != null) {
        xcdfRenderer.setOutputStream(out);
        xcdfRenderer.setRepositoryFile(xcdfFile);
        xcdfRenderer.setTemplate(template);
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
      CdfAuditHelper.endAudit(xcdfFilePath, getObjectName(), this.userSession, this,
          start, uuid, end);

    } catch (Exception e) {
      e.printStackTrace();
      long end = System.currentTimeMillis();
      CdfAuditHelper.endAudit(xcdfFilePath, getObjectName(), this.userSession, this,
          start, uuid, end);
      throw e;
    }

  }

  private void returnResource(final String urlPath, final IContentItem contentItem, final OutputStream out)
      throws Exception {
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

  private void getTemplateSections(File templateFile, String[] templateSections, ArrayList<String> i18nTagsList)
      throws Exception {
    final IUITemplater templater = PentahoSystem.get(IUITemplater.class, userSession);
    if (templater == null) {
      templateSections[0] = Messages.getErrorString("CdfContentGenerator.ERROR_0005_BAD_TEMPLATE_OBJECT"); //$NON-NLS-1$
    } else {
      String templateContent = IOUtils.toString(new FileInputStream(templateFile), LocaleHelper.getSystemEncoding());
      // Process i18n on dashboard outer template
      templateContent = updateUserLanguageKey(templateContent);
      templateContent = processi18nTags(templateContent, i18nTagsList);
      // Process i18n on dashboard outer template - end
      final String[] tempSections = templater.breakTemplateString(templateContent, "", userSession); //$NON-NLS-1$
      if (tempSections != null && tempSections.length > 0) {
        templateSections[0] = tempSections[0];
      }
      if (tempSections != null && tempSections.length > 1) {
        templateSections[1] = tempSections[1];
      }
    }
  }

  private String getDashboardContent(InputStream is, ArrayList<String> i18nTagsList) throws Exception {
    // Fixed ISSUE #CDF-113
    //BufferedReader reader = new BufferedReader(new InputStreamReader(is));
    BufferedReader reader = new BufferedReader(new InputStreamReader(is, Charset.forName(LocaleHelper
        .getSystemEncoding())));

    StringBuilder sb = new StringBuilder();
    String line = null;
    while ((line = reader.readLine()) != null) {
      // Process i18n for each line of the dashboard output
      line = processi18nTags(line, i18nTagsList);
      // Process i18n - end
      sb.append(line + "\n"); //$NON-NLS-1$
    }
    is.close();
    return sb.toString();
  }

  private String replaceIntroParameters(String intro, MessageBundlesHelper mbh, ArrayList<String> i18nTagsList,
      String dashboardsMessagesBaseFilename) throws Exception {
    mbh.saveI18NMessageFilesToCache();
    String messageSetPath = mbh.getMessageFilesCacheUrl() + "/"; //$NON-NLS-1$

    // If dashboard specific files aren't specified set message filename in cache to the global messages file filename
    if (dashboardsMessagesBaseFilename == null) {
      dashboardsMessagesBaseFilename = CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME;
    }

    intro = intro.replaceAll("\\{load\\}", "onload=\"load()\""); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
    intro = intro.replaceAll("\\{body-tag-unload\\}", ""); //$NON-NLS-1$
    intro = intro.replaceAll("#\\{GLOBAL_MESSAGE_SET_NAME\\}", dashboardsMessagesBaseFilename); //$NON-NLS-1$
    intro = intro.replaceAll("#\\{GLOBAL_MESSAGE_SET_PATH\\}", messageSetPath); //$NON-NLS-1$
    intro = intro.replaceAll("#\\{GLOBAL_MESSAGE_SET\\}", buildMessageSetCode(i18nTagsList)); //$NON-NLS-1$
    return intro;

  }

  private void outputDashboardHtml(OutputStream out, String intro, String dashboardContent, String footer,
      IParameterProvider requestParams) throws Exception {
    //  final Date startDate = new Date();
    final int headIndex = intro.indexOf("<head>"); //$NON-NLS-1$
    final int length = intro.length();
    final Hashtable addedFiles = new Hashtable();

    out.write(intro.substring(0, headIndex + 6).getBytes(ENCODING));
    // Concat libraries to html head content
    getHeaders(dashboardContent, requestParams, out);
    out.write(intro.substring(headIndex + 7, length - 1).getBytes(ENCODING));
    // Add context
    generateContext(requestParams, out);
    // Add storage
    generateStorage(requestParams, out);

    out.write("<div id=\"dashboardContent\">".getBytes(ENCODING));

    out.write(dashboardContent.getBytes(ENCODING));
    out.write("</div>".getBytes(ENCODING));
    out.write(footer.getBytes(ENCODING));

    setResponseHeaders(MIME_HTML, 0, null);
  }

  public void renderHtmlDashboard(final IParameterProvider requestParams, final OutputStream out,
      RepositoryFile dashboardFile, File templateFile, String dashboardsMessagesBaseFilename) throws Exception {

    ArrayList<String> i18nTagsList = new ArrayList<String>();
    String[] templateSections = new String[] { "", "" };
    getTemplateSections(templateFile, templateSections, i18nTagsList);

    IUnifiedRepository unifiedRepository = PentahoSystem.get(IUnifiedRepository.class, null);

    // Merge dashboard related message file with global message file and save it in the dashboard cache
    String parentDir = FilenameUtils.getFullPathNoEndSeparator(dashboardFile.getPath());
    if (parentDir == "") {
      parentDir = "/";
    }
    parentDir = FilenameUtils.separatorsToUnix(parentDir);

    MessageBundlesHelper mbh = new MessageBundlesHelper(unifiedRepository.getFile(parentDir),
        dashboardsMessagesBaseFilename);

    String intro = replaceIntroParameters(templateSections[0], mbh, i18nTagsList, dashboardsMessagesBaseFilename);
    String footer = templateSections[1];

    final String dashboardContent = getDashboardContent(
        unifiedRepository.getDataForRead(dashboardFile.getId(), SimpleRepositoryFileData.class).getStream(),
        i18nTagsList);
    outputDashboardHtml(out, intro, dashboardContent, footer, requestParams);
  }

  public void renderHtmlDashboard(final IParameterProvider requestParams, final OutputStream out, File dashboardFile,
      File templateFile, String dashboardsMessagesBaseFilename) throws Exception {

    ArrayList<String> i18nTagsList = new ArrayList<String>();
    String[] templateSections = new String[] { "", "" };
    getTemplateSections(templateFile, templateSections, i18nTagsList);

    // Merge dashboard related message file with global message file and save it in the dashboard cache
    File file = new File(dashboardFile.getPath());
    MessageBundlesHelper mbh = new MessageBundlesHelper(dashboardFile.getParentFile(), dashboardsMessagesBaseFilename);

    String intro = replaceIntroParameters(templateSections[0], mbh, i18nTagsList, dashboardsMessagesBaseFilename);
    String footer = templateSections[1];

    final String dashboardContent = getDashboardContent(new FileInputStream(dashboardFile), i18nTagsList);
    outputDashboardHtml(out, intro, dashboardContent, footer, requestParams);
  }

  public void renderHtmlDashboard(final IParameterProvider requestParams, final OutputStream out,
      String dashboardFilePath, String template, String dashboardsMessagesBaseFilename) throws Exception {
    IUnifiedRepository unifiedRepository = PentahoSystem.get(IUnifiedRepository.class, null);
    File dashboardFile = null;
    RepositoryFile dashboardRepositoryFile = null;

    File pluginDir = ((PluginClassLoader) this.getClass().getClassLoader()).getPluginDir();
    if (dashboardFilePath == null || dashboardFilePath.trim().length() == 0) {
      dashboardFile = new File(pluginDir, "default-dashboard-template.html"); //$NON-NLS-1$
    } else if (dashboardFilePath.startsWith("/")) { //$NON-NLS-1$
      dashboardRepositoryFile = unifiedRepository.getFile(dashboardFilePath);
    } else if (dashboardFilePath.startsWith("\\")) { //$NON-NLS-1$

    } else {
      dashboardRepositoryFile = unifiedRepository.getFileById(dashboardFilePath);
    }

    if (template == null) {
      IPluginResourceLoader pluginResourceLoader = PentahoSystem.get(IPluginResourceLoader.class);
      template = pluginResourceLoader.getPluginSetting(this.getClass(), "default-template");
    }
    template = (template == null || template.equals("") ? "" : "-" + template); //$NON-NLS-1$
    File templateFile = new File(pluginDir, "template-dashboard" + template + ".html"); //$NON-NLS-1$

    if (dashboardFile != null) {
      renderHtmlDashboard(requestParams, out, dashboardFile, templateFile, dashboardsMessagesBaseFilename);
    } else if (dashboardRepositoryFile != null) {
      renderHtmlDashboard(requestParams, out, dashboardRepositoryFile, templateFile, dashboardsMessagesBaseFilename);
    }
  }

  private String buildMessageSetCode(ArrayList<String> tagsList) {
    StringBuffer messageCodeSet = new StringBuffer();
    for (String tag : tagsList) {
      messageCodeSet
          .append("\\$('#").append(updateSelectorName(tag)).append("').html(jQuery.i18n.prop('").append(tag).append("'));\n"); //$NON-NLS-1$
    }
    return messageCodeSet.toString();
  }

  private String processi18nTags(String content, ArrayList<String> tagsList) {
    String tagPattern = "CDF.i18n\\(\""; //$NON-NLS-1$
    String[] test = content.split(tagPattern);
    if (test.length == 1) {
      return content;
    }
    StringBuilder resBuffer = new StringBuilder();
    int i;
    String tagValue;
    resBuffer.append(test[0]);
    for (i = 1; i < test.length; i++) {

      // First tag is processed differently that other because is the only case where I don't
      // have key in first position
      resBuffer.append("<span id=\""); //$NON-NLS-1$
      if (i != 0) {
        // Right part of the string with the value of the tag herein
        tagValue = test[i].substring(0, test[i].indexOf("\")")); //$NON-NLS-1$
        tagsList.add(tagValue);
        resBuffer.append(updateSelectorName(tagValue));
        resBuffer.append("\"></span>"); //$NON-NLS-1$
        resBuffer.append(test[i].substring(test[i].indexOf("\")") + 2, test[i].length())); //$NON-NLS-1$
      }
    }
    return resBuffer.toString();
  }

  private String updateSelectorName(String name) {
    // If we've the character . in the message key substitute it conventionally to _
    // when dynamically generating the selector name. The "." character is not permitted in the
    // selector id name
    return name.replace(".", "_");
  }

  private String updateUserLanguageKey(String intro) {

    // Fill the template with the correct user locale
    Locale locale = LocaleHelper.getLocale();
    if (logger.isDebugEnabled()) {
      logger.debug("Current Pentaho user locale: " + locale.getLanguage()); //$NON-NLS-1$
    }
    intro = intro.replaceAll("#\\{LANGUAGE_CODE\\}", locale.getLanguage()); //$NON-NLS-1$
    return intro;
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
          setResponseHeaders(MIME_CSV, 0, "export" + export.getExtension()); //$NON-NLS-1$
        } else {
          export = new ExportExcel(output);
          setResponseHeaders(MIME_XLS, 0, "export" + export.getExtension()); //$NON-NLS-1$
        }

        export.exportFile(new JSONObject(out.toString()));
      }

    } catch (IOException e) {
      logger.error("IOException  exporting file", e);
    } catch (JSONException e) {
      logger.error("JSONException exporting file", e);
    }

  }

  private void cdfSettings(final IParameterProvider requestParams, final OutputStream out) {

    final String method = requestParams.getStringParameter("method", null); //$NON-NLS-1$
    final String key = requestParams.getStringParameter("key", null); //$NON-NLS-1$

    if (method.equals("set")) {
      CdfSettings.getInstance().setValue(key, requestParams.getParameter("value"), userSession); //$NON-NLS-1$
    } else {
      final Object value = CdfSettings.getInstance().getValue(key, userSession);
      final PrintWriter pw = new PrintWriter(out);
      pw.println(value != null ? value.toString() : ""); //$NON-NLS-1$
      pw.flush();
    }
  }

  private void callAction(final IParameterProvider requestParams, final OutputStream out) {

    final ServiceCallAction serviceCallAction = ServiceCallAction.getInstance();
    serviceCallAction.execute(requestParams, userSession, out);
  }

  private void processComments(final IParameterProvider requestParams, final OutputStream out) throws JSONException {

    String result;

    try {

      final CommentsEngine commentsEngine = CommentsEngine.getInstance();
      result = commentsEngine.process(requestParams, userSession);

    } catch (InvalidCdfOperationException ex) {

      final String errMessage = ex.getCause().getClass().getName() + " - " + ex.getMessage(); //$NON-NLS-1$
      logger.error("Error processing comment: " + errMessage); //$NON-NLS-1$
      final JSONObject json = new JSONObject();
      json.put("error", errMessage); //$NON-NLS-1$
      result = json.toString(2);

    }

    final PrintWriter pw = new PrintWriter(out);
    pw.println(result);
    pw.flush();

  }

  private void processStorage(final IParameterProvider requestParams, final OutputStream out) throws JSONException {

    String result;

    try {

      final StorageEngine storagesEngine = StorageEngine.getInstance();
      result = storagesEngine.process(requestParams, userSession);

    } catch (InvalidCdfOperationException ex) {

      final String errMessage = ex.getCause().getClass().getName() + " - " + ex.getMessage(); //$NON-NLS-1$
      logger.error("Error processing storage: " + errMessage); //$NON-NLS-1$
      final JSONObject json = new JSONObject();
      json.put("error", errMessage); //$NON-NLS-1$
      result = json.toString(2);

    }

    final PrintWriter pw = new PrintWriter(out);
    pw.println(result);
    pw.flush();

  }

  @Override
  public Log getLogger() {
    // TODO Auto-generated method stub
    return null;
  }

  public String concatFiles(String includeString, final Hashtable filesAdded, final Hashtable files) {
    //TODO: is this used?
    final String newLine = System.getProperty("line.separator"); //$NON-NLS-1$
    final Enumeration keys = files.keys();
    while (keys.hasMoreElements()) {

      final String key = (String) keys.nextElement();
      final String[] includeFiles = (String[]) files.get(key);

      for (int i = 0; i < includeFiles.length; i++) {
        if (!filesAdded.containsKey(includeFiles[i])) {

          filesAdded.put(includeFiles[i], '1');
          if (key.equals("script")) {
            includeString += "<script language=\"javascript\" type=\"text/javascript\" src=\""
                + includeFiles[i].replaceAll(RELATIVE_URL_TAG, RELATIVE_URL) + "\"></script>" + newLine;
          } else {
            includeString += "<link rel=\"stylesheet\" href=\""
                + includeFiles[i].replaceAll(RELATIVE_URL_TAG, RELATIVE_URL) + "\" type=\"text/css\" />";
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

    IUnifiedRepository unifiedRepository = PentahoSystem.get(IUnifiedRepository.class, null);
    RepositoryFile repositoryFile = unifiedRepository.getFile(resourcePath);
    if (repositoryFile != null) {
      final InputStream in = unifiedRepository.getDataForRead(repositoryFile.getId(), SimpleRepositoryFileData.class)
          .getStream();
      IOUtils.copy(in, out);
      try {
        in.close();
      } catch (Exception e) {
        e.printStackTrace();
      }
    }
  }

  private void setResponseHeaders(final String mimeType, final int cacheDuration, final String attachmentName) {
    // Make sure we have the correct mime type
    final HttpServletResponse response = (HttpServletResponse) parameterProviders.get("path").getParameter(
        "httpresponse");
    response.setHeader("Content-Type", mimeType);

    if (attachmentName != null) {
      response.setHeader("content-disposition", "attachment; filename=" + attachmentName);
    }

    // Cache?
    if (cacheDuration > 0) {
      response.setHeader("Cache-Control", "max-age=" + cacheDuration);
    } else {
      response.setHeader("Cache-Control", "max-age=0, no-store");
    }
  }

  private void getHeaders(final IParameterProvider requestParams, final OutputStream out) throws Exception {

    String dashboard = requestParams.getStringParameter("dashboardContent", "");
    getHeaders(dashboard, requestParams, out);
  }

  private void getHeaders(final String dashboardContent, final IParameterProvider requestParams, final OutputStream out)
      throws Exception {

    final String dashboardType = requestParams.getStringParameter("dashboardType", "blueprint");
    final String scheme = requestParams.getStringParameter("scheme", "http");
    final String suffix;
    final File file;

    /*
     * depending on the dashboard type, the minification engine and its file
     * set will vary.
     */
    logger.info("[Timing] opening resources file: " + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));
    if (dashboardType.equals("mobile")) {
      suffix = "-mobile";
      file = new File(PentahoSystem.getApplicationContext().getSolutionPath(
          "system/" + PLUGIN_NAME + "/resources-mobile.txt"));
    } else if (dashboardType.equals("blueprint")) {
      suffix = "";
      file = new File(PentahoSystem.getApplicationContext().getSolutionPath(
          "system/" + PLUGIN_NAME + "/resources-blueprint.txt"));
    } else {
      suffix = "";
      file = new File(PentahoSystem.getApplicationContext().getSolutionPath(
          "system/" + PLUGIN_NAME + "/resources-blueprint.txt"));
    }
    HashMap<String, String> includes = new HashMap<String, String>();
    final Properties resources = new Properties();
    resources.load(new FileInputStream(file));

    final ArrayList<String> miniscripts = new ArrayList<String>();
    final ArrayList<String> ministyles = new ArrayList<String>();

    final ArrayList<String> scripts = new ArrayList<String>();
    final ArrayList<String> styles = new ArrayList<String>();

    miniscripts.addAll(Arrays.asList(resources.getProperty("commonLibrariesScript", "").split(",")));
    ministyles.addAll(Arrays.asList(resources.getProperty("commonLibrariesLink", "").split(",")));
    scripts.addAll(getExtraScripts(dashboardContent, resources));
    styles.addAll(getExtraStyles(dashboardContent, resources));
    styles.addAll(Arrays.asList(resources.getProperty("style", "").split(",")));
    StringBuilder scriptsBuilders = new StringBuilder();
    StringBuilder stylesBuilders = new StringBuilder();
    final String absRoot = requestParams.hasParameter("root") ? scheme + "://"
        + requestParams.getParameter("root").toString() : "";

    // Add common libraries
    if (requestParams.hasParameter("debug") && requestParams.getParameter("debug").toString().equals("true")) {
      // DEBUG MODE
      for (String header : miniscripts) {
        scriptsBuilders.append("<script type=\"text/javascript\" src=\"")
            .append(header.replaceAll("@RELATIVE_URL@", absRoot + RELATIVE_URL)).append("\"></script>\n");
      }
      for (String header : ministyles) {
        stylesBuilders.append("<link rel=\"stylesheet\" type=\"text/css\" href=\"")
            .append(header.replaceAll("@RELATIVE_URL@", absRoot + RELATIVE_URL)).append("\"/>\n");
      }

    } else {
      // NORMAL MODE
      logger.info("[Timing] starting minification: " + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));
      String stylesHash = packager.minifyPackage("styles" + suffix);
      String scriptsHash = packager.minifyPackage("scripts" + suffix);
      stylesBuilders.append("<link href=\"").append(absRoot).append(RELATIVE_URL)
          .append("/content/pentaho-cdf/js/styles").append(suffix).append(".css?version=").append(stylesHash)
          .append("\" rel=\"stylesheet\" type=\"text/css\" />");
      scriptsBuilders.append("<script type=\"text/javascript\" src=\"").append(absRoot).append(RELATIVE_URL)
          .append("/content/pentaho-cdf/js/scripts").append(suffix).append(".js?version=").append(scriptsHash)
          .append("\"></script>");
      logger.info("[Timing] finished minification: " + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));
    }
    // Add extra components libraries

    for (String header : scripts) {
      scriptsBuilders.append("<script type=\"text/javascript\" src=\"")
          .append(header.replaceAll("@RELATIVE_URL@", absRoot + RELATIVE_URL)).append("\"></script>\n");
    }
    for (String header : styles) {
      stylesBuilders.append("<link rel=\"stylesheet\" type=\"text/css\" href=\"")
          .append(header.replaceAll("@RELATIVE_URL@", absRoot + RELATIVE_URL)).append("\"/>\n");
    }

    // Add ie8 blueprint condition
    stylesBuilders
        .append("<!--[if lte IE 8]><link rel=\"stylesheet\" href=\"")
        .append(absRoot)
        .append(RELATIVE_URL)
        .append(
            "/content/pentaho-cdf/js/blueprint/ie.css\" type=\"text/css\" media=\"screen, projection\"><![endif]-->");

    StringBuilder stuff = new StringBuilder();
    includes.put("scripts", scriptsBuilders.toString());
    includes.put("styles", stylesBuilders.toString());
    for (String key : includes.keySet()) {
      stuff.append(includes.get(key));
    }
    out.write(stuff.toString().getBytes("UTF8"));
  }

  private ArrayList<String> getExtraScripts(String dashboardContentOrig, Properties resources) {

    // Compare this ignoring case
    final String dashboardContent = dashboardContentOrig.toLowerCase();

    ArrayList<String> scripts = new ArrayList<String>();
    boolean all;
    if (dashboardContent == null || StringUtils.isEmpty(dashboardContent)) {
      all = true;
    } else {
      all = false;
    }

    final Enumeration<?> resourceKeys = resources.propertyNames();
    while (resourceKeys.hasMoreElements()) {

      final String scriptkey = (String) resourceKeys.nextElement();

      final String key;

      if (scriptkey.indexOf("Script") != -1 && scriptkey.indexOf("commonLibraries") == -1) {
        key = scriptkey.replaceAll("Script$", "");
      } else {
        continue;
      }

      final int keyIndex = all ? 0 : dashboardContent.indexOf(key.toLowerCase());
      if (keyIndex != -1) {
        if (all || matchComponent(keyIndex, key.toLowerCase(), dashboardContent)) {
          // ugly hack -- if we don't know for sure we need OpenStreetMaps,
          // don't load it!
          if (all && scriptkey.indexOf("mapScript") != -1) {
            continue;
          }
          scripts.addAll(Arrays.asList(resources.getProperty(scriptkey).split(",")));
        }
      }
    }

    return scripts;
  }

  private ArrayList<String> getExtraStyles(String dashboardContentOrig, Properties resources) {
    // Compare this ignoring case
    final String dashboardContent = dashboardContentOrig.toLowerCase();

    ArrayList<String> styles = new ArrayList<String>();
    boolean all;
    if (dashboardContent == null || StringUtils.isEmpty(dashboardContent)) {
      all = true;
    } else {
      all = false;
    }

    if (dashboardContent != null && !StringUtils.isEmpty(dashboardContent)) {
      final Enumeration<?> resourceKeys = resources.propertyNames();
      while (resourceKeys.hasMoreElements()) {

        final String scriptkey = (String) resourceKeys.nextElement();

        final String key;

        if (scriptkey.indexOf("Link") != -1 && scriptkey.indexOf("commonLibraries") == -1) {
          key = scriptkey.replaceAll("Link$", "");
        } else {
          continue;
        }

        final int keyIndex = all ? 0 : dashboardContent.indexOf(key.toLowerCase());
        if (keyIndex != -1) {
          if (matchComponent(keyIndex, key.toLowerCase(), dashboardContent)) {
            styles.addAll(Arrays.asList(resources.getProperty(scriptkey).split(",")));
          }
        }
      }
    }
    return styles;
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
      packager.registerPackage("scripts", Packager.Filetype.JS, rootdir, rootdir + "/js/scripts.js",
          scriptsList.toArray(new String[scriptsList.size()]));
    }

    if (!stylesAvailable) {
      stylesList.clear();
      stylesList.addAll(Arrays.asList(blueprintResources.get("commonLibrariesLink").toString().split(",")));
      for (int i = 0; i < stylesList.size(); i++) {
        String fname = stylesList.get(i);
        stylesList.set(i, fname.replaceAll(RELATIVE_URL_TAG + "/content/pentaho-cdf", ""));
      }
      packager.registerPackage("styles", Packager.Filetype.CSS, rootdir, rootdir + "/js/styles.css",
          stylesList.toArray(new String[stylesList.size()]));
    }
    if (!mobileScriptsAvailable) {
      scriptsList.clear();
      scriptsList.addAll(Arrays.asList(mobileResources.get("commonLibrariesScript").toString().split(",")));
      for (int i = 0; i < scriptsList.size(); i++) {
        String fname = scriptsList.get(i);
        scriptsList.set(i, fname.replaceAll(RELATIVE_URL_TAG + "/content/pentaho-cdf", ""));
      }
      packager.registerPackage("scripts-mobile", Packager.Filetype.JS, rootdir, rootdir + "/js/scripts-mobile.js",
          scriptsList.toArray(new String[scriptsList.size()]));
    }

    if (!mobileStylesAvailable) {
      stylesList.clear();
      stylesList.addAll(Arrays.asList(mobileResources.get("commonLibrariesLink").toString().split(",")));
      for (int i = 0; i < stylesList.size(); i++) {
        String fname = stylesList.get(i);
        stylesList.set(i, fname.replaceAll(RELATIVE_URL_TAG + "/content/pentaho-cdf", ""));
      }
      packager.registerPackage("styles-mobile", Packager.Filetype.CSS, rootdir, rootdir + "/js/styles-mobile.css",
          stylesList.toArray(new String[stylesList.size()]));
    }
  }

  private static String getBaseUrl() {

    String baseUrl;
    try {
      // Note - this method is deprecated and returns different values in 3.6
      // and 3.7. Change this in future versions -- but not yet
      //getFullyQualifiedServerUeRL only available from 3.7
      //  URI uri = new URI(PentahoSystem.getApplicationContext().getFullyQualifiedServerURL());
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

  public void clearCache(final IParameterProvider requestParams, final OutputStream out) {
    try {
      DashboardContext.clearCache();
      out.write("Cache cleared".getBytes("utf-8"));
    } catch (IOException e) {
      logger.error("failed to clear CDFcache");
    }
  }
}
