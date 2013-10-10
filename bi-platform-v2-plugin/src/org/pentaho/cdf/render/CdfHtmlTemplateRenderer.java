package org.pentaho.cdf.render;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.Charset;
import java.util.*;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import org.pentaho.cdf.CdfConstants;
import org.pentaho.cdf.Messages;
import org.pentaho.cdf.context.ContextEngine;
import org.pentaho.cdf.localization.MessageBundlesHelper;

import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.IPluginResourceLoader;
import org.pentaho.platform.api.engine.IUITemplater;
import org.pentaho.platform.api.engine.IUserRoleListService;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.repository2.unified.RepositoryFile;

import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.plugin.services.pluginmgr.PluginClassLoader;
import org.pentaho.platform.util.messages.LocaleHelper;
import org.pentaho.platform.web.http.api.resources.IFileResourceRenderer;

import pt.webdetails.cpf.repository.RepositoryAccess;
import pt.webdetails.packager.Packager;

public class CdfHtmlTemplateRenderer implements IFileResourceRenderer {

  private static final String RELATIVE_URL_TAG = "@RELATIVE_URL@"; //$NON-NLS-1$
  public static final String PLUGIN_NAME = "pentaho-cdf"; //$NON-NLS-1$
  private static final String PREFIX_PARAMETER = "param";
  private static final String STATIC_CDF_PATH = "/api/repos/pentaho-cdf";
  
  private static Log logger = LogFactory.getLog(CdfHtmlTemplateRenderer.class);
 
  OutputStream outputStream = null;
  RepositoryFile jcrSourceFile;
  File sourceFile;
  String template = null;
  String baseUrl  = null;
  boolean debug = false;
  private Packager packager;
  IPentahoSession userSession = null;
  Map<String, Object> varArgs = new HashMap<String, Object>();
  String msgsFileBaseName;
  File pluginRootDir;
  File templateName;
  String filePath;
  IParameterProvider requestParams;
  
  public void setFilePath(String arg0) {
    filePath = arg0;
  }
  
  public String getMsgsFileBaseName() {
    return msgsFileBaseName;
  }

  public void setMsgsFileBaseName(String msgsFileBaseName) {
    this.msgsFileBaseName = msgsFileBaseName;
  }

  public void setOutputStream(OutputStream arg0) {
    outputStream = arg0;
  }
  
  protected OutputStream getOutputStream() {
    return outputStream;
  }
  
  
  public void setRequestParams(IParameterProvider params){
      requestParams = params;
  }
  
  public IParameterProvider getRequestParams(){
      return requestParams;
  }

  public void setRepositoryFile(RepositoryFile arg0) {
    jcrSourceFile = arg0;
    if (jcrSourceFile != null) {
      sourceFile = null;
    }
  }
  
  public void setFile(File htmlTemplateFile) {
    this.sourceFile = htmlTemplateFile;
    if (this.sourceFile != null) {
      setRepositoryFile(null);
    }
  }
  
  public String getMimeType(String arg0) {
    return "text/html";
  }

  public IPentahoSession getUserSession() {
    return userSession;
  }

  public void setUserSession(IPentahoSession userSession) {
    this.userSession = userSession;
  }

  public void setVarArgs(Map<String, Object> arg0) {
    varArgs = arg0;
  }
  
  public void setTemplate(String template) {
    this.template = template;
  }
  
  public String getTemplate() {
    return template;
  }
  
  public String getBaseUrl() {
    return baseUrl;
  }

  public void setBaseUrl(String baseUrl) {
    this.baseUrl = baseUrl;
  }

  public boolean getDebug() {
    return debug;
  }

  public void setDebug(boolean debug) {
    this.debug = debug;
  }
  
