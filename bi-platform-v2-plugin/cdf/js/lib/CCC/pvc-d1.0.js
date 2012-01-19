if(!Object.keys) {
	Object.keys = function(o){
		if (o !== Object(o)){
			throw new TypeError('Object.keys called on non-object');
		}
		
		var ret=[];
		for(var p in o) 
			if(Object.prototype.hasOwnProperty.call(o,p)) 
				ret.push(p);
		return ret;
	};
}

var pvc = {
  debug: false
};

// Begin private scope
(function(){
    
/**
 *  Utility function for logging messages to the console
 */
pvc.log = function(m){

    if (typeof console != "undefined" && pvc.debug){
        console.log("[pvChart]: " + m);
    }
};

/**
 * Evaluates x if it's a function or returns the value otherwise
 */
pvc.ev = function(x){
    return typeof x == "function"?x():x;
};

pvc.sumOrSet = function(v1,v2){
    return typeof v1 == "undefined"?v2:v1+v2;
};

pvc.nonEmpty = function(d){
    return d != null;
};

pvc.get = function(o, p, dv){
    var v;
    return o && (v = o[p]) != null ? v : dv; 
};

pvc.number = function(d, dv){
    var v = parseFloat(d);
    return isNaN(d) ? (dv || 0) : v;
};

pvc.nullTo = function(v, dv){
    return v != null ? v : dv;
};

pvc.padMatrixWithZeros = function(d){
    return d.map(function(v){
        return v.map(function(a){
            return typeof a == "undefined"?0:a;
        });
    });
};

pvc.padArrayWithZeros = function(a){
    return a.map(function(d){
        return d == null ? 0 : d;
    });
};

pvc.cloneMatrix = function(m){
    return m.map(function(d){
        return d.slice();
    });
};

/**
 *ex.: arrayStartsWith(['EMEA','UK','London'], ['EMEA']) -> true
 *     arrayStartsWith(a, a) -> true
 **/
pvc.arrayStartsWith = function(array, base){
    if(array.length < base.length) { 
		return false; 
	}
    
    for(var i=0; i<base.length;i++){
        if(base[i] != array[i]) {
            return false;
        }
    }
    
	return true;
};

/**
 * Equals for two arrays
 * func - needed if not flat array of comparables
 **/
pvc.arrayEquals = function(array1, array2, func)
{
  if(array1 == null){return array2 == null;}
  
  var useFunc = typeof(func) == 'function';
  
  for(var i=0;i<array1.length;i++)
  {
    if(useFunc){
        if(!func(array1[i],array2[i])){
            return false;
        }
    }
    else if(array1[i]!=array2[i]){
        return false;   
    }
  }
  return true;
};

/**
 * Converts something to an array if it is not one already
 *  an if it is not equal (==) to null.
*/
pvc.toArray = function(thing){
	return (thing instanceof Array) ? thing : ((thing != null) ? [thing] : null);
};

var arraySlice = pvc.arraySlice = Array.prototype.slice;

/**
 * Creates a color scheme based on the specified colors.
 * The default color scheme is "pv.Colors.category10", 
 * and is returned when null or an empty array is specified.
 */
pvc.createColorScheme = function(colors){
	if (colors == null || colors.length == 0){
		return pv.Colors.category10;
	}
	
	colors = pvc.toArray(colors);
	
	return function() {
		var scale = pv.colors(colors);
		scale.domain.apply(scale, arguments);
		return scale;
	};
};

pvc.removeTipsyLegends = function(){
    try {
        $('.tipsy').remove();
    } catch(e) {
        // Do nothing
    }
};

pvc.compareNatural = function(a, b){
	return (a < b) ? -1 : ((a > b) ? 1 : 0);
};


/* Protovis Z-Order support */

// Default values
pv.Mark.prototype._zOrder = 0;

pv.Panel.prototype._hasZOrderChild = false;
pv.Panel.prototype._needChildSort  = false;

pv.Mark.prototype.zOrder = function(zOrder) {
    if(!arguments.length){
        return this._zOrder;
    }
    
    if(this._zOrder !== zOrder){
        this._zOrder = zOrder;
        
        if(this.parent){
            this.parent._hasZOrderChild = 
            this.parent._needChildSort  = true;
        }
    }
    
    return this;
};

// Copy normal methods' version
var markRender = pv.Mark.prototype.render,
    panelAdd   = pv.Panel.prototype.add;

pv.Panel.prototype.add = function(){
    this._needChildSort = this._needChildSort || this._hasZOrderChild;
    
    return panelAdd.apply(this, arraySlice.call(arguments));
};

pv.Mark.prototype.render = function(){
    // ensure zOrder is up to date
    sortChildren.call(this);
    markRender.apply(this, arraySlice.call(arguments));
};

function sortChildren(){
    // Sort children by their Z-Order
    var children = this.children, L;
    if(children && (L = children.length)){
        var needChildSort = this._needChildSort;
        if(needChildSort){
            children.sort(function(m1, m2){
                return pvc.compareNatural(m1._zOrder, m2._zOrder);
            });
            
            this._needChildSort = false;
        }
        
        // Fix childIndex and apply recursively
        for(var i = 0 ; i < L ; i++){
            var child = children[i]; 
            if(needChildSort) { 
                child.childIndex = i; 
            }
            
            if(child instanceof pv.Panel){
                sortChildren.call(child);
            }
        }
    }
}

/* TICKS */
/**
 * An alternative implementation of QuantitativeScale#ticks
 * that ensures that:
 * (i) the returned ticks include the min. and max. domain values, 
 * (ii) the scale's domain is extended, 
 *      when the calculated ticks so demand and
 * (iii) the resulting ticks are cached.
 * <br/>
 * Only scales with numeric domains are treated specially.
 * The 'syncScale', when not null and falsy, 
 * makes every case be treated solely by the protovis implementation.
 * <br /> 
 * In any case, the default of desiredTickCount is 5
 * (which is different from that of the protovis implementation).
 */
pvc.scaleTicks = function(scale, syncScale, desiredTickCount, forceCalc){
    /* This implementation uses PROTOVIS's 
     * implementation of QuantitativeScale#ticks
     * as a way to not to deal with date scales
     * and to ensure that its internal field 'tickFormat'
     * is updated.
     * 
     * For the cases when the ticks do not fully enclose the domain,
     * this implementation copies & adapts PROTOVIS's
     * implementation, and, unfortunately, 
     * ends up doing the same work twice.
     * 
     * In either case, if the ticks domain is !=
     * from the scale's domain the later is updated to the former.
     */
    if(!desiredTickCount){
        desiredTickCount = 5;
    }
    
    var ticks,
        ticksCacheKey = syncScale + "|" + desiredTickCount;
    if(!forceCalc && 
       scale._ticksCache && 
       (ticks = scale._ticksCache[ticksCacheKey])){
        return ticks;
    }
    
    // Call PROTOVIS implementation
    var ticks = scale.ticks(desiredTickCount);
    
    if(syncScale != null && !syncScale){
        return ticks;
    }
    
    var T = ticks.length;
    
    // Treat only well-formed, finite, numeric domains
    if(T >= 2 && !(ticks[0] instanceof Date)){
        // Assume numeric domain
        
        // Check if scale's domain is "included" in the ticks domain
        var doma = scale.domain(),  // "doma/in"
            domaBeg = doma[0],
            domaEnd = doma[doma.length - 1],
            
            // Is is an ascending or descending scale?
            // Assuming the scale is monotonic...
            domaAsc = domaBeg < domaEnd,
            
            domaMin = domaAsc ? domaBeg : domaEnd,
            domaMax = domaAsc ? domaEnd : domaBeg,
            
            tickMin = domaAsc ? ticks[0]     : ticks[T - 1],
            tickMax = domaAsc ? ticks[T - 1] : ticks[0];
        
        if((tickMin > domaMin) || (domaMax > tickMax)){
            // Copied & Adapted PROTOVIS algorithm
            // To recalculate ticks that include the scale's domain
            // at both ends.
            
            var domaSize  = domaMax - domaMin,
                // 1, 10, 100, 1000, ...
                tickStep  = pv.logFloor(domaSize / desiredTickCount, 10),
                tickCount = (domaSize / tickStep);
                err = desiredTickCount / tickCount;
            
            if      (err <= .15) tickStep *= 10;
            else if (err <= .35) tickStep *= 5;
            else if (err <= .75) tickStep *= 2;
            
            // NOTE: this is the "BIG" change to
            //  PROTOVIS's implementation:
            // ceil  -> floor
            // floor -> ceil
            tickMin = Math.floor(domaMin / tickStep) * tickStep;
            tickMax = Math.ceil (domaMax / tickStep) * tickStep;
            
            // Overwrite PROTOVIS ticks
            ticks = pv.range(tickMin, tickMax + tickStep, tickStep);
            if(!domaAsc){
                ticks = ticks.reverse();
            }
        }
        
        if(tickMin < domaMin || domaMax < tickMax){
            /* Update the scale to reflect the new domain */
            if(doma.length !== 2){
                pvc.log("Ticks forced extending a linear scale's domain, " +
                        "but it is not possible to update the domain because " + 
                        "it has '" +  doma.length + "' elements.");
            } else {
                pvc.log("Ticks forced extending a linear scale's domain from [" +
                        [domaMin, domaMax] + "] to [" +
                        [tickMin, tickMax] + "]");
                
                scale.domain(tickMin, tickMax);
            }
        } // else === && ===
    }
    
    // Cache ticks
    (scale._ticksCache || (scale._ticksCache = {}))[ticksCacheKey] = ticks;
    
    return ticks;
};

pvc.roundScaleDomain = function(scale, roundMode, desiredTickCount){
    // Domain rounding
    if(roundMode){
        switch(roundMode){
            case 'none': 
                break;
                
            case 'nice':
                scale.nice();
                break;
            
            case 'tick':
                scale.nice();
                pvc.scaleTicks(scale, true, desiredTickCount);
                break;
                
            default:
                pvc.log("Invalid 'roundMode' argument: '" + roundMode + "'.");
        }
    }
};

/* PROPERTIES */
pv.Mark.prototype.getStaticPropertyValue = function(name) {
    var properties = this.$properties;
    for (var i = 0, L = properties.length; i < L; i++) {
        var property = properties[i]; 
        if (property.name == name) {
            return property.value;
        }
    }
    //return undefined;
};
  
/* ANCHORS */
/*
 * name = left | right | top | bottom
 * 
 * */
pv.Mark.prototype.addMargin = function(name, margin) {
    if(margin != 0){
        var staticValue = pvc.nullTo(this.getStaticPropertyValue(name), 0),
            fMeasure    = pv.functor(staticValue);
        
        this[name](function(){
            return margin + fMeasure.apply(this, arraySlice.call(arguments));
        });
    }
    
    return this;
};

/*
 * margins = {
 *      all:
 *      left:
 *      right:
 *      top:
 *      bottom:
 * }
 * */
pv.Mark.prototype.addMargins = function(margins) {
    var all = pvc.get(margins, 'all', 0);
    
    this.addMargin('left',   pvc.get(margins, 'left',   all));
    this.addMargin('right',  pvc.get(margins, 'right',  all));
    this.addMargin('top',    pvc.get(margins, 'top',    all));
    this.addMargin('bottom', pvc.get(margins, 'bottom', all));
    
    return this;
};

/* BOUNDS */
pv.Mark.prototype.toScreenTransform = function(){
    var t = pv.Transform.identity;
    
    var parent = this.parent;
    if(parent){
        do {
            t = t.translate(parent.left(), parent.top())
                 .times(parent.transform());
        } while ((parent = parent.parent));
    }
    
    return t;
};

pv.Transform.prototype.transformHPosition = function(left){
    return this.x + (this.k * left);
};

pv.Transform.prototype.transformVPosition = function(top){
    return this.y + (this.k * top);
};

// width / height
pv.Transform.prototype.transformLength = function(length){
    return this.k * length;
};

})(); // End private scope

/**
 *
 * Implements filter property if not implemented yet
 *
 */
if (!Array.prototype.filter){
    Array.prototype.filter = function(fun, thisp)
    {
        var len = this.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();

        var res = [];
        var thisp = arguments[1];
        for (var i = 0; i < len; i++)
        {
            if (i in this)
            {
                var val = this[i]; // in case fun mutates this
                if (fun.call(thisp, val, i, this))
                    res.push(val);
            }
        }

        return res;
    };
}


/**
 *
 * Implements support for svg detection
 *
 **/
(function($){
    $.support.svg = $.support.svg || document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
})(jQuery);
/**
 *
 * Base panel. A lot of them will exist here, with some common properties.
 * Each class that extends pvc.base will be responsible to know how to use it
 *
 */
pvc.DataEngine = Base.extend({

    chart: null,
    metadata: null,
    resultset: null,
    seriesInRows: false,
    crosstabMode: true,
    translator: null,
    series: null,
    categories: null,
    values: null,
    secondAxisValues: null,
    hiddenData: null,
    secondAxis: false, // Do we have double axis?
    secondAxisIdx: 0,
    
    isMultiValued: false,
    valuesIndexes: null,
    
    // Cache
    visibleCategoriesIndexes: undefined,
    visibleCategories: undefined,
    visibleSeriesIndexes: undefined,
    visibleSeries: undefined,
    
    constructor: function(chart){

        this.chart = chart;
        this.hiddenData = {
            series:{},
            categories:{}
        };
      
    },

    setData: function( metadata, resultset){

        this.metadata = metadata;
        this.resultset = resultset;

    },

    /**
     * Creates the appropriate translator
     */

    createTranslator: function(){
        
        if(this.isMultiValued){
            pvc.log("Creating MultiValueTranslator");
            this.translator = new pvc.MultiValueTranslator(this.valuesIndexes, this.crosstabMode, this.dataOptions);  //TODO: 
        }
        else if(this.crosstabMode){
            pvc.log("Creating CrosstabTranslator");
            this.translator = new pvc.CrosstabTranslator();
        }
        else{
            pvc.log("Creating RelationalTranslator");
            this.translator = new pvc.RelationalTranslator();
        }

        this.prepareTranslator();
    },
    
    /**
     * Prepares a just created translator
     */
    prepareTranslator: function(){
        this.translator.setData(this.metadata, this.resultset);
        this.translator.prepare(this);
    },
    
    /*
     * Returns some information on the data points
     */

    getInfo: function(){

        var out = "------------------------------------------\n";
        out+= "Dataset Information\n";

        out+= "  Series ( "+ this.getSeriesSize() +" ): " + this.getSeries().slice(0,10) +"\n";
        out+= "  Categories ( "+ this.getCategoriesSize() +" ): " + this.getCategories().slice(0,10) +"\n";
        out+= "  `- secondAxis: " + this.chart.options.secondAxis + "; secondAxisIndex: " + this.chart.options.secondAxisIdx + "\n";
        out+= "------------------------------------------\n";

        return out;

    },

    /*
     * Returns the series on the underlying data
     *
     */

    getSeries: function(){
        var res = this.series || this.translator.getColumns();
        return res;
    },

    /*
     * Returns a serie on the underlying data by an index
     *
     */

    getSerieByIndex: function(idx){
        return this.getSeries()[idx];
    },


    /*
     * Returns an array with the indexes for the series
     *
     */
    getSeriesIndexes: function(){
        // we'll just return everything
        return pv.range(this.getSeries().length);
    },

    /*
     * Returns an array with the indexes for the visible series
     *
     */
    getVisibleSeriesIndexes: function(){

        if (typeof this.visibleSeriesIndexes === "undefined"){
            
            var myself=this;
            var res =  pv.range(this.getSeries().length).filter(function(v){
                return !myself.hiddenData.series[v];
            });
            this.visibleSeriesIndexes = res;
        }
        
        return this.visibleSeriesIndexes;

    },

    /*
     * Returns an array with the visible categories. Use only when index information
     * is not required
     *
     */
    getVisibleSeries: function(){



        if (typeof this.visibleSeries === "undefined"){
            var myself = this;
            var res = this.getVisibleSeriesIndexes().map(function(idx){
                return myself.getSerieByIndex(idx);
            });
            this.visibleSeries = res;
        }
        
        return this.visibleSeries;
    },


    /*
     * Togles the serie visibility based on an index. Returns true if serie is now
     * visible, false otherwise.
     *
     */

    toggleSerieVisibility: function(idx){

        return this.toggleVisibility("series",idx);

    },


    /*
     * Returns the categories on the underlying data
     *
     */

    getCategories: function(){

        if(this.categories == null){

            if(this.chart.options.timeSeries){
                var parser = pv.Format.date(this.chart.options.timeSeriesFormat);
                this.categories = this.translator.getRows().sort(function(a,b){
                    return parser.parse(a) - parser.parse(b);
                });
            } else {
                this.categories = this.translator.getRows();
            }
        }

        return this.categories;
    },

    getCategoryMin: function() {
        var cat = this.getCategories();
        var min = cat[0];
        for(var i in cat)
            if (cat[i] < min)
                min = cat[i];
        return min;
    },

    getCategoryMax: function() {
        var cat = this.getCategories();
        var max = cat[0];
        for(var i in cat)
            if (cat[i] > max)
                max = cat[i];
        return max;
    },

    /*
     * Returns the categories on the underlying data
     *
     */

    getCategoryByIndex: function(idx){
        return this.getCategories()[idx];
    },

    /*
     * Returns an array with the indexes for the categories
     *
     */
    getCategoriesIndexes: function(){
        // we'll just return everything
        return pv.range(this.getCategories().length);
    },

    /*
     * Returns an array with the indexes for the visible categories
     *
     */
    getVisibleCategoriesIndexes: function(){
        
        if (typeof this.visibleCategoriesIndexes === "undefined"){
            var myself=this;
            var res = pv.range(this.getCategories().length).filter(function(v){
                return !myself.hiddenData.categories[v];
            });
            this.visibleCategoriesIndexes = res;
        }
        
        return this.visibleCategoriesIndexes;
    },

    /*
     * Returns an array with the visible categories. Use only when index information
     * is not required
     *
     */
    getVisibleCategories: function(){
  
        if (typeof this.visibleCategories === "undefined"){
            var myself = this;
            var res = this.getVisibleCategoriesIndexes().map(function(idx){
                return myself.getCategoryByIndex(idx);
            });
        
            this.visibleCategories = res;
        }
        
        return this.visibleCategories;
    },

    /*
     * Togles the category visibility based on an index. Returns true if category is now
     * visible, false otherwise.
     *
     */

    toggleCategoryVisibility: function(idx){

        return this.toggleVisibility("categories",idx);

    },

    /*
     * Togles the visibility of category or series based on an index.
     * Returns true if is now visible, false otherwise.
     *
     */

    toggleVisibility: function(axis,idx){

        // Accepted values for axis: series|categories
        pvc.log("Toggling visibility of " + axis + "["+idx+"]");

        if (typeof this.hiddenData[axis][idx] == "undefined"){
            this.hiddenData[axis][idx] = true;
        }
        else{
            delete this.hiddenData[axis][idx];
        }

    },

    
    /*
     * Clears the cache that's used for optimization
     *
     */

    clearDataCache: function(){
        
        this.visibleCategoriesIndexes = undefined;
        this.visibleCategories = undefined;
        this.visibleSeriesIndexes = undefined;
        this.visibleSeries = undefined;
    
    },

    /*
     * Returns the visibility status of a category or series based on an index.
     * Returns true if is visible, false otherwise.
     *
     */
    isVisible: function(axis,idx){

        // Accepted values for axis: series|categories

        if (typeof this.hiddenData[axis][idx] != "undefined"){
            return !this.hiddenData[axis][idx];
        }
        else{
            return true;
        }

    },


    /*
     * Returns the values for the dataset
     */

    getValues: function(){


        if (this.values == null){
            this.values = this.translator.getValues();
        }
        return this.values;

    },

    /*
     * Returns the values for the second axis of the dataset
     */

    getSecondAxisValues: function(){


        if (this.secondAxisValues == null){
            this.secondAxisValues = this.translator.getSecondAxisValues();
        }
        return this.secondAxisValues;

    },

    getSecondAxisSeries: function() {
       return this.translator.getSecondAxisSeries();
    },

    getSecondAxisIndices: function() {
        return Object.keys(this.secondAxisValues);
    },
    /*
     * Returns the object for the second axis in the form {category: catName, value: val}
     *
     */

    getObjectsForSecondAxis: function(idx,sortF){
        idx = idx || 0;
        var myself = this;
        var ar = [];
        this.getSecondAxisValues()[idx].map(function(v,j){
          if(typeof v != "undefined" /* && v != null */ ){
              ar.push({
                  serieIndex: idx,
                  category: myself.getCategories()[j],
                  value: v
              }) ;
          }
        });

        if (typeof sortF == "function"){
            return ar.sort(sortF);
        }
        
        return ar;
    },
    
    /**
     * Returns the maximum value for the second axis of the dataset
     */
    getSecondAxisMax:function(){

        return pv.max(this.getSecondAxisValues()
          .reduce(function(a, b) {  
            return a.concat(b);
          })
          .filter(pvc.nonEmpty));
    },
    
    /**
     * Returns the minimum value for the second axis of the dataset.
     */
    getSecondAxisMin:function(){

        return pv.min(this.getSecondAxisValues()
          .reduce(function(a, b) {  
            return a.concat(b);
          })
          .filter(pvc.nonEmpty));
    },

    /**
     * Returns the transposed values for the dataset.
     */
    getTransposedValues: function(){
    	
        return pv.transpose(pvc.cloneMatrix(this.getValues()));
    },

    /**
     * Returns the transposed values for the visible dataset.
     */
    getVisibleTransposedValues: function(){
        var myself = this;
        var res = this.getVisibleSeriesIndexes().map(function(sIdx){
            return myself.getVisibleValuesForSeriesIndex(sIdx);
        });
        return res;
    },

    /**
     * Returns the values for a given series idx
     *
     */
    getValuesForSeriesIndex: function(idx){
        return this.getValues().map(function(a){
            return a[idx];
        });
    },

    /**
     * Returns the visible values for a given category idx
     *
     */
    getVisibleValuesForSeriesIndex: function(idx){

        var series = this.getValuesForSeriesIndex(idx);
        return this.getVisibleCategoriesIndexes().map(function(idx){
            return series[idx];
        });
    },

    /**
     * Returns the object for a given series idx in the form {category: catName, value: val}
     *
     */
    getObjectsForSeriesIndex: function(idx, sortF){

        var myself = this;
        var ar = [];
        this.getValues().map(function(a,i){
            if(typeof a[idx] != "undefined" /* && a[idx] != null */){
                ar.push({
                    serieIndex: idx,
                    category: myself.getCategories()[i],
                    value: a[idx]
                }) ;
            }
        });

        if (typeof sortF == "function"){
            return ar.sort(sortF);
        }
        
        return ar;
    },

    /**
     * Returns the values for a given category idx
     *
     */
    getValuesForCategoryIndex: function(idx){
        return this.getValues()[idx];
    },

    /**
     * Returns the visible values for a given category idx
     *
     */
    getVisibleValuesForCategoryIndex: function(idx){

        var cats = this.getValuesForCategoryIndex(idx);
        var res = this.getVisibleSeriesIndexes().map(function(idx){
            return cats[idx];
        });
        return res;
    },


    /**
     * Returns the object for a given category idx in the form {serie: value}
     *
     */
    getObjectsForCategoryIndex: function(idx){

        var myself = this;
        var ar=[];
        this.getValues()[idx].map(function(a,i){
            if(typeof a != "undefined" /* && a!= null */){
                ar.push({
                    categoryIndex: idx,
                    serie: myself.getSeries()[i],
                    value: a
                }) ;
            }
        });
        return ar;
    },

    /**
     * Returns how many series we have
     */

    getSeriesSize: function(){
        return this.getSeries().length;
    },

    /**
     * Returns how many categories, or data points, we have
     */
    getCategoriesSize: function(){
        return this.getCategories().length;
    },

    /**
     * For every category in the data, get the maximum of the sum of the series
     * values.
     *
     */
    getCategoriesMaxSumOfVisibleSeries: function(){

        var myself=this;
        var max = pv.max(pv.range(0,this.getCategoriesSize()).map(function(idx){
            return pv.sum(
                        myself.getVisibleValuesForCategoryIndex(idx)
                              .map(function(e){
                                  return Math.max(0, pvc.number(e));
                               }));
        }));
        pvc.log("getCategoriesMaxSumOfVisibleSeries: " + max);
        return max;
    },

    /**
     * For every serie in the data, get the maximum of the sum of the category
     * values. If only one serie, gets the sum of the value. Useful to build
     * pieCharts
     *
     */
    getVisibleSeriesMaxSum: function(){

        var myself=this;
        var max = pv.max(this.getVisibleSeriesIndexes().map(function(idx){
            return pv.sum(myself.getValuesForSeriesIndex(idx).filter(pvc.nonEmpty));
        }));
        pvc.log("getVisibleSeriesMaxSum: " + max);
        return max;
    },

    /**
     * Get the maximum value in all series
     */
    getVisibleSeriesAbsoluteMax: function(){

        var myself=this;
        var max = pv.max(this.getVisibleSeriesIndexes().map(function(idx){
            return pv.max(myself.getValuesForSeriesIndex(idx).filter(pvc.nonEmpty));
        }));
        pvc.log("getVisibleSeriesAbsoluteMax: " + max);
        return max;
    },

    /**
     * Get the minimum value in all series
     */
    getVisibleSeriesAbsoluteMin: function(){

        var myself=this;
        var min = pv.min(this.getVisibleSeriesIndexes().map(function(idx){
            return pv.min(myself.getValuesForSeriesIndex(idx).filter(pvc.nonEmpty));
        }));
        pvc.log("getVisibleSeriesAbsoluteMin: " + min);
        return min;
    },

    setCrosstabMode: function(crosstabMode){
        this.crosstabMode = crosstabMode;
    },

    isCrosstabMode: function(){
        return this.crosstabMode;
        //pv.range(0,this.getSeriesSize());
    },

    setSeriesInRows: function(seriesInRows){
        this.seriesInRows = seriesInRows;
    },

    isSeriesInRows: function(){
        return this.seriesInRows;
    },
    
    setValuesIndexes: function(valuesIndexes){
        this.valuesIndexes = valuesIndexes;
    },
    
    setMultiValued: function(multiValue){
        this.isMultiValued = !! multiValue;
    },
    
    //TODO: in multiValued mode, have all options only related to data mapping in one object?
    setDataOptions: function(dataOptions){
        this.dataOptions = dataOptions;
    }

});



pvc.DataTranslator = Base.extend({

    dataEngine: null,
    metadata: null,
    resultset: null,
    values: null,
    secondAxisValues: null,

    //constructor: function(){
    //},


    setData: function(metadata, resultset){
        this.metadata = metadata;
        this.resultset = resultset;
    },


    getValues: function(){
        // Skips first row, skips first col.
        return this.values.slice(1).map(function(a){
            return a.slice(1);
        });      
    },

    getSecondAxisValues: function(){
        // Skips first row
        return this.secondAxisValues.map(function(a){
            return a.slice(1);
        });
    },

    getSecondAxisSeries: function(){
        // Skips first row
        return this.secondAxisValues.map(function(a){
            return a[0];
        });
    },

    getColumns: function(){
        // First column of every row, skipping 1st entry
        return this.values[0].slice(1);
    },

    getRows: function(){
        // first element of every row, skipping 1st one
        return this.values.slice(1).map(function(d){
            return d[0];
        });
    },

    transpose: function(){

        pv.transpose(this.values);
    },


    prepare: function(dataEngine){
        this.dataEngine = dataEngine;
        this.prepareImpl();
        this.postPrepare();
    },

    postPrepare: function(){

        if( this.dataEngine.seriesInRows ){
            this.transpose();
        }
        
        if(this.dataEngine.chart.options.secondAxis){
            var idx = this.dataEngine.chart.options.secondAxisIdx;
            if (!(idx instanceof  Array)) {
              idx = [idx];
            }
            idx.sort();

            // Transpose, splice, transpose back
            pv.transpose(this.values);
            this.secondAxisValues = [];
            for (var i = idx.length - 1; i >=0 ;i --) {
              var index = Number(idx[i]); index = index < 0 ? index : index + 1;
              this.secondAxisValues.unshift(this.values.splice(index , 1)[0]);
            }
            pv.transpose(this.values);
        }
    },

    prepareImpl: function(){
    // Specific code goes here - override me
    },

    sort: function(sortFunc){
    // Specify the sorting data - override me
    }


});


pvc.CrosstabTranslator = pvc.DataTranslator.extend({


    prepareImpl: function(){
    
        // All we need to do is to prepend to the result's matrix the series
        // line

        var a1 = this.metadata.slice(1).map(function(d){
            return d.colName;
        });
        a1.splice(0,0,"x");

        this.values = pvc.cloneMatrix(this.resultset);
        this.values.splice(0,0,a1);

    }
  
});


pvc.RelationalTranslator = pvc.DataTranslator.extend({



    prepareImpl: function(){

        var myself = this;

        if(this.metadata.length == 2){
            // Adding a static serie
            this.resultset.map(function(d){
                d.splice(0,0,"Series");
            });
            this.metadata.splice(0,0,{
                "colIndex":2,
                "colType":"String",
                "colName":"Series"
            });
        }

        /*
        var seenSeries = [],
        seenCategories = [],
        crossTab = [];

        for (r = 0; r < this.resultset.length;r ++) {
            var row = this.resultset[r],
            sIdx = ( idx = seenSeries.indexOf(row[0])) > -1 ? idx + 1: seenSeries.push(row[0]),
            cIdx = ( idx = seenCategories.indexOf(row[1])) > -1 ? idx : seenCategories.push(row[1]) - 1;
            //console.log(row);
            if(!crossTab[cIdx]) crossTab[cIdx] = [];
            crossTab[cIdx][sIdx] = (crossTab[cIdx][sIdx] || 0 ) + row[2];
            crossTab[cIdx][0] = row[1];
        }

        this.values = crossTab;

         */

//  TODO: WHAT's this for... DCLEAO?
//        var tree = pv.tree(this.resultset).keys(function(d){
//            return (d != null)? [d[0],d[1]] : [null, null];
//        }).map();
        
        // Now, get series and categories:

        var series = pv.uniq(this.resultset.map(function(d){
            return (d != null)? d[0] : null;
        }));
        var numeratedSeries = pv.numerate(series);

        var categories = pv.uniq(this.resultset.map(function(d){
            return (d != null)? d[1] : null;
        }));
        var numeratedCategories = pv.numerate(categories);


        // Finally, iterate through the resultset and build the new values

        this.values = [];
        var categoriesLength = categories.length;
        var seriesLength = series.length;

        // Initialize array
        pv.range(0,categoriesLength).map(function(catIndex){
            var row = new Array(seriesLength + 1);
            row[0] = categories[catIndex];
            
            myself.values[catIndex] = row;
        });

        this.resultset.map(function(r){
            var catIndex = numeratedCategories[r[1]],
                row = myself.values[catIndex],
                serIndex = numeratedSeries[r[0]] + 1,
                value = r[2];
            
            row[serIndex] = pvc.sumOrSet(row[serIndex], value);
        });

        // Create an initial line with the categories
        var l1 = series;
        l1.splice(0,0,"x");
        this.values.splice(0,0, l1);
    }
});



