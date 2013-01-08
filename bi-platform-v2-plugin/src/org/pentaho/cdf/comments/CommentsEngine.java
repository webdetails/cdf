package org.pentaho.cdf.comments;

import java.io.InputStream;
import java.lang.reflect.Method;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.hibernate.Query;
import org.hibernate.Session;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.InvalidCdfOperationException;
import org.pentaho.cdf.Messages;
import org.pentaho.cdf.PluginHibernateException;
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
public class CommentsEngine
{

  private static final Log logger = LogFactory.getLog(CommentsEngine.class);
  private static CommentsEngine _instance;
  private static final int DELETE_OPERATION = 0;
  private static final int ARCHIVE_OPERATION = 1;
  private static final SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm");

  public static CommentsEngine getInstance()
  {
    if (_instance == null)
    {
      _instance = new CommentsEngine();
    }
    return _instance;
  }

  public CommentsEngine()
  {
    try
    {
      logger.info("Creating CommentsEngine instance");
      initialize();
    }
    catch (PluginHibernateException ex)
    {
      logger.fatal("Could not create CommentsEngine: " + Util.getExceptionDescription(ex)); //$NON-NLS-1$
      return;
    }
  }


  public JSONObject add(String page, String comment, IPentahoSession userSession) throws JSONException, InvalidCdfOperationException, PluginHibernateException
  {
    String user = userSession.getName();

    if (page == null || page.equals("") || comment == null || comment.equals(""))
    {

      logger.error("Parameters 'page' and 'comment' are not optional");
      throw new InvalidCdfOperationException("Page cannot be null");

    }

    logger.debug("Adding comment");


    CommentEntry commentEntry = new CommentEntry(page, user, comment);

    Session session = getSession();

    session.beginTransaction();
    session.save(commentEntry);
    session.flush();
    session.getTransaction().commit();

    // Get it and build the tree
    JSONObject json = new JSONObject();
    json.put("result", commentToJson(commentEntry, userSession));

    return json;

  }

  public JSONObject list(String page, int firstResult, int maxResults, IPentahoSession userSession) throws JSONException, InvalidCdfOperationException, PluginHibernateException
  {

    logger.debug("Listing messages");
    String user = userSession.getName();

    if (page == null || page.equals(""))
    {

      logger.error("Parameters 'page' and 'comment' are not optional");
      throw new InvalidCdfOperationException("Page cannot be null");

    }

    logger.debug("Adding comment");


    Session session = getSession();

    Query query = session.getNamedQuery("org.pentaho.cdf.comments.CommentEntry.getCommentsByPage").setString("page", page);
    query.setFirstResult(firstResult);
    query.setMaxResults(maxResults);

    List<CommentEntry> comments = query.list();

    JSONArray jsonArray = new JSONArray();
    for (CommentEntry comment : comments)
    {
      JSONObject commentJson = commentToJson(comment, userSession);
      jsonArray.put(commentJson);
    }


    // Get it and build the tree
    JSONObject json = new JSONObject();
    json.put("result", jsonArray);

    return json;

  }

  public JSONObject delete(int commentId, IPentahoSession userSession) throws JSONException, InvalidCdfOperationException, PluginHibernateException
  {
    logger.debug("Deleting comment " + commentId);
    return changeCommentStatus(DELETE_OPERATION, commentId, userSession);

  }

  public JSONObject archive(int commentId, IPentahoSession userSession) throws JSONException, InvalidCdfOperationException, PluginHibernateException
  {
    logger.debug("Archiving comment " + commentId);
    return changeCommentStatus(ARCHIVE_OPERATION, commentId, userSession);

  }

  private JSONObject changeCommentStatus(int operationType, int commentId, IPentahoSession userSession) throws JSONException, PluginHibernateException
  {


    Session session = getSession();
    session.beginTransaction();

    CommentEntry comment = (CommentEntry) session.load(CommentEntry.class, commentId);

    if (operationType == ARCHIVE_OPERATION)
    {
      comment.setArchived(true);
    }
    else if (operationType == DELETE_OPERATION)
    {
      comment.setDeleted(true);
    }

    session.save(comment);
    session.getTransaction().commit();

    // Get it and build the tree
    JSONObject json = new JSONObject();
    json.put("result", commentToJson(comment, userSession));
    return json;


  }

  private JSONObject commentToJson(CommentEntry comment, IPentahoSession userSession) throws JSONException
  {
    JSONObject commentJson = new JSONObject();
    commentJson.put("id", comment.getCommentId());
    commentJson.put("user", comment.getUser());
    commentJson.put("page", comment.getPage());
    commentJson.put("createdOn", format.format(comment.getCreatedDate()));
    commentJson.put("elapsedMinutes", comment.getMinutesSinceCreation());
    commentJson.put("comment", comment.getComment());
    commentJson.put("isMe", comment.getUser().equals(userSession.getName()) ? true : false);
    return commentJson;
  }

  private Session getSession() throws PluginHibernateException
  {

    return PluginHibernateUtil.getSession();

  }

  private void initialize() throws PluginHibernateException
  {


      
    ClassLoader contextCL = Thread.currentThread().getContextClassLoader();
    try {
        Thread.currentThread().setContextClassLoader(this.getClass().getClassLoader());
      
        IPluginResourceLoader resLoader = PentahoSystem.get(IPluginResourceLoader.class, null);
        InputStream in = resLoader.getResourceAsStream(CommentsEngine.class, "resources/hibernate/Comments.hbm.xml");

        // Close session and rebuild
        PluginHibernateUtil.closeSession();
        PluginHibernateUtil.getConfiguration().addInputStream(in);
        PluginHibernateUtil.rebuildSessionFactory();
      
      
    }
    catch (Exception e){}
    finally {
        Thread.currentThread().setContextClassLoader(contextCL);
    }      
      
    // Get hbm file

  }

  private String getExceptionDescription(Exception ex)
  {
    return ex.getCause().getClass().getName() + " - " + ex.getMessage();
  }
}
