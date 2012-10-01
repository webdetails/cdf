/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.pentaho.cdf.views;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.commons.codec.binary.Base64;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONArray;
import pt.webdetails.cpf.persistence.Persistable;

/**
 *
 * @author pdpi
 */
public class View implements Persistable {

    private Map<String, Object> parameters;
    private List<String> unboundParams;
    private String name, id, user, description, key;
    private String solution, path, file;
    private Date timestamp;

    public String getSolution() {
        return solution;
    }

    public void setSolution(String solution) {
        this.solution = solution;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getFile() {
        return file;
    }

    public void setFile(String file) {
        this.file = file;
    }

    public void setParameter(String name, Object value) {
        parameters.put(name, value);
    }

    public Object getParameter(String name) {
        return parameters.get(name);
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public JSONObject toJSON() {
        try {
            String p = new String(Base64.encodeBase64(new JSONObject(parameters).toString(2).getBytes()));
            JSONObject json = new JSONObject();
            json.put("description", description);
            json.put("name", name);
            json.put("id", id);
            json.put("timestamp", timestamp == null ? 0 : timestamp.getTime());
            json.put("user", user);
            json.put("unbound", new JSONArray(unboundParams));
            json.put("params", p);
            json.put("solution", solution);
            json.put("path", path);
            json.put("file", file);
            return json;
        } catch (JSONException e) {
            return null;
        }
    }

    public void fromJSON(JSONObject json) {
        try {
            String _description, _name, _id, _user, _solution, _path, _file;
            Date _timestamp;
            _description = json.optString("description");
            _name = json.getString("name");
            _id = json.getString("id");
            _timestamp = new Date(json.optLong("timestamp",0));
            _user = json.getString("user");
            _solution = json.getString("solution");
            _path = json.getString("path");
            _file = json.getString("file");
            String p =json.getString("params");
            JSONObject jsonParams = new JSONObject(new String(Base64.decodeBase64(p.getBytes())));
            JSONArray jsonUnbound = json.getJSONArray("unbound");
            Map<String, Object> _params = new HashMap<String, Object>();
            String[] keys = JSONObject.getNames(jsonParams);
            if (keys != null) {
                for (String k : keys) {
                    _params.put(k, jsonParams.get(k));
                }
            }
            List<String> _unbound = new ArrayList<String>();
            for (int i = 0; i < jsonUnbound.length(); i++) {
                _unbound.add(jsonUnbound.getString(i));
            }
            name = _name;
            user = _user;
            description = _description;
            id = _id;
            timestamp = _timestamp;
            parameters = _params;
            unboundParams = _unbound;
            solution = _solution;
            path = _path;
            file = _file;
        } catch (JSONException e) {
        }
    }
}
