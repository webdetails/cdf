define([
        '../../../AddIn',
        '../../../Dashboard',
        '../../../dashboard/Utils',
        '../../../Logger',
        '../../../lib/jquery', 
        'amd!../../../lib/underscore',
        '../../../lib/CCC/pvc',
    ],
     function(AddIn, Dashboard, Utils, Logger, $, _, pvc) {
  
        var cccChart = {
            
            name: "cccChart",
            label: "cccChart",
            
            defaults: {
                
                type: 'BarChart',
                chartOpts: {
                    compatVersion: 2,
                    height: 100,
                    animate: false,
                    crosstabMode: false,
                    seriesInRows: false,
                    timeSeries: false,
                    
                },
            
                transformData: function(data) {
                    var result = { metadata: [], resultset: []};
                    try {
                        data = JSON.parse(data);
                        var colMetadata = [];
                        _.each(data, function(row, index) {
                            if (index == 0) {
                                _.each(row, function(col, index) {
                                    result.metadata.push({colIndex: index, colName: "Col"+index, colType: "String"});
                                });
                            }
                            result.resultset.push(row);
                        });
                        
                    } catch(e) {
                        return null;
                    }
                    return result;
                },
                layout: '<span> {CONTENT} </span>' ,
                cssClass: 'cccChartContainer' ,
            },
        
            init: function() { },
            
            implementation: function(tgt, st, opt) {
                var opts = $.extend(true, this.defaults, opt),
                    data = _.isFunction(opts.transformData) ? opts.transformData(st.value): st.value;
                    $html = $(opts.layout.replace('{CONTENT}', data)).addClass(opts.cssClass),
                    $tgt = $(tgt),
                    $target = $(opt.layout).appendTo($tgt.empty());
                if (data) {
                    opts.chartOpts.canvas = $target.get(0);
                    opts.chartOpts.width = opts.width || $tgt.width();
                    opts.chartOpts.bulletMeasures = [data[0]];
                    opts.chartOpts.bulletMarkers = [data[1]];
                    var chart = new pvc[opts.type](opts.chartOpts);
                    chart.setData(data, {});
                    chart.render();
                }
            }
        
        };
        
        Dashboard.registerGlobalAddIn("Template", "templateType", new AddIn(cccChart));
        
        return cccChart;
    }
);
