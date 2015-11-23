define([
  '../../lib/jquery'
], function($) {
  return {
    name: "hyperlink",
    label: "hyperlink",
    defaults: {
      openInNewTab: true,
      prependHttpIfNeeded: true,
      regexp: null,
      pattern: null,
      urlReference: 2,
      labelReference: 1,
      cssClass: 'hyperlinkContainer',
      layout: '<a></a>'
    },

    init: function() { },

    implementation: function(tgt, st, opt) {
      var $tgt = $(tgt),
          link,
          label;

      if(opt.pattern) {
        var re = new RegExp(opt.pattern);
        var results = []; st.value.replace(re, function(g0, g1) { results.push(g1); });
        link = results[opt.urlReference];
        label = results[opt.labelReference];
      } else {
        link = st.value;
        label = st.value;
      }
      if(opt.prependHttpIfNeeded && !/^https?:\/\//.test(link)) {
        link = "http://" + link;
      }
      // is this text an hyperlink?
      if(opt.regexp == null || (new RegExp(opt.regexp).test(st.value))) {
        var $a = $(opt.layout).attr("href", link).text(label);
        if(opt.openInNewTab) {
          $a.attr("target", "_blank");
        }
        $tgt.empty().append($a);
      }
    }
  };
});
