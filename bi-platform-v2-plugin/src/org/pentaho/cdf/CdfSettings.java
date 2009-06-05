package org.pentaho.cdf;

import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.core.system.PentahoSystem;

public class CdfSettings  {
	
	
	private static CdfSettings cdfSettings = null;
	
	static CdfSettings getInstance() {
		if(cdfSettings == null) cdfSettings = new CdfSettings();
		return cdfSettings;
	}
	
	public void setValue(String name, Object obj, IPentahoSession userSession){
		 PentahoSystem.getCacheManager(userSession).putInSessionCache(userSession,name,obj);
	}
	
	public Object getValue(String name, IPentahoSession userSession){
		return PentahoSystem.getCacheManager(userSession).getFromSessionCache(userSession, name);
	}
	
}
