/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

package org.pentaho.cdf.storage;

import java.io.Serializable;
import java.util.Date;

public class StorageEntry implements Serializable {

  private static final long serialVersionUID = 1680873222553900520L;

  private int storageId;
  private String user;
  private String storageValue;
  private Date lastUpdatedDate;

  public StorageEntry() {
    this.lastUpdatedDate = new Date();
  }

  public StorageEntry( String user, String storageValue ) {
    this();
    this.user = user;
    this.storageValue = storageValue;
  }

  /**
   * @return the storageId
   */
  public int getStorageId() {
    return storageId;
  }

  /**
   * @param storageId the storageId to set
   */
  public void setStorageId( int storageId ) {
    this.storageId = storageId;
  }

  /**
   * @return the user
   */
  public String getUser() {
    return user;
  }

  /**
   * @param user the user to set
   */
  public void setUser( String user ) {
    this.user = user;
  }

  /**
   * @return the storage
   */
  public String getStorageValue() {
    return storageValue;
  }

  /**
   * @param storageValue the storage to set
   */
  public void setStorageValue( String storageValue ) {
    this.storageValue = storageValue;
  }

  /**
   * @return the lastUpdateDate
   */
  public Date getLastUpdatedDate() {
    return lastUpdatedDate;
  }

  /**
   * @param lastUpdatedDate the createdDate to set
   */
  public void setLastUpdatedDate( Date lastUpdatedDate ) {
    this.lastUpdatedDate = lastUpdatedDate;
  }
}
