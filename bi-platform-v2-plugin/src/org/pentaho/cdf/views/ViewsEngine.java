/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

package org.pentaho.cdf.views;

import java.io.OutputStream;
import java.util.List;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.core.system.PentahoSessionHolder;
import pt.webdetails.cpf.persistence.*;

/**
 *
 * @author pdpi
 */
public class ViewsEngine {

    private static ViewsEngine instance;
    private static final Log logger = LogFactory.getLog(ViewsEngine.class);

    private ViewsEngine() {
    }

    public synchronized static ViewsEngine getInstance() {
        if (instance == null) {
            instance = new ViewsEngine();
        }
        return instance;
    }

    public ViewEntry getView(String id) {
        IPentahoSession userSession = PentahoSessionHolder.getSession();
        SimplePersistence sp = SimplePersistence.getInstance();
        Filter filter = new Filter();
        filter.where("name").equalTo(id).and().where("user").equalTo(userSession.getName());
        List<ViewEntry> views = sp.load(ViewEntry.class, filter);

        return (views != null && views.size() > 0) ? views.get(0) : null;
    }

    public JSONObject listViews() {
        IPentahoSession userSession = PentahoSessionHolder.getSession();
        SimplePersistence sp = SimplePersistence.getInstance();
        Filter filter = new Filter();
        filter.where("user").equalTo(userSession.getName());
        List<ViewEntry> views = sp.load(ViewEntry.class, filter);
        JSONObject obj = new JSONObject();
        JSONArray arr = new JSONArray();
        for (ViewEntry v : views) {
            arr.put(v.toJSON());
        }
        try {
            obj.put("views", arr);
            obj.put("status", "ok");
        } catch (JSONException e) {
        }
        return obj;
    }

    public JSONObject saveView(String viewContent) {
        ViewEntry view = new ViewEntry();
        IPentahoSession userSession = PentahoSessionHolder.getSession();
        JSONObject obj = new JSONObject(); 
        
        try {
            JSONObject json = new JSONObject(viewContent);
            view.fromJSON(json);
            view.setUser(userSession.getName());
            PersistenceEngine pe = PersistenceEngine.getInstance();
            pe.store(view);
        } catch (JSONException e) {
            logger.error(e);
            try {
                obj.put("status", "error");
            } catch (JSONException ex) {}  
        }
        
        try {
            obj.put("status", "ok");
        } catch (JSONException e) {}
        
        return obj;
    }

    public JSONObject deleteView(String name) {
        IPentahoSession userSession = PentahoSessionHolder.getSession();
        JSONObject obj = new JSONObject(); 
        
        try {
            Filter filter = new Filter();
            filter.where("user").equalTo(userSession.getName()).and().where("name").equalTo(name);
            SimplePersistence.getInstance().delete(ViewEntry.class, filter);
            try {
                obj.put("status", "ok");
            } catch (JSONException e) {}
        } catch (Exception e) {
            logger.error(e);
            try {
                obj.put("status", "error");
            } catch (JSONException ex) {}  
        }
        
        return obj;
    }

    public void listReports() {
    }

    public void saveReport() {
    }
}
