define([
        '../../../AddIn',
        '../../../Dashboard',
        '../../../dashboard/Utils',
        '../../../Logger',
        '../../../lib/jquery',
        'css!./trendArrow'
    ],
    function(AddIn, Dashboard, Utils, Logger, $, _) {
  
        var trendArrow = {
            
            name: "trendArrow",
            label: "trendArrow",
            
            defaults: {
                good: true,
                thresholds: {up: 0, down: 0},
                includeValue: false,
                cssClass: 'trendArrowContainer',
                layout: '<div>'+
                        '   <div class="value"> </div>' +
                        '   <div class="arrow"> </div>' +
                        '</div>'
            },
        
            init: function() { },
            
            implementation: function(tgt, st, opt) {
                var opts = $.extend(true, this.defaults, opt),
                    data = st.value,
                    $tgt = $(tgt),
                    $html = $(opt.layout).addClass(opts.cssClass),
                    greaterThan = (opt.good ? "up" : "down");
                    lessThan = (opt.good ? "down" : "up");
                    isNumeric = typeof st.value == "number" || (typeof st.value == "string" && Number(st.value).toString() != 'NaN'),    
                    qualityClass = opt.good ? "good" : "bad",
                    trendClass = !isNumeric ? "invalid" : (st.value > opts.thresholds.up ? "up" : st.value < opts.thresholds.down ? "down" : "equal"),
                $html.find('.arrow').addClass(qualityClass).addClass(trendClass);
                $html.find('.value').html((opt.includeValue) ? data : "");
                $tgt.empty().html($html);
            }
        
        };
        
        Dashboard.registerGlobalAddIn("Template", "templateType", new AddIn(trendArrow));
        
        return trendArrow;
    }
);
