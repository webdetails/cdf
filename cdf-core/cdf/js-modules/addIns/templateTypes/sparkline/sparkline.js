define([
       '../../../AddIn',
        '../../../Dashboard',
        '../../../dashboard/Utils',
        '../../../Logger',
        '../../../lib/jquery', 
        'amd!../../../lib/underscore',
        'amd!cdf/lib/jquery.sparkline',
        'css!./sparkline'
    ],
    function(AddIn, Dashboard, Utils, Logger, $, _, Mustache) {
        var sparkline = {
            name: "sparkline",
            label: "sparkline",
            defaults: {
                type: 'bar',
                cssClass: 'sparklineContainer',
                layout: '<div> {CONTENT} </div>'
            },
            
            init: function() { },
          
            implementation: function(tgt, st, opt) {
                var opts = $.extend(true, this.defaults, opt);
                var $tgt = $(tgt);
                var data = _.map(st.value.split(','), function(elem) {
                    return elem.trim();
                });
                $tgt.sparkline(data, opts);
                $tgt.removeClass('sparkline').addClass(opts.cssClass);
            }
        };
        
        Dashboard.registerGlobalAddIn("Template", "templateType", new AddIn(sparkline));
        
        return sparkline;
    }
);
    