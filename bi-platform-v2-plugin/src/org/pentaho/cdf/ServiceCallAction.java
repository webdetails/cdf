package org.pentaho.cdf;

import java.io.OutputStream;
import java.util.HashMap;
import java.util.Iterator;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.IRuntimeContext;
import org.pentaho.platform.api.engine.ISolutionEngine;
import org.pentaho.platform.engine.services.solution.SolutionHelper;

public class ServiceCallAction  {

	private static ServiceCallAction serviceCallAction = null;
	
	static ServiceCallAction getInstance() {
		if(serviceCallAction == null) serviceCallAction = new ServiceCallAction();
		return serviceCallAction;
	}
	
	
	@SuppressWarnings("unchecked")
	public boolean execute(IParameterProvider requestParams,IPentahoSession userSession, OutputStream out){
		
		
		String solutionName = requestParams.getStringParameter("solution","");
	    String actionPath = requestParams.getStringParameter("path","");
	    String actionName = requestParams.getStringParameter("action","");
	    actionPath = actionPath.startsWith("/") || solutionName.endsWith("/") ? actionPath : "/" + actionPath;
	    actionPath = actionPath.endsWith("/") || actionName.startsWith("/") ? actionPath : actionPath + "/";
	    

	    Iterator<String> keys =  requestParams.getParameterNames();
	    HashMap<String, String> parameters = new HashMap<String, String>();
	    while(keys.hasNext()){
	    	String key = keys.next();
	    	parameters.put(key, requestParams.getStringParameter(key,null));
	    }
	    
	    ISolutionEngine engine = SolutionHelper.execute("executeAction", userSession, solutionName + actionPath + actionName, parameters, out);
	    int status = engine.getExecutionContext().getStatus();
	    
	    return status == IRuntimeContext.RUNTIME_STATUS_SUCCESS;
	    	
	}

}
