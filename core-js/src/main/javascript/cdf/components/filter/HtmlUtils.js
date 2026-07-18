/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 - 2026 by Pentaho Canada Inc. : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2030-06-15
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
