/*
 * This program is free software; you can redistribute it and/or modify it under the 
 * terms of the GNU General Public License, version 2 as published by the Free Software 
 * Foundation.
 *
 * You should have received a copy of the GNU General Public License along with this 
 * program; if not, you can obtain a copy at http://www.gnu.org/licenses/gpl-2.0.html 
 * or from the Free Software Foundation, Inc., 
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * 
 * Copyright 2005-2008 Pentaho Corporation.  All rights reserved. 
 * 
 * @created Jun 21, 2005 
 * @author James Dixon
 * 
 */
package org.pentaho.platform.repository.solution.dbbased;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.StringTokenizer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.Node;
import org.hibernate.HibernateException;
import org.hibernate.Query;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.pentaho.platform.api.engine.IAclHolder;
import org.pentaho.platform.api.engine.IAclPublisher;
import org.pentaho.platform.api.engine.IAclVoter;
import org.pentaho.platform.api.engine.IActionSequence;
import org.pentaho.platform.api.engine.IPentahoAclEntry;
import org.pentaho.platform.api.engine.IPentahoInitializer;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.IPermissionMask;
import org.pentaho.platform.api.engine.IPermissionRecipient;
import org.pentaho.platform.api.engine.ISolutionAttributeContributor;
import org.pentaho.platform.api.engine.ISolutionFile;
import org.pentaho.platform.api.engine.ISolutionFilter;
import org.pentaho.platform.api.engine.PentahoAccessControlException;
import org.pentaho.platform.api.repository.ISolutionRepository;
import org.pentaho.platform.api.repository.ISubscriptionRepository;
import org.pentaho.platform.api.repository.RepositoryException;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.engine.security.AcegiPermissionMgr;
import org.pentaho.platform.engine.security.SecurityHelper;
import org.pentaho.platform.engine.security.SimplePermissionMask;
import org.pentaho.platform.engine.security.SimpleRole;
import org.pentaho.platform.engine.security.SimpleSession;
import org.pentaho.platform.engine.security.acls.PentahoAclEntry;
import org.pentaho.platform.engine.services.actionsequence.SequenceDefinition;
import org.pentaho.platform.engine.services.solution.SolutionReposHelper;
import org.pentaho.platform.repository.hibernate.HibernateUtil;
import org.pentaho.platform.repository.messages.Messages;
import org.pentaho.platform.repository.solution.SolutionRepositoryBase;
import org.pentaho.platform.repository.solution.filebased.FileInfo;
import org.pentaho.platform.util.FileHelper;
import org.pentaho.platform.util.StringUtil;
import org.pentaho.platform.util.xml.XmlHelper;
import org.pentaho.platform.util.xml.dom4j.XmlDom4JHelper;

/**
 * @author William Seyler
 */
