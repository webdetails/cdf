/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

define(['./Logger', './lib/jquery', './Encoder'], function(Logger, $, Encoder) {

  var wd = {

    CDF_PLUGIN_NAME: "pentaho-cdf",
    SAMPLES_BASE_PATH: "/public/plugin-samples/",

    //var wd = wd || {};
    //wd.cdf = wd.cdf || {};

    //wd.cdf.helper = {
    cdf: {
      helper: {
        getTimestamp: function() {
          return "ts=" + new Date().getTime();
        },

        getFullPath: function(path, action) {

          path = path || "";
          action = action || "";

          var fullPath = path.indexOf( wd.CDF_PLUGIN_NAME ) == 0 ? ( wd.SAMPLES_BASE_PATH + path ) : path;
          fullPath = fullPath + ( action ? "/" + action : "" ).replace(/\/\//g, '/');

          return fullPath;
        },

        composePath: function(options) {
          var clean = function(segment) {
            if(segment.charAt(0) == "/") {
              segment = segment.substring(1, segment.length);
            }
            if(segment.charAt(segment.length - 1) == "/") {
              segment = segment.substring(0, segment.length - 1);
            }
            return segment
          };
          var fullPath = "/";
          if(options.solution) {
            fullPath += clean(options.solution) + "/";
          }
          if(options.path) {
            fullPath += clean(options.path);
          }
          if(options.action) {
            fullPath += "/" + clean(options.action);
          }
          return fullPath;
        }
      },

      //wd.cdf.endpoints = {
      endpoints: {

        //webAppPath: undefined,
        webAppPath: "/pentaho",

        // Dashboard.js determines webAppPath
        getWebapp: function() {return this.webAppPath;},

        getPing: function() {return wd.cdf.endpoints.getCdfBase() + "/ping";},

        getXmla: function() {return wd.cdf.endpoints.getWebapp() + "/Xmla";},

        getPluginBase: function(plugin) {return wd.cdf.endpoints.getWebapp() + "/plugin/" + plugin + "/api";},

        getCdfBase: function() {return wd.cdf.endpoints.getPluginBase( wd.CDF_PLUGIN_NAME );},

        getCdaBase: function() {return wd.cdf.endpoints.getPluginBase('cda');},

        getPluginEndpoint: function(plugin, endpoint) { return wd.cdf.endpoints.getPluginBase(plugin) + "/" + endpoint;},

        getStorage: function(action) {return wd.cdf.endpoints.getCdfBase() + "/storage/"  + action;},

        getSettings: function(action, key) {
          if(key) {
            return wd.cdf.endpoints.getCdfBase() + "/settings/" + action + "?" + $.param({key: key});
          } else {
            return wd.cdf.endpoints.getCdfBase() + "/settings/" + action;
          }
        },

        getViewAction: function() {return wd.cdf.endpoints.getCdfBase() + "/viewAction";},

        getJSONSolution: function() {return wd.cdf.endpoints.getCdfBase() + "/getJSONSolution";},

        getRenderHTML: function() {return wd.cdf.endpoints.getCdfBase() + "/RenderHtml";},

        getExport: function() {return wd.cdf.endpoints.getCdfBase() + "/Export";},

        getResource: function() {return wd.cdf.endpoints.getCdfBase() + "/getResource";},

        getStaticResource: function(resource) {return wd.cdf.endpoints.getCdfBase() + "/resources/" + resource;},

        getCdfXaction: function(path, action, solution, params) {
          if(params) {
            var parameters = {};
            for(var key in params) {
              parameters[key] = (typeof params[key]=='function') ? params[key]() : params[key];
            }
            return Encoder.encode(
              wd.cdf.endpoints.getViewAction(),
              null,
              $.extend({path: wd.cdf.helper.getFullPath( path, action ), ts: new Date().getTime()}, parameters)
            );
          } else {
            return Encoder.encode(
              wd.cdf.endpoints.getViewAction(),
              null,
              {path: wd.cdf.helper.getFullPath( path, action ), ts: new Date().getTime()}
            );
          }
        },

        getServiceAction: function(method, solution, path, action) { 

          var arr = {};
          arr.wrapper = false;
          arr.action = action;
          arr.url = Encoder.encode(
            wd.cdf.endpoints.getWebapp() + "/api/repos/{0}/generatedContent",
            Encoder.encodeRepositoryPath(wd.cdf.helper.getFullPath(path, action))
          );

          return arr; 
        }, 

        getComments: function(action) { 

          var endpoint = "";

          if(action == "LIST_ALL" || action == "LIST_ACTIVE" || action == "GET_LAST") {
            endpoint = "list";
          
          } else if(action == "DELETE_COMMENT") {
            endpoint = "delete";
          
          } else if(action == "ARCHIVE_COMMENT") {
            endpoint = "archive";
            
          } else if(action == "ADD_COMMENT") {
            endpoint = "add";
          }

          return wd.cdf.endpoints.getCdfBase() + "/comments/" + endpoint;
        },

        getScheduledJob: function() {return wd.cdf.endpoints.getWebapp() + "/api/scheduler/job";},

        getEmailConfig: function() {return wd.cdf.endpoints.getWebapp() + "/api/emailconfig";},

        getPivot: function(solution, path, action) { 
          var fullPath = path.indexOf(wd.CDF_PLUGIN_NAME) == 0 ? (wd.SAMPLES_BASE_PATH + path) : path;
          return Encoder.encode(
            wd.cdf.endpoints.getWebapp() + "/plugin/jpivot/Pivot",
            null,
            {solution: (solution || "system"), path: fullPath, action: action}
          );
        },

        getAnalyzer: function(path, callvar, parameters) {
          return Encoder.encode(
            wd.cdf.endpoints.getWebapp() + "/api/repos/{0}/" + callvar,
            Encoder.encodeRepositoryPath(wd.cdf.helper.composePath(path)),
            parameters
          );
        },

        getReport: function(path, callvar, parameters) {
          /* callvar = report || viewer */
          if(typeof path === "string" || path instanceof String) {
            return Encoder.encode(
              wd.cdf.endpoints.getWebapp() + "/api/repos/{0}/" + callvar,
              Encoder.encodeRepositoryPath(path),
              parameters
            );
          } else {
            return Encoder.encode(
              wd.cdf.endpoints.getWebapp() + "/api/repos/{0}/" + callvar,
              Encoder.encodeRepositoryPath(wd.cdf.helper.composePath(path)),
              parameters
            );
          }
        },
        
        getCaptifyZoom: function() {return wd.cdf.endpoints.getStaticResource("js/lib/captify/zoom.html");},

        getDoQuery: function() {return wd.cdf.endpoints.getCdaBase() + "/doQuery?";},

        getUnwrapQuery: function(parameters) {return wd.cdf.endpoints.getCdaBase() + "/unwrapQuery?" + $.param(parameters);}
      }
    },

    helpers: {
      jfreechartHelper: {
        getOpenFlashChart: function(result) {
          return result;
        },
        getCaption: function(cd, myself, exportFile, cdfComponent) {
          return {
            title: {
              title: cd.title != undefined ? cd.title : "Details",
              oclass: 'title'
            },
            chartType: {
              title: "Chart Type",
              show: function() {
                return cd.chartType != 'function' && ( cd.chartType == "BarChart" || cd.chartType == "PieChart")
              },
              icon: function() {
                return cd.chartType == "BarChart" ? "jfPieIcon" : "jfBarIcon";
              },
              oclass: 'options',
              callback: function() {
                cd.chartType = cd.chartType == "BarChart" ? "PieChart" : "BarChart";
                myself.update();
              }
            },
            zoom: {
              title: 'Zoom',
              icon: "jfMagnifyIcon",
              oclass: 'options',
              callback: function() {
                myself.dashboard.incrementRunningCalls();
                var parameters = myself.getParameters();
                var width = 200, height = 200;
                var urlTemplate, parameterName = "";
                for(p in parameters) {
                  if(parameters[p][0] == 'width') {
                    width += parameters[p][1];
                    parameters[p] = ['width', width]
                  }
                  ;
                  if(parameters[p][0] == 'height') {
                    height += parameters[p][1];
                    parameters[p] = ['height', height]
                  }
                  ;
                  if(parameters[p][0] == 'parameterName') {
                    parameterName = parameters[p][1];
                    parameters[p] = ['parameterName', 'parameterValue']
                  }
                  ;
                  if(parameters[p][0] == 'urlTemplate') {
                    urlTemplate = parameters[p][1];
                    parameters[p] = ['urlTemplate', "javascript:chartClick('" + myself.name + "','{parameterValue}');"]
                  }
                  ;
                }
                myself.zoomCallBack = function(value) {
                  eval(urlTemplate.replace("{" + parameterName + "}", value));
                };
                myself.dashboard.callPentahoAction(myself, "system", "pentaho-cdf/actions", cdfComponent, parameters, function (jXML) {
                  if(jXML != null) {
                    var openWindow = window.open(wd.cdf.endpoints.getCaptifyZoom(), "_blank", 'width=' + (width + 17) + ',height=' + (height + 20));
                    /* Requires disabling popup blockers */
                    if(!openWindow) {
                      Logger.log("Please disable popup blockers and try again.");
                    } else {
                      var maxTries = 10;
                      var loadChart = function() {
                        if(typeof openWindow.loadChart != "undefined") {
                          openWindow.loadChart(jXML.find("ExecuteActivityResponse:first-child").text());
                        } else if (maxTries > 0) {
                          maxTries -= 1;
                          setTimeout(loadChart, 500);
                        }
                      };
                      loadChart();
                    }
                  }
                  myself.dashboard.decrementRunningCalls();
                });
              }
            }
          };
        }
      },
      inputHelper: {
        getCssWrapperClass: function(verticalOrientation) {
          return "pentaho-toggle-button pentaho-toggle-button-up " +
            ((this.verticalOrientation) ? "pentaho-toggle-button-vertical" : "pentaho-toggle-button-horizontal");
        },

        getSelectedCss: function(verticalOrientation) {
          return "pentaho-toggle-button pentaho-toggle-button-down " + ((verticalOrientation) ? "pentaho-toggle-button-vertical" : "pentaho-toggle-button-horizontal");
        },

        getUnselectedCss: function(verticalOrientation) {
          return "pentaho-toggle-button pentaho-toggle-button-up " + ((verticalOrientation) ? "pentaho-toggle-button-vertical" : "pentaho-toggle-button-horizontal");
        },

        getExtraCss: function(index, count, verticalOrientation) {
          var css = "";
          if(index == 0 && count == 1) {
            // both first & last
            return " pentaho-toggle-button-single";
          }
          if(index == 0) {
            css += " " + ((verticalOrientation) ? " pentaho-toggle-button-vertical-first" : " pentaho-toggle-button-horizontal-first");
          } else if (index == count - 1) {
            css += " " + ((verticalOrientation) ? " pentaho-toggle-button-vertical-last" : " pentaho-toggle-button-horizontal-last");
          }
          return css;
        },

        getToggleButtonClass: function() {
          return "pentaho-toggle-button";
        },

        getToggleButtonHoveringClass: function() {
          return "pentaho-toggle-button-up-hovering";
        }

      }
    }
  };

  return wd;

});
