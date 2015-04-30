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

/*
 *  Copied directly from http://www.json.org/json.js.
 */

/*
    json.js
    2006-04-28

    This file adds these methods to JavaScript:

        object.toJSONString()

            This method produces a JSON text from an object. The
            object must not contain any cyclical references.

        array.toJSONString()

            This method produces a JSON text from an array. The
            array must not contain any cyclical references.

        string.parseJSON()

            This method parses a JSON text to produce an object or
            array. It will return false if there is an error.
*/

SimileAjax.JSON = new Object();

(function () {
    var m = {
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    };
    var s = {
        array: function (x) {
            var a = ['['], b, f, i, l = x.length, v;
            for (i = 0; i < l; i += 1) {
                v = x[i];
                f = s[typeof v];
                if (f) {
                    v = f(v);
                    if (typeof v == 'string') {
                        if (b) {
                            a[a.length] = ',';
                        }
                        a[a.length] = v;
                        b = true;
                    }
                }
            }
            a[a.length] = ']';
            return a.join('');
        },
        'boolean': function (x) {
            return String(x);
        },
        'null': function (x) {
            return "null";
        },
        number: function (x) {
            return isFinite(x) ? String(x) : 'null';
        },
        object: function (x) {
            if (x) {
                if (x instanceof Array) {
                    return s.array(x);
                }
                var a = ['{'], b, f, i, v;
                for (i in x) {
                    v = x[i];
                    f = s[typeof v];
                    if (f) {
                        v = f(v);
                        if (typeof v == 'string') {
                            if (b) {
                                a[a.length] = ',';
                            }
                            a.push(s.string(i), ':', v);
                            b = true;
                        }
                    }
                }
                a[a.length] = '}';
                return a.join('');
            }
            return 'null';
        },
        string: function (x) {
            if (/["\\\x00-\x1f]/.test(x)) {
                x = x.replace(/([\x00-\x1f\\"])/g, function(a, b) {
                    var c = m[b];
                    if (c) {
                        return c;
                    }
                    c = b.charCodeAt();
                    return '\\u00' +
                        Math.floor(c / 16).toString(16) +
                        (c % 16).toString(16);
                });
            }
            return '"' + x + '"';
        }
    };

    SimileAjax.JSON.toJSONString = function(o) {
        if (o instanceof Object) {
            return s.object(o);
        } else if (o instanceof Array) {
            return s.array(o);
        } else {
            return o.toString();
        }
    };
    
    SimileAjax.JSON.parseJSON = function () {
        try {
            return !(/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(
                    this.replace(/"(\\.|[^"\\])*"/g, ''))) &&
                eval('(' + this + ')');
        } catch (e) {
            return false;
        }
    };
})();