  protected File getTemplateFile() {
    String template = this.template;
    if (template == null) {
      IPluginResourceLoader pluginResourceLoader = PentahoSystem.get(IPluginResourceLoader.class);
      template = pluginResourceLoader.getPluginSetting(this.getClass(), "default-template");
    }
    template = (template == null || template.equals("") ? "" : "-" + template); //$NON-NLS-1$
    return new File(((PluginClassLoader) this.getClass().getClassLoader()).getPluginDir(), "template-dashboard" + template + ".html");
  }
  
  private Packager getPackager() throws IOException {
    if (packager == null) {
      packager = createPackager();
    }
    return packager;
  }
  
  public void execute() throws Exception {
    RepositoryAccess repositoryAccess = RepositoryAccess.getRepository();
    
    //IUnifiedRepository unifiedRepository = PentahoSystem.get(IUnifiedRepository.class, null);

   File templateFile = getTemplateFile();

    ArrayList<String> i18nTagsList = new ArrayList<String>();
    String[] templateSections = new String[] { "", "" };
    getTemplateSections(templateFile, templateSections, i18nTagsList);
    InputStream fileInputStream = null;
    MessageBundlesHelper mbh = null;
    if (sourceFile != null) {
      // Merge dashboard related message file with global message file and save it in the dashboard cache
      File file = new File(sourceFile.getPath());
      mbh = new MessageBundlesHelper(sourceFile.getParentFile(), msgsFileBaseName);      
      fileInputStream = new FileInputStream(sourceFile);
    } else if (jcrSourceFile != null) {
      // Merge dashboard related message file with global message file and save it in the dashboard cache
      String parentDir = FilenameUtils.getFullPathNoEndSeparator(jcrSourceFile.getPath());
      if (parentDir == "") {
        parentDir = "/";
      }
      parentDir = FilenameUtils.separatorsToUnix(parentDir);
      mbh = new MessageBundlesHelper(repositoryAccess.getRepositoryFile(parentDir, RepositoryAccess.FileAccess.READ), msgsFileBaseName);
      fileInputStream = repositoryAccess.getResourceInputStream(jcrSourceFile.getPath()); 
    }
    
    mbh.setPluginRootDir(getPluginRootDir());
    String intro = replaceIntroParameters(templateSections[0], mbh, i18nTagsList, msgsFileBaseName);
    String footer = templateSections[1];
    final String dashboardContent = getDashboardContent(fileInputStream, i18nTagsList);
    outputDashboardHtml(intro, dashboardContent, footer);
  }
  
  public void setPluginRootDir(File pluginRootDir) {
    this.pluginRootDir = pluginRootDir;
  }
  
  public File getPluginRootDir() {
    return pluginRootDir != null ? pluginRootDir : ((PluginClassLoader)MessageBundlesHelper.class.getClassLoader()).getPluginDir();
  }
  
  private Packager createPackager() throws IOException {
    Packager packager = Packager.getInstance();
    
    final Properties resources = new Properties();
    File resourceFile = new File(getPluginRootDir(), "resources-blueprint.txt");
    resources.load(new FileInputStream(resourceFile));

    ArrayList<String> scriptsList = new ArrayList<String>();
    ArrayList<String> stylesList = new ArrayList<String>();
    

    boolean scriptsAvailable = packager.isPackageRegistered("scripts");
    boolean stylesAvailable = packager.isPackageRegistered("styles");
    if (!scriptsAvailable)
    {
      scriptsList.addAll(Arrays.asList(resources.get("commonLibrariesScript").toString().split(",")));
      for (int i = 0; i < scriptsList.size(); i++)
      {
        String fname = scriptsList.get(i);
        scriptsList.set(i, fname.replaceAll(RELATIVE_URL_TAG + STATIC_CDF_PATH, ""));
      }
      packager.registerPackage("scripts", Packager.Filetype.JS, getPluginRootDir().getAbsolutePath(), getPluginRootDir().getAbsolutePath() + "/js/scripts.js", scriptsList.toArray(new String[scriptsList.size()]));
    }

    if (!stylesAvailable)
    {
      stylesList.addAll(Arrays.asList(resources.get("commonLibrariesLink").toString().split(",")));
      for (int i = 0; i < stylesList.size(); i++)
      {
        String fname = stylesList.get(i);
        stylesList.set(i, fname.replaceAll(RELATIVE_URL_TAG + STATIC_CDF_PATH, ""));
      }
      packager.registerPackage("styles", Packager.Filetype.CSS, getPluginRootDir().getAbsolutePath(), getPluginRootDir().getAbsolutePath() + "/js/styles.css", stylesList.toArray(new String[stylesList.size()]));
    }
    return packager;
  }
  
