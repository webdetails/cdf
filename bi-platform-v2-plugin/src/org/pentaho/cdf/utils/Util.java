package org.pentaho.cdf.utils;

import java.util.Enumeration;
import java.util.HashMap;

import javax.servlet.http.HttpServletRequest;

/**
 * Created by IntelliJ IDEA.
 * User: pedro
 * Date: Feb 2, 2010
 * Time: 3:37:46 PM
 */
public class Util {

  public static String getExceptionDescription(final Exception e) {

    final StringBuilder out = new StringBuilder();
    out.append("[ ").append(e.getClass().getName()).append(" ] - ");
    out.append(e.getMessage());

    if (e.getCause() != null) {
      out.append(" .( Cause [ ").append(e.getCause().getClass().getName()).append(" ] ");
      out.append(e.getCause().getMessage());
    }

    e.printStackTrace();
    return out.toString();

  }
  
  /**
   * Extracts a string between after the first occurrence of begin, and before the last occurence of end
   * @param source From where to extract
   * @param begin
   * @param end
   * @return
   */
  public static String getContentsBetween(final String source, final String begin, final String end){
  	if(source == null) return null;
  	
  	int startIdx = source.indexOf(begin) + begin.length();
  	int endIdx = source.lastIndexOf(end);
  	if(startIdx < 0 || endIdx < 0) return null;
  	
  	return source.substring(startIdx, endIdx);
  }
  
  public static final boolean IsNullOrEmpty(final String str){
  	return (str == null || str.trim().length() == 0);
  }
  
  /**
   * extracts all request parameters from a given http request
   * @param request HttpServletRequest
   * @return HashMap where (key,value) = (paramName, paramValue)
   */
  public static HashMap<String,String> getRequestParameters(HttpServletRequest request){
	  
	  HashMap<String, String> params = new HashMap<String, String>();
	  
	  if(request != null && request.getParameterMap() != null && request.getParameterMap().size() > 0){
		  @SuppressWarnings("rawtypes")
		  Enumeration enumeration = request.getParameterNames();
		  
		  while (enumeration.hasMoreElements()) {
	        String param = (String)enumeration.nextElement();
	        params.put(param, request.getParameter(param));
	      }
	  }
	  
	  return params;
  }
  
  /**
   * a string is deemed 'empty' when it is null or when its trimmed size is zero
   * @param s string to check
   * @return true if empty, false otherwise
   */
  public static boolean isEmpty(String s){
	  return s == null || s.trim().equals("");
  }
}
