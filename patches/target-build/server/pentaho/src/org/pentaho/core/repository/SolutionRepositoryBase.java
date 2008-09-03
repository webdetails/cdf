package org.pentaho.core.repository;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.math.BigDecimal;
import java.nio.channels.FileChannel;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.activation.DataSource;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.Node;
import org.pentaho.core.audit.AuditHelper;
import org.pentaho.core.audit.MessageTypes;
import org.pentaho.core.cache.CacheManager;
import org.pentaho.core.session.IPentahoSession;
import org.pentaho.core.solution.ActionResource;
import org.pentaho.core.solution.IActionResource;
import org.pentaho.core.solution.ISolutionFile;
import org.pentaho.core.solution.SolutionReposUtil;
import org.pentaho.core.solution.SolutionReposUtil.ISolutionFilter;
import org.pentaho.core.system.PentahoMessenger;
import org.pentaho.core.system.PentahoSystem;
import org.pentaho.core.util.CleanXmlHelper;
import org.pentaho.core.util.XmlHelper;
import org.pentaho.messages.Messages;
import org.pentaho.messages.util.LocaleHelper;
import org.pentaho.repository.filebased.solution.FileSolutionFile;
import org.pentaho.util.HttpUtil;

import com.pentaho.repository.dbbased.solution.RepositoryFile;

public abstract class SolutionRepositoryBase extends PentahoMessenger implements ISolutionRepository {
  private static final long serialVersionUID = 6367444546398801343L;

  protected static final Log logger = LogFactory.getLog(SolutionRepositoryBase.class);

  protected static final int BROWSE_DEPTH = 1000;

  protected static final String ROOT_NODE_NAME = "repositiory"; //$NON-NLS-1$

  protected static final String LOCATION_ATTR_NAME = "location"; //$NON-NLS-1$

  protected static final String EMPTY_STR = ""; //$NON-NLS-1$

  protected static final boolean debug = PentahoSystem.debug;

  protected static final String ENTRY_NODE_NAME = "entry"; //$NON-NLS-1$

  protected static final String TYPE_ATTR_NAME = "type"; //$NON-NLS-1$

  protected static final String NAME_ATTR_NAME = "name"; //$NON-NLS-1$

  protected static final String DIRECTORY_ATTR = "directory"; //$NON-NLS-1$

  protected static final String FILE_ATTR = "file"; //$NON-NLS-1$

	public static final String INDEX_FILENAME = "index.xml"; //$NON-NLS-1$

  protected static final long PUBLISH_TIMEOUT = 1500; // 1.5 seconds

  protected static HashMap propertyMap = new HashMap();

  protected static String LOG_NAME = "SOLUTION-REPOSITORY"; //$NON-NLS-1$
  /*
   * matches 0 or 1 "/" followed by any non-"/" followed by
   * either an end of string or (a "/" followed by 0 or more of anything).
   */
  private static final String RE_SYSTEM_PATH = "^[/\\\\]?system($|[/\\\\].*$)"; //$NON-NLS-1$
  private static final Pattern SYSTEM_PATH_PATTERN = Pattern.compile(SolutionRepositoryBase.RE_SYSTEM_PATH);

  protected ThreadLocal session = new ThreadLocal();

  protected String rootPath;

  protected File rootFile;

  private CacheManager cacheManager;

  protected boolean cachingAvailable = false;

  public Log getLogger() {
    return logger;
  }

  protected Locale getLocale() {
    return LocaleHelper.getLocale();
  }

  public void init() {
    cacheManager = PentahoSystem.getCacheManager();
    cachingAvailable = cacheManager != null && cacheManager.cacheEnabled();
    rootFile = getFile("", false); //$NON-NLS-1$
    rootPath = rootFile.getAbsolutePath() + File.separator;
    setLogId(LOG_NAME + ": "); //$NON-NLS-1$
  }

  public void init(IPentahoSession pentahoSession) {
    init();
    setSession(pentahoSession);
  }
  
  
  public IPentahoSession getSession() {
    Object threadSession = session.get();
    return (IPentahoSession) threadSession;
  }

  public void setSession(IPentahoSession inSession) {
    session.set(inSession);
  }