pvc.MultiValueTranslator = pvc.DataTranslator.extend({
    
    constructor: function(valuesIndexes, crosstabMode, dataOptions)//measuresIdx , categoriesIndexes) //seriesIndexes, numMeasures(1), 
    {
        this.valuesIndexes = valuesIndexes;
        this.crosstabMode = crosstabMode;
        /*this.measuresIdx = measuresIdx; *///measuresIdx : when measures are normalized
        this.dataOptions = dataOptions;
        
        if(this.dataOptions == null) this.dataOptions = {};//TODO:
        
    },
    
    prepareImpl: function()
    {
        var separator = (this.dataOptions.separator != null)? this.dataOptions.separator : '~';
        
        if(this.crosstabMode){
            
            //2 modes here:
            // 1) all measures in one column right after categories
            // 2) measures with separator mixed with series
            
            if(this.dataOptions.categoriesCount == null){//default
                this.dataOptions.categoriesCount = 1;
            }
            
            if(this.dataOptions.measuresInColumns || this.dataOptions.measuresIdx == null) //TODO: 
            {//series1/measure1, series1/measure2...
                // line
                var lastColName = null;
                var colNames = [];
                //var measures = null;
                var measuresStart = this.dataOptions.categoriesCount;
                
                var cols = this.metadata.slice(measuresStart).map(function(d){
                    return d.colName;
                });
                
                if(this.dataOptions.measuresInColumns){
                    //a1 now series1~measure1 | .. | series1~measureN | series2~measure1 |..| seriesM~measureN
                    for(var i = 0; i< cols.length; i++){
                        var col = cols[i];
                        var sepIdx = col.lastIndexOf(separator);
                        var colName = (sepIdx < 0)? '' : col.slice(0,sepIdx);
                        if(colName != lastColName) {
                            colNames.push(colName);
                            lastColName = colName;
                        }
                    }
                    var numMeasures = (cols.length) / colNames.length;
                    //TODO: merge series
                    
                    //TODO: more measures here, single val as is; multi: will need to iterate and merge values
                    this.values = this.mergeMeasuresInColumns(this.resultset, measuresStart, numMeasures);
                }
                else {
                    colNames = cols;
                    this.values = this.mergeMeasuresInColumns(this.resultset, measuresStart, 1);
                }
                
                for(var i=0;i<colNames.length;i++){
                    colNames[i] = colNames[i].split('~');
                }
                
                this.values = this.mergeColumnNames(this.values, 0, this.dataOptions.categoriesCount);
                //this.values = pvc.cloneMatrix(this.resultset).map(function(row){ return row.map(function(d){ return [d];}); });
                colNames.splice(0,0,"x");
                this.values.splice(0,0,colNames);
                
            }
            else {//TODO:refactor?
                
                var measuresIdx = this.dataOptions.measuresIdx;
                if(measuresIdx == null) { measuresIdx = 1;}
                var numMeasures = this.dataOptions.numMeasures;
                if (numMeasures == null) { numMeasures = 1; } 
                
                var a1 = this.metadata.slice(measuresIdx + 1).map(function(d){
                    return d.colName;
                });
                a1.splice(0,0,"x");
        
                //var values = pvc.cloneMatrix(this.resultset);
                this.values = [];
                var newRow = [];
                var row;
                for(var i=0; i<this.resultset.length; i++){
                    var rem = i % numMeasures;
                    row = this.resultset[i];
                    if(rem == 0)
                    {//first in measures batch
                        newRow = row.slice();//clone
                        //values = [];
                        newRow.splice(measuresIdx,1);//remove measures' titles column
                        for(var j=measuresIdx; j<newRow.length;j++){
                            newRow[j] = [];    //init measures
                        }
                    }
                    
                    //add values    
                    for(var j=measuresIdx; j<newRow.length;j++){
                       newRow[j].push(row[j+1]);//push measures
                    }
                    
                    if(rem == numMeasures -1){//measures batch complete
                        this.values.push(newRow);
                    }   
                }
                
                this.values.splice(0,0,a1);
            }
        }
        else {//TODO: refactor?
        //relational mode
            var seriesIdx = 0;//TODO:hcoded, needs ref from chart?
            var categoriesIdx = 1;
    
            var tree = pv.tree(this.resultset).keys(function(d){
                return [d[seriesIdx],d[categoriesIdx]];
            }).map();
            
            // Now, get series and categories:
    
            var series = pv.uniq(this.resultset.map(function(d){
                return d[0];
            }));
            
    
            var categories = pv.uniq(this.resultset.map(function(d){
                return d[1];
            }));
            
            // Finally, iterate through the resultset and build the new values
    
            this.allValues = [];
    
            var l1 = series;//TODO:clone?
            //add table corner
            l1.splice(0,0,"x");
            
            var values = this.getMultiValuesFromResultSet(this.valuesIndexes, categories, series,categoriesIdx, seriesIdx);
            // Create an initial line with the categories
            values.splice(0,0, l1);
            this.allValues = values;
    
            this.values = this.allValues;
        }

    },
    
    
    mergeColumnNames: function(values,start, count)
    {
        return values.map(function(row, rowIdx){
            var colNames = row.slice(start,start + count);
            var newRow = row.slice(start + count);
            newRow.splice(0,0,colNames);
            return newRow;
        });
    },
    
    mergeMeasuresInColumns: function(values, startIdx, numMeasures)
    {
      return values.map(function(row, rowIdx){
        var newRow = row.slice(0, startIdx);
        for(var i=startIdx;i<row.length;i+=numMeasures){
            var value = [];
            for(var j = 0; j < numMeasures;j++){
                value.push(row[i+j]);
            }
            newRow.push(value);
        }
        return newRow;
      });
    },
    
    addSeriesToMetadata: function(){
        if(this.metadata.length == 2){
            // Adding a static serie
            this.resultset.map(function(d){
                d.splice(0,0,"Series");
            });
            this.metadata.splice(0,0,{
                "colIndex":2,
                "colType":"String",
                "colName":"Series"
            });
        }
    },
    
    //overridden
    getValues: function(idx){
        if(idx == null){//default to first
           // return this.values;
            return this.values.slice(1).map(function(a){
                return a.slice(1);
            });
        }
        else if(idx > this.allValues.length || idx < 0) { throw new NoDataException(); }
        else {
            //return this.allValues.map(function(d){
            //    return d[idx];
            //});
            return this.allValues.slice(1).map(function(a){
                return a.slice(1);
            }).map(function(d){
                return d[idx];
            });
            //return this.allValues[idx];
        }
    },
    
    sumOrSetVect: function(v1, v2){
         if (v1 == null || v1[0] === undefined) { return v2; }
        //TODO: check
        var res = [];
        for(var i=0;i<v1.length;i++){
            if(v1[i] == null) { res[i] = v2[i];}
            res[i] = v1[i] + v2[i];
        }
        return res;
    },
    
    //series with x
    getValuesFromResultSet: function(valueIndex, categories, series, categoriesIdx, seriesIdx)
    {
        var categoriesLength = categories.length;
        var seriesLength = series.length;
        var numeratedSeries = pv.numerate(series);
        var numeratedCategories = pv.numerate(categories);
        
        // Initialize array
        var values = [];                
        pv.range(0,categoriesLength).map(function(d){
            values[d] = new Array(seriesLength);
            values[d][0] = categories[d];
        });
        // Set array values
        this.resultset.map(function(row){
            var i = numeratedCategories[row[categoriesIdx]];
            var j = numeratedSeries[row[seriesIdx]];
            values[i][j] = pvc.sumOrSet(values[i][j], row[valueIndex]);
        });
        return values;
    },
    
    getMultiValuesFromResultSet: function(valueIndexes, categories, series, categoriesIdx, seriesIdx)
    {
        var categoriesLength = categories.length;
        var seriesLength = series.length;
        var numeratedSeries = pv.numerate(series);
        var numeratedCategories = pv.numerate(categories);
        
        var myself = this;
        // Initialize array
        var values = [];                
        pv.range(0,categoriesLength).map(function(d){
            values[d] = new Array(seriesLength);
            values[d][0] = categories[d];
        });
        // Set array values
        this.resultset.map(function(row){
            var i = numeratedCategories[row[categoriesIdx]];
            var j = numeratedSeries[row[seriesIdx]];
            
            var val = [];
            for(var k = 0; k < valueIndexes.length; k++){
                val.push( row[valueIndexes[k]]);
            }
            values[i][j] = myself.sumOrSetVect(values[i][j], val);
        });
        return values;
    }
    
});


NoDataException = function() {};
/**
 * The main component
 */
pvc.Base = Base.extend({

	isPreRendered: false,
	isAnimating:   false,

	// data
	dataEngine: null,
	resultset:  [],
	metadata:   [],

	// panels
	basePanel:   null,
	titlePanel:  null,
	legendPanel: null,

	legendSource: "series",
	colors: null,

	// renderCallback
	renderCallback: undefined,

	constructor: function(/* options */) {
		this.options = {};

		// Apply options
		$.extend(this.options, pvc.Base.defaultOptions);

		this.dataEngine = this.createDataEngine();
	},

	/**
	 * Creates an appropriate DataEngine
	 * @virtual
	 */
	createDataEngine: function() {
		return new pvc.DataEngine(this);
	},

	/**
	 * 
	 * Building the visualization has 2 stages: First the preRender method
	 * prepares and builds every object that will be used; Later the render
	 * method effectively renders.
	 * 
	 */
	preRender: function() {
		pvc.log("Prerendering in pvc");

		// Now's as good a time as any to completely clear out all 
		//  tipsy tooltips
		pvc.removeTipsyLegends();

		// If we don't have data, we just need to set a "no data" message
		// and go on with life.
		if (!this.allowNoData && this.resultset.length === 0) {
			throw new NoDataException();
		}

		// Disable animation if browser doesn't support it
		if (!$.support.svg) {
			this.options.animate = false;
		}

		// Getting data engine and initialize the translator
		this.initDataEngine();

		// Create color schemes
		this.colors = pvc.createColorScheme(this.options.colors);
		this.secondAxisColor = pvc.createColorScheme(this.options.secondAxisColor);

		this.initBasePanel();

		this.initTitlePanel();

		this.initLegendPanel();

		this.isPreRendered = true;
	},

	/**
	 * Initializes the data engine
	 */
	initDataEngine: function() {
		var de = this.dataEngine;
		
		de.clearDataCache();
		de.setData(this.metadata, this.resultset);
		de.setCrosstabMode(this.options.crosstabMode);
		de.setSeriesInRows(this.options.seriesInRows);
		// TODO: new
		de.setMultiValued(this.options.isMultiValued);
		
		// columns where measure values are, for relational data
		de.setValuesIndexes(this.options.measuresIndexes);
		
		de.setDataOptions(this.options.dataOptions);
		
		// ---
		
		de.createTranslator();
		
		if(pvc.debug){ pvc.log(this.dataEngine.getInfo()); }
	},
	
	/**
	 * Creates and initializes the base (root) panel.
	 */
	initBasePanel: function() {
		// Since we don't have a parent panel 
		// we need to manually create the points.
	    this.originalWidth  = this.options.width;
        this.originalHeight = this.options.height;
        
		this.basePanel = new pvc.BasePanel(this);
		this.basePanel.setSize(this.options.width, this.options.height);
		this.basePanel.create();
		this.basePanel.getPvPanel().canvas(this.options.canvas);
	},
	
	/**
	 * Creates and initializes the title panel, 
	 * if the title is specified.
	 */
	initTitlePanel: function(){
		if (this.options.title != null && this.options.title != "") {
			this.titlePanel = new pvc.TitlePanel(this, {
				title: 	    this.options.title,
				anchor: 	this.options.titlePosition,
				titleSize:  this.options.titleSize,
				titleAlign: this.options.titleAlign
			});

			this.titlePanel.appendTo(this.basePanel); // Add it
		}
	},
	
	/**
	 * Creates and initializes the legend panel, 
	 * if legend is active.
	 */
	initLegendPanel: function(){
		if (this.options.legend) {
			this.legendPanel = new pvc.LegendPanel(this, {
				anchor: this.options.legendPosition,
				legendSize: this.options.legendSize,
				align: this.options.legendAlign,
				minMarginX: this.options.legendMinMarginX,
				minMarginY: this.options.legendMinMarginY,
				textMargin: this.options.legendTextMargin,
				padding: this.options.legendPadding,
				textAdjust: this.options.legendTextAdjust,
				shape: this.options.legendShape,
				markerSize: this.options.legendMarkerSize,
				drawLine: this.options.legendDrawLine,
				drawMarker: this.options.legendDrawMarker
			});

			this.legendPanel.appendTo(this.basePanel); // Add it
		}
	},
	
	/**
	 * Render the visualization. If not pre-rendered, do it now.
	 */
	render: function(bypassAnimation, rebuild) {
		try {
			if (!this.isPreRendered || rebuild) {
				this.preRender();
			}

			if (this.options.renderCallback) {
				this.options.renderCallback.call(this);
			}

			this.basePanel.getPvPanel().render();

			if (this.options.animate && !bypassAnimation) {
				this.isAnimating = true;
				this.basePanel.getPvPanel()
				        .transition()
				        .duration(2000)
				        .ease("cubic-in-out")
				        .start();
			}
		} catch (e) {
			if (e instanceof NoDataException) {

				if (!this.basePanel) {
					pvc.log("No panel");
					this.initBasePanel();
				}

				pvc.log("creating message");
				var pvPanel = this.basePanel.getPvPanel(), message = pvPanel
						.anchor("center").add(pv.Label);
				message.text("No data found");
				this.basePanel.extend(message, "noDataMessage_");
				pvPanel.render();
				
			} else {
				// We don't know how to handle this
				throw e;
			}
		}
	},

	/**
	 * Method to set the data to the chart. Expected object is the same as what
	 * comes from the CDA: {metadata: [], resultset: []}
	 */
	setData: function(data, options) {
		this.setResultset(data.resultset);
		this.setMetadata(data.metadata);

		$.extend(this.options, options);
	},

	/**
	 * Sets the resultset that will be used to build the chart
	 */
	setResultset: function(resultset) {
		this.resultset = resultset;
		if (resultset.length == 0) {
			pvc.log("Warning: Resultset is empty");
		}
	},

	/**
	 * Sets the metadata that, optionally, will give more information for
	 * building the chart
	 */
	setMetadata: function(metadata) {
		this.metadata = metadata;
		if (metadata.length == 0) {
			pvc.log("Warning: Metadata is empty");
		}
	},

	/*
	 * Animation
	 */
	animate: function(start, end) {
		return (!this.options.animate || this.isAnimating) ? end : start;
	},

	isOrientationVertical: function(orientation) {
		return (orientation || this.options.orientation) === "vertical";
	},

	isOrientationHorizontal: function(orientation) {
		return (orientation || this.options.orientation) == "horizontal";
	}
}, {
	defaultOptions: {
		canvas:	null,
		
		width: 	400,
		height: 300,
		originalWidth: 	400,
		originalHeight: 300,
		
		crosstabMode: true,
		seriesInRows: false,
		animate: 	  true,
		
		title: null,
		titlePosition: "top", // options: bottom || left || right
		titleAlign: "center", // left / right / center
		
		legend: false,
		legendPosition: "bottom",
		
		colors: null,

		/**
		 * Is called like a method of the *panel* and not the chart.
		 * s: series 
		 * c: category 
		 * v: numeric value
		 */
		tooltipFormat: function(s, c, v) {
			return s + ", " + c + ":  " + this.chart.options.valueFormat(v);
		},

		valueFormat: function(d) {
			return pv.Format.number().fractionDigits(0, 2).format(d);
			// pv.Format.number().fractionDigits(0, 10).parse(d));
		},

		clickable: false,

		clickAction: function(s, c, v) {
			pvc.log("You clicked on series " + s + ", category " + c
					+ ", value " + v);
		}
	}
});

/**
 * 
 * Base panel. A lot of them will exist here, with some common properties. Each
 * class that extends pvc.base will be responsible to know how to use it
 * 
 */
pvc.BasePanel = Base.extend({

	chart: null,
	_parent: null,
	type: pv.Panel, // default one
	height: null,
	width: null,
	anchor: "top",
	pvPanel: null,
	fillColor: "red",
	margins: null,

	constructor: function(chart, options) {

		this.chart = chart;
		$.extend(this, options);

		this.margins = {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0
		};
	},

	create: function() {

		if (!this._parent) {
			// Should be created for the vis panel only
			this.pvPanel = new pv.Panel();
			this.extend(this.pvPanel, "base_");
		} else {
			this.pvPanel = this._parent.pvPanel.add(this.type);
		}

		this.pvPanel
		    .width(this.width)
		    .height(this.height);
	},

	/**
	 * Create the panel, appending it to the previous one using
	 * a specified anchor.
	 * 
	 * Will: 1) create the panel. 2) subtract it's size from the
	 * previous panel's size 3) append it to the previous one in
	 * the correct position
	 * 
	 */
	appendTo: function(parent) {

		this._parent = parent;
		this.create();

		// Reduce size and update margins
		var a = this.anchor, 
		    ao = this.anchorOrtho(), 
		    isTopOrBottom = this.isAnchorTopOrBottom(), 
		    margins = this._parent.margins;

		if (isTopOrBottom) {
            this._parent.height -= this.height;
		} else {
            this._parent.width -= this.width;
		}

		// See where to attach it.
		this.pvPanel[a ](margins[a ]);
		this.pvPanel[ao](margins[ao]);

		// update margins
		if (isTopOrBottom) {
            margins[a] += this.height;
		} else {
            margins[a] += this.width;
		}
	},
    
	/**
	 * 
	 * This is the method to be used for the extension points
	 * for the specific contents of the chart. already ge a pie
	 * chart! Goes through the list of options and, if it
	 * matches the prefix, execute that method on the mark.
	 * WARNING: It's the user's responsibility to make sure that 
	 * unexisting methods don't blow this.
	 * 
	 */
	extend: function(mark, prefix) {
		// if mark is null or undefined, skip
		if (mark) {
			var pL = prefix.length, points = this.chart.options.extensionPoints;
			for ( var p in points) {
				if (p.indexOf(prefix) === 0) {
					var m = p.substring(pL);
					// Distinguish between mark methods and
					// properties
					if (typeof mark[m] === "function") {
						mark[m](points[p]);
					} else {
						mark[m] = points[p];
					}
				}
			}
		}
	},

	/**
	 * Sets the size for the panel, for when the parent panel is
	 * undefined
	 */
	setSize: function(w, h) {
		this.width = w;
		this.height = h;
	},

	/**
	 * Returns the width of the Panel
	 */
	getWidth: function() {
		return this.width;
	},

	/**
	 * Returns the height of the Panel
	 */
	getHeight: function() {
		return this.height;
	},

	/**
	 * Returns the underlying protovis Panel.
	 * If 'layer' is specified returns 
	 * the protovis panel for the specified layer name.
	 */
	getPvPanel: function(layer) {
	    if(!layer){
	        return this.pvPanel;	        
	    }
		
	    if(!this._parent){
	        throw new Error("Layers are not possible on a root panel.");
	    }
	    
	    if(!this.pvPanel){
	        throw new Error(
	           "Cannot access layer panels without having created the main panel.");
	    }
	    
	    var pvPanel = null;
	    if(!this._layers){
	        this._layers = {};
	    } else {
	        pvPanel = this._layers[layer];
	    } 

        if(!pvPanel){
            pvPanel = this._parent.pvPanel.add(this.type)
                                .extend(this.pvPanel);
            
            this.initLayerPanel(pvPanel, layer);
            
            this._layers[layer] = pvPanel;
        }
        
        return pvPanel;
	},
    
	/**
	 * Initializes a new layer panel.
	 * @virtual
	 */
	initLayerPanel: function(pvPanel, layer){
	},
	
	/**
	 * Returns true if the anchor is one of the values 'top' or
	 * 'bottom'.
	 */
	isAnchorTopOrBottom: function(anchor) {
		if (!anchor) {
			anchor = this.anchor;
		}
		return anchor === "top" || anchor === "bottom";
	},

	anchorOrtho: function(anchor) {
		if (!anchor) {
			anchor = this.anchor;
		}
		return pvc.BasePanel.relativeAnchor[anchor];
	},

	anchorOrthoMirror: function(anchor) {
		if (!anchor) {
			anchor = this.anchor;
		}
		return pvc.BasePanel.relativeAnchorMirror[anchor];
	},

	anchorOpposite: function(anchor) {
		if (!anchor) {
			anchor = this.anchor;
		}
		return pvc.BasePanel.oppositeAnchor[anchor];
	},

	anchorLength: function(anchor) {
		if (!anchor) {
			anchor = this.anchor;
		}
		return pvc.BasePanel.parallelLength[anchor];
	},

	anchorOrthoLength: function(anchor) {
		if (!anchor) {
			anchor = this.anchor;
		}
		return pvc.BasePanel.orthogonalLength[anchor];
	},

	isOrientationVertical: function(orientation) {
		return this.chart.isOrientationVertical(orientation);
	},

	isOrientationHorizontal: function(orientation) {
		return this.chart.isOrientationHorizontal(orientation);
	}
}, {
	// Determine what is the associated method to
	// call to position the labels correctly
	relativeAnchor: {
		top: "left",
		bottom: "left",
		left: "bottom",
		right: "bottom"
	},

	relativeAnchorMirror: {
		top: "right",
		bottom: "right",
		left: "top",
		right: "top"
	},

	oppositeAnchor: {
		top: "bottom",
		bottom: "top",
		left: "right",
		right: "left"
	},

	parallelLength: {
		top: "width",
		bottom: "width",
		right: "height",
		left: "height"
	},

	orthogonalLength: {
		top: "height",
		bottom: "height",
		right: "width",
		left: "width"
	}
});

/*
 * Title panel. Generates the title. Specific options are: <i>title</i> - text.
 * Default: null <i>titlePosition</i> - top / bottom / left / right. Default:
 * top <i>titleSize</i> - The size of the title in pixels. Default: 25
 * 
 * Has the following protovis extension points:
 * 
 * <i>title_</i> - for the title Panel <i>titleLabel_</i> - for the title
 * Label
 */
pvc.TitlePanel = pvc.BasePanel.extend({

	_parent: null,
	pvLabel: null,
	anchor: "top",
	titlePanel: null,
	title: null,
	titleSize: 25,
	titleAlign: "center",
	font: "14px sans-serif",

	constructor: function(chart, options) {
		this.base(chart, options);
	},

	create: function() {
		// Size will depend on positioning and font size mainly
		var isTopOrBottom = this.isAnchorTopOrBottom();
		if (isTopOrBottom) {
			this.width = this._parent.width;
			this.height = this.titleSize;
		} else {
			this.height = this._parent.height;
			this.width = this.titleSize;
		}

		this.pvPanel = this._parent.getPvPanel().add(this.type).width(
				this.width).height(this.height);

		// Extend title
		this.extend(this.pvPanel, "title_");

		// Label
		var rotationByAnchor = {
			top: 0,
			right: Math.PI / 2,
			bottom: 0,
			left: -Math.PI / 2
		};

		this.pvLabel = this.pvPanel.add(pv.Label).text(this.title).font(
				this.font).textAlign("center").textBaseline("middle").bottom(
				this.height / 2).left(this.width / 2).textAngle(
				rotationByAnchor[this.anchor]);

		// Cases:
		if (this.titleAlign == "center") {
			this.pvLabel.bottom(this.height / 2).left(this.width / 2);
		} else {

			this.pvLabel.textAlign(this.titleAlign);

			if (isTopOrBottom) {
				this.pvLabel.bottom(null).left(null) // reset
				[this.titleAlign](0).bottom(this.height / 2);

			} else if (this.anchor == "right") {
				if (this.titleAlign == "left") {
					this.pvLabel.bottom(null).top(0);
				} else {
					this.pvLabel.bottom(0);
				}
			} else if (this.anchor == "left") {
				if (this.titleAlign == "right") {
					this.pvLabel.bottom(null).top(0);
				} else {
					this.pvLabel.bottom(0);
				}
			}
		}

		// Extend title label
		this.extend(this.pvLabel, "titleLabel_");
	}
});
/*
 * Legend panel. Generates the legend. Specific options are:
 * <i>legend</i> - text. Default: false
 * <i>legendPosition</i> - top / bottom / left / right. Default: bottom
 * <i>legendSize</i> - The size of the legend in pixels. Default: 25
 *
 * Has the following protovis extension points:
 *
 * <i>legend_</i> - for the legend Panel
 * <i>legendRule_</i> - for the legend line (when applicable)
 * <i>legendDot_</i> - for the legend marker (when applicable)
 * <i>legendLabel_</i> - for the legend label
 * 
 */
pvc.LegendPanel = pvc.BasePanel.extend({

  _parent: null,
  pvRule: null,
  pvDot: null,
  pvLabel: null,

  anchor: "bottom",
  align: "left",
  pvLegendPanel: null,
  legend: null,
  legendSize: null,
  minMarginX: 8,
  minMarginY: 20,
  textMargin: 6,
  padding: 24,
  textAdjust: 7,
  shape: "square",
  markerSize: 15,
  drawLine: false,
  drawMarker: true,

  constructor: function(chart, options){
    this.base(chart,options);
  },

  create: function(){
    var myself = this,
      c, cLen,
      c1 = this.chart.colors(),
      c2 = this.chart.secondAxisColor(),
      x,y;

    //pvc.log("Debug PMartins");
    
    var data = this.chart.legendSource == "series"
               ? this.chart.dataEngine.getSeries()
               : this.chart.dataEngine.getCategories();
    
    cLen = data.length;

    if (this.chart.options.secondAxis) {
        var args = this.chart.dataEngine.getSecondAxisSeries();
        args.unshift(0);
        args.unshift(data.length);
        data.splice.apply(data, args);
    }
    
    c = function(arg){
        return arg < cLen
               ? c1.apply(this, arguments)
               : c2.call(this, arg - cLen);
    };
    
    // Determine the size of the biggest cell
    // Size will depend on positioning and font size mainly
    var maxTextLen = 0;
    for (var i in data){
        if(maxTextLen < data[i].length){
            maxTextLen = data[i].length;
        }
    }
    
    var cellsize = this.markerSize + maxTextLen * this.textAdjust;

    var realxsize, realysize;
    if (this.anchor == "top" || this.anchor == "bottom"){
      this.width = this._parent.width;
      this.height = this.legendSize;
      var maxperline = data.length;

      //if the legend is bigger than the available size, multi-line and left align
      if(maxperline*(cellsize + this.padding) - this.padding + myself.minMarginX > this.width){
        this.align = "left";
        maxperline = Math.floor((this.width + this.padding - myself.minMarginX)/(cellsize + this.padding));
      }
      realxsize = maxperline*(cellsize + this.padding) + myself.minMarginX - this.padding;
      realysize = myself.padding*(Math.ceil(data.length/maxperline));

      if(this.height == null){
        this.height = realysize;
      }

      //changing margins if the alignment is not "left"
      if(this.align == "right"){
        myself.minMarginX = this.width - realxsize;
      }
      else if (this.align == "center"){
        myself.minMarginX = (this.width - realxsize)/2;
      }

      x = function(){
        return (this.index % maxperline) * (cellsize + myself.padding) + 
                myself.minMarginX;
      };
      
      myself.minMarginY = (myself.height - realysize) / 2;
      
      y = function(){
        var n = Math.floor(this.index/maxperline); 
        return myself.height  - n * myself.padding - myself.minMarginY - myself.padding/2;
      };
      
    } else {
      this.height = this._parent.height;
      this.width = this.legendSize;
      realxsize = cellsize + this.minMarginX;
      realysize = myself.padding*data.length;
      if(this.align == "middle"){
        myself.minMarginY = (myself.height - realysize + myself.padding)/2  ;
      }
      else if (this.align == "bottom"){
        myself.minMarginY = myself.height - realysize;
      }
      x = myself.minMarginX;
      y = function(){
        return myself.height - this.index*myself.padding - myself.minMarginY;
      };
    }

    if(this.width == null){
      this.width = realxsize;
    }

    this.pvPanel = this._parent.getPvPanel().add(this.type)
        .width(this.width)
        .height(this.height);

    //********** Markers and Lines ***************************

    this.pvLegendPanel = this.pvPanel.add(pv.Panel)
        .data(data)
        .def("hidden","false")
        .left(x)
        .bottom(y)
        .height(this.markerSize)
        .cursor("pointer")
        .fillStyle(function(){
          return this.hidden()=="true"
                 ? "rgba(200,200,200,1)"
                 : "rgba(200,200,200,0.0001)";
        })
        .event("click",function(e){
          return myself.toggleVisibility(this.index);
        });

    // defined font function
    var computeDecoration = function(idx){
      if(myself.chart.dataEngine.isVisible(myself.chart.legendSource,idx)){
        return "";
      }
      else{
        return "line-through"
      }
    };
    
    var computeTextStyle = function(idx){
      if(myself.chart.dataEngine.isVisible(myself.chart.legendSource,idx)){
        return "black";
      }
      else{
        return "#ccc";
      }
    };

    if(this.drawLine == true && this.drawMarker == true){
      
      this.pvRule = this.pvLegendPanel.add(pv.Rule)
      .left(0)
      .width(this.markerSize)
      .lineWidth(1)
      .strokeStyle(function(){
        return c(this.index);
      })

      this.pvDot = this.pvRule.anchor("center").add(pv.Dot)
      .shapeSize(this.markerSize)
      .shape(function(){
        return myself.shape ? myself.shape :
          this.parent.index < cLen  ? 'square':
           'bar';
      })
      .lineWidth(0)
      .fillStyle(function(){
        return c(this.parent.index);
      })

      this.pvLabel = this.pvDot.anchor("right").add(pv.Label)
      .textMargin(myself.textMargin)
    }
    else if(this.drawLine == true){
      
      this.pvRule = this.pvLegendPanel.add(pv.Rule)
      .left(0)
      .width(this.markerSize)
      .lineWidth(1)
      .strokeStyle(function(){
        return c(this.parent.index);
      })

      this.pvLabel = this.pvRule.anchor("right").add(pv.Label)
      .textMargin(myself.textMargin)

    }
    else if(this.drawMarker == true){

      this.pvDot = this.pvLegendPanel.add(pv.Dot)
      .left(this.markerSize/2)
      .shapeSize(this.markerSize)
      .shape(function(){
        return myself.shape ? myself.shape :
          this.parent.index < cLen  ? 'square':
           'bar';
      })
      .angle(1.57)
      .lineWidth(2)
      .strokeStyle(function(){
        return c(this.parent.index);
      })
      .fillStyle(function(){
        return c(this.parent.index);
      })


      this.pvLabel = this.pvDot.anchor("right").add(pv.Label)
      .textMargin(myself.textMargin)
    
    }

    this.pvLabel
    .textDecoration(function(){
      return computeDecoration(this.parent.index)
    })
    .textStyle(function(){
      return computeTextStyle(this.parent.index)
    })

    // Extend legend
    this.extend(this.pvPanel,"legendArea_");
    this.extend(this.pvLegendPanel,"legendPanel_");
    this.extend(this.pvRule,"legendRule_");
    this.extend(this.pvDot,"legendDot_");
    this.extend(this.pvLabel,"legendLabel_");
  },

  toggleVisibility: function(idx){
    
    pvc.log("Worked. Toggling visibility of index " + idx);
    this.chart.dataEngine.toggleVisibility(this.chart.legendSource, idx);

    // Forcing removal of tipsy legends
    pvc.removeTipsyLegends();

    // Rerender chart
    this.chart.render(true, true);
    
    return this.pvLabel;
  }
});/**
 * TimeseriesAbstract is the base class for all categorical or timeseries
 */
pvc.TimeseriesAbstract = pvc.Base.extend({

    allTimeseriesPanel : null,
    
    defaultOptions: {
        showAllTimeseries: true,
        allTimeseriesPosition: "bottom",
        allTimeseriesSize: 50
    },
    
    constructor: function(options){
        this.base();

        // Apply options
        $.extend(this.options, this.defaultOptions, options);
    },

    preRender: function(){

        this.base();

        // Do we have the timeseries panel? add it
        if (this.options.showAllTimeseries){
            this.allTimeseriesPanel = new pvc.AllTimeseriesPanel(this, {
                anchor: this.options.allTimeseriesPosition,
                allTimeseriesSize: this.options.allTimeseriesSize
            });

            this.allTimeseriesPanel.appendTo(this.basePanel); // Add it
        }
    }
});


/*
 * AllTimeseriesPanel panel. Generates a small timeseries panel that the user
 * can use to select the range:
 * <i>allTimeseriesPosition</i> - top / bottom / left / right. Default: top
 * <i>allTimeseriesSize</i> - The size of the timeseries in pixels. Default: 100
 *
 * Has the following protovis extension points:
 *
 * <i>allTimeseries_</i> - for the title Panel
 * 
 */
pvc.AllTimeseriesPanel = pvc.BasePanel.extend({

    _parent: null,
    pvAllTimeseriesPanel: null,
    anchor: "bottom",
    allTimeseriesSize: 50,

    constructor: function(chart, options){
        this.base(chart,options);
    },

    create: function(){
        // Size will depend on positioning and font size mainly
        if (this.isAnchorTopOrBottom()){
            this.width  = this._parent.width;
            this.height = this.allTimeseriesSize;
        } else {
            this.height = this._parent.height;
            this.width  = this.allTimeseriesSize;
        }

        this.pvPanel = this._parent.getPvPanel().add(this.type)
            .width(this.width)
            .height(this.height);

        // Extend panel
        this.extend(this.pvPanel,"allTimeseries_");
    }
});/**
 * CategoricalAbstract is the base class for all categorical or timeseries
 */
