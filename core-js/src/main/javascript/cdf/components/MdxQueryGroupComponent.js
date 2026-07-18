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



define(['./BaseComponent', '../OlapUtils'], function(BaseComponent, OlapUtils) {

  return BaseComponent.extend({
    visible: false,
    update: function() {
      OlapUtils.updateMdxQueryGroup(this);
    }
  });

});
