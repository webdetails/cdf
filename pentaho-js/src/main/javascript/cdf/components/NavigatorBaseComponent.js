/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


define([
  '../dashboard/Utils',
  '../Logger',
  './BaseComponent'
], function(Utils, Logger, BaseComponent) {

  return BaseComponent.extend({}, {
    path: Utils.getQueryParameter("path"),

    solution: Utils.getQueryParameter("solution"),

    template: Utils.getQueryParameter("template"),

    navigatorResponse: -1,

    getSolutionJSON: function(solution) {
      var files = this.navigatorResponse.solution.folders;
      var locationArray;

      for(var i = 0; i < files.length; i++) {
        if(this.solution == "" || files[i].solution == this.solution) {

          var solutionFiles = [];

          // Process subFolders;
          var subFolders = files[i].folders;
          if(subFolders != undefined && subFolders.length == undefined) {
            // only one folder inside
            solutionFiles.push(subFolders);
          } else if(subFolders != undefined && subFolders.length > 0) {
            // We have an array of files
            solutionFiles = solutionFiles.concat(subFolders);
          }

          // Process subFiles;
          var subFiles = files[i].files;
          if(subFiles != undefined && subFiles.length == undefined) {
            // only one file inside
            solutionFiles.push(subFiles);
          } else if(subFiles != undefined && subFiles.length > 0) {
            // We have an array of files
            solutionFiles = solutionFiles.concat(subFiles);
          }

          return solutionFiles;
        }

      }
      Logger.error("Fatal: Solution " + solution + " not found in navigation object");
    },

    browseContent: function(files, currentPath) {

      for(var i = 0; i < files.length; i++) {
        var file = files[i];

        if(file.type == "FOLDER" && file.path == currentPath) {
          files = file.folders;

          if(files == undefined) {
            return [];
          }
          if(files.length == undefined) {
            files = [files];
          }
          return files;
        }

      }
      Logger.error("Fatal: path "
        + (this.path
          || Utils.getPathParameter(this.path))
        + " not found in navigation object");
      return;
    },

    getParentSolution: function() {
      if((this.path
        || Utils.getPathParameter(this.path)).length > 0) {

        return this.solution;
      } else {
        return "";
      }
    },

    getParentPath: function() {
      var path = this.path
        || Utils.getPathParameter(this.path);
      var index = path.lastIndexOf("/");
      if(index == -1) {
        return "";
      }
      var parentPath = path.substring(0, index);
      return parentPath;
    },

    isAncestor: function(solution, path) {
      if(solution != this.solution) {
        return false;
      } else {
        return true;
      }
    }
  });

});
