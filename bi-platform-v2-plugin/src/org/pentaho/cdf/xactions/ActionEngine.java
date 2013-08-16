package org.pentaho.cdf.xactions;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.cdf.utils.Util;
import org.pentaho.platform.api.engine.IMimeTypeListener;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.IRuntimeContext;
import org.pentaho.platform.api.engine.ISolutionEngine;
import org.pentaho.platform.api.repository2.unified.IUnifiedRepository;
import org.pentaho.platform.api.repository2.unified.RepositoryFile;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.engine.services.solution.SolutionHelper;
import org.pentaho.platform.util.messages.LocaleHelper;
import org.pentaho.platform.web.http.api.resources.XactionUtil;

import java.util.HashMap;
import java.io.IOException;
import java.io.OutputStream;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class ActionEngine {

  private static final Log logger = LogFactory.getLog(ActionEngine.class);
  private static ActionEngine instance;

  public static synchronized ActionEngine getInstance() {
    if (instance == null) {
      instance = new ActionEngine();
    }
    return instance;
  }

  public ActionEngine() {
    logger.info("Creating ActionEngine instance");
  }

  @Deprecated
  public boolean executeAction(String resource, IPentahoSession userSession, OutputStream out, HashMap<String, String> params){
    ISolutionEngine engine = SolutionHelper.execute("executeAction", userSession, resource, params, out);
    int status = engine.getExecutionContext().getStatus();

    return status == IRuntimeContext.RUNTIME_STATUS_SUCCESS;
  }
  
  public boolean executeAction(String path, String contentType, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, IPentahoSession userSession, HashMap<String, String> params, IMimeTypeListener mimeTypeListener) throws IOException{
	  
	  boolean success = false;
	  
	  try{
	  
		  IUnifiedRepository unifiedRepository = PentahoSystem.get(IUnifiedRepository.class, null);
	      RepositoryFile file = unifiedRepository.getFile(path);
		  
		  String buffer = XactionUtil.execute(contentType, file, httpServletRequest, httpServletResponse, userSession, mimeTypeListener);
		  
	      if (!Util.isEmpty(buffer)) {
	    	  httpServletResponse.getOutputStream().write(buffer.getBytes(LocaleHelper.getSystemEncoding()));
	      }
	
	      success = true;
      
	  } catch(Throwable t){
		logger.error(t);
		httpServletResponse.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, t.getMessage());
	  }
	  
	  return success;
  }
}