  private void outputDashboardHtml(String intro, String dashboardContent, String footer) throws Exception{
    final int headIndex = intro.indexOf("<head>"); //$NON-NLS-1$
    final int length = intro.length();

    outputStream.write(intro.substring(0, headIndex + 6).getBytes("UTF-8")); //$NON-NLS-1$   
    //Concat libraries to html head content
    outputStream.write(getHeaders(dashboardContent).getBytes( "UTF-8" ));
    outputStream.write(intro.substring(headIndex + 7, length - 1).getBytes("UTF-8")); //$NON-NLS-1$

    IParameterProvider parameters = getRequestParams();
    HashMap<String, String> params = new HashMap<String, String>();

    Iterator enumeration = parameters.getParameterNames();
    while (enumeration.hasNext()){
      final String param = (String)enumeration.next();

      if (param.startsWith(PREFIX_PARAMETER)){
        params.put(param.substring(PREFIX_PARAMETER.length()), parameters.getStringParameter(param, ""));
      }
    }

    String viewId = parameters.getStringParameter("view", parameters.getStringParameter("action", ""));

    ContextEngine.getInstance().getContext(filePath, viewId , "", params, getOutputStream());
    outputStream.write("<div id=\"dashboardContent\">".getBytes("UTF-8")); //$NON-NLS-1$

    outputStream.write(dashboardContent.getBytes("UTF-8")); //$NON-NLS-1$
    outputStream.write("</div>".getBytes("UTF-8")); //$NON-NLS-1$
    outputStream.write(footer.getBytes("UTF-8")); //$NON-NLS-1$
  }

  protected List<String> getUserRoles() {
    IUserRoleListService service = PentahoSystem.get(IUserRoleListService.class);
    List<String> auths = service.getRolesForUser(null, userSession.getName());//.getAuthoritiesForUser(userSession.getName());
    
    return auths;
  }
  
  private String replaceRelative(String headerPath) {
    if (baseUrl != null) {
      return headerPath.replaceAll(RELATIVE_URL_TAG, baseUrl);
    }
    else {
      logger.warn("no baseURL");
      return headerPath;
    }
  }
  
