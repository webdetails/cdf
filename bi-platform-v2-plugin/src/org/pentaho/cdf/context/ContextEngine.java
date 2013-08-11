/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.pentaho.cdf.context;

import java.io.IOException;
import java.io.OutputStream;
import java.io.StringReader;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.core.Context;
import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import static javax.ws.rs.core.MediaType.APPLICATION_XML;
import static javax.ws.rs.core.MediaType.APPLICATION_FORM_URLENCODED;
import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Node;
import org.dom4j.io.SAXReader;

import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.comments.CommentsApi;
import org.pentaho.cdf.storage.StorageEngine;
import org.pentaho.cdf.views.ViewEntry;
import org.pentaho.cdf.views.ViewsEngine;
import org.pentaho.platform.api.engine.IParameterProvider;

import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.IUserRoleListService;
import org.pentaho.platform.api.repository2.unified.RepositoryFileTree;
import org.pentaho.platform.api.repository2.unified.RepositoryFile;

import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.engine.core.system.UserSession;
import org.pentaho.platform.engine.security.SecurityParameterProvider;
import org.pentaho.platform.repository2.unified.fileio.RepositoryFileInputStream;




import org.pentaho.platform.util.xml.dom4j.XmlDom4JHelper;
import org.springframework.security.Authentication;
import org.springframework.security.GrantedAuthority;
import org.springframework.security.GrantedAuthorityImpl;
import org.springframework.security.providers.anonymous.AnonymousAuthenticationToken;
import pt.webdetails.cpf.InterPluginCall;
import pt.webdetails.cpf.repository.RepositoryAccess;


/**
 *
 * @author diogomariano
 */

public class ContextEngine {
  IPentahoSession userSession;

  private static final Log logger = LogFactory.getLog(CommentsApi.class);
  private static final String ENCODING = "UTF-8";
  private static final String PREFIX_PARAMETER = "param";
  static final String SESSION_PRINCIPAL = "SECURITY_PRINCIPAL";
  private static RepositoryFileTree repositoryCache;
  private static ContextEngine instance;

  public ContextEngine() {

  }

  public static synchronized ContextEngine getInstance() {
    if (instance == null) {
      instance = new ContextEngine();
    }
    return instance;
  }



  protected IPentahoSession getUserSession(){
    if(userSession == null){
      userSession = PentahoSessionHolder.getSession();
    }

    return userSession;
  }

  public void clearCache(){
    repositoryCache = null;
  }

