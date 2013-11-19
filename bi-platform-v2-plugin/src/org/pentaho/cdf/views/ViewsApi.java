/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.pentaho.cdf.views;

import java.io.IOException;
import java.io.OutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.cdf.comments.CommentsApi;
import org.pentaho.cdf.comments.CommentsEngine;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;

import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import static javax.ws.rs.core.MediaType.APPLICATION_XML;
import static javax.ws.rs.core.MediaType.APPLICATION_FORM_URLENCODED;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.InvalidCdfOperationException;
import org.pentaho.cdf.PluginHibernateException;

/**
 *
 * @author diogomariano
 */
@Path("/pentaho-cdf/api/views")
public class ViewsApi {
    private static final Log logger = LogFactory.getLog(CommentsApi.class);
    
    public static final String ENCODING = "UTF-8";
    private ViewsEngine engine;
    private IPentahoSession userSession;
    
    
    
    
    @GET
    @Path("/list")
    @Consumes({ APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED })
    public void listViews(@Context HttpServletResponse servletResponse, 
                          @Context HttpServletRequest servletRequest){
        JSONObject json;
        String result = "";

        try {
            json = getEngine().listViews();
            result = json.toString(2);
        } catch (JSONException ex){
            logger.error("Error listing views: " + ex);
        } 
        
        try {
            writeOut(servletResponse.getOutputStream(), result);
        } catch(IOException ex){
            logger.error("Error while outputing result",ex);
        }
    }
    
    @GET
    @Path("/save")
    @Consumes({ APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED })
    public void saveView(@DefaultValue("") @QueryParam("view") String view,
                         
                         @Context HttpServletResponse servletResponse, 
                         @Context HttpServletRequest servletRequest){
        JSONObject json;
        String result = "";

        try {
            json = getEngine().saveView(view);
            result = json.toString(2);
        } catch (JSONException ex){
            logger.error("Error saving view: " + ex);
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
    public void deleteView(@DefaultValue("") @QueryParam("name") String name,
                         
                           @Context HttpServletResponse servletResponse, 
                           @Context HttpServletRequest servletRequest){
        JSONObject json;
        String result = "";
        
        try {
            json = getEngine().deleteView(name);
            result = json.toString(2);
        } catch (JSONException ex){
            logger.error("Error deleting view: " + ex);
        } 
        
        try {
            writeOut(servletResponse.getOutputStream(), result);
        } catch(IOException ex){
            logger.error("Error while outputing result",ex);
        }
    }
    
    
    
    protected ViewsEngine getEngine(){
        if(engine == null){
            engine = ViewsEngine.getInstance();
        }
        return engine;
    }

    protected static String getEncoding() { 
        return ENCODING; 
    }
    
    protected IPentahoSession getUserSession(){
        return PentahoSessionHolder.getSession();
    }
    
    protected void writeOut(OutputStream out, String contents) throws IOException {
      IOUtils.write(contents, out, getEncoding());
      out.flush();
    }
}
