/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
package pt.webdetails.cpf;

import java.io.IOException;
import java.io.OutputStream;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.repository.IContentItem;
import org.pentaho.platform.engine.services.solution.BaseContentGenerator;
import pt.webdetails.cpf.annotations.AccessLevel;
import pt.webdetails.cpf.annotations.Exposed;
import pt.webdetails.cpf.annotations.OutputType;

/**
 *
 * @author pdpi
 */
public class SimpleContentGenerator extends BaseContentGenerator {

    private static final long serialVersionUID = 1L;
    protected Log logger = LogFactory.getLog(this.getClass());

    @Override
    public void createContent() {
        IParameterProvider pathParams = parameterProviders.get("path");
        //requestParams = parameterProviders.get("request");
        final IContentItem contentItem = outputHandler.getOutputContentItem("response", "content", "", instanceId, "text/html");

        try {
            final OutputStream out = contentItem.getOutputStream(null);
            final Class<?>[] params = {OutputStream.class};

            String[] pathSections = StringUtils.split(pathParams.getStringParameter("path", null), "/");

            if (pathSections != null && pathSections.length > 0) {

                final String method = StringUtils.lowerCase(pathSections[0]);

                try {
                    final Method mthd = this.getClass().getMethod(method, params);
                    boolean exposed = mthd.isAnnotationPresent(Exposed.class),
                            accessible = exposed && mthd.getAnnotation(Exposed.class).accessLevel() == AccessLevel.PUBLIC,
                            outputTypePresent = mthd.isAnnotationPresent(OutputType.class) ;

                    String outputType = outputTypePresent? mthd.getAnnotation(OutputType.class).value() : "";
                    if (outputTypePresent) {
                        setResponseHeaders(outputType, null);
                    }
                    if (accessible) {
                        mthd.invoke(this, out);
                    } else {
                        throw new IllegalAccessException("Method " + method + " has the wrong access level");
                    }
                } catch (NoSuchMethodException e) {
                    logger.warn("could't locate method: " + method);
                } catch (InvocationTargetException e) {
                    logger.error(e.toString());

                } catch (IllegalAccessException e) {
                    logger.warn(e.toString());

                } catch (IllegalArgumentException e) {

                    logger.error(e.toString());
                }
            } else {
                logger.error("No method supplied.");
            }
        } catch (SecurityException e) {
            logger.warn(e.toString());
        } catch (IOException e) {
            logger.error(e.toString());
        }
    }

    @Override
    public Log getLogger() {
        return logger;
    }

    private void setResponseHeaders(final String mimeType, final String attachmentName) {
        // Make sure we have the correct mime type
        final HttpServletResponse response = (HttpServletResponse) parameterProviders.get("path").getParameter("httpresponse");
        if (response == null) {
            return;
        }

        response.setHeader("Content-Type", mimeType);

        if (attachmentName != null) {
            response.setHeader("content-disposition", "attachment; filename=" + attachmentName);
        }

        // We can't cache this request
        response.setHeader("Cache-Control", "max-age=0, no-store");
    }
}
