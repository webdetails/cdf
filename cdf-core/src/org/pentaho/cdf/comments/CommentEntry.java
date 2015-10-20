/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
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

package org.pentaho.cdf.comments;

import java.io.Serializable;
import java.util.Date;

/**
 * @author pedro
 */
public class CommentEntry implements Serializable {

  private static final long serialVersionUID = -1301540966439813079L;
  private int commentId;
  private String page;
  private String user;
  private String comment;
  private boolean deleted = false;
  private boolean archived = false;
  private Date createdDate;

  public CommentEntry() {
    this.createdDate = new Date();
  }

  public CommentEntry( String page, String user, String comment ) {
    this();
    this.page = page;
    this.user = user;
    this.comment = comment;
  }

  public long getMinutesSinceCreation() {

    Date now = new Date();
    return ( now.getTime() - this.getCreatedDate().getTime() ) / 60000;

  }

  /**
   * @return the commentId
   */
  public int getCommentId() {
    return commentId;
  }

  /**
   * @param commentId the commentId to set
   */
  public void setCommentId( int commentId ) {
    this.commentId = commentId;
  }

  /**
   * @return the page
   */
  public String getPage() {
    return page;
  }

  /**
   * @param page the page to set
   */
  public void setPage( String page ) {
    this.page = page;
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
   * @return the comment
   */
  public String getComment() {
    return comment;
  }

  /**
   * @param comment the comment to set
   */
  public void setComment( String comment ) {
    this.comment = comment;
  }

  /**
   * @return the deleted
   */
  public boolean isDeleted() {
    return deleted;
  }

  /**
   * @param deleted the deleted to set
   */
  public void setDeleted( boolean deleted ) {
    this.deleted = deleted;
  }

  /**
   * @return the archived
   */
  public boolean isArchived() {
    return archived;
  }

  /**
   * @param archived the archived to set
   */
  public void setArchived( boolean archived ) {
    this.archived = archived;
  }

  /**
   * @return the createdDate
   */
  public Date getCreatedDate() {
    return createdDate;
  }

  /**
   * @param createdDate the createdDate to set
   */
  public void setCreatedDate( Date createdDate ) {
    this.createdDate = createdDate;
  }
}
