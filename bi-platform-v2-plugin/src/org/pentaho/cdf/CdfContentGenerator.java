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
import java.security.InvalidParameterException;
import java.util.Calendar;
import java.util.Date;
import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.Properties;
import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.ParserConfigurationException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.comments.CommentsEngine;
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
 * <p/>
 * - JSONSolution
 * - GetCDFResource
 * - .xcdf requests
 * - js files
 * - files within resources
 *
 * @author Will Gorman (wgorman@pentaho.com)
 */
public class CdfContentGenerator extends BaseContentGenerator
{

  private static final long serialVersionUID = 5608691656289862706L;
  private static final Log logger = LogFactory.getLog(CdfContentGenerator.class);
  public static final String PLUGIN_NAME = "pentaho-cdf"; //$NON-NLS-1$
  private static final String MIMETYPE = "text/html"; //$NON-NLS-1$

  // Possible actions
  private static final String RENDER_HTML = "/RenderHTML";
  private static final String RENDER_XCDF = "/RenderXCDF";
  private static final String JSON_SOLUTION = "/JSONSolution"; //$NON-NLS-1$
  private static final String GET_CDF_RESOURCE = "/GetCDFResource"; //$NON-NLS-1$
  private static final String EXPORT = "/Export"; //$NON-NLS-1$
  private static final String SETTINGS = "/Settings"; //$NON-NLS-1$
  private static final String CALLACTION = "/CallAction"; //$NON-NLS-1$
  private static final String COMMENTS = "/Comments"; //$NON-NLS-1$
  private static final String CONTEXT = "/Context"; //$NON-NLS-1$
  private static final String MIME_HTML = "text/html";
  private static final String MIME_CSS = "text/css";
  private static final String MIME_JS = "text/javascript";
  private static final String MIME_PLAIN = "text/plain";
  private static final String MIME_CSV = "text/csv";
  private static final String MIME_XLS = "application/vnd.ms-excel";


  // CDF Resource BaseURL
  private static final String BASE_URL_TAG = "@BASE_URL@";
  public static final String BASE_URL;

  static
  {
    final String[] urlSplit = PentahoSystem.getApplicationContext().getBaseUrl().split("[/]+");
    String path = "";
    if (urlSplit.length > 2)
    {
      path = "/" + urlSplit[2];
    }
    BASE_URL = path;
  }

  @Override
  public void createContent() throws Exception
  {

    // make sure we have an output stream, cannot do anything without one
    final OutputStream out;
    if (outputHandler == null)
    {
      error(Messages.getErrorString("CdfContentGenerator.ERROR_0001_NO_OUTPUT_HANDLER")); //$NON-NLS-1$
      throw new InvalidParameterException(Messages.getString("CdfContentGenerator.ERROR_0001_NO_OUTPUT_HANDLER"));  //$NON-NLS-1$
    }

    final IContentItem contentItem = outputHandler.getOutputContentItem("response", "content", "", instanceId, MIMETYPE); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$

    if (contentItem == null)
    {
      error(Messages.getErrorString("CdfContentGenerator.ERROR_0002_NO_CONTENT_ITEM")); //$NON-NLS-1$
      throw new InvalidParameterException(Messages.getString("CdfContentGenerator.ERROR_0002_NO_CONTENT_ITEM"));  //$NON-NLS-1$
    }

    out = contentItem.getOutputStream(null);
    if (out == null)
    {
      error(Messages.getErrorString("CdfContentGenerator.ERROR_0003_NO_OUTPUT_STREAM")); //$NON-NLS-1$
      throw new InvalidParameterException(Messages.getString("CdfContentGenerator.ERROR_0003_NO_OUTPUT_STREAM"));  //$NON-NLS-1$
    }

    // see if we have any url path after us on the URL, e.g. pentaho/content/pentaho-cdf/JSONSolution, etc
    final IParameterProvider pathParams = parameterProviders.get("path"); //$NON-NLS-1$

    final String urlPath = pathParams.getStringParameter("path", null); //$NON-NLS-1$

    findMethod(urlPath, contentItem, out);

  }

