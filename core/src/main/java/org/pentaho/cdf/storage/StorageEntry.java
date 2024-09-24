/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/

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
