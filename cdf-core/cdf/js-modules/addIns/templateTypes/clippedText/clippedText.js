define([
        '../../../AddIn',
        '../../../Dashboard',
        '../../../dashboard/Utils',
        '../../../Logger',
        '../../../lib/jquery', 
        'amd!../../../lib/underscore',
        '../../../lib/CCC/tipsy',
        'css!./clippedText'
    ],
    function(AddIn, Dashboard, Utils, Logger, $, _) {
  
        var clippedText = {
            
            name: "clippedText",
            label: "clippedText",
            
            defaults: {
                showTooltip: true,
                useTipsy: true,
                applyFormat: function(value) {
                    return value;
                },
                cssClass: 'clippedTextContainer',
                layout: '<div> {CONTENT} </div>'
            },
        
            init: function() { },
            
            implementation: function(tgt, st, opt) {
                var opts = $.extend(true, this.defaults, opt);
                var data = _.isFunction(opts.applyFormat) ? opts.applyFormat(st.value) : st.value;
                var $tgt = $(tgt);
                var $html = $(opts.layout.replace('{CONTENT}', data)).addClass(opts.cssClass);
                $html.attr('title', opts.showTooltip ? data: "");
                $tgt.empty().html($html);
                if(opts.useTipsy) { 
                    $html.tipsy({ gravity: 's', html: false });
                }
            }
        };
        
        Dashboard.registerGlobalAddIn("Template", "templateType", new AddIn(clippedText));
        
        return clippedText;
    }
);