pvc.CategoricalAbstract = pvc.TimeseriesAbstract.extend({

    yAxisPanel : null,
    xAxisPanel : null,
    secondXAxisPanel: null,
    secondYAxisPanel: null,
    
    categoricalPanel: null, // This will act as a holder for the specific panel

    yScale: null,
    xScale: null,

    // TODO: DCL - ??
    //prevMax: null,
    //prevMin: null,
      
    constructor: function(options){

        this.base(options);

        // Apply options
        $.extend(this.options, pvc.CategoricalAbstract.defaultOptions, options);
        
        // Sanitize some options
        if (!this.options.showYScale){
            this.options.yAxisSize = 0;
        }
        
        if (!this.options.showXScale){
            this.options.xAxisSize = 0;
        }

        if(this.options.secondAxis && this.options.secondAxisIndependentScale){
            this.options.secondAxisSize = this.isOrientationVertical()? 
                this.options.yAxisSize : 
                this.options.xAxisSize;
        } else {
            this.options.secondAxisSize = 0;
        }
    },

    preRender: function(){

        // NOTE: creates root BasePanel, 
        //  and its Title and Legend child panels.
        this.base();

        pvc.log("Prerendering in CategoricalAbstract");
        
        // TODO: DCL - Again??
        // Sanitize some options:
        if (!this.options.showYScale){
            this.options.yAxisSize = 0;
        }
        
        if (!this.options.showXScale){
            this.options.xAxisSize = 0;
        }
        
        // NOTE: must be evaluated before axis panels' creation
        //  because getZZZZScale calls assume this (bypassAxis = false)
        this.xScale = this.getXScale();
        this.yScale = this.getYScale();
        this.secondScale = this.getSecondScale();

        // Generate X axis
        if(this.options.secondAxis){
            // this goes before the other because of the fullGrid
            this.generateSecondXAxis();
        }
        
        this.generateXAxis();
        
        // Generate Y axis
        if(this.options.secondAxis){
            // this goes before the other because of the fullGrid
            this.generateSecondYAxis();
        }
        
        this.generateYAxis();
    },

    /**
     * Generates the X axis. It's in a separate function to allow overriding this value.
     */
    generateXAxis: function(){
    	var o = this.options;
        if (o.showXScale){
            this.xAxisPanel = new pvc.XAxisPanel(this, {
                ordinal: this.isXAxisOrdinal(),
                showAllTimeseries: false,
                anchor: o.xAxisPosition,
                axisSize: o.xAxisSize,
                fullGrid:  o.xAxisFullGrid,
                endLine: o.xAxisEndLine,
                domainRoundMode:  o.xAxisDomainRoundMode,
                desiredTickCount: o.xAxisDesiredTickCount,
                minorTicks:  o.xAxisMinorTicks,
                ordinalElements: this.getAxisOrdinalElements("x"),
                
                clickAction: o.xAxisClickAction,
                useCompositeAxis: o.useCompositeAxis, 
                font: o.axisLabelFont,
                
                doubleClickAction: o.xAxisDoubleClickAction,
                clickDelay: o.axisClickDelay,
                getLabel: o.xAxisGetLabel
            });

            //            this.xAxisPanel.setScale(this.xScale);
            this.xAxisPanel.setScale(this.xScale);
            this.xAxisPanel.appendTo(this.basePanel); // Add it
        }
    },

    /**
     * Generates the Y axis. It's in a separate function to allow overriding this value.
     */
    generateYAxis: function(){
    	var o = this.options;
        if (o.showYScale){
            this.yAxisPanel = new pvc.YAxisPanel(this, {
                ordinal: this.isYAxisOrdinal(),
                showAllTimeseries: false,
                anchor:   o.yAxisPosition,
                axisSize: o.yAxisSize,
                fullGrid: o.yAxisFullGrid,
                endLine:  o.yAxisEndLine,
                domainRoundMode:  o.yAxisDomainRoundMode,
                desiredTickCount: o.yAxisDesiredTickCount,
                minorTicks:       o.yAxisMinorTicks,
                ordinalElements: this.getAxisOrdinalElements("y"),
                useCompositeAxis: o.useCompositeAxis, 
                font: o.axisLabelFont,
                clickAction:       o.yAxisClickAction,
                doubleClickAction: o.yAxisDoubleClickAction,
                clickDelay:        o.axisClickDelay,
                getLabel: o.yAxisGetLabel
            });

            this.yAxisPanel.setScale(this.yScale);
            this.yAxisPanel.appendTo(this.basePanel); // Add it
        }
    },

    /**
     * Generates the second axis for X, if exists and only for horizontal charts.
     */
    generateSecondXAxis: function(){
    	var o = this.options;
        if(o.secondAxisIndependentScale && this.isOrientationHorizontal()){
           
            this.secondXAxisPanel = new pvc.SecondXAxisPanel(this, {
                ordinal: this.isXAxisOrdinal(),
                showAllTimeseries: false,
                anchor: pvc.BasePanel.oppositeAnchor[o.xAxisPosition],
                axisSize: o.secondAxisSize,
                domainRoundMode:  o.secondAxisDomainRoundMode,
                desiredTickCount: o.secondAxisDesiredTickCount,
                minorTicks:       o.secondAxisMinorTicks,

                ordinalElements: this.getAxisOrdinalElements("x"),
                tickColor: o.secondAxisColor
            });

            this.secondXAxisPanel.setScale(this.secondScale);
            this.secondXAxisPanel.appendTo(this.basePanel); // Add it
        }
    },

    /**
     * Generates the second axis for Y, if exists and only for vertical charts.
     */
    generateSecondYAxis: function(){
    	var o = this.options;
        if(o.secondAxisIndependentScale && this.isOrientationVertical()){

            this.secondYAxisPanel = new pvc.SecondYAxisPanel(this, {
                ordinal: this.isYAxisOrdinal(),
                showAllTimeseries: false,
                anchor: pvc.BasePanel.oppositeAnchor[o.yAxisPosition],
                axisSize: o.secondAxisSize,
                domainRoundMode:  o.secondAxisDomainRoundMode,
                desiredTickCount: o.secondAxisDesiredTickCount,
                minorTicks:       o.secondAxisMinorTicks,

                ordinalElements: this.getAxisOrdinalElements("y"),
                tickColor: o.secondAxisColor
            });

            this.secondYAxisPanel.setScale(this.secondScale);
            this.secondYAxisPanel.appendTo(this.basePanel); // Add it
        }
    },

    /**
     * Indicates if xx is an ordinal scale.
     */
    isXAxisOrdinal: function(){
        return this.isOrientationVertical()? 
            !this.options.timeSeries : 
            this.options.orthoAxisOrdinal;
    },

    /**
     * Indicates if yy is an ordinal scale.
     */
    isYAxisOrdinal: function(){
        return this.isOrientationVertical()? 
            this.options.orthoAxisOrdinal :
            !this.options.timeSeries;
    },

    /**
     *  List of elements to use in the axis ordinal.
     */
    getAxisOrdinalElements: function(axis){
        var onSeries = false;

        // onSeries can only be true if the perpendicular axis is ordinal
        if (this.options.orthoAxisOrdinal) {
            // (X && !V) || (!X && V)
            var isVertical = this.isOrientationVertical();
            onSeries = (axis == "x") ? !isVertical : isVertical;
        }

        return onSeries? 
          this.dataEngine.getVisibleSeries() : 
          this.dataEngine.getVisibleCategories();
    },

    /**
     * xx scale for categorical charts.
     * Must be called before axis panels are created (bypassAxis = false).
     */
    getXScale: function(){
        if (this.isOrientationVertical()) {
            return this.options.timeSeries? 
                this.getTimeseriesScale(false, true) : 
                this.getOrdinalScale();
        }

        return this.options.orthoAxisOrdinal ? 
            this.getPerpOrdinalScale("x") :
            this.getLinearScale(false, true);
    },

    /**
     * yy scale for categorical charts.
     * Must be called before axis panels are created (bypassAxis = false).
     */
    getYScale: function(){
        if (this.isOrientationVertical()) {
            return this.options.orthoAxisOrdinal ? 
                this.getPerpOrdinalScale("y") : 
                this.getLinearScale();
        }
        
        return this.options.timeSeries ? 
            this.getTimeseriesScale(): 
            this.getOrdinalScale();
    },

    /**
     * Helper function to facilitate  (refactoring)
     *     - getOrdinalScale()
     *     - getPerpOrdScale()
     *   (CvK)
     */
    getOrdScale: function(bypassAxis, orthoAxis){

        var o = this.options,
            yAxisSize = bypassAxis ? 0 : o.yAxisSize,
            xAxisSize = bypassAxis ? 0 : o.xAxisSize;
        
        // DOMAIN
        var dData = orthoAxis ? 
                this.dataEngine.getVisibleSeries(): 
                this.dataEngine.getVisibleCategories();
        
        var scale = new pv.Scale.ordinal(dData);
        
        // RANGE
        if (orthoAxis) {   // added by CvK
            if (orthoAxis == "y") {
                scale.min = 0;
                scale.max = this.basePanel.height - xAxisSize;
            } else {   // assume orthoAxis == "x"
                scale.min = yAxisSize;
                scale.max = this.basePanel.width;
            }
        } else {   // !orthoAxis (so normal ordinal axis)
            var isX = this.isOrientationVertical(),
                rSize = isX ? this.basePanel.width : this.basePanel.height;

            if (isX){
                var secondYAxisSize = bypassAxis ? 0 : o.secondAxisSize;
                if(o.yAxisPosition == "left"){
                    scale.min = yAxisSize;
                    scale.max = rSize - secondYAxisSize;
                } else {
                    scale.min = secondYAxisSize;
                    scale.max = rSize - yAxisSize;
                }
            } else {
                var secondXAxisSize = bypassAxis ? 0 : o.secondAxisSize;
                scale.min = 0;
                scale.max = rSize - xAxisSize - secondXAxisSize;
            }
        }  // end else-part -- if (orthoAxis)

        var panelSizeRatio = o.panelSizeRatio;
        scale.splitBanded(scale.min, scale.max, panelSizeRatio);
        
        var range = scale.range(),
            step  = range.band / panelSizeRatio; // =def (band + margin)
        
        range.step   = step;
        range.margin = step * (1 - panelSizeRatio);
        
        return scale;
    },

    /**
     * Scale for the ordinal axis. xx if orientation is vertical, yy otherwise.
     */
    getOrdinalScale: function(bypassAxis){
        return this.getOrdScale(bypassAxis, null);
    },
    
    /**
     * Scale for the perpendicular ordinal axis.
     *     yy if orientation is vertical,
     *     xx otherwise
     *   (CvK)
     * 
     *   orthoAxis : "y", "x" or null
     */
    getPerpOrdinalScale: function(orthoAxis){
        return this.getOrdScale(false, orthoAxis);
    },
    
    getLinearScale: function(bypassAxis, bypassOffset){

        var o   = this.options,
            isX = this.isOrientationHorizontal(),
            dMin, // Domain
            dMax;
        
        // DOMAIN
        if(o.stacked){
            dMax = this.dataEngine.getCategoriesMaxSumOfVisibleSeries();
            dMin = 0;
        } else {
            dMax = this.dataEngine.getVisibleSeriesAbsoluteMax();
            dMin = this.dataEngine.getVisibleSeriesAbsoluteMin();
        }
        
        /* If the bounds are the same, things break,
         * so we add a wee bit of variation.
         */
        if (dMin === dMax) {
            dMin = dMin !== 0 ? dMin * 0.99 : o.originIsZero ? 0 : -0.1;
            dMax = dMax !== 0 ? dMax * 1.01 : 0.1;
        }
        
        /* Both negative or both positive */
        if(dMin * dMax > 0 && o.originIsZero){
            if(dMin > 0){
                dMin = 0;
            }else{
                dMax = 0;
            }
        }

        // CvK:  added to set bounds
        var bound = parseFloat(o.orthoFixedMin);
        if(!isNaN(bound)){
            dMin = bound;
        }
        
        bound = parseFloat(o.orthoFixedMax);
        if(!isNaN(bound)){
            dMax = bound;
        }

        // Adding a small offset to the scale's dMin. and dMax.,
        //  as long as they are not 0 and originIsZero=true.
        // DCL: 'axisOffset' is a percentage??
        var dOffset = (dMax - dMin) * o.axisOffset;
        dOffset = bypassOffset ? 0 : dOffset;
        
        var scale = new pv.Scale.linear(
                        dMin - (o.originIsZero && dMin == 0 ? 0 : dOffset),
                        dMax + (o.originIsZero && dMax == 0 ? 0 : dOffset));
        
        // Domain rounding
        pvc.roundScaleDomain(
                scale, 
                isX ? o.xAxisDomainRoundMode  : o.yAxisDomainRoundMode,
                isX ? o.xAxisDesiredTickCount : o.yAxisDesiredTickCount);
        
        // RANGE
        
        // NOTE: By the time this is evaluated,
        // axis panels have not yet been created,
        // but titles and legends already have been...
        var rSize = isX ? this.basePanel.width : this.basePanel.height;
        if(isX){
            var yAxisSize = bypassAxis ? 0 : o.yAxisSize,
                secondYAxisSize = bypassAxis ? 0 : o.secondAxisSize;
            if(o.yAxisPosition == "left"){
                scale.min = yAxisSize;
                scale.max = rSize - secondYAxisSize;
            } else {
                scale.min = secondYAxisSize;
                scale.max = rSize - yAxisSize;
            }

        } else {
            var xAxisSize = bypassAxis ? 0 : o.xAxisSize,
                secondXAxisSize = bypassAxis ? 0 : o.secondAxisSize;
            scale.min = 0;
            scale.max = rSize - xAxisSize - secondXAxisSize;
        }

        scale.range(scale.min, scale.max);
        
        return scale;
    },

    /**
     * Scale for the timeseries axis. xx if orientation is vertical, yy otherwise.
     */
    getTimeseriesScale: function(bypassAxis, bypassOffset){

        var o = this.options,
            isX = this.isOrientationVertical();
        
        // DOMAIN
        
        // TODO - DCLEAO - DataEngine#getCategories already does this...??
        var parser = pv.Format.date(o.timeSeriesFormat),
            categories = this.dataEngine.getVisibleCategories().sort(function(a, b){
                return parser.parse(a) - parser.parse(b);
            });
        
        // Adding a small offset to the scale's domain:
        var dMin = parser.parse(categories[0]),
            dMax = parser.parse(categories[categories.length - 1]),
            dOffset = 0;
        
        if(!bypassOffset){
            dOffset = (dMax.getTime() - dMin.getTime()) * o.axisOffset;
        }

        var scale = new pv.Scale.linear(
                                new Date(dMin.getTime() - dOffset),
                                new Date(dMax.getTime() + dOffset));

        // Domain rounding
        // TODO: pvc.scaleTicks(scale) does not like Dates...
        pvc.roundScaleDomain(
                scale, 
                isX ? o.xAxisDomainRoundMode  : o.yAxisDomainRoundMode,
                isX ? o.xAxisDesiredTickCount : o.yAxisDesiredTickCount);
        
        // RANGE
        var rSize = isX ? this.basePanel.width : this.basePanel.height;
        
        if(isX){
            var yAxisSize = bypassAxis ? 0 : o.yAxisSize,
                secondYAxisSize = bypassAxis ? 0 : o.secondAxisSize;
            if(o.yAxisPosition == "left"){
                scale.min = yAxisSize;
                scale.max = rSize - secondYAxisSize;
            } else {
                scale.min = secondYAxisSize;
                scale.max = rSize - yAxisSize;
            }
        } else {
            var xAxisSize = bypassAxis ? 0 : o.xAxisSize,
                secondXAxisSize = bypassAxis ? 0 : o.secondAxisSize;
            scale.min = 0;
            scale.max = rSize - xAxisSize - secondXAxisSize;
        }

        scale.range(scale.min , scale.max);
        
        return scale;
    },

    /**
     * Scale for the second linear axis. yy if orientation is vertical, xx otherwise.
     */
    // NOTE: bypassOffset is not implemented
    getSecondScale: function(bypassAxis, bypassOffset){

        var o = this.options;
        
        if(!o.secondAxis || !o.secondAxisIndependentScale){
            return this.getLinearScale(bypassAxis, bypassOffset);
        }
        
        // DOMAIN
        var dMax = this.dataEngine.getSecondAxisMax(),
            dMin = this.dataEngine.getSecondAxisMin();

        if(dMin * dMax > 0 && o.secondAxisOriginIsZero){
            if(dMin > 0){
                dMin = 0;
            } else {
                dMax = 0;
            }
        }

        // Adding a small offset to the scale's domain:
        var dOffset = (dMax - dMin) * o.secondAxisOffset,
            scale = new pv.Scale.linear(
                        dMin - (o.secondAxisOriginIsZero && dMin == 0 ? 0 : dOffset),
                        dMax + (o.secondAxisOriginIsZero && dMax == 0 ? 0 : dOffset));

        // Domain rounding
        pvc.roundScaleDomain(scale, o.secondAxisRoundDomain, o.secondAxisDesiredTickCount);
                
        // RANGE
        var yAxisSize = bypassAxis ? 0 : o.yAxisSize,
            xAxisSize = bypassAxis ? 0 : o.xAxisSize,
            isX = this.isOrientationHorizontal(),
            rSize = isX ? this.basePanel.width : this.basePanel.height;
                
        if(isX){
            if(o.yAxisPosition == "left"){
                scale.min = yAxisSize;
                scale.max = rSize;
            } else {
                scale.min = 0;
                scale.max = rSize - yAxisSize;
            }
        } else {
            scale.min = 0;
            scale.max = rSize - xAxisSize;
        }

        scale.range(scale.min, scale.max);
        
        return scale;
    },
    
    markEventDefaults: {
        strokeStyle: "#5BCBF5",  /* Line Color */
        lineWidth: "0.5",  /* Line Width */
        textStyle: "#5BCBF5", /* Text Color */
        verticalOffset: 10, /* Distance between vertical anchor and label */
        verticalAnchor: "bottom", /* Vertical anchor: top or bottom */
        horizontalAnchor: "right", /* Horizontal anchor: left or right */
        forceHorizontalAnchor: false, /* Horizontal anchor position will be respected if true */
        horizontalAnchorSwapLimit: 80 /* Horizontal anchor will switch if less than this space available */
    },
    
    markEvent: function(dateString, label, options){

        if( this.options.timeSeries !== true){
            pvc.log("Attempting to mark an event on a non timeSeries chart");
            return;
        }

        var o = $.extend({}, this.markEventDefaults, options);
        
        var scale = this.getTimeseriesScale(true,true);

        // Are we outside the allowed scale? 
        var d = pv.Format.date(this.options.timeSeriesFormat).parse(dateString);
        var dpos = scale( d );
        
        if( dpos < scale.range()[0] || dpos > scale.range()[1]){
            pvc.log("Event outside the allowed range, returning");
            return;
        }

        // Add the line

        var panel = this.categoricalPanel.pvPanel;
        var h = this.yScale.range()[1];

        // Detect where to place the horizontalAnchor
        var anchor = o.horizontalAnchor;
        if( !o.forceHorizontalAnchor )
        {
            var availableSize = o.horizontalAnchor == "right"?scale.range()[1]-dpos:dpos;
            
            // TODO: Replace this availableSize condition with a check for the text size
            if (availableSize < o.horizontalAnchorSwapLimit ){
                o.horizontalAnchor = o.horizontalAnchor == "right"?"left":"right";
            }
            
        }

        var line = panel.add(pv.Line)
            .data([0,h])
            .strokeStyle(o.strokeStyle)
            .lineWidth(o.lineWidth)
            .bottom(function(d){
                return d;
            })
            .left(dpos);

        //var pvLabel = 
        line.anchor(o.horizontalAnchor)
            .top( o.verticalAnchor == "top" ? o.verticalOffset : (h - o.verticalOffset))
            .add(pv.Label)
            .text(label)
            .textStyle(o.textStyle)
            .visible(function(d){
                return this.index==0;
            });
    }

}, {
	defaultOptions: {
        showAllTimeseries: false, // meaningless here
        showXScale: true,
        showYScale: true,
        
        xAxisPosition: "bottom",
        xAxisSize: 50,
        xAxisFullGrid: false,
        xAxisEndLine:  false,
        xAxisDomainRoundMode: 'none',  // for linear scales
        xAxisDesiredTickCount: null,   // idem
        xAxisMinorTicks:  true,   // idem
        
        yAxisPosition: "left",
        yAxisSize: 50,
        yAxisFullGrid: false,
        yAxisEndLine:  false,
        yAxisDomainRoundMode: 'none',
        yAxisDesiredTickCount: null,
        yAxisMinorTicks:  true,
        
        secondAxis: false,
        secondAxisIdx: -1,
        secondAxisIndependentScale: false,
        secondAxisOriginIsZero: true,
        secondAxisOffset: 0,
        secondAxisColor: "blue",
        //secondAxisSize: 0, // calculated
        secondAxisDomainRoundMode: 'none',  // only with independent second scale
        secondAxisDesiredTickCount: null,   // idem
        secondAxisMinorTicks: true,
        
        panelSizeRatio: 1,
        axisLabelFont: '10px sans-serif',
        
        // CvK  added extra parameter for implementation of HeatGrid
        orthoAxisOrdinal: false
        // if orientation==vertical then perpendicular-axis is the y-axis
        //  else perpendicular-axis is the x-axis.
    }
});


/**
 * AxisPanel panel.
 */
pvc.AxisPanel = pvc.BasePanel.extend({

    _parent: null,
    
    pvRule:     null,
    pvTicks:    null,
    pvLabel:    null,
    pvRuleGrid: null,
    pvEndLine:  null,
    pvScale:    null,
    
    ordinal: false,
    anchor: "bottom",
    axisSize: 30,
    tickLength: 6,
    tickColor: "#aaa",
    panelName: "axis", // override
    scale: null,
    fullGrid: false,
    endLine:  false,
    
    // To be used in linear scales
    domainRoundMode: 'none',
    desiredTickCount: null,
    minorTicks:       true,
    
    ordinalElements: [], // To be used in ordinal scales
    clickAction: null, //TODO: new
    
    //constructor: function(chart, options){
    //    this.base(chart,options);
    //},
    
    create: function(){
        if (this.isAnchorTopOrBottom()){
            this.width  = this._parent.width;
            this.height = this.axisSize;
        } else {
            this.height = this._parent.height;
            this.width  = this.axisSize;
        }

        // Creates this.pvPanel
        this.base();
        
        // ??
        this.extend(this.pvScale, this.panelName + "Scale_");
        
        this.renderAxis();

        // Apply extension points
        this.extend(this.pvPanel,    this.panelName + "_"     );
        this.extend(this.pvRule,     this.panelName + "Rule_" );
        this.extend(this.pvTicks,    this.panelName + "Ticks_");
        this.extend(this.pvLabel,    this.panelName + "Label_");
        this.extend(this.pvRuleGrid, this.panelName + "Grid_" );
        
        if(this.pvEndLine){
            this.extend(this.pvEndLine, this.panelName + "EndLine_");
        }
        
        if(this.pvMinorTicks){
            this.extend(this.pvMinorTicks, this.panelName + "MinorTicks_");
        }
    },

    setScale: function(scale){
        this.pvScale = scale;
        this.scale = scale; // TODO: At least HeatGrid depends on this. Maybe Remove?
    },
    
    /**
     * Initializes a new layer panel.
     * @override
     */
    initLayerPanel: function(pvPanel, layer){
        if(layer === 'gridLines'){
            pvPanel.zOrder(-10);
        }
    },
    
    renderAxis: function(){
        // Z-Order
        // ==============
        // -10 - grid lines   (on 'gridLines' background panel)
        //   0 - content (specific chart types should render content on this zOrder)
        //  10 - end line     (on main foreground panel)
        //  20 - ticks        (on main foreground panel)
        //  30 - ruler (begin line) (on main foreground panel)
        //  40 - labels       (on main foreground panel)
        
        // Range
        var rMin  = this.pvScale.min,
            rMax  = this.pvScale.max,
            rSize = rMax - rMin;
        
        this.pvRule = this.pvPanel.add(pv.Rule)
        		.zOrder(30) // see pvc.js
                .strokeStyle('black')
                // ex: anchor = bottom
                [this.anchorOpposite()](0)     // top    (of the axis panel)
                [this.anchorLength()  ](rSize) // width  
                [this.anchorOrtho()   ](rMin); // left
                
        
        if(this.endLine){
            var anchorOrthoLength = this.anchorOrthoLength(),
                ruleLength = this._parent[anchorOrthoLength] - 
                             this[anchorOrthoLength];
            
        	this.pvEndLine = this.pvRule.add(pv.Rule)
                    .zOrder(10)
                    .visible(true) // break inheritance pvRule's visible property
                    .strokeStyle("#f0f0f0")
                    [this.anchorOpposite()](-ruleLength)
                    [this.anchorLength()  ](null)
                    [this.anchorOrtho()   ](rMax)
                    [anchorOrthoLength    ]( ruleLength);
        }
         
        if (this.ordinal){
            if(this.useCompositeAxis){
                this.renderCompositeOrdinalAxis();
            } else {
                this.renderOrdinalAxis();
            }
        } else {
            this.renderLinearAxis();
        }
    },
    
    renderOrdinalAxis: function(){

        var scale = this.pvScale,
            anchorOpposite    = this.anchorOpposite(),    
            anchorLength      = this.anchorLength(),
            anchorOrtho       = this.anchorOrtho(),
            anchorOrthoLength = this.anchorOrthoLength(),
            ticks = this.ordinalElements;
        
        // Ordinal ticks correspond to ordinal datums.
        // Ordinal ticks are drawn at the center of each band,
        //  and not at the beginning, as in a linear axis.
        this.pvTicks = this.pvRule.add(pv.Rule)
        	.zOrder(20) // see pvc.js
            .data(ticks)
            //[anchorOpposite   ](0)
            [anchorLength     ](null)
            [anchorOrtho      ](function(d){
                return scale(d) + (scale.range().band / 2);
            })
            [anchorOrthoLength](this.tickLength)
            .strokeStyle('rgba(0,0,0,0)'); // Transparent by default, but extensible

        var align = this.isAnchorTopOrBottom() 
                    ? "center"
                    : (this.anchor == "left") ? "right" : "left";
        
        // All ordinal labels are relevant and must be visible
        this.pvLabel = this.pvTicks.anchor(this.anchor).add(pv.Label)
        	.zOrder(40) // see pvc.js
            .textAlign(align)
            //.textBaseline("middle")
            //.text(pv.identity)
            .font("9px sans-serif");
        
        if(this.fullGrid){
            // Grid rules are visible on all ticks,
            //  but on the first tick. 
            // The 1st tick is not shown.
            // The 2nd tick separates categ 1 from categ 2.
            // The Nth tick separates categ. N-1 from categ. N
            // No grid line is drawn at the end.
            var ruleLength = this._parent[anchorOrthoLength] - 
                             this[anchorOrthoLength];
            
            this.pvRuleGrid = this.getPvPanel('gridLines').add(pv.Rule)
                .extend(this.pvRule)
                .data(ticks)
                .strokeStyle("#f0f0f0")
                [anchorOpposite   ](-ruleLength)
                [anchorLength     ](null)
                [anchorOrtho      ](function(d){
                    return scale(d) - scale.range().margin / 2;
                })
                [anchorOrthoLength]( ruleLength)
                .visible(function(){ return (this.index > 0); });
        }
    },

    renderLinearAxis: function(){
        // NOTE: Includes time series, 
        // so "d" may be a number or a Date object...
        
        var scale  = this.pvScale,
            ticks  = pvc.scaleTicks(
                        scale, 
                        this.domainRoundMode === 'tick', 
                        this.desiredTickCount),
            anchorOpposite    = this.anchorOpposite(),    
            anchorLength      = this.anchorLength(),
            anchorOrtho       = this.anchorOrtho(),
            anchorOrthoLength = this.anchorOrthoLength(),
            tickStep = Math.abs(ticks[1] - ticks[0]); // ticks.length >= 2
                
        // (MAJOR) ticks
        var pvTicks = this.pvTicks = this.pvRule.add(pv.Rule)
        	.zOrder(20)
            .data(ticks)
            // [anchorOpposite ](0) // Inherited from pvRule
            [anchorLength     ](null)
            [anchorOrtho      ](scale)
            [anchorOrthoLength](this.tickLength)
            .strokeStyle('black'); // control visibility through color or through .visible
        
        // MINOR ticks are between major scale ticks
        if(this.minorTicks){
            this.pvMinorTicks = this.pvTicks.add(pv.Rule)
                .zOrder(20) // not inherited
                //.data(ticks)  // ~ inherited
                //[anchorOpposite   ](0)   // Inherited from pvRule
                //[anchorLength     ](null)  // Inherited from pvTicks
                [anchorOrtho      ](function(d){ 
                    return scale((+d) + (tickStep / 2)); // NOTE: (+d) converts Dates to numbers, just like d.getTime()
                })
                [anchorOrthoLength](this.tickLength / 2)
                .visible(function(){
                    return (!pvTicks.scene || pvTicks.scene[this.index].visible) &&
                           (this.index < ticks.length - 1); 
                });
        }
        
        this.renderLinearAxisLabel(ticks);
        
        // Now do the full grids
        if(this.fullGrid){
            // Grid rules are visible (only) on MAJOR ticks,
            // except on the first tick.
            // When EndLine is active it is drawn above the last grid line.
            var ruleLength = this._parent[anchorOrthoLength] - 
                             this[anchorOrthoLength];
            
            this.pvRuleGrid = this.getPvPanel('gridLines').add(pv.Rule)
                .extend(this.pvRule)
            	.data(ticks)
                .strokeStyle("#f0f0f0")
                [anchorOpposite   ](-ruleLength)
                [anchorLength     ](null)
                [anchorOrtho      ](scale)
                [anchorOrthoLength]( ruleLength)
                .visible(function(d){
                    return (this.index > 0);
                });
        }
    },
    
    renderLinearAxisLabel: function(ticks){
     // Labels are visible (only) on MAJOR ticks,
        // On first and last tick care is taken
        //  with their H/V alignment so that
        //  the label is not drawn of the chart.

        // Use this margin instead of textMargin, 
        // which affects all margins (left, right, top and bottom).
        // Exception is the small 0.5 textMargin set below....
        var labelAnchor = this.pvTicks.anchor(this.anchor)
                                .addMargin(this.anchorOpposite(), 2);
        
        var label = this.pvLabel = labelAnchor.add(pv.Label)
            .zOrder(40)
            .text(this.pvScale.tickFormat)
            .font("9px sans-serif")
            .textMargin(0.5) // Just enough for some labels not to be cut (vertical)
            .visible(true);
        
        // Label alignment
        var rootPanel = this.pvPanel.root;
        if(this.isAnchorTopOrBottom()){
            label.textAlign(function(){
                if(this.index === 0){
                    var absLeft = label.toScreenTransform().transformHPosition(label.left());
                    if(absLeft <= 0){
                        return 'left'; // the "left" of the text is anchored to the tick's anchor
                    }
                } else if(this.index === ticks.length - 1) { 
                    var absLeft = label.toScreenTransform().transformHPosition(label.left());
                    if(absLeft >= rootPanel.width()){
                        return 'right'; // the "right" of the text is anchored to the tick's anchor
                    }
                }
                return 'center';
            });
        } else {
            label.textBaseline(function(){
                if(this.index === 0){
                    var absTop = label.toScreenTransform().transformVPosition(label.top());
                    if(absTop >= rootPanel.height()){
                        return 'bottom'; // the "bottom" of the text is anchored to the tick's anchor
                    }
                } else if(this.index === ticks.length - 1) { 
                    var absTop = label.toScreenTransform().transformVPosition(label.top());
                    if(absTop <= 0){
                        return 'top'; // the "top" of the text is anchored to the tick's anchor
                    }
                }
                
                return 'middle';
            });
        }
    },
    
/////////////////////////////////////////////////
    //begin: composite axis
    
    getElementsTree: function(elements){
        var tree = {};
       for(var i =0; i<elements.length; i++){
            var baseElem = elements[i][0];
            if(!tree[baseElem]){
                tree[baseElem] = elements[i].length == 1 ? 0 : {};
            }
            var currObj = tree[baseElem];
            for(var j=1;j<elements[i].length;j++){
                var elem = elements[i][j];
                if(!currObj[elem]){
                  currObj[elem] = (j == elements[i].length-1) ? 0 : {};
                }
                currObj = currObj[elem];
            }
        }
    },
    
    getLayoutSingleCluster: function(tree, orientation, maxDepth){
        
        var myself = this;

        var depthLength = this.axisSize;
        //displace to take out bogus-root
        var baseDisplacement = (1.0/++maxDepth)* depthLength;
        var margin = (1.0/12.0) * depthLength;//heuristic compensation
        baseDisplacement -= margin;
        
        var scaleFactor = maxDepth*1.0/ (maxDepth -1);
        var orthogonalLength = pvc.BasePanel.orthogonalLength[orientation];
        //var dlen = (orthogonalLength == 'width')? 'dx' : 'dy';
        
        var displacement = (orthogonalLength == 'width')?
                ((orientation == 'left')? [-baseDisplacement, 0] : [baseDisplacement, 0]) :
                ((orientation == 'top')?  [0, -baseDisplacement] : [0, baseDisplacement]);

        //store without compensation for lasso handling   
        this.axisDisplacement = displacement.slice(0);
        for(var i=0;i<this.axisDisplacement.length;i++){
            if(this.axisDisplacement[i] < 0 ){ this.axisDisplacement[i] -= margin ;}
            else if(this.axisDisplacement[i] > 0 ){ this.axisDisplacement[i] = 0 ;}
            this.axisDisplacement[i] *= scaleFactor;
        }
        
        this.pvRule.lineWidth(0).strokeStyle(null);
        var panel = this.pvRule
                        .add(pv.Panel)[orthogonalLength](depthLength)//.overflow('hidden')
                            .strokeStyle(null).lineWidth(0) //cropping panel
                        .add(pv.Panel)[orthogonalLength](depthLength * scaleFactor ).strokeStyle(null).lineWidth(0);// panel resized and shifted to make bogus root disappear
        panel.transform(pv.Transform.identity.translate(displacement[0], displacement[1]));
        
        //set full path and label
        var nodes = pv.dom(tree).root('').nodes().map(function(node){
            //path
            var path = [];
            path.push(node.nodeName);
            for(var pnode = node.parentNode; pnode != null; pnode = pnode.parentNode){
              path.push(pnode.nodeName);
            }
            node.nodePath = path.reverse().slice(1);
            //label
            if(typeof(myself.getLabel) == 'function' ){
                node.nodeLabel = myself.getLabel(node.nodeName);
            }
            else {
                node.nodeLabel = node.nodeName;
            }
            if(node.nodeLabel == undefined){
                node.nodeLabel = '';
            }
            
            return node;
        });
        
        //create with bogus-root;pv.Hierarchy must always have exactly one root and at least one element besides the root
        var layout = panel.add(pv.Layout.Cluster.Fill)
            .nodes(nodes)
            .orient(orientation)
            ;
            
        //keep node references for lasso selection
        this.storedNodes = nodes;
        
        return layout;
    },
    
    getBreadthCounters: function(elements){
       var breadthCounters = {};
       for(var i =0; i<elements.length; i++){
            var name = elements[i][0];
            if(!breadthCounters[name]){
                breadthCounters[name] = 1;
            }
            else {
                breadthCounters[name] = breadthCounters[name] + 1;
            }
        }
        return breadthCounters;
    },
    
    getAreaSelections: function(x,y,dx,dy,mode){
        
        var selections = [];
        
        if(!this.useCompositeAxis){
            return selections;
        }
        
        x-= this.axisDisplacement[0];
        y-= this.axisDisplacement[1];
        
        this.storedNodes[0].visitBefore(function(node, i){
           if(i==0) {return;}
           var nodeX = node.x + node.dx /2;
           var nodeY = node.y + node.dy /2;
            
            if(nodeX > x && nodeX < x + dx &&
               nodeY > y && nodeY < y + dy){
                selections.push(node.nodePath);
            }
        });
        
        var lastSelection = null;
        var compressedSelections = [];
        for(var i=0; i<selections.length;i++){
            var selection = selections[i];
            if(lastSelection==null || !pvc.arrayStartsWith(selection, lastSelection)){
                lastSelection = selection;
                compressedSelections.push(selection);
            }
        }
        return compressedSelections;
    },
    
    renderCompositeOrdinalAxis: function(){
        var myself = this;

        var axisDirection = (this.anchor == 'bottom' || this.anchor == 'top')?
            'h':
            'v';

        var elements = this.ordinalElements.slice(0);
        //TODO: extend this to work with chart.orientation?
        if(this.anchor == 'bottom' || this.anchor == 'left') {elements.reverse();}
        
        var isHierarchy = true;
        
        //build tree with elements
        var tree = {};
        var sectionNames = [];
        for(var i =0; i<elements.length; i++){
            if(typeof(elements[i]) == 'string'){
                isHierarchy = false;
                tree[elements[i]] = 0;
                sectionNames.push(elements[i]);
                continue;
            }
            var baseElem = elements[i][0];
            if(!tree[baseElem]){
                tree[baseElem] = elements[i].length == 1 ? 0 : {};
                sectionNames.push(baseElem);
            }
            var currObj = tree[baseElem];
            for(var j=1;j<elements[i].length;j++){
                var elem = elements[i][j];
                if(!currObj[elem]){
                  currObj[elem] = (j == elements[i].length-1) ? 0 : {};
                }
                currObj = currObj[elem];
            }
        }
        
        var tipsyGravity = 's';
        switch(this.anchor){
            case 'bottom':
                tipsyGravity = 's';
                break;
            case 'top':
                tipsyGravity = 'n';
                break;
            case 'left':
                tipsyGravity = 'w';
                break;
            case 'right':
                tipsyGravity = 'e';
                break;
        }
        
        var maxDepth =isHierarchy? pv.max(elements, function(col){
            //return $.isArray(col) ? col.length : 1;
            return (col != null && col[0] !== undefined) ? col.length : 1;
        }) : 1;
        
        var layout = this.getLayoutSingleCluster(tree, this.anchor, maxDepth);
    
        var diagDepthCutoff = 2; //depth in [-1/(n+1), 1]
        var vertDepthCutoff = 2;
        //see what will fit so we get consistent rotation
        layout.node
            .def("fitInfo", null)
            .height(function(d,e,f){//just iterate and get cutoff
                var fitInfo = myself.getFitInfo(d.dx, d.dy, d.nodeLabel, myself.font, diagMargin);
                if(!fitInfo.h){
                    
                    if(axisDirection == 'v' && fitInfo.v ){//prefer vertical
                        vertDepthCutoff = Math.min(diagDepthCutoff, d.depth);
                    }
                    else {
                        diagDepthCutoff = Math.min(diagDepthCutoff, d.depth);
                    }
                }
                this.fitInfo( fitInfo );
                return d.dy;
            }) ;
        
        //click / double click interaction
        var ignoreClicks = 0;
        var DBL_CLICK_MAX_DELAY = (this.clickDelay)? this.clickDelay : 300; //ms
        var clickAction = (typeof(this.clickAction) == 'function')?
            function(d, e){
                if(ignoreClicks) { ignoreClicks--; }
                else {
                    myself.clickAction(d, e);
                }
            } :
            null;
            
        var doubleClickAction = (typeof(this.doubleClickAction) == 'function')?
            function(d, e){
                ignoreClicks = 2;
                myself.doubleClickAction(d, e);
            } :
            null;
        
        //label space (left transparent)
        //var lblBar = 
        layout.node.add(pv.Bar)
            .fillStyle('rgba(127,127,127,.001)')
            .strokeStyle( function(d){
                if(d.maxDepth == 1 || d.maxDepth ==0 ) {return null;}
                else {return "rgba(127,127,127,0.3)";} //non-terminal items, so grouping is visible
            })
            .lineWidth( function(d){
                if(d.maxDepth == 1 || d.maxDepth ==0 ) { return 0; }
                else {return 0.5;} //non-terminal items, so grouping is visible
            })
            .text(function(d){
                return d.nodeLabel;
            });
        
        //cutoffs -> snap to vertical/horizontal
        var H_CUTOFF_ANG = 0.30;
        var V_CUTOFF_ANG = 1.27;
        //var V_CUTOFF_RATIO = 0.8;
        var diagMargin = this.getFontSize(this.font) / 2;
        
        var align = this.isAnchorTopOrBottom()? 
            "center"
            : (this.anchor == "left") ? "right" : "left";
        
        //draw labels and make them fit
        this.pvLabel = layout.label.add(pv.Label)
            .def('lblDirection','h')
            .textAngle(function(d)
            {
                var fitInfo = this.fitInfo();
                
                if(d.depth >= vertDepthCutoff && d.depth < diagDepthCutoff){
                        this.lblDirection('v');
                        return -Math.PI/2;
                }
                if(d.depth >= diagDepthCutoff)
                {
                    
                    var tan = d.dy/d.dx;
                    var angle = Math.atan(tan);
                    //var hip = Math.sqrt(d.dy*d.dy + d.dx*d.dx);
                    
                    if(angle > V_CUTOFF_ANG)
                    {
                        this.lblDirection('v');
                        return -Math.PI/2;
                    }
                    else if(angle > H_CUTOFF_ANG) {
                        this.lblDirection('d');
                        return -angle;
                    }
                }
                this.lblDirection('h');
                return 0;//horizontal
            })
            //override central alignment for horizontal text in vertical axis
            .textAlign(function(d){
                return (axisDirection != 'v' || d.depth >= vertDepthCutoff || d.depth >= diagDepthCutoff)? 'center' : align;
            })
            .left(function(d) {
                return (axisDirection != 'v' || d.depth >= vertDepthCutoff || d.depth >= diagDepthCutoff)?
                     d.x + d.dx/2 :
                     ((align == 'right')? d.x + d.dx : d.x);
            })
            .font(myself.font)
            .text(function(d){
                var fitInfo = this.fitInfo();
                switch(this.lblDirection()){
                    case 'h':
                        if(!fitInfo.h){//TODO: fallback option for no svg
                            return myself.trimToWidth(d.dx, d.nodeLabel, myself.font, '..');
                        }
                        break;
                    case 'v':
                        if(!fitInfo.v){
                            return myself.trimToWidth(d.dy, d.nodeLabel, myself.font, '..');
                        }
                        break;
                    case 'd':
                       if(!fitInfo.d){
                          //var ang = Math.atan(d.dy/d.dx);
                          var diagonalLength = Math.sqrt(d.dy*d.dy + d.dx*d.dx) ;
                          return myself.trimToWidth(diagonalLength-diagMargin,d.nodeLabel, myself.font,'..');
                        }
                        break;
                }
                return d.nodeLabel ;
            })
            .cursor( myself.clickAction? 'pointer' : 'default')
            .events('all')//labels don't have events by default
            .event('click', function(d){
                var e = arguments[arguments.length-1];
                if(clickAction){
                    if(doubleClickAction){
                        //arg has to be passed in closure in order to work with ie
                        window.setTimeout(function(){ clickAction(d.nodePath, e); }, DBL_CLICK_MAX_DELAY);
                       // window.setTimeout(clickAction, DBL_CLICK_MAX_DELAY, d.nodePath);
                    }
                    else { clickAction(d.nodePath, e); }
                }
            });

            //tooltip
            this.pvLabel
                //.def('tooltip', '')
                .title(function(d){
                    this.instance()['tooltip'] = d.nodeLabel;
                    return '';
                })
                .event("mouseover", pv.Behavior.tipsy({//Tooltip
                    gravity: tipsyGravity,
                    fade: true,
                    offset: diagMargin * 2,
                    opacity:1
                }));

           // double click label //TODO: need doubleclick axis action + single click prevention..
            if(doubleClickAction)
            {
                this.pvLabel.event("dblclick", function(d){
                    doubleClickAction(d.nodePath, arguments[arguments.length-1]);
                });
            }

    },
    
    getTextSizePlaceholder : function()
    {
        var TEXT_SIZE_PHOLDER_APPEND='_textSizeHtmlObj';
        if(!this.textSizeTestHolder || this.textSizeTestHolder.parent().length == 0)
        {
            var chartHolder = $('#' + this.chart.options.canvas);
            var textSizeTestHolderId = chartHolder.attr('id') + TEXT_SIZE_PHOLDER_APPEND;
            this.textSizeTestHolder = $('#' + this.chart.options.canvas + ' #' + textSizeTestHolderId);
            if(this.textSizeTestHolder.length == 0)
            {
                this.textSizeTestHolder = $('<div>')
                    .attr('id', textSizeTestHolderId)
                    .css('position', 'absolute')
                    .css('visibility', 'hidden')
                    .css('width', 'auto')
                    .css('height', 'auto');
                chartHolder.append(this.textSizeTestHolder);
            }
        }
        return this.textSizeTestHolder;
    },

    getTextSizePvLabel: function(text, font)
    {
        if(!this.textSizePvLabel || this.textSizeLabelFont != font){
            var holder = this.getTextSizePlaceholder();
            var holderId = holder.attr('id');
            var panel = new pv.Panel();
            panel.canvas(holderId);
            var lbl = panel.add(pv.Label).text(text);
            if(font){
                lbl.font(font);
            }
            panel.render();
            this.textSizePvLabel = $('#' + holderId + ' text');
            this.textSizeLabelFont = font;
        }
        else {
            this.textSizePvLabel.text(text);
        }
        
        return this.textSizePvLabel[0];
    },
    
    getTextLength: function(text, font){
        
        switch(pv.renderer()){            
            case 'vml':
                return this.getTextLenVML(text, font);
            case 'batik':
                return getTextLenCGG(text, font);
            case 'svg':
            default:
                return this.getTextLenSVG(text, font);
        }
      //  
      //return (pv.renderer() != 'vml')?//TODO: support svgweb? defaulting to svg
      //  this.getTextLenSVG(text, font) :
      //  this.getTextLenVML(text, font) ;
    },
    
    getTextLenSVG: function(text, font){
        var lbl = this.getTextSizePvLabel(text, font);
        var box = lbl.getBBox();
        return box.width;
    },
    
    getTextLenVML: function(text, font){
        return pv.Vml.text_dims(text, font).width;
    },
    
    //TODO: if not in px?..
    getFontSize: function(font){
        if(pv.renderer() == 'batik'){
            var sty = document.createElementNS('http://www.w3.org/2000/svg','text').style;
            sty.setProperty('font',font);
            return parseInt(sty.getProperty('font-size'));
        }
        else {
            var holder = this.getTextSizePlaceholder();
            holder.css('font', font);
            return parseInt(holder.css('font-size'));//.slice(0,-2);
        }
    },
    
    getFitInfo: function(w, h, text, font, diagMargin)
    {    
        if(text == '') return {h:true, v:true, d:true};
        var len = this.getTextLength(text, font);
        
        var fitInfo =
        {
            h: len <= w,
            v: len <= h,
            d: len <= Math.sqrt(w*w + h*h) - diagMargin
        };
        return fitInfo;
    },
    
    trimToWidth: function(len,text,font,trimTerminator){
      if(text == '') return text;
      var textLen = this.getTextLength(text, font);
      
      if(textLen <= len){
        return text;
      }
      
      if(textLen > len * 1.5){//cutoff for using other algorithm
        return this.trimToWidthBin(len,text,font,trimTerminator);
      }
      
      while(textLen > len){
        text = text.slice(0,text.length -1);
        textLen = this.getTextLength(text, font);
      }
      return text + trimTerminator;
    },
    
    trimToWidthBin :function(len,text,font,trimTerminator){
        
        var high = text.length-2;
        var low = 0;
        var mid;
        var textLen;
        
        while(low <= high && high > 0){
            
            mid = Math.ceil((low + high)/2);
            //text = text.slice(0,mid);
            textLen = this.getTextLength(text.slice(0,mid), font);
            
            if(textLen > len){
                high = mid-1;
            }
            else {
                if( this.getTextLength(text.slice(0,mid+1), font) < len ){
                    low = mid+1;
                }
                else return text.slice(0,mid) + trimTerminator;
            }
            
        }
        
        return text.slice(0,high) + trimTerminator; 
    },
    
    //TODO: use for IE if non-svg option kept
    doesTextSizeFit: function(length, text, font){
        var MARGIN = 4;//TODO: hcoded
        var holder = this.getTextSizePlaceholder();
        holder.text(text);
        return holder.width() - MARGIN <= length;
    }
    
    // end: composite axis
    /////////////////////////////////////////////////
});

