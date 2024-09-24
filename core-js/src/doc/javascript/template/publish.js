/*global env: true */
'use strict';

var doop = require('jsdoc/util/doop');
var fs = require('jsdoc/fs');
var helper = require('jsdoc/util/templateHelper');
var logger = require('jsdoc/util/logger');
var path = require('jsdoc/path');
var taffy = require('taffydb').taffy;
var template = require('jsdoc/template');
var util = require('util');

//override htmlsafe function
helper.htmlsafeOrig = helper.htmlsafe;
helper.htmlsafe = function( string ) {
    return helper.htmlsafeOrig( string ).replace(/>/g, '&gt;').replace(/\n/g, '<br>');
};

var htmlsafe = helper.htmlsafe;
var linkto = helper.linkto;
var resolveAuthorLinks = helper.resolveAuthorLinks;

var data;
var view;

env.opts.githubConfig = env.opts.githubConfig || {};

var outdir = path.normalize(env.opts.destination);

function trimDoubleQuotes(string) {
    var match = /^"(.+)"$/.exec(string);
    return match !== null ? match[1] : string;
}

function find(spec) {
    return helper.find(data, spec);
}

function tutoriallink(tutorial) {
    return helper.toTutorial(tutorial, null, { tag: 'em', classname: 'disabled', prefix: 'Tutorial: ' });
}

function getAncestorLinks(doclet) {
    return helper.getAncestorLinks(data, doclet);
}