public class DbBasedSolutionRepository extends SolutionRepositoryBase implements ISolutionFilter,
    ISolutionAttributeContributor, IPentahoInitializer {
  private static final long serialVersionUID = -8270135463210017284L;

  private static final String BREAD_CRUMBS_TAG = "breadcrumbs/"; //$NON-NLS-1$

  // private String rootFile;
  private String repositoryName;

  private RepositoryFile rootDirectory;

  private static final byte[] lock = new byte[0];

  private boolean repositoryInit = false;

  public DbBasedSolutionRepository() {
    super();
    init();
  }

  @Override
  public void init() {
    if (!repositoryInit) {
      super.init();
      String reposName = PentahoSystem.getSystemSetting("solution-repository/db-repository-name", null); //$NON-NLS-1$
      if (reposName != null) {
        setRepositoryName(reposName);
        SolutionRepositoryBase.logger.info(Messages.getString(
            "SolutionRepository.WARN_0002_USING_SOLUTION_NAME", getRepositoryName())); //$NON-NLS-1$
      } else {
        SolutionRepositoryBase.logger.info(Messages.getString("SolutionRepository.WARN_0001_UNDEFINED_SOLUTION_NAME")); //$NON-NLS-1$
      }
      RepositoryFile root = (RepositoryFile) getRootFolder();
      if (root == null) {
        String path = PentahoSystem.getApplicationContext().getSolutionPath(""); //$NON-NLS-1$
        loadSolutionFromFileSystem(getSession(), path, true);
        root = (RepositoryFile) getRootFolder();
      }
      repositoryInit = true;
    }
  }

  public IActionSequence getActionSequence(final String solutionName, final String actionPath,
      final String sequenceName, final int localLoggingLevel, final int actionOperation) {
    String action = buildDirectoryPath(solutionName, actionPath, sequenceName);

    if ((action == null) || (action.length() == 0)) {
      error(Messages.getErrorString("SolutionRepository.ERROR_0008_ACTION_SEQUENCE_NAME_INVALID"));
      return null;
    }

    Document actionSequenceDocument = getSolutionDocument(action, actionOperation);
    if (actionSequenceDocument == null) {
      return null;
    }
    IActionSequence actionSequence = SequenceDefinition.ActionSequenceFactory(actionSequenceDocument, sequenceName,
        actionPath, solutionName, this, PentahoSystem.getApplicationContext(), localLoggingLevel);
    if (actionSequence == null) {
      return null;
    }

    return actionSequence;
  }

  public boolean hasAccess(final IPermissionRecipient permRecipient, final ISolutionFile aFile,
      final int actionOperation) {
    AcegiPermissionMgr permissionMgr = AcegiPermissionMgr.instance();
    IPermissionMask permissionMask = mapOperationToPermissionMask(actionOperation);
    return permissionMgr.hasPermission(permRecipient, permissionMask, aFile);
  }

  /**
   * TODO mlowery Need to throw exception if unauthorized. (If there ever is a READ_PERMISSIONS permission.
   */
  public boolean hasAccess(final ISolutionFile aFile, final int actionOperation) {
    return hasAccess(new SimpleSession(getSession()), aFile, actionOperation);
  }

  public boolean isPentahoAdministrator() {
    return SecurityHelper.isPentahoAdministrator(getSession());
  }

  /**
   * TODO mlowery This method trusts that actionOperation is what the caller really wants to do???
   */
  public Document getSolutionDocument(final String documentPath, final int actionOperation) {
    ISolutionFile file = (ISolutionFile) getRepositoryObjectFromCache(documentPath);
    if (file == null) { // Not in cache... go to the solution repository
      file = (ISolutionFile) getFileByPath(documentPath);
      if (file != null) {
        putRepositoryObjectInCache(documentPath, file);
      } else {
        SolutionRepositoryBase.logger.warn(Messages.getString("SolutionRepository.WARN_0004_DOCUMENT_NOT_FOUND",
            documentPath));
        return null; //If it's still null then it doesn't exist
      }
    }

    if (!hasAccess(file, actionOperation)) {
      if (SolutionRepositoryBase.logger.isDebugEnabled()) {
        SolutionRepositoryBase.logger.debug(Messages.getString(
            "SolutionRepository.ACCESS_DENIED", documentPath, Integer.toString(actionOperation))); //$NON-NLS-1$
      }
      error(Messages.getString("SolutionRepository.ACCESS_DENIED", documentPath, Integer.toString(actionOperation))); //$NON-NLS-1$
      return null;
    }

    Document document = null;
    if (file.getData() != null) {
      try {
        document = XmlDom4JHelper.getDocFromString(new String(file.getData()), this.getResourceLoader());
      } catch (Throwable t) {
        error(Messages.getErrorString("SolutionRepository.ERROR_0017_INVALID_XML_DOCUMENT", documentPath), t); //$NON-NLS-1$
        return null;
      }
    } else {
      error(Messages.getErrorString("SolutionRepository.ERROR_0019_NO_DATA_IN_FILE", file.getFileName())); //$NON-NLS-1$
      return null;
    }
    if ((document == null) && (file != null) && (file.getData() != null)) {
      // the document exists but cannot be parsed
      error(Messages.getErrorString("SolutionRepository.ERROR_0009_INVALID_DOCUMENT", documentPath)); //$NON-NLS-1$
      return null;
    }
    localizeDoc(document, file);
    return document;
  }

  public void reloadSolutionRepository(final IPentahoSession localSession, final int localLoggingLevel) {
    this.loggingLevel = localLoggingLevel;
    String path = PentahoSystem.getApplicationContext().getSolutionPath(""); //$NON-NLS-1$
    DbRepositoryClassLoader.clearResourceCache();
    loadSolutionFromFileSystem(localSession, path, true);
  }

  private void loadSolutionPath(final String solutionName, final String path, final int localLoggingLevel) {
    this.loggingLevel = localLoggingLevel;
    if (isCachingAvailable()) {
      String localDirStr = buildDirectoryPath(solutionName, path, null);
      Document repository = DocumentHelper.createDocument();
      Element rootNode = null;
      RepositoryFile directory = (RepositoryFile) getFileByPath(localDirStr);
      if (directory.isRoot()) {
        rootNode = repository.addElement("repository"); //$NON-NLS-1$
        Document indexDoc = getSolutionDocument(directory.getFullPath() + ISolutionRepository.SEPARATOR
            + ISolutionRepository.INDEX_FILENAME, ISolutionRepository.ACTION_EXECUTE);
        if (indexDoc != null) {
          addIndexToRepository(indexDoc, directory, rootNode, path, solutionName);
        }
        processDir(rootNode, directory, solutionName, ISolutionRepository.ACTION_EXECUTE,
            SolutionRepositoryBase.BROWSE_DEPTH);
      } else {
        Element filesNode = repository.addElement("files"); //$NON-NLS-1$
        rootNode = filesNode.addElement("file"); //$NON-NLS-1$
        rootNode.addAttribute("type", FileInfo.FILE_TYPE_FOLDER); //$NON-NLS-1$
        rootNode.addElement("path").setText(path != null ? path : ""); //$NON-NLS-1$//$NON-NLS-2$
        Document indexDoc = getSolutionDocument(directory.getFullPath() + ISolutionRepository.SEPARATOR
            + ISolutionRepository.INDEX_FILENAME, ISolutionRepository.ACTION_EXECUTE);
        if (indexDoc != null) {
          addIndexToRepository(indexDoc, directory, rootNode, path, solutionName);
        }
        processDir(rootNode, directory, solutionName, ISolutionRepository.ACTION_EXECUTE,
            SolutionRepositoryBase.BROWSE_DEPTH);
        filesNode.addElement(SolutionRepositoryBase.LOCATION_ATTR_NAME).setText(
            getPathNames(solutionName, path) + ISolutionRepository.SEPARATOR);
      }
      putRepositoryObjectInCache(localDirStr + getLocale().toString(), repository);
    }
  }

  private String buildDirectoryPath(final String solution, final String path, final String action) {
    String localDirStr = repositoryName;
    if ((solution != null) && (solution.length() > 0)) {
      localDirStr += solution;
      if ((path != null) && (path.length() > 0)) {
        localDirStr += ISolutionRepository.SEPARATOR;
        localDirStr += path;
      }
    }
    if ((action != null) && (action.length() > 0)) {
      String seperator = new String() + ISolutionRepository.SEPARATOR;
      if (!localDirStr.endsWith(seperator)) {
        localDirStr += ISolutionRepository.SEPARATOR;
      }
      localDirStr += action;
    }
    return localDirStr;
  }

  private Document getCachedSolutionDocument(final String solutionName, final String pathName, final int actionOperation) {
    if (actionOperation == ISolutionRepository.ACTION_EXECUTE) {
      String localDirStr = buildDirectoryPath(solutionName, pathName, null);
      Object cachedRepo = this.getRepositoryObjectFromCache(localDirStr + getLocale().toString());
      if (cachedRepo == null) {
        loadSolutionPath(solutionName, pathName, this.loggingLevel);
        cachedRepo = this.getRepositoryObjectFromCache(localDirStr + getLocale().toString());
      }
      return (Document) cachedRepo;
    } else {
      return null;
    }
  }

  /*
   * private void processDir(Element parentNode, RepositoryFile parentDir, String solutionId, int actionOperation) {
   * processDir(parentNode, parentDir, solutionId, actionOperation, true); }
   */
  protected void processDir(final Element parentNode, final RepositoryFile parentDir, final String solutionId,
      final int actionOperation, final int recurseLevels) {
    if (recurseLevels <= 0) {
      return;
    }
    RepositoryFile[] files = parentDir.listRepositoryFiles();
    for (RepositoryFile element : files) {
      if (!element.isDirectory()) {
        String fileName = element.getFileName();
        if (fileName.equals("Entries") || fileName.equals("Repository") || fileName.equals("Root")) { //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
          // ignore any CVS files
          continue;
        }
        if (fileName.toLowerCase().endsWith(".url")) { //$NON-NLS-1$
          if (hasAccess(element, actionOperation)) {
            addUrlToRepository(element, parentNode);
          }
        }
        if (!fileName.toLowerCase().endsWith(".xaction") && !fileName.toLowerCase().endsWith(".xml")) { //$NON-NLS-1$ //$NON-NLS-2$
          // ignore any non-XML files
          continue;
        }
        if (fileName.toLowerCase().equals(ISolutionRepository.INDEX_FILENAME)) {
          // index.xml files are handled in the directory loop below
          continue;
        }
        String path = getSolutionPath(element);
        if (fileName.toLowerCase().endsWith(".xaction")) { //$NON-NLS-1$ 
          // create an action sequence document from this
          info(Messages.getString("SolutionRepository.DEBUG_ADDING_ACTION", fileName)); //$NON-NLS-1$
          IActionSequence actionSequence = getActionSequence(solutionId, path, fileName, loggingLevel, actionOperation);
          if (actionSequence == null) {
            if (((solutionId == null) || (solutionId.length() == 0)) && ((path == null) || (path.length() == 0))) {
              info(Messages.getString("SolutionRepository.INFO_0008_NOT_ADDED", fileName)); //$NON-NLS-1$
            } else {
              error(Messages.getErrorString("SolutionRepository.ERROR_0006_INVALID_SEQUENCE_DOCUMENT", fileName)); //$NON-NLS-1$
            }
          } else {
            addToRepository(actionSequence, parentNode, element);
          }
        }
      }
    }
    for (RepositoryFile element : files) {
      if (element.isDirectory()
          && (!element.getFileName().equalsIgnoreCase("system")) && (!element.getFileName().equalsIgnoreCase("CVS")) && (!element.getFileName().equalsIgnoreCase(".svn"))) { //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
        Element dirNode = parentNode.addElement("file"); //$NON-NLS-1$
        dirNode.addAttribute("type", FileInfo.FILE_TYPE_FOLDER); //$NON-NLS-1$
        contributeAttributes(element, dirNode);
        // TODO read this from the directory index file
        String thisSolution;
        String path = getSolutionPath(element);
        if (solutionId == null) {
          thisSolution = getSolutionId(element);
        } else {
          thisSolution = solutionId;
          dirNode.addElement("path").setText(path); //$NON-NLS-1$
        }
        Document indexDoc = getSolutionDocument(element.getFullPath() + ISolutionRepository.SEPARATOR
            + ISolutionRepository.INDEX_FILENAME, actionOperation);
        if (indexDoc != null) {
          addIndexToRepository(indexDoc, element, dirNode, path, thisSolution);
        } else {
          dirNode.addAttribute("visible", "false"); //$NON-NLS-1$ //$NON-NLS-2$
          String dirName = element.getFileName();
          dirNode.addAttribute("name", XmlHelper.encode(dirName)); //$NON-NLS-1$
          dirNode.addElement("title").setText(dirName); //$NON-NLS-1$
        }
        processDir(dirNode, element, thisSolution, actionOperation, recurseLevels - 1);
      }
    }
  }

  protected String getSolutionId(final RepositoryFile file) {
    String path = file.getFullPath();
    if (path.length() < repositoryName.length()) {
      return ""; //$NON-NLS-1$
    }
    path = path.substring(repositoryName.length()); // Strip off the root
    // directory
    // Strip off the fileName if any
    if (path.indexOf(ISolutionRepository.SEPARATOR) != -1) {
      path = path.substring(0, path.indexOf(ISolutionRepository.SEPARATOR));
    }
    return path;
  }

  protected String getSolutionPath(final RepositoryFile file) {
    String path = file.getFullPath();
    try {
      path = path.substring(repositoryName.length()); // Strip off the
      // root
      // directory
      // Strip off the filename if there is one
      if (!file.isDirectory()) {
        path = path.substring(0, path.lastIndexOf(ISolutionRepository.SEPARATOR));
      }
      // Strip off the solution folder and the following / if any else we
      // know we have a solution folder and return empty String
      if (path.indexOf(ISolutionRepository.SEPARATOR) != -1) {
        path = path.substring(path.indexOf(ISolutionRepository.SEPARATOR) + 1);
      } else {
        return SolutionRepositoryBase.EMPTY_STR;
      }
    } catch (StringIndexOutOfBoundsException ex) {
      return SolutionRepositoryBase.EMPTY_STR;
    }
    return path;
  }

  protected void addIndexToRepository(final Document indexDoc, final RepositoryFile directoryFile,
      final Element directoryNode, String path, final String solution) {
    if (!directoryFile.isDirectory()) {
      return;
    }
    // TODO see if there is a localized attribute file for the current
    // locale
    String dirName = getValue(indexDoc, "/index/name", directoryFile.getFileName().replace('_', ' ')); //$NON-NLS-1$
    String description = getValue(indexDoc, "/index/description", SolutionRepositoryBase.EMPTY_STR); //$NON-NLS-1$
    String iconPath = getValue(indexDoc, "/index/icon", SolutionRepositoryBase.EMPTY_STR); //$NON-NLS-1$
    String displayType = getValue(indexDoc, "/index/display-type", "icons"); //$NON-NLS-1$ //$NON-NLS-2$
    boolean visible = getValue(indexDoc, "/index/visible", "false").equalsIgnoreCase("true"); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$

    path = XmlHelper.encode(path);
    String name = XmlHelper.encode(directoryFile.getFileName());

    // We want to cache the localized document name if we don't already have it
    if (directoryFile.isDirectory() && (getPathNames(solution, path) == null)) {
      cacheLocalizedDirectoryName(dirName, directoryFile, solution, path);
    }
    directoryNode.addAttribute("name", name); //$NON-NLS-1$
    directoryNode.addElement("title").setText(dirName); //$NON-NLS-1$

    directoryNode.addAttribute("path", path); //$NON-NLS-1$
    directoryNode.addElement("description").setText(description); //$NON-NLS-1$
    if ((iconPath != null) && !iconPath.equals("")) { //$NON-NLS-1$
      String rolloverIconPath = null;
      int rolloverIndex = iconPath.indexOf("|"); //$NON-NLS-1$
      if (rolloverIndex > -1) {
        rolloverIconPath = iconPath.substring(rolloverIndex + 1);
        iconPath = iconPath.substring(0, rolloverIndex);
      }
      if (publishIcon(directoryFile.isDirectory() ? directoryFile.getFullPath() : directoryFile.retrieveParent()
          .getFullPath(), iconPath)) {
        directoryNode.addElement("icon").setText("getImage?image=icons/" + iconPath); //$NON-NLS-1$ //$NON-NLS-2$
      } else {
        directoryNode.addElement("icon").setText(iconPath); //$NON-NLS-1$
      }
      if (rolloverIconPath != null) {
        if (publishIcon(directoryFile.isDirectory() ? directoryFile.getFullPath() : directoryFile.retrieveParent()
            .getFullPath(), rolloverIconPath)) {
          directoryNode.addElement("rollovericon").setText("getImage?image=icons/" + rolloverIconPath); //$NON-NLS-1$ //$NON-NLS-2$
        } else {
          directoryNode.addElement("rollovericon").setText(rolloverIconPath); //$NON-NLS-1$
        }
      }
    }
    Boolean visability = null;
    boolean hasAccess = SecurityHelper.hasAccess(directoryFile, ISolutionRepository.ACTION_EXECUTE, getSession());
    if (!hasAccess) {
      visability = new Boolean(false);
    } else {
      visability = new Boolean(visible);
    }
    directoryNode.addAttribute("visible", visability.toString()); //$NON-NLS-1$
    directoryNode.addAttribute("displaytype", displayType); //$NON-NLS-1$
    if ((solution != null) && (solution.length() > 0)) {
      directoryNode.addElement("solution").setText(solution); //$NON-NLS-1$
    } else {
      directoryNode.addElement("solution").setText(getSolutionId(directoryFile)); //$NON-NLS-1$
    }
  }

  private void cacheLocalizedDirectoryName(String localizedPath, final RepositoryFile directoryFile,
      final String solution, final String path) {
    if (directoryFile.isRoot()) { // We're done and have the final localized string in dirName
      putRepositoryObjectInCache(DbBasedSolutionRepository.BREAD_CRUMBS_TAG + buildDirectoryPath(solution, path, null),
          localizedPath);
    } else { // We've got to process the name of the parent
      String localizedAncestors = (String) getRepositoryObjectFromCache(DbBasedSolutionRepository.BREAD_CRUMBS_TAG
          + directoryFile.retrieveParent().getFullPath());
      if (localizedAncestors != null) { // The parents stuff was already cached
        localizedPath = localizedAncestors + ISolutionRepository.SEPARATOR + localizedPath;
        putRepositoryObjectInCache(DbBasedSolutionRepository.BREAD_CRUMBS_TAG
            + buildDirectoryPath(solution, path, null), localizedPath);
      } else { // Now we've got to check to see if the parent has an index.xml
        Document indexDoc = getSolutionDocument(directoryFile.retrieveParent().getFullPath() + ISolutionRepository.SEPARATOR
            + ISolutionRepository.INDEX_FILENAME, ISolutionRepository.ACTION_EXECUTE);
        if (indexDoc == null) {
          localizedPath = directoryFile.retrieveParent().getFileName() + ISolutionRepository.SEPARATOR + localizedPath;
        } else {
          localizedPath = getValue(indexDoc,
              "/index/name", directoryFile.retrieveParent().getFileName().replace('_', ' ')) + ISolutionRepository.SEPARATOR + localizedPath; //$NON-NLS-1$
        }
        cacheLocalizedDirectoryName(localizedPath, (RepositoryFile) directoryFile.retrieveParent(), solution, path);
      }
    }
  }

  protected void addUrlToRepository(final RepositoryFile file, final Element parentNode) {
    String urlContent = new String(file.getData());
    StringTokenizer tokenizer = new StringTokenizer(urlContent, "\n"); //$NON-NLS-1$
    String url = null;
    String title = file.getFileName();
    String description = null;
    String iconPath = null;
    String target = null;
    while (tokenizer.hasMoreTokens()) {
      String line = tokenizer.nextToken();
      int pos = line.indexOf('=');
      if (pos > 0) {
        String name = line.substring(0, pos);
        String value = line.substring(pos + 1);
        if ((value != null) && (value.length() > 0) && (value.charAt(value.length() - 1) == '\r')) {
          value = value.substring(0, value.length() - 1);
        }
        if ("URL".equalsIgnoreCase(name)) { //$NON-NLS-1$
          url = value;
        }
        if ("name".equalsIgnoreCase(name)) { //$NON-NLS-1$
          title = value;
        }
        if ("description".equalsIgnoreCase(name)) { //$NON-NLS-1$
          description = value;
        }
        if ("icon".equalsIgnoreCase(name)) { //$NON-NLS-1$
          iconPath = value;
        }
        if ("target".equalsIgnoreCase(name)) { //$NON-NLS-1$
          target = value;
        }
      }
    }
    if (url != null) {
      // now create an entry for the database
      Element dirNode = parentNode.addElement("file"); //$NON-NLS-1$
      dirNode.addAttribute("type", FileInfo.FILE_TYPE_URL); //$NON-NLS-1$
      dirNode.addElement("filename").setText(file.getFileName()); //$NON-NLS-1$
      dirNode.addElement("title").setText(title); //$NON-NLS-1$
      if (target != null) {
        dirNode.addElement("target").setText(target); //$NON-NLS-1$
      }
      if (description != null) {
        dirNode.addElement("description").setText(description); //$NON-NLS-1$
      }
      if ((iconPath != null) && !iconPath.equals("")) { //$NON-NLS-1$
        String rolloverIconPath = null;
        int rolloverIndex = iconPath.indexOf("|"); //$NON-NLS-1$
        if (rolloverIndex > -1) {
          rolloverIconPath = iconPath.substring(rolloverIndex + 1);
          iconPath = iconPath.substring(0, rolloverIndex);
        }
        if (publishIcon(file.retrieveParent().getFullPath(), iconPath)) {
          dirNode.addElement("icon").setText("getImage?image=icons/" + iconPath); //$NON-NLS-1$ //$NON-NLS-2$
        } else {
          dirNode.addElement("icon").setText(iconPath); //$NON-NLS-1$
        }
        if (rolloverIconPath != null) {
          if (publishIcon(file.retrieveParent().getFullPath(), rolloverIconPath)) {
            dirNode.addElement("rollovericon").setText("getImage?image=icons/" + rolloverIconPath); //$NON-NLS-1$ //$NON-NLS-2$
          } else {
            dirNode.addElement("rollovericon").setText(rolloverIconPath); //$NON-NLS-1$
          }
        }
      }
      dirNode.addElement("url").setText(url); //$NON-NLS-1$
      dirNode.addAttribute("visible", "true"); //$NON-NLS-1$ //$NON-NLS-2$
      dirNode.addAttribute("displaytype", FileInfo.FILE_DISPLAY_TYPE_URL); //$NON-NLS-1$
      localizeDoc(dirNode, file);
    }
  }

  protected void addToRepository(final IActionSequence actionSequence, final Element parentNode, final RepositoryFile file) {
    Element dirNode = parentNode.addElement("file"); //$NON-NLS-1$
    dirNode.addAttribute("type", FileInfo.FILE_TYPE_ACTIVITY); //$NON-NLS-1$
    contributeAttributes(file, dirNode);
    if ((actionSequence.getSequenceName() == null) || (actionSequence.getSolutionPath() == null)
        || (actionSequence.getSolutionName() == null)) {
      error(Messages.getString("SolutionRepository.ERROR_0008_ACTION_SEQUENCE_NAME_INVALID")); //$NON-NLS-1$
      return;
    }
    dirNode.addElement("filename").setText(actionSequence.getSequenceName()); //$NON-NLS-1$
    dirNode.addElement("path").setText(actionSequence.getSolutionPath()); //$NON-NLS-1$
    dirNode.addElement("solution").setText(actionSequence.getSolutionName()); //$NON-NLS-1$
    String title = actionSequence.getTitle();
    if (title == null) {
      dirNode.addElement("title").setText(actionSequence.getSequenceName()); //$NON-NLS-1$
    } else {
      dirNode.addElement("title").setText(title); //$NON-NLS-1$
    }
    String description = actionSequence.getDescription();
    if (description == null) {
      dirNode.addElement("description"); //$NON-NLS-1$
    } else {
      dirNode.addElement("description").setText(description); //$NON-NLS-1$
    }
    String author = actionSequence.getAuthor();
    if (author == null) {
      dirNode.addElement("author"); //$NON-NLS-1$
    } else {
      dirNode.addElement("author").setText(author); //$NON-NLS-1$
    }
    String iconPath = actionSequence.getIcon();
    if ((iconPath != null) && !iconPath.equals("")) { //$NON-NLS-1$
      String rolloverIconPath = null;
      int rolloverIndex = iconPath.indexOf("|"); //$NON-NLS-1$
      if (rolloverIndex > -1) {
        rolloverIconPath = iconPath.substring(rolloverIndex + 1);
        iconPath = iconPath.substring(0, rolloverIndex);
      }
      if (publishIcon(file.retrieveParent().getFullPath(), iconPath)) {
        dirNode.addElement("icon").setText("getImage?image=icons/" + iconPath); //$NON-NLS-1$ //$NON-NLS-2$
      } else {
        dirNode.addElement("icon").setText(actionSequence.getIcon()); //$NON-NLS-1$
      }
      if (rolloverIconPath != null) {
        if (publishIcon(file.retrieveParent().getFullPath(), rolloverIconPath)) {
          dirNode.addElement("rollovericon").setText("getImage?image=icons/" + rolloverIconPath); //$NON-NLS-1$ //$NON-NLS-2$
        } else {
          dirNode.addElement("rollovericon").setText(rolloverIconPath); //$NON-NLS-1$
        }
      }
    }
    String displayType = actionSequence.getResultType();
    if ((displayType == null) || ("none".equalsIgnoreCase(displayType))) { //$NON-NLS-1$
      // this should be hidden from users
      dirNode.addAttribute("visible", "false"); //$NON-NLS-1$ //$NON-NLS-2$
    } else {
      dirNode.addAttribute("visible", "true"); //$NON-NLS-1$ //$NON-NLS-2$
      dirNode.addAttribute("displaytype", displayType); //$NON-NLS-1$
    }
    ISubscriptionRepository subscriptionRepository = PentahoSystem.getSubscriptionRepository(this.getSession());
    boolean subscribable = subscriptionRepository.getContentByActionReference(actionSequence.getSolutionName() + '/'
        + actionSequence.getSolutionPath() + '/' + actionSequence.getSequenceName()) != null;
    dirNode.addElement("properties").setText("subscribable=" + Boolean.toString(subscribable)); //$NON-NLS-1$ //$NON-NLS-2$
  }

  protected boolean publishIcon(final String dirPath, String iconPath) {
    String pathSeperator = new StringBuffer().append(ISolutionRepository.SEPARATOR).toString();
    if (!iconPath.startsWith(pathSeperator)) {
      iconPath = pathSeperator + iconPath;
    }
    String iconRepositoryPath = dirPath + iconPath;
    RepositoryFile iconSource = (RepositoryFile) getFileByPath(iconRepositoryPath);
    if (iconSource != null) {
      File tmpDir = getFile("system/tmp/icons", true); //$NON-NLS-1$
      tmpDir.mkdirs();
      File iconDestintation = new File(tmpDir.getAbsoluteFile() + File.separator + iconPath);
      if (iconDestintation.exists()) {
        iconDestintation.delete();
      }
      try {
        FileOutputStream outputStream = new FileOutputStream(iconDestintation);
        outputStream.write(iconSource.getData());
        outputStream.flush();
        outputStream.close();
      } catch (FileNotFoundException e) {
        // this one is not very likey
      } catch (IOException e) {
      }
      return true;
    } else {
      return false;
    }
  }

  public Document getSolutions(final String solutionName, final String pathName, final int actionOperation,
      final boolean visibleOnly) {
    return getCachedSolutionDocument(solutionName, pathName, actionOperation);
  }

  private String getPathNames(final String solution, final String path) {
    String key = DbBasedSolutionRepository.BREAD_CRUMBS_TAG + buildDirectoryPath(solution, path, null);
    return (String) getRepositoryObjectFromCache(key);
  }

  // TODO sbarkdull, refactor, this should either be private, or should be in the XmlHelper class (prefer 2nd)
  // maybe rename getNodeTextOrDefault
  public String getValue(final Document doc, final String xPath, final String defaultValue) {
    if (doc != null) {
      Node node = doc.selectSingleNode(xPath);
      if (node == null) {
        return defaultValue;
      }
      return node.getText();
    }
    return defaultValue;
  }

  public Document getSolutionTree(final int actionOperation) {
    return getSolutionTree(actionOperation, this);
  }

  public Document getSolutionTree(final int actionOperation, final ISolutionFilter filter) {
    Document document = DocumentHelper.createDocument();
    getRootFolder();
    if (!hasAccess(rootDirectory, actionOperation)) {
      if (SolutionRepositoryBase.logger.isDebugEnabled()) {
        SolutionRepositoryBase.logger.debug(Messages.getString(
            "SolutionRepository.ACCESS_DENIED", rootDirectory.getFullPath(), Integer.toString(actionOperation))); //$NON-NLS-1$
      }
      return document; // Empty Document
    }
    Element root = document.addElement("tree"); //$NON-NLS-1$
    SolutionReposHelper.processSolutionTree(root, rootDirectory, filter, actionOperation);
    return document;
  }

  public Document getSolutionStructure(final int actionOperation) {
    Document document = DocumentHelper.createDocument();
    getRootFolder();
    Element root = document.addElement(SolutionRepositoryBase.ROOT_NODE_NAME).addAttribute(
        SolutionRepositoryBase.LOCATION_ATTR_NAME, rootDirectory.getFullPath());
    SolutionReposHelper.processSolutionStructure(root, rootDirectory, this, actionOperation);
    return document;
  }

  public boolean synchronizeSolutionWithSolutionSource(final IPentahoSession pSession) {
    synchronized(lock) {
      try {
        RepositoryFile solution = (RepositoryFile) getRootFolder();
        if (solution != null) {
          HibernateUtil.beginTransaction();
          HibernateUtil.makeTransient(solution);
          HibernateUtil.commitTransaction();
          HibernateUtil.flushSession();
        }
        this.loadSolutionFromFileSystem(pSession, PentahoSystem.getApplicationContext().getSolutionPath(""), true); //$NON-NLS-1$
        return true;
      } catch (Exception ex) {
        SolutionRepositoryBase.logger.error(ex);
      }
      return false;
    }
  }

  public boolean solutionSynchronizationSupported() {
    return true;
  }

  public String resetSolutionFromFileSystem(final IPentahoSession pSession) {
    if (synchronizeSolutionWithSolutionSource(pSession)) {
      return Messages.getString("SolutionRepository.INFO_0009_RESET_SUCCESS"); //$NON-NLS-1$
    } else {
      return Messages.getString("SolutionRepository.ERROR_0013_RESET_FAILED", "Error"); //$NON-NLS-1$ //$NON-NLS-2$
    }
  }

  /** *************************** New Update DB Repository Classes and Methods ******************************* */
  /**
   * This method loads solution files and folders from the file system into the RDBMS repository.
   * 
   * @param pSession
   *          Users' Session
   * @param solutionRoot
   *          The file system root folder
   * @param deleteOrphans
   *          Whether to delete stranded references from RDBMS repository
   * @return List of orphans that were deleted - returns list of deleted solution files.
   * @throws RepositoryException
   * @author mbatchel
   */
  public List loadSolutionFromFileSystem(final IPentahoSession pSession, final String solutionRoot,
      final boolean deleteOrphans) throws RepositoryException {
    synchronized(lock) {
      SolutionRepositoryBase.logger.info(Messages.getString("SolutionRepository.INFO_0001_BEGIN_LOAD_DB_REPOSITORY")); //$NON-NLS-1$
      HibernateUtil.beginTransaction();
      File solutionFile = new File(solutionRoot);
      RepositoryFile solution = null;
      try {
        if (solutionFile.isDirectory()) {
          Map reposFileStructure = this.getAllRepositoryModDates();
          /*
           * The fromBase and toBase are, for example: From Base: D:\japps\pentaho\my-solutions\solutions To Base:
           * /solutions
           */
          String fromBase = solutionFile.getAbsolutePath();
          String toBase = (solutionFile.getName().charAt(0) == '/') ? solutionFile.getName()
              : "/" + solutionFile.getName(); //$NON-NLS-1$
          RepositoryUpdateHelper updateHelper = new RepositoryUpdateHelper(fromBase, toBase, reposFileStructure, this);
          //
          // Check to see if we're just doing a refresh...
          //
          InfoHolder checkBase = (InfoHolder) reposFileStructure.get(toBase);
          if (checkBase != null) {
            // It's there - we're refreshing
            checkBase.touched = true;
            // Get the solution object from Hibernate
            solution = (RepositoryFile) getFileByPath(null); // Hibernate Query
            updateHelper.createdOrRetrievedFolders.put(toBase, solution); // Store for later reference
          } else {
            solution = new RepositoryFile(solutionFile.getName(), null, null, solutionFile.lastModified()); // Create
            // entry
            // Put the created folder into the created map for later use
            updateHelper.createdOrRetrievedFolders.put(toBase, solution); // Store for later reference
            SolutionRepositoryBase.logger.info(Messages.getString(
                "SolutionRepository.INFO_0002_UPDATED_FOLDER", solution.getFullPath())); //$NON-NLS-1$
          }
          repositoryName = solution.getFullPath() + ISolutionRepository.SEPARATOR;
          // Find and record changes and updates
          recurseCheckUpdatedFiles(updateHelper, solutionFile);
          //
          // The following lines are order dependent
          //
          // Handle updated Files and Folders
          updateHelper.processUpdates();
          // Handle added folders and files
          updateHelper.processAdditions();
          // Save solution state
          HibernateUtil.makePersistent(solution);
          // Process deletions
          List deletions = updateHelper.processDeletions(deleteOrphans);
          // Publish ACLs
          IAclPublisher aclPublisher = PentahoSystem.getAclPublisher(pSession);
          if (aclPublisher != null) {
            aclPublisher.publishDefaultAcls(solution);
          }
          // Tell Hibernate we're ready for a commit - we're done now
          HibernateUtil.commitTransaction();
          HibernateUtil.flushSession();
          // The next two lines were from the old code
          resetRepository(); // Clear the cache of old stuff
          SolutionRepositoryBase.logger.info(Messages.getString("SolutionRepository.INFO_0003_END_LOAD_DB_REPOSITORY")); //$NON-NLS-1$
          return deletions;
        } else {
          throw new RepositoryException(Messages.getString(
              "SolutionRepository.ERROR_0012_INVALID_SOLUTION_ROOT", solutionRoot)); //$NON-NLS-1$
        }
      } catch (HibernateException hibernateException) {
        // re-throw exception so that it abandons the process
        try {
          HibernateUtil.rollbackTransaction();
        } catch (HibernateException ignored) {
          SolutionRepositoryBase.logger.error("SolutionRepository.ERROR_0011_TRANSACTION_FAILED", ignored); //$NON-NLS-1$
        }
        throw new RepositoryException(hibernateException);
      } catch (IOException ex) {
        // re-throw exception so that it abandons the process
        throw new RepositoryException(ex);
      }
    }
  }

  /**
   * This method builds up lists of the files modified (based on date/time), new folders, and new files.
   * 
   * @param reposFileStructure
   *          Map of what's currently in the DB repository
   * @param solutionFile
   *          The folder to begin working through
   * @param updatedFiles
   *          List of files updated
   * @param newFolders
   *          List of new folders
   * @param newFiles
   *          List of new files
   * @throws IOException
   * @author mbatchel
   */
  private void recurseCheckUpdatedFiles(final RepositoryUpdateHelper updateHelper, final File solutionFile)
      throws IOException {
    File[] files = solutionFile.listFiles();
    for (File aFile : files) {
      if (aFile.isDirectory()) {
        String directoryName = aFile.getName();
        if (!SolutionReposHelper.ignoreDirectory(directoryName)) {
          updateHelper.recordFolder(aFile);
          recurseCheckUpdatedFiles(updateHelper, aFile);
        }
      } else {
        if (!SolutionReposHelper.ignoreFile(aFile.getName())) {
          updateHelper.recordFile(aFile);
        }
      }
    } // End For
  }

  /**
   * This runs a Hibernate query to get just paths and modified times from the repository.
   * 
   * @return Map [path => InfoHolder(LastModifiedDate)
   * @author mbatchel
   */
  private Map getAllRepositoryModDates() {
    Session hibSession = HibernateUtil.getSession();
    String nameQuery = "org.pentaho.platform.repository.solution.dbbased.RepositoryFile.filesWithModDates"; //$NON-NLS-1$
    Query qry = hibSession.getNamedQuery(nameQuery).setCacheable(true);
    List rtn = qry.list();
    HashMap modMap = new HashMap();
    for (int i = 0; i < rtn.size(); i++) {
      Object[] aResult = (Object[]) rtn.get(i);
      modMap.put(aResult[0], new InfoHolder(aResult[1], aResult[2]));
    }
    return modMap;
  }

  private RepositoryFile findRootRepositoryByName(final String rootRepositoryName) {
    Session hibSession = HibernateUtil.getSession();
    String nameQuery = "org.pentaho.platform.repository.solution.dbbased.RepositoryFile.findNamedRootSolutionFolders"; //$NON-NLS-1$
    Query qry = hibSession.getNamedQuery(nameQuery).setCacheable(true);
    qry.setString("fileName", rootRepositoryName); //$NON-NLS-1$
    RepositoryFile rtn = null;
    try {
      rtn = (RepositoryFile) qry.uniqueResult();
    } catch (HibernateException ex) {
      logger.error(Messages.getString("SolutionRepository.ERROR_0022_HIBERNATE_EXCEPTION", rootRepositoryName), ex);
      throw ex;
    }
    return rtn;
  }

  @Override
  public ISolutionFile getRootFolder() {
    synchronized (lock) {
      if (repositoryName != null) {
        rootDirectory = findRootRepositoryByName(getRepositoryName());
        if (null == rootDirectory) {
          warn(Messages.getString("SolutionRepository.WARN_0003_REPOSITORY_NOT_FOUND_BY_NAME", getRepositoryName())); //$NON-NLS-1$            
        }
      } else {
        Session hibSession = HibernateUtil.getSession();
        String nameQuery = "org.pentaho.platform.repository.solution.dbbased.RepositoryFile.findAllRootSolutionFolders"; //$NON-NLS-1$
        Query qry = hibSession.getNamedQuery(nameQuery).setCacheable(true);
        RepositoryFile rtn = null;
        try {
          rtn = (RepositoryFile) qry.uniqueResult();
        } catch (HibernateException ex) {
          logger.error(Messages.getString("SolutionRepository.ERROR_0022_HIBERNATE_EXCEPTION", rootDirectory.getFullPath()), ex);
          throw ex;
        }
        if (rtn == null) {
          return null;
        }

        repositoryName = rtn.getFullPath() + ISolutionRepository.SEPARATOR;
        rootDirectory = rtn;
      }
    }
    return rootDirectory;
  }

  public RepositoryFile getSolutionById(final String anId) {
    Session hibSession = HibernateUtil.getSession();
    RepositoryFile rtn = (RepositoryFile) hibSession.load(RepositoryFile.class, anId);
    return rtn;
  }

  public List getChildrenFilesByParentId(final String parentId) {
    Session hibSession = HibernateUtil.getSession();
    String parentIdQuery = "org.pentaho.platform.repository.solution.dbbased.RepositoryFile.findChildrenFilesByParentId"; //$NON-NLS-1$
    Query qry = hibSession.getNamedQuery(parentIdQuery).setString("parentId", parentId).setCacheable(true); //$NON-NLS-1$
    return qry.list();
  }

  /**
   * Check <param>systemPath</param> to see if it has the repository name,
   * followed by "system", followed by anything else. If it matches,
   * remove the repository name from the front of the path, and return the
   * path. If not, simply return <param>systemPath</param>
   * 
   * @param systemPath String containing a path.
   * @return String <param>systemPath</param> with the repository name removed 
   * from the path
   */
  private String removeRepositoryNameFromSystemPath(String systemPath) {
    if (systemPath != null) {
      Pattern p = Pattern.compile("[/\\\\]" + getRepositoryName() + "([/\\\\]system[/\\\\].*)"); //$NON-NLS-1$//$NON-NLS-2$
      Matcher m = p.matcher(systemPath);
      if (m.matches()) {
        systemPath = m.group(1);
      }
    }
    return systemPath;
  }

  @Override
  public ISolutionFile getFileByPath(String path) {

    path = removeRepositoryNameFromSystemPath(path);
    if (path == null) {
      return getRootFolder();
    } else if (SolutionRepositoryBase.isSystemPath(path)) {
      return super.getFileByPath(path);
    } else {
      String fullPath = path.replace('\\', ISolutionRepository.SEPARATOR); // use our file seperator
      if ((repositoryName != null) && !fullPath.startsWith(repositoryName)) {
        if (fullPath.startsWith("/") || fullPath.startsWith("\\")) { //$NON-NLS-1$ //$NON-NLS-2$
          fullPath = repositoryName + fullPath.substring(1); // Strip off leading slash
        } else {
          fullPath = repositoryName + fullPath;
        }
      }
      // TODO sbarkdull, this line should probably be removed, we shouldnt be cleaning up the path for the caller, the caller should be passing us a correct path string
      fullPath = fullPath.replaceAll("//", "/"); //$NON-NLS-1$ //$NON-NLS-2$ // Make sure no double-slashes exist
      if (fullPath.endsWith("/")) { //$NON-NLS-1$
        fullPath = fullPath.substring(0, fullPath.length() - 1);
      }
      Session hibernateSession = HibernateUtil.getSession();
      String nameQuery = "org.pentaho.platform.repository.solution.dbbased.RepositoryFile.findFileByPath"; //$NON-NLS-1$
      Query qry = hibernateSession.getNamedQuery(nameQuery).setCacheable(true).setString("fullPath", fullPath); //$NON-NLS-1$
      if (qry.list().size() > 0) {
        RepositoryFile rtn = null;
        try {
          rtn = (RepositoryFile) qry.uniqueResult();
        } catch (HibernateException ex) {
          logger.error(Messages.getString("SolutionRepository.ERROR_0022_HIBERNATE_EXCEPTION", path), ex);
          throw ex;
        }
        return rtn;
      } else {
        return super.getFileByPath(path);
      }
    }
  }

  public ClassLoader getClassLoader(final String path) {
    return new DbRepositoryClassLoader(path, this);
  }

  // --------------------------------------------------------------------
  public boolean resourceExists(final String solutionPath) {
    return getFileByPath(solutionPath) != null;
  }

  public long resourceSize(final String solutionPath) {
    RepositoryFile file = (RepositoryFile) getFileByPath(solutionPath);
    if (file == null) {
      return 0;
    }
    return file.getData().length;
  }

  @Override
  public boolean removeSolutionFile(final String solutionPath) {
    synchronized(lock) {
      // remove file based files
      super.removeSolutionFile(solutionPath);
      // Build the path
      String fullPath = repositoryName;
      String sepStr = Character.toString(ISolutionRepository.SEPARATOR);
      if ((solutionPath != null) && (solutionPath.length() > 0)) {
        if (fullPath.endsWith(sepStr) && solutionPath.startsWith(sepStr)) {
          fullPath += solutionPath.substring(1);
        } else if (!fullPath.endsWith(sepStr) && !solutionPath.startsWith(sepStr)) {
          fullPath += sepStr + solutionPath.substring(1);
        } else {
          fullPath += solutionPath;
        }
      } else {
        if (fullPath.endsWith(sepStr)) {
          fullPath = fullPath.substring(0, fullPath.length() - 1); // take off the path separator character
        }
      }
      RepositoryFile file = (RepositoryFile) getFileByPath(fullPath);
      if (file == null) {
        return false;
      }
      RepositoryFile parent = (RepositoryFile) file.retrieveParent();
      if (parent != null) { // this take care of the case of deleting the
        // repository completely
        parent.removeChildFile(file);
      }
      Session hibSession = HibernateUtil.getSession();
      Transaction trans = hibSession.beginTransaction();
      hibSession.delete(file);
      trans.commit();
      resetRepository();
      return true;
    }
  }

  @Override
  public boolean removeSolutionFile(final String solution, final String path, final String fileName) {
    String solutionPath = ""; //$NON-NLS-1$
    if ((solution != null) && (solution.length() > 0)) {
      solutionPath += solution;
    }
    if ((path != null) && (path.length() > 0)) {
      solutionPath += ISolutionRepository.SEPARATOR + path;
    }
    if ((fileName != null) && (fileName.length() > 0)) {
      solutionPath += ISolutionRepository.SEPARATOR + fileName;
    }
    return removeSolutionFile(solutionPath);
  }

  public boolean deleteRepository(final String repositoryNameToDelete) {
    String oldName = getRepositoryName();
    setRepositoryName(repositoryNameToDelete);
    boolean result = removeSolutionFile("", "", ""); //$NON-NLS-1$ //$NON-NLS-2$//$NON-NLS-3$
    setRepositoryName(oldName);
    return result;
  }

  /**
   * @return Returns the repositoryName.
   */
  public String getRepositoryName() {
    return repositoryName == null ? repositoryName : repositoryName.substring(1, repositoryName.length() - 1);
  }

  /**
   * @param repositoryName
   *          The repositoryName to set.
   */
  public void setRepositoryName(final String value) {
    if (value == null) {
      repositoryName = null;
      return;
    }
    String repoName = value;
    String pathSep = new StringBuffer().append(ISolutionRepository.SEPARATOR).toString();
    if (!repoName.startsWith(pathSep)) {
      repoName = pathSep + repoName;
    }
    if (!repoName.endsWith(pathSep)) {
      repoName += pathSep;
    }
    this.repositoryName = repositoryName != null ? repositoryName : repoName;
  }

  public boolean keepFile(final ISolutionFile solutionFile, final int actionOperation) {
    if (solutionFile instanceof IAclHolder) {
      return hasAccess(solutionFile, actionOperation);
    } else {
      return true;
    }
  }

  public void contributeAttributes(final ISolutionFile solutionFile, final Element childNode) {
    if (solutionFile instanceof IAclHolder) {
      IPentahoSession sess = getSession();
      IAclVoter voter = PentahoSystem.getAclVoter(sess);
      IPentahoAclEntry access = voter.getEffectiveAcl(sess, (IAclHolder) solutionFile);
      if (access != null) {
        setXMLPermissionAttributes(access, childNode);
      }
    }
  }

  /**
   * Add security related attributes to <param>node</param>. The attributes are:
   * aclAdministration
   * aclExecute
   * aclSubscribe
   * aclModifyAcl
   * Their values will be "true" or "false", depending on the corresponding property
   * in the <param>entry</param> parameter.
   * 
   * @param entry PentahoAclEntry
   * @param node Element
   */
  private void setXMLPermissionAttributes(final IPentahoAclEntry entry, final Element node) {
    node.addAttribute("aclAdministration", //$NON-NLS-1$
        Boolean.toString(entry.isPermitted(IPentahoAclEntry.PERM_ADMINISTRATION)));

    node.addAttribute("aclExecute", //$NON-NLS-1$
        Boolean.toString(entry.isPermitted(IPentahoAclEntry.PERM_EXECUTE)));

    node.addAttribute("aclSubscribe", //$NON-NLS-1$
        Boolean.toString(entry.isPermitted(IPentahoAclEntry.PERM_SUBSCRIBE)));

    node.addAttribute("aclModifyAcl", //$NON-NLS-1$
        Boolean.toString(entry.isPermitted(IPentahoAclEntry.PERM_UPDATE_PERMS)
            || SecurityHelper.isPentahoAdministrator(getSession())));

  }

  public void exitPoint() {
    try {
      HibernateUtil.commitTransaction();
      HibernateUtil.flushSession();
    } catch (Throwable t) {
      t.printStackTrace();
    }
    try {
      HibernateUtil.closeSession();
    } catch (Throwable t) {
      t.printStackTrace();
    }
  }

  @Override
  public int addSolutionFile(final String baseUrl, String path, final String fileName, final byte[] data,
      boolean overwrite) {
    synchronized(lock) {
      // TODO mlowery Allow this method for Pentaho administrators only. Use a RunAsManager when calling this method 
      // from within this class.  That way you prevent external callers from directly calling this method.
  
      // baseUrl is ignored
      // We handle publish to the system folder differently since it's not in the DB.
      while ((path != null) && (path.endsWith("/") || path.endsWith("\\"))) { //$NON-NLS-1$ //$NON-NLS-2$
        path = path.substring(0, path.length() - 1);
      }
      
      // do not allow publishing to root path
      if (StringUtil.isEmpty(path)) {
        logger.error(Messages.getErrorString("SolutionRepository.ERROR_0023_INVALID_PUBLISH_LOCATION_ROOT")); //$NON-NLS-1$
        return ISolutionRepository.FILE_ADD_FAILED;
      }
      
      // allow any user to add to system/tmp (e.g. during new analysis view) 
      if ((SolutionRepositoryBase.isSystemPath(path) && isPentahoAdministrator() || SolutionRepositoryBase.isSystemTmpPath(path))) {
        // add file using file based technique to send it to disk
        return super.addSolutionFile(baseUrl, path, fileName, data, overwrite);
      }
      RepositoryFile parent = (RepositoryFile) getFileByPath(path);
      RepositoryFile reposFile = (RepositoryFile) getFileByPath(path + ISolutionRepository.SEPARATOR + fileName);
      HibernateUtil.beginTransaction();
      if (reposFile == null) {
        if ((parent == null) || !parent.isDirectory()
            || (!hasAccess(parent, ISolutionRepository.ACTION_CREATE) && !isPentahoAdministrator())) {
          HibernateUtil.commitTransaction();
          HibernateUtil.flushSession();
          return ISolutionRepository.FILE_ADD_FAILED;
        }
        try {
          reposFile = new RepositoryFile(fileName, parent, data);
          HibernateUtil.commitTransaction();
          HibernateUtil.flushSession();
          resetRepository();
          super.addSolutionFile(baseUrl, path, fileName, data, overwrite);
          return ISolutionRepository.FILE_ADD_SUCCESSFUL;
        } catch (Exception e) {
          SolutionRepositoryBase.logger.error(e);
          return ISolutionRepository.FILE_ADD_FAILED;
        }
      }
      if (!overwrite) {
        HibernateUtil.commitTransaction();
        HibernateUtil.flushSession();
        return ISolutionRepository.FILE_EXISTS;
      }
      if (hasAccess(reposFile, ISolutionRepository.ACTION_UPDATE) || isPentahoAdministrator()) {
        reposFile.setData(data);
        super.addSolutionFile(baseUrl, path, fileName, data, overwrite);
        resetRepository();
      } else {
        HibernateUtil.commitTransaction();
        HibernateUtil.flushSession();
        return ISolutionRepository.FILE_ADD_FAILED;
      }
      try {
        HibernateUtil.commitTransaction();
        HibernateUtil.flushSession();
        return ISolutionRepository.FILE_ADD_SUCCESSFUL;
      } catch (Exception e) {
        SolutionRepositoryBase.logger.error(e);
        return ISolutionRepository.FILE_ADD_FAILED;
      }
    }
  }

  @Override
  public int addSolutionFile(final String baseUrl, final String path, final String fileName, final File f,
      final boolean overwrite) {
    // TODO mlowery Allow this method for Pentaho administrators only. Use a RunAsManager when calling this method 
    // from within this class.  That way you prevent external callers from directly calling this method.

    // baseUrl is ignored
    byte[] bytes;
    try {
      bytes = FileHelper.getBytesFromFile(f);
    } catch (IOException e) {
      error(Messages.getErrorString("SolutionRepository.ERROR_0014_COULD_NOT_SAVE_FILE", fileName), e); //$NON-NLS-1$
      return ISolutionRepository.FILE_ADD_FAILED;
    }
    return addSolutionFile(baseUrl, path, fileName, bytes, overwrite);
  }

  public String[] getAllActionSequences() {
    Session hibSession = HibernateUtil.getSession();
    String nameQuery = "org.pentaho.platform.repository.solution.dbbased.RepositoryFile.findAllActionSequences"; //$NON-NLS-1$
    Query qry = hibSession.getNamedQuery(nameQuery).setCacheable(true);
    List rtn = qry.list();
    String[] value = new String[rtn.size()];
    Iterator iter = rtn.iterator();
    int i = 0;
    while (iter.hasNext()) {
      RepositoryFile file = (RepositoryFile) iter.next();
      String path = file.getFullPath();
      path = path.substring(repositoryName.length());
      value[i++] = path;
    }
    return value;
  }

  public long getSolutionFileLastModified(final String path) {
    RepositoryFile file = (RepositoryFile) getFileByPath(path);
    long mod = -1;
    if (file != null) {
      mod = file.getLastModified();
    }
    return mod;
  }

  public boolean supportsAccessControls() {
    return true;
  }

  /**
   * TODO mlowery This mapping needs to go away. An AclEntry type should exist per application. AclEntry types should
   * not be re-used over more than one app!  In other words, get rid of the mapping!
   * 
   * This mapping is currently hard-coded in ISolutionRepository constant initialization.
   */
  protected IPermissionMask mapOperationToPermissionMask(final int actionOperation) {
    int aclMask = actionOperation;
    //    switch (actionOperation) {
    //      
    //      case ISolutionRepository.ACTION_EXECUTE: {
    //        aclMask = PentahoAclEntry.PERM_EXECUTE;
    //        break;
    //      }
    //      case ISolutionRepository.ACTION_ADMIN: {
    //        aclMask = PentahoAclEntry.PERM_ADMINISTRATION;
    //        break;
    //      }
    //      case ISolutionRepository.ACTION_SUBSCRIBE: {
    //        aclMask = PentahoAclEntry.PERM_SUBSCRIBE;
    //        break;
    //      }
    //      case ISolutionRepository.ACTION_CREATE: {
    //        aclMask = PentahoAclEntry.PERM_CREATE;
    //        break;
    //      }
    //      case ISolutionRepository.ACTION_UPDATE: {
    //        aclMask = PentahoAclEntry.PERM_UPDATE;
    //        break;
    //      }
    //      case ISolutionRepository.ACTION_DELETE: {
    //        aclMask = PentahoAclEntry.PERM_DELETE;
    //        break;
    //      }
    //      case ISolutionRepository.ACTION_SHARE: {
    //        aclMask = PentahoAclEntry.PERM_UPDATE_PERMS;
    //        break;
    //      }
    //      default: {
    //        // give no permission if incoming actionOperation is unknown
    //        aclMask = PentahoAclEntry.PERM_NOTHING;
    //        break;
    //      }
    //    }
    return new SimplePermissionMask(aclMask);
  }

  public int publish(final String baseUrl, final String path, final String fileName, final byte[] data,
      final boolean overwrite) throws PentahoAccessControlException {
    // TODO mlowery This should be wrapped in a transaction to ensure both steps (add file and set perm on file) happen
    // together.
    // TODO mlowery delegate to other publish version or vice versa
    String fullPath = path + ISolutionRepository.SEPARATOR + fileName;
    boolean alreadyExists = resourceExists(fullPath);
    int res = addSolutionFile(baseUrl, path, fileName, data, overwrite);
    if ((res == ISolutionRepository.FILE_ADD_SUCCESSFUL) && !alreadyExists) {
      // get the file
      ISolutionFile justPublishedFile = getFileByPath(fullPath);
      // entire ACL is replaced for new files
      AcegiPermissionMgr permissionMgr = AcegiPermissionMgr.instance();
      HibernateUtil.beginTransaction();
      permissionMgr.setPermissions(getDefaultPublishAcl(), justPublishedFile);
    }
    return res;
  }

  /**
   * Returns the ACL to set on newly published content.
   * @return an ACL
   */
  protected Map<IPermissionRecipient, IPermissionMask> getDefaultPublishAcl() {
    Map<IPermissionRecipient, IPermissionMask> acl = new HashMap<IPermissionRecipient, IPermissionMask>();
    // the publisher gets full control
    acl.put(new SimpleSession(getSession()), new SimplePermissionMask(IPentahoAclEntry.PERM_FULL_CONTROL));
    IPentahoSession sess = getSession();
    IAclVoter voter = PentahoSystem.getAclVoter(sess);
    // and the Pentaho administrator gets full control
    acl.put(new SimpleRole(voter.getAdminRole().getAuthority()), new SimplePermissionMask(
        IPentahoAclEntry.PERM_FULL_CONTROL));
    return acl;
  }

  public int publish(final String baseUrl, final String path, final String fileName, final File f,
      final boolean overwrite) throws PentahoAccessControlException {
    byte[] bytes;
    try {
      bytes = FileHelper.getBytesFromFile(f);
    } catch (IOException e) {
      error(Messages.getErrorString("SolutionRepository.ERROR_0014_COULD_NOT_SAVE_FILE", fileName), e); //$NON-NLS-1$
      return ISolutionRepository.FILE_ADD_FAILED;
    }
    return publish(baseUrl, path, fileName, bytes, overwrite);
  }

  public void share(final ISolutionFile file, final List<IPermissionRecipient> shareRecipients) {
    // TODO mlowery Fetch the ACE belonging to this IPermissionRecipient (if any).
    AcegiPermissionMgr permissionMgr = AcegiPermissionMgr.instance();
    for (IPermissionRecipient shareRecipient : shareRecipients) {
      addPermission(file, shareRecipient, new SimplePermissionMask(IPentahoAclEntry.PERM_EXECUTE_SUBSCRIBE));
    }
  }

  public void unshare(final ISolutionFile file, final List<IPermissionRecipient> shareRecipients) {
    final int NOT_SHARE = IPentahoAclEntry.PERM_EXECUTE_SUBSCRIBE ^ 0xffffffff;
    AcegiPermissionMgr permissionMgr = AcegiPermissionMgr.instance();
    // make a copy of the ACL in case it is immutable
    Map<IPermissionRecipient, IPermissionMask> acl = new HashMap<IPermissionRecipient, IPermissionMask>(permissionMgr
        .getPermissions(file));
    for (IPermissionRecipient shareRecipient : shareRecipients) {
      IPermissionMask perm = acl.get(shareRecipient);
      if (null != perm) {
        acl.put(shareRecipient, new SimplePermissionMask(perm.getMask() & NOT_SHARE));
      } else {
        // ignore when clients ask to unshare recipients who were not being shared with
      }
    }
    permissionMgr.setPermissions(acl, file);
  }

  /**
   * TODO mlowery Need to throw exception if unauthorized.
   */
  public void addPermission(final ISolutionFile file, final IPermissionRecipient recipient,
      final IPermissionMask permission) {
    AcegiPermissionMgr permissionMgr = AcegiPermissionMgr.instance();
    if (isPentahoAdministrator()
        || permissionMgr.hasPermission(new SimpleSession(getSession()), new SimplePermissionMask(
            IPentahoAclEntry.PERM_UPDATE_PERMS), file)) {
      permissionMgr.setPermission(recipient, permission, file);
    } else {
      warn("request to add permission on file \"" + file.getFileName() + "\" denied");
    }
  }

  /**
   * TODO mlowery Need to throw exception if unauthorized.
   */
  public void setPermissions(final ISolutionFile file, final Map<IPermissionRecipient, IPermissionMask> acl)
      throws PentahoAccessControlException {
    AcegiPermissionMgr permissionMgr = AcegiPermissionMgr.instance();
    if (isPentahoAdministrator()
        || permissionMgr.hasPermission(new SimpleSession(getSession()), new SimplePermissionMask(
            IPentahoAclEntry.PERM_UPDATE_PERMS), file)) {
      permissionMgr.setPermissions(acl, file);
    } else {
      String msg = Messages.getErrorString("SolutionRepository.ERROR_0015_SET_PERMISSIONS_DENIED", file.getFileName()); //$NON-NLS-1$
      warn(msg);
      throw new PentahoAccessControlException(msg);
    }
  }

  /**
   * TODO mlowery Need to throw exception if unauthorized.
   * TODO mlowery If we had a READ_PERMS bit, then it would be enforced here.
   */
  public Map<IPermissionRecipient, IPermissionMask> getPermissions(final ISolutionFile file) {
    AcegiPermissionMgr permissionMgr = AcegiPermissionMgr.instance();
    //    if (permissionMgr.hasPermission(new SimpleSession(getSession()), new SimplePermissionMask(
    //        PentahoAclEntry.MANAGE_PERMS), file)) { 
    // TODO mlowery Need to do a reverse map to get ISolutionRepository permission constants.
    return permissionMgr.getPermissions(file);
    //    } else {
    //      warn("request to read permissions on file \"" + file.getFileName() + "\" denied");
    //      return Collections.emptyMap();
    //    }
  }
  
  /**
   * TODO mlowery Need to throw exception if unauthorized.
   * TODO mlowery If we had a READ_PERMS bit, then it would be enforced here.
   */
  public Map<IPermissionRecipient, IPermissionMask> getEffectivePermissions(final ISolutionFile file) {
    AcegiPermissionMgr permissionMgr = AcegiPermissionMgr.instance();
    return permissionMgr.getEffectivePermissions(file);
  }

  @Override
  public ISolutionFile createFolder(final File newFolder) throws IOException {
    synchronized(lock) {
      HibernateUtil.beginTransaction();
      try {
        String solutionRoot = PentahoSystem.getApplicationContext().getSolutionPath("");
        File solutionFile = new File(solutionRoot);
        if (solutionFile.isDirectory()) {
          Map reposFileStructure = this.getAllRepositoryModDates();
          /*
           * The fromBase and toBase are, for example: From Base: D:\japps\pentaho\my-solutions\solutions To Base: /solutions
           */
          String fromBase = solutionFile.getCanonicalPath();
          String toBase = (solutionFile.getName().charAt(0) == '/') ? solutionFile.getName()
              : "/" + solutionFile.getName(); //$NON-NLS-1$
          RepositoryUpdateHelper updateHelper = new RepositoryUpdateHelper(fromBase, toBase, reposFileStructure, this);
          ISolutionFile returnFile = updateHelper.createFolder(newFolder);
          super.createFolder(newFolder);
          return returnFile;
        }
      } finally {
        HibernateUtil.commitTransaction();
        HibernateUtil.flushSession();
      }
      return null;
    }
  }

}

