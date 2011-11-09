package org.pentaho.cdf.utils;

import java.util.UUID;

import org.pentaho.platform.api.engine.ILogger;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.core.audit.AuditHelper;
import org.pentaho.platform.engine.core.audit.MessageTypes;

/**
 * 
 * This class helps the audit on CDF 
 * 
 * @author dduque
 * @date Feb, 28, 2010
 */
public class CdfAuditHelper {
	
	/**
	 * 
	 * Start Audit Event
	 *  
	 * @param actionName  Name of the action
	 * @param objectName Object of the action
	 * @param userSession Pentaho User Session 
	 * @param logger Logger object
	 * @return  UUID of start event
	 */
	static public UUID startAudit(String actionName, String objectName, IPentahoSession userSession,ILogger logger) {
		UUID uuid=UUID.randomUUID();
		AuditHelper.audit(userSession.getId(), userSession.getName(), actionName, objectName, userSession.getProcessId(),
				MessageTypes.INSTANCE_START, uuid.toString(), "", 0, logger);

		AuditHelper.audit(uuid.toString(), userSession.getName(), actionName, objectName, userSession.getProcessId(),
				MessageTypes.COMPONENT_EXECUTE_START,  "start", "", 0, logger);
		return uuid;
	}
	
	/**
	 * 
	 * End Audit Event
	 * 
	 * @param actionName Name of the action
	 * @param objectName Object of the action
	 * @param userSession Pentaho User Session 
	 * @param logger Logger object
	 * @param start Start time in Millis Seconds 
	 * @param uuid  UUID of start event
	 * @param end End time in Millis Seconds
	 */
	static public void endAudit(String actionName, String objectName, IPentahoSession userSession,ILogger logger, long start,UUID uuid, long end) {
		AuditHelper.audit(uuid.toString(), userSession.getName(), actionName, objectName, userSession.getProcessId(),
				MessageTypes.COMPONENT_EXECUTE_END, "end", "", ((float) (end - start) / 1000), logger);

		AuditHelper.audit(userSession.getId(), userSession.getName(), actionName, objectName, userSession.getProcessId(),
				MessageTypes.INSTANCE_END, uuid.toString(),"", ((float) (end - start) / 1000), logger);
	}

}
