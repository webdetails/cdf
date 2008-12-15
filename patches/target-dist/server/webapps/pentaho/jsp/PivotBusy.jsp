<%@ page
  session="true"
  contentType="text/html;" 
  import="org.pentaho.platform.util.messages.LocaleHelper" %><%
	response.setCharacterEncoding(LocaleHelper.getSystemEncoding());
%>
<html>
<head>
  <title>JPivot is busy ...</title>
  <meta http-equiv="refresh" content="1; URL=<c:out value="${requestSynchronizer.resultURI}"/>">
</head>
<body bgcolor="white" dir="<%= LocaleHelper.getSystemEncoding() %>">

  <h2>JPivot is busy ...</h2>

  Please wait until your results are computed. Click
  <a href="<c:out value="${requestSynchronizer.resultURI}"/>">here</a>
  if your browser does not support redirects.

</body>
</html>
