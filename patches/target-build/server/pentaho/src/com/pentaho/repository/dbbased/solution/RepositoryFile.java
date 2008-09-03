/*
 * Copyright 2005 Pentaho Corporation.  All rights reserved. 
 * This software was developed by Pentaho Corporation and is provided under the terms 
 * of the Mozilla Public License, Version 1.1, or any later version. You may not use 
 * this file except in compliance with the license. If you need a copy of the license, 
 * please go to http://www.mozilla.org/MPL/MPL-1.1.txt. The Original Code is the Pentaho 
 * BI Platform.  The Initial Developer is Pentaho Corporation.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS" 
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to 
 * the license for the specific language governing your rights and limitations.
 *
 * Created Feb 8, 2006 
 * @author wseyler
 */

package com.pentaho.repository.dbbased.solution;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import org.acegisecurity.acl.basic.AclObjectIdentity;
import org.pentaho.core.solution.ISolutionFile;
import org.pentaho.messages.Messages;
import org.pentaho.repository.ISearchable;
import org.pentaho.util.UUIDUtil;

import com.pentaho.security.acls.IAclSolutionFile;

public class RepositoryFile implements ISearchable, Comparable, AclObjectIdentity, IAclSolutionFile {
  public static final char EXTENSION_CHAR = '.';

  private static final long serialVersionUID = -4129429077568560627L;

  public static final int ClassVersionNumber = 2;

  private static final String EMPTY_STRING = ""; //$NON-NLS-1$

  private static final String[] SearchableColumns = { Messages.getString("SolutionRepository.QUERY_COLUMN_NAME"), //$NON-NLS-1$
      Messages.getString("SolutionRepository.QUERY_COLUMN_PATH"), //$NON-NLS-1$
      Messages.getString("SolutionRepository.QUERY_COLUMN_PARENT") //$NON-NLS-1$
  };

  private static final String SearchableTable = "com.pentaho.repository.dbbased.solution.RepositoryFile"; //$NON-NLS-1$

  private static final String SearchablePhraseNamedQuery = "org.pentaho.repository.solution.RepositoryFile.folderSearcher"; //$NON-NLS-1$

  public static final char SEPARATOR = '/';

  protected int revision;

  protected String fileId;

  protected RepositoryFile parent;

  protected String fileName;

  protected String fullPath;

  protected long lastModified;

  protected boolean directory = true;

  private byte[] data = null;

  private Set childrenFiles = new TreeSet();

  private List accessControls = new ArrayList();

  public RepositoryFile() {
    super();
  }

  public RepositoryFile(String fileName, RepositoryFile parent, byte[] data) {
    this(fileName, parent, data, System.currentTimeMillis());
  }

  public RepositoryFile(String fileName, RepositoryFile parent, byte[] data, long lastModified) {
    this();
    this.fileId = UUIDUtil.getUUIDAsString();

    this.fileName = fileName;
    if (parent != null) {
      parent.addChildFile(this);
    }
    setParent(parent);
    setData(data);
    setLastModified(lastModified);
    directory = data == null;
  }

  public int hashCode() {
    return fileId.hashCode();
  }

  public boolean equals(Object other) {
    if (this == other) {
      return true;
    }
    if (!(other instanceof RepositoryFile)) {
      return false;
    }
    final RepositoryFile that = (RepositoryFile) other;
    return getFileId().equals(that.getFileId());
  }

  protected void resolvePath() {
    StringBuffer buffer = new StringBuffer(EMPTY_STRING);

    if (parent != null) {
      buffer.append(parent.getFullPath());
    }
    buffer.append(SEPARATOR);
    buffer.append(fileName);

    setFullPath(buffer.toString());
  }

  public List getAccessControls() {
    return this.accessControls;
  }

  public void setAccessControls(List acls) {
    this.accessControls = acls;
  }

  public void resetAccessControls(List acls) {
    if (this.accessControls != null) {
      this.accessControls.clear();
      this.accessControls.addAll(acls);
    }
  }

  public int getRevision() {
    return revision;
  }

  protected void setRevision(int revision) {
    this.revision = revision;
  }

  public String getFileId() {
    return fileId;
  }

  protected void setFileId(String fileId) {
    this.fileId = fileId;
  }

  public String getSolution() {
    return getTopFolder().getFileName();
  }

  public String getSolutionPath() {
    ArrayList pathList = new ArrayList();
    ISolutionFile folder = parent;
    while (!folder.isRoot() && folder.retrieveParent() != null) {
      pathList.add(folder.getFileName());
      folder = folder.retrieveParent();
    }
    StringBuffer buffer = new StringBuffer(EMPTY_STRING);
    for (int i = pathList.size() - 1; i >= 0; i--) {
      buffer.append(SEPARATOR);
      buffer.append(pathList.get(i).toString());
    }
    return buffer.toString();
  }

  public String getFileName() {
    return fileName;
  }

  protected void setFileName(String fileName) {
    this.fileName = fileName;
    resolvePath();
  }

  public String getFullPath() {
    return fullPath;
  }

  protected void setFullPath(String fullPath) {
    this.fullPath = fullPath;
  }

