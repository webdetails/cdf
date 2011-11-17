(function() {

  /* Sparkline AddIn, based on jquery.sparkline.js sparklines.
   * 
   */
  var sparkline = {
    name: "sparkline",
    label: "Sparkline",
    defaults: {
      type: 'line'
    },
    implementation: function (tgt, st, opt) {
      var t = $(tgt);
      t.sparkline(st.value.split(/,/),opt);
      t.removeClass("sparkline");
    }
  };
  Dashboards.registerAddIn("Table", "colType", new AddIn(sparkline));

  pvSparkline = {
    name: "pvSparkline",
    label: "Protovis Sparkline",
    defaults: {
      height: 10,
      strokeStyle: "#000",
      lineWidth: 1,
      width: undefined,
      canvasMargin: 2
    },
    implementation: function(tgt, st, opt) {
      var ph = $(tgt),
        sparklineData = st.value,
        data = sparklineData.split(",");
        n = data.length,
        w = opt.width || ph.width(),
        h = opt.height,
        min = pv.min.index(data),
        max = pv.max.index(data);
        ph.empty();
    
        var container = $("<div></div>").appendTo(ph);
    
        //console.log("count "+count);
    
        var vis = new pv.Panel()
            .canvas(container.get(0))
            .width(w)
            .height(h)
            .margin(opt.canvasMargin);
    
        vis.add(pv.Line)
            .data(data)
            .left(pv.Scale.linear(0, n - 1).range(0, w).by(pv.index))
            .bottom(pv.Scale.linear(data).range(0, h))
            .strokeStyle(opt.strokeStyle)
            .lineWidth(opt.lineWidth);        

        vis.render();

      
    }
  };
  Dashboards.registerAddIn("Table", "colType", new AddIn(pvSparkline));

 dataBar = {
    name: "dataBar",
    label: "Data Bar",
    defaults: {
      height: 10,
      startColor: "#55A4D6",
      endColor: "#448FC8",
      stroke: null,
      max: undefined
    },
    implementation: function(tgt, st, opt) {
      var max = opt.max || Math.max.apply(Math,st.tableData.map(function(e){return Math.abs(e[st.colIdx]);}));
      var ph = $(tgt);
      var wtmp = ph.width();
      var htmp = opt.height;

      var value = st.value;
      ph.empty();

      var paper = Raphael(tgt, wtmp, htmp);

      var xx = pv.Scale.linear(0,max).range(0,wtmp);

      var leftVal=0, rightVal=parseFloat(value);
      if(leftVal>rightVal){
      	leftVal = value;
      	rightVal = 0;
      }

      var c = paper.rect(xx(leftVal), 0, xx(rightVal) - xx(leftVal), htmp);

      c.attr({
      	fill: "90-"+opt.startColor + "-" + opt.endColor,
      	stroke: opt.stroke,
      	title: "Value: "+ value
      });

    }
  };
  Dashboards.registerAddIn("Table", "colType", new AddIn(dataBar));

  trendArrow = {
    name: "trendArrow",
    label: "Trend Arrows",
    defaults: {
      includeValue: false,
      valueFormat: function(v,format) {return sprintf(format,v);}
    },
    implementation: function(tgt, st, opt) {
      var ph = $(tgt),
        trendClass =  st.value < 0 ? "down" : "up";
      var trend = $("<div>&nbsp;</div>");
      trend.addClass('trend');
      trend.addClass(trendClass);
      ph.empty();
      if(opt.includeValue) {
        ph.append(opt.valueFormat(st.value, st.colFormat));
      }
      ph.append(trend);
    }
  };
  Dashboards.registerAddIn("Table", "colType", new AddIn(trendArrow));

 
})();


