define([
       '../../../AddIn',
        '../../../Dashboard',
        '../../../dashboard/Utils',
        '../../../Logger',
        '../../../lib/jquery', 
        'amd!../../../lib/underscore'
    ],
    function(AddIn, Dashboard, Utils, Logger, $, _) {
  
        var formatted = {
            
            name: "formatted",
            label: "formatted",
            
            defaults: {
                formatFunction: 'numberFormat',
                formatMask: '#,#.#',
                applyFormat: function(value) {
                    return _.isFunction(Utils[this.formatFunction]) ? Utils[this.formatFunction](value, this.formatMask) : value;
                },
                cssClass: 'formatterContainer',
                layout: '<div> {CONTENT} </div>' 
            },
        
            init: function() { },
            
            implementation: function(tgt, st, opt) {
                var opts = $.extend(true, this.defaults, opt);
                var data = _.isFunction(opts.applyFormat) ? opts.applyFormat(st.value) : st.value;
                var $tgt = $(tgt);
                var $html = $(opts.layout.replace('{CONTENT}', data)).addClass(opts.cssClass);
                $tgt.empty().html($html);
            }
        
        };
        
        Dashboard.registerGlobalAddIn("Template", "templateType", new AddIn(formatted));
        
        return formatted;
    }
);