  // TODO sbarkdull, this code is very similar to XmlHelper.getLocalizedFile(). they
  // likely should be resolved into a single method in an appropriate utility class/package.
  public ISolutionFile getLocalizedFile(ISolutionFile resourceFile) {
    String fileName = resourceFile.getFileName();
    int idx = fileName.lastIndexOf('.');
    String baseName = idx == -1 ? fileName : fileName.substring(0, idx); // These two lines fix an index out of bounds
    String extension = idx == -1 ? "" : fileName.substring(idx);         // Exception that occurs when a filename has no extension //$NON-NLS-1$
    String directory = resourceFile.getSolutionPath();
    if (directory.lastIndexOf(fileName) != -1) {
      directory = new StringBuffer(directory).delete(directory.lastIndexOf(fileName), directory.length()).toString();
    }
    if (!directory.endsWith(RepositoryFile.SEPARATOR + "")) { //$NON-NLS-1$
      directory += RepositoryFile.SEPARATOR;
    }
    String language = getLocale().getLanguage();
    String country = getLocale().getCountry();
    String variant = getLocale().getVariant();
    ISolutionFile localeFile = null;
    if (!variant.equals("")) { //$NON-NLS-1$
      localeFile = getFileByPath(directory + baseName + "_" + language + "_" + country + "_" + variant + extension); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
    }
    if (localeFile == null) {
      localeFile = getFileByPath(directory + baseName + "_" + language + "_" + country + extension); //$NON-NLS-1$//$NON-NLS-2$
    }
    if (localeFile == null) {
      localeFile = getFileByPath(directory + baseName + "_" + language + extension); //$NON-NLS-1$
    }
    if (localeFile == null) {
      localeFile = getFileByPath(directory + baseName + extension);
    }
    if (localeFile != null) {
      return localeFile;
    } else {
      return resourceFile;
    }
  }

  public ISolutionFile getFileByPath(String path) {
    File file = new File(PentahoSystem.getApplicationContext().getSolutionPath(path));
    if (file.exists()) {
      return new FileSolutionFile(file, rootFile);
    } else {
      return null;
    }
  }

  protected File getFile(String path, boolean create) {
    File f = new File(PentahoSystem.getApplicationContext().getSolutionPath(path));
    if (!f.exists() && !create) {
      error(Messages.getErrorString("SolutionRepository.ERROR_0001_FILE_DOES_NOT_EXIST", path)); //$NON-NLS-1$
      return null;
    }
    if (!f.exists()) {
      f.mkdirs();
    }
    // TODO: caching
    if (debug)
      debug(Messages.getErrorString("SolutionRepository.DEBUG_FILE_PATH", f.getAbsolutePath())); //$NON-NLS-1$
    return f;
  }
  
  public static boolean isSystemPath(String path) {

    Matcher m = SYSTEM_PATH_PATTERN.matcher( path.toLowerCase() );
    return m.matches();
  }
  
  public InputStream getResourceInputStream(IActionResource actionResource, boolean getLocalizedResource)
      throws FileNotFoundException {
    int resourceSource = actionResource.getSourceType();
    InputStream inputStream = null;
    if (resourceSource == IActionResource.URL_RESOURCE) {
      inputStream = HttpUtil.getURLInputStream(actionResource.getAddress());
    } else if ((resourceSource == IActionResource.SOLUTION_FILE_RESOURCE)
        || (resourceSource == IActionResource.FILE_RESOURCE)) {
      ISolutionFile solutionFile = getSolutionFile(actionResource);
      if (solutionFile == null) {
        String msg = Messages.getErrorString("SOLREPO.ERROR_0006_MISSING_RESOURCE", actionResource.getAddress()); //$NON-NLS-1$
        error(msg);
        throw new FileNotFoundException(msg);
      } else if (getLocalizedResource) {
        solutionFile = getLocalizedFile(solutionFile);
      }
      inputStream = new ByteArrayInputStream(solutionFile.getData());
    }
    return inputStream;   
  }

