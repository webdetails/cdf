define([
"cdf/lib/sanitizer/lib/html4",
"cdf/lib/sanitizer/lib/uri",
"cdf/lib/sanitizer"
],function(){
  return {
    sanitizeHtml: function(html){
	  // here is iframe explicitly replaced by script to further sanitizing since sanitizer itself doesn't sanitize iframe tag
	  html = html.replace(/<iframe\b[^>]*>/gi, "<script>").replace(/<\/iframe>/gi, "</script>");
	  html = Sanitizer.sanitize(html);
      return html;
    }
  }
});