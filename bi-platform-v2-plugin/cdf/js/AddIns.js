/**
 * Creates a new AddIn.
 * 
 * The options parameter needs a label and name member, and must have
 * either a value (for static Add Ins) or implementation member (for
 * scriptable Add Ins). Should the AddIn support configuration, then
 * there should also be an options.defaults member containing the
 * default values for the configurable settings.
 *
 * @class AddIns come in two varieties: Static AddIns
 * represent static data or behaviour, whereas Scriptable AddIns
 * represent dynamic, context-dependent behaviour.
 *
 * @property {String} label  The AddIn's human-readable label. (read only) 
 * @property {String} name The internal identifier for the AddIn. (read only) 
 * @parameters options {Object} The options for the AddIn.
 */

function AddIn(options) {
  
  var myself = options;
  if (typeof options != "object") {
    throw TypeError;
  }
  /* We expect either an implementation or a value. */
  if (!options.label || !options.name || (!options.implementation && !options.value)) {
    throw TypeError;
  }
  var _name = options.name,
  _label = options.label,
  _type = options.implementation ? "scriptable" : "static",
  /* It's OK if any of these ends up being undefined */
  _implementation = options.implementation,
  _defaults = options.defaults,
  _value = options.options;
    
  /* Do we have an init method? Call it now */
  if(typeof options.init === 'function'){
    options.init.call(myself);
  }

  this.getLabel = function() {
    return _label;
  }
  this.getName = function() {
    return _name;
  }

  /**
   * Call the AddIn. If the AddIn is static, all parameters are
   * irrelevant, and this method will simply return the value.
   * 
   * In a dynamic AddIn, the implementation will be passed the
   * the target DOM Element (whatever element is relevant,
   * e.g. the element that was clicked on, or the table cell
   * that's being processed), a state object with whatever
   * context is relevant for the AddIn to fulfill its purpose,
   * and optionally any overriding options.
   *
   * Components are allowed to pass undefined as the target if 
   * no Elements make sense in context, and 
   *
   * @parameter target {Element} The relevant DOM Element.
   * @parameter state {Object} A representation of the necessary
   * context for the AddIn to operate.
   * @parameter options {Object} Configuration options for the AddIn
   */
  this.call = function(target, state, options) {
    if (!_implementation) {
      return Dashboards.clone(_value);
    }
    options = typeof options == "function" ? options(state) : options;
    var evaluatedDefaults = typeof _defaults == "function" ? _defaults(state) : _defaults;
    var compiledOptions = jQuery.extend(true,{},evaluatedDefaults,options);
    try{
      return _implementation.call(myself,target,state,compiledOptions);    
    }
    catch(e){Dashboards.log("Addin Error [" + this.getName() + "]: " + e,"error");}
  };

  this.setDefaults = function(defaults) {
    
    if (typeof defaults == 'function') {
      _defaults = defaults;
    }
    else{
      _defaults = jQuery.extend(true,{},_defaults,defaults);
    }
  };
}