  private void findMethod(final String urlPath, final IContentItem contentItem, final OutputStream out) throws Exception
  {

    // Each block will call a different method. If in the future this extends a lot we can think
    // about using reflection for class loading, but I don't expect that to happen.

    final IParameterProvider requestParams = parameterProviders.get(IParameterProvider.SCOPE_REQUEST);

    if (urlPath.equals(RENDER_XCDF))
    {

      renderXcdf(out, requestParams);

    }
    else if (urlPath.equals(JSON_SOLUTION))
    {

      jsonSolution(out, requestParams);
    }
    else if (urlPath.equals(GET_CDF_RESOURCE))
    {

      getCDFResource(urlPath, contentItem, out, requestParams);
    }
    else if (urlPath.equals(RENDER_HTML))
    {

      renderHtml(out, requestParams);
    }
    else if (urlPath.equals(EXPORT))
    {
      exportFile(requestParams, outputHandler);
    }
    else if (urlPath.equals(SETTINGS))
    {
      cdfSettings(requestParams, out);
    }
    else if (urlPath.equals(CALLACTION))
    {
      callAction(requestParams, out);
    }
    else if (urlPath.equals(COMMENTS))
    {
      processComments(requestParams, out);
    }
    else if (urlPath.equals(CONTEXT))
    {
      generateContext(requestParams, out);
    }
    else
    {
      // we'll be providing the actual content with cache
      returnResource(urlPath, contentItem, out);

    }

  }

  private void generateContext(final IParameterProvider requestParams, final OutputStream out) throws Exception
  {

    final JSONObject context = new JSONObject();
    Calendar cal = Calendar.getInstance();
    context.put("serverLocalDate", cal.getTimeInMillis());
    context.put("serverUTCDate", cal.getTimeInMillis() + cal.getTimeZone().getRawOffset());
    context.put("user", userSession.getName());
    context.put("roles", PentahoSystem.getUserDetailsRoleListService().getRolesForUser(userSession.getName()));

    JSONObject params = new JSONObject();

    Iterator it = requestParams.getParameterNames();
    while (it.hasNext())
    {
      String p = (String) it.next();
      if (p.indexOf("parameters") == 0)
      {
        params.put(p.substring(5), requestParams.getParameter(p));
      }
    }
    context.put("params", params);

    final StringBuilder s = new StringBuilder();
    s.append("<script language=\"javascript\" type=\"text/javascript\">\n");
    s.append("  Dashboards.context = ");
    s.append(context.toString(2) + "\n");
    s.append("</script>");
    // setResponseHeaders(MIME_PLAIN,0,null);
    out.write(s.toString().getBytes("UTF-8"));

  }


  private void renderXcdf(final OutputStream out, final IParameterProvider requestParams) throws Exception
  {
    final IMimeTypeListener mimeTypeListener = outputHandler.getMimeTypeListener();
    if (mimeTypeListener != null)
    {
      mimeTypeListener.setMimeType(MIMETYPE);
    }

    final String solution = requestParams.getStringParameter("solution", null); //$NON-NLS-1$
    final String path = requestParams.getStringParameter("path", null); //$NON-NLS-1$
    final String template = requestParams.getStringParameter("template", null); //$NON-NLS-1$

    final String action = requestParams.getStringParameter("action", null); //$NON-NLS-1$
    renderXCDFDashboard(requestParams, out, solution, path, action, template);
  }

  private void jsonSolution(final OutputStream out,
                            final IParameterProvider requestParams) throws JSONException, ParserConfigurationException
  {
    if (requestParams == null)
    {
      error(Messages.getErrorString("CdfContentGenerator.ERROR_0004_NO_REQUEST_PARAMS")); //$NON-NLS-1$
      throw new InvalidParameterException(Messages.getString("CdfContentGenerator.ERROR_0017_NO_REQUEST_PARAMS"));  //$NON-NLS-1$
    }

    final String solution = requestParams.getStringParameter("solution", null); //$NON-NLS-1$
    final String path = requestParams.getStringParameter("path", null); //$NON-NLS-1$
    final String mode = requestParams.getStringParameter("mode", null); //$NON-NLS-1$
    final NavigateComponent nav = new NavigateComponent(userSession);
    final String json = nav.getNavigationElements(mode, solution, path);
    final PrintWriter pw = new PrintWriter(out);
    pw.println(json);
    pw.flush();

  }

