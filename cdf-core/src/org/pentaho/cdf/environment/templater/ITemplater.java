package org.pentaho.cdf.environment.templater;

public interface ITemplater {

  public enum Section {
    HEADER, FOOTER
  };

  public String getTemplateSection( String templateContent, Section section );

}
