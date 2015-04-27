/*Copyright (c) 2013 Matt Snider

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.*/

(function ($) {
	// encapsulate variables that need only be defined once
	var pl = /\+/g,  // Regex for replacing addition symbol with a space
		searchStrict = /([^&=]+)=+([^&]*)/g,
		searchTolerant = /([^&=]+)=?([^&]*)/g,
		decode = function (s) {
			return decodeURIComponent(s.replace(pl, " "));
		};
	
	// parses a query string. by default, will only match good k/v pairs.
	// if the tolerant option is truthy, then it will also set keys without values to ''
	$.parseQuery = function(query, options) {
		var match,
			o = {},
			opts = options || {},
			search = opts.tolerant ? searchTolerant : searchStrict;
		
		if ('?' === query.substring(0, 1)) {
			query  = query.substring(1);
		}
		
		// each match is a query parameter, add them to the object
		while (match = search.exec(query)) {
			o[decode(match[1])] = decode(match[2]);
		}
		
		return o;
	}
	
	// parse this URLs query string
	$.getQuery = function(options) {
		return $.parseQuery(window.location.search, options);
	}

    $.fn.parseQuery = function (options) {
        return $.parseQuery($(this).serialize(), options);
    };
}(jQuery));