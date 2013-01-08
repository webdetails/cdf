package org.pentaho.cdf.storage;

import static javax.ws.rs.core.MediaType.APPLICATION_JSON;
import static javax.ws.rs.core.MediaType.APPLICATION_XML;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Response;

import org.json.JSONException;
import org.pentaho.cdf.InvalidCdfOperationException;
import org.pentaho.cdf.PluginHibernateException;
import org.pentaho.cdf.storage.StorageEngine;
import org.pentaho.cdf.storage.StorageEngine;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.mt.ITenantedPrincipleNameResolver;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import org.pentaho.platform.engine.core.system.PentahoSystem;

/**
 *
 * @author rmansoor
 */
@Path("/pentaho-cdf/api/storage")
public class StorageApi {
    public StorageApi() {
      
    }

    @GET
    @Path("/store")
    @Produces("text/plain")
    @Consumes({ APPLICATION_XML, APPLICATION_JSON })
    public Response store(@QueryParam("storageValue") String storageValue) throws InvalidCdfOperationException  {
      StorageEngine.getInstance().store(getUserName(), storageValue);
      return Response.ok().build();
    }

    @GET
    @Path("/read")
    @Produces("text/plain")
    @Consumes({ APPLICATION_XML, APPLICATION_JSON })
    public String read() throws JSONException, InvalidCdfOperationException, PluginHibernateException {
      return StorageEngine.getInstance().read(getUserName());
    }



    @GET
    @Path("/delete")
    @Produces("text/plain")
    @Consumes({ APPLICATION_XML, APPLICATION_JSON })
    public Response delete() throws JSONException, InvalidCdfOperationException {
      StorageEngine.getInstance().delete(getUserName());
      return Response.ok().build();
    }
    
    private String getUserName() {
      
      IPentahoSession session = PentahoSessionHolder.getSession();
      String userName = session.getName();
      ITenantedPrincipleNameResolver tenantedUserNameUtils = PentahoSystem.get(ITenantedPrincipleNameResolver.class, "tenantedUserNameUtils", session);
      if(tenantedUserNameUtils != null) {
        userName = tenantedUserNameUtils.getPrincipleName(userName);
      }
      return userName;
    }
}
