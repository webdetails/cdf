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



define(function() {

  function BarViewMock(viewSpec) {
    this.__model = viewSpec && viewSpec.model;
    this.__domContainer = viewSpec && viewSpec.domContainer;

    this.dispose = function () {
    };
  }

  BarViewMock.prototype.extensionEffective = {
    definition: 'dummy'
  };

  return BarViewMock;
});
