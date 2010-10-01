package org.pentaho.cdf.storage;

import java.util.logging.Level;
import java.util.logging.Logger;
import org.pentaho.cdf.PluginHibernateException;
import org.pentaho.cdf.comments.*;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.List;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.hibernate.Query;
import org.hibernate.Session;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.InvalidCdfOperationException;
import org.pentaho.cdf.Messages;
import org.pentaho.cdf.utils.PluginHibernateUtil;
import org.pentaho.cdf.utils.Util;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.IPluginResourceLoader;
import org.pentaho.platform.engine.core.system.PentahoSystem;

/**
 *
 * @author pedro
 */
public class StorageEngine {

    private static final Log logger = LogFactory.getLog(StorageEngine.class);
    private static StorageEngine _instance;
    private static final SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm");

    public static synchronized StorageEngine getInstance() {
        if (_instance == null) {
            _instance = new StorageEngine();
        }
        return _instance;
    }

    public StorageEngine() {
        try {
            logger.info("Creating CommentsEngine instance");
            initialize();
        } catch (PluginHibernateException ex) {
            logger.fatal("Could not create CommentsEngine: " + Util.getExceptionDescription(ex)); //$NON-NLS-1$
            return;
        }

    }

    public String process(IParameterProvider requestParams, IPentahoSession userSession) throws InvalidCdfOperationException {

        String actionParam = requestParams.getStringParameter("action", "");

        Class[] params = {
            IParameterProvider.class, IPentahoSession.class
        };
        try {

            Method mthd = this.getClass().getMethod(actionParam, params);

            return (String) mthd.invoke(this, requestParams, userSession);


        } catch (NoSuchMethodException ex) {
            logger.error("NoSuchMethodException : " + actionParam + " - " + getExceptionDescription(ex));
            throw new InvalidCdfOperationException(ex);
        } catch (Exception ex) {
            logger.error(Messages.getErrorString("DashboardDesignerContentGenerator.ERROR_001_INVALID_METHOD_EXCEPTION") + " : " + actionParam);
            throw new InvalidCdfOperationException(ex);
        }

    }

    public String store(IParameterProvider requestParams, IPentahoSession userSession) throws JSONException, InvalidCdfOperationException, PluginHibernateException {


        String user = userSession.getName();
        String storageValue = requestParams.getStringParameter("storageValue", "");

        if (storageValue == null) {

            logger.error("Parameter 'storageValue' Can't be null");
            throw new InvalidCdfOperationException("Parameter 'storageValue' Can't be null");

        }

        logger.debug("Storing user entry");

        // if we have one, get it. Otherwise, create a new one

        Session session = getSession();
        session.beginTransaction();

        Query query = session.getNamedQuery("org.pentaho.cdf.storage.StorageEntry.getStorageForUser").setString("user", user);
        StorageEntry storageEntry = (StorageEntry) query.uniqueResult();

        if (storageEntry == null) {
            storageEntry = new StorageEntry();
            storageEntry.setUser(user);
        }

        storageEntry.setStorageValue(storageValue);
        storageEntry.setLastUpdatedDate(Calendar.getInstance().getTime());


        session.save(storageEntry);
        session.flush();
        session.getTransaction().commit();
        session.close();

        // Return success
        JSONObject json = new JSONObject();
        json.put("result", Boolean.TRUE);

        return json.toString(2);

    }

    public String read(IParameterProvider requestParams, IPentahoSession userSession) throws JSONException, InvalidCdfOperationException, PluginHibernateException {

        logger.debug("Reading storage");

        String user = userSession.getName();

        Session session = getSession();

        Query query = session.getNamedQuery("org.pentaho.cdf.storage.StorageEntry.getStorageForUser").setString("user", user);

        StorageEntry storageEntry = (StorageEntry) query.uniqueResult();

        // Return it, or an empty value

        String result = storageEntry != null ? storageEntry.getStorageValue() : "{}";
        session.close();

        return result;


    }

    public String delete(IParameterProvider requestParams, IPentahoSession userSession) throws JSONException, InvalidCdfOperationException, PluginHibernateException {



        String user = userSession.getName();
        logger.debug("Deleting storage for user " + user);

        Session session = getSession();
        session.beginTransaction();

        Query query = session.getNamedQuery("org.pentaho.cdf.storage.StorageEntry.getStorageForUser").setString("user", user);
        StorageEntry storageEntry = (StorageEntry) query.uniqueResult();

        if (storageEntry != null) {
            session.delete(storageEntry);

        }
        session.flush();
        session.getTransaction().commit();
        session.close();

        // Return success
        JSONObject json = new JSONObject();
        json.put("result", Boolean.TRUE);
        return json.toString(2);

    }

    private synchronized Session getSession() throws PluginHibernateException {

        return PluginHibernateUtil.getSession();

    }

    private void initialize() throws PluginHibernateException {


        // Get hbm file
        IPluginResourceLoader resLoader = PentahoSystem.get(IPluginResourceLoader.class, null);
        InputStream in = resLoader.getResourceAsStream(StorageEngine.class, "resources/hibernate/Storage.hbm.xml");

        // Close session and rebuild
        PluginHibernateUtil.closeSession();
        PluginHibernateUtil.getConfiguration().addInputStream(in);
        PluginHibernateUtil.rebuildSessionFactory();

    }

    private String getExceptionDescription(Exception ex) {
        return ex.getCause().getClass().getName() + " - " + ex.getMessage();
    }
}
