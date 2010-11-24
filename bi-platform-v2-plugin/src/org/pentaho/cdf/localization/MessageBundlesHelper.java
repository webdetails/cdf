package org.pentaho.cdf.localization;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Locale;

import org.pentaho.cdf.CdfConstants;
import org.pentaho.platform.engine.core.solution.ActionInfo;
import org.pentaho.platform.plugin.services.pluginmgr.PluginClassLoader;
import org.pentaho.platform.util.messages.LocaleHelper;

/**
 * Created by IntelliJ IDEA.
 * User: sramazzina
 * Date: 7-lug-2010
 * Time: 11.27.43
 * To change this template use File | Settings | File Templates.
 */
public class MessageBundlesHelper {

    private String globalBaseMessageFile;
    private String targetDashboardCacheDir;
    private String targetDashboardBaseMsgFile;
    private String sourceDashboardBaseMsgFile;
    private static final String PENTAHO_CDF_GLOBAL_LANGUAGES_DIR = "resources/languages";
    private String languagesCacheUrl;


    public MessageBundlesHelper(String msgsDir,
                                String msgsBaseFileName) {
        init(msgsDir, msgsBaseFileName);
    }

    public void saveI18NMessageFilesToCache() throws IOException {
        createCacheDirIfNotExists(targetDashboardCacheDir);
        copyStdGlobalMessageFileToCache();
        if (sourceDashboardBaseMsgFile != null) {
            appendMessageFiles(sourceDashboardBaseMsgFile, globalBaseMessageFile, targetDashboardBaseMsgFile);
        } else {
            appendMessageFiles(globalBaseMessageFile, targetDashboardBaseMsgFile);
        }
    }


    public String getMessageFilesCacheUrl() {
        return languagesCacheUrl.replace(File.separator, "/");
    }

    protected void init(String msgsDir,
                        String msgsBaseFileName) {

        globalBaseMessageFile = PENTAHO_CDF_GLOBAL_LANGUAGES_DIR + File.separator + CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME;
        targetDashboardCacheDir = CdfConstants.BASE_CDF_CACHE_DIR + msgsDir;
        // Name the dashboard target i18n messages file. If we have a dashboard specific language file it will be named
        // the same otherwise it will have the name of the global message file. The target message file contains globals and local translations
        // (if the dashboard has a specific set of translations) or the name of the global one if no translations are specified.
        // This way we eliminate fake error messages that are given by the unexpected unavailability of message files.
        targetDashboardBaseMsgFile = targetDashboardCacheDir + File.separator + (msgsBaseFileName!=null ? msgsBaseFileName : CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME);
        if (msgsBaseFileName != null)
            sourceDashboardBaseMsgFile = msgsDir + File.separator + msgsBaseFileName;
    }

    protected void createCacheDirIfNotExists(String targetDashboardCacheDir) {
      PluginClassLoader loader = (PluginClassLoader)this.getClass().getClassLoader();
      File fBaseMsgTargetDir = new File(loader.getPluginDir(), targetDashboardCacheDir);
      if (!fBaseMsgTargetDir.exists()) {
          fBaseMsgTargetDir.mkdirs();
      }
    }


    protected void appendMessageFiles(String globalBaseMessageFile,
                                     String targetDashboardBaseMsgFile) throws IOException {
        appendMessageFiles(null, globalBaseMessageFile, targetDashboardBaseMsgFile);
    }
    
    protected void appendMessageFiles(String sourceDashboardBaseMsgFile,
                                    String globalBaseMessageFile,
                                    String targetDashboardBaseMsgFile) throws IOException {

        Locale locale = LocaleHelper.getLocale();
        targetDashboardBaseMsgFile = targetDashboardBaseMsgFile + "_" + locale.getLanguage();
        File fBaseMsgGlobal = new File(globalBaseMessageFile + "_" + locale.getLanguage() + ".properties");
        File fBaseMsgTarget = new File(targetDashboardBaseMsgFile + ".properties");
        
        String theLine;
        if (!fBaseMsgTarget.exists()) {
            fBaseMsgTarget.createNewFile();
            BufferedWriter bwBaseMsgTarget = new BufferedWriter(new FileWriter(fBaseMsgTarget, true));
            // If localized global message file doesn't exists then use the standard base global message file
            // and generate a fake global message file. So this way we're sure that we always have the file
            if (!fBaseMsgGlobal.exists())
                fBaseMsgGlobal = new File(globalBaseMessageFile  + ".properties");
            BufferedReader brBaseMsgGlobal = new BufferedReader(new FileReader(fBaseMsgGlobal));
            while ((theLine = brBaseMsgGlobal.readLine()) != null) {
                bwBaseMsgTarget.write(theLine + "\n");
            }
            brBaseMsgGlobal.close();

            // Append specific message file only if it exists otherwise just use the global message files
            if (sourceDashboardBaseMsgFile != null) {
                sourceDashboardBaseMsgFile = sourceDashboardBaseMsgFile + "_" + locale.getLanguage();
                File fBaseMsgDashboard = new File(sourceDashboardBaseMsgFile + ".properties");
                if (fBaseMsgDashboard.exists()) {
                    BufferedReader brBaseMsgDashboard = new BufferedReader(new FileReader(fBaseMsgDashboard));
                    while ((theLine = brBaseMsgDashboard.readLine()) != null) {
                        bwBaseMsgTarget.write(theLine + "\n");
                    }
                    brBaseMsgDashboard.close();
                }
            }
            bwBaseMsgTarget.close();
        }
    }

    protected void copyStdGlobalMessageFileToCache() throws IOException {

        String toFile = targetDashboardCacheDir + "/" + CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME + ".properties";
        PluginClassLoader loader = (PluginClassLoader)this.getClass().getClassLoader();

        File outputFile = new File(loader.getPluginDir(), toFile);
        if (outputFile.exists()) return;
        outputFile.createNewFile();
        
        File inputFile = new File(loader.getPluginDir(), PENTAHO_CDF_GLOBAL_LANGUAGES_DIR + File.separator + CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME + ".properties");

        FileReader in = new FileReader(inputFile);
        FileWriter out = new FileWriter(outputFile);
        int c;

        while ((c = in.read()) != -1)
          out.write(c);

        in.close();
        out.close();

    }
}