/*
 * XAxisPanel panel.
 *
 */
pvc.XAxisPanel = pvc.AxisPanel.extend({

    anchor: "bottom",
    panelName: "xAxis"

    //constructor: function(chart, options){
    //    this.base(chart,options);
    //}
});

/*
 * SecondXAxisPanel panel.
 *
 */
pvc.SecondXAxisPanel = pvc.XAxisPanel.extend({

    panelName: "secondXAxis"

    //constructor: function(chart, options){
    //    this.base(chart,options);
    //}
});


/*
 * YAxisPanel panel.
 *
 */
pvc.YAxisPanel = pvc.AxisPanel.extend({

    anchor: "left",
    panelName: "yAxis"

    //constructor: function(chart, options){
    //    this.base(chart,options);
    //}
});

/*
 * SecondYAxisPanel panel.
 *
 */
pvc.SecondYAxisPanel = pvc.YAxisPanel.extend({

    panelName: "secondYAxis"

    //constructor: function(chart, options){
    //    this.base(chart,options);
    //}
});



/**
 * PieChart is the main class for generating... pie charts (surprise!).
 */

pvc.PieChart = pvc.Base.extend({

  pieChartPanel : null,
  legendSource: "categories",
  tipsySettings: {
    gravity: "s",
    fade: true
  },

  constructor: function(o){

    this.base(o);

    // Apply options
    $.extend(this.options, pvc.PieChart.defaultOptions, o);
  },

  preRender: function(){

    this.base();

    pvc.log("Prerendering in pieChart");


    this.pieChartPanel = new pvc.PieChartPanel(this, {
      innerGap: this.options.innerGap,
      explodedSliceRadius: this.options.explodedSliceRadius,
      explodedSliceIndex: this.options.explodedSliceIndex,
      showValues: this.options.showValues,
      showTooltips: this.options.showTooltips
    });

    this.pieChartPanel.appendTo(this.basePanel); // Add it

  }

}, {
	defaultOptions: {
		showValues: true,
		innerGap: 0.9,
		explodedSliceRadius: 0,
		explodedSliceIndex: null,
		showTooltips: true,
		tooltipFormat: function(s, c, v){
			var val = this.chart.options.valueFormat(v);
			return c + ":  " + val + " (" + Math.round(v / this.sum * 100, 1) + "%)";
		}
    }
});


/*
 * Pie chart panel. Generates a pie chart. Specific options are:
 * <i>showValues</i> - Show or hide slice value. Default: false
 * <i>explodedSliceIndex</i> - Index of the slice to explode. Default: null
 * <i>explodedSliceRadius</i> - If one wants a pie with an exploded effect,
 *  specify a value in pixels here. If above argument is specified, explodes
 *  only one slice. Else explodes all. Default: 0
 * <i>innerGap</i> - The percentage of the inner area used by the pie. Default: 0.9 (90%)
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>pie_</i> - for the main pie wedge
 * <i>pieLabel_</i> - for the main pie label
 */


pvc.PieChartPanel = pvc.BasePanel.extend({

  _parent: null,
  pvPie: null,
  pvPieLabel: null,
  data: null,

  innerGap: 0.9,
  explodedSliceRadius: 0,
  explodedSliceIndex: null,
  showTooltips: true,
  showValues: true,

  sum: 0,

  constructor: function(chart, options){

    this.base(chart,options);

  },

  create: function(){

    var myself=this;
    this.width = this._parent.width;
    this.height = this._parent.height;

    this.pvPanel = this._parent.getPvPanel().add(this.type)
    .width(this.width)
    .height(this.height)


    // Add the chart. For a pie chart we have one series only

    var colors = this.chart.colors(pv.range(this.chart.dataEngine.getCategoriesSize()));
    var colorFunc = function(d){
      var cIdx = myself.chart.dataEngine.getVisibleCategoriesIndexes()[this.index];
      return colors(cIdx);
    };
    
    this.data = this.chart.dataEngine.getVisibleValuesForSeriesIndex(0);

    this.sum = pv.sum(this.data);
    var a = pv.Scale.linear(0, this.sum).range(0, 2 * Math.PI);
    var r = pv.min([this.width, this.height])/2 * this.innerGap;

    pvc.log("Radius: "+ r + "; Maximum sum: " + this.sum);


    this.pvPie = this.pvPanel.add(pv.Wedge)
    .data(this.data)
    .bottom(function(d){
      return myself.explodeSlice("cos", a, this.index);
    })
    .left(function(d){
      return myself.explodeSlice("sin", a, this.index);
    })
    .outerRadius(function(d){
      return myself.chart.animate(0 , r)
    })
    .fillStyle(colorFunc)
    .angle(function(d){
      return a(d)
    })
    .text(function(d){
      var s = myself.chart.dataEngine.getVisibleSeries()[this.parent.index]
      var c = myself.chart.dataEngine.getVisibleCategories()[this.index]
      return myself.chart.options.tooltipFormat.call(myself,s,c,d);
    })

    if(this.showTooltips){
      this.extend(this.chart.tipsySettings,"tooltip_");
      this.pvPie
      .event("mouseover", pv.Behavior.tipsy(this.chart.tipsySettings));

    }


    if (this.chart.options.clickable){
      this.pvPie
      .cursor("pointer")
      .event("click",function(d){
        var s = myself.chart.dataEngine.getVisibleSeries()[this.parent.index];
        var c = myself.chart.dataEngine.getVisibleCategories()[this.index];
        var e = arguments[arguments.length-1];
        return myself.chart.options.clickAction(s, c, d, e);
      });
    }

    // Extend pie
    this.extend(this.pvPie,"pie_");


    this.pvPieLabel = this.pvPie.anchor("outer").add(pv.Label)
    //.textAngle(0)
    .text(function(d){
      return " "+ d.toFixed(2)
    })
    .textMargin(10)
    .visible(this.showValues);

    // Extend pieLabel
    this.extend(this.pvPieLabel,"pieLabel_");


    // Extend body
    this.extend(this.pvPanel,"chart_");


  },

  accumulateAngle: function(a,idx){

    var arr = this.data.slice(0,idx);
    arr.push(this.data[idx]/2);
    var angle = a(pv.sum(arr));
    return angle;

  },

  explodeSlice: function(fun, a, idx){

    var size = 0;
    if(this.explodedSliceIndex == null){
      size = this.explodedSliceRadius
    }
    else{
      size = this.explodedSliceIndex==idx?this.explodedSliceRadius:0;
    }
    return (fun=="cos"?this.height:this.width)/2 + size*Math[fun](this.accumulateAngle(a,idx));

  }

});
/**
 * BarChart is the main class for generating... bar charts (another surprise!).
 */

pvc.BarChart = pvc.CategoricalAbstract.extend({

    barChartPanel : null,

    constructor: function(o){

        this.base(o);

        var _defaults = {
            showValues: true,
            stacked: false,
            panelSizeRatio: 0.9,
            barSizeRatio: 0.9,
            maxBarSize: 2000,
            valuesAnchor: "center",
            originIsZero: true,
            axisOffset: 0,
            showTooltips: true,
            orientation: "vertical",
            orthoFixedMin: null,
            orthoFixedMax: null
        };

        // Apply options
        $.extend(this.options,_defaults, o);
    },
    
    /**
     * Creates a custom WaterfallDataEngine.
     * [override]
     */
    createDataEngine: function(){
        return new pvc.WaterfallDataEngine(this);
    },

    preRender: function(){

        this.base();

        pvc.log("Prerendering in barChart");

        this.barChartPanel = new pvc.WaterfallChartPanel(this, {
            stacked: this.options.stacked,
            waterfal: false,
            panelSizeRatio: this.options.panelSizeRatio,
            barSizeRatio: this.options.barSizeRatio,
            maxBarSize: this.options.maxBarSize,
            showValues: this.options.showValues,
            valuesAnchor: this.options.valuesAnchor,
            showTooltips: this.options.showTooltips,
            orientation: this.options.orientation
        });

        this.barChartPanel.appendTo(this.basePanel); // Add it

    }

}
);


/***************
 *  removed BarChartPanel  (CvK)
 *
 * Refactored the CODE:  BarChartPanel is now replaced by the
 *    WaterfallChartPanel as the Waterfallchart code is easier to extend.
 *    (in a next refactoringstep we could take the waterfall specific
 *     code out of the Waterfallchart panel out and make 
 *     restore inherence to waterfall being a special case of barChart.
 *
 ***************/




/**
 * ScatterAbstract is the class that will be extended by dot, line, stackedline and area charts.
 */

pvc.ScatterAbstract = pvc.CategoricalAbstract.extend({

  scatterChartPanel : null,
  tipsySettings: {
    gravity: "s",
    fade: true
  },

  constructor: function(o){

    this.base(o);

    var _defaults = {
      showDots: false,
      showLines: false,
      showAreas: false,
      showValues: false,
      showTooltips: true,
      axisOffset: 0.05,
      valuesAnchor: "right",
      stacked: false,
      originIsZero: true,
      orientation: "vertical",
      timeSeries: false,
      timeSeriesFormat: "%Y-%m-%d",
      panelSizeRatio: 1,
      orthoFixedMin: null,
      orthoFixedMax: null
    };


    // Apply options
    $.extend(this.options,_defaults, o);


  },
      
  preRender: function(){

    this.base();

    pvc.log("Prerendering in ScatterAbstract");


    this.scatterChartPanel = new pvc.ScatterChartPanel(this, {
      stacked: this.options.stacked,
      showValues: this.options.showValues,
      valuesAnchor: this.options.valuesAnchor,
      showLines: this.options.showLines,
      showDots: this.options.showDots,
      showAreas: this.options.showAreas,
      showTooltips: this.options.showTooltips,
      orientation: this.options.orientation,
      timeSeries: this.options.timeSeries,
      timeSeriesFormat: this.options.timeSeriesFormat
    });
    
    this.categoricalPanel = this.scatterChartPanel;

    this.scatterChartPanel.appendTo(this.basePanel); // Add it

  }

}
);

/**
 * Dot Chart
 *
 */

pvc.DotChart = pvc.ScatterAbstract.extend({

  constructor: function(o){

    this.base();

    var _defaults = {
      showDots: true,
      showLines: false,
      showAreas: false,
      showValues: false,
      stacked: false
    };

    // Apply options
    $.extend(this.options,_defaults, o);

  }
});


/**
 * Line Chart
 *
 */

pvc.LineChart = pvc.ScatterAbstract.extend({

  constructor: function(o){

    this.base();

    var _defaults = {
      showDots: false, // ask
      showLines: true,
      showAreas: false,
      showValues: false,
      stacked: false
    };

    // Apply options
    $.extend(this.options,_defaults, o);


  }
});



/**
 * Stacked Line Chart
 *
 */

pvc.StackedLineChart = pvc.ScatterAbstract.extend({

  constructor: function(o){

    this.base();

    var _defaults = {
      showDots: false, // ask
      showLines: true,
      showAreas: false,
      showValues: false,
      stacked: true
    };

    // Apply options
    $.extend(this.options,_defaults, o);


  }
});


/**
 * Stacked Area Chart
 *
 */

pvc.StackedAreaChart = pvc.ScatterAbstract.extend({

  constructor: function(o){

    this.base();

    var _defaults = {
      showDots: false, // ask
      showLines: false,
      showAreas: true,
      showValues: false,
      stacked: true
    };

    // Apply options
    $.extend(this.options,_defaults, o);


  }
});



/*
 * Scatter chart panel. Base class for generating the other xy charts. Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showDots</i> - Show or hide dots. Default: true
 * <i>showValues</i> - Show or hide line value. Default: false
 * <i>stacked</i> -  Stacked? Default: false
 * <i>panelSizeRatio</i> - Ratio of the band occupied by the pane;. Default: 0.5 (50%)
 * <i>lineSizeRatio</i> - In multiple series, percentage of inner
 * band occupied by lines. Default: 0.5 (50%)
 * <i>maxLineSize</i> - Maximum size of a line in pixels. Default: 2000
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>line_</i> - for the actual line
 * <i>linePanel_</i> - for the panel where the lines sit
 * <i>lineDot_</i> - the dots on the line
 * <i>lineLabel_</i> - for the main line label
 */


pvc.ScatterChartPanel = pvc.BasePanel.extend({

  _parent: null,
  pvLine: null,
  pvArea: null,
  pvDot: null,
  pvLabel: null,
  pvCategoryPanel: null,
  data: null,

  timeSeries: false,
  timeSeriesFormat: "%Y-%m-%d",

  stacked: false,
  showAreas: false,
  showLines: true,
  showDots: true,
  showValues: true,
  showTooltips: true,
  valuesAnchor: "right",
  orientation: "vertical",


  constructor: function(chart, options){

    this.base(chart,options);

  },
  
  /* @Override */
  isOrientationVertical: function(){
    return this.orientation == "vertical";
  },
    
  /* @Override */
  isOrientationHorizontal: function(){
    return this.orientation == "horizontal";
  },
  
  create: function(){

    var myself = this;
    
    this.width = this._parent.width;
    this.height = this._parent.height;
    
    // Creates the pvPanel
    this.base();
    
    // add clipping for bounds
    if((myself.chart.options.orthoFixedMin != null) || 
       (myself.chart.options.orthoFixedMax != null)){
      this.pvPanel["overflow"]("hidden");
    }
    
    if(this.showTooltips || this.chart.options.clickable ){
      this.pvPanel
          .events("all")
          .event("mousemove", pv.Behavior.point(Infinity));
    }

    var isVertical = this.isOrientationVertical(),
        anchor = isVertical ? "bottom" : "left";

    // Extend body, resetting axisSizes

    var lScale = this.chart.getLinearScale(true),
        oScale = null, // ~ eclipse warning
        tScale = null, // ~ eclipse warning 
        parser = null; // ~ eclipse warning
    
    if(this.timeSeries){
        tScale = this.chart.getTimeseriesScale(true, true);
        parser = pv.Format.date(this.timeSeriesFormat);
    } else {
        oScale = this.chart.getOrdinalScale(true);
    }
    
    var colors = this.chart.colors(pv.range(this.chart.dataEngine.getSeriesSize()));
    var colorFunc = function(d){
      // return colors(d.serieIndex)
      return colors(myself.chart.dataEngine.getVisibleSeriesIndexes()[this.parent.index]);
    };

    // Stacked?
    if (this.stacked){
      var dataSet = pvc.padMatrixWithZeros(
                        this.chart.dataEngine.getVisibleTransposedValues());
      this.pvScatterPanel = this.pvPanel.add(pv.Layout.Stack)
              .layers(dataSet)
              // Stacked Vertical charts show series from
              //  top to bottom (according to the legend)
              .order(isVertical  ? "reverse"  : null)
              [isVertical ? "x" : "y"](
                    myself.timeSeries ?
                    function(){
                        return tScale(parser.parse(myself.chart.dataEngine.getCategoryByIndex(this.index)));
                    } :
                    function(){
                        return oScale(myself.chart.dataEngine.getCategoryByIndex(this.index)) + 
                               oScale.range().band/2;
                    })
              [anchor](lScale(0))
              [isVertical ? "y" : "x"](function(d){
                return myself.chart.animate(0, lScale(d) - lScale(0));
              });

      this.pvArea = this.pvScatterPanel.layer.add(pv.Area)
                            .fillStyle(this.showAreas?colorFunc:null);

      this.pvLine = this.pvArea.anchor(pvc.BasePanel.oppositeAnchor[anchor]).add(pv.Line)
                            .lineWidth(this.showLines?1.5:0.001);
    } else{

      this.pvScatterPanel = this.pvPanel.add(pv.Panel)
                .data(this.chart.dataEngine.getVisibleSeriesIndexes());

      this.pvArea = this.pvScatterPanel.add(pv.Area)
                .fillStyle(this.showAreas ? colorFunc : null);

      this.pvLine = this.pvArea.add(pv.Line)
          .data(function(d){
                return myself.chart.dataEngine.getObjectsForSeriesIndex(
                        d, 
                        this.timeSeries ?
                            function(a,b){
                                return parser.parse(a.category) - 
                                       parser.parse(b.category);
                            } : 
                            null);
                })
          .lineWidth(this.showLines?1.5:0.001)
          .segmented(true)
          .visible(pvc.nonEmpty)
          [pvc.BasePanel.relativeAnchor[anchor]](
                myself.timeSeries ?
                  function(d){ return tScale(parser.parse(d.category)); } :
                  function(d){ return oScale(d.category) + oScale.range().band/2; })
          [anchor](function(d){ 
              return myself.chart.animate(0,lScale(d.value)); 
          });
    }

    this.pvLine
        .strokeStyle(colorFunc)
        .lineJoin(null)
        .text(function(d){
            var v, 
                c,
                s = myself.chart.dataEngine.getVisibleSeries()[this.parent.index];
          
            if( d != null && typeof d == "object"){
                v = d.value;
                c = d.category;
            } else {
                v = d;
                c = myself.chart.dataEngine.getVisibleCategories()[this.index];
            }
            
            return myself.chart.options.tooltipFormat.call(myself, s, c, v);
        });

    if(this.showTooltips){
      this.extend(this.chart.tipsySettings,"tooltip_");
      this.pvLine
        .event("point", pv.Behavior.tipsy(this.chart.tipsySettings));
    }

    this.pvDot = this.pvLine.add(pv.Dot)
        .shapeSize(12)
        .lineWidth(1.5)
        .strokeStyle(this.showDots?colorFunc:null)
        .fillStyle(this.showDots?colorFunc:null);

    if (this.chart.options.clickable){
      this.pvDot
      .cursor("pointer")
      .event("click",function(d){
        var v, c;
        var s = myself.chart.dataEngine.getVisibleSeries()[this.parent.index];
        if(  d != null && typeof d == "object"){
          v = d.value;
          c = d.category;
        }
        else{
          v = d;
          c = myself.chart.dataEngine.getVisibleCategories()[this.index];
        }
        var e = arguments[arguments.length-1];
        return myself.chart.options.clickAction(s, c, v, e);
      });
    }

    if(this.showValues){
      this.pvLabel = this.pvDot
      .anchor(this.valuesAnchor)
      .add(pv.Label)
      .bottom(0)
      .text(function(d){
        return myself.chart.options.valueFormat( (d != null && typeof d == "object")?d.value:d);
      });

      // Extend lineLabel
      this.extend(this.pvLabel,"lineLabel_");
    }

    // Extend line and linePanel
    this.extend(this.pvScatterPanel,"scatterPanel_");
    this.extend(this.pvArea,"area_");
    this.extend(this.pvLine,"line_");
    this.extend(this.pvDot,"dot_");
    this.extend(this.pvLabel,"label_");

    // Extend body
    this.extend(this.pvPanel,"chart_");

  }

});
/**
 * HeatGridChart is the main class for generating... heatGrid charts.
 *  A heatGrid visualizes a matrix of values by a grid (matrix) of *
 *  bars, where the color of the bar represents the actual value.
 *  By default the colors are a range of green values, where
 *  light green represents low values and dark green high values.
 *  A heatGrid contains:
 *     - two categorical axis (both on x and y-axis)
 *     - no legend as series become rows on the perpendicular axis 
 *  Please contact CvK if there are issues with HeatGrid at cde@vinzi.nl.
 */

pvc.HeatGridChart = pvc.CategoricalAbstract.extend({

    heatGridChartPanel : null,

    constructor: function(o){

        this.base(o);

        // enforce some defaults for the HeatGridChart
        this.options.legend = false;
        this.options.orthoAxisOrdinal = true;
        this.options.orginIsZero = true;

        var self = this;
        var _defaults = {
            colorValIdx: 0,
            sizeValIdx: 0,
            defaultValIdx:0,
            measuresIndexes: [2],
            //multi-dimensional clickable label
            useCompositeAxis:false,
            showValues: true,
            //originIsZero: true,
            axisOffset: 0,
            showTooltips: true,
            orientation: "vertical",
            // use a categorical here based on series labels
            scalingType: "linear",    // "normal" (distribution) or "linear"
            normPerBaseCategory: true,
            orthoAxisOrdinal: true,
            numSD: 2,                 // width (only for normal distribution)
            //minColor: "white",
            //maxColor: "darkgreen",
            nullColor:  "#efc5ad",  // white with a shade of orange
            rubberBandFill: 'rgba(203, 239, 163, 0.6)',
            rubberBandLine: '#86fe00',
            xAxisClickAction: function(item, event){
                self.heatGridChartPanel.selectAxisValue('x', item, !self.options.ctrlSelectMode || event.ctrlKey);
                self.heatGridChartPanel.pvPanel.render();
                self.heatGridChartPanel.triggerSelectionChange();
            },
            yAxisClickAction: function(item, event){ //TODO: move elsewhere?
                self.heatGridChartPanel.selectAxisValue('y', item, !self.options.ctrlSelectMode || event.ctrlKey);
                self.heatGridChartPanel.pvPanel.render();
                self.heatGridChartPanel.triggerSelectionChange();
            },
            colorRange: ['red', 'yellow','green']
        };

        // Apply options
        $.extend(this.options,_defaults, o);

        // enforce some defaults for the HeatGridChart
        this.options.orthoAxisOrdinal = true;
        this.options.legend = false;
        this.options.orginIsZero = true;
        
        if(this.options.useCompositeAxis){//force array support
            this.options.isMultiValued = true;
        }

    },

    preRender: function(){

        this.base();

        pvc.log("Prerendering in heatGridChart");

        this.heatGridChartPanel = new pvc.HeatGridChartPanel(this, {
            stacked: this.options.stacked,
            panelSizeRatio: this.options.panelSizeRatio,
            heatGridSizeRatio: this.options.heatGridSizeRatio,
            maxHeatGridSize: this.options.maxHeatGridSize,
            showValues: this.options.showValues,
            showTooltips: this.options.showTooltips,
            orientation: this.options.orientation
        });

        this.categoricalPanel = this.heatGridChartPanel;

        this.heatGridChartPanel.appendTo(this.basePanel); // Add it

    }

}
);


/*
 * HeatGrid chart panel. Generates a heatGrid chart. Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showValues</i> - Show or hide heatGrid value. Default: false
 * <i>stacked</i> -  Stacked? Default: false
 * <i>panelSizeRatio</i> - Ratio of the band occupied by the pane;. Default: 0.5 (50%)
 * <i>heatGridSizeRatio</i> - In multiple series, percentage of inner
 * band occupied by heatGrids. Default: 0.5 (50%)
 * <i>maxHeatGridSize</i> - Maximum size of a heatGrid in pixels. Default: 2000
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>heatGrid_</i> - for the actual heatGrid
 * <i>heatGridPanel_</i> - for the panel where the heatGrids sit
 * <i>heatGridLabel_</i> - for the main heatGrid label
 */