function hashToLink(doclet, hash) {
    if ( !/^(#.+)/.test(hash) ) { return hash; }

    var url = helper.createLink(doclet).replace(/(#.+|$)/, hash);

    return '<a href="' + url + '">' + hash + '</a>';
}

function needsSignature(doclet) {
    var needsSig = false;

    // function and class definitions always get a signature
    if (doclet.kind === 'function' || doclet.kind === 'class') {
        needsSig = true;
    }
    // typedefs that contain functions get a signature, too
    else if (doclet.kind === 'typedef' && doclet.type && doclet.type.names &&
        doclet.type.names.length) {
        for (var i = 0, l = doclet.type.names.length; i < l; i++) {
            if (doclet.type.names[i].toLowerCase() === 'function') {
                needsSig = true;
                break;
            }
        }
    }

    return needsSig;
}

function updateItemName(item) {
  return item.name || '';
}

function addParamAttributes(params) {
    return params.filter(function(param) {
        return param.name && param.name.indexOf('.') === -1;
    }).map(updateItemName);
}

function buildItemTypeStrings(item) {
    var types = [];

    if (item && item.type && item.type.names) {
        item.type.names.forEach(function(name) {
            types.push( linkto(name, htmlsafe(name)) );
        });
    }

    return types;
}

function buildAttribsString(attribs) {
    var attribsString = '';

    if (attribs && attribs.length) {
        attribsString = htmlsafe( util.format('(%s) ', attribs.join(', ')) );
    }

    return attribsString;
}

function addSignatureParams(f) {
    var params = f.params ? addParamAttributes(f.params) : [];

    f.signature = util.format( '%s(%s)', (f.signature || ''), params.join(', ') );
}

function addSignatureTypes(f) {
    var types = f.type ? buildItemTypeStrings(f) : [];

    f.signature = (f.signature || '') + '<span class="type-signature">' +
        (types.length ? ' :' + types.join('|') : '') + '</span>';
}

function addAttribs(f) {
    var attribs = helper.getAttribs(f);
    var attribsString = buildAttribsString(attribs);

    f.attribs = util.format('<span class="type-signature">%s</span>', attribsString);
}

function shortenPaths(files, commonPrefix) {
    Object.keys(files).forEach(function(filename) {
        var file = files[filename];
        file.shortened = file.resolved.replace(commonPrefix, '')
            // always use forward slashes
            .replace(/\\/g, '/');
    });

    return files;
}

function getPathFromDoclet(doclet) {
    if (!doclet.meta) {
        return null;
    }

    return doclet.meta.path && doclet.meta.path !== 'null' ?
        path.join(doclet.meta.path, doclet.meta.filename) :
        doclet.meta.filename;
}

function getSourceFromDoclet(doclet, gitRepoName) {
  var path = doclet.meta.path.replace(/\\/g,"/");
  var pathLength = path.length;

  var nameLength = gitRepoName ? gitRepoName.length : 0;
  var nameIndexOf = gitRepoName ? path.indexOf(gitRepoName) + 1 : 0;

  return path.substring(nameIndexOf + nameLength, pathLength);
}

function getLinkFromDoclet(doclet) {
  if (!doclet.meta) {
    return null;
  }

  var filename = doclet.meta.filename;
  var shortPath = doclet.meta.shortpath;
  var lineNumber = doclet.meta.lineno;

  var repoName     = _getGitHubName();
  var repoVersion  = _getGitHubBranch();

  var isJavascriptFile = shortPath && shortPath.indexOf('.js') !== -1;
  var type = isJavascriptFile ? 'tree' : 'blob';

  var path = getSourceFromDoclet(doclet, repoName);
  var linkBase = _getGitHubUrl() + '/' + type + '/' + repoVersion + '/' + path;

  var url = linkBase + '/' + filename + (lineNumber ? '#L' + lineNumber : '');
  var linkText = shortPath + (lineNumber ? ', line ' + lineNumber : '');

  return '<a href="' + url + '" target="_blank">' + linkText + '</a>';
}

function _getGitHubName() {
  var config = env.opts.githubConfig;

  if (config.name) {
    return config.name;
  }

  if (config.url) {
    var url = config.url.replace(/(^\/|\/$)/, '');
    var lastSlash = url.lastIndexOf('/');

    return lastSlash !== -1 ? url.substring(lastSlash, url.length) : url;
  }

  return null;
}

function _getGitHubBranch() {
  var config = env.opts.githubConfig;

  var branch = config.branch;
  if (!branch) {
    branch = 'master';
  }

  return branch;
}

function _getGitHubUrl() {
  var config = env.opts.githubConfig;

  var url = config.url;
  if (!url) {
    var urlBase = "https://github.com/";
    url =  urlBase + config.company + "/" + config.name;
  } else {
    url = url.replace(/\/$/, '');
  }

  return url;
}

function generate(title, docs, filename, resolveLinks) {
    resolveLinks = resolveLinks !== false;

    var docData = {
        title: title,
        docs: docs
    };

    var outpath = path.join(outdir, filename),
        html = view.render('container.tmpl', docData);

    if (resolveLinks) {
        html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>
    }

    fs.writeFileSync(outpath, html, 'utf8');
}

/**
 * Look for classes or functions with the same name as modules (which indicates that the module
 * exports only that class or function), then attach the classes or functions to the `module`
 * property of the appropriate module doclets. The name of each class or function is also updated
 * for display purposes. This function mutates the original arrays.
 *
 * @private
 * @param {Array.<module:jsdoc/doclet.Doclet>} doclets - The array of classes and functions to
 * check.
 * @param {Array.<module:jsdoc/doclet.Doclet>} modules - The array of module doclets to search.
 */
function attachModuleSymbols(doclets, modules) {
    var symbols = {};

    // build a lookup table
    doclets.forEach(function(symbol) {
        symbols[symbol.longname] = symbols[symbol.longname] || [];
        symbols[symbol.longname].push(symbol);
    });

    return modules.map(function(module) {
        if (symbols[module.longname]) {
            module.modules = symbols[module.longname]
                // Only show symbols that have a description. Make an exception for classes, because
                // we want to show the constructor-signature heading no matter what.
                .filter(function(symbol) {
                    return symbol.description || symbol.kind === 'class';
                })
                .map(function(symbol) {
                    symbol = doop(symbol);

                    if (symbol.kind === 'class' || symbol.kind === 'function') {
                        symbol.name = symbol.name.replace('module:', '(require("') + '"))';
                    }

                    return symbol;
                });
        }
    });
}

function findMembers(data, kind, memberOf) {
    var spec = {kind: kind, memberof: memberOf},
        search = helper.find(data, spec),
        members = [];

    search.forEach(function(_member) {
        members.push(createMemberData(data, _member, kind));

    });

    return members;
}

function createMemberData(data, member, kind) {
    var memberData = {
        name: trimDoubleQuotes(member.name),
        longname: member.longname,
        kind: kind
    };

    var hasPrefix = member.name !== member.longname;
    var prefix = hasPrefix ? member.longname.replace(member.name, '') : "";

    if(kind === 'class' || kind === 'namespace') {
        memberData.interfaces = findMembers(data, 'interface', member.longname);
        memberData.classes = findMembers(data, 'class', member.longname);
        memberData.events = findMembers(data, 'event', member.longname);
    }

    if(kind === 'namespace') {
        memberData.title = prefix + "<strong>" + linkto(member.longname, member.name) + "</strong>";
    }

    if(kind === 'event') {
        if(typeof member.scope === "string") {
            if(member.scope === "static") {
                memberData.title = prefix.replace("#event:", ".html#.event:").replace(/\"/g, "_") + encodeURI(member.name);
            } else if(member.scope === "instance") {
                memberData.title = prefix.replace("#event:", ".html#event:").replace(/\"/g, "_") + encodeURI(member.name);
            }
        }
    }

    return memberData;
}

function buildNav(members) {
    if(members == null || members.length === 0) return "";

    var nav = "";
    members.forEach(function(namespace, index) {
        nav += '<li class="namespaceEntry">';
        nav += '  <button id="toggle_' + index + '" class="mt-toggle-expand mt-toggle"></button>';
        nav += '  <span>' + namespace.title + '</span>';
        nav += '  <ul id="namespace_' + index + '" style="display:none;">';
        nav += buildMembers(namespace.interfaces, 'Interfaces', linkto);
        nav += buildMembers(namespace.classes, 'Classes', linkto);
        nav += buildMembers(namespace.events, 'Events', linkto);
        nav += '  </ul>';
        nav += '</li>';
    });

    return '<ul class="index-nav">' + nav + '</ul>' + buildToggleScript();
}

function buildMembers(members, title, linktoFn) {
    if(members == null || members.length === 0 ) return "";

    var memberNav = "";
    members.forEach(function(member) {
        var link = member.kind === "event" ? '<a href="' + member.title + '">' + member.name + '</a>' : linktoFn(member.longname, member.name);

        var innerNav = "";
        memberNav += '<li>' + link + '</li>';
        innerNav += buildMembers(member.interfaces, 'Interfaces', linktoFn);
        innerNav += buildMembers(member.classes, 'Classes', linktoFn);
        innerNav += buildMembers(member.events, 'Events', linktoFn);
        memberNav += innerNav !== "" ? "<ul>" + innerNav + "</ul>" : "";
    });

    return '<li class="title">' + title + '</li>' + memberNav;
}

function buildToggleScript() {
    return "<script type=\"text/javascript\">" +
        "  $(\".index-nav button[id^='toggle_']\").click(function() {" +
        "    var $this = $(this);" +
        "    var index = $this.attr('id').replace('toggle_', '');" +
        "    $this.toggleClass('mt-toggle-expand').toggleClass('mt-toggle-collapse');" +
        "    $('ul#namespace_' + index).toggleClass('namespace-collapsed').slideToggle();" +
        "  });" +
        "</script>";
}

function registerTypeHelpers(view) {
  view._typeBuilder = typeBuilder;

  var mdnJsTypeBaseURL = "http://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/";
  var mdnJsWindowBaseURL = "https://developer.mozilla.org/en-US/docs/Web/API/Window/";
  var mdnJsTypes = {
    "string" : true,  "String": true,
    "number": true,   "Number": true,
    "boolean": true,  "Boolean": true,
    "array": true,    "Array": true,
    "object": true,   "Object": true,
    "function": true, "Function": true,
    "Date": true,     "Promise": true,
    "null": true,     "undefined": true,

    "RegExp": true,    "Reflect": true,
    "DataView": true,  "Intl": true,
    "Generator": true, "GeneratorFunction": true,
    "Proxy": true,     "JSON": true,

    "Error": true,      "EvalError": true,
    "TypeError": true,  "SyntaxError": true,
    "RangeError": true, "InternalError": true,
    "URIError": true,   "ReferenceError": true,

    "TypedArray": true,    "ArrayBuffer": true,
    "Float32Array": true,  "Float64Array": true,
    "Int8Array": true,     "Int32Array": true,
    "Inttrue6Array": true, "Uinttrue6Array": true,
    "Uint8Array": true,     "Uint8ClampedArray": true,
    "Uint32Array": true,

    "Map": true, "WeakMap": true,
    "Set": true, "WeakSet": true,
    "Math": true, "Symbol": true
  };

  var mdnJsWindow = {
    "URL": true
  };

  var backboneTypeBaseURL = "http://backbonejs.org/#";
  var jQueryTypes = {
    "jquery": "jQuery",
    "selector": "Selector"
  };
  var jQueryTypeBaseURL = "http://api.jquery.com/Types/#";

  var modifiers = "[?!]?";
  var left_p = "\\(?";
  var right_p = "\\)?";
  var remainder = "$|(?:[|,]\\s*)(.+)";
  var complexProps = "[<(?!\\w|,. )>]+";
  var BACKBONE_TYPE_REGX = /backbone\.([a-z]+)/i;

  // regx: /([?!]?)([\w.*]+)(?:())?/
  //
  // Examples:
  // input: "Object"
  // match: [ input, '', 'Object' ]
  //
  // input: "!Object"
  // match: [ input, '!', 'Object' ]
  //
  // input: "Object.<Boolean>"
  // match: null
  var SIMPLE_TYPE_REGX = new RegExp("(" + modifiers + ")([\\w.*]+)(?:\\(\\))?");

  // regx: /^(?:([?!]?)([\w.]+))\.<([<(?!\w|,. )>]+)>/
  //
  // Examples:
  // input: "Array"
  // match: null;
  //
  // input: "!Array.<Object>"
  // match: [ input, '!', 'Array', 'Object' ]
  //
  // input: "Class.<Object.<String, Date>, Boolean>"
  // match: [ input, '', 'Class', 'Object.<String, Date>, Boolean' ]
  var COMPLEX_TYPE_REGX = new RegExp("^(?:(" + modifiers + ")([\\w.]+))\\.<(" + complexProps + ")>");
  var TYPE_MODIFIER = 1;
  var TYPE_NAME = 2;
  var COMPLEX_TYPE_PROPS = 3;

  // regx: /(\(?(?:[\w|.*!?]+)\)?(?:\.<(?:[<(?!\w|,. )>]+)>)?)(?:$|(?:[|,]\s*)(.+))/
  //
  // Examples:
  // input: "Object.<String, Date>, Boolean, Date, Class.<Function>"
  // match: [ input, 'Object.<String, Date>', 'Date, Class.<Function>' ]
  //
  // input: "Boolean, Date, Class.<Function>"
  // match: [ input, 'Boolean', 'Date, Class.<Function>' ]
  //
  // input: "Date, Class.<Function>"
  // match: [ input, 'Date', 'Class.<Function>' ]
  //
  // input: "Class.<Function>"
  // match: [ input, 'Class.<Function>', undefined ]
  var C_PROPS_RECURSIVE_REGX = new RegExp(
      "(" + left_p + "(?:[\\w|.*!?]+)" + right_p +
      "(?:\\.<(?:" + complexProps + ")>)?)" +
      "(?:" + remainder + ")"
  );
  var C_PROPS_RECURSIVE_FIRST = 1;
  var C_PROPS_RECURSIVE_REMAINDER = 2;

  // regx: /\(((?:.|\|)+)\)/
  //
  // Examples:
  // input: "( String | pentaho.type.Instance | Promise )"
  // match: [ input, 'String | pentaho.type.Instance | Promise' ]
  var MULTIPLE_OR_TYPE_REGX = new RegExp("\\(((?:.|\\|)+)\\)");
  var MULTIPLE_OR_TYPES = 1;

  // -------

  /**
   * Build a type documentation link by checking if it is a simple or complex type declaration
   * and for the later, try to build recursively other type declarations nested inside.
   * @example Simple Type:
   * `Boolean -> `<code><a href="link/to/Boolean">Boolean</a></code>`
   *
   * @example Complex Type:
   * `Object.&lt;Date, String&gt;` -> `<code>
   *                                     <a href="link/to/Object">Object</a>.&lt;
   *                                     <code><a href="link/to/Date">Date</a></code>,
   *                                     <code><a href="link/to/String">String</a></code>&gt;
   *                                   </code>`
   *
   * @example Complex Nested:
   * `Object.&lt;Class.&lt;String&gt;&gt;` -> `<code>
   *                                             <a href="link/to/Object">Object</a>.&lt;
   *                                             <code>
   *                                               <a href="link/to/Class">Class</a>.&lt;
   *                                               <code><a href="link/to/String">String</a></code>&gt;
   *                                             </code>&gt;
   *                                           </code>`
   *
   * @param {String} name       - The type name.
   * @param {Number} [index]    - The type position in the data array
   * @param {Number} [dataSize] - The data array size.
   *
   * @return {String} the html with links for the type declaration.
   */
  function typeBuilder(name, index, dataSize) {
    // check if it is an array type
    var jsType = name;
    var complexType = COMPLEX_TYPE_REGX.exec(name);

    var complexTypeProps = null;
    var prefix;
    if (complexType !== null) {
      prefix = complexType[TYPE_MODIFIER];
      jsType = complexType[TYPE_NAME];
      complexTypeProps = complexType[COMPLEX_TYPE_PROPS];
    } else {
      var simpleType = SIMPLE_TYPE_REGX.exec(name);
      prefix = simpleType[TYPE_MODIFIER];
      jsType = simpleType[TYPE_NAME];
    }

    var separator = index != null && index < dataSize - 1 ? " | " : "";
    return buildLink(prefix, jsType, complexTypeProps) + separator;
  }

  /**
   * Parse the properties that are nested inside a complex type declaration
   * and build each nested type documentation link.
   *
   * @param {String} complexTypeProps - The complex type nested properties.
   *
   * @return {String} the html with links for the type declaration.
   */
  function parseComplexTypeProps(complexTypeProps) {
    var result = "";
    if (!complexTypeProps) return result;

    var isFinished = false;
    var recursiveMatch;
    while (!isFinished && (recursiveMatch = C_PROPS_RECURSIVE_REGX.exec(complexTypeProps)) != null) {
      var firstType = recursiveMatch[C_PROPS_RECURSIVE_FIRST];
      complexTypeProps = recursiveMatch[C_PROPS_RECURSIVE_REMAINDER];

      var multipleOrTypes = MULTIPLE_OR_TYPE_REGX.exec(firstType);
      if (multipleOrTypes != null) {
        var html = "";
        var multipleArray = multipleOrTypes[MULTIPLE_OR_TYPES].split("|");
        var dataSize = multipleArray.length;

        multipleArray.forEach(function (name, index) {
          html += typeBuilder(name, index, dataSize);
        });

        result += "(" + html + ")";
      } else {
        result += typeBuilder(firstType);
      }

      isFinished = complexTypeProps == null;
      if (!isFinished) result += ", ";
    }

    return result;
  }

  function buildLink(prefix, jsType, complexTypeProps) {
    var typeLinkInfo = getLinkInfo(jsType);

    var safeHtml = helper.htmlsafe(prefix + typeLinkInfo.jsType);
    var jsTypeLink = helper.linkto(typeLinkInfo.link, safeHtml);

    if (complexTypeProps != null) {
      return "<code>" + jsTypeLink + ".&lt;" + parseComplexTypeProps(complexTypeProps) + "&gt;</code>";
    } else {
      return "<code>" + jsTypeLink + "</code>";
    }
  }

  /**
   * Gets the link for a single type.
   * The type might be changed inside so we return it was well
   *
   * @param {String} jsType - The type name.
   *
   * @return {{String, String}} the type name and the documentation link.
   */
  function getLinkInfo(jsType) {
    var jsTypeLower = jsType.toLowerCase();

    var isMdnJsType = mdnJsTypes[jsType];
    var isMdnJsWindow = mdnJsWindow[jsType];
    var isJQueryType = typeof jQueryTypes[jsTypeLower] !== "undefined";
    var isBackboneType = BACKBONE_TYPE_REGX.exec(jsType) !== null;

    var link;
    if (isMdnJsType) {
      link = mdnJsTypeBaseURL + jsType;

    } else if(isMdnJsWindow) {
      link = mdnJsWindowBaseURL + jsType;

    } else if (isBackboneType) {
      link = backboneTypeBaseURL + jsType.split(".")[1];

    } else if (isJQueryType) {
      jsType = jQueryTypes[jsTypeLower];
      link = jQueryTypeBaseURL + jsType;

    } else { // CTools or unknown type, output its value
      link = jsType;
    }

    return {
      jsType: jsType,
      link: link
    }
  }

}

/**
    @param {TAFFY} taffyData See <http://taffydb.com/>.
    @param {object} opts
    @param {Tutorial} tutorials
 */
exports.publish = function(taffyData, opts, tutorials) {
    data = taffyData;

    var conf = env.conf.templates || {};
    conf.default = conf.default || {};
    var templatePath = path.normalize(opts.template);
    view = new template.Template( path.join(templatePath, 'tmpl') );

    //This will create all the type links for the template
    registerTypeHelpers(view);

    // claim some special filenames in advance, so the All-Powerful Overseer of Filename Uniqueness
    // doesn't try to hand them out later
    var indexUrl = helper.getUniqueFilename('index');
    // don't call registerLink() on this one! 'index' is also a valid longname

    var globalUrl = helper.getUniqueFilename('global');
    helper.registerLink('global', globalUrl);

    // set up templating
    view.layout = opts.layoutFile;

    // set up tutorials for helper
    helper.setTutorials(tutorials);

    data = helper.prune(data);
    data.sort('longname, version, since');
    helper.addEventListeners(data);

    var sourceFiles = {};
    var sourceFilePaths = [];
    data().each(function(doclet) {
        doclet.attribs = '';

        if (doclet.examples) {
            doclet.examples = doclet.examples.map(function(example) {
                var caption, code;

                if (example.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
                    caption = RegExp.$1;
                    code = RegExp.$3;
                }

                return {
                    caption: caption || '',
                    code: code || example
                };
            });
        }
        if (doclet.codeExamples) {
            doclet.codeExamples = doclet.codeExamples.map(function(codeExample) {
                var caption, code;

                if (codeExample.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
                    caption = RegExp.$1;
                    code = RegExp.$3;
                }

                return {
                    caption: caption || '',
                    code: code || codeExample
                };
            });
        }
        if (doclet.see) {
            doclet.see.forEach(function(seeItem, i) {
                doclet.see[i] = hashToLink(doclet, seeItem);
            });
        }

        // build a list of source files
        var sourcePath;
        if (doclet.meta) {
            sourcePath = getPathFromDoclet(doclet);
            sourceFiles[sourcePath] = {
                resolved: sourcePath,
                shortened: null
            };
            if (sourceFilePaths.indexOf(sourcePath) === -1) {
                sourceFilePaths.push(sourcePath);
            }
        }
    });

    /*
     * Handle the defaul values for non optional properties correctly.
     *
     */
    data().each(function(doclet) {
        if (doclet.properties) {
            doclet.properties = doclet.properties.map(function(property) {
                var separator = " - ",
                    separatorLength = separator.length;

                var defaultvalue = property.defaultvalue;
                var description = property.description;

                if( property.defaultvalue !== 'undefined' && !property.optional && description.indexOf(separator) > 0) {
                    var index = description.indexOf(separator);
                    defaultvalue += " " + description.substr(separatorLength, index-separatorLength);
                    description = "<p>" + description.substr(index + separatorLength, description.length);
                }

                return {
                    defaultvalue: defaultvalue,
                    description: description,
                    type: property.type,
                    name: property.name
                }
            });
        }
    });

    // update outdir if necessary, then create outdir
    var packageInfo = ( find({kind: 'package'}) || [] ) [0];
    if (packageInfo && packageInfo.name) {
        outdir = path.join( outdir, packageInfo.name, (packageInfo.version || '') );
    }
    fs.mkPath(outdir);

    // copy the template's static files to outdir
    var fromDir = path.join(templatePath, 'static');
    var staticFiles = fs.ls(fromDir, 3);

    staticFiles.forEach(function(fileName) {
        var toDir = fs.toDir( fileName.replace(fromDir, outdir) );
        fs.mkPath(toDir);
        fs.copyFileSync(fileName, toDir);
    });

    // copy user-specified static files to outdir
    var staticFilePaths;
    var staticFileFilter;
    var staticFileScanner;
    if (conf.default.staticFiles) {
        // The canonical property name is `include`. We accept `paths` for backwards compatibility
        // with a bug in JSDoc 3.2.x.
        staticFilePaths = conf.default.staticFiles.include ||
            conf.default.staticFiles.paths ||
            [];
        staticFileFilter = new (require('jsdoc/src/filter')).Filter(conf.default.staticFiles);
        staticFileScanner = new (require('jsdoc/src/scanner')).Scanner();

        staticFilePaths.forEach(function(filePath) {
            var extraStaticFiles;

            filePath = path.resolve(env.pwd, filePath);
            extraStaticFiles = staticFileScanner.scan([filePath], 10, staticFileFilter);

            extraStaticFiles.forEach(function(fileName) {
                var sourcePath = fs.toDir(filePath);
                var toDir = fs.toDir( fileName.replace(sourcePath, outdir) );
                fs.mkPath(toDir);
                fs.copyFileSync(fileName, toDir);
            });
        });
    }

    if (sourceFilePaths.length) {
        sourceFiles = shortenPaths( sourceFiles, path.commonPrefix(sourceFilePaths) );
    }
    data().each(function(doclet) {
        var url = helper.createLink(doclet);
        helper.registerLink(doclet.longname, url);

        // add a shortened version of the full path
        var docletPath;
        if (doclet.meta) {
            docletPath = getPathFromDoclet(doclet);
            docletPath = sourceFiles[docletPath].shortened;
            if (docletPath) {
                doclet.meta.shortpath = docletPath;
            }
        }

        var sourceLink;
        if (doclet.meta) {
            sourceLink = getLinkFromDoclet(doclet);
            doclet.meta.sourceLink = sourceLink;
        }
    });

    data().each(function(doclet) {
        var url = helper.longnameToUrl[doclet.longname];

        if (url.indexOf('#') > -1) {
            doclet.id = helper.longnameToUrl[doclet.longname].split(/#/).pop();
        }
        else {
            doclet.id = doclet.name;
        }

        if ( needsSignature(doclet) ) {
            addSignatureParams(doclet);
            //addSignatureReturns(doclet);
            addAttribs(doclet);
        }
    });

    // do this after the urls have all been generated
    data().each(function(doclet) {
        doclet.ancestors = getAncestorLinks(doclet);

        if (doclet.kind === 'member') {
            addSignatureTypes(doclet);
            addAttribs(doclet);
        }

        if (doclet.kind === 'constant') {
            addSignatureTypes(doclet);
            addAttribs(doclet);
            doclet.kind = 'member';
            doclet.constant = true;
        }
    });

    data().each(function(doclet) {
        if(!doclet.ignore) {
            var parent = find({longname: doclet.memberof})[0];
            if( !parent ) {
                doclet.scopeEf = doclet.scope;
            } else {
                if(doclet.scope === 'static' && parent.kind !== 'class') {
                    doclet.scopeEf = 'instance';
                } else if(doclet.scope === 'static' && parent.static && parent.kind === 'class') {
                    doclet.scopeEf = 'instance';
                } else {
                    doclet.scopeEf = doclet.scope;
                }
            }
        }
    });

    // handle summary, description and class description default values properly
    data().each(function(doclet) {
        if(!doclet.ignore) {
            var checkP = function(prop) {
                if (!prop) return;
                var START_P = "<p>";
                var END_P   = "</p>";

                prop = prop.replace(/<p><p>/g, START_P);

                if (prop.indexOf(START_P) === -1) {
                    return START_P + prop + END_P;
                }

                return prop;
            };

            var replaceCode = function(string) {
                if(!string) return;
                var flip = true;
                var idx = string.indexOf("`");
                while(idx > -1) {
                  string = string.substr(0, idx) + (flip ? "<code>" : "</code>") + string.substr(idx + 1);
                  flip = !flip;
                  idx = string.indexOf("`");
                }
                return string;
            };

            if ( doclet.kind === "class" ) {
              doclet.classSummary = replaceCode(checkP(doclet.classSummary));
              doclet.constructorSummary = replaceCode(checkP(doclet.constructorSummary));
            }

            doclet.summary = replaceCode(checkP(doclet.summary));
            doclet.description = replaceCode(checkP(doclet.description));
            doclet.classdesc = replaceCode(checkP(doclet.classdesc));
        }
    });

    //handle splits and joins on names
    data().each(function(doclet) {
        if(!doclet.ignore) {
            var split = function(str, sep) {
                if(str) {
                    return str.split(sep).join('');
                }
            };

            //dont split for code
            if(doclet.description && doclet.description.indexOf("syntax.javascript") === -1) {
                doclet.description = split(doclet.description, '<br>');
            }
            if(doclet.description && doclet.description.indexOf("syntax.text") === -1) {
                doclet.description = split(doclet.description, '<br>');
            }
            if(doclet.classdesc && doclet.classdesc.indexOf("syntax.javascript") === -1) {
                doclet.classdesc = split(doclet.classdesc, '<br>');
            }
            if(doclet.summary && doclet.summary.indexOf("syntax.javascript") === -1) {
                doclet.summary = split(doclet.summary, '<br>');
            }

            doclet.parsedName = split(doclet.name, '"');
            doclet.parsedLongname = split(doclet.longname, '"')
        }
    });

    var members = helper.getMembers(data);
    members.tutorials = tutorials.children;

    // add template helpers
    view.find = find;
    view.linkto = linkto;
    view.resolveAuthorLinks = resolveAuthorLinks;
    view.tutoriallink = tutoriallink;
    view.htmlsafe = htmlsafe;

    // once for all
    view.nav = buildNav(findMembers(data, 'namespace'));
    attachModuleSymbols( find({ longname: {left: 'module:'} }), members.modules );

    if (members.globals.length) { generate('Global', [{kind: 'globalobj'}], globalUrl); }

    // index page displays information from package.json and lists files
    var files = find({kind: 'file'}),
        packages = find({kind: 'package'});

    generate('Home',
        packages.concat(
            [{kind: 'mainpage', readme: opts.readme, longname: (opts.mainpagetitle) ? opts.mainpagetitle : 'Main Page'}]
        ).concat(files),
    indexUrl);

    // set up the lists that we'll use to generate pages
    var classes = taffy(members.classes);
    var modules = taffy(members.modules);
    var namespaces = taffy(members.namespaces);
    var mixins = taffy(members.mixins);
    var externals = taffy(members.externals);
    var interfaces = taffy(members.interfaces);

    Object.keys(helper.longnameToUrl).forEach(function(longname) {
        var myModules = helper.find(modules, {longname: longname});
        if (myModules.length) {
            generate('Module: ' + myModules[0].name, myModules, helper.longnameToUrl[longname]);
        }

        var myClasses = helper.find(classes, {longname: longname});
        if (myClasses.length) {
            generate('Class: ' + myClasses[0].name, myClasses, helper.longnameToUrl[longname]);
        }

        var myNamespaces = helper.find(namespaces, {longname: longname});
        if (myNamespaces.length) {
            generate('Namespace: ' + myNamespaces[0].name, myNamespaces, helper.longnameToUrl[longname]);
        }

        var myMixins = helper.find(mixins, {longname: longname});
        if (myMixins.length) {
            generate('Mixin: ' + myMixins[0].name, myMixins, helper.longnameToUrl[longname]);
        }

        var myExternals = helper.find(externals, {longname: longname});
        if (myExternals.length) {
            generate('External: ' + myExternals[0].name, myExternals, helper.longnameToUrl[longname]);
        }

        var myInterfaces = helper.find(interfaces, {longname: longname});
        if (myInterfaces.length) {
            generate('Interface: ' + myInterfaces[0].name, myInterfaces, helper.longnameToUrl[longname]);
        }
    });

    // TODO: move the tutorial functions to templateHelper.js
    function generateTutorial(title, tutorial, filename) {
        var tutorialData = {
            title: title,
            header: tutorial.title,
            content: tutorial.parse(),
            children: tutorial.children
        };

        var tutorialPath = path.join(outdir, filename),
            html = view.render('tutorial.tmpl', tutorialData);

        // yes, you can use {@link} in tutorials too!
        html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>

        fs.writeFileSync(tutorialPath, html, 'utf8');
    }

    // tutorials can have only one parent so there is no risk for loops
    function saveChildren(node) {
        node.children.forEach(function(child) {
            generateTutorial('Tutorial: ' + child.title, child, helper.tutorialToUrl(child.name));
            saveChildren(child);
        });
    }
    saveChildren(tutorials);
};