  private void getCDFResource(final String urlPath,
                              final IContentItem contentItem,
                              final OutputStream out,
                              final IParameterProvider requestParams)
      throws Exception
  {
    if (requestParams == null)
    {
      error(Messages.getErrorString("CdfContentGenerator.ERROR_0004_NO_REQUEST_PARAMS")); //$NON-NLS-1$
      throw new InvalidParameterException(Messages.getString("CdfContentGenerator.ERROR_0017_NO_REQUEST_PARAMS"));  //$NON-NLS-1$
    }

    final String resource = requestParams.getStringParameter("resource", null); //$NON-NLS-1$
    contentItem.setMimeType(MimeHelper.getMimeTypeFromFileName(urlPath));
    getSolutionFile(resource, out, this);
  }

  private void renderHtml(final OutputStream out, final IParameterProvider requestParams) throws Exception
  {
    final IMimeTypeListener mimeTypeListener = outputHandler.getMimeTypeListener();
    if (mimeTypeListener != null)
    {
      mimeTypeListener.setMimeType(MIMETYPE);
    }

    final String solution = requestParams.getStringParameter("solution", null); //$NON-NLS-1$
    final String template = requestParams.getStringParameter("template", null); //$NON-NLS-1$
    final String path = requestParams.getStringParameter("path", null); //$NON-NLS-1$
    final String templateName = requestParams.getStringParameter("dashboard", null);
    renderHtmlDashboard(requestParams, out, solution, path, templateName == null ? "template.html" : templateName, template);
  }

  private void returnResource(final String urlPath,
                              final IContentItem contentItem,
                              final OutputStream out) throws Exception
  {
    final IParameterProvider pathParams = parameterProviders.get("path"); //$NON-NLS-1$
    contentItem.setMimeType(MimeHelper.getMimeTypeFromFileName(urlPath));

    final IPluginResourceLoader resLoader = PentahoSystem.get(IPluginResourceLoader.class, null);
    final String maxAge = resLoader.getPluginSetting(CdfContentGenerator.class, "pentaho-cdf/max-age");
    final HttpServletResponse response = (HttpServletResponse) pathParams.getParameter("httpresponse");
    if (maxAge != null && response != null)
    {
      response.setHeader("Cache-Control", "max-age=" + maxAge);
    }

    getContent(urlPath, out, this);
  }

  public void renderXCDFDashboard(final IParameterProvider requestParams, final OutputStream out,
                                  final String solution,
                                  final String path,
                                  final String action,
                                  String template) throws Exception
  {

    final String fullPath = ActionInfo.buildSolutionPath(solution, path, action);

    // Check for access permissions

    final ISolutionRepository repository = PentahoSystem.get(ISolutionRepository.class, userSession);
    if (repository.getSolutionFile(fullPath, ISolutionRepository.ACTION_EXECUTE) == null)
    {
      out.write("Access Denied".getBytes("UTF-8"));
      return;
    }

    String templateName = null;
    if (repository.resourceExists(fullPath))
    {
      final ActionResource resource = new ActionResource("", IActionSequenceResource.SOLUTION_FILE_RESOURCE, "text/xml",
          fullPath);
      final String dashboardMetadata = repository.getResourceAsString(resource);
      final Document doc = DocumentHelper.parseText(dashboardMetadata);
      templateName = XmlDom4JHelper.getNodeText("/cdf/template", doc, "");
      // If a "style" tag exists, use that one
      if (doc.selectSingleNode("/cdf/style") != null)
      {
        template = XmlDom4JHelper.getNodeText("/cdf/style", doc);
      }
    }
    renderHtmlDashboard(requestParams, out, solution, path, templateName, template);
  }