  public void setParent(RepositoryFile parent) {
    this.parent = parent;
    resolvePath();
  }

  public RepositoryFile getParent() {
    return parent;
  }

  public ISolutionFile retrieveParent() {
    return parent;
  }

  protected RepositoryFile getTopFolder() {
    RepositoryFile topFolder = parent;
    if (topFolder == null) {
      return this;
    }
    while (!topFolder.isRoot()) {
      topFolder = (RepositoryFile) topFolder.retrieveParent();
    }
    return topFolder;
  }

  /*
   * (non-Javadoc)
   * 
   * @see org.pentaho.repository.ISearchable#getSearchableColumns()
   */
  public String[] getSearchableColumns() {
    return SearchableColumns;
  }

  /*
   * (non-Javadoc)
   * 
   * @see org.pentaho.repository.ISearchable#getSearchableTable()
   */
  public String getSearchableTable() {
    return SearchableTable;
  }

  /*
   * (non-Javadoc)
   * 
   * @see org.pentaho.repository.ISearchable#getPhraseSearchQueryName()
   */
  public String getPhraseSearchQueryName() {
    return SearchablePhraseNamedQuery;
  }

  protected void setDirectory(boolean directory) {
    this.directory = directory;
  }

  protected boolean getDirectory() {
    return directory;
  }

  public boolean isDirectory() {
    return getDirectory();
  }

  /**
   * @return Returns the childrenResources.
   */
  public Set getChildrenFiles() {
    return childrenFiles;
  }

  /**
   * @param childrenResources
   *            The childrenResources to set.
   */
  public void setChildrenFiles(Set childrenFiles) {
    this.childrenFiles = childrenFiles;
  }

  public void addChildFile(RepositoryFile file) {
    getChildrenFiles().add(file);
  }

  public void removeChildFile(RepositoryFile file) {
    getChildrenFiles().remove(file);
    file.setParent(null); // as of now this file has no parent.
  }

  /**
   * @return Returns the data.
   */
  public byte[] getData() {
    return data;
  }

  /**
   * @param data
   *            The data to set.
   */
  public void setData(byte[] data) {
    this.data = data;
  }

  public ISolutionFile[] listFiles() {
    Object[] objArray = getChildrenFiles().toArray();
    ISolutionFile[] childrenArray = new ISolutionFile[objArray.length];
    for (int i = 0; i < objArray.length; i++) {
      childrenArray[i] = (ISolutionFile) objArray[i];
    }
    return childrenArray;
  }

  public RepositoryFile[] listRepositoryFiles() {
    RepositoryFile[] files = new RepositoryFile[getChildrenFiles().size()];
    Iterator iter = getChildrenFiles().iterator();
    int i = 0;
    while (iter.hasNext()) {
      files[i] = (RepositoryFile) iter.next();
      i++;
    }
    return files;
  }

  public int compareTo(Object o) {
    if (o == null) {
      return 1;
    } else if (o instanceof RepositoryFile) {
      RepositoryFile that = (RepositoryFile) o;
      if (this.getFullPath() == null && that.getFullPath() == null) {
        return 0;
      } else if (this.getFullPath() == null && that.getFullPath() != null) {
        return -1;
      } else if (this.getFullPath() != null && that.getFullPath() == null) {
        return 1;
      } else {
        return this.getFullPath().compareTo(((RepositoryFile) o).getFullPath());
      }
    } else {
      return this.getFullPath().compareTo(o.toString());
    }
  }

  /**
   * Chains up to find the access controls that are in force on this object.
   * Could end up chaining all the way to the root.
   */
  public List getEffectiveAccessControls() {
    List acls = this.getAccessControls();
    if (acls.size() == 0) {
      RepositoryFile chain = this;
      while (!chain.isRoot() && (acls.size() == 0)) {
        chain = (RepositoryFile) chain.retrieveParent();
        acls = chain.getAccessControls();
      }
    }
    return acls;
  }

  /**
   * @return Returns the modDate.
   */
  public long getLastModified() {
    return lastModified;
  }

  /**
   * @param modDate The modDate to set.
   */
  public void setLastModified(long modDate) {
    this.lastModified = modDate;
  }

  public boolean containsActions() {
    boolean hasActions = false;
    if (this.isDirectory()) {
      Set children = getChildrenFiles();
      Iterator iter = children.iterator();
      while (iter.hasNext() && !hasActions) {
        RepositoryFile file = (RepositoryFile) iter.next();
        hasActions = file.getFileName().toLowerCase().endsWith(".xaction"); //$NON-NLS-1$
      }
    }
    return hasActions;
  }

  public boolean isRoot() {
    return retrieveParent() == null;
  }

  /**
   * @return a boolean indicating if this file has an extension
   */
  public boolean hasExtension() {
    return fileName.lastIndexOf(EXTENSION_CHAR) != -1;
  }

  /**
   * @return the extension (including the . seperator) of this file
   */
  public String getExtension() {
    return hasExtension() ? fileName.substring(fileName.lastIndexOf(EXTENSION_CHAR)) : ""; //$NON-NLS-1$
  }

  public boolean exists() {
    return true;
  }

}
