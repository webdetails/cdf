package org.pentaho.cdf.localization;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Locale;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.pentaho.cdf.CdfConstants;
import org.pentaho.platform.api.repository2.unified.IUnifiedRepository;
import org.pentaho.platform.api.repository2.unified.RepositoryFile;
import org.pentaho.platform.api.repository2.unified.data.simple.SimpleRepositoryFileData;
import org.pentaho.platform.engine.core.system.PentahoSystem;
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

    private static File PLUGIN_DIR = ((PluginClassLoader)MessageBundlesHelper.class.getClassLoader()).getPluginDir();
    
    private File globalBaseMessageFile = new File(PLUGIN_DIR, PENTAHO_CDF_GLOBAL_LANGUAGES_DIR + File.separator + CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME);
    private File targetDashboardBaseMsgFile;
    private File globalMsgCacheFile;
    private String sourceDashboardBaseMsgFile;
    private static final String PENTAHO_CDF_GLOBAL_LANGUAGES_DIR = "resources/languages";
    private String languagesCacheUrl;
    private Object msgsDir;


    public MessageBundlesHelper(File msgsDir,
        String msgsBaseFileName) {
      
      this.msgsDir = msgsDir;
      String relativeDirPath = FilenameUtils.getPath(msgsDir.getAbsolutePath()) + msgsDir.getName();
      // Name the dashboard target i18n messages file. If we have a dashboard specific language file it will be named
      // the same otherwise it will have the name of the global message file. The target message file contains globals and local translations
      // (if the dashboard has a specific set of translations) or the name of the global one if no translations are specified.
      // This way we eliminate fake error messages that are given by the unexpected unavailability of message files.
      targetDashboardBaseMsgFile = new File(PLUGIN_DIR, CdfConstants.BASE_CDF_CACHE_DIR + File.separator + relativeDirPath + File.separator + (msgsBaseFileName!=null ? msgsBaseFileName : CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME));
      globalMsgCacheFile = new File(PLUGIN_DIR, CdfConstants.BASE_CDF_CACHE_DIR + File.separator + relativeDirPath + File.separator + CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME + ".properties");
      sourceDashboardBaseMsgFile = msgsBaseFileName;
      languagesCacheUrl = CdfConstants.BASE_CDF_CACHE_DIR + File.separator + relativeDirPath;
    }
    
    
    public MessageBundlesHelper(RepositoryFile msgsDir,
                                String msgsBaseFileName) {
      this.msgsDir = msgsDir;
      String relativeDirPath = FilenameUtils.getPath(msgsDir.getPath()) + msgsDir.getName();
      // Name the dashboard target i18n messages file. If we have a dashboard specific language file it will be named
      // the same otherwise it will have the name of the global message file. The target message file contains globals and local translations
      // (if the dashboard has a specific set of translations) or the name of the global one if no translations are specified.
      // This way we eliminate fake error messages that are given by the unexpected unavailability of message files.
      targetDashboardBaseMsgFile = new File(PLUGIN_DIR, CdfConstants.BASE_CDF_CACHE_DIR + File.separator + relativeDirPath + File.separator + (msgsBaseFileName!=null ? msgsBaseFileName : CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME));
      globalMsgCacheFile = new File(PLUGIN_DIR, CdfConstants.BASE_CDF_CACHE_DIR + File.separator + relativeDirPath + File.separator + CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME + ".properties");
      sourceDashboardBaseMsgFile = msgsBaseFileName;
      languagesCacheUrl = CdfConstants.BASE_CDF_CACHE_DIR + File.separator + relativeDirPath;
    }

    public void saveI18NMessageFilesToCache() throws IOException {
        targetDashboardBaseMsgFile.getParentFile().mkdirs();
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

    protected void appendMessageFiles(File globalBaseMessageFile,
                                      File targetDashboardBaseMsgFile) throws IOException {
        appendMessageFiles(null, globalBaseMessageFile, targetDashboardBaseMsgFile);
    }
    
    protected void appendMessageFiles(String sourceDashboardBaseMsgFile,
                                    File globalBaseMessageFile,
                                    File targetDashboardBaseMsgFile) throws IOException {

        Locale locale = LocaleHelper.getLocale();
        File fBaseMsgGlobal = new File(globalBaseMessageFile + "_" + locale.getLanguage() + ".properties");
        File fBaseMsgTarget = new File(targetDashboardBaseMsgFile  + "_" + locale.getLanguage() + ".properties");
        
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
              if (msgsDir instanceof File) {
                File fBaseMsgDashboard = new File((File)msgsDir, sourceDashboardBaseMsgFile + "_" + locale.getLanguage() + ".properties");
                if (fBaseMsgDashboard.exists()) {
                  BufferedReader brBaseMsgDashboard = new BufferedReader(new FileReader(fBaseMsgDashboard));
                  while ((theLine = brBaseMsgDashboard.readLine()) != null) {
                      bwBaseMsgTarget.write(theLine + "\n");
                  }
                  brBaseMsgDashboard.close();
                }
              } else if (msgsDir instanceof RepositoryFile) {
                RepositoryFile repositoryFile = (RepositoryFile)msgsDir;
                IUnifiedRepository unifiedRepository = PentahoSystem.get(IUnifiedRepository.class, null);
                RepositoryFile fBaseMsgDashboard = unifiedRepository.getFileById(((RepositoryFile) msgsDir).getPath() + File.separator + sourceDashboardBaseMsgFile + "_" + locale.getLanguage() + ".properties");
                if (fBaseMsgDashboard != null) {
                  InputStream is = unifiedRepository.getDataForRead(fBaseMsgDashboard.getId(), SimpleRepositoryFileData.class).getStream();
                  BufferedReader brBaseMsgDashboard = new BufferedReader(new InputStreamReader(is));
                  while ((theLine = brBaseMsgDashboard.readLine()) != null) {
                      bwBaseMsgTarget.write(theLine + "\n");
                  }
                  brBaseMsgDashboard.close();
                }
              }
            }
            bwBaseMsgTarget.close();
        }
    }

    protected void copyStdGlobalMessageFileToCache() throws IOException {

        PluginClassLoader loader = (PluginClassLoader)this.getClass().getClassLoader();

        File outputFile = globalMsgCacheFile;
        if (outputFile.exists()) return;
        outputFile.createNewFile();
        
        File inputFile = new File(loader.getPluginDir(), PENTAHO_CDF_GLOBAL_LANGUAGES_DIR + File.separator + CdfConstants.BASE_GLOBAL_MESSAGE_SET_FILENAME + ".properties");
        IOUtils.copyLarge(new FileReader(inputFile), new FileWriter(outputFile));
    }
}