  public void localizeDoc(Node document, ISolutionFile file) {
    String fileName = file.getFileName();
    int dotIndex = fileName.indexOf('.');
    String baseName = fileName.substring(0, dotIndex);
    // TODO read in nodes from the locale file and use them to override the
    // ones in the main document
    try {
      List nodes = document.selectNodes("descendant::*"); //$NON-NLS-1$
      Iterator nodeIterator = nodes.iterator();
      while (nodeIterator.hasNext()) {
        Node node = (Node) nodeIterator.next();
        String name = node.getText();
        if (name.startsWith("%") && !node.getPath().endsWith("/text()")) { //$NON-NLS-1$ //$NON-NLS-2$
          try {
            String localeText = getLocaleString(name, baseName, file);
            if (localeText != null) {
              node.setText(localeText);
            }
          } catch (Exception e) {
            warn(Messages
                .getString(
                    "SolutionRepository.WARN_MISSING_RESOURCE_PROPERTY", name.substring(1), baseName, getLocale().toString())); //$NON-NLS-1$
          }
        }
      }
    } catch (Exception e) {
      error(Messages.getErrorString("SolutionRepository.ERROR_0007_COULD_NOT_READ_PROPERTIES", file.getFullPath()), e); //$NON-NLS-1$
    }
  }

  public String getLocaleString(String key, String baseName, String baseFilePath) {
    ISolutionFile file = getFileByPath(baseFilePath);
    return getLocaleString(key, baseName, file);
  }

  // TODO sbarkdull, needs to be refactored, consider if
  // how it should work with/, etc. XmlHelper getLocalizedFile
  protected String getLocaleString(String key, String baseName, ISolutionFile baseFile) {
    ISolutionFile searchDir = baseFile.retrieveParent();
    try {
      boolean searching = true;
      while (searching) {
        String localeText = getLocaleText(key, getFileByPath(searchDir.getFullPath() + RepositoryFile.SEPARATOR
            + baseName + '_' + getLocale().getLanguage() + '_' + getLocale().getCountry() + '_'
            + getLocale().getVariant() + ".properties")); //$NON-NLS-1$
        if (localeText == null) {
          localeText = getLocaleText(key, getFileByPath(searchDir.getFullPath() + RepositoryFile.SEPARATOR + baseName
              + '_' + getLocale().getLanguage() + '_' + getLocale().getCountry() + ".properties")); //$NON-NLS-1$)
          if (localeText == null) {
            localeText = getLocaleText(key, getFileByPath(searchDir.getFullPath() + RepositoryFile.SEPARATOR + baseName
                + '_' + getLocale().getLanguage() + ".properties")); //$NON-NLS-1$
            if (localeText == null) {
              localeText = getLocaleText(key, getFileByPath(searchDir.getFullPath() + RepositoryFile.SEPARATOR
                  + baseName + ".properties")); //$NON-NLS-1$);
            }
          }
        }
        if (localeText != null) {
          return localeText;
        }
        if (searching) {
          if (!baseName.equals("messages")) { //$NON-NLS-1$
            baseName = "messages"; //$NON-NLS-1$
          } else {
            if (searchDir.isRoot()) {
              searching = false;
            } else {
              searchDir = searchDir.retrieveParent();
            }
          }
        }
      }
      return null;
    } catch (Exception e) {
      error(
          Messages.getErrorString("SolutionRepository.ERROR_0007_COULD_NOT_READ_PROPERTIES", baseFile.getFullPath()), e); //$NON-NLS-1$
    }
    return null;
  }

  protected String getLocaleText(String key, ISolutionFile file) throws IOException {
    if (file != null) {
      Properties p = (Properties) propertyMap.get(file.getFullPath());
      if (p == null) {
        p = new Properties();
        p.load(new ByteArrayInputStream(file.getData()));
        propertyMap.put(file.getFullPath(), p);
      }
      String localeText = p.getProperty(key.substring(1));
      if (localeText != null) {
        return localeText;
      }
    }
    return null;
  }

  public InputStream getResourceInputStream(String solutionPath, boolean getLocalizedResource)
      throws FileNotFoundException {
    ActionResource resource = new ActionResource("", IActionResource.SOLUTION_FILE_RESOURCE, "text/xml", //$NON-NLS-1$ //$NON-NLS-2$
        solutionPath);
    return getResourceInputStream(resource, getLocalizedResource);
  }

  public Reader getResourceReader(IActionResource actionResource) throws FileNotFoundException, IOException {
    return new InputStreamReader(getResourceInputStream(actionResource, true), LocaleHelper.getSystemEncoding());
  }

