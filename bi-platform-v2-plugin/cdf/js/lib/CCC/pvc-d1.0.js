pen.define("cdf/lib/CCC/pvc-d1.0", ["cdf/Base", "cdf/lib/CCC/def", "cdf/lib/CCC/protovis"], function(_Base, def, pv){

/*global pvc:true */
var pvc = def.globalSpace('pvc', {
    // 0 - off
    // 1 - errors 
    // 2 - errors, warnings
    // 3 - errors, warnings, info
    // 4 - verbose
    // 5 - trash
    // ...
    debug: 0
});

// Begin private scope
(function(){

// Check URL debug and debugLevel
(function(){
    if((typeof window.location) !== 'undefined'){
        var url = window.location.href;
        if(url && (/\bdebug=true\b/).test(url)){
            var m = /\bdebugLevel=(\d+)/.exec(url);
            pvc.debug = m ? (+m[1]) : 1;
        }
    }
}());

// goldenRatio proportion
// ~61.8% ~ 38.2%
//pvc.goldenRatio = (1 + Math.sqrt(5)) / 2;

pvc.invisibleFill = 'rgba(127,127,127,0.00001)';

var arraySlice = pvc.arraySlice = Array.prototype.slice;

pvc.setDebug = function(level){
    level = +level;
    pvc.debug = isNaN(level) ? 0 : level;
    
    syncTipsyLog();
    
    return pvc.debug;
};

/**
 *  Utility function for logging messages to the console
 */
pvc.log = function(m){
    if (pvc.debug && typeof console !== "undefined"){
        console.log("[pvChart]: " + 
          (typeof m === 'string' ? m : JSON.stringify(m)));
    }
};

pvc.logError = function(e){
    if(e && typeof e === 'object' && e.message){
        e = e.message;
    }
    
    if (typeof console != "undefined"){
        console.log("[pvChart ERROR]: " + e);
    } else {
        throw new Error("[pvChart ERROR]: " + e);
    }
};

// Redirect protovis error handler
pv.error = pvc.logError;

function syncTipsyLog(){
    var tip = pv.Behavior.tipsy;
    if(tip && tip.setDebug){
        tip.setDebug(pvc.debug);
        tip.log = pvc.log;
    }
}

syncTipsyLog();

pvc.cloneMatrix = function(m){
    return m.map(function(d){
        return d.slice();
    });
};

pvc.orientation = {
    vertical:   'vertical',
    horizontal: 'horizontal'
};

/**
 * Extends a type created with {@link def.type}
 * with the properties in {@link exts}, 
 * possibly constrained to the properties of specified names.
 * <p>
 * The properties whose values are not functions
 * are converted to constant functions that return the original value.
 * </p>
 * @param {function} type
 *      The type to extend.
 * @param {object} [exts] 
 *      The extension object whose properties will extend the type.
 * @param {string[]} [names]
 *      The allowed property names. 
 */
pvc.extendType = function(type, exts, names){
    if(exts){
        var exts2;
        var addExtension = function(ext, name){
            if(ext !== undefined){
                if(!exts2){
                    exts2 = {};
                }
                exts2[name] = def.fun.to(ext);
            }
        };
        
        if(names){
            names.forEach(function(name){
                addExtension(exts[name], name);
            });
        } else {
            def.each(addExtension);
        }
        
        if(exts2){
           type.add(exts2);
        }
    }
};

// TODO: adapt to use def.Query.range
// Adapted from pv.range
pvc.Range = function(start, stop, step){
    if (arguments.length == 1) {
        stop  = start;
        start = 0;
    }
  
    if (step == null) {
        step = 1;
    }
    
    if ((stop - start) / step == Infinity) {
        throw new Error("range must be finite");
    }
  
    this.stop  = stop;//-= (stop - start) * 1e-10; // floating point precision!
    this.start = start;
    this.step  = step;
};

pvc.Range.prototype.forEach = function(fun, ctx){
    var i = 0, j;
    if (this.step < 0) {
        while((j = this.start + this.step * i++) > this.stop) {
            fun.call(ctx, j);
        }
    } else {
        while((j = this.start + this.step * i++) < this.stop) {
            fun.call(ctx, j);
        }
    }
};

pvc.Range.prototype.map = function(fun, ctx){
    var result = [];
    
    this.forEach(function(j){
        result.push(fun.call(ctx, j));
    });
    
    return result;
};

/**
 * The default color scheme used by charts.
 * <p>
 * Charts use the color scheme specified in the chart options 
 * {@link pvc.BaseChart#options.colors}
 * and 
 * {@link pvc.BaseChart#options.secondAxisColors}, 
 * for the main and second axis series, respectively, 
 * or, when any is unspecified, 
 * the default color scheme.
 * </p>
 * <p>
 * When null, the color scheme {@link pv.Colors.category10} is implied. 
 * To obtain the default color scheme call {@link pvc.createColorScheme}
 * with no arguments. 
 * </p>
 * <p>
 * To be generically useful, 
 * a color scheme should contain at least 10 colors.
 * </p>
 * <p>
 * A color scheme is a function that creates a {@link pv.Scale} color scale function
 * each time it is called. 
 * It sets as its domain the specified arguments and as range 
 * the pre-spcecified colors of the color scheme.
 * </p>
 * 
 * @readonly
 * @type function
 */
pvc.defaultColorScheme = null;

/**
 * Sets the colors of the default color scheme used by charts 
 * to a specified color array.
 * <p>
 * If null is specified, the default color scheme is reset to its original value.
 * </p>
 * 
 * @param {string|pv.Color|string[]|pv.Color[]|pv.Scale|function} [colors=null] Something convertible to a color scheme by {@link pvc.colorScheme}.
 * @return {null|pv.Scale} A color scale function or null.
 */
pvc.setDefaultColorScheme = function(colors){
    return pvc.defaultColorScheme = pvc.colorScheme(colors);
};

pvc.defaultColor = pv.Colors.category10()('?');

/**
 * Creates a color scheme if the specified argument is not one already.
 * 
 * @param {string|pv.Color|string[]|pv.Color[]|pv.Scale|function} [colors=null] A value convertible to a color scheme: 
 * a color string, 
 * a color object, 
 * an array of color strings or objects, 
 * a color scale function, 
 * or null.
 * 
 * @returns {null|function} A color scheme function or null.
 */
pvc.colorScheme = function(colors){
    if(colors == null){
        return null;
    }
    
    if(typeof colors === 'function') {
        if(!colors.hasOwnProperty('range')){
            // Assume already a color scheme (a color scale factory)
            return colors;
        }
        
        // A protovis color scale
        // Obtain its range colors array and discard the scale function.
        colors = colors.range();
    } else {
        colors = def.array.as(colors);
    }
    
    if(!colors.length){
        return null;
    }
    
    return function() {
        var scale = pv.colors(colors); // creates a color scale with a defined range
        scale.domain.apply(scale, arguments); // defines the domain of the color scale
        return scale;
    };
},

/**
 * Creates a color scheme based on the specified colors.
 * When no colors are specified, the default color scheme is returned.
 * 
 * @see pvc.defaultColorScheme 
 * @param {string|pv.Color|string[]|pv.Color[]|pv.Scale|function} [colors=null] Something convertible to a color scheme by {@link pvc.colorScheme}.
 * @type function
 */
pvc.createColorScheme = function(colors){
    return pvc.colorScheme(colors) ||
           pvc.defaultColorScheme  ||
           pv.Colors.category10;
};

// Convert to Grayscale using YCbCr luminance conv.
pvc.toGrayScale = function(color, alpha, maxGrayLevel, minGrayLevel){
    color = pv.color(color);
    
    var avg = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    // Don't let the color get near white, or it becomes unperceptible in most monitors
    if(maxGrayLevel === undefined) {
        maxGrayLevel = 200;
    } else if(maxGrayLevel == null){
        maxGrayLevel = 255; // no effect
    }
    
    if(minGrayLevel === undefined){
        minGrayLevel = 30;
    } else if(minGrayLevel == null){
        minGrayLevel = 0; // no effect
    }
    
    var delta = (maxGrayLevel - minGrayLevel);
    if(delta <= 0){
        avg = maxGrayLevel;
    } else {
        // Compress
        avg = minGrayLevel + (avg / 255) * delta;
    }
    
    if(alpha == null){
        alpha = color.opacity;
    } else if(alpha < 0){
        alpha = (-alpha) * color.opacity;
    }
    
    avg = Math.round(avg);
    
    return pv.rgb(avg, avg, avg, alpha);
};

pvc.removeTipsyLegends = function(){
    try {
        $('.tipsy').remove();
    } catch(e) {
        // Do nothing
    }
};

pvc.createDateComparer = function(parser, key){
    if(!key){
        key = pv.identity;
    }
    
    return function(a, b){
        return parser.parse(key(a)) - parser.parse(key(b));
    };
};

pv.Format.createParser = function(pvFormat) {
    
    function parse(value) {
        return pvFormat.parse(value);
    }
    
    return parse;
};

pv.Format.createFormatter = function(pvFormat) {
    
    function format(value) {
        return value != null ? pvFormat.format(value) : "";
    }
    
    return format;
};

pvc.buildIndexedId = function(prefix, index){
    if(index === 0) {
        return prefix; // base, ortho, legend
    }
    
    return prefix + "" + (index + 1); // base2, ortho3,..., legend2
};

pvc.parseLegendClickMode = function(clickMode){
    if(!clickMode){
        clickMode = 'none';
    }
    
    switch(clickMode){
        case 'toggleSelected':
        case 'toggleVisible':
        case 'none':
            break;
            
        default:
            if(pvc.debug >= 2){
                pvc.log("[Warning] Invalid 'legendClickMode' option value: '" + clickMode + "'. Assuming 'none'.");
            }
        
            clickMode = 'none';
            break;
    }
    
    return clickMode;
};

pvc.parseShape = function(shape){
    if(shape){
        switch(shape){
            case 'square':
            case 'circle':
            case 'diamond':
            case 'triangle':
            case 'cross':
            case 'bar':
                break;
            default:
                if(pvc.debug >= 2){
                    pvc.log("[Warning] Invalid 'shape' option value: '" + shape + "'.");
                }
            
                shape = null;
                break;
        }
    }
    
    return shape;
};

pvc.parseAlign = function(side, align){
    var align2, isInvalid;
    if(side === 'left' || side === 'right'){
        align2 = align && pvc.BasePanel.verticalAlign[align];
        if(!align2){
            align2 = 'middle';
            isInvalid = !!align;
        }
    } else {
        align2 = align && pvc.BasePanel.horizontalAlign[align];
        if(!align2){
            align2 = 'center';
            isInvalid = !!align;
        }
    }
    
    if(isInvalid && pvc.debug >= 2){
        pvc.log(def.format("Invalid alignment value '{0}'. Assuming '{1}'.", [align, align2]));
    }
    
    return align2;
};

/**
 * Creates a margins/sides object.
 * @constructor
 * @param {string|number|object} sides May be a css-like shorthand margin string.
 * 
 * <ol>
 *   <li> "1" - {all: '1'}</li>
 *   <li> "1 2" - {top: '1', left: '2', right: '2', bottom: '1'}</li>
 *   <li> "1 2 3" - {top: '1', left: '2', right: '2', bottom: '3'}</li>
 *   <li> "1 2 3 4" - {top: '1', right: '2', bottom: '3', left: '4'}</li>
 * </ol>
 */
pvc.Sides = function(sides){
    if(sides != null){
        this.setSides(sides);
    }
};

pvc.Sides.hnames = 'left right'.split(' ');
pvc.Sides.vnames = 'top bottom'.split(' ');
pvc.Sides.names = 'left right top bottom'.split(' ');
pvc.Sides.namesSet = pv.dict(pvc.Sides.names, def.retTrue);

pvc.parsePosition = function(side, defaultSide){
    if(side && !def.hasOwn(pvc.Sides.namesSet, side)){
        if(!defaultSide){
            defaultSide = 'left';
        }
        
        if(pvc.debug >= 2){
            pvc.log(def.format("Invalid position value '{0}. Assuming '{1}'.", [side, defaultSide]));
        }
        
        side = defaultSide;
    }
    
    return side;
};

pvc.Sides.as = function(v){
    if(v != null && !(v instanceof pvc.Sides)){
        v = new pvc.Sides().setSides(v);
    }
    
    return v;
};

pvc.Sides.prototype.setSides = function(sides){
    if(typeof sides === 'string'){
        var comps = sides.split(/\s+/).map(function(comp){
            return pvc.PercentValue.parse(comp);
        });
        
        switch(comps.length){
            case 1:
                this.set('all', comps[0]);
                return this;
                
            case 2:
                this.set('top',    comps[0]);
                this.set('left',   comps[1]);
                this.set('right',  comps[1]);
                this.set('bottom', comps[0]);
                return this;
                
            case 3:
                this.set('top',    comps[0]);
                this.set('left',   comps[1]);
                this.set('right',  comps[1]);
                this.set('bottom', comps[2]);
                return this;
                
            case 4:
                this.set('top',    comps[0]);
                this.set('right',  comps[1]);
                this.set('bottom', comps[2]);
                this.set('left',   comps[3]);
                return this;
                
            case 0:
                return this;
        }
    } else if(typeof sides === 'number') {
        this.set('all', sides);
        return this;
    } else if (typeof sides === 'object') {
        if(sides instanceof pvc.PercentValue){
            this.set('all', sides);
        } else {
            this.set('all', sides.all);
            for(var p in sides){
                if(p !== 'all' && pvc.Sides.namesSet.hasOwnProperty(p)){
                    this.set(p, sides[p]);
                }
            }
        }
        
        return this;
    }
    
    if(pvc.debug) {
        pvc.log("Invalid 'sides' value: " + JSON.stringify(sides));
    }
    
    return this;
};

pvc.Sides.prototype.set = function(prop, value){
    value = pvc.PercentValue.parse(value);
    if(value != null){
        if(prop === 'all'){
            // expand
            pvc.Sides.names.forEach(function(p){
                this[p] = value;
            }, this);
            
        } else if(def.hasOwn(pvc.Sides.namesSet, prop)){
            this[prop] = value;
        }
    }
};

pvc.Sides.prototype.resolve = function(width, height){
    if(typeof width === 'object'){
        height = width.height;
        width  = width.width;
    }
    
    var sides = {};
    
    pvc.Sides.names.forEach(function(side){
        var value  = 0;
        var sideValue = this[side];
        if(sideValue != null){
            if(typeof(sideValue) === 'number'){
                value = sideValue;
            } else {
                value = sideValue.resolve((side === 'left' || side === 'right') ? width : height);
            }
        }
        
        sides[side] = value;
    }, this);
    
    sides.width  = sides.left   + sides.right;
    sides.height = sides.bottom + sides.top;
    
    return sides;
};

pvc.Sides.resolvedMax = function(a, b){
    var sides = {};
    
    pvc.Sides.names.forEach(function(side){
        sides[side] = Math.max(a[side] || 0, b[side] || 0);
    });
    
    return sides;
};

// -------------

pvc.PercentValue = function(pct){
    this.percent = pct;
};

pvc.PercentValue.prototype.resolve = function(total){
    return this.percent * total;
};

pvc.PercentValue.parse = function(value){
    if(value != null && value !== ''){
        switch(typeof value){
            case 'number': return value;
            case 'string':
                var match = value.match(/^(.+?)\s*(%)?$/);
                if(match){
                    var n = +match[1];
                    if(!isNaN(n)){
                        if(match[2]){
                            if(n >= 0){
                                return new pvc.PercentValue(n / 100);
                            }
                        } else {
                            return n;
                        }
                    }
                }
                break;
                
            case 'object':
                if(value instanceof pvc.PercentValue){
                    return value;
                }
                break;
        }
        
        if(pvc.debug){
            pvc.log(def.format("Invalid margins component '{0}'", [''+value]));
        }
    }
};

pvc.PercentValue.resolve = function(value, total){
    return (value instanceof pvc.PercentValue) ? value.resolve(total) : value;
};

/* Z-Order */

// Backup original methods
var markRenderCore = pv.Mark.prototype.renderCore,
    markZOrder = pv.Mark.prototype.zOrder;

pv.Mark.prototype.zOrder = function(zOrder) {
    var borderPanel = this.borderPanel;
    if(borderPanel && borderPanel !== this){
        return markZOrder.call(borderPanel, zOrder);
    }
    
    return markZOrder.call(this, zOrder);
};

/* Render id */
pv.Mark.prototype.renderCore = function(){
    /* Assign a new render id to the root mark */
    var root = this.root;
    
    root._renderId = (root._renderId || 0) + 1;
    
    if(pvc.debug >= 10){
        pvc.log("BEGIN RENDER " + root._renderId);
    }
    
    /* Render */
    markRenderCore.apply(this, arguments);
    
    if(pvc.debug >= 10){
        pvc.log("END RENDER " + root._renderId);
    }
};

pv.Mark.prototype.renderId = function(){
    return this.root._renderId;
};

/* PROPERTIES */
pv.Mark.prototype.intercept = function(prop, interceptor, extValue, noCast){
    if(extValue !== undefined){
        if(!noCast){
            this[prop](extValue);
        
            extValue = this.propertyValue(prop);
        }
    } else if(!this._intercepted || !this._intercepted[prop]) { // Don't intercept any previous interceptor...
        extValue = this.propertyValue(prop);
    }
        
    // Let undefined pass through as a sign of not-intercepted
    // A 'null' value is considered as an existing property value.
    if(extValue !== undefined){
        extValue = def.fun.to(extValue);
    }
    
    function interceptProp(){
        var args  = arraySlice.call(arguments);
        return interceptor.call(this, extValue, args);
    }

    this[prop](interceptProp);

    (this._intercepted || (this._intercepted = {}))[prop] = true;

    return this;
};

pv.Mark.prototype.lock = function(prop, value){
    if(value !== undefined){
        this[prop](value);
    }

    (this._locked || (this._locked = {}))[prop] = true;
    
    return this;
};


pv.Mark.prototype.isIntercepted = function(prop){
    return this._intercepted && this._intercepted[prop];
};

pv.Mark.prototype.isLocked = function(prop){
    return this._locked && this._locked[prop];
};

/* ANCHORS */
/**
 * name = left | right | top | bottom
 */
pv.Mark.prototype.addMargin = function(name, margin) {
    if(margin !== 0){
        var staticValue = def.nullyTo(this.propertyValue(name), 0),
            fMeasure    = pv.functor(staticValue);
        
        this[name](function(){
            return margin + fMeasure.apply(this, arraySlice.call(arguments));
        });
    }
    
    return this;
};

/**
 * margins = {
 *      all:
 *      left:
 *      right:
 *      top:
 *      bottom:
 * }
 */
pv.Mark.prototype.addMargins = function(margins) {
    var all = def.get(margins, 'all', 0);
    
    this.addMargin('left',   def.get(margins, 'left',   all));
    this.addMargin('right',  def.get(margins, 'right',  all));
    this.addMargin('top',    def.get(margins, 'top',    all));
    this.addMargin('bottom', def.get(margins, 'bottom', all));
    
    return this;
};

/* SCENE */
pv.Mark.prototype.eachSignumInstance = function(fun, ctx){
    this.eachInstance(function(instance, t){
        if(instance.datum || instance.group){
            fun.call(ctx, instance, t);
        }
    });
};

/* BOUNDS */
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

// -----------

pv.Mark.prototype.getInstanceShape = function(instance){
    return new Rect(
            instance.left,
            instance.top,
            instance.width,
            instance.height);
};

pv.Mark.prototype.getInstanceCenterPoint = function(instance){
    return pv.vector(
                instance.left + (instance.width  || 0) / 2,
                instance.top +  (instance.height || 0) / 2);
};

pv.Label.prototype.getInstanceShape = function(instance){
    var t = pvc.text;
    var size = t.getTextSize(instance.text, instance.font);
    
    return t.getLabelPolygon(
                size.width,
                size.height,
                instance.textAlign,
                instance.textBaseline,
                instance.textAngle,
                instance.textMargin)
            .apply(pv.Transform.identity.translate(instance.left, instance.top));
};

pv.Wedge.prototype.getInstanceCenterPoint = function(instance){
    var midAngle  = instance.startAngle + (instance.angle / 2);
    var midRadius = (instance.outerRadius + instance.innerRadius) / 2;
    var dotLeft   = instance.left + midRadius * Math.cos(midAngle);
    var dotTop    = instance.top  + midRadius * Math.sin(midAngle);
    
    return pv.vector(dotLeft, dotTop);
};

pv.Wedge.prototype.getInstanceShape = function(instance){
    var center = this.getInstanceCenterPoint(instance);

    // TODO: at a minimum, improve calculation of circle radius
    // to match the biggest circle within the wedge at that point
    
    return new Circle(center.x, center.y, 10);
};

pv.Dot.prototype.getInstanceShape = function(instance){
    var radius = instance.shapeRadius,
        cx = instance.left,
        cy = instance.top;

    // TODO: square and diamond break when angle is used
    switch(instance.shape){
        case 'diamond':
            radius *= Math.SQRT2;
            // NOTE fall through
        case 'square':
        case 'cross':
            return new Rect(
                cx - radius,
                cy - radius,
                2*radius,
                2*radius);
    }

    // 'circle' included
    
    // Select dots only when the center is included
    return new Circle(cx, cy, radius);
};

pv.Dot.prototype.getInstanceCenterPoint = function(instance){
    return pv.vector(instance.left, instance.top);
};

pv.Area.prototype.getInstanceShape =
pv.Line.prototype.getInstanceShape = function(instance, nextInstance){
    return new Line(instance.left, instance.top, nextInstance.left, nextInstance.top);
};

pv.Area.prototype.getInstanceCenterPoint =
pv.Line.prototype.getInstanceCenterPoint = function(instance, nextInstance){
    return pv.vector(
            (instance.left + nextInstance.left) / 2, 
            (instance.top  + nextInstance.top ) / 2);
};

// --------------------

var Size = def.type('pvc.Size')
.init(function(width, height){
    if(arguments.length === 1){
        if(width != null){
            this.setSize(width);
        }
    } else {
        if(width != null){
            this.width  = width;
        }
        
        if(height != null){
            this.height = height;
        }
    }
})
.add({
    setSize: function(size, keyArgs){
        if(typeof size === 'string'){
            var comps = size.split(/\s+/).map(function(comp){
                return pvc.PercentValue.parse(comp);
            });
            
            switch(comps.length){
                case 1: 
                    this.set(def.get(keyArgs, 'singleProp', 'all'), comps[0]);
                    return this;
                    
                case 2:
                    this.set('width',  comps[0]);
                    this.set('height', comps[1]);
                    return this;
                    
                case 0:
                    return this;
            }
        } else if(typeof size === 'number') {
            this.set(def.get(keyArgs, 'singleProp', 'all'), size);
            return this;
        } else if (typeof size === 'object') {
            this.set('all', size.all);
            for(var p in size){
                if(p !== 'all'){
                    this.set(p, size[p]);
                }
            }
            return this;
        }
        
        if(pvc.debug) {
            pvc.log("Invalid 'size' value: " + JSON.stringify(size));
        }
        return this;
    },
    
    set: function(prop, value){
        if(value != null && def.hasOwn(pvc.Size.namesSet, prop)){
            value = pvc.PercentValue.parse(value);
            if(value != null){
                if(prop === 'all'){
                    // expand
                    pvc.Size.names.forEach(function(p){
                        this[p] = value;
                    }, this);
                    
                } else {
                    this[prop] = value;
                }
            }
        }
    },
    
    clone: function(){
        return new Size(this.width, this.height);
    },
    
    intersect: function(size){
        return new Size(
               Math.min(this.width,  size.width), 
               Math.min(this.height, size.height));
    },
    
    resolve: function(refSize){
        var size = {};
        
        pvc.Size.names.forEach(function(length){
            var lengthValue = this[length];
            if(lengthValue != null){
                if(typeof(lengthValue) === 'number'){
                    size[length] = lengthValue;
                } else if(refSize){
                    var refLength = refSize[length];
                    if(refLength != null){
                        size[length] = lengthValue.resolve(refLength);
                    }
                }
            }
        }, this);
        
        return size;
    }
});

pvc.Size.names = ['width', 'height'];
pvc.Size.namesSet = pv.dict(pvc.Size.names, def.retTrue);

pvc.Size.as = function(v){
    if(v != null && !(v instanceof Size)){
        v = new Size().setSize(v);
    }
    
    return v;
};

// --------------------

var Offset = def.type('pvc.Offset')
.init(function(x, y){
    if(arguments.length === 1){
        if(x != null){
            this.setOffset(x);
        }
    } else {
        if(x != null){
            this.x = x;
        }
        
        if(y != null){
            this.y = y;
        }
    }
})
.add({
    setOffset: function(offset, keyArgs){
        if(typeof offset === 'string'){
            var comps = offset.split(/\s+/).map(function(comp){
                return pvc.PercentValue.parse(comp);
            });
            
            switch(comps.length){
                case 1: 
                    this.set(def.get(keyArgs, 'singleProp', 'all'), comps[0]);
                    return this;
                    
                case 2:
                    this.set('x', comps[0]);
                    this.set('y', comps[1]);
                    return this;
                    
                case 0:
                    return this;
            }
        } else if(typeof offset === 'number') {
            this.set(def.get(keyArgs, 'singleProp', 'all'), offset);
            return this;
        } else if (typeof offset === 'object') {
            this.set('all', offset.all);
            for(var p in offset){
                if(p !== 'all'){
                    this.set(p, offset[p]);
                }
            }
            return this;
        }
        
        if(pvc.debug) {
            pvc.log("Invalid 'offset' value: " + JSON.stringify(offset));
        }
        return this;
    },
    
    set: function(prop, value){
        if(value != null && def.hasOwn(pvc.Offset.namesSet, prop)){
            value = pvc.PercentValue.parse(value);
            if(value != null){
                if(prop === 'all'){
                    // expand
                    pvc.Offset.names.forEach(function(p){
                        this[p] = value;
                    }, this);
                    
                } else {
                    this[prop] = value;
                }
            }
        }
    },
    
    resolve: function(refSize){
        var offset = {};
        
        pvc.Size.names.forEach(function(length){
            var offsetProp  = pvc.Offset.namesSizeToOffset[length];
            var offsetValue = this[offsetProp];
            if(offsetValue != null){
                if(typeof(offsetValue) === 'number'){
                    offset[offsetProp] = offsetValue;
                } else if(refSize){
                    var refLength = refSize[length];
                    if(refLength != null){
                        offset[offsetProp] = offsetValue.resolve(refLength);
                    }
                }
            }
        }, this);
        
        return offset;
    }
});

pvc.Offset.names = ['x', 'y'];
pvc.Offset.namesSet = pv.dict(pvc.Offset.names, def.retTrue);
pvc.Offset.namesSizeToOffset = {width: 'x', height: 'y'};
pvc.Offset.namesSidesToOffset = {left: 'x', right: 'x', top: 'y', bottom: 'y'};

pvc.Offset.as = function(v){
    if(v != null && !(v instanceof Offset)){
        v = new Offset().setOffset(v);
    }
    
    return v;
};

// --------------------

var Shape = def.type('pvc.Shape')
.add({
    transform: function(t){
        return this.clone().apply(t);
    }

    // clone
    // intersectsRect
});

// --------------------

def.mixin(pv.Vector.prototype, Shape.prototype, {
    set: function(x, y){
        this.x  = x  || 0;
        this.y  = y  || 0;
    },
    
    clone: function(){
        return new pv.Vector(this.x, this.y);
    },
    
    apply: function(t){
        this.x  = t.transformHPosition(this.x);
        this.y  = t.transformVPosition(this.y);
        return this;
    },

    intersectsRect: function(rect){
        // Does rect contain the point
        return (this.x >= rect.x) && (this.x <= rect.x2) &&
               (this.y >= rect.y) && (this.y <= rect.y2);
    }
});

// --------------------

var Rect = def.type('pvc.Rect', Shape)
.init(function(x, y, dx, dy){
    this.set(x, y, dx, dy);
})
.add({
    set: function(x, y, dx, dy){
        this.x  =  x || 0;
        this.y  =  y || 0;
        this.dx = dx || 0;
        this.dy = dy || 0;
        
        this.calc();
    },
    
    calc: function(){
        // Ensure normalized
        if(this.dx < 0){
            this.dx = -this.dx;
            this.x  = this.x - this.dx;
        }
        
        if(this.dy < 0){
            this.dy = -this.dy;
            this.y = this.y - this.dy;
        }
        
        this.x2  = this.x + this.dx;
        this.y2  = this.y + this.dy;
        
        this._sides = null;
    },

    clone: function(){
        return new Rect(this.x, this.y, this.dx, this.dy);
    },

    apply: function(t){
        this.x  = t.transformHPosition(this.x);
        this.y  = t.transformVPosition(this.y);
        this.dx = t.transformLength(this.dx);
        this.dy = t.transformLength(this.dy);
        this.calc();
        return this;
    },
    
    containsPoint: function(x, y){
        return this.x < x && x < this.x2 && 
               this.y < y && y < this.y2;
    },
    
    intersectsRect: function(rect){
//        pvc.log("[" + [this.x, this.x2, this.y, this.y2] + "]~" +
//                "[" + [rect.x, rect.x2, rect.y, rect.y2] + "]");

        // rect is trusted to be normalized...

        return (this.x2 > rect.x ) &&  // Some intersection on X
               (this.x  < rect.x2) &&
               (this.y2 > rect.y ) &&  // Some intersection on Y
               (this.y  < rect.y2);
    },

    sides: function(){
        if(!this._sides){
            var x  = this.x,
                y  = this.y,
                x2 = this.x2,
                y2 = this.y2;
    
            /*
             *    x,y    A
             *     * ------- *
             *  D  |         |  B
             *     |         |
             *     * --------*
             *              x2,y2
             *          C
             */
            this._sides = [
                //x, y, x2, y2
                new Line(x,  y,  x2, y),
                new Line(x2, y,  x2, y2),
                new Line(x,  y2, x2, y2),
                new Line(x,  y,  x,  y2)
            ];
        }

        return this._sides;
    }
});

// ------

var Circle = def.type('pvc.Circle', Shape)
.init(function(x, y, radius){
    this.x = x || 0;
    this.y = y || 0;
    this.radius = radius || 0;
})
.add({
    clone: function(){
        return new Circle(this.x, this.y, this.radius);
    },

    apply: function(t){
        this.x = t.transformHPosition(this.x);
        this.y = t.transformVPosition(this.y);
        this.radius = t.transformLength(this.radius);
        return this;
    },

    intersectsRect: function(rect){
        // Taken from http://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection
        var dx2 = rect.dx / 2,
            dy2 = rect.dy / 2;

        var circleDistX = Math.abs(this.x - rect.x - dx2),
            circleDistY = Math.abs(this.y - rect.y - dy2);

        if ((circleDistX > dx2 + this.radius) ||
            (circleDistY > dy2 + this.radius)) {
            return false;
        }

        if (circleDistX <= dx2 || circleDistY <= dy2) {
            return true;
        }

        var sqCornerDistance = Math.pow(circleDistX - dx2, 2) +
                               Math.pow(circleDistY - dy2, 2);

        return sqCornerDistance <= (this.radius * this.radius);
    }
});

// -----

var Line = def.type('pvc.Line', Shape)
.init(function(x, y, x2, y2){
    this.x  = x  || 0;
    this.y  = y  || 0;
    this.x2 = x2 || 0;
    this.y2 = y2 || 0;
})
.add({
    clone: function(){
        return new pvc.Line(this.x, this.y, this.x2, this.x2);
    },

    apply: function(t){
        this.x  = t.transformHPosition(this.x );
        this.y  = t.transformVPosition(this.y );
        this.x2 = t.transformHPosition(this.x2);
        this.y2 = t.transformVPosition(this.y2);
        return this;
    },

    intersectsRect: function(rect){
        if(!rect) {
            return false;
        }
        var sides = rect.sides();
        for(var i = 0 ; i < 4 ; i++){
            if(this.intersectsLine(sides[i])){
                return true;
            }
        }

        return false;
    },

    intersectsLine: function(b){
        // See: http://local.wasp.uwa.edu.au/~pbourke/geometry/lineline2d/
        var a = this,

            x21 = a.x2 - a.x,
            y21 = a.y2 - a.y,

            x43 = b.x2 - b.x,
            y43 = b.y2 - b.y,

            denom = y43 * x21 - x43 * y21;

        if(denom === 0){
            // Parallel lines: no intersection
            return false;
        }

        var y13 = a.y - b.y,
            x13 = a.x - b.x,
            numa = (x43 * y13 - y43 * x13),
            numb = (x21 * y13 - y21 * x13);

        if(denom === 0){
            // Both 0  => coincident
            // Only denom 0 => parallel, but not coincident
            return (numa === 0) && (numb === 0);
        }

        var ua = numa / denom;
        if(ua < 0 || ua > 1){
            // Intersection not within segment a
            return false;
        }

        var ub = numb / denom;
        if(ub < 0 || ub > 1){
            // Intersection not within segment b
            return false;
        }

        return true;
    }
});

// ----------------

var Polygon = def.type('pvc.Polygon', Shape)
.init(function(corners){
    this._corners = corners || [];
})
.add({
    _sides: null,
    _bbox:  null,
    
    corners: function(){
        return this._corners;
    },
    
    clone: function(){
        return new Polygon(this.corners().slice());
    },

    apply: function(t){
        delete this._sides;
        delete this._bbox;
        
        var corners = this.corners();
        for(var i = 0, L = corners.length; i < L ; i++){
            corners[i].apply(t);
        }
        
        return this;
    },
    
    intersectsRect: function(rect){
        // I - Any corner is inside the rect?
        var i, L;
        var corners = this.corners();
        
        L = corners.length;
        for(i = 0 ; i < L ; i++){
            if(corners[i].intersectsRect(rect)){
                return true;
            }
        }
        
        // II - Any side intersects the rect?
        var sides = this.sides();
        L = sides.length;
        for(i = 0 ; i < L ; i++){
            if(sides[i].intersectsRect(rect)){
                return true;
            }
        }
        
        return false;
    },

    sides: function(){
        var sides = this._sides;
        if(!sides){
            sides = this._sides = [];
            
            var corners = this.corners();
            var L = corners.length;
            if(L){
                var prevCorner = corners[0];
                for(var i = 1 ; i < L ; i++){
                    var corner = corners[i];
                    sides.push(
                        new Line(prevCorner.x, prevCorner.y,  corner.x, corner.y));
                }
            }
        }

        return sides;
    },
    
    bbox: function(){
        var bbox = this._bbox;
        if(!bbox){
            var min, max;
            this.corners().forEach(function(corner, index){
                if(min == null){
                    min = pv.vector(corner.x, corner.y);
                } else {
                    if(corner.x < min.x){
                        min.x = corner.x;
                    }
                    
                    if(corner.y < min.y){
                        min.y = corner.y;
                    }
                }
                
                if(max == null){
                    max = pv.vector(corner.x, corner.y);
                } else {
                    if(corner.x > max.x){
                        max.x = corner.x;
                    }
                    
                    if(corner.y > max.y){
                        max.y = corner.y;
                    }
                }
            });
            
            bbox = this._bbox = new pvc.Rect(min.x, min.y, max.x - min.x, max.y - min.y);
        }
        
        return this._bbox;
    }
});

}()); // End private scope


/**
 * Equal to pv.Behavior.select but doesn't necessarily
 * force redraw of component it's in on mousemove, and sends event info
 * (default behavior matches pv.Behavior.select())
 * @param {boolean} autoRefresh refresh parent mark automatically
 * @param {pv.Mark} mark
 * @return {function} mousedown
 **/
pv.Behavior.selector = function(autoRefresh, mark) {
  var scene, // scene context
      index, // scene context
      mprev,
      inited,
      events,
      m1, // initial mouse position
      redrawThis = (arguments.length > 0)?
                    autoRefresh : true; //redraw mark - default: same as pv.Behavior.select
    
  /** @private */
  function mousedown(d, e) {
    if(mark == null){
        index = this.index;
        scene = this.scene;
    } else {
        index = mark.index;
        scene = mark.scene;
    }
    
    if(!events){
        // Staying close to canvas allows cancelling bubbling of the event in time 
        // for other ascendant handlers
        var root = this.root.scene.$g;
        
        events = [
            [root,     "mousemove", pv.listen(root, "mousemove", mousemove)],
            [root,     "mouseup",   pv.listen(root, "mouseup",   mouseup  )],
            
            // But when the mouse leaves the canvas we still need to receive events...
            [document, "mousemove", pv.listen(document, "mousemove", mousemove)],
            [document, "mouseup",   pv.listen(document, "mouseup",   mouseup  )]
        ];
    }
    
    m1 = this.mouse();
    mprev = m1;
    this.selectionRect = new pvc.Rect(m1.x, m1.y);
    
    pv.Mark.dispatch("selectstart", scene, index, e);
  }
  
  /** @private */
  function mousemove(e) {
    if (!scene) {
        return;
    }
    
    e.stopPropagation();
    
    scene.mark.context(scene, index, function() {
        // this === scene.mark
        var m2 = this.mouse();
        if(mprev){
            var dx = m2.x - mprev.x;
            var dy = m2.y - mprev.y;
            var len = dx*dx + dy*dy;
            if(len <= 2){
                return;
            }
            mprev = m2;
        }
            
        var x = m1.x;
        var y = m1.y;
            
        this.selectionRect.set(x, y, m2.x - x, m2.y - y);
        
        if(redrawThis){
            this.render();
        }
        
        pv.Mark.dispatch("select", scene, index, e);
    });
  }

  /** @private */
  function mouseup(e) {
    var lscene = scene;
    if(lscene){
        if(events){
            events.forEach(function(registration){
                pv.unlisten.apply(pv, registration);
            });
            events = null;
        }
        
        e.stopPropagation();
        
        var lmark = lscene.mark;
        if(lmark){
            pv.Mark.dispatch("selectend", lscene, index, e);
        
            lmark.selectionRect = null;
        }
        mprev = null;
        scene = null;
    }
  }

  return mousedown;
};

/**
 * Implements support for svg detection
 */
(function($){
    $.support.svg = $.support.svg || 
        document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
}(jQuery));
// Text measurement utility
def.scope(function(){
    var _currentFontSizeCache;
    
    function createCache(){
        return new pvc.text.FontSizeCache();
    }
    
    function useCache(cache, fun, ctx){
        (cache instanceof pvc.text.FontSizeCache) || def.fail.operationInvalid("Not a valid text cache.");
        
        var prevCache = _currentFontSizeCache;
        _currentFontSizeCache = cache;
        try{
            return fun.call(ctx);
        } finally {
            _currentFontSizeCache = prevCache;
        }
    }
    
    function getTextSize(text, font){
        if(text == null){
            text = "";
        } else {
            text = "" + text;
        }
        
        var bbox = _currentFontSizeCache && _currentFontSizeCache.get(font, text);
        if(!bbox){
            bbox = getTextSizeCore(text, font);
            _currentFontSizeCache && _currentFontSizeCache.put(font, text, bbox);
        }
        
        return bbox;
    }
    
    function getTextLength(text, font){
        return getTextSize(text, font).width;
    }

    function getTextHeight(text, font){
        return getTextSize(text, font).height;
    }
    
    // TODO: if not in px?..
    function getFontSize(font){
        if(pv.renderer() === 'batik'){
            var sty = document.createElementNS('http://www.w3.org/2000/svg','text').style;
            sty.setProperty('font',font);
            return parseInt(sty.getProperty('font-size'), 10);
        }

        var holder = getTextSizePlaceholder();
        holder.css('font', font);
        return parseInt(holder.css('font-size'), 10);
    }

    function getFitInfo(w, h, text, font, diagMargin){
        if(text === '') {
            return {h: true, v: true, d: true};
        }
        
        var len = getTextLength(text, font);
        return {
            h: len <= w,
            v: len <= h,
            d: len <= Math.sqrt(w*w + h*h) - diagMargin
        };
    }

    function trimToWidthB(len, text, font, trimTerminator, before){
        len += getTextLength(trimTerminator, font);
        
        return trimToWidth(len, text, font, trimTerminator, before);
    }
    
    function trimToWidth(len, text, font, trimTerminator, before){
        if(text === '') {
            return text;
        }
  
        var textLen = getTextLength(text, font);
        if(textLen <= len){
            return text;
        }
    
        if(textLen > len * 1.5){ //cutoff for using other algorithm
            return trimToWidthBin(len,text,font,trimTerminator, before);
        }
    
        while(textLen > len){
            text = before ? text.slice(1) : text.slice(0,text.length -1);
            textLen = getTextLength(text, font);
        }
    
        return before ? (trimTerminator + text) : (text + trimTerminator);
    }
    
    function justifyText(text, lineWidth, font){
        var lines = [];
        
        if(lineWidth < getTextLength('a', font)){
            // Not even one letter fits...
            return lines;
        } 
        
        var words = (text || '').split(/\s+/);
        
        var line = "";
        while(words.length){
            var word = words.shift();
            if(word){
                var nextLine = line ? (line + " " + word) : word;
                if(pvc.text.getTextLength(nextLine, font) > lineWidth){
                    // The word by itself may overflow the line width
                    
                    // Start new line
                    if(line){
                        lines.push(line);
                    }
                    
                    line = word;
                } else {
                    line = nextLine; 
                }
            }
        }
        
        if(line){
            lines.push(line);
        }
        
        return lines;
    }
    
    function getLabelPolygon(textWidth, textHeight, align, baseline, angle, margin){
        // From protovis' SvgLabel.js
        
        // x, y are the position of the left-bottom corner
        // of the text relative to its anchor point (at x=0,y=0)
        // x points right, y points down
        var x, y;
        
        switch (baseline) {
            case "middle":
                y = textHeight / 2; // estimate middle (textHeight is not em, the height of capital M)
                break;
              
            case "top":
                y = margin + textHeight;
                break;
          
            case "bottom":
                y = -margin; 
                break;
        }
        
        switch (align) {
            case "right": 
                x = -margin -textWidth; 
                break;
          
            case "center": 
                x = -textWidth / 2;
                break;
          
            case "left": 
                x = margin;
                break;
        }
        
        var bl = pv.vector(x, y);
        var br = bl.plus(textWidth, 0);
        var tr = br.plus(0, -textHeight);
        var tl = bl.plus(0, -textHeight);
        
        // Rotate
        
        if(angle !== 0){
            bl = bl.rotate(angle);
            br = br.rotate(angle);
            tl = tl.rotate(angle);
            tr = tr.rotate(angle);
        }
        
        return new pvc.Polygon([bl, br, tl, tr]);
    }
    
    /* Returns a label's BBox relative to its anchor point */
    function getLabelBBox(textWidth, textHeight, align, baseline, angle, margin){
        
        var polygon = getLabelPolygon(textWidth, textHeight, align, baseline, angle, margin);
        var corners = polygon.corners();
        var bbox;
        if(angle === 0){
            var min = corners[2]; // topLeft
            var max = corners[1]; // bottomRight
            
            bbox = new pvc.Rect(min.x, min.y, max.x - min.x, max.y - min.y);
        } else {
            bbox = polygon.bbox();
        }
        
        bbox.sourceCorners   = corners;
        bbox.sourceAngle     = angle;
        bbox.sourceAlign     = align;
        bbox.sourceTextWidth = textWidth;
        
        return bbox;
    }
    
    // --------------------------
    // private
    var $textSizePlaceholder = null,
        _svgText = null,
        _svgTextFont = null,
        textSizePlaceholderId = 'cccTextSizeTest_' + new Date().getTime();
    
    function getTextSizeCore(text, font){
        if(!text){
            return {width: 0, height: 0};
        }
        
        switch(pv.renderer()){
            case 'vml':   return getTextSizeVML(text, font);
            case 'batik': return getTextSizeCGG(text, font);
        }

        return getTextSizeSVG(text, font);
    }
    
    function getTextSizeSVG(text, font){
        if(!_svgText){
            var holder  = getTextSizePlaceholder();
            var svgElem = pv.SvgScene.create('svg');
            svgElem.setAttribute('font-size', '10px');
            svgElem.setAttribute('font-family', 'sans-serif');
            
            _svgText = pv.SvgScene.create('text');
            svgElem.appendChild(_svgText);
            holder[0].appendChild(svgElem);
        }
        
        if(!font){
            font = null;
        }
        
        if(_svgTextFont !== font){
            _svgTextFont = font;
            pv.SvgScene.setStyle(_svgText, { 'font': font });
        }
        
        var textNode = _svgText.firstChild;
        if(textNode) {
            textNode.nodeValue = ''+text;
        } else {
            if (pv.renderer() === "svgweb") { 
                // SVGWeb needs an extra 'true' to create SVG text nodes properly in IE.
                _svgText.appendChild(document.createTextNode(''+text, true));
            } else {
                _svgText.appendChild(document.createTextNode(''+text));
            }
        }

        var box = _svgText.getBBox();
        return {width: box.width, height: box.height};
    }
    
    function getTextSizePlaceholder(){
        if(!$textSizePlaceholder || !$textSizePlaceholder.parent().length){
            
            $textSizePlaceholder = $(textSizePlaceholderId);

            if(!$textSizePlaceholder.length){
                $textSizePlaceholder = $('<div>')
                    .attr('id', textSizePlaceholderId)
                    .css('position', 'absolute')
                    .css('visibility', 'hidden')
                    .css('width',  'auto')
                    .css('height', 'auto');

                $('body').append($textSizePlaceholder);
            }
        }

        return $textSizePlaceholder;
    }
    
    // ---------------
    
    function getTextSizeCGG(text, font){
        var fontInfo = getFontInfoCGG(font);

        // TODO: Add cgg size method
        // NOTE: the global functions 'getTextLenCGG' and 'getTextHeightCGG' must be
        // defined by the CGG loading environment
        return {
            /*global getTextLenCGG:true */
            width:  getTextLenCGG(text, fontInfo.family, fontInfo.size, fontInfo.style, fontInfo.weight),
            /*global getTextHeightCGG:true */
            height: getTextHeightCGG(text, fontInfo.family, fontInfo.size, fontInfo.style, fontInfo.weight)
        };
    }
    
    var _cggFontCache, _cggFontTextElem;
    
    function getFontInfoCGG(font){
        var fontInfo = _cggFontCache && _cggFontCache[font];
        if(!fontInfo){
            if(!_cggFontTextElem){
                _cggFontTextElem = document.createElementNS('http://www.w3.org/2000/svg','text');
            }
            
            var sty = _cggFontTextElem.style;
            sty.setProperty('font', font);

            // Below, the use of: 
            //   '' + sty.getProperty(...)
            //  converts the results to real strings
            //  and not String objects (this later caused bugs in Java code)
        
            var family = '' + sty.getProperty('font-family');
            if(!family){
                family = 'sans-serif';
            } else if(family.length > 2){
                // Did not work at the server
                //var reQuoted = /^(["']?)(.*?)(\1)$/;
                //family = family.replace(reQuoted, "$2");
                var quote = family.charAt(0);
                if(quote === '"' || quote === "'"){
                    family = family.substr(1, family.length - 2);
                }
            }
            
            fontInfo = {
                family: family,
                size:   '' + sty.getProperty('font-size'),
                style:  '' + sty.getProperty('font-style'),
                weight: '' + sty.getProperty('font-weight')
            };
        }
        
        return fontInfo;
    }
    
    // -------------
    
    function getTextSizeVML(text, font){
        var box = pv.Vml.text_dims(text, font);
        return {width: box.width, height: box.height};
    }
    
    // -------------
    
    function trimToWidthBin(len, text, font, trimTerminator, before){

        var ilen = text.length,
            high = ilen - 2,
            low = 0,
            mid,
            textLen;

        while(low <= high && high > 0){

            mid = Math.ceil((low + high)/2);
            
            var textMid = before ? text.slice(ilen - mid) : text.slice(0, mid);
            textLen = getTextLength(textMid, font);
            if(textLen > len){
                high = mid - 1;
            } else if( getTextLength(before ? text.slice(ilen - mid - 1) : text.slice(0, mid + 1), font) < len ){
                low = mid + 1;
            } else {
                return before ? (trimTerminator + textMid) : (textMid + trimTerminator);
            }
        }

        return before ? (trimTerminator + text.slice(ilen - high)) : (text.slice(0, high) + trimTerminator);
    }

    // ----------------
    
    def
    .type('pvc.text.FontSizeCache')
    .init(function(){
        this._fontsCache = {};
    })
    .add({
        _getFont: function(font){
            return def.getOwn(this._fontsCache, font||'') || (this._fontsCache[font||''] = {});
        },
        
        get: function(font, text){
            return def.getOwn(this._getFont(font), text||'');
        },
        
        put: function(font, text, size){
            return this._getFont(font)[text||''] = size;
        }
    });
    
    // ----------------
    
    def.copyOwn(pvc.text, {
        createCache:     createCache,
        useCache:        useCache,
        getTextSize:     getTextSize,
        getTextLength:   getTextLength,
        getFontSize:     getFontSize,
        getTextHeight:   getTextHeight,
        getFitInfo:      getFitInfo,
        trimToWidth:     trimToWidth,
        trimToWidthB:    trimToWidthB,
        justify:         justifyText,
        getLabelBBox:    getLabelBBox,
        getLabelPolygon: getLabelPolygon
    });
});
// Colors utility
def.scope(function(){
    
    pvc.color = {
        scale:  colorScale,
        scales: colorScales
    };
    
    // --------------------------
    // exported
    
    /**
     * Creates color scales of a specified type for datums grouped by a category.
     * 
     * @name pvc.color.scales
     * @function
     * @param {object} keyArgs Keyword arguments.
     * See {@link pvc.color.scale} for available arguments.
     * 
     * @param {def.Query} keyArgs.data
     * A {@link pvc.data.Data} that is the result of grouping datums along what are here called "category" dimensions.
     * <p>
     * One (possibly equal) color scale is returned per leaf data, indexed by the leaf's absolute key (see {@link pvc.data.Data#absKey}).  
     * </p>
     * @param {boolean} [keyArgs.normPerBaseCategory=false] Indicates that a different color scale should be computed per distinct data category.
     * 
     * @type function 
     */
    function colorScales(keyArgs){
        /*jshint expr:true */
        keyArgs || def.fail.argumentRequired('keyArgs');
        
        var type = keyArgs.type || def.fail.argumentRequired('keyArgs.type');
        
        switch (type) {
            case 'linear':   return new pvc.color.LinearScalesBuild(keyArgs).buildMap();
            case 'discrete': return new pvc.color.DiscreteScalesBuild(keyArgs).buildMap();
            case 'normal':   return new pvc.color.NormalScalesBuild(keyArgs).buildMap(); // TODO
        }
        
        throw def.error.argumentInvalid('scaleType', "Unexistent scale type '{0}'.", [type]);
    }
    
    /**
     * Creates a color scale of a specified type.
     * 
     * @name pvc.color.scale
     * @function
     * @param {object} keyArgs Keyword arguments.
     * See {@link pvc.color.scales} for available arguments.
     * 
     * @param {def.Query} keyArgs.data A {@link pvc.data.Data} instance that 
     * may be used to obtain the domain of the color scale.
     * 
     * @param {string} keyArgs.type The type of color scale.
     * <p>
     * Valid values are 'linear', 'discrete' and 'normal' (normal probability distribution).
     * </p>
     * @param {string|pv.color} [keyArgs.minColor] The minimum color.
     * @param {string|pv.color} [keyArgs.maxColor] The maximum color.
     * @param {string|pv.color} [keyArgs.nullColor] The color shown for null values.
     * @param {(string|pv.color)[]} [keyArgs.colorRange] Array of colors.
     * <p>
     * This argument is ignored if both minimum and maximum colors are specified.
     * Otherwise, if only one of minimum or maximum is specified, it is prepended or appended to
     * the color range array, respectively.
     * </p>
     * <p>
     * When unspecified, the color range is assumed to be 'red', 'yellow' and 'green'. 
     * </p>
     * @param {string} keyArgs.colorDimension The name of the data dimension that is the <b>domain</b> of the color scale.
     * @param {object[]} [keyArgs.colorRangeInterval] An array of domain values to match colors in the color range.
     * 
     * @type function 
     */
    function colorScale(keyArgs){
        /*jshint expr:true */
        keyArgs || def.fail.argumentRequired('keyArgs');
        
        var type = keyArgs.type || def.fail.argumentRequired('keyArgs.type');
        
        switch (type) {
            case 'linear':   return new pvc.color.LinearScalesBuild(keyArgs).build();
            case 'discrete': return new pvc.color.DiscreteScalesBuild(keyArgs).build();
            case 'normal':   return new pvc.color.NormalScalesBuild(keyArgs).build();
        }
        
        throw def.error.argumentInvalid('scaleType', "Unexistent scale type '{0}'.", [type]);
    }
    
    // --------------------------
    // private
    
    /**
     * @class Represents one creation/build of a set of scale functions.
     * @abstract
     */
    def.type('pvc.color.ScalesBuild')
       .init(function(keyArgs){
           this.keyArgs        = keyArgs;
           this.data           = keyArgs.data || def.fail.argumentRequired('keyArgs.data');
           this.domainDimName  = keyArgs.colorDimension || def.fail.argumentRequired('keyArgs.colorDimension');
           this.domainDim      = this.data.dimensions(this.domainDimName);
           
           var dimType = this.domainDim.type;
           if(!dimType.isComparable) {
               this.domainComparer = null;
               pvc.log("Color value dimension should be comparable. Generated color scale may be invalid.");
           } else {
               this.domainComparer = function(a, b){ return dimType.compare(a, b); };
           }
           
           this.nullRangeValue = keyArgs.nullColor ? pv.color(keyArgs.nullColor) : pv.Color.transparent;
           
           this.domainRangeCountDif = 0;
       }).add(/** @lends pvc.color.ScalesBuild# */{
           /**
            * Builds one scale function.
            * 
            * @type pv.Scale
            */
           build: function(){
               this.range = this._getRange();
               this.desiredDomainCount = this.range.length + this.domainRangeCountDif;
               
               var domain = this._getDomain();
               return this._createScale(domain);
           },
           
           /**
            * Builds a map from category keys to scale functions.
            * 
            * @type object
            */
           buildMap: function(){
               this.range = this._getRange();
               this.desiredDomainCount = this.range.length + this.domainRangeCountDif;
               
               var createCategoryScale;
               
               /* Compute a scale-function per data category? */
               if(this.keyArgs.normPerBaseCategory){
                   /* Ignore args' domain and calculate from data of each category */
                   createCategoryScale = function(leafData){
                       // Create a domain from leafData
                       var domain = this._ensureDomain(null, false, leafData);
                       return this._createScale(domain);
                   };
                   
               } else {
                   var domain = this._getDomain(),
                       scale  = this._createScale(domain);
                   
                   createCategoryScale = def.fun.constant(scale);
               }
               
               return this._createCategoryScalesMap(createCategoryScale); 
           },
           
           _createScale: def.method({isAbstract: true}),
           
           _createCategoryScalesMap: function(createCategoryScale){
               return this.data.leafs()
                   .object({
                       name:    function(leafData){ return leafData.absKey; },
                       value:   createCategoryScale,
                       context: this
                   });
           },
           
           _getRange: function(){
               var keyArgs = this.keyArgs,
                   range = keyArgs.colorRange || ['red', 'yellow','green'];
           
               if(keyArgs.minColor != null && keyArgs.maxColor != null){
                   
                   range = [keyArgs.minColor, keyArgs.maxColor];
                   
               } else if (keyArgs.minColor != null){
                   
                   range.unshift(keyArgs.minColor);
                   
               } else if (keyArgs.maxColor != null){
                   
                   range.push(keyArgs.maxColor);
               }
           
               return range.map(function(c) { return pv.color(c); });
           },
           
           _getDataExtent: function(data){
               
               var extent = data.dimensions(this.domainDimName).extent({visible: true});
               if(!extent) { // No atoms...
                   return null;
               }
               
               var min = extent.min.value,
                   max = extent.max.value;
                
               if(max == min){
                   if(max >= 1){
                       min = max - 1;
                   } else {
                       max = min + 1;
                   }
               }
               
               return {min: min, max: max};
           },
           
           _getDomain: function() {
               var domain = this.keyArgs.colorRangeInterval;
               if(domain != null){
                   if(this.domainComparer) {
                       domain.sort(this.domainComparer);
                   }
                   
                   if(domain.length > this.desiredDomainCount){ 
                       // More domain points than needed for supplied range
                       domain = domain.slice(0, this.desiredDomainCount);
                   }
               } else {
                   // This ends up being padded...in ensureDomain
                   domain = [];
               }
               
               return this._ensureDomain(domain, true, this.data);
           },
           
           _ensureDomain: function(domain, doDomainPadding, data) {
               var extent;
               
               if(domain && doDomainPadding){
                   /* 
                    * If domain does not have as many values as there are colors (taking domainRangeCountDif into account),
                    * it is *completed* with the extent calculated from data.
                    * (NOTE: getArgsDomain already truncates the domain to number of colors)
                    */
                   var domainPointsMissing = this.desiredDomainCount - domain.length;
                   if(domainPointsMissing > 0){ 
                       extent = this._getDataExtent(data);
                       if(extent){
                            // Assume domain is sorted
                            switch(domainPointsMissing){  // + 1 in discrete ?????
                                case 1:
                                    if(this.domainComparer) {
                                        def.array.insert(domain, extent.max, this.domainComparer);
                                    } else {
                                        domain.push(extent.max);
                                    }
                                    break;

                                case 2:
                                    if(this.domainComparer) {
                                        def.array.insert(domain, extent.min, this.domainComparer);
                                        def.array.insert(domain, extent.max, this.domainComparer);
                                    } else {
                                        domain.unshift(extent.min);
                                        domain.push(extent.max);
                                    }
                                    break;

                                default:
                                    /* Ignore args domain altogether */
                                    if(pvc.debug >= 2){
                                            pvc.log("Ignoring option 'colorRangeInterval' due to unsupported length." +
                                                    def.format(" Should have '{0}', but instead has '{1}'.", [this.desiredDomainCount, domain.length]));
                                    }
                                    domain = null;
                            }
                        }
                   }
               }
               
               if(!domain) {
                   /*jshint expr:true */
                   extent || (extent = this._getDataExtent(data));
                   if(extent){
                       var min = extent.min,
                           max = extent.max;
                       var step = (max - min) / (this.desiredDomainCount - 1);
                       domain = pv.range(min, max + step, step);
                   }
               }
               
               return domain;
           }
       });
        
    
    def.type('pvc.color.LinearScalesBuild', pvc.color.ScalesBuild)
    .add(/** @lends pvc.color.LinearScalesBuild# */{
        
        _createScale: function(domain){
            var scale = pv.Scale.linear();

            if(domain){
                scale.domain.apply(scale, domain);
            }
            
            scale.range.apply(scale, this.range);
            
            return scale;
        }
    });
    
    def.type('pvc.color.DiscreteScalesBuild', pvc.color.ScalesBuild)
    .init(function(keyArgs){
        this.base(keyArgs);
        
        this.domainRangeCountDif = 1;
    })
    .add(/** @lends pvc.color.DiscreteScalesBuild# */{
        
        /*
         * Dmin   DMax    C
         * --------------------
         * -      <=d0    c0
         * >d0    <=d1    c1
         * >d1    <=d2    c2
         * ..
         * >dN-3  <=dN-2  cN-2
         * 
         * >dN-2  -       cN-1
         */
        //d0--cR0--d1--cR1--d2
        _createScale: function(domain){
            var Dl = domain.length - 1,
                range = this.range,
                nullRangeValue = this.nullRangeValue,
                Rl = range.length - 1;
            
            function scale(val){
                if(val == null) {
                    return nullRangeValue;
                }
                
                for(var i = 0 ; i < Dl ; i++){  // i <= D - 2  => domain[D-1]
                    if(val <= domain[i + 1]){
                        return range[i];
                    }
                }
                
                // > domain[Dl]
                return range[Rl];
            }
            
            return scale;
        }
    });
    
    /* TODO */ 
      
    /***********
     * compute an array of fill-functions. Each column out of "colAbsValues" 
     * gets it's own scale function assigned to compute the color
     * for a value. Currently supported scales are:
     *    -  linear (from min to max
     *    -  normal distributed from   -numSD*sd to  numSD*sd 
     *         (where sd is the standard deviation)
     ********/
    /*
     getNormalColorScale: function (data, colAbsValues, origData){
    var fillColorScaleByColKey;
    var options = this.chart.options;
    if (options.normPerBaseCategory) {
      // compute the mean and standard-deviation for each column
      var myself = this;
      
      var mean = pv.dict(colAbsValues, function(f){
        return pv.mean(data, function(d){
          return myself.getValue(d[f]);
        })
      });
      
      var sd = pv.dict(colAbsValues, function(f){
        return pv.deviation(data, function(d){
          myself.getValue(d[f]);
        })
      });
      
      //  compute a scale-function for each column (each key)
      fillColorScaleByColKey = pv.dict(colAbsValues, function(f){
        return pv.Scale.linear()
          .domain(-options.numSD * sd[f] + mean[f],
                  options.numSD * sd[f] + mean[f])
          .range(options.minColor, options.maxColor);
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
        .domain(-options.numSD * sd + mean,
                options.numSD * sd + mean)
        .range(options.minColor, options.maxColor);
      
      fillColorScaleByColKey = pv.dict(colAbsValues, function(f){
        return scale;
      });
    }

    return fillColorScaleByColKey;  // run an array of values to compute the colors per column
}      
     */
    
    /* 
     *          r0   ]   r1 ]    r2   ]           rD-2  ] (rD-1)
     * ... --+-------+------+---------+-- ... -+--------+------->
     *       d0      d1     d2        d3       dD-2    dD-1   (linear)
     * 
     * 
     * Mode 1 - Domain divider points
     * 
     * User specifies:
     * # D domain divider points
     * # R = D+1 range points
     * 
     * ////////////////////////////
     * D=0, R=1
     *
     *   r0
     *   ...
     *
     *
     * ////////////////////////////
     * D=1, R=2
     *
     *   r0  ]  r1
     * ... --+-- ...
     *       d0
     *
     *
     * ////////////////////////////
     * D=2, R=3
     *
     *   r0  ]  r1  ]  r2
     * ... --+------+-- ...
     *       d0     d1
     *
     *
     * ////////////////////////////
     * D=3, R=4
     * 
     *   r0  ]  r1  ]  r2  ]  r3
     * ... --+------+------+-- ...
     *       d0     d1     d2
     * 
     * ...
     * 
     * Mode 2 - Domain dividers determination from data extent
     * 
     * //////////////////////////// (inf. = sup.)
     * Special case
     * Only one color is used (the first one, for example)
     * 
     *   r0
     *   
     * //////////////////////////// (inf. < sup.)
     * C=1  => constant color
     * 
     *       r0
     *   +--------+
     *   I        S
     * 
     * ////////////////////////////
     * C=2  =>  N=1 (1 divider point)
     * 
     * B = (S-I)/2
     * 
     *       C0   ]   C1
     *   +--------+--------+
     *   I        d0        S
     *       B         B
     * 
     * ////////////////////////////
     * C=3  =>  N=2 (2 divider points)
     * 
     * B = (S-I)/3
     * 
     *      C0    ]   C1   ]   C2
     *   +--------+--------+--------+
     *   I        d0       d1       S
     *       B        B        B
     *
     * ...
     * 
     */
});
// Options management utility
def.scope(function(){
    /**
     * Creates an options manager given an options specification object,
     * and, optionally, a corresponding context object.
     * 
     * @name pvc.options
     * @class An options manager.
     * @example
     * <pre>
     * var foo = {};
     * 
     * foo.options = pvc.options({
     *         Name: {
     *             alias: 'legendName',
     *             cast:  String,
     *             value: 'John Doe',
     *             resolve: function(context){
     *                 this.setDefault();
     *             }
     *         }
     *     }, foo);
     *     
     * foo.options.specify({
     *    'legendName': "Fritz"
     * });
     * 
     * foo.options('Name2'); // -> "Fritz"
     * </pre>
     * 
     * @constructor
     * @param {object} specs An object whose properties, owned or inherited,
     * have the name of an option to define, and whose values are option
     * specification objects, each having the following <i>optional</i> properties:
     * <ul>
     * <li>resolve - 
     * a method that allows to apply custom value resolution logic for an option.
     * 
     * It is called 
     * on the {@link pvc.options.Info} instance with the 
     * previously specified context object as argument. 
     * </li>
     * <li>cast  - a cast function, called to normalize the value of an option</li>
     * <li>value - the default value of the property, considered already cast</li>
     * <li>alias - name or array of names on which the option is also registered.
     * </li>
     * </ul>
     * 
     * @param {object} [context=null] Optional context object on which to call
     * the 'resolve' function specified in {@link specs}.
     * 
     * @type function
     */
    function options(specs, context){
        specs || def.fail.argumentRequired('specs');
        
        var _infos = {};
        
        def.each(specs, function(spec, name){
            var info = new OptionInfo(name, option, context, spec);
            
            _infos[info.name] = info;
            
            var aliases = info.alias;
            if(aliases){
                aliases.forEach(function(alias){
                    _infos[alias] = info;
                });
            }
        });
        
        /** @private */
        function resolve(name){
            var info = def.getOwn(_infos, name) || 
                       def.fail.operationInvalid("Undefined option '{0}'", [name]);
            
            return info.resolve();
        }
        
        /**
         * Obtains the value of an option given its name.
         * <p>
         * If a value for the option hasn't been provided
         * a default value is returned, 
         * from the option specification.
         * </p>
         * @name pvc.options#option
         * @function
         * @param {string} name The name of the option.
         * @param {booleam} [noDefault=false] Prevents returning a default value.
         * If a value for the option hasn't been provided, undefined is returned.
         * 
         *  @type any
         */
        function option(name, noDefault){
            var info = resolve(name);
            return noDefault && !info.isSpecified ? undefined : info.value;
        }
        
        /**
         * Indicates if a value for a given option has been specified.
         * @name pvc.options#isSpecified
         * @function
         * @param {string} name The name of the option.
         * @type boolean
         */
        function isSpecified(name){
            return resolve(name).isSpecified;
        }
        
        /**
         * Specifies options' values given an object
         * with properties as option names
         * and values as option values.
         * <p>
         * Only properties whose name is the name of a defined option,
         * or one of its aliases, are taken into account.
         * </p>
         * <p>
         * Every property, own or inherited, is considered, 
         * as long as its value is not <c>undefined</c>.
         * </p>
         * @name pvc.options#specify
         * @function
         * @param {object} [opts] An object with option values
         * @returns {function} The options manager. 
         */
        function specify(opts){
            return set(opts, false);
        }
        
        /**
         * Sets options' default values.
         * @name pvc.options#defaults
         * @function
         * @param {object} [opts] An object with option default values
         * @returns {function} The options manager.
         * @see #specify
         */
        function defaults(opts){
            return set(opts, true);
        }
        
        /**
         * Obtains the default value of an option, given its name.
         * <p>
         * If a property has no default value, <c>undefined</c> is returned.
         * </p>
         * @name pvc.options#defaultValue
         * @function
         * @param {string} name The name of the option.
         */
        function getDefaultValue(name){
            return resolve(name)._defaultValue;
        }
        
        /** @private */
        function set(opts, isDefault){
            for(var name in opts){
                var info = def.getOwn(_infos, name);
                if(info){
                    var value = opts[name];
                    if(value !== undefined){
                        info.set(name, isDefault);
                    }
                }
            }
            
            return option;
        }
        
        // ------------
        
        option.option = option;
        option.isSpecified  = isSpecified;
        option.defaultValue = getDefaultValue;
        
        option.specify  = specify;
        option.defaults = defaults;
        
        return option;
    }
    
    // ------------
    
    pvc.options = options;
    
    // ------------
    
    /**
     * @name pvc.options.Info
     * @class An option in an options manager. 
     */
    var OptionInfo = def.type()
    .init(function(name, option, context, spec){
        this.name = name;
        
        this._context = context;
        this.option = option;
        
        this.cast = def.get(spec, 'cast');
        
        // Assumed already cast
        // May be undefined
        var value = def.get(spec, 'value');
        if(value !== undefined){
            this._defaultValue = this.value = value;
        }
        
        this.resolveCore = def.get(spec, 'resolve');
        if(!this.resolveCore){
            this.isResolved = true;
        }
        
        // --------
        
        this.alias = def.array.as(def.get(spec, 'alias'));
    })
    .add( /** @lends @name pvc.options.Info#  */{
        isSpecified: false,
        isResolved: false,
        value: undefined,
        
        /** @private */
        _defaultValue: undefined,
        
        /**
         * Resolves an option if it is not yet resolved.
         * @type pvc.options.Info
         */
        resolve: function(){
            if(!this.isResolved){
                // In case of re-entry, the initial default value is obtained.
                this.isResolved = true;
                
                // Must call set, specify or setDefault
                this.resolveCore(this._context);
            }
            
            return this;
        },
        
        /**
         * Specifies the value of the option.
         * 
         * @param {any} value the option value.
         * @type pvc.options.Info
         */
        specify: function(value){
            return this.set(value, false);
        },
        
        /**
         * Gets, and optionally sets, the default value.
         * @param {any} [value=undefined] the option default value.
         * @type any
         */
        defaultValue: function(defaultValue){
            if(defaultValue !== undefined){
                this.set(defaultValue, true);
            }
            
            return this._defaultValue;
        },
        
        /**
         * Sets the option's value or default value.
         * 
         * @param {any} [value=undefined] the option value or default value.
         * @param {boolean} [isDefault=false] indicates if the operation sets the default value.
         * 
         * @type pvc.options.Info
         */
        set: function(value, isDefault){
            if(value != null){
                if(this.cast){
                    // not a method
                    value = this.cast(value, this._context);
                }
            }
            
            if(!isDefault){
                this.isSpecified = true;
                this.isResolved  = true;
                this.value = value;
            } else {
                this._defaultValue = value;
                
                // Don't touch an already specified value
                if(!this.isSpecified){
                    this.value = value;
                }
            }
            
            return this;
        }
    });
});/**
 * Namespace with data related classes.
 * @name pvc.data
 * @namespace
 */

/**
 * @name NoDataException
 * @class An error thrown when a chart has no data.
 */
def.global.NoDataException = function(){};


pvc.data = {
    visibleKeyArgs: {visible: true}
};

/**
 * Disposes a list of child objects.
 * 
 * @name pvc.data._disposeChildList
 * 
 * @param {Array} list The list with children to dispose.
 * @param {string} [parentProp] The child's parent property to reset.
 * 
 * @static
 * @private
 */
function data_disposeChildList(list, parentProp) {
    if(list){
        list.forEach(function(child){
            if(parentProp) {
                child[parentProp] = null; // HACK: to avoid child removing itself from its parent (this)
            }
            
            child.dispose(); 
        });
        
        list.length = 0;
    }
}

/**
 * Adds a child object.
 * 
 * @name pvc.data._addColChild
 * 
 * @param {object} parent The parent.
 * @param {string} childrenProp A parent's children array property.
 * @param {object} child The child to add.
 * @param {string} parentProp The child's parent property to set.
 * 
 * @static
 * @private
 */
function data_addColChild(parent, childrenProp, child, parentProp) {
    // <Debug>
    /*jshint expr:true */
    (child && !child[parentProp]) || def.assert("Must not have a '" + parentProp + "'.");
    // </Debug>
    
    child[parentProp] = parent;
    
    (parent[childrenProp] || (parent[childrenProp] = [])).push(child);
}

/**
 * Removes a child object.
 * 
 * @name pvc.data._removeColChild
 * 
 * @param {object} parent The parent.
 * @param {string} childrenProp A parent's children array property.
 * @param {object} child The child to remove.
 * @param {string} parentProp The child's parent property to reset.
 * 
 * @static
 * @private
 */
function data_removeColChild(parent, childrenProp, child, parentProp) {
    // <Debug>
    /*jshint expr:true */
    (child && (!child[parentProp] || child[parentProp] === parent)) || def.assert("Not a child");
    // </Debug>
    
    var children = parent[childrenProp];
    if(children) {
        var index = children.indexOf(child);
        if(index >= 0){
            def.array.removeAt(children, index);
        }
    }
    
    child[parentProp] = null;
}
/**
 * Initializes a dimension type
 * 
 * @name pvc.data.DimensionType
 * 
 * @class A dimension type describes a dimension of a complex type.
 * <p>
 * Most of the held information is of 
 * intrinsic characteristics of the dimensions values.
 * Yet, it also holds information 
 * related to a specific data translation usage.
 * </p>
 *
 * @property {pvc.data.ComplexType} complexType
 * The complex type that this dimension type belongs to.
 * 
 * @property {string} name
 * The name of this dimension type.
 * The name of a dimension type is unique on its complex type.
 * 
 * @property {string} label
 * The label of this dimension type.
 * The label <i>should</i> be unique on its complex type.
 * 
 * @property {string} group The group that the dimension type belongs to.
 * <p>
 * The group name is taken to be the name of the dimension
 * without any suffix numbers. 
 * So, if the name of a dimension type is 'series2',
 * then its default group is 'series'.
 * </p>
 *
 * @property {number} groupLevel The index within the group that the dimension type belongs to.
 *
 * @property {Function} valueType
 * The type of the value of atoms belonging to dimensions of this type.
 * It is a function that casts values to the represented type.
 * 
 * The values null and undefined are never converted by this function.
 * 
 * The function must be idempotent.
 *
 * @property {string} valueTypeName A description of the value type.
 * 
 * @property {boolean} isDiscrete
 * Indicates if the values of this dimension are discrete,
 * as opposed to continuous.
 *
 * @property {boolean} isComparable
 * Indicates if the values of this dimension can be compared.
 * 
 * @property {boolean} isHidden Indicates if the dimension is
 * hidden from the user, in places like a tooltip, for example, or in the legend.
 * 
 * @property {def.Map} playedVisualRoles
 * A map of {@link pvc.visual.Role} indexed by visual role name, of the visual roles currently being played by this dimension type.
 * 
 * @constructor
 *
 * @param {pvc.data.ComplexType} complexType The complex type that this dimension belongs to.
 * @param {string} name The name of the dimension type.
 *
 * @param {object} [keyArgs] Keyword arguments.
 * @param {string} [keyArgs.label] The label of this dimension type.
 * Defaults to the name of the dimension type.
 * @param {function} [keyArgs.valueType=null] The type of the values of this dimension type.
 * <p>
 * The supported value types are: <i>null</i> (which really means <i>any</i>), {@link Boolean}, {@link Number}, {@link String}, {@link Date} and {@link Object}.
 * </p>
 * @param {boolean} [keyArgs.isHidden=false] Indicates if the dimension should
 * be hidden from the user, in places like a tooltip, for example, or in the legend.
 * @param {boolean} [keyArgs.isDiscrete]
 * Indicates if the dimension
 * is considered discrete.
 * The default value depends on the value of {@link valueType};
 * it is true unless the {@link valueType} is Number or Date.
 * 
 * @param {function} [keyArgs.converter] A function used in the translation phase
 * to convert raw values into values of the dimension's value type.
 * Its signature is:
 * <pre>
 * function(rawValue : any) : valueType
 * </pre>
 * 
 * @param {string} [keyArgs.rawFormat] A protovis format mask adequate to the specified value type.
 * When specified and a converter is not specified, it is used to create a converter
 * for the Date and Number value types.
 * 
 * @param {function} [keyArgs.key] A function used in the translation phase
 * to obtain the string key of each value.
 * Its signature is:
 * <pre>
 * function(value : valueType) : string
 * </pre>
 * <p>
 * Nully values have a fixed key of '', 
 * so to the function never receives a "nully" value argument.
 * A consequence is that no other values can have an empty key.
 * </p>
 * <p>
 * The default key is obtained by calling the value's {@link Object#toString} method.
 * </p>
 * 
 * @param {function} [keyArgs.formatter] A function used in the translation phase
 * to format the values of this dimension type.
 * Its signature is:
 * <pre>
 * function(value : valueType, rawValue : any) : string
 * </pre>
 * <p>
 * Only a "nully" value <i>should</i> have an empty label.
 * </p>
 * <p>
 * The label is not necessarily unique.
 * </p>
 * <p>
 * The default format is the empty string for null values, 
 * or the result of calling the <i>value</i>'s {@link Object#toString} method.
 * </p>
 * 
 * @param {string} [keyArgs.format] A protovis format mask adequate to the specified value type.
 * When specified and a formatter is not specified, it is used to create a formatter
 * for the Date and Number value types.
 *
 * @param {function} [keyArgs.comparer]
 * Specifies a comparator function for the values of this dimension type.
 * Its signature is:
 * <pre>
 * function(valueA : valueType, valueB : valueType) : number
 * </pre>
 * 
 * The default value depends on the value of {@link valueType};
 * it is {@link def.compare} when the {@link valueType} is Date,
 * and null otherwise.
 */

/**
 * Cache of reverse order context-free value comparer function.
 * 
 * @name pvc.data.DimensionType#_reverseComparer
 * @field
 * @type function
 * @private
 */

/**
 * Cache of reverse order context-free atom comparer function.
 * 
 * @name pvc.data.DimensionType#_reverseAtomComparer
 * @field
 * @type function
 * @private
 */

/**
 * Cache of normal order context-free value comparer function.
 * 
 * @name pvc.data.DimensionType#_directComparer
 * @field
 * @type function
 * @private
 */

/**
 * Cache of normal order context-free atom comparer function.
 * 
 * @name pvc.data.DimensionType#_directAtomComparer
 * @field
 * @type function
 * @private
 */
def.type('pvc.data.DimensionType')
.init(
function(complexType, name, keyArgs){
    this.complexType = complexType;
    this.name  = name;
    this.label = def.get(keyArgs, 'label') || def.firstUpperCase(name);

    var groupAndLevel = pvc.data.DimensionType.splitDimensionGroupName(name);
    this.group = groupAndLevel[0];
    this.groupLevel = def.nullyTo(groupAndLevel[1], 0);

    if(this.label.indexOf('{') >= 0){
        this.label = def.format(this.label, [this.groupLevel+1]);
    }

    this.playedVisualRoles = new def.Map();
    this.isHidden = !!def.get(keyArgs, 'isHidden');
    
    var valueType = def.get(keyArgs, 'valueType') || null;
    var valueTypeName = pvc.data.DimensionType.valueTypeName(valueType);
    var cast = def.getOwn(pvc.data.DimensionType.cast, valueTypeName, null);
    
    this.valueType = valueType;
    this.valueTypeName = valueTypeName;
    this.cast = cast;
    
    this.isDiscrete = def.get(keyArgs, 'isDiscrete');
    if(this.isDiscrete == null){
        this.isDiscrete = (this.valueType !== Number && 
                           this.valueType !== Date);
    } else {
        // Normalize the value
        this.isDiscrete = !!this.isDiscrete;
        if(!this.isDiscrete && (this.valueType !== Number && this.valueType !== Date)) {
            throw def.error.argumentInvalid('isDiscrete', "The only supported continuous value types are Number and Date.");
        }
    }
    
    /** 
     * @private
     * @internal
     * @see pvc.data.Dimension#convert
     */
    this._converter = def.get(keyArgs, 'converter') || null;
    if(!this._converter) {
        var rawFormat = def.get(keyArgs, 'rawFormat');
        if(rawFormat) {
            switch(this.valueType) {
                case Number:
                    // TODO: receive extra format configuration arguments
                    this._converter = pv.Format.createParser(pv.Format.number().fractionDigits(0, 2));
                    break;
                    
                case Date:
                    this._converter = pv.Format.createParser(pv.Format.date(rawFormat));
                    break;
            }
        }
    }
    
    /** 
     * @private
     * @internal
     * @see pvc.data.Dimension#key
     */
    this._key = def.get(keyArgs, 'key') || null;
    
    /** @private */
    this._comparer = def.get(keyArgs, 'comparer');
    if(this._comparer === undefined){
        switch(this.valueType){
            case Number:
                if(!this.isDiscrete) {
                    this._comparer = def.compare;    
                }
                break;
                
            case Date:
                this._comparer = def.compare;
                break;
                
             default:
                 this._comparer = null;
        }
    }

    this.isComparable = this._comparer != null;
    
    /** 
     * @private
     * @internal
     * @see pvc.data.Dimension#format
     */
    this._formatter = def.get(keyArgs, 'formatter') || null;
    if(!this._formatter) {
        switch(this.valueType) {
            case Number:
                // TODO: receive extra format configuration arguments
                this._formatter = pv.Format.createFormatter(pv.Format.number().fractionDigits(0, 2));
                break;
                
            case Date:
                var format = def.get(keyArgs, 'format') || "%Y/%m/%d";
                this._formatter = pv.Format.createFormatter(pv.Format.date(format));
                break;
        }
    }
})
.add(/** @lends pvc.data.DimensionType# */{
    
    /**
     * Compares two values of the dimension's {@link #valueType}, in ascending order.
     * <p>
     * To compare two values in descending order multiply the result by -1.
     * </p>
     * <p>
     * Values can be nully.
     * </p>
     * @param {any} a A value of the dimension's {@link #valueType}.
     * @param {any} b A value of the dimension's {@link #valueType}.
     *  
     * @returns {Number}
     * A negative number if {@link a} is before {@link b},
     * a positive number if {@link a} is after {@link b},
     * and 0 if they are considered to have the same order.
     */
    compare: function(a, b){
        if(a == null) {
            if(b == null) {
                return 0;
            }
            return -1;
        } else if(b == null) {
            return 1;
        }
        
        return this._comparer.call(null, a, b);
    },
    
    /**
     * Gets a context-free comparer function 
     * for values of the dimension's {@link #valueType}
     * and for a specified order.
     * 
     * <p>When the dimension type is not comparable, <tt>null</tt> is returned.</p>
     * 
     * @param {boolean} [reverse=false] Indicates if the comparison order should be reversed.
     * 
     * @type function
     */
    comparer: function(reverse){
        if(!this.isComparable) {
            return null;
        }
        
        var me = this;
        if(reverse){
            return this._reverseComparer || 
                   (this._reverseComparer = function(a, b){ return me.compare(b, a); }); 
        }
        
        return this._directComparer || (this._directComparer = function(a, b){ return me.compare(a, b); }); 
    },
    
    /**
     * Gets a context-free atom comparer function, 
     * for a specified order.
     * 
     * @param {boolean} [reverse=false] Indicates if the comparison order should be reversed.
     * 
     * @type function
     */
    atomComparer: function(reverse){
        if(reverse){
            return this._reverseAtomComparer || 
                   (this._reverseAtomComparer = this._createReverseAtomComparer()); 
        }
        
        return this._directAtomComparer ||
                (this._directAtomComparer = this._createDirectAtomComparer());
    },
    
    _createReverseAtomComparer: function(){
        if(!this.isComparable){
            /*global atom_idComparerReverse:true */
            return atom_idComparerReverse;
        }
        
        var me = this;
        
        function reverseAtomComparer(a, b){
            if(a === b) { return 0; } // Same atom
            return me.compare(b.value, a.value); 
        }
        
        return reverseAtomComparer;
    },
    
    _createDirectAtomComparer: function(){
        if(!this.isComparable){
            /*global atom_idComparer:true */
            return atom_idComparer;
        }
        
        var me = this;
        
        function directAtomComparer(a, b){
            if(a === b) { return 0; } // Same atom
            return me.compare(a.value, b.value);
        }
        
        return directAtomComparer;
    },
    
    /**
     * Gets the dimension type's context-free formatter function, if one is defined, or <tt>null</tt> otherwise.
     * @type function
     */
    formatter: function(){
        return this._formatter;
    },
    
    /**
     * Gets the dimension type's context-free converter function, if one is defined, or <tt>null</tt> otherwise.
     * @type function
     */
    converter: function(){
        return this._converter;
    },
    
    /**
     * Obtains a value indicating if this dimension type plays any visual role 
     * such that {@link pvc.visual.Role#isPercent} is <tt>true</tt>.
     * @type boolean
     */
    playingPercentVisualRole: function(){
        return def.query(this.playedVisualRoles.values())
                  .any(function(visualRole){ 
                      return visualRole.isPercent; 
                  }); 
    }
});

pvc.data.DimensionType.cast = {
    'Date': function(value) {
        return value instanceof Date ? value : new Date(value);
    },

    'Number': function(value) {
        value = Number(value);
        return isNaN(value) ? null : value;
    },

    'String':  String,
    'Boolean': Boolean,
    'Object':  Object,
    'Any':     null
};

/**
 * Obtains the default group name for a given dimension name.
 * 
 * @param {string} dimName The dimension name.
 * 
 *  @type string
 */
pvc.data.DimensionType.dimensionGroupName = function(dimName){
    return dimName.replace(/^(.*?)(\d*)$/, "$1");
};

/**
 * Splits a dimension name to its default group name and a group index.
 * 
 * @param {string} dimName The dimension name.
 * 
 * @type Array
 */
pvc.data.DimensionType.splitDimensionGroupName = function(dimName){
    var match = /^(.*?)(\d*)$/.exec(dimName);
    var index = null;
    
    if(match[2]) {
        index = Number(match[2]);
        if(index <= 1) {
            index = 1;
        } else {
            index--;
        }
    }
    
    return [match[1], index];
};

// TODO: Docs
pvc.data.DimensionType.valueTypeName = function(valueType){
    if(valueType == null){
        return "Any";
    }
    
    switch(valueType){
        case Boolean: return 'Boolean';
        case Number:  return 'Number';
        case String:  return 'String';
        case Object:  return 'Object';
        case Date:    return 'Date';
        default: throw def.error.argumentInvalid('valueType', "Invalid valueType function: '{0}'.", [valueType]);
    }
};

/**
 * Computes the name of the nth level dimension 
 * of a dimension group (protected).
 * <p>
 * Generated dimension names follow the naming pattern:
 * 'value', 'value2', 'value3', 'value4', etc.,
 * where the dimension group name is 'value'.
 * </p>
 * 
 * @param {string} dimGroupName The name of the dimension group.
 * @param {number} level The 0-based level of the dimension.
 * 
 * @type string
 */
pvc.data.DimensionType.dimensionGroupLevelName = function(baseDimName, level){
    return baseDimName + (level >= 1 ? (level + 1) : '');
};

/**
 * Extends a dimension type specification with defaults based on
 * group name and specified options.
 *  
 * @param {object} [keyArgs] Keyword arguments.
 * @param {function} [keyArgs.isCategoryTimeSeries=false] Indicates if category dimensions are to be considered time series.
 * @param {string} [keyArgs.timeSeriesFormat] The parsing format to use to parse a Date dimension when the converter and rawFormat options are not specified.
 * @param {function} [keyArgs.valueNumberFormatter] The formatter to use to parse a numeric dimension of the 'value' dimension group, when the formatter and format options are not specified.
 * @param {object} [keyArgs.dimensionGroups] A map of dimension group names to dimension type specifications to be used as prototypes of corresponding dimensions.
 * 
 *  @returns {object} The extended dimension type specification.
 */
pvc.data.DimensionType.extendSpec = function(dimName, dimSpec, keyArgs){
    
    var dimGroup = pvc.data.DimensionType.dimensionGroupName(dimName),
        userDimGroupsSpec = def.get(keyArgs, 'dimensionGroups');
    
    if(userDimGroupsSpec) {
        var groupDimSpec = userDimGroupsSpec[dimGroup];
        if(groupDimSpec) {
            dimSpec = def.create(groupDimSpec, dimSpec /* Can be null */); 
        }
    }
    
    if(!dimSpec) { 
        dimSpec = {};
    }
    
    switch(dimGroup) {
        case 'category':
            var isCategoryTimeSeries = def.get(keyArgs, 'isCategoryTimeSeries', false);
            if(isCategoryTimeSeries) {
                if(dimSpec.valueType === undefined) {
                    dimSpec.valueType = Date; 
                }
            }
            break;
        
        case 'value':
            if(dimSpec.valueType === undefined) {
                dimSpec.valueType = Number;
            }

            if(dimSpec.valueType === Number) {
                if(dimSpec.formatter === undefined && 
                   !dimSpec.format){
                    dimSpec.formatter = def.get(keyArgs, 'valueNumberFormatter');
                }
            }
            break;

        default:
            if(dimName === 'dataPart'){
                if(dimSpec.isDiscrete === undefined){
                    dimSpec.isDiscrete = true;
                }
                if(dimSpec.isHidden === undefined){
                    dimSpec.isHidden = true;
                }
                if(dimSpec.comparer === undefined){
                    dimSpec.comparer = def.compare;
                }
            }
            break;
    }
    
    if(dimSpec.converter === undefined && 
       dimSpec.valueType === Date && 
       !dimSpec.rawFormat) {
        dimSpec.rawFormat = def.get(keyArgs, 'timeSeriesFormat');
    }
    
    return dimSpec;
};

/**
 * Adds a visual role to the dimension type.
 * 
 * @name pvc.data.DimensionType#_addVisualRole
 * @function
 * @param {pvc.visual.Role} visualRole The visual role.
 * @type undefined
 * @private
 * @internal
 */
function dimType_addVisualRole(visualRole) {
    this.playedVisualRoles.set(visualRole.name, visualRole);
    /*global compType_dimensionRolesChanged:true */
    compType_dimensionRolesChanged.call(this.type, this);
}

/**
 * Removes a visual role from the dimension type.
 * 
 * @name pvc.data.DimensionType#_removeVisualRole
 * @function
 * @param {pvc.visual.Role} visualRole The visual role.
 * @type undefined
 * @private
 * @internal
 */
function dimType_removeVisualRole(visualRole) {
    this.playedVisualRoles.rem(visualRole.name);
    compType_dimensionRolesChanged.call(this.type, this);
}/**
 * Initializes a complex type instance.
 * 
 * @name pvc.data.ComplexType
 * 
 * @class A complex type is, essentially, a named set of dimension types.
 *
 * @constructor
 * 
 * @param {object} [dimTypeSpecs]
 * A map of dimension names to dimension type constructor's keyword arguments.
 *
 * @see pvc.data.DimensionType
 */
def.type('pvc.data.ComplexType')
.init(
function(dimTypeSpecs){
    /**
     * A map of the dimension types by name.
     * 
     * @type object
     * @private
     */
    this._dims = {};
    
    /**
     * A list of the dimension types.
     * 
     * @type pvc.data.DimensionType[]
     * @private
     */
    this._dimsList = [];
    
    /**
     * A list of the dimension type names.
     * 
     * @type string[]
     * @private
     */
    this._dimsNames = [];
    
    /**
     * An index of the dimension types by group name.
     * 
     * @type object
     * @private
     */
    this._dimsByGroup = {};
    
    /**
     * An index of the dimension type names by group name.
     * 
     * @type object
     * @private
     */
    this._dimsNamesByGroup = {};
    
    if(dimTypeSpecs) {
        for(var name in dimTypeSpecs){
            this.addDimension(name, dimTypeSpecs[name]);
        }
    }
})
.add(/** @lends pvc.data.ComplexType# */{
    describe: function(){

        var out = ["\n------------------------------------------"];
        out.push("Complex Type Information");
        
        this._dimsList.forEach(function(type){
            var features = [];
            
            features.push(type.valueTypeName);
            if(type.isComparable) { features.push("comparable"); }
            if(!type.isDiscrete)  { features.push("continuous"); }
            if(type.isHidden)     { features.push("hidden"); }

            out.push("  " + type.name + " (" + features.join(', ') + ")");
        });
        
        out.push("------------------------------------------");

        return out.join("\n");
    },
    
    /**
     * Obtains a dimension type given its name.
     * 
     * <p>
     * If no name is specified,
     * a map with all dimension types indexed by name is returned.
     * Do <b>NOT</b> modify this map.
     * </p>
     * 
     * @param {string} [name] The dimension type name.
     * 
     * @param {object} [keyArgs] Keyword arguments
     * @param {boolean} [keyArgs.assertExists=true] Indicates that an error is signaled 
     * if a dimension type with the specified name does not exist.
     * 
     * @type pvc.data.DimensionType | pvc.data.DimensionType[] | null
     */
    dimensions: function(name, keyArgs){
        if(name == null) {
            return this._dims;
        }
        
        var dimType = def.getOwn(this._dims, name, null);
        if(!dimType && def.get(keyArgs, 'assertExists', true)) {
            throw def.error.argumentInvalid('name', "Undefined dimension '{0}'", [name]); 
        }
        
        return dimType;
    },
    
    /**
     * Obtains an array with all the dimension types.
     * 
     * <p>
     * Do <b>NOT</b> modify the returned array. 
     * </p>
     * @type pvc.data.DimensionType[]
     */
    dimensionsList: function(){
        return this._dimsList;
    },
    
    /**
     * Obtains an array with all the dimension type names.
     * 
     * <p>
     * Do <b>NOT</b> modify the returned array. 
     * </p>
     * @type string[]
     */
    dimensionsNames: function(){
        return this._dimsNames;
    },
    
    /**
     * Obtains an array of the dimension types of a given group.
     * 
     * <p>
     * Do <b>NOT</b> modify the returned array. 
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * @param {boolean} [keyArgs.assertExists=true] Indicates if an error is signaled when the specified group name is undefined.
     * 
     * @type pvc.data.DimensionType[]
     */
    groupDimensions: function(group, keyArgs){
        var dims = def.getOwn(this._dimsByGroup, group);
        if(!dims && def.get(keyArgs, 'assertExists', true)) {
            throw def.error.operationInvalid("There is no dimension type group with name '{0}'.", [group]);
        }
        
        return dims;
    },
    
    /**
     * Obtains an array of the dimension type names of a given group.
     * 
     * <p>
     * Do <b>NOT</b> modify the returned array. 
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * @param {boolean} [keyArgs.assertExists=true] Indicates if an error is signaled when the specified group name is undefined.
     *  
     * @type string[]
     */
    groupDimensionsNames: function(group, keyArgs){
        var dimNames = def.getOwn(this._dimsNamesByGroup, group);
        if(!dimNames && def.get(keyArgs, 'assertExists', true)) {
            throw def.error.operationInvalid("There is no dimension type group with name '{0}'.", [group]);
        }
        
        return dimNames;
    },
    
    /**
     * Creates and adds to the complex type a new dimension type, 
     * given its name and specification.
     * 
     * @param {string} name The name of the dimension type.
     * @param {object} [dimTypeSpec] The dimension type specification.
     * Essentially its a <i>keyArgs</i> object.
     * See {@link pvc.data.DimensionType}'s <i>keyArgs</i> constructor
     * to know about available arguments.
     *  
     * @type {pvc.data.DimensionType}
     */
    addDimension: function(name, dimTypeSpec){
        // <Debug>
        /*jshint expr:true */
        name || def.fail.argumentRequired('name');
        !def.hasOwn(this._dims, name) || def.fail.operationInvalid("A dimension type with name '{0}' is already defined.", [name]);
        // </Debug>
        
        var dimension = new pvc.data.DimensionType(this, name, dimTypeSpec);
        this._dims[name] = dimension;
        this._dimsList.push(dimension);
        this._dimsNames.push(name);
        
        // group
        
        var group = dimension.group;
        if(group) {
            var groupDims = def.getOwn(this._dimsByGroup, group),
                groupDimsNames;
            
            if(!groupDims) {
                groupDims = this._dimsByGroup[group] = [];
                groupDimsNames = this._dimsNamesByGroup[group] = [];
            } else {
                groupDimsNames = this._dimsNamesByGroup[group];
            }
            
            var level = def.array.insert(groupDimsNames, name, def.compare);
            def.array.insertAt(groupDims, ~level, dimension);
        }
        
        this._isPctRoleDimTypeMap = null;
        
        return dimension;
    },
    
    /**
     * Obtains a map of the dimension types, indexed by their name,
     * that are playing a role such that {@link pvc.visual.Role#isPercent} is <tt>true</tt>.
     * 
     * @type def.Map
     */
    getPlayingPercentVisualRoleDimensionMap: function(){
        var map = this._isPctRoleDimTypeMap;
        if(!map) {
            map = this._isPctRoleDimTypeMap = new def.Map(
                        def.query(def.own(this._dims))
                            .where(function(dimType){ return dimType.playingPercentVisualRole(); })
                            .object({
                                name:  function(dimType){ return dimType.name; } 
                            })
                    );
        }
        
        return map;
    }
});

/**
 * Called by a dimension type to indicate that its assigned roles have changed.
 * 
 * @name pvc.data.ComplexType#_dimensionRolesChanged
 * @function
 * @param {pvc.data.DimensionType} dimType The affected dimension type.
 * @type undefined
 * @private
 * @internal
 */
function compType_dimensionRolesChanged(dimType) {
    this._isPctRoleDimTypeMap = null;
}
/**
 * Initializes a translation operation.
 * 
 * @name pvc.data.TranslationOper
 * @class Represents one translation operation 
 * from some data source format to the list of atoms format.
 * 
 * @property {pvc.data.ComplexType} complexType The complex type that represents the translated data.
 * @property {pvc.data.Data} data The data object which will be loaded with the translation result.
 * @property {object} source The source object, of some format, being translated.
 * @property {object} metadata A metadata object describing the source.
 * @property {object} options  An object with translation options.
 * 
 * @constructor
 * @param {pvc.data.ComplexType} complexType The complex type that will represent the translated data.
 * @param {object} source The source object, of some format, to be translated.
 * The source is not modified.
 * @param {object} [metadata] A metadata object describing the source.
 * @param {object} [options] An object with translation options.
 * Options are translator specific.
 * TODO: missing common options here
 */
def.type('pvc.data.TranslationOper')
.init(function(complexType, source, metadata, options){
    this.complexType = complexType;
    this.source   = source;
    this.metadata = metadata || {};
    this.options  = options  || {};
    
    if(pvc.debug >= 3){
        this._logSource();
    }

    this._initType();
})
.add(/** @lends pvc.data.TranslationOper# */{
    
    /**
     * Logs the contents of the source and metadata properties.
     */
    _logSource: def.method({isAbstract: true}),

    /**
     * Obtains the number of fields of the virtual item.
     * <p>
     * The default implementation returns the length of the metadata.
     * </p>
     * 
     * @type number
     * @virtual
     */
    virtualItemSize: function(){
        return this.metadata.length;
    },

    freeVirtualItemSize: function(){
        return this.virtualItemSize() - this._userUsedIndexesCount;
    },

    /**
     * Defines a dimension reader.
     *
     * @param {object} dimReaderSpec A dimensions reader specification.
     *
     * @type undefined
     */
    defReader: function(dimReaderSpec){
        /*jshint expr:true */
        dimReaderSpec || def.fail.argumentRequired('readerSpec');

        var dimNames =  dimReaderSpec.names;
        if(typeof dimNames === 'string'){
            dimNames = dimNames.split(/\s*\,\s*/);
        } else {
            dimNames =  def.array.as(dimNames);
        }
        
        var hasDims = !!(dimNames && dimNames.length);
        
        if(hasDims){
            dimNames.forEach(function(name){
                name || def.fail.argumentRequired('readers[i].names');
    
                name = name.replace(/^\s*(.+?)\s*$/, "$1"); // trim
    
                !def.hasOwn(this._userUsedDims, name) || def.fail.argumentInvalid('readers[i].names', "Dimension name '{0}' is already being read.", [name]);
                this._userUsedDims[name] = true;
                this.ensureDimensionType(name);
            }, this);
        }
        
        // Consumed/Reserved virtual item indexes
        var indexes = def.array.as(dimReaderSpec.indexes);
        if(indexes) {
            indexes.forEach(this._userUseIndex, this);
        }

        var reader = dimReaderSpec.reader;
        if(!reader) {
            if(hasDims){
                this._userCreateReaders(dimNames, indexes);
            } // else a reader that only serves to exlude indexes
        } else {
            hasDims || def.fail.argumentRequired('reader.names', "Required argument when a reader function is specified.");
            
            this._userRead(this._wrapReader(reader, dimNames), dimNames);
        }
    },

    /**
     * Called once, before {@link #execute},
     * for the translation to configure the complex type (abstract).
     *
     * <p>
     *    If this method is called more than once,
     *    the consequences are undefined.
     * </p>
     *
     * @name pvc.data.TranslationOper#configureType
     * @function
     * @type undefined
     * @virtual
     */
    configureType: def.method({isAbstract: true}),
    
    _initType: function(){
        this._userDimsReaders = [];
        this._userDimsReadersByDim = {};
        this._userItem = [];
        this._userDefDims = {};
        this._userUsedDims = {};
        this._userUsedIndexes = {};
        this._userUsedIndexesCount = 0;
        
        // -------------
        
        var userDimsSpec = this.options.dimensions;
        for(var dimName in userDimsSpec) { // userDimsSpec can be null
            this._userDefDimension(dimName, userDimsSpec[dimName]);
        }
        
        // -------------
        
        var userDimReaders = this.options.readers;
        if(userDimReaders) {
            userDimReaders.forEach(this.defReader, this);
        }

        var multiChartIndexes = this.options.multiChartIndexes;
        if(multiChartIndexes != null) {
            this.defReader({names: 'multiChart', indexes: multiChartIndexes });
        }
    },

    _userDefDimension: function(name, userDimSpec){
        /*jshint expr:true */
        name || def.fail.argumentInvalid('dimensions[i]', "Invalid dimension name.");
        !def.hasOwn(this._userDefDims, name) ||
            def.fail.argumentInvalid('dimensions[i]', "A dimension with name '{0}' is already defined.", [name]);

        this._userDefDims[name] = true;
        this.ensureDimensionType(name, userDimSpec);
    },

    _userUseIndex: function(index){
        index = +index; // to number

        /*jshint expr:true */
        (index >= 0) || def.fail.argumentInvalid('index', "Invalid reader index: '{0}'.", [index]);

        !def.hasOwn(this._userUsedIndexes, index) ||
            def.fail.argumentInvalid('index', "Virtual item index '{0}' is already assigned.", [index]);

        this._userUsedIndexes[index] = true;
        this._userUsedIndexesCount++;
        this._userItem[index] = true;
    },

    _userCreateReaders: function(dimNames, indexes){
        if(!indexes){
            indexes = [];
        }

        // Distribute indexes to names, from left to right
        // Excess indexes go to the last *group* name
        // Missing indexes are padded from available indexes starting from the last provided index
        var I = indexes.length,
            N = dimNames.length,
            dimName;

        if(N > I) {
            // Pad indexes
            var nextIndex = I > 0 ? (indexes[I - 1] + 1) : 0;
            do{
                nextIndex = this._nextAvailableItemIndex(nextIndex);
                indexes[I] = nextIndex;
                this._userUseIndex(nextIndex);

                I++;
            }while(N > I);
        }

        // If they match, it's one-one name <-- index
        var L = (I === N) ? N : (N - 1);

        // The first N-1 names get the first N-1 indexes
        for(var n = 0 ; n < L ; n++) {
            dimName = dimNames[n];
            this._userRead(this._propGet(dimName, indexes[n]), dimName);
        }

        // The last name is the dimension group name that gets all remaining indexes
        if(L < N) {
            // TODO: make a single reader that reads all atoms??
            // Last is a *group* START name
            var splitGroupName = pvc.data.DimensionType.splitDimensionGroupName(dimNames[N - 1]),
                groupName = splitGroupName[0],
                level     = def.nullyTo(splitGroupName[1], 0);

            for(var i = L ; i < I ; i++, level++) {
                dimName = pvc.data.DimensionType.dimensionGroupLevelName(groupName, level);
                if(i > L){ // first name was already registered
                    /*jshint expr:true */
                    !def.hasOwn(this._userUsedDims, dimName) ||
                        def.fail.argumentInvalid('readers[i].names', "Dimension name '{0}' of last dimension group name is already being read.", [dimName]);
                    
                    this._userUsedDims[dimName] = true;
                    // propGet ensures dim exists
                }

                this._userRead(this._propGet(dimName, indexes[i]), dimName);
            }
        }
    },

    _userRead: function(reader, dimNames){
        /*jshint expr:true */
        def.fun.is(reader) || def.fail.argumentInvalid('reader', "Reader must be a function.");
        
        if(def.array.is(dimNames)){
            dimNames.forEach(function(name){
                this._userDimsReadersByDim[name] = reader;
            }, this);
        } else {
            this._userDimsReadersByDim[dimNames] = reader;
        }

        this._userDimsReaders.push(reader);
    },

    //  TODO: docs
    _wrapReader: function(reader, dimNames){
        var me = this,
            dimensions,
            data;
        
        function createDimensions() {
            data = me.data;
            dimensions = dimNames.map(function(dimName){ return data.dimensions(dimName); });
            dimensions.unshift(null); // item argument
            return dimensions;
        }
        
        function read(item) {
            (dimensions || createDimensions())[0] = item;
            
            return reader.apply(data, dimensions);
        }
        
        return read;
    },
    
    /**
     * Builds a dimensions reader that 
     * filters the atoms returned by a given dimensions reader
     * and returns the first one that is of a specified dimension.
     * 
     * <p>
     * If the given reader returns no atoms of the desired dimension,
     * then the built reader returns <tt>undefined</tt>.
     * </p>
     * 
     * @param {function} reader A dimensions reader to filter.
     * @param {function} dimName The name of the filtered dimension.
     * 
     * @type function
     */
    _filterDimensionReader: function(reader, dimName){
        
        function extractDimensionReader(item) {
            var atoms = reader(item);
            if(atoms instanceof Array) {
                return def.query(atoms)
                    .first(function(atom){ 
                        return atom.dimension.name === dimName; 
                    });
            }
            
            if(atoms.dimension.name === dimName) {
                return atoms;
            }
            
            //return undefined;
        }
        
        return extractDimensionReader;
    },
    
    /**
     * Performs the translation operation for a data instance.
     * 
     * <p>
     *    The returned atoms are interned in 
     *    the dimensions of the specified data instance.
     * </p>
     * 
     * <p>
     *    If this method is called more than once,
     *    the consequences are undefined.
     * </p>
     * 
     * @param {pvc.data.Data} data The data object in whose dimensions returned atoms are interned.
     * 
     * @returns {def.Query} An enumerable of {@link pvc.data.Atom[]}
     */
    execute: function(data){
        this.data = data;
        
        return this._executeCore();
    },
    
    /**
     * Obtains an enumerable of translated atoms (virtual).
     * 
     * <p>
     *    The default implementation applies 
     *    every dimensions reader returned by {@link #_getDimensionsReaders} 
     *    to every item returned by  {@link #_getItems}.
     *   
     *    Depending on the underlying data source format 
     *    this may or may not be a good translation strategy.
     *    Override to apply a different one.
     * </p>
     * 
     * @returns {def.Query} An enumerable of {@link pvc.data.Atom[]}
     * @virtual
     */
    _executeCore: function(){
        var dimsReaders = this._getDimensionsReaders();
        
        return def.query(this._getItems())
                  .select(function(item){
                      return this._readItem(null, item, dimsReaders);
                  }, this);
    },
    
    /**
     * Obtains an enumerable of items to translate (virtual).
     * 
     * <p>
     * The default implementation assumes that {@link #source}
     * is directly the desired enumerable of items. 
     * </p>
     * 
     * @type def.Query
     */
    _getItems: function(){
        return this.source;
    },
    
    /**
     * Obtains the dimensions readers array (virtual).
     * 
     * <p>
     * Each dimensions reader function reads one or more dimensions
     * from a source item.
     * It has the following signature:
     * </p>
     * <pre>
     * function(item : any) : pvc.data.Atom[] | pvc.data.Atom
     * </pre>
     * 
     * <p>
     * The default implementation simply returns the {@link #_userDimsReaders} field. 
     * </p>
     * 
     * @name _getDimensionsReaders
     * @type function[]
     * @virtual
     */
    _getDimensionsReaders: function(){
        return this._userDimsReaders;
    },
    
    /**
     * Applies all the specified dimensions reader functions to an item 
     * and sets the resulting atoms in a specified array (virtual).
     * 
     * @param {Array} [atoms] An array where to add resulting atoms.
     * @param {any} item The item to read.
     * @param {function[]} dimsReaders An array of dimensions reader functions.
     * @returns {pvc.data.Atom[]} The specified atoms array or a new one if one was not specified.
     * @virtual
     */
    _readItem: function(atoms, item, dimsReaders) {
        atoms = atoms || [];
        
        // This function is performance critical and so does not use forEach
        // or array helpers, avoiding function calls, closures, etc.
        
        if(pvc.debug >= 4) {
            pvc.log('virtual item: ' + JSON.stringify(item));
        }
        
        var r = 0, 
            R = dimsReaders.length, 
            a = 0,
            data = this.data;
        
        while(r < R) {
            
            var result = dimsReaders[r++].call(data, item);
            if(result != null){
                if(result instanceof Array) {
                    var j = 0, J = result.length;
                    while(j < J) {
                        if(result.value != null) { // no null atoms
                            atoms[a++] = result[j];
                        }

                        j++;
                    }

                } else if(result.value != null){
                    atoms[a++] = result;
                }
            }
        }
        
        atoms.length = a;
        
        if(pvc.debug >= 4) {
            var atomsMap = def.query(atoms).object({
                name:  function(atom){ return atom.dimension.name; },
                value: function(atom){ 
                    return { id: atom.id, v: atom.value, f: atom.label };
                }
            });
            
            pvc.log('  -> atoms: ' + JSON.stringify(atomsMap));
        }
        
        return atoms;
    },
    
    /**
     * Given a dimension name and a property name,
     * creates a dimensions reader that obtains that property from a given source item 
     * and returns the corresponding atom (protected).
     * 
     * @param {string} dimName The name of the dimension on which to intern read values.
     * @param {string} prop The property name to read from each item.
     * @param {object} [keyArgs] Keyword arguments. 
     * @param {boolean} [keyArgs.ensureDim=true] Creates a dimension with the specified name, with default options, if one does not yet exist. 
     * 
     * @type function
     */
    _propGet: function(dimName, prop, keyArgs) {
        var me = this,
            dimension;
        
        if(def.get(keyArgs, 'ensureDim', true)) {
            this.ensureDimensionType(dimName);
        }
        
        function propGet(item) {
            return (dimension || (dimension = me.data.dimensions(dimName)))
                   .intern(item[prop]);
        }
        
        return propGet;
    },
    
    /**
     * Given a dimension name and a raw value of that dimension,
     * creates a dimensions reader that returns the corresponding atom,
     * regardless of the source item supplied to it (protected).
     * 
     * @param {string} dimName The name of the dimension on which to intern <i>constRawValue</i>.
     * @param {string} constRawValue The raw value.
     * 
     * @param {object} [keyArgs] Keyword arguments. 
     * @param {boolean} [keyArgs.ensureDim=true] Creates a dimension with the specified name, with default options, if one does not yet exist.
     * 
     * @type function
     */
    _constGet: function(dimName, constRawValue, keyArgs) {
        var me = this,
            constAtom;
        
        if(def.get(keyArgs, 'ensureDim', true)) {
            this.ensureDimensionType(dimName);
        }
        
        function constGet(/* item */) {
            return constAtom || 
                   (constAtom = me.data.dimensions(dimName).intern(constRawValue));
        }

        return constGet;
    },
    
    // TODO: docs
    _nextAvailableItemIndex: function(index, L){
        if(index == null) {
            index = 0;
        }
        if(L == null){
            L = Infinity;
        }

        while(index < L && def.hasOwn(this._userItem, index)) {
            index++;
        }
        
        return index < L ? index : -1;
    },
    
    // TODO: docs
    ensureDimensionType: function(dimName, dimSpec){
        var dimType = this.complexType.dimensions(dimName, {assertExists: false});
        if(!dimType) {
            this.defDimensionType(dimName, dimSpec);
        }
    },

    defDimensionType: function(dimName, dimSpec){
        /** Passing options: isCategoryTimeSeries, timeSeriesFormat and dimensionGroups */
        dimSpec = pvc.data.DimensionType.extendSpec(dimName, dimSpec, this.options);
        return this.complexType.addDimension(dimName, dimSpec);
    }
});
/**
 * @name pvc.data.MatrixTranslationOper
 * @class Represents one translation operation, 
 * from a source matrix in some format to 
 * an enumerable of atom arrays.
 * 
 * @extends pvc.data.TranslationOper
 * @abstract
 * 
 * @constructor
 * @param {pvc.data.ComplexType} complexType The complex type that will represent the translated data.
 * @param {pvc.data.Data} data The data object which will be loaded with the translation result.
 * @param {object} source The source matrix, in some format, to be translated.
 * The source is not modified.
 * @param {object} [metadata] A metadata object describing the source.
 * @param {object} [options] An object with translation options.
 * 
 * @param {boolean} [options.seriesInRows=false]
 * Indicates that series are to be switched with categories.
 *
 * @param {Number[]} [options.secondAxisSeriesIndexes] (former secondAxisIdx)
 * Array of series indexes in {@link #source} that are second axis' series.
 * Any non-null value is converted to an array.
 * Each value of the array is also converted to a number.
 * A negative value is counted from the end
 * of the series values (-1 is the series last value, ...).
 * <p>
 * Note that the option 'seriesInRows'
 * affects what are considered to be series values.
 *
 * Having determined where series are stored,
 * the order of occurrence of a series value in {@link #source}
 * determines its index.
 * </p>
 */
def.type('pvc.data.MatrixTranslationOper', pvc.data.TranslationOper)
.add(/** @lends pvc.data.MatrixTranslationOper# */{
    
    _logSource: function(){
        pvc.log("ROWS (" + this.source.length + ")");
        if(this.source){
            def.query(this.source).take(10).each(function(row, index){
                pvc.log("row " + index + ": " + JSON.stringify(row));
            });
        }

        pvc.log("COLS (" + this.metadata.length + ")");
        if(this.metadata){
            this.metadata.forEach(function(col){
                pvc.log("column {" +
                    "index: " + col.colIndex +
                    ", name: "  + col.colName +
                    ", label: "  + col.colLabel +
                    ", type: "  + col.colType + "}"
                );
            });
        }
    },

    /**
     * Creates the set of second axis series keys
     * corresponding to the specified
     * secondAxisSeriesIndexes and seriesAtoms arrays (protected).
     *
     * Validates that the specified series indexes are valid
     * indexes of seriesAtoms array.
     *
     * @param {Array} secondAxisSeriesIndexes Array of indexes of the second axis series values.
     * @param {Array} seriesKeys Array of the data source's series atom keys.
     *
     * @returns {Object} A set of second axis series values or null if none.
     *
     * @private
     * @protected
     */
    _createSecondAxisSeriesKeySet: function(secondAxisSeriesIndexes, seriesKeys){
        var secondAxisSeriesKeySet = null,
            seriesCount = seriesKeys.length;
        def.query(secondAxisSeriesIndexes).each(function(indexText){
            // Validate
            var seriesIndex = +indexText; // + -> convert to number
            if(isNaN(seriesIndex)){
                throw def.error.argumentInvalid('secondAxisSeriesIndexes', "Element is not a number '{0}'.", [indexText]);
            }

            if(seriesIndex < 0){
                if(seriesIndex <= -seriesCount){
                    throw def.error.argumentInvalid('secondAxisSeriesIndexes', "Index is out of range '{0}'.", [seriesIndex]);
                }

                seriesIndex = seriesCount + seriesIndex;
            } else if(seriesIndex >= seriesCount){
                throw def.error.argumentInvalid('secondAxisSeriesIndexes', "Index is out of range '{0}'.", [seriesIndex]);
            }

            // Set
            if(!secondAxisSeriesKeySet){
                secondAxisSeriesKeySet = {};
            }
            
            secondAxisSeriesKeySet[seriesKeys[seriesIndex]] = true;
        });

        return secondAxisSeriesKeySet;
    },

    // TODO: docs
    _dataPartGet: function(calcAxis2SeriesKeySet, seriesReader) {

        var me = this;

        this.ensureDimensionType('dataPart');

        var dataPartDimension,
            axis2SeriesKeySet,
            part1Atom,
            part2Atom;

        function dataPartGet(item) {
            /*
             * First time initialization.
             * Done here because *data* isn't available before.
             */
            if(!dataPartDimension) {
                axis2SeriesKeySet = calcAxis2SeriesKeySet();
                dataPartDimension = me.data.dimensions('dataPart');

                if(pvc.debug >=3 && axis2SeriesKeySet){
                    pvc.log("Second axis series values: " +
                        JSON.stringify(def.keys(axis2SeriesKeySet)));
                }
            }

            var seriesAtom = seriesReader(item);
            if(def.hasOwn(axis2SeriesKeySet, seriesAtom.key)){
                return part2Atom || (part2Atom = dataPartDimension.intern("1"));
            }
            
            return part1Atom || (part1Atom = dataPartDimension.intern("0"));
        }

        return dataPartGet;
    }
});
/**
 * @name pvc.data.CrosstabTranslationOper
 * @class A translation from a matrix in crosstab format.
 * <p>
 *    The default <i>matrix-crosstab</i> format is:
 * </p>
 * <pre>
 * +----------+----------+----------+
 * | -        | S1       | S2       | ... (taken from metadataItem.colName)
 * +==========+==========+==========+
 * | C1       | 12       | 45       |
 * | C2       | 11       | 99       |
 * | C3       | null     |  3       |
 * +----------+----------+----------+
 * </pre>
 * <p>Legend:</p>
 * <ul>
 *   <li>C<sub>i</sub> &mdash; Category value <i>i</i></li>
 *   <li>S<sub>j</sub> &mdash; Series value <i>j</i></li>
 * </ul>
 * 
 * TODO: document crosstab options
 * 
 * @extends pvc.data.MatrixTranslationOper
 */
def.type('pvc.data.CrosstabTranslationOper', pvc.data.MatrixTranslationOper)
.init(function(complexType, source, metadata, options){
    
    this.base(complexType, source, metadata, options);

    this._separator = this.options.separator || '~';

    this._measureData();
})
.add(/** @lends pvc.data.CrosstabTranslationOper# */{
    /* LEGEND
     * ======
     * 
     * Matrix Algebra
     * --------------
     * 
     *      j
     *    +---+
     * i  | v |
     *    +---+
     * 
     * i - index of matrix line
     * j - index of matrix column
     * 
     * v - value at indexes i,j
     * 
     * ----
     * 
     * line  = matrix[i]
     * value = line[j]
     * 
     * 
     * Crosstab Algebra
     * ----------------
     * 
     *      CC
     *    +----+
     * RR | MM |
     *    +----+
     * 
     * RR = row     space
     * CC = column  space
     * MM = measure space
     * 
     * ----
     * As a function
     * 
     * cross-table: RR X CC -> MM
     * 
     * ----
     * Dimension of spaces (called "depth" in the code to not confuse with Dimension)
     * 
     * R  = number of row     components
     * C  = number of column  components
     * M  = number of measure components
     * 
     * ----
     * Instances / groups / members
     * 
     * <RG> = <r1, ..., rR> = R-tuple of row     values 
     * <CG> = <c1, ..., cC> = C-tuple of column  values 
     * <MG> = <m1, ..., mM> = M-tuple of measure values
     * 
     * r = index of row group component
     * c = index of column group component
     * m = index of measure component
     * 
     * ----
     * Extent of spaces
     * 
     * RG = number of (distinct) row groups
     * CG = number of (distinct) column groups
     * MG = RG * CG
     * 
     * rg = index of row group
     * cg = index of column group
     * 
     * 
     * Crosstab in a Matrix
     * --------------------
     * 
     * Expand components into own columns:
     * | <...RG...> | <=> | r1 | r2 | r3 | ... | rR |
     * 
     * All component values joined with a separator character, ~,
     * occupying only one column:
     * | <~CG~>     | <=> | "c1~c2~c3~...~cC" |
     * 
     * ----
     * 
     * Format: "Measures in columns" (uniform)
     * 
     *             0            R           R+M    R+M*(CG-1)   R+M*CG
     *             o------------+------------+ ... +------------o (j - matrix column)
     *         
     *                          0            1     CG-1         CG
     *                          o------------+ ... +------------o (cg - column group index)
     *        
     *                          +------------+ ... +------------+    <-- this._colGroups
     *                          | <~CG~>     |     | <~CG~>     | 
     *                          +------------+     +------------+
     *        
     *      0 o    +------------+------------+ ... +------------+    <-- this._lines
     *        |    | <...RG...> | <...MG...> |     | <...MG...> |
     *        |    |            | <...MG...> |     | <...MG...> |
     *      1 +    +------------+------------+     +------------+
     *                          ^
     *        .                 |
     *        .               m = cg % M
     *        .
     *        
     *        |
     *     RG o
     *       (i - matrix line)
     *       (rg - row group)
     *       
     * i = rg
     * j = R + M*cg
     *
     * Unfortunately, not all measures have to be specified in all column groups.
     * When a measure in column group would have all rows with a null value, it can be omitted.
     * 
     * Virtual Item Structure
     * ----------------------
     * A relational view of the cross groups
     *  
     *    [<...CG...>, <...RG...>, <...MG...>]
     * 
     * This order is chosen to match that of the relational translation.
     *
     * Virtual Item to Dimensions mapping
     * ----------------------------------
     * 
     * A mapping from a virtual item to a list of atoms (of distinct dimensions)
     * 
     * virtual-item --> atom[]
     * 
     * A set of dimensions readers are called and 
     * each returns one or more atoms of distinct dimensions.
     * 
     *  * Each dimension has exactly one dimensions reader that reads its atoms.
     *  * One dimensions reader may read more than one dimension.
     *  * A dimensions reader always reads the same set of dimensions.
     *  
     *  * A dimension consumes data from zero or more virtual item components.
     *  * A virtual item component is consumed by zero or more dimensions.
     *  * A dimension may vary in which virtual item components it consumes, from atom to atom.
     *   
     *  virtual-item-component * <-> * dimension + <-> 1 dimensions reader
     */

    /**
     * Obtains the number of fields of the virtual item.
     * @type number
     * @override
     */
    virtualItemSize: function(){
        return this.R + this.C + this.M;
    },
    
    /**
     * Performs the translation operation (override).
     * @returns {def.Query} An enumerable of {@link pvc.data.Atom[]}
     * @override
     */
    _executeCore: function(){
        if(!this.metadata.length){
            return def.query(); 
        }
        
        var dimsReaders = this._getDimensionsReaders();
        
        // ----------------
        // Virtual item
        
        var item  = new Array(this.virtualItemSize()),
            itemCrossGroupIndex = this._itemCrossGroupIndex,
            me = this
            ;
        
        function updateVItemCrossGroup(crossGroupId, source) {
            // Start index of cross group in item
            var itemIndex   = itemCrossGroupIndex[crossGroupId],
                sourceIndex = 0,
                depth       = me[crossGroupId];
            
            while((depth--) > 0) {
                item[itemIndex++] = source[sourceIndex++];
            }
        }
        
        function updateVItemMeasure(line, cg) {
            // Start index of cross group in item
            var itemIndex = itemCrossGroupIndex.M,
                cgIndexes = me._colGroupsIndexes[cg],
                depth = me.M;
            
            for(var i = 0 ; i < depth ; i++){
                var lineIndex = cgIndexes[i];
                item[itemIndex++] = lineIndex != null ? line[lineIndex] : null;
            }
        }
        
        // ----------------

        function expandLine(line/*, i*/){
            updateVItemCrossGroup('R', line);
            
            return def.query(this._colGroups).select(function(colGroup, cg){
                  
                  // Update ITEM
                  updateVItemCrossGroup('C', colGroup);
                  updateVItemMeasure(line, cg);
                  
                  // Naive approach...
                  // Call all readers every time
                  // Dimensions that consume rows and/or columns may be evaluated many times.
                  // So, it's very important that pvc.data.Dimension#intern is as fast as possible
                  //  detecting already interned values.
                  return this._readItem(null, item, dimsReaders);
               }, this);
        }
        
        return def.query(this._lines)
                  .selectMany(expandLine, this);
    },
    
    _measureData: function(){
        /* Don't change source */
        var lines = pvc.cloneMatrix(this.source);

        this._lines = lines;

        /* Initialize Space and Formatting Options */

        // Space depth / number of components
        // Default values
        this.R = 1;
        this.C = 1;

        // Single measure
        this.M = 1;
        this.measuresDirection = null;

        var colNames;
        if(this.options.seriesInRows){
            colNames = this.metadata.map(function(d){ return d.colName; });

            lines.unshift(colNames);
            pv.transpose(lines); // Transposes, in-place
            colNames = lines.shift();
            colNames.forEach(function(value, i){
                colNames[i] = {v: value}; // may be null ....
            });
            
        } else if(this.options.compatVersion <= 1){
            colNames = this.metadata.map(function(d){ return {v: d.colName}; });
        } else {
            colNames = this.metadata.map(function(d){ return {v: d.colName, f: d.colLabel }; });
        }

        // --------------
        // * crosstabMode = true;
        // * isMultiValued (Some space is multi...)
        // * measuresInColumns
        // * measuresIndex, [measuresCount=1]
        // * [categoriesCount = 1]
        var categoriesCount;
        if(!this.options.isMultiValued) {
            categoriesCount = def.get(this.options, 'categoriesCount', 1);

            // TODO: >= 0 check
            this.R = categoriesCount;

            this._colGroups = colNames.slice(this.R);
            this._colGroupsIndexes = new Array(this._colGroups.length);
            
            // To Array
            this._colGroups.forEach(function(colGroup, cg){
                this._colGroups[cg] = [colGroup];
                this._colGroupsIndexes[cg] = [this.R + cg]; // all the same
            }, this);

        } else {
            var measuresInColumns = def.get(this.options, 'measuresInColumns', true);
            if(measuresInColumns || this.options.measuresIndex == null) {

                categoriesCount = def.get(this.options, 'categoriesCount', 1);

                // TODO: >= 0 check
                // TODO: Multiples consume row space?
                this.R = categoriesCount;

                // First R columns are from row space
                var encodedColGroups = colNames.slice(this.R),
                    L = encodedColGroups.length;

                // Any results in column direction...
                if(L > 0) {
                    if(measuresInColumns) {
                        this.measuresDirection = 'columns';

                        this._processEncodedColGroups(encodedColGroups);
                        // Updates:
                        // this._colGroups
                        // this._colGroupsIndexes
                        // this.M

                    } else {
                        // M = 1
                        this._colGroups = encodedColGroups;
                        this._colGroupsIndexes = [];

                        // Split encoded column groups
                        this._colGroups.forEach(function(colGroup, cg){
                            this._colGroups[cg] = this._splitEncodedColGroupCell(colGroup);
                            this._colGroupsIndexes[cg] = [this.R + cg]; // all the same
                        }, this);
                    }

                    this.C = this._colGroups[0].length; // may be 0!
                }

            } else {
                this.measuresDirection = 'rows';

                // C = 1 (could also be more if an option to make ~ on existed)
                // R = 1 (could be more...)
                // M >= 1

                // The column index at which measure values (of each series) start
                // is the number of row components
                this.R = +this.options.measuresIndex;

                var measuresCount = this.options.measuresCount;
                if (measuresCount == null) {
                    measuresCount = 1;
                }

                // TODO: >= 1 check
                this.M = measuresCount;

                // First R columns are from row space
                // Next follows a non-relevant Measure title column
                this._colGroups = colNames.slice(this.R + 1);

                // To Array of Cells
                this._colGroups.forEach(function(colGroup, cg){
                    this._colGroups[cg] = [colGroup];
                }, this);
            }

            /* secondAxisSeriesIndexes only implemented for single-series */
            if(this.C === 1 && !this._userUsedDims.dataPart) {
                // The null test is required because secondAxisSeriesIndexes can be a number, a string...
                var axis2SeriesIndexes = this.options.secondAxisSeriesIndexes;
                if(axis2SeriesIndexes != null){
                    var seriesKeys = this._colGroups.map(function(colGroup){
                        return '' + colGroup[0].v;
                    });
                    this._axis2SeriesKeySet = this._createSecondAxisSeriesKeySet(axis2SeriesIndexes, seriesKeys);
                }
            }
        }

        // ----------------
        // The index at which the first component of
        // each cross group starts in virtual item
        this._itemCrossGroupIndex = {
                'C': 0,
                'R': this.C,
                'M': this.C + this.R
            };

        // ----------------

        if(pvc.debug >= 3){
            pvc.log("Crosstab translator " + JSON.stringify({
                R: this.R,
                C: this.C,
                M: this.M
            }));
        }
    },

    _splitEncodedColGroupCell: function(colGroup){
        var values = colGroup.v,
            labels = colGroup.f;

        if(values == null){
            values = [];
            labels = undefined;
        } else {
            values = values.split(this._separator);
            labels = labels && labels.split(this._separator);
        }

        return values.map(function(value, index){
            return {
                v: value,
                f: labels && labels[index]
            };
        });
    },

    /**
     * Analyzes the array of encoded column groups.
     * <p>
     * Creates and array of column groups
     * where each element is an array of column group values.
     * </p>
     * <p>
     * In the process the number of encoded measures is determined, {@link #M}.
     * In this respect, note that not all measures need to be supplied
     * in every column group.
     * When a measure is not present, that means that the value of the measure
     * in every row is null.
     * </p>
     * <p>
     * It is assumed that the order of measures in column groups is stable.
     * So, if in one column group "measure 1" is before "measure 2",
     * then it must be also the case in every other column group.
     * This order is then used to place values in the virtual item.
     * </p>
     */
    _processEncodedColGroups: function(encodedColGroups){
        var L = encodedColGroups.length || def.assert("Must have columns"),
            colGroups = [],
            colGroup,
            /*
             * measureName -> {
             *     groupIndex: 0, // Global order of measures within a column group
             *     index: 0       // Index (i, below) of measure's first appearance
             * }
             *
             */
            measuresInfo  = {},
            measuresInfoList = []
            ;

        for(var i = 0 ; i < L ; i++){
            var colGroupCell = encodedColGroups[i],
                encColGroupValues = colGroupCell.v,
                sepIndex = colGroupCell.v.lastIndexOf(this._separator),
                meaName,
                colGroupValues;
            
            // MeasureName has precedence,
            // so we may end up with no column group value (and C = 0).
            if(sepIndex < 0){
                // C = 0
                meaName = encColGroupValues;
                encColGroupValues = '';
                colGroupValues = [];
            } else {
                meaName = encColGroupValues.substring(sepIndex + 1);
                encColGroupValues = encColGroupValues.substring(0, sepIndex);
                colGroupValues = encColGroupValues.split(this._separator);

                var colGroupLabels;
                if(colGroupCell.f != null){
                    colGroupLabels = colGroupCell.f.split(this._separator);
                    colGroupLabels.pop(); // measure label
                }
                
                /*jshint loopfunc:true */
                colGroupValues.forEach(function(value, index){
                    var label = colGroupLabels && colGroupLabels[index];
                    colGroupValues[index] = {v: value, f: label};
                });
            }

            // New column group?
            if(!colGroup || colGroup.encValues !== encColGroupValues){
                colGroup = {
                    index:        i,
                    encValues:    encColGroupValues,
                    values:       colGroupValues,
                    measureNames: [meaName]
                };

                colGroups.push(colGroup);
            } else {
                colGroup.measureNames.push(meaName);
            }

            // Check the measure
            var currMeaIndex = (i - colGroup.index),
                meaInfo = def.getOwn(measuresInfo, meaName);
            if(!meaInfo){
                measuresInfo[meaName] = meaInfo = {
                    name: meaName,
                    groupIndex: currMeaIndex,
                    index: i
                };
                measuresInfoList.push(meaInfo);
            } else if(currMeaIndex > meaInfo.groupIndex) {
                meaInfo.groupIndex = currMeaIndex;
            }
        }

        // Sort measures
        measuresInfoList.sort(function(infoa, infob){
            return def.compare(infoa.groupIndex, infob.groupIndex) ||
                   def.compare(infoa.index, infob.index)
                   ;
        });

        // Reassign measure group indexes
        measuresInfoList.forEach(function(meaInfo2, index){
            meaInfo2.groupIndex = index;
        });

        // Publish colgroups and colgroupIndexes, keeping only relevant information
        var CG = colGroups.length,
            colGroupsValues  = new Array(CG),
            colGroupsIndexes = new Array(CG),
            M = measuresInfoList.length,
            R = this.R
            ;
        
        colGroups.map(function(colGroup2, cg){
            colGroupsValues[cg] = colGroup2.values;

            // The index in source *line* where each of the M measures can be read
            var meaIndexes = colGroupsIndexes[cg] = new Array(M);
            colGroup2.measureNames.forEach(function(meaName2, index){
                meaIndexes[measuresInfo[meaName2].groupIndex] = R + colGroup2.index + index;
            });
        });

        this._colGroups        = colGroupsValues;
        this._colGroupsIndexes = colGroupsIndexes;
        this.M = M;
    },
    
    /**
     * Called once, before {@link #execute},
     * for the translation to configure the complex type.
     *
     * @type undefined
     * @override
     */
    configureType: function(){
        // Map: Dimension Group -> Item cross-groups indexes
        if(this.measuresDirection === 'rows') {
            throw def.error.notImplemented();
        }

        var me = this,
            index = 0;
        
        function add(dimGroupName, crossGroup, level, count) {
            var crossEndIndex = me._itemCrossGroupIndex[crossGroup] + count; // exclusive
            
            while(count > 0) {
                var dimName = pvc.data.DimensionType.dimensionGroupLevelName(dimGroupName, level);
                if(!me._userUsedDims[dimName]) { // Skip name if occupied and continue with next name
                    
                    // use first available slot for auto dims readers as long as within crossIndex and crossIndex + count
                    index = me._nextAvailableItemIndex(index);
                    if(index >= crossEndIndex) {
                        // this group has no more slots available
                        return;
                    }
                    
                    // Consume the index
                    me._userItem[index] = true;
                    
                    var reader = me._propGet(dimName, index);
                    
                    me._userDimsReaders.push(reader);
                    
                    // <Debug>
                    /*jshint expr:true */
                    !def.hasOwn(me._userDimsReadersByDim, dimName) || def.assert("Dimension already being read.");
                    // </Debug>
                    
                    me._userDimsReadersByDim[dimName] = reader;
                    
                    count--;
                }
                
                level++;
            }
        }
        
        if(this.C > 0){
            add('series', 'C', 0, this.C);
        }
        
        if(this.R > 0){
            add('category', 'R', 0, this.R);
        }
        
        if(!this._userUsedDims.value) {
            add('value', 'M', 0, this.M);
        }

        if(this._axis2SeriesKeySet){
            var seriesReader = this._userDimsReadersByDim.series;
            if(seriesReader) {
                var calcAxis2SeriesKeySet = def.fun.constant(this._axis2SeriesKeySet);

                /* Create a reader that surely only returns 'series' atoms */
                seriesReader = this._filterDimensionReader(seriesReader, 'series');

                this._userDimsReaders.push(
                        this._dataPartGet(calcAxis2SeriesKeySet, seriesReader));
            }
        }
    }
});
/**
 * @name pvc.data.RelationalTranslationOper
 * 
 * @class Represents one translation operation, 
 * from a source matrix in relational format to 
 * an enumerable of atom arrays.
 * 
 * <p>
 * The default matrix-relational format is:
 * </p>
 * <pre>
 * ---------------------------
 *    0   |    1     |   2
 * ---------------------------
 * series | category | value
 * ---------------------------
 *    T   |     A    |   12
 *    T   |     B    |   45
 *    Q   |     A    |   11
 *    Q   |     B    |   99
 *    Z   |     B    |    3
 * </pre>
 * <p>
 * If the option <i>seriesInRows</i> is true
 * the indexes of series and categories are switched.
 * </p>
 * <p>
 * If the option <i>measuresIndexes</i> is specified,
 * additional value dimensions are created to receive the specified columns.
 * Note that these indexes may consume series and/or category indexes as well. 
 * </p>
 * <p>
 * If only two metadata columns are provided, 
 * then a dummy 'series' column with the constant null value is added automatically. 
 * </p>
 * 
 * @extends pvc.data.MatrixTranslationOper
 *  
 * @constructor
 * @param {pvc.data.ComplexType} complexType The complex type that will represent the translated data.
 * @param {object} source The matrix-relational array to be translated.
 * The source is not modified.
 * @param {object} [metadata] A metadata object describing the source.
 * 
 * @param {object} [options] An object with translation options.
 * See additional available options in {@link pvc.data.MatrixTranslationOper}.
 * 
 * @param {(number|string)[]|number|string} [options.measuresIndexes] 
 * An array of indexes of columns of the source matrix
 * that contain value dimensions.
 * <p>
 * Multiple 'value' dimensions ('value', 'value2', 'value3', ...) 
 * are bound in order to the specified indexes.
 * </p>
 * <p>
 * The option 'secondAxisSeriesIndexes' 
 * is incompatible with and 
 * takes precedence over 
 * this one.
 * </p>
 * <p>
 * The indexes can be numbers or strings that represent numbers.
 * It is also possible to specify a single index instead of an array.
 * </p>
 */
def.type('pvc.data.RelationalTranslationOper', pvc.data.MatrixTranslationOper)
.add(/** @lends pvc.data.RelationalTranslationOper# */{
    
    /**
     * Called once, before {@link #execute}, 
     * for the translation to configure the complex type.
     * 
     * @type undefined
     * @override
     */
    configureType: function(){
        var me = this;
        
        function add(dimGet, dim) {
            me._userDimsReaders.push(dimGet);
            if(dim){
                // <Debug>
                /*jshint expr:true */
                !def.hasOwn(me._userDimsReadersByDim, dim) || def.assert("Dimension already being read.");
                // </Debug>
                
                me._userDimsReadersByDim[dim] = dimGet;
            }
        }

        var L = this.metadata.length,
            unmappedColCount = L - this._userUsedIndexesCount;
         
        if(unmappedColCount > 0){

            /* Value dimension(s) (fixed multiple indexes) */
            var valuesColIndexes;
            if(!this._userUsedDims.value &&
               this.options.isMultiValued &&
               // The null test is required because measuresIndexes can be a number, a string...
               (valuesColIndexes = this.options.measuresIndexes) != null) {

                this.defReader({names: 'value', indexes: valuesColIndexes });
                
                unmappedColCount = L - this._userUsedIndexesCount;
            }

            if(unmappedColCount > 0){
                /* Build the dimensions that can be read automatically */
                var dimName,
                    autoColDims = !this.options.seriesInRows ?
                                  ['value', 'category', 'series'  ] :
                                  ['value', 'series',   'category']
                                  ;

                /*
                 * Leave only those not already mapped by the user,
                 * giving priority to those on the left.
                 */
                autoColDims = autoColDims.filter(function(dimName2){
                                return !this._userUsedDims[dimName2];
                              }, this)
                              .slice(0, unmappedColCount);

                unmappedColCount -= autoColDims.length;
                if(unmappedColCount > 0){
                    var desiredCatCount = def.get(this.options, 'categoriesCount', 1);
                    if(desiredCatCount > 1){
                        var catIndex = autoColDims.indexOf('category');
                        if(catIndex < 0){
                            if(this.options.seriesInRows){
                                catIndex = autoColDims.length;
                            } else {
                                catIndex = autoColDims.indexOf('value') + 1;
                            }
                        } else {
                            // Insert after the 1st category
                            catIndex++;
                        }

                        var catLevel = 1;
                        while(catLevel < desiredCatCount){
                            dimName = pvc.data.DimensionType.dimensionGroupLevelName('category', catLevel++);
                            if(!this._userUsedDims[dimName]){
                                def.array.insertAt(
                                    autoColDims,
                                    catIndex++,
                                    dimName);
                            }
                        }
                    }
                }

                /* Assign virtual item indexes to remaining auto dims */
                var index = 0;
                while(autoColDims.length && (dimName = autoColDims.pop())) {
                    index = this._nextAvailableItemIndex(index);

                    // mark the index as mapped
                    this._userItem[index] = true;

                    add(this._propGet(dimName, index), dimName);

                    index++;
                }
            }
        }
        
        // ----
        // The null test is required because secondAxisSeriesIndexes can be a number, a string...
        var axis2SeriesIndexes = this.options.secondAxisSeriesIndexes;
        if(axis2SeriesIndexes != null){
            var seriesReader = this._userDimsReadersByDim.series;
            if(seriesReader) {
                add(relTransl_dataPartGet.call(this, axis2SeriesIndexes, seriesReader));
            }
        }
    }
});

/**
 * Obtains the dimension reader for dimension 'dataPart'.
 * 
 * @name pvc.data.RelationalTranslationOper#_dataPartGet
 * @function
 * @param {Array} secondAxisSeriesIndexes The indexes of series that are to be shown on the second axis. 
 * @param {function} seriesReader Dimension series atom getter.
 * @type function
 */
function relTransl_dataPartGet(secondAxisSeriesIndexes, seriesReader) {
    var me = this;
    
    /* Create a reader that surely only returns 'series' atoms */
    seriesReader = this._filterDimensionReader(seriesReader, 'series');
    
    /* Defer calculation of axis2SeriesKeySet because *data* isn't yet available. */
    function calcAxis2SeriesKeySet() {
        var seriesKeys = def.query(me.source)
                                .select(function(item){
                                    var atom = seriesReader(item);
                                    return (atom && atom.key) || null;
                                })
                                /* distinct excludes null keys */
                                .distinct()
                                .array();

        return me._createSecondAxisSeriesKeySet(secondAxisSeriesIndexes, seriesKeys);
    }
    
    return this._dataPartGet(calcAxis2SeriesKeySet, seriesReader);
}/**
 * Initializes an atom instance.
 * 
 * @name pvc.data.Atom
 * 
 * @class An atom represents a unit of information.
 * 
 * <p>
 * To create an atom, 
 * call the corresponding dimension's
 * {@link pvc.data.Dimension#intern} method.
 * 
 * Usually this is done by a {@link pvc.data.TranslationOper}.
 * </p>
 * 
 * @property {pvc.data.Dimension} dimension The owner dimension.
 * 
 * @property {number} id
 *           A unique object identifier.
 *           
 * @property {any} rawValue The raw value from which {@link #value} is derived.
 *           <p>
 *           It is not always defined. 
 *           Values may be the result of
 *           combining multiple source values.
 *            
 *           Values may even be constant
 *           and, as such, 
 *           not be derived from 
 *           any of the source values.
 *           </p>
 * 
 * @property {any} value The typed value of the atom.
 *           It must be consistent with the corresponding {@link pvc.data.DimensionType#valueType}.
 * 
 * @property {string} label The formatted value.
 *           <p>
 *           Only the null atom can have a empty label.
 *           </p>
 *           
 * @property {string} key The value of the atom expressed as a
 *           string in a way that is unique amongst all atoms of its dimension.
 *           <p>
 *           Only the null atom has a key equal to "".
 *           </p>
 * @property {string} globalKey A semantic key that is unique across atoms of every dimensions.
 * 
 * @constructor
 * @private
 * @param {pvc.data.Dimension} dimension The dimension that the atom belongs to.
 * @param {any} value The typed value.
 * @param {string} label The formatted value.
 * @param {any} rawValue The source value.
 * @param {string} key The key.
 */
def.type('pvc.data.Atom')
.init(
function(dimension, value, label, rawValue, key) {
    this.dimension = dimension;
    this.id = value == null ? 0 : def.nextId(); // Ensure null sorts first, when sorted by id
    this.value = value;
    this.label = label;
    this.rawValue = rawValue;
    this.key = key;
    this.globalKey = dimension.name + ":" + key;
})
.add( /** @lends pvc.data.Atom */{
    /**
     * Obtains the label of the atom.
     */
    toString: function(){
        return this.label;
    }
});


/**
 * Comparer for atom according to their id.
 */
function atom_idComparer(a, b) {
    return a.id - b.id; // works for numbers...
}

/**
 * Reverse comparer for atom according to their id.
 */
function atom_idComparerReverse(a, b) {
    return b.id - a.id; // works for numbers...
}var complex_nextId = 1;

/**
 * Initializes a complex instance.
 * 
 * @name pvc.data.Complex
 * 
 * @class A complex is a set of atoms, 
 *        of distinct dimensions,
 *        all owned by the same data.
 * 
 * @property {number} id
 *           A unique object identifier.
 * 
 * @property {number} key
 *           A semantic identifier.
 *           <p>
 *           Only contains information related to locally set atoms.
 *           Atoms that are present in a base atoms object are not included.
 *           </p>
 *           
 * @property {pvc.data.Data} owner
 *           The owner data instance.
 * 
 * @property {object} atoms
 *           A index of {@link pvc.data.Atom} by the name of their dimension type.
 * 
 * @constructor
 * @param {pvc.data.Complex} [source] 
 *        A complex that provides for an owner and default base atoms.
 * 
 * @param {pvc.data.Atom[]} [atoms]
 *        An array of atoms of distinct dimensions.
 *        
 * @param {object} [atomsBase] 
 *        An object to serve as prototype to the {@link #atoms} object.
 *        <p>
 *        Atoms already present in this object are not set locally.
 *        The key and default label of a complex only contain information 
 *        from its own atoms.
 *        </p>
 *        <p>
 *        The default value is the {@link #atoms} of the argument {@link source},
 *        when specified.
 *        </p>
 */
def
.type('pvc.data.Complex')
.init(function(source, atoms, atomsBase, wantLabel) {
    /*jshint expr:true */
    
    /* NOTE: this function is a hot spot and as such is performance critical */
    
    this.id = complex_nextId++;
    
    var owner;
    if(source){
        owner = source.owner;
        if(!atomsBase){
            atomsBase = source.atoms;
        }
    }
    
    this.owner = owner || this;
    this.atoms = atomsBase ? Object.create(atomsBase) : {};
	
    if (!atoms) {
        this.value = null;
        this.key   = '';
        if(wantLabel){
            this.label = "";
        }
    } else {
        // <Debug>
        var asserts = pvc.debug >= 6;
        // </Debug>
        
        /* Fill the atoms map */
        var atomsMap = this.atoms;
        
        var count = 0;
        var singleAtom;
        var i;
        var L = atoms.length;
        for(i = 0 ; i < L ; i++){
            var atom  = atoms[i] || def.fail.argumentRequired('atom');
            var value = atom.value; 
            if(value != null){ // nulls are already in base proto object
                var name = atom.dimension.name;
                if(!atomsBase || atom !== atomsBase[name]) { // don't add atoms already in base proto object
                    // <Debug>
                    if(asserts){
                        if(atom.dimension !== owner.dimensions(name)){
                            throw def.error.operationInvalid("Invalid atom dimension '{0}'.", [name]);
                        }
    
                        if(def.hasOwnProp.call(atomsMap, name)) {
                            throw def.error.operationInvalid("An atom of the same dimension has already been added '{0}'.", [name]);
                        }
                    }
                    // </Debug>
                    
                    count++;
                    atomsMap[name] = atom;
                    if(count === 1){
                        singleAtom = atom;
                    }
                }
            }
        }
        
        /* Build Key and Label in the order of type.dimensions */
        if(count === 1){
            this.value = singleAtom.value;     // typed
            this.key   = singleAtom.globalKey; // string
            if(wantLabel){
                this.label = singleAtom.label;
            }
        } else {
            // For a small number, of small strings, it's actually faster to 
            // just concatenate strings comparing to the array.join method 
            var dimNames = owner.type._dimsNames;
            var key, label, aLabel;
            var labelSep = owner.labelSep;
            
            L = dimNames.length;
            for(i = 0 ; i < L ; i++){
                var dimName = dimNames[i];
                if(def.hasOwnProp.call(atomsMap, dimName)){
                    var atom = atomsMap[dimName];
                    if(i){
                        key += ',' + atom.globalKey;
                    } else {
                        key = atom.globalKey;
                    }
                    
                    if(wantLabel){
                        // Assuming labels are non-empty
                        // Non-null atoms => non-empty labels
                        if(label){
                            label += labelSep + atom.label;
                        } else {
                            label = atom.label;
                        }
                    }
                }
            }
        
            this.value = this.key = key;
            if(wantLabel){
                this.label = label;
            }
        }
	}
})
.add(/** @lends pvc.data.Complex# */{
    
    /**
     * The separator used between labels of dimensions of a complex.
     * Generally, it is the owner's labelSep that is used.
     */
    labelSep: " ~ ",
    
    label: null,
    
    ensureLabel: function(){
        var label = this.label;
        if(label != null){
            label = "";
            var labelSep = this.owner.labelSep;
            def.eachOwn(this.atoms, function(atom){
                var alabel = atom.label;
                if(alabel){
                    if(label){
                        label += labelSep + alabel;
                    } else {
                        label = alabel;
                    }
                }
            });
            
            this.label = label;
        }
        
        return label;
    },

    view: function(dimNames){
        return new pvc.data.ComplexView(this, dimNames);
    },

    toString : function() {
       var s = [ '' + this.constructor.typeName ];
       
       if (this.index != null) {
           s.push("#" + this.index);
       }

       this.owner.type.dimensionsNames().forEach(function(name) {
           s.push(name + ": " + JSON.stringify(this.atoms[name].value));
       }, this);

       return s.join(" ");
   }
});
/**
 * Initializes a complex view instance.
 * 
 * @name pvc.data.ComplexView
 * 
 * @class Represents a view of certain dimensions over a given source complex instance.
 * @extends pvc.data.Complex
 * 
 * @property {pvc.data.Complex} source The source complex instance.
 * @property {string} label The composite label of the own atoms in the view.
 * @constructor
 * @param {pvc.data.Complex} source The source complex instance.
 * @param {string[]} ownDimNames The dimensions that should be revealed by the view.
 */
def.type('pvc.data.ComplexView', pvc.data.Complex)
.init(function(source, ownDimNames){

    this.source = source;
    
    var viewDimNames = this.viewDimNames = [];
    
    /* Collect desired source atoms */
    var sourceAtoms = source.atoms,
        ownSourceAtoms = [];

    ownDimNames.forEach(function(dimName){
        if(def.hasOwnProp.call(sourceAtoms, dimName)){
            ownSourceAtoms.push(sourceAtoms[dimName]);
            viewDimNames.push(dimName);
        }
    });

    // Call base constructor
    this.base(source, ownSourceAtoms, source.owner.atoms, /* wantLabel */ true);
})
.add({
    values: function(){
        return this.viewDimNames.map(function(dimName){
            return this.atoms[dimName].value;
        }, this);
    }
});
/**
 * Initializes a datum instance.
 * 
 * @name pvc.data.Datum
 * 
 * @class A datum is a complex that contains atoms for all the
 * dimensions of the associated {@link #data}.
 *
 * @extends pvc.data.Complex
 * 
 * @property {boolean} isNull Indicates if the datum is a null datum.
 * <p>
 * A null datum is a datum that doesn't exist in the data source,
 * but is created for auxiliary reasons (null pattern).
 * </p>
 *
 * @property {boolean} isSelected The datum's selected state (read-only).
 * @property {boolean} isVisible The datum's visible state (read-only).
 * 
 * @constructor
 * @param {pvc.data.Data} data The data instance to which the datum belongs.
 * Note that the datum will belong instead to the owner of this data. 
 * However the datums atoms will inherit from the atoms of the specified data.
 * This is essentially to facilitate the creation of null datums.
 * @param {pvc.data.Atom[]} [atoms] An array of atoms of <i>distinct</i> dimensions.
 * @param {boolean} [isNull=false] Indicates if the datum is a null datum.
 */
def.type('pvc.data.Datum', pvc.data.Complex)
.init(
function(data, atoms, isNull){
    
    this.base(data.owner, atoms, data.atoms);
    
    if(isNull) {
        this.isNull = true;
    } // otherwise inherit prototype default value
})
.add(/** @lends pvc.data.Datum# */{
    
    isSelected: false,
    isVisible:  true,
    isNull: false,
    
    /**
     * Sets the selected state of the datum to a specified value.
     * 
     * @param {boolean} [select=true] The desired selected state.
     * 
     * @returns {boolean} true if the selected state changed, false otherwise.
     */
    setSelected: function(select){
        // Null datums are always not selected
        if(this.isNull){ return false; }
        
        // Normalize 'select'
        select = (select == null) || !!select;

        var changed = this.isSelected !== select;
        if(changed){
            if(!select){
                delete this.isSelected;
            } else {
                this.isSelected = true;
            }
            
            
            /*global data_onDatumSelectedChanged:true */
            data_onDatumSelectedChanged.call(this.owner, this, select);
        }

        return changed;
    },
    
    /**
     * Toggles the selected state of the datum.
     * 
     * @type {undefined}
     */
    toggleSelected: function(){
        return this.setSelected(!this.isSelected);
    },
    
    /**
     * Sets the visible state of the datum to a specified value.
     * 
     * @param {boolean} [visible=true] The desired visible state.
     * 
     * @returns {boolean} true if the visible state changed, false otherwise.
     */
    setVisible: function(visible){
        // Null datums are always visible
        if(this.isNull){ return false; }
        
        // Normalize 'visible'
        visible = (visible == null) || !!visible;

        var changed = this.isVisible !== visible;
        if(changed){
            this.isVisible = visible;
            //if(!this.isNull){
                /*global data_onDatumVisibleChanged:true */
                data_onDatumVisibleChanged.call(this.owner, this, visible);
            //}
        }

        return changed;
    },
    
    /**
     * Toggles the visible state of the datum.
     * 
     * @type {undefined}
     */
    toggleVisible: function(){
        return this.setVisible(!this.isVisible);
    }
});

/**
 * Called by the owner data to clear the datum's selected state (internal).
 * @name pvc.data.Datum#_deselect
 * @function
 * @type undefined
 * @private
 * 
 * @see pvc.data.Data#clearSelected
 */
function datum_deselect(){
    delete this.isSelected;
}
/**
 * Initializes a dimension instance.
 * 
 * @name pvc.data.Dimension
 * 
 * @class A dimension holds unique atoms,
 * of a given dimension type,
 * and for a given data instance.
 *
 * @property {pvc.data.Data} data The data that owns this dimension.
 * @property {pvc.data.DimensionType} type The dimension type of this dimension.
 * @property {string} name Much convenient property with the name of {@link #type}.
 * 
 * @property {pvc.data.Dimension} parent The parent dimension.
 * A root dimension has a null parent.
 * 
 * @property {pvc.data.Dimension} linkParent The link parent dimension.
 * 
 * @property {pvc.data.Dimension} root The root dimension.
 * A root dimension has itself as the value of {@link #root}.
 * 
 * @property {pvc.data.Dimension} owner The owner dimension.
 * An owner dimension is the topmost root dimension (accessible from this one).
 * An owner dimension owns its atoms, while others simply contain them.
 * The value of {@link pvc.data.Atom#dimension} is an atom's <i>owner</i> dimension.
 * 
 * @constructor
 * 
 * @param {pvc.data.Data} data The data that owns this dimension.
 * @param {pvc.data.DimensionType} type The type of this dimension.
 */

def.type('pvc.data.Dimension')
.init(function(data, type){
    /* NOTE: this function is a hot spot and as such is performance critical */
    this.data  = data;
    this.type  = type;
    this.root  = this;
    this.owner = this;
    
    var name = type.name;
    
    this.name = name;
    
    // Cache
    // -------
    // The atom id comparer ensures we keep atoms in the order they were added, 
    //  even when no semantic comparer is provided.
    // This is important, at least, to keep the visible atoms cache in the correct order.
    this._atomComparer = type.atomComparer();
    this._atomsByKey = {};
    
    if(data.isOwner()){
        // Owner
        // Atoms are interned by #intern
        this._atoms = [];
        
        dim_createVirtualNullAtom.call(this);
        
    } else {
        // Not an owner
        var parentData = data.parent;
        
        var source; // Effective parent / atoms source
        if(parentData){
            // Not a root
            source = parentData._dimensions[name];
            dim_addChild.call(source, this);
            
            this.root = data.parent.root;
        } else {
            parentData = data.linkParent;
            // A root that is not topmost
            /*jshint expr:true */
            parentData || def.assert("Data must have a linkParent");
            
            source = parentData._dimensions[name];
            dim_addLinkChild.call(source, this);
        }
        
        // Not in _atomsKey
        this._nullAtom = this.owner._nullAtom; // may be null
        
        this._lazyInit = function(){ /* captures 'source' and 'name' variable */
            this._lazyInit = null;
            
            // Collect distinct atoms in data._datums
            var datums = this.data._datums;
            var L = datums.length;
            var atomsByKey = this._atomsByKey;
            for(var i = 0 ; i < L ; i++){
                // NOTE: Not checking if atom is already added,
                // but it has no adverse side-effect.
                var atom = datums[i].atoms[name];
                atomsByKey[atom.key] = atom;
            }
            
            // Filter parentEf dimension's atoms; keeps order.
            this._atoms = source.atoms().filter(function(atom){
                return def.hasOwnProp.call(atomsByKey, atom.key);
            });
        };
    }
})
.add(/** @lends pvc.data.Dimension# */{
    
    parent: null,
    
    linkParent: null,
    
    /**
     * The array of child dimensions.
     * @type pvc.data.Dimension[] 
     */
    _children: null,
    
    /**
     * The array of link child dimensions.
     * @type pvc.data.Dimension[] 
     */
    _linkChildren: null,
    
    /**
     * A map of the contained atoms by their {@link pvc.data.Atom#key} property.
     * 
     * Supports the intern(...), atom(.), and the control of the visible atoms cache.
     *
     * @type object
     */
    _atomsByKey: null,
    
    /**
     * A map of the count of visible datums per atom {@link pvc.data.Atom#key} property.
     *
     * @type object
     */
    _atomVisibleDatumsCount: null, 
    
    /** 
     * Indicates if the object has been disposed.
     * 
     * @type boolean
     * @private 
     */
    _disposed: false,

    /**
     * The atom with a null value.
     *
     * @type pvc.data.Atom
     * @private
     */
    _nullAtom: null,
    
    /**
     * The virtual null atom.
     *
     * <p>
     * This atom exists to resolve situations 
     * where a null atom does not exist in the loaded data.
     * When a null <i>datum</i> is built, it may not specify
     * all dimensions. When such an unspecified dimension
     * is accessed the virtual null atom is returned by 
     * lookup of the atoms prototype chain (see {@link pvc.data.Data#_atomsBase}.
     * </p>
     * 
     * @type pvc.data.Atom
     * @private
     */
    _virtualNullAtom: null,
    
    /**
     * Cache of sorted visible and invisible atoms.
     * A map from visible state to {@link pvc.data.Atom[]}.
     * <p>
     * Cleared whenever any atom's "visible state" changes.
     * </p>
     * 
     * @type object
     * @private
     */
    _visibleAtoms: null, 
    
    /**
     * Cache of sorted visible and invisible indexes.
     * A map from visible state to {@link number[]}.
     * <p>
     * Cleared whenever any atom's "visible state" changes.
     * </p>
     * 
     * @type object
     * @private
     */
    _visibleIndexes: null,
    
    /**
     * Cache of the dimension type's normal order atom comparer.
     * 
     * @type function
     * @private
     */
    _atomComparer: null,
    
    /**
     * The ordered array of contained atoms.
     * <p>
     * The special null atom, if existent, is the first item in the array.
     *</p>
     *<p>
     * On a child dimension it is a filtered version 
     * of the parent's array, 
     * and thus has the same atom relative order.
     * 
     * In a link child dimension it is copy
     * of the link parent's array.
     * </p>
     * 
     * @type pvc.data.Atom[]
     * @see #_nullAtom
     */
    _atoms: null,

    /**
     * An object with cached results of the {@link #sum} method.
     *
     * @type object
     */
    _sumCache: null,

    /**
     * Obtains the number of atoms contained in this dimension.
     * 
     * <p>
     * Consider calling this method on the root or owner dimension.
     * </p>
     *
     * @returns {Number} The number of contained atoms.
     *
     * @see pvc.data.Dimension#root
     * @see pvc.data.Dimension#owner
     */
    count: function(){
        if(this._lazyInit) { this._lazyInit(); }
        return this._atoms.length;
    },
    
    /**
     * Indicates if an atom belonging to this dimension 
     * is considered visible in it.
     * 
     * <p>
     * An atom is considered visible in a dimension
     * if there is at least one datum of the dimension's data
     * that has the atom and is visible.
     * </p>
     *
     * @param {pvc.data.Atom} atom The atom of this dimension whose visible state is desired.
     * 
     * @type boolean
     */
    isVisible: function(atom){
        if(this._lazyInit) { this._lazyInit(); }
        
        // <Debug>
        /*jshint expr:true */
        def.hasOwn(this._atomsByKey, atom.key) || def.assert("Atom must exist in this dimension.");
        // </Debug>
        
        return dim_getVisibleDatumsCountMap.call(this)[atom.key] > 0;
    },
    
    /**
     * Obtains the atoms contained in this dimension,
     * possibly filtered.
     * 
     * <p>
     * Consider calling this method on the root or owner dimension.
     * </p>
     * 
     * @param {Object} [keyArgs] Keyword arguments.
     * @param {boolean} [keyArgs.visible=null] 
     *      Only considers atoms that  
     *      have the specified visible state.
     * 
     * @returns {pvc.data.Atom[]} An array with the requested atoms.
     * Do <b>NOT</b> modify the returned array.
     * 
     * @see pvc.data.Dimension#root
     * @see pvc.data.Dimension#owner
     */
    atoms: function(keyArgs){
        if(this._lazyInit) { this._lazyInit(); }
        
        var visible = def.get(keyArgs, 'visible');
        if(visible == null){
            return this._atoms;
        }
        
        visible = !!visible;
        
        /*jshint expr:true */
        this._visibleAtoms || (this._visibleAtoms = {});
        
        return this._visibleAtoms[visible] || 
               (this._visibleAtoms[visible] = dim_calcVisibleAtoms.call(this, visible));
    },
    
    /**
     * Obtains the local indexes of all, visible or invisible atoms.
     * 
     * @param {Object} [keyArgs] Keyword arguments.
     * @param {boolean} [keyArgs.visible=null] 
     *      Only considers atoms that 
     *      have the specified visible state.
     * 
     * @type number[]
     */
    indexes: function(keyArgs){
        if(this._lazyInit) { this._lazyInit(); }
        
        var visible = def.get(keyArgs, 'visible');
        if(visible == null) {
            // Not used much so generate each time
            return pv.range(0, this._atoms.length);
        }
        
        visible = !!visible;
        
        /*jshint expr:true */
        this._visibleIndexes || (this._visibleIndexes = {});
        return this._visibleIndexes[visible] || 
               (this._visibleIndexes[visible] = dim_calcVisibleIndexes.call(this, visible));
    },
    
    /**
     * Obtains an atom that represents the specified value, if one exists.
     * 
     * @param {any} value A value of the dimension type's {@link pvc.data.DimensionType#valueType}.
     * 
     * @returns {pvc.data.Atom} The existing atom with the specified value, or null if there isn't one.
     */
    atom: function(value){
        if(value == null || value === '') {
            return this._nullAtom; // may be null
        }
        
        if(value instanceof pvc.data.Atom) {
            return value;
        }
        
        if(this._lazyInit) { this._lazyInit(); }

        var key = this.type._key ? this.type._key.call(null, value) : value;
        return this._atomsByKey[key] || null; // undefined -> null
    },
    
    /**
     * Obtains the minimum and maximum atoms of the dimension,
     * possibly filtered.
     * 
     * <p>
     * Assumes that the dimension type is comparable.
     * If not the result will coincide with "first" and "last".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * <p>
     * Consider calling this method on the root or owner dimension.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link #atoms} for a list of available filtering keyword arguments. 
     *
     * @returns {object} 
     * An extent object with 'min' and 'max' properties, 
     * holding the minimum and the maximum atom, respectively,
     * if at least one atom satisfies the selection;
     * undefined otherwise.
     * 
     * @see #root
     * @see #owner
     * @see #atoms
     * @see pvc.data.DimensionType.isComparable
     */
    extent: function(keyArgs){
        // Assumes atoms are sorted (null, if existent is the first).
        var atoms  = this.atoms(keyArgs);
        var L = atoms.length;
        if(!L){ return undefined; }
        
        var offset = this._nullAtom && atoms[0].value == null ? 1 : 0;
        return (L > offset) ?
               {min: atoms[offset], max: atoms[L - 1]} :
               undefined;
    },
    
    /**
     * Obtains the minimum atom of the dimension,
     * possibly after filtering.
     * 
     * <p>
     * Assumes that the dimension type is comparable.
     * If not the result will coincide with "first".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * <p>
     * Consider calling this method on the root or owner dimension.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link #atoms} for a list of available filtering keyword arguments. 
     *
     * @returns {pvc.data.Atom} The minimum atom satisfying the selection;
     * undefined if none.
     * 
     * @see #root
     * @see #owner
     * @see #atoms
     * @see pvc.data.DimensionType.isComparable
     */
    min: function(keyArgs){
        // Assumes atoms are sorted.
        var atoms = this.atoms(keyArgs);
        var L = atoms.length;
        if(!L){ return undefined; }
        
        var offset = this._nullAtom && atoms[0].value == null ? 1 : 0;
        return (L > offset) ? atoms[offset] : undefined;
    },
    
    /**
     * Obtains the maximum atom of the dimension,
     * possibly after filtering.
     * 
     * <p>
     * Assumes that the dimension type is comparable.
     * If not the result will coincide with "last".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * <p>
     * Consider calling this method on the root or owner dimension.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link #atoms} for a list of available filtering keyword arguments. 
     *
     * @returns {pvc.data.Atom} The maximum atom satisfying the selection;
     * undefined if none.
     * 
     * @see #root
     * @see #owner
     * @see #atoms
     * 
     * @see pvc.data.DimensionType.isComparable
     */
    max: function(keyArgs){
        // Assumes atoms are sorted.
        var atoms = this.atoms(keyArgs);
        var L = atoms.length;
        
        return L && atoms[L - 1].value != null ? atoms[L - 1] : undefined;
    },
    
    /**
     * Obtains the sum of this dimension's values over all datums of the data,
     * possibly after filtering.
     * 
     * <p>
     * Assumes that the dimension type {@link pvc.data.DimensionType#valueType} is "Number".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link pvc.data.Data#datums} for a list of available filtering keyword arguments. 
     *
     * @param {boolean} [keyArgs.abs=false] Indicates if it is the sum of the absolute value that is desired.
     * @param {boolean} [keyArgs.zeroIfNone=true] Indicates that zero should be returned when there are no datums
     * or no datums with non-null values.
     * When <tt>false</tt>, <tt>null</tt> is returned, in that situation.
     *
     * @returns {number} The sum of considered datums or <tt>0</tt> or <tt>null</tt>, if none.
     * 
     * @see #root
     * @see #owner
     * @see #atoms
     */
    sum: function(keyArgs){
        var isAbs = !!def.get(keyArgs, 'abs', false),
            zeroIfNone = def.get(keyArgs, 'zeroIfNone', true),
            key   = dim_buildDatumsFilterKey(keyArgs) + ':' + isAbs;
              
        var sum = def.getOwn(this._sumCache, key);
        if(sum === undefined) {
            var dimName = this.name;
            sum = this.data.datums(null, keyArgs).reduce(function(sum2, datum){
                var value = datum.atoms[dimName].value;
                if(isAbs && value < 0){ // null < 0 is false
                    value = -value;
                }

                return sum2 != null ? (sum2 + value) : value; // null preservation
            },
            null);
            
            (this._sumCache || (this._sumCache = {}))[key] = sum;
        }
        
        return zeroIfNone ? (sum || 0) : sum;
    },
    
    /**
     * Obtains the percentage of a specified atom or value,
     * over the <i>sum</i> of the absolute values of a specified datum set.
     * 
     * <p>
     * Assumes that the dimension type {@link pvc.data.DimensionType#valueType} is "Number".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * @param {pvc.data.Atom|any} [atomOrValue] The atom or value on which to calculate the percent.
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link pvc.data.Dimension#sum} for a list of available filtering keyword arguments. 
     *
     * @returns {number} The calculated percentage.
     * 
     * @see #root
     * @see #owner
     */
    percent: function(atomOrValue, keyArgs){
        var value = (atomOrValue instanceof pvc.data.Atom) ? atomOrValue.value : atomOrValue;
        if(!value) { // nully or zero
            return 0;
        }
        // if value != 0 => sum != 0, but JIC, we test for not 0...
        var sum = this.sum(def.create(keyArgs, {abs: true}));
        return sum ? (Math.abs(value) / sum) : 0;
    },
    
    /**
     * Obtains the percentage of the local <i>sum</i> of a specified selection,
     * over the <i>sum</i> of the absolute values of an analogous selection in the parent data.
     * 
     * <p>
     * Assumes that the dimension type {@link pvc.data.DimensionType#valueType} is "Number".
     * </p>
     * 
     * <p>
     * Does not consider the null atom.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * See {@link pvc.data.Dimension#sum} for a list of available filtering keyword arguments. 
     *
     * @returns {number} The calculated percentage.
     * 
     * @see #root
     * @see #owner
     */
    percentOverParent: function(keyArgs){
        var value = this.sum(keyArgs); // normal sum
        if(!value) { // nully or zero
            return 0;
        }
        
        // if value != 0 => sum != 0, but JIC, we test for not 0...
        var parentData = this.data.parent;
        if(!parentData) {
            return 0;
        }

        // The following would not work because, in each group,
        //  abs would not be used...
        //var sum = parentData.dimensions(this.name).sum();

        var sum = parentData.dimensionsSumAbs(this.name, keyArgs);

        return sum ? (Math.abs(value) / sum) : 0;
    },
    
    
    format: function(value, sourceValue){
        return "" + (this.type._formatter ? this.type._formatter.call(null, value, sourceValue) : "");
    },
    
    /**
     * Obtains an atom that represents the specified sourceValue,
     * creating one if one does not yet exist.
     * 
     * <p>
     * Used by a translation to 
     * obtain atoms of a dimension for raw values of source items.
     * </p>
     * <p>
     * This method can only be called on an owner dimension.
     * </p>
     * <p>
     * An empty string value is considered equal to a null value. 
     * </P>
     * @param {any} sourceValue The source value.
     *
     * @type pvc.data.Atom
     */
    intern: function(sourceValue){
        // <Debug>
        /*jshint expr:true */
        (this.owner === this) || def.assert("Can only internalize on an owner dimension.");
        // </Debug>
        
        // NOTE:
        // This function is performance critical!
      
        // The null path and the existing atom path 
        // are as fast and direct as possible
        
        // - NULL -
        if(sourceValue == null || sourceValue === '') {
            return this._nullAtom || dim_createNullAtom.call(this, sourceValue);
        }
        
        var type = this.type;
        
        // - CONVERT - 
        var value, label;
        if(type._converter){
            value = type._converter.call(null, sourceValue);
        } else if(typeof sourceValue === 'object' && ('v' in sourceValue)){
            // Assume google table style cell {v: , f: }
            value = sourceValue.v;
            label = sourceValue.f;
        } else {
            value = sourceValue;
        }
        
        if(value == null || value === '') {
            // Null after all
            return this._nullAtom || dim_createNullAtom.call(this, sourceValue);
        }
        
        // - CAST -
        // Any cast function?
        if(type.cast) {
            value = type.cast.call(null, value);
            if(value == null || value === ''){
                // Null after all (normally a cast failure)
                return this._nullAtom || dim_createNullAtom.call(this);
            }
        }
        
        // - KEY -
        var key = '' + (type._key ? type._key.call(null, value) : value);
        // <Debug>
        key || def.fail.operationInvalid("Only a null value can have an empty key.");
        // </Debug>
        
        // - ATOM -
        var atom = this._atomsByKey[key];
        if(atom) {
            return atom;
        }
        
        // - LABEL -
        if(label == null){
            if(type._formatter){
                label = type._formatter.call(null, value, sourceValue);
            } else {
                label = value;
            }
        }

        label = "" + label; // J.I.C.
        
        if(!label && pvc.debug >= 2){
            pvc.log("Only the null value should have an empty label.");
        }
        
        // - ATOM! -
        atom = new pvc.data.Atom(this, value, label, sourceValue, key);
        
        // Insert atom in order (or at the end when !_atomComparer)
        def.array.insert(this._atoms, atom, this._atomComparer);
        
        dim_clearVisiblesCache.call(this);
        
        this._atomsByKey[key] = atom;
        
        return atom;
    },
    
    /**
     * Disposes the dimension and all its children.
     */
    dispose: function(){
        if(!this._disposed){
            /*global data_disposeChildList:true */
            data_disposeChildList(this._children,     'parent');
            data_disposeChildList(this._linkChildren, 'linkParent');
            
            // myself
            
            if(this.parent)     { dim_removeChild.call(this.parent, this); }
            if(this.linkParent) { dim_removeLinkChild.call(this.linkParent, this); }
            
            dim_clearVisiblesCache.call(this);
            
            this._lazyInit  = null;
            
            this._atoms = 
            this._nullAtom = 
            this._virtualNullAtom = null;
            
            this._disposed = true;
        }
    }
});

/**
 * Builds a key string suitable for identifying a call to {@link pvc.data.Data#datums}
 * with no where specification.
 *
 * @name pvc.data.Dimension#_buildDatumsFilterKey
 * @function
 * @param {object} [keyArgs] The keyword arguments used in the call to {@link pvc.data.Data#datums}.
 * @type string
 */
function dim_buildDatumsFilterKey(keyArgs){
    var visible  = def.get(keyArgs, 'visible'),
        selected = def.get(keyArgs, 'selected');
    return (visible == null ? null : !!visible) + ':' + (selected == null ? null : !!selected);
}

/**
 * Creates the null atom if it isn't created yet.
 * 
 * @name pvc.data.Dimension#_createNullAtom
 * @function
 * @param {any} [sourceValue] The source value of null. Can be used to obtain the null format.
 * @type undefined
 * @private
 */
function dim_createNullAtom(sourceValue){
    // <Debug>
    /*jshint expr:true */
    (this.owner === this) || def.assert("Can only create atoms on an owner dimension.");
    // </Debug>
    
    if(!this._nullAtom){
        var label = "" + (this.type._formatter ? this.type._formatter.call(null, null, sourceValue) : "");
        
        this._nullAtom = new pvc.data.Atom(this, null, label, null, '');
        
        this._atomsByKey[''] = this._nullAtom;
        
        this._atoms.unshift(this._nullAtom);
        
        this.data._atomsBase[this.name] = this._nullAtom; 
    }
    
    return this._nullAtom;
}

/**
 * Creates the virtual null atom if it isn't created yet.
 * 
 * @name pvc.data.Dimension#_createNullAtom
 * @function
 * @type undefined
 * @private
 */
function dim_createVirtualNullAtom(){
    // <Debug>
    /*jshint expr:true */
    (this.owner === this) || def.assert("Can only create atoms on an owner dimension.");
    // </Debug>
    
    if(!this._virtualNullAtom){
        var label = "" + (this.type._formatter ? this.type._formatter.call(null, null, null) : "");
        
        this._virtualNullAtom = new pvc.data.Atom(this, null, label, null, '');

        this.data._atomsBase[this.name] = this._virtualNullAtom; 
    }
    
    return this._virtualNullAtom;
}

/**
 * Uninternalizes the specified atom from the dimension (internal).
 * 
 * @name pvc.data.Dimension#_unintern
 * @function
 * @param {pvc.data.Atom} The atom to uninternalize.
 * @type undefined
 * @private
 * @internal
 */
function dim_unintern(atom){
    // <Debug>
    /*jshint expr:true */
    (this.owner === this) || def.assert("Can only unintern atoms on an owner dimension.");
    (atom && atom.dimension === this) || def.assert("Not an interned atom");
    // </Debug>
    
    if(atom === this._virtualNullAtom){
        return;
    }
    
    // Remove the atom
    var key = atom.key;
    if(this._atomsByKey[key] === atom){
        def.array.remove(this._atoms, atom, this._atomComparer);
        delete this._atomsByKey[key];
        
        if(!key){
            delete this._nullAtom;
            this.data._atomsBase[this.name] = this._virtualNullAtom;
        }
    }
    
    dim_clearVisiblesCache.call(this);
}

/**
 * Clears all caches affected by datum/atom visibility.
 * 
 * @name pvc.data.Dimension#_clearVisiblesCache
 * @function
 * @type undefined
 * @private
 * @internal
 */
function dim_clearVisiblesCache(){
    this._atomVisibleDatumsCount =
    this._sumCache =
    this._visibleAtoms = 
    this._visibleIndexes = null;
}

/**
 * Called by a dimension's data when its datums have changed.
 * 
 * @name pvc.data.Dimension#_onDatumsChanged
 * @function
 * @type undefined
 * @private
 * @internal
 */
function dim_onDatumsChanged(){
    dim_clearVisiblesCache.call(this);
}

/**
 * Adds a child dimension.
 * 
 * @name pvc.data.Dimension#_addChild
 * @function
 * @param {pvc.data.Dimension} child The child to add.
 * @type undefined
 * @private
 */
function dim_addChild(child){
    /*global data_addColChild:true */
    data_addColChild(this, '_children', child, 'parent');
    
    child.owner = this.owner;
}

/**
 * Removes a child dimension.
 *
 * @name pvc.data.Dimension#_removeChild
 * @function
 * @param {pvc.data.Dimension} child The child to remove.
 * @type undefined
 * @private
 */
function dim_removeChild(child){
    /*global data_removeColChild:true */
    data_removeColChild(this, '_children', child, 'parent');
}

/**
 * Adds a link child dimension.
 * 
 * @name pvc.data.Dimension#_addLinkChild
 * @function
 * @param {pvc.data.Dimension} child The link child to add.
 * @type undefined
 * @private
 */
function dim_addLinkChild(linkChild){
    data_addColChild(this, '_linkChildren', linkChild, 'linkParent');
    
    linkChild.owner = this.owner;
}

/**
 * Removes a link child dimension.
 *
 * @name pvc.data.Dimension#_removeLinkChild
 * @function
 * @param {pvc.data.Dimension} linkChild The child to remove.
 * @type undefined
 * @private
 */
function dim_removeLinkChild(linkChild){
    data_removeColChild(this, '_linkChildren', linkChild, 'linkParent');
}

/**
 * Called by the data of this dimension when 
 * the visible state of a datum has changed. 
 * 
 * @name pvc.data.Dimension#_onDatumVisibleChanged
 * @function
 * @type undefined
 * @private
 * @internal
 */
function dim_onDatumVisibleChanged(datum, visible) {
    var map;
    if(!this._disposed && (map = this._atomVisibleDatumsCount)) {
        var atom = datum.atoms[this.name],
            key = atom.key;
        
        // <Debug>
        /*jshint expr:true */
        def.hasOwn(this._atomsByKey, key) || def.assert("Atom must exist in this dimension.");
        // </Debug>
        
        var count = map[key];
        
        // <Debug>
        (visible || (count > 0)) || def.assert("Must have had accounted for at least one visible datum."); 
        // </Debug>
        
        map[key] = (count || 0) + (visible ? 1 : -1);
        
        // clear dependent caches
        this._visibleAtoms =
        this._sumCache = 
        this._visibleIndexes = null;
    }
}

/**
 * Obtains the map of visible datums count per atom, 
 * creating the map if necessary.
 * 
 * @name pvc.data.Dimension#_getVisibleDatumsCountMap
 * @function
 * @type undefined
 * @private
 */
function dim_getVisibleDatumsCountMap() {
    var map = this._atomVisibleDatumsCount;
    if(!map) {
        map = {};
        
        this.data.datums(null, {visible: true}).each(function(datum){
            var atom = datum.atoms[this.name],
                key  = atom.key;
            map[key] = (map[key] || 0) + 1;
        }, this);
        
        this._atomVisibleDatumsCount = map;
    }
    
    return map;
}

/**
 * Calculates the list of indexes of visible or invisible atoms.
 * <p>
 * Does not include the null atom.
 * </p>
 * 
 * @name pvc.data.Dimension#_calcVisibleIndexes
 * @function
 * @param {boolean} visible The desired atom visible state.
 * @type number[]
 * @private
 */
function dim_calcVisibleIndexes(visible){
    var indexes = [];
    
    this._atoms.forEach(function(atom, index){
        if(this.isVisible(atom) === visible) {
            indexes.push(index);
        }
    }, this);
    
    return indexes;
}

/**
 * Calculates the list of visible or invisible atoms.
 * <p>
 * Does not include the null atom.
 * </p>
 * 
 * @name pvc.data.Dimension#_calcVisibleAtoms
 * @function
 * @param {boolean} visible The desired atom visible state.
 * @type number[]
 * @private
 */
function dim_calcVisibleAtoms(visible){
    return def.query(this._atoms)
            .where(function(atom){ return this.isVisible(atom) === visible; }, this)
            .array();
}
/**
 * Initializes a data instance.
 * 
 * @name pvc.data.Data
 * 
 * @class A data represents a set of datums of the same complex type {@link #type}.
 * <p>
 * A data <i>may</i> have a set of atoms that are shared by all of its datums. 
 * In that case, the {@link #atoms} property holds those atoms.
 * </p>
 * <p>
 * A data has one dimension per dimension type of the complex type {@link #type}.
 * Each holds information about the atoms of it's type in this data.
 * Dimensions are obtained by calling {@link #dimensions}.
 * </p>
 * <p>
 * A data may have child data instances.
 * </p>
 * 
 * @extends pvc.data.Complex
 * 
 * @borrows pv.Dom.Node#visitBefore as #visitBefore
 * @borrows pv.Dom.Node#visitAfter as #visitAfter
 * 
 * @borrows pv.Dom.Node#nodes as #nodes
 * @borrows pv.Dom.Node#firstChild as #firstChild
 * @borrows pv.Dom.Node#lastChild as #lastChild
 * @borrows pv.Dom.Node#previousSibling as #previousSibling
 * @borrows pv.Dom.Node#nextSibling as #nextSibling
 * 
 * @property {pvc.data.ComplexType} type The type of the datums of this data.
 * 
 * @property {pvc.data.Data} root The root data. 
 * The {@link #root} of a root data is itself.
 * 
 * @property {pvc.data.Data} parent The parent data. 
 * A root data has a no parent.
 * 
 * @property {pvc.data.Data} linkParent The link parent data.
 * 
 * @property {Number} depth The depth of the data relative to its root data.
 * @property {string} label The composite label of the (common) atoms in the data.
 * 
 * @property {string} absLabel The absolute label of the data; 
 * a composition of all labels up to the root data.
 * 
 * @property {number} absKey
 *           The absolute semantic identifier;
 *           a composition of all keys up to the root data.
 * 
 * @constructor
 * @param {object} [keyArgs] Keyword arguments
 * 
 * @param {pvc.data.Data}    [keyArgs.parent]     The parent data.
 * @param {pvc.data.Data}    [keyArgs.linkParent] The link parent data.
 * @param {pvc.data.Atom[]}  [keyArgs.atoms]      The atoms shared by contained datums.
 * @param {pvc.data.Datum[]} [keyArgs.datums]     The contained datums.
 * @param {pvc.data.Data}    [keyArgs.owner]      The owner data.
 * The topmost root data is its own owner.
 * An intermediate root data must specify its owner data.
 * 
 * @param {pvc.data.ComplexType} [keyArgs.type] The complex type.
 * Required when no parent or owner are specified.
 */
def.type('pvc.data.Data', pvc.data.Complex)
.init(function(keyArgs){
    /* NOTE: this function is a hot spot and as such is performance critical */
    
    /*jshint expr:true*/
    keyArgs || def.fail.argumentRequired('keyArgs');
    
    this._dimensions = {};
    this._visibleDatums = new def.Map();
    
    var owner,
        atoms,
        atomsBase,
        parent = this.parent = keyArgs.parent || null;
    if(parent){
        // Not a root
        this.root    = parent.root;
        this.depth   = parent.depth + 1;
        this.type    = parent.type;
        this._datums = keyArgs.datums || def.fail.argumentRequired('datums');
        
        owner = parent.owner;
        atoms = keyArgs.atoms || def.fail.argumentRequired('atoms');
        atomsBase = parent.atoms;
    } else {
        // Root (topmost or not)
        this.root = this;
        // depth = 0
        
        var linkParent = keyArgs.linkParent || null;
        if(linkParent){
            // A root that is not topmost - owned, linked
            owner = linkParent.owner;
            //atoms = pv.values(linkParent.atoms); // is atomsBase, below
            
            this.type    = owner.type;
            this._datums = keyArgs.datums || linkParent._datums.slice();
            this._leafs  = [];
            
            /* 
             * Inherit link parent atoms.
             */
            atomsBase = linkParent.atoms;
            //atoms = null
            
            /*global data_addLinkChild:true */
            data_addLinkChild.call(linkParent, this);
        } else {
            // Topmost root - an owner
            owner = this;
            //atoms = null
            atomsBase = {};
            
            if(keyArgs.labelSep){
                this.labelSep = keyArgs.labelSep;
            }
            
            this.type = keyArgs.type || def.fail.argumentRequired('type');
            
            // Only owner datas cache selected datums
            this._selectedDatums = new def.Map();
        }
    }
    
    /*global data_syncDatumsState:true */
    data_syncDatumsState.call(this);
    
    // Must anticipate setting this (and not wait for the base constructor)
    // because otherwise new Dimension( ... ) fails.
    this.owner = owner;
    
    /* Need this because of null interning/uninterning and atoms chaining */
    this._atomsBase = atomsBase;
    
    this.type.dimensionsList().forEach(this._initDimension, this);
    
    // Call base constructors
    this.base(owner, atoms, atomsBase, /* wantLabel */ true);
    
    pv.Dom.Node.call(this, /* nodeValue */null); // TODO: remove this when possible
    
    delete this.nodeValue;
    
    this._children = this.childNodes; // pv.Dom.Node#childNodes
    
    // Build absolute label and key
    // The absolute key is relative to the root data (not the owner - the topmost root)
    if(parent){
        /*global data_addChild:true */
        data_addChild.call(parent, this);
        
        if(parent.absLabel){
            this.absLabel = def.string.join(owner.labelSep, parent.absLabel, this.label);
        } else {
            this.absLabel = this.label;
        }
        
        if(parent.absKey){
            this.absKey = def.string.join(",", parent.absKey, this.key);
        } else {
            this.absKey = this.key;
        }
    } else {
        this.absLabel = this.label;
        this.absKey   = this.key;
    }
})

// Mix pv.Dom.Node.prototype
.add(pv.Dom.Node)

.add(/** @lends pvc.data.Data# */{
    parent:       null,
    linkParent:   null,
    
    /**
     * The dimension instances of this data.
     * @type pvc.data.Dimension[]
     */
    _dimensions: null, 
    
    /**
     * The names of unbound dimensions.
     * @type string[]
     */
    _freeDimensionNames: null,
    
    /**
     * The child data instances of this data.
     * @type pvc.data.Data[]
     * @internal
     */
    _children: null,
    
    /**
     * The link child data instances of this data.
     * @type pvc.data.Data[]
     * @internal
     */
    _linkChildren: null,
    
    /**
     * The leaf data instances of this data.
     * 
     * @type pvc.data.Data[] 
     * @internal
     */
    _leafs: null,
    
    /** 
     * The map of child datas by their key.
     * 
     * @type string
     * @internal
     */
    _childrenByKey: null,
    
    /** 
     * The name of the dimension that children have as child key.
     * 
     * @type string
     * @internal
     */
    _childrenKeyDimName: null,
    
    /**
     * A map of visible datums indexed by id.
     * @type def.Map
     */
    _visibleDatums: null,
    
    /**
     * A map of selected datums indexed by id.
     * @type def.Map
     */
    _selectedDatums: null, 
    
    /**
     * Cache of link child data by grouping operation key.
     * @type object
     * @internal
     */
    _groupByCache: null,

    /**
     * An object with cached results of the {@link #dimensionsSumAbs} method.
     *
     * @type object
     */
    _sumAbsCache: null,

    /**
     * The height of the tree of datas headed by a root data.
     * Only defined in root datas. 
     */
    treeHeight: null,
    
    /** 
     * The datums of this data.
     * @type pvc.data.Datum[]
     * @internal
     */
    _datums: null,
    
    /** 
     * A map of the datums of this data indexed by id.
     * @type object
     * @internal
     */
    _datumsById: null, 
    
    depth:    0,
    label:    "",
    absLabel: "",
    
    /** 
     * Indicates if the object has been disposed.
     * 
     * @type boolean 
     */
    _disposed: false,
    
    /**
     * Indicates the data was a parent group in the flattening group operation.
     * 
     * @type boolean
     */
    _isFlattenGroup: false,
    
    _initDimension: function(dimType){
        this._dimensions[dimType.name] = 
                new pvc.data.Dimension(this, dimType);
    },
    
    /**
     * Obtains a dimension given its name.
     * 
     * <p>
     * If no name is specified,
     * a map with all dimensions indexed by name is returned.
     * Do <b>NOT</b> modify this map.
     * </p>
     * 
     * <p>
     * There is one dimension instance per 
     * dimension type of the data's complex type.
     * </p>
     * <p>
     * If this is not a root data,
     * the dimensions will be child dimensions of
     * the corresponding parent data's dimensions.
     * </p>
     * <p>
     * If this is a root data,
     * the dimensions will 
     * have no parent dimension, but instead, an owner dimension.
     * </p>
     * 
     * @param {string} [name] The dimension name.
     * @param {object} [keyArgs] Keyword arguments.
     * @param {string} [keyArgs.assertExists=true} Indicates that a missing child should be signaled as an error.
     * 
     * @type pvc.data.Dimension
     */
    dimensions: function(name, keyArgs){
        if(name == null) {
            return this._dimensions;
        }
        
        var dim = def.getOwn(this._dimensions, name);
        if(!dim && def.get(keyArgs, 'assertExists', true)) {
            throw def.error.argumentInvalid('name', "Undefined dimension '{0}'.", [name]); 
         }
         
         return dim;
    },
    
    /**
     * Obtains an array of the names of dimensions that are not bound in {@link #atoms}.
     * @type string[]
     */
    freeDimensionNames: function(){
        if(!this._freeDimensionNames) {
            var free = this._freeDimensionNames = [];
            def.eachOwn(this._dimensions, function(dim, dimName){
                var atom = this.atoms[dimName];
                if(!(atom instanceof pvc.data.Atom) || atom.value == null){
                    free.push(dimName);
                }
            }, this);
        }
        return this._freeDimensionNames;
    },
    
    /**
     * Indicates if the data is an owner.
     * 
     * @type boolean
     */
    isOwner: function(){
        return this.owner === this;
    },
    
    /**
     * Obtains an enumerable of the child data instances of this data.
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * @param {string} [keyArgs.key=null} The key of the desired child.
     * @param {string} [keyArgs.assertExists=true} Indicates that a missing child should be signaled as an error.
     * 
     * @type pvc.data.Data | def.Query
     */
    children: function(keyArgs){
        if(!this._children) {
            return def.query();
        }
        
        var key = def.get(keyArgs, 'key');
        if(key != null) {
            var child = def.getOwn(this._childrenByKey, key);
            if(!child && def.get(keyArgs, 'assertExists', true)) {
               throw def.error.argumentInvalid("Undefined child data with key '{0}'.", [key]); 
            }
            
            return child;
        }
        
        return def.query(this._children);
    },

    /**
     * Obtains the number of children.
     *
     * @type number
     */
    childCount: function(){
        return this._children ? this._children.length : 0;
    },

    /**
     * Obtains an enumerable of the leaf data instances of this data.
     * 
     * @type def.Query 
     */
    leafs: function(){
        return def.query(this._leafs);
    },

    /**
     * Disposes the child datas, the link child datas and the dimensions.
     */
    dispose: function(){
        if(!this._disposed){
            data_disposeChildLists.call(this);
            
            def.eachOwn(this._dimensions, function(dimension){ dimension.dispose(); });
            
            //  myself
            
            if(this.parent){
                this.parent.removeChild(this);
                this.parent = null;
            }
            
            if(this.linkParent) {
                /*global data_removeLinkChild:true */
                data_removeLinkChild.call(this.linkParent, this);
            }
            
            this._disposed = true;
        }
    }
});



/**
 * Disposes the child datas and the link child datas.
 * 
 * @name pvc.data.Data#_disposeChildLists
 * @function
 * @type undefined
 * @private
 */
function data_disposeChildLists() {
    /*global data_disposeChildList:true */
    data_disposeChildList(this._children,     'parent');
    data_disposeChildList(this._linkChildren, 'linkParent');
    
    this._childrenByKey = null;
    this._groupByCache  = null;
    
    if(this._selectedDatums) {
        this._selectedDatums.clear();
    }
}

/**
 * Called to assert that this is an owner data.
 *  
 * @private
 */
function data_assertIsOwner(){
    /*jshint expr:true */
    this.isOwner() || def.fail("Can only be called on the owner data.");
}
pvc.data.Data.add(/** @lends pvc.data.Data# */{
    /**
     * Loads or reloads the data with the specified enumerable of atoms.
     * 
     * <p>
     * Can only be called on an owner data. 
     * Child datas are instead "loaded" on construction, 
     * with a subset of its parent's datums.
     * </p>
     * 
     * <p>
     * This method was designed to be fed with the output
     * of {@link pvc.data.TranslationOper#execute}.
     * </p>
     * 
     * @param {def.Query} atomz An enumerable of {@link pvc.data.Atom[]}.
     * @param {object} [keyArgs] Keyword arguments.
     * @param {function} [keyArgs.isNull] Predicate that indicates if a datum is considered null.
     * @param {function} [keyArgs.where] Filter function that approves or excludes each newly read new datum.
     */
    load: function(atomz, keyArgs){
        /*global data_assertIsOwner:true */
        data_assertIsOwner.call(this);
        
        // TODO: Not guarding against re-entry during load
        var whereFun = def.get(keyArgs, 'where');
        var isNullFun = def.get(keyArgs, 'isNull');
        var isReload = !!this._datums;
        if(isReload) {
            // Dispose child and link child datas, and their dimensions...
            /*global data_disposeChildLists:true */
            data_disposeChildLists.call(this);
            
            this._datums = data_reloadDatums.call(this, atomz, whereFun, isNullFun);
            
        } else {
            this._datums = data_loadDatums.call(this, atomz, whereFun, isNullFun);
        }
        
        /*global data_syncDatumsState:true */
        data_syncDatumsState.call(this);
        
        // Allow dimensions to clear their caches
        if(isReload) {
            def.eachOwn(this._dimensions, function(dimension){
                /*global dim_onDatumsChanged:true */
                dim_onDatumsChanged.call(dimension);
            });
        }
        
        this._leafs = this._datums; // Share (only on owner)
    }
});

/**
 * Loads the specified enumerable of atoms.
 * 
 * @name pvc.data.Data#_loadDatums
 * @function
 * @param {def.Query} atomz An enumerable of {@link pvc.data.Atom[]}.
 * @param {function} [whereFun] Filter function that approves or excludes each newly read datum.
 * @param {function} [isNull] Predicate that indicates if a datum is considered null.
 * @returns {pvc.data.Datum[]} The loaded datums.
 * @private
 */
function data_loadDatums(atomz, whereFun, isNullFun) {
    
    // Atom garbage collection
    var dimNames = this.type.dimensionsNames(),
        visitedAtomsKeySetByDimension = pv.dict(dimNames, function(){ return {}; }),
        needGC = false;
    
    function createDatum(atoms){
        var datum = new pvc.data.Datum(this, atoms);
        if(isNullFun && isNullFun(datum)){
            datum.isNull = true;
        }
        
        if(whereFun && !whereFun(datum)){
            needGC = true;
            return null;
        }
        
        // Mark Really Used Atoms (includes null atoms)
        var datoms = datum.atoms;
        for(var dimName in datoms){
            var atom = datoms[dimName];
            if(atom){
                var dim = atom.dimension;
                if(dim._virtualNullAtom === atom){
                    /* This is a signal of a dimension for which there was 
                     * no configured reader, so nulls weren't read.
                     * We will register the real null, 
                     * and the virtual null atom will not show up again,
                     * because it appears through the prototype chain
                     * as a default value.
                     */
                    dim.intern(null);
                }
                
                visitedAtomsKeySetByDimension[dimName][atom.key] = true;
            }
        }
        
        return datum;
    }
    
    var datums = def.query(atomz)
          .select(createDatum, this)
          .where(def.notNully)
          .distinct(function(datum){ return datum.key; })
          .array();
    
    if(needGC){
        // Unintern unused atoms
        def.eachOwn(this._dimensions, function(dimension){
            var visitedAtomsKeySet = visitedAtomsKeySetByDimension[dimension.name];
            
            var uninternAtoms = dimension.atoms().filter(function(atom){
                    return !def.hasOwn(visitedAtomsKeySet, atom.key);
                });
            
            uninternAtoms.forEach(function(atom){
                /*global dim_unintern:true */
                dim_unintern.call(dimension, atom);
            });
        });
    }
    
    return datums;
}

/**
 * Loads the specified enumerable of atoms
 * joining them with existing loaded datums.
 * 
 * Datums that already exist are preserved
 * while those that are not added again are removed. 
 * 
 * @name pvc.data.Data#_reloadDatums
 * @function
 * @param {def.Query} atomz An enumerable of {@link pvc.data.Atom[]}.
 * @param {function} [whereFun] Filter function that approves or excludes each newly read new datum.
 * @param {function} [isNull] Predicate that indicates if a datum is considered null.
 * @returns {pvc.data.Datum[]} The loaded datums.
 * @private
 */
function data_reloadDatums(atomz, whereFun, isNullFun) {
    
    // Index existing datums by (semantic) key
    var datumsByKey = def.query(this._datums)
                         .uniqueIndex(function(datum){ return datum.key; });
        
    // Atom garbage collection
    var dimNames = this.type.dimensionsNames();
    
    // [atom.dimension.name][atom.key] -> true
    var visitedAtomsKeySetByDimension = pv.dict(dimNames, function(){ return {}; });
    
    function internDatum(atoms){
        var newDatum = new pvc.data.Datum(this, atoms);
        if(isNullFun && isNullFun(datum)){
            datum.isNull = true;
        }
        
        if(whereFun && !whereFun(newDatum)) {
            return null;
        }
        
        // Mark Really Used Atoms (includes null atoms)
        def.each(newDatum.atoms, function(atom){
            if(atom){
                var dim = atom.dimension;
                if(dim._virtualNullAtom === atom){
                    /* This is a signal of a dimension for which there was 
                     * no configured reader, so nulls weren't read.
                     * We will register the real null, 
                     * and the virtual null atom will not show up again,
                     * because it appears through the prototype chain
                     * as a default value.
                     */
                    dim.intern(null);
                }
                
                visitedAtomsKeySetByDimension[atom.dimension.name][atom.key] = true;
            }
        });
        
        
        /* Use already existing same-key datum, if any */
        var datum = datumsByKey[newDatum.key];
        if(!datum) {
            datumsByKey[newDatum.key] = datum = newDatum;
        }
        
        return datum;
    }
    
    var datums = def.query(atomz)
                    .select(internDatum, this)
                    .where(def.notNully)
                    .array();
    
    // Unintern unused atoms
    def.eachOwn(this._dimensions, function(dimension){
        var visitedAtomsKeySet = visitedAtomsKeySetByDimension[dimension.name];
        
        var uninternAtoms = dimension.atoms().filter(function(atom){
                return !def.hasOwn(visitedAtomsKeySet, atom.key);
            });
        
        uninternAtoms.forEach(function(atom){
            dim_unintern.call(dimension, atom);
        });
    });
    
    return datums;
}

/**
 * Adds a child data.
 * 
 * @name pvc.data.Data#_addChild
 * @function
 * @param {pvc.data.Data} child The child data to add.
 * @type undefined
 * @private
 */
function data_addChild(child){
    // this   -> ((pv.Dom.Node#)child).parentNode
    // child  -> ((pv.Dom.Node#)this).childNodes
    // ...
    this.appendChild(child);
    
    (this._childrenByKey || (this._childrenByKey = {}))[child.key] = child;
}

/**
 * Adds a link child data.
 * 
 * @name pvc.data.Data#_addLinkChild
 * @function
 * @param {pvc.data.Data} child The link child data to add.
 * @type undefined
 * @private
 */
function data_addLinkChild(linkChild){
    /*global data_addColChild:true */
    data_addColChild(this, '_linkChildren', linkChild, 'linkParent');
}

/**
 * Removes a link child data.
 *
 * @name pvc.data.Data#_removeLinkChild
 * @function
 * @param {pvc.data.Data} child The link child data to remove.
 * @type undefined
 * @private
 */
function data_removeLinkChild(linkChild){
    /*global data_removeColChild:true */
    data_removeColChild(this, '_linkChildren', linkChild, 'linkParent');
}
pvc.data.Data.add(/** @lends pvc.data.Data# */{
    /**
     * Obtains the number of selected datums.
     * <p>
     * This method is only optimized when called on an owner data.
     * </p>
     * 
     * @type Number
     */
    selectedCount: function(){
        if(!this.isOwner()){
            return this.datums(null, {selected: true}).count();
        }
        
        return this._selectedDatums.count;
    },
    
    /**
     * Obtains the selected datums, in an unspecified order.
     * <p>
     * If the datums should be sorted, 
     * they can be sorted by their {@link pvc.data.Datum#id}.
     * 
     * Alternatively, {@link #datums} can be called,
     * with the <tt>selected</tt> keyword argument.
     * </p>
     * @type pvc.data.Datum[]
     */
    selectedDatums: function(){
        if(!this.isOwner()){
            return this.datums(null, {selected: true}).array();
        }
        
        return this._selectedDatums.values();
    },
    
    /**
     * Obtains the number of visible datums.
     * 
     * @type Number
     */
    visibleCount: function(){
        return this._visibleDatums.count;
    },

    /**
     * Clears the selected state of any selected datum.
     * <p>
     * Can only be called on an owner data.
     * </p>
     * @param {pvc.data.Datum} [funFilter] Allows excluding atoms from the clear operation.
     * @returns {boolean} Returns <tt>true</tt> if any datum was selected and <tt>false</tt> otherwise. 
     */
    clearSelected: function(funFilter){
        /*global data_assertIsOwner:true */
        /*global datum_deselect:true */
        
        data_assertIsOwner.call(this);
        if(!this._selectedDatums.count) {
            return false;
        }
        
        var changed;
        if(funFilter){
            changed = false;
            this._selectedDatums
                .values()
                .filter(funFilter)
                .forEach(function(datum){
                    changed = true;
                    datum_deselect.call(datum);
                    this._selectedDatums.rem(datum.id);
                }, this);
        } else {
            changed = true;
            this._selectedDatums.values().forEach(function(datum){
                /*global datum_deselect:true */
                datum_deselect.call(datum);
            });
    
            this._selectedDatums.clear();
        }
        
        return changed;
    }
});

/**
 * Called by a datum on its owner data 
 * when its selected state changes.
 * 
 * @name pvc.data.Data#_onDatumSelectedChanged
 * @function
 * @param {pvc.data.Datum} datum The datum whose selected state changed.
 * @param {boolean} selected The new datum selected state.
 * @type undefined
 * @internal
 */
function data_onDatumSelectedChanged(datum, selected){
    // <Debug>
    /*jshint expr:true */
    !datum.isNull || def.assert("Null datums do not notify selected changes");
    // </Debug>
    
    if(selected){
        this._selectedDatums.set(datum.id, datum);
    } else {
        this._selectedDatums.rem(datum.id);
    }

    this._sumAbsCache = null;
}

/**
 * Called by a datum on its owner data 
 * when its visible state changes.
 * 
 * @name pvc.data.Data#_onDatumVisibleChanged
 * @function
 * @param {pvc.data.Datum} datum The datum whose visible state changed.
 * @param {boolean} selected The new datum visible state.
 * @type undefined
 * @internal
 */
function data_onDatumVisibleChanged(datum, visible){
    if(def.hasOwn(this._datumsById, datum.id)) {
        
        // <Debug>
        /*jshint expr:true */
        !datum.isNull || def.assert("Null datums do not notify visible changes");
        // </Debug>
        
        if(visible){
            this._visibleDatums.set(datum.id, datum);
        } else {
            this._visibleDatums.rem(datum.id);
        }
        
        this._sumAbsCache = null;

        // Notify dimensions
        def.eachOwn(this._dimensions, function(dimension){
            /*global dim_onDatumVisibleChanged:true */
            dim_onDatumVisibleChanged.call(dimension, datum, visible);
        });
        
        // Notify child and link child datas
        this._children.forEach(function(data){
            data_onDatumVisibleChanged.call(data, datum, visible);
        });
        
        if(this._linkChildren) {
            this._linkChildren.forEach(function(data){
                data_onDatumVisibleChanged.call(data, datum, visible);
            });
        }
    }
}

/**
 * Called after loading or reloading datums to 
 * calculate selected, visible datums and index them by id.
 * 
 * @name pvc.data.Data#_syncDatumsState
 * @function
 * @type undefined
 * @private
 * @internal
 */
function data_syncDatumsState(){
    if(this._selectedDatums) { this._selectedDatums.clear(); }
    this._visibleDatums.clear();
    this._datumsById = {};
    this._sumAbsCache = null;
    
    if(this._datums) {
        this._datums.forEach(data_onReceiveDatum, this);
    }
}

/**
 * Called to add a datum to the data.
 * The datum is only added if it is not present yet.
 * 
 * Used when synchonizing datum state, after a load,
 * or by the group operation.
 *
 * @name pvc.data.Data#_addDatum
 * @function
 * @param {pvc.data.Datum} datum The datum to add.
 * @type undefined
 * @private
 * @internal
 */
function data_addDatum(datum){
    if(!def.hasOwn(this._datumsById, datum.id)){
        this._datums.push(datum);
        data_onReceiveDatum.call(this, datum);
    }
}

/**
 * Accounts for an datum that has been added to the datums list.
 * Used when synchonizing datum state, after a load,
 * and by the group operation.
 *
 * @name pvc.data.Data#_onReceiveDatum
 * @function
 * @param {pvc.data.Datum} datum The datum to add.
 * @type undefined
 * @private
 * @internal
 */
function data_onReceiveDatum(datum){
    var id = datum.id;
    this._datumsById[id] = datum;
    
    if(!datum.isNull){
        var selectedDatums;
        if(datum.isSelected && (selectedDatums = this._selectedDatums)) {
            selectedDatums.set(id, datum);
        }
    
        if(datum.isVisible) {
            this._visibleDatums.set(id, datum);
        }
    }
}

/**
 * Sets the selected state of the given datums
 * to the state 'select'.
 * 
 * @param {def.Query} datums An enumerable of {@link pvc.data.Datum} to set.
 * @param {boolean} selected The desired selected state.
 * 
 * @returns {boolean} true if at least one datum changed its selected state.
 * @static
 */
pvc.data.Data.setSelected = function(datums, selected){
    var anyChanged = false;

    if(datums){
        def.query(datums).each(function(datum){
            if(datum.setSelected(selected)){
                // data_onDatumSelectedChanged has already been called
                anyChanged = true;
            }
        });
    }

    return anyChanged;
};

/**
 * Pseudo-toggles the selected state of the given datums.
 * If all are selected, clears their selected state.
 * Otherwise, selects all.
 * 
 * @param {def.Query} datums An enumerable of {@link pvc.data.Datum} to toggle.
 * 
 * @returns {boolean} true if at least one datum changed its selected state.
 * @static
 */
pvc.data.Data.toggleSelected = function(datums){
    if(!def.array.isLike(datums)){
        datums = def.query(datums).array();
    }
    
    // Ensure null datums don't affect the result
    var allSelected = def.query(datums).all(function(datum){ return datum.isNull || datum.isSelected; });
    return this.setSelected(datums, !allSelected);
};

/**
 * Sets the visible state of the given datums
 * to the state 'visible'.
 * 
 * @param {def.Query} datums An enumerable of {@link pvc.data.Datum} to set.
 * @param {boolean} visible The desired visible state.
 * 
 * @returns {boolean} true if at least one datum changed its visible state.
 * @static
 */
pvc.data.Data.setVisible = function(datums, visible){
    var anyChanged = false;

    if(datums){
        def.query(datums).each(function(datum){
            if(datum.setVisible(visible)){
                // data_onDatumVisibleChanged has already been called
                anyChanged = true;
            }
        });
    }

    return anyChanged;
};

/**
 * Pseudo-toggles the visible state of the given datums.
 * If all are visible, hides them.
 * Otherwise, shows them all.
 * 
 * @param {def.Query} datums An enumerable of {@link pvc.data.Datum} to toggle.
 * 
 * @returns {boolean} true if at least one datum changed its visible state.
 * @static
 */
pvc.data.Data.toggleVisible = function(datums){
    if(!def.array.isLike(datums)){
        datums = def.query(datums).array();
    }
    
    // Ensure null datums don't affect the result (null datums are always visible)
    var allVisible = def.query(datums).all(function(datum){ return datum.isVisible; });
    return pvc.data.Data.setVisible(datums, !allVisible);
};

/**
 * Initializes a grouping specification.
 * 
 * <p>
 * A grouping specification contains information similar to that of an SQL 'order by' clause.
 * </p>
 * 
 * <p>
 * A grouping specification supports the grouping operation.
 * </p>
 * 
 * @see pvc.data.GroupingOper
 * 
 * @name pvc.data.GroupingSpec
 * 
 * @class Contains information about a grouping operation.
 * 
 * @property {string} id A <i>semantic</i> identifier of this grouping specification.
 * @property {boolean} isSingleDimension Indicates that there is only one level and dimension.
 * @property {boolean} isSingleLevel Indicates that there is only one level.
 * @property {boolean} hasCompositeLevels Indicates that there is at least one level with more than one dimension.
 * @property {pvc.data.ComplexType} type The complex type against which dimension names were resolved.
 * @property {pvc.data.GroupingLevelSpec} levels An array of level specifications.
 * @property {pvc.data.DimensionType} firstDimension The first dimension type, if any.
 * @property {string} flatteningMode Indicates if the grouping is
 * flattened using pre or post order depth-first search.
 * Possible values are <tt>null</tt>, <tt>'tree-pre'</tt> and <tt>'tree-post'</tt>.
 * @property {string} flattenRootLabel The label of the root node of a flattening operation.
 *
 * @constructor
 * @param {def.Query} levelSpecs An enumerable of {@link pvc.data.GroupingLevelSpec}.
 * @param {pvc.data.ComplexType} [type] A complex type.
 * @param {object} [keyArgs] Keyword arguments.
 * @param {string} [keyArgs.flatteningMode=null] The flattening mode.
 * @param {string} [keyArgs.flattenRootLabel=''] The label of the root node of a flattening operation.
 */
def.type('pvc.data.GroupingSpec')
.init(function(levelSpecs, type, keyArgs){
    this.type = type || null;
    
    var ids = [];
    
    this.hasCompositeLevels = false;
    
    this.levels = def.query(levelSpecs || undefined) // -> null query
        .where(function(levelSpec){ return levelSpec.dimensions.length > 0; })
        .select(function(levelSpec){
            ids.push(levelSpec.id);
            
            if(!this.hasCompositeLevels && levelSpec.dimensions.length > 1) {
                this.hasCompositeLevels = true;
            }
            
            return levelSpec;
        }, this)
        .array();

    // The null grouping has zero levels
    this.depth             = this.levels.length;
    this.isSingleLevel     = this.depth === 1;
    this.isSingleDimension = this.isSingleLevel && !this.hasCompositeLevels;
    this.firstDimension    = this.depth > 0 ? this.levels[0].dimensions[0] : null;
    
    this.flatteningMode   = def.get(keyArgs, 'flatteningMode'  ) || null;
    this.flattenRootLabel = def.get(keyArgs, 'flattenRootLabel') || '';
    
    this.id = (this.flatteningMode || '') + "##" +
              this.flattenRootLabel + "##" +
              ids.join('||');
})
.add(/** @lends pvc.data.GroupingSpec# */{
    /**
     * Late binds a grouping specification to a complex type.
     * @param {pvc.data.ComplexType} type A complex type.
     */
    bind: function(type){
        this.type = type || def.fail.argumentRequired('type');
        this.dimensions().each(function(dimSpec){
            dimSpec.bind(type);
        });
    },

    /**
     * Obtains an enumerable of the contained dimension specifications.
     * @type def.Query
     */
    dimensions: function(){
        return def.query(this.levels)
                  .selectMany(function(level){ return level.dimensions; });
    },

    dimensionNames: function(){
        if(!this._dimNames){
            this._dimNames = this.dimensions()
                                 .select(function(dimSpec){ return dimSpec.name; })
                                 .array();
        }
        
        return this._dimNames;
    },
    
    view: function(complex){
        return complex.view(this.dimensionNames());
    },

    /**
     * Indicates if the data resulting from the grouping is discrete or continuous.
     * @type boolean
     */
    isDiscrete: function(){
        return !this.isSingleDimension || this.firstDimension.type.isDiscrete;
    },

    /**
     * Indicates if the grouping has no levels.
     * @type boolean
     */
    isNull: function(){
        return !this.levels.length;
    },

    /**
     * Obtains a version of this grouping specification
     * that conforms to the specified arguments.
     *
     * @param {string} [keyArgs.flatteningMode] The desired flatening mode.
     * Supports the value 'singleLevel' as a way to signify the same as
     * what the method {@link #singleLevelGrouping} does.
     *
     * @param {boolean} [keyArgs.reverse=false] Indicates that each dimension's order should be reversed.
     * @type pvc.data.GroupingSpec
     */
    ensure: function(keyArgs){
        var grouping = this,
            flatteningMode = def.get(keyArgs, 'flatteningMode');

        if(flatteningMode){
            if(flatteningMode === 'singleLevel'){
                // Supports reverse
                return grouping.singleLevelGrouping(keyArgs);
            }

            var flattenRootLabel = def.get(keyArgs, 'flattenRootLabel') || '';
            if(this.flatteningMode !== flatteningMode || (this.flattenRootLabel !== flattenRootLabel)){
                grouping = new pvc.data.GroupingSpec(grouping.levels, grouping.type, {
                    flatteningMode:   flatteningMode,
                    flattenRootLabel: flattenRootLabel
                });
            }
        }

        if (def.get(keyArgs, 'reverse', false)){
            grouping = grouping.reversed();
        }

        return grouping;
    },

    /**
     * Obtains a single-level version of this grouping specification.
     * 
     * <p>
     * If this grouping specification is itself single-level, 
     * then it is returned.
     * </p> 
     * 
     * @param {object} [keyArgs] Keyword arguments
     * @param {boolean} [keyArgs.reverse=false] Indicates that each dimension's order should be reversed.
     * @type pvc.data.GroupingSpec 
     */
    singleLevelGrouping: function(keyArgs){
        var reverse = !!def.get(keyArgs, 'reverse', false);
        if(this.isSingleLevel && !reverse) {
            return this;
        }
        
        /*jshint expr:true */
        this._singleLevelGrouping || (this._singleLevelGrouping = {});
        
        var singleLevel = this._singleLevelGrouping[reverse];
        if(!singleLevel) {
            var dimSpecs = this.dimensions()
                            .select(function(dimSpec){
                                return reverse ? 
                                    new pvc.data.GroupingDimensionSpec(dimSpec.name, !dimSpec.reverse, dimSpec.type.complexType) :
                                    dimSpec;
                            });
                            
            var levelSpec = new pvc.data.GroupingLevelSpec(dimSpecs);
            
            singleLevel = new pvc.data.GroupingSpec([levelSpec], this.type, {flatteningMode: this.flatteningMode});
            
            this._singleLevelGrouping[reverse] = singleLevel;
        }
        
        return singleLevel;
    },
    
    /**
     * Obtains a reversed version of this grouping specification.
     * 
     * @type pvc.data.GroupingSpec 
     */
    reversed: function(){
        var reverseGrouping = this._reverseGrouping;
        if(!reverseGrouping) {
            
            var levelSpecs = def.query(this.levels)
                    .select(function(levelSpec){
                        var dimSpecs = def.query(levelSpec.dimensions)
                                .select(function(dimSpec){
                                    return new pvc.data.GroupingDimensionSpec(dimSpec.name, !dimSpec.reverse, dimSpec.type.complexType);
                                });
                        
                        return new pvc.data.GroupingLevelSpec(dimSpecs);
                    });

            reverseGrouping = new pvc.data.GroupingSpec(levelSpecs, this.type, {flatteningMode: this.flatteningMode});
            
            this._reverseGrouping = reverseGrouping;
        }
        
        return reverseGrouping;
    },

    toString: function(){
        return def.query(this.levels)
                .select(function(level){ return '' + level; })
                .array()
                .join(', ');
    }
});

def.type('pvc.data.GroupingLevelSpec')
.init(function(dimSpecs){
    var ids = [];
    
    this.dimensions = def.query(dimSpecs)
       .select(function(dimSpec){
           ids.push(dimSpec.id);
           return dimSpec;
       })
       .array();
    
    this.id = ids.join(',');
    this.depth = this.dimensions.length;
    
    var me = this;
    this.comparer = function(a, b){ return me.compare(a, b); };
})
.add( /** @lends pvc.data.GroupingLevelSpec */{
    compare: function(a, b){
        for(var i = 0, D = this.depth ; i < D ; i++) {  
            var result = this.dimensions[i].compareDatums(a, b);
            if(result !== 0) {
                return result;
            }
        }
        
        return 0;
    },
    
    key: function(datum){
        var keys  = [];
        var atoms = [];
        var datoms = datum.atoms;
        var dims  = this.dimensions;
        
        for(var i = 0, D = this.depth  ; i < D ; i++) {
            var atom = datoms[dims[i].name];
            atoms.push(atom);
            keys.push(atom.globalKey);
        }
        
        return {
            key:   keys.join(','),
            atoms: atoms
        };
    },

    toString: function(){
        return def.query(this.dimensions)
                .select(function(dimSpec){ return '' + dimSpec; })
                .array()
                .join('|');
    }
});

def.type('pvc.data.GroupingDimensionSpec')
.init(function(name, reverse, type){
    this.name     = name;
    this.reverse  = !!reverse;
    this.id = this.name + ":" + (this.reverse ? '0' : '1');
    if(type){
        this.bind(type);
    }
})
.add( /** @lends pvc.data.GroupingDimensionSpec */ {
    type: null,
    comparer: null,

    /**
     * Late binds a dimension specification to a complex type.
     * @param {pvc.data.ComplexType} type A complex type.
     */
    bind: function(type){
        /*jshint expr:true */
        type || def.fail.argumentRequired('type');
        
        this.type     = type.dimensions(this.name);
        this.comparer = this.type.atomComparer(this.reverse);
    },

    compareDatums: function(a, b){
        //if(this.type.isComparable) {
            var result  = this.comparer(a.atoms[this.name], b.atoms[this.name]);
            if(result !== 0) {
                return result;
            }
            return 0;
        //}
        
        // Use datum source order
        //return this.reverse ? (b.id - a.id) : (a.id - b.id);
    },

    toString: function(){
        return this.name + (this.reverse ? ' desc' : '');
    }
});

/**
 * Parses a grouping specification string.
 * 
 * @param {string|string[]} [specText] The grouping specification text,
 * or array of grouping specification level text.
 * When unspecified, a null grouping is returned.
 * 
 * <p>
 * An example:
 * </p>
 * <pre>
 * "series1 asc, series2 desc, category"
 * </pre>
 * <p>
 * The following will group all the 'series' in one level and the 'category' in another: 
 * </p>
 * <pre>
 * "series1 asc|series2 desc, category"
 * </pre>
 * 
 * @param {pvc.data.ComplexType} [type] A complex type against which to resolve dimension names.
 * 
 * @type pvc.data.GroupingSpec
 */
pvc.data.GroupingSpec.parse = function(specText, type){
    if(!specText){
        return new pvc.data.GroupingSpec(null, type);
    }
    
    var levels;
    if(def.array.is(specText)) {
        levels = specText;
    } else if(def.string.is(specText)) {
        levels = specText.split(/\s*,\s*/); 
    }

    var levelSpecs = def.query(levels)
               .select(function(levelText){
                   var dimSpecs = groupSpec_parseGroupingLevel(levelText, type);
                   return new pvc.data.GroupingLevelSpec(dimSpecs);
               });
    
    return new pvc.data.GroupingSpec(levelSpecs, type);
};

/**
 * Creates a combined grouping specification.
 *
 * <p>
 * TODO:
 * If all the specified grouping specifications have the same flattening mode
 * then each of the specified is destructured into a single grouping level.
 *
 * Otherwise, a composite grouping specification is returned.
 * </p>
 * 
 * @param {pvc.data.GroupingSpec[]} groupings An enumerable of grouping specifications.
 * @param {object} [keyArgs] Keyword arguments
 * @param {boolean} [keyArgs.reverse=false] Indicates that each dimension's order should be reversed.
 * 
 * @type pvc.data.GroupingSpec
 
pvc.data.GroupingSpec.multiple = function(groupings, keyArgs){
    var reverse = !!def.get(keyArgs, 'reverse', false);
    var type = null;
    
    // One level per specified grouping
    var levelSpecs = def.query(groupings)
           .select(function(grouping){
               var dimSpecs = grouping.dimensions().select(function(dimSpec){
                       var asc = (dimSpec.reverse === reverse);
                       if(!type) {
                           type = dimSpec.type.complexType;
                       } else if(type !== dimSpec.type.complexType) {
                           throw def.error.operationInvalid("Multiple groupings must have the same complex type.");
                       }
                       
                       return new pvc.data.GroupingDimensionSpec(dimSpec.name, !asc, dimSpec.type.complexType);
                   });
               
               return new pvc.data.GroupingLevelSpec(dimSpecs);
           })
           .array();
    
    return type ? new pvc.data.GroupingSpec(levelSpecs, type) : null;
};
*/

var groupSpec_matchDimSpec = /^\s*(.+?)(?:\s+(asc|desc))?\s*$/i;

/**
 * @private
 * @static
 */
function groupSpec_parseGroupingLevel(groupLevelText, type) {
    /*jshint expr:true */
    def.string.is(groupLevelText) || def.fail.argumentInvalid('groupLevelText', "Invalid grouping specification.");
    
    return def.query(groupLevelText.split(/\s*\|\s*/))
       .where(def.truthy)
       .select(function(dimSpecText){
            var match   = groupSpec_matchDimSpec.exec(dimSpecText) ||
                            def.fail.argumentInvalid('groupLevelText', "Invalid grouping level syntax '{0}'.", [dimSpecText]),
                name    = match[1],
                order   = (match[2] || '').toLowerCase(),
                reverse = order === 'desc';
               
            var dimSpec = new pvc.data.GroupingDimensionSpec(name, reverse, type);
            return dimSpec;
        });
}
/**
 * Initializes a data operation.
 * 
 * @name pvc.data.DataOper
 * 
 * @class The base abstract class for a data operation.
 * Performs an initial query on the datums of the opertion's link parent
 * and hands the final implementation to a derived class.
 * 
 * @property {string} key Set on construction with a value that identifies the operation.
 * 
 * @constructor
 *
 * @param {pvc.data.Data} linkParent The link parent data.
 * @param {object} [keyArgs] Keyword arguments.
 */
def.type('pvc.data.DataOper')
.init(function(linkParent, keyArgs){
    this._linkParent = linkParent;
}).
add(/** @lends pvc.data.DataOper */{
    
    key: null,

    /**
     * Performs the data operation.
     * 
     * @returns {pvc.data.Data} The resulting root data.
     */
    execute: def.method({isAbstract: true})
});

/**
 * Initializes a grouping operation.
 * 
 * @name pvc.data.GroupingOper
 * 
 * @class Performs one grouping operation according to a grouping specification.
 * @extends pvc.data.DataOper
 * 
 * @constructor
 *
 * @param {pvc.data.Data} linkParent The link parent data.
 * 
 * @param {string|string[]|pvc.data.GroupingSpec|pvc.data.GroupingSpec[]} groupingSpecs A grouping specification as a string, an object or array of either.
 * 
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.data.DataOper} for any additional arguments.
 * 
 * @param {boolean} [keyArgs.isNull=null]
 *      Only considers datums with the specified isNull attribute.
 * @param {boolean} [keyArgs.visible=null]
 *      Only considers datums that have the specified visible state.
 * @param {boolean} [keyArgs.selected=null]
 *      Only considers datums that have the specified selected state.
 * @param {function} [keyArgs.where] A datum predicate.
 * @param {string} [keyArgs.whereKey] A key for the specified datum predicate,
 * previously returned by this function.
 * <p>
 * If this argument is specified, and it is not the value <c>null</c>,
 * it can be used to cache results.
 * If this argument is specified, and it is the value <c>null</c>,
 * the results are not cached.
 * If it is not specified, and <tt>keyArgs</tt> is specified,
 * one is returned.
 * If it is not specified and <tt>keyArgs</tt> is not specified,
 * then the instance will have a null {@link #key} property value.
 * </p>
 * <p>
 * If a key not previously returned by this operation is specified,
 * then it should be prefixed with a "_" character,
 * in order to not collide with keys generated internally.
 * </p>
 */
def.type('pvc.data.GroupingOper', pvc.data.DataOper)
.init(function(linkParent, groupingSpecs, keyArgs){
    /* Grouping spec may be specified as text or object */
    /*jshint expr:true */
    groupingSpecs || def.fail.argumentRequired('groupingSpecs');

    this.base(linkParent, keyArgs);

    this._where      = def.get(keyArgs, 'where');
    this._visible    = def.get(keyArgs, 'visible',  null);
    this._selected   = def.get(keyArgs, 'selected', null);
    this._isNull     = def.get(keyArgs, 'isNull',   null);
        
    /* 'Where' predicate and its key */
    var hasKey = this._selected == null, // TODO: Selected state changes do not yet invalidate cache...
        whereKey = '';
    if(this._where){
        whereKey = def.get(keyArgs, 'whereKey');
        if(!whereKey){
            if(!keyArgs || whereKey === null){
                // Force no key
                hasKey = false;
            } else {
                whereKey = '' + def.nextId('dataOperWhereKey');
                keyArgs.whereKey = whereKey;
            }
        }
    }

    // grouping spec ids is semantic keys, although the name is not 'key'
    var ids = [];
    this._groupSpecs = def.array.as(groupingSpecs).map(function(groupSpec){
        if(groupSpec instanceof pvc.data.GroupingSpec) {
            if(groupSpec.type !== linkParent.type) {
                throw def.error.argumentInvalid('groupingSpecText', "Invalid associated complex type.");
            }
        } else {
            // Must be a non-empty string, or throws
            groupSpec = pvc.data.GroupingSpec.parse(groupSpec, linkParent.type);
        }
        
        ids.push(groupSpec.id);

        return groupSpec;
    });
    
    /* Operation key */
    if(hasKey){
        this.key = ids.join('!!') +
                   "||visible:"  + this._visible +
                   "||isNull:"   + this._isNull  +
                   //"||selected:" + this._selected +
                   "||where:"    + whereKey;
    }
}).
add(/** @lends pvc.data.GroupingOper */{

    /**
     * Performs the grouping operation.
     *
     * @returns {pvc.data.Data} The resulting root data.
     */
    execute: function(){
        /* Setup a priori datum filters */
        
        /*global data_whereState: true */
        var datumsQuery = data_whereState(def.query(this._linkParent._datums), {
            visible:  this._visible,
            selected: this._selected,
            isNull:   this._isNull,
            where:    this._where
        });
        
        /* Group datums */
        var rootNode = this._group(datumsQuery);

        /* Render node into a data */
        return this._generateData(rootNode, this._linkParent);
    },

    _group: function(datumsQuery){

        // Create the root node
        var root = {
            isRoot:     true,
            treeHeight: def.query(this._groupSpecs)
                           .select(function(spec){
                               var levelCount = spec.levels.length;
                               if(!levelCount) { return 0; }
                               return !!spec.flatteningMode ? 1 : levelCount;
                           })
                           .reduce(def.add, 0),
            datums:   []
            // children
            // atoms       // not on root
            // childrenKeyDimName // not on leafs
            // isFlattenGroup // on parents of a flattened group spec
        };

        if(root.treeHeight > 0){
            this._groupSpecRecursive(root, datumsQuery, 0);
        }
        
        return root;
    },

    _groupSpecRecursive: function(specParent, specDatums, specIndex){
        var groupSpec  = this._groupSpecs[specIndex],
            levelSpecs = groupSpec.levels,
            D = levelSpecs.length,
            nextSpecIndex = specIndex + 1,
            isLastSpec  = !(nextSpecIndex < this._groupSpecs.length),
            doFlatten   = !!groupSpec.flatteningMode,
            isPostOrder = doFlatten && (groupSpec.flatteningMode === 'tree-post'),
            specGroupParent;

        // <Debug>
        /*jshint expr:true */
        D || def.fail.operationInvalid("Must have levels");
        // </Debug>
        
        if(doFlatten){
            specParent.children = [];
            specParent.childrenByKey = {}; // Don't create children with equal keys
            
            // Must create a root for the grouping operation
            // Cannot be specParent
            specGroupParent = {
                key:    '',
                atoms:  [],
                datums: [],
                label:  groupSpec.flattenRootLabel
            };

            if(!isPostOrder){
                specParent.children.push(specGroupParent);
                specParent.childrenByKey[''] = specGroupParent;
            }
        } else {
            specGroupParent = specParent;
        }

        /* Group datums */
        groupLevelRecursive.call(this, specGroupParent, specDatums, 0);

        if(doFlatten){

            if(isPostOrder){
                specParent.children.push(specGroupParent);
            }

            // Add datums of specGroupParent to specParent.
            specParent.datums = specGroupParent.datums;
        }
            
        function groupLevelRecursive(groupParent, datums, specDepth){
            var levelSpec = levelSpecs[specDepth],

                groupChildren = [],
                
                // The first datum of each group is inserted here in order,
                // according to level's comparer
                firstDatums = [],

                // The first group info is inserted here at the same index
                // as the first datum.
                // At the end, one child data is created per groupInfo,
                // in the same order.
                groupInfos  = [],

                // group key -> datums, in given datums argument order
                datumsByKey = {};

            if(!doFlatten){
                groupParent.children = [];

                // TODO: Really ugly....
                // This is to support single-dimension grouping specifications used
                // internally by the "where" operation. See #data_whereDatumFilter
                groupParent.childrenKeyDimName = levelSpec.dimensions[0].name;
            }
            
            // Group, and possibly filter, received datums on level's key
            def.query(datums).each(function(datum){
                var groupInfo = levelSpec.key(datum);
                if(groupInfo != null){ // null means skip the datum
                    /* Datum passes to children, but may still be filtered downstream */
                    var key = groupInfo.key,
                        keyDatums = datumsByKey[key];

                    if(keyDatums){
                        keyDatums.push(datum);
                    } else {
                        // First datum with key -> new group
                        keyDatums = datumsByKey[key] = [datum];

                        groupInfo.datums = keyDatums;

                        var datumIndex = def.array.insert(firstDatums, datum, levelSpec.comparer);
                        def.array.insertAt(groupInfos, ~datumIndex, groupInfo);
                    }
                }
            }, this);

            // Create 1 child node per created groupInfo, in same order as these.
            // Further group each child node, on next grouping level, recursively.
            var isLastSpecLevel = specDepth === D - 1;
                
            groupInfos.forEach(function(groupInfo){
                var child = Object.create(groupInfo);
                /*
                 * On all but the last level,
                 * datums are only added to *child* at the end of the
                 * following recursive call,
                 * to the "union" of the datums of its own children.
                 */
                child.datums = isLastSpec && isLastSpecLevel ? groupInfo.datums : [];

                var key;
                if(!doFlatten){
                    groupParent.children.push(child);
                } else {
                    // Atoms must contain those of the groupParent
                    child.atoms = groupParent.atoms.concat(child.atoms);

                    /* A key that does not include null atoms */
                    key = def.query(child.atoms)
                             .where (function(atom){ return atom.value != null; })
                             .select(function(atom){ return atom.globalKey;   })
                             .array()
                             .join(',')
                             ;

                    if(def.hasOwn(specParent.childrenByKey, key)){
                        // Duplicate key
                        // We need datums added to parent anyway
                        groupChildren.push({datums: groupInfo.datums});
                        return;
                    }

                    if(!isPostOrder){
                        specParent.children.push(child);
                        specParent.childrenByKey[key] = child;

                        groupParent.isFlattenGroup = true;
                    }
                }
                
                if(!isLastSpecLevel){
                    groupLevelRecursive.call(this, child, groupInfo.datums, specDepth + 1);
                } else if(!isLastSpec) {
                    this._groupSpecRecursive(child, groupInfo.datums, nextSpecIndex);
                }

                // Datums already added to 'child'.

                groupChildren.push(child);

                if(doFlatten && isPostOrder){
                    specParent.children.push(child);
                    specParent.childrenByKey[key] = child;

                    groupParent.isFlattenGroup = true;
                }
            }, this);

            var willRecurseParent = doFlatten && !isLastSpec;

            datums = willRecurseParent ? [] : groupParent.datums;

            // Add datums of chidren to groupParent.
            // This accounts for possibly excluded datums,
            // in any of the below levels (due to null atoms).
            // TODO: This method changes the order of preserved datums to
            //       follow the grouping "pattern". Is this OK?
            groupChildren.forEach(function(child){
                def.array.append(datums, child.datums);
            });
            
            if(willRecurseParent) {
                /* datums can no longer change */
                this._groupSpecRecursive(groupParent, datums, nextSpecIndex);
            }
            
            return groupChildren;
        }
    },

    _generateData: function(node, parentData){
        var data;
        if(node.isRoot){
            // Root node
            // Create a *linked* root data
            data = new pvc.data.Data({
                linkParent: parentData,
                datums:     node.datums
            });
            
            data.treeHeight = node.treeHeight;
        } else {
            data = new pvc.data.Data({
                parent: parentData,
                atoms:  node.atoms,
                datums: node.datums
            });
        }

        if(node.isFlattenGroup){
            data._isFlattenGroup = true;
            var label = node.label;
            if(label){
                data.label    += label;
                data.absLabel += label;
            }
        }

        var childNodes = node.children;
        if(childNodes && childNodes.length){
            // TODO: ...
            data._childrenKeyDimName = node.childrenKeyDimName;
            
            childNodes.forEach(function(childNode){
                this._generateData(childNode, data);
            }, this);

        } else if(!node.isRoot){
            // A leaf node
            var leafs = data.root._leafs;
            data.leafIndex = leafs.length;
            leafs.push(data);
        }
        
        return data;
    }
});
pvc.data.Data.add(/** @lends pvc.data.Data# */{
    /**
     * Obtains the number of contained datums.
     * @type number
     */
    count: function(){
        return this._datums.length;
    },
    
    /**
     * Groups the datums of this data, possibly filtered,
     * according to a grouping specification.
     * 
     * <p>
     * The result of the grouping operation over a set of datums
     * is a new <i>linked child</i> data.
     * 
     * It is a root data, 
     * but shares the same {@link #owner} and {@link #atoms} with this,
     * and has the considered datums in {@link #datums}.
     * 
     * The data will contain one child data per distinct atom,
     * of the first grouping level dimension, 
     * found in the datums.
     * Each child data will contain the datums sharing that atom.
     * 
     * This logic extends to all following grouping levels.
     * </p>
     * 
     * <p>
     * Datums with null atoms on a grouping level dimension are excluded.
     * </p>
     * 
     * @param {string|string[]|pvc.data.GroupingOperSpec} groupingSpecText A grouping specification string or object.
     * <pre>
     * "series1 asc, series2 desc, category"
     * </pre>
     * 
     * @param {Object} [keyArgs] Keyword arguments object.
     * See additional keyword arguments in {@link pvc.data.GroupingOper}
     * 
     * @see #where
     * @see pvc.data.GroupingLevelSpec
     *
     * @returns {pvc.data.Data} The resulting root data.
     */
    groupBy: function(groupingSpecText, keyArgs){
        var groupOper = new pvc.data.GroupingOper(this, groupingSpecText, keyArgs),
            cacheKey  = groupOper.key,
            groupByCache,
            data;

        if(cacheKey){
            groupByCache = this._groupByCache;

            // Check cache for a linked data with that key
            data = groupByCache && groupByCache[cacheKey];
        }

        if(!data) {
            if(pvc.debug >= 7){
                pvc.log("[GroupBy] " + (cacheKey ? ("Cache key not found: '" + cacheKey + "'") : "No Cache key"));
            }
            
            data = groupOper.execute();

            if(cacheKey){
                (groupByCache || (this._groupByCache = {}))[cacheKey] = data;
            }
        } else if(pvc.debug >= 7){
            pvc.log("[GroupBy] Cache key hit '" + cacheKey + "'");
        }
        
        return data;
    },

    flattenBy: function(role, keyArgs){
        var grouping = role.flattenedGrouping(keyArgs) || 
                       def.fail.operationInvalid("Role is unbound.");
        
        return this.groupBy(grouping, keyArgs);
    },
    
    /**
     * Creates a linked data with the result of filtering
     * the datums of this data.
     *
     * <p>
     * This operation differs from {@link #datums} only in the type of output,
     * which is a new linked data, instead of an enumerable of the filtered datums.
     * See {@link #datums} for more information on the filtering operation.
     * </p>
     *
     * @param {object} [whereSpec] A "where" specification.
     * @param {object} [keyArgs] Keyword arguments object.
     * See {@link #datums} for information on available keyword arguments.
     *
     * @returns {pvc.data.Data} A linked data containing the filtered datums.
     */
    where: function(whereSpec, keyArgs){
        var datums = this.datums(whereSpec, keyArgs).array();
        return new pvc.data.Data({linkParent: this, datums: datums});
    },

    /**
     * Obtains the datums of this data, 
     * possibly filtered according 
     * to a specified "where" specification,
     * datum selected state and 
     * filtered atom visible state.
     *
     * @param {object} [whereSpec] A "where" specification.
     * A structure with the following form:
     * <pre>
     * // OR of datum filters
     * whereSpec = [datumFilter1, datumFilter2, ...] | datumFilter;
     * 
     * // AND of dimension filters
     * datumFilter = {
     *      // OR of dimension values
     *      dimName1: [value1, value2, ...],
     *      dimName2: value1,
     *      ...
     * }
     * </pre>
     * <p>Values of a datum filter can also directly be atoms.</p>
     * <p>
     *    An example of a "where" specification:
     * </p>
     * <pre>
     * whereSpec = [
     *     // Datums whose series is 'Europe' or 'Australia', 
     *     // and whose category is 2001 or 2002 
     *     {series: ['Europe', 'Australia'], category: [2001, 2002]},
     *     
     *     // Union'ed with
     *     
     *     // Datums whose series is 'America' 
     *     {series: 'America'},
     * ];
     * </pre>
     *  
     * @param {object} [keyArgs] Keyword arguments object.
     * 
     * @param {boolean} [keyArgs.isNull=null]
     *      Only considers datums with the specified isNull attribute.
     * 
     * @param {boolean} [keyArgs.visible=null]
     *      Only considers datums that have the specified visible state.
     * 
     * @param {boolean} [keyArgs.selected=null]
     *      Only considers datums that have the specified selected state.
     * 
     * @param {function} [keyArgs.where] A arbitrary datum predicate.
     *
     * @param {string[]} [keyArgs.orderBySpec] An array of "order by" strings to be applied to each 
     * datum filter of <i>whereSpec</i>.
     * <p>
     * An "order by" string is the same as a grouping specification string, 
     * although it is used here with a slightly different meaning.
     * Here's an example of an "order by" string:
     * <pre>
     * "series1 asc, series2 desc, category"
     * </pre
     * </p>
     * 
     * <p>
     * When not specified, altogether or individually, 
     * these are determined to match the corresponding datum filter of <i>whereSpec</i>.
     * </p>
     * 
     * <p>
     * If a string is specified it is treated as the "order by" string corresponding 
     * to the first datum filter.
     * </p>
     * 
     * @returns {def.Query} A query object that enumerates the desired {@link pvc.data.Datum}.
     */
    datums: function(whereSpec, keyArgs){
        if(!whereSpec){
            return data_whereState(def.query(this._datums), keyArgs);
        }
        
        whereSpec = data_processWhereSpec.call(this, whereSpec, keyArgs);
        
        return data_where.call(this, whereSpec, keyArgs);
    },
    
    /**
     * Obtains the first datum that 
     * satisfies a specified "where" specification.
     * <p>
     * If no datum satisfies the filter, null is returned.
     * </p>
     * 
     * @param {object} whereSpec A "where" specification.
     * See {@link #datums} to know about this structure.
     * 
     * @param {object} [keyArgs] Keyword arguments object.
     * See {@link #datums} for additional available keyword arguments.
     * 
     * @param {boolean} [keyArgs.createNull=false] Indicates if a 
     * null datum should be returned when no datum is satisfied the specified filter.
     * <p>
     * The assumption is that the "where" specification
     * contains one datum filter, and in turn,
     * that it specifies <b>all</b> the dimensions of this data's complex type.  
     * </p>
     * <p>
     * The first specified datum filter is used as a source to the datums' atoms.
     * Also, it is the first atom of each dimension filter that is used.
     * </p>
     * 
     * @returns {pvc.data.Datum} 
     * The first datum that satisfies the specified filter, 
     * a null datum, if <i>keyArgs.createNull</i> is truthy, 
     * or <i>null</i>.
     * 
     * @see pvc.data.Data#datums 
     */
    datum: function(whereSpec, keyArgs){
        /*jshint expr:true */
        whereSpec || def.fail.argumentRequired('whereSpec');
        
        whereSpec = data_processWhereSpec.call(this, whereSpec, keyArgs);
        
        var datum = data_where.call(this, whereSpec, keyArgs).first() || null;
        if(!datum && def.get(keyArgs, 'createNull') && whereSpec.length) {
            
            /* Create Null Datum */
            var sourceDatumFilter = whereSpec[0],
                atoms = [];
            
            for(var dimName in this._dimensions){
                var dimAtoms = sourceDatumFilter[dimName];
                if(dimAtoms) {
                    atoms.push(dimAtoms[0]);
                }
            }
            
            // true => null datum
            datum = new pvc.data.Datum(this, atoms, true);
        }
        
        return datum;
    },
    
    /**
     * Obtains the first datum of this data, if any.
     * @type {pvc.data.Datum} The first datum or <i>null</i>. 
     */
    firstDatum: function(){
        return this._datums.length ? this._datums[0] : null;
    },
    
    /**
     * Sums the absolute value 
     * of the sum of a specified dimension on each child.
     *
     * @param {string} dimName The name of the dimension to sum on each child data.
     * @param {object} [keyArgs] Optional keyword arguments that are
     * passed to each dimension's {@link pvc.data.Dimension#sum} method.
     * 
     * @type number
     */
    dimensionsSumAbs: function(dimName, keyArgs){
        /*global dim_buildDatumsFilterKey:true */
        var key = dimName + ":" + dim_buildDatumsFilterKey(keyArgs),
            sum = def.getOwn(this._sumAbsCache, key);

        if(sum == null) {
            sum = this.children()
                    /* flattened parent groups would account for the same values more than once */
                    .where(function(childData){ return !childData._isFlattenGroup; })
                    .select(function(childData){
                        return Math.abs(childData.dimensions(dimName).sum(keyArgs));
                    }, this)
                    .reduce(def.add, 0);

            (this._sumAbsCache || (this._sumAbsCache = {}))[key] = sum;
        }

        return sum;
    }
});

/**
 * Processes a given "where" specification.
 * <p>
 * Normalizes and validates the specification syntax, 
 * validates dimension names,
 * readily excludes uninterned (unexistent) and duplicate values and
 * atoms based on their "visible state".
 * </p>
 * 
 * <p>
 * The returned specification contains dimensions instead of their names
 * and atoms, instead of their values. 
 * </p>
 * 
 * @name pvc.data.Data#_processWhereSpec
 * @function
 * 
 * @param {object} whereSpec A "where" specification to be normalized.
 * TODO: A structure with the following form: ... 
 *
 * @return Array A <i>processed</i> "where" of the specification.
 * A structure with the following form:
 * <pre>
 * // OR of processed datum filters
 * whereProcSpec = [datumProcFilter1, datumProcFilter2, ...] | datumFilter;
 * 
 * // AND of processed dimension filters
 * datumProcFilter = {
 *      // OR of dimension atoms
 *      dimName1: [atom1, atom2, ...],
 *      dimName2: atom1,
 *      ...
 * }
 * </pre>
 * 
 * @private
 */
function data_processWhereSpec(whereSpec){
    var whereProcSpec = [];
    
    whereSpec = def.array.as(whereSpec);
    if(whereSpec){
        whereSpec.forEach(processDatumFilter, this);
    }
    
    return whereProcSpec;
    
    function processDatumFilter(datumFilter){
        if(datumFilter != null) {
            /*jshint expr:true */
            (typeof datumFilter === 'object') || def.fail.invalidArgument('datumFilter');
            
            /* Map: {dimName1: atoms1, dimName2: atoms2, ...} */
            var datumProcFilter = {},
                any = false;
            for(var dimName in datumFilter) {
                var atoms = processDimensionFilter.call(this, dimName, datumFilter[dimName]);
                if(atoms) {
                    any = true;
                    datumProcFilter[dimName] = atoms;
                }
            }
            
            if(any) {
                whereProcSpec.push(datumProcFilter);
            }
        }
    }
    
    function processDimensionFilter(dimName, values){
        // throws if it doesn't exist
        var dimension = this.dimensions(dimName),
            atoms = def.query(values)
                       .select(function(value){ return dimension.atom(value); }) // null if it doesn't exist
                       .where(def.notNully)
                       .distinct(function(atom){ return atom.key; })
                       .array();
        
        return atoms.length ? atoms : null;
    }
}

/**
 * Filters a datum query according to a specified predicate, 
 * datum selected and visible state.
 * 
 * @name pvc.data.Data#_whereState
 * @function
 * 
 * @param {def.query} q A datum query.
 * @param {object} [keyArgs] Keyword arguments object.
 * See {@link #groupBy} for additional available keyword arguments.
 * 
 * @returns {def.Query} A query object that enumerates the desired {@link pvc.data.Datum}.
 * @private
 * @static
 */
function data_whereState(q, keyArgs){
    var selected = def.get(keyArgs, 'selected'),
        visible  = def.get(keyArgs, 'visible'),
        where    = def.get(keyArgs, 'where'),
        isNull   = def.get(keyArgs, 'isNull')
        ;

    if(visible != null){
        q = q.where(function(datum){ return datum.isVisible === visible; });
    }
    
    if(isNull != null){
        q = q.where(function(datum){ return datum.isNull === isNull; });
    }
    
    if(selected != null){
        q = q.where(function(datum){ return datum.isSelected === selected; });
    }
    
    if(where){
        q = q.where(where);
    }
    
    return q;
}

// All the "Filter" and "Spec" words below should be read as if they were prepended by "Proc"
/**
 * Obtains the datums of this data filtered according to 
 * a specified "where" specification,
 * and optionally, 
 * datum selected state and filtered atom visible state.
 * 
 * @name pvc.data.Data#_where
 * @function
 * 
 * @param {object} [whereSpec] A <i>processed</i> "where" specification.
 * @param {object} [keyArgs] Keyword arguments object.
 * See {@link #groupBy} for additional available keyword arguments.
 * 
 * @param {string[]} [keyArgs.orderBySpec] An array of "order by" strings to be applied to each 
 * datum filter of <i>whereSpec</i>.
 * 
 * @returns {def.Query} A query object that enumerates the desired {@link pvc.data.Datum}.
 * @private
 */
function data_where(whereSpec, keyArgs) {
    
    var orderBys = def.array.as(def.get(keyArgs, 'orderBy')),
        datumKeyArgs = def.create(keyArgs || {}, {
            orderBy: null
        });
    
    var query = def.query(whereSpec)
                   .selectMany(function(datumFilter, index){
                      if(orderBys) {
                          datumKeyArgs.orderBy = orderBys[index];
                      }
                      
                      return data_whereDatumFilter.call(this, datumFilter, datumKeyArgs);
                   }, this);
    
    return query.distinct(function(datum){ return datum.id; });
    
    /*
    // NOTE: this is the brute force / unguided algorithm - no indexes are used
    function whereDatumFilter(datumFilter, index){
        // datumFilter = {dimName1: [atom1, OR atom2, OR ...], AND ...}
        
        return def.query(this._datums).where(datumPredicate, this);
        
        function datumPredicate(datum){
            if((selected === null || datum.isSelected === selected) && 
               (visible  === null || datum.isVisible  === visible)) {
                var atoms = datum.atoms;
                for(var dimName in datumFilter) {
                    if(datumFilter[dimName].indexOf(atoms[dimName]) >= 0) {
                        return true;
                    }
                }   
            }
        }
    }
    */    
}

/**
 * Obtains an enumerable of the datums satisfying <i>datumFilter</i>,
 * by constructing and traversing indexes.
 * 
 * @name pvc.data.Data#_whereDatumFilter
 * @function
 * 
 * @param {string} datumFilter A <i>processed</i> datum filter.
 * 
 * @param {Object} keyArgs Keyword arguments object.
 * See {@link #groupBy} for additional available keyword arguments.
 * 
 * @param {string} [keyArgs.orderBy] An "order by" string.
 * When not specified, one is determined to match the specified datum filter.
 * The "order by" string cannot contain multi-dimension levels (dimension names separated with "|").
 * 
 * @returns {def.Query} A query object that enumerates the desired {@link pvc.data.Datum}.
 * 
 * @private
 */
function data_whereDatumFilter(datumFilter, keyArgs) {
     var groupingSpecText = keyArgs.orderBy; // keyArgs is required
     if(!groupingSpecText) {
         // Choose the most convenient one.
         // A sort on dimension names can yield good cache reuse.
         groupingSpecText = Object.keys(datumFilter).sort().join(',');
     } else {
         if(groupingSpecText.indexOf("|") >= 0) {
             throw def.error.argumentInvalid('keyArgs.orderBy', "Multi-dimension order by is not supported.");
         }
         
         // TODO: not validating that groupingSpecText actually contains the same dimensions referred in datumFilter...
     }
     
     /*
        // NOTE:
        // All the code below is just a stack/state-based translation of 
        // the following recursive code (so that it can be used lazily with a def.query):
        
        recursive(rootData, 0);
        
        function recursive(parentData, h) {
            if(h >= H) {
                // Leaf
                parentData._datums.forEach(fun, ctx);
                return;
            }
            
            var dimName = parentData._childrenKeyDimName;
            datumFilter[dimName].forEach(function(atom){
                var childData = parentData._childrenByKey[atom.key];
                if(childData) {
                    recursive(childData, h + 1);
                }
            }, this);
        }
     */
     
     var rootData = this.groupBy(groupingSpecText, keyArgs),
     H = rootData.treeHeight;
     
     var stateStack = [];
     
     // Ad-hoq query
     return def.query(function(/* nextIndex */){
         // Advance to next datum
         var state;

         // No current data means starting
         if(!this._data) {
             this._data = rootData;
             this._dimAtomsOrQuery = def.query(datumFilter[rootData._childrenKeyDimName]);
             
         // Are there still any datums of the current data to enumerate?
         } else if(this._datumsQuery) { 
             
             // <Debug>
             /*jshint expr:true */
             this._data || def.assert("Must have a current data");
             stateStack.length || def.assert("Must have a parent data"); // cause the root node is "dummy"
             !this._dimAtomsOrQuery || def.assert();
             // </Debug>
             
             if(this._datumsQuery.next()){
                 this.item = this._datumsQuery.item; 
                 return 1; // has next
             }
             
             // No more datums here
             // Advance to next leaf data node
             this._datumsQuery = null;
             
             // Pop parent data
             state = stateStack.pop();
             this._data = state.data;
             this._dimAtomsOrQuery = state.dimAtomsOrQuery;
         } 
         
         // <Debug>
         this._dimAtomsOrQuery || def.assert("Invalid programmer");
         this._data || def.assert("Must have a current data");
         // </Debug>
         
         // Are there still any OrAtom paths of the current data to traverse? 
         var depth = stateStack.length;
             
         // Any more atom paths to traverse, from the current data?
         do{
             while(this._dimAtomsOrQuery.next()) {
                 
                 var dimAtomOr = this._dimAtomsOrQuery.item,
                     childData = this._data._childrenByKey[dimAtomOr.globalKey];
                 
                 // Also, advance the test of a leaf child data with no datums, to avoid backtracking
                 if(childData && (depth < H - 1 || childData._datums.length)) {
                     
                     stateStack.push({data: this._data, dimAtomsOrQuery: this._dimAtomsOrQuery});
                     
                     this._data = childData;
                     
                     if(depth < H - 1) {
                         // Keep going up, until a leaf datum is found. Then we stop.
                         this._dimAtomsOrQuery = def.query(datumFilter[childData._childrenKeyDimName]);
                         depth++;
                     } else {
                         // Leaf data!
                         // Set first datum and leave
                         this._dimAtomsOrQuery = null;
                         this._datumsQuery = def.query(childData._datums);
                         this._datumsQuery.next();
                         this.item = this._datumsQuery.item;
                         return 1; // has next
                     }
                 }
             } // while(atomsOrQuery)
             
             // No more OR atoms in this _data
             if(!depth){
                 return 0; // finished
             }
             
             // Pop parent data
             state = stateStack.pop();
             this._data = state.data;
             this._dimAtomsOrQuery = state.dimAtomsOrQuery;
             depth--;
         } while(true);
         
         // Never executes
         return 0; // finished
     });
}pvc.data.Data
.add(/** @lends pvc.data.Data# */{
    /**
     * Returns some information on the data points
     */
    getInfo: function(){

        var out = ["\n------------------------------------------"];
        out.push("Dataset Information");
        
        def.eachOwn(this.dimensions(), function(dimension, name){
            var count = dimension.count(),
                type = dimension.type,
                features = [];
            
            features.push(type.valueTypeName);
            if(type.isComparable){ features.push("comparable"); }
            if(!type.isDiscrete){ features.push("continuous"); }
            if(type.isHidden){ features.push("hidden"); }
            
            out.push(
                "  " + 
                name +
                " (" + features.join(', ') + ")" +
                " (" + count + ")\n\t" + 
                dimension.atoms().slice(0, 10).map(function(atom){ return atom.label; }).join(", ") + 
                (count > 10 ? "..." : ""));
        });
        
        out.push("------------------------------------------");

        return out.join("\n");
    },
    
    /**
     * Returns the values for the dataset
     * BoxPlot, DataTree, ParallelCoordinates
     * 
     * @deprecated
     */
    getValues: function(){
        /**
         * Values is the inner Vs matrix
         *  X | S1  | ... | S2  |
         * ----------------------
         * C1 | V11 | ... | VN1 |
         *  . |   .           .
         * CJ | V1J | ... | VNJ |
         */
         return pv.range(0, this.getCategoriesSize())
                  .map(function(categIndex){
                      return this._getValuesForCategoryIndex(categIndex);
                  }, this);
    },
    
    /**
     * Returns the unique values of a given dimension.
     * 
     * @deprecated
     */
    _getDimensionValues: function(name){
        return this.dimensions(name).atoms().map(function(atom){ return atom.value; });
    },

    /**
     * Returns the unique visible values of a given dimension.
     * 
     * @deprecated
     */
    _getDimensionVisibleValues: function(name){
        return this.dimensions(name).atoms({visible: true}).map(function(atom){ return atom.value; });
    },
    
    /**
     * Returns the unique series values.
     * @deprecated
     */
    getSeries: function(){
        return this._getDimensionValues('series');
    },

    /**
     * Returns an array with the indexes of the visible series values.
     * @deprecated
     */
    getVisibleSeriesIndexes: function(){
        return this.dimensions('series').indexes({visible: true});
    },
    
    /**
     * Returns an array with the indexes of the visible category values.
     * @deprecated
     */
    getVisibleCategoriesIndexes: function(){
        return this.dimensions('category').indexes({visible: true});
    },

    /**
     * Returns an array with the visible categories.
     * @deprecated
     */
    getVisibleSeries: function(){
        return this._getDimensionVisibleValues('series');
    },

    /**
     * Returns the categories on the underlying data
     * @deprecated
     */
    getCategories: function(){
        return this._getDimensionValues('category');
    },

    /**
     * Returns an array with the visible categories.
     * 
     * @deprecated
     */
    getVisibleCategories: function(){
        return this._getDimensionVisibleValues('category');
    },
    
    /**
     * Returns the values for a given category index
     * @deprecated
     */
    _getValuesForCategoryIndex: function(categIdx){
        var categAtom = this.dimensions('category').atoms()[categIdx];
        var datumsBySeriesKey = this.datums({category: categAtom})
                                    .uniqueIndex(function(datum){ return datum.atoms.series.key; });
        
        // Sorted series atoms
        return this.dimensions('series')
                   .atoms()
                   .map(function(atom){
                        var datum = def.getOwn(datumsBySeriesKey, atom.key);
                        return datum ? datum.atoms.value.value : null;
                    });
    },
    
    /**
     * Returns how many series we have
     * @deprecated
     */
    getSeriesSize: function(){
        var dim = this.dimensions('series', {assertExists: false});
        return dim ? dim.count() : 0;
    },

    /**
     * Returns how many categories, or data points, we have
     * @deprecated
     */
    getCategoriesSize: function(){
        var dim = this.dimensions('category', {assertExists: false});
        return dim ? dim.count() : 0;
    }
});
/**
 * Initializes a visual role.
 * 
 * @name pvc.visual.Role
 * 
 * @class Represents a role that is somehow played by a visualization.
 * 
 * @property {string} name The name of the role.
 *
 * @property {string} label
 * The label of this role.
 * The label <i>should</i> be unique on a visualization.
 *
 * @property {pvc.data.GroupingSpec} grouping The grouping specification currently bound to the visual role.
 * 
 * @property {boolean} isRequired Indicates that the role is required and must be satisfied.
 * 
 * @property {boolean} requireSingleDimension Indicates that the role can only be satisfied by a single dimension.
 * A {@link pvc.visual.Role} of this type must have an associated {@link pvc.data.GroupingSpec}
 * that has {@link pvc.data.GroupingSpec#isSingleDimension} equal to <tt>true</tt>.
 * 
 * @property {boolean} valueType When not nully, 
 * restricts the allowed value type of the single dimension of the 
 * associated {@link pvc.data.GroupingSpec} to this type.
 * 
 * @property {boolean|null} requireIsDiscrete
 * Indicates if 
 * only discrete, when <tt>true</tt>, 
 * continuous, when <tt>false</tt>, 
 * or any, when <tt>null</tt>,
 * groupings are accepted.
 * 
 * @property {string} defaultDimensionName The default dimension name.
 *
 * @property {boolean} autoCreateDimension Indicates if a dimension with the default name (the first level of, when a group name),
 * should be created when the role has not been read by a translator (required or not).
 *
 * @constructor
 * @param {string} name The name of the role.
 * @param {object} [keyArgs] Keyword arguments.
 * @param {string} [keyArgs.label] The label of this role.
 *
 * @param {boolean} [keyArgs.isRequired=false] Indicates a required role.
 * 
 * @param {boolean} [keyArgs.requireSingleDimension=false] Indicates that the role 
 * can only be satisfied by a single dimension. 
 * 
 * @param {boolean} [keyArgs.isMeasure=false] Indicates that <b>datums</b> that do not 
 * contain a non-null atom in any of the dimensions bound to measure roles should be readily excluded.
 * 
 * @param {boolean} [keyArgs.valueType] Restricts the allowed value type of dimensions.
 * 
 * @param {boolean|null} [keyArgs.requireIsDiscrete=null] Indicates if the grouping should be discrete, continuous or any.
 * 
 * @param {string} [keyArgs.defaultDimensionName] The default dimension name.
 * @param {boolean} [keyArgs.autoCreateDimension=false]
 * Indicates if a dimension with the default name (the first level of, when a group name),
 * should be created when the role is required and it has not been read by a translator.
 *
 * @param {string} [keyArgs.flatteningMode='singleLevel'] Indicates if the role presents
 * the leaf data nodes or all the nodes in the tree, in pre or post order.
 * Possible values are <tt>'singleLevel'</tt>, <tt>'tree-pre'</tt> and <tt>'tree-post'</tt>.
 */
def.type('pvc.visual.Role')
.init(function(name, keyArgs){
    this.name = name;
    this.label = def.get(keyArgs, 'label') || name;

    if(def.get(keyArgs, 'isRequired', false)) {
        this.isRequired = true;
    }
    
    if(def.get(keyArgs, 'autoCreateDimension', false)) {
        this.autoCreateDimension = true;
    }
    
    var defaultDimensionName = def.get(keyArgs, 'defaultDimensionName');
    if(defaultDimensionName) {
        this.defaultDimensionName = defaultDimensionName;
    }

    if(!defaultDimensionName && this.autoCreateDimension){
        throw def.error.argumentRequired('defaultDimensionName');
    }
    
    var requireSingleDimension;
    var requireIsDiscrete = def.get(keyArgs, 'requireIsDiscrete'); // isSingleDiscrete
    if(requireIsDiscrete != null) {
        if(!requireIsDiscrete) {
            requireSingleDimension = true;
        }
    }
    
    if(requireSingleDimension != null) {
        requireSingleDimension = def.get(keyArgs, 'requireSingleDimension', false);
        if(requireSingleDimension) {
            if(def.get(keyArgs, 'isMeasure', false)) {
                this.isMeasure = true;
                
                if(def.get(keyArgs, 'isPercent', false)) {
                    this.isPercent = true;
                }
            }
            
            var valueType = def.get(keyArgs, 'valueType', null);
            if(valueType !== this.valueType) {
                this.valueType = valueType;
            }
        }
    }
    
    if(requireSingleDimension !== this.requireSingleDimension) {
        this.requireSingleDimension = requireSingleDimension;
    }
    
    if(requireIsDiscrete != this.requireIsDiscrete) {
        this.requireIsDiscrete = !!requireIsDiscrete;
    }

    var flatteningMode = def.get(keyArgs, 'flatteningMode');
    if(flatteningMode && flatteningMode != this.flatteningMode) {
        this.flatteningMode = flatteningMode;
    }
})
.add(/** @lends pvc.visual.Role# */{
    isRequired: false,
    requireSingleDimension: false,
    valueType: null,
    requireIsDiscrete: null,
    isMeasure: false,
    isPercent: false,
    defaultDimensionName: null,
    grouping: null,
    flatteningMode: 'singleLevel',
    flattenRootLabel: '',
    autoCreateDimension: false,
    isReversed: false,
    label: null,

    /** 
     * Obtains the name of the first dimension type that is bound to the role.
     * @type string 
     */
    firstDimensionName: function(){
        return this.grouping && this.grouping.firstDimension.name;
    },
    
    /** 
     * Obtains the first dimension that is bound to the role.
     * @type pvc.data.Dimension
     */
    firstDimension: function(){
        return this.grouping && this.grouping.firstDimension.type;
    },
    
    setIsReversed: function(isReversed){
        if(!isReversed){ // default value
            delete this.isReversed;
        } else {
            this.isReversed = true;
        }
    },
    
    setFlatteningMode: function(flatteningMode){
        if(!flatteningMode || flatteningMode === 'singleLevel'){ // default value
            delete this.flatteningMode;
        } else {
            this.flatteningMode = flatteningMode;
        }
    },

    setFlattenRootLabel: function(flattenRootLabel){
        if(!flattenRootLabel){ // default value
            delete this.flattenRootLabel;
        } else {
            this.flattenRootLabel = flattenRootLabel;
        }
    },

    /**
     * Applies this role's grouping to the specified data
     * after ensuring the grouping is of a certain type.
     *
     * @param {pvc.data.Data} data The data on which to apply the operation.
     * @param {object} [keyArgs] Keyword arguments.
     * ...
     * 
     * @type pvc.data.Data
     */
    flatten: function(data, keyArgs){
        if(this.grouping){
            return data.flattenBy(this, keyArgs);
        }
    },

    flattenedGrouping: function(keyArgs){
        var grouping = this.grouping;
        if(grouping){
            keyArgs = def.setDefaults(keyArgs,
                'flatteningMode', this.flatteningMode,
                'flattenRootLabel', this.flattenRootLabel);

            return grouping.ensure(keyArgs);
        }
    },

    select: function(data, keyArgs){
        var grouping = this.grouping;
        if(grouping){
            return data.groupBy(grouping.ensure(keyArgs), keyArgs);
        }
    },

    view: function(complex){
        var grouping = this.grouping;
        if(grouping){
            return grouping.view(complex);
        }
    },

    /**
     * Pre-binds a grouping specification to playing this role.
     * 
     * @param {pvc.data.GroupingSpec} groupingSpec The grouping specification of the visual role.
     */
    preBind: function(groupingSpec){
        this.__grouping = groupingSpec;

        return this;
    },

    isPreBound: function(){
        return !!this.__grouping;
    },
    
    isBound: function(){
        return !!this.grouping;
    },
    
    /**
     * Finalizes a binding initiated with {@link #preBind}.
     *
     * @param {pvc.data.ComplexType} type The complex type with which
     * to bind the pre-bound grouping and then validate the
     * grouping and role binding.
     */
    postBind: function(type){
        var grouping = this.__grouping;
        if(grouping){
            delete this.__grouping;

            grouping.bind(type);

            this.bind(grouping);
        }
        
        return this;
    },

    /**
     * Binds a grouping specification to playing this role.
     * 
     * @param {pvc.data.GroupingSpec} groupingSpec The grouping specification of the visual role.
     */
    bind: function(groupingSpec){
        if(groupingSpec) {
            if(groupingSpec.isNull()){
                groupingSpec = null;
           } else {
                /* Validate grouping spec according to role */

                if(this.requireSingleDimension && !groupingSpec.isSingleDimension) {
                    throw def.error.operationInvalid(
                            "Role '{0}' only accepts a single dimension.",
                            [this.name]);
                }

                var valueType = this.valueType;
                var requireIsDiscrete = this.requireIsDiscrete;
                groupingSpec.dimensions().each(function(dimSpec){
                    var dimType = dimSpec.type;
                    if(valueType && dimType.valueType !== valueType) {
                        throw def.error.operationInvalid(
                                "Role '{0}' cannot be bound to dimension '{1}'. \nIt only accepts dimensions of type '{2}' and not of type '{3}'.",
                                [this.name, dimType.name, pvc.data.DimensionType.valueTypeName(valueType), dimType.valueTypeName]);
                    }

                    if(requireIsDiscrete != null &&
                    dimType.isDiscrete !== requireIsDiscrete) {
                        throw def.error.operationInvalid(
                                "Role '{0}' cannot be bound to dimension '{1}'. \nIt only accepts {2} dimensions.",
                                [this.name, dimType.name, requireIsDiscrete ? 'discrete' : 'continuous']);
                    }
                }, this);
            }
        }
        
        // ----------
        
        if(this.grouping) {
            // unregister from current dimension types
            this.grouping.dimensions().each(function(dimSpec){
                if(dimSpec.type){
                    /*global dimType_removeVisualRole:true */
                    dimType_removeVisualRole.call(dimSpec.type, this);
                }
            }, this);
        }
        
        this.grouping = groupingSpec;
        
        if(this.grouping) {
            
            if(this.isReversed){
                this.grouping = this.grouping.reversed();
            }
            
            // register in current dimension types
            this.grouping.dimensions().each(function(dimSpec){
                /*global dimType_addVisualRole:true */
                dimType_addVisualRole.call(dimSpec.type, this);  
            }, this);
        }

        return this;
    }
});

/**
 * Initializes a scene.
 * 
 * @name pvc.visual.Scene
 * @class Scenes guide the rendering of protovis marks;
 * they are supplied to {@link pv.Mark} <tt>data</tt> property.
 * <p>
 * A scene may feed several marks and so is not specific to a given mark 
 * (contrast with protovis' instances/scenes).
 * </p>
 * <p>
 * Scenes provide a well defined interface to pvc's 
 * extension point functions.
 * </p>
 * <p>
 * Scenes hold precomputed data, that does not change with interaction,
 * and that is thus not recalculated in every protovis render caused by interaction.
 * </p>
 * <p>
 * Scenes bridge the gap between data and visual roles. 
 * Data can be accessed by one or the other view.
 * </p>
 * 
 * @borrows pv.Dom.Node#visitBefore as #visitBefore
 * @borrows pv.Dom.Node#visitAfter as #visitAfter
 * 
 * @borrows pv.Dom.Node#nodes as #nodes
 * @borrows pv.Dom.Node#firstChild as #firstChild
 * @borrows pv.Dom.Node#lastChild as #lastChild
 * @borrows pv.Dom.Node#previousSibling as #previousSibling
 * @borrows pv.Dom.Node#nextSibling as #nextSibling
 * 
 * 
 * @property {pvc.data.Data}  group The data group that's present in the scene, or <tt>null</tt>, if none.
 * @property {pvc.data.Datum} datum The datum that's present in the scene, or <tt>null</tt>, if none.
 * @property {object} atoms The map of atoms, by dimension name, that's present in the scene, or <tt>null</tt>, if none.
 * <p>
 * When there is a group, these are its atoms, 
 * otherwise, 
 * if there is a datum, 
 * these are its atoms.
 * </p>
 * <p>
 * Do <b>NOT</b> modify this object.
 * </p>
 * 
 * @constructor
 * @param {pvc.visual.Scene} [parent=null] The parent scene.
 * @param {object} [keyArgs] Keyword arguments.
 * @property {pvc.data.Data}  [keyArgs.group=null] The data group that's present in the scene.
 * Specify only one of the arguments <tt>group</tt> or <tt>datum</tt>.
 * @property {pvc.data.Datum} [keyArgs.datum=null] The single datum that's present in the scene.
 * Specify only one of the arguments <tt>group</tt> or <tt>datum</tt>.
 */
def.type('pvc.visual.Scene')
.init(function(parent, keyArgs){
    if(pvc.debug >= 4){
        this.id = def.nextId('scene');
    }
    
    this._renderId   = 0;
    this.renderState = {};
    
    pv.Dom.Node.call(this, /* nodeValue */null);
    
    this.parent = parent || null;
    this.root   = this;
    if(parent){
        // parent -> ((pv.Dom.Node#)this).parentNode
        // this   -> ((pv.Dom.Node#)parent).childNodes
        // ...
        var index = def.get(keyArgs, 'index', null);
        parent.insertAt(this, index);
        this.root = parent.root;
    } else {
        /* root scene */
        this._active = null;
        this._panel = def.get(keyArgs, 'panel') || 
            def.fail.argumentRequired('panel', "Argument is required on root scene.");
    }
    
    /* DATA */
    var group = def.get(keyArgs, 'group', null),
        datum;
    if(group){
        datum = group._datums[0]; // null on empty datas (just try hiding all series with the legend)
    } else {
        datum = def.get(keyArgs, 'datum');
    }
    
    this.datum = datum || null;
    this.group = group;

    var source = (datum || group);
    this.atoms = source ? source.atoms : null;
    
    /* VARS */
    this.vars = parent ? Object.create(parent.vars) : {};
})
.add(pv.Dom.Node)

.add(/** @lends pvc.visual.Scene# */{
    /**
     * Obtains an enumerable of the datums present in the scene.
     *
     * @type def.Query
     */
    datums: function(){
        return this.group ?
                    this.group.datums() :
                    (this.datum ? def.query(this.datum) : def.query());
    },
    
    /*
     * {value} -> <=> this.vars.value.label
     * {value.value} -> <=> this.vars.value.value
     * {#sales} -> <=> this.atoms.sales.label
     */
    format: function(mask){
        return def.format(mask, this._formatScope, this);
    },
    
    _formatScope: function(prop){
        if(prop.charAt(0) === '#'){
            // An atom name
            prop = prop.substr(1).split('.');
            if(prop.length > 2){
                throw def.error.operationInvalid("Scene format mask is invalid.");
            }
            
            var atom = this.atoms[prop[0]];
            if(atom){
                if(prop.length > 1) {
                    switch(prop[1]){
                        case 'value': return atom.value;
                        case 'label': break;
                        default:      throw def.error.operationInvalid("Scene format mask is invalid.");
                    }
                }
                
                // atom.toString() ends up returning atom.label
                return atom;
            }
            
            return null; // Atom does not exist --> ""
        }
        
        // A scene var name
        return def.getPath(this.vars, prop); // Scene vars' toString may end up being called
    },
    
    isRoot: function(){
        return this.root === this;   
    },
    
    panel: function(){
        return this.root._panel;
    },
    
    chart: function(){
        return this.root._panel.chart;
    },
    
    compatVersion: function(){
        return this.root._panel.compatVersion();
    },
    
    /**
     * Obtains an enumerable of the child scenes.
     * 
     * @type def.Query
     */
    children: function(){
        if(!this.childNodes) {
            return def.query();
        }
        
        return def.query(this.childNodes);
    },
    
    /* INTERACTION */
    anyInteraction: function(){
        return (!!this.root._active || this.anySelected());
    },

    /* ACTIVITY */
    isActive: false,
    
    setActive: function(isActive){
        if(this.isActive !== (!!isActive)){
            rootScene_setActive.call(this.root, this.isActive ? null : this);
        }
    },
    
    clearActive: function(){
        return rootScene_setActive.call(this.root, null);
    },
    
    anyActive: function(){
        return !!this.root._active;
    },
    
    active: function(){
        return this.root._active;
    },
    
    activeSeries: function(){
        var active = this.active();
        return active && active.vars.series.value;
    },
    
    isActiveSeries: function(){
        if(this.isActive){
            return true;
        }
        
        var activeSeries;
        return (activeSeries = this.activeSeries()) != null &&
               (activeSeries === this.vars.series.value);
    },
    
    /* SELECTION */
    isSelected: function(){
        return this._selectedData().is;
    },
    
    anySelected: function(){
        return this._selectedData().any;
    },
    
    _selectedData: function(){
        return this.renderState._selectedData || 
               (this.renderState._selectedData = this._createSelectedData());
    },
    
    _createSelectedData: function(){
        var any = this.panel().chart.data.owner.selectedCount() > 0,
            isSelected = any && 
                         this.datums()
                             .any(function(datum){ return datum.isSelected; });
        
        return {
            any: any,
            is:  isSelected
        };
    }
});

/** 
 * Called on each sign's pvc.visual.Sign#buildInstance 
 * to ensure cached data per-render is cleared.
 * 
 *  @param {number} renderId The current render id.
 */
function scene_renderId(renderId){
    if(this._renderId !== renderId){
        if(pvc.debug >= 7){
            pvc.log({sceneId: this.id, oldRenderId: this._renderId, newRenderId: renderId});
        }
        
        this._renderId   = renderId;
        this.renderState = {};
    }
}

function rootScene_setActive(scene){
    if(this._active !== scene){
        if(this._active){
            scene_setActive.call(this._active, false);
        }
        
        this._active = scene || null;
        
        if(this._active){
            scene_setActive.call(this._active, true);
        }
        return true;
    }
    return false;
}

function scene_setActive(isActive){
    if(this.isActive !== (!!isActive)){
        if(!isActive){
            delete this.isActive;
        } else {
            this.isActive = true;
        }
    }
}
/**
 * Initializes a scene variable.
 * 
 * @name pvc.visual.ValueLabelVar
 * @class A scene variable holds the concrete value that 
 * a {@link pvc.visual.Role} or other relevant piece of information 
 * has in a {@link pvc.visual.Scene}.
 * Usually, it also contains a label that describes it.
 * 
 * @constructor
 * @param {any} value The value of the variable.
 * @param {any} label The label of the variable.
 */
pvc.visual.ValueLabelVar = function(value, label){
    this.value = value;
    this.label = label;
};

pvc.visual.ValueLabelVar.prototype.toString = function(){
    var label = this.label || this.value;
    return typeof label !== 'string' ? ('' + label) : label;
};
def.type('pvc.visual.Sign')
.init(function(panel, pvMark, keyArgs){
    this.chart  = panel.chart;
    this.panel  = panel;
    this.pvMark = pvMark;
    
    this.extensionId = def.get(keyArgs, 'extensionId');
    this.isActiveSeriesAware = !!this.chart.visualRoles('series', {assertExists: false}) &&
                               def.get(keyArgs, 'activeSeriesAware', true);
            
    /* Extend the pv mark */
    pvMark
        .localProperty('_scene', Object)
        .localProperty('group',  Object);
    
    this.lockValue('_scene', function(scene){ return scene; })
        /* TODO: remove these when possible and favor access through scene */
        .lockValue('group',  function(scene){ return scene.group; })
        .lockValue('datum',  function(scene){ return scene.datum; })
        ;
    
    pvMark.sign = this;
    
    /* Intercept the protovis mark's buildInstance */
    
    // Avoid doing a function bind, cause buildInstance is a very hot path
    pvMark.__buildInstance = pvMark.buildInstance;
    pvMark.buildInstance  = this._dispatchBuildInstance;
})
.postInit(function(panel, pvMark, keyArgs){
    this._addInteractive(keyArgs);
})
.add({
    _addInteractive: function(keyArgs){
        var panel   = this.panel,
            pvMark  = this.pvMark,
            options = this.chart.options;

        if(!def.get(keyArgs, 'noTooltips', false) && options.showTooltips){
            this.panel._addPropTooltip(pvMark);
        }

        this.selectable = !def.get(keyArgs, 'noSelect', false) && options.selectable;
        this.hoverable  = !def.get(keyArgs, 'noHover' , false) && options.hoverable ;
        this.clickable  = !def.get(keyArgs, 'noClick', false) && panel._shouldHandleClick();
        this.doubleClickable = !def.get(keyArgs, 'noDoubleClick', false) && options.doubleClickAction;
        
        this.interactive = this.selectable || this.hoverable;
        
        if(this.hoverable) {
            // Add hover-active behavior
            // May still require the point behavior on some ascendant panel
            var onEvent,
                offEvent;

//            switch(pvMark.type) {
//                default:
//                case 'dot':
//                case 'line':
//                case 'area':
//                case 'rule':
//                    onEvent  = 'point';
//                    offEvent = 'unpoint';
//                   panel._requirePointEvent();
//                    break;

//                default:
                    onEvent = 'mouseover';
                    offEvent = 'mouseout';
//                    break;
//            }

            pvMark
                .event(onEvent, function(scene){
                    scene.setActive(true);

                    if(!panel.topRoot.rubberBand || panel.isAnimating()) {
                        panel._renderInteractive();
                    }
                })
                .event(offEvent, function(scene){
                    if(scene.clearActive()) {
                        /* Something was active */
                        if(!panel.topRoot.rubberBand || panel.isAnimating()) {
                            panel._renderInteractive();
                        }
                    }
                });
        }

        if(this.clickable){
            panel._addPropClick(pvMark);
        }

        if(this.doubleClickable) {
            panel._addPropDoubleClick(pvMark);
        }
    },
    
    /* SCENE MAINTENANCE */
    _dispatchBuildInstance: function(instance){
        // this: the mark
        this.sign._buildInstance(this, instance);
    },
    
    _buildInstance: function(mark, instance){
        /* Reset scene/instance state */
        this.pvInstance = instance; // pv Scene
        
        var scene  = instance.data;
        this.scene = scene;
        
        /* 
         * Update the scene's render id, 
         * which possibly invalidates per-render
         * cached data.
         */
        /*global scene_renderId:true */
        scene_renderId.call(scene, mark.renderId());

        /* state per: sign & scene & render */
        this.state = {};

        mark.__buildInstance.call(mark, instance);
    },
    
    /* Extensibility */
    intercept: function(name, method, noCast){
        if(typeof method !== 'function'){
            // Assume string with name of method
            // This allows instance-overriding methods,
            //  because the method's value is lazily captured.
            method = def.methodCaller('' + method);
        }
        
        var me = this;
        this.pvMark.intercept(
                name,
                function(fun, args){
                    var prevExtFun = me._extFun, prevExtArgs = me._extArgs;
                    me._extFun = fun;
                    me._extArgs = args;
                    try {
                        return method.apply(me, args);
                    } finally{
                        me._extFun = prevExtFun;
                        me._extArgs = prevExtArgs;
                    }
                },
                this._getExtension(name),
                noCast);
        
        return this;
    },
    
    delegate: function(dv){
        // TODO wrapping context
        var result;
        if(this._extFun) {
            result = this._extFun.apply(this, this._extArgs);
            if(result === undefined) {
                result = dv;
            }
        } else {
            result = dv;
        }
        
        return result;
    },
    
    hasDelegate: function(){
        return !!this._extFun;
    },

    lockDimensions: function(){
        this.pvMark
            .lock('left')
            .lock('right')
            .lock('top')
            .lock('bottom')
            .lock('width')
            .lock('height');
        
        return this;
    },

    lock: function(name, method){
        if(typeof method !== 'function'){
            method = def.methodCaller('' + method, this);
        } else {
            method = method.bind(this);
        }
        
        return this.lockValue(name, method);
    },
    
    lockValue: function(name, value){
        this.pvMark.lock(name, value);
        return this;
    },
    
    optional: function(name, method){
        if(typeof method !== 'function'){
            method = def.methodCaller('' + method, this);
        } else {
            method = method.bind(this);
        }
        
        return this.optionalValue(name, method);
    },
    
    optionalValue: function(name, value){
        this.pvMark[name](value);
        return this;
    },
    
    _getExtension: function(name){
        return this.panel._getExtension(this.extensionId, name);
    },
    
    _versionedExtFun: function(prop, extPointFun, version){
        return extPointFun;
    },
    
    /* COLOR */
    color: function(type){
        var color = this.baseColor(type);
        if(color === null){
            return null;
        }

        if(this.interactive && this.scene.anyInteraction()) {
            color = this.interactiveColor(type, color);
        } else {
            color = this.normalColor(type, color);
        }

        return color;
    },
    
    baseColor: function(type){
        var color = this.delegate();
        if(color === undefined){
            color = this.defaultColor(type);
        }
        
        return color;
    },
    
    _initDefaultColorSceneScale: function(){
        var colorAxis = this.panel.defaultColorAxis();
        if(colorAxis){
            return colorAxis.sceneScale({nullToZero: false});
        } 
        
        return def.fun.constant(pvc.defaultColor);
    },
    
    defaultColorSceneScale: function(){
        return this._defaultColorSceneScale || 
               (defaultColorSceneScale = this._initDefaultColorSceneScale());
    },
    
    defaultColor: function(type){
        return this.defaultColorSceneScale()(this.scene);
    },

    normalColor: function(type, color){
        return color;
    },

    interactiveColor: function(type, color){
        return color;
    },

    dimColor: function(type, color){
        return pvc.toGrayScale(color, -0.3, null, null); // ANALYZER requirements, so until there's no way to configure it...
    }
});

def.type('pvc.visual.Dot', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){
    
    var pvMark = protoMark.add(pv.Dot);
    
    this.base(panel, pvMark, keyArgs);
    
    if(!def.get(keyArgs, 'freePosition', false)){
        var basePosProp  = panel.isOrientationVertical() ? "left" : "bottom",
            orthoPosProp = panel.anchorOrtho(basePosProp);
        
        this/* Positions */
            .lock(orthoPosProp, 'y')
            .lock(basePosProp,  'x');
    }
       
    this/* Shape & Size */
        .intercept('shape',       'shape' )
        .intercept('shapeRadius', 'radius')
        .intercept('shapeSize',   'size'  )
        
        /* Colors & Line */
        .optionalValue('strokeDasharray', null) // Break inheritance
        .optionalValue('lineWidth',       1.5)  // idem
        
        .intercept('fillStyle',   'fillColor'  )
        .intercept('strokeStyle', 'strokeColor')
        ;
})
.add({
    /* Sign Spatial Coordinate System
     *  -> Cartesian coordinates
     *  -> Grows Up, vertically, and Right, horizontally
     *  -> Independent of the chart's orientation
     *  -> X - horizontal axis
     *  -> Y - vertical axis
     *  
     *  y
     *  ^
     *  |
     *  |
     *  o-----> x
     */
    y: function(){ return 0; },
    x: function(){ return 0; },
    
    shape: function(){ 
        return this.delegate(); 
    },
    
    radius: function(){
        // Store extended value, if any
        // See #sizeCore
        this.state.radius = this.delegate();
    },
    
    /* SIZE */
    size: function(){
        var size = this.baseSize();
        if(this.interactive && this.scene.anyInteraction()) {
            size = this.interactiveSize(size);
        } else {
            size = this.normalSize(size);
        }
        
        return size;
    },
    
    baseSize: function(){
        /* Radius was specified? */
        var radius = this.state.radius;
        if(radius != null) {
            return radius * radius;
        }
        
        /* Delegate to possible Size extension or default to 12 */
        return this.delegate(12);
    },

    normalSize: function(size){
        return size;
    },

    interactiveSize: function(size){
        if(this.scene.isActive){
            return Math.max(size, 5) * 2.5;
        }
        
        return size;
    },
    
    /* COLOR */
    
    fillColor: function(){ 
        return this.color('fill');
    },
    
    strokeColor: function(){ 
        return this.color('stroke');
    },
    
    /**
     * @override
     */
    interactiveColor: function(type, color){
        var scene = this.scene;
        if(scene.isActive) {
            if(type === 'stroke') {
                return color.brighter(1);
            }
        } else if(scene.anySelected() && !scene.isSelected()) {
            
            if(this.isActiveSeriesAware && scene.isActiveSeries()) {
                //return color.darker(1.5);
                return pv.Color.names.darkgray.darker().darker();
            }
            
            switch(type) {
                case 'fill':
                case 'stroke':
                    return this.dimColor(type, color);
            }
        }

        return this.base(type, color);
    }
});

def.type('pvc.visual.Line', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){
    
    var pvMark = protoMark.add(pv.Line);
    
    this.base(panel, pvMark, keyArgs);
    
    this.lockValue('segmented', true) // fixed
        .lockValue('antialias', true)
        ;

    if(!def.get(keyArgs, 'freePosition', false)){
        var basePosProp  = panel.isOrientationVertical() ? "left" : "bottom",
            orthoPosProp = panel.anchorOrtho(basePosProp);

        this/* Positions */
            .lock(orthoPosProp, 'y')
            .lock(basePosProp,  'x');
    }

    this/* Colors & Line */
        .intercept('strokeStyle', 'strokeColor')
        .intercept('lineWidth',   'strokeWidth')
        ;

    // Segmented lines use fill color instead of stroke...so this doesn't work.
    //this.pvMark.lineCap('square');
})
.add({
    _addInteractive: function(keyArgs){
        keyArgs = def.setDefaults(keyArgs, 
                        'noHover', true,
                        'noTooltips',  true);
        
        this.base(keyArgs);
    },

    /* Sign Spatial Coordinate System
     *  -> Cartesian coordinates
     *  -> Grows Up, vertically, and Right, horizontally
     *  -> Independent of the chart's orientation
     *  -> X - horizontal axis
     *  -> Y - vertical axis
     *
     *  y
     *  ^
     *  |
     *  |
     *  o-----> x
     */
    y: function(){ return 0; },
    x: function(){ return 0; },

    /* STROKE WIDTH */
    strokeWidth: function(){
        var strokeWidth = this.baseStrokeWidth();
        if(this.interactive && this.scene.anyInteraction()) {
            strokeWidth = this.interactiveStrokeWidth(strokeWidth);
        } else {
            strokeWidth = this.normalStrokeWidth(strokeWidth);
        }
        
        return strokeWidth;
    },
    
    baseStrokeWidth: function(){
        /* Delegate to possible lineWidth extension or default to 1.5 */
        return this.delegate(1.5);
    },

    normalStrokeWidth: function(strokeWidth){
        return strokeWidth;
    },

    interactiveStrokeWidth: function(strokeWidth){
        if(this.isActiveSeriesAware && this.scene.isActiveSeries()){
            /* - Ensure a normal width of at least 1,
             * - Double and a half that
             */
            return Math.max(1, strokeWidth) * 2.5;
        }

        return strokeWidth;
    },
    
    /* STROKE COLOR */
    strokeColor: function(){ 
        return this.color('stroke');
    },
    
    /**
     * @override
     */
    interactiveColor: function(type, color){
        var scene = this.scene;
        if(scene.anySelected() && !scene.isSelected()) {
            
            if(this.isActiveSeriesAware && scene.isActiveSeries()) {
                //return color.darker(1.5);
                return pv.Color.names.darkgray.darker().darker();
            }
            
            if(type === 'stroke'){
                return this.dimColor(type, color);
            }
        }

        return this.base(type, color);
    }
});

def.type('pvc.visual.Area', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){
    
    var pvMark = protoMark.add(pv.Area);
    
    this.base(panel, pvMark, keyArgs);
    
    var antialias = def.get(keyArgs, 'antialias', true),
        segmented = def.get(keyArgs, 'segmented', true);
    
    this
        .lockValue('segmented', segmented) // fixed, not inherited
        .lockValue('antialias', antialias)
        ;

    if(!def.get(keyArgs, 'freePosition', false)){
        var basePosProp  = panel.isOrientationVertical() ? "left" : "bottom",
            orthoPosProp = panel.anchorOrtho(basePosProp),
            orthoLenProp = panel.anchorOrthoLength(orthoPosProp);
        
        /* Positions */
        this
            .lock(basePosProp,  'x')  // ex: left
            .lock(orthoPosProp, 'y')  // ex: bottom
            .lock(orthoLenProp, 'dy') // ex: height
            ;
    }
    
    /* Colors */
    // NOTE: must be registered before fixAntialiasStrokeColor
    this.intercept('fillStyle', 'fillColor');
    
    /* Using antialias causes the vertical separation
     * of *segmented* areas to be noticed.
     * When lines are also shown, not using antialias
     * is ok because the ladder border that it causes is hidden by the line.
     * 
     * So, we only use antialias if there isn't a line 
     * to cover the side effect of not using it.
     */
    if(segmented && antialias) {
        // Try to hide the vertical lines noticeable between areas,
        // due to antialias
        this
            .lock('strokeStyle', 'fixAntialiasStrokeColor')
            // NOTE: must be registered after fixAntialiasStrokeColor
            .lock('lineWidth', 'fixAntialiasStrokeWidth')
            ;
    } else {
        // These really have no real meaning in the area and should not be used.
        // If lines are desired, they should be created with showLines of LineChart
        this.lockValue('strokeStyle', null)
            .lockValue('lineWidth',   0)
            ;
    }
})
.add({
    _addInteractive: function(keyArgs){
        keyArgs = def.setDefaults(keyArgs, 
                        'noHover', true,
                        'noTooltips',  true);

        this.base(keyArgs);
    },

    /* Sign Spatial Coordinate System
     *  -> Cartesian coordinates
     *  -> Grows Up, vertically, and Right, horizontally
     *  -> Independent of the chart's orientation
     *  -> X - horizontal axis
     *  -> Y - vertical axis
     *  
     *  y       ^
     *  ^    dY |
     *  |       - y
     *  |
     *  o-----> x
     */
    x:  function(){ return 0; },
    y:  function(){ return 0; },
    dy: function(){ return 0; },
    
    /* COLOR */
    fixAntialiasStrokeColor: function(){ 
        /* Copy fill color */
        return this.pvMark.fillStyle();
    },
    
    fillColor: function(){ 
        return this.color('fill');
    },
    
    /**
     * @override
     */
    interactiveColor: function(type, color){
        if(type === 'fill'){
            if(this.scene.anySelected() && !this.scene.isSelected()) {
                return this.dimColor(type, color);
            }
        }

        return this.base(type, color);
    },
    
    /* STROKE */
    fixAntialiasStrokeWidth: function(){
        // Hide the line when using alpha
        // Otherwise, show it to bridge the gaps of segmented areas.
        // If the line is too thick, 
        // the junctions become horrible on very small angles.
        var color = this.pvMark.strokeStyle();
        return (!color || color.a < 1) ? 0.00001 : 1;
    }
});

def.type('pvc.visual.Bar', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){

    var pvMark = protoMark.add(pv.Bar);
    
    this.base(panel, pvMark, keyArgs);

    this.normalStroke = def.get(keyArgs, 'normalStroke', false);

    this/* Colors */
        .intercept('fillStyle',   'fillColor'  )
        .intercept('strokeStyle', 'strokeColor')
        .intercept('lineWidth',   'strokeWidth')
        ;
})
.add({
    /* COLOR */
    fillColor: function(){ 
        return this.color('fill');
    },
    
    strokeColor: function(){
        return this.color('stroke');
    },

    /**
     * @override
     */
    normalColor: function(type, color){
        if(type === 'stroke' && !this.normalStroke){
            return null;
        }

        return color;
    },

    /**
     * @override
     */
    interactiveColor: function(type, color){
        var scene = this.scene;
        
        if(type === 'stroke'){
            if(scene.isActive){
               return color.brighter(1.3).alpha(0.7);
            }
            if(!this.normalStroke){
                return null;
            }

            if(scene.anySelected() && !scene.isSelected()) {
                if(this.isActiveSeriesAware && scene.isActiveSeries()) {
                    return pv.Color.names.darkgray.darker().darker();
                }

                return this.dimColor(type, color);
            }

        } else if(type === 'fill'){
            if(scene.isActive) {
                return color.brighter(0.2).alpha(0.8);
            } 

            if(scene.anySelected() && !scene.isSelected()) {
                if(this.isActiveSeriesAware && scene.isActiveSeries()) {
                    return pv.Color.names.darkgray.darker(2).alpha(0.8);
                }

                return this.dimColor(type, color);
            }
        }

        return this.base(type, color);
    },

    /* STROKE WIDTH */
    strokeWidth: function(){
        var strokeWidth = this.baseStrokeWidth();
        if(this.interactive && this.scene.anyInteraction()) {
            strokeWidth = this.interactiveStrokeWidth(strokeWidth);
        } else {
            strokeWidth = this.normalStrokeWidth(strokeWidth);
        }

        return strokeWidth;
    },

    baseStrokeWidth: function(){
        var value = this.delegate();
        if(value === undefined){
            value = this.defaultStrokeWidth();
        }

        return value;
    },

    defaultStrokeWidth: function(){
        return 0.5;
    },

    normalStrokeWidth: function(strokeWidth){
        return strokeWidth;
    },

    interactiveStrokeWidth: function(strokeWidth){
        if(this.scene.isActive){
            return Math.max(1, strokeWidth) * 1.3;
        }

        return strokeWidth;
    }
});


pv.PieSlice = function(){
    pv.Wedge.call(this);
};

pv.PieSlice.prototype = pv.extend(pv.Wedge);

// There's already a Wedge#midAngle method
// but it doesn't work well when end-angle isn't explicitly set,
// so we override the method.
pv.PieSlice.prototype.midAngle = function(){
    var instance = this.instance();
    return instance.startAngle + (instance.angle / 2);
};
    

def.type('pvc.visual.PieSlice', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){

    var pvMark = protoMark.add(pv.PieSlice);
    
    this.base(panel, pvMark, keyArgs);
    
    //this._normalRadius         = def.get(keyArgs, 'normalRadius',  10);
    this._activeOffsetRadius = def.get(keyArgs, 'activeOffsetRadius', 0);
    this._center = def.get(keyArgs, 'center');
    
    this/* Colors */
        .intercept('fillStyle',     'fillColor'  )
        .intercept('strokeStyle',   'strokeColor')
        .optionalValue('lineWidth',  0.6)
        .intercept('angle', 'angle')
        .lock('bottom', 'y')
        .lock('left',   'x')
        .lockValue('top',   null)
        .lockValue('right', null)
        ;
})
.add({
    // Ensures that it is evaluated before x and y
    angle: function(){
        return 0;
    },
    
    x: function(){
        return this._center.x + this._offsetSlice('cos'); 
    },
    
    y: function(){ 
        return this._center.y - this._offsetSlice('sin'); 
    },
    
    _offsetSlice: function(fun) {
        var offset = this._getOffsetRadius();
        if(offset !== 0){
            offset = offset * Math[fun](this.pvMark.midAngle());
        }
            
        return offset;
    },
    
    _getOffsetRadius: function(){
        var offset = this.state.offsetRadius;
        if(offset == null){
            offset = (this.state.offsetRadius = this.offsetRadius() || 0);
        }
        
        return offset;
    },
    
    /* COLOR */
    fillColor:   function(){ return this.color('fill');   },
    strokeColor: function(){ return this.color('stroke'); },
    
    /**
     * @override
     */
    defaultColor: function(type){
        if(type === 'stroke'){
            return null;
        }
        
        return this.base(type);
    },
    
    /**
     * @override
     */
    interactiveColor: function(type, color){
        var scene = this.scene;
        if(scene.isActive) {
            switch(type) {
                // Like the bar chart
                case 'fill':   return color.brighter(0.2).alpha(0.8);
                case 'stroke': return color.brighter(1.3).alpha(0.7);
            }
        } else if(scene.anySelected() && !scene.isSelected()) {
            switch(type) {
                case 'fill':
                //case 'stroke': // ANALYZER requirements, so until there's no way to configure it...
                    return this.dimColor(type, color);
            }
        }

        return this.base(type, color);
    },
    
    /* Offset */
    offsetRadius: function(){
        var offsetRadius = this.baseOffsetRadius();
        if(this.interactive && this.scene.anyInteraction()) {
            offsetRadius = this.interactiveOffsetRadius(offsetRadius);
        } else {
            offsetRadius = this.normalOffsetRadius(offsetRadius);
        }
        
        return offsetRadius;
    },
    
    baseOffsetRadius: function(){
        return 0;
    },

    normalOffsetRadius: function(offsetRadius){
        return offsetRadius;
    },
    
    interactiveOffsetRadius: function(offsetRadius){
        if(this.scene.isActive){
            return offsetRadius + this._activeOffsetRadius;
        }

        return offsetRadius;
    }
});

def.type('pvc.visual.Rule', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){

    var pvMark = protoMark.add(pv.Rule);

    this.base(panel, pvMark, keyArgs);

    this/* Colors & Line */
        .intercept('strokeStyle', 'strokeColor')
        .intercept('lineWidth',   'strokeWidth')
        ;
})
.add({
    _addInteractive: function(keyArgs){
        keyArgs = def.setDefaults(keyArgs,
                        'noHover', true,
                        'noSelect',  true,
                        'noTooltips',    true,
                        'noClick',       true,
                        'noDoubleClick', true);

        this.base(keyArgs);
    },

    /* STROKE WIDTH */
    strokeWidth: function(){
        var strokeWidth = this.baseStrokeWidth();
        if(this.interactive && this.scene.anyInteraction()) {
            strokeWidth = this.interactiveStrokeWidth(strokeWidth);
        } else {
            strokeWidth = this.normalStrokeWidth(strokeWidth);
        }

        return strokeWidth;
    },

    baseStrokeWidth: function(){
        var value = this.delegate();
        if(value === undefined){
            value = this.defaultStrokeWidth();
        }

        return value;
    },

    defaultStrokeWidth: function(){
        return 1;
    },
    
    normalStrokeWidth: function(strokeWidth){
        return strokeWidth;
    },

    interactiveStrokeWidth: function(strokeWidth){
        if(this.scene.isActive){
            return Math.max(1, strokeWidth) * 2.2;
        }

        return strokeWidth;
    },

    /* STROKE COLOR */
    strokeColor: function(){
        return this.color('stroke');
    },

    /**
     * @override
     */
    interactiveColor: function(type, color){
        var scene = this.scene;
        
        if(!scene.isActive && scene.anySelected() && !scene.isSelected()) {
            return this.dimColor(type, color);
        }
        
        return this.base(type, color);
    }
});
/**
 * Initializes a visual context.
 * 
 * @name pvc.visual.Context
 * 
 * @class Represents a visualization context.  
 * The visualization context gives access to all relevant information
 * for rendering or interacting with a visualization.
 * <p>
 * A visualization context object <i>may</i> be reused
 * across extension points invocations and actions.
 * </p>
 * 
 * @property {pvc.BaseChart} chart The chart instance.
 * @property {pvc.BasePanel} panel The panel instance.
 * @property {number} index The render index.
 * @property {pvc.visual.Scene} scene The render scene.
 * @property {object} event An event object, present when a click or double-click action is being processed.
 * @property {pv.Mark} pvMark The protovis mark.
 * 
 * @constructor
 * @param {pvc.BasePanel} panel The panel instance.
 * @param {pv.Mark} mark The protovis mark.
 * @param {object} [event] An event object.
 */
def.type('pvc.visual.Context')
.init(function(panel, mark, event){
    this.chart = panel.chart;
    this.panel = panel;
    
    visualContext_update.call(this, mark, event);
})
.add(/** @lends pvc.visual.Context */{
    isPinned: false,
    
    pin: function(){
        this.isPinned = true;
        return this;
    },
    
    /* V1 DIMENSION ACCESSORS */
    getV1Series: function(){
        var s;
        return this.scene.atoms && (s = this.scene.atoms[this.panel._getV1DimName('series')]) && s.rawValue;
    },
    
    getV1Category: function(){
        var c;
        return this.scene.atoms && (c = this.scene.atoms[this.panel._getV1DimName('category')]) && c.rawValue;
    },
               
    getV1Value: function(){
        var v;
        return this.scene.atoms && (v = this.scene.atoms[this.panel._getV1DimName('value')]) && v.value;
    }
});

/**
 * Used internally to update a visual context.
 * 
 * @name pvc.visual.Context#_update
 * @function
 * @param {pv.Mark} mark The protovis mark being rendered or targeted by an event.
 * @param {object} [event] An event object.
 * @type undefined
 * @private
 * @virtual
 * @internal
 */
function visualContext_update(mark, event){

    this.sign   = mark.sign || null;
    this.event  = event || null;
    this.index  = mark.index; // !scene => index = null
    this.pvMark = mark;

    var instance = mark.instance(),
        scene = instance._scene;
    
    if(!scene){
        var group = instance.group,
            datum = group ? null : instance.datum;
        
        scene = new pvc.visual.Scene(null, {
            panel: this.panel,
            group: group,
            datum: datum
        });
    }

    this.scene = scene;
}// Sharing this globally allows other axes sub types to inherit
//  their own options defs from this one.
// A ccc-wide closure can hide this from global scope.
var axis_optionsDef;

def.scope(function(){

/**
 * Initializes an axis.
 * 
 * @name pvc.visual.Axis
 * 
 * @class Represents an axis for a role in a chart.
 * 
 * @property {pvc.BaseChart} chart The associated chart.
 * @property {string} type The type of the axis.
 * @property {number} index The index of the axis within its type (0, 1, 2...).
 * @property {pvc.visual.Role} role The associated visual role.
 * @property {pv.Scale} scale The associated scale.
 * 
 * @constructor
 * @param {pvc.BaseChart} chart The associated cartesian chart.
 * @param {string} type The type of the axis.
 * @param {number} [index=0] The index of the axis within its type.
 * @param {object|object[]} dataCells The associated data cells (role + data parts).
 * 
 * @param {object} [keyArgs] Keyword arguments.
 * @param {pv.Scale} scale The associated scale.
 */
def.type('pvc.visual.Axis')
.init(function(chart, type, index, dataCells, keyArgs){
    /*jshint expr:true */
    dataCells || def.fail.argumentRequired('dataCells');
    
    this.chart = chart;
    this.type  = type;
    this.index = index == null ? 0 : index;
    this.dataCells = def.array.as(dataCells);
    this.dataCell  = this.dataCells[0];
    this.role = this.dataCell && this.dataCell.role;
    
    this.scaleType = groupingScaleType(this.role.grouping);
    this.id = pvc.visual.Axis.getId(this.type, this.index);
    
    this.option = pvc.options(this._getOptionsDefinition(), this);
    
    this._checkRoleCompatibility();
    
    this.setScale(def.get(keyArgs, 'scale', null));
})
.add(/** @lends pvc.visual.Axis# */{
    isVisible: true,
   
    setScale: function(scale){
        this.scale = scale;
        
        if(scale){
            scale.type = this.scaleType;
        }
        
        return this;
    },
    
    /**
     * Determines the type of scale required by the axis.
     * The scale types are 'Discrete', 'Timeseries' and 'Continuous'.
     * 
     * @type string
     */
    scaleType: function(){
        return groupingScaleType(this.role.grouping);
    },
    
    /**
     * Obtains a scene-scale function to compute values of this axis' main role.
     * 
     * @param {object} [keyArgs] Keyword arguments object.
     * @param {string} [keyArgs.sceneVarName] The local scene variable name by which this axis's role is known. Defaults to the role's name.
     * @param {boolean} [keyArgs.nullToZero=true] Indicates that null values should be converted to zero before applying the scale.
     * @type function
     */
    sceneScale: function(keyArgs){
        var varName  = def.get(keyArgs, 'sceneVarName') || this.role.name,
            grouping = this.role.grouping;

        if(grouping.isSingleDimension && grouping.firstDimension.type.valueType === Number){
            var scale = this.scale,
                nullToZero = def.get(keyArgs, 'nullToZero', true);
            
            var by = function(scene){
                var value = scene.vars[varName].value;
                if(value == null){
                    if(!nullToZero){
                        return value;
                    }
                    value = 0;
                }
                return scale(value);
            };
            def.copy(by, scale);
            
            return by;
        }

        return this.scale.by1(function(scene){
            return scene.vars[varName].value;
        });
    },
    
    _getOptionsDefinition: function(){
        return axis_optionsDef;
    },
    
    _checkRoleCompatibility: function(){
        var L = this.dataCells.length;
        if(L > 1){
            var grouping = this.role.grouping, 
                i;
            if(this.scaleType === 'Discrete'){
                for(i = 1; i < L ; i++){
                    if(grouping.id !== this.dataCells[i].role.grouping.id){
                        throw def.error.operationInvalid("Discrete roles on the same axis must have equal groupings.");
                    }
                }
            } else {
                if(!grouping.firstDimension.type.isComparable){
                    throw def.error.operationInvalid("Continuous roles on the same axis must have 'comparable' groupings.");
                }

                for(i = 1; i < L ; i++){
                    if(this.scaleType !== groupingScaleType(this.dataCells[i].role.grouping)){
                        throw def.error.operationInvalid("Continuous roles on the same axis must have scales of the same type.");
                    }
                }
            }
        }
    }
});

/**
 * Calculates the id of an axis given its type and index.
 * @param {string} type The type of the axis.
 * @param {number} index The index of the axis within its type. 
 * @type string
 */
pvc.visual.Axis.getId = function(type, index){
    if(index === 0) {
        return type; // base, ortho, legend
    }
    
    return type + "" + (index + 1); // base2, ortho3,..., legend2
};

function groupingScaleType(grouping){
    return grouping.isDiscrete() ?
                'Discrete' :
                (grouping.firstDimension.type.valueType === Date ?
                'Timeseries' :
                'Continuous');
}

axis_optionsDef = {
// NOOP
};

});def.scope(function(){

    var $VA = pvc.visual.Axis;
/**
 * Initializes a cartesian axis.
 * 
 * @name pvc.visual.CartesianAxis
 * 
 * @class Represents an axis for a role in a cartesian chart.
 * <p>
 * The main properties of an axis: {@link #type}, {@link #orientation} and relevant chart's properties 
 * are related as follows:
 * </p>
 * <pre>
 * axisType={base, ortho} = f(axisOrientation={x,y})
 * 
 *          Vertical   Horizontal   (chart orientation)
 *         +---------+-----------+
 *       x | base    |   ortho   |
 *         +---------+-----------+
 *       y | ortho   |   base    |
 *         +---------+-----------+
 * (axis orientation)
 * </pre>
 * 
 * @extends pvc.visual.Axis
 * 
 * @property {pvc.CartesianAbstract} chart The associated cartesian chart.
 * @property {string} type The type of the axis. One of the values: 'base' or 'ortho'.
 * @property {string} orientation The orientation of the axis. 
 * One of the values: 'x' or 'y', for horizontal and vertical axis orientations, respectively.
 * @property {string} orientedId The id of the axis with respect to the orientation and the index of the axis ("").
 * 
 * @constructor
 * @param {pvc.CartesianAbstract} chart The associated cartesian chart.
 * @param {string} type The type of the axis. One of the values: 'base' or 'ortho'.
 * @param {number} [index=0] The index of the axis within its type.
 * @param {object|object[]} dataCells The associated data cells (role + data parts).
 * 
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.visual.Axis} for supported keyword arguments. 
 */
def
.type('pvc.visual.CartesianAxis', $VA)
.init(function(chart, type, index, dataCells, keyArgs){
    
    this.base(chart, type, index, dataCells, keyArgs);
    
    // ------------
    
    var options = chart.options;
    
    this.orientation = $VCA.getOrientation(this.type, options.orientation);
    this.orientedId  = $VCA.getOrientedId(this.orientation, this.index);
    this.v1OptionId  = $VCA.getV1OptionId(this.orientation, this.index);

    if(this.index !== 1) {
        this.isVisible = options['show' + def.firstUpperCase(this.orientedId) + 'Scale'];
    } else {
        this.isVisible = !!options.secondAxisIndependentScale; // options.secondAxis is already true or wouldn't be here
    }
})
.add(/** @lends pvc.visual.CartesianAxis# */{
    
    setScale: function(scale){
        
        if(this.scale){
            // If any
            delete this.domain;
            delete this.ticks;
            delete this._roundingPaddings;
        }
        
        this.base(scale);
        
        if(scale){
            if(!scale.isNull && this.scaleType !== 'Discrete'){
                // Original data domain, before nice or tick rounding
                this.domain = scale.domain();
                
                if(this.scaleType === 'Continuous'){
                    var roundMode = this.option('DomainRoundMode');
                    if(roundMode === 'nice'){
                        scale.nice();
                    }
                }
            }
        }
        
        return this;
    },
    
    setTicks: function(ticks){
        var scale = this.scale;
        
        /*jshint expr:true */
        (scale && !scale.isNull) || def.fail.operationInvalid("Scale must be set and non-null.");
        
        this.ticks = ticks;
        
        if(scale.type === 'Continuous' && this.option('DomainRoundMode') === 'tick'){
            
            delete this._roundingPaddings;
            
            // Commit calculated ticks to scale's domain
            var tickCount = ticks && ticks.length;
            if(tickCount){
                this.scale.domain(ticks[0], ticks[tickCount - 1]);
            } else {
                // Reset scale domain
                this.scale.domain(this.domain[0], this.domain[1]);
            }
        }
    },
    
    setScaleRange: function(size){
        var scale = this.scale;
        scale.min  = 0;
        scale.max  = size;
        scale.size = size; // original size // TODO: remove this...
        
        // -------------
        
        if(scale.type === 'Discrete'){
            if(scale.domain().length > 0){ // Has domain? At least one point is required to split.
                var bandRatio = this.chart.options.panelSizeRatio || 0.8;
                scale.splitBandedCenter(scale.min, scale.max, bandRatio);
            }
        } else {
            scale.range(scale.min, scale.max);
        }
        
        if(pvc.debug >= 4){
            pvc.log("Scale: " + JSON.stringify(def.copyOwn(scale)));
        }
        
        return scale;
    },
    
    getScaleRoundingPaddings: function(){
        var roundingPaddings = this._roundingPaddings;
        if(!roundingPaddings){
            roundingPaddings = {begin: 0, end: 0};
            
            var scale = this.scale;
            var roundMode;
            
            while(scale && !scale.isNull && scale.type === 'Continuous' && 
                  (roundMode = this.option('DomainRoundMode')) !== 'none'){
                
                var currDomain = scale.domain();
                var origDomain = this.domain || def.assert("Must be set");
                
                var currLength = currDomain[1] - currDomain[0];
                if(currLength){
                    var dif = origDomain[0] - currDomain[0];
                    if(dif > 0){
                        roundingPaddings.begin = dif / currLength;
                    }

                    dif = currDomain[1] - origDomain[1];
                    if(dif > 0){
                        roundingPaddings.end = dif / currLength;
                    }
                }
                
                break;
            }
            
            this._roundingPaddings = roundingPaddings;
        }
        
        return roundingPaddings;
    },
    
    _getOptionsDefinition: function(){
        return cartAxis_optionsDef;
    }
});

var $VCA = pvc.visual.CartesianAxis;

/**
 * Obtains the type of the axis given an axis orientation and a chart orientation.
 * 
 * @param {string} axisOrientation The orientation of the axis. One of the values: 'x' or 'y'.
 * @param {string} chartOrientation The orientation of the chart. One of the values: 'horizontal' or 'vertical'.
 * 
 * @type string
$VCA.getTypeFromOrientation = function(axisOrientation, chartOrientation){
    return ((axisOrientation === 'x') === (chartOrientation === 'vertical')) ? 'base' : 'ortho';  // NXOR
};
 */

/**
 * Obtains the orientation of the axis given an axis type and a chart orientation.
 * 
 * @param {string} type The type of the axis. One of the values: 'base' or 'ortho'.
 * @param {string} chartOrientation The orientation of the chart. One of the values: 'horizontal' or 'vertical'.
 * 
 * @type string
 */
$VCA.getOrientation = function(type, chartOrientation){
    return ((type === 'base') === (chartOrientation === 'vertical')) ? 'x' : 'y';  // NXOR
};

/**
 * Calculates the oriented id of an axis given its orientation and index.
 * @param {string} orientation The orientation of the axis.
 * @param {number} index The index of the axis within its type. 
 * @type string
 */
$VCA.getOrientedId = function(orientation, index){
    switch(index) {
        case 0: return orientation; // x, y
        case 1: return "second" + orientation.toUpperCase(); // secondX, secondY
    }
    
    return orientation + "" + (index + 1); // y3, x4,...
};

/**
 * Calculates the V1 options id of an axis given its orientation and index.
 * 
 * @param {string} orientation The orientation of the axis.
 * @param {number} index The index of the axis within its type. 
 * @type string
 */
$VCA.getV1OptionId = function(orientation, index){
    switch(index) {
        case 0: return orientation; // x, y
        case 1: return "second";    // second
    }
    
    return orientation + "" + (index + 1); // y3, x4,...
};

/* PRIVATE STUFF */

/**
 * Obtains the value of an option using a specified final name.
 * 
 * @name pvc.visual.CartesianAxis#_chartOption
 * @function
 * @param {string} name The chart option name.
 * @private
 * @type string
 */
function chartOption(name) {
    return this.chart.options[name];
}

// Creates a resolve method, 
// suitable for an option manager option specification, 
// that combines a list of resolvers. 
// The resolve stops when the first resolver returns the value <c>true</c>,
// returning <c>true</c> as well.
function resolvers(list){
    return function(axis){
        for(var i = 0, L = list.length ; i < L ; i++){
            if(list[i].call(this, axis) === true){
                return true;
            }
        }
    };
}

function axisSpecify(getAxisPropValue){
    return axisResolve(getAxisPropValue, 'specify');
}

function axisDefault(getAxisPropValue){
    return axisResolve(getAxisPropValue, 'defaultValue');
}

function axisResolve(getAxisPropValue, operation){
    return function(axis){ 
        var value = getAxisPropValue.call(axis, this.name, this);
        if(value !== undefined){
            this[operation || 'specify'](value);
            return true;
        }
    };
}

// baseAxisOffset, orthoAxisOffset, 
axisSpecify.byId = axisSpecify(function(name){
    return chartOption.call(this, this.id + "Axis" + name);
});

// xAxisOffset, yAxisOffset, secondAxisOffset
axisSpecify.byV1OptionId = axisSpecify(function(name){
    return chartOption.call(this, this.v1OptionId + 'Axis' + name); 
});

// axisOffset
axisSpecify.byCommonId = axisSpecify(function(name){
    return chartOption.call(this, 'axis' + name);
});

var resolveNormal = resolvers([
   axisSpecify.byId,
   axisSpecify.byV1OptionId,
   axisSpecify.byCommonId
]);

var specNormal = { resolve: resolveNormal };

/* orthoFixedMin, orthoFixedMax */
var fixedMinMaxSpec = {
    resolve: resolvers([
        axisSpecify.byId,
        axisSpecify.byV1OptionId,
        axisSpecify(function(name){
            if(!this.index && this.type === 'ortho'){
                // Bare Id (no "Axis")
                return chartOption.call(this, this.id + name);
            }
        }),
        axisSpecify.byCommonId
    ]),
    cast: Number2
};

var cartAxis_optionsDef = def.create(axis_optionsDef, {
    /*
     * 1     <- useCompositeAxis
     * >= 2  <- false
     */
    Composite: {
        resolve: resolvers([
            axisSpecify(function(name){
                // Only first axis can be composite?
                if(this.index > 0) {
                    return false;
                }
                
                return chartOption.call(this, 'useCompositeAxis');
            }),
            resolveNormal
        ]),
        cast:  Boolean,
        value: false
    },
    
    /* xAxisSize,
     * secondAxisSize || xAxisSize 
     */
    Size: {
        resolve: resolveNormal,
        cast:    Number2
    },
    
    SizeMax: specNormal,
    
    /* xAxisPosition,
     * secondAxisPosition <- opposite(xAxisPosition) 
     */
    Position: {
        resolve: resolvers([
            resolveNormal,
            
            // Dynamic default value
            axisDefault(function(name){
                if(this.index > 0) {
                    // Use the position opposite to that of the first axis 
                    // of same orientation
                    var optionId0 = $VCA.getV1OptionId(this.orientation, 0);
                    
                    var position0 = chartOption.call(this, optionId0 + 'Axis' + name) ||
                                    'left';
                    
                    return pvc.BasePanel.oppositeAnchor[position0];
                }
            })
        ])
    },
    
    /* orthoFixedMin, orthoFixedMax */
    FixedMin: fixedMinMaxSpec,
    FixedMax: fixedMinMaxSpec,
    
    /* 1 <- originIsZero
     * 2 <- secondAxisOriginIsZero
     */
    OriginIsZero: {
        resolve: resolvers([
            resolveNormal,
            axisSpecify(function(name){
                switch(this.index){
                    case 0: return chartOption.call(this, 'originIsZero');
                    case 1: return chartOption.call(this, 'secondAxisOriginIsZero');
                }
            })
        ]),
        cast:  Boolean,
        value: true 
    }, 
    
    /* 1 <- axisOffset, 
     * 2 <- secondAxisOffset, 
     */
    Offset:  {
        resolve: resolvers([
            axisSpecify.byId,
            axisSpecify.byV1OptionId,
            // axisOffset only applies to index 0!
            axisSpecify(function(name){
                switch(this.index) {
                    case 0: return chartOption.call(this, 'axisOffset');
                    case 1: return chartOption.call(this, 'secondAxisOffset');
                }
            })
        ]),
        cast: Number2
    },
    
    LabelSpacingMin: {
        resolve: resolveNormal,
        cast:    Number2,
        value:   1 // em
    },
    
    OverlappedLabelsHide: {
        resolve: resolveNormal,
        cast:    Boolean,
        value:   false 
    },
    
    OverlappedLabelsMaxPct: {
        resolve: resolveNormal,
        cast:    Number2,
        value:   0.2
    },
    
    /* RULES */
    FullGrid: {
        resolve: resolveNormal,
        cast:    Boolean,
        value:   false
    },
    FullGridCrossesMargin: {
        resolve: resolveNormal,
        cast:    Boolean,
        value:   true
    },
    EndLine:  {
        resolve: resolveNormal,
        cast:    Boolean
    },
    ZeroLine: {
        resolve: resolveNormal,
        cast:    Boolean,
        value:   true 
    },
    RuleCrossesMargin: {
        resolve: resolveNormal,
        cast:    Boolean,
        value:   true
    },
    
    /* TICKS */
    DesiredTickCount: {
        resolve: resolveNormal,
        cast: Number2
    },
    MinorTicks: {
        resolve: resolveNormal,
        cast:    Boolean,
        value:   true 
    },
    DomainRoundMode: {
        resolve: resolveNormal,
        cast:    String,
        value:   'none'
    },
    TickExponentMin: {
        resolve: resolveNormal,
        cast:    Number2 
    },
    TickExponentMax: {
        resolve: resolveNormal,
        cast:    Number2
    },
    
    /* TITLE */
    Title: {
        resolve: resolveNormal,
        cast:    String  
    },
    TitleSize: {
        resolve: resolveNormal,
        cast:    Number2 
    }, // It's a pvc.Size, actually
    TitleSizeMax: specNormal, 
    TitleFont: {
        resolve: resolveNormal,
        cast:    String 
    },
    TitleMargins:  specNormal,
    TitlePaddings: specNormal,
    TitleAlign: {
        resolve: resolveNormal,
        cast:    String 
    },
    
    Font: {
        resolve: resolveNormal,
        cast:    String
    },
    
    ClickAction: specNormal,
    DoubleClickAction: specNormal
});

function Number2(value) {
    if(value != null) {
        value = +value; // to number
        if(isNaN(value)) {
            value = null;
        }
    }
    
    return value;
}

});def.scope(function(){

var $VA = pvc.visual.Axis;

/**
 * Initializes a color axis.
 * 
 * @name pvc.visual.ColorAxis
 * 
 * @class Represents an axis that maps colors to the values of a role.
 * 
 * @extends pvc.visual.Axis
 */
def
.type('pvc.visual.ColorAxis', $VA)
.init(function(chart, type, index, dataCells, keyArgs){
    
    this.base(chart, type, index, dataCells, keyArgs);
    
    this.optionId = pvc.buildIndexedId('legend', this.index);
    
    // ------------
    
    /* this.scaleType === 'Discrete' && */
    
    // All this, currently only works well for discrete colors...
    // pvc.createColorScheme creates discrete color scale factories
    var options = chart.options;
    var colorsFactory;
    
    if(this.index === 1){
        var useOwnColors = options.secondAxisOwnColors;
        if(useOwnColors == null){
            useOwnColors = chart.compatVersion() <= 1;
        }
        
        if(useOwnColors){
            /* if secondAxisColor is unspecified, assumes default color scheme. */
            colorsFactory = pvc.createColorScheme(options.secondAxisColor);
        }
    } else {
        colorsFactory = pvc.createColorScheme(options.colors);
    }
    
    this.hasOwnColors = !!colorsFactory;
    if(!colorsFactory){
        var color0Axis = chart.axes.color;
        colorsFactory = color0Axis ? color0Axis.colorsFactory : null;
    }
    
    this.colorsFactory = colorsFactory;
    
    // -----------------
    
    if(this.role.isBound()){
        var dataCell   = this.dataCell;
        var domainData = chart.partData(dataCell.dataPartValues)
                              .flattenBy(dataCell.role);
        
        var scale;
        if(!this.hasOwnColors){
            var color0Axis = chart.axes.color;
            scale = color0Axis ? color0Axis.scale : null;
        }
        
        if(!scale){
            this.hasOwnColors = true;
            
            var domainValues = domainData
                                  .children()
                                  .select(function(child){ return child.value; })
                                  .array();
            scale = colorsFactory(domainValues);
        }
        
        this.setScale(scale);
        
        this.domainData = domainData;
    }
    
    this.isVisible = this.option('Visible');
})
.add(/** @lends pvc.visual.ColorAxis# */{
    
    legendBulletGroupScene: null,
    
    _getOptionsDefinition: function(){
        return colorAxis_optionsDef;
    },
    
    _getOptionByOptionId: function(name){
        return chartOption.call(this, this.optionId + name);
    }
});

var $VCA = pvc.visual.ColorAxis;

/* PRIVATE STUFF */

/**
 * Obtains the value of an option using a specified final name.
 * 
 * @name pvc.visual.CartesianAxis#_chartOption
 * @function
 * @param {string} name The chart option name.
 * @private
 * @type string
 */
function chartOption(name) {
    return this.chart.options[name];
}

function resolve(fun, operation){
    return function(axis){
        var value = fun.call(axis, this.name, this);
        if(value !== undefined){
            this[operation || 'specify'](value);
            return true;
        }
    };
}

resolve.byOptionId = resolve($VCA.prototype._getOptionByOptionId);

function resolveNormal(axis){
    return resolve.byOptionId.call(this, axis);
}

function castSize(size, axis){
    // Single size or sizeMax (a number or a string)
    // should be interpreted as meaning the orthogonal length.
    
    if(!def.object.is(size)){
        var position = this.option('Position');
        size = new pvc.Size()
              .setSize(size, {
                  singleProp: pvc.BasePanel.orthogonalLength[position]
               });
    }
    
    return size;
}

function castAlign(align, axis){
    var position = this.option('Position');
    return pvc.parseAlign(position, align);
}

var colorAxis_optionsDef = def.create(axis_optionsDef, {
    /* 
     * legendVisible 
     */
    Visible: {
        resolve: resolveNormal,
        cast:    Boolean,
        value:   true
    },
    
    /* legendPosition */
    Position: {
        resolve: resolveNormal,
        cast:    pvc.parsePosition,
        value:   'bottom'
    },
    
    /* legendSize,
     * legend2Size 
     */
    Size: {
        resolve: resolveNormal,
        cast:    castSize
    },
    
    SizeMax: {
        resolve: resolveNormal,
        cast:    castSize
    },
    
    Align: {
        resolve: function(axis){
            if(!resolve.byOptionId.call(this, axis)){
                // Default value of align depends on position
                var position = this.option('Position');
                var align;
                if(position !== 'top' && position !== 'bottom'){
                    align = 'top';
                } else if(axis.chart.compatVersion() <= 1) { // centered is better
                    align = 'left';
                }
                
                this.defaultValue(align);
            }
        },
        cast: castAlign
    },
    
    Font: {
        resolve: resolveNormal,
        cast:    String
    },
    
    Margins:  {
        resolve: function(axis){
            if(!resolve.byOptionId.call(this, axis)){
                
                // Default value of margins depends on position
                if(axis.chart.compatVersion() > 1){
                    var position = this.option('Position');
                    
                    // Set default margins
                    var margins = def.set({}, pvc.BasePanel.oppositeAnchor[position], 5);
                    
                    this.defaultValue(margins);
                }
            }
        },
        cast: pvc.Sides.as
    },
    
    Paddings: {
        resolve: resolveNormal,
        cast:    pvc.Sides.as,
        value:   5
    },
    
    Font: {
        resolve: resolveNormal,
        cast:    String,
        value:   '10px sans-serif'
    },
    
    ClickMode: {
        resolve: resolveNormal,
        cast:    pvc.parseLegendClickMode,
        value:   'toggleVisible'
    },
    
    DrawLine: {
        resolve: resolveNormal,
        cast:    Boolean,
        value:   false
    },
    
    DrawMarker: {
        resolve: resolveNormal,
        cast:    Boolean,
        value:   true
    },
    
    Shape: {
        resolve: resolveNormal,
        cast:    pvc.parseShape
    }
});

function Number2(value) {
    if(value != null) {
        value = +value; // to number
        if(isNaN(value)) {
            value = null;
        }
    }
    
    return value;
}

});def.space('pvc.visual.legend', function(legend){
    
    legend.buildKey = function(legendType, dataCell){
        // If dataPartValues is an array, it is converted to a comma-separated string
        return legendType + '|' + 
               dataCell.role.name + '|' + 
               (dataCell.dataPartValues != null ? dataCell.dataPartValues : ''); 
    };
});
/**
 * Initializes a legend bullet root scene.
 * 
 * @name pvc.visual.legend.BulletRootScene
 * 
 * @extends pvc.visual.Scene
 * 
 * @constructor
 * @param {pvc.visual.Scene} [parent] The parent scene, if any.
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.visual.Scene} for supported keyword arguments.
 */
def
.type('pvc.visual.legend.BulletRootScene', pvc.visual.Scene)
.init(function(parent, keyArgs){
    
    this.base(parent, keyArgs);
    
    var markerDiam = def.get(keyArgs, 'markerSize', 15);
    var padding    = new pvc.Sides(def.get(keyArgs, 'padding', 5))
                        .resolve(markerDiam, markerDiam);
    def.set(this.vars,
        'horizontal', def.get(keyArgs, 'horizontal', false),
        'font',       def.get(keyArgs, 'font'),
        'markerSize', markerDiam, // Diameter of bullet/marker zone
        'textMargin', def.get(keyArgs, 'textMargin', 6),  // Space between marker and text 
        'padding',    padding);
})
.add(/** @lends pvc.visual.legend.BulletRootScene# */{
    layout: function(layoutInfo){
        // Any size available?
        var clientSize = layoutInfo.clientSize;
        if(!(clientSize.width > 0 && clientSize.height > 0)){
            return new pvc.Size(0,0);
        }
        
        // The size of the biggest cell
        var markerDiam = this.vars.markerSize;
        var textLeft   = markerDiam + this.vars.textMargin;
        var padding    = this.vars.padding;
        
        // Names are for legend items when layed out in rows
        var a_width  = this.vars.horizontal ? 'width' : 'height';
        var a_height = pvc.BasePanel.oppositeLength[a_width]; // height or width
        
        var maxRowWidth = clientSize[a_width]; // row or col
        var row;
        var rows = [];
        var contentSize = {width: 0, height: 0};
        
        this.childNodes.forEach(function(groupScene){
            groupScene.childNodes.forEach(layoutItem, this);
        }, this);
        
        // If there's no pending row to commit, there are no rows...
        // No items or just items with no text -> hide
        if(!row){
            return new pvc.Size(0,0);
        }
        
        commitRow(/* isLast */ true);
        
        // In logical "row" naming 
        def.set(this.vars, 
            'rows',     rows,
            'rowCount', row,
            'size',     contentSize);
        
        var isV1Compat = this.compatVersion() <= 1;
        var requestSize = def.set({},
                // Request used width / all available width (V1)
                a_width,  isV1Compat ? clientSize[a_width] : contentSize.width,
                a_height, Math.min(contentSize.height, clientSize[a_height]));
        
        return requestSize;
        
        function layoutItem(itemScene){
            // The names of props  of textSize and itemClientSize 
            // are to be taken literally.
            // This is because items, themselves, are always laid out horizontally...
            var textSize = itemScene.labelTextSize();
            
            var hidden = !textSize || !textSize.width || !textSize.height;
            itemScene.isHidden = hidden;
            if(hidden){
                return;
            }  
            
            // Add small margin to the end of the text eq to 0.5em
            var widthMargin = 0;// (textSize.height / 2);
            
            // not padded size
            var itemClientSize = {
                width:  textLeft + textSize.width + widthMargin,
                height: Math.max(textSize.height, markerDiam)
            };
            
            // -------------
            
            var isFirstInRow;
            if(!row){
                row = new pvc.visual.legend.BulletItemSceneRow(0);
                isFirstInRow = true;
            } else {
                isFirstInRow = !row.items.length;
            }
            
            var newRowWidth = row.size.width + itemClientSize[a_width]; // or bottom
            if(!isFirstInRow){
                newRowWidth += padding[a_width]; // separate from previous item
            }
            
            // If not the first column of a row and the item does not fit
            if(!isFirstInRow && (newRowWidth > maxRowWidth)){
                commitRow(/* isLast */ false);
                
                newRowWidth = itemClientSize[a_width];
            }
            
            // Add item to row
            var rowSize = row.size;
            rowSize.width  = newRowWidth;
            rowSize.height = Math.max(rowSize.height, itemClientSize[a_height]);
            
            var rowItemIndex = row.items.length;
            row.items.push(itemScene);
            
            def.set(itemScene.vars,
                    'row', row, // In logical "row" naming
                    'rowIndex', rowItemIndex, // idem
                    'clientSize', itemClientSize);
        }
        
        function commitRow(isLast){
            var rowSize = row.size;
            contentSize.height += rowSize.height;
            if(rows.length){
                // Separate rows
                contentSize.height += padding[a_height];
            }
            
            contentSize.width = Math.max(contentSize.width, rowSize.width);
            rows.push(row);
            
            // New row
            if(!isLast){
                row = new pvc.visual.legend.BulletItemSceneRow(rows.length);
            }
        }
    },
    
    defaultGroupSceneType: function(){
        var GroupType = this._bulletGroupType;
        if(!GroupType){
            GroupType = def.type(pvc.visual.legend.BulletGroupScene);
            
            // Apply legend group scene extensions
            //this.panel()._extendSceneType('group', GroupType, ['...']);
            
            this._bulletGroupType = GroupType;
        }
        
        return GroupType;
    },
    
    createGroup: function(keyArgs){
        var GroupType = this.defaultGroupSceneType();
        return new GroupType(this, keyArgs);
    }
});

def
.type('pvc.visual.legend.BulletItemSceneRow')
.init(function(index){
    this.index = index;
    this.items = [];
    this.size  = {width: 0, height: 0};
});
/**
 * Initializes a legend bullet group scene.
 * 
 * @name pvc.visual.legend.BulletGroupScene

 * @extends pvc.visual.Scene
 * 
 * @constructor
 * @param {pvc.visual.legend.BulletRootScene} parent The parent bullet root scene.
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.visual.Scene} for additional keyword arguments.
 * @param {pv.visual.legend.renderer} [keyArgs.renderer] Keyword arguments.
 */
def
.type('pvc.visual.legend.BulletGroupScene', pvc.visual.Scene)
.init(function(rootScene, keyArgs){
    
    this.base(rootScene, keyArgs);
    
    this.extensionPrefix =  def.get(keyArgs, 'extensionPrefix') || 'legend';
    this._renderer = def.get(keyArgs, 'renderer');
    
    this.colorAxis = def.get(keyArgs, 'colorAxis');
    this.clickMode = def.get(keyArgs, 'clickMode');
    
    if(this.colorAxis && !this.clickMode){
        this.clickMode = this.colorAxis.option('ClickMode');
    }
})
.add(/** @lends pvc.visual.legend.BulletGroupScene# */{
    hasRenderer: function(){
        return this._renderer;
    },
    
    renderer: function(renderer){
        if(renderer != null){
            this._renderer = renderer;
        } else {
            renderer = this._renderer;
            if(!renderer){
                var keyArgs;
                var colorAxis = this.colorAxis;
                if(colorAxis){
                    keyArgs = {
                        drawRule:    colorAxis.option('DrawLine'  ),
                        drawMarker:  colorAxis.option('DrawMarker'),
                        markerShape: colorAxis.option('Shape')
                    };
                }
                
                renderer = new pvc.visual.legend.BulletItemDefaultRenderer(keyArgs);
                this._renderer = renderer;
            }
        }
        
        return renderer;
    },
    
    itemSceneType: function(){
        var ItemType = this._itemSceneType;
        if(!ItemType){
            ItemType = def.type(pvc.visual.legend.BulletItemScene);
            
            // Mixin behavior depending on click mode
            var clickMode = this.clickMode;
            switch(clickMode){
                case 'toggleSelected':
                    ItemType.add(pvc.visual.legend.BulletItemSceneSelection);
                    break;
                
                case 'toggleVisible':
                    ItemType.add(pvc.visual.legend.BulletItemSceneVisibility);
                    break;
            }
            
            // Apply legend item scene extensions
            this.panel()._extendSceneType('item', ItemType, ['isOn', 'isClickable', 'click']);
            
            this._itemSceneType = ItemType;
        }
        
        return ItemType;
    },
    
    createItem: function(keyArgs){
        var ItemType = this.itemSceneType();
        return new ItemType(this, keyArgs);
    }
});
/**
 * Initializes a legend bullet item scene.
 * 
 * @name pvc.visual.legend.BulletItemScene
 * 
 * @extends pvc.visual.legend.Scene
 * 
 * @constructor
 * @param {pvc.visual.legend.BulletGroupScene} bulletGroup The parent legend bullet group scene.
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.visual.Scene} for supported keyword arguments.
 */
def
.type('pvc.visual.legend.BulletItemScene', pvc.visual.Scene)
.init(function(bulletGroup, keyArgs){
    
    this.base(bulletGroup, keyArgs);
    
    var value, label;
    if(keyArgs){
        value = keyArgs.value;
        label = keyArgs.label;
    }
    
    if(value === undefined){
        var source = this.group || this.datum;
        if(source){
            value = source.value;
            label = source.ensureLabel();
        }
    }
    
    this.vars.value = new pvc.visual.ValueLabelVar(value || null, label || "");
})
.add(/** @lends pvc.visual.legend.BulletItemScene# */{
    /**
     * Called during legend render (full or interactive) 
     * to determine if the item is in the "on" state.
     * <p>
     * An item in the "off" state is shown with brighter struck-through text, by default.
     * </p>
     * 
     * <p>
     * The default implementation returns <c>true</c>.
     * </p>
     * 
     * @type boolean
     */
    isOn:  function(){
        return true;
    },
    
    /**
     * Called during legend render (full or interactive) 
     * to determine if the item can be clicked.
     * <p>
     * A clickable item shows a hand mouse cursor when the mouse is over it.
     * </p>
     * <p>
     * The default implementation returns <c>false</c>.
     * </p>
     * 
     * @type boolean
     */
    isClickable: function(){
        return false;
    },
    
    /**
     * Called when the user clicks the legend item.
     * <p>
     * The default implementation does nothing.
     * </p>
     */
    click: function(){
        // NOOP
    },
    
    /**
     * Measures the item label's text and returns an object
     * with 'width' and 'height' properties, in pixels.
     * <p>A nully value may be returned to indicate that there is no text.</p>
     * 
     * @type object
     */
    labelTextSize: function(){
        var valueVar = this.vars.value;
        return valueVar && pvc.text.getTextSize(valueVar.label, this.vars.font);
    }
});
/**
 * @name pvc.visual.legend.BulletItemSceneSelection
 * @class A selection behavior mixin for the legend bullet item scene. 
 * Represents and controls the selected state of its datums.
 * 
 * @extends pvc.visual.legend.BulletItemScene
 */
def
.type('pvc.visual.legend.BulletItemSceneSelection')
.add(/** @lends pvc.visual.legend.BulletItemSceneSelection# */{
    /**
     * Returns <c>true</c> if there are no selected datums in the owner data, 
     * or if at least one non-null datum of the scene's {@link #datums} is selected.
     * @type boolean
     */
    isOn: function(){
        var owner = (this.group || this.datum).owner;
        return !owner.selectedCount() || 
               this.datums().any(function(datum){
                   return !datum.isNull && datum.isSelected; 
               });
        
        // Cannot use #isSelected() cause it includes null datums.
        //return this.isSelected();
    },
    
    /**
     * Returns the value of the chart option "selectable". 
     * @type boolean
     */
    isClickable: function(){
        return this.chart().options.selectable;
    },
    
    /**
     * Toggles the selected state of the datums present in this scene
     * and forces an interactive render of the chart by calling
     * {@link pvc.BaseChart#updateSelections}.
     */
    click: function(){
        var datums = this.datums().array();
        
        // Allow chart action to change the selection
        var chart = this.chart();
        datums = chart._onUserSelection(datums);
        if(datums){
            var on = def.query(datums).any(function(datum){ return datum.isSelected; });
            if(pvc.data.Data.setSelected(datums, !on)){
                chart.updateSelections();
            }
        }
    }
});

/**
 * @name pvc.visual.legend.BulletItemSceneVisibility
 * 
 * @class A visibility behavior mixin for a legend bullet item scene. 
 * Represents and controls the visible state of its datums.
 * 
 * @extends pvc.visual.legend.BulletItemScene
 */
def
.type('pvc.visual.legend.BulletItemSceneVisibility')
.add(/** @lends pvc.visual.legend.BulletItemSceneVisibility# */{
    /**
     * Returns <c>true</c> if at least one non-null datum of the scene's {@link #datums} is visible.
     * @type boolean
     */
    isOn: function(){
        return this.datums().any(function(datum){ 
                   return !datum.isNull && datum.isVisible; 
               });
    },
    
    /**
     * Returns <c>true</c>.
     * @type boolean
     */
    isClickable: function(){
        return true;
    },
    
    /**
     * Toggles the visible state of the datums present in this scene
     * and forces a re-render of the chart (without reloading data).
     */
    click: function(){
        if(pvc.data.Data.toggleVisible(this.datums())){
            // Re-render chart
            this.chart().render(true, true, false);
        }
    }
});

/**
 * @name pvc.visual.legend.BulletItemRenderer
 * @class Renders bullet items' bullets, i.e. marker, rule, etc.
 */
def.type('pvc.visual.legend.BulletItemRenderer');

/**
 * Creates the marks that render appropriate bullets
 * as children of a given parent bullet panel.
 * <p>
 * The dimensions of this panel, upon each render, 
 * provide bounds for drawing each bullet.
 * </p>
 * <p>
 * The properties of marks created as children of this panel will 
 * receive a corresponding {@link pvc.visual.legend.BulletItemScene} 
 * as first argument. 
 * </p>
 * 
 * @name pvc.visual.legend.BulletItemRenderer#create
 * @function
 * @param {pvc.LegendPanel} legendPanel the legend panel
 * @param {pv.Panel} pvBulletPanel the protovis panel on which bullets are rendered.
 * 
 * @returns {object} a render information object, 
 * with custom renderer information,
 * that is subsequently passed as argument to other renderer's methods. 
 */
 
/**
 * Obtains the mark that should be the anchor for the bullet item's label.
 * If null is returned, the label is anchored to the parent bullet panel.
 * 
 * @name pvc.visual.legend.BulletItemRenderer#getLabelAnchorMark
 * @function
 * @param {pvc.LegendPanel} legendPanel the legend panel
 * @param {object} renderInfo a render information object previously returned by {@link #create}.
 * @type pv.Mark
 */
 
/**
 * Extends the bullet marks created in the render 
 * corresponding to the given render information object,
 * using extensions under the given extension prefix.
 *  
 * @name pvc.visual.legend.BulletItemRenderer#extendMarks
 * @function
 * @param {pvc.LegendPanel} legendPanel the legend panel
 * @param {object} renderInfo a render information object previously returned by {@link #create}.
 * @param {string} extensionPrefix The extension prefix to be used to build extension keys, without underscore.
 * @type undefined
 */
/**
 * Initializes a default legend bullet renderer.
 * 
 * @name pvc.visual.legend.BulletItemDefaultRenderer
 * @class The default bullet renderer.
 * @extends pvc.visual.legend.BulletItemRenderer
 * 
 * @constructor
 * @param {pvc.visual.legend.BulletGroupScene} bulletGroup The parent legend bullet group scene.
 * @param {object} [keyArgs] Optional keyword arguments.
 * @param {string} [keyArgs.drawRule=false] Whether a rule should be drawn.
 * @param {string} [keyArgs.drawMarker=true] Whether a marker should be drawn.
 * When {@link keyArgs.drawRule} is false, then this argument is ignored,
 * because a marker is necessarily drawn.
 * @param {pv.Mark} [keyArgs.markerPvProto] The marker's protovis prototype mark.
 * @param {pv.Mark} [keyArgs.rulePvProto  ] The rule's protovis prototype mark.
 */
def
.type('pvc.visual.legend.BulletItemDefaultRenderer')
.init(function(keyArgs){
    this.drawRule = def.get(keyArgs, 'drawRule', false);
    if(this.drawRule){
        this.rulePvProto = def.get(keyArgs, 'rulePvProto');
    }
    
    this.drawMarker = !this.drawRule || def.get(keyArgs, 'drawMarker', true);
    if(this.drawMarker){
        this.markerShape = def.get(keyArgs, 'markerShape', 'square');
        this.markerPvProto = def.get(keyArgs, 'markerPvProto');
    }
})
.add(/** @lends pvc.visual.legend.BulletItemDefaultRenderer# */{
    drawRule: false,
    drawMarker: true,
    markerShape: null,
    rulePvProto: null,
    markerPvProto: null,
    
    create: function(legendPanel, pvBulletPanel){
        var renderInfo = {};
        var drawRule = this.drawRule;
        var sceneColorProp = function(scene){ return scene.color; };
        
        if(drawRule){
            var rulePvBaseProto = new pv.Mark()
                .left (0)
                .top  (function(){ return this.parent.height() / 2; })
                .width(function(){ return this.parent.width();      })
                .lineWidth(1)
                .strokeStyle(sceneColorProp)
                ;
            
            if(this.rulePvProto){
                rulePvBaseProto = this.rulePvProto.extend(rulePvBaseProto);
            }
            
            renderInfo.pvRule = pvBulletPanel.add(pv.Rule).extend(rulePvBaseProto);
        }
        
        if(this.drawMarker){
            var markerPvBaseProto = new pv.Mark()
                // Center the marker in the panel
                .left(function(){ return this.parent.width () / 2; })
                .top (function(){ return this.parent.height() / 2; })
                // If order of properties is changed, by extension, 
                // dependent properties will not work...
                .shapeSize(function(){ return this.parent.width(); }) // width <= height
                .lineWidth(2)
                .fillStyle(sceneColorProp)
                .strokeStyle(sceneColorProp)
                .shape(this.markerShape)
                .angle(drawRule ? 0 : Math.PI/2) // So that 'bar' gets drawn vertically
                .antialias( function(){
                    var cos = Math.abs(Math.cos(this.angle()));
                    if(cos !== 0 && cos !== 1){
                        switch(this.shape()){
                            case 'square':
                            case 'bar':
                                return false;
                        }
                    }
                    
                    return true;
                })
                ;
            
            if(this.markerPvProto){
                markerPvBaseProto = this.markerPvProto.extend(markerPvBaseProto);
            }
            
            renderInfo.pvDot = pvBulletPanel.add(pv.Dot).extend(markerPvBaseProto);
        }
        
        return renderInfo;
    },

    extendMarks: function(legendPanel, renderInfo, extensionPrefix){
        if(renderInfo.pvRule){
            legendPanel.extend(renderInfo.pvRule, extensionPrefix + "Rule_");
        }
        if(renderInfo.pvDot){
            legendPanel.extend(renderInfo.pvDot, extensionPrefix + "Dot_");
        }
    }
});

pvc.Abstract = Base.extend({
    invisibleLineWidth: 0.001,
    defaultLineWidth:   1.5
});
/**
 * The main chart component
 */
pvc.BaseChart = pvc.Abstract.extend({
    /**
     * Indicates if the chart has been disposed.
     */
    _disposed: false,
    
    _updateSelectionSuspendCount: 0,
    _selectionNeedsUpdate:   false,
    
    /**
     * The chart's parent chart.
     * 
     * <p>
     * The root chart has null as the value of its parent property.
     * </p>
     * 
     * @type pvc.BaseChart
     */
    parent: null,
    
    /**
     * The chart's root chart.
     * 
     * <p>
     * The root chart has itself as the value of the root property.
     * </p>
     * 
     * @type pvc.BaseChart
     */
    root: null,
    
    /**
     * A map of {@link pvc.visual.Axis} by axis id.
     */
    axes: null,
    
    /**
     * A map from axis type to role name or names.
     * This should be overridden in specific chart classes.
     * 
     * @example
     * <pre>
     * {
     *   'base':   'category',
     *   'ortho':  ['value', 'value2']
     * }
     * </pre>
     */
    _axisType2RoleNamesMap: null,
    
    /**
     * A map of {@link pvc.visual.Role} by name.
     * 
     * @type object
     */
    _visualRoles: null,

    _serRole: null,
    _dataPartRole: null,
    
    /**
     * An array of the {@link pvc.visual.Role} that are measures.
     * 
     * @type pvc.visual.Role[]
     */
    _measureVisualRoles: null,
    
    /**
     * Indicates if the chart has been pre-rendered.
     * <p>
     * This field is set to <tt>false</tt>
     * at the beginning of the {@link #_preRender} method
     * and set to <tt>true</tt> at the end.
     * </p>
     * <p>
     * When a chart is re-rendered it can, 
     * optionally, also repeat the pre-render phase. 
     * </p>
     * 
     * @type boolean
     */
    isPreRendered: false,

    /**
     * The version value of the current/last creation.
     * 
     * <p>
     * This value is changed on each pre-render of the chart.
     * It can be useful to invalidate cached information that 
     * is only valid for each creation.
     * </p>
     * <p>
     * Version values can be compared using the identity operator <tt>===</tt>.
     * </p>
     * 
     * @type any
     */
    _createVersion: 0,
    
    /**
     * A callback function that is called 
     * when the protovis' panel render is about to start.
     * 
     * <p>
     * Note that this is <i>after</i> the pre-render phase.
     * </p>
     * 
     * <p>
     * The callback is called with no arguments, 
     * but having the chart instance as its context (<tt>this</tt> value). 
     * </p>
     * 
     * @function
     */
    renderCallback: undefined,

    /**
     * The data that the chart is to show.
     * @type pvc.data.Data
     */
    dataEngine: null,
    data: null,
    
    /**
     * The resulting data of 
     * grouping {@link #data} by the data part role, 
     * when bound.
     * 
     * @type pvc.data.Data
     */
    _partData: null,

    /**
     * The data source of the chart.
     * <p>
     * The {@link #data} of a root chart 
     * is loaded with the data in this array.
     * </p>
     * @type any[]
     */
    resultset: [],
    
    /**
     * The meta-data that describes each 
     * of the data components of {@link #resultset}.
     * @type any[]
     */
    metadata: [],

    /**
     * The base panel is the root container of a chart.
     * <p>
     * The base panel of a <i>root chart</i> is the top-most root container.
     * It has {@link pvc.BasePanel#isTopRoot} equal to <tt>true</tt>.
     * </p>
     * <p>
     * The base panel of a <i>non-root chart</i> is the root of the chart's panels,
     * but is not the top-most root panel, over the charts hierarchy.
     * </p>
     * 
     * @type pvc.BasePanel
     */
    basePanel:   null,
    
    /**
     * The panel that shows the chart's title.
     * <p>
     * This panel is the first child of {@link #basePanel} to be created.
     * It is only created when the chart has a non-empty title.
     * </p>
     * <p>
     * Being the first child causes it to occupy the 
     * whole length of the side of {@link #basePanel} 
     * to which it is <i>docked</i>.
     * </p>
     * 
     * @type pvc.TitlePanel
     */
    titlePanel:  null,
    
    /**
     * The panel that shows the chart's main legend.
     * <p>
     * This panel is the second child of {@link #basePanel} to be created.
     * There is an option to not show the chart's legend,
     * in which case this panel is not created.
     * </p>
     * 
     * <p>
     * The current implementation of the legend panel
     * presents a <i>discrete</i> association of colors and labels.
     * </p>
     * 
     * @type pvc.LegendPanel
     */
    legendPanel: null,
    
    /**
     * The panel that hosts child chart's base panels.
     * 
     * @type pvc.MultiChartPanel
     */
    _multiChartPanel: null,

    /**
     * The name of the visual role that
     * the legend panel will be associated to.
     * 
     * <p>
     * The legend panel displays each distinct role value
     * with a marker and a label.
     * 
     * The marker's color is obtained from the parts color scales,
     * given the role's value.
     * </p>
     * <p>
     * The default dimension is the 'series' dimension.
     * </p>
     * 
     * @type string
     */
    legendSource: "series",
    
    /**
     * An array of colors, represented as names, codes or {@link pv.Color} objects
     * that is associated to each distinct value of the {@link #legendSource} dimension.
     * 
     * <p>
     * The legend panel associates each distinct dimension value to a color of {@link #colors},
     * following the dimension's natural order.
     * </p>
     * <p>
     * The default dimension is the 'series' dimension.
     * </p>
     * 
     * @type (string|pv.Color)[]
     */
    colors: null,
    secondAxisColor: null,
    
    /**
     * Contains the number of pages that a multi-chart contains
     * when rendered with the previous render options.
     * <p>
     * This property is updated after a render of a chart
     * where the visual role "multiChart" is assigned and
     * the option "multiChartPageIndex" has been specified. 
     * </p>
     * 
     * @type number|null
     */
    multiChartPageCount: null,
    
    /**
     * Contains the currently rendered multi-chart page index, 
     * relative to the previous render options.
     * <p>
     * This property is updated after a render of a chart
     * where the visual role "multiChart" is assigned and
     * the <i>option</i> "multiChartPageIndex" has been specified. 
     * </p>
     * 
     * @type number|null
     */
    multiChartPageIndex: null,
    
    constructor: function(options) {
        var parent = this.parent = def.get(options, 'parent') || null;
        
        /* DEBUG options */
        if(pvc.debug >= 3 && !parent && options){
            try {
                pvc.log("INITIAL OPTIONS:\n" + JSON.stringify(options));
            } catch(ex) {
                /* SWALLOW usually a circular JSON structure */
            }
        }
        
        if(parent) {
            // options != null
            this.root = parent.root;
            this.dataEngine =
            this.data = options.data ||
                        def.fail.argumentRequired('options.data');
            
            this.left = options.left;
            this.top  = options.top;
            this._visualRoles = parent._visualRoles;
            this._measureVisualRoles = parent._measureVisualRoles;

            if(parent._serRole) {
                this._serRole = parent._serRole;
            }

            if(parent._dataPartRole) {
                this._dataPartRole = parent._dataPartRole;
            }
            
        } else {
            this.root = this;
            
            this._visualRoles = {};
            this._measureVisualRoles = [];
        }
        
        this._axisType2RoleNamesMap = {};
        this.axes = {};
        
        this.options = def.mixin({}, this.defaults, options);
    },
    
    compatVersion: function(){
        return this.options.compatVersion;
    },
    
    /**
     * Processes options after user options and defaults have been merged.
     * Applies restrictions,
     * performs validations and
     * options values implications.
     */
    _processOptions: function(){

        var options = this.options;

        this._processOptionsCore(options);
        
        /* DEBUG options */
        if(pvc.debug >= 3 && options && !this.parent){
            try {
                pvc.log("CURRENT OPTIONS:\n" + JSON.stringify(options));
            }catch(ex) {
                /* SWALLOW usually a circular JSON structure */
            }
        }

        return options;
    },

    /**
     * Processes options after user options and default options have been merged.
     * Override to apply restrictions, perform validation or
     * options values implications.
     * When overriden, the base implementation should be called.
     * The implementation must be idempotent -
     * its successive application should yield the same results.
     * @virtual
     */
    _processOptionsCore: function(options){
        // Disable animation if environment doesn't support it
        if (!$.support.svg || pv.renderer() === 'batik') {
            options.animate = false;
        }
        
        // Sanitize some options
        if(options.showTooltips){
            var ts = options.tipsySettings;
            if(ts){
                this.extend(ts, "tooltip_");
            }
        }
    },
    
    /**
     * Building the visualization is made in 2 stages:
     * First, the {@link #_preRender} method prepares and builds 
     * every object that will be used.
     * 
     * Later the {@link #render} method effectively renders.
     */
    _preRender: function(keyArgs) {
        var options = this.options;
        
        /* Increment pre-render version to allow for cache invalidation  */
        this._createVersion++;
        
        this.isPreRendered = false;

        if(pvc.debug >= 3){
            pvc.log("Prerendering in pvc");
        }
        
        /* Any data exists or throws */
        this._checkNoData();
        
        if (!this.parent) {
            // Now's as good a time as any to completely clear out all
            //  tipsy tooltips
            pvc.removeTipsyLegends();
        }
        
        /* Options may be changed between renders */
        this._processOptions();
        
        /* Initialize root visual roles */
        if(!this.parent && this._createVersion === 1) {
            this._initVisualRoles();
            this._bindVisualRolesPre();
        }
        
        /* Initialize the data */
        this._initData(keyArgs);

        var hasMultiRole = this._isRoleAssigned('multiChart');
        
        /* Initialize axes */
        this._initAxes(hasMultiRole);
        
        /* Initialize chart panels */
        this._initChartPanels(hasMultiRole);
        
        this.isPreRendered = true;
    },
    
    _checkNoData: function(){
        // Child charts are created to consume *existing* data
        if (!this.parent) {
            
            // If we don't have data, we just need to set a "no data" message
            // and go on with life.
            if(!this.allowNoData && this.resultset.length === 0) {
                /*global NoDataException:true */
                throw new NoDataException();
            }
        }
    },
    
    _initAxes: function(isMulti){
        if(!this.parent){
            var colorRoleNames = this._axisType2RoleNamesMap.color;
            if(!colorRoleNames && this.legendSource){
                colorRoleNames = this.legendSource;
                this._axisType2RoleNamesMap.color = colorRoleNames;
            }
            
            if(colorRoleNames){
                // Create the color (legend) axis at the root chart
                this._createAxis('color', 0);
                
                if(this.options.secondAxis){
                    this._createAxis('color', 1);
                }
            }
        } else {
            // Copy
            var root = this.root;
            
            var colorAxis = root.axes.color;
            if(colorAxis){
                this.axes.color = colorAxis;
                this.colors = root.colors;
            }
            
            colorAxis = root.axes.color2;
            if(colorAxis){
                this.axes.color2 = colorAxis;
                this.secondAxisColor = root.secondAxisColor;
            }
        }
    },
    
    /**
     * Creates an axis of a given type and index.
     * 
     * @param {string} type The type of the axis.
     * @param {number} index The index of the axis within its type (0, 1, 2...).
     *
     * @type pvc.visual.Axis
     */
    _createAxis: function(axisType, axisIndex){
        // Collect visual roles
        var dataCells = this._getAxisDataCells(axisType, axisIndex);
        
        var axis = this._createAxisCore(axisType, axisIndex, dataCells);
        
        this.axes[axis.id] = axis;
        
        return axis;
    },
    
    _getAxisDataCells: function(axisType, axisIndex){
        // Collect visual roles
        return this._buildAxisDataCells(axisType, axisIndex, null);
    },
    
    _buildAxisDataCells: function(axisType, axisIndex, dataPartValues){
        // Collect visual roles
        return def.array.as(this._axisType2RoleNamesMap[axisType])
               .map(function(roleName){
                   return {
                       role: this.visualRoles(roleName), 
                       dataPartValues: dataPartValues
                   };
               }, this);
    },
    
    _createAxisCore: function(axisType, axisIndex, dataCells){
        switch(axisType){
            case 'color': 
                var colorAxis = new pvc.visual.ColorAxis(this, axisType, axisIndex, dataCells);
                switch(axisIndex){
                    case 0:
                        this.colors = colorAxis.colorsFactory;
                        break;
                        
                    case 1:
                        if(this.options.secondAxisOwnColors){
                            this.secondAxisColor = colorAxis.colorsFactory;
                        }
                        break;
                }
                
                return colorAxis;
        }
        
        throw def.error.operationInvalid("Invalid axis type '{0}'", [axisType]);
    },
    
    _initChartPanels: function(hasMultiRole){
        /* Initialize chart panels */
        this._initBasePanel  ();
        this._initTitlePanel ();
        this._initLegendPanel();
        
        if(!this.parent && hasMultiRole) {
            this._initMultiChartPanel();
        } else {
            this._preRenderContent({
                margins:  this.options.contentMargins,
                paddings: this.options.contentPaddings
            });
        }
    },
    
    /**
     * Override to create chart specific content panels here.
     * No need to call base.
     * 
     * @param {object} contentOptions Object with content specific options. Can be modified.
     * @param {pvc.Sides} [contentOptions.margins] The margins for the content panels. 
     * @param {pvc.Sides} [contentOptions.paddings] The paddings for the content panels.
     * 
     * @virtual
     */
    _preRenderContent: function(contentOptions){
        /* NOOP */
    },
    
    /**
     * Initializes the data engine and roles
     */
    _initData: function(keyArgs) {
        if(!this.parent) {
            var data = this.data;
            if(!data || def.get(keyArgs, 'reloadData', true)) {
               this._onLoadData();
            } else {
                // TODO: Do this in a cleaner way. Give control to Data
                // We must at least dispose children and cache...
                /*global data_disposeChildLists:true, data_syncDatumsState:true */
                data_disposeChildLists.call(data);
                data_syncDatumsState.call(data);
            }
        }

        delete this._partData;
        
        if(pvc.debug >= 3){
            pvc.log(this.data.getInfo());
        }
    },

    _onLoadData: function(){
        var data = this.data,
            complexType   = data ? data.type : new pvc.data.ComplexType(),
            translOptions = this._createTranslationOptions(),
            translation   = this._createTranslation(complexType, translOptions);

        translation.configureType();

        if(pvc.debug >= 3){
            pvc.log(complexType.describe());
        }

        // ----------
        // Roles are bound before actually loading data,
        // in order to be able to filter datums
        // whose "every dimension in a measure role is null".
        this._bindVisualRoles(complexType);

        if(pvc.debug >= 3){
            this._logVisualRoles();
        }

        // ----------

        if(!data) {
            data =
                this.dataEngine =
                this.data = new pvc.data.Data({
                    type:     complexType,
                    labelSep: this.options.groupedLabelSep
                });
        } // else TODO: assert complexType has not changed...
        
        // ----------

        var loadKeyArgs = {
            where:  this._getLoadFilter(),
            isNull: this._getIsNullDatum()
         };
        
        data.load(translation.execute(data), loadKeyArgs);
    },

    _getLoadFilter: function(){
        if(this.options.ignoreNulls) {
            return function(datum){
                var isNull = datum.isNull;
                
                if(isNull && pvc.debug >= 4){
                    pvc.log("Datum excluded.");
                }
                
                return !isNull;
            };
        }
    },
    
    _getIsNullDatum: function(){
        var measureDimNames = this.measureDimensionsNames(),
            M = measureDimNames.length;
        if(M) {
            // Must have at least one measure role dimension not-null
            return function(datum){
                var atoms = datum.atoms;
                for(var i = 0 ; i < M ; i++){
                    if(atoms[measureDimNames[i]].value != null){
                        return false;
                    }
                }

                return true;
            };
        }
    },

    _createTranslation: function(complexType, translOptions){
        
        var TranslationClass = translOptions.crosstabMode ? 
                    pvc.data.CrosstabTranslationOper : 
                    pvc.data.RelationalTranslationOper;

        return new TranslationClass(complexType, this.resultset, this.metadata, translOptions);
    },

    _createTranslationOptions: function(){
        var options = this.options,
            dataOptions = options.dataOptions || {};

        var secondAxisSeriesIndexes;
        if(options.secondAxis){
            secondAxisSeriesIndexes = options.secondAxisSeriesIndexes;
            if(secondAxisSeriesIndexes === undefined){
                secondAxisSeriesIndexes = options.secondAxisIdx;
            }
        }

        var valueFormat = options.valueFormat,
            valueFormatter;
        if(valueFormat && valueFormat !== this.defaults.valueFormat){
            valueFormatter = function(v) {
                return v != null ? valueFormat(v) : "";
            };
        }

        return {
            compatVersion:     options.compatVersion,
            secondAxisSeriesIndexes: secondAxisSeriesIndexes,
            seriesInRows:      options.seriesInRows,
            crosstabMode:      options.crosstabMode,
            isMultiValued:     options.isMultiValued,

            dimensionGroups:   options.dimensionGroups,
            dimensions:        options.dimensions,
            readers:           options.readers,

            measuresIndexes:   options.measuresIndexes, // relational multi-valued

            multiChartIndexes: options.multiChartIndexes,

            // crosstab
            separator:         dataOptions.separator,
            measuresInColumns: dataOptions.measuresInColumns,
            measuresIndex:     dataOptions.measuresIndex || dataOptions.measuresIdx, // measuresInRows
            measuresCount:     dataOptions.measuresCount || dataOptions.numMeasures, // measuresInRows
            categoriesCount:   dataOptions.categoriesCount,

            // Timeseries *parse* format
            isCategoryTimeSeries: options.timeSeries,

            timeSeriesFormat:     options.timeSeriesFormat,
            valueNumberFormatter: valueFormatter
        };
    },

    /**
     * Initializes each chart's specific roles.
     * @virtual
     */
    _initVisualRoles: function(){
        this._addVisualRoles({
            multiChart: {defaultDimensionName: 'multiChart*'}
        });

        if(this._hasDataPartRole()){
            this._addVisualRoles({
                dataPart: {
                    defaultDimensionName: 'dataPart',
                    requireSingleDimension: true,
                    requireIsDiscrete: true
                }
            });

            // Cached
            this._dataPartRole = this.visualRoles('dataPart');
        }

        var serRoleSpec = this._getSeriesRoleSpec();
        if(serRoleSpec){
            this._addVisualRoles({series: serRoleSpec});

            // Cached
            this._serRole = this.visualRoles('series');
        }
    },

    /**
     * Binds visual roles to grouping specifications
     * that have not yet been bound to and validated against a complex type.
     *
     * This allows infering proper defaults to
     * dimensions bound to roles, by taking them from the roles requirements.
     */
    _bindVisualRolesPre: function(){
        
        def.eachOwn(this._visualRoles, function(visualRole){
            visualRole.setIsReversed(false);
        });
        
        /* Process user specified bindings */
        var boundDimNames = {};
        def.each(this.options.visualRoles, function(roleSpec, name){
            var visualRole = this._visualRoles[name] ||
                def.fail.operationInvalid("Role '{0}' is not supported by the chart type.", [name]);
            
            var groupingSpec;
            if(roleSpec && typeof roleSpec === 'object'){
                if(def.get(roleSpec, 'isReversed', false)){
                    visualRole.setIsReversed(true);
                }
                
                groupingSpec = roleSpec.dimensions;
            } else {
                groupingSpec = roleSpec;
            }
            
            // !groupingSpec results in a null grouping being preBound
            // A pre bound null grouping is later discarded in the post bind
            if(groupingSpec !== undefined){
                var grouping = pvc.data.GroupingSpec.parse(groupingSpec);

                visualRole.preBind(grouping);

                /* Collect dimension names bound to a *single* role */
                grouping.dimensions().each(function(dimSpec){
                    if(def.hasOwn(boundDimNames, dimSpec.name)){
                        // two roles => no defaults at all
                        delete boundDimNames[dimSpec.name];
                    } else {
                        boundDimNames[dimSpec.name] = visualRole;
                    }
                });
            }
        }, this);

        /* Provide defaults to dimensions bound to a single role */
        var dimsSpec = (this.options.dimensions || (this.options.dimensions = {}));
        def.eachOwn(boundDimNames, function(role, name){
            var dimSpec = dimsSpec[name] || (dimsSpec[name] = {});
            if(role.valueType && dimSpec.valueType === undefined){
                dimSpec.valueType = role.valueType;

                if(role.requireIsDiscrete != null && dimSpec.isDiscrete === undefined){
                    dimSpec.isDiscrete = role.requireIsDiscrete;
                }
            }

            if(dimSpec.label === undefined){
                dimSpec.label = role.label;
            }
        }, this);
    },

    _hasDataPartRole: function(){
        return false;
    },

    _getSeriesRoleSpec: function(){
        return null;
    },

    _addVisualRoles: function(roles){
        def.eachOwn(roles, function(keyArgs, name){
            var visualRole = new pvc.visual.Role(name, keyArgs);
            this._visualRoles[name] = visualRole;
            if(visualRole.isMeasure){
                this._measureVisualRoles.push(visualRole);
            }
        }, this);
    },
    
    _bindVisualRoles: function(type){
        
        var boundDimTypes = {};

        function bind(role, dimNames){
            role.bind(pvc.data.GroupingSpec.parse(dimNames, type));
            def.array.as(dimNames).forEach(function(dimName){
                boundDimTypes[dimName] = true;
            });
        }
        
        /* Process role pre binding */
        def.eachOwn(this._visualRoles, function(visualRole, name){
            if(visualRole.isPreBound()){
                visualRole.postBind(type);
                // Null groupings are discarded
                if(visualRole.grouping){
                    visualRole
                        .grouping
                        .dimensions().each(function(dimSpec){
                            boundDimTypes[dimSpec.name] = true;
                        });
                }
            }
        }, this);
        
        /*
         * (Try to) Automatically bind unbound roles.
         * Validate role required'ness.
         */
        def.eachOwn(this._visualRoles, function(role, name){
            if(!role.grouping){

                /* Try to bind automatically, to defaultDimensionName */
                var dimName = role.defaultDimensionName;
                if(dimName) {
                    /* An asterisk at the end of the name indicates
                     * that any dimension of that group is allowed.
                     * If the role allows multiple dimensions,
                     * then the meaning is greedy - use them all.
                     * Otherwise, use only one.
                     */
                    var match = dimName.match(/^(.*?)(\*)?$/) ||
                            def.fail.argumentInvalid('defaultDimensionName');
                    
                    var anyLevel = !!match[2];
                    if(anyLevel) {
                        // TODO: does not respect any index explicitly specified
                        // before the *. Could mean >=...
                        var groupDimNames = type.groupDimensionsNames(match[1], {assertExists: false});
                        if(groupDimNames){
                            var freeGroupDimNames = 
                                    def.query(groupDimNames)
                                        .where(function(dimName2){ return !def.hasOwn(boundDimTypes, dimName2); });

                            if(role.requireSingleDimension){
                                var freeDimName = freeGroupDimNames.first();
                                if(freeDimName){
                                    bind(role, freeDimName);
                                    return;
                                }
                            } else {
                                freeGroupDimNames = freeGroupDimNames.array();
                                if(freeGroupDimNames.length){
                                    bind(role, freeGroupDimNames);
                                    return;
                                }
                            }
                        }
                    } else if(!def.hasOwn(boundDimTypes, dimName) &&
                              type.dimensions(dimName, {assertExists: false})){
                        bind(role, dimName);
                        return;
                    }

                    if(role.autoCreateDimension){
                        /* Create a hidden dimension and bind the role and the dimension */
                        var defaultName = match[1];
                        type.addDimension(defaultName,
                            pvc.data.DimensionType.extendSpec(defaultName, {isHidden: true}));
                        bind(role, defaultName);
                        return;
                    }
                }

                if(role.isRequired) {
                    throw def.error.operationInvalid("Chart type requires unassigned role '{0}'.", [name]);
                }
                
                // Unbind role from any previous binding
                role.bind(null);
            }
        }, this);
    },

    _logVisualRoles: function(){
        var out = ["\n------------------------------------------"];
        out.push("Visual Roles Information");

        def.eachOwn(this._visualRoles, function(role, name){
            out.push("  " + name + def.array.create(18 - name.length, " ").join("") +
                    (role.grouping ? (" <-- " + role.grouping) : ''));
        });
        
        out.push("------------------------------------------");

        pvc.log(out.join("\n"));
    },

    /**
     * Obtains a roles array or a specific role, given its name.
     * 
     * @param {string} roleName The role name.
     * @param {object} keyArgs Keyword arguments.
     * @param {boolean} assertExists Indicates if an error should be thrown if the specified role name is undefined.
     * 
     * @type pvc.data.VisualRole[]|pvc.data.VisualRole 
     */
    visualRoles: function(roleName, keyArgs){
        if(roleName == null) {
            return def.own(this._visualRoles);
        }
        
        var role = def.getOwn(this._visualRoles, roleName) || null;
        if(!role && def.get(keyArgs, 'assertExists', true)) {
            throw def.error.argumentInvalid('roleName', "Undefined role name '{0}'.", [roleName]);
        }
        
        return role;
    },

    measureVisualRoles: function(){
        return this._measureVisualRoles;
    },

    measureDimensionsNames: function(){
        return def.query(this._measureVisualRoles)
                   .select(function(visualRole){ return visualRole.firstDimensionName(); })
                   .where(def.notNully)
                   .array();
    },
    
    /**
     * Indicates if a role is assigned, given its name. 
     * 
     * @param {string} roleName The role name.
     * @type boolean
     */
    _isRoleAssigned: function(roleName){
        return !!this._visualRoles[roleName].grouping;
    },
    
    partData: function(dataPartValues){
        if(!this._partData){
            if(!this._dataPartRole || !this._dataPartRole.grouping){
                /* Undefined or unbound */
                this._partData = this.data;
            } else {
                // Visible and not
                this._partData = this._dataPartRole.flatten(this.data);
            }
        }
        
        if(!dataPartValues){
            return this._partData;
        }

        dataPartValues = def.query(dataPartValues).distinct().array();
        dataPartValues.sort();

        var dataPartDimName = this._dataPartRole.firstDimensionName();

        if(dataPartValues.length === 1){
            // TODO: should, at least, call some static method of Atom to build a global key
            return this._partData._childrenByKey[dataPartDimName + ':' + dataPartValues[0]] || 
                   new pvc.data.Data({linkParent: this._partData, datums: []}); // don't blow code ahead...
        }

        return this._partData.where([
                    def.set({}, dataPartDimName, dataPartValues)
                ]);
    },

    /**
     * Creates and initializes the base panel.
     */
    _initBasePanel: function() {
        var options = this.options;
        var basePanelParent = this.parent && this.parent._multiChartPanel;
        
        this.basePanel = new pvc.BasePanel(this, basePanelParent, {
            margins:  options.margins,
            paddings: options.paddings,
            size:     {width: options.width, height: options.height}
        });
    },

    /**
     * Creates and initializes the title panel,
     * if the title is specified.
     */
    _initTitlePanel: function(){
        var options = this.options;
        if (!def.empty(options.title)) {
            this.titlePanel = new pvc.TitlePanel(this, this.basePanel, {
                title:      options.title,
                font:       options.titleFont,
                anchor:     options.titlePosition,
                align:      options.titleAlign,
                alignTo:    options.titleAlignTo,
                offset:     options.titleOffset,
                inBounds:   options.titleInBounds,
                margins:    options.titleMargins,
                paddings:   options.titlePaddings,
                titleSize:  options.titleSize,
                titleSizeMax: options.titleSizeMax
            });
        }
    },
    
    /**
     * Creates and initializes the legend panel,
     * if the legend is active.
     */
    _initLegendPanel: function(){
        var options = this.options;
        if (options.legend) {
            // Only one legend panel, so only "Panel" options
            // of the first 'color' axis are taken into account
            var colorAxis = this.axes.color; 
            
            this.legendPanel = new pvc.LegendPanel(this, this.basePanel, {
                anchor:     colorAxis.option('Position'),
                align:      colorAxis.option('Align'),
                alignTo:    options.legendAlignTo,
                offset:     options.legendOffset,
                inBounds:   options.legendInBounds,
                size:       colorAxis.option('Size'),
                sizeMax:    colorAxis.option('SizeMax'),
                margins:    colorAxis.option('Margins'),
                paddings:   colorAxis.option('Paddings'),
                font:       colorAxis.option('Font'),
                scenes:     def.getPath(options, 'legend.scenes'),
                
                // Bullet legend
                minMarginX: options.legendMinMarginX, // V1 -> paddings
                minMarginY: options.legendMinMarginY, // V1 -> paddings
                textMargin: options.legendTextMargin,
                padding:    options.legendPadding,
                shape:      options.legendShape,
                markerSize: options.legendMarkerSize,
                drawLine:   options.legendDrawLine,
                drawMarker: options.legendDrawMarker
            });
            
            this._initLegendScenes(this.legendPanel);
        }
    },
    
    /* 
    TODO: I'm lost! Where do I belong?
    
    shape, drawLine, drawMarker,
    if(isV1Compat && options.shape === undefined){
        options.shape = 'square';
    }
    */
    
    /**
     * Creates the legend group scenes of a chart.
     *
     * The default implementation creates
     * one legend group for each existing data part value
     * for the dimension in {@link #legendSource}.
     *
     * Legend groups are registered with the id prefix "part"
     * followed by the corresponding part value.
     */
    _initLegendScenes: function(legendPanel){
        
        var rootScene;
        
        addAxis.call(this, this.axes.color );
        addAxis.call(this, this.axes.color2);
        
        // ------------
        
        function addAxis(colorAxis){
            if(colorAxis && colorAxis.domainData){
                processAxis.call(this, colorAxis);
            }
        }
        
        function processAxis(colorAxis){
            var domainData = colorAxis.domainData;
            
            if(!rootScene){
                rootScene = legendPanel._getBulletRootScene();
            }
            
            var groupScene = rootScene.createGroup({
                group:           domainData,
                colorAxis:       colorAxis,
                extensionPrefix: pvc.visual.Axis.getId('legend', rootScene.childNodes.length)
             });
            
            // For latter binding an appropriate bullet renderer
            colorAxis.legendBulletGroupScene = groupScene;
            
            var partColorScale = colorAxis.scale;
            
            domainData
                .children()
                .each(function(itemData){
                    var itemScene = groupScene.createItem({group: itemData});
                    def.set(itemScene,
                        'color', partColorScale(itemData.value),
                        'shape', 'square');
                });
        }
    },

    /**
     * Creates and initializes the multi-chart panel.
     */
    _initMultiChartPanel: function(){
        this._multiChartPanel = new pvc.MultiChartPanel(this, this.basePanel);
        
        // BIG HACK: force legend to be rendered after the small charts, 
        // to allow them to register legend renderers.
        this.basePanel._children.unshift(this.basePanel._children.pop());
    },
    
    useTextMeasureCache: function(fun, ctx){
        var root = this.root;
        var textMeasureCache = root._textMeasureCache || 
                               (root._textMeasureCache = pvc.text.createCache());
        
        return pvc.text.useCache(textMeasureCache, fun, ctx || this);
    },
    
    /**
     * Render the visualization.
     * If not pre-rendered, do it now.
     */
    render: function(bypassAnimation, recreate, reloadData){
        this.useTextMeasureCache(function(){
            try{
                if (!this.isPreRendered || recreate) {
                    this._preRender({reloadData: reloadData});
                } else if(!this.parent && this.isPreRendered) {
                    pvc.removeTipsyLegends();
                }
    
                this.basePanel.render({
                    bypassAnimation: bypassAnimation, 
                    recreate: recreate
                 });
                
            } catch (e) {
                if (e instanceof NoDataException) {
                    if(pvc.debug > 1){
                        pvc.log("No data found.");
                    }
    
                    this._addErrorPanelMessage("No data found", true);
                } else {
                    // We don't know how to handle this
                    pvc.logError(e.message);
                    
                    if(pvc.debug > 0){
                        this._addErrorPanelMessage("Error: " + e.message, false);
                    }
                    //throw e;
                }
            }
        });
    },

    _addErrorPanelMessage: function(text, isNoData){
        var options = this.options,
            pvPanel = new pv.Panel()
                        .canvas(options.canvas)
                        .width(options.width)
                        .height(options.height),
            pvMsg = pvPanel.anchor("center").add(pv.Label)
                        .text(text);

        if(isNoData){
            this.extend(pvMsg, "noDataMessage_");
        }
        
        pvPanel.render();
    },

    /**
     * Animation
     */
    animate: function(start, end) {
        return this.basePanel.animate(start, end);
    },
    
    /**
     * Indicates if the chart is currently 
     * rendering the animation start phase.
     * <p>
     * Prefer using this function instead of {@link #animate} 
     * whenever its <tt>start</tt> or <tt>end</tt> arguments
     * involve a non-trivial calculation. 
     * </p>
     * 
     * @type boolean
     */
    isAnimatingStart: function() {
        return this.basePanel.isAnimatingStart();
    },
    
    /**
     * Method to set the data to the chart.
     * Expected object is the same as what comes from the CDA: 
     * {metadata: [], resultset: []}
     */
    setData: function(data, options) {
        this.setResultset(data.resultset);
        this.setMetadata(data.metadata);

        // TODO: Danger!
        $.extend(this.options, options);
    },
    
    /**
     * Sets the resultset that will be used to build the chart.
     */
    setResultset: function(resultset) {
        /*jshint expr:true */
        !this.parent || def.fail.operationInvalid("Can only set resultset on root chart.");
        
        this.resultset = resultset;
        if (!resultset.length) {
            pvc.log("Warning: Resultset is empty");
        }
    },

    /**
     * Sets the metadata that, optionally, 
     * will give more information for building the chart.
     */
    setMetadata: function(metadata) {
        /*jshint expr:true */
        !this.parent || def.fail.operationInvalid("Can only set resultset on root chart.");
        
        this.metadata = metadata;
        if (!metadata.length) {
            pvc.log("Warning: Metadata is empty");
        }
    },
    
    /**
     * This is the method to be used for the extension points
     * for the specific contents of the chart. already ge a pie
     * chart! Goes through the list of options and, if it
     * matches the prefix, execute that method on the mark.
     * WARNING: It's the user's responsibility to make sure that
     * unexisting methods don't blow this.
     */
    extend: function(mark, prefix, keyArgs) {
        // if mark is null or undefined, skip
        if (mark) {
            var logOut = pvc.debug >= 3 ? [] : null;
            var constOnly = def.get(keyArgs, 'constOnly', false); 
            var points = this.options.extensionPoints;
            if(points){
                if(mark.borderPanel){
                    mark = mark.borderPanel;
                }
                
                for (var p in points) {
                    // Starts with
                    if(p.indexOf(prefix) === 0){
                        var m = p.substring(prefix.length);

                        // Not everything that is passed to 'mark' argument
                        //  is actually a mark...(ex: scales)
                        // Not locked and
                        // Not intercepted and
                        var v = points[p];
                        if(mark.isLocked && mark.isLocked(m)){
                            if(logOut) {logOut.push(m + ": locked extension point!");}
                        } else if(mark.isIntercepted && mark.isIntercepted(m)) {
                            if(logOut) {logOut.push(m + ":" + JSON.stringify(v) + " (controlled)");}
                        } else {
                            if(logOut) {logOut.push(m + ": " + JSON.stringify(v)); }

                            // Extend object css and svg properties
                            if(v != null){
                                var type = typeof v;
                                if(type === 'object'){
                                    if(m === 'svg' || m === 'css'){
                                        var v2 = mark.propertyValue(m);
                                        if(v2){
                                            v = def.copy(v2, v);
                                        }
                                    }
                                } else if(constOnly && type === 'function'){
                                    continue;
                                }
                            }
                            
                            // Distinguish between mark methods and properties
                            if (typeof mark[m] === "function") {
                                mark[m](v);
                            } else {
                                mark[m] = v;
                            }
                        }
                    }
                }

                if(logOut){
                    if(logOut.length){
                        pvc.log("Applying Extension Points for: '" + prefix + "'\n\t* " + logOut.join("\n\t* "));
                    } else if(pvc.debug >= 5) {
                        pvc.log("No Extension Points for: '" + prefix + "'");
                    }
                }
            }
        } else if(pvc.debug >= 4){
            pvc.log("Applying Extension Points for: '" + prefix + "' (target mark does not exist)");
        }
    },

    /**
     * Obtains the specified extension point.
     * Arguments are concatenated with '_'.
     */
    _getExtension: function(extPoint) {
        var points = this.options.extensionPoints;
        if(!points){
            return undefined; // ~warning
        }

        extPoint = pvc.arraySlice.call(arguments).join('_');
        return points[extPoint];
    },
    
    /** 
     * Clears any selections and, if necessary,
     * re-renders the parts of the chart that show selected marks.
     * 
     * @type undefined
     * @virtual 
     */
    clearSelections: function(){
        if(this.data.owner.clearSelected()) {
            this.updateSelections();
        }
    },
    
    _suspendSelectionUpdate: function(){
        if(this === this.root) {
            this._updateSelectionSuspendCount++;
        } else {
            this.root._suspendSelectionUpdate();
        }
    },
    
    _resumeSelectionUpdate: function(){
        if(this === this.root) {
            if(this._updateSelectionSuspendCount > 0) {
                if(!(--this._updateSelectionSuspendCount)) {
                    if(this._selectionNeedsUpdate) {
                        this.updateSelections();
                    }
                }
            }
        } else {
            this._resumeSelectionUpdate();
        }
    },
    
    /** 
     * Re-renders the parts of the chart that show selected marks.
     * 
     * @type undefined
     * @virtual 
     */
    updateSelections: function(){
        if(this === this.root) {
            if(this._inUpdateSelections) {
                return;
            }
            
            if(this._updateSelectionSuspendCount) {
                this._selectionNeedsUpdate = true;
                return;
            }
            
            pvc.removeTipsyLegends();
            
            // Reentry control
            this._inUpdateSelections = true;
            try {
                // Fire action
                var action = this.options.selectionChangedAction;
                if(action){
                    var selections = this.data.selectedDatums();
                    action.call(null, selections);
                }
                
                /** Rendering afterwards allows the action to change the selection in between */
                this.basePanel._renderInteractive();
            } finally {
                this._inUpdateSelections   = false;
                this._selectionNeedsUpdate = false;
            }
        } else {
            this.root.updateSelections();
        }
    },
    
    _onUserSelection: function(datums){
        if(!datums || !datums.length){
            return datums;
        }
        
        if(this === this.root) {
            // Fire action
            var action = this.options.userSelectionAction;
            if(action){
                return action.call(null, datums) || datums;
            }
            
            return datums;
        }
        
        return this.root._onUserSelection(datums);
    },
    
    isOrientationVertical: function(orientation) {
        return (orientation || this.options.orientation) === pvc.orientation.vertical;
    },

    isOrientationHorizontal: function(orientation) {
        return (orientation || this.options.orientation) === pvc.orientation.horizontal;
    },
    
    /**
     * Disposes the chart, any of its panels and child charts.
     */
    dispose: function(){
        if(!this._disposed){
            
            // TODO: 
            
            this._disposed = true;
        }
    },
    
    defaults: {
//        canvas: null,

        width:  400,
        height: 300,
        
//        multiChartMax: undefined,
//        multiChartMaxColumns: undefined,
//        multiChartWidth: undefined,
//        multiChartAspectRatio: undefined,
//        multiChartSingleRowFillsHeight: undefined,
//        multiChartSingleColFillsHeight: undefined,
//        multiChartMaxHeight: undefined,
        
        orientation: 'vertical',
        
//        extensionPoints:   undefined,
//        
//        visualRoles:       undefined,
//        dimensions:        undefined,
//        dimensionGroups:   undefined,
//        readers:           undefined,
        
        ignoreNulls:       true, // whether to ignore or keep "null"-measure datums upon loading
        crosstabMode:      true,
//        multiChartIndexes: undefined,
        isMultiValued:     false,
        seriesInRows:      false,
        groupedLabelSep:   undefined,
//        measuresIndexes:   undefined,
//        dataOptions:       undefined,
//        
//        timeSeries:        undefined,
//        timeSeriesFormat:  undefined,

        animate: true,

//        title:         null,
        titlePosition: "top", // options: bottom || left || right
        titleAlign:    "center", // left / right / center
//        titleAlignTo:  undefined,
//        titleOffset:   undefined,
//        titleInBounds: undefined,
//        titleSize:     undefined,
//        titleSizeMax:  undefined,
//        titleMargins:  undefined,
//        titlePaddings: undefined,
//        titleFont:     undefined,
        
        legend:           false, // Show Legends
        legendPosition:   "bottom",
//        legendFont:       undefined,
//        legendSize:       undefined,
//        legendSizeMax:    undefined,
//        legendAlign:      undefined,
//        legendAlignTo:    undefined,
//        legendOffset:     undefined,
//        legendInBounds:   undefined,
//        legendMinMarginX: undefined,
//        legendMinMarginY: undefined,
//        legendTextMargin: undefined,
//        legendPadding:    undefined, // ATTENTION: this is different from legendPaddings
//        legendShape:      undefined,
//        legendDrawLine:   undefined,
//        legendDrawMarker: undefined,
//        legendMarkerSize: undefined,
//        legendMargins:    undefined,
//        legendPaddings:   undefined,
//        legendClickMode:  undefined,
        
//        colors: null,

        secondAxis: false,
        secondAxisIdx: -1,
//        secondAxisSeriesIndexes: undefined,
//        secondAxisColor: undefined,
//        secondAxisOwnColors: undefined, // false

        showTooltips: true,
        
//        tooltipFormat: undefined,
        
        v1StyleTooltipFormat: function(s, c, v, datum) {
            return s + ", " + c + ":  " + this.chart.options.valueFormat(v) +
                   (datum && datum.percent ? ( " (" + datum.percent.label + ")") : "");
        },
        
        tipsySettings: {
            gravity: "s",
            delayIn:     200,
            delayOut:    80, // smoother moving between marks with tooltips, possibly slightly separated
            offset:      2,
            opacity:     0.8,
            html:        true,
            fade:        false, // fade out
            corners:     false,
            followMouse: false
        },
        
        valueFormat: def.scope(function(){
            var pvFormat = pv.Format.number().fractionDigits(0, 2);
            
            return function(d) {
                return pvFormat.format(d);
                // pv.Format.number().fractionDigits(0, 10).parse(d));
            };
        }),
        
        /* For numeric values in percentage */
        percentValueFormat: def.scope(function(){
            var pvFormat = pv.Format.number().fractionDigits(0, 1);
            
            return function(d){
                return pvFormat.format(d * 100) + "%";
            };
        }),
        
        // Content/Plot area clicking
        clickable:  false,
//        clickAction: null,
//        doubleClickAction: null,
        doubleClickMaxDelay: 300, //ms
//      clickAction: function(s, c, v) {
//          pvc.log("You clicked on series " + s + ", category " + c + ", value " + v);
//      },
        
        hoverable:  false,
        selectable: false,
        
//        selectionChangedAction: null,
//        userSelectionAction: null, 
            
        // Use CTRL key to make fine-grained selections
        ctrlSelectMode: true,
        clearSelectionMode: 'emptySpaceClick', // or null <=> 'manual' (i.e., by code)
        
        // Selection - Rubber band
        rubberBandFill: 'rgba(203, 239, 163, 0.6)', // 'rgba(255, 127, 0, 0.15)',
        rubberBandLine: '#86fe00', //'rgb(255,127,0)',
        
//        renderCallback: undefined,
//
//        margins:  undefined,
//        paddings: undefined,
//        
//        contentMargins:  undefined,
//        contentPaddings: undefined,
        
        compatVersion: Infinity // numeric, 1 currently recognized
    }
});


/**
 * Base panel. 
 * A lot of them will exist here, with some common properties. 
 * Each class that extends pvc.base will be 
 * responsible to know how to use it.
 */
pvc.BasePanel = pvc.Abstract.extend({

    chart: null,
    parent: null,
    _children: null,
    type: pv.Panel, // default one
    
    /**
     * Total height of the panel in pixels.
     * Includes vertical paddings and margins.
     * @type number  
     */
    height: null,
    
    /**
     * Total width of the panel in pixels.
     * Includes horizontal paddings and margins.
     * @type number
     */
    width: null,
    
    anchor: "top",
    
    pvPanel: null, // padding/client pv panel (within border box, separated by paddings)
    
    margins:   null,
    paddings:  null,
    
    isRoot:    false,
    isTopRoot: false,
    root:      null, 
    topRoot:   null,
    
    _coreInfo: null,   // once per create info (only for information that is: layout independent *and* required by layout)
    _layoutInfo: null, // once per layout info
    
    /**
     * The data that the panel uses to obtain "data".
     * @type pvc.data.Data
     */
    data: null,

    dataPartValue: null,
    
    _colorAxis: null,
    
    /**
     * Indicates if the top root panel is rendering with animation
     * and, if so, the current phase of animation.
     * 
     * <p>This property can assume the following values:</p>
     * <ul>
     * <li>0 - Not rendering with animation (may even not be rendering at all).</li>
     * <li>1 - Rendering the animation's <i>start</i> point,</li>
     * <li>2 - Rendering the animation's <i>end</i> point.</li>
     * </ul>
     * 
     * @see #animate
     * @see #isAnimatingStart
     * 
     * @type number
     */
    _isAnimating: 0,
    
    _isRubberBandSelecting: false,
    
    /**
     * Shared state between {@link _handleClick} and {@link #_handleDoubleClick}.
     */
    _ignoreClicks: 0,
    
    /**
     * Indicates the name of the role that should be used whenever a V1 dimension value is required.
     * Only the first dimension of the specified role is considered.
     * <p>
     * In a derived class use {@link Object.create} to override this object for only certain
     * v1 dimensions.
     * </p>
     * @ type string
     */
    _v1DimRoleName: {
        'series':   'series',
        'category': 'category',
        'value':    'value'
    },
    
    _sceneTypeExtensions: null,
    
    constructor: function(chart, parent, options) {
        
        if(options){
            if(options.scenes){
                this._sceneTypeExtensions = options.scenes;
                delete options.scenes;
            }
            
            if(options.colorAxis){
                this._colorAxis = options.colorAxis;
                delete options.colorAxis;
            }
        }
        
        // TODO: Danger...
        $.extend(this, options);
        
        this.chart = chart;

        this.position = {
            /*
            top:    0,
            right:  0,
            bottom: 0,
            left:   0
            */
        };
        
        this.margins  = new pvc.Sides(options && options.margins );
        this.paddings = new pvc.Sides(options && options.paddings);
        this.size     = new pvc.Size (options && options.size    );
        this.sizeMax  = new pvc.Size (options && options.sizeMax );
        
        if(!parent) {
            this.parent    = null;
            this.root      = this;
            this.topRoot   = this;
            this.isRoot    = true;
            this.isTopRoot = true;
            this.data      = this.chart.data;
            
        } else {
            this.parent    = parent;
            this.root      = parent.root;
            this.topRoot   = parent.topRoot;
            this.isTopRoot = false;
            this.isRoot    = (parent.chart !== chart);
            this.data      = parent.data; // TODO

            if(this.isRoot) {
                this.position.left = chart.left; 
                this.position.top  = chart.top;
            }
            
            parent._addChild(this);
        }
        
        /* Root panels do not need layout */
        if(this.isRoot) {
            this.anchor  = null;
            this.align   = null;
            this.alignTo = null;
            this.offset  = null;
        } else {
            this.align = pvc.parseAlign(this.anchor, this.align);
            
            // * a string with a named alignTo value
            // * a number
            // * a PercentValue object
            var alignTo = this.alignTo;
            var side = this.anchor;
            if(alignTo != null && alignTo !== '' && (side === 'left' || side === 'right')){
                if(alignTo !== 'page-middle'){
                    if(!isNaN(+alignTo.charAt(0))){
                        alignTo = pvc.PercentValue.parse(alignTo); // percent or number
                    } else {
                        alignTo = pvc.parseAlign(side, alignTo);
                    }
                }
            } else {
                alignTo = this.align;
            }
            
            this.alignTo = alignTo;
            
            this.offset = new pvc.Offset(this.offset);
        }
    },
    
    compatVersion: function(){
        return this.chart.compatVersion();
    },
    
    defaultColorAxis: function(){
        return this._colorAxis || this.chart.axes.color;
    },
    
    defaultVisibleBulletGroupScene: function(){
        // Register legend prototype marks
        var colorAxis = this.defaultColorAxis();
        if(colorAxis && colorAxis.isVisible){
            return colorAxis.legendBulletGroupScene;
        }
        return null;
    },
    
    /**
     * Adds a panel as child.
     */
    _addChild: function(child){
        // <Debug>
        /*jshint expr:true */
        child.parent === this || def.assert("Child has a != parent.");
        // </Debug>
        
        (this._children || (this._children = [])).push(child);
    },
    
    /* LAYOUT PHASE */
    
    /** 
     * Calculates and sets its size,
     * taking into account a specified total size.
     * 
     * @param {pvc.Size} [availableSize] The total size available for the panel.
     * <p>
     * On root panels this argument is not specified,
     * and the panels' current {@link #width} and {@link #height} are used as default. 
     * </p>
     * @param {object}  [keyArgs] Keyword arguments.
     * @param {boolean} [keyArgs.force=false] Indicates that the layout should be
     * performed even if it has already been done.
     * @param {pvc.Size} [keyArgs.referenceSize] The size that should be used for 
     * percentage size calculation. 
     * This will typically be the <i>client</i> size of the parent.
     * @param {pvc.Sides} [keyArgs.paddings] The paddings that should be used for 
     * the layout. Default to the panel's paddings {@link #paddings}.
     * @param {pvc.Sides} [keyArgs.margins] The margins that should be used for 
     * the layout. Default to the panel's margins {@link #margins}.
     * @param {boolean} [keyArgs.canChange=true] Whether this is a last time layout. 
     */
    layout: function(availableSize, keyArgs){
        if(!this._layoutInfo || def.get(keyArgs, 'force', false)) {
            
            var referenceSize = def.get(keyArgs, 'referenceSize');
            if(!referenceSize && availableSize){
                referenceSize = def.copyOwn(availableSize);
            }
            
            // Does this panel have a **desired** fixed size specified?
            
            // * size may have no specified components 
            // * referenceSize may be null
            var desiredSize = this.size.resolve(referenceSize);
            var sizeMax     = this.sizeMax.resolve(referenceSize);
            
            if(!availableSize) {
                if(desiredSize.width == null || desiredSize.height == null){
                    throw def.error.operationInvalid("Panel layout without width or height set.");
                }
                
                availableSize = def.copyOwn(desiredSize);
            }
            
            if(!referenceSize && availableSize){
                referenceSize = def.copyOwn(availableSize);
            }
            
            // Apply max size to available size
            if(sizeMax.width != null && availableSize.width > sizeMax.width){
                availableSize.width = sizeMax.width;
            }
            
            if(sizeMax.height != null && availableSize.height > sizeMax.height){
                availableSize.height = sizeMax.height;
            }
            
            var margins  = (def.get(keyArgs, 'margins' ) || this.margins ).resolve(referenceSize);
            var paddings = (def.get(keyArgs, 'paddings') || this.paddings).resolve(referenceSize);
            
            var spaceWidth  = margins.width  + paddings.width;
            var spaceHeight = margins.height + paddings.height;
            
            var availableClientSize = new pvc.Size(
                    Math.max(availableSize.width  - spaceWidth,  0),
                    Math.max(availableSize.height - spaceHeight, 0)
                );
            
            var desiredClientSize = def.copyOwn(desiredSize);
            if(desiredClientSize.width != null){
                desiredClientSize.width = Math.max(desiredClientSize.width - spaceWidth, 0);
            }
            
            if(desiredClientSize.height != null){
                desiredClientSize.height = Math.max(desiredClientSize.height - spaceHeight, 0);
            }
            
            var prevLayoutInfo = this._layoutInfo || null;
            var canChange = def.get(keyArgs, 'canChange', true);
            
            var layoutInfo = 
                this._layoutInfo = {
                    canChange:         canChange,
                    referenceSize:     referenceSize,
                    margins:           margins,
                    paddings:          paddings,
                    desiredClientSize: desiredClientSize,
                    clientSize:        availableClientSize,
                    pageClientSize:    prevLayoutInfo ? prevLayoutInfo.pageClientSize : availableClientSize.clone(),
                    previous:          prevLayoutInfo
                };
            
            if(prevLayoutInfo){
                // Free old memory
                delete prevLayoutInfo.previous;
                delete prevLayoutInfo.pageClientSize;
            }
            
            var clientSize = this._calcLayout(layoutInfo);
            
            var size;
            if(!clientSize){
                size = availableSize; // use all available size
                clientSize = availableClientSize;
            } else {
                layoutInfo.clientSize = clientSize;
                size = {
                    width:  clientSize.width  + spaceWidth,
                    height: clientSize.height + spaceHeight
                };
            }
            
            this.isVisible = (clientSize.width > 0 && clientSize.height > 0);
            
            delete layoutInfo.desiredClientSize;
            
            this.width  = size.width;
            this.height = size.height;
            
            if(!canChange && prevLayoutInfo){
                delete layoutInfo.previous;
            }
        }
    },
    
    /**
     * Override to calculate panel client size.
     * <p>
     * The default implementation performs a dock layout {@link #layout} on child panels
     * and uses all of the available size. 
     * </p>
     * 
     * @param {object} layoutInfo An object that is supplied with layout information
     * and on which to export custom layout information.
     * <p>
     * This object is later supplied to the method {@link #_createCore},
     * and can thus be used to store any layout by-product
     * relevant for the creation of the protovis marks and
     * that should be cleared whenever a layout becomes invalid.
     * </p>
     * <p>
     * The object is supplied with the following properties:
     * </p>
     * <ul>
     *    <li>referenceSize - size that should be used for percentage size calculation. 
     *        This will typically be the <i>client</i> size of the parent.
     *    </li>
     *    <li>margins - the resolved margins object. All components are present, possibly with the value 0.</li>
     *    <li>paddings - the resolved paddings object. All components are present, possibly with the value 0.</li>
     *    <li>desiredClientSize - the desired fixed client size. Do ignore a null width or height property value.</li>
     *    <li>clientSize - the available client size, already limited by a maximum size if specified.</li>
     * </ul>
     * <p>
     * Do not modify the contents of the objects of 
     * any of the supplied properties.
     * </p>
     * @virtual
     */
    _calcLayout: function(layoutInfo){
        
        if(!this._children) {
            return;
        }
        
        
        var aolMap = pvc.BasePanel.orthogonalLength;
        var aoMap  = pvc.BasePanel.relativeAnchor;
        var altMap = pvc.BasePanel.leftTopAnchor;
        var aofMap = pvc.Offset.namesSidesToOffset;
        
        // Classify children
        
        var fillChildren = [];
        var sideChildren = [];
        
        this._children.forEach(function(child) {
            var a = child.anchor;
            if(a){ // requires layout
                if(a === 'fill') {
                    fillChildren.push(child);
                } else {
                    /*jshint expr:true */
                    def.hasOwn(aoMap, a) || def.fail.operationInvalid("Unknown anchor value '{0}'", [a]);
                    
                    sideChildren.push(child);
                }
            }
        });
    
        // When expanded (see checkChildLayout)
        // a re-layout is performed.
        var clientSize = def.copyOwn(layoutInfo.clientSize);
        var childKeyArgs = {
                force: true,
                referenceSize: clientSize
            };
        
        var margins, remSize;
        
        doMaxTimes(3, layoutCycle, this);
        
        /* Return possibly changed clientSize */
        return clientSize;
        
        // --------------------
        function doMaxTimes(maxTimes, fun, ctx){
            var index = 0;
            while(maxTimes--){
                // remTimes = maxTimes
                if(fun.call(ctx, maxTimes, index) === false){
                    return true;
                }
                index++;
            }
            
            return false;
        }
        
        function layoutCycle(remTimes, iteration){
            if(pvc.debug >= 5){
                pvc.log("\n[BasePanel] ==== LayoutCycle #" + (iteration + 1));
            }
            
            // Objects we can mutate
            // Reset margins and remSize
            margins = new pvc.Sides(0);
            remSize = def.copyOwn(clientSize);
            
            var canResize = (remTimes > 0);
            
            // Reset margins and remSize
            // ** Instances we can mutate
            margins = new pvc.Sides(0);
            remSize = def.copyOwn(clientSize);
            
            var index, count, child;
            
            // Lay out SIDE child panels
            index = 0;
            count = sideChildren.length;
            while(index < count){
                child = sideChildren[index];
                if(pvc.debug >= 5){
                    pvc.log("[BasePanel] SIDE Child i=" + index + " at " + child.anchor);
                }
                
                if(layoutChild.call(this, child, canResize)){
                    return true; // resized => break
                }
                
                index++;
            }
            
            // Lay out FILL child panels
            index = 0;
            count = fillChildren.length;
            while(index < count){
                child = fillChildren[index];
                if(pvc.debug >= 5){
                    pvc.log("[BasePanel] FILL Child i=" + index);
                }
                
                if(layoutChild.call(this, child, canResize)){
                    return true; // resized => break
                }
                
                index++;
            }
            
            return false; // !resized
        }
        
        function layoutChild(child, canResize) {
            var resized  = false;
            var paddings;
            
            childKeyArgs.canChange = canResize;
            
            doMaxTimes(3, function(remTimes, iteration){
                if(pvc.debug >= 5){
                    pvc.log("[BasePanel]   Attempt #" + (iteration + 1));
                }
                
                childKeyArgs.paddings = paddings;
                childKeyArgs.canChange = remTimes > 0;
                
                child.layout(new pvc.Size(remSize), childKeyArgs);
                if(child.isVisible){
                    resized = checkChildResize.call(this, child, canResize);
                    if(resized){
                        return false; // stop
                    }
                    
                    paddings = child._layoutInfo.requestPaddings;
                    if(paddings){
                        // Child wants to repeat its layout with != paddings
                        if(remTimes > 0){
                            paddings = new pvc.Sides(paddings);
                            if(pvc.debug >= 5){
                                pvc.log("[BasePanel] Child requested paddings change: " + JSON.stringify(paddings));
                            }
                            return true; // again
                        }
                        
                        if(pvc.debug >= 2){
                            pvc.log("[Warning] [BasePanel] FILL Child requests paddings change but no more iterations possible.");
                        }
                        
                        // ignore overflow
                    }
                    
                    // --------
                    
                    positionChild.call(this, child);
                        
                    if(child.anchor !== 'fill'){
                        updateSide.call(this, child);
                    }
                }
                
                return false; // stop
            }, this);
            
            return resized;
        }
        
        function checkChildResize(child, canResize){
            var resized = false;
            var addWidth = child.width - remSize.width;
            if(addWidth > 0){
                if(!canResize){
                    if(pvc.debug >= 2){
                        pvc.log("[Warning] Layout iterations limit reached.");
                    }
                } else {
                    resized = true;
                    
                    remSize   .width += addWidth;
                    clientSize.width += addWidth;
                }
            }
            
            var addHeight = child.height - remSize.height;
            if(addHeight > 0){
                if(!canResize){
                    if(pvc.debug >= 2){
                        pvc.log("[Warning] Layout iterations limit reached.");
                    }
                } else {
                    resized = true;
                    
                    remSize   .height += addHeight;
                    clientSize.height += addHeight;
                }
            }
            
            return resized;
        }
        
        function positionChild(child) {
            var side  = child.anchor;
            var align = child.align;
            var alignTo = child.alignTo;
            var sidePos;
            if(side === 'fill'){
                side = 'left';
                sidePos = margins.left + remSize.width / 2 - (child.width / 2);
                align = alignTo = 'middle';
            } else {
                sidePos = margins[side];
            }
            
            var sideo, sideOPosChildOffset;
            switch(align){
                case 'top':
                case 'bottom':
                case 'left':
                case 'right':
                    sideo = align;
                    sideOPosChildOffset = 0;
                    break;
                
                case 'center':
                case 'middle':
                    // 'left', 'right' -> 'top'
                    // else -> 'left'
                    sideo = altMap[aoMap[side]];
                    
                    // left -> width; top -> height
                    sideOPosChildOffset = - child[aolMap[sideo]] / 2;
                    break;
            }
            
            
            var sideOPosParentOffset;
            var sideOTo;
            switch(alignTo){
                case 'top':
                case 'bottom':
                case 'left':
                case 'right':
                    sideOTo = alignTo;
                    sideOPosParentOffset = (sideOTo !== sideo) ? remSize[aolMap[sideo]] : 0;
                    break;

                case 'center':
                case 'middle':
                    sideOTo = altMap[aoMap[side]];
                    
                    sideOPosParentOffset = remSize[aolMap[sideo]] / 2;
                    break;
                        
                case 'page-center':
                case 'page-middle':
                    sideOTo = altMap[aoMap[side]];
                    
                    var lenProp = aolMap[sideo];
                    var pageLen = Math.min(remSize[lenProp], layoutInfo.pageClientSize[lenProp]);
                    sideOPosParentOffset = pageLen / 2;
                    break;
            }
            
            var sideOPos = margins[sideOTo] + sideOPosParentOffset + sideOPosChildOffset;
            
            var resolvedOffset = child.offset.resolve(remSize);
            if(resolvedOffset){
                sidePos  += resolvedOffset[aofMap[side ]] || 0;
                sideOPos += resolvedOffset[aofMap[sideo]] || 0;
            }
            
            if(child.inBounds){
                if(sidePos < 0){
                    sidePos = 0;
                }
                
                if(sideOPos < 0){
                    sideOPos = 0;
                }
            }
            
            child.setPosition(
                    def.set({}, 
                        side,  sidePos,
                        sideo, sideOPos));
        }
        
        // Decreases available size and increases margins
        function updateSide(child) {
            var side   = child.anchor;
            var sideol = aolMap[side];
            var olen   = child[sideol];
            
            margins[side]   += olen;
            remSize[sideol] -= olen;
        }
    },
    
    /** 
     * CREATION PHASE
     * 
     * Where the protovis main panel, and any other marks, are created.
     * 
     * If the layout has not been performed it is so now.
     */
    _create: function(force) {
        if(!this.pvPanel || force) {
            
            this.pvPanel = null;
            
            delete this._coreInfo;
            
            /* Layout */
            this.layout();
            
            if(!this.isVisible){
                return;
            }
            
            if(this.isRoot) {
                this._creating();
            }
            
            var margins  = this._layoutInfo.margins;
            var paddings = this._layoutInfo.paddings;
            
            /* Protovis Panel */
            if(this.isTopRoot) {
                this.pvRootPanel = 
                this.pvPanel = new pv.Panel().canvas(this.chart.options.canvas);
                
                if(margins.width > 0 || margins.height > 0){
                    this.pvPanel
                        .width (this.width )
                        .height(this.height);
                    
                    // As there is no parent panel,
                    // the margins cannot be accomplished by positioning
                    // on the parent panel and sizing.
                    // We thus create another panel to be a child of pvPanel
                   
                    this.pvPanel = this.pvPanel.add(pv.Panel);
                }
            } else {
                this.pvPanel = this.parent.pvPanel.add(this.type);
            }
            
            var pvBorderPanel = this.pvPanel;
            
            // Set panel size
            var width  = this.width  - margins.width;
            var height = this.height - margins.height;
            pvBorderPanel
                .width (width)
                .height(height);
            
            // Set panel positions
            var hasPositions = {};
            def.eachOwn(this.position, function(v, side){
                pvBorderPanel[side](v + margins[side]);
                hasPositions[this.anchorLength(side)] = true;
            }, this);
            
            if(!hasPositions.width && margins.left > 0){
                pvBorderPanel.left(margins.left);
            }
            
            if(!hasPositions.height && margins.top > 0){
                pvBorderPanel.top(margins.top);
            }
            
            // Check padding
            if(paddings.width > 0 || paddings.height > 0){
                // We create separate border (outer) and inner (padding) panels
                this.pvPanel = pvBorderPanel.add(pv.Panel)
                                   .width (width  - paddings.width )
                                   .height(height - paddings.height)
                                   .left(paddings.left)
                                   .top (paddings.top );
            }
            
            pvBorderPanel.borderPanel  = pvBorderPanel;
            pvBorderPanel.paddingPanel = this.pvPanel;
            
            this.pvPanel.paddingPanel  = this.pvPanel;
            this.pvPanel.borderPanel   = pvBorderPanel;
            
            if(pvc.debug >= 15){
                this.pvPanel // inner
                    .strokeStyle('lightgreen')
                    .lineWidth(1)
                    .strokeDasharray('- ');
                
                pvBorderPanel // outer
                    .strokeStyle('lightblue')
                    .lineWidth(1)
                    .strokeDasharray(null); 
            }
            /* Protovis marks that are pvcPanel specific,
             * and/or #_creates child panels.
             */
            this._createCore(this._layoutInfo);
            
            /* RubberBand */
            if (this.isTopRoot && this.chart.options.selectable && pv.renderer() !== 'batik'){
                this._initRubberBand();
            }

            /* Extensions */
            this.applyExtensions();
        }
    },
    
    _creating: function(){
        if(this._children) {
            this._children.forEach(function(child){
                child._creating();
            });
        }
    },
    
    /**
     * Override to create specific protovis components for a given panel.
     * 
     * The default implementation calls {@link #_create} on each child panel.
     * 
     * @param {object} layoutInfo The object with layout information 
     * "exported" by {@link #_calcLayout}.
     * 
     * @virtual
     */
    _createCore: function(layoutInfo){
        if(this._children) {
            this._children.forEach(function(child){
                child._create();
            });
        }
    },
    
    /** 
     * RENDER PHASE
     * 
     * Where protovis components are rendered.
     * 
     * If the creation phase has not been performed it is so now.
     */
    
    /**
     * Renders the top root panel.
     * <p>
     * The render is always performed from the top root panel,
     * independently of the panel on which the method is called.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * @param {boolean} [keyArgs.bypassAnimation=false] Indicates that animation should not be performed.
     * @param {boolean} [keyArgs.recreate=false] Indicates that the panel and its descendants should be recreated.
     */
    render: function(keyArgs){
        
        if(!this.isTopRoot) {
            return this.topRoot.render(keyArgs);
        }
        
        this._create(def.get(keyArgs, 'recreate', false));
        
        if(!this.isVisible){
            return;
        }
        
        var chart = this.chart,
            options = chart.options;
        
        if (options.renderCallback) {
            options.renderCallback.call(chart);
        }
        
        var pvPanel = this.pvRootPanel;
        
        this._isAnimating = options.animate && !def.get(keyArgs, 'bypassAnimation', false) ? 1 : 0;
        try {
            // When animating, renders the animation's 'start' point
            pvPanel.render();
            
            // Transition to the animation's 'end' point
            if (this._isAnimating) {
                this._isAnimating = 2;
                
                var me = this;
                pvPanel
                    .transition()
                    .duration(2000)
                    .ease("cubic-in-out")
                    .start(function(){
                        me._isAnimating = 0;
                        me._onRenderEnd(true);
                    });
            } else {
                this._onRenderEnd(false);
            }
        } finally {
            this._isAnimating = 0;
        }
    },
    
    /**
     * Called when a render has ended.
     * When the render performed an animation
     * and the 'animated' argument will have the value 'true'.
     *
     * The default implementation calls each child panel's
     * #_onRenderEnd method.
     * @virtual
     */
    _onRenderEnd: function(animated){
        if(this._children){
            this._children.forEach(function(child){
                child._onRenderEnd(animated);
            });
        }
    },
    
    /**
     * The default implementation renders
     * the marks returned by #_getSignums, 
     * or this.pvPanel if none is returned (and it has no children)
     * which is generally in excess of what actually requires
     * to be re-rendered.
     * The call is then propagated to any child panels.
     * 
     * @virtual
     */
    _renderInteractive: function(){
        if(this.isVisible){
            var marks = this._getSignums();
            if(marks && marks.length){
                marks.forEach(function(mark){ mark.render(); });
            } else if(!this._children) {
                this.pvPanel.render();
            }
            
            if(this._children){
                this._children.forEach(function(child){
                    child._renderInteractive();
                });
            }
        }
    },

    /**
     * Returns an array of marks whose instances are associated to a datum, or null.
     * @virtual
     */
    _getSignums: function(){
        return null;
    },
    
    
    /* ANIMATION */
    
    animate: function(start, end) {
        return (this.topRoot._isAnimating === 1) ? start : end;
    },
    
    /**
     * Indicates if the panel is currently 
     * rendering the animation start phase.
     * <p>
     * Prefer using this function instead of {@link #animate} 
     * whenever its <tt>start</tt> or <tt>end</tt> arguments
     * involve a non-trivial calculation. 
     * </p>
     * 
     * @type boolean
     */
    isAnimatingStart: function() {
        return (this.topRoot._isAnimating === 1);
    },
    
    /**
     * Indicates if the panel is currently 
     * rendering animation.
     * 
     * @type boolean
     */
    isAnimating: function() {
        return (this.topRoot._isAnimating > 0);
    },
    
    
    /* EXTENSION */
    
    /**
     * Override to apply specific extensions points.
     * @virtual
     */
    applyExtensions: function(){
        if (this.isRoot) {
            this.extend(this.pvPanel, "base_");
        }
    },

    /**
     * Extends a protovis mark with extension points 
     * having a given prefix.
     */
    extend: function(mark, prefix, keyArgs) {
        this.chart.extend(mark, prefix, keyArgs);
    },
    
    _extendSceneType: function(typeKey, type, names){
        var typeExts = def.get(this._sceneTypeExtensions, typeKey);
        if(typeExts){
            pvc.extendType(type, typeExts, names);
        }
    },
    
    /**
     * Obtains an extension point given its identifier or identifier parts.
     * <p>
     * Multiple identifiers are concatenated with '_' to form the full identifier.
     * </p>
     */
    _getExtension: function(extPoint) {
        return this.chart._getExtension.apply(this.chart, arguments);
    },

    _getConstantExtension: function(extPoint) {
        var value = this.chart._getExtension.apply(this.chart, arguments);
        if(!def.fun.is(value)){
            return value;
        }
    },
    
    /* SIZE & POSITION */
    setPosition: function(position){
        for(var side in position){
            if(def.hasOwn(pvc.Sides.namesSet, side)){
                var s = position[side]; 
                if(s === null) {
                    delete this.position[side];
                } else {
                    s = +s; // -> to number
                    if(!isNaN(s) && isFinite(s)){
                        this.position[side] = s;
                    }
                }
            }
        }
    },
    
    createAnchoredSize: function(anchorLength, size){
        if (this.isAnchorTopOrBottom()) {
            return new pvc.Size(size.width, Math.min(size.height, anchorLength));
        } 
        return new pvc.Size(Math.min(size.width, anchorLength), size.height);
    },

    /**
     * Returns the underlying protovis Panel.
     * If 'layer' is specified returns
     * the protovis panel for the specified layer name.
     */
    getPvPanel: function(layer) {
        var mainPvPanel = this.pvPanel;
        if(!layer){
            return mainPvPanel;
        }

        if(!this.parent){
            throw def.error.operationInvalid("Layers are not possible in a root panel.");
        }

        if(!mainPvPanel){
            throw def.error.operationInvalid(
               "Cannot access layer panels without having created the main panel.");
        }

        var pvPanel = null;
        if(!this._layers){
            this._layers = {};
        } else {
            pvPanel = this._layers[layer];
        }

        if(!pvPanel){
            var pvParentPanel = this.parent.pvPanel;
            var pvBorderPanel = 
                pvPanel = pvParentPanel.borderPanel.add(this.type)
                              .extend(mainPvPanel.borderPanel);
            
            if(mainPvPanel !== mainPvPanel.borderPanel){
                pvPanel = pvBorderPanel.add(pv.Panel)
                                       .extend(mainPvPanel);
            }
            
            pvBorderPanel.borderPanel  = pvBorderPanel;
            pvBorderPanel.paddingPanel = pvPanel;
            
            pvPanel.paddingPanel  = pvPanel;
            pvPanel.borderPanel   = pvBorderPanel;
            
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
    
    /* EVENTS & VISUALIZATION CONTEXT */
    _getV1DimName: function(v1Dim){
        var dimNames = this._v1DimName || (this._v1DimNameCache = {});
        var dimName  = dimNames[v1Dim];
        if(dimName == null) {
            var role = this.chart.visualRoles(this._v1DimRoleName[v1Dim], {assertExists: false});
            dimName = role ? role.firstDimensionName() : '';
            dimNames[v1Dim] = dimName;
        }
        
        return dimName;
    },
    
    /**
     * Creates the visualization context of the panel.
     * <p>
     * Override to use a specific visualization context class. 
     * </p>
     * 
     * @param {pv.Mark} mark The protovis mark being rendered or targeted by an event.
     * @param {object} [event] An event object.
     * @type pvc.visual.Context
     * @virtual
     */
    _createContext: function(mark, ev){
        return new pvc.visual.Context(this, mark, ev);
    },
    
    /**
     * Updates the visualization context of the panel.
     * <p>
     * Override to perform specific updates. 
     * </p>
     * 
     * @param {pvc.visual.Context} context The panel's visualization context.
     * @param {pv.Mark} mark The protovis mark being rendered or targeted by an event.
     * @param {object} [event] An event object.
     * @type pvc.visual.Context
     * @virtual
     */
    _updateContext: function(context, mark, ev){
        /*global visualContext_update:true */
        visualContext_update.call(context, mark, ev);
    },
    
    _getContext: function(mark, ev){
        if(!this._context) {
            this._context = this._createContext(mark, ev);
        } else {
            this._updateContext(this._context, mark, ev);
        }
        
        return this._context;
    },
    
    _isTooltipEnabled: function(){
        return !this.isRubberBandSelecting() && !this.isAnimating();
    },
    
    /* TOOLTIP */ 
    _addPropTooltip: function(mark, keyArgs){
        var myself = this,
            tipsyEvent = def.get(keyArgs, 'tipsyEvent'), 
            options = this.chart.options,
            tipsySettings = Object.create(options.tipsySettings),  
            buildTooltip;
        
        tipsySettings.isEnabled = this._isTooltipEnabled.bind(this);
        
        if(!tipsyEvent) {
//          switch(mark.type) {
//                case 'dot':
//                case 'line':
//                case 'area':
//                    this._requirePointEvent();
//                    tipsyEvent = 'point';
//                    tipsySettings.usesPoint = true;
//                    break;
                
//                default:
                    tipsyEvent = 'mouseover';
//            }
        }
        
        var tooltipFormat = options.tooltipFormat;
        if(!tooltipFormat) {
            buildTooltip = this._buildTooltip;
        } else {
            buildTooltip = function(context){
                return tooltipFormat.call(context, 
                                context.getV1Series(),
                                context.getV1Category(),
                                context.getV1Value() || '',
                                context.scene.datum);
            };
        }
        
        mark.localProperty("tooltip")
            /* Lazy tooltip creation, when requested */
            .tooltip(function(){
                var tooltip,
                    // Capture current context
                    context = myself._createContext(mark, null);
                
                // No group or datum?
                if(!context.scene.atoms) {
                    return "";
                }
                
                return function() {
                    if(tooltip == null) {
                        tooltip = buildTooltip.call(myself, context);
                        context = null; // release context;
                    } 
                    return tooltip; 
                };
            })
            /* Prevent browser tooltip */
            .title(function(){
                return '';
            })
            .event(tipsyEvent, pv.Behavior.tipsy(tipsySettings || options.tipsySettings));
    },

    _requirePointEvent: function(radius){
        if(!this.isTopRoot) {
            return this.topRoot._requirePointEvent(radius);
        }

        if(!this._attachedPointEvent){

            // Fire point and unpoint events
            this.pvPanel
                .events('all')
                .event("mousemove", pv.Behavior.point(radius || 20));

            this._attachedPointEvent = true;
        }
    },

    _buildTooltip: function(context){

        var chart = this.chart,
            data = chart.data,
            visibleKeyArgs = {visible: true},
            scene = context.scene,
            group = scene.group,
            isMultiDatumGroup = group && group._datums.length > 1;
        
        // Single null datum?
        if(!isMultiDatumGroup && scene.datum.isNull) {
            return "";
        }
        
        var tooltip = [],
            /*
             * TODO: Big HACK to prevent percentages from
             * showing up in the Lines of BarLine
             */
            playingPercentMap = context.panel.stacked === false ? 
                                null :
                                data.type.getPlayingPercentVisualRoleDimensionMap(),
            commonAtoms = isMultiDatumGroup ? group.atoms : scene.datum.atoms;
        
        function addDim(escapedDimLabel, label){
            tooltip.push('<b>' + escapedDimLabel + "</b>: " + (def.html.escape(label) || " - ") + '<br/>');
        }
        
        function calcPercent(atom, dimName) {
            var pct;
            if(group) {
                pct = group.dimensions(dimName).percentOverParent(visibleKeyArgs);
            } else {
                pct = data.dimensions(dimName).percent(atom.value);
            }
            
            return chart.options.percentValueFormat.call(null, pct);
        }
        
        def.each(commonAtoms, function(atom, dimName){
            var dimType = atom.dimension.type;
            if(!dimType.isHidden){
                if(!isMultiDatumGroup || atom.value != null) {
                    var valueLabel = atom.label;
                    if(playingPercentMap && playingPercentMap.has(dimName)) {
                        valueLabel += " (" + calcPercent(atom, dimName) + ")";
                    }
                    
                    addDim(def.html.escape(atom.dimension.type.label), valueLabel);
                }
            }
        });
        
        if(isMultiDatumGroup) {
            tooltip.push('<hr />');
            tooltip.push("<b>#</b>: " + group._datums.length + '<br/>');
            
            group.freeDimensionNames().forEach(function(dimName){
                var dim = group.dimensions(dimName);
                if(!dim.type.isHidden){
                    var dimLabel = def.html.escape(dim.type.label),
                        valueLabel;
                    
                    if(dim.type.valueType === Number) {
                        // Sum
                        valueLabel = dim.format(dim.sum(visibleKeyArgs));
                        if(playingPercentMap && playingPercentMap.has(dimName)) {
                            valueLabel += " (" + calcPercent(null, dimName) + ")";
                        }
                        
                        dimLabel = "&sum; " + dimLabel;
                    } else {
                        valueLabel = dim.atoms(visibleKeyArgs).map(function(atom){ return atom.label || "- "; }).join(", ");
                    }
                    
                    addDim(dimLabel, valueLabel);
                }
            });
        }
        
        return '<div style="text-align: left;">' + tooltip.join('\n') + '</div>';
    },
    
    /* CLICK & DOUBLE-CLICK */
    _addPropClick: function(mark){
        var myself = this;
        
        function onClick(){
            var ev = arguments[arguments.length - 1];
            return myself._handleClick(this, ev);
        }
        
        mark.cursor("pointer")
            .event("click", onClick);
    },

    _addPropDoubleClick: function(mark){
        var myself = this;
        
        function onDoubleClick(){
            var ev = arguments[arguments.length - 1];
            return myself._handleDoubleClick(this, ev);
        }
        
        mark.cursor("pointer")
            .event("dblclick", onDoubleClick);
    },
    
    _handleDoubleClick: function(mark, ev){
        var handler = this.chart.options.doubleClickAction;
        if(handler){
            this._ignoreClicks = 2;
            
            var context = this._getContext(mark, ev);
            this._onDoubleClick(context);
        }
    },
    
    _onDoubleClick: function(context){
        var handler = this.chart.options.doubleClickAction;
        handler.call(context, 
                /* V1 ARGS */
                context.getV1Series(),
                context.getV1Category(),
                context.getV1Value(),
                context.event);
    },
    
    _shouldHandleClick: function(keyArgs){
        var options = keyArgs || this.chart.options;
        return options.selectable || (options.clickable && options.clickAction);
    },
    
    _handleClick: function(mark, ev){
        if(!this._shouldHandleClick()){
            return;
        }

        var options = this.chart.options,
            context;
        
        if(!options.doubleClickAction){
            // Use shared context
            context = this._getContext(mark, ev);
            this._handleClickCore(context);
        } else {
            // Delay click evaluation so that
            // it may be canceled if double click meanwhile
            // fires.
            var myself = this;
            
            // Capture current context
            context = this._createContext(mark, ev);
            window.setTimeout(
                function(){
                    myself._handleClickCore.call(myself, context);
                },
                options.doubleClickMaxDelay || 300);

        }
    },

    _handleClickCore: function(context){
        if(this._ignoreClicks) {
            this._ignoreClicks--;
        } else {
            this._onClick(context);
            
            if(this.chart.options.selectable && context.scene.datum){
                this._onSelect(context);
            }
        }
    },
    
    _onClick: function(context){
        var handler = this.chart.options.clickAction;
        if(handler){
            handler.call(context, 
                    /* V1 ARGS */
                    context.getV1Series(),
                    context.getV1Category(),
                    context.getV1Value(),
                    context.event);
        }
    },
    
    /* SELECTION & RUBBER-BAND */
    _onSelect: function(context){
        var datums = context.scene.datums().array(),
            chart  = this.chart;
        
        datums = this._onUserSelection(datums);
        if(datums && datums.length){
            var changed;
            if(chart.options.ctrlSelectMode && !context.event.ctrlKey){
                // Clear all but the ones we'll be selecting.
                // This way we can have a correct changed flag.
                var alreadySelectedById = def.query(datums)
                                        .where(function(datum){ return datum.isSelected; })
                                        .object({ name: function(datum){ return datum.id; } });
                
                changed = chart.data.owner.clearSelected(function(datum){
                    return !def.hasOwn(alreadySelectedById, datum.id); 
                });
                
                changed |= pvc.data.Data.setSelected(datums, true);
            } else {
                changed = pvc.data.Data.toggleSelected(datums);
            }
            
            if(changed){
                this._onSelectionChanged();
            }
        }
    },
    
    _onUserSelection: function(datums){
        return this.chart._onUserSelection(datums);
    },
    
    _onSelectionChanged: function(){
        this.chart.updateSelections();
    },
    
    isRubberBandSelecting: function(){
        return this.topRoot._isRubberBandSelecting;
    },
    
    /**
     * Add rubber-band functionality to panel.
     * Override to prevent rubber band selection.
     * 
     * @virtual
     */
    _initRubberBand: function(){
        var myself = this,
            chart = this.chart,
            options  = chart.options,
            data = chart.data;

        var dMin = 2; // Minimum dx or dy for a drag to be considered a rubber band selection

        this._isRubberBandSelecting = false;

        // Rubber band
        var rubberPvParentPanel = this.pvRootPanel || this.pvPanel.paddingPanel,
            toScreen,
            rb;
        
        var selectBar = this.selectBar = rubberPvParentPanel.add(pv.Bar)
            .visible(function() { return !!rb; } )
            .left(function() { return rb.x; })
            .top(function() { return rb.y; })
            .width(function() { return rb.dx; })
            .height(function() { return rb.dy; })
            .fillStyle(options.rubberBandFill)
            .strokeStyle(options.rubberBandLine);
        
        // Rubber band selection behavior definition
        if(!this._getExtension('base', 'fillStyle')){
            rubberPvParentPanel.fillStyle(pvc.invisibleFill);
        }
        
        // NOTE: Rubber band coordinates are always transformed to canvas/client 
        // coordinates (see 'select' and 'selectend' events)
         
        var selectionEndedDate;
        rubberPvParentPanel
            .event('mousedown', pv.Behavior.selector(false))
            .event('select', function(){
                if(!rb){
                    if(myself.isAnimating()){
                        return;
                    }
                    
                    var rb1 = this.selectionRect;
                    if(Math.sqrt(rb1.dx * rb1.dx + rb1.dy * rb1.dy) <= dMin){
                        return;
                    }
                    
                    rb = rb1;
                    myself._isRubberBandSelecting = true;
                    
                    if(!toScreen){
                        toScreen = rubberPvParentPanel.toScreenTransform();
                    }
                    
                    myself.rubberBand = rb.clone().apply(toScreen);
                } else {
                    rb = this.selectionRect;
                }
                
                selectBar.render();
            })
            .event('selectend', function(){
                if(rb){
                    var ev = arguments[arguments.length - 1];
                    
                    if(!toScreen){
                        toScreen = rubberPvParentPanel.toScreenTransform();
                    }
                    
                    myself.rubberBand = rb = this.selectionRect.clone().apply(toScreen);
                    
                    rb = null;
                    myself._isRubberBandSelecting = false;
                    selectBar.render(); // hide rubber band
                    
                    // Process selection
                    myself._dispatchRubberBandSelectionTop(ev);
                    
                    selectionEndedDate = new Date();
                    
                    myself.rubberBand = rb = null;
                }
            });
        
        if(options.clearSelectionMode === 'emptySpaceClick'){
            rubberPvParentPanel
                .event("click", function() {
                    // It happens sometimes that the click is fired 
                    //  after mouse up, ending up clearing a just made selection.
                    if(selectionEndedDate){
                        var timeSpan = new Date() - selectionEndedDate;
                        if(timeSpan < 300){
                            selectionEndedDate = null;
                            return;
                        }
                    }
                    
                    if(data.owner.clearSelected()) {
                        myself._onSelectionChanged();
                    }
                });
        }
    },
    
    _dispatchRubberBandSelectionTop: function(ev){
        /* Only update selection, which is a global op, after all selection changes */
        
        if(pvc.debug >= 3) {
            pvc.log('rubberBand ' + JSON.stringify(this.rubberBand));
        }
        
        var chart = this.chart;
        chart._suspendSelectionUpdate();
        try {
            if(!ev.ctrlKey && chart.options.ctrlSelectMode){
                chart.data.owner.clearSelected();
            }
            
            chart.useTextMeasureCache(this._dispatchRubberBandSelection, this);
            
        } finally {
            chart._resumeSelectionUpdate();
        }
    },
    
    // Callback to handle end of rubber band selection
    _dispatchRubberBandSelection: function(ev){
        // Ask the panel for signum selections
        var datumsByKey = {},
            keyArgs = {toggle: false};
        if(this._detectDatumsUnderRubberBand(datumsByKey, this.rubberBand, keyArgs)) {
            var selectedDatums = def.own(datumsByKey); 
            
            selectedDatums = this._onUserSelection(selectedDatums);
            
            var changed;
            if(keyArgs.toggle){
                pvc.data.Data.toggleSelected(selectedDatums);
                changed = true;
            } else {
                changed = pvc.data.Data.setSelected(selectedDatums, true);
            }
            
            if(changed) {
                this._onSelectionChanged();
            }
        }
        
        // --------------
        
        if(this._children) {
            this._children.forEach(function(child){
                child.rubberBand = this.rubberBand;
                child._dispatchRubberBandSelection(child);
            }, this);
        }
    },
    
    /**
     * The default implementation obtains
     * datums associated with the instances of 
     * marks returned by #_getSignums.
     * 
     * <p>
     * Override to provide a specific
     * selection detection implementation.
     * </p>
     * 
     * @param {object} datumsByKey The map that receives the found datums, indexed by their key. 
     * @param {pvc.Rect} rb The rubber band to use. The default value is the panel's current rubber band.
     * @param {object} keyArgs Keyword arguments.
     * @param {boolean} [keyArgs.toggle=false] Returns a value that indicates to the caller that the selection should be toggled.
     * 
     * @returns {boolean} <tt>true</tt> if any datum was found under the rubber band.
     * 
     * @virtual
     */
    _detectDatumsUnderRubberBand: function(datumsByKey, rb, keyArgs){
        var any = false;
        if(this.isVisible){
            var selectableMarks = this._getSignums();
        
            if(selectableMarks){
                selectableMarks.forEach(function(mark){
                    this._forEachMarkDatumUnderRubberBand(mark, function(datum){
                        datumsByKey[datum.key] = datum;
                        any = true;
                    }, this, rb);
                }, this);
            }
        }
        
        return any;
    },
    
    _forEachMarkDatumUnderRubberBand: function(mark, fun, ctx, rb){
        if(!rb) {
            rb = this.rubberBand;
        }
        
        function processShape(shape, instance) {
            // pvc.log(datum.key + ": " + JSON.stringify(shape) + " intersects? " + shape.intersectsRect(this.rubberBand));
            if (shape.intersectsRect(rb)){
                var group = instance.group;
                var datums = group ? group._datums : def.array.as(instance.datum);
                if(datums) {
                    datums.forEach(function(datum){
                        if(!datum.isNull) {
                            if(pvc.debug >= 10) {
                                pvc.log(datum.key + ": " + JSON.stringify(shape) + " mark type: " + mark.type);
                            }
                    
                            fun.call(ctx, datum);
                        }
                    });
                }
            }
        }
        
        // center, partial and total (not implemented)
        var selectionMode = def.get(mark, 'rubberBandSelectionMode', 'partial');
        var shapeMethod = (selectionMode === 'center') ? 'getInstanceCenterPoint' : 'getInstanceShape';
        
        if(mark.type === 'area' || mark.type === 'line'){
            var instancePrev;
            
            mark.eachSignumInstance(function(instance, toScreen){
                if(!instance.visible || instance.isBreak || (instance.datum && instance.datum.isNull)) {
                    // Break the line
                    instancePrev = null;
                } else {
                    if(instancePrev){
                        var shape = mark[shapeMethod](instancePrev, instance).apply(toScreen);
                        processShape(shape, instancePrev);
                    }
    
                    instancePrev = instance;
                }
            }, this);
        } else {
            mark.eachSignumInstance(function(instance, toScreen){
                if(!instance.isBreak && instance.visible) {
                    var shape = mark[shapeMethod](instance).apply(toScreen);
                    processShape(shape, instance);
                }
            }, this);
        }
    },
    
    /* ANCHORS & ORIENTATION */
    
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
    
    leftBottomAnchor: {
        top:    "bottom",
        bottom: "bottom",
        left:   "left",
        right:  "left"
    },
    
    leftTopAnchor: {
        top:    "top",
        bottom: "top",
        left:   "left",
        right:  "left"
    },
    
    horizontalAlign: {
        top:    "right",
        bottom: "left",
        middle: "center",
        right:  "right",
        left:   "left",
        center: "center"
    },
    
    verticalAlign: {
        top:    "top",
        bottom: "bottom",
        middle: "middle",
        right:  "bottom",
        left:   "top",
        center: "middle"
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
    },

    oppositeLength: {
        width:  "height",
        height: "width"
    }
});

pvc.MultiChartPanel = pvc.BasePanel.extend({
    anchor: 'fill',
    
    /**
     * <p>
     * Implements small multiples chart layout.
     * Currently, it's essentially a flow-layout, 
     * from left to right and then top to bottom.
     * </p>
     * 
     * <p>
     * One small multiple chart is generated per unique combination 
     * of the values of the 'multiChart' visual role.
     * </p>
     * 
     * <p>
     * The option "multiChartMax" is the maximum number of small charts 
     * that can be layed out.
     * 
     * This can be useful if the chart's size cannot grow or 
     * if it cannot grow too much.
     * 
     * Pagination can be implemented with the use of this and 
     * the option 'multiChartPageIndex', to allow for effective printing of 
     * small multiple charts.
     * </p>
     * 
     * <p>
     * The option "multiChartPageIndex" is the desired page index.
     * This option requires that "multiChartMax" is also specified with
     * a finite and >= 1 value.
     * 
     * After a render is performed, 
     * the chart properties
     * {@link pvc.BaseChart#multiChartPageCount} and 
     * {@link pvc.BaseChart#multiChartPageIndex} will have been updated. 
     * </p>
     * 
     * <p>
     * The option 'multiChartMaxColumns' is the
     * maximum number of charts that can be layed  out in a row.
     * The default value is 3.
     * 
     * The value +Infinity can be specified, 
     * in which case there is no direct limit on the number of columns.
     * 
     * If the width of small charts does not fit in the available width 
     * then the chart's width is increased. 
     * </p>
     * <p>
     * The option 'multiChartWidth' can be specified to fix the width, 
     * of each small chart, in pixels or, in string "1%" format, 
     * as a percentage of the available width.
     * 
     * When not specified, but the option "multiChartMaxColumns" is specified and finite,
     * the width of the small charts is the available width divided
     * by the maximum number of charts in a row that <i>actually</i> occur
     * (so that if there are less small charts than 
     *  the maximum that can be placed on a row, 
     *  these, nevertheless, take up the whole width).
     * 
     * When both the options "multiChartWidth" and "multiChartMaxColumns" 
     * are unspecified, then the behavior is the same as if
     * the value "33%" had been specified for "multiChartWidth":
     * 3 charts will fit in the chart's initially specified width,
     * yet the chart's width can grow to accommodate for further small charts.
     * </p>
     * <p>
     * The option "multiChartSingleRowFillsHeight" affects the 
     * determination of the small charts height for the case where a single
     * row exists.
     * When the option is true, or unspecified, and a single row exists,
     * the height of the small charts will be all the available height,
     * looking similar to a non-multi-chart version of the same chart.
     *  When the option is false, 
     *  the determination of the small charts height does not depend
     *  on the number of rows, and proceeds as follows.
     * </p>
     * <p>
     * If the layout results in more than one row or 
     * when "multiChartSingleRowFillsHeight" is false,
     * the height of the small charts is determined using the option
     * 'multiChartAspectRatio', which is, by definition, width / height.
     * A typical aspect ratio value would be 5/4, 4/3 or the golden ratio (~1.62).
     * 
     * When the option is unspecified, 
     * a suitable value is determined,
     * using internal heuristic methods 
     * that generally depend on the concrete chart type
     * and specified options.
     * 
     * No effort is made to fill all the available height. 
     * The layout can result in two rows that occupy only half of the 
     * available height.
     * If the layout is such that the available height is exceeded, 
     * then the chart's height is increased.
     * </p>
     * <p>
     * The option 'multiChartMargins' can be specified to control the 
     * spacing between small charts.
     * The default value is "2%".
     * Margins are only applied between small charts: 
     * the outer margins of border charts are always 0.  
     * </p>
     * 
     * ** Orthogonal scroll bar on height/width overflow??
     * ** Legend vertical center on page height ?? Dynamic?
     * 
     * @override
     */
    _calcLayout: function(layoutInfo){
        var chart = this.chart;
        
        var multiChartRole = chart.visualRoles('multiChart');
        if(!multiChartRole.grouping){
            // Not assigned
            return;
        }
        
        var clientSize = layoutInfo.clientSize;
        var options = chart.options;
        
        // multiChartMax can be Infinity
        var multiChartMax = Number(options.multiChartMax);
        if(isNaN(multiChartMax) || multiChartMax < 1) {
            multiChartMax = Infinity;
        }
        
        // TODO - multi-chart pagination
//        var multiChartPageIndex;
//        if(isFinite(multiChartMax)) {
//            multiChartPageIndex = chart.multiChartPageIndex;
//            if(isNaN(multiChartPageIndex)){
//                multiChartPageIndex = null;
//            } else {
//                // The next page number
//                // Initially, the chart property must have -1 to start iterating.
//                multiChartPageIndex++;
//            }
//        }
        
        var data  = multiChartRole.flatten(chart.data, {visible: true});
        var leafCount = data._children.length;
        var count = Math.min(leafCount, multiChartMax);
        if(count === 0) {
            // Shows no message to the user.
            // An empty chart, like when all series were hidden through the legend.
            return;
        }
        
        // multiChartMaxColumns can be Infinity
        var multiChartMaxColumns = +options.multiChartMaxColumns; // to number
        if(isNaN(multiChartMaxColumns) || multiChartMax < 1) {
            multiChartMaxColumns = 3;
        }
        
        var colCount = Math.min(count, multiChartMaxColumns);
        // <Debug>
        /*jshint expr:true */
        colCount >= 1 && isFinite(colCount) || def.assert("Must be at least 1 and finite");
        // </Debug>
        
        var rowCount = Math.ceil(count / colCount);
        // <Debug>
        /*jshint expr:true */
        rowCount >= 1 || def.assert("Must be at least 1");
        // </Debug>
        
        var width = pvc.PercentValue.parse(options.multiChartWidth);
        if(width == null){
            var colsInAvailableWidth = isFinite(multiChartMaxColumns) ? colCount : 3;
            width = new pvc.PercentValue(1 / colsInAvailableWidth);
        }
        
        width = pvc.PercentValue.resolve(width, clientSize.width);

        var height;
        if((rowCount === 1 && def.get(options, 'multiChartSingleRowFillsHeight', true)) ||
           (colCount === 1 && def.get(options, 'multiChartSingleColFillsHeight', true))){
            // Use the initial client height
            var prevLayoutInfo = layoutInfo.previous;
            if(!prevLayoutInfo){
                height = clientSize.height;
            } else {
                height = prevLayoutInfo.height;
            }
        } else {
            // ar ::= width / height
            var ar = +options.multiChartAspectRatio; // + is to number
            if(isNaN(ar) || ar <= 0){
                 // Determine a suitable aspect ratio
                ar = this._calulateDefaultAspectRatio(width);
            }
            
            // If  multiChartMaxHeight is specified, the height of each chart cannot be bigger
            height = width / ar;
            
            var maxHeight = +def.get(options, 'multiChartMaxHeight'); // null -> 0
            if(!isNaN(maxHeight) && maxHeight > 0){
                height = Math.min(height, maxHeight);
            }
        }

        // ----------------------
        
        def.set(
           layoutInfo, 
            'data',  data,
            'count', count,
            'width',  width,
            'height', height,
            'colCount', colCount,
            'rowCount', rowCount);
        
        return {
            width:  width  * colCount,
            height: Math.max(clientSize.height, height * rowCount) // vertical align center: pass only: height * rowCount
        };
    },
    
    _calulateDefaultAspectRatio: function(totalWidth){
        if(this.chart instanceof pvc.PieChart){
            // 5/4 <=> 10/8 < 10/7 
            return 10/7;
        }
        
        // Cartesian, ...
        return 5/4;
        
        // TODO: this is not working well horizontal bar charts, for example
//        var chart = this.chart;
//        var options = chart.options;
//        var chromeHeight = 0;
//        var chromeWidth  = 0;
//        var defaultBaseSize  = 0.4;
//        var defaultOrthoSize = 0.2;
//        
//        // Try to estimate "chrome" of small chart
//        if(chart instanceof pvc.CartesianAbstract){
//            var isVertical = chart.isOrientationVertical();
//            var size;
//            if(options.showXScale){
//                size = parseFloat(options.xAxisSize || 
//                                  (isVertical ? options.baseAxisSize : options.orthoAxisSize) ||
//                                  options.axisSize);
//                if(isNaN(size)){
//                    size = totalWidth * (isVertical ? defaultBaseSize : defaultOrthoSize);
//                }
//                
//                chromeHeight += size;
//            }
//            
//            if(options.showYScale){
//                size = parseFloat(options.yAxisSize || 
//                                  (isVertical ? options.orthoAxisSize : options.baseAxisSize) ||
//                                  options.axisSize);
//                if(isNaN(size)){
//                    size = totalWidth * (isVertical ? defaultOrthoSize : defaultBaseSize);
//                }
//                
//                chromeWidth += size;
//            }
//        }
//        
//        var contentWidth  = Math.max(totalWidth - chromeWidth, 10);
//        var contentHeight = contentWidth / this._getDefaultContentAspectRatio();
//        
//        var totalHeight = chromeHeight + contentHeight;
//        
//        return totalWidth / totalHeight;
    },
    
//    _getDefaultContentAspectRatio: function(){
//        if(this.chart instanceof pvc.PieChart){
//            // 5/4 <=> 10/8 < 10/7 
//            return 10/7;
//        }
//        
//        // Cartesian
//        return 5/2;
//    },
    
    _createCore: function(li){
        if(!li.data){
            // Empty
            return;
        }
        
        var chart = this.chart;
        var options = chart.options;
        var smallChartMargins = options.multiChartMargins || 
                                new pvc.Sides(new pvc.PercentValue(0.02));
        
        // ----------------------
        // Create and layout small charts
        var ChildClass = chart.constructor;
        
        var lastColIndex = li.colCount - 1;
        var lastRowIndex = li.rowCount - 1;
        
        for(var index = 0 ; index < li.count ; index++) {
            var childData = li.data._children[index];
            
            var colIndex = (index % li.colCount);
            var rowIndex = Math.floor(index / li.colCount);
            
            var margins   = {};
            if(colIndex > 0){
                margins.left = smallChartMargins.left;
            }
            if(colIndex < lastColIndex){
                margins.right = smallChartMargins.right;
            }
            if(rowIndex > 0){
                margins.top = smallChartMargins.top;
            }
            if(rowIndex < lastRowIndex){
                margins.bottom = smallChartMargins.bottom;
            }
            
            var childOptions = def.create(options, {
                    parent:     chart,
                    title:      childData.absLabel,
                    legend:     false,
                    data:       childData,
                    width:      li.width,
                    height:     li.height,
                    left:       colIndex * li.width,
                    top:        rowIndex * li.height,
                    margins:    margins,
                    extensionPoints: {
                        // This lets the main bg color show through AND
                        // allows charts to overflow to other charts without that being covered
                        // Notably, axes values tend to overflow a little bit.
                        // Also setting to null, instead of transparent, for example
                        // allows the rubber band to set its "special transparent" color
                        base_fillStyle: null
                    }
                });
            
            var childChart = new ChildClass(childOptions);
            childChart._preRender();
        }
        
        this.base(li);
    }
});

pvc.TitlePanelAbstract = pvc.BasePanel.extend({

    pvLabel: null,
    anchor: 'top',

    title: null,
    titleSize: undefined,
    font: "12px sans-serif",
    
    defaultPaddings: 2,
    
    constructor: function(chart, parent, options){
        
        if(!options){
            options = {};
        }
        
        var anchor = options.anchor || this.anchor;
        
        // titleSize
        if(options.size == null){
            var size = options.titleSize;
            if(size != null){
                // Single size (a number or a string with only one number)
                // should be interpreted as meaning the orthogonal length.
                options.size = new pvc.Size()
                                      .setSize(size, {singleProp: this.anchorOrthoLength(anchor)});
            }
        }
        
        // titleSizeMax
        if(options.sizeMax == null){
            var sizeMax = options.titleSizeMax;
            if(sizeMax != null){
                // Single size (a number or a string with only one number)
                // should be interpreted as meaning the orthogonal length.
                options.sizeMax = new pvc.Size()
                                    .setSize(sizeMax, {singleProp: this.anchorOrthoLength(anchor)});
            }
        }
        
        if(options.paddings == null){
            options.paddings = this.defaultPaddings;
        }
        
        this.base(chart, parent, options);
        
        if(options.font === undefined){
            var extensionFont = this._getFontExtension();
            if(typeof extensionFont === 'string'){
                this.font = extensionFont;
            }
        }
    },
    
    _getFontExtension: function(){
        return this._getExtension('titleLabel', 'font');
    },
    
    /**
     * @override
     */
    _calcLayout: function(layoutInfo){
        var requestSize = new pvc.Size();
        
        // TODO: take textAngle, textMargin and textBaseline into account
        
        // Naming is for anchor = top
        var a = this.anchor;
        var a_width  = this.anchorLength(a);
        var a_height = this.anchorOrthoLength(a);
        
        var desiredWidth = layoutInfo.desiredClientSize[a_width];
        if(desiredWidth == null){
            desiredWidth = pvc.text.getTextLength(this.title, this.font) + 2; // Small factor to avoid cropping text on either side
        }
        
        var lines;
        var clientWidth = layoutInfo.clientSize[a_width];
        if(desiredWidth > clientWidth){
            desiredWidth = clientWidth;
            lines = pvc.text.justify(this.title, desiredWidth, this.font);
        } else {
            lines = this.title ? [this.title] : [];
        }
        
        // -------------
        
        var lineHeight = pvc.text.getTextHeight("m", this.font);
        var realHeight = lines.length * lineHeight;
        
        var desiredHeight = layoutInfo.desiredClientSize[a_height];
        if(desiredHeight == null){
            desiredHeight = realHeight;
        }
        
        var availableHeight = layoutInfo.clientSize[a_height];
        if(desiredHeight > availableHeight){
            // Don't show partial lines unless it is the only one left
            var maxLineCount = Math.max(1, Math.floor(availableHeight / lineHeight));
            if(lines.length > maxLineCount){
                var firstCroppedLine = lines[maxLineCount];  
                
                lines.length = maxLineCount;
                
                realHeight = desiredHeight = maxLineCount * lineHeight;
                
                var lastLine = lines[maxLineCount - 1] + " " + firstCroppedLine;
                
                lines[maxLineCount - 1] = pvc.text.trimToWidthB(desiredWidth, lastLine, this.font, "..");
            }
        }
        
        layoutInfo.lines = lines;
        layoutInfo.topOffset = (desiredHeight - realHeight) / 2;
        layoutInfo.lineSize = {
           width:  desiredWidth,
           height: lineHeight
        };
        
        layoutInfo.a_width   = a_width;
        layoutInfo.a_height  = a_height;
        
        requestSize[a_width]  = desiredWidth;
        requestSize[a_height] = desiredHeight;
        
        return requestSize;
    },
    
    /**
     * @override
     */
    _createCore: function(layoutInfo) {
        // Label
        var rotationByAnchor = {
            top: 0,
            right: Math.PI / 2,
            bottom: 0,
            left: -Math.PI / 2
        };
        
        var linePanel = this.pvPanel.add(pv.Panel)
            .data(layoutInfo.lines)
            [pvc.BasePanel.leftTopAnchor[this.anchor]](function(){
                return layoutInfo.topOffset + this.index * layoutInfo.lineSize.height;
            })
            [this.anchorOrtho(this.anchor)](0)
            [layoutInfo.a_height](layoutInfo.lineSize.height)
            [layoutInfo.a_width ](layoutInfo.lineSize.width );
        
        var textAlign = pvc.BasePanel.horizontalAlign[this.align];
        
        this.pvLabel = linePanel.add(pv.Label)
            .text(function(line){ return line; })
            .font(this.font)
            .textAlign(textAlign)
            .textBaseline('middle')
            .left  (function(){ return this.parent.width()  / 2; })
            .bottom(function(){ return this.parent.height() / 2; })
            .textAngle(rotationByAnchor[this.anchor]);

        // Maintained for v1 compatibility
        if (textAlign !== 'center') {
            if (this.isAnchorTopOrBottom()) {
                this.pvLabel
                    .left(null) // reset
                    [textAlign](0);

            } else if (this.anchor == "right") {
                if (textAlign == "left") {
                    this.pvLabel
                        .bottom(null)
                        .top(0);
                } else {
                    this.pvLabel
                        .bottom(0);
                }
            } else if (this.anchor == "left") {
                if (textAlign == "right") {
                    this.pvLabel
                        .bottom(null)
                        .top(0);
                } else {
                    this.pvLabel
                        .bottom(0);
                }
            }
        }
    },
    
    /**
     * @override
     */
    applyExtensions: function(){
        this.extend(this.pvPanel, 'title_');
        this.extend(this.pvLabel, 'titleLabel_');
    }
});
pvc.TitlePanel = pvc.TitlePanelAbstract.extend({

    font: "14px sans-serif",
    
    defaultPaddings: 4,
    
    constructor: function(chart, parent, options){
        
        if(!options){
            options = {};
        }
        
        var isV1Compat = chart.options.compatVersion <= 1;
        if(isV1Compat){
            var size = options.titleSize;
            if(size == null){
                options.titleSize = 25;
            }
        }
        
        this.base(chart, parent, options);
    }
});
/*
 * Legend panel. Generates the legend. Specific options are:
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
    pvRule:  null,
    pvDot:   null,
    pvLabel: null,
    
    anchor:  'bottom',
    
    pvLegendPanel: null,
    
    textMargin: 6,    // The space *between* the marker and the text, in pixels.
    padding:    2.5,  // Half the space *between* legend items, in pixels.
    markerSize: 15,   // *diameter* of marker *zone* (the marker itself may be a little smaller)
    font:  '10px sans-serif',
    
    constructor: function(chart, parent, options){
        if(!options){
            options = {};
        }
        
        var isV1Compat = chart.compatVersion() <= 1;
        if(isV1Compat){
            var anchor = options.anchor || this.anchor;
            var isVertical = anchor !== 'top' && anchor !== 'bottom';
            
            // Previously, an item had a height = to the item padding.
            // So, the item padding included padding + inner height...
            if(options.padding !== undefined){
                options.padding = Math.max(0, (options.padding - 16) / 2);
            } else {
                options.padding = 4;
            }
            
            // V1 minMarginX/Y were included in the size of the legend,
            // so these correspond to padding
            var minMarginX = Math.max(def.get(options, 'minMarginX', 8), 0);
            
            // V1 only implemented minMarginY for vertical and align = 'top'
            var minMarginY;
            if(isVertical && (options.align !== 'middle' && options.align !== 'bottom')){
                minMarginY = Math.max(def.get(options, 'minMarginY', 20) - 20, 0);
            } else {
                minMarginY = 0;
            }
            
            options.paddings = { left: minMarginX, top: minMarginY };
        }
        
        this.base(chart, parent, options);
    },

    /**
     * @override
     */
    _calcLayout: function(layoutInfo){
        return this._getBulletRootScene().layout(layoutInfo);
    },
    
    /**
     * @override
     */
    _createCore: function(layoutInfo) {
      var myself = this,
          clientSize = layoutInfo.clientSize,
          rootScene = this._getBulletRootScene(),
          padding   = rootScene.vars.padding,
          contentSize = rootScene.vars.size,
          sceneColorProp = function(scene){ return scene.color; };
      
       // Names are for horizontal layout (anchor = top or bottom)
      var isHorizontal = this.isAnchorTopOrBottom();
      var a_top    = isHorizontal ? 'top' : 'left';
      var a_bottom = this.anchorOpposite(a_top);    // top or bottom
      var a_width  = this.anchorLength(a_top);      // width or height
      var a_height = this.anchorOrthoLength(a_top); // height or width
      var a_center = isHorizontal ? 'center' : 'middle';
      var a_left   = isHorizontal ? 'left' : 'top';
      var a_right  = this.anchorOpposite(a_left);   // left or right
      
      // When V1 compat or size is fixed to less/more than content needs, 
      // it is still needed to align content inside
      
      // We align all rows left (or top), using the length of the widest row.
      // So "center" is a kind of centered-left align?
      
      var leftOffset = 0;
      switch(this.align){
          case a_right:
              leftOffset = clientSize[a_width] - contentSize.width;
              break;
              
          case a_center:
              leftOffset = (clientSize[a_width] - contentSize.width) / 2;
              break;
      }
      
      this.pvPanel.overflow("hidden");
      
      // ROW - A panel instance per row
      var pvLegendRowPanel = this.pvPanel.add(pv.Panel)
          .data(rootScene.vars.rows) // rows are "lists" of bullet item scenes
          [a_left  ](leftOffset)
          [a_top   ](function(){
              var prevRow = this.sibling(); 
              return prevRow ? (prevRow[a_top] + prevRow[a_height] + padding[a_height]) : 0;
          })
          [a_width ](function(row){ return row.size.width;  })
          [a_height](function(row){ return row.size.height; })
          ;
      
      // ROW > ITEM - A pvLegendPanel instance per bullet item in a row
      this.pvLegendPanel = pvLegendRowPanel.add(pv.Panel)
          .data(function(row){ return row.items; }) // each row has a list of bullet item scenes
          .def("hidden", "false")
          
          .localProperty('group', Object)
          .group(function(itemScene){ return itemScene.group; }) // for rubber band selection support
          
          .lock(a_right,  null)
          .lock(a_bottom, null)
          .lock(a_left, function(clientScene){
              var padding = clientScene.vars.padding;
              var prevItem = this.sibling();
              return prevItem ? 
                      (prevItem[a_left] + prevItem[a_width] + padding[a_width]) : 
                      0;
          })
          .lock('height', function(itemScene){ return itemScene.vars.clientSize.height; })
          
          .lock(a_top,
                  isHorizontal ?
                  // Center items in row's height, that may be higher
                  function(itemScene){
                      var vars = itemScene.vars;
                      return vars.row.size.height / 2 - vars.clientSize.height / 2;
                  } :
                  // Left align items of a same column
                  0)
          
          .lock('width',  
                  isHorizontal ?
                  function(itemScene){ return itemScene.vars.clientSize.width; } :
                  
                   // The biggest child width of the column
                  function(itemScene){
                      return this.parent.width();
                  })
          
          .fillStyle(function(){
              return this.hidden() == "true" ? 
                     "rgba(200,200,200,1)" : 
                     "rgba(200,200,200,0.0001)";
          })
          .cursor(function(itemScene){
              return itemScene.isClickable() ? "pointer" : null;
          })
          .event("click", function(itemScene){
              if(itemScene.isClickable()){
                  return itemScene.click();
              }
          })
          ;
      
      // ROW > ITEM > MARKER
      var pvLegendMarkerPanel = this.pvLegendPanel.add(pv.Panel)
          .left  (0)
          .top   (0)
          .right(null)
          .bottom(null)
          .width (function(itemScene){ return itemScene.vars.markerSize; })
          .height(function(itemScene){ return itemScene.vars.clientSize.height; })
          ;
      
      if(pvc.debug >= 20){
          pvLegendRowPanel.strokeStyle('red');
          this.pvLegendPanel.strokeStyle('green');
          pvLegendMarkerPanel.strokeStyle('blue');
      }
      
      /* RULE/MARKER */
      rootScene.childNodes.forEach(function(groupScene){
          var pvGroupPanel = pvLegendMarkerPanel.add(pv.Panel)
                  .visible(function(itemScene){ 
                      return itemScene.parent === groupScene; 
                  });
          
          var renderInfo = groupScene.renderer().create(this, pvGroupPanel);
          groupScene.renderInfo = renderInfo;
      }, this);

      /* LABEL */
      this.pvLabel = pvLegendMarkerPanel.anchor("right").add(pv.Label)
          .textAlign('left') // panel type anchors don't adjust textAlign this way 
          .text(function(itemScene){ return itemScene.vars.value.label; })
          .lock('textMargin', function(itemScene){ return itemScene.vars.textMargin - 4; }) // -3 is to compensate for now the label being anchored to the panel instead of the rule or the dot...
          .font(function(itemScene){ return itemScene.vars.font; }) // TODO: lock?
          .textDecoration(function(itemScene){ return itemScene.isOn() ? "" : "line-through"; })
          .intercept(
                'textStyle',
                labelTextStyleInterceptor,
                this._getExtension('legendLabel', 'textStyle'));
      
      function labelTextStyleInterceptor(getTextStyle, args) {
          var baseTextStyle = getTextStyle ? getTextStyle.apply(this, args) : "black";
          var itemScene = args[0];
          return itemScene.isOn() ? 
                      baseTextStyle : 
                      pvc.toGrayScale(baseTextStyle, null, undefined, 150);
      }
    },

    applyExtensions: function(){
        this.extend(this.pvPanel, "legendArea_");
        this.extend(this.pvLegendPanel,"legendPanel_");
        
        this._getBulletRootScene().childNodes.forEach(function(groupScene){
            groupScene.renderer().extendMarks(this, groupScene.renderInfo, groupScene.extensionPrefix);
        }, this);
        
        this.extend(this.pvLabel, "legendLabel_");
    },
    
    _getSignums: function(){
        // Catches both the marker and the label.
        // Also, if selection changes, renderInteractive re-renders these.
        return [this.pvLegendPanel];
    },
    
    _getBulletRootScene: function(){
        var rootScene = this._rootScene;
        if(!rootScene){
            /* The legend root scene contains all datums of its chart */
            rootScene = new pvc.visual.legend.BulletRootScene(null, {
                panel: this, 
                group: this.chart.data,
                horizontal: this.isAnchorTopOrBottom(),
                font:       this.font,
                markerSize: this.markerSize,
                textMargin: this.textMargin, 
                padding:    this.padding
            });
            
            this._rootScene = rootScene;
        }
        
        return rootScene;
    }
});
/**
 * TimeseriesAbstract is the base class for all categorical or timeseries
 */
pvc.TimeseriesAbstract = pvc.BaseChart.extend({

    allTimeseriesPanel : null,

    _preRenderContent: function(contentOptions){

        // Do we have the timeseries panel? add it
        if (this.options.showAllTimeseries){
            this.allTimeseriesPanel = new pvc.AllTimeseriesPanel(this, this.basePanel, {
                anchor: this.options.allTimeseriesPosition,
                allTimeseriesSize: this.options.allTimeseriesSize
            });
        }
    },
    
    defaults: def.create(pvc.BaseChart.prototype.defaults, {
        showAllTimeseries: true,
        allTimeseriesPosition: "bottom",
        allTimeseriesSize: 50
    })
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

    pvAllTimeseriesPanel: null,
    anchor: "bottom",
    allTimeseriesSize: 50,

    /**
     * @override
     */
    _calcLayout: function(layoutInfo){
        return this.createAnchoredSize(this.allTimeseriesSize, layoutInfo.clientSize);
    },
    
    /**
     * @override
     */
    applyExtensions: function(){
        this.base();

        // Extend panel
        this.extend(this.pvPanel, "allTimeseries_");
    }
});
/**
 * CartesianAbstract is the base class for all 2D cartesian space charts.
 */
pvc.CartesianAbstract = pvc.TimeseriesAbstract.extend({
    _gridDockPanel: null,
    
    axesPanels: null, 
    
    yAxisPanel: null,
    xAxisPanel: null,
    secondXAxisPanel: null,
    secondYAxisPanel: null,
    
    _mainContentPanel: null,

    yScale: null,
    xScale: null,
   
    _visibleDataCache: null,
    
    constructor: function(options){
        
        this.axesPanels = {};
        
        this.base(options);
    },
    
    _getSeriesRoleSpec: function(){
        return { isRequired: true, defaultDimensionName: 'series*', autoCreateDimension: true };
    },

    _initData: function(){
        // Clear data related cache
        if(this._visibleDataCache) {
            delete this._visibleDataCache;
        }
        
        this.base.apply(this, arguments);
    },
    
    _initAxes: function(hasMultiRole){
        
        this.base(hasMultiRole);
        
        if(!hasMultiRole || this.parent){
            /* Create axes */
            this._createAxis('base', 0);
            this._createAxis('ortho', 0);
            if(this.options.secondAxis){
                this._createAxis('ortho', 1);
            }
        }
    },
    
    _preRenderContent: function(contentOptions){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in CartesianAbstract");
        }
        
        var options = this.options;
        var axes = this.axes;
        
        var baseAxis = axes.base;
        var orthoAxis = axes.ortho;
        var ortho2Axis = axes.ortho2;
        
        /* Create the grid/docking panel */
        this._gridDockPanel = new pvc.CartesianGridDockingPanel(this, this.basePanel, contentOptions);
        
        /* Create child axis panels
         * The order is relevant because of docking order. 
         */
        if(ortho2Axis) {
            this._createAxisPanel(ortho2Axis);
        }
        this._createAxisPanel(baseAxis );
        this._createAxisPanel(orthoAxis);
        
        /* Create main content panel */
        this._mainContentPanel = this._createMainContentPanel(this._gridDockPanel);
        
        /* Force layout */
        this.basePanel.layout();
        
        /* Set scale ranges, after layout */
        this._setAxisScaleRange(baseAxis );
        this._setAxisScaleRange(orthoAxis);
        if(ortho2Axis){
            this._setAxisScaleRange(ortho2Axis);
        }
    },
    
    /**
     * Creates a cartesian axis.
     */
    _createAxisCore: function(axisType, axisIndex, dataCells){
        switch(axisType){
            case 'base':
            case 'ortho':
                var axis = new pvc.visual.CartesianAxis(this, axisType, axisIndex, dataCells);
                this.axes[axis.orientedId] = axis;
                this._createAxisScale(axis);
                return axis;
        }
        
        return this.base(axisType, axisIndex, dataCells);
    },
    
    /**
     * Creates an axis panel, if it is visible.
     * @param {pvc.visual.CartesianAxis} axis The cartesian axis.
     * @type pvc.AxisPanel
     */
    _createAxisPanel: function(axis){
        if(axis.isVisible) {
            var titlePanel;
            var title = axis.option('Title');
            if (!def.empty(title)) {
                titlePanel = new pvc.AxisTitlePanel(this, this._gridDockPanel, {
                    title:        title,
                    font:         axis.option('TitleFont') || axis.option('Font'),
                    anchor:       axis.option('Position'),
                    align:        axis.option('TitleAlign'),
                    margins:      axis.option('TitleMargins'),
                    paddings:     axis.option('TitlePaddings'),
                    titleSize:    axis.option('TitleSize'),
                    titleSizeMax: axis.option('TitleSizeMax')
                });
            }
            
            var panel = pvc.AxisPanel.create(this, this._gridDockPanel, axis, {
                useCompositeAxis:  axis.option('Composite'),
                font:              axis.option('Font'),
                anchor:            axis.option('Position'),
                axisSize:          axis.option('Size'),
                axisSizeMax:       axis.option('SizeMax'),
                labelSpacingMin:   axis.option('LabelSpacingMin'),
                tickExponentMin:   axis.option('TickExponentMin'),
                tickExponentMax:   axis.option('TickExponentMax'),
                fullGrid:          axis.option('FullGrid'),
                fullGridCrossesMargin: axis.option('FullGridCrossesMargin'),
                ruleCrossesMargin: axis.option('RuleCrossesMargin'),
                zeroLine:          axis.option('ZeroLine'),
                domainRoundMode:   axis.option('DomainRoundMode'),
                desiredTickCount:  axis.option('DesiredTickCount'),
                minorTicks:        axis.option('MinorTicks'),
                clickAction:       axis.option('ClickAction'),
                doubleClickAction: axis.option('DoubleClickAction')
            });
            
            if(titlePanel){
                titlePanel.panelName = panel.panelName;
                panel.titlePanel = titlePanel;
            }
            
            this.axesPanels[axis.id] = panel;
            this.axesPanels[axis.orientedId] = panel;
            
            // V1 fields
            if(axis.index <= 1) {
                this[axis.orientedId + 'AxisPanel'] = panel;
            }
            
            return panel;
        }
    },

    /* @abstract */
    _createMainContentPanel: function(parentPanel){
        throw def.error.notImplemented();
    },
    
    /**
     * Creates a scale for a given axis, with domain applied, but no range yet,
     * assigns it to the axis and assigns the scale to special v1 chart instance fields.
     * 
     * @param {pvc.visual.CartesianAxis} axis The axis.
     * @type pv.Scale
     */
    _createAxisScale: function(axis){
        var isSecondOrtho = axis.index === 1 && axis.type === 'ortho';
        
        var scale;

        if(isSecondOrtho && !this.options.secondAxisIndependentScale){
            scale = this.axes.ortho.scale || 
                    def.fail.operationInvalid("First ortho scale must be created first.");
        } else {
            scale = this._createScaleByAxis(axis);
            
            if(scale.isNull && pvc.debug >= 3){
                pvc.log(def.format("{0} scale for axis '{1}'- no data", [axis.scaleType, axis.id]));
            }
        }
        
        axis.setScale(scale);
        
        /* V1 fields xScale, yScale, secondScale */
        if(isSecondOrtho) {
            this.secondScale = scale;
        } else if(!axis.index) {
            this[axis.orientation + 'Scale'] = scale;
        }
        
        return scale;
    },
    
    /**
     * Creates a scale for a given axis.
     * 
     * @param {pvc.visual.CartesianAxis} axis The axis.
     * @type pv.Scale
     */
    _createScaleByAxis: function(axis){
        var createScale = this['_create' + axis.scaleType + 'ScaleByAxis'];
        
        return createScale.call(this, axis);
    },

    /**
     * Creates a discrete scale for a given axis.
     * <p>
     * Uses the chart's <tt>panelSizeRatio</tt> to calculate the band.
     * </p>
     * 
     * @param {pvc.visual.CartesianAxis} axis The axis.
     * @virtual
     * @type pv.Scale
     */
    _createDiscreteScaleByAxis: function(axis){
        /* DOMAIN */

        // With composite axis, only 'singleLevel' flattening works well
        var flatteningMode = null; //axis.option('Composite') ? 'singleLevel' : null,
        var baseData = this._getVisibleData(axis.dataCell.dataPartValues, {ignoreNulls: false});
        var data = axis.role.flatten(baseData, {
                                visible: true,
                                flatteningMode: flatteningMode
                            });
        
        var scale  = new pv.Scale.ordinal();
        if(!data.count()){
            scale.isNull = true;
        } else {
            var values = data.children()
                             .select(function(child){ return child.value; })
                             .array();
            
            scale.domain(values);
        }
        
        return scale;
    },
    
    /**
     * Creates a continuous time-series scale for a given axis.
     * 
     * <p>
     * Uses the axis' option <tt>Offset</tt> to calculate excess domain margins at each end of the scale.
     * </p>
     * <p>
     * Also takes into account the specified axis' options 
     * <tt>DomainRoundMode</tt> and <tt>DesiredTickCount</tt>.
     * </p>
     * 
     * @param {pvc.visual.CartesianAxis} axis The axis.
     * @virtual
     * @type pv.Scale
     */
    _createTimeseriesScaleByAxis: function(axis){
        /* DOMAIN */
        var extent = this._getVisibleValueExtent(axis); // null when no data...
        
        var scale = new pv.Scale.linear();
        if(!extent){
            scale.isNull = true;
        } else {
            var dMin = extent.min;
            var dMax = extent.max;

            if((dMax - dMin) === 0) {
                dMax = new Date(dMax.getTime() + 3600000); // 1 h
            }
        
            scale.domain(dMin, dMax);
        }
        
        return scale;
    },

    /**
     * Creates a continuous scale for a given axis.
     *
     * <p>
     * Uses the axis' option <tt>Offset</tt> to calculate excess domain margins at each end of the scale.
     * </p>
     * <p>
     * Also takes into account the specified axis' options
     * <tt>DomainRoundMode</tt> and <tt>DesiredTickCount</tt>.
     * </p>
     *
     * @param {pvc.visual.CartesianAxis} axis The axis.
     * @virtual
     * @type pv.Scale
     */
    _createContinuousScaleByAxis: function(axis){
        /* DOMAIN */
        var extent = this._getVisibleValueExtentConstrained(axis);
        
        var scale = new pv.Scale.linear();
        if(!extent){
            scale.isNull = true;
        } else {
            var dMin = extent.min;
            var dMax = extent.max;
    
            /*
             * If both negative or both positive
             * the scale does not contain the number 0.
             *
             * Currently this option ignores locks. Is this all right?
             */
            var originIsZero = axis.option('OriginIsZero');
            if(originIsZero && (dMin * dMax > 0)){
                if(dMin > 0){
                    dMin = 0;
                    extent.minLocked = true;
                } else {
                    dMax = 0;
                    extent.maxLocked = true;
                }
            }
    
            /*
             * If the bounds (still) are the same, things break,
             * so we add a wee bit of variation.
             *
             * This one must ignore locks.
             */
            if (dMin === dMax) {
                dMin = dMin !== 0 ? dMin * 0.99 : originIsZero ? 0 : -0.1;
                dMax = dMax !== 0 ? dMax * 1.01 : 0.1;
            } else if(dMin > dMax){
                // What the heck...
                // Is this ok or should throw?
                var bound = dMin;
                dMin = dMax;
                dMax = bound;
            }
            
            scale.domain(dMin, dMax);
        }
        
        return scale;
    },
    
    _setAxisScaleRange: function(axis){
        var info = this._mainContentPanel._layoutInfo;
        
        var size = (axis.orientation === 'x') ?
                   info.clientSize.width :
                   info.clientSize.height;
        
        axis.setScaleRange(size);

        return axis.scale;
    },
    
    _getAxesRoundingPaddings: function(){
        var axesPaddings = {};
        
        var axes  = this.axes;
        processAxis(axes.x);
        processAxis(axes.secondX);
        processAxis(axes.y);
        processAxis(axes.secondY);
        
        return axesPaddings;
        
        function setSide(side, pct){
            var value = axesPaddings[side];
            if(value == null || pct > value){
                axesPaddings[side] = pct;
            }
        }
        
        function processAxis(axis){
            if(axis){
                // {begin: , end: }
                var roundingPaddings = axis.getScaleRoundingPaddings();
                if(roundingPaddings){
                    if(axis.orientation === 'x'){
                        setSide('left',  roundingPaddings.begin);
                        setSide('right', roundingPaddings.end);
                    } else {
                        setSide('bottom', roundingPaddings.begin);
                        setSide('top',    roundingPaddings.end);
                    }
                }
            }
        }
    },
    
    /*
     * Obtains the chart's visible data
     * grouped according to the charts "main grouping".
     * 
     * @param {string|string[]} [dataPartValues=null] The desired data part value or values.
     * @param {object} [keyArgs=null] Optional keyword arguments object.
     * @param {boolean} [keyArgs.ignoreNulls=true] Indicates that null datums should be ignored.
     * 
     * @type pvc.data.Data
     */
    _getVisibleData: function(dataPartValues, keyArgs){
        var ignoreNulls = def.get(keyArgs, 'ignoreNulls', true);
        if(ignoreNulls){
            // If already globally ignoring nulls, there's no need to do it explicitly anywhere
            ignoreNulls = !this.options.ignoreNulls;
        }
        
        var key = ignoreNulls + '|' + (dataPartValues || ''), // relying on Array.toString
            data = def.getOwn(this._visibleDataCache, key);
        if(!data) {
            data = this._createVisibleData(dataPartValues, ignoreNulls);
            
            (this._visibleDataCache || (this._visibleDataCache = {}))
                [key] = data;
        }
        
        return data;
    },

    /*
     * Creates the chart's visible data
     * grouped according to the charts "main grouping".
     *
     * <p>
     * The default implementation groups data by series visual role.
     * </p>
     *
     * @param {string|string[]} [dataPartValues=null] The desired data part value or values.
     *
     * @type pvc.data.Data
     * @protected
     * @virtual
     */
    _createVisibleData: function(dataPartValues, ignoreNulls){
        var partData = this.partData(dataPartValues);
        return this._serRole && this._serRole.grouping ?
                   this._serRole.flatten(partData, {visible: true, isNull: ignoreNulls ? false : null}) :
                   partData;
    },
    
    _assertSingleContinuousValueRole: function(valueRole){
        if(!valueRole.grouping.isSingleDimension) {
            pvc.log("[WARNING] A linear scale can only be obtained for a single dimension role.");
        }
        
        if(valueRole.grouping.isDiscrete()) {
            pvc.log("[WARNING] The single dimension of role '{0}' should be continuous.", [valueRole.name]);
        }
    },
    
    /**
     * Gets the extent of the values of the specified axis' roles
     * over all datums of the visible data.
     * 
     * @param {pvc.visual.CartesianAxis} valueAxis The value axis.
     * @type object
     *
     * @protected
     * @virtual
     */
    _getVisibleValueExtent: function(valueAxis){
        var dataCells = valueAxis.dataCells;
        if(dataCells.length === 1){
            // Most common case is faster
            return this._getVisibleRoleValueExtent(valueAxis, dataCells[0]);
        }

        return def.query(dataCells)
                .select(function(dataCell){
                    return this._getVisibleRoleValueExtent(valueAxis, dataCell);
                }, this)
                .reduce(this._unionReduceExtent, null);
    },

    /**
     * Could/Should be static
     */
    _unionReduceExtent: function(result, range){
        if(!result) {
            if(!range){
                return null;
            }

            result = {min: range.min, max: range.max};
        } else if(range){
            if(range.min < result.min){
                result.min = range.min;
            }

            if(range.max > result.max){
                result.max = range.max;
            }
        }

        return result;
    },

    /**
     * Gets the extent of the values of the specified role
     * over all datums of the visible data.
     *
     * @param {pvc.visual.CartesianAxis} valueAxis The value axis.
     * @param {pvc.visual.Role} valueDataCell The data cell.
     * @type object
     *
     * @protected
     * @virtual
     */
    _getVisibleRoleValueExtent: function(valueAxis, valueDataCell){
        var valueRole = valueDataCell.role;
        var dataPartValues = valueDataCell.dataPartValues;
        
        this._assertSingleContinuousValueRole(valueRole);

        if(valueRole.name === 'series') {
            /* not supported/implemented? */
            throw def.error.notImplemented();
        }

        var valueDimName = valueRole.firstDimensionName();
        var extent = this._getVisibleData(dataPartValues).dimensions(valueDimName).extent();
        return extent ? {min: extent.min.value, max: extent.max.value} : undefined;
    },
    
    /**
     * @virtual
     */
    _getVisibleValueExtentConstrained: function(axis, min, max){
        var extent = {
                minLocked: false,
                maxLocked: false
            };
        
        if(min == null) {
            min = axis.option('FixedMin');
            if(min != null){
                extent.minLocked = true;
            }
        }
        
        if(max == null) {
            max = axis.option('FixedMax');
            if(max != null){
                extent.maxLocked = true;
            }
        }
        
        if(min == null || max == null) {
            var baseExtent = this._getVisibleValueExtent(axis); // null when no data
            if(!baseExtent){
                return null;
            }
            
            if(min == null){
                min = baseExtent.min;
            }
            
            if(max == null){
                max = baseExtent.max;
            }
        }
        
        extent.min = min;
        extent.max = max;
        
        return extent;
    },
    
    defaults: def.create(pvc.TimeseriesAbstract.prototype.defaults, {
        showAllTimeseries: false,
    
        /* Percentage of occupied space over total space in a discrete axis band */
        panelSizeRatio: 0.9,

        // Indicates that the *base* axis is a timeseries
        timeSeries: false,
        timeSeriesFormat: "%Y-%m-%d",
        
//        originIsZero:  undefined,
//        
//        orthoFixedMin: undefined,
//        orthoFixedMax: undefined,

        useCompositeAxis: false,
        
        // Show a frame around the plot area
//        showPlotFrame: undefined,
        
        /* Non-standard axes options and defaults */
        showXScale: true,
        showYScale: true,
        
        xAxisPosition: "bottom",
        yAxisPosition: "left",

        secondAxisIndependentScale: false,
        secondAxisColor: "blue"
    })
});

pvc.GridDockingPanel = pvc.BasePanel.extend({
    anchor: 'fill',
    
    /**
     * Implements a docking/grid layout variant.
     * <p>
     * The layout contains 5 target positions: top, bottom, left, right and center.
     * These are mapped to a 3x3 grid. The corner cells always remain empty.
     * In the center cell, panels are superimposed.
     * </p>
     * <p>
     * Additionally, panels' paddings are shared:
     * Left and right paddings are shared by the top, center and bottom panels.
     * Top and bottom paddings are shared by the left, center and right panels.
     * </p>
     * <p>
     * Child panel's can inform of existing overflowPaddings - 
     * resulting of things that are ok to overflow, 
     * as long as they don't leave the parent panel's space, 
     * and that the parent panel itself tries to reserve space for it or 
     * ensure it is in a free area.
     * </p>
     * <p>
     * The empty corner cells of the grid layout can absorb some of the overflow 
     * content from non-fill child panels. 
     * If, for example, a child panel is placed at the 'left' cell and it
     * overflows in 'top', that overflow can be partly absorbed by 
     * the top-left corner cell, as long as there's a panel in the top cell that
     * imposes that much height. 
     * </p>
     * <p>
     * If the corner space is not enough to absorb the overflow paddings
     * 
     * </p>
     * 
     * @override
     */
    _calcLayout: function(layoutInfo){
        
        if(!this._children) {
            return;
        }
        
        // Objects we can mutate
        var margins  = new pvc.Sides(0);
        var paddings = new pvc.Sides(0);
        var remSize = def.copyOwn(layoutInfo.clientSize);
        var overFlowPaddings;
        var aolMap = pvc.BasePanel.orthogonalLength;
        var aoMap  = pvc.BasePanel.relativeAnchor;
        var alMap  = pvc.BasePanel.parallelLength;
        
        var childKeyArgs = {
                force: true,
                referenceSize: layoutInfo.clientSize
            };
        
        var fillChildren = [];
        var sideChildren = [];
        
        // loop detection
        var paddingHistory = {}; 
        var loopSignal = {};
        var overflowPaddingsSignal = {};
        var isDisasterRecovery = false;
        
        
        // PHASE 0 - Initialization
        //
        // Splits children in two groups: FILL and SIDE, according to its anchor.
        // Children explicitly not requiring layout are excluded (!child.anchor).
        //
        // For FILL children, finds the maximum of the resolved paddings.
        // These paddings will be the minimum that will result from this layout.
        this._children.forEach(initChild);
        
        // PHASE 1 - MARGINS are imposed by SIDE children
        //
        // Lays out non-fill children receiving each, the remaining space as clientSize.
        //
        // Each adds its orthogonal length to the margin side where it is anchored.
        // The normal length is only correctly known after all non-fill
        // children have been layed out once.
        // 
        // As such the child is only positioned on the anchor coordinate.
        // The orthogonal anchor coordinate is only set on the second phase.
        // 
        // SIDE children may change paddings as well.
        sideChildren.forEach(layoutChild1Side);
        
        // -> remSize now contains the size of the CENTER cell and is not changed any more
        
        // PHASE 2 - Relayout each SIDE child with its final orthogonal length
        // PHASE 3 - Layout FILL children
        // 
        // Repeat 2 and 3 while paddings changed
        
        doMaxTimes(9, layoutCycle);
        
        layoutInfo.gridMargins  = new pvc.Sides(margins );
        layoutInfo.gridPaddings = new pvc.Sides(paddings);
        layoutInfo.gridSize     = new pvc.Size(remSize  );
        
        // All available client space is consumed.
        // As such, there's no need to return anything.
        // return;
        
        // --------
        
        function layoutCycle(remTimes, iteration){
            if(pvc.debug >= 5){
                pvc.log("\n[GridDockingPanel] ==== LayoutCycle " + (isDisasterRecovery ? "Disaster MODE" : ("#" + (iteration + 1))));
            }
            
            var index, count;
            var canChange = layoutInfo.canChange !== false && !isDisasterRecovery && (remTimes > 0);
            var paddingsChanged;
            var ownPaddingsChanged = false;
            
            index = 0;
            count = sideChildren.length;
            while(index < count){
                if(pvc.debug >= 5){
                    pvc.log("[GridDockingPanel] SIDE Child i=" + index);
                }
                
                paddingsChanged = layoutChild2Side(sideChildren[index], canChange);
                if(!isDisasterRecovery && paddingsChanged){
                    if(paddingsChanged === loopSignal){
                        // Oh no...
                        isDisasterRecovery = true;
                        layoutCycle(0);
                        return false; // stop;
                    }
                    
                    if(paddingsChanged === overflowPaddingsSignal){
                        // Don't stop right away cause there might be other overflow paddings requests
                        // of other side childs
                        if(!ownPaddingsChanged){
                            ownPaddingsChanged = true;
                            layoutInfo.requestPaddings = layoutInfo.paddings; 
                        }
                    } else {
                        if(remTimes > 0){
                            if(pvc.debug >= 5){
                                pvc.log("[GridDockingPanel] SIDE Child i=" + index + " increased paddings");
                            }
                            return true; // repeat
                        } else if(pvc.debug >= 2){
                            pvc.log("[Warning] [GridDockingPanel] SIDE Child i=" + index + " increased paddings but no more iterations possible.");
                        }
                    }
                }
                index++;
            }
            
            if(ownPaddingsChanged){
                if(pvc.debug >= 5){
                    pvc.log("[GridDockingPanel] Restarting due to overflowPaddings change");
                }
                return false; // stop;
            }
            
            index = 0;
            count = fillChildren.length;
            while(index < count){
                if(pvc.debug >= 5){
                    pvc.log("[GridDockingPanel] FILL Child i=" + index);
                }
                
                paddingsChanged = layoutChildFill(fillChildren[index], canChange);
                if(!isDisasterRecovery && paddingsChanged){
                    if(paddingsChanged === loopSignal){
                        // Oh no...
                        isDisasterRecovery = true;
                        layoutCycle(0);
                        return false; // stop;
                    }
                    
                    if(remTimes > 0){
                        if(pvc.debug >= 5){
                            pvc.log("[GridDockingPanel] FILL Child i=" + index + " increased paddings");
                        }
                        return true; // repeat
                    } else if(pvc.debug >= 2){
                        pvc.log("[Warning] [GridDockingPanel] FILL Child i=" + index + " increased paddings but no more iterations possible.");
                    }
                }
                index++;
            }
            
            return false; // stop
        }
        
        function doMaxTimes(maxTimes, fun){
            var index = 0;
            while(maxTimes--){
                // remTimes = maxTimes
                if(fun(maxTimes, index) === false){
                    return true;
                }
                index++;
            }
            
            return false;
        }
        
        function initChild(child) {
            var a = child.anchor;
            if(a){
                if(a === 'fill') {
                    fillChildren.push(child);
                    
                    var childPaddings = child.paddings.resolve(childKeyArgs.referenceSize);
                    
                    // After the op. it's not a pvc.Side anymore, just an object with same named properties.
                    paddings = pvc.Sides.resolvedMax(paddings, childPaddings);
                } else {
                    /*jshint expr:true */
                    def.hasOwn(aoMap, a) || def.fail.operationInvalid("Unknown anchor value '{0}'", [a]);
                    
                    sideChildren.push(child);
                }
            }
        }
        
        function layoutChild1Side(child) {
            var paddingsChanged = false;
            
            var a = child.anchor;
            
            childKeyArgs.paddings = filterAnchorPaddings(a, paddings);
            
            child.layout(new pvc.Size(remSize), childKeyArgs);
            
            if(child.isVisible){
                
                paddingsChanged = checkAnchorPaddingsChanged(a, paddings, child);

                // Only set the *anchor* position
                // The other orthogonal position is dependent on the size of the other non-fill children
                positionChildNormal(a, child);
                
                updateSide(a, child);
            }
            
            return paddingsChanged;
        }
        
        function layoutChildFill(child, canChange) {
            var paddingsChanged = false;
            
            var a = child.anchor; // 'fill'
            
            childKeyArgs.paddings  = filterAnchorPaddings(a, paddings);
            childKeyArgs.canChange = canChange;
            
            child.layout(new pvc.Size(remSize), childKeyArgs);
            
            if(child.isVisible){
                paddingsChanged = checkAnchorPaddingsChanged(a, paddings, child, canChange);
                
                positionChildNormal(a, child);
                positionChildOrtho (child, a);
            }
            
            return paddingsChanged;
        }
        
        function layoutChild2Side(child, canChange) {
            var paddingsChanged = false;
            if(child.isVisible){
                var a = child.anchor;
                var al  = alMap[a];
                var aol = aolMap[a];
                var length  = remSize[al];
                var olength = child[aol];
                
                var childSize2 = new pvc.Size(def.set({}, al, length, aol, olength));
                
                childKeyArgs.paddings = filterAnchorPaddings(a, paddings);
                childKeyArgs.canChange = canChange;
                
                child.layout(childSize2, childKeyArgs);
                
                if(child.isVisible){
                    paddingsChanged = checkAnchorPaddingsChanged(a, paddings, child, canChange);
                    
                    if(checkOverflowPaddingsChanged(a, layoutInfo.paddings, child, canChange)){
                        return overflowPaddingsSignal;
                    }
                        
                    positionChildOrtho(child, child.align);
                }
            }
            
            return paddingsChanged;
        }
        
        function positionChildNormal(side, child) {
            var sidePos;
            if(side === 'fill'){
                side = 'left';
                sidePos = margins.left + remSize.width / 2 - (child.width / 2);
            } else {
                sidePos = margins[side];
            }
            
            child.setPosition(def.set({}, side, sidePos));
        }
        
        // Decreases available size and increases margins
        function updateSide(side, child) {
            var sideol = aolMap[side],
                olen   = child[sideol];
            
            margins[side]   += olen;
            remSize[sideol] -= olen;
        }
        
        function positionChildOrtho(child, align) {
            var sideo;
            if(align === 'fill'){
                align = 'middle';
            }
            
            var sideOPos;
            switch(align){
                case 'top':
                case 'bottom':
                case 'left':
                case 'right':
                    sideo = align;
                    sideOPos = margins[sideo];
                    break;
                
                case 'middle':
                    sideo    = 'bottom';
                    sideOPos = margins.bottom + (remSize.height / 2) - (child.height / 2);
                    break;
                    
                case 'center':
                    sideo    = 'left';
                    sideOPos = margins.left + remSize.width / 2 - (child.width / 2);
                    break;
            }
            
            child.setPosition(def.set({}, sideo, sideOPos));
        }
        
        function filterAnchorPaddings(a, paddings){
            var filtered = new pvc.Sides();
            
            getAnchorPaddingsNames(a).forEach(function(side){
                filtered.set(side, paddings[side]);
            });
            
            return filtered;
        }
        
        function checkAnchorPaddingsChanged(a, paddings, child, canChange){
            var newPaddings = child._layoutInfo.requestPaddings;
            
            var changed = false;
            if(newPaddings){
                if(pvc.debug >= 10){
                    pvc.log("[GridDockingPanel] => clientSize=" + JSON.stringify(child._layoutInfo.clientSize));
                    pvc.log("[GridDockingPanel] <= requestPaddings=" + JSON.stringify(newPaddings));
                }
                
                getAnchorPaddingsNames(a).forEach(function(side){
                    if(newPaddings.hasOwnProperty(side)){
                        var value    = paddings[side] || 0;
                        var newValue = Math.floor(10000 * (newPaddings[side] || 0)) / 10000;
                        var increase = newValue - value;
                        
                        // STABILITY requirement
                        if(increase !== 0 && Math.abs(increase) >= Math.abs(0.01 * value)){
                            if(!canChange){
                                if(pvc.debug >= 2){
                                    pvc.log("[Warning] [GridDockingPanel] CANNOT change but child wanted to: " + side + "=" + newValue);
                                }
                            } else {
                                changed = true;
                                paddings[side] = newValue;
                                
                                if(pvc.debug >= 5){
                                    pvc.log("[Warning] [GridDockingPanel]   changed padding " + side + " <- " + newValue);
                                }
                            }
                        }
                    }
                });
                
                if(changed){
                    var paddingKey = pvc.Sides
                                        .names
                                        .map(function(side){ return (paddings[side] || 0).toFixed(3); })
                                        .join('|');
                    
                    if(def.hasOwn(paddingHistory, paddingKey)){
                        // LOOP detected
                        if(pvc.debug >= 2){
                            pvc.log("[GridDockingPanel] LOOP detected");
                        }
                        changed = loopSignal;
                    } else {
                        paddingHistory[paddingKey] = true;
                    }
                    
                    paddings.width  = paddings.left + paddings.right ;
                    paddings.height = paddings.top  + paddings.bottom;
                }
            }
            
            return changed;
        }
        
        function checkOverflowPaddingsChanged(a, ownPaddings, child, canChange){
            var overflowPaddings = child._layoutInfo.overflowPaddings;
            
            var changed = false;
            if(overflowPaddings){
                if(pvc.debug >= 10){
                    pvc.log("[GridDockingPanel] <= overflowPaddings=" + JSON.stringify(overflowPaddings));
                }
                
                getAnchorPaddingsNames(a).forEach(function(side){
                    if(overflowPaddings.hasOwnProperty(side)){
                        var value    = ownPaddings[side] || 0;
                        var newValue = Math.floor(10000 * (overflowPaddings[side] || 0)) / 10000;
                        newValue -= margins[side]; // corners absorb some of it
                        
                        var increase = newValue - value;
                        
                        // STABILITY & SPEED requirement
                        if(increase > Math.abs(0.05 * value)){
                            if(!canChange){
                                if(pvc.debug >= 2){
                                    pvc.log("[Warning] [GridDockingPanel] CANNOT change overflow  padding but child wanted to: " + side + "=" + newValue);
                                }
                            } else {
                                changed = true;
                                ownPaddings[side] = newValue;
                                
                                if(pvc.debug >= 5){
                                    pvc.log("[GridDockingPanel]   changed overflow padding " + side + " <- " + newValue);
                                }
                            }
                        }
                    }
                });
                
                if(changed){
                    ownPaddings.width  = ownPaddings.left + ownPaddings.right ;
                    ownPaddings.height = ownPaddings.top  + ownPaddings.bottom;
                }
            }
            
            return changed;
        }
        
        function getAnchorPaddingsNames(a){
            switch(a){
                case 'left':
                case 'right':  return pvc.Sides.vnames;
                case 'top':
                case 'bottom': return pvc.Sides.hnames;
                case 'fill':   return pvc.Sides.names;
            }
        }

    }
});

pvc.CartesianGridDockingPanel = pvc.GridDockingPanel.extend({
    /**
     * @override
     */
    applyExtensions: function(){
        this.base();

        // Extend body
        this.extend(this.pvPanel,    "content_");
        this.extend(this.xGridRule,  "xAxisGrid_");
        this.extend(this.yGridRule,  "yAxisGrid_");
        this.extend(this.pvFrameBar, "plotFrame_");
        
        if(this.chart.options.compatVersion <= 1){
            this.extend(this.pvFrameBar, "xAxisEndLine_");
            this.extend(this.pvFrameBar, "yAxisEndLine_");
        }
        
        this.extend(this.xZeroLine,  "xAxisZeroLine_");
        this.extend(this.yZeroLine,  "yAxisZeroLine_");
    },

    /**
     * @override
     */
    _createCore: function(layoutInfo){
        var chart = this.chart;
        var axes  = chart.axes;
        var xAxis = axes.x;
        var yAxis = axes.y;
        
        // Full grid lines
        if(xAxis.isVisible && xAxis.option('FullGrid')) {
            this.xGridRule = this._createGridRule(xAxis);
        }
        
        if(yAxis.isVisible && yAxis.option('FullGrid')) {
            this.yGridRule = this._createGridRule(yAxis);
        }
        
        this.base(layoutInfo);

        var contentPanel = chart._mainContentPanel;
        if(contentPanel) {
            var showPlotFrame = chart.options.showPlotFrame;
            if(showPlotFrame == null){
                if(chart.options.compatVersion <= 1){
                    showPlotFrame = !!(xAxis.option('EndLine') || yAxis.option('EndLine'));
                } else {
                    showPlotFrame = true;
                }
            }
            
            if(showPlotFrame) {
                this.pvFrameBar = this._createFrame(layoutInfo, axes);
            }
            
            if(xAxis.scaleType === 'Continuous' && xAxis.option('ZeroLine')) {
                this.xZeroLine = this._createZeroLine(xAxis, layoutInfo);
            }

            if(yAxis.scaleType === 'Continuous' && yAxis.option('ZeroLine')) {
                this.yZeroLine = this._createZeroLine(yAxis, layoutInfo);
            }
        }
    },
    
    _createGridRule: function(axis){
        var scale = axis.scale;
        var ticks;
        
        // Composite axis don't fill ticks
        if(!scale.isNull && (ticks = axis.ticks)){
            var margins  = this._layoutInfo.gridMargins;
            var paddings = this._layoutInfo.gridPaddings;
            
            var tick_a = axis.orientation === 'x' ? 'left' : 'bottom';
            var len_a  = this.anchorLength(tick_a);
            var obeg_a = this.anchorOrtho(tick_a);
            var oend_a = this.anchorOpposite(obeg_a);
            
            var tick_offset = margins[tick_a] + paddings[tick_a];
            
            var obeg = margins[obeg_a];
            var oend = margins[oend_a];
            
    //      TODO: Implement FullGridCrossesMargin ...
    //        var orthoAxis = this._getOrthoAxis(axis.type);
    //        if(!orthoAxis.option('FullGridCrossesMargin')){
    //            obeg += paddings[obeg_a];
    //            oend += paddings[oend_a];
    //        }
            
            // Grid rules are generated for MAJOR ticks only.
            // For discrete axes, each category
            // has a grid line at the beginning of the band,
            // and an extra end line in the last band
            var isDiscrete = axis.scaleType === 'Discrete';
            if(isDiscrete){
                ticks = ticks.concat(ticks[ticks.length - 1]);
            }
            
            var pvGridRule = this.pvPanel.add(pv.Rule)
                            .data(ticks)
                            .zOrder(-12)
                            .strokeStyle("#f0f0f0")
                            [obeg_a](obeg)
                            [oend_a](oend)
                            [len_a](null)
                            ;
            
            if(!isDiscrete){
                pvGridRule
                    [tick_a](function(tick){
                        return tick_offset + scale(tick);
                    });
            } else {
                var halfStep = scale.range().step / 2;
                var lastTick = ticks.length - 1;
                
                pvGridRule
                    [tick_a](function(childData){
                        var position = tick_offset + scale(childData.value);
                        return position + (this.index < lastTick ? -halfStep : halfStep);
                    });
            }
            
            return pvGridRule;
        }
    },
    
    /* zOrder
     *
     * TOP
     * -------------------
     * Axis Rules:     0
     * Line/Dot/Area Content: -7
     * Frame/EndLine: -8
     * ZeroLine:      -9   <<------
     * Content:       -10 (default)
     * FullGrid:      -12
     * -------------------
     * BOT
     */
    
    _createFrame: function(layoutInfo, axes){
        if(axes.base.scale.isNull || 
           (axes.ortho.scale.isNull && (!axes.ortho2 || axes.ortho2.scale.isNull))){
            return;
        }
                
        var margins = layoutInfo.gridMargins;
        var left   = margins.left;
        var right  = margins.right;
        var top    = margins.top;
        var bottom = margins.bottom;
        
        // TODO: Implement FullGridCrossesMargin ...
        // Need to use to find the correct bounding box.
        // xScale(xScale.domain()[0]) -> xScale(xScale.domain()[1])
        // and
        // yScale(yScale.domain()[0]) -> yScale(yScale.domain()[1])
        var pvFrame = this.pvPanel.add(pv.Bar)
                        .zOrder(-8)
                        .left(left)
                        .right(right)
                        .top (top)
                        .bottom(bottom)
                        .strokeStyle("#808285")
                        .lineWidth(0.5)
                        .lock('fillStyle', null);
        return pvFrame;
    },
    
    _createZeroLine: function(axis, layoutInfo){
        var scale = axis.scale;
        if(!scale.isNull){
            var domain = scale.domain();
    
            // Domain crosses zero?
            if(domain[0] * domain[1] <= 0){
                // TODO: Implement FullGridCrossesMargin ...
                
                var a = axis.orientation === 'x' ? 'left' : 'bottom';
                var len_a  = this.anchorLength(a);
                var obeg_a = this.anchorOrtho(a);
                var oend_a = this.anchorOpposite(obeg_a);
                
                var margins = layoutInfo.gridMargins;
                var paddings = layoutInfo.gridPaddings;
                
                var zeroPosition = margins[a] + paddings[a] + scale(0);
                
                var obeg = margins[obeg_a];
                var oend = margins[oend_a];
                
                this.pvZeroLine = this.pvPanel.add(pv.Rule)
                    .zOrder(-9)
                    .strokeStyle("#808285")
                    [obeg_a](obeg)
                    [oend_a](oend)
                    [a](zeroPosition)
                    [len_a](null)
                    ;
            }
        }
    },

    _getOrthoAxis: function(type){
        var orthoType = type === 'base' ? 'ortho' : 'base';
        return this.chart.axes[orthoType];
    }
    
//    _buildDiscreteFullGridScene: function(data){
//        var rootScene = new pvc.visual.Scene(null, {panel: this, group: data});
//        
//        data.children()
//            .each(function(childData){
//                var childScene = new pvc.visual.Scene(rootScene, {group: childData});
//                var valueVar = 
//                    childScene.vars.tick = 
//                        new pvc.visual.ValueLabelVar(
//                                    childData.value,
//                                    childData.label);
//                
//                valueVar.absLabel = childData.absLabel;
//        });
//
//        /* Add a last scene, with the same data group */
//        var lastScene  = rootScene.lastChild;
//        if(lastScene){
//            var endScene = new pvc.visual.Scene(rootScene, {group: lastScene.group});
//            endScene.vars.tick = lastScene.vars.tick;
//        }
//
//        return rootScene;
//    }
});

pvc.CartesianAbstractPanel = pvc.BasePanel.extend({
    anchor: 'fill',
    orientation: "vertical",
    stacked: false,
    offsetPaddings: null,
    
    constructor: function(chart, parent, options) {
        
        this.base(chart, parent, options);
        
        // Initialize paddings from axes offsets
        var axes = chart.axes;
        var paddings = {};
        var hasAny = false;
        
        function setSide(side, pct){
            var value = paddings[side];
            if(value == null || pct > value){
                hasAny = true;
                paddings[side] = pct;
            }
        }
        
        function processAxis(axis){
            var offset = axis && axis.option('Offset');
            if(offset != null && offset >= 0) {
                if(axis.orientation === 'x'){
                    setSide('left',  offset);
                    setSide('right', offset);
                } else {
                    setSide('top',    offset);
                    setSide('bottom', offset);
                }
            }
        }
        
        processAxis(axes.x);
        processAxis(axes.secondX);
        processAxis(axes.y);
        processAxis(axes.secondY);
        
        if(hasAny){
            this.offsetPaddings = paddings;
        }
    },
    
    _calcLayout: function(layoutInfo){
        layoutInfo.requestPaddings = this._calcRequestPaddings(layoutInfo);
    },
    
    _calcRequestPaddings: function(layoutInfo){
        var op = this.offsetPaddings;
        if(!op){
            return;
        }

        var rp = this.chart._getAxesRoundingPaddings();
        var clientSize = layoutInfo.clientSize;
        var paddings   = layoutInfo.paddings;
        
        var reqPad = {};
        pvc.Sides.names.forEach(function(side){
//            var len_a = pvc.BasePanel.orthogonalLength[side];
//            var len   = clientSize[len_a] + paddings[len_a];
//            reqPad[side] = len * Math.max((op[side] || 0) - (rp[side] || 0), 0);
            
            var len_a = pvc.BasePanel.orthogonalLength[side];
            
            var clientLen = clientSize[len_a];
            var paddingLen = paddings[len_a];
            
            var len = clientLen + paddingLen;
            
            var offset   = len * (op[side] || 0);
            var rounding = clientLen * (rp[side] || 0);
        
            reqPad[side] = Math.max(offset - rounding, 0);
        }, this);
        
        return reqPad;  
    },
    
    /**
     * @override
     */
    _createCore: function() {
        // Send the panel behind the axis, title and legend, panels
        this.pvPanel.zOrder(-10);

        // Overflow
        var orthoAxis = this.chart.axes.ortho,
            baseAxis  = this.chart.axes.base;
        if (orthoAxis.option('FixedMin') != null ||
            orthoAxis.option('FixedMax') != null ||
            baseAxis .option('FixedMin') != null ||
            baseAxis .option('FixedMax') != null){
            // Padding area is used by bubbles and other vizs without problem
            this.pvPanel.borderPanel.overflow("hidden");
        }
    },

    _getVisibleData: function(dataPartValues, keyArgs){
        return this.chart._getVisibleData(dataPartValues || this.dataPartValue, keyArgs);
    },

    /**
     * @override
     */
    applyExtensions: function(){
        this.base();

        // Extend body
        this.extend(this.pvPanel, "chart_");
    },

    /* @override */
    isOrientationVertical: function(){
        return this.orientation === pvc.orientation.vertical;
    },

    /* @override */
    isOrientationHorizontal: function(){
        return this.orientation === pvc.orientation.horizontal;
    },

    /*
     * @override
     */
   _detectDatumsUnderRubberBand: function(datumsByKey, rb, keyArgs){
       var any = false,
           chart = this.chart,
           xAxisPanel = chart.xAxisPanel,
           yAxisPanel = chart.yAxisPanel,
           xDatumsByKey,
           yDatumsByKey;

       //1) x axis
       if(xAxisPanel){
           xDatumsByKey = {};
           if(!xAxisPanel._detectDatumsUnderRubberBand(xDatumsByKey, rb, keyArgs)) {
               xDatumsByKey = null;
           }
       }

       //2) y axis
       if(yAxisPanel){
           yDatumsByKey = {};
           if(!yAxisPanel._detectDatumsUnderRubberBand(yDatumsByKey, rb, keyArgs)) {
               yDatumsByKey = null;
           }
       }

       // Rubber band selects on both axes?
       if(xDatumsByKey && yDatumsByKey) {
           // Intersect datums

           def.eachOwn(yDatumsByKey, function(datum, key){
               if(def.hasOwn(xDatumsByKey, key)) {
                   datumsByKey[datum.key] = datum;
                   any = true;
               }
           });

           keyArgs.toggle = true;

       // Rubber band selects over any of the axes?
       } else if(xDatumsByKey) {
           def.copy(datumsByKey, xDatumsByKey);
           any = true;
       } else if(yDatumsByKey) {
           def.copy(datumsByKey, yDatumsByKey);
           any = true;
       } else {
           // Ask the base implementation for signums
           any = this.base(datumsByKey, rb, keyArgs);
       }

       return any;
   }
});
/**
 * CategoricalAbstract is the base class for all categorical or timeseries
 */
pvc.CategoricalAbstract = pvc.CartesianAbstract.extend({

    constructor: function(options){
        
        this.base(options);

        def.set(this._axisType2RoleNamesMap,
            'base', 'category',
            'ortho', this.options.orthoAxisOrdinal ? 'series' : 'value'
        );

        var parent = this.parent;
        if(parent) {
            this._catRole = parent._catRole;
        }
    },
    
    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        this._addVisualRoles({
            category: { isRequired: true, defaultDimensionName: 'category*', autoCreateDimension: true }
        });

        // ---------
        // Cached
        this._catRole = this.visualRoles('category');
    },

    /**
     * @override
     */
    _createVisibleData: function(dataPartValues, ignoreNulls){
        var serGrouping = this._serRole && this._serRole.flattenedGrouping(),
            catGrouping = this._catRole.flattenedGrouping(),
            partData    = this.partData(dataPartValues),
            
            // Allow for more caching when isNull is null
            keyArgs = { visible: true, isNull: ignoreNulls ? false : null};
        
        return serGrouping ?
                // <=> One multi-dimensional, two-levels data grouping
                partData.groupBy([catGrouping, serGrouping], keyArgs) :
                partData.groupBy(catGrouping, keyArgs);
    },
    
    /**
     * Obtains the extent of the specified value axis' role
     * and data part values.
     *
     * <p>
     * Takes into account that values are shown grouped per category.
     * </p>
     *
     * <p>
     * The fact that values are stacked or not, per category,
     * is also taken into account.
     * Each data part can have its own stacking.
     * </p>
     *
     * <p>
     * When more than one datum exists per series <i>and</i> category,
     * the sum of its values is considered.
     * </p>
     *
     * @param {pvc.visual.CartesianAxis} valueAxis The value axis.
     * @param {pvc.visual.Role} valueDataCell The data cell.
     * @type object
     *
     * @override
     */
    _getVisibleRoleValueExtent: function(valueAxis, valueDataCell){
        var valueRole = valueDataCell.role;
        var dataPartValues = valueDataCell.dataPartValues;
        if(dataPartValues == null){
            // Most common case is faster
            return this._getVisibleCellValueExtent(valueAxis, valueRole, null);
        }

        return def.query(dataPartValues)
                    .select(function(dataPartValue){
                        return this._getVisibleCellValueExtent(valueAxis, valueRole, dataPartValue);
                    }, this)
                    .reduce(this._unionReduceExtent, null)
                    ;
    },

    _isDataCellStacked: function(valueRole, dataPartValue){
        return this.options.stacked;
    },

    _getVisibleCellValueExtent: function(valueAxis, valueRole, dataPartValue){
        switch(valueRole.name){
            case 'series':// (series throws in base)
            case 'category':
                /* Special case.
                 * The category role's single dimension belongs to the grouping dimensions of data.
                 * As such, the default method is adequate
                 * (gets the extent of the value dim on visible data).
                 *
                 * Continuous baseScale's, like timeSeries go this way.
                 */
                return pvc.CartesianAbstract.prototype._getVisibleRoleValueExtent.call(
                                this, valueAxis, {role: valueRole, dataPartValues: dataPartValue });
        }
        
        this._assertSingleContinuousValueRole(valueRole);

        var valueDimName = valueRole.firstDimensionName(),
            data = this._getVisibleData(dataPartValue);

        if(valueAxis.type !== 'ortho' || !this._isDataCellStacked(valueRole, dataPartValue)){
            return data.leafs()
                       .select(function(serGroup){
                           return serGroup.dimensions(valueDimName).sum();
                        })
                       .range();
        }

        /*
         * data is grouped by category and then by series
         * So direct childs of data are category groups
         */
        return data.children()
            /* Obtain the value extent of each category */
            .select(function(catGroup){
                var range = this._getStackedCategoryValueExtent(catGroup, valueDimName);
                if(range){
                    return {range: range, group: catGroup};
                }
            }, this)
            .where(def.notNully)

            /* Combine the value extents of all categories */
            .reduce(function(result, rangeInfo){
                return this._reduceStackedCategoryValueExtent(
                            result,
                            rangeInfo.range,
                            rangeInfo.group);
            }.bind(this), null);

//        The following would not work:
//        var max = data.children()
//                    .select(function(catGroup){ return catGroup.dimensions(valueDimName).sum(); })
//                    .max();
//
//        return max != null ? {min: 0, max: max} : null;
    },
    
    /**
     * Obtains the extent of a value dimension in a given category group.
     * The default implementation determines the extent by separately
     * summing negative and positive values.
     * Supports {@link #_getVisibleValueExtent}.
     */
    _getStackedCategoryValueExtent: function(catGroup, valueDimName){
        var posSum = null,
            negSum = null;

        catGroup
            .children()
            /* Sum all datum's values on the same leaf */
            .select(function(serGroup){
                return serGroup.dimensions(valueDimName).sum();
            })
            /* Add to positive or negative totals */
            .each(function(value){
                // Note: +null === 0
                if(value != null){
                    if(value >= 0){
                        posSum += value;
                    } else {
                        negSum += value;
                    }
                }
            });

        if(posSum == null && negSum == null){
            return null;
        }

        return {max: posSum || 0, min: negSum || 0};
    },

    /**
     * Reduce operation of category ranges, into a global range.
     *
     * The default implementation performs a range "union" operation.
     *
     * Supports {@link #_getVisibleValueExtent}.
     */
    _reduceStackedCategoryValueExtent: function(result, catRange, catGroup){
        return this._unionReduceExtent(result, catRange);
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
    
    // TODO: chart orientation?
    markEvent: function(dateString, label, options){

        if(!this.options.timeSeries){
            pvc.log("Attempting to mark an event on a non timeSeries chart");
            return;
        }

        var o = $.extend({}, this.markEventDefaults, options);
        
        var baseScale = this.axes.base.scale;
            //{ bypassAxisOffset: true }); // TODO: why bypassAxisOffset ?

        // Are we outside the allowed scale?
        var d = pv.Format.date(this.options.timeSeriesFormat).parse(dateString);
        var dpos = baseScale(d),
            range = baseScale.range();
        
        if( dpos < range[0] || dpos > range[1]){
            pvc.log("Event outside the allowed range, returning");
            return;
        }

        // Add the line

        var panel = this._mainContentPanel.pvPanel;
        var h = this.yScale.range()[1];

        // Detect where to place the horizontalAnchor
        //var anchor = o.horizontalAnchor;
        if( !o.forceHorizontalAnchor ){
            var availableSize = o.horizontalAnchor == "right"? range[1]- dpos : dpos;
            
            // TODO: Replace this availableSize condition with a check for the text size
            if (availableSize < o.horizontalAnchorSwapLimit ){
                o.horizontalAnchor = o.horizontalAnchor == "right" ? "left" : "right";
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
            .top(o.verticalAnchor == "top" ? o.verticalOffset : (h - o.verticalOffset))
            .add(pv.Label)
            .text(label)
            .textStyle(o.textStyle)
            .visible(function(){
                return !this.index;
            });
    },
    
    defaults: def.create(pvc.CartesianAbstract.prototype.defaults, {
     // Ortho <- value role
        orthoAxisOrdinal: false, // when true => _axisType2RoleNamesMap['ortho'] = 'series' (instead of value)
        
        stacked: false
    })
});

/**
 * AxisPanel panel.
 */
pvc.AxisPanel = pvc.BasePanel.extend({
    showAllTimeseries: false, // TODO: ??
    
    pvRule:     null,
    pvTicks:    null,
    pvLabel:    null,
    pvRuleGrid: null,
    pvScale:    null,
    
    isDiscrete: false,
    roleName: null,
    axis: null,
    anchor: "bottom",
    axisSize: undefined,
    tickLength: 6,
    
    panelName: "axis", // override
    scale: null,
    ruleCrossesMargin: true,
    font: '9px sans-serif', // label font
    labelSpacingMin: 1,
    // To be used in linear scales
    domainRoundMode: 'none',
    desiredTickCount: null,
    tickExponentMin:  null,
    tickExponentMax:  null,
    minorTicks:       true,
    
    _isScaleSetup: false,
    
    constructor: function(chart, parent, axis, options) {
        
        options = def.create(options, {
            anchor: axis.option('Position')
        });
        
        // sizeMax
        if(options.sizeMax == null){
            var sizeMax = options.axisSizeMax;
            if(sizeMax != null){
                // Single size (a number or a string with only one number)
                // should be interpreted as meaning the orthogonal length.
                var anchor = options.anchor || this.anchor;
                
                options.sizeMax = new pvc.Size()
                                    .setSize(sizeMax, {singleProp: this.anchorOrthoLength(anchor)});
            }
        }
        
        this.base(chart, parent, options);
        
        this.axis = axis;
        this.roleName = axis.role.name;
        this.isDiscrete = axis.role.grouping.isDiscrete();
        
        if(options.font === undefined){
            var extFont = this._getConstantExtension(this.panelName + 'Label', 'font');
            if(extFont){
                this.font = extFont;
            }
        }
    },
    
    getTicks: function(){
        return this._layoutInfo && this._layoutInfo.ticks;
    },
    
    _calcLayout: function(layoutInfo){
        
        var scale = this.axis.scale;
        
        if(!this._isScaleSetup){
            this.pvScale = scale;
            this.scale   = scale; // TODO: At least HeatGrid depends on this. Maybe Remove?
            
            this.extend(scale, this.panelName + "Scale_");
            
            this._isScaleSetup = true;
        }
        
        if(scale.isNull){
            layoutInfo.axisSize = 0;
        } else {
            this._calcLayoutCore(layoutInfo);
        }
        
        return this.createAnchoredSize(layoutInfo.axisSize, layoutInfo.clientSize);
    },
    
    _calcLayoutCore: function(layoutInfo){
        //var layoutInfo = this._layoutInfo;
        
        // Fixed axis size?
        layoutInfo.axisSize = this.axisSize;
        
        if (this.isDiscrete && this.useCompositeAxis){
            if(layoutInfo.axisSize == null){
                layoutInfo.axisSize = 50;
            }
        } else {
            /* I  - Calculate ticks
             * --> layoutInfo.{ ticks, ticksText, maxTextWidth } 
             */
            this._calcTicks();
            
            /* II - Calculate NEEDED axisSize so that all tick's labels fit */
            if(layoutInfo.axisSize == null){
                this._calcAxisSizeFromLabel(); // -> layoutInfo.axisSize and layoutInfo.labelBBox
            }
            
            /* III - Calculate Trimming Length if: FIXED/NEEDED > AVAILABLE */
            this._calcMaxTextLengthThatFits();
            
            
            /* IV - Calculate overflow paddings */
            this._calcOverflowPaddings();
            
            // Release memory.
            layoutInfo.labelBBox = null;
        }
    },
    
    _calcAxisSizeFromLabel: function(){
        this._calcLabelBBox();
        this._calcAxisSizeFromLabelBBox();
    },

    // --> layoutInfo.labelBBox
    _calcLabelBBox: function(){
        var layoutInfo = this._layoutInfo;
        
        var labelExtId = this.panelName + 'Label';
        
        var align = this._getExtension(labelExtId, 'textAlign');
        if(typeof align !== 'string'){
            align = this.isAnchorTopOrBottom() ? 
                    "center" : 
                    (this.anchor == "left") ? "right" : "left";
        }
        
        var baseline = this._getExtension(labelExtId, 'textBaseline');
        if(typeof baseline !== 'string'){
            switch (this.anchor) {
                case "right":
                case "left":
                case "center":
                    baseline = "middle";
                    break;
                    
                case "bottom": 
                    baseline = "top";
                    break;
                  
                default:
                //case "top": 
                    baseline = "bottom";
                    //break;
            }
        } 
        
        var angle  = def.number.as(this._getExtension(labelExtId, 'textAngle'),  0);
        var margin = def.number.as(this._getExtension(labelExtId, 'textMargin'), 3);
        
        layoutInfo.labelBBox = pvc.text.getLabelBBox(
                        layoutInfo.maxTextWidth, 
                        layoutInfo.textHeight, 
                        align, 
                        baseline, 
                        angle, 
                        margin);
    },
    
    _calcAxisSizeFromLabelBBox: function(){
        var layoutInfo = this._layoutInfo;
        var labelBBox = layoutInfo.labelBBox;
        
        // The length not over the plot area
        var length = this._getLabelBBoxQuadrantLength(labelBBox, this.anchor);

        // --------------
        
        layoutInfo.axisSize = this.tickLength + length; 
        
        // Add equal margin on both sides?
        var angle = labelBBox.sourceAngle;
        if(!(angle === 0 && this.isAnchorTopOrBottom())){
            // Text height already has some free space in that case
            // so no need to add more.
            layoutInfo.axisSize += this.tickLength;
        }
    },
    
    _getLabelBBoxQuadrantLength: function(labelBBox, quadrantSide){
        // labelBBox coordinates are relative to the anchor point
        // x points to the right, y points downwards
        //        T
        //        ^
        //        |
        // L  <---0--->  R
        //        |
        //        v
        //        B
        //
        //  +--> xx
        //  |
        //  v yy
        //
        //  x1 <= x2
        //  y1 <= y2
        // 
        //  p1 +-------+
        //     |       |
        //     +-------+ p2
        
        var length;
        switch(quadrantSide){
            case 'left':   length = -labelBBox.x;  break;
            case 'right':  length =  labelBBox.x2; break;
            case 'top':    length = -labelBBox.y;  break;
            case 'bottom': length =  labelBBox.y2; break;
        }
        
        return Math.max(length, 0);
    },
    
    _calcOverflowPaddings: function(){
        if(!this._layoutInfo.labelBBox){
            this._calcLabelBBox();
        }
        
        this._calcOverflowPaddingsFromLabelBBox();
    },
    
    _calcOverflowPaddingsFromLabelBBox: function(){
        var layoutInfo = this._layoutInfo;
        var paddings   = layoutInfo.paddings;
        var labelBBox  = layoutInfo.labelBBox;
        var orthoSides = this.isAnchorTopOrBottom() ? ['left', 'right'] : ['top', 'bottom'];
        
        var isDiscrete = this.scale.type === 'Discrete';
        var halfBand;
        if(isDiscrete){
            this.axis.setScaleRange(layoutInfo.clientSize[this.anchorLength()]);
            halfBand = this.scale.range().band / 2;
        }

        var overflowPaddings = null;
        orthoSides.forEach(function(side){
            var overflowPadding  = this._getLabelBBoxQuadrantLength(labelBBox, side);
            if(overflowPadding > 0){
                // Discount real paddings that this panel already has
                // cause they're, in principle, empty space that can be occupied.
                overflowPadding -= (paddings[side] || 0);
                if(overflowPadding > 0){
                    // On discrete axes, half of the band width is not yet overflow.
                    if(isDiscrete){
                        overflowPadding -= halfBand;
                    }
                    
                    if(overflowPadding > 1){ // small delta to avoid frequent relayouts... (the reported font height often causes this kind of "error" in BBox calculation)
                        if(isDiscrete){
                            // reduction of space causes reduction of band width
                            // which in turn usually causes the overflowPadding to increase,
                            // as the size of the text usually does not change.
                            // Ask a little bit more to hit the target faster.
                            overflowPadding *= 1.05;
                        }
                        
                        if(!overflowPaddings){ 
                            overflowPaddings= {}; 
                        }
                        overflowPaddings[side] = overflowPadding;
                    }
                }
            }
        }, this);
        
        if(pvc.debug >= 6 && overflowPaddings){
            pvc.log("[OverflowPaddings] " +  this.panelName + " " + JSON.stringify(overflowPaddings));
        }
        
        layoutInfo.overflowPaddings = overflowPaddings;
    },
    
    _calcMaxTextLengthThatFits: function(){
        var layoutInfo = this._layoutInfo;
        var availableClientLength = layoutInfo.clientSize[this.anchorOrthoLength()];
        if(layoutInfo.axisSize <= availableClientLength){
            // Labels fit
            // Clear to avoid unnecessary trimming
            layoutInfo.maxTextWidth = null;
        } else {
            // Text may not fit. 
            // Calculate maxTextWidth where text is to be trimmed.
            
            var labelBBox = layoutInfo.labelBBox;
            if(!labelBBox){
                // NOTE: requires previously calculated layoutInfo.maxTextWidth...
                this._calcAxisSizeFromLabel();
            }
            
            // Now move backwards, to the max text width...
            var maxOrthoLength = availableClientLength - 2 * this.tickLength;
            
            // A point at the maximum orthogonal distance from the anchor
            var mostOrthoDistantPoint;
            var parallelDirection;
            switch(this.anchor){
                case 'left':
                    parallelDirection = pv.vector(0, 1);
                    mostOrthoDistantPoint = pv.vector(-maxOrthoLength, 0);
                    break;
                
                case 'right':
                    parallelDirection = pv.vector(0, 1);
                    mostOrthoDistantPoint = pv.vector(maxOrthoLength, 0);
                    break;
                    
                case 'top':
                    parallelDirection = pv.vector(1, 0);
                    mostOrthoDistantPoint = pv.vector(0, -maxOrthoLength);
                    break;
                
                case 'bottom':
                    parallelDirection = pv.vector(1, 0);
                    mostOrthoDistantPoint = pv.vector(0, maxOrthoLength);
                    break;
            }
            
            // Intersect the line that passes through mostOrthoDistantPoint,
            // and has the direction parallelDirection with 
            // the top side and with the bottom side of the *original* label box.
            var corners = labelBBox.sourceCorners;
            var botL = corners[0];
            var botR = corners[1];
            var topL = corners[2];
            var topR = corners[3];
            
            var topRLSideDir = topR.minus(topL);
            var botRLSideDir = botR.minus(botL);
            var intersect = pv.SvgScene.lineIntersect;
            var botI = intersect(mostOrthoDistantPoint, parallelDirection, botL, botRLSideDir);
            var topI = intersect(mostOrthoDistantPoint, parallelDirection, topL, topRLSideDir);
            
            // Two cases
            // A) If the angle is between -90 and 90, the text does not get upside down
            // In that case, we're always interested in topI -> topR and botI -> botR
            // B) Otherwise the relevant new segments are topI -> topL and botI -> botL
            
            var maxTextWidth;
            if(Math.cos(labelBBox.sourceAngle) >= 0){
                // A) [-90, 90]
                maxTextWidth = Math.min(
                                    topR.minus(topI).length(), 
                                    botR.minus(botI).length());
            } else {
                maxTextWidth = Math.min(
                        topL.minus(topI).length(), 
                        botL.minus(botI).length());
            }
            
            // One other detail.
            // When align (anchor) is center,
            // just cutting on one side of the label original box
            // won't do, because when text is centered, the cut we make in length
            // ends up distributed by both sides...
            if(labelBBox.sourceAlign === 'center'){
                var cutWidth = labelBBox.sourceTextWidth - maxTextWidth;
                
                // Cut same width on the opposite side. 
                maxTextWidth -= cutWidth;
            }
            
            layoutInfo.maxTextWidth = maxTextWidth; 
        }
    },
    
    // ----------------
    
    _calcTicks: function(){
        var layoutInfo = this._layoutInfo;
        
        layoutInfo.textHeight = pvc.text.getTextHeight("m", this.font);
        layoutInfo.maxTextWidth = null;
        
        // Reset scale to original unrounded domain
        this.axis.setTicks(null);
        
        // update maxTextWidth, ticks and ticksText
        switch(this.scale.type){
            case 'Discrete'  : this._calcDiscreteTicks();   break;
            case 'Timeseries': this._calcTimeseriesTicks(); break;
            case 'Continuous': this._calcNumberTicks(layoutInfo); break;
            default: throw def.error.operationInvalid("Undefined axis scale type"); 
        }
        
        this.axis.setTicks(layoutInfo.ticks);
        
        if(layoutInfo.maxTextWidth == null){
            layoutInfo.maxTextWidth = 
                def.query(layoutInfo.ticksText)
                    .select(function(text){ return pvc.text.getTextLength(text, this.font); }, this)
                    .max();
        }
    },
    
    _calcDiscreteTicks: function(){
        var layoutInfo = this._layoutInfo;
        var data = this.chart.visualRoles(this.roleName)
                        .flatten(this.chart.data, {visible: true});
         
        layoutInfo.data  = data;
        layoutInfo.ticks = data._children;
         
        layoutInfo.ticksText = def.query(data._children)
                            .select(function(child){ return child.absLabel; })
                            .array();
    },
    
    _calcTimeseriesTicks: function(){
        this._calcContinuousTicks(this._layoutInfo, this.desiredTickCount);
    },
    
    _calcNumberTicks: function(layoutInfo){
        var desiredTickCount;
        
        var previousLayout;
        if(!layoutInfo.canChange && (previousLayout = layoutInfo.previous)){
            desiredTickCount = previousLayout.ticks.length;
        } else {
            desiredTickCount = this.desiredTickCount;
        }
         
        if(desiredTickCount == null){
            if(this.isAnchorTopOrBottom()){
                this._calcNumberHTicks();
                return;
            }
            
            desiredTickCount = this._calcNumberVDesiredTickCount();
        }
        
        this._calcContinuousTicks(this._layoutInfo, desiredTickCount);
    },
    
    // --------------
    
    _calcContinuousTicks: function(ticksInfo, desiredTickCount){
        this._calcContinuousTicksValue(ticksInfo, desiredTickCount);
        this._calcContinuousTicksText(ticksInfo);
    },
    
    _calcContinuousTicksValue: function(ticksInfo, desiredTickCount){
        ticksInfo.ticks = this.scale.ticks(
                                desiredTickCount, {
                                    roundInside:       this.domainRoundMode !== 'tick',
                                    numberExponentMin: this.tickExponentMin,
                                    numberExponentMax: this.tickExponentMax
                                });
    },
    
    _calcContinuousTicksText: function(ticksInfo){
        
        ticksInfo.ticksText = def.query(ticksInfo.ticks)
                               .select(function(tick){ return this.scale.tickFormat(tick); }, this)
                               .array();
    },
    
    // --------------
    
    _calcNumberVDesiredTickCount: function(){
        var layoutInfo = this._layoutInfo;
        var lineHeight = layoutInfo.textHeight * (1 + Math.max(0, this.labelSpacingMin /*em*/)); 
        var clientLength = layoutInfo.clientSize[this.anchorLength()];
        
        return Math.max(1, ~~(clientLength / lineHeight));
    },
    
    _calcNumberHTicks: function(){
        var layoutInfo = this._layoutInfo;
        var clientLength = layoutInfo.clientSize[this.anchorLength()];
        var spacing = layoutInfo.textHeight * (1 + Math.max(0, this.labelSpacingMin/*em*/));
        var desiredTickCount = this._calcNumberHDesiredTickCount(this, spacing);
        
        var doLog = (pvc.debug >= 7);
        var dir, prevResultTickCount;
        var ticksInfo, lastBelow, lastAbove;
        do {
            if(doLog){ pvc.log("calculateNumberHTicks TickCount IN desired = " + desiredTickCount); }
            
            ticksInfo = {};
            
            this._calcContinuousTicksValue(ticksInfo, desiredTickCount);
            
            var ticks = ticksInfo.ticks;
            
            var resultTickCount = ticks.length;
            
            if(ticks.exponentOverflow){
                // TODO: Check if this part of the algorithm is working ok
                
                // Cannot go anymore in the current direction, if any
                if(dir == null){
                    if(ticks.exponent === this.exponentMin){
                        lastBelow = ticksInfo;
                        dir =  1;
                    } else {
                        lastAbove = ticksInfo;
                        dir = -1;
                    }
                } else if(dir === 1){
                    if(lastBelow){
                        ticksInfo = lastBelow;
                    }
                    break;
                } else { // dir === -1
                    if(lastAbove){
                        ticksInfo = lastAbove;
                    }
                    break;
                }
                
            } else if(prevResultTickCount == null || resultTickCount !== prevResultTickCount){
                
                if(doLog){ 
                    pvc.log("calculateNumberHTicks TickCount desired/resulting = " + desiredTickCount + " -> " + resultTickCount); 
                }
                
                prevResultTickCount = resultTickCount;
                
                this._calcContinuousTicksText(ticksInfo);
                
                var length = this._calcNumberHLength(ticksInfo, spacing);
                var excessLength  = length - clientLength;
                var pctError = ticksInfo.error = Math.abs(excessLength / clientLength);
                
                if(doLog){
                    pvc.log("calculateNumberHTicks error=" + (ticksInfo.error * 100).toFixed(0) + "% count=" + resultTickCount + " step=" + ticks.step);
                    pvc.log("calculateNumberHTicks Length client/resulting = " + clientLength + " / " + length + " spacing = " + spacing);
                }
                
                if(excessLength > 0){
                    // More ticks than can fit
                    if(desiredTickCount === 1){
                        break;
                    }
                    
                    if(lastBelow){
                        // We were below max length and then overshot...
                        // Choose the best conforming one
                        if(pctError > lastBelow.error){
                            ticksInfo = lastBelow;
                        }
                        break;
                    }
                    
                    // Backup last *above* calculation
                    lastAbove = ticksInfo;
                    
                    dir = -1;
                } else {
                    // Less ticks than could fit
                    
                    if(pctError <= 0.05 || dir === -1){
                        // Acceptable
                        // or
                        // Already had exceeded the length and had decided to go down
                        
                        if(lastAbove && pctError > lastAbove.error){
                            ticksInfo = lastAbove;
                        }
                        break;
                    }
                    
                    // Backup last *below* calculation
                    lastBelow = ticksInfo;
                                            
                    dir = +1;
                }
            }
            
            desiredTickCount += dir;
        } while(true);
        
        if(ticksInfo){
            layoutInfo.ticks = ticksInfo.ticks;
            layoutInfo.ticksText = ticksInfo.ticksText;
            layoutInfo.maxTextWidth = ticksInfo.maxTextWidth;
            
            if(pvc.debug >= 5){
                pvc.log("calculateNumberHTicks RESULT error=" + (ticksInfo.error * 100).toFixed(0) + "% count=" + ticksInfo.ticks.length + " step=" + ticksInfo.ticks.step);
            }
        }
        
        if(doLog){ pvc.log("calculateNumberHTicks END"); }
    },
    
    _calcNumberHDesiredTickCount: function(spacing){
        // The initial tick count is determined 
        // from the formatted min and max values of the domain.
        var layoutInfo = this._layoutInfo;
        var domainTextLength = this.scale.domain().map(function(tick){
                var text = this.scale.tickFormat(tick);
                return pvc.text.getTextLength(text, this.font); 
            }, this);
        
        var avgTextLength = Math.max((domainTextLength[1] + domainTextLength[0]) / 2, layoutInfo.textHeight);
        
        var clientLength = layoutInfo.clientSize[this.anchorLength()];
        
        return Math.max(1, ~~(clientLength / (avgTextLength + spacing)));
    },
    
    _calcNumberHLength: function(ticksInfo, spacing){
        // Measure full width, with spacing
        var ticksText = ticksInfo.ticksText;
        var tickCount = ticksText.length;
        var length = 0;
        var maxLength = -Infinity;
        for(var t = 0 ; t < tickCount ; t++){
            var textLength = pvc.text.getTextLength(ticksText[t], this.font);
            if(textLength > maxLength){
                maxLength = textLength;
            }
            
            if(t){
                length += spacing;
            }
            
            if(!t ||  t === tickCount - 1) {
                // Include half the text size only, as centered labels are the most common scenario
                length += textLength / 2;
            } else {
                // Middle tick
                length += textLength;
            }
        }
        
        ticksInfo.maxTextWidth = maxLength;
        
        return length;
    },
    
    _createCore: function() {
        this.renderAxis();
    },
    
    /**
     * @override
     */
    applyExtensions: function(){
        
        this.base();

        this.extend(this.pvPanel,      this.panelName + "_"     );
        this.extend(this.pvRule,       this.panelName + "Rule_" );
        this.extend(this.pvTicks,      this.panelName + "Ticks_");
        this.extend(this.pvLabel,      this.panelName + "Label_");
        this.extend(this.pvMinorTicks, this.panelName + "MinorTicks_");
    },

    renderAxis: function(){
        if(this.scale.isNull){
            return;
        }
        
        //this.pvPanel.strokeStyle('orange');
        
        // Range
        var clientSize = this._layoutInfo.clientSize;
        var paddings   = this._layoutInfo.paddings;
        
        var begin_a = this.anchorOrtho();
        var end_a   = this.anchorOpposite(begin_a);
        var size_a  = this.anchorOrthoLength(begin_a);
        
        var rMin = this.ruleCrossesMargin ? -paddings[begin_a] : 0;
        var rMax = clientSize[size_a] + (this.ruleCrossesMargin ? paddings[end_a] : 0);
        var rSize = rMax - rMin;
        
        var ruleParentPanel = this.pvPanel;

        this._rSize = rSize;

        this.pvRule = ruleParentPanel.add(pv.Rule)
            .zOrder(30)
            .strokeStyle('black')
            // ex: anchor = bottom
            [this.anchorOpposite()](0) // top (of the axis panel)
            [size_a ](rSize) // width
            [begin_a](rMin)  // left
            .lineCap('square') // So that begin/end ticks better join with the rule 
            ;

        if (this.isDiscrete){
            if(this.useCompositeAxis){
                this.renderCompositeOrdinalAxis();
            } else {
                this.renderOrdinalAxis();
            }
        } else {
            this.renderLinearAxis();
        }
    },

    _getOrthoScale: function(){
        var orthoType = this.axis.type === 'base' ? 'ortho' : 'base';
        return this.chart.axes[orthoType].scale; // index 0
    },

    _getOrthoAxis: function(){
        var orthoType = this.axis.type === 'base' ? 'ortho' : 'base';
        return this.chart.axes[orthoType]; // index 0
    },

    renderOrdinalAxis: function(){
        var myself = this,
            scale = this.scale,
            anchorOpposite    = this.anchorOpposite(),
            anchorLength      = this.anchorLength(),
            anchorOrtho       = this.anchorOrtho(),
            anchorOrthoLength = this.anchorOrthoLength(),
            data              = this._layoutInfo.data,
            itemCount         = this._layoutInfo.ticks.length,
            includeModulo;
        
        if(this.axis.option('OverlappedLabelsHide') && itemCount > 0 && this._rSize > 0) {
            var overlapFactor = def.between(this.axis.option('OverlappedLabelsMaxPct'), 0, 0.9);
            var textHeight    = pvc.text.getTextHeight("m", this.font) * (1 - overlapFactor);
            includeModulo = Math.max(1, Math.ceil((itemCount * textHeight) / this._rSize));

            if(pvc.debug >= 4){
                pvc.log({overlapFactor: overlapFactor, itemCount: itemCount, textHeight: textHeight, Size: this._rSize, modulo: (itemCount * textHeight) / this._rSize, itemSpan: itemCount * textHeight, itemAvailSpace: this._rSize / itemCount});
            }
            
            if(pvc.debug >= 3 && includeModulo > 1) {
                pvc.log("Hiding every " + includeModulo + " labels in axis " + this.panelName);
            }
        } else {
            includeModulo = 1;
        }
        
        // Ticks correspond to each data in datas.
        // Ticks are drawn at the center of each band.
        this.pvTicks = this.pvRule.add(pv.Rule)
            .zOrder(20) // see pvc.js
            .data(this._layoutInfo.ticks)
            .localProperty('group')
            .group(function(child){ return child; })
            //[anchorOpposite   ](0)
            [anchorLength     ](null)
            [anchorOrtho      ](function(child){ return scale(child.value); })
            [anchorOrthoLength](this.tickLength)
            //.strokeStyle('black')
            .strokeStyle('rgba(0,0,0,0)') // Transparent by default, but extensible
            ;

        var align = this.isAnchorTopOrBottom() ? 
                    "center" : 
                    (this.anchor == "left") ? "right" : "left";
        
        var font = this.font;
        
        var maxTextWidth = this._layoutInfo.maxTextWidth;
        if(!isFinite(maxTextWidth)){
            maxTextWidth = 0;
        }
        
        // All ordinal labels are relevant and must be visible
        this.pvLabel = this.pvTicks.anchor(this.anchor).add(pv.Label)
            .intercept(
                'visible',
                labelVisibleInterceptor,
                this._getExtension(this.panelName + "Label", 'visible'))
            .zOrder(40) // see pvc.js
            .textAlign(align)
            .text(function(child){
                var text = child.absLabel;
                if(maxTextWidth){
                    text = pvc.text.trimToWidthB(maxTextWidth, text, font, '..', true);
                }
                return text; 
             })
            .font(font)
            .localProperty('group')
            .group(function(child){ return child; })
            ;
        
        function labelVisibleInterceptor(getVisible, args) {
            var visible = getVisible ? getVisible.apply(this, args) : true;
            return visible && ((this.index % includeModulo) === 0);
        }
        
        if(this._shouldHandleClick()){
            this.pvLabel
                .cursor("pointer")
                .events('all') //labels don't have events by default
                .event('click', function(child){
                    var ev = arguments[arguments.length - 1];
                    return myself._handleClick(child, ev);
                });
        }

        if(this.doubleClickAction){
            this.pvLabel
                .cursor("pointer")
                .events('all') //labels don't have events by default
                .event("dblclick", function(child){
                    var ev = arguments[arguments.length - 1];
                    myself._handleDoubleClick(child, ev);
                });
        }
    },

    renderLinearAxis: function(){
        // NOTE: Includes time series, 
        // so "d" may be a number or a Date object...
        
        var scale  = this.scale,
            orthoAxis  = this._getOrthoAxis(),
            orthoScale = orthoAxis.scale,
            layoutInfo = this._layoutInfo,
            ticks      = layoutInfo.ticks,
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
            [anchorOrthoLength](this.tickLength);
            // Inherit axis color
            //.strokeStyle('black'); // control visibility through color or through .visible
        
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
                .intercept(
                    'visible',
                    minorTicksVisibleInterceptor,
                    this._getExtension(this.panelName + "MinorTicks", 'visible'))
                ;
        }

        function minorTicksVisibleInterceptor(getVisible, args){
            var visible = (!pvTicks.scene || pvTicks.scene[this.index].visible) &&
                          (this.index < ticks.length - 1);

            return visible && (getVisible ? getVisible.apply(this, args) : true);
        }

        this.renderLinearAxisLabel(ticks, layoutInfo.ticksText);
    },
    
    renderLinearAxisLabel: function(ticks, ticksText){
        // Labels are visible (only) on MAJOR ticks,
        // On first and last tick care is taken
        //  with their H/V alignment so that
        //  the label is not drawn off the chart.

        // Use this margin instead of textMargin, 
        // which affects all margins (left, right, top and bottom).
        // Exception is the small 0.5 textMargin set below....
        var labelAnchor = this.pvTicks.anchor(this.anchor)
                                .addMargin(this.anchorOpposite(), 2);
        
        var scale = this.scale;
        var font = this.font;
        
        var maxTextWidth = this._layoutInfo.maxTextWidth;
        if(!isFinite(maxTextWidth)){
            maxTextWidth = 0;
        }
        
        var label = this.pvLabel = labelAnchor.add(pv.Label)
            .zOrder(40)
            .text(function(d){
                var text = ticksText[this.index]; // scale.tickFormat(d);
                if(maxTextWidth){
                    text = pvc.text.trimToWidthB(maxTextWidth, text, font, '..', true);
                }
                return text;
             })
            .font(this.font)
            .textMargin(0.5) // Just enough for some labels not to be cut (vertical)
            .visible(true);
        
        // Label alignment
        var rootPanel = this.pvPanel.root;
        if(this.isAnchorTopOrBottom()){
            label.textAlign(function(){
                var absLeft;
                if(this.index === 0){
                    absLeft = label.toScreenTransform().transformHPosition(label.left());
                    if(absLeft <= 0){
                        return 'left'; // the "left" of the text is anchored to the tick's anchor
                    }
                } else if(this.index === ticks.length - 1) { 
                    absLeft = label.toScreenTransform().transformHPosition(label.left());
                    if(absLeft >= rootPanel.width()){
                        return 'right'; // the "right" of the text is anchored to the tick's anchor
                    }
                }
                return 'center';
            });
        } else {
            label.textBaseline(function(){
                var absTop;
                if(this.index === 0){
                    absTop = label.toScreenTransform().transformVPosition(label.top());
                    if(absTop >= rootPanel.height()){
                        return 'bottom'; // the "bottom" of the text is anchored to the tick's anchor
                    }
                } else if(this.index === ticks.length - 1) { 
                    absTop = label.toScreenTransform().transformVPosition(label.top());
                    if(absTop <= 0){
                        return 'top'; // the "top" of the text is anchored to the tick's anchor
                    }
                }
                
                return 'middle';
            });
        }
    },

    // ----------------------------
    // Click / Double-click
    // TODO: unify this with base panel's code
    _handleDoubleClick: function(d, ev){
        if(!d){
            return;
        }
        
        var action = this.doubleClickAction;
        if(action){
            this._ignoreClicks = 2;

            action.call(null, d, ev);
        }
    },

    _shouldHandleClick: function(){
        var options = this.chart.options;
        return options.selectable || (options.clickable && this.clickAction);
    },

    _handleClick: function(data, ev){
        if(!data || !this._shouldHandleClick()){
            return;
        }

        // Selection
        
        if(!this.doubleClickAction){
            this._handleClickCore(data, ev);
        } else {
            // Delay click evaluation so that
            // it may be canceled if double click meanwhile fires.
            var myself  = this,
                options = this.chart.options;
            window.setTimeout(
                function(){
                    myself._handleClickCore.call(myself, data, ev);
                },
                options.doubleClickMaxDelay || 300);
        }
    },

    _handleClickCore: function(data, ev){
        if(this._ignoreClicks) {
            this._ignoreClicks--;
            return;
        }

        // Classic clickAction
        var action = this.clickAction;
        if(action){
            action.call(null, data, ev);
        }

        // TODO: should this be cancellable by the click action?
        var options = this.chart.options;
        if(options.selectable && this.isDiscrete){
            var toggle = options.ctrlSelectMode && !ev.ctrlKey;
            this._selectOrdinalElement(data, toggle);
        }
    },

    _selectOrdinalElement: function(data, toggle){
        var selectedDatums = data.datums().array();
        
        selectedDatums = this._onUserSelection(selectedDatums);
        
        if(toggle){
            this.chart.data.owner.clearSelected();
        }

        pvc.data.Data.toggleSelected(selectedDatums);
        
        this._onSelectionChanged();
    },
    
    /**
     * Prevents the axis panel from reacting directly to rubber band selections.
     * 
     * The panel participates in rubber band selection through 
     * the mediator {@link pvc.CartesianAbstractPanel}, which calls
     * each axes' {@link #_detectDatumsUnderRubberBand} directly.
     *   
     * @override
     */
    _dispatchRubberBandSelection: function(ev){
        /* NOOP */
    },
    
    /**
     * @override
     */
    _detectDatumsUnderRubberBand: function(datumsByKey, rb){
        if(!this.isDiscrete || !this.isVisible) {
            return false;
        }
        
        var any = false;
        
        function addData(data) {
            data.datums().each(function(datum){
                datumsByKey[datum.key] = datum;
                any = true;
            });
        }
        
        if(!this.useCompositeAxis){
            var mark = this.pvLabel;
            
            mark.eachInstance(function(instance, t){
                if(!instance.isBreak) { 
                    var data = instance.group;
                    if(data) {
                        var shape = mark.getInstanceShape(instance).apply(t);
                        if (shape.intersectsRect(rb)){
                            addData(data);
                        }
                    }
                }
            }, this);
            
        } else {
            var t = this._pvLayout.toScreenTransform();
            this._rootElement.visitBefore(function(data, i){
                if(i > 0){
                    var centerX = t.transformHPosition(data.x + data.dx /2),
                        centerY = t.transformVPosition(data.y + data.dy /2);
                    if(rb.containsPoint(centerX, centerY)){
                       addData(data);
                    }
                }
            });
        }
        
        return any;
    },
    
    /////////////////////////////////////////////////
    //begin: composite axis
    renderCompositeOrdinalAxis: function(){
        var myself = this,
            isTopOrBottom = this.isAnchorTopOrBottom(),
            axisDirection = isTopOrBottom ? 'h' : 'v',
            tipsyGravity  = this._calcTipsyGravity(),
            diagDepthCutoff = 2, // depth in [-1/(n+1), 1]
            vertDepthCutoff = 2;
        
        var layout = this._pvLayout = this.getLayoutSingleCluster();

        // See what will fit so we get consistent rotation
        layout.node
            .def("fitInfo", null)
            .height(function(d, e, f){
                // Just iterate and get cutoff
                var fitInfo = pvc.text.getFitInfo(d.dx, d.dy, d.label, myself.font, diagMargin);
                if(!fitInfo.h){
                    if(axisDirection == 'v' && fitInfo.v){ // prefer vertical
                        vertDepthCutoff = Math.min(diagDepthCutoff, d.depth);
                    } else {
                        diagDepthCutoff = Math.min(diagDepthCutoff, d.depth);
                    }
                }

                this.fitInfo(fitInfo);

                return d.dy;
            });

        // label space (left transparent)
        // var lblBar =
        layout.node.add(pv.Bar)
            .fillStyle('rgba(127,127,127,.001)')
            .strokeStyle(function(d){
                if(d.maxDepth === 1 || !d.maxDepth) { // 0, 0.5, 1
                    return null;
                }

                return "rgba(127,127,127,0.3)"; //non-terminal items, so grouping is visible
            })
            .lineWidth( function(d){
                if(d.maxDepth === 1 || !d.maxDepth) {
                    return 0;
                }
                return 0.5; //non-terminal items, so grouping is visible
            })
            .text(function(d){
                return d.label;
            });

        //cutoffs -> snap to vertical/horizontal
        var H_CUTOFF_ANG = 0.30,
            V_CUTOFF_ANG = 1.27;
        
        var diagMargin = pvc.text.getFontSize(this.font) / 2;

        var align = isTopOrBottom ?
                    "center" :
                    (this.anchor == "left") ? "right" : "left";

        //draw labels and make them fit
        this.pvLabel = layout.label.add(pv.Label)
            .def('lblDirection','h')
            .textAngle(function(d){
                if(d.depth >= vertDepthCutoff && d.depth < diagDepthCutoff){
                    this.lblDirection('v');
                    return -Math.PI/2;
                }

                if(d.depth >= diagDepthCutoff){
                    var tan = d.dy/d.dx;
                    var angle = Math.atan(tan);
                    //var hip = Math.sqrt(d.dy*d.dy + d.dx*d.dx);

                    if(angle > V_CUTOFF_ANG){
                        this.lblDirection('v');
                        return -Math.PI/2;
                    }

                    if(angle > H_CUTOFF_ANG) {
                        this.lblDirection('d');
                        return -angle;
                    }
                }

                this.lblDirection('h');
                return 0;//horizontal
            })
            .textMargin(1)
            //override central alignment for horizontal text in vertical axis
            .textAlign(function(d){
                return (axisDirection != 'v' || d.depth >= vertDepthCutoff || d.depth >= diagDepthCutoff)? 'center' : align;
            })
            .left(function(d) {
                return (axisDirection != 'v' || d.depth >= vertDepthCutoff || d.depth >= diagDepthCutoff)?
                     d.x + d.dx/2 :
                     ((align == 'right')? d.x + d.dx : d.x);
            })
            .font(this.font)
            .text(function(d){
                var fitInfo = this.fitInfo();
                switch(this.lblDirection()){
                    case 'h':
                        if(!fitInfo.h){//TODO: fallback option for no svg
                            return pvc.text.trimToWidth(d.dx, d.label, myself.font, '..');
                        }
                        break;
                    case 'v':
                        if(!fitInfo.v){
                            return pvc.text.trimToWidth(d.dy, d.label, myself.font, '..');
                        }
                        break;
                    case 'd':
                       if(!fitInfo.d){
                          //var ang = Math.atan(d.dy/d.dx);
                          var diagonalLength = Math.sqrt(d.dy*d.dy + d.dx*d.dx) ;
                          return pvc.text.trimToWidth(diagonalLength - diagMargin, d.label, myself.font,'..');
                        }
                        break;
                }
                return d.label;
            })
            .cursor('default')
            .events('all'); //labels don't have events by default

        if(this._shouldHandleClick()){
            this.pvLabel
                .cursor("pointer")
                .event('click', function(data){
                    var ev = arguments[arguments.length - 1];
                    return myself._handleClick(data, ev);
                });
        }

        if(this.doubleClickAction){
            this.pvLabel
                .cursor("pointer")
                .event("dblclick", function(data){
                    var ev = arguments[arguments.length - 1];
                    myself._handleDoubleClick(data, ev);
                });
        }

        // tooltip
        var tipsySettings = def.set(Object.create(this.chart.options.tipsySettings),
                'gravity', tipsyGravity,
                'offset',  diagMargin * 2);
        
        this.pvLabel
            .title(function(d){
                this.instance().tooltip = d.label;
                return '';
            })
            .event("mouseover", pv.Behavior.tipsy(tipsySettings));
    },
    
    getLayoutSingleCluster: function(){
        // TODO: extend this to work with chart.orientation?
        var orientation = this.anchor,
            reverse   = orientation == 'bottom' || orientation == 'left',
            data      = this.chart.visualRoles(this.roleName)
                            .select(this.chart.data, {visible: true, reverse: reverse}),
            
            maxDepth  = data.treeHeight,
            elements  = data.nodes(),
            
            depthLength = this._layoutInfo.axisSize;
        
        this._rootElement = elements[0]; // lasso
            
        // displace to take out bogus-root
        maxDepth++;
        
        var baseDisplacement = depthLength / maxDepth,
            margin = maxDepth > 2 ? ((1/12) * depthLength) : 0;//heuristic compensation
        
        baseDisplacement -= margin;
        
        var scaleFactor = maxDepth / (maxDepth - 1),
            orthoLength = pvc.BasePanel.orthogonalLength[orientation];
        
        var displacement = (orthoLength == 'width') ?
                (orientation === 'left' ? [-baseDisplacement, 0] : [baseDisplacement, 0]) :
                (orientation === 'top'  ? [0, -baseDisplacement] : [0, baseDisplacement]);

        this.pvRule
            .strokeStyle(null)
            .lineWidth(0);

        var panel = this.pvRule
            .add(pv.Panel)
                [orthoLength](depthLength)
                .strokeStyle(null)
                .lineWidth(0) //cropping panel
            .add(pv.Panel)
                [orthoLength](depthLength * scaleFactor)
                .strokeStyle(null)
                .lineWidth(0);// panel resized and shifted to make bogus root disappear
        
        panel.transform(pv.Transform.identity.translate(displacement[0], displacement[1]));
        
        // Create with bogus-root
        // pv.Hierarchy must always have exactly one root and
        //  at least one element besides the root
        return panel.add(pv.Layout.Cluster.Fill)
                    .nodes(elements)
                    .orient(orientation);
    },
    
    _calcTipsyGravity: function(){
        switch(this.anchor){
            case 'bottom': return 's';
            case 'top':    return 'n';
            case 'left':   return 'w';
            case 'right':  return 'e';
        }
        return 's';
    }
    // end: composite axis
    /////////////////////////////////////////////////
});

pvc.AxisPanel.create = function(chart, parentPanel, cartAxis, options){
    var PanelClass = pvc[def.firstUpperCase(cartAxis.orientedId) + 'AxisPanel'] || 
        def.fail.argumentInvalid('cartAxis', "Unsupported cartesian axis");
    
    return new PanelClass(chart, parentPanel, cartAxis, options);
};

pvc.XAxisPanel = pvc.AxisPanel.extend({
    anchor: "bottom",
    panelName: "xAxis"
});

pvc.SecondXAxisPanel = pvc.XAxisPanel.extend({
    panelName: "secondXAxis"
});

pvc.YAxisPanel = pvc.AxisPanel.extend({
    anchor: "left",
    panelName: "yAxis"
});

pvc.SecondYAxisPanel = pvc.YAxisPanel.extend({
    panelName: "secondYAxis"
});

pvc.AxisTitlePanel = pvc.TitlePanelAbstract.extend({
    
    panelName: 'axis',
    
    _getFontExtension: function(){
        return this._getExtension(this.panelName + 'TitleLabel', 'font');
    },
    
    /**
     * @override
     */
    applyExtensions: function(){
        this.extend(this.pvPanel, this.panelName + 'Title_');
        this.extend(this.pvLabel, this.panelName + 'TitleLabel_');
    }
});

/*
 * Pie chart panel. Generates a pie chart. 
 * 
 * Specific options are: 
 * 
 * <i>showValues</i> - Show or hide slice value. Default: false 
 * 
 * <i>explodedSliceIndex</i> - Index of the slice which is <i>always</i> exploded, or null to explode every slice. Default: null.
 * 
 * <i>explodedOffsetRadius</i> - The radius by which an exploded slice is offset from the center of the pie (in pixels).
 * If one wants a pie with an exploded effect, specify a value in pixels here.
 * If above argument is specified, explodes only one slice, else explodes all. 
 * Default: 0
 * 
 * <i>activeOffsetRadius</i> - Percentage of slice radius to (additionally) explode an active slice.
 * Only used if the chart has option hoverable equal to true.
 * 
 * <i>innerGap</i> - The percentage of (the smallest of) the panel width or height used by the pie. 
 * Default: 0.9 (90%)
 * 
 * Deprecated in favor of options <i>contentMargins</i> and <i>contentPaddings</i>.
 * 
 * Has the following protovis extension points: 
 * <i>chart_</i> - for the main chart Panel 
 * <i>pie_</i> - for the main pie wedge 
 * <i>pieLabel_</i> - for the main pie label
 * <i>pieLinkLine_</i> - for the link lines, for when labelStyle = 'linked'
 * 
 * Example Pie Category Scene extension:
 * pie: {
 *     scenes: {
 *         category: {
 *             sliceLabelMask: "{value} ({value.percent})"
 *         }
 *     }
 * }
 */
pvc.PieChartPanel = pvc.BasePanel.extend({
    anchor: 'fill',
    
    pvPie: null,
    pvPieLabel: null,
    
    // Always exploded slices
    explodedOffsetRadius: 0,
    explodedSliceIndex:  null,
    
    // Explode when active (hoverable)
    activeOffsetRadius: new pvc.PercentValue(0.05),
    
    valueRoleName: 'value',
    
    showValues: true,
    
    // Examples:
    // "{value} ({value.percent}) {category}"
    // "{value}"
    // "{value} ({value.percent})"
    // "{#productId}" // Atom name
    valuesMask: null, 
    
    labelStyle: 'linked', // 'linked' or 'inside'
    /*
     *                                         
     *     (| elbowX)                         (| anchorX)
     *      +----------------------------------+          (<-- baseY)
     *      |                                    \
     *      |   (link outset)                      \ (targetX,Y)
     *      |                                        +----+ label
     *    -----  <-- current outer radius      |<-------->|<------------>            
     *      |   (link inset)                     (margin)   (label size)
     *      
     */
    
    labelFont: '10px sans-serif',
    
    linkedLabel: {
        /**
         * Percentage of the client radius that the 
         * link is inset in a slice.
         */
        linkInsetRadius:  new pvc.PercentValue(0.05),
        
        /**
         * Percentage of the client radius that the 
         * link extends outwards from the slice, 
         * until it reaches the link "elbow".
         */
        linkOutsetRadius: new pvc.PercentValue(0.025),
        
        /**
         * Percentage of the client width that separates 
         * a link label from the link's anchor point.
         * <p>
         * Determines the width of the link segment that 
         * connects the "anchor" point with the "target" point.
         * Includes the space for the small handle at the end.
         * </p>
         */
        linkMargin: new pvc.PercentValue(0.025),
        
        /**
         * Link handle width.
         */
        linkHandleWidth: 0.5, // em
        
        /**
         * Percentage of the client width that is reserved 
         * for labels on each of the sides.
         */
        labelSize: new pvc.PercentValue(0.15),
        
        /**
         * Minimum vertical space that separates consecutive link labels, in em units.
         */
        labelSpacingMin: 0.5 // em
    },
    
    constructor: function(chart, parent, options){
        if(!options){
            options = {};
        }
        
        var isV1Compat = chart.options.compatVersion <= 1;
        if(isV1Compat){
            if(options.labelStyle == null){
                options.labelStyle = 'inside';
            }
        }
        
        // innerGap translation to paddings
        if(options.paddings == null){
            var innerGap = options.innerGap || 0.95;
            delete options.innerGap;
            if(innerGap > 0 && innerGap < 1){
                options.paddings = Math.round((1 - innerGap) * 100 / 2 ) + "%";
            }
        }
        
        // Cast
        ['explodedOffsetRadius', 'activeOffsetRadius']
        .forEach(function(name){
            var value = options[name];
            if(value != null){
                options[name] = pvc.PercentValue.parse(value);
            }
        });
        
        var labelStyle = options.labelStyle || this.labelStyle;
        var isLinked = labelStyle === 'linked';
        var valuesMask = options.valuesMask;
        if(valuesMask == null){
            options.valuesMask = isLinked ? "{value} ({value.percent})" : "{value}";
        }
       
        if(isLinked){
            var sourceLinkedLabel = options.linkedLabel;
            if(sourceLinkedLabel){
                // Inherit from default settings
                var linkedLabel = options.linkedLabel = Object.create(this.linkedLabel);
                def.copy(linkedLabel, sourceLinkedLabel);
                
                // Cast
                ['linkInsetRadius', 'linkOutsetRadius', 'linkMargin', 'labelSize']
                .forEach(function(name){
                    var value = linkedLabel[name];
                    if(value != null){
                        linkedLabel[name] = pvc.PercentValue.parse(value);
                    }
                });
            }
        }
        
        this.base(chart, parent, options);
    },
    
    /* Layout independent and required by layout stuff only! */
    _getCoreInfo: function(){
        if(!this._coreInfo){
            this._coreInfo = {
               rootScene: this._buildScene()
            };
        }
        
        return this._coreInfo;
    },
    
    /**
     * @override
     */
    _calcLayout: function(layoutInfo){
        var clientSize   = layoutInfo.clientSize;
        var clientWidth = clientSize.width;
        var clientRadius = Math.min(clientWidth, clientSize.height) / 2;
        if(!clientRadius){
            return new pvc.Size(0,0);
        }
        
        var center = pv.vector(clientSize.width / 2, clientSize.height / 2);
        
        function resolvePercentRadius(radius){
            return def.between(pvc.PercentValue.resolve(radius, clientRadius), 0, clientRadius);
        }
        
        function resolvePercentWidth(width){
            return def.between(pvc.PercentValue.resolve(width, clientWidth), 0, clientWidth);
        }
        
        // ---------------------
        
        var labelFont = def.number.to(this._getExtension('pieLabel', 'font'));
        if(!def.string.is(labelFont)){
            labelFont = this.labelFont;
        }
        
        var maxPieRadius = clientRadius;
        
        if(this.showValues && this.labelStyle === 'linked'){
            // Reserve space for labels and links
            var linkedLabel = this.linkedLabel;
            var linkInsetRadius  = resolvePercentRadius(linkedLabel.linkInsetRadius);
            var linkOutsetRadius = resolvePercentRadius(linkedLabel.linkOutsetRadius);
            var linkMargin       = resolvePercentWidth(linkedLabel.linkMargin);
            var linkLabelSize    = resolvePercentWidth(linkedLabel.labelSize);
            
            var textMargin = def.number.to(this._getExtension('pieLabel', 'textMargin'), 3);
            var textHeight = pvc.text.getTextHeight('m', labelFont);
            
            var linkHandleWidth = linkedLabel.linkHandleWidth * textHeight; // em
            linkMargin += linkHandleWidth;
            
            var linkLabelSpacingMin = linkedLabel.labelSpacingMin * textHeight; // em
            
            var freeWidthSpace = Math.max(0, clientWidth / 2 - clientRadius);
            
            // Radius stolen to pie by link and label
            var spaceH = Math.max(0, linkOutsetRadius + linkMargin + linkLabelSize - freeWidthSpace);
            var spaceV = linkOutsetRadius + textHeight; // at least one line of text (should be half line, but this way there's a small margin...)
            
            var linkAndLabelRadius = Math.max(0, spaceV, spaceH);
            
            // Use the extra width on the label
            //linkLabelSize += freeWidthSpace / 2;
            
            if(linkAndLabelRadius >= maxPieRadius){
                this.showValues = false;
                if(pvc.debug >= 2){
                    pvc.log("Hiding linked labels due to insufficient space.");
                }
            } else {
                
                maxPieRadius -= linkAndLabelRadius;
                
                layoutInfo.link = {
                    insetRadius:   linkInsetRadius,
                    outsetRadius:  linkOutsetRadius,
                    elbowRadius:   maxPieRadius + linkOutsetRadius,
                    linkMargin:    linkMargin,
                    handleWidth:     linkHandleWidth,
                    labelSize:     linkLabelSize,
                    maxTextWidth:  linkLabelSize - textMargin,
                    labelSpacingMin: linkLabelSpacingMin,
                    textMargin:    textMargin,
                    lineHeight:    textHeight
                };
            }
        } 
        
        // ---------------------
        
        var explodedOffsetRadius = resolvePercentRadius(this.explodedOffsetRadius);
        
        var activeOffsetRadius = 0;
        if(this.chart.options.hoverable){
            activeOffsetRadius = resolvePercentRadius(this.activeOffsetRadius);
        }
        
        var effectOffsetRadius = explodedOffsetRadius + activeOffsetRadius;
        
        var normalPieRadius = maxPieRadius - effectOffsetRadius;
        if(normalPieRadius < 0){
            return new pvc.Size(0,0);
        }
        
        // ---------------------
        
        layoutInfo.center = center;
        layoutInfo.clientRadius = clientRadius;
        layoutInfo.normalRadius = normalPieRadius;
        layoutInfo.explodedOffsetRadius = explodedOffsetRadius;
        layoutInfo.activeOffsetRadius = activeOffsetRadius;
        layoutInfo.labelFont = labelFont;
    },
    
    /**
     * @override
     */
    _createCore: function(layoutInfo) {
        var myself = this;
        var chart = this.chart;
        var options = chart.options;
        var visibleKeyArgs = {visible: true};
        
        var coreInfo  = this._getCoreInfo();
        var rootScene = coreInfo.rootScene;
        
        var center    = layoutInfo.center;
        var normalRadius = layoutInfo.normalRadius;
        
        // ------------
        
        this.pvPie = new pvc.visual.PieSlice(this, this.pvPanel, {
                extensionId: 'pie',
                center: layoutInfo.center,
                activeOffsetRadius: layoutInfo.activeOffsetRadius
            })
            
            .lockValue('data', rootScene.childNodes)
            
            .override('angle', function(scene){ return scene.vars.value.angle;  })
            
            .override('baseOffsetRadius', function(){
                var explodeIndex = myself.explodedSliceIndex;
                if (explodeIndex == null || explodeIndex == this.pvMark.index) {
                    return layoutInfo.explodedOffsetRadius;
                }
                
                return this.base();
            })
            
            .lock('outerRadius', function(){ return chart.animate(0, normalRadius); })
            
            // In case the inner radius is specified, we better animate it as well
            .intercept('innerRadius', function(scene){
                var innerRadius = pvc.PercentValue.parse(this.delegate());
                if(innerRadius instanceof pvc.PercentValue){
                    innerRadius = innerRadius.resolve(this.pvMark.outerRadius());
                }
                
                return innerRadius > 0 ? chart.animate(0, innerRadius) : 0;
            }, 
            /*noCast*/ true)
            .pvMark;
        
        if(this.showValues){
            if(this.labelStyle === 'inside'){
                
                this.pvPieLabel = this.pvPie.anchor("outer").add(pv.Label)
                    .intercept('visible', function(getVisible, args){
                        var scene = args[0];
                        var angle = scene.vars.value.angle;
                        if(angle < 0.001){
                            return false;
                        }
                        
                        return !getVisible ||  getVisible.apply(null, args);
                    }, this._getExtension('pieLabel', 'visible'))
                    .localProperty('group') // for rubber band selection
                    .group(function(scene){ return scene.group; })
                    .text(function(scene) { return scene.vars.value.sliceLabel; })
                    .textMargin(10);
                
            } else if(this.labelStyle === 'linked') {
                var linkLayout = layoutInfo.link;
                
                rootScene.layoutLinkLabels(layoutInfo);
                
                this.pvLinkPanel = this.pvPanel.add(pv.Panel)
                                        .data(rootScene.childNodes)
                                        .localProperty('pieSlice')
                                        .pieSlice(function(scene){
                                            return myself.pvPie.scene[this.index];  
                                         })
                                        ;
                
                this.pvLinkLine = this.pvLinkPanel.add(pv.Line)
                                        .data(function(scene){
                                            // Calculate the dynamic dot at the 
                                            // slice's middle angle and outer radius...
                                            var pieSlice = this.parent.pieSlice();
                                            var midAngle = pieSlice.startAngle + pieSlice.angle / 2;
                                            var outerRadius = pieSlice.outerRadius - linkLayout.insetRadius;
                                            
                                            var dot = pv.vector(
                                                pieSlice.left + outerRadius * Math.cos(midAngle),
                                                pieSlice.top  + outerRadius * Math.sin(midAngle));
                                            
                                            return [dot].concat(scene.vars.link.dots);
                                        })
                                        .lock('visible')
                                        .top (function(dot){ return dot.y; })
                                        .left(function(dot){ return dot.x; })
                                        .strokeStyle('black')
                                        .lineWidth(0.5)
                                        ;
                
                this.pvPieLabel = this.pvLinkPanel.add(pv.Label)
                                        .data(function(scene){ return scene.vars.link.labelLines; })
                                        .lock('visible')
                                        .localProperty('group') // for rubber band selection
                                        .group(function(textLine, scene){ return scene.group; })
                                        .left(function(textLine, scene){ return scene.vars.link.labelX; })
                                        .top( function(textLine, scene){ return scene.vars.link.labelY + ((this.index + 1) * linkLayout.lineHeight); })
                                        .textAlign(function(textLine, scene){ return scene.vars.link.labelAnchor; })
                                        .textBaseline('bottom')
                                        .textMargin(linkLayout.textMargin)
                                        .text(def.identity)
                                        .fillStyle('red')
                                        ;
                
                if(this._shouldHandleClick()){
                    this.pvPieLabel
                        .events('all');
                    
                    this._addPropClick(this.pvPieLabel);
                }
                
                // <Debug>
                if(pvc.debug >= 20){
                    this.pvPanel.add(pv.Panel)
                        .zOrder(-10)
                        .left(layoutInfo.center.x - layoutInfo.clientRadius)
                        .top(layoutInfo.center.y - layoutInfo.clientRadius)
                        .width(layoutInfo.clientRadius * 2)
                        .height(layoutInfo.clientRadius * 2)
                        .strokeStyle('red')
                    ;
                    
                    // Client Area
                    this.pvPanel
                        .strokeStyle('green');
                    
                    var linkColors = pv.Colors.category10();
                    this.pvLinkLine
                        .segmented(true)
                        .strokeStyle(function(){ return linkColors(this.index); });
                }
                // </Debug>
            }
            
            this.pvPieLabel
                .font(layoutInfo.labelFont);
        }
    },
    
    applyExtensions: function(){
        this.extend(this.pvPie, "pie_");
        this.extend(this.pvPieLabel, "pieLabel_");
        this.extend(this.pvLinkLine, "pieLinkLine_");
        
        this.extend(this.pvPanel, "chart_");
    },
    
    /**
     * Renders this.pvBarPanel - the parent of the marks that are affected by selection changes.
     * @override
     */
    _renderInteractive: function(){
        this.pvPanel.render();
    },

    /**
     * Returns an array of marks whose instances are associated to a datum, or null.
     * @override
     */
    _getSignums: function(){
        var signums = [this.pvPie];
        if(this.pvPieLabel){
            signums.push(this.pvPieLabel);
        }
        
        return signums;
    },
    
    _buildScene: function(){
        var rootScene  = new pvc.visual.PieRootScene(this);
        
        // legacy property
        this.sum = rootScene.vars.sumAbs.value;
        
        return rootScene;
    }
});

def
.type('pvc.visual.PieRootScene', pvc.visual.Scene)
.init(function(panel){
    var chart = panel.chart;
    var data = chart.visualRoles('category').flatten(chart.data, pvc.data.visibleKeyArgs);
    
    this.base(null, {panel: panel, group: data});
    
    // ---------------
    
    var valueRoleName = panel.valueRoleName;
    var valueDimName  = chart.visualRoles(valueRoleName).firstDimensionName();
    var valueDim      = data.dimensions(valueDimName);
    
    var options = chart.options;
    var percentValueFormat = options.percentValueFormat;
    
    var rootScene = this;
    var sumAbs = 0;
    
    /* Create category scene sub-class */
    var CategSceneClass = def.type(pvc.visual.PieCategoryScene)
        .init(function(categData, value){
            
            // Adds to parent scene...
            this.base(rootScene, {group: categData});
            
            this.vars.category = new pvc.visual.ValueLabelVar(
                    categData.value, 
                    categData.label);

            sumAbs += Math.abs(value);
            
            this.vars.value = new pvc.visual.ValueLabelVar(
                            value,
                            formatValue(value, categData));
        });
    
    /* Extend with any user extensions */
    panel._extendSceneType('category', CategSceneClass, ['sliceLabel', 'sliceLabelMask']);
    
    /* Create child category scenes */
    data.children().each(function(categData){
        // Value may be negative
        // Don't create 0-value scenes
        var value = categData.dimensions(valueDimName).sum(pvc.data.visibleKeyArgs);
        if(value !== 0){
            new CategSceneClass(categData, value);
        }
    });
    
    // -----------
    
    // TODO: should this be in something like: chart.axes.angle.scale ?
    this.angleScale = pv.Scale
                        .linear(0, sumAbs)
                        .range(0, 2 * Math.PI)
                        .by1(Math.abs);
    
    this.vars.sumAbs = new pvc.visual.ValueLabelVar(sumAbs, formatValue(sumAbs));
    
    this.childNodes.forEach(function(categScene){
        completeBuildCategScene.call(categScene);
    });
    
    function formatValue(value, categData){
        if(categData){
            var datums = categData._datums;
            if(datums.length === 1){
                // Prefer to return the already formatted/provided label
                return datums[0].atoms[valueDimName].label;
            }
        }
        
        return valueDim.format(value);
    }
    
    /** 
     * @private 
     * @instance pvc.visual.PieCategoryScene
     */
    function completeBuildCategScene(){
        var valueVar = this.vars.value;
        
        // Calculate angle (span)
        valueVar.angle = this.parent.angleScale(valueVar.value);
        
        // Create percent sub-var of the value var
        var percent = Math.abs(valueVar.value) / sumAbs;
        
        valueVar.percent = new pvc.visual.ValueLabelVar(
                percent,
                percentValueFormat(percent));
        
        // Calculate slice label
        valueVar.sliceLabel = this.sliceLabel();
    }
})
.add({
    layoutLinkLabels: function(layoutInfo){
        var startAngle = -Math.PI / 2;
        
        var leftScenes  = [];
        var rightScenes = [];
        
        this.childNodes.forEach(function(categScene){
            startAngle = categScene.layoutI(layoutInfo, startAngle);
            
            (categScene.vars.link.dir > 0 ? rightScenes : leftScenes)
            .push(categScene);
        });
        
        // Distribute left and right labels and finish their layout
        this._distributeLabels(-1, leftScenes,  layoutInfo);
        this._distributeLabels(+1, rightScenes, layoutInfo);
    },
    
    _distributeLabels: function(dir, scenes, layoutInfo){
        // Initially, for each category scene, 
        //   targetY = elbowY
        // Taking additionally labelHeight into account,
        //  if this position causes overlapping, find a != targetY
        //  that does not cause overlap.
        
        // Sort scenes by Y position
        scenes.sort(function(sceneA, sceneB){
            return def.compare(sceneA.vars.link.targetY, sceneB.vars.link.targetY);
        });
        
        /*jshint expr:true */
        this._distributeLabelsDownwards(scenes, layoutInfo) &&
        this._distributeLabelsUpwards  (scenes, layoutInfo) &&
        this._distributeLabelsEvenly   (scenes, layoutInfo);
        
        scenes.forEach(function(categScene){
            categScene.layoutII(layoutInfo);
        });
    },
    
    _distributeLabelsDownwards: function(scenes, layoutInfo){
        var linkLayout = layoutInfo.link;
        var labelSpacingMin = linkLayout.labelSpacingMin;
        var yMax = layoutInfo.clientSize.height;
        var overlapping = false;
        for(var i = 0, J = scenes.length - 1 ; i < J ; i++){
            var linkVar0 = scenes[i].vars.link;
            
            if(!i && linkVar0.labelTop() < 0){
                overlapping = true;
            }
            
            var linkVar1 = scenes[i + 1].vars.link;
            var labelTopMin1 = linkVar0.labelBottom() + labelSpacingMin;
            if (linkVar1.labelTop() < labelTopMin1) {
                
                var halfLabelHeight1 = linkVar1.labelHeight / 2;
                var targetY1 = labelTopMin1 + halfLabelHeight1;
                var targetYMax = yMax - halfLabelHeight1;
                if(targetY1 > targetYMax){
                    overlapping = true;
                    linkVar1.targetY = targetYMax;
                } else {
                    linkVar1.targetY = targetY1;
                }
            }
        }
        
        return overlapping;
    },
    
    _distributeLabelsUpwards: function(scenes, layoutInfo){
        var linkLayout = layoutInfo.link;
        var labelSpacingMin = linkLayout.labelSpacingMin;
        
        var overlapping = false;
        for(var i = scenes.length - 1 ; i > 0 ; i--){
            var linkVar1 = scenes[i - 1].vars.link;
            var linkVar0 = scenes[i].vars.link;
            if(i === 1 && linkVar1.labelTop() < 0){
                overlapping = true;
            }
            
            var labelBottomMax1 = linkVar0.labelTop() - labelSpacingMin;
            if (linkVar1.labelBottom() > labelBottomMax1) {
                var halfLabelHeight1 = linkVar1.labelHeight / 2;
                var targetY1   = labelBottomMax1 - halfLabelHeight1;
                var targetYMin = halfLabelHeight1;
                if(targetY1 < targetYMin){
                    overlapping = true;
                    linkVar1.targetY = targetYMin;
                } else {
                    linkVar1.targetY = targetY1;                    
                }
            }
        }
        
        return overlapping;
    },
    
    _distributeLabelsEvenly: function(scenes, layoutInfo){
        var linkLayout = layoutInfo.link;
        var labelSpacingMin = linkLayout.labelSpacingMin;
        
        var totalHeight = 0;
        scenes.forEach(function(categScene){
            totalHeight += categScene.vars.link.labelHeight;
        });
        
        var freeSpace = layoutInfo.clientSize.height - totalHeight; // may be < 0
        var labelSpacing = freeSpace;
        if(scenes.length > 1){
            labelSpacing /= (scenes.length - 1);
        }
        
        var y = 0;
        scenes.forEach(function(scene){
            var linkVar = scene.vars.link;
            var halfLabelHeight = linkVar.labelHeight / 2;
            y += halfLabelHeight;
            linkVar.targetY = y;
            y += halfLabelHeight + labelSpacing;
        });
        
        return true;
    }
});

def
.type('pvc.visual.PieLinkLabelVar')
.add({
    labelTop: function(){
        return this.targetY - this.labelHeight / 2;
    },
    
    labelBottom: function(){
        return this.targetY + this.labelHeight / 2;
    }
});

def
.type('pvc.visual.PieCategoryScene', pvc.visual.Scene)
.add({
    // extendable
    sliceLabelMask: function(){
        return this.panel().valuesMask;
    },
    
    // extendable
    sliceLabel: function(){
        return this.format(this.sliceLabelMask());
    },
    
    layoutI: function(layoutInfo, startAngle){
        var valueVar = this.vars.value;
        var endAngle = startAngle + valueVar.angle;
        var midAngle = (startAngle + endAngle) / 2;
        
        // Overwrite existing link var, if any.
        var linkVar = (this.vars.link = new pvc.visual.PieLinkLabelVar());
        
        var linkLayout = layoutInfo.link;
        
        var labelLines = pvc.text.justify(valueVar.sliceLabel, linkLayout.maxTextWidth, layoutInfo.labelFont);
        linkVar.labelLines  = labelLines;
        linkVar.labelHeight = labelLines.length * linkLayout.lineHeight;
        
        var cosMid = Math.cos(midAngle);
        var sinMid = Math.sin(midAngle);
        
        var isAtRight = cosMid >= 0;
        var dir = isAtRight ? 1 : -1;
        
        // Label anchor is at the side with opposite name to the side of the pie where it is placed.
        linkVar.labelAnchor = isAtRight ?  'left' : 'right'; 
        
        var center = layoutInfo.center;
        var elbowRadius = linkLayout.elbowRadius;
        var elbowX = center.x + elbowRadius * cosMid;
        var elbowY = center.y + elbowRadius * sinMid; // baseY
        
        var anchorX = center.x + dir * elbowRadius;
        var targetX = anchorX + dir * linkLayout.linkMargin;
        
        linkVar.dots = [
            pv.vector(elbowX,  elbowY),
            pv.vector(anchorX, elbowY)
        ];
        
        linkVar.elbowY  = elbowY;
        linkVar.targetY = elbowY + 0;
        linkVar.targetX = targetX;
        linkVar.dir = dir;
        
        return endAngle;
    },
    
    layoutII: function(layoutInfo){
        var linkVar = this.vars.link;
        
        var targetY = linkVar.targetY;
        var targetX = linkVar.targetX;
        var dots = linkVar.dots;
        var handleWidth = layoutInfo.link.handleWidth;
        if(handleWidth > 0){
            dots.push(pv.vector(targetX - linkVar.dir * handleWidth, targetY));
        }
        
        dots.push(pv.vector(targetX, targetY));
        
        linkVar.labelX = targetX;
        linkVar.labelY = targetY - linkVar.labelHeight/2;
    }
});
/**
 * PieChart is the main class for generating... pie charts (surprise!).
 */
pvc.PieChart = pvc.BaseChart.extend({

    pieChartPanel: null,
    legendSource: 'category',

    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        this._addVisualRoles({
            category: { isRequired: true, defaultDimensionName: 'category*', autoCreateDimension: true },
            
            /* value: required, continuous, numeric */
            value:  { 
                isMeasure:  true,
                isRequired: true,
                isPercent:  true,
                requireSingleDimension: true, 
                requireIsDiscrete: false,
                valueType: Number, 
                defaultDimensionName: 'value' 
            }
        });
    },
    
    _preRenderContent: function(contentOptions) {

        this.base();

        if(pvc.debug >= 3){
            pvc.log("Prerendering in pieChart");
        }
        
        var options = this.options;
        
        this.pieChartPanel = new pvc.PieChartPanel(this, this.basePanel, def.create(contentOptions, {
            innerGap: options.innerGap,
            explodedOffsetRadius: options.explodedSliceRadius,
            explodedSliceIndex: options.explodedSliceIndex,
            activeOffsetRadius: options.activeSliceRadius,
            showValues:  options.showValues,
            valuesMask:  options.valuesMask,
            labelStyle:  options.valuesLabelStyle,
            linkedLabel: options.linkedLabel,
            labelFont:   options.valuesLabelFont,
            scenes:      def.getPath(options, 'pie.scenes')
        }));
    },
    
    defaults: def.create(pvc.BaseChart.prototype.defaults, {
//      showValues: undefined,
//      innerGap: undefined,
//      
//      explodedSliceRadius: undefined,
//      explodedSliceIndex: undefined,
//      activeSliceRadius: undefined,
//      
//      valuesMask: undefined, // example: "{value} ({value.percent})"
//      pie: undefined, // pie options object
//      
//      valuesLabelFont:  undefined,
//      valuesLabelStyle: undefined,
//      
//      linkedLabel: undefined
//      
//      // tipsySettings: def.create(pvc.BaseChart.defaultOptions.tipsySettings, { offset: 15, gravity: 'se' })
    })
});

/**
 * Bar Abstract Panel.
 * The base panel class for bar charts.
 * 
 * Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showValues</i> - Show or hide bar value. Default: false
 * <i>barSizeRatio</i> - In multiple series, percentage of inner
 * band occupied by bars. Default: 0.9 (90%)
 * <i>maxBarSize</i> - Maximum size (width) of a bar in pixels. Default: 2000
 *
 * Has the following protovis extension points:
 * <i>chart_</i> - for the main chart Panel
 * <i>bar_</i> - for the actual bar
 * <i>barPanel_</i> - for the panel where the bars sit
 * <i>barLabel_</i> - for the main bar label
 */
pvc.BarAbstractPanel = pvc.CartesianAbstractPanel.extend({
    
    pvBar: null,
    pvBarLabel: null,
    pvCategoryPanel: null,
    pvSecondLine: null,
    pvSecondDot: null,

    data: null,

    barSizeRatio: 0.9,
    maxBarSize: 200,
    showValues: true,
    barWidth: null,
    barStepWidth: null,
    _linePanel: null,

    constructor: function(chart, parent, options){
        this.base(chart, parent, options);

        // Cache
        options = this.chart.options;
        this.stacked = options.stacked;
    },
    
    _creating: function(){
        // Register BULLET legend prototype marks
        var groupScene = this.defaultVisibleBulletGroupScene();
        if(groupScene && !groupScene.hasRenderer()){
            var colorAxis = groupScene.colorAxis;
            if(colorAxis.option('DrawMarker')){
                var keyArgs = {
                    drawMarker:    true,
                    markerShape:   colorAxis.option('Shape'),
                    drawRule:      colorAxis.option('DrawLine'),
                    markerPvProto: new pv.Mark()
                };
                
                this.extend(keyArgs.markerPvProto, 'bar_', {constOnly: true});
                
                groupScene.renderer(
                    new pvc.visual.legend.BulletItemDefaultRenderer(keyArgs));
            }
        }
    },
    
    /**
     * @override
     */
    _createCore: function(){
        this.base();
         
        var chart = this.chart,
            options = chart.options,
            isStacked = !!this.stacked,
            isVertical = this.isOrientationVertical();
        
        var data = this._getVisibleData(), // shared "categ then series" grouped data
            seriesData = chart._serRole.flatten(data),
            rootScene = this._buildScene(data, seriesData)
            ;

        var orthoScale = chart.axes.ortho.scale,
            orthoZero  = orthoScale(0),
            sceneOrthoScale = chart.axes.ortho.sceneScale({sceneVarName: 'value', nullToZero: false}),
            
            bandWidth = chart.axes.base.scale.range().band,
            barStepWidth = chart.axes.base.scale.range().step,
            barWidth,

            reverseSeries = isVertical === isStacked // (V && S) || (!V && !S)
            ;

        if(isStacked){
            barWidth = bandWidth;
        } else {
            var S = seriesData.childCount();
            barWidth = S > 0 ? (bandWidth * this.barSizeRatio / S) : 0;
        }
        
        if (barWidth > this.maxBarSize) {
            barWidth = this.maxBarSize;
        }

        this.barWidth  = barWidth;
        this.barStepWidth = barStepWidth;
        
        this.pvBarPanel = this.pvPanel.add(pv.Layout.Band)
            .layers(rootScene.childNodes) // series -> categories
            .values(function(seriesScene){ return seriesScene.childNodes; })
            .orient(isVertical ? 'bottom-left' : 'left-bottom')
            .layout(isStacked  ? 'stacked' : 'grouped')
            .verticalMode(this._barVerticalMode())
            .yZero(orthoZero)
            .band // categories
                .x(chart.axes.base.sceneScale({sceneVarName: 'category'}))
                .w(bandWidth)
                .differentialControl(this._barDifferentialControl())
            .item
                // Stacked Vertical bar charts show series from
                // top to bottom (according to the legend)
                .order(reverseSeries ? "reverse" : null)
                .h(function(scene){
                    /* May be negative */
                    var h = sceneOrthoScale(scene);
                    return h != null ? chart.animate(0, h - orthoZero) : null;
                })
                .w(barWidth)
                .horizontalRatio(this.barSizeRatio)
                .verticalMargin(options.barStackedMargin || 0)
            .end
            ;

        this.pvBar = new pvc.visual.Bar(this, this.pvBarPanel.item, {
                extensionId: 'bar',
                freePosition: true
            })
            .lockDimensions()
            .pvMark
            .antialias(false);
            ;

        this._addOverflowMarkers();
        
        if(this.showValues){
            this.pvBarLabel = this.pvBar.anchor(this.valuesAnchor || 'center')
                .add(pv.Label)
                .localProperty('_valueVar')
                ._valueVar(function(scene){
                    return options.showValuePercentage ?
                            scene.vars.value.percent :
                            scene.vars.value;
                })
                .visible(function() { //no space for text otherwise
                    var length = this.scene.target[this.index][isVertical ? 'height' : 'width'];
                    // Too small a bar to show any value?
                    return length >= 4;
                })
                .text(function(){
                    return this._valueVar().label;
                });
        }
    },

    /**
     * Called to obtain the bar verticalMode property value.
     * If it returns a function,
     * that function will be called once.
     * @virtual
     */
    _barVerticalMode: function(){
        return null;
    },

    /**
     * Called to obtain the bar differentialControl property value.
     * If it returns a function,
     * that function will be called once per category,
     * on the first series.
     * @virtual
     */
    _barDifferentialControl: function(){
        return null;
    },
    
    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        // Extend bar and barPanel
        this.extend(this.pvBarPanel, "barPanel_");
        this.extend(this.pvBar, "bar_");

        this.extend(this.pvUnderflowMarker, "barUnderflowMarker_");
        this.extend(this.pvOverflowMarker,  "barOverflowMarker_");

        this.extend(this.pvBarLabel, "barLabel_");
        
        if(this._linePanel){
            this.extend(this._linePanel.pvLine, "barSecondLine_");
            this.extend(this._linePanel.pvDot,  "barSecondDot_" );
        }
    },

    _addOverflowMarkers: function(){
        var orthoAxis = this.chart.axes.ortho;
        if(orthoAxis.option('FixedMax') != null){
            this.pvOverflowMarker = this._addOverflowMarker(false, orthoAxis.scale);
        }

        if(orthoAxis.option('FixedMin') != null){
            this.pvUnderflowMarker = this._addOverflowMarker(true, orthoAxis.scale);
        }
    },

    _addOverflowMarker: function(isMin, orthoScale){
        /* NOTE: pv.Bar is not a panel,
         * and as such markers will be children of bar's parent,
         * yet have bar's anchor as a prototype.
         */
        // TODO - restore overflow markers asap
//        var myself = this,
//            isVertical = this.isOrientationVertical(),
//            orthoProp = isVertical ? "bottom" : "left",
//            lengthProp = myself.anchorOrthoLength(orthoProp),
//            orthoLengthProp = myself.anchorLength(orthoProp),
//            rOrthoBound = isMin ?
//                        (orthoScale.min - orthoScale.offsetMin) :
//                        (orthoScale.max + orthoScale.offsetMax),
//        
//            angle;
//
//        if(!isMin){
//            angle = isVertical ? Math.PI: -Math.PI/2;
//        } else {
//            angle = isVertical ? 0: Math.PI/2;
//        }
//        
//        return this.pvBar.anchor('center').add(pv.Dot)
//            .visible(function(scene){
//                var value = scene.vars.value.value;
//                if(value == null){
//                    return false;
//                }
//
//                var targetInstance = this.scene.target[this.index];
//                // Where is the position of the max of the bar??
//                var orthoMaxPos = targetInstance[orthoProp] +
//                                  (value > 0 ? targetInstance[lengthProp] : 0);
//                return isMin ?
//                        (orthoMaxPos < rOrthoBound) :
//                        (orthoMaxPos > rOrthoBound);
//            })
//            .shape("triangle")
//            .lock('shapeSize')
//            .shapeRadius(function(){
//                return Math.min(
//                        Math.sqrt(10),
//                        this.scene.target[this.index][orthoLengthProp] / 2);
//            })
//            .shapeAngle(angle)
//            .lineWidth(1.5)
//            .strokeStyle("red")
//            .fillStyle("white")
//            [orthoProp](function(){
//                return rOrthoBound + (isMin ? 1 : -1) * (this.shapeRadius() + 2);
//            })
//            [this.anchorOpposite(orthoProp)](null)
//            ;
    },

    /**
     * Renders this.pvPanel - the parent of the marks that are affected by selection changes.
     * @override
     */
    _renderInteractive: function(){
        this.pvPanel.render();
    },

    /**
     * Returns an array of marks whose instances are associated to a datum, or null.
     * @override
     */
    _getSignums: function(){
        return [this.pvBar];
    },

    _buildScene: function(data, seriesData){
        var rootScene  = new pvc.visual.Scene(null, {panel: this, group: data}),
            categDatas = data._children;

        /**
         * Create starting scene tree
         */
        seriesData
            .children()
            .each(createSeriesScene, this);

        return rootScene;

        function createSeriesScene(seriesData1){
            /* Create series scene */
            var seriesScene = new pvc.visual.Scene(rootScene, {group: seriesData1}),
                seriesKey   = seriesData1.key;

            this._onNewSeriesScene(seriesScene, seriesData1);

            categDatas.forEach(function(categData1){
                /* Create leaf scene */
                var categKey = categData1.key,
                    group = data._childrenByKey[categKey]._childrenByKey[seriesKey],

                    /* If there's no group, provide, at least, a null datum */
                    datum = group ? null : createNullDatum(seriesData1, categData1),
                    scene = new pvc.visual.Scene(seriesScene, {group: group, datum: datum});

                this._onNewSeriesCategoryScene(scene, categData1, seriesData1);
            }, this);
        }

        function createNullDatum(serData1, catData1) {
            // Create a null datum with col and row coordinate atoms
            var atoms = def.array.append(
                            def.own(serData1.atoms),
                            def.own(catData1.atoms));

            return new pvc.data.Datum(data, atoms, true);
        }
    },

    _onNewSeriesScene: function(seriesScene, seriesData1){
        seriesScene.vars.series = new pvc.visual.ValueLabelVar(
            seriesData1.value,
            seriesData1.label);
    },

    _onNewSeriesCategoryScene: function(categScene, categData1, seriesData1){
        var categVar = categScene.vars.category = new pvc.visual.ValueLabelVar(
            categData1.value, categData1.label);
        
        categVar.group = categData1;
        
        var chart = this.chart,
            valueDim = categScene.group ?
                            categScene
                                .group
                                .dimensions(chart._valueDim.name) :
                            null;

        var value = valueDim ? valueDim.sum({visible: true, zeroIfNone: false}) : null;

        var valueVar = 
            categScene.vars.value = new pvc.visual.ValueLabelVar(
                                    value, 
                                    chart._valueDim.format(value));
        
        // TODO: Percent formatting?
        if(chart.options.showValuePercentage) {
            if(value == null){
                valueVar.percent = new pvc.visual.ValueLabelVar(null, valueVar.label);
            } else {
                var valuePct = valueDim.percentOverParent({visible: true});
                
                valueVar.percent = new pvc.visual.ValueLabelVar(
                                        valuePct,
                                        chart.options.percentValueFormat.call(null, valuePct));
            }
        }

        categScene.isNull = !categScene.group; // A virtual scene?
    }
});
/**
 * BarAbstract is the base class for generating charts of the bar family.
 */
pvc.BarAbstract = pvc.CategoricalAbstract.extend({

    constructor: function(options){

        this.base(options);

        var parent = this.parent;
        if(parent) {
            this._valueRole = parent._valueRole;
        }
    },

    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        this._addVisualRoles({
            /* value: required, continuous, numeric */
            value:  {
                isMeasure: true,
                isRequired: true,
                isPercent: this.options.stacked,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: 'value'
            }
        });

        this._valueRole = this.visualRoles('value');
    },

    _initData: function(){
        this.base.apply(this, arguments);

        var data = this.data;

        // Cached
        this._valueDim = data.dimensions(this._valueRole.firstDimensionName());
    },
    defaults: def.create(pvc.CategoricalAbstract.prototype.defaults, {
        showValues:   true,
        barSizeRatio: 0.9,   // for grouped bars
        maxBarSize:   2000,
        barStackedMargin: 0, // for stacked bars
        valuesAnchor: "center",
        showValuePercentage: false
    })
});/**
 * Bar Panel.
 */
pvc.BarPanel = pvc.BarAbstractPanel.extend({
});
/**
 * BarChart is the main class for generating... bar charts (another surprise!).
 */
pvc.BarChart = pvc.BarAbstract.extend({

    _processOptionsCore: function(options){
        
        this.base(options);
        
        if(options.secondAxis && !options.showLines && !options.showDots && !options.showAreas){
            options.showLines = true;
        }
    },
    
    _hasDataPartRole: function(){
        return true;
    },
    
    _getAxisDataCells: function(axisType, axisIndex){
        if(this.options.secondAxis){
            var dataPartValues;
            
            if(axisType === 'ortho'){
                // Collect visual roles
                dataPartValues = this.options.secondAxisIndependentScale ?
                    // Separate scales =>
                    // axis ortho 0 represents data 0
                    // axis ortho 1 represents data 1
                    (''+axisIndex) :
                    // Common scale => axis ortho 0 represents both data parts
                    ['0', '1']
                    ;
            } else if(axisType === 'color'){
                dataPartValues = (''+axisIndex);
            }
            
            if(dataPartValues != null){
                return this._buildAxisDataCells(axisType, axisIndex, dataPartValues);
            }
        }
        
        return this.base(axisType, axisIndex);
    },
    
    _isDataCellStacked: function(role, dataPartValue){
        return (!dataPartValue || (dataPartValue === '0')) && this.options.stacked;
    },

    /**
     * @override 
     */
    _createMainContentPanel: function(parentPanel){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in barChart");
        }
        
        var options = this.options;
        var barPanel = new pvc.BarPanel(this, parentPanel, {
            colorAxis:      this.axes.color,
            dataPartValue:  options.secondAxis ? '0' : null,
            barSizeRatio: options.barSizeRatio,
            maxBarSize:   options.maxBarSize,
            showValues:   options.showValues,
            valuesAnchor: options.valuesAnchor,
            orientation:  options.orientation
        });

        if(options.secondAxis){
            if(pvc.debug >= 3){
                pvc.log("Creating LineDotArea panel.");
            }
            
            var linePanel = new pvc.LineDotAreaPanel(this, parentPanel, {
                colorAxis:      this.axes.color2,
                dataPartValue:  '1',
                stacked:        false,
                showValues:     !(options.compatVersion <= 1) && options.showValues,
                valuesAnchor:   options.valuesAnchor != 'center' ? options.valuesAnchor : 'right',
                showLines:      options.showLines,
                showDots:       options.showDots,
                showAreas:      options.showAreas,
                orientation:    options.orientation,
                nullInterpolationMode: options.nullInterpolationMode
            });

            this._linePanel = linePanel;
            
            barPanel._linePanel = linePanel;
        }
        
        return barPanel;
    },
    
    defaults: def.create(pvc.BarAbstract.prototype.defaults, {
        showDots: true,
        showLines: true,
        showAreas: false,
        nullInterpolationMode: 'none'
    })
});

/**
 * Normalized Bar Panel.
 */
pvc.NormalizedBarPanel = pvc.BarAbstractPanel.extend({
    _barVerticalMode: function(){
        return 'expand';
    }
});
/**
 * A NormalizedBarChart is a 100% stacked bar chart.
 */
pvc.NormalizedBarChart = pvc.BarAbstract.extend({

    constructor: function(options){

        options = def.set(options, 'stacked', true);

        this.base(options);
    },

    /**
     * Processes options after user options and default options have been merged.
     * @override
     */
    _processOptionsCore: function(options){

        options.stacked = true;

        this.base(options);
    },

    /**
     * @override
     */
    _getVisibleValueExtentConstrained: function(axis, min, max){
        if(axis.type === 'ortho') {
            /* 
             * Forces showing 0-100 in the axis.
             * Note that the bars are stretched automatically by the band layout,
             * so this scale ends up being ignored by the bars.
             * Note also that each category would have a different scale,
             * so it isn't possible to provide a single correct scale,
             * that would satisfy all the bars...
             */
            min = 0;
            max = 100;
        }

        return this.base(axis, min, max);
    },

    /* @override */
    _createMainContentPanel: function(parentPanel){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in NormalizedBarChart");
        }
        
        var options = this.options;
        return new pvc.NormalizedBarPanel(this, parentPanel, {
            barSizeRatio: options.barSizeRatio,
            maxBarSize:   options.maxBarSize,
            showValues:   options.showValues,
            valuesAnchor: options.valuesAnchor,
            orientation:  options.orientation
        });
    }
});
/**
 * Waterfall chart panel.
 * Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showValues</i> - Show or hide bar value. Default: false
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
pvc.WaterfallPanel = pvc.BarAbstractPanel.extend({
    pvWaterfallLine: null,
    ruleData: null,

    /**
     * Called to obtain the bar differentialControl property value.
     * If it returns a function,
     * that function will be called once per category,
     * on the first series.
     * @virtual
     */
    _barDifferentialControl: function(){
        var isFalling = this.chart._isFalling;

        /*
         * From protovis help:
         *
         * Band differential control pseudo-property.
         *  2 - Drawn starting at previous band offset. Multiply values by  1. Don't update offset.
         *  1 - Drawn starting at previous band offset. Multiply values by  1. Update offset.
         *  0 - Reset offset to 0. Drawn starting at 0. Default. Leave offset at 0.
         * -1 - Drawn starting at previous band offset. Multiply values by -1. Update offset.
         * -2 - Drawn starting at previous band offset. Multiply values by -1. Don't update offset.
         */
        return function(scene){
            if(isFalling && !this.index){
                // First falling bar is the main total
                // Must be accounted up and update the total
                return 1;
            }

            if(scene.vars.category.group._isFlattenGroup){
                // Groups don't update the total
                // Groups, always go down, except the first falling...
                return -2;
            }
            
            return isFalling ? -1 : 1;
        };
    },

    _createCore: function(){

        this.base();

        var chart = this.chart,
            options = chart.options,
            isVertical = this.isOrientationVertical(),
            anchor = isVertical ? "bottom" : "left",
            ao = this.anchorOrtho(anchor),
            ruleRootScene = this._buildRuleScene(),
            orthoScale = chart.axes.ortho.scale,
            orthoPanelMargin = 0.04 * (orthoScale.range()[1] - orthoScale.range()[0]),
            orthoZero = orthoScale(0),
            sceneOrthoScale = chart.axes.ortho.sceneScale({sceneVarName: 'value'}),
            sceneBaseScale  = chart.axes.base.sceneScale({sceneVarName: 'category'}),
            baseScale = chart.axes.base.scale,
            barWidth2 = this.barWidth/2,
            barWidth = this.barWidth,
            barStepWidth = this.barStepWidth,
            isFalling = chart._isFalling,
            waterColor = chart._waterColor
            ;

        if(chart.options.showWaterGroupAreas){
            var panelColors = pv.Colors.category10();
            var waterGroupRootScene = this._buildWaterGroupScene();
            
            this.pvWaterfallGroupPanel = this.pvPanel.add(pv.Panel)
                .data(waterGroupRootScene.childNodes)
                .zOrder(-1)
                .fillStyle(function(scene){
                    return panelColors(0)/* panelColors(scene.vars.category.level - 1)*/.alpha(0.15);
                })
                [ao](function(scene){
                    var categVar = scene.vars.category;
                    return baseScale(categVar.leftValue) - barStepWidth / 2;
                })
                [this.anchorLength(anchor)](function(scene){
                    var categVar = scene.vars.category,
                        length = Math.abs(baseScale(categVar.rightValue) -
                                baseScale(categVar.leftValue))
                        ;

                    return length + barStepWidth;
                })
                [anchor](function(scene){
                    return orthoScale(scene.vars.value.bottomValue) - orthoPanelMargin/2;
                })
                [this.anchorOrthoLength(anchor)](function(scene){
                    return orthoScale(scene.vars.value.heightValue) + orthoPanelMargin;
                    //return chart.animate(orthoZero, orthoScale(scene.categ) - orthoZero);
                })
                ;
        }
        
        this.pvBar
            .sign
            .override('baseColor', function(type){
                var color = this.base(type);
                if(type === 'fill'){
                    if(this.scene.vars.category.group._isFlattenGroup){
                        return pv.color(color).alpha(0.75);
                    }
                }
                
                return color;
            })
            ;
        
        this.pvWaterfallLine = new pvc.visual.Rule(this, this.pvPanel, {
                extensionId: 'barWaterfallLine',
                noTooltips:  false,
                noHover:   false,
                noSelect:  false,
                noClick:       false,
                noDoubleClick: false
            })
            .lockValue('data', ruleRootScene.childNodes)
            .optional('visible', function(){
                return ( isFalling && !!this.scene.previousSibling) ||
                       (!isFalling && !!this.scene.nextSibling);
            })
            .optional(anchor, function(){ 
                return orthoZero + chart.animate(0, sceneOrthoScale(this.scene) - orthoZero);
            })
            .optionalValue(this.anchorLength(anchor), barStepWidth + barWidth)
            .optional(ao,
                isFalling ?
                    function(){ return sceneBaseScale(this.scene) - barStepWidth - barWidth2; } :
                    function(){ return sceneBaseScale(this.scene) - barWidth2; })
            .override('baseColor', function(){ return this.delegate(waterColor); })
            .pvMark
            .lineCap('round')
            ;

        if(chart.options.showWaterValues){
            this.pvWaterfallLabel = this.pvWaterfallLine
                .add(pv.Label)
                [anchor](function(scene){
                    return orthoZero + chart.animate(0, sceneOrthoScale(scene) - orthoZero);
                })
                .visible(function(scene){
                     if(scene.vars.category.group._isFlattenGroup){
                         return false;
                     }

                     return isFalling || !!scene.nextSibling;
                 })
                [this.anchorOrtho(anchor)](sceneBaseScale)
                .textAlign(isVertical ? 'center' : 'left')
                .textBaseline(isVertical ? 'bottom' : 'middle')
                .textStyle(pv.Color.names.darkgray.darker(2))
                .textMargin(5)
                .text(function(scene){ return scene.vars.value.label; });
        }
    },

    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        this.extend(this.pvWaterfallLine,       "barWaterfallLine_");
        this.extend(this.pvWaterfallLabel,      "barWaterfallLabel_");
        this.extend(this.pvWaterfallGroupPanel, "barWaterfallGroup_");
    },

    _buildRuleScene: function(){
        var rootScene  = new pvc.visual.Scene(null, {panel: this, group: this._getVisibleData()});
        
        /**
         * Create starting scene tree
         */
        if(this.chart._ruleInfos){
            this.chart._ruleInfos
                .forEach(createCategScene, this);
        }
        
        return rootScene;

        function createCategScene(ruleInfo){
            var categData1 = ruleInfo.group,
                categScene = new pvc.visual.Scene(rootScene, {group: categData1});

            var categVar = 
                categScene.vars.category = 
                    new pvc.visual.ValueLabelVar(
                                categData1.value,
                                categData1.label);
            
            categVar.group = categData1;
            
            var value = ruleInfo.offset;
            categScene.vars.value = new pvc.visual.ValueLabelVar(
                                value,
                                this.chart._valueDim.format(value));
        }
    },

    _buildWaterGroupScene: function(){
        var chart = this.chart,
            ruleInfos = this.chart._ruleInfos,
            ruleInfoByCategKey = ruleInfos && def.query(ruleInfos)
                                  .object({
                                      name:  function(ruleInfo){ return ruleInfo.group.absKey; },
                                      value: function(ruleInfo){ return ruleInfo; }
                                  }),
            isFalling = chart._isFalling,
            rootCatData = chart._catRole.select(
                            chart.partData(this.dataPartValue),
                            {visible: true}),
            rootScene  = new pvc.visual.Scene(null, {panel: this, group: rootCatData});

        if(ruleInfoByCategKey){
            createCategSceneRecursive(rootCatData, 0);
        }
        
        return rootScene;

        function createCategSceneRecursive(catData, level){
            var children = catData.children()
                                  .where(function(child){ return child.key !== ""; })
                                  .array();
            if(children.length){
                // Group node
                if(level){
                    var categScene = new pvc.visual.Scene(rootScene, {group: catData});

                    var categVar = 
                        categScene.vars.category = 
                            new pvc.visual.ValueLabelVar(
                                    catData.value,
                                    catData.label);
                    
                    categVar.group = catData;
                    categVar.level = level;

                    var valueVar = categScene.vars.value = {}; // TODO: Not A Var
                    var ruleInfo = ruleInfoByCategKey[catData.absKey];
                    var offset = ruleInfo.offset,
                        range = ruleInfo.range,
                        height = -range.min + range.max
                        ;

                    if(isFalling){
                        var lastChild = lastLeaf(catData);
                        var lastRuleInfo = ruleInfoByCategKey[lastChild.absKey];
                        categVar.leftValue  = ruleInfo.group.value;
                        categVar.rightValue = lastRuleInfo.group.value;
                        valueVar.bottomValue = offset - range.max;

                    } else {
                        var firstChild = firstLeaf(catData);
                        var firstRuleInfo = ruleInfoByCategKey[firstChild.absKey];
                        categVar.leftValue = firstRuleInfo.group.value;
                        categVar.rightValue = ruleInfo.group.value;
                        valueVar.bottomValue = offset - range.max;
                    }

                    valueVar.heightValue = height;
                }

                children.forEach(function(child){
                    createCategSceneRecursive(child, level + 1);
                });
            }
        }

        function firstLeaf(data){
            var firstChild = data._children && data._children[0];
            return firstChild ? firstLeaf(firstChild) : data;
        }

        function lastLeaf(data){
            var lastChild = data._children && data._children[data._children.length - 1];
            return lastChild ? lastLeaf(lastChild) : data;
        }
    }
});
/**
 * WaterfallChart is the class that generates waterfall charts.
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
pvc.WaterfallChart = pvc.BarAbstract.extend({

    _isFalling: true,
    _ruleInfos: null,
    _waterColor: pv.Color.names.darkblue,//darkblue,darkslateblue,royalblue,seagreen, //pv.color("#808285").darker(),

    constructor: function(options){

        this.base(options);
        
        var parent = this.parent;
        if(parent) {
            this._isFalling = parent._isFalling;
        }
    },

    /**
     * Processes options after user options and default options have been merged.
     * @override
     */
    _processOptionsCore: function(options){

        // Waterfall charts are always stacked
        options.stacked = true;
        if(options.showWaterValues === undefined){
            options.showWaterValues = options.showValues;
        }

        // Doesn't work (yet?)
        options.useCompositeAxis = false;

        this.base(options);
    },

    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();

        this._isFalling = (this.options.waterDirection === 'down');
        
        this._catRole.setFlatteningMode(this._isFalling ? 'tree-pre' : 'tree-post');
        this._catRole.setFlattenRootLabel(this.options.allCategoryLabel);
    },

    _initLegendScenes: function(){
        
        this.base();

        var strokeStyle = this._getExtension("barWaterfallLine", "strokeStyle");
        if(strokeStyle && !def.fun.is(strokeStyle)){
            this._waterColor = pv.color(strokeStyle);
        }

        this._addLegendGroup({
            id:        "waterfallTotalLine",
            type:      "discreteColorAndShape",
            items:     [{
                value: null,
                label: this.options.accumulatedLineLabel,
                color: this._waterColor,
                shape: 'bar',
                isOn:  def.retTrue,
                click: null
            }]
        });
    },
    
    /**
     * Reduce operation of category ranges, into a global range.
     *
     * Propagates the total value.
     *
     * Also creates the array of rule information {@link #_ruleInfos}
     * used by the waterfall panel to draw the rules.
     *
     * Supports {@link #_getVisibleValueExtent}.
     */
    _reduceStackedCategoryValueExtent: function(result, catRange, catGroup){
        /*
         * That min + max are the variation of this category
         * relies on the concrete base._getStackedCategoryValueExtent() implementation...
         * Max always contains the sum of positives, if any, or 0
         * Min always contains the sum of negatives, if any, or 0
         * max >= 0
         * min <= 0
         */
        /*
         * When falling, the first category is surely *the* global total.
         * When falling, the first category must set the initial offset
         * and, unlike every other category group such that _isFlattenGroup===true,
         * it does contribute to the offset, and positively.
         * The offset property accumulates the values.
         */
        var offset, negOffset;
        if(!result){
            if(catRange){
                offset    = catRange.max;
                negOffset = catRange.min;
                this._ruleInfos = [{
                    offset: offset,
                    negOffset: negOffset,
                    group:  catGroup,
                    range:  catRange
                }];

                // Copy the range object
                return {
                    min: catRange.min,
                    max: catRange.max,
                    offset: offset,
                    negOffset: negOffset
                };
            }

            return null;
        }

        offset = result.offset;
        negOffset = result.negOffset;
        if(this._isFalling){
            this._ruleInfos.push({
                offset: offset,
                negOffset: negOffset,
                group:  catGroup,
                range:  catRange
            });
        }

        if(!catGroup._isFlattenGroup){
            var dir = this._isFalling ? -1 : 1;

            offset    = result.offset    = offset    + dir * catRange.max;
            negOffset = result.negOffset = negOffset - dir * catRange.min;

            if(negOffset < result.min){
                result.min = negOffset;
            }

            if(offset > result.max){
                result.max = offset;
            }
        }

        if(!this._isFalling){
            this._ruleInfos.push({
                offset: offset,
                negOffset: negOffset,
                group:  catGroup,
                range:  catRange
            });
        }
        
        return result;
    },
    
    /* @override */
    _createMainContentPanel: function(parentPanel){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in WaterfallChart");
        }
        
        var options = this.options;
        
        return new pvc.WaterfallPanel(this, parentPanel, {
            waterfall:    options.waterfall,
            barSizeRatio: options.barSizeRatio,
            maxBarSize:   options.maxBarSize,
            showValues:   options.showValues,
            orientation:  options.orientation
        });
    },
    
    defaults: def.create(pvc.BarAbstract.prototype.defaults, {
        // down or up
        waterDirection: 'down',
//        showWaterValues: undefined, // defaults to showValues
        showWaterGroupAreas: true,
        allCategoryLabel: "All",
        accumulatedLineLabel: "Accumulated"
    })
});
/*
 * LineDotArea panel.
 * Class that draws all line/dot/area combinations.
 * Specific options are:
 * <i>showDots</i> - Show or hide dots. Default: true
 * <i>showAreas</i> - Show or hide dots. Default: false
 * <i>showLines</i> - Show or hide dots. Default: true
 * <i>showValues</i> - Show or hide line value. Default: false
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>line_</i> - for the actual line
 * <i>linePanel_</i> - for the panel where the lines sit
 * <i>lineDot_</i> - the dots on the line
 * <i>lineLabel_</i> - for the main line label
 */
pvc.LineDotAreaPanel = pvc.CartesianAbstractPanel.extend({
    anchor: 'fill',
    stacked: false,
    pvLine: null,
    pvArea: null,
    pvDot: null,
    pvLabel: null,
    pvScatterPanel: null, // TODO: change this name!
    
    showLines: true,
    showDots: true,
    showValues: true,
    
    valuesAnchor: "right",
    valueRoleName: null,
    
    nullInterpolationMode: 'linear',
    
    _creating: function(){
        // Register BULLET legend prototype marks
        var groupScene = this.defaultVisibleBulletGroupScene();
        if(groupScene && !groupScene.hasRenderer()){
            var colorAxis = groupScene.colorAxis;
            var drawMarker = def.nullyTo(colorAxis.option('DrawMarker', true), this.showDots  || this.showAreas);
            var drawRule   = def.nullyTo(colorAxis.option('DrawLine',   true), this.showLines && !this.showAreas);
            if(drawMarker || drawRule){
                var keyArgs = {};
                if((keyArgs.drawMarker = drawMarker)){
                    var markerShape = colorAxis.option('Shape', true);
                    
                    if(this.showDots){
                        if(!markerShape){ 
                            markerShape = 'circle'; // Dot's default shape
                        }
                        
                        keyArgs.markerPvProto = new pv.Dot()
                                .lineWidth(1.5)
                                .shapeSize(12);
                    } else {
                        keyArgs.markerPvProto = new pv.Mark();
                    }
                    
                    keyArgs.markerShape = markerShape;
                    
                    this.extend(keyArgs.markerPvProto, 'dot_', {constOnly: true});
                }
                
                if((keyArgs.drawRule = drawRule)){
                    keyArgs.rulePvProto = new pv.Line()
                            .lineWidth(1.5);
                    
                    this.extend(keyArgs.rulePvProto, 'line_', {constOnly: true});
                }
                
                groupScene.renderer(
                    new pvc.visual.legend.BulletItemDefaultRenderer(keyArgs));
            }
        }
    },
    
    /**
     * @override
     */
    _createCore: function(){
        this.base();
        
        this.valueRoleName = this.chart.axes.ortho.role.name;

        var myself = this,
            chart = this.chart,
            options = chart.options,
            isStacked = this.stacked,
            showDots  = this.showDots,
            showAreas = this.showAreas,
            showLines = this.showLines,
            anchor = this.isOrientationVertical() ? "bottom" : "left";

        // ------------------
        // DATA
        var isBaseDiscrete = chart._catRole.grouping.isDiscrete(),
            data = this._getVisibleData(), // shared "categ then series" grouped data
            isDense = !(this.width > 0) || (data._children.length / this.width > 0.5), //  > 100 categs / 200 pxs
            rootScene = this._buildScene(data, isBaseDiscrete);

        // Disable selection?
        if(isDense && (options.selectable || options.hoverable)) {
            options.selectable = false;
            options.hoverable  = false;
            if(pvc.debug >= 3) {
                pvc.log("Warning: Disabling selection and hovering because the chart is to \"dense\".");
            }
        }
       
        // ---------------
        // BUILD
        if(showAreas){
            // Areas don't look good above the axes
            this.pvPanel.zOrder(-7);
        } else {
            // // Above axes
            this.pvPanel.zOrder(1);
        }
        
        this.pvScatterPanel = this.pvPanel.add(pv.Panel)
            .lock('data', rootScene.childNodes)
            ;
        
        // -- AREA --
        var areaFillColorAlpha = showAreas && showLines && !isStacked ? 0.5 : null;
        
        this.pvArea = new pvc.visual.Area(this, this.pvScatterPanel, {
                extensionId: 'area',
                antialias:   showAreas && !showLines,
                segmented:   !isDense,
                noTooltips:  false,
                noHover: false // While the area itself does not change appearance, the pvLine does due to activeSeries... 
            })
            
            .lock('visible', def.retTrue)
            
            /* Data */
            .lock('data',   function(seriesScene){ return seriesScene.childNodes; }) // TODO
            
            /* Position & size */
            .override('x',  function(){ return this.scene.basePosition;  })
            .override('y',  function(){ return this.scene.orthoPosition; })
            .override('dy', function(){ return chart.animate(0, this.scene.orthoLength); })
            
            /* Color & Line */
            .override('color', function(type){
                return showAreas ? this.base(type) : null;
            })
            .override('baseColor', function(type){
                var color = this.base(type);
                if(color && !this.hasDelegate() && areaFillColorAlpha != null){
                    color = color.alpha(areaFillColorAlpha);
                }
                
                return color;
            })
            .override('fixAntialiasStrokeWidth', function(){
                // Hide a vertical line from 0 to the alone dot
                // Hide horizontal lines of nulls near zero
                if(this.scene.isNull || this.scene.isAlone) {
                     return 0;
                }

                return this.base();
            })
            .pvMark
            ;
        
        // -- LINE --
        var showDotsOnly = showDots && !showLines && !showAreas,
            
            /* When not showing lines, but showing areas,
             * we copy the area fillStyle so that
             * the line can cover the area and not be noticed.
             * We need this to hide the ladder 
             * on the border of the area, 
             * due to not using antialias.
             * 
             * When the scene has the active series,
             * the line is shown "highlighted" anyway.
             */
            lineCopiesAreaColor = !showLines && showAreas,
            
            /* When areas are shown with no alpha (stacked), 
             * make dots darker so they get 
             * distinguished from areas. 
             */
            darkerLineAndDotColor = isStacked && showAreas;
        
        function lineAndDotNormalColor(type){
            var color = this.base(type);
            if(color && darkerLineAndDotColor && !this.hasDelegate()){
                color = color.darker(0.6);
            }
            
            return color;
        }
        
        this.pvLine = new pvc.visual.Line(
            this, 
            this.pvArea.anchor(this.anchorOpposite(anchor)), 
            {
                extensionId: 'line',
                freePosition: true
            })
            /* 
             * Line.visible =
             *  a) showLines
             *     or
             *  b) (!showLines and) showAreas
             *      and
             *  b.1) discrete base and stacked
             *       and
             *       b.1.1) not null or is an intermediate null
             *  b.2) not null
             */
            .lock('visible',
                    showDotsOnly ? 
                    def.retFalse : 
                    (isBaseDiscrete && isStacked ? 
                    function(){ return !this.scene.isNull || this.scene.isIntermediate; } :
                    function(){ return !this.scene.isNull; })
            )
            
            /* Color & Line */
            .override('color', function(type){
                if(lineCopiesAreaColor && !this.scene.isActiveSeries()) {
                    // This obtains the color of the same index area
                    return myself.pvArea.fillStyle();
                }
                
                return this.base(type);
            })
            .override('baseColor', lineAndDotNormalColor)
            .override('baseStrokeWidth', function(){
                var strokeWidth;
                if(showLines){
                    strokeWidth = this.base();
                }
                
                return strokeWidth == null ? 1.5 : strokeWidth; 
            })
            .pvMark
            ;
        
           
        // -- DOT --
        var showAloneDots = !(showAreas && isBaseDiscrete && isStacked);
        
        this.pvDot = new pvc.visual.Dot(this, this.pvLine, {
                extensionId: 'dot',
                freePosition: true
            })
            .intercept('visible', function(){
                var scene = this.scene;
                return (!scene.isNull && !scene.isIntermediate && !scene.isInterpolated) && 
                       this.delegate(true);
            })
            .override('color', function(type){
                /* 
                 * Handle showDots
                 * -----------------
                 * Despite !showDots,
                 * show a dot anyway when:
                 * 1) it is active, or
                 * 2) it is single  (the only dot in its series and there's only one category) (and in areas+discreteCateg+stacked case)
                 * 3) it is alone   (surrounded by null dots) (and not in areas+discreteCateg+stacked case)
                 */
                if(!showDots){
                    var visible = this.scene.isActive ||
                                  (!showAloneDots && this.scene.isSingle) ||
                                  (showAloneDots && this.scene.isAlone);
                    if(!visible) {
                        return pvc.invisibleFill;
                    }
                }
                
                // Follow normal logic
                return this.base(type);
            })
            .override('baseColor', lineAndDotNormalColor)
            .override('baseSize', function(){
                /* When not showing dots, 
                 * but a datum is alone and 
                 * wouldn't be visible using lines or areas,  
                 * show the dot anyway, 
                 * with a size = to the line's width^2
                 * (ideally, a line would show as a dot when only one point?)
                 */
                if(!showDots) {
                    var visible = this.scene.isActive ||
                                  (!showAloneDots && this.scene.isSingle) ||
                                  (showAloneDots && this.scene.isAlone);
                    
                    if(visible && !this.scene.isActive) {
                        // Obtain the line Width of the "sibling" line
                        var lineWidth = Math.max(myself.pvLine.lineWidth(), 0.2) / 2;
                        return lineWidth * lineWidth;
                    }
                }
                
                return this.base();
            })
            .pvMark
            ;
        
        // -- LABEL --
        if(this.showValues){
            this.pvLabel = this.pvDot
                .anchor(this.valuesAnchor)
                .add(pv.Label)
                // ------
                .bottom(0)
                .text(function(scene){ return scene.vars.value.label; })
                ;
        }
    },

    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        this.extend(this.pvScatterPanel, "scatterPanel_");
        this.extend(this.pvArea,  "area_");
        this.extend(this.pvLine,  "line_");
        this.extend(this.pvDot,   "dot_");
        this.extend(this.pvLabel, "label_");
        this.extend(this.pvLabel, "lineLabel_");
    },

    /**
     * Renders this.pvScatterPanel - the parent of the marks that are affected by interaction changes.
     * @override
     */
    _renderInteractive: function(){
        this.pvScatterPanel.render();
    },

    /**
     * Returns an array of marks whose instances are associated to a datum or group, or null.
     * @override
     */
    _getSignums: function(){
        var marks = [];
        
        marks.push(this.pvDot);
        
        if(this.showLines || this.showAreas){
            marks.push(this.pvLine);
        }
        
        return marks;
    },
  
    _buildScene: function(data, isBaseDiscrete){
        var rootScene  = new pvc.visual.Scene(null, {panel: this, group: data}),
            categDatas = data._children,
            interpolate = this.nullInterpolationMode === 'linear';
        
        var chart = this.chart,
            valueDim = data.owner.dimensions(chart.axes.ortho.role.firstDimensionName()),
            firstCategDim = !isBaseDiscrete ? data.owner.dimensions(chart.axes.base.role.firstDimensionName()) : null,
            isStacked = this.stacked,
            visibleKeyArgs = {visible: true, zeroIfNone: false},
            /* TODO: BIG HACK */
            orthoScale = this.dataPartValue !== '1' ?
                            chart.axes.ortho.scale :
                            chart.axes.ortho2.scale,
                        
            orthoNullValue = def.scope(function(){
                var domain = orthoScale.domain(),
                    dmin = domain[0],
                    dmax = domain[1];
                if(dmin * dmax >= 0) {
                    // Both positive or negative or either is zero
                    return dmin >= 0 ? dmin : dmax;
                }
                
                return 0;
            }),
            orthoZero = orthoScale(0),
            sceneBaseScale = chart.axes.base.sceneScale({sceneVarName: 'category'});
        
        /* On each series, scenes for existing categories are interleaved with intermediate scenes.
         * 
         * Protovis Dots are only shown for main (non-intermediate) scenes.
         * 
         * The desired effect is that selecting a dot selects half of the
         * line on the left and half of the line on the right.
         *  
         *  * main scene
         *  + intermediate scene
         *  - line that starts from the previous scene
         *  
         *  
         *        * - + - * - + - *
         *            [-------[
         *                ^ line extent of a dot
         *             
         * Each segment of a Protovis segmented line starts from the initial point 
         * till just before the next point.
         * 
         * So, selecting a dot must select the the line that starts on the 
         * main dot, but also the line that starts on the previous intermediate dot.
         * 
         * If a main dot shares its datums (or group) with its preceding
         * intermediate dot, the selection will work like so.
         * 
         * -------
         * 
         * Another influencing concern is interpolation.
         * 
         * The desired effect is that any two dots separated by a number of missing/null
         * categories get connected by linearly interpolating the missing values.
         * Moreover, the left half of the new line should be selected
         * when the left dot is selected and the right half of the new line
         * should be selected when the right dot is selected .
         * 
         * In the discrete-base case, the "half of the line" point always coincides
         *  a) with the point of an existing category (when count of null categs is odd)
         *  or 
         *  b) with an intermediate point added afterwards (when count of null categs is even).
         * 
         *  a) Interpolate missing/null category in S1 (odd case)
         *  mid point ----v
         *  S1    * - + - 0 - + - * - + - * 
         *  S2    * - + - * - + - * - + - *
         *  Data  A   A   B   B   B   B   C
         *  
         *  a) Interpolate missing/null category in S1 (even case)
         *    mid point ------v
         *  S1    * - + - 0 - + - 0 - + - * - + - * 
         *  S2    * - + - * - + - * - + - * - + - *
         *  Data  A   A   A   B   B   B   B
         *  
         * In the continuous-base case, 
         * the middle point between two non-null categories 
         * separated by missing/null categories in between,
         * does not, in general, coincide with the position of an existing category...
         * 
         * As such, interpolation may add new "main" points (to all the series),
         * and interpolation of one series leads to the interpolation
         * on a series that did not initially need interpolation... 
         * 
         * Interpolated dots to the left of the mid point are bound to 
         * the left data and interpolated dots to the right and 
         * including the mid point are bound to the right data. 
         */
        
        var reversedSeriesScenes = createSeriesScenes.call(this),
            seriesCount = reversedSeriesScenes.length;
        
        // 1st pass
        // Create category infos array.
        var categInfos = categDatas.map(createCategInfo, this);
        
        function createCategInfo(categData1, categIndex){
            
            var categKey = categData1.key;
            var seriesInfos = []; // of this category
            var categInfo = {
                data: categData1,
                value: categData1.value,
                label: categData1.label,
                isInterpolated: false,
                seriesInfos: seriesInfos,
                index: categIndex
            };
            
            reversedSeriesScenes.forEach(function(seriesScene){
                var group = data._childrenByKey[categKey];
                var seriesData1 = seriesScene.vars.series.value == null ? null : seriesScene.group;
                if(seriesData1){
                    group = group._childrenByKey[seriesData1.key];
                }
                
                var value = group ? group.dimensions(valueDim.name).sum(visibleKeyArgs) : null;
                var seriesInfo = {
                    data:   seriesData1,
                    group:  group,
                    value:  value,
                    isNull: value == null,
                    categ:  categInfo
                };
                
                seriesInfos.push(seriesInfo);
            }, this);
            
            return categInfo;
        }
        
        // --------------
        // 2nd pass
        // --------------
        
        // ~ isBaseDiscrete, firstCategDim
        var Interpolation = def
        .type()
        .init(function(categInfos){
            this._categInfos = categInfos;
            this._outCategInfos = [];
            
            this._seriesCount = categInfos.length > 0 ? categInfos[0].seriesInfos.length : 0;
            
            this._seriesStates = def
                .range(0, this._seriesCount)
                .select(function(seriesIndex){ 
                    return new InterpolationSeriesState(this, seriesIndex); 
                }, this)
                .array();
            
            // Determine the sort order of the continuous base categories
            // Categories assumed sorted.
            if(!isBaseDiscrete && categInfos.length >= 2){
                if((+categInfos[1].value) >= (+categInfos[0].value)){
                    this._comparer = def.compare;
                } else {
                    this._comparer = function(b, a){ return def.compare(a, b); };
                }
            }
        })
        .add({
            interpolate: function(){
                var categInfo;
                while((categInfo = this._categInfos.shift())){
                    categInfo.seriesInfos.forEach(this._visitSeries, this);
                    
                    this._outCategInfos.push(categInfo);
                }
                
                return this._outCategInfos;
            },
            
            _visitSeries: function(seriesInfo, seriesIndex){
                this._seriesStates[seriesIndex].visit(seriesInfo);                
            },
            
            firstNonNullOfSeries: function(seriesIndex){
                var categIndex = 0,
                    categCount = this._categInfos.length;
                
                while(categIndex < categCount){
                    var categInfo = this._categInfos[categIndex++];
                    if(!categInfo.isInterpolated){
                        var seriesInfo = categInfo.seriesInfos[seriesIndex];
                        if(!seriesInfo.isNull){
                            return seriesInfo;
                        }
                    }
                }
            },
            
            _setCategory: function(categValue){
                /*jshint expr:true  */
                !isBaseDiscrete || def.assert("Only for continuous base.");
                
                // Insert sort into this._categInfos
                
                function getCategValue(categInfo){ 
                    return +categInfo.value; 
                }
                
                // Check if and where to insert
                var index = def.array.binarySearch(
                                this._categInfos, 
                                +categValue, 
                                this._comparer, 
                                getCategValue);
                if(index < 0){
                    // New category
                    // Insert at the two's complement of index
                    var categInfo = {
                        value: firstCategDim.type.cast(categValue), // possibly creates a Date object
                        isInterpolated: true
                    };
                    
                    categInfo.label = firstCategDim.format(categInfo.value);
                        
                    categInfo.seriesInfos = def
                        .range(0, this._seriesCount)
                        .select(function(seriesScene, seriesIndex){
                            return {
                                value:  null,
                                isNull: true,
                                categ:  categInfo
                            };
                        })
                        .array();
                    
                    this._categInfos.splice(~index, 0, categInfo);
                }
                
                return index;
            }
        });
        
        // ~ isBaseDiscrete, isStacked
        var InterpolationSeriesState = def
        .type()
        .init(function(interpolation, seriesIndex){
            this.interpolation = interpolation;
            this.index = seriesIndex;
            
            this._lastNonNull(null);
        })
        .add({
            visit: function(seriesInfo){
                if(seriesInfo.isNull){
                    this._interpolate(seriesInfo);
                } else {
                    this._lastNonNull(seriesInfo);
                }
            },
            
            _lastNonNull: function(seriesInfo){
                if(arguments.length){
                    this.__lastNonNull = seriesInfo; // Last non-null
                    this.__nextNonNull = undefined;
                }
                
                return this.__lastNonNull;
            },
            
            _nextNonNull: function(){
                return this.__nextNonNull;
            },
            
            _initInterpData: function(){
                if(this.__nextNonNull !== undefined){
                    return;
                }
                
                var next = this.__nextNonNull = this.interpolation.firstNonNullOfSeries(this.index) || null;
                var last = this.__lastNonNull;
                if(next && last){
                    var fromValue  = last.value;
                    var toValue    = next.value;
                    var deltaValue = toValue - fromValue;
                    
                    if(isBaseDiscrete){
                        var stepCount = next.categ.index - last.categ.index;
                        /*jshint expr:true */
                        (stepCount >= 2) || def.assert("Must have at least one interpolation point.");
                        
                        this._stepValue   = deltaValue / stepCount;
                        this._middleIndex = ~~(stepCount / 2); // Math.floor <=> ~~
                        
                        var dotCount = (stepCount - 1);
                        this._isOdd  = (dotCount % 2) > 0;
                    } else {
                        var fromCateg  = +last.categ.data.value;
                        var toCateg    = +next.categ.data.value;
                        var deltaCateg = toCateg - fromCateg;
                        
                        this._steep = deltaValue / deltaCateg; // should not be infinite, cause categories are different
                        
                        this._middleCateg = (toCateg + fromCateg) / 2;
                        
                        // (Maybe) add a category
                        this.interpolation._setCategory(this._middleCateg);
                    }
                }
            },
            
            _interpolate: function(seriesInfo){
                this._initInterpData();
                
                var next = this.__nextNonNull;
                var last = this.__lastNonNull;
                if(!next && !last){
                    return;
                }
                
                var value;
                var group;
                var isInterpolatedMiddle;
                if(next && last){
                    if(isBaseDiscrete){
                        var groupIndex = (seriesInfo.categ.index - last.categ.index);
                        value = last.value + groupIndex * this._stepValue;
                        
                        if(this._isOdd){
                            group = groupIndex < this._middleIndex ? last.group : next.group;
                            isInterpolatedMiddle = groupIndex === this._middleIndex;
                        } else {
                            group = groupIndex <= this._middleIndex ? last.group : next.group;
                            isInterpolatedMiddle = false;
                        }
                        
                    } else {
                        var categ = +seriesInfo.categ.value;
                        var lastCateg = +last.categ.data.value;
                        
                        value = last.value + this._steep * (categ - lastCateg);
                        group = categ < this._middleCateg ? last.group : next.group;
                        isInterpolatedMiddle = categ === this._middleCateg;
                    }
                } else {
                    // Only "stretch" ends on stacked visualization
                    if(!isStacked) {
                        return;
                    }
                    
                    var the = next || last;
                    value = the.value;
                    group = the.group;
                    isInterpolatedMiddle = false;
                }
                
                seriesInfo.group  = group;
                seriesInfo.value  = value;
                seriesInfo.isNull = false;
                seriesInfo.isInterpolated = true;
                seriesInfo.isInterpolatedMiddle = isInterpolatedMiddle;
            }
        });
        
        if(interpolate){
            categInfos = new Interpolation(categInfos).interpolate();
        }
        
        /**
         * Create child category scenes of each series scene.
         */
        reversedSeriesScenes.forEach(createSeriesSceneCategories, this);
        
        /** 
         * Update the scene tree to include intermediate leaf-scenes,
         * to help in the creation of lines and areas. 
         */
        var belowSeriesScenes2; // used below, by completeSeriesScenes
        reversedSeriesScenes.forEach(completeSeriesScenes, this);
        
        /** 
         * Trim leading and trailing null scenes.
         */
        reversedSeriesScenes.forEach(trimNullSeriesScenes, this);
        
        return rootScene;
        
        function createSeriesScenes(){
            if(chart._serRole && chart._serRole.grouping){
                chart._serRole
                    .flatten(data)
                    .children()
                    .each(createSeriesScene, this);
            } else {
                createSeriesScene.call(this, null);
            }
            
            // reversed so that "below == before" w.r.t. stacked offset calculation
            return rootScene.children().reverse().array();
        }
        
        function createSeriesScene(seriesData1){
            /* Create series scene */
            var seriesScene = new pvc.visual.Scene(rootScene, {group: seriesData1 || data});

            seriesScene.vars.series = new pvc.visual.ValueLabelVar(
                        seriesData1 ? seriesData1.value : null,
                        seriesData1 ? seriesData1.label : "");
        }

        function createSeriesSceneCategories(seriesScene, seriesIndex){
            
            categInfos.forEach(createCategScene, this);
            
            function createCategScene(categInfo){
                var seriesInfo = categInfo.seriesInfos[seriesIndex];
                var group = seriesInfo.group;
                var value = seriesInfo.value;
                
                /* If there's no group, provide, at least, a null datum */
                var datum = group ? 
                            null : 
                            createNullDatum(
                                    seriesInfo.data || seriesScene.group, 
                                    categInfo.data  );
                
                // ------------
                
                var scene = new pvc.visual.Scene(seriesScene, {group: group, datum: datum});
                scene.vars.category = new pvc.visual.ValueLabelVar(categInfo.value, categInfo.label);
                
                var valueVar = new pvc.visual.ValueLabelVar(
                                    value, 
                                    valueDim.format(value));
                
                /* accumulated value, for stacked */
                valueVar.accValue = value != null ? value : orthoNullValue;
                
                scene.vars.value = valueVar;
                
                scene.isInterpolatedMiddle = seriesInfo.isInterpolatedMiddle;
                scene.isInterpolated = seriesInfo.isInterpolated;
                scene.isNull = seriesInfo.isNull;
                scene.isIntermediate = false;
            }
        }

        function completeSeriesScenes(seriesScene) {
            var seriesScenes2 = [],
                seriesScenes = seriesScene.childNodes, 
                fromScene,
                notNullCount = 0,
                firstAloneScene = null;
            
            /* As intermediate nodes are added, 
             * seriesScene.childNodes array is changed.
             * 
             * The var 'toChildIndex' takes inserts into account;
             * its value is always the index of 'toScene' in 
             * seriesScene.childNodes.
             */
            for(var c = 0, /* category index */
                    toChildIndex = 0, 
                    categCount = seriesScenes.length ; 
                c < categCount ;
                c++, 
                toChildIndex++) {
                
                var toScene = seriesScenes[toChildIndex],
                    c2 = c * 2; /* doubled category index, for seriesScenes2  */
                
                seriesScenes2[c2] = toScene;
                
                /* Complete toScene */
                completeMainScene.call(this,
                        fromScene, 
                        toScene,
                        /* belowScene */
                        belowSeriesScenes2 && belowSeriesScenes2[c2]);
                
                if(toScene.isAlone && !firstAloneScene){
                    firstAloneScene = toScene;
                }
                
                if(!toScene.isNull){
                    notNullCount++;
                }
                
                /* Possibly create intermediate scene 
                 * (between fromScene and toScene) 
                 */
                if(fromScene) {
                    var interScene = createIntermediateScene.call(this,
                            seriesScene,
                            fromScene, 
                            toScene,
                            toChildIndex,
                            /* belowScene */
                            belowSeriesScenes2 && belowSeriesScenes2[c2 - 1]);
                    
                    if(interScene){
                        seriesScenes2[c2 - 1] = interScene;
                        toChildIndex++;
                    }
                }
                
                // --------
                
                fromScene = toScene;
            }
            
            if(notNullCount === 1 && firstAloneScene && categCount === 1){
                firstAloneScene.isSingle = true;
            }
            
            if(isStacked){
                belowSeriesScenes2 = seriesScenes2;
            } 
        }
        
        function completeMainScene( 
                      fromScene, 
                      toScene, 
                      belowScene){
            
            var toAccValue = toScene.vars.value.accValue;
            
            if(belowScene) {
                if(toScene.isNull && !isBaseDiscrete) {
                    toAccValue = orthoNullValue;
                } else {
                    toAccValue += belowScene.vars.value.accValue;
                }
                
                toScene.vars.value.accValue = toAccValue;
            }
            
            toScene.basePosition  = sceneBaseScale(toScene);
            toScene.orthoPosition = orthoZero;
            toScene.orthoLength   = orthoScale(toAccValue) - orthoZero;
            
            var isNullFrom = (!fromScene || fromScene.isNull),
                isAlone    = isNullFrom && !toScene.isNull;
            if(isAlone) {
                // Confirm, looking ahead
                var nextScene = toScene.nextSibling;
                isAlone  = !nextScene || nextScene.isNull;
            }
            
            toScene.isAlone  = isAlone;
            toScene.isSingle = false;
        }
        
        function createIntermediateScene(
                     seriesScene, 
                     fromScene, 
                     toScene, 
                     toChildIndex,
                     belowScene){
            
            var interIsNull = fromScene.isNull || toScene.isNull;
            if(interIsNull && !this.showAreas) {
                return null;
            }
            
            var interValue, interAccValue, interBasePosition;
                
            if(interIsNull) {
                /* Value is 0 or the below value */
                if(belowScene && isBaseDiscrete) {
                    var belowValueVar = belowScene.vars.value;
                    interAccValue = belowValueVar.accValue;
                    interValue = belowValueVar[this.valueRoleName];
                } else {
                    interValue = interAccValue = orthoNullValue;
                }
                
                if(isStacked && isBaseDiscrete) {
                    // The intermediate point is at the start of the "to" band
                    interBasePosition = toScene.basePosition - (sceneBaseScale.range().band / 2);
                } else if(fromScene.isNull) { // Come from NULL
                    // Align directly below the (possibly) non-null dot
                    interBasePosition = toScene.basePosition;
                } else /*if(toScene.isNull) */{ // Go to NULL
                    // Align directly below the non-null from dot
                    interBasePosition = fromScene.basePosition;
                } 
//                    else {
//                        interBasePosition = (toScene.basePosition + fromScene.basePosition) / 2;
//                    }
            } else {
                var fromValueVar = fromScene.vars.value,
                    toValueVar   = toScene.vars.value;
                
                interValue = (toValueVar.value + fromValueVar.value) / 2;
                
                // Average of the already offset values
                interAccValue     = (toValueVar.accValue  + fromValueVar.accValue ) / 2;
                interBasePosition = (toScene.basePosition + fromScene.basePosition) / 2;
            }
            
            //----------------
            
            var interScene = new pvc.visual.Scene(seriesScene, {
                    /* insert immediately before toScene */
                    index: toChildIndex,
                    group: toScene.isInterpolatedMiddle ? fromScene.group: toScene.group, 
                    datum: toScene.group ? null : toScene.datum
                });
            
            interScene.vars.category = toScene.vars.category;
            
            var interValueVar = new pvc.visual.ValueLabelVar(
                                    interValue,
                                    valueDim.format(interValue));
            
            interValueVar.accValue = interAccValue;
            
            interScene.vars.value = interValueVar;
                
            interScene.isIntermediate = true;
            interScene.isSingle       = false;
            interScene.isNull         = interIsNull;
            interScene.isAlone        = interIsNull && toScene.isNull && fromScene.isNull;
            interScene.basePosition   = interBasePosition;
            interScene.orthoPosition  = orthoZero;
            interScene.orthoLength    = orthoScale(interAccValue) - orthoZero;
            
            return interScene;
        }
        
        function trimNullSeriesScenes(seriesScene) {
            
            var seriesScenes = seriesScene.childNodes,
                L = seriesScenes.length;
            
            // from beginning
            var scene, siblingScene;
            while(L && (scene = seriesScenes[0]).isNull) {
                
                // Don't remove the intermediate dot before the 1st non-null dot
                siblingScene = scene.nextSibling;
                if(siblingScene && !siblingScene.isNull){
                    break;
                }
                
                seriesScene.removeAt(0);
                L--;
            }
            
            // from end
            while(L && (scene = seriesScenes[L - 1]).isNull) {
                
                // Don't remove the intermediate dot after the last non-null dot
                siblingScene = scene.previousSibling;
                if(siblingScene && !siblingScene.isNull){
                    break;
                }
                
                seriesScene.removeAt(L - 1);
                L--;
            }
        } 
        
        function createNullDatum(serData1, catData1) {
            // Create a null datum with col and row coordinate atoms
            var atoms = serData1 && catData1 ?
                            def.array.append(
                                def.own(serData1.atoms),
                                def.own(catData1.atoms)) :
                            (serData1 ? def.own(serData1.atoms) :  def.own(catData1.atoms))
                            ;
            
            return new pvc.data.Datum(data, atoms, true);
        }
    }
});

/**
 * LineDotAreaAbstract is the class that will be extended by
 * dot, line, stackedline and area charts.
 */
pvc.LineDotAreaAbstract = pvc.CategoricalAbstract.extend({

    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        this._addVisualRoles({
            /* value: required, continuous, numeric */
            value: { 
                isMeasure: true, 
                isRequired: true, 
                isPercent: this.options.stacked,  
                requireSingleDimension: true, 
                requireIsDiscrete: false, 
                valueType: Number, 
                defaultDimensionName: 'value' 
            }
        });
    },

    /* @override */
    _createMainContentPanel: function(parentPanel){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in LineDotAreaAbstract");
        }
        
        var options = this.options;
        return new pvc.LineDotAreaPanel(this, parentPanel, {
            stacked:        options.stacked,
            showValues:     options.showValues,
            valuesAnchor:   options.valuesAnchor,
            showLines:      options.showLines,
            showDots:       options.showDots,
            showAreas:      options.showAreas,
            orientation:    options.orientation,
            nullInterpolationMode: options.nullInterpolationMode
        });
    },
    
    defaults: def.create(pvc.CategoricalAbstract.prototype.defaults, {
        showDots: false,
        showLines: false,
        showAreas: false,
        showValues: false,
        // TODO: Set this way, setting, "axisOffset: 0" has no effect...
        orthoAxisOffset: 0.04,
        baseAxisOffset:  0.01, // TODO: should depend on being discrete or continuous base
        valuesAnchor: "right",
        panelSizeRatio: 1,
        nullInterpolationMode: 'none', // 'none', 'linear' 
        tipsySettings: { offset: 15 }
    })
});

/**
 * Dot Chart
 */
pvc.DotChart = pvc.LineDotAreaAbstract.extend({

    constructor: function(options){

        this.base(options);

        this.options.showDots = true;
    }
});

/**
 * Line Chart
 */
pvc.LineChart = pvc.LineDotAreaAbstract.extend({

    constructor: function(options){

        this.base(options);

        this.options.showLines = true;
    }
});

/**
 * Stacked Line Chart
 */
pvc.StackedLineChart = pvc.LineDotAreaAbstract.extend({

    constructor: function(options){

        this.base(options);

        this.options.showLines = true;
        this.options.stacked = true;
    }
});

/**
 * Stacked Area Chart
 */
pvc.StackedAreaChart = pvc.LineDotAreaAbstract.extend({

    constructor: function(options){

        this.base(options);

        this.options.showAreas = true;
        this.options.stacked = true;
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

    constructor: function(options){

        options = def.set(options, 
                'orthoAxisOrdinal', true,
                'legend', false);
  
        if(options.scalingType && !options.colorScaleType){
            options.colorScaleType = options.scalingType;
        }
        
        this.base(options);

        var parent = this.parent;
        if(parent) {
            this._colorRole   = parent._colorRole;
            this._dotSizeRole = parent._dotSizeRole;
        }
    },
    
    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();

        var colorDimName = 'value',
            sizeDimName  = 'value2';

        if(this.options.compatVersion <= 1){
            switch(this.options.colorValIdx){
                case 0:  colorDimName = 'value';  break;
                case 1:  colorDimName = 'value2'; break;
                default: colorDimName = undefined;
            }

            switch(this.options.sizeValIdx){
                case 0:  sizeDimName = 'value';  break;
                case 1:  sizeDimName = 'value2'; break;
                default: sizeDimName = undefined;
            }
        }

        this._addVisualRoles({
            color:  {
                isMeasure: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: colorDimName
            },
            
            dotSize: {
                isMeasure: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: sizeDimName
            }
        });

        this._colorRole   = this.visualRoles('color');
        this._dotSizeRole = this.visualRoles('dotSize');
    },

    _initData: function(keyArgs){
        
        this.base(keyArgs);

        // Cached
        var dotSizeGrouping = this._dotSizeRole.grouping;
        if(dotSizeGrouping){
            this._dotSizeDim = this.data.dimensions(dotSizeGrouping.firstDimension.name);
        }

        var colorGrouping = this._colorRole.grouping;
        if(colorGrouping) {
            this._colorDim = this.data.dimensions(colorGrouping.firstDimension.name);
        }
    },
    
    /* @override */
    _createMainContentPanel: function(parentPanel){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in heatGridChart");
        }
        
        var options = this.options;
        return new pvc.HeatGridChartPanel(this, parentPanel, {
            showValues:  options.showValues,
            orientation: options.orientation
        });
    },
    
    defaults: def.create(pvc.CategoricalAbstract.prototype.defaults, {
        colorValIdx: 0,
        sizeValIdx:  1,
        measuresIndexes: [2],

        //multi-dimensional clickable label
        showValues: true,
        axisOffset: 0,
        
        showPlotFrame: false,
        
        orientation: "vertical",
        
        colorScaleType: "linear",  // "discrete", "normal" (distribution) or "linear"
        
        normPerBaseCategory: true,
        numSD: 2,                 // width (only for normal distribution)
//        nullShape: undefined,
//        shape: undefined,
        useShapes: false,
        colorRange: ['red', 'yellow','green'],
//        colorRangeInterval:  undefined,
//        minColor: undefined, //"white",
//        maxColor: undefined, //"darkgreen",
        nullColor:  "#efc5ad"  // white with a shade of orange
    })
});

/*
 * HeatGrid chart panel. Generates a heatGrid chart. Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showValues</i> - Show or hide heatGrid value. Default: false
 * <i>maxHeatGridSize</i> - Maximum size of a heatGrid in pixels. Default: 2000
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>heatGrid_</i> - for the actual heatGrid
 * <i>heatGridPanel_</i> - for the panel where the heatGrids sit
 * <i>heatGridLabel_</i> - for the main heatGrid label
 */
pvc.HeatGridChartPanel = pvc.CartesianAbstractPanel.extend({
    anchor: 'fill',
    pvHeatGrid: null,
    pvHeatGridLabel: null,
    data: null,

    showValues: true,
    orientation: "vertical",
    shape: "square",
    nullShape: "cross",

    defaultBorder: 1,
    nullBorder: 2,
    selectedBorder: 2,

    /**
     * @override
     */
    _createCore: function(){
        
        this.base();
        
        // TODO: this options treatment is highly "non-standard". Refactor to chart + panel-constructor
        
        var chart = this.chart,
            options = chart.options;

        var colorDimName = this.colorDimName = chart._colorDim   && chart._colorDim.name,
            sizeDimName  = this.sizeDimName  = chart._dotSizeDim && chart._dotSizeDim.name;
        
        // colors
        options.nullColor = pv.color(options.nullColor);
        
        if(options.minColor != null) { options.minColor = pv.color(options.minColor); }
        if(options.maxColor != null) { options.maxColor = pv.color(options.maxColor); }
        
        if(options.shape != null) {
            this.shape = options.shape;
        }
        
        if(options.nullShape !== undefined) { // can clear the null shape!
            this.nullShape = options.nullShape;
        }
        
        var anchor = this.isOrientationVertical() ? "bottom" : "left";

        /* Use existing scales */
        var xScale = chart.axes.x.scale,
            yScale = chart.axes.y.scale;

        /* Determine cell dimensions. */
        var w = (xScale.max - xScale.min) / xScale.domain().length;
        var h = (yScale.max - yScale.min) / yScale.domain().length;

        if (anchor !== "bottom") {
            var tmp = w;
            w = h;
            h = tmp;
        }
        
        this._cellWidth  = w;
        this._cellHeight = h;
        
        /* Column and Row datas  */
        var keyArgs = {visible: true},
            // Two multi-dimension single-level data groupings
            colRootData = chart._catRole.flatten(chart.data, keyArgs),
            rowRootData = chart._serRole.flatten(chart.data, keyArgs),

            // <=> One multi-dimensional, two-levels data grouping
            data = this._getVisibleData();
        
        /* Color scale */
        var fillColorScaleByColKey;
        
        if(colorDimName){
            fillColorScaleByColKey =  pvc.color.scales(def.create(false, this.chart.options, {
                /* Override/create these options, inherit the rest */
                type: options.colorScaleType, 
                data: colRootData,
                colorDimension: colorDimName
            }));
        }
        
        function getFillColor(detectSelection){
            var color;
            
            var colorValue = this.colorValue();
            if(colorValue != null) {
                color = fillColorScaleByColKey[this.group().parent.absKey](colorValue);
            } else {
                color = options.nullColor;
            }
            
            if(detectSelection && 
               data.owner.selectedCount() > 0 && 
               !this.datum().isSelected){
                 color = pvc.toGrayScale(color, 0.6);
            }
            
            return color;
        }
        
        /* DATUM */
        function getDatum(rowData1, colData1){
            var colData = this.parent.group();
            if(colData) {
                var rowData = colData._childrenByKey[rowData1.absKey];
                if(rowData) {
                    var datum = rowData._datums[0];
                    if(datum) {
                        return datum;
                    }
                }
            }
            
            // Create a null datum with col and row coordinate atoms
            var atoms = def.array.append(
                            def.own(rowData1.atoms),
                            def.own(colData1.atoms));
            
            return new pvc.data.Datum(data, atoms, true);
        }
        
        /* PV Panels */
        var pvColPanel = this.pvPanel.add(pv.Panel)
            .data(colRootData._children)
            .localProperty('group', Object)
            .group(function(colData1){
                return data._childrenByKey[colData1.absKey]; // must exist
            })
            [pvc.BasePanel.relativeAnchor[anchor]](function(){ //ex: datum.left(i=1 * w=15)
                return this.index * w;
             })
            [pvc.BasePanel.parallelLength[anchor]](w)
            ;
        
        var pvHeatGrid = this.pvHeatGrid = pvColPanel.add(pv.Panel)
            .data(rowRootData._children)
            .localProperty('group', Object)
            .datum(getDatum)
            .group(function(rowData1){
                return this.parent.group()._childrenByKey[rowData1.absKey];
            })
            .localProperty('colorValue')
            .colorValue(function(){
                return colorDimName && this.datum().atoms[colorDimName].value;
            })
            .localProperty('sizeValue')
            .sizeValue(function(){
                return sizeDimName && this.datum().atoms[sizeDimName].value;
            })
            ;
            
        pvHeatGrid
            [anchor](function(){ return this.index * h; })
            [pvc.BasePanel.orthogonalLength[anchor]](h)
            .antialias(false)
            .strokeStyle(null)
            .lineWidth(0)
            ;
            // THIS caused HUGE memory consumption and speed reduction (at least in use Shapes mode)
            //.overflow('hidden'); //overflow important if showValues=true
        
         
        if(options.useShapes){
            this.shapes = this.createHeatMap(w, h, getFillColor);
        } else {
            this.shapes = pvHeatGrid;
        }

        this.shapes
            //.text(getLabel) // Ended up showing when the tooltip should be empty
            .fillStyle(function(){
                return getFillColor.call(pvHeatGrid, true);
            })
            ;
        
        var valueDimName = colorDimName || sizeDimName;
        
        if(this.showValues && valueDimName){
            
            this.pvHeatGridLabel = pvHeatGrid.anchor("center").add(pv.Label)
                .bottom(0)
                .text(function(){
                    return this.datum().atoms[valueDimName].label;
                })
                ;
        }
        
        if(this._shouldHandleClick()){ // TODO: should have valueDimName -> value argument
            this._addPropClick(this.shapes);
        }

        if(options.doubleClickAction){ // TODO: should have valueDimName -> value argument
            this._addPropDoubleClick(this.shapes);
        }
        
        if(options.showTooltips){
            this._addPropTooltip(this.shapes, {tipsyEvent: 'mouseover'});
        }
    },

    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        if(this.pvHeatGridLabel){
            this.extend(this.pvHeatGridLabel, "heatGridLabel_");
        }

        // Extend heatGrid and heatGridPanel
        this.extend(this.pvHeatGrid,"heatGridPanel_");
        this.extend(this.pvHeatGrid,"heatGrid_");
    },

    createHeatMap: function(w, h, getFillColor){
        var myself = this,
            options = this.chart.options,
            data = this.chart.data,
            sizeDimName  = this.sizeDimName,
            colorDimName = this.colorDimName,
            nullShapeType = this.nullShape,
            shapeType = this.shape;
        
        /* SIZE RANGE */
        var maxRadius = Math.min(w, h) / 2;
        if(this.shape === 'diamond'){
            // Protovis draws diamonds inscribed on
            // a square with half-side radius*Math.SQRT2
            // (so that diamonds just look like a rotated square)
            // For the height of the dimanod not to exceed the cell size
            // we compensate that factor here.
            maxRadius /= Math.SQRT2;
        }

        // Small margin
        maxRadius -= 2;
        
        var maxArea  = maxRadius * maxRadius, // apparently treats as square area even if circle, triangle is different
            minArea  = 12,
            areaSpan = maxArea - minArea;

        if(areaSpan <= 1){
            // Very little space
            // Rescue Mode - show *something*
            maxArea = Math.max(maxArea, 2);
            minArea = 1;
            areaSpan = maxArea - minArea;
            
            if(pvc.debug >= 2){
                pvc.log("Using rescue mode dot area calculation due to insufficient space.");
            }
        }
        
        var sizeValueToArea;
        if(sizeDimName){
            /* SIZE DOMAIN */
            def.scope(function(){
                var sizeValExtent = data.dimensions(sizeDimName).extent({visible: true});
                if(sizeValExtent){
                    var sizeValMin  = sizeValExtent.min.value,
                        sizeValMax  = sizeValExtent.max.value,
                        sizeValSpan = Math.abs(sizeValMax - sizeValMin); // may be zero
                    
                    if(isFinite(sizeValSpan) && sizeValSpan > 1e-12) {
                        // Linear mapping
                        // TODO: a linear scale object??
                        var sizeSlope = areaSpan / sizeValSpan;
                        
                        sizeValueToArea = function(sizeVal){
                            return minArea + sizeSlope * (sizeVal == null ? 0 : (sizeVal - sizeValMin));
                        };
                    }
                }
            });
        }
        
        if(!sizeValueToArea) {
            sizeValueToArea = pv.functor(maxArea);
        }
        
        /* BORDER WIDTH & COLOR */
        var notNullSelectedBorder = (this.selectedBorder == null || (+this.selectedBorder) === 0) ? 
                                     this.defaultBorder : 
                                     this.selectedBorder;
        
        var nullSelectedBorder = (this.selectedBorder == null || (+this.selectedBorder) === 0) ? 
                                  this.nullBorder : 
                                  this.selectedBorder;
        
        var nullDeselectedBorder = this.defaultBorder > 0 ? this.defaultBorder : this.nullBorder;
        
        function getBorderWidth(){
            if(!sizeDimName || !myself._isNullShapeLineOnly() || this.parent.sizeValue() != null){
                return this.selected() ? notNullSelectedBorder : myself.defaultBorder;
            }

            // is null
            return this.selected() ? nullSelectedBorder : nullDeselectedBorder;
        }

        function getBorderColor(){
            var lineWidth = this.lineWidth();
            if(!(lineWidth > 0)){ //null|<0
                return null; // no style
            }
            
            var color = getFillColor.call(this.parent, false);
            return (data.owner.selectedCount() === 0 || this.selected()) ? 
                    color.darker() : 
                    color;
        }
        
        /* SHAPE TYPE & SIZE */
        var getShapeType;
        if(!sizeDimName) {
            getShapeType = def.fun.constant(shapeType);
        } else {
            getShapeType = function(){
                return this.parent.sizeValue() != null ? shapeType : nullShapeType;
            };
        }
        
        var getShapeSize;
        if(!sizeDimName){
            getShapeSize = function(){
                /* When neither color nor size dimensions */
                return (colorDimName && !nullShapeType && this.parent.colorValue() == null) ? 0 : maxArea;
            };
        } else {
            getShapeSize = function(){
                var sizeValue = this.parent.sizeValue();
                return (sizeValue == null && !nullShapeType) ? 0 : sizeValueToArea(sizeValue);
            };
        }
        
        // Panel
        return this.pvHeatGrid.add(pv.Dot)
            .localProperty("selected", Boolean)
            .selected(function(){ return this.datum().isSelected; })
            .shape(getShapeType)
            .shapeSize(getShapeSize)
            .lock('shapeAngle') // rotation of shapes may cause them to not fit the calculated cell. Would have to improve the radius calculation code.
            .fillStyle(function(){ return getFillColor.call(this.parent); })
            .lineWidth(getBorderWidth)
            .strokeStyle(getBorderColor)
            ;
    },

    _isNullShapeLineOnly: function(){
        return this.nullShape == 'cross';  
    },

    /**
     * Returns an array of marks whose instances are associated to a datum, or null.
     * @override
     */
    _getSignums: function(){
        return [this.shapes];
    },
    
    /**
     * Renders the heat grid panel.
     * @override
     */
    _renderInteractive: function(){
        this.pvPanel.render();
    }
});

/**
 * MetricXYAbstract is the base class of metric XY charts.
 * (Metric stands for:
 *   Measure, Continuous or Not-categorical base and ortho axis)
 */
pvc.MetricXYAbstract = pvc.CartesianAbstract.extend({

    constructor: function(options){

        var isV1Compat = (options && options.compatVersion <= 1);
        if(isV1Compat){
            /**
             * If the 'x' role isn't explicitly defined (in any way),
             * help with defaults and keep backward compatibility by
             * making the 'x' role's default dimension - the 'category' dimension -
             * a numeric one.
             */
            if(!options){ options = {}; }
            if(!options.visualRoles || !options.visualRoles.x){
                var dims   = options.dimensions || (options.dimensions = {}),
                    catDim = dims.category || (dims.category = {});

                if(catDim.valueType === undefined){
                    catDim.valueType = Number;
                }
            }
        }

        this.base(options);

        def.set(this._axisType2RoleNamesMap,
            'base',  'x',
            'ortho', 'y');

        var parent = this.parent;
        if(parent) {
            this._xRole = parent._xRole;
            this._yRole = parent._yRole;
        }
    },

    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){

        this.base();

        var isV1Compat = (this.options.compatVersion <= 1);

        this._addVisualRoles({
            x: {
                isMeasure: true,
                isRequired: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: isV1Compat ? 'category' : 'value'
            },
            y: {
                isMeasure: true,
                isRequired: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: isV1Compat ? 'value' : 'value2'
            }
        });

        this._xRole = this.visualRoles('x');
        this._yRole = this.visualRoles('y');
    },

    _initData: function(){
        this.base.apply(this, arguments);

        // Cached
        this._xDim = this.data.dimensions(this._xRole.firstDimensionName());
        this._yDim = this.data.dimensions(this._yRole.firstDimensionName());
    },
    
    defaults: def.create(pvc.CartesianAbstract.prototype.defaults, {
        valuesAnchor: "right",
        panelSizeRatio: 1
    })
});

/*
 * Metric Line/Dot panel.
 * Class that draws dot and line plots.
 * Specific options are:
 * <i>showDots</i> - Show or hide dots. Default: true
 * <i>showLines</i> - Show or hide dots. Default: true
 * <i>showValues</i> - Show or hide line value. Default: false
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>line_</i> - for the actual line
 * <i>linePanel_</i> - for the panel where the lines sit
 * <i>lineDot_</i> - the dots on the line
 * <i>lineLabel_</i> - for the main line label
 */
pvc.MetricLineDotPanel = pvc.CartesianAbstractPanel.extend({
    anchor: 'fill',
    
    pvLine: null,
    pvDot: null,
    pvLabel: null,
    pvScatterPanel: null, 
    
    showLines:  true,
    showDots:   true,
    showValues: true,
    
    valuesAnchor: "right",
    
    dotShape: "circle",
    
    // Ratio of the biggest bubble diameter to 
    // the length of plot area dimension according to option 'dotSizeRatioTo'
    dotSizeRatio: 1/5,
    
    dotSizeRatioTo: 'minWidthHeight', // 'height', 'width', 
    
    autoDotSizePadding: true,
    
    _v1DimRoleName: {
        'series':   'series',
        'category': 'x',
        'value':    'y'
    },
    
    constructor: function(chart, parent, options) {
        
        this.base(chart, parent, options);
        
        if(!this.offsetPaddings){
            this.offsetPaddings = new pvc.Sides(0.01);
        }
    },
    
    _creating: function(){
        // Register BULLET legend prototype marks
        var groupScene = this.defaultVisibleBulletGroupScene();
        if(groupScene && !groupScene.hasRenderer()){
            var colorAxis = groupScene.colorAxis;
            var drawMarker = def.nullyTo(colorAxis.option('DrawMarker', true), this.showDots);
            var drawRule   = def.nullyTo(colorAxis.option('DrawLine',   true), this.showLines);
            if(drawMarker || drawRule){
                var keyArgs = {};
                if((keyArgs.drawMarker = drawMarker)){
                    keyArgs.markerShape = colorAxis.option('Shape', true) 
                                          || 'circle'; // Dot's default shape
                    keyArgs.markerPvProto = new pv.Dot()
                            .lineWidth(1.5)
                            .shapeSize(12);
                    
                    this.extend(keyArgs.markerPvProto, 'dot_', {constOnly: true});
                }
                
                if((keyArgs.drawRule = drawRule)){
                    keyArgs.rulePvProto = new pv.Line()
                            .lineWidth(1.5);
                    
                    this.extend(keyArgs.rulePvProto, 'line_', {constOnly: true});
                }
                
                groupScene.renderer(
                    new pvc.visual.legend.BulletItemDefaultRenderer(keyArgs));
            }
        }
    },
    
    _getRootScene: function(){
        var rootScene = this._rootScene;
        if(!rootScene){
            // First time stuff
            var chart = this.chart;
            // Shared "series" grouped data
            var data = this._getVisibleData();
            var hasColorRole = !!chart._colorRole.grouping;
            var hasDotSizeRole = this.showDots && !!chart._dotSizeDim;
            
            var sizeValRange;
            if(hasDotSizeRole){
                var sizeValExtent = chart._dotSizeDim.extent({visible: true});
                hasDotSizeRole = !!sizeValExtent;
                if(hasDotSizeRole){
                   var sizeValMin  = sizeValExtent.min.value,
                       sizeValMax  = sizeValExtent.max.value;

                    //Need to calculate manually the abs - probably there's a better way to do this
                    if (this.dotSizeAbs) {
                        var atoms = chart._dotSizeDim.atoms({visible:true});
                        
                        for (var i=0; i < atoms.length; i++) {
                            if (i == 0)
                                sizeValMin = sizeValMax = Math.abs(atoms[0].value);
                            else {
                                var newValue = Math.abs(atoms[i].value);
                                if (newValue > sizeValMax) sizeValMax = newValue;
                                if (newValue < sizeValMin) sizeValMin = newValue;
                            }                            
                        }                    
                    }
                                
                    var sizeValSpan = Math.abs(sizeValMax - sizeValMin); // may be zero
                    
                    hasDotSizeRole = isFinite(sizeValSpan) && sizeValSpan > 1e-12;
                    if(hasDotSizeRole){
                        sizeValRange = {min: sizeValMin, max: sizeValMax};
                    }
                }
            }
            
            rootScene = this._buildScene(data, hasColorRole, hasDotSizeRole);
            
            rootScene.sizeValRange = sizeValRange; // TODO: not pretty?
            
            this._rootScene = rootScene;
        }
        
        return rootScene;
    },
    
    /*
    * @override
    */
    _calcLayout: function(layoutInfo){
        var chart = this.chart;
        var rootScene = this._getRootScene();
        var clientSize = layoutInfo.clientSize;
        
        /* Adjust axis offset to avoid dots getting off the content area */
        
        if(rootScene.hasDotSizeRole){
            /* Determine Max/Min Dot Size */
            
            var radiusRange = this._calcDotRadiusRange(layoutInfo);
            
            // Diamond Adjustment
            if(this.dotShape === 'diamond'){
                // Protovis draws diamonds inscribed on
                // a square with half-side radius*Math.SQRT2
                // (so that diamonds just look like a rotated square)
                // For the height/width of the dimanod not to exceed the cell size
                // we compensate that factor here.
                radiusRange.max /= Math.SQRT2;
                radiusRange.min /= Math.SQRT2;
            }
           
            var maxArea   = radiusRange.max * radiusRange.max,
                minArea   = radiusRange.min * radiusRange.min,
                areaSpan = maxArea - minArea;
           
            if(areaSpan <= 1){
                // Very little space
                // Rescue Mode - show *something*
                maxArea  = Math.max(maxArea, 2);
                minArea  = 1;
                areaSpan = maxArea - minArea;
               
                radiusRange = {
                    min: Math.sqrt(minArea),
                    max: Math.sqrt(maxArea)
                };
               
                if(pvc.debug >= 3){
                    pvc.log("Using rescue mode dot area calculation due to insufficient space.");
                }
            }
           
            this.maxDotRadius = radiusRange.max;
           
            this.maxDotArea  = maxArea;
            this.minDotArea  = minArea;
            this.dotAreaSpan = areaSpan;
           
            this.dotSizeScale = this._getDotSizeRoleScale(rootScene.sizeValRange);
        }
        
        this._calcAxesPadding(layoutInfo, rootScene);
    },
  
   _getDotDiameterRefLength: function(layoutInfo){
       // Use the border box to always have the same size for != axis offsets (paddings)
       
       var clientSize = layoutInfo.clientSize;
       var paddings   = layoutInfo.paddings;
       
       switch(this.dotSizeRatioTo){
           case 'minWidthHeight': 
               return Math.min(
                       clientSize.width  + paddings.width, 
                       clientSize.height + paddings.height);
           
           case 'width':  return clientSize.width  + paddings.width ;
           case 'height': return clientSize.height + paddings.height;
       }
       
       if(pvc.debug >= 2){
           pvc.log(
              def.format(
                  "Invalid option 'dotSizeRatioTo' value. Assuming 'minWidthHeight'.", 
                  [this.dotSizeRatioTo]));
       }
       
       this.dotSizeRatioTo = 'minWidthHeight';
       
       return this._getDotDiameterRefLength(layoutInfo);
   },
   
   _calcDotRadiusRange: function(layoutInfo){
       var refLength = this._getDotDiameterRefLength(layoutInfo);
       
       // Diameter is 1/5 of ref length
       var max = (this.dotSizeRatio / 2) * refLength;
       
       // Minimum SIZE (not radius) is 12
       var min = Math.sqrt(12); 
       
       return {min: min, max: max};
   },
   
   _calcAxesPadding: function(layoutInfo, rootScene){
       
       // If we were not to take axes rounding padding effect
       // into account, it could be as simple as:
       // var offsetRadius = radiusRange.max + 6;
       // requestPaddings = new pvc.Sides(offsetRadius);
       
       var requestPaddings;
       
       if(!this.autoDotSizePadding){
           requestPaddings = this._calcRequestPaddings(layoutInfo);
       } else {
           var chart = this.chart;
           var axes  = chart.axes;
           var clientSize = layoutInfo.clientSize;
           var paddings   = layoutInfo.paddings;
           
           requestPaddings = {};
           
           /* The Worst case implementation would be like:
            *   Use more padding than is required in many cases,
            *   but ensures that no dot ever leaves the "stage".
            * 
            *   Half a circle must fit in the client area
            *   at any edge of the effective plot area 
            *   (the client area minus axis offsets).
            */
           
           // X and Y axis orientations
           axes.x.setScaleRange(clientSize.width );
           axes.y.setScaleRange(clientSize.height);
           
           // X and Y visual roles
           var sceneXScale = chart.axes.base.sceneScale({sceneVarName:  'x'});
           var sceneYScale = chart.axes.ortho.sceneScale({sceneVarName: 'y'});
           
           var xLength = chart.axes.base.scale.max;
           var yLength = chart.axes.ortho.scale.max;
           
           var hasDotSizeRole = rootScene.hasDotSizeRole;
           var sizeScale = this.dotSizeScale;
           if(!hasDotSizeRole){
               // Use the dot default size
               var defaultSize = def.number.as(this._getExtension('dot', 'shapeRadius'), 0);
               if(!(defaultSize > 0)){
                   defaultSize = def.number.as(this._getExtension('dot', 'shapeSize'), 0);
                   if(!(defaultSize) > 0){
                       defaultSize = 12;
                   }
               } else {
                   // Radius -> Size
                   defaultSize = defaultSize * defaultSize;
               }
               
               sizeScale = def.fun.constant(defaultSize);
           }
           
           // TODO: these padding requests do not take the resulting new scale into account
           // and as such do not work exactly...
           //var xMinPct = xScale(xDomain.min) /  clientSize.width;
           //var overflowLeft = (offsetRadius - xMinPct * (paddings.left + clientSize.width)) / (1 - xMinPct);
           
           requestPaddings = {};
           
           // Resolve (not of PercentValue so cannot use pvc.Sides#resolve)
           var op;
           if(this.offsetPaddings){
               op = {};
               pvc.Sides.names.forEach(function(side){
                   var len_a = pvc.BasePanel.orthogonalLength[side];
                   op[side] = (this.offsetPaddings[side] || 0) * (clientSize[len_a] + paddings[len_a]);
               }, this);
           }
           
           var setSide = function(side, padding){
               if(op){
                   padding += (op[side] || 0);
               }
               
               if(padding < 0){
                   padding = 0;
               }
               
               var value = requestPaddings[side];
               if(value == null || padding > value){
                   requestPaddings[side] = padding;
               }
           };
           
           var processScene = function(scene){
               var x = sceneXScale(scene);
               var y = sceneYScale(scene);
               var r = Math.sqrt(sizeScale(hasDotSizeRole ? scene.vars.dotSize.value : 0));
               
               // How much overflow on each side?
               setSide('left',   r - x);
               setSide('bottom', r - y);
               setSide('right',  x + r - xLength );
               setSide('top',    y + r - yLength);
           };
           
           rootScene
               .children()
               .selectMany(function(seriesScene){ return seriesScene.childNodes; })
               .each(processScene);
       }
       
       layoutInfo.requestPaddings = requestPaddings;
   },
   
    /**
     * @override
     */
    _createCore: function(layoutInfo){
        this.base();
         
        var myself = this,
            chart = this.chart,
            options = chart.options;

        // ------------------
        // DATA
        var rootScene = this._getRootScene(),
            data      = rootScene.group,
            // data._leafs.length is currently an approximation of datum count due to datum filtering in the scenes only...
            isDense   = !(this.width > 0) || (data._leafs.length / this.width > 0.5); //  > 100 pts / 200 pxs 
        
        this._finalizeScene(rootScene);

        // Disable selection?
        if(isDense && (options.selectable || options.hoverable)) {
            options.selectable = false;
            options.hoverable  = false;
            if(pvc.debug >= 3) {
                pvc.log("Warning: Disabling selection and hovering because the chart is to \"dense\".");
            }
        }
       
        // ---------------
        // BUILD
        
        // this.pvPanel.strokeStyle('red');
        
        this.pvPanel.zOrder(1); // Above axes
        
        this.pvScatterPanel = this.pvPanel.add(pv.Panel)
            .lock('data', rootScene.childNodes)
            ;
        
        // -- LINE --
        var line = new pvc.visual.Line(this, this.pvScatterPanel, {
                extensionId: 'line'
            })
            /* Data */
            .lock('data', function(seriesScene){ return seriesScene.childNodes; }) // TODO    
            
            .lockValue('visible', this.showLines)
            
            /* Position & size */
            .override('x', function(){ return this.scene.basePosition;  })
            .override('y', function(){ return this.scene.orthoPosition; })
            ;
        
        this.pvLine = line.pvMark;
            
        // -- DOT --
        var dot = new pvc.visual.Dot(this, this.pvLine, {
                extensionId: 'dot',
                activeSeriesAware: this.showLines
            })
            .intercept('visible', function(){
                return !this.scene.isIntermediate && this.delegate(true);
            })
            .lockValue('shape', this.dotShape)
            .override('x',  function(){ return this.scene.basePosition;  })
            .override('y',  function(){ return this.scene.orthoPosition; })
            .override('color', function(type){
                /* 
                 * Handle showDots
                 * -----------------
                 * Despite !showDots,
                 * show a dot anyway when:
                 * 1) it is active, or
                 * 2) it is single  (the only dot in the dataset)
                 */
                if(!myself.showDots){
                    var visible = this.scene.isActive ||
                                  this.scene.isSingle;
                    if(!visible) {
                        return pvc.invisibleFill;
                    }
                }
                
                // Follow normal logic
                return this.base(type);
            })
            ;
            
        this.pvDot = dot.pvMark;
        
        this.pvDot.rubberBandSelectionMode = 'center';
        
        // -- COLOR --
        dot.override('baseColor', function(type){
            var color = this.delegate();
            if(color === undefined){
                var color;
                if(!rootScene.hasColorRole){
                    color = this.defaultColor(type);
                } else {
                    var colorValue = this.scene.vars.color.value;
                    
                    color = colorValue == null ?
                                options.nullColor :
                                colorScale(colorValue);
                }
                
                if(type === 'stroke'){
                    color = color.darker();
                }
                
        // When no lines are shown, dots are shown with transparency,
        // which helps in distinguishing overlapped dots.
        // With lines shown, it would look strange.
            // ANALYZER requirements, so until there's no way to configure it...
//            if(!myself.showLines){
//                    color = color.alpha(color.opacity * 0.85);
//            }
                }
                
                return color;
            });
            
        if(rootScene.hasColorRole){
            var colorScale = this._getColorRoleScale(data);
            
            line.override('baseColor', function(type){
                var color = this.delegate();
                if(color === undefined){
                    var colorValue = this.scene.vars.color.value;
                    color = colorValue == null ?
                                options.nullColor :
                                colorScale(colorValue);
                }
                
                return color;
            });
            
            dot.override('interactiveColor', function(type, color){
                if(this.scene.isActive) {
                    // Don't make border lighter on active
                    return color;
                }
                
                return this.base(type, color);
            });
        }
        
        // -- DOT SIZE --
        if(!rootScene.hasDotSizeRole){
            dot.override('baseSize', function(){
                /* When not showing dots, 
                 * but a datum is alone and 
                 * wouldn't be visible using lines,  
                 * show the dot anyway, 
                 * with a size = to the line's width^2
                 */
                if(!myself.showDots) {
                    if(this.scene.isSingle) {
                        // Obtain the line Width of the "sibling" line
                        var lineWidth = Math.max(myself.pvLine.scene[this.pvMark.index].lineWidth, 0.2) / 2;
                        return lineWidth * lineWidth;
                    }
                }
                
                return this.base();
            });
        } else {
            var sizeValueToArea = this._getDotSizeRoleScale(rootScene.sizeValRange);

            var dotSizeAbs = this.dotSizeAbs;
            if (this.dotSizeAbs) {
                dot.override('strokeColor', function (scene) {
                    return scene.vars.dotSize.value < 0 ? "#000000" : this.base();
                });
                dot.optionalValue('lineCap', 'round'); // only used by strokeDashArray
                dot.optional('strokeDasharray', function (scene){
                    return scene.vars.dotSize.value < 0 ? 'dot' : null; // .  .  .
                });
                dot.optional('lineWidth', function (scene){
                    return scene.vars.dotSize.value < 0 ? 1.8 : 1.5;
                });
            }

            /* Ignore any extension */
            dot .override('baseSize', function(){
                    var value = this.scene.vars.dotSize.value;
                    if (dotSizeAbs)
                        value = Math.abs(value);
                    return sizeValueToArea(value);
                })
                .override('interactiveSize', function(size){
                    if(this.scene.isActive){
                        var radius = Math.sqrt(size) * 1.1;
                        return radius * radius;
                    }
                    
                    return size;
                })
                ;
            
            // Default is to hide overflow dots, 
            // for a case where the provided offset, or calculated one is not enough 
            // (dotSizeRatioTo='width' or 'height' don't guarantee no overflow)
            // Padding area is used by the bubbles.
            this.pvPanel.borderPanel.overflow("hidden");
        }
        
        // -- LABEL --
        if(this.showValues){
            this.pvLabel = this.pvDot
                .anchor(this.valuesAnchor)
                .add(pv.Label)
                // ------
                .bottom(0)
                .text(function(scene){ 
                    return def.string.join(",", scene.vars.x.label, scene.vars.y.label);
                })
                ;
        }
    },
    
    /* Ignore 'by series' color.
     * Series, then, only control the dots that are connected with lines.
     * 
     * Color is calculated per datum.
     * Datums of the same series may each have a different color.
     * This is true whether the color dimension is discrete or continuous.
     * When the color dimension is discrete, the effect will look
     * similar to a series color, the difference being that datums
     * may be from the same series (same connected line) and
     * have different colors.
     * If lines are not shown there's however no way to tell if the
     * color comes from the series or from the color role.
     * A "normal" color legend may be shown for the color role.
     * 
     * The color role may be discrete of one or more dimensions, 
     * or continuous.
     * 
     * If the role has 1 continuous dimension,
     * the color scale may be (see pvc.color): 
     * - discrete (continuous->discrete), 
     * - linear or 
     * - normally distributed.
     * 
     * Is the color scale shared between small multiple charts?
     * It should be specifiable. Accordingly, the domain of 
     * the color scale is chosen to be the root or the local data
     * (this does not imply sharing the same color scale function instance).
     * 
     * If the role has 1 discrete dimension, or more than one dimension,
     * the color scale will be discrete (->discrete),
     * behaving just like the series color scale.
     * The colors are taken from the chart's series colors.
     * The domain for the scale is the root data, 
     * thus allowing to show a common color legend, 
     * in case multiple charts are used.
     * 
     */
    _getColorRoleScale: function(data){
        var chart = this.chart,
            options = chart.options;
        
        if(chart._colorRole.grouping.isDiscrete()){
            /* Legend-like color scale */
            var colorValues = chart._colorRole
                                .flatten(data.owner) // visible or invisible
                                .children()
                                .select(function(child){ return child.value; })
                                .array();
            
            return chart.colors(colorValues);
        }
        
        return pvc.color.scale(
            def.create(false, options, {
                /* Override/create these options, inherit the rest */
                type: options.colorScaleType || 'linear', 
                data: data.owner, // shared scale
                colorDimension: chart._colorRole.firstDimensionName()
            }));
    },
    
    _getDotSizeRoleScale: function(sizeValRange){
        /* Per small chart scale */
        // TODO ~ copy paste from HeatGrid        

        var sizeValMin  = sizeValRange.min,
            sizeValMax  = sizeValRange.max,
            sizeValSpan = sizeValMax - sizeValMin; // > 0
        
        // Linear mapping
        // TODO: a linear scale object ??
        var sizeSlope = this.dotAreaSpan / sizeValSpan,
            minArea   = this.minDotArea;
        
        return function(sizeVal){
            return minArea + sizeSlope * (sizeVal == null ? 0 : (sizeVal - sizeValMin));
        };
    },
    
    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        this.extend(this.pvLabel, "lineLabel_");
        this.extend(this.pvScatterPanel, "scatterPanel_");
        this.extend(this.pvLine,  "line_");
        this.extend(this.pvDot,   "dot_");
        this.extend(this.pvLabel, "label_");
    },

    /**
     * Renders this.pvScatterPanel - the parent of the marks that are affected by interaction changes.
     * @override
     */
    _renderInteractive: function(){
        this.pvScatterPanel.render();
    },

    /**
     * Returns an array of marks whose instances are associated to a datum or group, or null.
     * @override
     */
    _getSignums: function(){
        var marks = [];
        
        marks.push(this.pvDot);
        
        if(this.showLines){
            marks.push(this.pvLine);
        }
        
        return marks;
    },
    
    _finalizeScene: function(rootScene){
        var chart = this.chart,
            sceneBaseScale  = chart.axes.base.sceneScale({sceneVarName: 'x'}),
            sceneOrthoScale = chart.axes.ortho.sceneScale({sceneVarName: 'y'});
        
        rootScene
            .children()
            .selectMany(function(seriesScene){ return seriesScene.childNodes; })
            .each(function(leafScene){
                leafScene.basePosition  = sceneBaseScale(leafScene);
                leafScene.orthoPosition = sceneOrthoScale(leafScene);
            }, this);
    
        return rootScene;
    },
    
    _buildScene: function(data, hasColorRole, hasDotSizeRole){
        var rootScene = new pvc.visual.Scene(null, {panel: this, group: data});
        rootScene.hasColorRole = hasColorRole;
        rootScene.hasDotSizeRole = hasDotSizeRole;
        
        var chart = this.chart,
            getColorRoleValue,
            getDotSizeRoleValue;
        
        if(hasColorRole){
             var colorGrouping = chart._colorRole.grouping;//.singleLevelGrouping();
             if(colorGrouping.isSingleDimension){ // TODO
                 var colorDimName = chart._colorRole.firstDimensionName();
                 
                 getColorRoleValue = function(scene){
                     return scene.atoms[colorDimName].value;
                 };
             } else {
                 getColorRoleValue = function(scene) {
                     return colorGrouping.view(scene.datum).value;
                 };
             }
        }
        
        if(chart._dotSizeDim){
            var dotSizeDimName = chart._dotSizeDim.name;
            
            getDotSizeRoleValue = function(scene){
                return scene.atoms[dotSizeDimName].value;
            };
        }
         
        // --------------
        
        /** 
         * Create starting scene tree 
         */
        data.children()
            .each(createSeriesScene, this);
        
        /** 
         * Update the scene tree to include intermediate leaf-scenes,
         * to add in the creation of lines and areas. 
         */
        rootScene
            .children()
            .each(completeSeriesScenes, this);
        
        return rootScene;
        
        function createSeriesScene(seriesGroup){
            /* Create series scene */
            var seriesScene = new pvc.visual.Scene(rootScene, {group: seriesGroup});
            
            seriesScene.vars.series = new pvc.visual.ValueLabelVar(
                                seriesGroup.value,
                                seriesGroup.label);
            
            seriesGroup.datums().each(function(datum){
                var xAtom = datum.atoms[chart._xDim.name];
                if(xAtom.value == null){
                    return;
                }
                
                var yAtom = datum.atoms[chart._yDim.name];
                if(yAtom.value == null){
                    return;
                }
                
                /* Create leaf scene */
                var scene = new pvc.visual.Scene(seriesScene, {datum: datum});
                
                scene.vars.x = new pvc.visual.ValueLabelVar(xAtom.value, xAtom.label);
                scene.vars.y = new pvc.visual.ValueLabelVar(yAtom.value, yAtom.label);
                
                if(getColorRoleValue){
                    scene.vars.color = new pvc.visual.ValueLabelVar(
                                getColorRoleValue(scene),
                                "");
                }
                
                if(getDotSizeRoleValue){
                    var dotSizeValue = getDotSizeRoleValue(scene);
                    scene.vars.dotSize = new pvc.visual.ValueLabelVar(
                                            dotSizeValue,
                                            chart._dotSizeDim.format(dotSizeValue));
                }
                
                scene.isIntermediate = false;
            });
        }
        
        function completeSeriesScenes(seriesScene) {
            var seriesScenes = seriesScene.childNodes, 
                fromScene;
            
            /* As intermediate nodes are added, 
             * seriesScene.childNodes array is changed.
             * 
             * The var 'toChildIndex' takes inserts into account;
             * its value is always the index of 'toScene' in 
             * seriesScene.childNodes.
             */
            for(var c = 0, /* category index */
                    toChildIndex = 0,
                    pointCount = seriesScenes.length ; c < pointCount ; c++, toChildIndex++) {
                
                /* Complete toScene */
                var toScene = seriesScenes[toChildIndex];
                toScene.isSingle = !fromScene && !toScene.nextSibling;  // Look ahead
                
                /* Possibly create intermediate scene 
                 * (between fromScene and toScene)
                 */
                if(fromScene) {
                    var interScene = createIntermediateScene(
                            seriesScene,
                            fromScene, 
                            toScene,
                            toChildIndex);
                    
                    if(interScene){
                        toChildIndex++;
                    }
                }
                
                // --------
                
                fromScene = toScene;
            }
        }
        
        function createIntermediateScene(
                     seriesScene, 
                     fromScene, 
                     toScene, 
                     toChildIndex){
            
            /* Code for single, continuous and numeric dimensions */
            var interYValue = (toScene.vars.y.value + fromScene.vars.y.value) / 2;
            var interXValue = (toScene.vars.x.value + fromScene.vars.x.value) / 2;
            
            //----------------
            
            var interScene = new pvc.visual.Scene(seriesScene, {
                    /* insert immediately before toScene */
                    index: toChildIndex,
                    datum: toScene.datum
                });
            
            interScene.vars.x = new pvc.visual.ValueLabelVar(
                                    interXValue,
                                    chart._xDim.format(interXValue));
            
            interScene.vars.y = new pvc.visual.ValueLabelVar(
                                    interYValue,
                                    chart._yDim.format(interYValue));
            
            if(getColorRoleValue){
                interScene.vars.color = toScene.vars.color;
            }
            
            if(getDotSizeRoleValue){
                interScene.vars.dotSize = toScene.vars.dotSize;
            }
            
            interScene.isIntermediate = true;
            interScene.isSingle = false;
            
            return interScene;
        }
    }
});

/**
 * MetricLineDotAbstract is the base class of metric dot and line.
 */
pvc.MetricLineDotAbstract = pvc.MetricXYAbstract.extend({

    constructor: function(options){

        this.base(options);

        var parent = this.parent;
        if(parent) {
            this._colorRole = parent._colorRole;
            this._dotSizeRole = parent._dotSizeRole;
        }
    },

    /**
     * @override 
     */
    _processOptionsCore: function(options){
        this.base(options);
        
        if(options.nullColor){
            options.nullColor = pv.color(options.nullColor);
        }
    },
    
    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        var isV1Compat = (this.options.compatVersion <= 1);
        
        this._addVisualRoles({
            color:  { 
                isMeasure: true, 
                //requireSingleDimension: true,  // TODO: generalize this...
                //requireIsDiscrete: false, 
                //valueType: Number,
                defaultDimensionName: isV1Compat ? 'value2' : 'value3'
            },
            dotSize: { 
                isMeasure: true, 
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: isV1Compat ? 'value3' : 'value4' 
            }
        });

        this._colorRole   = this.visualRoles('color');
        this._dotSizeRole = this.visualRoles('dotSize');
    },

    _initData: function(keyArgs){
        this.base(keyArgs);

        // Cached
        var dotSizeGrouping = this._dotSizeRole.grouping;
        if(dotSizeGrouping){
            this._dotSizeDim = this.data.dimensions(dotSizeGrouping.firstDimension.name);
        }

        /* Change the legend source role */
        if(!this.parent){
            var colorGrouping = this._colorRole.grouping;
            if(colorGrouping) {
                if(colorGrouping.isDiscrete()){
                    // role is bound and discrete => change legend source
                    this.legendSource = 'color';
                } else {
                    /* The "color legend" has no use
                     * but to, possibly, show/hide "series",
                     * if any
                     */
                    this.options.legend = false;
                }
            }
        }
    },
    
     /**
      * @override 
      */
    _createMainContentPanel: function(parentPanel){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in MetricLineDot");
        }
        
        var options = this.options;
        
        return new pvc.MetricLineDotPanel(this, parentPanel, {
            showValues:    options.showValues,
            valuesAnchor:   options.valuesAnchor,
            showLines:      options.showLines,
            showDots:       options.showDots,
            orientation:    options.orientation,
            dotSizeRatio:   options.dotSizeRatio,
            dotSizeRatioTo: options.dotSizeRatioTo,
            autoDotSizePadding: options.autoDotSizePadding,
            dotSizeAbs: options.dotSizeAbs
        });
    },
    
    defaults: def.create(pvc.MetricXYAbstract.prototype.defaults, {
        showDots:   false,
        showLines:  false,
        showValues: false,
        originIsZero: false,
        
        tipsySettings: { offset: 15 },
        
        /* Dot Color Role */
        colorScaleType: "linear", // "discrete", "normal" (distribution) or "linear"
        colorRange: ['red', 'yellow','green'],
//        colorRangeInterval:  undefined,
//        minColor:  undefined, //"white",
//        maxColor:  undefined, //"darkgreen",
        nullColor: "#efc5ad",  // white with a shade of orange
         
        /* Dot Size Role */
        dotSizeAbs: false
        
//        dotSizeRatio:   undefined,
//        dotSizeRatioTo: undefined,
//        autoDotSizePadding: undefined
    })
});

/**
 * Metric Dot Chart
 */
pvc.MetricDotChart = pvc.MetricLineDotAbstract.extend({

    constructor: function(options){

        this.base(options);

        this.options.showDots = true;
    }
});


/**
 * Metric Line Chart
 */
pvc.MetricLineChart = pvc.MetricLineDotAbstract.extend({

    constructor: function(options){

        this.base(options);

        this.options.showLines = true;
    }
});
/**
 * Bullet chart generation
 */
pvc.BulletChart = pvc.BaseChart.extend({

    bulletChartPanel : null,
    allowNoData: true,

    constructor: function(options){
        options = options || {};

        // Add range and marker dimension group defaults
        // This only helps in default bindings...
        var dimGroups = options.dimensionGroups || (options.dimensionGroups = {});
        var rangeDimGroup = dimGroups.range  || (dimGroups.range  = {});
        if(rangeDimGroup.valueType === undefined){
            rangeDimGroup.valueType = Number;
        }

        var markerDimGroup = dimGroups.marker || (dimGroups.marker = {});
        if(markerDimGroup.valueType === undefined){
            markerDimGroup.valueType = Number;
        }

        options.legend = false;
        options.selectable = false; // not supported yet

        // TODO
        //if(options.compatVersion <= 1 && options.tooltipFormat === undefined){
            // Backwards compatible tooltip format
            options.tooltipFormat = function(s, c, v) {
                return this.chart.options.valueFormat(v);
            };
        //}

        this.base(options);
    },

    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){

        this.base();

        this._addVisualRoles({
            title:    { defaultDimensionName: 'title*'    },
            subTitle: { defaultDimensionName: 'subTitle*' },
            value: {
                isMeasure:  true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: 'value*'
            },
            marker: {
                isMeasure:  true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: 'marker*'
            },
            range: {
                isMeasure:  true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: 'range*'
            }
        });
    },

    _createTranslation: function(complexType, translOptions){
        var translation = this.base(complexType, translOptions),
            /*
             * By now the translation has already been initialized
             * and its virtualItemSize is determined.
             */
            size = translation.virtualItemSize()
            ;

        /* Configure the translation with default dimensions.
         *  1       Value
         *  2       Title | Value
         *  3       Title | Value | Marker
         *  >= 4    Title | Subtitle | Value | Marker | Ranges
         */
        // TODO: respect user reader definitions (names and indexes)
        if(size){
            switch(size){
                case 1:
                    translation.defReader({names: 'value'});
                    break;

                case 2:
                    translation.defReader({names: ['title', 'value']});
                    break;

                case 3:
                    translation.defReader({names: ['title', 'value', 'marker']});
                    break;

                default:
                    translation.defReader({names: ['title', 'subTitle', 'value', 'marker']});
                    if(size > 4){
                        // 4, 5, 6, ...
                        translation.defReader({names: 'range', indexes: pv.range(4, size)});
                    }
                    break;
            }
        }

        return translation;
    },
    
  _preRenderContent: function(contentOptions){
    if(pvc.debug >= 3){
      pvc.log("Prerendering in bulletChart");
    }
    
    this.bulletChartPanel = new pvc.BulletChartPanel(this, this.basePanel, def.create(contentOptions, {
        showValues:   this.options.showValues,
        showTooltips: this.options.showTooltips,
        orientation:  this.options.orientation
    }));
  },
  
  defaults: def.create(pvc.BaseChart.prototype.defaults, {
      showValues: true,
      orientation: "horizontal",
      legend: false,

      bulletSize:     30,  // Bullet size
      bulletSpacing:  50,  // Spacing between bullets
      bulletMargin:  100,  // Left margin

      // Defaults
//      bulletMarkers:  null,     // Array of markers to appear
//      bulletMeasures: null,     // Array of measures
//      bulletRanges:   null,     // Ranges
      bulletTitle:    "Bullet", // Title
      bulletSubtitle: "",       // Subtitle
      bulletTitlePosition: "left", // Position of bullet title relative to bullet

//      axisDoubleClickAction: null,

      crosstabMode: false,
      seriesInRows: false
  })
});

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
  anchor: 'fill',
  pvBullets: null,
  pvBullet: null,
  data: null,
  onSelectionChange: null,
  showValues: true,

  /**
   * @override
   */
  _createCore: function() {
    var chart  = this.chart,
        options = chart.options,
        data = this.buildData();
    
    var anchor = options.orientation=="horizontal"?"left":"bottom";
    var size, angle, align, titleLeftOffset, titleTopOffset, ruleAnchor, leftPos, topPos, titleSpace;
    
    if(options.orientation=="horizontal"){
      size = this.width - this.chart.options.bulletMargin - 20;
      angle=0;
      switch (options.bulletTitlePosition) {
        case 'top':
          leftPos = this.chart.options.bulletMargin;
          titleLeftOffset = 0;
          align = 'left';
          titleTopOffset = -12;
          titleSpace = parseInt(options.titleSize/2, 10);
          break;
        case 'bottom':
          leftPos = this.chart.options.bulletMargin;
          titleLeftOffset = 0;
          align = 'left';
          titleTopOffset = options.bulletSize + 32;
          titleSpace = 0;
          break;
        case 'right':
          leftPos = 5;
          titleLeftOffset = size + 5;
          align = 'left';
          titleTopOffset = parseInt(options.bulletSize/2, 10);
          titleSpace = 0;
          break;
        case 'left':
        default:
          leftPos = this.chart.options.bulletMargin;
          titleLeftOffset = 0;
          titleTopOffset = parseInt(options.bulletSize/2, 10);
          align = 'right';
          titleSpace = 0;
      }
      ruleAnchor = "bottom";
      topPos = function(){
        //TODO: 10
        return (this.index * (options.bulletSize + options.bulletSpacing)) + titleSpace;
      };
    }
    else
    {
      size = this.height - this.chart.options.bulletMargin - 20;
      switch (options.bulletTitlePosition) {
        case 'top':
          leftPos = this.chart.options.bulletMargin;
          titleLeftOffset = 0;
          align = 'left';
          titleTopOffset = -20;
          angle = 0;
          topPos = undefined;
          break;
        case 'bottom':
          leftPos = this.chart.options.bulletMargin;
          titleLeftOffset = 0;
          align = 'left';
          titleTopOffset = size + 20;
          angle = 0;
          topPos = 20;
          break;
        case 'right':
          leftPos = 5;
          titleLeftOffset = this.chart.options.bulletSize + 40;
          align = 'left';
          titleTopOffset = size;
          angle = -Math.PI/2;
          topPos = undefined;
          break;
        case 'left':
        default:
          leftPos = this.chart.options.bulletMargin;
          titleLeftOffset = -12;
          titleTopOffset = this.height - this.chart.options.bulletMargin - 20;
          align = 'left';
          angle = -Math.PI/2;
          topPos = undefined;
      }
      ruleAnchor = "right";
      leftPos = function(){
        return options.bulletMargin + this.index * (options.bulletSize + options.bulletSpacing);
      };

    }

    this.pvBullets = this.pvPanel.add(pv.Panel)
    .data(data)
    [pvc.BasePanel.orthogonalLength[anchor]](size)
    [pvc.BasePanel.parallelLength[anchor]](this.chart.options.bulletSize)
    .margin(20)
    .left(leftPos)
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
    
    
    if (options.clickable){
      this.pvBullet
      .cursor("pointer")
      .event("click",function(d){
        var s = d.title;
        var c = d.subtitle;
        var ev = pv.event;
        return options.clickAction(s,c, d.measures, ev);
      });
    }
    
    this.pvBulletRange = this.pvBullet.range.add(pv.Bar);
    this.pvBulletMeasure = this.pvBullet.measure.add(pv.Bar)
    .text(function(d){
      return options.valueFormat(d);
    });

    this.pvBulletMarker = this.pvBullet.marker.add(pv.Dot)
    .shape("square")
    .fillStyle("white")
    .text(function(d){
      return options.valueFormat(d);
    });


    if(this.showTooltips){
      // Extend default
      // TODO: how to deal with different measures in tooltips depending on mark
      
//      this._addPropTooltip(this.pvBulletMeasure);
//      this._addPropTooltip(this.pvBulletMarker);
        var myself = this;
        this.pvBulletMeasure
            .localProperty('tooltip')
            .tooltip(function(v, d){
                var s = d.title;
                var c = d.subtitle;
                return chart.options.tooltipFormat.call(myself,s,c,v);
            })
            ;

        this.pvBulletMarker
            .localProperty('tooltip')
            .tooltip(function(v, d){
                var s = d.title;
                var c = d.subtitle;
                return chart.options.tooltipFormat.call(myself,s,c,v);
            })
            ;
      
        this.pvBulletMeasure.event("mouseover", pv.Behavior.tipsy(this.chart.options.tipsySettings));
        this.pvBulletMarker.event("mouseover", pv.Behavior.tipsy(this.chart.options.tipsySettings));
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
    .left(titleLeftOffset)
    .top(titleTopOffset)
    .text(function(d){
      return d.formattedTitle;
    });

    this.pvBulletSubtitle = this.pvBullet.anchor(anchor).add(pv.Label)
    .textStyle("#666")
    .textAngle(angle)
    .textAlign(align)
    .textBaseline("top")
    .left(titleLeftOffset)
    .top(titleTopOffset)
    .text(function(d){
      return d.formattedSubtitle;
    });

    var doubleClickAction = (typeof(options.axisDoubleClickAction) == 'function') ?
    function(d, e) {
            //ignoreClicks = 2;
            options.axisDoubleClickAction(d, e);

    }: null;
    
    if (doubleClickAction) {
        this.pvBulletTitle
            .cursor("pointer")
            .events('all')  //labels don't have events by default
            .event("dblclick", function(d){
                    doubleClickAction(d, arguments[arguments.length-1]);
                });

        this.pvBulletSubtitle
            .cursor("pointer")
            .events('all')  //labels don't have events by default
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
     * Data array to back up bullet charts.
     */
    buildData: function(){
        if(pvc.debug >= 3){
            pvc.log("In buildData: " + this.chart.data.getInfo() );
        }

        var data,
            chart = this.chart,
            options = chart.options,
            titleRole = chart.visualRoles('title'),
            titleGrouping = titleRole.grouping,
            subTitleRole = chart.visualRoles('subTitle'),
            subTitleGrouping = subTitleRole.grouping,
            valueRole = chart.visualRoles('value'),
            valueDimName = valueRole.grouping && valueRole.firstDimensionName(),
            markerRole = chart.visualRoles('marker'),
            markerDimName = markerRole.grouping && markerRole.firstDimensionName(),
            rangeRole = chart.visualRoles('range'),
            rangeGrouping = rangeRole.grouping;
        
        var defaultData = {
            title: options.bulletTitle,
            formattedTitle: def.scope(function(){
                var formatter = titleGrouping && titleRole.firstDimension().formatter();
                if(formatter){
                    return formatter(options.bulletTitle);
                }
                return options.bulletTitle;
            }),
            subtitle: options.bulletSubtitle,
            formattedSubtitle: def.scope(function(){
                var formatter = subTitleGrouping && subTitleRole.firstDimension().formatter();
                if(formatter){
                    return formatter(options.bulletSubtitle);
                }
                return options.bulletSubtitle;
            }),
            ranges:   options.bulletRanges   || [],
            measures: options.bulletMeasures || [],
            markers:  options.bulletMarkers  || []
        };

        if(!valueRole.grouping &&
           !titleGrouping &&
           !markerRole.grouping &&
           !subTitleGrouping &&
           !rangeGrouping){

            data = [defaultData];
       } else {
            data = chart.data.datums().select(function(datum){
                var d = Object.create(defaultData),
                    atoms = datum.atoms,
                    view;

                if(valueDimName){
                    d.measures = [atoms[valueDimName].value];
                }

                if(titleGrouping){
                    view = titleGrouping.view(datum);
                    d.title = view.value;
                    d.formattedTitle = view.label;
                }

                if(subTitleGrouping){
                    view = subTitleGrouping.view(datum);
                    d.subtitle = view.value;
                    d.formattedSubtitle = view.label;
                }

                if(markerDimName){
                    d.markers = [atoms[markerDimName].value];
                }

                if(rangeGrouping){
                    d.ranges = rangeGrouping.view(datum).values();
                }

                return d;
            }, this)
            .array();
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
pvc.ParallelCoordinates = pvc.BaseChart.extend({

  parCoordPanel : null,
  legendSource: 'category',

  constructor: function(options){

   // Force the value dimension not to be a number
      options = options || {};
      options.dimensions = options.dimensions || {};
      if(!options.dimensions.value) {
          options.dimensions.value = {valueType: null};
      }
      
      this.base(options);
  },

  _preRenderContent: function(contentOptions){

    if(pvc.debug >= 3){
      pvc.log("Prerendering in parallelCoordinates");
    }

    this.parCoordPanel = new pvc.ParCoordPanel(this, this.basePanel, def.create(contentOptions, {
      topRuleOffset : this.options.topRuleOffset,
      botRuleOffset : this.options.botRuleOffset,
      leftRuleOffset : this.options.leftRuleOffset,
      rightRuleOffset : this.options.rightRuleOffset,
      sortCategorical : this.options.sortCategorical,
      mapAllDimensions : this.options.mapAllDimensions,
      numDigits : this.options.numDigits
    }));
  },
  
  defaults: def.create(pvc.BaseChart.prototype.defaults, {
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
  })
});


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
  anchor: 'fill',
  pvParCoord: null,

  dimensions: null, 
  dimensionDescr: null,

  data: null,

    /*****
     * retrieve the data from database and transform it to maps.
     *    - this.dimensions: all dimensions
     *    - this.dimensionDescr: description of dimensions
     *    - this.data: array with hashmap per data-point
     *****/
  retrieveData: function () {
    var data = this.chart.data;
    var numDigit = this.chart.options.numDigits;

    this.dimensions = data.getVisibleCategories();
    var values = data.getValues();

    var dataRowIndex = data.getVisibleSeriesIndexes();
    var pCoordIndex = data.getVisibleCategoriesIndexes();

    var pCoordKeys = data.getCategories();

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
      if (!cMap.categorical) {
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
            pCoordMapping[d].displayValue = pCoordMapping[d].map;
        }
    }
    
    var i, item, k;
    
    // 4. apply the sorting of the dimension
    if (this.chart.options.sortCategorical || 
        this.chart.options.mapAllDimensions) {
      // prefill the coordMapping in order to get it in sorted order.
      // sorting is required if all dimensions are mapped!!
      for (i=0; i<pCoordMapping.length; i++) {
         if (pCoordMapping[i]) {
           // add all data
           for (var col=0; col<values[i].length; col++) {
               coordMapUpdate(i, values[i][col]);
           }
           
           // create a sorted array
           var cMap = pCoordMapping[i].map;
           var sorted = [];
           for(item in cMap){
                if(cMap.hasOwnProperty(item)){
                    sorted.push(item);
                }
           }
           sorted.sort();
           // and assign a new index to all items
           if (pCoordMapping[i].categorical){
             for(k=0; k<sorted.length; k++){
               cMap[sorted[k]] = k;
             }
           } else {
             for(k=0; k<sorted.length; k++) {
               cMap[sorted[k]].index = k;
             }
           }
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
      for(var j in pCoordIndex) {
          if(pCoordIndex.hasOwnProperty(j)){
                record[pCoordKeys[j]] = (pCoordMapping[j]) ?
                    coordMapUpdate(j, values[j][col]) :
                    values[j][col];
          }
      }
      return record;
    };
    
    // 2. generate array with a hashmap per data-point
    this.data = dataRowIndex.map(function(col) { return generateHashMap (col);});

    
    /*************
    *  Generate an array of descriptors for the dimensions (in 3 steps).
    ******/
    // 1. find the dimensions
    var descrVals = this.dimensions.map(function(cat){
         var item2 = {};
         // the part after "__" is assumed to be the units
         var elements = cat.split("__");
         item2.id = cat;
         item2.name = elements[0];
         item2.unit = (elements.length >1)? elements[1] : "";
         return item2;
       });

    // 2. compute the min, max and step(-size) per dimension)
    for(i=0; i<descrVals.length; i++) {
      item = descrVals[i];
      var index = pCoordIndex[i];
	// orgRowIndex is the index in the original dataset
	// some indices might be (non-existent/invisible)
      item.orgRowIndex = index;

      // determine min, max and estimate step-size
      var len = values[index].length;
      var theMin, theMax, theMin2, theMax2;
      var v;
      
      // two version of the same code (one with mapping and one without)
      if (pCoordMapping[index]) {
        theMin = theMax = theMin2 = theMax2 =
               pCoordMapping[index].displayValue[ values[index][0] ] ;

        for(k=1; k<len; k++) {
          v = pCoordMapping[index].displayValue[ values[index][k] ] ;
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

        for(k=1; k<len; k++) {
          v = values[index][k];
          if (v < theMin) {
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
        if (!item.categorical) {
          item.orgValue = [];
          var theMap =  pCoordMapping[index].map;
          for (var key in theMap){
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
      for (var i = 0; i<keys.length; i++){
         record[keys[i]] = vals[i];
      }
      return record;
    };
    this.dimensionDescr = genKeyVal(this.dimensions, descrVals);
  },

  /**
   * @override
   */
  _createCore: function(){

    var myself = this;

    this.retrieveData();

    // used in the different closures
    var height = this.height,
        numDigits = this.chart.options.numDigits,
        topRuleOffs = this.chart.options.topRuleOffset,
        botRuleOffs = this.chart.options.botRuleOffset,
        leftRuleOffs = this.chart.options.leftRuleOffset,
        rightRulePos = this.width - this.chart.options.rightRuleOffset,
        topRulePos = this.height- topRuleOffs,
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
      if (dd.orgValue && !dd.categorical) {
        // map the value to the original value
        var func = function(x) { 
            var res = scale( dd.orgValue[x]);
            return res; 
        };
        
        // wire domain() and invert() to the original scale
        func.domain = function() { return scale.domain(); };
        func.invert = function(d) { return scale.invert(d); };
        return func;
      }
      
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
      function(d) { 
        return dims.every(  
        // all dimension are handled via a mapping.
            function(t) {
              var dd = dimDescr[t];
              var val = (dd.orgValue && !dd.categorical) ?
                    dd.orgValue[d[t]] : d[t];
              return (val >= filter[t].min) && (val <= filter[t].max); }
        ); }
    : function(d) { 
        return dims.every(function(t) {
                    // TO DO: check whether this operates correctly for
                    // categorical dimensions  (when mapAllDimensions == false
                    return (d[t] >= filter[t].min) && (d[t] <= filter[t].max); 
                });
    };
 

    /*****
     *   generateLinePattern produces a line pattern based on
     *          1. the current dataset.
     *          2. the current filter settings.
     *          3. the provided colorMethod.
     *  The result is an array where each element contains at least
     *            {x1, y1, x2, y2, color}
     *  Two auxiliary fields are 
     *  Furthermore auxiliary functions are provided
     *     - colorFuncFreq
     *     - colorFuncActive
     *******/
      var auxData = null;
      
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
      .bottom(function(t, d) { 
          var res = y[t] (d[t]);
          return res; 
       })
      .strokeStyle("#ddd")
      .lineWidth(1)
      .antialias(false);

    // Rule per dimension.
    var rule = this.pvPanel.add(pv.Rule)
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
    for(var d in dimDescr) {
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
      .left(function(d) {return d.x;})
      .bottom(function(d) { return d.y;})
      .text(function(d) { return d.label;})
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
        var val =  (dd.orgValue && !dd.categorical) ?
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
      .fillStyle(function(t) { return  (t.dim == active) ? 
         colors[t.dim]((filter[t.dim].max + filter[t.dim].min) / 2) : 
         "hsla(0,0,50%,.5)";})
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
                  filter[d.dim].max.toFixed(numDigits) + dimDescr[d.dim].unit;});


    /*****
     *  add the extension points
     *******/

    // Extend ParallelCoordinates
    this.extend(this.pvParCoord,"parCoord_");
    // the parCoord panel is the base-panel (not the colored dynamic overlay)

    // Extend body
    this.extend(this.pvPanel,"chart_");
  }
});
/**
 * DataTree visualises a data-tree (also called driver tree).
 * It uses a data-sources to obtain the definition of data tree.
 * Each node of the tree can have it's own datasource to visualize the
 * node. 
 */
pvc.DataTree = pvc.BaseChart.extend({

    // the structure of the dataTree is provided by a separate datasource
    structEngine:   null,
    structMetadata: null,
    structDataset:  null,

    DataTreePanel : null,
    legendSource: 'category',

    constructor: function(options){
        // Force the value dimension not to be a number
        options = options || {};
        options.dimensionGroups = options.dimensionGroups || {};
        if(!options.dimensionGroups.value) {
            options.dimensionGroups.value = {valueType: null};
        }
        
        this.base(options);
    },

    setStructData: function(data){
        this.structDataset = data.resultset;
        if (!this.structDataset.length){
            pvc.log("Warning: Structure-dataset is empty");
        }

        this.structMetadata = data.metadata;
        if (!this.structMetadata.length){
            pvc.log("Warning: Structure-Metadata is empty");
        }
    },
  
    _preRenderContent: function(contentOptions){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in data-tree");
        }
        
        // Create DataEngine
        var structEngine  = this.structEngine;
        var structType    = structEngine ? structEngine.type : new pvc.data.ComplexType();
        // Force the value dimension not to be a number
        structType.addDimension('value', {});
        
        var translOptions = {
            seriesInRows: true,
            crosstabMode: true
        };
        
        var translation = new pvc.data.CrosstabTranslationOper(structType, this.structDataset, this.structMetadata, translOptions);
        translation.configureType();
        if(!structEngine) {
            structEngine = this.structEngine = new pvc.data.Data({type: structType});
        }
        
        structEngine.load(translation.execute(structEngine));

        if(pvc.debug >= 3){
            pvc.log(this.structEngine.getInfo());
        }

        // ------------------
        
        this.dataTreePanel = new pvc.DataTreePanel(this, this.basePanel, def.create(contentOptions, {
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
        }));
    },
    
    defaults: def.create(pvc.BaseChart.prototype.defaults, {
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

        //selectParam: undefined
    })
});

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
  anchor: 'fill',
  pvDataTree: null,

  treeElements: null, 

  structMap: null,
  structArr: null,

  hRules: null,
  vRules: null,
  rules: null,

  // generating Perpendicular connectors 
  // (only using horizontal and vertical rules)
  // leftLength gives the distance from the left box to the
  // splitting point of the connector
  generatePerpConnectors: function(leftLength) {

    this.hRules = [];
    this.vRules = [];
    this.rules  = [];  // also initialize this rule-set

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
          if (theBottom > max) { max = theBottom; }
          if (theBottom < min) { min = theBottom; }
          this.hRules.push({"left": theLeft,
                      "width": child.left - theLeft,
                      "bottom": theBottom});
        }

        // a vertical rule is only added when needed
        if (max > min) {
          this.vRules.push({"left": theLeft,
                      "bottom": min,
                      "height": max - min});
        }
      }
    }
  },

  // generate a line segment and add it to rules
  generateLineSegment: function(x1, y1, x2, y2) {
    var line = [];
    line.push({"x":  x1,
               "y":  y1});
    line.push({"x":  x2,
               "y":  y2});
    this.rules.push(line);
  },

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
        var theCenter, child, i;
        
        // compute the mid-point
        var min = +10000, max = -10000;
        for(i in elem.children) {
          child = this.structMap[ elem.children[i] ];
          theCenter = child.bottom + child.height/2;
          if (theCenter > max) { max = theCenter; }
          if (theCenter < min) { min = theCenter; }
        }
        var mid = (max + min)/2;

        var theLeft1 = elem.left + elem.width;
        var theLeft2 = theLeft1 + leftLength;

        // outbound line of the left-hand box
        this.generateLineSegment(theLeft1, elem.bottom + elem.height/2,
                                theLeft2, mid);

        // incoming lines of the right-hand boxes
        for(i in elem.children) {
          child = this.structMap[ elem.children[i] ];
          theCenter = child.bottom + child.height/2;

          this.generateLineSegment(theLeft2, mid,
                                   child.left, theCenter);
        }
      }
    }
  },

  retrieveStructure: function () {
    var data = this.chart.structEngine;
    var options = this.chart.options;

    var colLabels = data.getVisibleCategories();
    this.treeElements = data.getVisibleSeries();
    var values = data.getValues();

    // if a fifth column is added, then
    //  bottom and height are provided in the dataset.
    var bottomHeightSpecified = (colLabels.length > 4);
    
    var e;
    
    // trim al element labels (to allow for matching without spaces)
    for(e in this.treeElements) { 
      this.treeElements[e] = $.trim(this.treeElements[e]);
    }

    // get the bounds (minimal and maximum column and row indices)
    // first a bounds object with two helper-functions is introduced
    var bounds = [];
    bounds.getElement = function(label) {
      // create the element if it does not exist
      if (bounds[label] == null){
        bounds[label] = {"min": +10000, "max": -10000};
      }
      return bounds[label];
    };
    
    bounds.addValue = function(label, value) {
      var bnd = bounds.getElement(label);
      if (value < bnd.min){
        bnd.min = value;
      }
      if (value > bnd.max){
        bnd.max = value;
      }
      return bnd;
    };
    
    var col, colnr, elem, row;
    for(e in this.treeElements) {
      elem = this.treeElements[e];
      col = elem[0];
      colnr = col.charCodeAt(0);
      row = parseInt(elem.slice(1), 10);
      bounds.addValue("__cols", colnr);
      bounds.addValue(col,row);
    }

    // determine parameters to find column-bounds    
    var bnds = bounds.getElement("__cols");
    var gridWidth  = this.innerWidth/(bnds.max - bnds.min + 1); // integer
    var connectorWidth = options.connectorSpace * gridWidth;
    var cellWidth = gridWidth - connectorWidth;
    var maxCellHeight = cellWidth/options.minAspectRatio;
    var colBase = bnds.min;
    delete bounds.__cols;

    // compute additional values for each column
    for (e in bounds) {
      bnds = bounds[e];
      
      if (typeof bnds == "function"){
        continue;
      }
      var numRows = bnds.max - bnds.min + 1;

      bnds.gridHeight = this.innerHeight/numRows;
      bnds.cellHeight = bnds.gridHeight*(1.0 - options.minVerticalSpace);
      if (bnds.cellHeight > maxCellHeight){
        bnds.cellHeight = maxCellHeight;
      }
      bnds.relBottom = (bnds.gridHeight - bnds.cellHeight)/2;
      bnds.numRows = numRows;
    }

    // generate the elements
    var whitespaceQuote = new RegExp ('[\\s\"\']+',"g"); 
    this.structMap = {};
    for(e in this.treeElements) {
      var box = {};
      elem = this.treeElements[e];
      box.box_id = elem;
      this.structMap[elem] = box;

      col = elem[0];
      colnr = col.charCodeAt(0);
      row = parseInt(elem.slice(1), 10);
      bnds = bounds.getElement(col);

      box.colIndex = colnr - colBase;
      box.rowIndex = bnds.numRows - (row - bnds.min) - 1;

      box.left = this.leftOffs + box.colIndex * gridWidth;
      box.width = cellWidth;
      if (bottomHeightSpecified) {
          box.bottom = values[4][e];
          box.height = values[5][e];
      } else {
          box.bottom = this.botOffs + box.rowIndex * bnds.gridHeight + bnds.relBottom;
          box.height = bnds.cellHeight;
      }
      
      box.label = values[0][e];
      box.selector = values[1][e];
      box.aggregation = values[2][e];
      
      var children = (values[3][e] || '').replace(whitespaceQuote, " ");
      
      box.children = (children === " " || children ===  "") ?
         null : children.split(" ");
    }

    this.generateConnectors((gridWidth - cellWidth)/2);

    // translate the map to an array (needed by protovis)
    this.structArr = [];
    for(e in this.structMap) {
      elem = this.structMap[e];
      this.structArr.push(elem);
    }
  },

  findDataValue: function(key, data) {
    for(var i=0; i < data[0].length; i++) {
      if (data[0][ i ] == key) {
        return data[1][ i ];
      }
    }
    
    pvc.log("Error: value with key : "+key+" not found.");
  },

  generateBoxPlots: function() {
    var options = this.chart.options;

    for(var e in this.structArr) {
      var elem = this.structArr[e];
      if (!elem.values.length) {
        continue;
      }
      
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
        if (dat[4] > dat[0]) {
          sp.hScale = pv.Scale.linear( dat[0], dat[4]);
        } else {
          noBox = true;
          // generate a fake scale centered around dat[0] (== dat[4])
          sp.hScale = pv.Scale.linear( dat[0] - 1e-10, dat[0] + 1e-10);
        }
        sp.hScale.range(elem.left + rlMargin, elem.left + elem.width - rlMargin);
        var avLabel = "" + dat[2];   // prepare the label
        
        var i;
        
        for(i=0; i< dat.length; i++) {
            dat[i] = sp.hScale( dat[i]);
        }

        sp.bot = elem.bottom + elem.height / 3;
        sp.top = elem.bottom + 2 * elem.height / 3;
        sp.mid = (sp.top + sp.bot) / 2;   // 2/3 of height
        sp.textBottom = elem.bottom + margin;
        sp.textBottom = sp.bot - options.valueFontsize - 1;

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
          for(i=0; i<dat.length; i++) {
            sp.vRules.push({"left": dat[i],
                          "bottom": sp.bot,
                          "lWidth": (i == 2) ? lwa : 1,
                          "height": sp.top - sp.bot});
          }
        }

        sp.labels.push({left: dat[2],
                      bottom: sp.textBottom,
                      text: this.labelFixedDigits(avLabel),
                      size: options.smValueFont,
                      color: options.boxplotColor});
    }
    }
  } ,

  labelFixedDigits: function(value) {
    if (typeof value == "string") {
        value = parseFloat(value);
    }

    if (typeof value == "number") {
      var nd = this.chart.options.numDigits;

      value = value.toFixed(nd);
    }

    // translate to a string again
    return "" + value;
  } ,

  addDataPoint: function(key) {
    var options = this.chart.options;

    for(var e in this.structArr) {
      var elem = this.structArr[e];

      if (!elem.values.length) {
        continue;
      }
      
      var value = this.findDataValue(key, elem.values);
      if (typeof value == "undefined") {
        continue;
      }
      
      var sp = elem.subplot;
      var theLeft = sp.hScale(value); 

      var theColor = "green";
      sp.marks.push( {
        left: theLeft,
        bottom: sp.mid,
        color: theColor });
      
      sp.labels.push({left: theLeft,
                      bottom: sp.textBottom,
                      text: this.labelFixedDigits(value),
                      size: options.valueFont,
                      color: theColor});
    }
  }, 

  retrieveData: function () {
    var data = this.chart.data;
    var options = this.chart.options;

    var colLabels = data.getVisibleCategories();
    var selectors = data.getVisibleSeries();
    var values = data.getValues();
    var selMap = {};
    var i;
    
    // create empty datasets and selMap
    var numCols = values.length;
    for(var e in this.structArr) {
      var elem = this.structArr[e];
      elem.values = [];
      for(i=0; i<numCols; i++) {
          elem.values.push([]);
      }
      selMap[ elem.selector ] = elem; 
    }

    // distribute the dataset over the elements based on the selector
    var boxNotFound = {};
    for(i in selectors) {
      var box = selMap[ selectors[ i ] ];
      if (typeof(box) != "undefined") {
        for(var j in values) {
            box.values[j].push(values[ j ][ i ]);
        }
      } else {
        boxNotFound[ selectors[i] ] = true;
      }
    }

    for (var sel in boxNotFound) {
        pvc.log("Could'nt find box for selector: "+ sel);
    }
    
    this.generateBoxPlots();

    var whitespaceQuote = new RegExp ('[\\s\"\']+',"g");
    if(options.selectParam){
        var selPar = options.selectParam.replace(whitespaceQuote, '');
        if ((selPar != "undefined") && 
            (selPar.length > 0) && 
            (typeof window[selPar] != "undefined")) {
            selPar = window[selPar];
            this.addDataPoint(selPar);
        }
    }
  } ,

  /**
   * @override
   */
  _createCore: function() {
      
    var myself  = this;

    var options = this.chart.options;
    options.smValueFontsize = Math.round(0.6 * options.valueFontsize);
    options.smValueFont = "" + options.smValueFontsize + "px sans-serif";
    options.valueFont = "" + options.valueFontsize + "px sans-serif";

    // used in the different closures
    var topRuleOffs = options.topRuleOffset,
        botRuleOffs = options.botRuleOffset,
        leftRuleOffs = options.leftRuleOffset;

    // set a few parameters which will be used during data-retrieval
    this.innerWidth = this.width - leftRuleOffs - options.rightRuleOffset;
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
    var topMargin = options.headerFontsize + 3;

    // draw the connectors first (rest has to drawn over the top)
    var rules = this.rules;
    var i;
    
    for (i = 0; i < rules.length; i++) {
      /*jshint loopfunc:true */
      this.pvPanel.add(pv.Line)
        .data(rules[ i ])
        .left(function(d) { return d.x;})
        .bottom(function(d) { return d.y;})
        .lineWidth(1)
        .strokeStyle("black");
    }
    
    // draw the data containers with decorations
    this.pvDataTree = this.pvPanel.add(pv.Bar)
      .data(myself.structArr)
      .left(function(d) { return d.left;})
      .bottom(function(d) { return d.bottom;})
      .height(function(d) { return d.height;})
      .width(function(d) { return d.width;})
      .fillStyle("green")
//;  this.pvDataTree
    .add(pv.Bar)
//      .data(function(d) {return d; })
      .left(function(d) { return d.left + options.border;})
      .bottom(function(d) { return d.bottom + options.border;})
      .height(function(d) { return d.height - options.border - topMargin;})
      .width(function(d) { return d.width - 2 * options.border;})
      .fillStyle("white")
    .add(pv.Label)
      .text(function(d) { return d.label;})
      .textAlign("center")
      .left(function (d) {return  d.left + d.width/2;})
      .bottom(function(d) {
          return d.bottom + d.height - options.headerFontsize - 5 + options.headerFontsize/5;
})
      .font("" + options.headerFontsize + "px sans-serif")
      .textStyle("white")
      .fillStyle("blue");

    // add the box-plots
    for(i=0; i<this.structArr.length; i++) {
      var box = this.structArr[i];
      this.pvPanel.add(pv.Rule)
        .data(box.subplot.hRules)
        .left(function(d) { return d.left;})
        .width( function(d) { return d.width;})
        .bottom( function(d) { return d.bottom;})
        .lineWidth( function(d) { return d.lWidth; })
        .strokeStyle(myself.chart.options.boxplotColor);

      this.pvPanel.add(pv.Rule)
        .data(box.subplot.vRules)
        .left(function(d) { return d.left;})
        .height( function(d) { return d.height;})
        .bottom( function(d) { return d.bottom;})
        .lineWidth( function(d) { return d.lWidth; })
        .strokeStyle(myself.chart.options.boxplotColor);

      this.pvPanel.add(pv.Dot)
        .data(box.subplot.marks)
        .left(function(d) { return d.left; })
        .bottom(function(d){ return d.bottom;})
        .fillStyle(function(d) {return d.color;});


      this.pvPanel.add(pv.Label)
        .data(box.subplot.labels)
        .left(function(d) { return d.left; })
        .bottom(function(d){ return d.bottom;})
        .font(function(d) { return d.size;})
        .text(function(d) { return d.text;})
        .textAlign("center")
        .textStyle(function(d) {return d.color;});

    }

    // add the connecting rules (perpendicular rules)
    if (options.perpConnector) {
      this.pvPanel.add(pv.Rule)
        .data(myself.vRules)
        .left(function(d) { return d.left;})
        .bottom(function(d) { return d.bottom;})
        .height(function(d) { return d.height;})
        .strokeStyle("black");
      this.pvPanel.add(pv.Rule)
        .data(myself.hRules)
        .left(function(d) { return d.left;})
        .bottom(function(d) { return d.bottom;})
        .width(function(d) { return d.width;})
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
  }
});
/**
 * @name pvc.data.BoxplotChartTranslationOper
 * 
 * @class The translation operation of the box plot chart.
 * 
 * <p>
 * The default box plot format is:
 * </p>
 * <pre>
 * +----------+----------+-------------+-------------+------------+-------------+
 * | 0        | 1        | 2           | 3           | 4          | 5           |
 * +----------+----------+-------------+-------------+------------+-------------+
 * | category | median   | percentil25 | percentil75 | percentil5 | percentil95 |
 * +----------+----------+-------------+-------------+------------+-------------+
 * | any      | number   | number      | number      | number     | number      |
 * +----------+----------+-------------+-------------+------------+-------------+
 * </pre>
 * 
 * @extends pvc.data.MatrixTranslationOper
 *  
 * @constructor
 * @param {pvc.BoxplotChart} chart The associated box plot chart.
 * @param {pvc.data.ComplexType} complexType The complex type that will represent the translated data.
 * @param {object} source The matrix-format array to be translated.
 * The source is not modified.
 * @param {object} [metadata] A metadata object describing the source.
 * 
 * @param {object} [options] An object with translation options.
 * See additional available options in {@link pvc.data.MatrixTranslationOper}.
 */
def.type('pvc.data.BoxplotChartTranslationOper', pvc.data.MatrixTranslationOper)
.init(function(chart, complexType, source, metadata, options){
    this._chart = chart;

    this.base(complexType, source, metadata, options);
})
.add(/** @lends pvc.data.BoxplotChartTranslationOper# */{
    
    /**
     * @override
     */
    configureType: function(){
        var autoDimsReaders = [];

        function addRole(name, count){
            var visualRole = this._chart.visualRoles(name);
            if(!visualRole.isPreBound()){
                if(count == null) {
                    count = 1;
                }

                var dimGroupName = visualRole.defaultDimensionName.match(/^(.*?)(\*)?$/)[1],
                    level = 0;

                while(level < count){
                    var dimName = pvc.data.DimensionType.dimensionGroupLevelName(dimGroupName, level++);
                    if(!this.complexType.dimensions(dimName, {assertExists: false})){
                        autoDimsReaders.push(dimName);
                    }
                }
            }
        }
        
        var catCount = def.get(this.options, 'categoriesCount', 1);
        if(!(catCount >= 1)){
            catCount = 1;
        }

        addRole.call(this, 'category', catCount);
        pvc.BoxplotChart.measureRolesNames.forEach(function(dimName){
            addRole.call(this, dimName);
        }, this);

        autoDimsReaders.slice(0, this.freeVirtualItemSize());
        if(autoDimsReaders.length){
            this.defReader({names: autoDimsReaders});
        }
    },

    defDimensionType: function(dimName, dimSpec){
        var dimGroup = pvc.data.DimensionType.dimensionGroupName(dimName);
        switch(dimGroup){
            case 'median':
                dimSpec = def.setUDefaults(dimSpec, 'valueType', Number);
                break;
                
            case 'percentil':
                dimSpec = def.setUDefaults(dimSpec, 
                                'valueType', Number,
                                'label',    "{0}% Percentil"); // replaced by dim group level + 1);
                break;
        }
        
        return this.base(dimName, dimSpec);
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
    
    legendSource: null,
    
    constructor: function(options){
        
        options.legend = false;
        
        this.base(options);

        this._axisType2RoleNamesMap.ortho = pvc.BoxplotChart.measureRolesNames;
    },

     _processOptionsCore: function(options){
         this.base.apply(this, arguments);

         options.secondAxis = options.showLines || options.showDots || options.showAreas;
         // Not supported
         options.secondAxisIndependentScale = false;
         options.stacked = false;
         options.legend  = false;
     },

    /**
     * Prevents creation of the series role by the cartesian charts base class.
     */
    _getSeriesRoleSpec: function(){
        return null;
    },

    _hasDataPartRole: function(){
        return true;
    },
    
    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){

        this.base();

        var roleSpecBase = {
                isMeasure: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number
            };

        var rolesSpec = def.query([
                {name: 'median',      label: 'Median',        defaultDimensionName: 'median', isRequired: true},
                {name: 'percentil25', label: '25% Percentil', defaultDimensionName: 'percentil25'},
                {name: 'percentil75', label: '75% Percentil', defaultDimensionName: 'percentil75'},
                {name: 'percentil5',  label: '5% Percentil',  defaultDimensionName: 'percentil5' },
                {name: 'percentil95', label: '95% Percentil', defaultDimensionName: 'percentil95'}
            ])
            .object({
                name:  function(info){ return info.name; },
                value: function(info){ return def.create(roleSpecBase, info); }
            });
        
        this._addVisualRoles(rolesSpec);
    },
    
    _createTranslation: function(complexType, translOptions){
        return new pvc.data.BoxplotChartTranslationOper(
                        this,
                        complexType,
                        this.resultset,
                        this.metadata,
                        translOptions);
    },

    _isDataCellStacked: function(/*role, dataPartValue*/){
        return false;
    },

    /* @override */
    _createMainContentPanel: function(parentPanel){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in boxplotChart");
        }
        
        var options = this.options;
        
        var boxPanel = new pvc.BoxplotChartPanel(this, parentPanel, {
            orientation:   options.orientation,
            // boxplot specific options
            boxSizeRatio:  options.boxSizeRatio,
            maxBoxSize:    options.maxBoxSize,
            boxplotColor:  options.boxplotColor
        });

        if(options.secondAxis){
            if(pvc.debug >= 3){
                pvc.log("Creating LineDotArea panel.");
            }

            var linePanel = new pvc.LineDotAreaPanel(this, parentPanel, {
                orientation:    options.orientation,
                stacked:        false,
                showValues:     !(options.compatVersion <= 1) && options.showValues,
                valuesAnchor:   options.valuesAnchor,
                showLines:      options.showLines,
                showDots:       options.showDots,
                showAreas:      options.showAreas,
                nullInterpolationMode: options.nullInterpolationMode
            });

            this._linePanel = linePanel;
        }

        return boxPanel;
    },
    
    defaults: def.create(pvc.CategoricalAbstract.prototype.defaults, {
        boxplotColor: 'darkgreen',
        boxSizeRatio: 1/3,
        maxBoxSize:   Infinity,
        showDots:     false,
        showLines:    false,
        showAreas:    false,
        nullInterpolationMode: 'none',
        showValues:   false,
        valuesAnchor: 'right'
    })
}, {
    measureRolesNames: ['median', 'percentil25', 'percentil75', 'percentil5', 'percentil95']
});

/*
 * Boxplot chart panel generates the actual box-plot with a categorical base-axis.
 * for more information on the options see the documentation file.
 */
pvc.BoxplotChartPanel = pvc.CartesianAbstractPanel.extend({
    anchor: 'fill',
    
    /**
     * @override
     */
    _createCore: function(){

        this.base();
        
        var rootScene = this._buildScene();

        var a_bottom = this.isOrientationVertical() ? "bottom" : "left",
            a_left   = this.anchorOrtho(a_bottom),
            a_width  = this.anchorLength(a_bottom),
            a_height = this.anchorOrthoLength(a_bottom),
            strokeColor  = pv.color(this.boxplotColor),
            boxFillColor = pv.color('limegreen')
            ;

        /* Category Panel */
        this.pvBoxPanel = this.pvPanel.add(pv.Panel)
            .data(rootScene.childNodes)
            [a_left ](function(scene){
                var catVar = scene.vars.category;
                return catVar.x - catVar.width / 2;
            })
            [a_width](function(scene){ return scene.vars.category.width; })
            ;

        /* V Rules */
        function setupVRule(rule){
            rule.lock(a_left, function(){ 
                    return this.pvMark.parent[a_width]() / 2;
                })
                .override('defaultColor', function(type){
                    if(type === 'stroke') { 
                        return strokeColor;
                    }
                })
                ;

            return rule;
        }

        this.pvVRuleTop = setupVRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:  'boxVRule',
                freePosition: true,
                noHover:   false,
                noSelect:  false,
                noClick:       false,
                noDoubleClick: false
            }))
            .intercept('visible', function(scene){
                return scene.vars.category.showVRuleAbove && this.delegate(true);
            })
            .lock(a_bottom, function(scene){ return scene.vars.category.vRuleAboveBottom; })
            .lock(a_height, function(scene){ return scene.vars.category.vRuleAboveHeight; })
            .pvMark
            ;

        this.pvVRuleBot = setupVRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:  'boxVRule',
                freePosition: true,
                noHover:   false,
                noSelect:  false,
                noClick:       false,
                noDoubleClick: false
            }))
            .intercept('visible', function(scene){
                return scene.vars.category.showVRuleBelow && this.delegate(true);
            })
            .lock(a_bottom, function(scene){ return scene.vars.category.vRuleBelowBottom; })
            .lock(a_height, function(scene){ return scene.vars.category.vRuleBelowHeight; })
            .pvMark
            ;

        /* Box Bar */
        function setupHCateg(sign){
            sign.lock(a_left,  function(scene){ return scene.vars.category.boxLeft;  })
                .lock(a_width, function(scene){ return scene.vars.category.boxWidth; })
                ;
            
            return sign;
        }

        this.pvBar = setupHCateg(new pvc.visual.Bar(this, this.pvBoxPanel, {
                extensionId: 'boxBar',
                freePosition: true,
                normalStroke: true
            }))
            .intercept('visible', function(scene){
                return scene.vars.category.showBox && this.delegate(true);
            })
            .lock(a_bottom, function(scene){ return scene.vars.category.boxBottom; })
            .lock(a_height, function(scene){ return scene.vars.category.boxHeight; })
            .override('defaultColor', function(type){
                switch(type){
                    case 'fill':   return boxFillColor;
                    case 'stroke': return strokeColor;
                }
            })
            .override('defaultStrokeWidth', def.fun.constant(1))
            .pvMark
            ;

        /* H Rules */
        function setupHRule(rule){
            setupHCateg(rule);
            
            rule.override('defaultColor', function(type){
                    if(type === 'stroke') { return strokeColor; }
                })
                ;
            return rule;
        }
        
        this.pvHRule5 = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:  'boxHRule5',
                freePosition: true,
                noHover:   false,
                noSelect:  false,
                noClick:       false,
                noDoubleClick: false
            }))
            .intercept('visible', function(){
                return this.scene.vars.percentil5.value != null && this.delegate(true);
            })
            .lock(a_bottom,  function(){ return this.scene.vars.percentil5.position; }) // bottom
            .pvMark
            ;

        this.pvHRule95 = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:  'boxHRule95',
                freePosition: true,
                noHover:   false,
                noSelect:  false,
                noClick:       false,
                noDoubleClick: false
            }))
            .intercept('visible', function(){
                return this.scene.vars.percentil95.value != null && this.delegate(true);
            })
            .lock(a_bottom,  function(){ return this.scene.vars.percentil95.position; }) // bottom
            .pvMark
            ;

        this.pvHRule50 = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:  'boxHRule50',
                freePosition: true,
                noHover:   false,
                noSelect:  false,
                noClick:       false,
                noDoubleClick: false
            }))
            .intercept('visible', function(){
                return this.scene.vars.median.value != null && this.delegate(true);
            })
            .lock(a_bottom,  function(){ return this.scene.vars.median.position; }) // bottom
            .override('defaultStrokeWidth', def.fun.constant(2))
            .pvMark
            ;
    },

    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        // Extend bar and barPanel
        this.extend(this.pvBoxPanel, "boxPanel_");
        this.extend(this.pvBoxPanel, "box_");
        this.extend(this.pvBar,      "boxBar_");
        this.extend(this.hRule50,    "boxHRule50_");
        this.extend(this.hRule5,     "boxHRule5_");
        this.extend(this.hRule95,    "boxHRule95_");
        this.extend(this.pvVRuleTop, "boxVRule_");
        this.extend(this.pvVRuleBot, "boxVRule_");
    },

    /**
     * Renders this.pvScatterPanel - the parent of the marks that are affected by interaction changes.
     * @override
     */
    _renderInteractive: function(){
        this.pvBoxPanel.render();
    },

    /**
     * Returns an array of marks whose instances are associated to a datum or group, or null.
     * @override
     */
    _getSignums: function(){
        return [this.pvBar];
    },

    _buildScene: function(){
        var chart = this.chart,
            measureRolesDimNames = def.query(chart.measureVisualRoles()).object({
                name:  function(role){ return role.name; },
                value: function(role){ return role.firstDimensionName(); }
            }),
            visibleKeyArgs = {visible: true, zeroIfNone: false},
            data = this._getVisibleData(),
            rootScene  = new pvc.visual.Scene(null, {panel: this, group: data}),
            baseScale  = chart.axes.base.scale,
            bandWidth  = baseScale.range().band,
            boxWidth   = Math.min(bandWidth * this.boxSizeRatio, this.maxBoxSize),
            orthoScale = chart.axes.ortho.scale
            ;

        /**
         * Create starting scene tree
         */
        data.children() // categories
            .each(createCategScene, this);

        return rootScene;
        
        function createCategScene(categData){
            var categScene = new pvc.visual.Scene(rootScene, {group: categData}),
                vars = categScene.vars;
            
            var catVar = vars.category = new pvc.visual.ValueLabelVar(
                                    categData.value,
                                    categData.label);
            def.set(catVar,
                'group',    categData,
                'x',        baseScale(categData.value),
                'width',    bandWidth,
                'boxWidth', boxWidth,
                'boxLeft',  bandWidth / 2 - boxWidth / 2);
            
            chart.measureVisualRoles().forEach(function(role){
                var dimName = measureRolesDimNames[role.name],
                    svar;

                if(dimName){
                    var dim = categData.dimensions(dimName),
                        value = dim.sum(visibleKeyArgs);
                    
                    svar = new pvc.visual.ValueLabelVar(value, dim.format(value));
                    svar.position = orthoScale(value);
                } else {
                    svar = new pvc.visual.ValueLabelVar(null, "");
                    svar.position = null;
                }

                vars[role.name] = svar;
            });

            var has05 = vars.percentil5.value  != null,
                has25 = vars.percentil25.value != null,
                has50 = vars.median.value != null,
                has75 = vars.percentil75.value != null,
                bottom,
                top;

            var show = has25 || has75;
            if(show){
                bottom = has25 ? vars.percentil25.position :
                         has50 ? vars.median.position :
                         vars.percentil75.position
                         ;

                top    = has75 ? vars.percentil75.position :
                         has50 ? vars.median.position :
                         vars.percentil25.position
                         ;

                show = (top !== bottom);
                if(show){
                    catVar.boxBottom = bottom;
                    catVar.boxHeight = top - bottom;
                }
            }
            
            catVar.showBox  = show;
            
            // vRules
            show = vars.percentil95.value != null;
            if(show){
                bottom = has75 ? vars.percentil75.position :
                         has50 ? vars.median.position :
                         has25 ? vars.percentil25.position :
                         has05 ? vars.percentil5.position  :
                         null
                         ;
                
                show = bottom != null;
                if(show){
                    catVar.vRuleAboveBottom = bottom;
                    catVar.vRuleAboveHeight = vars.percentil95.position - bottom;
                }
            }

            catVar.showVRuleAbove = show;

            // ----

            show = has05;
            if(show){
                top = has25 ? vars.percentil25.position :
                      has50 ? vars.median.position :
                      has75 ? vars.percentil75.position :
                      null
                      ;

                show = top != null;
                if(show){
                    bottom = vars.percentil5.position;
                    catVar.vRuleBelowHeight = top - bottom;
                    catVar.vRuleBelowBottom = bottom;
                }
            }
            
            catVar.showVRuleBelow = show;
            
            // has05 = vars.percentil5.value  != null,
        }
    }
});
    
    return pvc;
});