  public void renderHtmlDashboard(final IParameterProvider requestParams, final OutputStream out,
                                  final String solution,
                                  final String path,
                                  final String templateName,
                                  String template) throws Exception
  {

    if (template == null || template.equals(""))
    {
      template = "";
    }
    else
    {
      template = "-" + template;
    }


    final ISolutionRepository repository = PentahoSystem.get(ISolutionRepository.class, userSession);
    final ActionResource resource;

    String fullTemplatePath = null;

    if (templateName != null)
    {
      if (templateName.startsWith("/") || templateName.startsWith("\\"))
      { //$NON-NLS-1$ //$NON-NLS-2$
        fullTemplatePath = templateName;
      }
      else
      {
        fullTemplatePath = ActionInfo.buildSolutionPath(solution, path, templateName);
      }
    }


    if (fullTemplatePath != null && repository.resourceExists(fullTemplatePath))
    {
      resource = new ActionResource("", IActionSequenceResource.SOLUTION_FILE_RESOURCE, "text/xml", //$NON-NLS-1$ //$NON-NLS-2$
          fullTemplatePath);
    }
    else
    {
      resource = new ActionResource("", IActionSequenceResource.SOLUTION_FILE_RESOURCE, "text/xml", //$NON-NLS-1$ //$NON-NLS-2$
          "system/" + PLUGIN_NAME + "/default-dashboard-template.html"); //$NON-NLS-1$ //$NON-NLS-2$
    }


    // Check for access permissions
    if (repository.getSolutionFile(resource, ISolutionRepository.ACTION_EXECUTE) == null)
    {
      out.write("Access Denied".getBytes("UTF-8"));
      return;
    }


    String intro = ""; //$NON-NLS-1$
    String footer = ""; //$NON-NLS-1$

    final String dashboardTemplate = "template-dashboard" + template + ".html"; //$NON-NLS-1$

    final IUITemplater templater = PentahoSystem.get(IUITemplater.class, userSession);
    if (templater != null)
    {
      final ActionResource templateResource = new ActionResource("", IActionSequenceResource.SOLUTION_FILE_RESOURCE, "text/xml", "system/" + PLUGIN_NAME + "/" + dashboardTemplate); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
      final String templateContent = repository.getResourceAsString(templateResource);
      final String[] sections = templater.breakTemplateString(templateContent, "", userSession); //$NON-NLS-1$
      if (sections != null && sections.length > 0)
      {
        intro = sections[0];
      }
      if (sections != null && sections.length > 1)
      {
        footer = sections[1];
      }
    }
    else
    {
      intro = Messages.getErrorString("CdfContentGenerator.ERROR_0005_BAD_TEMPLATE_OBJECT");
    }

    final String dashboardContent;


    // TESTING to localize the template
    //dashboardContent = repository.getResourceAsString(resource);
    InputStream is = repository.getResourceInputStream(resource, true);
    BufferedReader reader = new BufferedReader(new InputStreamReader(is));
    StringBuilder sb = new StringBuilder();
    String line = null;
    while ((line = reader.readLine()) != null)
    {
      sb.append(line + "\n");
    }
    is.close();
    dashboardContent = sb.toString();

    intro = intro.replaceAll("\\{load\\}", "onload=\"load()\""); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$

    intro = intro.replaceAll("\\{body-tag-unload\\}", "");

    /************************************************/
    /*      Add cdf libraries
    /************************************************/
    final Date startDate = new Date();
    final int headIndex = intro.indexOf("<head>");
    final int length = intro.length();
    final Hashtable addedFiles = new Hashtable();

    //Read resource file properties
    final File file = new File(PentahoSystem.getApplicationContext().getSolutionPath(
        "system/" + PLUGIN_NAME + "/resources.txt"));

    final Properties resources = new Properties();
    resources.load(new FileInputStream(file));

    // Add common libraries
    final Hashtable commonLibraries = new Hashtable();
    commonLibraries.put("script", resources.getProperty("commonLibrariesScript", "").split(","));
    commonLibraries.put("link", resources.getProperty("commonLibrariesLink", "").split(","));
    String javaScriptLibrary = concatFiles("", addedFiles, commonLibraries);

    //Add extra components libraries
    final Enumeration resourceKeys = resources.propertyNames();
    while (resourceKeys.hasMoreElements())
    {

      final String scriptkey = (String) resourceKeys.nextElement();

      final String key;
      final String type;

      if (scriptkey.indexOf("Script") != -1 && scriptkey.indexOf("commonLibraries") == -1)
      {
        key = scriptkey.replaceAll("Script$", "");
        type = "script";
      }
      else if (scriptkey.indexOf("Link") != -1 && scriptkey.indexOf("commonLibraries") == -1)
      {
        key = scriptkey.replaceAll("Link$", "");
        type = "link";
      }
      else
      {
        continue;
      }

      final int keyIndex = dashboardContent.indexOf(key);
      if (keyIndex != -1)
      {
        if (matchComponent(keyIndex, key, dashboardContent))
        {
          final Hashtable component = new Hashtable();
          component.put(type, resources.getProperty(scriptkey).split(","));
          javaScriptLibrary = concatFiles(javaScriptLibrary, addedFiles, component);
        }
      }
    }

    //Concat libraries to html head content
    intro = intro.substring(0, headIndex + 6) + javaScriptLibrary + intro.substring(headIndex + 7, length - 1);
    if (logger.isDebugEnabled())
    {
      logger.debug("*** Finish: " + (new Date().getTime() - startDate.getTime()));
    }

    out.write(intro.getBytes("UTF-8"));

    // Add context
    generateContext(requestParams, out);

    out.write("<div id=\"dashboardContent\">".getBytes("UTF-8"));
    out.write(dashboardContent.getBytes("UTF-8"));
    out.write("</div>".getBytes("UTF-8"));
    out.write(footer.getBytes("UTF-8"));


    setResponseHeaders(MIME_HTML, 0, null);
  }

