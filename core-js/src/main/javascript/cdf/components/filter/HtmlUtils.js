/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/
define(["cdf/lib/sanitizer"], function(Sanitizer) {
  return {
    sanitizeHtml: function(html) {
      // here is iframe explicitly replaced by script to further sanitizing since sanitizer itself doesn't sanitize iframe tag
      html = html.replace(/<iframe\b[^>]*>/gi, "<script>").replace(/<\/iframe>/gi, "</script>");
      html = Sanitizer.sanitize(html);
      return html;
    }
  }
});