pvc.HeatGridChartPanel = pvc.BasePanel.extend({

    _parent: null,
    pvHeatGrid: null,
    pvHeatGridLabel: null,
    data: null,

    stacked: false,
    panelSizeRatio: 1,
    heatGridSizeRatio: 0.5,
    showTooltips: true,
    maxHeatGridSize: 200,
    showValues: true,
    orientation: "vertical",

    colorValIdx: 0,
    sizeValIdx: 0,
    defaultValIdx:0,
    shape: "square",
    nullShape: "cross",
    defaultBorder: 1,
    nullBorder: 2,
    selectedBorder: 2,
    //function to be invoked when a selection occurs
    // (shape click-select, row/column click and lasso finished)
    onSelectionChange: null,
    selectNullValues: false,
    
    selections: {},

    constructor: function(chart, options){

        this.base(chart,options);

    },

    getValue: function(d, i){
        if(d!=null && d[0] !== undefined){
            if(i != null && d[i] !== undefined) return d[i];
            else return d[0];
        }
        else return d;
    },
    
    getColorValue: function(d){
        return this.getValue(d, this.colorValIdx);
    },


    valuesToText: function(vals){
        if(vals != null && vals[0] !== undefined){// $.isArray(vals)){
            return vals.join(', ');
        }
        else return vals;
    },

    create: function(){

        var myself = this;
        var opts = this.chart.options;
        this.width = this._parent.width;
        this.height = this._parent.height;
        
        this.colorValIdx = opts.colorValIdx;
        this.sizeValIdx = opts.sizeValIdx;
        this.selectNullValues = opts.nullShape != null;
        
        //colors
        opts.nullColor = pv.color(opts.nullColor);
        if(opts.minColor != null) opts.minColor = pv.color(opts.minColor);
        if(opts.maxColor != null) opts.maxColor = pv.color(opts.maxColor);
        
        if(opts.shape != null) {this.shape = opts.shape;}
        
        //event triggering
        this.onSelectionChange = opts.onSelectionChange;

        this.pvPanel = this._parent.getPvPanel().add(this.type)
        .width(this.width)
        .height(this.height)

        var anchor = this.orientation == "vertical"?"bottom":"left";

        // reuse the existings scales
        var xScale = this.chart.xAxisPanel.scale;
        var yScale = this.chart.yAxisPanel.scale;
        
        var cols =  (anchor == "bottom") ? xScale.domain() : yScale.domain();

        var origData = this.chart.dataEngine.getVisibleTransposedValues();
        // create a mapping of the data that shows the columns (rows)
        var data = origData.map(function(d){
            return pv.dict(cols, function(){
                return  d[this.index];
            });
        });

        // get an array of scaling functions (one per column)
        var fill = this.getColorScale(data, cols);

        /* The cell dimensions. */
        var w = (xScale.max - xScale.min)/xScale.domain().length;
        var h = (yScale.max - yScale.min)/yScale.domain().length;

        if (anchor != "bottom") {
            var tmp = w;
            w = h;
            h = tmp;
        }
        
        //reset selections
        this.initSelections(null);

        this.pvHeatGrid = this.pvPanel.add(pv.Panel)
            .data(cols)
            [pvc.BasePanel.relativeAnchor[anchor]](function(){ //ex: datum.left(i=1 * w=15)
                return this.index * w;
                })
            [pvc.BasePanel.parallelLength[anchor]](w)
            .add(pv.Panel)
            .data(data)
            [anchor]
            (function(){
                return this.index * h;
            })
            [pvc.BasePanel.orthogonalLength[anchor]](h)
            .antialias(false)
            .strokeStyle(null)
            .lineWidth(0)
            .overflow('hidden'); //overflow important if showValues=true
        
        //tooltip text
         this.pvHeatGrid.text(function(d,f){
              return myself.getValue(d[f]);
         });
         
        //set coloring and shape / sizes if enabled
       if(opts.useShapes)
       {
            this.createHeatMap(data, w,h, opts, fill);
       }
       else
       {//no shapes, apply color map to panel iself
        this.pvHeatGrid.fillStyle(function(dat, col){
             return  (dat[col] != null) ? fill[col](dat[col]) : opts.nullColor;
         });
                //Tooltip
        if(this.showTooltips){
            this.pvHeatGrid
            .event("mouseover", pv.Behavior.tipsy({
                gravity: "s",
                fade: true
            }));
        }
       }

        //clickAction
        if (opts.clickable) {//custom clickAction
            this.pvHeatGrid
            .cursor("pointer")
            .event("click",function(row, rowCol){
                var s = myself.chart.dataEngine.getSeries()[myself.stacked?this.parent.index:this.index];
                var c = myself.chart.dataEngine.getCategories()[myself.stacked?this.index:this.parent.index];
                var d = row[rowCol];
                var e = arguments[arguments.length-1];
                return myself.chart.options.clickAction(s,c,d,e);
            });
        }

        //showValues
        if(this.showValues)
        {
            var myself = this;
            var getValue = function(row, rowAgain, rowCol){
                return row[rowCol];
            };

            this.pvHeatGridLabel = this.pvHeatGrid
            .anchor("center")
            .add(pv.Label)
            .bottom(0)
            .text(getValue);

            // Extend heatGridLabel
            this.extend(this.pvHeatGridLabel,"heatGridLabel_");
        }

        // Extend heatGrid and heatGridPanel
        this.extend(this.pvHeatGrid,"heatGridPanel_");
        this.extend(this.pvHeatGrid,"heatGrid_");

        // Extend body
        this.extend(this.pvPanel,"chart_");
    },
    
    //heatgrid with resizable shapes instead of panels
    createHeatMap: function(data, w, h, opts, fill)
    {
        var myself = this;
        //total max in data
        var maxVal = pv.max(data, function(datum){// {col:value ..}
            return pv.max( pv.values(datum).map(
                function(d){ return myself.getValue(d, myself.sizeValIdx);})) ;
        });
    
        var maxRadius = Math.min(w,h) / 2 -2;
        var maxArea = maxRadius * maxRadius ;// apparently treats as square area even if circle, triangle is different
        
        var valueToRadius = function(value){
            return value != null ? value/maxVal * maxRadius : Math.min(maxRadius,5) ;//TODO:hcoded
        };
        
        var valueToArea =  function(value){//
            return value != null ? value/maxVal * maxArea :  Math.max(4,maxArea/16);//TODO:hcoded
        }
        
        var valueToColor = function(value, i){
            return  (value != null) ? fill[i](value) : opts.nullColor;
        };
        
        var getLineWidth = function(value, isSelected){
            if(myself.sizeValIdx == null ||
               !myself.isNullShapeLineOnly() ||
               myself.getValue(value, myself.sizeValIdx) != null)
            {
                return isSelected?
                    myself.selectedBorder:
                    myself.defaultBorder;
            }
            else 
            {//is null and needs border to show up
                if(isSelected){
                    return (myself.selectedBorder == null || myself.selectedBorder == 0 )?
                       myself.nullBorder:
                       myself.selectedBorder;
                }
                else
                {
                    return (myself.defaultBorder > 0)?
                        myself.defaultBorder:
                        myself.nullBorder;
                }
            }
        };
        
        var getBorderColor = function(value,i,selected){
            //return getFillColor(value,i,selected).darker();
            var bcolor = getFillColor(value,i,true);
            return (myself.getSelectCount() == 0 || selected)? bcolor.darker() : bcolor;
        };
        
        var toGreyScale = function(color){
            //convert to greyscale using YCbCr luminance conv
            var avg = Math.round( 0.299 * color.r + 0.587 * color.g + 0.114 * color.b);
            //  var avg = Math.round( (color.r + color.g + color.b)/3);
            return pv.rgb(avg,avg,avg,0.6).brighter();
        };
        
        var getFillColor = function(value,i, isSelected){
           var color = opts.nullColor;
           if(myself.colorValIdx != null && myself.getColorValue(value) != null)
           {
               color =  fill[i](myself.getColorValue(value));
           }
           if(myself.getSelectCount() > 0 && !isSelected)
           {//non-selected items
               //return color.alpha(0.5);
               return toGreyScale(color);
           }
           return color;
        };
        
        //double click + click
        var ignoreClicks = 0;
        var DBL_CLICK_MAX_DELAY = (this.clickDelay)? this.clickDelay : 300; //ms
        //click
        var clickAction = function(s,c,d,e){
            if(ignoreClicks) { ignoreClicks--;}
            else {
                if(!opts.ctrlSelectMode || e.ctrlKey){
                    myself.toggleSelection(s,c);
                } else {//hard select
                    myself.clearSelections();
                    myself.addSelection(s,c);
                }
                myself.triggerSelectionChange();
                //classic clickAction
                if(typeof(myself.chart.options.clickAction) == 'function'){
                    if(d!= null && d[0] !== undefined){ d= d[0]; }
                    myself.chart.options.clickAction(s,c,d,e);
                }
                myself.pvPanel.render();
            }
        };
        //dblClick
        var doubleClickAction = (typeof(opts.doubleClickAction) == 'function')?
            function(s,c,d, e){
                ignoreClicks = 2;
                opts.doubleClickAction(s,c,d, e);
            } :
            null;
        
        //chart generation
        this.shapes =
            this.pvHeatGrid
                .add(pv.Dot)
                .def("selected", function(){
                    var s = myself.chart.dataEngine.getSeries()[this.parent.index];
                    var c = myself.chart.dataEngine.getCategories()[this.parent.parent.index];
                    return  myself.isSelected(s,c);
                })
                .shape( function(r, ra ,i){
                    if(opts.sizeValIdx == null){
                        return myself.shape;
                    }
                    return myself.getValue(r[i]) != null ? myself.shape : opts.nullShape;
                })
                .shapeSize(function(r,ra, i) {
                    if(myself.sizeValIdx == null){
                        if(opts.nullShape == null && myself.getValue(r[i], myself.colorValIdx) == null) return 0;
                        else return maxArea;
                    }
                    var val = myself.getValue(r[i], myself.sizeValIdx);
                    return (val == null && opts.nullShape == null)?
                        0 :
                        valueToArea(myself.getValue(r[i], myself.sizeValIdx));
                })
                .fillStyle(function(r, ra, i)
                {
                    return getFillColor(r[i],i,this.selected());
                })
                .cursor("pointer")
                .lineWidth(function(r, ra, i)
                {
                    return getLineWidth(r[i], this.selected());
                })
                .strokeStyle(function(r, ra, i){
                    
                    if( !(getLineWidth(r[i], this.selected()) > 0) ){//null|<0
                        return null;//no style
                    }
                    //has width
                    return (myself.getValue(r[i], myself.sizeValIdx) != null )?
                                    getBorderColor(r[i],i,this.selected()) :
                                     getFillColor(r[i],i,this.selected());
                })
                .text(function(r,ra,i){
                    return myself.valuesToText(r[i]);
                })
                .event("click", function(r,ra,i) {
                    var s = myself.chart.dataEngine.getSeries()[this.parent.index];
                    var c = myself.chart.dataEngine.getCategories()[this.parent.parent.index];
                    var d = r[i];
                    var e = arguments[arguments.length-1];//pv.event;
                    
                    if(doubleClickAction){
                        //arg has to be passed in closure in order to work with ie
                        window.setTimeout(function(){clickAction(s,c,d, e)}, DBL_CLICK_MAX_DELAY);
                       // window.setTimeout(clickAction, DBL_CLICK_MAX_DELAY, d.nodePath);
                    }
                    else { clickAction(s,c,d,e); }

                });
        if(opts.showTooltips){
            this.shapes
            .def("tooltip",'')
            .title(function(r,ra,i){
                var tooltip = '';
                if(opts.customTooltip){
                    var s = myself.chart.dataEngine.getSeries()[this.parent.index];
                    var c = myself.chart.dataEngine.getCategories()[this.parent.parent.index];
                    var d = r[i];
                    tooltip = opts.customTooltip(s,c,d);
                }
                else {
                    tooltip = myself.valuesToText(r[i]);
                }
                this.tooltip(tooltip);
                return '';//prevent browser tooltip
            })
            .event("mouseover", pv.Behavior.tipsy({
                html: true,
                gravity: "c",
                fade: false,
                followMouse:true,
                opacity: 1
            }));
        }
        if(doubleClickAction)
        {
            this.shapes.event("dblclick", function(r,ra,i){
                var s = myself.chart.dataEngine.getSeries()[this.parent.index];
                var c = myself.chart.dataEngine.getCategories()[this.parent.parent.index];
                var d = r[i];
                var e = arguments[arguments.length-1];//pv.event;
                doubleClickAction(s,c,d,e);
            });
        }
                
        if(opts.isMultiValued && pv.renderer() != 'batik')
        {
            this.createSelectOverlay(w,h);
        }
    },
    
    isNullShapeLineOnly: function(){
      return this.nullShape == 'cross';  
    },
    
    /***********************
     * SELECTIONS (start)
     */
    
    /**
     * init with default (bool)
     **/
    initSelections:function(defaultValue){
      this.selections = {};
      var series = this.chart.dataEngine.getSeries();
      var cats = this.chart.dataEngine.getCategories();
        for(var i = 0; i < series.length; i++ ){
            this.selections[series[i]] = {};
            for(var j = 0; j < cats.length; j++ ){
                this.selections[series[i]][cats[j]] = defaultValue;
            }
      }
    },
    
    //makes none selected
    clearSelections: function(refresh){
        this.selections = {};
        this.selectCount = null;
        if(refresh) this.shapes.render();
    },
    
    isSelected: function(s,c){
      return this.selections[s] ?
        this.selections[s][c]!=null :
        false;
    },
    
    isValueNull: function(s,c){
      var sIdx = this.chart.dataEngine.getSeries().indexOf(s);
      var cIdx = this.chart.dataEngine.getCategories().indexOf(c);
      var val = this.chart.dataEngine.getValues()[cIdx][sIdx];
      return val == null || val[0] == null;
    },
    
    addSelection: function(s,c){
      if(!this.selectNullValues)
      {//check if null
        if(this.isValueNull(s,c)){ return; }
      }
      if(!this.selections[s]) this.selections[s] = {};
      this.selections[s][c] = {'series': s, 'category' : c};
      this.selectCount = null;
    },
    
    removeSelection: function(s,c){
      if(this.selections[s]){
        this.selections[s][c] = null;//TODO: delete?
      }
      this.selectCount = null;
    },
    
    toggleSelection: function(s,c){
        if(this.isSelected(s,c)) {
            this.removeSelection(s,c);
        }
        else {
            this.addSelection(s,c);
        }
    },
    
    getSelections: function(){
        var selections = [];
        for(var s in this.selections){
          if(this.selections.hasOwnProperty(s) )
          {
              for(var c in this.selections[s]){
               if(this.selections[s].hasOwnProperty(c))
               {
                    if(this.selections[s][c]){
                        selections.push(this.selections[s][c]);
                    }
               }
              }
          }
        }
        return selections;
    },
    
    setSelections: function(selections){
        this.selections = {};
        for(var i=0;i<selections.length;i++){
            this.addSelection(selections[i].series, selections[i].category);
        }
    },
    
    selectSeries: function(s){
        var cats = this.chart.dataEngine.getCategories();
        for(var i = 0; i < cats.length; i++ ){
            this.addSelection(s,cats[i]);
            //this.selections[s][cats[i]] = true;
        }
    },
    
    selectCategories: function(c){
        var series = this.chart.dataEngine.getSeries();
        for(var i = 0; i < series.length; i++ ){
            this.addSelection(series[i],c);
        }
    },
    
    selectAxisValue: function(axis, axisValue, toggle)
    {
        var type = (this.orientation == 'horizontal')?
            ((axis == 'x')? 's' : 'c') :
            ((axis == 'x')? 'c' : 's')
            
        if(this.chart.options.useCompositeAxis)
        {
            if(!toggle){
                this.clearSelections();
            }
            if(type =='c'){
                if(!toggle){
                    this.selectCategoriesHierarchy(axisValue);
                }
                else {
                    this.toggleCategoriesHierarchy(axisValue);
                }
            }
            else {
                if(!toggle){
                    this.selectSeriesHierarchy(axisValue);
                }
                else{
                    this.toggleSeriesHierarchy(axisValue);
                }
            }
        }
        else
        {//??
            if(type =='c'){ this.toggleCategories(axisValue); }
            else { this.toggleSeries(axisValue); }
        }
    },
    
    toggleCategoriesHierarchy: function(cbase){
        if(this.selectCategoriesHierarchy(cbase)){
            this.deselectCategoriesHierarchy(cbase);
        }
    },
    
    toggleSeriesHierarchy: function(sbase){
        if(this.selectSeriesHierarchy(sbase)){
            this.deselectSeriesHierarchy(sbase);
        }
    },
    
    /**
     *returns bool wereAllSelected
     **/
    selectCategoriesHierarchy: function(cbase){
        var categories = this.chart.dataEngine.getCategories();
        var selected = true;
        for(var i =0; i< categories.length ; i++){
            var c = categories[i];
            if( pvc.arrayStartsWith(c, cbase) ){
                selected &= this.selectCategory(c);
            }
        }
        return selected;
    },
    
    selectSeriesHierarchy: function(sbase){
        var series = this.chart.dataEngine.getSeries();
        var selected = true;
        for(var i =0; i< series.length ; i++){
            var s = series[i];
            if( pvc.arrayStartsWith(s, sbase) ){
                selected &= this.selectSeries(s);
            }
        }
        return selected;
    },
    
    deselectCategoriesHierarchy: function(cbase){
        var categories = this.chart.dataEngine.getCategories();
        for(var i =0; i< categories.length ; i++){
            var c = categories[i];
            if( pvc.arrayStartsWith(c, cbase) ){
                this.deselectCategory(c);
            }
        }
    },

    deselectSeriesHierarchy: function(sbase){
        var series = this.chart.dataEngine.getSeries();
        for(var i =0; i< series.length ; i++){
            var s = series[i];
            if( pvc.arrayStartsWith(s, sbase) ){
                this.deselectSeries(s);
            }
        }
    },
    
    /**
     *returns bool wereAllSelected
     **/
    selectCategory: function(c){
        var series = this.chart.dataEngine.getSeries();
        var wereAllSelected = true;
        for(var i = 0; i < series.length; i++ ){
            var s = series[i];
            if(!this.selectNullValues && this.isValueNull(s,c)){
                continue;
            }
            wereAllSelected &= this.isSelected(s,c);
            this.addSelection(s,c);
        }
        return wereAllSelected;
    },
    
    selectSeries: function(s){
        var categories = this.chart.dataEngine.getCategories();
        var wereAllSelected = true;
        for(var i = 0; i < categories.length; i++ ){
            var c = categories[i];
            if(!this.selectNullValues && this.isValueNull(s,c)){
                continue;
            }
            wereAllSelected &= this.isSelected(s,c);
            this.addSelection(s,c);
        }
        return wereAllSelected;
    },
    
    deselectCategory: function(c){
        var series = this.chart.dataEngine.getSeries();
        for(var i = 0; i < series.length; i++ ){
            this.removeSelection(series[i],c);
        }
    },

    deselectSeries: function(s){
        var categories = this.chart.dataEngine.getCategories();
        for(var i = 0; i < categories.length; i++ ){
            this.removeSelection(s, categories[i]);
        }
    },
    
    /**
     *pseudo-toggle elements with category c:
     *deselect all if all selected, otherwise select all
     **/
    toggleCategories: function(c){
        var series = this.chart.dataEngine.getSeries();
        var selected = this.selectCategory(c);
        if(selected){
            this.deselectCategory(c);
        }
    },
    
    /**
     *pseudo-toggle elements with series s:
     *deselect all if all selected, otherwise select all
     **/
    toggleSeries: function(s){
        var categories = this.chart.dataEngine.getCategories();
        var selected = this.selectSeries(s);
        if(selected){
            this.deselectSeries(s);
        }
    },
    
    getSelectCount: function(){
        if(this.selectCount == null){
          this.selectCount = this.getSelections().length;
        }
        return this.selectCount;
    },
    
    triggerSelectionChange: function(){
        if(typeof(this.onSelectionChange) == 'function'){
            var selections = this.getSelections();
            this.onSelectionChange(selections);
        }
    },
    
        inRubberBandSelection: function(x,y){
        if(!this.rubberBand) { return false; }
        
        var r = this.rubberBand;
        return  x > r.x && x < r.x + r.dx &&
                y > r.y && y < r.y + r.dy ;
        
    },
    
    /**
     * Add rubberband functionality to main panel (includes axis)
     **/
    createSelectOverlay : function(w,h)
    {
        //TODO: flip support: parallelLength etc..
        var opts = this.chart.options;
        this.rubberBand = {x:0, y:0, dx:4, dy:4};
        var myself = this;
        
        if(opts.orientation == 'horizontal')
        {//switch back w,h
            var tmp = w;
            w=h;
            h=tmp;
        }
        
        var dMin= Math.min(w,h) /2;
        
        var isSelecting = false;
        var checkSelections = false;
        var selectFill = opts.rubberBandFill; // 'rgba(255, 127, 0, 0.15)';
        var selectStroke =  opts.rubberBandLine;//'rgb(255,127,0)';
        var invisibleFill = 'rgba(127,127,127,0.01)';
        
        //callback to handle end of rubber band selection
        var dispatchRubberBandSelection = function(rb, ev)
        {//do the rubber band
            var xAxis = myself.chart.xAxisPanel;
            var yAxis = myself.chart.yAxisPanel;
            
            var opts = myself.chart.options;
            
            var positions = ['top','left', 'bottom', 'right'];
            var setPositions = function(position, len){
              var obj ={};
              for(var i=0; i< positions.length;i++){
                if(positions[i] == position){
                    obj[positions[i]] = len;
                }
                else {
                    obj[positions[i]] = 0;
                }
              }
              return obj;
            };
            
            //get offsets
            var titleOffset;
            if(myself.chart.titlePanel != null){
                titleOffset = setPositions(opts.titlePosition, myself.chart.titlePanel.titleSize);
            }
            else {
                titleOffset = setPositions();
            }
            var xAxisOffset = setPositions(opts.xAxisPosition, myself.chart.xAxisPanel.height);
            var yAxisOffset = setPositions(opts.yAxisPosition, myself.chart.yAxisPanel.width);
            
            var y = 0, x=0;   
            //1) x axis
            var xSelections = [];
            if(opts.useCompositeAxis){
                y = rb.y - titleOffset['top'] ;
                if(opts.xAxisPosition == 'bottom'){//chart
                    y -= myself.height;
                }
                x = rb.x - titleOffset['left'] - yAxisOffset['left'];
                xSelections =  myself.chart.xAxisPanel.getAreaSelections(x, y, rb.dx, rb.dy);
            }
                        
            //2) y axis
            var ySelections = [];
            if(opts.useCompositeAxis){
                y = rb.y - titleOffset['top'] - xAxisOffset['top'];//- xAxisOffset['top'];
                x = rb.x - titleOffset['left'];
                if(opts.yAxisPosition == 'right'){//chart
                    x -= myself.width;
                }
                ySelections = myself.chart.yAxisPanel.getAreaSelections(x, y, rb.dx, rb.dy);
            }
            
            if(opts.ctrlSelectMode && !ev.ctrlKey){
                myself.clearSelections();
            }
            
            if( ySelections.length > 0 && xSelections.length > 0 )
            {//intersection
                var series = myself.chart.dataEngine.getSeries();
                var categories = myself.chart.dataEngine.getCategories();
                var selectedSeries = [], selectedCategories = [],
                    sSelections, cSelections;
                if(opts.orientation == 'horizontal'){
                    sSelections = xSelections;
                    cSelections = ySelections;
                }
                else {
                    sSelections = ySelections;
                    cSelections = xSelections;                    
                }
                //expand selections
                for(var i=0;i<sSelections.length;i++)
                {
                    var s = sSelections[i];
                    for(var j=0;j<series.length; j++){
                        if( pvc.arrayStartsWith(series[j], s)){
                            selectedSeries.push(series[j]);
                        }
                    }
                }
                for(var i=0;i<cSelections.length;i++)
                {
                    var c = cSelections[i];
                    for(var j=0;j<categories.length; j++){
                        if( pvc.arrayStartsWith(categories[j], c)){
                            selectedCategories.push(categories[j]);
                        }
                    }
                }
                //intersection
                for(var i=0;i<selectedSeries.length;i++)
                {
                    var s = selectedSeries[i];
                    for(var j=0; j<selectedCategories.length; j++)
                    {
                        var c = selectedCategories[j];
                        myself.addSelection(s,c);
                    }
                }
            }
            else if(ySelections.length == 0 && xSelections.length == 0)
            {//if there are label selections, they already include any chart selections
                //3) Chart: translate coordinates (drawn bottom-up)
                //first get offsets
                y = rb.y -titleOffset['top'] - xAxisOffset['top'];
                x = rb.x - titleOffset['left'] - yAxisOffset['left'];
                //top->bottom
                y = myself.height -y -rb.dy;
                myself.rubberBand.x = x;
                myself.rubberBand.y = y;

                myself.setRubberbandSelections(myself.rubberBand,w,h);            
            }
            else
            {
                for(var i=0; i<xSelections.length; i++){
                    myself.selectAxisValue('x', xSelections[i],  true);
                }
                for(var i=0; i<ySelections.length; i++){
                    myself.selectAxisValue('y', ySelections[i], true);
                }
            }

            myself.shapes.render();
            myself.chart.heatGridChartPanel.triggerSelectionChange();
            
        };
        
        //rubber band display
        this.selectBar = this.pvPanel.root//TODO
           .add(pv.Bar)
                .visible(function() {return isSelecting;} )
                .left(function(d) { return d.x; })
                .top(function(d) { return d.y;})
                .width(function(d) { return d.dx;})
                .height(function(d) { return d.dy;})
                .fillStyle(selectFill)
                .strokeStyle(selectStroke);
                
        //rubber band selection behavior definition
        if(!opts.extensionPoints ||
           !opts.extensionPoints.base_fillStyle)
        {
            this.pvPanel.root.fillStyle(invisibleFill);
        }
        
        this.pvPanel.root
            .data([myself.rubberBand])
            .event("click", function(d) {
                var e = arguments[arguments.length-1];
                //if(!pv.event.ctrlKey){
                if(opts.ctrlSelectMode && !e.ctrlKey){
                    myself.clearSelections();
                    myself.shapes.render();
                    myself.triggerSelectionChange();
                }
            })
            .event('mousedown', pv.Behavior.selector(false))
            .event('selectstart', function(d){
                isSelecting = true;
            })
            .event('select', function(rb){
                
                myself.rubberBand = rb;
                if(isSelecting && (rb.dx > dMin || rb.dy > dMin)){
                    checkSelections = true;
                    myself.selectBar.render();
                }
            })
            .event('selectend', function(rb,event){
                if(isSelecting){
                    isSelecting = false;
                    //translate top to bottom
                    if(checkSelections){
                        checkSelections = false;
                        myself.selectBar.render();
                        dispatchRubberBandSelection(rb, event);
                    }
                }
            });
    },
    
    setRubberbandSelections: function(rb,w,h)
    {
        var orient = (this.orientation == 'horizontal')? 'h' : 'v';
        
        var yValues = (orient == 'h')?
            this.chart.dataEngine.getCategories() :
            this.chart.dataEngine.getSeries();
        var xValues = (orient == 'h')?
            this.chart.dataEngine.getSeries() :    
            this.chart.dataEngine.getCategories();
        
        var ySel = [];
        var xSel = [];
        
        //find included series/categories
        for(var i=0; i< yValues.length; i++){
            var y = i*h + h/2;
            if(y > rb.y && y < rb.y + rb.dy){
                ySel.push(yValues[i]);
            }
        }
        for(var i=0; i< xValues.length; i++){
            var x = i*w + w/2;
            if(x > rb.x && x < rb.x + rb.dx){
                xSel.push(xValues[i]);
            }
        }
        
        var sSel, cSel;
        if(orient == 'h'){
            sSel = xSel;
            cSel = ySel;
        }
        else {
            sSel = ySel;
            cSel = xSel;            
        }
        
        //select shapes in intersection
        for(var i=0; i< sSel.length; i++)
        {
            var s = sSel[i];
            for(var j=0; j<cSel.length; j++)
            {
                var c = cSel[j];
                this.addSelection(s,c);
            }
        }
    },
    
    
    /*
     *selections (end)
     **********************/
    
    /**
     * TODO: Get label color that will contrast with given bg color
     */
    getLabelColor: function(r, g, b){
        var brightness = (r*299 + g*587 + b*114) / 1000;
        if (brightness > 125) {
            return '#000000';
        } else {
            return '#ffffff';
        }
    },
    
    
  
  /***********
   * compute an array of fill-functions. Each column out of "cols" 
   * gets it's own scale function assigned to compute the color
   * for a value. Currently supported scales are:
   *    -  linear (from min to max
   *    -  normal distributed from   -numSD*sd to  numSD*sd 
   *         (where sd is the standards deviation)
   ********/
  getColorScale: function(data, cols) {
      switch (this.chart.options.scalingType) {
        case "normal":
          return this.getNormalColorScale(data, cols, this.colorValIdx);//TODO:
        case "linear":
          return this.getLinearColorScale(data, cols, this.colorValIdx);
        //TODO: case "external":
        default:
          throw "Invalid option " + this.scaleType + " in HeatGrid";
    }
  },
  
  
  getLinearColorScale: function(data, cols, colorIdx){

    var opts = this.chart.options;
    var myself = this;

    var rangeArgs = opts.colorRange;
    if(opts.minColor != null && opts.maxColor != null){
        rangeArgs = [opts.minColor,opts.maxColor];
    }
    else if (opts.minColor != null){
        rangeArgs.splice(0,1,opts.minColor);
    }
    else if (opts.maxColor != null){
        rangeArgs.splice(rangeArgs.length-1,1,opts.maxColor);
    }
    
    var domainArgs = opts.colorRangeInterval;
    if(domainArgs != null && domainArgs.length > rangeArgs.length){
        domainArgs = domainArgs.slice(0, rangeArgs.length);
    }
    if(domainArgs == null){
        domainArgs = [];
    }
    
    if(domainArgs.length < rangeArgs.length || opts.normPerBaseCategory){
        
        var min = pv.dict(cols, function(f){
          return pv.min(data, function(d){
            return myself.getValue(d[f],colorIdx);
          });
        });
        var max = pv.dict(cols, function(f){
          return pv.max(data, function(d){
            return myself.getValue(d[f], colorIdx);
          });
        });
        
        if (opts.normPerBaseCategory){  //  compute a scale-function for each column (each key
          //overrides colorRangeIntervals
            return pv.dict(cols, function(f){
                var fMin = min[f],
                    fMax = max[f];
                if(fMax == fMin)
                {
                    if(fMax >=1){
                        fMin = fMax -1;
                    } else {
                        fMax = fMin +1;    
                    }
                }
                var step = (fMax - fMin)/( rangeArgs.length -1);
                var scale = pv.Scale.linear();
                scale.domain.apply(scale, pv.range(fMin,fMax + step, step));
                scale.range.apply(scale,rangeArgs);
                return scale;
            });
        }
        else {   // normalize over the whole array
            var theMin = min[cols[0]];
            for (var i=1; i<cols.length; i++) {
              if (min[cols[i]] < theMin) theMin = min[cols[i]];
            }
            var theMax = max[cols[0]];
            for (var i=1; i<cols.length; i++){
              if (max[cols[i]] > theMax) theMax = max[cols[i]];
            }
            if(theMax == theMin)
            {
                if(theMax >=1){
                    theMin = theMax -1;
                } else {
                    theMax = theMin +1;
                }
            } 
          //use supplied numbers
          var toPad =
                domainArgs == null ?
                rangeArgs.length :
                rangeArgs.length - domainArgs.length;
          switch(toPad){
            case 1:
                //TODO: should adapt to represent middle?
                domainArgs.push(theMax);
                break;
            case 2:
                domainArgs = [theMin].concat(domainArgs).concat(theMax);
                break;
            default:
                var step = (theMax - theMin)/(rangeArgs.length -1);
                domainArgs = pv.range(theMin, theMax + step, step);
          }
        }
    }
    var scale = pv.Scale.linear();
    scale.domain.apply(scale,domainArgs)
    scale.range.apply(scale,rangeArgs);
    return pv.dict(cols,function(f){ return scale;});
  },

  getNormalColorScale: function (data, cols){
    var fill;
    var opts = this.chart.options;
    if (opts.normPerBaseCategory) {
      // compute the mean and standard-deviation for each column
      var myself = this;
      var mean = pv.dict(cols, function(f){
        return pv.mean(data, function(d){
          return myself.getValue(d[f]);
        })
      });
      var sd = pv.dict(cols, function(f){
        return pv.deviation(data, function(d){
          myself.getValue(d[f]);
        })
      });
      //  compute a scale-function for each column (each key)
      fill = pv.dict(cols, function(f){
        return pv.Scale.linear()
          .domain(-opts.numSD * sd[f] + mean[f],
                  opts.numSD * sd[f] + mean[f])
          .range(opts.minColor, opts.maxColor);
      });
    } else {   // normalize over the whole array
      var mean = 0.0, sd = 0.0, count = 0;
      for (var i=0; i<origData.length; i++)
        for(var j=0; j<origData[i].length; j++)
          if (origData[i][j] != null){
            mean += origData[i][j];
            count++;
          }
      mean /= count;
      for (var i=0; i<origData.length; i++){
        for(var j=0; j<origData[i].length; j++){
          if (origData[i][j] != null){
            var variance = origData[i][j] - mean;
            sd += variance*variance;
          }
        }
      }
      sd /= count;
      sd = Math.sqrt(sd);
      
      var scale = pv.Scale.linear()
        .domain(-opts.numSD * sd + mean,
                opts.numSD * sd + mean)
        .range(opts.minColor, opts.maxColor);
      fill = pv.dict(cols, function(f){
        return scale;
      });
    }

    return fill;  // run an array of values to compute the colors per column
}


});//end: HeatGridChartPanel


/**
 * Equal to pv.Behavior.select but doesn't necessarily
 * force redraw of component it's in on mousemove, and sends event info
 * (default behavior matches pv.Behavior.select())
 * @param {boolean} autoRefresh refresh parent mark automatically
 * @param {pv.Mark} mark
 * @return {function mousedown
 **/
pv.Behavior.selector = function(autoRefresh, mark) {
  var scene, // scene context
      index, // scene context
      r, // region being selected
      m1, // initial mouse position
      redrawThis = (arguments.length > 0)?
                    autoRefresh : true; //redraw mark - default: same as pv.Behavior.select
    
  /** @private */
  function mousedown(d, e) {
    if(mark == null){
        index = this.index;
        scene = this.scene;
    }
    else {
        index = mark.index;
        scene = mark.scene;
    }
    m1 = this.mouse();
    
    r = d;
    r.x = m1.x;
    r.y = m1.y;
    r.dx = r.dy = 0;
    pv.Mark.dispatch("selectstart", scene, index, e);
  }

  /** @private */
  function mousemove(e) {
    if (!scene) return;
    scene.mark.context(scene, index, function() {
        var m2 = this.mouse();
        r.x = Math.max(0, Math.min(m1.x, m2.x));
        r.y = Math.max(0, Math.min(m1.y, m2.y));
        r.dx = Math.min(this.width(), Math.max(m2.x, m1.x)) - r.x;
        r.dy = Math.min(this.height(), Math.max(m2.y, m1.y)) - r.y;
        if(redrawThis){
            this.render();
        }
      });
    pv.Mark.dispatch("select", scene, index, e);
  }

  /** @private */
  function mouseup(e) {
    if (!scene) return;
    pv.Mark.dispatch("selectend", scene, index, e);
    scene = null;
  }

  pv.listen(window, "mousemove", mousemove);
  pv.listen(window, "mouseup", mouseup);
  return mousedown;
};
/**
 * MetricAbstract is the base class for all chart types that have
 * a two linear axis.
 * If the base-axis is a categorical axis you should use categoricalAbstract.
 * 
 * If you have issues with this class please contact CvK at cde@vinzi.nl 
 */

