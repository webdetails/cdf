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

define(['./SelectBaseComponent', '../lib/jquery'], function(SelectBaseComponent, $) {

  /**
   * @class cdf.components.SelectMultiComponent
   * @amd cdf/components/SelectMultiComponent
   * @extends cdf.components.SelectBaseComponent
   * @classdesc Multi select component. Allows selecting multiple items.
   * @ignore
   */
  return SelectBaseComponent.extend(/** @lends cdf.components.SelectMultiComponent# */{
    /**
     * Gets the values selected of the select tag.
     *
     * @return {array|*} an empty array or the values selected
     */
    getValue : function() {
      var ph = this.placeholder("select");
      var val = ph.val();
      return val == null ? [] : val;
    },

    /**
     * Obtains the normalized and defaulted value of
     * the {@link #isMultiple} option.
     *
     * @return {boolean} `true` if multiple values are allowed, `false` otherwise.
     * @private
     */
    _allowMultipleValues: function() {
      return this.isMultiple == null || !!this.isMultiple;
    },

    /**
     * When the size option is unspecified, and multiple values are allowed,
     * returns the number of items in the provided possible values list.
     *
     * @param {object[]} values The values list.
     * @return {number} The values list size.
     * @private
     */
    _getListSize: function(values) {
      var size = this.base(values);
      if(size == null) {
        if(!this._allowMultipleValues()) {
          size = values.length;
        } // TODO: otherwise no default... Why?
      }

      return size;
    },

    topIndex: function(_) {
      var $elem = this.placeholder("select");
      var elem = $elem[0];
      
      var L = elem.length;
      if(!L) {return arguments.length ? this : 0;}

      var h  = Math.max(1, elem.scrollHeight);
      var hi = Math.max(1, h / L);

      if(arguments.length) {
        var topIndex = + _ ;
        
        topIndex = isNaN(topIndex) ? 0 : Math.max(0, Math.min(topIndex, L - 1));
        
        $elem.scrollTop(Math.ceil(topIndex * hi));
        
        return this;
      }
      return Math.round($elem.scrollTop() / hi);
    },

    indexOf: function(value) {
      if(value != null) {
        var $options = this.placeholder("select option");
        var L = $options.length;
        if(L) {
          value = String(value);
          for(var i = 0; i < L; i++) {
            if($options[i].value === value) { 
              return i; 
            }
          }
        }
      }
      return -1;
    },

    valueAt: function(index) {
      if(index >= 0) {
        return this.placeholder("select :nth-child(" + (index + 1) + ")").val();
      }
    },

    topValue: function(_) {
      if(arguments.length) {
        var topIndex = this.indexOf(_);
        if(topIndex >= 0) {
          this.topIndex(topIndex);
        }
        return this;
      }
      
      return this.valueAt(this.topIndex());
    }
  });

});