  public Reader getResourceReader(String solutionPath) throws FileNotFoundException, IOException {
    ActionResource resource = new ActionResource("", IActionResource.SOLUTION_FILE_RESOURCE, "text/xml", //$NON-NLS-1$ //$NON-NLS-2$
        solutionPath);
    return getResourceReader(resource);
  }

  public String getResourceAsString(IActionResource actionResource) throws IOException {
    return new String(getResourceAsBytes(actionResource, true), LocaleHelper.getSystemEncoding());
  }

  public String getResourceAsString(String solutionPath) throws IOException {
    ActionResource resource = new ActionResource("", IActionResource.SOLUTION_FILE_RESOURCE, "text/xml", //$NON-NLS-1$ //$NON-NLS-2$
        solutionPath);
    return getResourceAsString(resource);
  }

  public byte[] getResourceAsBytes(IActionResource actionResource, boolean getLocalizedResource) throws IOException {
    InputStream inputStream = getResourceInputStream(actionResource, getLocalizedResource);
    ByteArrayOutputStream bais = new ByteArrayOutputStream();
    int numRead = 0;
    byte[] buffer = new byte[16384];
    while ((numRead = inputStream.read(buffer)) != -1) {
      bais.write(buffer, 0, numRead);
    }
    bais.close();
    return bais.toByteArray();
  }

  public byte[] getResourceAsBytes(String solutionPath, boolean getLocalizedResource) throws IOException {
    ActionResource resource = new ActionResource("", IActionResource.SOLUTION_FILE_RESOURCE, "text/xml", //$NON-NLS-1$ //$NON-NLS-2$
        solutionPath);
    return getResourceAsBytes(resource, getLocalizedResource);
  }

  public DataSource getResourceDataSource(IActionResource actionResource) throws FileNotFoundException {
    return new InputStreamDataSource(actionResource.getName(), getResourceInputStream(actionResource, true));
  }

  public DataSource getResourceDataSource(String solutionPath) throws FileNotFoundException {
    ActionResource resource = new ActionResource("", IActionResource.SOLUTION_FILE_RESOURCE, "text/xml", //$NON-NLS-1$ //$NON-NLS-2$
        solutionPath);
    return getResourceDataSource(resource);
  }

  public Document getResourceAsDocument(String solutionPath) throws IOException {
    ActionResource resource = new ActionResource("", IActionResource.SOLUTION_FILE_RESOURCE, "text/xml", //$NON-NLS-1$ //$NON-NLS-2$
        solutionPath);
    return getResourceAsDocument(resource);
  }

  public Document getResourceAsDocument(IActionResource actionResource) throws IOException {
    // TODO support locales here
    
    // figure out what the XML string says the encoding is
    byte[] b = getResourceAsBytes(actionResource, true);
    String tmpXml = new String( b );
    String encoding = CleanXmlHelper.getEncoding( tmpXml );
    if ( null == encoding )
    {
      encoding = LocaleHelper.getSystemEncoding();
    }
    // now apply the correct encoding when we translate the bytes to a String
    String xml = new String( b, encoding );
    Document document = null;
    try {
      document = XmlHelper.getDocFromString(xml);
    } catch (Throwable t) {
      error(Messages.getErrorString("SolutionRepository.ERROR_0009_INVALID_DOCUMENT", actionResource.getAddress()), t); //$NON-NLS-1$
      return null;
    }
    return document;
  }

  public Document getSolutions(int actionOperation) {
    return getSolutions(null, null, actionOperation, false);
  }

  protected List getSolutionNames(String solutionName, String pathName, int actionOperation, boolean visibleOnly) {
    Document solns = getSolutions(solutionName, pathName, actionOperation, visibleOnly);
    String xPath = "/repository/file"; //$NON-NLS-1$
    return solns.selectNodes(xPath);
  }

  /**
   * Clears cached data for ALL users
   */
  public void resetRepository() {
    if (cacheManager != null) {
      cacheManager.killSessionCaches();
    }
  }

  public ISolutionFile getRootFolder() {
    return new FileSolutionFile(rootFile, rootFile);
  }
  
