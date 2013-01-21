/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.pentaho.cdf.comments;


import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintWriter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.core.Context;
import javax.ws.rs.QueryParam;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.Produces;

import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import static javax.ws.rs.core.MediaType.APPLICATION_XML;
import static javax.ws.rs.core.MediaType.APPLICATION_FORM_URLENCODED;

import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONException;

import org.json.JSONObject;
import org.pentaho.cdf.InvalidCdfOperationException;
import org.pentaho.cdf.PluginHibernateException;

import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import pt.webdetails.cpf.repository.RepositoryAccess;

/**
 *
 * @author diogomariano
 */
@Path("/pentaho-cdf/api/comments")
public class CommentsApi {
    private static final Log logger = LogFactory.getLog(CommentsApi.class);
    
    public static final String ENCODING = "UTF-8";
    private CommentsEngine engine;
    private IPentahoSession userSession;
    
    public CommentsApi(){
    }
    
    @GET
    @Path("/add")
    @Consumes({ APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED })
    public void add(@DefaultValue("") @QueryParam("page") String page,
                    @DefaultValue("") @QueryParam("comment") String comment,
            
                    @Context HttpServletResponse servletResponse, 
                    @Context HttpServletRequest servletRequest){
        
        JSONObject json;
        String result = "";

        try {
            json = CommentsEngine.getInstance().add(page, comment ,getUserSession());
            result = json.toString(2);
        } catch (InvalidCdfOperationException ex) {
            logger.error("Error processing comment: " + ex);
        } catch (JSONException ex){
            logger.error("Error processing comment: " + ex);
        } catch (PluginHibernateException ex){
            logger.error("Error processing comment: " + ex);
        }
        
        try {
            writeOut(servletResponse.getOutputStream(), result);
        } catch(IOException ex){
            logger.error("Error while outputing result",ex);
        }
    }
    
    @GET
    @Path("/list")
    @Consumes({ APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED })
    public void list(@DefaultValue("") @QueryParam("page") String page,
                     @DefaultValue("0") @QueryParam("firstResult") int firstResult,
                     @DefaultValue("20") @QueryParam("maxResults") int maxResults,
            
                     @Context HttpServletResponse servletResponse, 
                     @Context HttpServletRequest servletRequest){
        
        JSONObject json;
        String result = "";

        try {
            json = CommentsEngine.getInstance().list(page, firstResult, maxResults ,getUserSession());
            result = json.toString(2);
        } catch (InvalidCdfOperationException ex) {
            logger.error("Error processing comment: " + ex);
        } catch (JSONException ex){
            logger.error("Error processing comment: " + ex);
        } catch (PluginHibernateException ex){
            logger.error("Error processing comment: " + ex);
        }
        
        try {
            writeOut(servletResponse.getOutputStream(), result);
        } catch(IOException ex){
            logger.error("Error while outputing result",ex);
        }
    }
    
    @GET
    @Path("/archive")
    @Consumes({ APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED })
    public void archive(@DefaultValue("0") @QueryParam("commentId") int commentId,
    
                        @Context HttpServletResponse servletResponse, 
                        @Context HttpServletRequest servletRequest){
        
        JSONObject json;
        String result = "";

        try {
            json = CommentsEngine.getInstance().archive(commentId, getUserSession());
            result = json.toString(2);
        } catch (InvalidCdfOperationException ex) {
            logger.error("Error processing comment: " + ex);
        } catch (JSONException ex){
            logger.error("Error processing comment: " + ex);
        } catch (PluginHibernateException ex){
            logger.error("Error processing comment: " + ex);
        }
        
        try {
            writeOut(servletResponse.getOutputStream(), result);
        } catch(IOException ex){
            logger.error("Error while outputing result",ex);
        }
    }
    
    @GET
    @Path("/delete")
    @Consumes({ APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED })
    public void delete(@DefaultValue("0") @QueryParam("commentId") int commentId,
    
                        @Context HttpServletResponse servletResponse, 
                        @Context HttpServletRequest servletRequest){
        
        JSONObject json;
        String result = "";

        try {
            json = CommentsEngine.getInstance().delete(commentId, getUserSession());
            result = json.toString(2);
        } catch (InvalidCdfOperationException ex) {
            logger.error("Error processing comment: " + ex);
        } catch (JSONException ex){
            logger.error("Error processing comment: " + ex);
        } catch (PluginHibernateException ex){
            logger.error("Error processing comment: " + ex);
        }
        
        try {
            writeOut(servletResponse.getOutputStream(), result);
        } catch(IOException ex){
            logger.error("Error while outputing result",ex);
        }
    }
       
    
  
    
    protected static String getEncoding() { 
        return ENCODING; 
    }
    
    protected IPentahoSession getUserSession(){
        if(userSession == null){
            userSession = PentahoSessionHolder.getSession();
        } 
        
        return userSession;
    }
    
    protected void writeOut(OutputStream out, String contents) throws IOException {
      IOUtils.write(contents, out, getEncoding());
      out.flush();
    }
}
