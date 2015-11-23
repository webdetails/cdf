/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

define(['./SelectBaseComponent', '../lib/jquery'], function(SelectBaseComponent, $) {
  var SelectMultiComponent = SelectBaseComponent.extend({

    /**
     * Gets the values selected of the select tag.
     *
     * @method getValue
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
     * @method _allowMultipleValues
     * @override
     * @private
     * @return {boolean}
     */
    _allowMultipleValues: function() {
      return this.isMultiple == null || !!this.isMultiple;
    },

    /**
     * When the size option is unspecified,
     * and multiple values are allowed,
     * returns the number of items in the
     * provided possible values list.
     *
     * @method _getListSize
     * @override
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

  return SelectMultiComponent;

});