  public String getXSLName(Document document, String solution, String inputXSLName) {
    String xslName = inputXSLName;
    if (solution == null) {
      if (xslName == null) {
        Node node = document.selectSingleNode("/repository/@displaytype"); //$NON-NLS-1$
        if (node != null) {
          String displayType = node.getText();
          if (displayType.endsWith(".xsl")) { //$NON-NLS-1$
            // this folder has a custom XSL
            xslName = displayType;
          }
        }
      }
    } else {
      if (xslName == null) {
        Node node = document.selectSingleNode("/files/@displaytype"); //$NON-NLS-1$
        if (node != null) {
          String displayType = node.getText();
          if (displayType.endsWith(".xsl")) { //$NON-NLS-1$
            // this folder has a custom XSL
            xslName = displayType;
          }
        }
      }
    }
    return xslName;
  }

  public Document getNavigationUIDocument(String solution, String path, int actionOperation) {
    Document document = this.getSolutions(solution, path, ISolutionRepository.ACTION_EXECUTE, false);
    return document;
  }

  /**
   * @return int possible values:
   * 	ISolutionRepository.FILE_ADD_SUCCESSFUL
   * 	ISolutionRepository.FILE_EXISTS
   * 	ISolutionRepository.FILE_ADD_FAILED
   */
  public int addSolutionFile(String baseUrl, String path, String fileName, File f, boolean overwrite) {
    if (!path.endsWith("/") && !path.endsWith("\\")) { //$NON-NLS-1$ //$NON-NLS-2$
      path += File.separator;
    }
    File fNew = new File(baseUrl + path + fileName);
    int status = ISolutionRepository.FILE_ADD_SUCCESSFUL;
    if (fNew.exists() && !overwrite) {
      status = ISolutionRepository.FILE_EXISTS;
    } else {
      FileChannel in = null, out = null;
      try {
        in = new FileInputStream(f).getChannel();
        out = new FileOutputStream(fNew).getChannel();
        out.transferFrom(in, 0, in.size());
        resetRepository();
      } catch (Exception e) {
        logger.error(e.toString());
        status = ISolutionRepository.FILE_ADD_FAILED;
      } finally {
        try {
          if (in != null)
            in.close();
          if (out != null)
            out.close();
        } catch (Exception e) {
        	// TODO, we should probably log the error, and return a failure status
        }
      }
    }
    return status;
  }

  public int addSolutionFile(String baseUrl, String path, String fileName, byte[] data, boolean overwrite) {
    // baseUrl = baseUrl + path;
    if (!path.endsWith("/") && !path.endsWith("\\")) {  //$NON-NLS-1$//$NON-NLS-2$
      path += File.separator;
    }
    File fNew = new File(baseUrl + path + fileName);
    int status = ISolutionRepository.FILE_ADD_SUCCESSFUL;
    if (fNew.exists() && !overwrite) {
      status = ISolutionRepository.FILE_EXISTS;
    } else {
      FileOutputStream fNewOut = null;
      try {
        fNewOut = new FileOutputStream(fNew);
        fNewOut.write(data);
        resetRepository();
      } catch (Exception e) {
        status = ISolutionRepository.FILE_ADD_FAILED;
        logger.error(e.toString());
      } finally {
        try {
          fNewOut.close();
        } catch (Exception e) {
        	// TODO, we should probably log the error, and return a failure status
        }
      }
    }
    return status;
  }

  public boolean removeSolutionFile(String solutionPath) {
  	solutionPath = PentahoSystem.getApplicationContext().getSolutionPath( solutionPath );
    File deleteFile = new File(solutionPath);
    try {
      if (deleteFile.exists()) {
        if (!deleteFile.isDirectory()) {
          boolean deleted = deleteFile.delete();
          if (deleted) {
            AuditHelper
                .audit(
                    "", getSession().getName(), "", getClass().toString(), "", MessageTypes.UNKNOWN_ENTRY, Messages.getString("SOLREPO.AUDIT_DEL_FILE", solutionPath), "", new BigDecimal("0.0"), null); //$NON-NLS-1$//$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$ //$NON-NLS-5$ //$NON-NLS-6$
          }
          return deleted;
        } else { // recursively delete all the files under this directory
          // and then delete the directory
          return deleteFolder(deleteFile);
        }
      }
    } finally {
      resetRepository();
    }
    return false;
  }
  
  /**
   * this is the file based removeSolutionFile, used by subclasses
   */
  public boolean removeSolutionFile(String solution, String path, String fileName) {
    return removeSolutionFile(solution + path + fileName);
  }