  public String getHeaders(final String dashboardContent) throws Exception
  {

    final File file = new File(getPluginRootDir(), "resources-blueprint.txt");
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

    // Add common libraries
    if (debug)
    {
      //DEBUG MODE
      for (String header : miniscripts)
      {
        scriptsBuilders.append("<script type=\"text/javascript\" src=\"" + replaceRelative(header) + "\"></script>\n");
      }
      for (String header : ministyles)
      {
        stylesBuilders.append("<link rel=\"stylesheet\" type=\"text/css\" href=\"" + replaceRelative(header) + "\"/>\n");
      }

    }
    else
    {
      // NORMAL MODE
      Packager packager = getPackager();
      String stylesHash = packager.minifyPackage("styles");
      String scriptsHash = packager.minifyPackage("scripts");
      stylesBuilders.append("<link href=\"" + baseUrl + STATIC_CDF_PATH + "/js/styles.css?version=" + stylesHash + "\" rel=\"stylesheet\" type=\"text/css\" />");
      scriptsBuilders.append("<script type=\"text/javascript\" src=\"" + baseUrl + STATIC_CDF_PATH + "/js/scripts.js?version=" + scriptsHash + "\"></script>");
    }
    //Add extra components libraries

    for ( String header : scripts ) {
      scriptsBuilders.append( "<script type=\"text/javascript\" src=\"" + replaceRelative(header) + "\"></script>\n" );
    }
    for ( String header : styles ) {
      stylesBuilders.append( 
          "<link rel=\"stylesheet\" type=\"text/css\" href=\""
          + replaceRelative( header )
          + "\"/>\n" );
    }

    // Add ie8 blueprint condition
    stylesBuilders.append("<!--[if lt IE 8]><link rel=\"stylesheet\" href=\"" + baseUrl + STATIC_CDF_PATH + "/js/blueprint/ie.css\" type=\"text/css\" media=\"screen, projection\"><![endif]-->");

    StringBuilder stuff = new StringBuilder();
    includes.put("scripts", scriptsBuilders.toString());
    includes.put("styles", stylesBuilders.toString());
    for (String key : includes.keySet())
    {
      stuff.append(includes.get(key));
    }
    return stuff.toString();
    //out.write(stuff.toString().getBytes("UTF8"));
  }
  
  private ArrayList<String> getExtraScripts(String dashboardContentOrig, Properties resources)
  {

    // Compare this ignoring case
    final String dashboardContent = dashboardContentOrig.toLowerCase();

    ArrayList<String> scripts = new ArrayList<String>();
    boolean all;
    if (dashboardContent == null || StringUtils.isEmpty(dashboardContent))
    {
      all = true;
    }
    else
    {
      all = false;
    }

    final Enumeration resourceKeys = resources.propertyNames();
    while (resourceKeys.hasMoreElements())
    {

      final String scriptkey = (String) resourceKeys.nextElement();

      final String key;

      if (scriptkey.indexOf("Script") != -1 && scriptkey.indexOf("commonLibraries") == -1)
      {
        key = scriptkey.replaceAll("Script$", "");
      }
      else
      {
        continue;
      }

      final int keyIndex = all ? 0 : dashboardContent.indexOf(key.toLowerCase());
      if (keyIndex != -1)
      {
        if (all || matchComponent(keyIndex, key.toLowerCase(), dashboardContent))
        {
          // ugly hack -- if we don't know for sure we need OpenStreetMaps, don't load it!
          if (all && scriptkey.indexOf("mapScript") != -1)
          {
            continue;
          }
          scripts.addAll(Arrays.asList(resources.getProperty(scriptkey).split(",")));
        }
      }
    }

    return scripts;
  }

