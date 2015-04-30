var pen = {
  _loadedModulesById: {},
  
  // Force 'define' to evaluate module definitions immediately
  define: function() {
    var id,
        deps,
        definition,
        i = 0,
        L = arguments.length;

    while(i < L) {
      var a = arguments[i++];
      switch(typeof a) {
        case 'string':
          id = a;
          break;
        
        case 'function':
          definition = a;
          break;
         
        case 'object':
          if(a instanceof Array) {
            deps = a;
          }
          break;
      }
    }
    
    if(definition) {
      // Evaluate deps
      if(deps) {
      
        var newDeps = [];
        for(i = 0; i < deps.length; i++) {
          if(deps[i] == 'cdf/jquery' || deps[i] == 'cdf-legacy/jquery') {
            newDeps.push($);
          } else {
            newDeps.push(this._loadedModulesById[deps[i]]);
          }
        }
            
        deps = newDeps;

      } else {
        deps = [];
      }
        
      var module = definition.apply(null, deps);
      if(id && !this._loadedModulesById[id]) {
        this._loadedModulesById[id] = module;
      }
    }
  },
    
  require: function() {
    var args = Array.prototype.slice.apply(arguments);
    args.unshift(""); // "" empty id;
      
    return this.define.apply(this, args);
  }
};

if(typeof define === "undefined") {
  define = function() {
    return pen.define.apply(pen, arguments);
  };
}

if(typeof require === "undefined") {
  require = function() {
    return pen.require.apply(pen, arguments);
  };
}

if(typeof Encoder === "undefined") {
  Encoder = {};
  /*
  args === "undefined" returns raw value of str
  args === null and str with no {#} returns raw value of str with encoded parameters in queryObj
  args === object||array and str with {#} returns double encoded encodedUrl with encoded parameters in queryObj
  */
  Encoder.encode = function(str, args, queryObj) {
    "use strict"
    if(typeof args === "undefined") {
      return str;
    }
    if(args instanceof Array === false) {
      args = [args];
    }
    var matchArray = str.match(/{[0-9]+}/g),
        encodedUrl = "",
        startIndex,
        urlPrefix,
        tmp,
        i;

    if(matchArray && matchArray.length > 0) {
      // start building encodedURL with it's prefix value
      startIndex = 0;
      for(i = 0; i < matchArray.length && i < args.length; i++) {
        urlPrefix = str.substring(startIndex, str.indexOf(matchArray[i]) - 1);
        // get the encoded value of args[index], index = numeric value inside brackets, e.g. '{0}'
        tmp = encodeURIComponent(args[matchArray[i].substring(1, matchArray[i].length - 1)]);
        // double-encode / and \ to work around Tomcat issue
        tmp = tmp.replace("%5C", "%255C").replace("%2F", "%252F");
        encodedUrl += urlPrefix + "/" + tmp;

        startIndex = str.indexOf(matchArray[i]) + matchArray[i].length;
      }
      // append suffix
      encodedUrl +=  str.substring(str.indexOf(matchArray[matchArray.length - 1]) + matchArray[matchArray.length - 1].length, str.length);
    } else {
      //throw new SyntaxError("Please add {#} in the URL for each value in Array args");
      encodedUrl = str;
    }
    // encode and append parameters to URL
    if(queryObj) {
      encodedUrl += "?" + $.param(queryObj);
    }
    return encodedUrl;
  };

  Encoder.encodeRepositoryPath = function(str) {
    "use strict"
    var encodedStr = String(str).replace(new RegExp(":", "g"), "::").replace(new RegExp("[\\\\/]", "g"), ":");
    return encodedStr;
  };

  Encoder.decodeRepositoryPath = function(str) {
    return String(str).replace(new RegExp(":", "g"), "\/").replace(new RegExp("\/\/", "g"), ":");
  };
}
