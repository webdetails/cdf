/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.pentaho.cdf.settings;

import java.io.IOException;
import java.io.OutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import static javax.ws.rs.core.MediaType.APPLICATION_XML;
import static javax.ws.rs.core.MediaType.APPLICATION_FORM_URLENCODED;
import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.cdf.comments.CommentsApi;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;

/**
 *
 * @author diogomariano
 */
@Path("/pentaho-cdf/api/settings")
public class SettingsApi {
    
    IPentahoSession userSession;
    
    private static final Log logger = LogFactory.getLog(CommentsApi.class);
    private static final String ENCODING = "UTF-8";

    public SettingsApi() {
        getUserSession();
    }
    
    
    @GET
    @Path("/set")
    @Consumes({ APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED })
    public void set(@QueryParam("key") String key,
                    @QueryParam("value") String value,
                           
                    @Context HttpServletResponse servletResponse, 
                    @Context HttpServletRequest servletRequest){

        SettingsEngine.getInstance().setValue(key, value, PentahoSessionHolder.getSession());
        
    }
    
    
    @GET
    @Path("/get")
    @Consumes({ APPLICATION_XML, APPLICATION_JSON, APPLICATION_FORM_URLENCODED })
    public void get(@QueryParam("key") String key,
                           
                    @Context HttpServletResponse servletResponse, 
                    @Context HttpServletRequest servletRequest){



        final Object value = SettingsEngine.getInstance().getValue(key, PentahoSessionHolder.getSession());

        try {
            writeOut(servletResponse.getOutputStream(), value.toString());
        } catch(IOException ex){

        }
            
    }
    
    
    protected void writeOut(OutputStream out, String contents) throws IOException {
      IOUtils.write(contents, out, getEncoding());
      out.flush();
    }
    
    protected static String getEncoding() { 
        return ENCODING; 
    }
    
    protected IPentahoSession getUserSession(){
        return PentahoSessionHolder.getSession();
    }
}
