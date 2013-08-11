package org.pentaho.cdf.xactions;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.IRuntimeContext;
import org.pentaho.platform.api.engine.ISolutionEngine;
import org.pentaho.platform.engine.services.solution.SolutionHelper;
import java.util.HashMap;
import java.io.OutputStream;

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

  public boolean executeAction(String resource, IPentahoSession userSession, OutputStream out, HashMap<String, String> params){
    ISolutionEngine engine = SolutionHelper.execute("executeAction", userSession, resource, params, out);
    int status = engine.getExecutionContext().getStatus();

    return status == IRuntimeContext.RUNTIME_STATUS_SUCCESS;
  }

}
