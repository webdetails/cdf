/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package pt.webdetails.cdf;

import org.json.JSONException;
import org.pentaho.core.repository.ISolutionRepository;
import org.pentaho.core.session.IPentahoSession;
import org.pentaho.core.system.PentahoSystem;
import org.dom4j.Document;
import org.json.JSONObject;
import org.json.XML;

/**
 *
 * @author pedro
 */
public class NavigateComponent {

    ISolutionRepository solutionRepository = null;
    
    public NavigateComponent(IPentahoSession userSession) {
        
        solutionRepository = PentahoSystem.getSolutionRepository(userSession);
        
    }
    
    public String getNavigationElements(String solution, String path) throws JSONException{
    
        //Document navDoc = solutionRepository.getSolutions(solution, path, ISolutionRepository.ACTION_EXECUTE,true);
         Document navDoc = solutionRepository.getSolutions(null, null, ISolutionRepository.ACTION_EXECUTE,true);
        //Document navDoc = solutionRepository.getSolutionTree(ISolutionRepository.ACTION_EXECUTE);
        
        JSONObject json = XML.toJSONObject(navDoc.asXML());
        return json.toString(1);

    }
    

}