pvc.MetricAbstract = pvc.CategoricalAbstract.extend({

  constructor: function(o){
    
    this.base(o);
    var _defaults = {
    };

    // Apply options
    $.extend(this.options,_defaults, o);

    return;
  },

  preRender: function(){
    this.base();
    pvc.log("Prerendering in MetricAbstract");
    return;
  },


  /*
   * Indicates if x-axis (horizontal axis) is an ordinal scale
   */
     // CvK: if we move ordinal-ordinal to a separate class this functions
  // can be probably be thrown out as it becomes identical to the
  // parent fucntion.
  isXAxisOrdinal: function(){
    var isOrdinal = false;
    if (this.options.orientation == "vertical") 
      isOrdinal = false;
    else 
      isOrdinal =  this.options.orthoAxisOrdinal;
    return isOrdinal;
  },


  /*
   * Indicates if y-axis (vertical axis) is an ordinal scale
   */
     // CvK: if we move ordinal-ordinal to a separate class this functions
  // can be probably be thrown out as it becomes identical to the
  // parent fucntion.
  
  isYAxisOrdinal: function(){
    var isOrdinal = false;
    if (this.options.orientation == "vertical")
      isOrdinal =  this.options.orthoAxisOrdinal;
    else
      isOrdinal = false;
    return isOrdinal;
  },


  getLinearBaseScale: function(bypassAxis){
    
    var yAxisSize = bypassAxis?0:this.options.yAxisSize;
    var xAxisSize = bypassAxis?0:this.options.xAxisSize;
    
    var isVertical = this.options.orientation=="vertical";
    
    // compute the input-domain of the scale
    var domainMin = this.dataEngine.getCategoryMin();
    var domainMax = this.dataEngine.getCategoryMax();
    // Adding a small relative offset to the scale to prevent that
    // points are located on top of the axis:
    var offset = (domainMax - domainMin) * this.options.axisOffset;
    domainMin -= offset;
    domainMax += offset;
    
    // compute the output-range
    var rangeMin, rangeMax;
    if (isVertical) {
      rangeMin = yAxisSize;
      rangeMax = this.basePanel.width;
    } else {
      rangeMin = 0;
      rangeMax = this.basePanel.height - xAxisSize;
    }
    
    // create the (linear) Scale
    var scale = new pv.Scale.linear()
      .domain(domainMin, domainMax)
      .range(rangeMin, rangeMax);
    
    return scale;
  },

  /*
   * get the scale for the axis with horizontal orientation
   */
  
  getXScale: function(){
    var scale = null;
    
    if (this.options.orientation == "vertical") {
      scale = this.options.timeSeries  ?
        this.getTimeseriesScale()     :
        this.getLinearBaseScale();   // linear is the default
    } else {
      scale = this.getLinearScale();
    } 
    
    return scale;
  },

  /*
   * get the scale for the axis with the vertical orientation.
   */
  
  getYScale: function(){
    var scale = null;
    if (this.options.orientation == "vertical") {
      scale = this.getLinearScale();
    } else { 
      scale = this.options.timeSeries  ?
        this.getTimeseriesScale()     :
        this.getLinearBaseScale();
    }
    return scale;
  }

}  )


/*********
 *  Panel use to draw line and dotCharts
 *     LScatter is for graphs with a linear base-axis
 *
 *  The original ScatterChartPanel was difficult to generalize as
 *  many (scattered) changes were needed in the long create function.
 *     OScatter could be develofor graphs with a ordinal base-axis
 *
 *  Later we might consider to merge LScatter and OScatter again, and 
 *  refactor the general stuff to an abstract base class.
 *********/


/*
 * Scatter chart panel. Base class for generating the other xy charts. Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showDots</i> - Show or hide dots. Default: true
 * <i>showValues</i> - Show or hide line value. Default: false
 * <i>stacked</i> -  Stacked? Default: false
 * <i>panelSizeRatio</i> - Ratio of the band occupied by the pane;. Default: 0.5 (50%)
 * <i>lineSizeRatio</i> - In multiple series, percentage of inner
 * band occupied by lines. Default: 0.5 (50%)
 * <i>maxLineSize</i> - Maximum size of a line in pixels. Default: 2000
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>line_</i> - for the actual line
 * <i>linePanel_</i> - for the panel where the lines sit
 * <i>lineDot_</i> - the dots on the line
 * <i>lineLabel_</i> - for the main line label
 */


pvc.MetricScatterChartPanel = pvc.BasePanel.extend({

  _parent: null,
  pvLine: null,
  pvArea: null,
  pvDot: null,
  pvLabel: null,
  pvCategoryPanel: null,
  data: null,

  timeSeries: false,
  timeSeriesFormat: "%Y-%m-%d",

  stacked: false,
  showAreas: false,
  showLines: true,
  showDots: true,
  showValues: true,
  showTooltips: true,
  valuesAnchor: "right",
  orientation: "vertical",


  constructor: function(chart, options){

    this.base(chart,options);

  },


  prepareDataFunctions:  function() {
    /*
        This function implements a number of helper functions via
        closures. The helper functions are all stored in this.DF
        Overriding this function allows you to implement
        a different ScatterScart.
     */
    var myself = this;

    var baseScale = this.chart.getLinearBaseScale(true);
    var orthoScale = this.chart.getLinearScale(true); 

    if(this.timeSeries){
      tScale = this.chart.getTimeseriesScale(true);
    }
    
    // create empty container for the functions and data
    myself.DF = {}

    myself.DF.baseValues = this.chart.dataEngine.getVisibleCategories();
    myself.DF.visibleSerieIds = this.chart.dataEngine.getVisibleSeriesIndexes()
//    myself.DF.data = this.chart.dataEngine.getVisibleTransposedValues();

    // calculate a position along the base-axis
    myself.DF.baseCalculation = (myself.timeSeries) ?
      function(d){ return tScale(parser.parse(d.category)); }   :
      function(d) { return baseScale(d.category);  };
      

    // calculate a position along the orthogonal axis
    myself.DF.orthoCalculation = function(d){
      return myself.chart.animate(0, orthoScale(d.value));
    };

    // get a data-series for the ID
    var pFunc = null;
    if (this.timeSeries) {
      var parser = pv.Format.date(this.timeSeriesFormat);
      pFunc = function(a,b){ 
        return parser.parse(a.category)-parser.parse(b.category);};
    }  
    myself.DF.getDataForSerieId = 
      function(d){ var res = myself.chart.dataEngine
            .getObjectsForSeriesIndex(d, pFunc);
            res.sort(function(a, b) {return a.category - b.category; })
            return res;
          };


    var colors = this.chart.colors(
         pv.range(this.chart.dataEngine.getSeriesSize()));
    myself.DF.colorFunc = function(d){
      // return colors(d.serieIndex)
      return colors(myself.chart.dataEngine.getVisibleSeriesIndexes()
              [this.parent.index])
    };

  },

  create: function(){

    var myself = this;
    this.width = this._parent.width;
    this.height = this._parent.height;

    this.pvPanel = this._parent.getPvPanel().add(this.type)
    .width(this.width)
    .height(this.height);

    // add clipping for bounds
    if  (   (myself.chart.options.orthoFixedMin != null)
         || (myself.chart.options.orthoFixedMax != null) )
      this.pvPanel["overflow"]("hidden");

    if(this.showTooltips || this.chart.options.clickable ){
      this.pvPanel
      .events("all")
      .event("mousemove", pv.Behavior.point(Infinity));
    }

    var anchor = this.orientation == "vertical"?"bottom":"left";

    // prepare data and functions when creating (rendering) the chart.
    this.prepareDataFunctions();

    var maxLineSize;

    // Stacked?
    if (this.stacked){

      pvc.log("WARNING: the stacked option of metric charts still needs to be implemented.");

/*    CvK:  have to rewrite this code  
      this.pvScatterPanel = this.pvPanel.add(pv.Layout.Stack)
      .layers(pvc.padMatrixWithZeros(this.chart.dataEngine.getVisibleTransposedValues()))
      [this.orientation == "vertical"?"x":"y"](function(){
        if(myself.timeSeries){
          return tScale(parser.parse(myself.chart.dataEngine.getCategoryByIndex(this.index)));
        }
        else{
          return oScale(myself.chart.dataEngine.getCategoryByIndex(this.index)) + oScale.range().band/2;
        }
      })
      [anchor](lScale(0))
      [this.orientation == "vertical"?"y":"x"](function(d){
        return myself.chart.animate(0,lScale(d)-lScale(0));
      })

      this.pvArea = this.pvScatterPanel.layer.add(pv.Area)
      .fillStyle(this.showAreas?colorFunc:null);

      this.pvLine = this.pvArea.anchor(pvc.BasePanel.oppositeAnchor[anchor]).add(pv.Line)
      .lineWidth(this.showLines?1.5:0.001);
    //[pvc.BasePanel.parallelLength[anchor]](maxLineSize)
    */    
    }
    else {

      // Add the serie identifiers to the scatterPanel
      // CvK: Why do we need a new pvPanel and can't we use existing pvPanel?
      this.pvScatterPanel = this.pvPanel.add(pv.Panel)
           .data(myself.DF.visibleSerieIds);

      // add the area's
      // CvK: why adding area's if showArea
      this.pvArea = this.pvScatterPanel.add(pv.Area)
        .fillStyle(this.showAreas?myself.DF.colorFunc:null);

      var lineWidth = this.showLines ? 1.5 : 0.001;
      // add line and make lines invisible if not needed.
      this.pvLine = this.pvArea.add(pv.Line)
      .data(myself.DF.getDataForSerieId)
      .lineWidth(lineWidth)
      [pvc.BasePanel.relativeAnchor[anchor]](myself.DF.baseCalculation)
      [anchor](myself.DF.orthoCalculation)
    }

    
    this.pvLine
      .strokeStyle(myself.DF.colorFunc)
      .text(function(d){
        var v, c;
        var s = myself.chart.dataEngine.getVisibleSeries()[this.parent.index]
        if( typeof d == "object"){
          v = d.value;
          c = d.category
        }
        else{
          v = d
          c = myself.chart.dataEngine.getVisibleCategories()[this.index]
        };
        return myself.chart.options.tooltipFormat.call(myself,s,c,v);
      })

    if(this.showTooltips){
      this.extend(this.chart.tipsySettings,"tooltip_");
      this.pvLine
        .event("point", pv.Behavior.tipsy(this.chart.tipsySettings));
    }

    this.pvDot = this.pvLine.add(pv.Dot)
    .shapeSize(12)
    .lineWidth(1.5)
    .strokeStyle(this.showDots?myself.DF.colorFunc:null)
    .fillStyle(this.showDots?myself.DF.colorFunc:null)
    

    if (this.chart.options.clickable){
      this.pvDot
      .cursor("pointer")
      .event("click",function(d){
        var v, c, e;
        var s = myself.chart.dataEngine.getSeries()[this.parent.index]
        if( typeof d == "object"){
          v = d.value;
          c = d.category
        }
        else{
          v = d
          c = myself.chart.dataEngine.getCategories()[this.index]
        }
        e = arguments[arguments.length-1];
        return myself.chart.options.clickAction(s, c, v, e);
      });
    }



    if(this.showValues){
      this.pvLabel = this.pvDot
      .anchor(this.valuesAnchor)
      .add(pv.Label)
      .bottom(0)
      .text(function(d){
        return myself.chart.options.valueFormat(typeof d == "object"?d.value:d)
      })

      // Extend lineLabel
      this.extend(this.pvLabel,"lineLabel_");
    }


    // Extend line and linePanel
    this.extend(this.pvScatterPanel,"scatterPanel_");
    this.extend(this.pvArea,"area_");
    this.extend(this.pvLine,"line_");
    this.extend(this.pvDot,"dot_");
    this.extend(this.pvLabel,"label_");


    // Extend body
    this.extend(this.pvPanel,"chart_");

  }

});






/**
 * ScatterAbstract is the class that will be extended by dot, line, stackedline and area charts.
 */

pvc.MetricScatterAbstract = pvc.MetricAbstract.extend({

  scatterChartPanel : null,
  tipsySettings: {
    gravity: "s",
    fade: true
  },

  constructor: function(o){

    this.base(o);

    var _defaults = {
      showDots: false,
      showLines: false,
      showAreas: false,
      showValues: false,
      showTooltips: true,
      axisOffset: 0.05,
      valuesAnchor: "right",
      stacked: false,
      originIsZero: true,
      orientation: "vertical",
      timeSeries: false,
      timeSeriesFormat: "%Y-%m-%d",
      panelSizeRatio: 1,
      orthoFixedMin: null,
      orthoFixedMax: null
    };


    // Apply options
    $.extend(this.options,_defaults, o);


  },

  preRender: function(){

    this.base();

    pvc.log("Prerendering in MetricScatterAbstract");

    this.scatterChartPanel = new pvc.MetricScatterChartPanel(this, {
      stacked: this.options.stacked,
      showValues: this.options.showValues,
      valuesAnchor: this.options.valuesAnchor,
      showLines: this.options.showLines,
      showDots: this.options.showDots,
      showAreas: this.options.showAreas,
      showTooltips: this.options.showTooltips,
      orientation: this.options.orientation,
      timeSeries: this.options.timeSeries,
      timeSeriesFormat: this.options.timeSeriesFormat
    });

    this.categoricalPanel = this.scatterChartPanel;

    this.scatterChartPanel.appendTo(this.basePanel); // Add it

  }

});

/**
 * Metric Dot Chart
 *
 */

pvc.MetricDotChart = pvc.MetricScatterAbstract.extend({

  constructor: function(o){

    this.base();

    var _defaults = {
      showDots: true,
      showLines: false,
      showAreas: false,
      showValues: false,
      stacked: false
    };

    // Apply options
    $.extend(this.options,_defaults, o);

  }
});


/**
 * Metric Line Chart
 *
 */

pvc.MetricLineChart = pvc.MetricScatterAbstract.extend({

  constructor: function(o){

    this.base();

    var _defaults = {
      showDots: false, // ask
      showLines: true,
      showAreas: false,
      showValues: false,
      stacked: false
    };

    // Apply options
    $.extend(this.options,_defaults, o);


  }
});



/**
 * Metric Stacked Line Chart
 *
 */

pvc.mStackedLineChart = pvc.MetricScatterAbstract.extend({

  constructor: function(o){

    this.base();

    var _defaults = {
      showDots: false, // ask
      showLines: true,
      showAreas: false,
      showValues: false,
      stacked: true
    };

    // Apply options
    $.extend(this.options,_defaults, o);


  }
});


/**
 * Metric Stacked Area Chart
 *
 */

pvc.mStackedAreaChart = pvc.MetricScatterAbstract.extend({

  constructor: function(o){

    this.base();

    var _defaults = {
      showDots: false, // ask
      showLines: false,
      showAreas: true,
      showValues: false,
      stacked: true
    };

    // Apply options
    $.extend(this.options,_defaults, o);


  }
});

/**
 * WaterfallChart is the main class for generating... waterfall charts.
 * 
 * The waterfall chart is an alternative to the pie chart for
 * showing distributions. The advantage of the waterfall chart is that
 * it possibilities to visualize sub-totals and offers more convenient
 * possibilities to compare the size of categories (in a pie-chart you
 * have to compare wedges that are at a different angle, which
 * requires some additional processing/brainpower of the end-user).
 *
 * Waterfall charts are basically Bar-charts with some added
 * functionality. Given the complexity of the added features this
 * class has it's own code-base. However, it would be easy to
 * derive a BarChart class from this class by switching off a few 
 * features.
 * 
 * If you have an issue or suggestions regarding the Waterfall-charts
 * please contact CvK at cde@vinzi.nl
 */
pvc.WaterfallChart = pvc.CategoricalAbstract.extend({

    wfChartPanel : null,

    constructor: function(o){

        this.base(o);

        var _defaults = {
            showValues: true,
            stacked: true,
            waterfall: true,
            panelSizeRatio: 0.9,
            barSizeRatio: 0.9,
            maxBarSize: 2000,
            originIsZero: true,
            axisOffset: 0,
            showTooltips: true,
            orientation: "vertical",
            orthoFixedMin: null,
            orthoFixedMax: null
        };

        // Apply options
        $.extend(this.options,_defaults, o);

        //  force stacked to be true (default of base-class is false)
        this.options.stacked = true;
    },
    
    /**
     * Creates a custom WaterfallDataEngine.
     * [override]
     */
    createDataEngine: function(){
        return new pvc.WaterfallDataEngine(this);
    },
    
    preRender: function(){
        // First series are symbolic labels, so hide it such that
        // the axis-range computation is possible in "AbstractCategoricalAxis.
        this.dataEngine.callWithHiddenFirstSeries(this.base, this);

        var logMessage = "Prerendering a ";
        if (this.options.waterfall)
            logMessage += "WaterfallChart";
        else logMessage +=  ((this.options.stacked) ?
            "stacked" : "normal")  +  " BarChart";
        pvc.log(logMessage);
        
        this.wfChartPanel = new pvc.WaterfallChartPanel(this, {
            stacked: this.options.stacked,
            waterfall: this.options.waterfall,
            panelSizeRatio: this.options.panelSizeRatio,
            barSizeRatio: this.options.barSizeRatio,
            maxBarSize: this.options.maxBarSize,
            showValues: this.options.showValues,
            showTooltips: this.options.showTooltips,
            orientation: this.options.orientation
        });

        this.categoricalPanel = this.wfChartPanel;

        this.wfChartPanel.appendTo(this.basePanel); // Add it
    }
});


pvc.WaterfallDataEngine = pvc.DataEngine.extend({
    constructor: function(chart){
        this.base(chart);
    },
    
    /**
     * Creates and prepares the custom WaterfallTranslator.
     * [override]
     */
    createTranslator: function(){
        this.base();
        
        var sourceTranslator = this.translator;
        
        this.translator = new pvc.WaterfallTranslator(
                            sourceTranslator,
                            this.chart.options.waterfall,
                            this.chart.isOrientationVertical());
        
        pvc.log("Creating WaterfallTranslator wrapper");
        
        this.prepareTranslator();
    },
    
    callWithHiddenFirstSeries: function(fun, ctx) {
        if (!this.isVisible("series", 0)) {
           return fun.call(ctx);
        }
        
        this.toggleSerieVisibility(0);
        try{
            return fun.call(ctx);
        } finally {
            this.toggleSerieVisibility(0);
        }
    }
});

pvc.WaterfallTranslator = pvc.DataTranslator.extend({
    
    constructor: function(sourceTranslator, isWaterfall, isVertical){
        this.base();
        
        this.sourceTranslator = sourceTranslator;
        
        this.isWaterfall = isWaterfall;
        this.isVertical  = isVertical;
    },
    
    prepareImpl: function(){
        // Call base version 
        this.base();
        
        /*
         (Total column is for waterfall)
         Values:
         [["X",    "Ser1", "Ser2", "Ser3"],
          ["Cat1", "U",      800,    1200],  // 1800 (depends on visible series)
          ["Cat2", "D",      100,     600],  //  700
          ["Cat3", "D",      400,     300],  //  700
          ["Cat4", "D",      200,     100],  //  300
          ["Cat5", "D",      100,     200]]  //  300
         */
        
        this.sourceTranslator.setData(this.metadata, this.resultset);
        this.sourceTranslator.dataEngine = this.dataEngine;
        this.sourceTranslator.prepareImpl();
        
        // The MultiValueTranslator doesn't support this kind of treatment...
        this.values = this.sourceTranslator.values;
        this.metadata = this.sourceTranslator.metadata;
        this.resultset = this.sourceTranslator.resultset;
        
        if(this.isWaterfall && this.isVertical){
            // Place Total as last position
            // So that when drawing (reversed) it remains at the bottom
            // ... ["Cat1",  800, 1200, "U"],
            // row[1] -> row[L-1]
            
            function switchWaterFallSpec(row){
                row = row.slice(0);
                row.push(row[1]);
                row.splice(1, 1);
                
                return row;
            }
            
            this.values = this.values.map(switchWaterFallSpec);
            //this.metadata = reverseRowExceptFirstCol(this.metadata);
        }
    }
});

/**
 * Waterfall chart panel (also bar-chart). Generates a bar chart. Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showValues</i> - Show or hide bar value. Default: false
 * <i>stacked</i> -  Stacked? Default: false
 * <i>panelSizeRatio</i> - Ratio of the band occupied by the pane;. Default: 0.5 (50%)
 * <i>barSizeRatio</i> - In multiple series, percentage of inner
 * band occupied by bars. Default: 0.9 (90%)
 * <i>maxBarSize</i> - Maximum size (width) of a bar in pixels. Default: 2000
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>bar_</i> - for the actual bar
 * <i>barPanel_</i> - for the panel where the bars sit
 * <i>barLabel_</i> - for the main bar label
 */
pvc.WaterfallChartPanel = pvc.BasePanel.extend({

    _parent: null,
    pvBar: null,
    pvBarLabel: null,
    pvWaterfallLine: null,
    pvCategoryPanel: null,
    pvSecondLine: null,
    pvSecondDot: null,
    data: null,
  
    stacked: false,
    panelSizeRatio: 0.9,
    barSizeRatio: 0.9,
    showTooltips: true,
    maxBarSize: 200,
    showValues: true,
    orientation: "vertical",
    tipsySettings: {
        gravity: "s",
        fade: true
    },
    ruleData: null,

    constructor: function(chart, options){
        this.base(chart, options);
    },

    /* @Override */
    isOrientationVertical: function(){
        return this.orientation == "vertical";
    },
    
    /* @Override */
    isOrientationHorizontal: function(){
        return this.orientation == "horizontal";
    },
    
    /***
    *  Functions that transforms a dataset to waterfall-format.
    *
    * The assumption made is that the first category is a tekst column
    * containing one of the following values:
    *    - "U":  If this category (row) needs go upwards (height
    *       increases)
    *    - "D": If the waterfall goes downward.
    *    - other values: the waterfall resets to zero (used represent
    *        intermediate subtotal) Currently subtotals need to be
    *        provided in the dataset.
    *  This function computes the offsets of each bar and stores the
    *  offset in the first category (for stacked charts)
    */
    constructWaterfall: function(dataset){
        var cumulated = 0,
            categoryIndexes = [],
            categoryTotals = [],
            cats = this.chart.dataEngine.getVisibleCategoriesIndexes(),
            seriesCount  = dataset.length,
            totalsSeriesIndex = this.isOrientationHorizontal() 
                                ? 0 
                                : (seriesCount - 1),
            totalsSeries = dataset[totalsSeriesIndex],
            catCount = cats.length;
        
        for(var c = 0 ; c < catCount; c++) {
            categoryIndexes.push(cats[c]);

            // Determine next action (direction)
            var mult;
            if (totalsSeries[c] == "U") {
                mult = 1;
            } else if (totalsSeries[c] == "D") {
                mult = -1;
            } else {
                mult = 1;
                cumulated = 0;
            }
            
            if (mult > 0){
                totalsSeries[c] = cumulated;
            }
            
            // Update the other series and determine new cumulated
            for(var seriesIndex = 0 ; seriesIndex < seriesCount ; seriesIndex++) {
                if(seriesIndex !== totalsSeriesIndex){
                    var series = dataset[seriesIndex],
                        val = Math.abs(series[c]);

                    // Negative values not allowed
                    series[c] = val;

                    // Only use negative values internally for the waterfall
                    //  to control Up or Down
                    cumulated += mult * val;
                }
            }
            
            if (mult < 0) {
                totalsSeries[c] = cumulated;
            }
            
            categoryTotals.push(cumulated);
        }
        
        return {
            categoryIndexes: categoryIndexes,
            categoryTotals: categoryTotals
        };
    },

    getDataSet: function() {
        // Clear needed to force re-fetch of visible series
        this.chart.dataEngine.clearDataCache();
        
        var dataset;
        if(this.stacked){
          /*
            Values
            Total  A     B
            [["U", 800, 1200],  // 1800 (depends on visible series)
             ["D", 100,  600],  //  700
             ["D", 400,  300],  //  700
             ["D", 200,  100],  //  300
             ["D", 100,  200]]  //  300

            Values Transposed
            [[ "U", "D", "D", "D", "D"],
             [ 800, 100, 400, 200, 100],
             [1200, 600, 300, 100, 200]]
           */
            dataset = pvc.padMatrixWithZeros(
                             this.chart.dataEngine.getVisibleTransposedValues());
            
            if (this.waterfall){
                // NOTE: changes dataset
                this.ruleData = this.constructWaterfall(dataset);
            }
        } else {
            dataset = this.chart.dataEngine.getVisibleCategoriesIndexes();
        }
        
        return dataset;
    },

    /*
     *   This function implements a number of helper functions in order
     *   to increase the readability and extensibility of the code by:
     *    1: providing symbolic names to the numerous anonymous
     *        functions that need to be passed to CC
     *    2: by moving large parts of the local variable (parameters
     *       and scaling functions out of the 'create' function to this
     *       prepareDataFunctions block. 
     *    3: More sharing of code due to introduction of the 'this.DF'
     *        for storing all helper functions.
     *    4: increased code-sharing between stacked and non-stacked
     *       variant of the bar chart.
     *    The create function is now much cleaner and easier to understand.
     *
     *   These helper functions (closures) are all stored in 'this.DF'
     *
     *   Overriding this 'prepareDataFunctions' allows you to implement
     *   a different ScatterScart.
     *   however, it is also possible to replace specific functions
     *   from the 'this.DF' object.
     */
    prepareDataFunctions:  function(dataset, stacked, isVertical) {
        var myself = this,
            chart  = this.chart,
            dataEngine = chart.dataEngine;

        // create empty container for the functions and data
        this.DF = {};

        // first series are symbolic labels, so hide it such that
        // the axis-range computation is possible.
        /*
		    var lScale = this.waterfall
		  		 ? this.callWithHiddenFirstSeries(
		  			this.chart,
		           	this.chart.getLinearScale, 
		           	true)
		         : this.chart.getLinearScale(true);
		*/
        /** start  fix  (need to resolve this nicely  (CvK))**/
        if (this.waterfall) {
            // extract the maximum
            var mx = 0, 
                catCount = dataset[0].length;
            for(var c = 0 ; c < catCount ; c++) {
                var h = 0;
                for(var s = 0 ; s < dataset.length ; s++){
                    h += dataset[s][c];
                }
                if (h > mx) {
                	mx = h;
                }
            }
            
            // set maximum as a fixed bound
            chart.options.orthoFixedMax = mx;	
        }
        
        var lScale = chart.getLinearScale(true);
        /** end fix **/
        
        var l2Scale = chart.getSecondScale(true),
            oScale  = chart.getOrdinalScale(true);
        
        // determine barPositionOffset and barScale
        var barPositionOffset = 0,
        	barScale, // for !stacked and overflow markers
        	ordBand = oScale.range().band,
        	maxBarSize = ordBand;
        
        if(!stacked){
            var ordDomain = dataEngine.getVisibleSeriesIndexes();
            if(!isVertical){
                // Non-stacked Horizontal bar charts show series from
                //  top to bottom (according to the legend)
            	ordDomain = ordDomain.slice(0);
            	ordDomain.reverse();
            }
            
            // NOTE: 'barSizeRatio' affects the space between bars.
            // Space between categories is controlled by panelSizeRatio.
            barScale = new pv.Scale.ordinal(ordDomain)
            				.splitBanded(0, ordBand, this.barSizeRatio);
            
            // Export needed for generated overflow markers.
            this.DF.barScale = barScale;
            
            maxBarSize = barScale.range().band;
        }
        
        if (maxBarSize > this.maxBarSize) {
            barPositionOffset = (maxBarSize - this.maxBarSize) / 2;
            maxBarSize = this.maxBarSize;
        }
        
        this.DF.maxBarSize = maxBarSize;
        
        /*
         * functions to determine positions along BASE axis.
         */
        if(stacked){
            this.DF.basePositionFunc = function(d){
                return barPositionOffset + oScale(this.index);
            };
            
            // for drawRules
            if (this.waterfall){
                this.DF.baseRulePosFunc = function(d){
                    return barPositionOffset + oScale(d);
                };
            }
        } else {
            this.DF.catContainerBasePosFunc = function(d){
                return oScale(dataEngine.getVisibleCategories()[d]);
            };
            
            this.DF.catContainerWidth = ordBand;
            
            this.DF.relBasePosFunc = function(d){
                return barScale(dataEngine.getVisibleSeriesIndexes()[this.index]) + 
                		barPositionOffset;
            };
        }

        this.DF.secBasePosFunc = function(d){
            return myself.timeSeries 
            	   ? tScale(parser.parse(d.category))
            	   : (oScale(d.category) + ordBand / 2);
        };

        /*
        * functions to determine positions along ORTHOGONAL axis
        */
        this.DF.orthoBotPos = stacked ?
            lScale(0) :
            function(d){ return lScale(pv.min([0,d])); };

        this.DF.orthoLengthFunc = stacked ? 
        function(d){
            return chart.animate(0, lScale(d||0)-lScale(0) );
        } :
        function(d){
            var res = chart.animate(0, 
                Math.abs(lScale(d||0) - lScale(0)));
            return res;
        };

        this.DF.secOrthoLengthFunc = function(d){
            return chart.animate(0, l2Scale(d.value));
        };

        /*
         * functions to determine the color palette.
         */
        var seriesCount = dataEngine.getSeriesSize(),
            colors = chart.colors(pv.range(seriesCount));
        if (this.stacked){
            var totalsSeriesIndex = this.isOrientationHorizontal()
                                    ? 0 
                                    : (seriesCount - 1);
                                    
            this.DF.colorFunc = function(/*d*/){
                var seriesIndex = this.parent.index;
                if (myself.waterfall && seriesIndex == totalsSeriesIndex) {
                    return pv.Color.names["transparent"];
                }

                var seriesIndex2 = dataEngine.getVisibleSeriesIndexes()[seriesIndex];
                return colors(seriesIndex2);
            };
            
        } else {
            this.DF.colorFunc2 = function(d){
                return colors(dataEngine.getVisibleSeriesIndexes()[this.index]);
            };
        }
    },

    /****
    *  Functions used to draw a set of horizontal rules that connect
    *  the bars that compose the waterfall
    ****/
    drawWaterfalls: function(panel) {
        var ruleData = this.ruleData;

        if (!this.stacked){
            pvc.log("Waterfall must be stacked");
            return;
        }
        
        this.drawWaterfallRules(
                    panel, 
                    ruleData.categoryIndexes, 
                    ruleData.categoryTotals, 
                    2);
    },

    drawWaterfallRules: function(panel, cats, vals, offset) {
        var data = [],
            anchor = this.isOrientationVertical() ? "bottom" : "left";

        // build the dataset as a hashmap
        var x1 = offset + this.DF.baseRulePosFunc(cats[0]);
        for(var i = 0; i < cats.length-1 ; i++)
        {
            var x2 = offset + this.DF.baseRulePosFunc(cats[i+1]);
            data.push({
                x: x1, 
                y: this.DF.orthoLengthFunc(vals[i]), 
                w: x2 - x1
            });
            x1 = x2;  // go to next element
        }

        this.pvWaterfallLine = panel.add(pv.Rule)
            .data(data)
            [this.anchorOrtho(anchor) ](function(d) { return d.x; })
            [anchor                   ](function(d) { return d.y; })
            [this.anchorLength(anchor)](function(d) { return d.w; })
            .strokeStyle("#c0c0c0");

        return;
    },

    create: function(){
        var myself = this;
        
        this.width  = this._parent.width;
        this.height = this._parent.height;
        
        // Creates the pv panel
        this.base();
        
        // Send the panel behind the axis, title and legend, panels
        this.pvPanel.zOrder(-10);

        if  ((this.chart.options.orthoFixedMin != null) || 
             (this.chart.options.orthoFixedMax != null)){
            this.pvPanel["overflow"]("hidden");
        }

        var isVertical = this.isOrientationVertical(),
            anchor = isVertical ? "bottom" : "left",
            anchorOrtho = this.anchorOrtho(anchor),
            anchorOrthoLength = this.anchorOrthoLength(anchor),
            anchorLength = this.anchorLength(anchor),
            dataset = this.getDataSet();
        
        // prepare data and functions when creating (rendering) the chart.
        this.prepareDataFunctions(dataset, this.stacked, isVertical);

        var maxBarSize = this.DF.maxBarSize;
        
        if (this.stacked){
            if (this.waterfall){
                this.drawWaterfalls(this.pvPanel);
            }

            this.pvBarPanel = this.pvPanel.add(pv.Layout.Stack)
				.layers(dataset)
                // Stacked Vertical bar charts show series from
                //  top to bottom (according to the legend)
                .order(isVertical  ? "reverse"     : null)
				.orient(isVertical ? "bottom-left" : "left-bottom")
				.x(this.DF.basePositionFunc)
				.y(this.DF.orthoLengthFunc)
				[anchor](this.DF.orthoBotPos);

            this.pvBar = this.pvBarPanel.layer.add(pv.Bar)
                .data(function(d){ return d; })
                [anchorLength](maxBarSize)
                .fillStyle(this.DF.colorFunc);

        } else {   //  not this.stacked
            // define a container (panel) for each category label.
            // later the individuals bars of series will be drawn in 
            // these panels.
            this.pvBarPanel = this.pvPanel.add(pv.Panel)
                                .data(dataset)
                                [anchorOrtho      ](this.DF.catContainerBasePosFunc)
                                [anchor           ](0)
                                [anchorLength     ](this.DF.catContainerWidth)
                                // pvBarPanel[X]  = this[X]  (copy the function)
                                [anchorOrthoLength](this[anchorOrthoLength]);

            // next add the bars to the bar-containers in pvBarPanel
            this.pvBar = this.pvBarPanel.add(pv.Bar)
                .data(function(d){
                        return pvc.padArrayWithZeros(
                                    myself.chart.dataEngine.
                                        getVisibleValuesForCategoryIndex(d));
                    })
                .fillStyle(this.DF.colorFunc2)
                [anchorOrtho      ](this.DF.relBasePosFunc)
                [anchor           ](this.DF.orthoBotPos)
                [anchorOrthoLength](this.DF.orthoLengthFunc)
                [anchorLength     ](maxBarSize); 

        }  // end of if (stacked)

        // generate red markers if some data falls outside the panel bounds
        this.generateOverflowMarkers(anchor, this.stacked);

        if(this.chart.options.secondAxis){
            // Second axis - support for line
            this.pvSecondScatterPanel = this.pvPanel.add(pv.Panel)
                .data(this.chart.dataEngine.getSecondAxisIndices());
            
            this.pvArea = this.pvSecondScatterPanel.add(pv.Area)
                .fillStyle(null);
                
            this.pvSecondLine = this.pvArea.add(pv.Line)
                .segmented(true)
                .data(function(d){
                    return myself.chart.dataEngine.getObjectsForSecondAxis(
                            d,
                            this.timeSeries 
                                ? function(a,b){
                                    return parser.parse(a.category) - 
                                           parser.parse(b.category); 
                                  }
                                : null);
                    })
                .strokeStyle(function(){
                    var colors = myself.chart.options.secondAxisColor;
                    colors = colors instanceof Array ? colors : [colors];
                    return colors[this.parent.index % colors.length];
                })
                [anchorOrtho](this.DF.secBasePosFunc)
                [anchor     ](this.DF.secOrthoLengthFunc);

            this.pvSecondDot = this.pvSecondLine.add(pv.Dot)
                .shapeSize(8)
                .lineWidth(1.5)
                .fillStyle(function(){
                    var colors = myself.chart.options.secondAxisColor;
                    colors = colors instanceof Array ? colors : [colors];
                    return colors[this.parent.index % colors.length];
                });
        }

        // Labels:
        this.pvBar
            .text(function(d){
                var dataEngine = myself.chart.dataEngine, 
                    s  = dataEngine.getVisibleSeries()
                		 [myself.stacked ? this.parent.index : this.index],
                	c  = dataEngine.getVisibleCategories()
                		 [myself.stacked ? this.index : this.parent.index];
                
                return myself.chart.options.tooltipFormat.call(myself,s,c,d);
            });

        if(this.showTooltips){
            // Extend default
            this.extend(this.tipsySettings, "tooltip_");
            this.pvBar.event("mouseover", pv.Behavior.tipsy(this.tipsySettings));
        }


        if (this.chart.options.clickable){
            this.pvBar
                .cursor("pointer")
                .event("click",function(d){
                    var s = myself.chart.dataEngine
                        .getSeries()[myself.stacked?this.parent.index:this.index];
                    var c = myself.chart.dataEngine
                        .getCategories()[myself.stacked?this.index:this.parent.index];
                    var e = arguments[arguments.length-1];
                    return myself.chart.options.clickAction(s, c, d, e);
                });
        }

        if(this.showValues){
            this.pvBarLabel = this.pvBar
                .anchor(this.valuesAnchor || 'center')
                .add(pv.Label)
                .bottom(0)
                .visible(function(d) { //no space for text otherwise                    
                    var v = parseFloat(d);
                    return !isNaN(v) && Math.abs(v) >= 1; 
                 })
                .text(function(d){
                    return myself.chart.options.valueFormat(d);
                });
      
            // Extend barLabel
            this.extend(this.pvBarLabel, "barLabel_");
        }

        // Extend waterfall line
        if (this.waterfall){
            this.extend(this.pvWaterfallLine, "barWaterfallLine_");
        }

        // Extend bar and barPanel
        this.extend(this.pvBarPanel, "barPanel_");
        this.extend(this.pvBar, "bar_");
    
        // Extend secondAxis
        if(this.pvSecondLine){
            this.extend(this.pvSecondLine, "barSecondLine_");
        }

        if(this.pvSecondDot){
            this.extend(this.pvSecondDot, "barSecondDot_");
        }

        // Extend body
        this.extend(this.pvPanel, "chart_");
    },


    /*******
   *  Function used to generate overflow and underflowmarkers.
   *  This function is only used when fixedMinX and orthoFixedMax are set
   *
   *******/
    generateOverflowMarkers: function(anchor, stacked){
        if (stacked) {
            if ((this.chart.options.orthoFixedMin != null) || 
                (this.chart.options.orthoFixedMax != null)){  
                pvc.log("WARNING: overflow markers not implemented for Stacked graph yet");
            }
            return;
        }
        
        var myself = this;
        if  (this.chart.options.orthoFixedMin != null){
            // CvK: adding markers for datapoints that are off-axis
            //  UNDERFLOW  =  datavalues < orthoFixedMin
            this.doGenOverflMarks(anchor, true, this.DF.maxBarSize, 
                0, this.DF.barScale,
                function(d){
                    var res = myself.chart.dataEngine
                    .getVisibleValuesForCategoryIndex(d);
                    // check for off-grid values (and replace by null)
                    var fixedMin = myself.chart.options.orthoFixedMin;
                    for(var i=0; i<res.length; i++)
                        res[i] = (res[i] < fixedMin) ? fixedMin : null; 
                    return res;
                });
        }
  
        if (this.chart.options.orthoFixedMax != null){
            // CvK: overflow markers: max > orthoFixedMax
            this.doGenOverflMarks(anchor, false, this.DF.maxBarSize, 
                Math.PI, this.DF.barScale,
                function(d){
                    var res = myself.chart.dataEngine
                    .getVisibleValuesForCategoryIndex(d);
                    // check for off-grid values (and replace by null)
                    var fixedMax = myself.chart.options.orthoFixedMax;
                    for(var i=0; i<res.length; i++)
                        res[i] = (res[i] > fixedMax) ? fixedMax : null; 
                    return res;
                });
        }
    },

    // helper routine used for both underflow and overflow marks
    doGenOverflMarks: function(anchor, underflow, maxBarSize, angle,
        barScale, dataFunction)
    {
        var myself = this;
        var offGridBarOffset = maxBarSize/2,
            lScale = this.chart.getLinearScale(true);
    
        var offGridBorderOffset = underflow 
                                    ? lScale.min + 8  
                                    : lScale.max - 8;
    
        if (this.orientation != "vertical"){
            angle += Math.PI/2.0;
        }
    
        this.overflowMarkers = this.pvBarPanel.add(pv.Dot)
            .shape("triangle")
            .shapeSize(10)
            .shapeAngle(angle)
            .lineWidth(1.5)
            .strokeStyle("red")
            .fillStyle("white")
            .data(dataFunction)
            [this.anchorOrtho(anchor)](function(d){
                var res = barScale(myself.chart.dataEngine
                    .getVisibleSeriesIndexes()[this.index])
                    + offGridBarOffset;
                return res;
            })
            [anchor](function(d){ 
                // draw the markers at a fixed position (null values are
                // shown off-grid (-1000)
                return (d != null) ? offGridBorderOffset: -10000;
            }) ;
    }
});/**
 * Bullet chart generation
 */

