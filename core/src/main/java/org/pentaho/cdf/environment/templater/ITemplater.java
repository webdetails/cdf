/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 - 2026 by Pentaho Canada Inc. : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2030-06-15
 ******************************************************************************/



package org.pentaho.cdf.environment.templater;

public interface ITemplater {

  public enum Section {
    HEADER, FOOTER
  };

  public String getTemplateSection( String templateContent, Section section );
}
