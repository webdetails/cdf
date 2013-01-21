var pen = {
    _loadedModulesById: {},
    
    // Force 'define' to evaluate module definitions immediately
    define: function () {
        var id, deps, definition;
        
        var i = 0;
        var L = arguments.length;
        while(i < L){
            var a = arguments[i++];
            switch(typeof a){
                case 'string':
                    id = a;
                    break;
                
                case 'function':
                    definition = a;
                    break;
                 
                case 'object':
                    if(a instanceof Array){
                        deps = a;
                    }
                    break;
            }
        }
        
        if(definition){
            // Evaluate deps
            if(deps){
                deps = deps.map(function(depId){
                            return this._loadedModulesById[depId];
                        }, this);
            } else {
                deps = [];
            }
            
            var module = definition.apply(null, deps);
            if(id && !this._loadedModulesById[id]){
                this._loadedModulesById[id] = module;
            }
        }
    },
    
    require: function(){
        var args = Array.prototype.slice.apply(arguments);
        args.unshift(""); // "" empty id;
        
        return this.define.apply(this, args);
    }
};