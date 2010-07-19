package org.pentaho.cdf.localization;

import org.pentaho.cdf.CdfConstants;
import org.pentaho.platform.engine.core.solution.ActionInfo;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.util.messages.LocaleHelper;

import java.io.*;
import java.util.Locale;

/**
 * Created by IntelliJ IDEA.
 * User: sramazzina
 * Date: 7-lug-2010
 * Time: 11.27.43
 * To change this template use File | Settings | File Templates.
 */
public class MessageBundlesHelper {

    private String baseUrl;
    private String globalBaseMessageFile;
    private String targetDashboardCacheDir;
    private String targetDashboardBaseMsgFile;
    private String sourceDashboardBaseMsgFile;
    private static final String PENTAHO_CDF_GLOBAL_LANGUAGES_DIR = "pentaho-cdf/resources/languages";
    private static final String PENTAHO_CDF_DIR = "pentaho-cdf/";
    private String languagesCacheUrl;


    public MessageBundlesHelper(String baseGlobalMessageSetFilename,
                                String dashboardSolution,
                                String dashboardPath,
                                String dashboardsMessagesBaseFilename) {
        init(baseGlobalMessageSetFilename,
             dashboardSolution,
             dashboardPath,
             dashboardsMessagesBaseFilename);
    }

    public void saveI18NMessageFilesToCache() throws IOException {
        createCacheDirIfNotExists(targetDashboardCacheDir);

        appendBaseMessageFiles(sourceDashboardBaseMsgFile, globalBaseMessageFile, targetDashboardBaseMsgFile);
        appendLocalizedMessageFiles(sourceDashboardBaseMsgFile, globalBaseMessageFile, targetDashboardBaseMsgFile);
    }


    public String getMessageFilesCacheUrl() {
        return languagesCacheUrl.replace(File.separator, "/");
    }

    protected void init(String baseGlobalMessageSetFilename,
                        String dashboardSolution,
                        String dashboardPath,
                        String dashboardsMessagesBaseFilename) {

        baseUrl = PentahoSystem.getApplicationContext().getSolutionPath("");
        globalBaseMessageFile = baseUrl + ActionInfo.buildSolutionPath("system", PENTAHO_CDF_GLOBAL_LANGUAGES_DIR, baseGlobalMessageSetFilename);
        languagesCacheUrl = CdfConstants.BASE_CDF_CACHE_DIR + File.separator + dashboardSolution + dashboardPath;
        targetDashboardCacheDir = baseUrl + File.separator + ActionInfo.buildSolutionPath("system", PENTAHO_CDF_DIR + languagesCacheUrl, "");
        targetDashboardBaseMsgFile = baseUrl + File.separator + ActionInfo.buildSolutionPath("system", PENTAHO_CDF_DIR + languagesCacheUrl, dashboardsMessagesBaseFilename);
        sourceDashboardBaseMsgFile = baseUrl + File.separator + ActionInfo.buildSolutionPath(dashboardSolution, dashboardPath, dashboardsMessagesBaseFilename);
    }

    protected void createCacheDirIfNotExists(String targetDashboardCacheDir) {
        File fBaseMsgTargetDir = new File(targetDashboardCacheDir);
        if (!fBaseMsgTargetDir.exists()) {
            fBaseMsgTargetDir.mkdirs();
        }
    }

    protected void appendBaseMessageFiles(String sourceDashboardBaseMsgFile,
                                    String globalBaseMessageFile,
                                    String targetDashboardBaseMsgFile) throws IOException {

        appendMessageFiles(sourceDashboardBaseMsgFile, globalBaseMessageFile, targetDashboardBaseMsgFile);
    }

    protected void appendLocalizedMessageFiles(String sourceDashboardBaseMsgFile,
                                    String globalBaseMessageFile,
                                    String targetDashboardBaseMsgFile) throws IOException {

        Locale locale = LocaleHelper.getLocale();
        // Manage selected language file
        sourceDashboardBaseMsgFile = sourceDashboardBaseMsgFile + "_" + locale.toString();
        globalBaseMessageFile = globalBaseMessageFile + "_" + locale.toString();
        targetDashboardBaseMsgFile = targetDashboardBaseMsgFile + "_" + locale.toString();

        appendMessageFiles(sourceDashboardBaseMsgFile, globalBaseMessageFile, targetDashboardBaseMsgFile);
    }


    protected void appendMessageFiles(String sourceDashboardBaseMsgFile,
                                    String globalBaseMessageFile,
                                    String targetDashboardBaseMsgFile) throws IOException {

        File fBaseMsgDashboard = new File(sourceDashboardBaseMsgFile + ".properties");
        File fBaseMsgGlobal = new File(globalBaseMessageFile + ".properties");
        File fBaseMsgTarget = new File(targetDashboardBaseMsgFile + ".properties");

        String theLine;
        if (!fBaseMsgTarget.exists()) {
            fBaseMsgTarget.createNewFile();
            BufferedWriter bwBaseMsgTarget = new BufferedWriter(new FileWriter(fBaseMsgTarget, true));
            if (fBaseMsgGlobal.exists()) {
                BufferedReader brBaseMsgGlobal = new BufferedReader(new FileReader(fBaseMsgGlobal));
                while ((theLine = brBaseMsgGlobal.readLine()) != null) {
                    bwBaseMsgTarget.write(theLine + "\n");
                }
                brBaseMsgGlobal.close();
            }
            if (fBaseMsgDashboard.exists()) {
                BufferedReader brBaseMsgDashboard = new BufferedReader(new FileReader(fBaseMsgDashboard));
                while ((theLine = brBaseMsgDashboard.readLine()) != null) {
                    bwBaseMsgTarget.write(theLine + "\n");
                }
                brBaseMsgDashboard.close();
            }
            bwBaseMsgTarget.close();
        }
    }
}
