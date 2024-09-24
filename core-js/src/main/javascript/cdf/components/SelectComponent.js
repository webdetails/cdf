/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/

define(['./SelectBaseComponent'], function(SelectBaseComponent) {

  /**
   * @class cdf.components.SelectComponent
   * @amd cdf/components/SelectComponent
   * @extends cdf.components.SelectBaseComponent
   * @classdesc The select component.
   * @ignore
   */
  return SelectBaseComponent.extend(/** @lends cdf.components.SelectComponent# */{
    /**
     * Flag indicating if the first value available should be selected when the value is empty.
     *
     * @type {boolean}
     * @default
     */
    useFirstValue: true,

    /**
     * Gets the value of the `select` placeholder.
     *
     * @return {string} The value of the corresponding DOM element.
     */
    getValue: function() {
      return this.placeholder("select").val();
    }
  });

});