  private void exportFile(final IParameterProvider requestParams, final IOutputHandler outputHandler)
  {

    try
    {

      final ByteArrayOutputStream out = new ByteArrayOutputStream();

      final ServiceCallAction serviceCallAction = ServiceCallAction.getInstance();
      if (serviceCallAction.execute(requestParams, userSession, out))
      {

        final String exportType = requestParams.getStringParameter("exportType", "excel");

        Export export;

        if (exportType.equals("csv"))
        {
          export = new ExportCSV(outputHandler);
          setResponseHeaders(MIME_CSV, 0, "export.csv");
        }
        else
        {
          export = new ExportExcel(outputHandler);
          setResponseHeaders(MIME_XLS, 0, "export.xls");
        }

        export.exportFile(new JSONObject(out.toString()));
      }

    }
    catch (IOException e)
    {
      e.printStackTrace();
    }
    catch (JSONException e)
    {
      e.printStackTrace();
    }

  }

  private void cdfSettings(final IParameterProvider requestParams, final OutputStream out)
  {

    final String method = requestParams.getStringParameter("method", null);
    final String key = requestParams.getStringParameter("key", null);

    if (method.equals("set"))
    {
      CdfSettings.getInstance().setValue(key, requestParams.getParameter("value"), userSession);
    }
    else
    {
      final Object value = CdfSettings.getInstance().getValue(key, userSession);
      final PrintWriter pw = new PrintWriter(out);
      pw.println(value != null ? value.toString() : "");
      pw.flush();
    }
  }

  private void callAction(final IParameterProvider requestParams, final OutputStream out)
  {

    final ServiceCallAction serviceCallAction = ServiceCallAction.getInstance();
    serviceCallAction.execute(requestParams, userSession, out);
  }

