/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.pentaho.cdf.utils;

import java.io.InputStream;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.hibernate.cfg.Configuration;
import org.pentaho.cdf.PluginHibernateException;
import org.pentaho.platform.api.engine.IPluginResourceLoader;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.repository.hibernate.HibernateUtil;


/**
 *
 * @author pedro
 */
public class PluginHibernateUtil
{

  private static final Log logger = LogFactory.getLog(PluginHibernateUtil.class);
  private static Configuration configuration;
  private static SessionFactory sessionFactory;
  private static final byte[] lock = new byte[0];
  private static final ThreadLocal<Session> threadSession = new ThreadLocal<Session>();
  private static final ThreadLocal<Transaction> threadTransaction = new ThreadLocal<Transaction>();


  public PluginHibernateUtil()
  {
  }


  public static boolean initialize()
  {

    logger.debug("Initializing PluginHibernate");


    // Start our own hibernate session, copying everything from the original
    configuration = new Configuration();
    configuration.setProperties(HibernateUtil.getConfiguration().getProperties());

    sessionFactory = configuration.buildSessionFactory();

    return true;


  }


  /**
   * Returns the SessionFactory used for this static class.
   *
   * @return SessionFactory
   */
  public static SessionFactory getSessionFactory()
  {

    return PluginHibernateUtil.sessionFactory;

  }


  /**
   * Returns the original Hibernate configuration.
   *
   * @return Configuration
   */
  public static Configuration getConfiguration()
  {
    return PluginHibernateUtil.configuration;
  }


  /**
   * Rebuild the SessionFactory with the static Configuration.
   *
   */
  public static void rebuildSessionFactory() throws PluginHibernateException
  {

    synchronized (PluginHibernateUtil.lock)
    {
      try
      {
        PluginHibernateUtil.sessionFactory = PluginHibernateUtil.getConfiguration().buildSessionFactory();
      }
      catch (Exception ex)
      {
        logger.warn("Error building session factory " + Util.getExceptionDescription(ex)); //$NON-NLS-1$
        throw new PluginHibernateException("Error building session factory", ex); //$NON-NLS-1$
      }
    }
  }


  /**
   * Retrieves the current Session local to the thread. <p/> If no Session is
   * open, opens a new Session for the running thread.
   *
   * @return Session
   */
  public static synchronized Session getSession() throws PluginHibernateException
  {
    Session s = (Session) PluginHibernateUtil.threadSession.get();
    try
    {
      if (s == null || !s.isOpen())
      {

        s = PluginHibernateUtil.getSessionFactory().openSession();
      }
      PluginHibernateUtil.threadSession.set(s);

    }
    catch (HibernateException ex)
    {
      logger.warn("Error creating session " + Util.getExceptionDescription(ex)); //$NON-NLS-1$
      throw new PluginHibernateException("Error creating session", ex); //$NON-NLS-1$
    }
    return s;
  }


  public static void flushSession() throws PluginHibernateException
  {
    try
    {
      Session s = PluginHibernateUtil.getSession();
      s.flush();
    }
    catch (HibernateException ex)
    {
      logger.warn("Error flushing session " + Util.getExceptionDescription(ex)); //$NON-NLS-1$
      throw new PluginHibernateException("Error flushing session", ex); //$NON-NLS-1$
    }
  }


  /**
   * Closes the Session local to the thread.
   */
  public static synchronized void closeSession() throws PluginHibernateException
  {
    try
    {
      Session s = (Session) PluginHibernateUtil.threadSession.get();
      PluginHibernateUtil.threadSession.set(null);
      if ((s != null) && s.isOpen())
      {
        s.close();
      }
      PluginHibernateUtil.threadTransaction.set(null);
    }
    catch (HibernateException ex)
    {
      PluginHibernateUtil.threadTransaction.set(null);

      logger.warn("Error closing session " + Util.getExceptionDescription(ex)); //$NON-NLS-1$
      throw new PluginHibernateException("Error closing session", ex); //$NON-NLS-1$

    }



  }
}
