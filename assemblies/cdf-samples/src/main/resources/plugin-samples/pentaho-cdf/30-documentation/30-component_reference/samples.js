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


require(['cdf/Logger', 'cdf/lib/jquery', 'amd!cdf/lib/jquery.ui'], function(Logger, $) {

  var $example = $("#example"),
      $sampleCode = $('#samplecode');

  $example.tabs();

  function runSampleCode() {
    try {
      eval($sampleCode.val());
      $example.tabs("option", "active", 0);
    } catch(e) {
      Logger.exception(e);
    }
  }

  $("#tryMe").click(function() {
    runSampleCode();
  });

  runSampleCode();
});