  private boolean deleteFolder(File dir) {
    if (!dir.isDirectory()) {
      logger.warn(Messages.getString("SolutionRepository.USER_DELETE_FOLDER_WARNING")); //$NON-NLS-1$
      return false;
    }
    String[] files = dir.list();
    for (int i = 0; i < files.length; i++) {
      String filePath = dir.getAbsolutePath() + File.separator + files[i];
      File file = new File(filePath);
      if (file.isDirectory()) {
        if (deleteFolder(file)) {
          AuditHelper
              .audit(
                  "", getSession().getName(), "", getClass().toString(), "", MessageTypes.UNKNOWN_ENTRY, Messages.getString("SOLREPO.AUDIT_DEL_FOLDER", filePath), "", new BigDecimal("0.0"), null); //$NON-NLS-1$//$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$ //$NON-NLS-5$ //$NON-NLS-6$
        }
      } else {
        if (file.delete()) {
          AuditHelper
              .audit(
                  "", getSession().getName(), "", getClass().toString(), "", MessageTypes.UNKNOWN_ENTRY, Messages.getString("SOLREPO.AUDIT_DEL_FILE", filePath), "", new BigDecimal("0.0"), null); //$NON-NLS-1$//$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$ //$NON-NLS-5$ //$NON-NLS-6$
        }
      }
    }
    String filePath = dir.getAbsolutePath();
    boolean deleted = dir.delete();
    if (deleted) {
      AuditHelper
          .audit(
              "", getSession().getName(), "", getClass().toString(), "", MessageTypes.UNKNOWN_ENTRY, Messages.getString("SOLREPO.AUDIT_DEL_FOLDER", filePath), "", new BigDecimal("0.0"), null); //$NON-NLS-1$//$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$ //$NON-NLS-5$ //$NON-NLS-6$
    }
    return deleted;
  }

  public Document getFullSolutionTree(int actionOperation, ISolutionFilter filter) {

		Document document = DocumentHelper.createDocument();
		Element root = document.addElement(SolutionReposUtil.TREE_NODE_NAME);

    SolutionReposUtil.processSolutionTree(root, new FileSolutionFile(rootFile, rootFile),
        SolutionReposUtil.KEEP_ALL_FILTER, SolutionReposUtil.ADD_NOTHING_CONTRIBUTOR, null, null, actionOperation);

		return document;
	}
	
  protected boolean isCachingAvailable() {
    return cachingAvailable;
  }

  /**
   * Caches the repository object
   * 
   * @param key - String value of the key
   * @param value - Object referred to by key
   * 
   * @return null if unable to catch otherwise returns the object that was cached
   */
  protected Object putRepositoryObjectInCache(String key, Object value) {
    if (isCachingAvailable()) {
      cacheManager.putInSessionCache(getSession(), key, value);
      return value;
    }

    return null;
  }

  /**
   * Gets the object from the session cache defined by the parameter key
   * 
   * @param key - String value of the key to lookup
   * 
   * @return Object that is referred to by the key.  Null if not in the cache or if caching is unavailable
   */
  protected Object getRepositoryObjectFromCache(String key) {
    if (isCachingAvailable()) {
      return cacheManager.getFromSessionCache(getSession(), key);
    }

    return null;
  }

  public ISolutionFile getSolutionFile(IActionResource actionResource) {
    ISolutionFile solutionFile = null;
    int resourceSource = actionResource.getSourceType();
    String realPath = null;
    if (resourceSource == IActionResource.SOLUTION_FILE_RESOURCE) {
      realPath = actionResource.getAddress();
      if (!SolutionRepositoryBase.isSystemPath( realPath )) {
        solutionFile = getFileByPath(realPath);
      } else {
        realPath = PentahoSystem.getApplicationContext().getSolutionPath(actionResource.getAddress());
        solutionFile = new FileSolutionFile(new File(realPath), rootFile);   
      }
    } else if (resourceSource == IActionResource.FILE_RESOURCE) {
      realPath = actionResource.getAddress();
      solutionFile = new FileSolutionFile(new File(realPath), rootFile);
    }
    if (solutionFile == null || !solutionFile.exists()) {
      solutionFile = null;
    }
    return solutionFile;
  }
}