  public void getContext(String path, String viewId, String action, HashMap<String, String> parameters, final OutputStream output){
    final JSONObject contextObj = new JSONObject();

    Document config = getConfigFile();

    try {
      buildContextConfig(contextObj, path, config);
      buildContextDates(contextObj);

      contextObj.put("user", getUserSession().getName());
      contextObj.put("locale", getUserSession().getLocale());

      buildContextPaths(contextObj, path);

      SecurityParameterProvider securityParams = new SecurityParameterProvider(getUserSession());
      contextObj.put("roles", securityParams.getParameter("principalRoles"));

      final JSONObject params = new JSONObject();
      buildContextParams(params, parameters);
      contextObj.put("params", params);

      buildContextScript(output, contextObj, viewId, action);

      logger.info("[Timing] Finished building context: " + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));

    } catch (JSONException e) {

    }
  }


  private JSONObject buildContextPaths(final JSONObject contextObj, String dashboardPath) throws JSONException{
    contextObj.put("path", dashboardPath);

    return contextObj;
  }

  private JSONObject buildContextDates(final JSONObject contextObj) throws JSONException{
    Calendar cal = Calendar.getInstance();

    long utcTime = cal.getTimeInMillis();
    contextObj.put("serverLocalDate", utcTime + cal.getTimeZone().getOffset(utcTime));
    contextObj.put("serverUTCDate", utcTime);
    return contextObj;
  }

  private JSONObject buildContextConfig(final JSONObject contextObj, String fullPath, Document config) throws JSONException{
    contextObj.put("queryData", processAutoIncludes(fullPath, config));
    contextObj.put("sessionAttributes", processSessionAttributes(config));

    return contextObj;
  }

  private OutputStream buildContextScript(final OutputStream out, JSONObject contextObj, String viewId, String action) throws JSONException{
    final StringBuilder s = new StringBuilder();

    try {
      s.append("\n<script language=\"javascript\" type=\"text/javascript\">\n");
      s.append("  Dashboards.context = ");
      s.append(contextObj.toString(2) + "\n");

      ViewEntry view = ViewsEngine.getInstance().getView(viewId.isEmpty() ? action : viewId);
      if (view != null) {
        s.append("Dashboards.view = ");
        s.append(view.toJSON().toString(2) + "\n");
      }
      String storage = getStorage();
      if (!"".equals(storage)) {
        s.append("Dashboards.initialStorage = ");
        s.append(storage);
        s.append("\n");
      }
      s.append("</script>\n");

      writeOut(out,s.toString());
    } catch(IOException ex){
      logger.error("Error while writting to steam", ex);
    }


    return out;
  }

  private JSONObject buildContextParams(final JSONObject contextObj, HashMap<String, String> params) throws JSONException{
    for(String param : params.values()){
      if (param.startsWith(PREFIX_PARAMETER)){
        contextObj.put(param.substring(PREFIX_PARAMETER.length()),params.get(param));
      }
    }
    return contextObj;
  }


  public JSONObject processSessionAttributes(Document config) {

    JSONObject result = new JSONObject();

    @SuppressWarnings("unchecked")
    List<Node> attributes = config.selectNodes("//sessionattributes/attribute");
    for (Node attribute : attributes) {

      String name = attribute.getText();
      String key = XmlDom4JHelper.getNodeText("@name", attribute);
      if (key == null) {
        key = name;
      }

      try {
        result.put(key, getUserSession().getAttribute(name));
      } catch (JSONException e) {
        logger.error(e);
      }
    }

    return result;
  }

  public JSONObject processAutoIncludes(String dashboardPath, Document config) {

    JSONObject queries = new JSONObject();
        /* Bail out immediately if CDA isn' available */
    InterPluginCall call = new InterPluginCall(InterPluginCall.CDA, "");
    if (!call.pluginExists() ) {
      logger.warn("Couldn't find CDA. Skipping auto-includes");
      return queries;
    }
    logger.info("[Timing] Getting solution repo for auto-includes: " + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));


    //RepositoryFileTree solution2 = RepositoryAccess.getRepository().getRepositoryFileTree("/public/pentaho-solutions/cdf/includes", -1, true, null);

    List<String> extensions = new ArrayList<String>();
    extensions.add("cda");

    List<RepositoryFile> files = new ArrayList<RepositoryFile>();
    List<String> filePaths = new ArrayList<String>();

    RepositoryAccess repAccess = RepositoryAccess.getRepository();
    String includesPath = "/public/pentaho-solutions/cdf/includes";
    if (!repAccess.resourceExists(includesPath))
      return queries;

    repAccess.listSolutionFiles(includesPath, true, extensions, true, files);

    for(RepositoryFile file : files){
      filePaths.add(file.getPath());
    }

    List<Node> includes;
    includes = config.selectNodes("//autoincludes/autoinclude");
    logger.info("[Timing] Starting testing includes: " + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));
    for (Node include : includes) {
      String re = XmlDom4JHelper.getNodeText("cda", include, "");
      for (String cdaPath : filePaths) {
        String path = cdaPath;

                /* There's a stupid bug in the filebased rep that makes this not work (see BISERVER-3538)
                 * Path comes out as pentaho-solutions/<solution>/..., and filebase rep doesn't handle that well
                 * We'll remote the initial part and that apparently works ok
                 */
        //path = path.substring(path.indexOf('/', 1) + 1);

        if (!path.matches(re)) {
          continue;
        }
        logger.debug(path + " matches the rule " + re);
        Pattern pat = Pattern.compile(re);
        if (canInclude(dashboardPath, include.selectNodes("dashboards/*"), pat.matcher(path))) {
          logger.debug("Accepted dashboard " + dashboardPath);
          List<String> ids = listQueries(path);
          //String idPattern = (String) cda.selectObject("string(ids)");
          for (String id : ids) {
            Map<String, Object> params = new HashMap<String, Object>();
            params.put("dataAccessId", id);
            params.put("path", path);
            logger.info("[Timing] Executing autoinclude query: " + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));
            InterPluginCall ipc = new InterPluginCall(InterPluginCall.CDA, "doQuery", params);
            String reply = ipc.callInPluginClassLoader();
            logger.info("[Timing] Done executing autoinclude query: " + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));
            try {
              queries.put(id, new JSONObject(reply));
            } catch (JSONException e) {
              logger.error("Failed to add query " + id + " to contex object");
            }
          }
        }
      }
    }
    logger.info("[Timing] Finished testing includes: " + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));

    return queries;
  }

  private boolean canInclude(String path, List<Node> rules, Matcher matcher) {
    boolean canInclude = false;
    logger.info("[Timing] Testing inclusion rule: " + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));
        /* Rules are listed from least to most important */
    matcher.find();
    for (Node rule : rules) {
      String mode = rule.getName();
      String tokenizedRule = rule.getText();
      for (int i = 1; i <= matcher.groupCount(); i++) {
        tokenizedRule = tokenizedRule.replaceAll("\\$" + i, matcher.group(i));
      }
      if ("include".equals(mode)) {
        if (path.matches(tokenizedRule)) {
          canInclude = true;
        }
      } else if ("exclude".equals(mode)) {
        if (path.matches(tokenizedRule)) {
          canInclude = false;
        }
      } else {
        logger.warn("Inclusion rule mode " + mode + " not supported.");
      }
    }
    logger.info("[Timing] Finished testing inclusion rule: " + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));
    return canInclude;
  }

  private List<String> listQueries(String cda) {
    SAXReader reader = new SAXReader();
    List<String> queryOutput = new ArrayList<String>();
    try {
      Map<String, Object> params = new HashMap<String, Object>();

      params.put("path", cda);
      params.put("outputType", "xml");
      InterPluginCall ipc = new InterPluginCall(InterPluginCall.CDA, "listQueries", params);
      String reply = ipc.call();
      Document queryList = reader.read(new StringReader(reply));
      List<Node> queries = queryList.selectNodes("//ResultSet/Row/Col[1]");
      for (Node query : queries) {
        queryOutput.add(query.getText());
      }
    } catch (DocumentException e) {
      return null;
    }
    return queryOutput;




  }

  public Document getConfigFile() {
    RepositoryAccess repositoryAccess = RepositoryAccess.getRepository(getUserSession());
    Document doc;

    try {
      doc = repositoryAccess.getResourceAsDocument("/cdf/dashboardContext.xml", RepositoryAccess.FileAccess.READ);
    } catch (IOException e) {
      doc = null;
    }

    if (doc == null) {
      try {
        SAXReader reader = new SAXReader();
        doc = reader.read(repositoryAccess.getSystemDir() + "/pentaho-cdf/dashboardContext.xml");
      } catch (DocumentException e) {
        logger.error("Couldn't get context configuration file! Cause:\n" + e.toString());
        return null;
      }
    }

    return doc;
  }

  private static IPentahoSession getAdminSession() {
    UserSession session = new UserSession("admin", null, false, null);
    IUserRoleListService service = PentahoSystem.get(IUserRoleListService.class);
    List<String> authorities = service.getAllRoles();

    GrantedAuthority[] grantedAuthorities = new GrantedAuthority[authorities.size()];
    if (!authorities.isEmpty()) {
      for (int i = 0; i < authorities.size(); i++) {
        grantedAuthorities[i] = new GrantedAuthorityImpl(authorities.get(i));
      }
    }

    Authentication auth = new AnonymousAuthenticationToken("admin", SESSION_PRINCIPAL, grantedAuthorities);
    session.setAttribute(SESSION_PRINCIPAL, auth);
    session.doStartupActions(null);
    return session;
  }

  private String getStorage() {
    try {
      return StorageEngine.getInstance().read(getUserSession().getName());
    } catch (Exception e) {
      logger.error(e);
      return "";
    }
  }
    
    
    /*private static RepositoryFileTree getRepository(List<String> extensions) {
        if (repositoryCache == null) {
            IPentahoSession adminsession = getAdminSession();
            RepositoryAccess repositoryAccess = RepositoryAccess.getRepository(adminsession);
            
            repositoryCache = repositoryAccess.getFullSolutionTree(RepositoryAccess.FileAccess.READ, extensions, true);
        }
        return repositoryCache;
    }*/





  protected void writeOut(OutputStream out, String contents) throws IOException {
    IOUtils.write(contents, out, getEncoding());
    out.flush();
  }

  protected static String getEncoding() {
    return ENCODING;
  }



}
