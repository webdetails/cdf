/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

/*==================================================
 *  This file is used to detect that all outstanding
 *  javascript files have been loaded. You can put
 *  a function reference into SimileAjax_onLoad
 *  to have it executed once all javascript files
 *  have loaded.
 *==================================================
 */

(function() {
    var substring = SimileAjax.urlPrefix + "scripts/signal.js";
    var heads = document.documentElement.getElementsByTagName("head");
    for (var h = 0; h < heads.length; h++) {
        var node = heads[h].firstChild;
        while (node != null) {
            if (node.nodeType == 1 && node.tagName.toLowerCase() == "script") {
                var url = node.src;
                var i = url.indexOf(substring);
                if (i >= 0) {
                    heads[h].removeChild(node); // remove it so we won't hit it again
                    
                    var count = parseInt(url.substr(substring.length + 1));
                    SimileAjax.loadingScriptsCount -= count;
                    
                    if (SimileAjax.loadingScriptsCount == 0) {
                        var f = null;
                        if (typeof SimileAjax_onLoad == "string") {
                            f = eval(SimileAjax_onLoad);
                            SimileAjax_onLoad = null;
                        } else if (typeof SimileAjax_onLoad == "function") {
                            f = SimileAjax_onLoad;
                            SimileAjax_onLoad = null;
                        }
                        
                        if (f != null) {
                            f();
                        }
                    }
                    return;
                }
            }
            node = node.nextSibling;
        }
    }
})();