  private void processComments(final IParameterProvider requestParams, final OutputStream out) throws JSONException
  {

    String result;

    try
    {

      final CommentsEngine commentsEngine = CommentsEngine.getInstance();
      result = commentsEngine.process(requestParams, userSession);

    }
    catch (InvalidCdfOperationException ex)
    {

      final String errMessage = ex.getCause().getClass().getName() + " - " + ex.getMessage();
      logger.error("Error processing comment: " + errMessage);
      final JSONObject json = new JSONObject();
      json.put("error", errMessage);
      result = json.toString(2);

    }

    final PrintWriter pw = new PrintWriter(out);
    pw.println(result);
    pw.flush();

  }

  @Override
  public Log getLogger()
  {
    // TODO Auto-generated method stub
    return null;
  }

  public String concatFiles(String includeString, final Hashtable filesAdded, final Hashtable files)
  {

    final String newLine = System.getProperty("line.separator");
    final Enumeration keys = files.keys();
    while (keys.hasMoreElements())
    {

      final String key = (String) keys.nextElement();
      final String[] includeFiles = (String[]) files.get(key);

      for (int i = 0; i < includeFiles.length; i++)
      {
        if (!filesAdded.containsKey(includeFiles[i]))
        {

          filesAdded.put(includeFiles[i], '1');
          if (key.equals("script"))
          {
            includeString += "<script language=\"javascript\" type=\"text/javascript\" src=\"" + includeFiles[i].replaceAll(BASE_URL_TAG, BASE_URL) + "\"></script>" + newLine;
          }
          else
          {
            includeString += "<link rel=\"stylesheet\" href=\"" + includeFiles[i].replaceAll(BASE_URL_TAG, BASE_URL) + "\" type=\"text/css\" />";
          }

        }
      }
    }

    return includeString;
  }

  public boolean matchComponent(int keyIndex, final String key, final String content)
  {

    for (int i = keyIndex - 1; i > 0; i--)
    {
      if (content.charAt(i) == ':' || content.charAt(i) == '"' || ("" + content.charAt(i)).trim().equals(""))
      {
        //noinspection UnnecessaryContinue
        continue;
      }
      else
      {
        if ((i - 3) > 0 && content.substring((i - 3), i + 1).equals("type"))
        {
          return true;
        }

        break;
      }
    }

    keyIndex = content.indexOf(key, keyIndex + key.length());
    if (keyIndex != -1)
    {
      return matchComponent(keyIndex, key, content);
    }

    return false;
  }

  public void getContent(final String fileName, final OutputStream out, final ILogger logger) throws Exception
  {

    // write out the scripts
    // TODO support caching
    final String path = PentahoSystem.getApplicationContext().getSolutionPath("system/" + PLUGIN_NAME + fileName); //$NON-NLS-1$ //$NON-NLS-2$
    final File file = new File(path);
    final InputStream in = new FileInputStream(file);
    final byte[] buff = new byte[4096];
    int n = in.read(buff);
    while (n != -1)
    {
      out.write(buff, 0, n);
      n = in.read(buff);
    }
    in.close();
  }

  public void getSolutionFile(final String resourcePath, final OutputStream out, final ILogger logger) throws Exception
  {
    final ISolutionRepository repository = PentahoSystem.get(ISolutionRepository.class, userSession);
    final InputStream in = repository.getResourceInputStream(resourcePath, true);
    final byte[] buff = new byte[4096];
    int n = in.read(buff);
    while (n != -1)
    {
      out.write(buff, 0, n);
      n = in.read(buff);
    }
    in.close();
  }


  private void setResponseHeaders(final String mimeType, final int cacheDuration, final String attachmentName)
  {
    // Make sure we have the correct mime type
    final HttpServletResponse response = (HttpServletResponse) parameterProviders.get("path").getParameter("httpresponse");
    response.setHeader("Content-Type", mimeType);

    if (attachmentName != null)
    {
      response.setHeader("content-disposition", "attachment; filename=" + attachmentName);
    }

    // Cache?
    if (cacheDuration > 0)
    {
      response.setHeader("Cache-Control", "max-age=" + cacheDuration);
    }
    else
    {
      response.setHeader("Cache-Control", "max-age=0, no-store");
    }
  }


}
