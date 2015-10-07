define([
        '../../../AddIn',
        '../../../Dashboard',
        '../../../dashboard/Utils',
        '../../../Logger',
        '../../../lib/jquery', 
        'amd!../../../lib/underscore',
        '../../../lib/CCC/tipsy'
    ],
    function(AddIn, Dashboard, Utils, Logger, $, _) {
  
        var bubble = {
            
            name: "bubble",
            label: "bubble",
            
            defaults: {
                containerSize: 30,
                radius: function(st) {
                    var colNames =  _.map(st.data.metadata, function(elem){
                        return elem.colName;
                    });
                    var colIdx = _.indexOf(colNames, st.id);
                    var values = st.data.resultset.map(function(e){
                        return Number(e[colIdx]);
                    });
                    var tblMax = _.max(values),
                        tblMin = _.min(values);
                    var value = Number(st.value),
                        size = (value-tblMin)/(tblMax-tblMin);
                    return size*100;
                },
                color: function(st) {
                    return "rgba(200, 200, 200 , 0.6)";
                },
                title: function(st, opt) { 
                    return "Value: " + st.value; 
                },
                cssClass: "bubbleContainer",
                layout: '<div> {CONTENT} </div>' 
            },
        
            init: function() { },
            
            implementation: function(tgt, st, opt) {
                var opts = $.extend(true, this.defaults, opt),
                    data = st.value,
                    options = {},
                    $tgt = $(tgt);
                
                for(var key in opts) if(opt.hasOwnProperty(key)) {
                    op = opts[key];
                    options[key] = typeof op == 'function' ? op.call(this, st, opt) : op;
                }
                
                var props = {
                    'width':options.radius+"%", 
                    'height':options.radius+"%", 
                    'border-radius': '100%', 
                    'background-color': options.color,
                    'display': 'inline-block',
                    'text-align': 'center',
                    'vertical-align': 'middle'
                };
                var $bubble = $('<div></div>').attr('title', options.title).css(props);
                
                var $html = $(options.layout.replace('{CONTENT}', "")).addClass(options.cssClass).append($bubble).css({'width':options.containerSize, 'height':options.containerSize});
                $tgt.empty().html($html);
            }
        };
        
        Dashboard.registerGlobalAddIn("Template", "templateType", new AddIn(bubble));
        
        return bubble;
    }
);
