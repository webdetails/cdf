package org.pentaho.cdf;

/**
 * Created by IntelliJ IDEA.
 * User: pedro
 * Date: Feb 2, 2010
 * Time: 6:38:21 PM
 */
public class PluginHibernateException extends Exception {
  private static final long serialVersionUID = 1L;

  public PluginHibernateException(final String s, final Exception cause) {
    super(s,cause);
  }
}