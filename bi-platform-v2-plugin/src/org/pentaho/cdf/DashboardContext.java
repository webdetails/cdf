/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.pentaho.cdf;

import java.io.StringReader;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Node;
import org.dom4j.io.SAXReader;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.IUserRoleListService;
import org.pentaho.platform.api.repository.ISolutionRepository;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.engine.core.system.UserSession;
import org.pentaho.platform.util.xml.dom4j.XmlDom4JHelper;
import org.springframework.security.Authentication;
import org.springframework.security.GrantedAuthority;
import org.springframework.security.providers.anonymous.AnonymousAuthenticationToken;
import org.springframework.security.userdetails.UserDetailsService;

import pt.webdetails.cpf.InterPluginComms;

/**
 *
 * @author pdpi
 */
public class DashboardContext {

    // copied from the old org.pentaho.platform.engine.security.SecurityHelper
    public static final String SESSION_PRINCIPAL = "SECURITY_PRINCIPAL"; //$NON-NLS-1$
  
    protected IPentahoSession userSession;
    private static final Log logger = LogFactory.getLog(DashboardContext.class);
    private static Document repositoryCache;

    public DashboardContext(IPentahoSession userSession) {
        logger.debug("Creating Context for user " + userSession.getName());
        this.userSession = userSession;
    }

    public String getContext(IParameterProvider requestParams) {
        try {
            String solution = requestParams.getStringParameter("solution", ""),
                    path = requestParams.getStringParameter("path", ""),
                    file = requestParams.getStringParameter("file", ""),
                    fullPath = ("/" + solution + "/" + path + "/" + file).replaceAll("/+", "/");
            final JSONObject context = new JSONObject();
            Calendar cal = Calendar.getInstance();
            context.put("queryData", processAutoIncludes(fullPath));
            context.put("serverLocalDate", cal.getTimeInMillis());
            context.put("serverUTCDate", cal.getTimeInMillis() + cal.getTimeZone().getRawOffset());
            context.put("user", userSession.getName());
            context.put("locale", userSession.getLocale());
            context.put("solution", solution);
            context.put("path", path);
            context.put("file", file);

            /*
            // The first method works in 3.6, for 3.5 it's a different method. We'll try both
            IUserDetailsRoleListService service = PentahoSystem.get(IUserDetailsRoleListService.class);
            if (service == null) {
                // TODO - Remove this block of code once we drop support for older versions than SUGAR
                service = PentahoSystem.getUserDetailsRoleListService();
            }
            */
            
            IUserRoleListService service = PentahoSystem.get(IUserRoleListService.class);
            String userName = userSession.getName();
            if (!userName.equals("anonymousUser")) {
                context.put("roles", service.getRolesForUser(userName));
            }
            JSONObject params = new JSONObject();

            Iterator it = requestParams.getParameterNames();
            while (it.hasNext()) {
                String p = (String) it.next();
                if (p.indexOf("param") == 0) {
                    params.put(p.substring(5), requestParams.getParameter(p));
                }
            }
            context.put("params", params);

            final StringBuilder s = new StringBuilder();
            s.append("\n<script language=\"javascript\" type=\"text/javascript\">\n");
            s.append("  Dashboards.context = ");
            s.append(context.toString(2) + "\n");
            s.append("</script>\n");
            // setResponseHeaders(MIME_PLAIN,0,null);
            logger.info("[Timing] Finished building context: " + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));

            return s.toString();
        } catch (JSONException e) {
            return "";
        }
    }

    private JSONObject processAutoIncludes(String dashboardPath) {

        JSONObject queries = new JSONObject();
        /* Bail out immediately if CDA isn' available */
        if (!InterPluginComms.isPluginAvailable("cda")) {
            logger.warn("Couldn't find CDA. Skipping auto-includes");
            return queries;
        }
        Document config = getConfigFile();
        logger.info("[Timing] Getting solution repo for auto-includes: " + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));
        Document solution = getRepository();
        List<Node> includes, cdas;
        includes = config.selectNodes("//autoincludes/autoinclude");
        cdas = solution.selectNodes("//leaf[ends-with(leafText,'cda')]");
        logger.info("[Timing] Starting testing includes: " + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));
        for (Node include : includes) {
            String re = XmlDom4JHelper.getNodeText("cda", include, "");
            for (Node cda : cdas) {
                String path = (String) cda.selectObject("string(path)");
                
                /* There's a stupid bug in the filebased rep that makes this not work (see BISERVER-3538)
                 * Path comes out as pentaho-solutions/<solution>/..., and filebase rep doesn't handle that well
                 * We'll remote the initial part and that apparently works ok
                 */
                path = path.substring(path.indexOf('/', 1)+1);
                
                if (!path.matches(re)) {
                    continue;
                }
                logger.debug(path + " matches the rule " + re);
                Pattern pat = Pattern.compile(re);
                if (canInclude(dashboardPath, include.selectNodes("dashboards/*"), pat.matcher(path))) {
                    logger.debug("Accepted dashboard " + dashboardPath);
                    List<String> ids = listQueries(path);
                    String idPattern = (String) cda.selectObject("string(ids)");
                    for (String id : ids) {
                        Map<String, Object> params = new HashMap<String, Object>();
                        params.put("dataAccessId", id);
                        params.put("path", path);
                        logger.info("[Timing] Executing autoinclude query: " + (new SimpleDateFormat("HH:mm:ss.SSS")).format(new Date()));
                        String reply = InterPluginComms.callPlugin(InterPluginComms.Plugin.CDA, "doQuery", params, true);
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
            String reply = InterPluginComms.callPlugin(InterPluginComms.Plugin.CDA, "listQueries", params);
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

    private Document getConfigFile() {
        ISolutionRepository solutionRepository = PentahoSystem.get(ISolutionRepository.class, userSession);
        
        Document doc;



        try {
            doc = solutionRepository.getSolutions("", "/cdf/dashboardContext.xml", 0, false);
        } catch (Exception e) {
            doc = null;
        }

        if (doc == null) {
            try {
                doc = solutionRepository.getSolutions("", "/system/pentaho-cdf/dashboardContext.xml", 0, false);
            } catch (Exception e) {
                logger.error("Couldn't get context configuration file! Cause:\n" + e.toString());
                return null;
            }
        }

        return doc;
    }

    public static void clearCache() {
        repositoryCache = null;
    }

    private static Document getRepository() {
        if (repositoryCache == null) {
            IPentahoSession adminsession = getAdminSession();
            ISolutionRepository solutionRepository = PentahoSystem.get(ISolutionRepository.class, adminsession);
            repositoryCache = solutionRepository.getSolutionTree(ISolutionRepository.ACTION_ADMIN);
        }
        return repositoryCache;
    }

    private static IPentahoSession getAdminSession() {
        UserDetailsService service = PentahoSystem.get(UserDetailsService.class);
        UserSession session = new UserSession("admin", null, false, null);
        GrantedAuthority[] auths = service.loadUserByUsername(session.getName()).getAuthorities();
        Authentication auth = new AnonymousAuthenticationToken("admin", SESSION_PRINCIPAL, auths);
        session.setAttribute(SESSION_PRINCIPAL, auth);
        session.doStartupActions(null);
        return session;
    }
}
