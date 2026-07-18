/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 - 2026 by Pentaho Canada Inc. : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2030-06-15
 ******************************************************************************/



define('cdf/components/CommentsComponent.ext', [], function() {

  var CommentsComponentExt = {

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

      return "/comments/" + endpoint + "?ts=12";
    }
  };

  return CommentsComponentExt;
});

