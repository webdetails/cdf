define([
       '../../../AddIn',
        '../../../Dashboard',
        '../../../dashboard/Utils',
        '../../../Logger',
        '../../../lib/jquery'
    ],
    function(AddIn, Dashboard, Utils, Logger, $) {
        var hyperlink = {
            name: "hyperlink",
            label: "hyperlink",
            defaults: {
                openInNewTab: true,
                prependHttpIfNeeded: true,
                regexp: null,
                pattern: null,
                urlReference: 1,
                labelReference: 0,
                cssClass: 'hyperlinkContainer',
                layout: '<div> {CONTENT} </div>'
            },
        
            init: function() { },
            
            implementation: function(tgt, st, opt) {
                var opts = $.extend(true, this.defaults, opt);
                var $tgt = $(tgt);
                var $html = $(opts.layout).addClass();
                var link, 
                    label;
                if(opts.pattern) {
                    var re = new RegExp(opts.pattern),
                        results = [];
                    st.value.replace(re, function(g0, g1){ results.push(g1);});
                    link = results[opts.urlReference];
                    label = results[opts.labelReference];
                } else {
                    link = st.value;
                    label = st.value;
                }
                if(opts.prependHttpIfNeeded && !/^https?:\/\//.test(link)) {
                    link = "http://" + link;
                }
                if(opts.regexp === null || (new RegExp(opts.regexp).test(st.value))) {
                    var $a = $('<a></a>').attr("href", link).text(label);
                    if(opts.openInNewTab) {
                        $a.attr("target", "_blank");
                    }
                    $tgt.empty().append($html.html($a));
                }
            }
        };
        
        Dashboard.registerGlobalAddIn("Template", "templateType", new AddIn(hyperlink));
        
        return hyperlink;
    }
);