pvc.BulletChart = pvc.Base.extend({

  bulletChartPanel : null,
  allowNoData: true,

  constructor: function(o){

    this.base(o);

    var _defaults = {
      showValues: true,
      orientation: "horizontal",
      showTooltips: true,
      legend: false,

      bulletSize: 30,        // Bullet size
      bulletSpacing: 50,     // Spacing between bullets
      bulletMargin: 100,     // Left margin

      // Defaults
      bulletMarkers: [],     // Array of markers to appear
      bulletMeasures: [],    // Array of measures
      bulletRanges: [],      // Ranges
      bulletTitle: "Bullet", // Title
      bulletSubtitle: "",    // Subtitle

      crosstabMode: true,
      seriesInRows: true,

      tipsySettings: {
        gravity: "s",
        fade: true
      }

    };


    // Apply options
    $.extend(this.options,_defaults, o);


  },

  preRender: function(){

    this.base();

    pvc.log("Prerendering in bulletChart");


    this.bulletChartPanel = new pvc.BulletChartPanel(this, {
      showValues: this.options.showValues,
      showTooltips: this.options.showTooltips,
      orientation: this.options.orientation
    });

    this.bulletChartPanel.appendTo(this.basePanel); // Add it

  }

}
);



/*
 * Bullet chart panel. Generates a bar chart. Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showValues</i> - Show or hide bar value. Default: false
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>bulletsPanel_</i> - for the bullets panel
 * <i>bulletPanel_</i> - for the bullets pv.Layout.Bullet
 * <i>bulletRange_</i> - for the bullet range
 * <i>bulletMeasure_</i> - for the bullet measure
 * <i>bulletMarker_</i> - for the marker
 * <i>bulletRule_</i> - for the axis rule
 * <i>bulletRuleLabel_</i> - for the axis rule label
 * <i>bulletTitle_</i> - for the bullet title
 * <i>bulletSubtitle_</i> - for the main bar label
 */


pvc.BulletChartPanel = pvc.BasePanel.extend({

  _parent: null,
  pvBullets: null,
  pvBullet: null,
  data: null,
  onSelectionChange: null,
  showTooltips: true,
  showValues: true,
  tipsySettings: {
    gravity: "s",
    fade: true
  },

  constructor: function(chart, options){

    this.base(chart,options);

  },

  create: function(){

    var myself = this;
    this.width = this._parent.width;
    this.height = this._parent.height;

    var data = this.buildData();

    this.pvPanel = this._parent.getPvPanel().add(pv.Panel)
    .width(this.width)
    .height(this.height);

    var anchor = myself.chart.options.orientation=="horizontal"?"left":"bottom";
    var size, angle, align, titleOffset, ruleAnchor, leftPos, topPos;
    
    if(myself.chart.options.orientation=="horizontal"){
      size = this.width - this.chart.options.bulletMargin - 20;
      angle=0;
      align = "right";
      titleOffset = 0;
      ruleAnchor = "bottom";
      leftPos = this.chart.options.bulletMargin;
      topPos = function(){
        //TODO: 10
        return (this.index * (myself.chart.options.bulletSize + myself.chart.options.bulletSpacing));
      };
    }
    else
    {
      size = this.height - this.chart.options.bulletMargin - 20;
      angle = -Math.PI/2;
      align = "left";
      titleOffset = -12;
      ruleAnchor = "right";
      leftPos = function(){
        return myself.chart.options.bulletMargin + this.index * (myself.chart.options.bulletSize + myself.chart.options.bulletSpacing);
      };
      topPos = undefined;

    }

    this.pvBullets = this.pvPanel.add(pv.Panel)
    .data(data)
    [pvc.BasePanel.orthogonalLength[anchor]](size)
    [pvc.BasePanel.parallelLength[anchor]](this.chart.options.bulletSize)
    .margin(20)
    .left(leftPos) // titles will be on left always
    .top(topPos);
    

    this.pvBullet = this.pvBullets.add(pv.Layout.Bullet)
    .orient(anchor)
    .ranges(function(d){
      return d.ranges;
    })
    .measures(function(d){
      return d.measures;
    })
    .markers(function(d){
      return d.markers;
    });
    
    
    if (myself.chart.options.clickable){
      this.pvBullet
      .cursor("pointer")
      .event("click",function(d){
        var s = d.title;
        var c = d.subtitle;
        var ev = pv.event;
        return myself.chart.options.clickAction(s,c, d.measures, ev);
      });
    }
    
    

    this.pvBulletRange = this.pvBullet.range.add(pv.Bar);
    this.pvBulletMeasure = this.pvBullet.measure.add(pv.Bar)
    .text(function(d){
      return myself.chart.options.valueFormat(d);
    });


    this.pvBulletMarker = this.pvBullet.marker.add(pv.Dot)
    .shape("square")
    .fillStyle("white")
    .text(function(d){
      return myself.chart.options.valueFormat(d);
    });


    if(this.showTooltips){
      // Extend default
      this.extend(this.tipsySettings,"tooltip_");
      this.pvBulletMeasure.event("mouseover", pv.Behavior.tipsy(this.tipsySettings));
      this.pvBulletMarker.event("mouseover", pv.Behavior.tipsy(this.tipsySettings));
    }

    this.pvBulletRule = this.pvBullet.tick.add(pv.Rule);

    this.pvBulletRuleLabel = this.pvBulletRule.anchor(ruleAnchor).add(pv.Label)
    .text(this.pvBullet.x.tickFormat);

    this.pvBulletTitle = this.pvBullet.anchor(anchor).add(pv.Label)
    .font("bold 12px sans-serif")
    .textAngle(angle)
    .left(-10)
    .textAlign(align)
    .textBaseline("bottom")
    .left(titleOffset)
    .text(function(d){
      return d.title;
    });

    this.pvBulletSubtitle = this.pvBullet.anchor(anchor).add(pv.Label)
    .textStyle("#666")
    .textAngle(angle)
    .textAlign(align)
    .textBaseline("top")
    .left(titleOffset)
    .text(function(d){
      return d.subtitle;
    });

	var doubleClickAction = (typeof(myself.chart.options.axisDoubleClickAction) == 'function') ? 
	function(d, e) {
		ignoreClicks = 2;
		myself.chart.options.axisDoubleClickAction(d, e);
		
	}: null;
    
    if (doubleClickAction) {
    	this.pvBulletTitle.events('all')  //labels don't have events by default
            .event("dblclick", function(d){
                    doubleClickAction(d, arguments[arguments.length-1]);
                });

    	this.pvBulletSubtitle.events('all')  //labels don't have events by default
            .event("dblclick", function(d){
                    doubleClickAction(d, arguments[arguments.length-1]);
                });

    }



    // Extension points
    this.extend(this.pvBullets,"bulletsPanel_");
    this.extend(this.pvBullet,"bulletPanel_");
    this.extend(this.pvBulletRange,"bulletRange_");
    this.extend(this.pvBulletMeasure,"bulletMeasure_");
    this.extend(this.pvBulletMarker,"bulletMarker_");
    this.extend(this.pvBulletRule,"bulletRule_");
    this.extend(this.pvBulletRuleLabel,"bulletRuleLabel_");
    this.extend(this.pvBulletTitle,"bulletTitle_");
    this.extend(this.pvBulletSubtitle,"bulletSubtitle_");

    // Extend body
    this.extend(this.pvPanel,"chart_");

  },

  /*
   * Data array to back up bullet charts; Case 1:
   *
   * <i>1) No data is passed</i> - In this case, we'll grab all the value from the options
   * and generate only one bullet
   *
   */

  buildData: function(){

    pvc.log("In buildData: " + this.chart.dataEngine.getInfo() );


    var defaultData = {
      title: this.chart.options.bulletTitle,
      subtitle: this.chart.options.bulletSubtitle,
      ranges:this.chart.options.bulletRanges,
      measures: this.chart.options.bulletMeasures,
      markers: this.chart.options.bulletMarkers
    };
    
    var data = [];

    if(this.chart.dataEngine.getSeriesSize() == 0 ) {
      // No data
      data.push($.extend({},defaultData));
    }
    else {
      // We have data. Iterate through the series.
      var indices = this.chart.dataEngine.getVisibleSeriesIndexes();
      for(var i in indices) if (indices.hasOwnProperty(i))
      {
        var s = this.chart.dataEngine.getSerieByIndex(i);
        var v = this.chart.dataEngine.getVisibleValuesForSeriesIndex(i);
        var d = $.extend({},defaultData);

        switch(v.length){
          case 0:
            // Value only
            d.measures = [s];
            break;
          case 2:
            // Name, value and markers
            d.markers = [v[1]];
          case 1:
            // name and value
            d.title = s;
            d.measures = [v[0]];
            break;
          default:
            // greater or equal 4
            d.title = s;
            d.subtitle = v[0];
            d.measures = [v[1]];
            d.markers = [v[2]];
            if (v.length >= 3){
              d.ranges = v.slice(3);
            }
        }
        data.push(d);
      }
    }
   
    return data;
  }

});
/**
 * Parallel coordinates offer a way to visualize data and make (sub-)selections
 * on this dataset.
 * This code has been based on a protovis example:
 *    http://vis.stanford.edu/protovis/ex/cars.html
 */


pvc.ParallelCoordinates = pvc.Base.extend({

  parCoordPanel : null,
  legendSource: "categories",
  tipsySettings: {
    gravity: "s",
    fade: true
  },

  constructor: function(o){

    this.base(o);

    var _defaults = {
      topRuleOffset: 30,
      botRuleOffset: 30,
      leftRuleOffset: 60,
      rightRuleOffset: 60,
	// sort the categorical (non-numerical dimensions)
      sortCategorical: true,
	// map numerical dimension too (uniform (possible non-linear)
	// distribution of the observed values)
      mapAllDimensions: true,
	// number of digits after decimal point.
      numDigits: 0
    };


    // Apply options
    $.extend(this.options,_defaults, o);

    return;
  },

  preRender: function(){

    this.base();

    pvc.log("Prerendering in parallelCoordinates");

    this.parCoordPanel = new pvc.ParCoordPanel(this, {
      topRuleOffset : this.options.topRuleOffset,
      botRuleOffset : this.options.botRuleOffset,
      leftRuleOffset : this.options.leftRuleOffset,
      rightRuleOffset : this.options.rightRuleOffset,
      sortCategorical : this.options.sortCategorical,
      mapAllDimensions : this.options.mapAllDimensions,
      numDigits : this.options.numDigits
    });

    this.parCoordPanel.appendTo(this.basePanel); // Add it

    return;
  }

}
);


/*
 * ParCoord chart panel. Generates a serie of Parallel Coordinate axis 
 * and allows you too make selections on these parallel coordinates.
 * The selection will be stored in java-script variables and can be
 * used as part of a where-clause in a parameterized SQL statement.
 * Specific options are:
 *   << to be filled in >>

 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>parCoord_</i> - for the parallel coordinates
 *    << to be completed >>
 */


pvc.ParCoordPanel = pvc.BasePanel.extend({

  _parent: null,
  pvParCoord: null,

  dimensions: null, 
  dimensionDescr: null,

  data: null,


  constructor: function(chart, options){

    this.base(chart,options);

  },

    /*****
     * retrieve the data from database and transform it to maps.
     *    - this.dimensions: all dimensions
     *    - this.dimensionDescr: description of dimensions
     *    - this.data: array with hashmap per data-point
     *****/
  retrieveData: function () {
    var de = this.chart.dataEngine;
    var numDigit = this.chart.options.numDigits;

    this.dimensions = de.getVisibleCategories();
    var values = de.getValues();

    var dataRowIndex = de.getVisibleSeriesIndexes();
    var pCoordIndex = de.getVisibleCategoriesIndexes();

    var pCoordKeys = de.getCategories();

    /******
     *  Generate a Coordinate mapping. 
     *  This mapping is required for categorical dimensions and
     *  optional for the numerical dimensions (in 4 steps)
     ********/
    // 1: generate an array of coorMapping-functions
    // BEWARE: Only the first row (index 0) is used to test whether 
    // a dimension is categorical or numerical!
    var pCoordMapping = (this.chart.options.mapAllDimensions) ?
      pCoordIndex.map( function(d) {return (isNaN(values[d][0])) ? 
              {categorical: true, len: 0, map: [] } : 
                             {categorical: false, len: 0,
                                 map: [], displayValue: [] }; })
    : pCoordIndex.map( function(d) {return (isNaN(values[d][0])) ? 
              {categorical: true, len: 0, map: [] } : 
              null; }) ;
  
      // 2: and generate a helper-function to update the mapping
      //  For non-categorical value the original-value is store in displayValue
    var coordMapUpdate = function(i, val) {
      var cMap = pCoordMapping[i];
      var k = null; // define in outer scope.
      if (cMap.categorical == false) {
        var keyVal = val.toFixed(numDigit);   // force the number to be a string
        k = cMap.map[keyVal];
        if (k == null) {
          k = cMap.len;
          cMap.len++;
          cMap.map[keyVal] = k;
          cMap.displayValue[keyVal] = val;
        }
      } else {
        k = cMap.map[val];
        if (k == null) {
          k = cMap.len;
          cMap.len++;
          cMap.map[val] = k;
        }
      }
      return k;
    };

    // 3. determine the value to be displayed
    //   for the categorical dimensions map == displayValue
    for(var d in pCoordMapping){
        if (pCoordMapping.hasOwnProperty(d) && 
            pCoordMapping[d] && 
            pCoordMapping[d].categorical) {
            pCoordMapping[d].displayValue = pCoordMapping[d].map
        }
    }
    
    // 4. apply the sorting of the dimension
    if (   this.chart.options.sortCategorical
        || this.chart.options.mapAllDimensions) {
      // prefill the coordMapping in order to get it in sorted order.
      // sorting is required if all dimensions are mapped!!
      for (var i=0; i<pCoordMapping.length; i++) {
         if (pCoordMapping[i]) {
           // add all data
           for (var col=0; col<values[i].length; col++)
               coordMapUpdate(i, values[i][col]);
           // create a sorted array
           var cMap = pCoordMapping[i].map;
           var sorted = [];
           for(var item in cMap){
                if(cMap.hasOwnProperty(item)){
                    sorted.push(item);
                }
           }
           sorted.sort();
           // and assign a new index to all items
           if (pCoordMapping[i].categorical)
             for(var k=0; k<sorted.length; k++)
               cMap[sorted[k]] = k;
           else
             for(var k=0; k<sorted.length; k++)
               cMap[sorted[k]].index = k;
         }      
      }
    }

    /*************
    *  Generate the full dataset (using the coordinate mapping).
    *  (in 2 steps)
    ******/
    //   1. generate helper-function to transform a data-row to a hashMap
    //   (key-value pairs). 
    //   closure uses pCoordKeys and values
    var generateHashMap = function(col) {
      var record = {};
      for(var i in pCoordIndex) {
          if(pCoordIndex.hasOwnProperty(i)){
                record[pCoordKeys[i]] = (pCoordMapping[i]) ?
                    coordMapUpdate(i, values[i][col]) :
                    values[i][col];
          }
      }
      return record;
    };
    // 2. generate array with a hashmap per data-point
    this.data = dataRowIndex.map(function(col) { return generateHashMap (col)});

    
    /*************
    *  Generate an array of descriptors for the dimensions (in 3 steps).
    ******/
    // 1. find the dimensions
    var descrVals = this.dimensions.map(function(cat)
           {
             var item = {};
             // the part after "__" is assumed to be the units
             var elements = cat.split("__");
             item.id = cat;
             item.name = elements[0];
             item.unit = (elements.length >1)? elements[1] : "";
             return item;
           });

    // 2. compute the min, max and step(-size) per dimension)
    for(var i=0; i<descrVals.length; i++) {
      var item = descrVals[i];
      var index = pCoordIndex[i];
	// orgRowIndex is the index in the original dataset
	// some indices might be (non-existent/invisible)
      item.orgRowIndex = index;

      // determine min, max and estimate step-size
      var len = values[index].length;
      var theMin, theMax, theMin2, theMax2;

      // two version of the same code (one with mapping and one without)
      if (pCoordMapping[index]) {
        theMin = theMax = theMin2 = theMax2 =
               pCoordMapping[index].displayValue[ values[index][0] ] ;

        for(var k=1; k<len; k++) {
          var v = pCoordMapping[index].displayValue[ values[index][k] ] ;
          if (v < theMin)
          {
            theMin2 = theMin;
            theMin = v;
          }
          if (v > theMax) {
            theMax2 = theMax;
            theMax = v;
          }
        }
      } else {  // no coordinate mapping applied
        theMin = theMax = theMin2 = theMax2 = values[index][0];

        for(var k=1; k<len; k++) {
          var v = values[index][k];
          if (v < theMin)
          {
            theMin2 = theMin;
            theMin = v;
          }
          if (v > theMax) {
            theMax2 = theMax;
            theMax = v;
          }
        }
      }   // end else:  coordinate mapping applied

      var theStep = ((theMax - theMax2) + (theMin2-theMin))/2;
      item.min = theMin;
      item.max = theMax;
      item.step = theStep;

      // 3. and include the mapping (and reverse mapping) 
      item.categorical = false; 
      if (pCoordMapping[index]) {
        item.map = pCoordMapping[index].map;
        item.mapLength = pCoordMapping[index].len;
        item.categorical = pCoordMapping[index].categorical; 

        // create the reverse-mapping from key to original value
        if (item.categorical == false) {
          item.orgValue = [];
          var theMap =  pCoordMapping[index].map;
          for (key in theMap){
              if(theMap.hasOwnProperty(key)){
                item.orgValue[ theMap[key] ] = 0.0+key;
              }
          }
        }
      }
    }

    // generate a object using the given set of keys and values
    //  (map from keys[i] to vals[i])
    var genKeyVal = function (keys, vals) {
       var record = {};
      for (var i = 0; i<keys.length; i++)
         record[keys[i]] = vals[i];
      return record;
    };
    this.dimensionDescr = genKeyVal(this.dimensions, descrVals);
    
    return;
  } ,





  create: function(){

    var myself = this;
    this.width = this._parent.width;
    this.height = this._parent.height;

    this.pvPanel = this._parent.getPvPanel().add(this.type)
    .width(this.width)
    .height(this.height)

    this.retrieveData();

    // used in the different closures
    var height = this.height,
    numDigits = this.chart.options.numDigits,
    topRuleOffs = this.chart.options.topRuleOffset,
    botRuleOffs = this.chart.options.botRuleOffset,
    leftRuleOffs = this.chart.options.leftRuleOffset,
    rightRulePos = this.width - this.chart.options.rightRuleOffset,
    topRulePos = this.height- topRuleOffs;
    ruleHeight = topRulePos - botRuleOffs,
    labelTopOffs = topRuleOffs - 12,
      // use dims to get the elements of dimDescr in the appropriate order!!
    dims = this.dimensions,
    dimDescr = this.dimensionDescr;

    /*****
     *   Generate the scales x, y and color
     *******/
    // getDimSc is the basis for getDimensionScale and getDimColorScale
    var getDimSc = function(t, addMargin) {
      var theMin = dimDescr[t].min;
      var theMax = dimDescr[t].max;
      var theStep = dimDescr[t].step;
      // add some margin at top and bottom (based on step)
      if (addMargin) {
        theMin -= theStep;
        theMax += theStep;
      }
      return pv.Scale.linear(theMin, theMax)
              .range(botRuleOffs, topRulePos);
    }; 
    var getDimensionScale = function(t) {
	var scale = getDimSc(t, true)
              .range(botRuleOffs, topRulePos);
      var dd = dimDescr[t];
      if (   dd.orgValue
          && (dd.categorical == false)) {
        // map the value to the original value
        var func = function(x) { var res = scale( dd.orgValue[x]);
                      return res; };
        // wire domain() and invert() to the original scale
        func.domain = function() { return scale.domain(); };
        func.invert = function(d) { return scale.invert(d); };
        return func;
      }
      else
        return scale;
    }; 
    var getDimColorScale = function(t) {
	var scale = getDimSc(t, false)
              .range("steelblue", "brown");
        return scale;
    }; 

    var x = pv.Scale.ordinal(dims).splitFlush(leftRuleOffs, rightRulePos);
    var y = pv.dict(dims, getDimensionScale);
    var colors = pv.dict(dims, getDimColorScale);



    /*****
     *   Generate tools for computing selections.
     *******/
    // Interaction state. 
    var filter = pv.dict(dims, function(t) {
      return {min: y[t].domain()[0], max: y[t].domain()[1]};  });
    var active = dims[0];   // choose the active dimension 

    var selectVisible = (this.chart.options.mapAllDimensions) ?
      function(d) { return dims.every(  
	    // all dimension are handled via a mapping.
            function(t) {
              var dd = dimDescr[t];
              var val = (dd.orgValue && (dd.categorical == false)) ?
                    dd.orgValue[d[t]] : d[t];
	      return (val >= filter[t].min) && (val <= filter[t].max); }
        )}
    : function(d) { return dims.every(  
            function(t) {
		// TO DO: check whether this operates correctly for
		// categorical dimensions  (when mapAllDimensions == false
		return (d[t] >= filter[t].min) && (d[t] <= filter[t].max); }
        )};
 

    /*****
     *   generateLinePattern produces a line pattern based on
     *          1. the current dataset.
     *          2. the current filter settings.
     *          3. the provided colorMethod.
     *  The result is an array where each element contains at least
     *            {x1, y1, x2, y2, color}
     *  Two auxiliary fields are 
     *  Furthermore auxiliary functions are provided
     *     - genAuxData: generate the auxiliary dataset (of clean is)
     *     - drawLinePattern
     *     - colorFuncBg
     *     - colorFuncFreq
     *     - colorFuncActive
     *******/
      var auxData = null;
      var genAuxData = function() {
	  if (auxData === null) {
	      // generate a new (reusable) structure.
	      auxData = [];
	      var genNewArray = function (k, l) {
		  // generated an array with null values
		  var arr = []
		  for (var a=0; a<k; a++) {
		      var elem = []
		      for (var b=0; b<l; b++) 
			  elem.push(0);
		      arr.push(0);
		  }
		  return arr;
	      };
	      for(var i =0; i<dims.length -1; i++) {
		  var currDimLen = dimDescr[ dims[i] ].mapLength;
		  var nextDimLen = dimDescr[ dims[i+1] ].mapLength;
		  auxData.push( genNewArray(currDimLen, nextDimLen) )
	      }
	  } else {
	  // re-use the existing data-structure if it exists already
	      for (var a in auxData){
                  if(auxData.hasOwnProperty(a)){
                      for (var b in a){
                          if(a.hasOwnProperty(b)){
                              for (c=0; c<b.length; c++)
                                  b[c] = 0;
                          }
                      }
                  }
              }
	  }

      };
      var generateLinePattern = function (colFunc) {
	  // find a filtered data-set
	  var filterData = selectVisible(myself.data)

      };
      var drawLinePattern = function (panel, pattern) {
      };
      var colorFuncBg = function() {
	  return "#ddd";
      };


    /*****
     *   Draw the chart and its annotations (except dynamic content)
     *******/
    // Draw the data to the parallel dimensions 
    // (the light grey dataset is a fixed background)
    this.pvParCoord = this.pvPanel.add(pv.Panel)
      .data(myself.data)
      .visible(selectVisible)
      .add(pv.Line)
      .data(dims)
	  .left(function(t, d) { return x(t); } )
      .bottom(function(t, d) { var res = y[t] (d[t]);
			       return res; })
      .strokeStyle("#ddd")
      .lineWidth(1)
      .antialias(false);

    // Rule per dimension.
    rule = this.pvPanel.add(pv.Rule)
      .data(dims)
      .left(x)
      .top(topRuleOffs)
      .bottom(botRuleOffs);

    // Dimension label
    rule.anchor("top").add(pv.Label)
      .top(labelTopOffs)
      .font("bold 10px sans-serif")
      .text(function(d) { return dimDescr[d].name; });


    // add labels on the categorical dimension
    //  compute the array of labels
    var labels = [];
    var labelXoffs = 6,
    labelYoffs = 3;
    for(d in dimDescr) {
     if(dimDescr.hasOwnProperty(d)){
          var dim = dimDescr[d];
          if (dim.categorical) {
            var  xVal = x(dim.id) + labelXoffs;
            for (var l in dim.map){
                 if(dim.map.hasOwnProperty(l)){
                      labels[labels.length] = {
                        x:  xVal,
                        y:  y[dim.id](dim.map[l]) + labelYoffs,
                        label: l
                      };
                 }
            }
          }
      }
    }
    var dimLabels = this.pvPanel.add(pv.Panel)
      .data(labels)
      .add(pv.Label)
      .left(function(d) {return d.x})
      .bottom(function(d) { return d.y})
      .text(function(d) { return d.label})
      .textAlign("left");
    
      
    /*****
     *   Add an additional panel over the top for the dynamic content
     *    (and draw the (full) dataset)
     *******/
    // Draw the selected (changeable) data on a new panel on top
    var change = this.pvPanel.add(pv.Panel);
    var line = change.add(pv.Panel)
      .data(myself.data)
      .visible(selectVisible)
      .add(pv.Line)
      .data(dims)
      .left(function(t, d) { return x(t);})
      .bottom(function(t, d) { return y[t](d[t]); })
      .strokeStyle(function(t, d) { 
        var dd = dimDescr[active];
        var val =  (   dd.orgValue && (dd.categorical == false)) ?
          dd.orgValue[ d[active] ] :
          d[active];
        return colors[active](val);})
      .lineWidth(1);

 

    /*****
     *   Add the user-interaction (mouse-interface)
     *   and the (dynamic) labels of the selection.
     *******/

    // Updater for slider and resizer.
    function update(d) {
      var t = d.dim;
      filter[t].min = Math.max(y[t].domain()[0], y[t].invert(height - d.y - d.dy));
      filter[t].max = Math.min(y[t].domain()[1], y[t].invert(height - d.y));
      active = t;
      change.render();
      return false;
    }

    // Updater for slider and resizer.
    function selectAll(d) {
      if (d.dy < 3) {  // 
        var t = d.dim;
        filter[t].min = Math.max(y[t].domain()[0], y[t].invert(0));
        filter[t].max = Math.min(y[t].domain()[1], y[t].invert(height));
        d.y = botRuleOffs; d.dy = ruleHeight;
        active = t;
        change.render();
      }
      return false;
    }

    // Handle select and drag 
    var handle = change.add(pv.Panel)
      .data(dims.map(function(dim) { return {y:botRuleOffs, dy:ruleHeight, dim:dim}; }))
      .left(function(t) { return x(t.dim) - 30; })
      .width(60)
      .fillStyle("rgba(0,0,0,.001)")
      .cursor("crosshair")
      .event("mousedown", pv.Behavior.select())
      .event("select", update)
      .event("selectend", selectAll)
      .add(pv.Bar)
      .left(25)
      .top(function(d) {return d.y;})
      .width(10)
      .height(function(d) { return d.dy;})
      .fillStyle(function(t) { return  (t.dim == active)
        ? colors[t.dim]((filter[t.dim].max + filter[t.dim].min) / 2)
        : "hsla(0,0,50%,.5)"})
      .strokeStyle("white")
      .cursor("move")
      .event("mousedown", pv.Behavior.drag())
      .event("dragstart", update)
      .event("drag", update);

    handle.anchor("bottom").add(pv.Label)
      .textBaseline("top")
      .text(function(d) { return (dimDescr[d.dim].categorical) ?
                   "" :
                   filter[d.dim].min.toFixed(numDigits) + dimDescr[d.dim].unit;
                 });

    handle.anchor("top").add(pv.Label)
      .textBaseline("bottom")
      .text(function(d) {return (dimDescr[d.dim].categorical) ?
                  "" :
                  filter[d.dim].max.toFixed(numDigits) + dimDescr[d.dim].unit});


    /*****
     *  add the extension points
     *******/

    // Extend ParallelCoordinates
    this.extend(this.pvParCoord,"parCoord_");
    // the parCoord panel is the base-panel (not the colored dynamic overlay)

    // Extend body
    this.extend(this.pvPanel,"chart_");

    return;
  }


});


