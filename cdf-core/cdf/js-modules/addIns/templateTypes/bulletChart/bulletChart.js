define([
        '../../../AddIn',
        '../../../Dashboard',
        '../../../dashboard/Utils',
        '../../../Logger',
        '../../../lib/jquery', 
        '../../../lib/CCC/pvc'
    ],
    function(AddIn, Dashboard, Utils, Logger, $, pvc) {
  
        var bulletChart = {
            
            name: "bulletChart",
            label: "bulletChart",
            
            defaults: {
                layout: '<span></span>' ,
                chartOpts: {
                    compatVersion: 2,
                    //title: false,
                    height: 60,
                    animate: false,
                    orientation: "horizontal",
                    bulletSize: 16,    
                    bulletSpacing: 150,
                    bulletMargin: 5, 
                    bulletRanges: [30, 80, 100],
                    bulletTitle: "",
                    extensionPoints: {
                        "bulletMarker_shape": "circle",
                        "bulletTitle_textStyle": "#fff",
                        "bulletMeasure_fillStyle": "#666",
                        "bulletRuleLabel_font": "8px sans-serif",
                        "bulletRule_height": 5
                    }
                }
            },
        
            init: function() { },
            
            implementation: function(tgt, st, opt) {
                var opts = $.extend(true, this.defaults, opt.chartOpts),
                    data = this.getData(st.value.split(",")),
                    $html = $(opts.layout.replace('{CONTENT}', data)),
                    $tgt = $(tgt),
                    $target = $(opt.layout).appendTo($tgt.empty());
                opts.canvas = $target.get(0);
                opts.width = opts.width || $tgt.width();
                opts.bulletMeasures = [data[0]];
                opts.bulletMarkers = [data[1]];
                var chart = new pvc.BulletChart(opts);
                chart.setData(data, {});
                chart.render();
            },
            
            getData: function(values) {
                var dataSet = {resultset: [values], metadata: []};
                for(var i = 0; i < values.length;i++) {
                    dataSet.metadata.push({colIndex: i, colType: "String", colName: ""});
                }
                return dataSet;
            }
        
        };
        
        Dashboard.registerGlobalAddIn("Template", "templateType", new AddIn(bulletChart));
        
        return bulletChart;
    }
);
