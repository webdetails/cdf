/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.pentaho.cdf.export;

import java.io.IOException;
import java.io.OutputStream;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.cdf.Messages;
import org.pentaho.platform.web.http.HttpOutputHandler;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.platform.api.engine.IOutputHandler;
import org.pentaho.platform.engine.core.system.PentahoBase;

@SuppressWarnings("serial")
public abstract class Export extends PentahoBase implements IExport {

    protected static final Log logger = LogFactory.getLog(Export.class);
    protected HttpOutputHandler httpHandler = null;
    protected OutputStream outputStream = null;
       
    public Export(IOutputHandler httpHandler) throws IOException{
    	this.httpHandler = (HttpOutputHandler) httpHandler;
    	this.outputStream = this.httpHandler.getOutputContent().getOutputStream(null);
    };
        
    public Log getLogger() {return logger;}
    
    public void exportFile(JSONObject resultSet) {
    	
    	
		try {
			
			JSONArray metaData = resultSet.getJSONArray("metadata");
	    	JSONArray values = resultSet.getJSONArray("values");
	
	    	String[][] results = new String[1][1];
	    	results[0][0] = "No results Returned";
	    	
	    	int nCols = 0,nRows = 0;
	    	if( metaData.length() > 0 && (nRows = values.length()) > 0 && values.length() > 0 && (nCols = values.getJSONArray(0).length()) > 0){
	    		
	    		results = new String[nRows + 1][nCols+1];
	    		results[0][0] = "";
	    		for(int i = 0; i < metaData.length(); i++)
					results[0][i+1] = metaData.getString(i);
	    		for(int i = 0; i < nRows; i++){
	    			JSONArray row = values.getJSONArray(i);
	    			for(int j = 0; j < nCols; j++){
	    				results[i+1][j] = row.getString(j);
	    			}
	    		}
	    	}
	    		
	    	httpHandler.getResponse().setHeader("content-disposition","attachment");
			httpHandler.getResponse().setHeader("filename","export" + getExtension());
	    	setContentType();
	    	export(results);
    	
		} catch (JSONException e) {
			logger.error( Messages.getErrorString("CdfExpor.ERROR_0001_PARSING_RESULTS") );
		}
    }
    
    public boolean isDouble(String obj){
		try{
			Double.parseDouble(obj);
		}catch(NumberFormatException e){
			return false;
		}
		return true;
	}
}
