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
import org.pentaho.platform.engine.security.SecurityHelper;
import pt.webdetails.cpf.persistence.*;

/**
 *
 * @author pdpi
 */
public class ViewManager {

    private static ViewManager instance;
    private static final Log logger = LogFactory.getLog(ViewManager.class);

    private ViewManager() {
    }

    public synchronized static ViewManager getInstance() {
        if (instance == null) {
            instance = new ViewManager();
        }
        return instance;
    }

    public void process(IParameterProvider requestParams, IParameterProvider pathParams, OutputStream out) {

        String method = requestParams.getStringParameter("method", "");
        if ("listViews".equals(method)) {
            try {
                out.write(listViews().toString(2).getBytes("utf-8"));
            } catch (Exception e) {
                logger.error("Error listing views: " + e);
            }
        } else if ("listAllViews".equals(method)) {
            try {
                out.write(listAllViews().toString(2).getBytes("utf-8"));
            } catch (Exception e) {
                logger.error("Error listing views: " + e);
            }
        } else if ("saveView".equals(method)) {
            try {
                out.write(saveView(requestParams, pathParams).getBytes("utf-8"));
            } catch (Exception e) {
                logger.error("Error saving view: " + e);
            }
        } else if ("deleteView".equals(method)) {
            try {
                out.write(deleteView(requestParams, pathParams).getBytes("utf-8"));
            } catch (Exception e) {
                logger.error("Error saving view: " + e);
            }
        } else {
            logger.error("Unsupported method");
        }
    }

    public View getView(String id) {
        IPentahoSession userSession = PentahoSessionHolder.getSession();
        SimplePersistence sp = SimplePersistence.getInstance();
        Filter filter = new Filter();
        filter.where("name").equalTo(id).and().where("user").equalTo(userSession.getName());
        List<View> views = sp.load(View.class, filter);

        return (views != null && views.size() > 0) ? views.get(0) : null;
    }

    public JSONObject listViews() {
        IPentahoSession userSession = PentahoSessionHolder.getSession();
        SimplePersistence sp = SimplePersistence.getInstance();
        Filter filter = new Filter();
        filter.where("user").equalTo(userSession.getName());
        List<View> views = sp.load(View.class, filter);
        JSONObject obj = new JSONObject();
        JSONArray arr = new JSONArray();
        for (View v : views) {
            arr.put(v.toJSON());
        }
        try {
            obj.put("views", arr);
            obj.put("status", "ok");
        } catch (JSONException e) {
        }
        return obj;
    }

    public JSONObject listAllViews() {
        JSONObject response = new JSONObject();
        IPentahoSession userSession = PentahoSessionHolder.getSession();
        if (!SecurityHelper.isPentahoAdministrator(userSession)) {
            try {
                response.put("status", "error");
                response.put("message", "You need to be an administrator to poll all views");
            } catch (JSONException e) {
            }
            return response;
        }
        SimplePersistence sp = SimplePersistence.getInstance();
        Filter filter = new Filter();
        filter.where("user").equalTo(userSession.getName());
        List<View> views = sp.loadAll(View.class);
        JSONArray arr = new JSONArray();
        for (View v : views) {
            arr.put(v.toJSON());
        }
        try {
            response.put("views", arr);
            response.put("status", "ok");
        } catch (JSONException e) {
        }
        return response;
    }

    public String saveView(IParameterProvider requestParams, IParameterProvider pathParams) {
        View view = new View();
        IPentahoSession userSession = PentahoSessionHolder.getSession();

        try {
            JSONObject json = new JSONObject(requestParams.getStringParameter("view", ""));
            view.fromJSON(json);
            view.setUser(userSession.getName());
            PersistenceEngine pe = PersistenceEngine.getInstance();
            pe.store(view);
        } catch (JSONException e) {
            logger.error(e);
            return "error";
        }
        return "ok";
    }

    public String deleteView(IParameterProvider requestParams, IParameterProvider pathParams) {
        IPentahoSession userSession = PentahoSessionHolder.getSession();
        try {
            String name = requestParams.getStringParameter("name", "");
            Filter filter = new Filter();
            filter.where("user").equalTo(userSession.getName()).and().where("name").equalTo(name);
            SimplePersistence.getInstance().delete(View.class, filter);
            return "ok";
        } catch (Exception e) {
            return "error";
        }
    }

    public void listReports() {
    }

    public void saveReport() {
    }
}
