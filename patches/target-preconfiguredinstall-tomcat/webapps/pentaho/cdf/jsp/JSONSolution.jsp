<%@page contentType="text/plain" pageEncoding="UTF-8" language="java" 
        import="
        pt.webdetails.cdf.*,
        pt.webdetails.cdf.test.*,
        org.pentaho.messages.util.LocaleHelper,
        org.pentaho.core.system.PentahoSystem,
        org.pentaho.core.session.IPentahoSession,
        org.pentaho.core.util.UIUtil,
        org.pentaho.core.solution.HttpRequestParameterProvider,
        org.pentaho.core.solution.HttpSessionParameterProvider
        "%><%
        response.setCharacterEncoding(LocaleHelper.getSystemEncoding());
        HttpSession httpSession = request.getSession();

        String baseUrl = PentahoSystem.getApplicationContext().getBaseUrl();

        IPentahoSession userSession = UIUtil.getPentahoSession(request);

        HttpRequestParameterProvider requestParameters = new HttpRequestParameterProvider(request);
        HttpSessionParameterProvider sessionParameters = new HttpSessionParameterProvider(userSession);

        String solution = request.getParameter("solution");
        String path = request.getParameter("path");
        String mode = request.getParameter("mode");

        if ("".equals(solution)) {
            solution = null;
        }
        if (path == null) {
            path = "";
        }
        if (mode == null) {
            mode = "";
        }


        NavigateComponent nav = new NavigateComponent(userSession);
        // test = nav.getNavigationElements(solution, path); //we want the entire tree
        String json = nav.getNavigationElements(mode, solution, path);

%><%= json %>
