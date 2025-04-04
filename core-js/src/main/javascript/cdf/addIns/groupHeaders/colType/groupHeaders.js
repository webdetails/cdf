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
  '../../../AddIn',
  '../../../Dashboard',
  '../../../dashboard/Sprintf',
  '../../../lib/jquery',
  'amd!../../../lib/datatables',
  'css!./theme/groupHeaders'],
  function(AddIn, Dashboard, sprintf, $) {

  var groupHeaders = new AddIn({
    name: "groupHeaders",
    label: "Group Headers",
    defaults: {
      hide: true,
      columnHeadersInGroups: false,
      replaceFirstHeader: true,
      textFormat: function(v, st, opt) {
        return st.colFormat ? sprintf(st.colFormat,v) : v;
      }
    },

    init: function() {
      $.fn.dataTableExt.oSort[this.name + '-asc'] = $.fn.dataTableExt.oSort['string-asc'];
      $.fn.dataTableExt.oSort[this.name + '-desc'] = $.fn.dataTableExt.oSort['string-desc'];
    },

    implementation: function(tgt, st, opt) {
      var dt = $(tgt).parents('table').eq(0).dataTable(),
          visColIdx = $(tgt).index();

      /* Decide whether to hide the original column we're drawing the group headers from */
      if(opt.hide) {
         dt.find('.groupHeaders:nth-child(' + (visColIdx + 1) + ')').addClass('hiddenCol');
      }


      if(opt.columnHeadersInGroups) {
        var header = dt.find("thead").eq(0);
        header.find("tr").clone
      }

      var $row = $(dt.fnGetNodes( st.rowIdx )),
          visRowIdx = $row.index(),
          count = $row.children().length,
          $group;

      /* We create and insert a group header under any of the following circumstances:
       *   - On the very first row
       *   - Immediately after a higher-level group header
       *     when using group headers for more than one column
       *   - when the value for the current cell is
       *     different from the one immediately before it
       */
      if(visRowIdx === 0 || $row.prev().hasClass('groupHeader') || (st.value != dt.fnGetData($row.prev().get(0))[st.colIdx])) {
          $group = this.buildHeader(tgt,st, opt);
          $group.insertBefore($row);
      }

    },

    buildHeader: function(tgt, st, opt) {
      var $header,
          $dt = $(tgt).parents('table').eq(0).dataTable(),
          $theader,
          headerText = opt.textFormat.call(this, st.value, st, opt);

      if(opt.columnHeadersInGroups) {
        $theader = $dt.find("thead").eq(0);
        $theader.hide();
        $header = $("<tr>");
        $theader.find("tr th").each(function(i, e) {
          var $e = $(e),
              newCell = $("<td>").text($e.text()).width(e.style.width);
          newCell.addClass($(e).hasClass("hiddenCol") ? "hiddenCol" : "");
          $header.append(newCell);
        });
        $header.find("td").eq($(tgt).index() + 1).empty().append(headerText).addClass("groupName");
      } else {
        $header = $("<tr/>");
        $("<td/>").addClass("groupName").empty().append(headerText).attr("colspan",  $(tgt).siblings().length + 1).appendTo($header);
      }
      $header.addClass("groupHeader group" + $(tgt).index());
      var $preSpace = $("<td>").attr("colspan", $(tgt).siblings().length + 1).wrap("<tr>").parent().addClass("groupHeader preSpace");
      var $postSpace = $("<td>").attr("colspan", $(tgt).siblings().length + 1).wrap("<tr>").parent().addClass("groupHeader postSpace");
      var $response = $preSpace.add($header).add($postSpace);
      return $response;
    }
  });

  Dashboard.registerGlobalAddIn("Table", "colType", groupHeaders);

  return groupHeaders;

});
