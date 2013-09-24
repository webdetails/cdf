/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
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
    private Map<String, Object> userData;
    private List<String> unboundParams;
    private String name, viewId, user, description, key;
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

    public void setUserData(String name, Object value) {
        userData.put(name, value);
    }

    public Object getUserData(String name) {
        return userData.get(name);
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getId() {
        return viewId;
    }

    public void setId(String id) {
        this.viewId = id;
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
            JSONObject json = new JSONObject();
            json.put("description", description);
            json.put("name", name);
            json.put("id", viewId);
            json.put("key", key);
            json.put("timestamp", timestamp == null ? 0 : timestamp.getTime());
            json.put("user", user);
            json.put("unbound", new JSONArray(unboundParams));
            String p = new String(Base64.encodeBase64(new JSONObject(parameters).toString(2).getBytes()));
            json.put("params", p);
            if (userData != null) {
                String u = new String(Base64.encodeBase64(new JSONObject(userData).toString(2).getBytes()));
                json.put("userData", u);
            }
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
            String _description, _name, _id, _key, _user, _solution, _path, _file;
            Date _timestamp;
            JSONObject jsonUserData, jsonParams;
            Map<String, Object> _params = new HashMap<String, Object>(),
                    _userData = new HashMap<String, Object>();
            _description = json.optString("description");
            _name = json.getString("name");
            _id = json.getString("id");
            _timestamp = new Date(json.optLong("timestamp", 0));
            _user = json.getString("user");
            _key = json.isNull("key") ? null : json.optString("key");
            _solution = json.getString("solution");
            _path = json.getString("path");
            _file = json.getString("file");
            String p = json.getString("params");
            jsonParams = new JSONObject(new String(Base64.decodeBase64(p.getBytes())));
            JSONArray jsonUnbound = json.getJSONArray("unbound");
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

            if (json.has("userData")) {
                String u = json.getString("userData");
                jsonUserData = new JSONObject(new String(Base64.decodeBase64(u.getBytes())));
                String[] userDataKeys = JSONObject.getNames(jsonUserData);
                if (userDataKeys != null) {
                    for (String k : userDataKeys) {
                        _userData.put(k, jsonUserData.get(k));
                    }
                }
            } else {
                _userData = null;
            }
            name = _name;
            user = _user;
            description = _description;
            viewId = _id;
            key = _key;
            timestamp = _timestamp;
            parameters = _params;
            userData = _userData;
            unboundParams = _unbound;
            solution = _solution;
            path = _path;
            file = _file;
        } catch (JSONException e) {
        }
    }
}