  private ArrayList<String> getExtraStyles(String dashboardContentOrig, Properties resources)
  {
    // Compare this ignoring case
    final String dashboardContent = dashboardContentOrig.toLowerCase();

    ArrayList<String> styles = new ArrayList<String>();
    boolean all;
    if (dashboardContent == null || StringUtils.isEmpty(dashboardContent))
    {
      all = true;
    }
    else
    {
      all = false;
    }

    if (dashboardContent != null && !StringUtils.isEmpty(dashboardContent))
    {
      final Enumeration resourceKeys = resources.propertyNames();
      while (resourceKeys.hasMoreElements())
      {

        final String scriptkey = (String) resourceKeys.nextElement();

        final String key;


        if (scriptkey.indexOf("Link") != -1 && scriptkey.indexOf("commonLibraries") == -1)
        {
          key = scriptkey.replaceAll("Link$", "");
        }
        else
        {
          continue;
        }

        final int keyIndex = all ? 0 : dashboardContent.indexOf(key.toLowerCase());
        if (keyIndex != -1)
        {
          if (matchComponent(keyIndex, key.toLowerCase(), dashboardContent))
          {
            styles.addAll(Arrays.asList(resources.getProperty(scriptkey).split(",")));
          }
        }
      }
    }
    return styles;
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
  
  private String getDashboardContent(InputStream is, ArrayList<String> i18nTagsList) throws Exception {
    // Fixed ISSUE #CDF-113
    //BufferedReader reader = new BufferedReader(new InputStreamReader(is));
    BufferedReader reader = new BufferedReader(new InputStreamReader(is, Charset.forName(LocaleHelper.getSystemEncoding())));

    StringBuilder sb = new StringBuilder();
    String line = null;
    while ((line = reader.readLine()) != null)
    {
      // Process i18n for each line of the dashboard output
      line = processi18nTags(line, i18nTagsList);
      // Process i18n - end
      sb.append(line + "\n"); //$NON-NLS-1$
    }
    is.close();
    return sb.toString();
  }
  
  private String processi18nTags(String content, ArrayList<String> tagsList)
  {
    String tagPattern = "CDF.i18n\\(\""; //$NON-NLS-1$
    String[] test = content.split(tagPattern);
    if (test.length == 1)
    {
      return content;
    }
    StringBuffer resBuffer = new StringBuffer();
    int i;
    String tagValue;
    resBuffer.append(test[0]);
    for (i = 1; i < test.length; i++)
    {

      // First tag is processed differently that other because is the only case where I don't
      // have key in first position
      resBuffer.append("<span id=\""); //$NON-NLS-1$
      if (i != 0)
      {
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
  
  private String updateSelectorName(String name)
  {
    // If we've the character . in the message key substitute it conventionally to _
    // when dynamically generating the selector name. The "." character is not permitted in the
    // selector id name
    return name.replace(".", "_");
  }
  
  private String replaceIntroParameters(String intro, MessageBundlesHelper mbh, ArrayList<String> i18nTagsList, String dashboardsMessagesBaseFilename) throws Exception{
    mbh.saveI18NMessageFilesToCache();
    String messageSetPath = mbh.getMessageFilesCacheUrl() + "/"; //$NON-NLS-1$

    // If dashboard specific files aren't specified set message filename in cache to the global messages file filename
    if (dashboardsMessagesBaseFilename == null)
      dashboardsMessagesBaseFilename = CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME;

    intro = intro.replaceAll("\\{load\\}", "onload=\"load()\""); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
    intro = intro.replaceAll("\\{body-tag-unload\\}", ""); //$NON-NLS-1$
    intro = intro.replaceAll("#\\{GLOBAL_MESSAGE_SET_NAME\\}", dashboardsMessagesBaseFilename); //$NON-NLS-1$
    intro = intro.replaceAll("#\\{GLOBAL_MESSAGE_SET_PATH\\}", messageSetPath); //$NON-NLS-1$
    intro = intro.replaceAll("#\\{GLOBAL_MESSAGE_SET\\}", buildMessageSetCode(i18nTagsList)); //$NON-NLS-1$
    return intro;
  }
  
  private String buildMessageSetCode(ArrayList<String> tagsList)
  {
    StringBuffer messageCodeSet = new StringBuffer();
    for (String tag : tagsList)
    {
      messageCodeSet.append("\\$('#").append(updateSelectorName(tag)).append("').html(jQuery.i18n.prop('").append(tag).append("'));\n"); //$NON-NLS-1$
    }
    return messageCodeSet.toString();
  }

  private void getTemplateSections(File templateFile, String[] templateSections, ArrayList<String> i18nTagsList) throws Exception{
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
      if (tempSections != null && tempSections.length > 0)
      {
        templateSections[0] = tempSections[0];
      }
      if (tempSections != null && tempSections.length > 1)
      {
        templateSections[1] = tempSections[1];
      }
    }
  }
  
  private String updateUserLanguageKey(String intro)
  {
    // Fill the template with the correct user locale
    Locale locale = LocaleHelper.getLocale();
    intro = intro.replaceAll("#\\{LANGUAGE_CODE\\}", locale.getLanguage()); //$NON-NLS-1$
    return intro;
  }
  
}
