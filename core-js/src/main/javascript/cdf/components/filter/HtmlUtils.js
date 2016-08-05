define(function(){
  return {
    sanitizeHtml: function(html){
	  html = html.replace(/<script\b[^>]*>/gi, "&lt;script&gt;").replace(/<\/script>/gi, "&lt;/script&gt;");
	  html = html.replace(/<iframe\b[^>]*>/gi, "&lt;iframe&gt;").replace(/<\/iframe>/gi, "&lt;/iframe&gt;");
	  html = html.replace(/<html\b[^>]*>/gi, "&lt;html&gt;").replace(/<\/html>/gi, "&lt;/html&gt;");
	  html = html.replace(/<body\b[^>]*>/gi, "&lt;body&gt;").replace(/<\/body>/gi, "&lt;/body&gt;");
      return html;
    }
  }
});