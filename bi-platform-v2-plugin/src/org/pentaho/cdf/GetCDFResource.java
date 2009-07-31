/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.pentaho.cdf;

import java.io.IOException;
import java.io.OutputStream;
import java.io.InputStream;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.platform.api.repository.ISolutionRepository;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import org.pentaho.platform.engine.core.messages.Messages;
import org.pentaho.platform.util.messages.LocaleHelper;
import org.pentaho.platform.web.servlet.ServletBase;
import org.pentaho.platform.util.StringUtil;

/**
 *
 * @author pedro
 */
public class GetCDFResource extends ServletBase {

    private static final long serialVersionUID = 8251622066287622726L;
    
    private static final Log logger = LogFactory.getLog(GetCDFResource.class);

    /** 
     * Processes requests for both HTTP <code>GET</code> and <code>POST</code> methods.
     * @param request servlet request
     * @param response servlet response
     */
    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
        throws ServletException, IOException {


        IPentahoSession session = getPentahoSession(request);
        String resource = request.getParameter("resource"); //$NON-NLS-1$

        if (resource == null || StringUtil.doesPathContainParentPathSegment(resource)) {
            error(Messages.getErrorString("GetResource.ERROR_0001_RESOURCE_PARAMETER_MISSING")); //$NON-NLS-1$
            response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            return;
        }
        String resourcePath = null;
        resourcePath = resource;

        if (resourcePath == null) {
            error(Messages.getErrorString("GetResource.ERROR_0002_INVALID_FILE", resource)); //$NON-NLS-1$
            response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            return;
        }
        ISolutionRepository repository = PentahoSystem.get(ISolutionRepository.class,session);// PentahoSystem.getSolutionRepository(session);
        InputStream in = repository.getResourceInputStream(resourcePath, true, ISolutionRepository.ACTION_EXECUTE);
        if (in == null) {
            error(Messages.getErrorString("GetResource.ERROR_0003_RESOURCE_MISSING", resourcePath)); //$NON-NLS-1$
            response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            return;
        }
        String mimeType = getServletContext().getMimeType(resourcePath);
        String resourceName = resourcePath;
        if (resourcePath.indexOf("/") != -1) { //$NON-NLS-1$
            resourceName = resourcePath.substring(resourcePath.lastIndexOf("/") + 1); //$NON-NLS-1$
        }
        //response.setHeader("content-disposition", "attachment;filename=" + resourceName); //$NON-NLS-1$ //$NON-NLS-2$
        if ((null == mimeType) || (mimeType.length() <= 0)) {
            // Hard coded to PNG because BIRT does not give us a mime type at
            // all...
            response.setContentType("image/png"); //$NON-NLS-1$
        } else {
            response.setContentType(mimeType);
        }
        response.setCharacterEncoding(LocaleHelper.getSystemEncoding());
        response.setHeader("expires", "0"); //$NON-NLS-1$ //$NON-NLS-2$
        // Open the input and output streams
        OutputStream out = response.getOutputStream();
        try {
            // Copy the contents of the file to the output stream
            byte[] buf = new byte[1024];
            int count = 0;
            int totalBytes = 0;
            while ((count = in.read(buf)) >= 0) {
                out.write(buf, 0, count);
                totalBytes += count;
            }
            response.setContentLength(totalBytes);
        } finally {
            in.close();
            out.close();
        }

    }

    public Log getLogger() {
        return logger;
    }
    // <editor-fold defaultstate="collapsed" desc="HttpServlet methods. Click on the + sign on the left to edit the code.">
    /** 
     * Handles the HTTP <code>GET</code> method.
     * @param request servlet request
     * @param response servlet response
     */
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
        throws ServletException, IOException {
        processRequest(request, response);
    }

    /** 
     * Handles the HTTP <code>POST</code> method.
     * @param request servlet request
     * @param response servlet response
     */
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
        throws ServletException, IOException {
        processRequest(request, response);
    }

    /** 
     * Returns a short description of the servlet.
     */
    public String getServletInfo() {
        return "Short description";
    }// </editor-fold>
}