/**
 * DataTree visualises a data-tree (also called driver tree).
 * It uses a data-sources to obtain the definition of data tree.
 * Each node of the tree can have it's own datasource to visualize the
 * node. 
 */


pvc.DataTree = pvc.Base.extend({

  // the structure of the dataTree is provided by a separate datasource
  structEngine: null,
  structMetadata: null,
  structDataset: null,

  DataTreePanel : null,
  legendSource: "categories",
  tipsySettings: {
    gravity: "s",
    fade: true
  },


  setStructData: function(data){
    this.structDataset = data.resultset;
    if (this.structDataset.length == 0){
      pvc.log("Warning: Structure-dataset is empty")
    }
    this.structMetadata = data.metadata;
    if (this.structMetadata.length == 0){
      pvc.log("Warning: Structure-Metadata is empty")
    }
  },


  constructor: function(o){

    this.base(o);

    var _defaults = {
        // margins around the full tree
      topRuleOffset: 30,  
      botRuleOffset: 30,
      leftRuleOffset: 60,
      rightRuleOffset: 60,
        // box related parameters
      boxplotColor: "grey",
      headerFontsize: 16,
      valueFontsize: 20,
      border:  2,     // bordersize in pixels
      // use perpendicular connector lines  between boxes.
      perpConnector: false, 
      // number of digits (after dot for labels)
      numDigits: 0,
      // the space for the connectors is 15% of the width of a grid cell
      connectorSpace: 0.15,   
      // the vertical space between gridcells is at least 5%
      minVerticalSpace: 0.05,   
      // aspect ratio = width/height  (used to limit AR of the boxes)
      minAspectRatio: 2.0    
    };

    // Apply options
    $.extend(this.options,_defaults, o);

    // Create DataEngine
    this.structEngine = new pvc.DataEngine(this);

    return;
  },

  preRender: function(){

    this.base();

    pvc.log("Prerendering a data-tree");

    // Getting structure-data engine and initialize the translator
    this.structEngine.setData(this.structMetadata,this.structDataset);
    this.structEngine.setCrosstabMode(true);
    this.structEngine.setSeriesInRows(true);
    this.structEngine.createTranslator();
    
    pvc.log(this.structEngine.getInfo());

    this.dataTreePanel = new pvc.DataTreePanel(this, {
      topRuleOffset : this.options.topRuleOffset,
      botRuleOffset : this.options.botRuleOffset,
      leftRuleOffset : this.options.leftRuleOffset,
      rightRuleOffset : this.options.rightRuleOffset,
      boxplotColor:  this.options.boxplotColor,
      valueFontsize: this.options.valueFontsize,
      headerFontsize: this.options.headerFontsize,
      border: this.options.border,
      perpConnector: this.options.perpConnector,
      numDigits: this.options.numDigits,
      minVerticalSpace: this.options.minVerticalSpace,
      connectorSpace: this.options.connectorSpace,
      minAspectRatio: this.options.minAspectRatio
    });

    this.dataTreePanel.appendTo(this.basePanel); // Add it

    return;
  }

}
);


/*
 * DataTree chart panel. 
 *   << to be filled out >>
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 *    << to be filled out >>
 */


pvc.DataTreePanel = pvc.BasePanel.extend({

  _parent: null,
  pvDataTree: null,

  treeElements: null, 
  structMap: null,
  structArr: null,
  data_: null,

  hRules: null,
  vRules: null,
  rules: null,

  constructor: function(chart, options){

    this.base(chart,options);

  },

  // generating Perpendicular connectors 
  // (only using horizontal and vertical rules)
  // leftLength gives the distance from the left box to the
  // splitting point of the connector
  generatePerpConnectors: function(leftLength) {

    this.hRules = [];
    this.vRules = [];
    this.rules = [];  // also initialize this rule-set

    for(var e in this.structMap) {
      var elem = this.structMap[e];
      if (elem.children != null) {
        var min = +10000, max = -10000;
        var theLeft = elem.left + elem.width;
        this.hRules.push({"left": theLeft,
                    "width": leftLength,
                    "bottom": elem.bottom + elem.height/2});
        theLeft += leftLength;
        for(var i in elem.children) {
          var child = this.structMap[ elem.children[i] ];
          var theBottom = child.bottom + child.height/2;
          if (theBottom > max) max = theBottom;
          if (theBottom < min) min = theBottom;
          this.hRules.push({"left": theLeft,
                      "width": child.left - theLeft,
                      "bottom": theBottom});
        }

        // a vertical rule is only added when needed
        if (max > min)
          this.vRules.push({"left": theLeft,
                      "bottom": min,
                      "height": max - min})
      }
    }
  } ,

  // generate a line segment and add it to rules
  generateLineSegment: function(x1, y1, x2, y2) {
    var line = [];
    line.push({"x":  x1,
               "y":  y1});
    line.push({"x":  x2,
               "y":  y2});
    this.rules.push(line);
  } ,

  // leftLength gives the distance from the left box to the
  // splitting point of the connector
  generateConnectors: function(leftLength) {

    this.hRules = [];
    this.vRules = [];

    if (this.chart.options.perpConnector) {
      this.generatePerpConnectors(leftLength);
      return;
    }

    // this time were using diagonal rules
    this.rules = [];

    for(var e in this.structMap) {
      var elem = this.structMap[e];
      if (elem.children != null) {

        // compute the mid-point
        var min = +10000, max = -10000;
        for(var i in elem.children) {
          var child = this.structMap[ elem.children[i] ];
          var theCenter = child.bottom + child.height/2;
          if (theCenter > max) max = theCenter;
          if (theCenter < min) min = theCenter;
        }
        var mid = (max + min)/2

        var theLeft1 = elem.left + elem.width;
        var theLeft2 = theLeft1 + leftLength;

        // outbound line of the left-hand box
        this.generateLineSegment(theLeft1, elem.bottom + elem.height/2,
                                theLeft2, mid);

        // incoming lines of the right-hand boxes
        for(var i in elem.children) {
          var child = this.structMap[ elem.children[i] ];
          var theCenter = child.bottom + child.height/2;

          this.generateLineSegment(theLeft2, mid,
                                   child.left, theCenter);
        }
      }
    }
    return;
  } ,

  retrieveStructure: function () {
    var de = this.chart.structEngine;
    var opts = this.chart.options;

    var colLabels = de.getVisibleCategories();
    this.treeElements = de.getVisibleSeries();
    var values = de.getValues();

    // if a fifth column is added, then
    //  bottom and height are provided in the dataset.
    var bottomHeightSpecified = (colLabels.length > 4);

    // trim al element labels (to allow for matching without spaces)
    for(var e in this.treeElements) 
      this.treeElements[e] = $.trim(this.treeElements[e]);

    // get the bounds (minimal and maximum column and row indices)
    // first a bounds object with two helper-functions is introduced
    var bounds = [];
    bounds.getElement = function(label) {
      // create the element if it does not exist
      if (bounds[label] == null)
        bounds[label] = {"min": +10000, "max": -10000};
      return bounds[label];
    }
    bounds.addValue = function(label, value) {
      var bnd = bounds.getElement(label);
      if (value < bnd.min)
        bnd.min = value;
      if (value > bnd.max)
        bnd.max = value;
      return bnd;
    }
    for(var e in this.treeElements) {
      var elem = this.treeElements[e];
      var col = elem[0];
      var colnr = col.charCodeAt(0);
      var row = parseInt(elem.slice(1));
      bounds.addValue("__cols", colnr);
      bounds.addValue(col,row);
    }

    // determine parameters to find column-bounds    
    var bnds = bounds.getElement("__cols");
    var gridWidth  = this.innerWidth/(bnds.max - bnds.min + 1); // integer
    var connectorWidth = opts.connectorSpace * gridWidth;
    var cellWidth = gridWidth - connectorWidth;
    var maxCellHeight = cellWidth/opts.minAspectRatio;
    var colBase = bnds.min;
    delete bounds["__cols"];

    // compute additional values for each column
    for (var e in bounds) {
      var bnds = bounds[e];
      if (typeof bnds == "function")
        continue;
      var numRows = bnds.max - bnds.min + 1;

      bnds.gridHeight = this.innerHeight/numRows;
      bnds.cellHeight = bnds.gridHeight*(1.0 - opts.minVerticalSpace);
      if (bnds.cellHeight > maxCellHeight)
        bnds.cellHeight = maxCellHeight;
      bnds.relBottom = (bnds.gridHeight - bnds.cellHeight)/2;
      bnds.numRows = numRows;
    };

    // generate the elements
    var whitespaceQuote = new RegExp ('[\\s\"\']+',"g"); 
    this.structMap = {};
    for(var e in this.treeElements) {
      var box = {};
      var elem = this.treeElements[e];
      box.box_id = elem;
      this.structMap[elem] = box;

      var col = elem[0];
      var colnr = col.charCodeAt(0);
      var row = parseInt(elem.slice(1));
      var bnds = bounds.getElement(col);

      box.colIndex = colnr - colBase;
      box.rowIndex = bnds.numRows - (row - bnds.min) - 1;

      box.left = this.leftOffs + box.colIndex * gridWidth;
      box.width = cellWidth;
      if (bottomHeightSpecified) {
	  box.bottom = values[4][e];
	  box.height = values[5][e];
      } else {
	  box.bottom = this.botOffs + box.rowIndex * bnds.gridHeight
	      + bnds.relBottom;
	  box.height = bnds.cellHeight;
      }
      box.label = values[0][e];
      box.selector = values[1][e];
      box.aggregation = values[2][e];
      var children = values[3][e].replace(whitespaceQuote, " ");
      
      box.children = (children == " " || children ==  "") ?
         null : children.split(" ");
    }

    this.generateConnectors((gridWidth - cellWidth)/2);

    // translate the map to an array (needed by protovis)
    this.structArr = [];
    for(var e in this.structMap) {
      var elem = this.structMap[e];
      this.structArr.push(elem);
    }

    return;
  } ,

  findDataValue: function(key, data) {
    for(var i=0; i < data[0].length; i++)
      if (data[0][ i ] == key)
        return data[1][ i ];

    pvc.log("Error: value with key : "+key+" not found.")
  } ,

  generateBoxPlots: function() {
    var opts = this.chart.options;

    for(var e in this.structArr) {
      var elem = this.structArr[e];
      if (elem.values.length == 0)
        continue;

      elem.subplot = {};
      var sp = elem.subplot;

      // order the data elements from 5% bound to 95% bound
      // and determine the horizontal scale
      var dat = [];
      var margin = 15;
      var rlMargin = elem.width/6;

      // generate empty rule sets (existing sets are overwritten !)
      sp.hRules = [];
      sp.vRules = [];
      sp.marks = [];
      sp.labels = [];

      dat.push(this.findDataValue("_p5", elem.values));
      dat.push(this.findDataValue("_p25", elem.values));
      dat.push(this.findDataValue("_p50", elem.values));
      dat.push(this.findDataValue("_p75", elem.values));
      dat.push(this.findDataValue("_p95", elem.values));

      var noBox = false;

	if (typeof(dat[2]) != "undefined") {
        // switch order (assume computational artifact)
        if (dat[4] < dat[0]) {
          dat = dat.reverse();
          pvc.log(" dataset "+ elem.box_id +
	  	" repaired (_p95 was smaller than _p5)");
          }
        if (dat[4] > dat[0])
          sp.hScale = pv.Scale.linear( dat[0], dat[4]);
        else {
          noBox = true;
          // generate a fake scale centered around dat[0] (== dat[4])
          sp.hScale = pv.Scale.linear( dat[0] - 1e-10, dat[0] + 1e-10);
        }
        sp.hScale.range(elem.left + rlMargin, elem.left + elem.width - rlMargin);
        var avLabel = "" + dat[2];   // prepare the label

        for(var i=0; i< dat.length; i++) dat[i] = sp.hScale( dat[i]) 

        sp.bot = elem.bottom + elem.height / 3,
        sp.top = elem.bottom + 2 * elem.height / 3,
        sp.mid = (sp.top + sp.bot) / 2;   // 2/3 of height
        sp.textBottom = elem.bottom + margin;
        sp.textBottom = sp.bot - opts.valueFontsize - 1;

        // and add the new set of rules for a box-plot.
        var lwa = 3;   // constant for "lineWidth Average"
        if (noBox) {
            sp.vRules.push({"left": dat[0],
                          "bottom": sp.bot,
                          "lWidth": lwa,
                          "height": sp.top - sp.bot});
        } else {
          sp.hRules.push({"left": dat[0],
                        "width":  dat[1] - dat[0],
                        "lWidth": 1,
                        "bottom": sp.mid});
          sp.hRules.push({"left": dat[1],
                        "width":  dat[3] - dat[1],
                        "lWidth": 1,
                        "bottom": sp.bot});
          sp.hRules.push({"left": dat[1],
                        "width":  dat[3] - dat[1],
                        "lWidth": 1,
                        "bottom": sp.top});
          sp.hRules.push({"left": dat[3],
                        "width":  dat[4] - dat[3],
                        "lWidth": 1,
                        "bottom": sp.mid});
          for(var i=0; i<dat.length; i++)
            sp.vRules.push({"left": dat[i],
                          "bottom": sp.bot,
                          "lWidth": (i == 2) ? lwa : 1,
                          "height": sp.top - sp.bot});
        }

        sp.labels.push({left: dat[2],
                      bottom: sp.textBottom,
                      text: this.labelFixedDigits(avLabel),
                      size: opts.smValueFont,
                      color: opts.boxplotColor});
    }
    }
  } ,

  labelFixedDigits: function(value) {
    if (typeof value == "string")
        value = parseFloat(value);

    if (typeof value == "number") {
      var nd = this.chart.options.numDigits;

      value = value.toFixed(nd);
    }

    // translate to a string again
    return "" + value;
  } ,

  addDataPoint: function(key) {
    var opts = this.chart.options;

    for(var e in this.structArr) {
      var elem = this.structArr[e];

      if (elem.values.length == 0)
        continue;
      var value = this.findDataValue(key, elem.values)
      if (typeof value == "undefined")
        continue;

      var sp = elem.subplot;
      var theLeft = sp.hScale(value); 

      var theColor = "green";
      sp.marks.push( {
        left: theLeft,
        bottom: sp.mid,
        color: theColor })
      
      sp.labels.push({left: theLeft,
                      bottom: sp.textBottom,
                      text: this.labelFixedDigits(value),
                      size: opts.valueFont,
                      color: theColor});
    }
    return;
  } , 


  retrieveData: function () {
    var de = this.chart.dataEngine;
    var opts = this.chart.options;

    var colLabels = de.getVisibleCategories();
    var selectors = de.getVisibleSeries();
    var values = de.getValues();
    var selMap = {}
    
    // create empty datasets and selMap
    var numCols = values.length;
    for(var e in this.structArr) {
      var elem = this.structArr[e];
      elem.values = [];
      for(var i=0; i<numCols; i++) elem.values.push([]);
      selMap[ elem.selector ] = elem; 
    }

    // distribute the dataset over the elements based on the selector
    var boxNotFound = {};
    for(var i in selectors) {
      var box = selMap[ selectors[ i ] ];
      if (typeof(box) != "undefined")
        for(var j in values) box.values[j].push(values[ j ][ i ])
      else
        boxNotFound[ selectors[i] ] = true
    }

    for (var sel in boxNotFound)
        pvc.log("Could'nt find box for selector: "+ sel)

    this.generateBoxPlots();

    var whitespaceQuote = new RegExp ('[\\s\"\']+',"g"); 
    var selPar = opts.selectParam.replace(whitespaceQuote, '');
    if (   (selPar != "undefined") 
        && (selPar.length > 0)
        && (typeof window[selPar] != "undefined")) {
      selPar = window[selPar]
      this.addDataPoint(selPar);
    }

    return;
  } ,


  create: function(){

    var myself = this;
    var opts = this.chart.options;

    this.width = this._parent.width;
    this.height = this._parent.height;

    this.pvPanel = this._parent.getPvPanel().add(this.type)
    .width(this.width)
    .height(this.height)


    opts.smValueFontsize = Math.round(0.6 * opts.valueFontsize);
    opts.smValueFont = "" + opts.smValueFontsize + "px sans-serif"
    opts.valueFont = "" + opts.valueFontsize + "px sans-serif";

    // used in the different closures
    var height = this.height,
    topRuleOffs = opts.topRuleOffset,
    botRuleOffs = opts.botRuleOffset,
    leftRuleOffs = opts.leftRuleOffset;

    // set a few parameters which will be used during data-retrieval
    this.innerWidth = this.width - leftRuleOffs - opts.rightRuleOffset;
    this.innerHeight = this.height - topRuleOffs - botRuleOffs;
    this.botOffs = botRuleOffs;
    this.leftOffs = leftRuleOffs;

    // retrieve the data and transform it to the internal representation.
    this.retrieveStructure();

    this.retrieveData();



    /*****
     *   Generate the scales x, y and color
     *******/

/*
pv.Mark.prototype.property("testAdd");
    pv.Mark.prototype.testAdd = function(x) { 
return pv.Label(x);
                      }
*/
    var topMargin = opts.headerFontsize + 3;

    // draw the connectors first (rest has to drawn over the top)
    var rules = this.rules;
    for (var i = 0; i < rules.length; i++) {
      this.pvPanel.add(pv.Line)
        .data(rules[ i ])
        .left(function(d) { return d.x})
        .bottom(function(d) { return d.y})
        .lineWidth(1)
        .strokeStyle("black");
    }
    // draw the data containers with decorations
    this.pvDataTree = this.pvPanel.add(pv.Bar)
      .data(myself.structArr)
      .left(function(d) { return d.left})
      .bottom(function(d) { return d.bottom})
      .height(function(d) { return d.height})
      .width(function(d) { return d.width})
      .fillStyle("green")
//;  this.pvDataTree
    .add(pv.Bar)
//      .data(function(d) {return d; })
      .left(function(d) { return d.left + opts.border})
      .bottom(function(d) { return d.bottom + opts.border})
      .height(function(d) { return d.height - opts.border - topMargin})
      .width(function(d) { return d.width - 2 * opts.border})
      .fillStyle("white")
    .add(pv.Label)
      .text(function(d) { return d.label})
      .textAlign("center")
      .left(function (d) {return  d.left + d.width/2})
      .bottom(function(d) {return d.bottom + d.height 
                - opts.headerFontsize - 5 + opts.headerFontsize/5
})
      .font("" + opts.headerFontsize + "px sans-serif")
      .textStyle("white")
      .fillStyle("blue");

    // add the box-plots
    for(var i=0; i<this.structArr.length; i++) {
      var box = this.structArr[i];
      this.pvPanel.add(pv.Rule)
        .data(box.subplot.hRules)
        .left(function(d) { return d.left})
        .width( function(d) { return d.width})
        .bottom( function(d) { return d.bottom})
        .lineWidth( function(d) { return d.lWidth; })
        .strokeStyle(myself.chart.options.boxplotColor);

      this.pvPanel.add(pv.Rule)
        .data(box.subplot.vRules)
        .left(function(d) { return d.left})
        .height( function(d) { return d.height})
        .bottom( function(d) { return d.bottom})
        .lineWidth( function(d) { return d.lWidth; })
        .strokeStyle(myself.chart.options.boxplotColor);

      this.pvPanel.add(pv.Dot)
        .data(box.subplot.marks)
        .left(function(d) { return d.left })
        .bottom(function(d){ return d.bottom})
        .fillStyle(function(d) {return d.color});


      this.pvPanel.add(pv.Label)
        .data(box.subplot.labels)
        .left(function(d) { return d.left })
        .bottom(function(d){ return d.bottom})
        .font(function(d) { return d.size})
        .text(function(d) { return d.text})
        .textAlign("center")
        .textStyle(function(d) {return d.color});

    }

    // add the connecting rules (perpendicular rules)
    if (opts.perpConnector) {
      this.pvPanel.add(pv.Rule)
        .data(myself.vRules)
        .left(function(d) { return d.left})
        .bottom(function(d) { return d.bottom})
        .height(function(d) { return d.height})
        .strokeStyle("black");
      this.pvPanel.add(pv.Rule)
        .data(myself.hRules)
        .left(function(d) { return d.left})
        .bottom(function(d) { return d.bottom})
        .width(function(d) { return d.width})
        .strokeStyle("black");
    }

    /*****
     *   draw the data-tree
     *******/

    /*****
     *  add the extension points
     *******/

    // Extend the dataTree
    this.extend(this.pvDataTree,"dataTree_");

    // Extend body
    this.extend(this.pvPanel,"chart_");

    return;
  }


});

/**
 * BoxplotChart is the main class for generating... categorical boxplotcharts.
 * 
 * The boxplot is used to represent the distribution of data using:
 *  - a box to represent the region that contains 50% of the datapoints,
 *  - the whiskers to represent the regions that contains 95% of the datapoints, and
 *  - a center line (in the box) that represents the median of the dataset.
 * For more information on boxplots you can visit  http://en.wikipedia.org/wiki/Box_plot
 *
 * If you have an issue or suggestions regarding the ccc BoxPlot-charts
 * please contact CvK at cde@vinzi.nl
 */



pvc.BoxplotChart = pvc.CategoricalAbstract.extend({

    bpChartPanel : null,

    constructor: function(o){

        this.base(o);

        var _defaults = {
            showValues: true,
	    //stacked: false,
	    //            waterfall: false,
            panelSizeRatio: 0.9,
            boxSizeRatio: 0.9,
            maxBarSize: 2000,

            originIsZero: true,
            axisOffset: 0,
            showTooltips: true,
            orientation: "vertical",
	    /* 
            orthoFixedMin: null,
            orthoFixedMax: null */
	    boxplotColor: "darkgreen"  // "grey"
        };

        // Apply options
        $.extend(this.options,_defaults, o);

        //  force stacked to be true (default of base-class is false)
	//        this.options.stacked = true;

        return;
    },


    preRender: function(){

       this.base();

       pvc.log("Prerendering in boxplotChart");


       this.bpChartPanel = new pvc.BoxplotChartPanel(this, {
		//stacked: this.options.stacked,
	    //            waterfall: this.options.waterfall,
            panelSizeRatio: this.options.panelSizeRatio,
            boxSizeRatio: this.options.boxSizeRatio,
            maxBarSize: this.options.maxBarSize,
            showValues: this.options.showValues,
            showTooltips: this.options.showTooltips,
            orientation: this.options.orientation,
	    // boxplot specific options
	    boxplotColor: this.options.boxplotColor
        });

        this.categoricalPanel = this.bpChartPanel;

        this.bpChartPanel.appendTo(this.basePanel); // Add it

        return;
    }
}
);


/*
 * Boxplot chart panel generates the actual box-plot with a categorical base-axis.
 * for more information on the options see the documentation file.
 */


pvc.BoxplotChartPanel = pvc.BasePanel.extend({

    _parent: null,
    pvBox: null,
    pvBoxLabel: null,
    /*
    pvWaterfallLine: null,
    pvCategoryPanel: null,
    pvSecondLie: null,
    pvSecondDot: null,
    data: null,
  
    stacked: false,
    */
    panelSizeRatio: 1,
    boxSizeRatio: 0.5,
    boxplotColor: "grey",
    showTooltips: true,
    maxBarSize: 200,
    showValues: true,
    orientation: "vertical",
    tipsySettings: {
        gravity: "s",
        fade: true
    },
    //    ruleData: null,

    hRules: null,
    vRules: null,
    bars: null,


    constructor: function(chart, options){

        this.base(chart,options);

        return;
    },



    getDataSet:  function() {
	    // selection on visibility does not make too much sense here
	    // a box-plot consist of five data-series (and no legend)
        var dataset = this.chart.dataEngine.getVisibleCategoriesIndexes();
        return dataset;
    } ,




    /*
     *   This function implements a number of helper functions in order
     *   to increase the readibily and extendibility of the code by:
     *    1: providing symbolic names (abstractions) to the numerous anonymous
     *        functions that need to be passed to Protovis
     *    2: by moving large parts of the local variabele (parameters
     *       and scaling functions out of the 'create' function to this
     *       prepareDataFunctions blok. 
     *
     *   These helper functions (closures) are all stored in 'this.DF'
     *
     *   Overriding this 'prepareDataFunctions' allows you to implement
     *   a different ScatterScart, however, it is also possible to
     *   replace specific functions from the 'this.DF' object.
     *
     *   Currently I still use a separate chart-type for waterfall/bar plots
     *   and for box-plots.
     */
    prepareDataFunctions:  function() {
        var myself = this;

        // create empty container for the functions and data
        this.DF = {};

        var lScale = this.chart.getLinearScale(true);

        var l2Scale = this.chart.getSecondScale(true);
        var oScale = this.chart.getOrdinalScale(true);
        
        // determine barPositionOffset and barScale
        this.DF.maxBarSize = null;
        var barPositionOffset = 0;
        var barScale = new pv.Scale.ordinal(
        			this.chart.dataEngine.getVisibleSeriesIndexes())
            		.splitBanded(0, oScale.range().band, this.boxSizeRatio);
        // We need to take into account the maxValue if our band 
        // exceeds this value

        this.DF.maxBarSize = barScale.range().band;

        if (this.DF.maxBarSize > this.maxBarSize) {
            barPositionOffset = (this.DF.maxBarSize - this.maxBarSize)/2 ;
            this.DF.maxBarSize = this.maxBarSize;
        }

     /*
     * fuctions to determine positions along base axis.
     */
	/*
        this.DF.basePositionFunc = stacked ?
        function(d){
            var res = oScale(this.index) + barPositionOffset;
            // This function used this pointer instead of d !!
            return res
        } :
        null;

        this.DF.baseRulePosFunc = stacked ?
        function(d){
            var res = oScale(d) + barPositionOffset;
            return res
        } :
        null;
	*/

	// find the left side of the container
        this.DF.catContainerBasePosFunc = oScale; 
	/*
	function(d){
            return oScale(this.index);
	    };*/

        this.DF.catContainerWidth = oScale.range().band;

	// find the relative position within this container

        this.DF.relBasePosFunc  = function(d){
            var res = barScale(myself.chart.dataEngine
                .getVisibleSeriesIndexes()[this.index]) + barPositionOffset;
            return res;
        };


        this.DF.secBasePosFunc = 
        function(d){
            if(myself.timeSeries){
                return tScale(parser.parse(d.category));
            }
            else{
                return oScale(d.category) + oScale.range().band/2;
            }
        };

    /*
     * functions to determine positions along orthogonal axis
     */
        this.DF.orthoBotPos = function(d){
            return lScale(pv.min([0,d]));
        };

        this.DF.orthoLengthFunc = function(d){
	    //            var res = myself.chart.animate(0, 
	    //  Math.abs(lScale(d||0) - lScale(0)));
	    res = lScale(d);
            return res;
        };

        this.DF.secOrthoLengthFunc = function(d){
            return myself.chart.animate(0,l2Scale(d.value));
        };


    /*
     * functions to determine the color palette.
     */
        var colors = this.chart.colors(pv.range(this.chart.dataEngine.getSeriesSize()));

	/*  Not used as a box-plot only contains one series??
        // colorFunc is used for the base dataseries
        this.DF.colorFunc = function(d){
            var ind = this.parent.index;
            return colors (myself.chart.dataEngine
                .getVisibleSeriesIndexes()[ind]);
        };
	*/

        // colorFunc2 is used for ....
        this.DF.colorFunc2 = function(d){
            return colors(myself.chart.dataEngine
                .getVisibleSeriesIndexes()[this.index]);
        };
    } ,

  generateBoxPlots: function() {
    var de = this.chart.dataEngine;
    var colLabels = de.getVisibleCategories();
    //var visibleSeries = de.getVisibleSeries();
    var values = de.getValues();

    var lwa = 2;   // lineWidth of average.

    // store the index of the different values
    var median = 0,
    p25 = 1,
    p75 = 2,
    p5 = 3,
    p95 = 4;

    // boxplot covers third of width of container
    var widthBox = this.DF.catContainerWidth/3; 
    // to do: adjust for max-width and minWidth
    var leftOffset = (this.DF.catContainerWidth - widthBox)/2;

    for(var index=0;  index < colLabels.length; index++) {

	// order the data elements from 5% bound to 95% bound
	// and determine the horizontal scale
	var dat = values[index].map(this.DF.orthoLengthFunc);
      
	var leftBox = this.DF.catContainerBasePosFunc(index) + leftOffset,
	    rightBox = leftBox + widthBox,
	    midBox = (leftBox + rightBox)/2;
	
        this.vRules.push({"left": midBox,
		    "height": dat[p25] - dat[p5],
		    "lWidth": 1,
		    "bottom": dat[p5]});
        this.vRules.push({"left": leftBox,
		    "height": dat[p75] - dat[p25],
		    "lWidth": 1,
		    "bottom": dat[p25]});
        this.vRules.push({"left": rightBox,
		    "height": dat[p75] - dat[p25],
		    "lWidth": 1,
		    "bottom": dat[p25]});
        this.vRules.push({"left": midBox,
		    "height": dat[p95] - dat[p75],
		    "lWidth": 1,
		    "bottom": dat[p75]});
        for(var i=0; i<dat.length; i++)
	    this.hRules.push({"left": leftBox,
			"bottom": dat[i],
			"lWidth": (i == median) ? lwa : 1,
			"width": widthBox});

	this.bars.push({"left": leftBox,
		    "bottom": dat[p25],
		    "width": widthBox,
		    "height": dat[p75]-dat[p25],
		    "fillStyle": "limegreen"
	          });
      }

    /*      sp.labels.push({left: dat[2],
                      bottom: sp.textBottom,
                      text: this.labelFixedDigits(avLabel),
                      size: opts.smValueFont,
                      color: opts.boxplotColor});
    */
    //    }
  } ,


  create: function(){
    var myself = this;
    this.width = this._parent.width;
    this.height = this._parent.height;
    
    this.pvPanel = this._parent.getPvPanel().add(this.type)
      .width(this.width)
      .height(this.height);

    this.hRules = [];
    this.vRules = [];
    this.bars = [];


    var anchor = this.orientation == "vertical"?"bottom":"left";

    // prepare data and functions when creating (rendering) the chart.
    this.prepareDataFunctions();

    this.generateBoxPlots();

    // define a panel for each category label.
    // later the individuals bars of series will be drawn in 
    // these panels.
    this.pvBoxPanel = this.pvPanel.add(pv.Panel);

    // add the box-plots to the chart
      this.pvBoxPanel.add(pv.Bar)
        .data(myself.bars)
        .left(function(d) { return d.left; })
        .width( function(d) { return d.width; })
        .height( function(d) { return d.height; })
        .bottom( function(d) { return d.bottom; })
        .fillStyle( function(d) { return d.fillStyle; });

      this.pvBoxPanel.add(pv.Rule)
        .data(myself.hRules)
        .left(function(d) { return d.left; })
        .width( function(d) { return d.width; })
        .bottom( function(d) { return d.bottom; })
        .lineWidth( function(d) { return d.lWidth; })
        .strokeStyle(myself.chart.options.boxplotColor);

      this.pvBoxPanel.add(pv.Rule)
        .data(myself.vRules)
        .left(function(d) { return d.left; })
        .height( function(d) { return d.height; })
        .bottom( function(d) { return d.bottom; })
        .lineWidth( function(d) { return d.lWidth; })
        .strokeStyle(myself.chart.options.boxplotColor);


        if(this.chart.options.secondAxis){
            // Second axis - support for lines
            this.pvSecondLine = this.pvPanel.add(pv.Line)
            .data(function(d){
                return myself.chart.dataEngine.getObjectsForSecondAxis(d, 
                    this.timeSeries ? function(a,b){
                    return parser.parse(a.category) - parser.parse(b.category);
                    }: null);
                })
            .strokeStyle(function(){
              var cols = this.chart.options.secondAxisColor;
              cols = cols instanceof Array ? cols : [cols];
              return cols[this.parent.index % cols.length];
            })
            [pvc.BasePanel.relativeAnchor[anchor]](myself.DF.secBasePosFunc)
            [anchor](myself.DF.secOrthoLengthFunc);

            this.pvSecondDot = this.pvSecondLine.add(pv.Dot)
            .shapeSize(8)
            .lineWidth(1.5)
            .fillStyle(function(){
              var cols = this.chart.options.secondAxisColor;
              cols = cols instanceof Array ? cols : [cols];
              return cols[this.parent.index % cols.length];
            });
        }

        // add Labels:
        this.pvBoxPanel
        .text(function(d){
            var s = myself.chart.dataEngine
            .getVisibleSeries()[myself.stacked?this.parent.index:this.index];
            
            var c = myself.chart.dataEngine
                    .getVisibleCategories()[myself.stacked?this.index:this.parent.index];
            return myself.chart.options.tooltipFormat.call(myself,s,c,d);
        });

        if(this.showTooltips){
            // Extend default
            this.extend(this.tipsySettings,"tooltip_");
            this.pvBoxPanel
            .event("mouseover", pv.Behavior.tipsy(this.tipsySettings));
        }


        if (this.chart.options.clickable){
            this.pvBoxPanel
            .cursor("pointer")
            .event("click",function(d){
                var s = myself.chart.dataEngine.getSeries()[myself.stacked?this.parent.index:this.index];
                var c = myself.chart.dataEngine.getCategories()[myself.stacked?this.index:this.parent.index];
                var ev = arguments[arguments.length-1];
                return myself.chart.options.clickAction(s,c, d, ev);
            });
        }
    /*  heeft geen data !!
        if(this.showValues){
            this.pvBoxLabel = this.pvBoxPanel
            .anchor("center")
            .add(pv.Label)
            .bottom(0)
            .text(function(d){
                return myself.chart.options.valueFormat(d);
            })
      
            // Extend barLabel
            this.extend(this.pvBoxLabel,"barLabel_");
        }
    */
        // Extend bar and barPanel
        this.extend(this.pvBoxPanel,"boxPanel_");
        this.extend(this.pvBoxPanel,"box_");
    

        // Extend body
        this.extend(this.pvPanel,"chart_");

    }

});