/***************************************************************************************************************************************************************
 * Old Update DB Repository Classes and Methods *************************** // // This method is no longer used - it's here for reference // public List
 * oldloadSolutionFromFileSystem(IPentahoSession pSession, String solutionRoot, boolean deleteOrphans) {
 * logger.info(Messages.getString("SolutionRepository.INFO_0001_BEGIN_LOAD_DB_REPOSITORY")); //$NON-NLS-1$ // long startTime = System.currentTimeMillis(); File
 * solutionFile = new File(solutionRoot); List touched = new ArrayList(); RepositoryFile solution = null; List notTouched = null; if
 * (solutionFile.isDirectory()) { String solutionName = solutionFile.getName(); solution = findRootRepositoryByName(solutionName); if (solution == null) {
 * solution = new RepositoryFile(solutionName, null, null, solutionFile.lastModified()); } else if (solutionFile.lastModified() != solution.lastModified) {
 * solution.setLastModified(solutionFile.lastModified()); logger.info(Messages.getString("SolutionRepository.INFO_0002_UPDATED_FOLDER",
 * solution.getFullPath())); //$NON-NLS-1$ } touched.add(solution); oldProcessFileSystem(solutionFile, solution, touched); IAclPublisher aclPublisher =
 * PentahoSystem.getAclPublisher(pSession); if (aclPublisher != null) { aclPublisher.publishDefaultAcls(solution); } HibernateUtil.beginTransaction();
 * HibernateUtil.makePersistent(solution); notTouched = findNotTouched(touched, solution); if (deleteOrphans) { deleteFilesFromSolutionTree(notTouched); }
 * HibernateUtil.commitTransaction(); } else { // TODO throw some sort of exception here } getRootSolutionFolder(); // This ensures that the repository name
 * gets set correctly. resetRepository(); logger.info(Messages.getString("SolutionRepository.INFO_0003_END_LOAD_DB_REPOSITORY")); //$NON-NLS-1$ // long endTime =
 * System.currentTimeMillis(); // System.out.println("*********** Old Repository Load Time: " + (endTime - startTime) ); return notTouched; } private List
 * oldProcessFileSystem(File solutionFile, RepositoryFile parent, List touched) { // recurse the directories File[] files = solutionFile.listFiles(); for (int i =
 * 0; i < files.length; i++) { File aFile = files[i]; if (aFile.isDirectory()) { String directoryName = aFile.getName(); if
 * (!SolutionReposHelper.ignoreDirectory(directoryName)) { RepositoryFile folder = getFileByPath(parent.getFullPath() + RepositoryFile.PATH_SEPERATOR +
 * directoryName); if (folder == null) { folder = new RepositoryFile(directoryName, parent, null, aFile.lastModified());
 * logger.info(Messages.getString("SolutionRepository.INFO_0004_ADDED_FOLDER", folder.getFullPath())); //$NON-NLS-1$ } else if (aFile.lastModified() !=
 * folder.lastModified) { folder.setParent(parent); folder.setFileName(directoryName); folder.setLastModified(aFile.lastModified());
 * logger.info(Messages.getString("SolutionRepository.INFO_0005_UPDATED_FOLDER", folder.getFullPath())); //$NON-NLS-1$ } touched.add(folder);
 * oldProcessFileSystem(aFile, folder, touched); } } else { // Process other files if (!SolutionReposHelper.ignoreFile(aFile.getName())) { try { RepositoryFile
 * reposFile = getFileByPath(parent.getFullPath() + RepositoryFile.PATH_SEPERATOR + aFile.getName()); byte[] data = getBytesFromFile(aFile); if (reposFile ==
 * null) { reposFile = new RepositoryFile(aFile.getName(), parent, data, aFile.lastModified());
 * logger.info(Messages.getString("SolutionRepository.INFO_0006_ADDED_FILE", reposFile.getFullPath())); //$NON-NLS-1$ } else if (aFile.lastModified() !=
 * reposFile.lastModified) { reposFile.setFileName(aFile.getName()); reposFile.setParent(parent); reposFile.setData(data);
 * reposFile.setLastModified(aFile.lastModified()); logger.info(Messages.getString("SolutionRepository.INFO_0007_UPDATED_FILE", reposFile.getFullPath()));
 * //$NON-NLS-1$ } touched.add(reposFile); } catch (IOException e) { // TODO Auto-generated catch block e.printStackTrace(); } } } } return touched; } private
 * List findNotTouched(List touched, RepositoryFile solution) { List currentFiles = new ArrayList(); currentFiles = getAllFilesAsList(solution, currentFiles);
 * Iterator iter = touched.iterator(); while (iter.hasNext()) { currentFiles.remove(iter.next()); } return currentFiles; } private List
 * getAllFilesAsList(RepositoryFile file, List currentFiles) { currentFiles.add(file); if (file.isDirectory()) { Iterator iter =
 * file.getChildrenFiles().iterator(); while (iter.hasNext()) { currentFiles = getAllFilesAsList((RepositoryFile) iter.next(), currentFiles); } } return
 * currentFiles; } private void deleteFilesFromSolutionTree(List deleteList) { if (deleteList != null) { Iterator iter = deleteList.iterator(); while
 * (iter.hasNext()) { RepositoryFile file = (RepositoryFile) iter.next(); RepositoryFile parent = file.getParent(); if (parent != null) { // this take care of
 * the case of deleting the // repository completely parent.removeChildFile(file); } } } } End Old Update DB Repository Classes and Methods
 * ***************************
 **************************************************************************************************************************************************************/
