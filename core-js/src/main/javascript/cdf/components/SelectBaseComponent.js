/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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

define([
  './InputBaseComponent',
  '../Logger',
  '../lib/jquery',
  'amd!../lib/underscore',
  '../dashboard/Utils',
  'amd!../lib/jquery.chosen',
  'amd!../lib/jquery.multiselect',
  'amd!../lib/jquery.select2'
], function(InputBaseComponent, Logger, $, _, Utils) {

  /**
   * @class cdf.components.SelectBaseComponent
   * @amd cdf/components/SelectBaseComponent
   * @extends cdf.components.InputBaseComponent
   * @classdesc Base component used by select components.
   * @ignore
   */
  return InputBaseComponent.extend(/** @lends cdf.components.SelectBaseComponent# */{
    /**
     * Visibility flag.
     *
     * @type {boolean}
     * @default false
     */
    visible: false,

    //useFirstValue:
    //isMultiple: [true]
    //size: when isMultiple==true, the default value is the number of possible values
    //externalPlugin:
    //extraOptions:
    //NOTE: When using select2 and there is the need to add the dropdown result to a specific container it is now
    //      possible to send the container id inside the property dropdownParentId
    //changeMode: ['immediate'], 'focus', 'timeout-focus'
    //NOTE: changeMode 'timeout-focus' is not supported in mobile and fallsback to 'focus'
    //changeTimeout: [2000], // in milliseconds
    //changeTimeoutScrollFraction: 1,
    //changeTimeoutChangeFraction: 5/8,
    //autoTopValue: ''
    //autoTopIndex: ''

    draw: function(myArray) {
      var ph = this.placeholder();
      if(ph.length === 0) {
        Logger.warn("Placeholder not in DOM - Will not draw");
        return false;
      }
      var name = this.name;

      // Build the HTML
      var selectHTML = "<select";

      var allowMultiple = this._allowMultipleValues();
      if(allowMultiple) { selectHTML += " multiple"; }

      var placeholderText = this._getPlaceholderText();
      if(placeholderText) { selectHTML += " data-placeholder='" + placeholderText + "'" ; }

      var size = this._getListSize(myArray);
      if(size != null) {
        selectHTML += " size='" + size + "'";
        if(myArray.length > size) {
          // PRD-5443
          selectHTML += " style='overflow-y: scroll;' "
        }
      }

      var extPlugin = this.externalPlugin;
      switch(extPlugin) {
        case "chosen": selectHTML += " class='chzn-select'" ; break;
        case "hynds":  selectHTML += " class='hynds-select'"; break;
        case "select2":  selectHTML += " class='select2-container'"; break;
      }

      selectHTML += ">";

      // ------

      var currentVal  = this._getParameterValue();
      var currentVals = Utils.parseMultipleValues(
      (!_.isNaN(currentVal) && _.isNumber(currentVal)) ? currentVal + "" : currentVal); // may be null
      var valuesIndex = {};
      var firstVal;

      Utils.eachValuesArray(myArray, {valueAsId: this.valueAsId},
        function(value, label, id, index) {
          selectHTML += "<option value = '" + Utils.escapeHtml(value) + "' >" +
                          Utils.escapeHtml(label) +
                        "</option>";

          // For value validation, below
          if(!index) { firstVal = value; }
          valuesIndex[value] = true;
        },
        this);

      selectHTML += "</select>";
      ph.html(selectHTML);

      // ------

      // All current values valid?
      var currentIsValid = true;

      // Filter out invalid current values
      if(currentVals != null) {
        var i = currentVals.length;
        while(i--) {
          if(valuesIndex[currentVals[i]] !== true) {
            // At least one invalid value
            currentIsValid = false;
            currentVals.splice(i, 1);
          }
        }
        if(!currentVals.length) { currentVals = null; }
      }

      /* If the current value for the parameter is invalid or empty,
       * we need to pick a sensible default.
       * If useFirstValue is `true`, the first possible value is selected,
       * otherwise, nothing is selected.
       */
      var isEmpty = currentVals == null;
      var hasChanged = !currentIsValid;
      if(isEmpty && this.useFirstValue && firstVal != null) {
        // Won't remain empty
        currentVals = [firstVal];
        hasChanged = true;
      }

      // jQuery only cleans the value if it receives an empty array.
      $("select", ph).val(currentVals == null ? [] : currentVals);

      // Automatically assume a given top scroll position, given by value or index.
      if(allowMultiple) {
        if(this.autoTopValue != null) {
          this.topValue(this.autoTopValue);
          delete this.autoTopValue;
        } else if(this.autoTopIndex != null) {
          this.topIndex(this.autoTopIndex);
          delete this.autoTopIndex;
        }
      }

      this._doAutoFocus();

      if(hasChanged) {
        // TODO: couldn't we just call fireChange(this.parameter, currentVals) ?
        this.dashboard.setParameter(this.parameter, currentVals);
        this.dashboard.processChange(name);
      }

      // TODO: shouldn't this be called right after setting the value of select?
      // Before hasChanged firing?
      switch(extPlugin) {
        case "chosen": {
          var jqBrowser = $.browser;
          $.browser = "";
          ph.find("select.chzn-select" ).chosen(this._readExtraOptions()); 
          $.browser = jqBrowser;
          break;
        }
        case "hynds": ph.find("select.hynds-select").multiselect({multiple: allowMultiple}); break;
        case "select2": {
          var extraOps = this._readExtraOptions() || {};
          if(typeof extraOps.dropdownAutoWidth === "undefined") {
            extraOps.dropdownAutoWidth = true;
          }
          if(!extraOps.width) {
            extraOps.width = "off";
          }
          // To avoid errors with circular objects, we need to create a clone of extraOps to be sent into select2
          var extraOpsSelect2 = Utils.clone(extraOps);
          if(extraOpsSelect2.dropdownParentId) {
            extraOpsSelect2.dropdownParent = $("#" + extraOpsSelect2.dropdownParentId);
          }		  
          ph.find("select.select2-container").select2(extraOpsSelect2);		  
          break;
        }
      }

      this._listenElement(ph);
    },

    /**
     * Indicates if the user can select multiple values.
     * The default implementation returns _false_.
     *
     * @return {boolean} `true` if multiple values are allowed, `false` otherwise.
     * @private
     */
    _allowMultipleValues: function() {
      return false;
    },

    /**
     * Returns the placeholder label for empty values, or `false` if it is an non-empty `string`.
     *
     * @return {string} The placeholder text.
     * @private
     */
    _getPlaceholderText: function() {
      var txt = this.placeholderText;
      return (_.isString(txt) && !_.isEmpty(txt) && txt) || false;
    },

    /**
     * The number of elements that the list should show without scrolling.
     * The default implementation returns the value of the `size` property.
     *
     * @param {Array.<Array.<*>>} values the values array.
     * @return {?number}
     * @private
     */
    _getListSize: function(values) {
      return this.size;
    },

    /**
     * Currently, reads extra options for the _chosen_ and _select2_ plugins, by
     * transforming the array of key/value pair arrays in `extraOptions` into an `object`.
     *
     * @return {undefined|!Object.<string, *>} an options object.
     * @private
     */
    _readExtraOptions: function() {
      if(this.externalPlugin && this.extraOptions) {
        return Utils.propertiesArrayToObject(this.extraOptions);
      }
    },

    /**
     * Installs listeners in the HTML element/object.
     * <p>
     *    The default implementation listens to the change event
     *    and dashboard-processes each change.
     * </p>
     *
     * @param {!HTMLElement} elem the element.
     * @private
     */
    _listenElement: function(elem) {
      var me = this;
      var prevValue = me.getValue();
      var stop;
      var check = function() {
        stop && stop();

        // Have been disposed?
        var dash = me.dashboard;
        if(dash) {
        var currValue = me.getValue();
          if(!Utils.equalValues(prevValue, currValue)) {
            prevValue = currValue;
            dash.processChange(me.name);
          }
        }
      };

      var selElem = $("select", elem);

      selElem.keypress(function(ev) {
        if(ev.which === 13) { check(); }
      });

      var changeMode = this._getChangeMode();
      if(changeMode !== 'timeout-focus') {
        selElem.on(me._changeTrigger(), check);
      } else {

        var timScrollFraction = me.changeTimeoutScrollFraction;
        timScrollFraction = Math.max(0, timScrollFraction != null ? timScrollFraction : 1  );

        var timChangeFraction = me.changeTimeoutChangeFraction;
        timChangeFraction = Math.max(0, timChangeFraction != null ? timChangeFraction : 5/8);

        var changeTimeout = Math.max(100, me.changeTimeout || 2000);
        var changeTimeoutScroll = timScrollFraction * changeTimeout;
        var changeTimeoutChange = timChangeFraction * changeTimeout;

        var timeoutHandle;

        stop = function() {
          if(timeoutHandle != null) {
            clearTimeout(timeoutHandle);
            timeoutHandle = null;
          }
        };

        var renew = function(tim) {
          stop();
          if(me.dashboard) {
            timeoutHandle = setTimeout(check, tim || changeTimeout);
          }
        };

        selElem
          .change(function() { renew(changeTimeoutChange); })
          .scroll(function() { renew(changeTimeoutScroll); })
          .focusout(check);
      }
    },

    /**
     * Obtains the change mode to use.
     *
     * <p>
     * The default implementation normalizes, validates and defaults
     * the change mode value.
     * </p>
     * @return {!string} one of values:
     * _'immediate'_,
     * _'focus'_ or
     * _'timeout-focus'_.
     *
     * @return {string} The change mode.
     * @private
     */
    _getChangeMode: function() {
      var changeMode = this.changeMode;
      if(changeMode) {
        changeMode = changeMode.toLowerCase();
        switch(changeMode) {
          case 'immediate':
          case 'focus':  return changeMode;

          case 'timeout-focus':
            // Mobiles do not support this strategy. Downgrade to 'focus'.
            if((/android|ipad|iphone/i).test(navigator.userAgent)) { return 'focus'; }
            return changeMode;

          default:
            Logger.log("Invalid 'changeMode' value: '" + changeMode + "'.", 'warn');
        }
      }
      return 'immediate';
    },

    /**
     * Obtains an appropriate jQuery event name for when testing for changes is done.
     *
     * @return {string} The name of the event.
     * @private
     */
    _changeTrigger: function() {
      /*
       * <p>
       * Mobile user agents show a dialog/popup for choosing amongst possible values,
       * for both single and multi-selection selects.
       * </p>
       * <ul>
       *   <li>iPad/iPhone -
       *       the popup shows a button "OK" only when in multiple selection.
       *       As the user clicks on the items, "change" events are fired.
       *       A "focusout" event is fired when the user dismisses the popup
       *       (by clicking on the button or outside of the popup).
       *   </li>
       *   <li>Android -
       *       the popup shows a button "Done" whether in single or multiple selection.
       *       As the user clicks on the items no events are fired.
       *       A change event is fired (whether or not values actually changed),
       *       when the user dismisses the popup.
       *   </li>
       *   <li>Desktops -
       *       no popup is shown.
       *       As the user clicks on the items, "change" events are fired.
       *       A "focusout" event is fired when it should...
       *   </li>
       * </ul>
       *
       * | Change mode: | Immediate  | Focus    | Timeout-Focus |
       * +--------------+------------+----------+---------------+
       * | Desktop      | change     | focusout | focusout      |
       * | iPad         | change     | focusout | -             |
       * | Android      | change *   | change   | -             |
       *
       * (*) this is the most immediate that android can do
       *     resulting in Immediate = Focus
       *
       *  On mobile devices the Done/OK is equiparated with the
       *  behavior of focus out and of the ENTER key.
       */
      if(this._getChangeMode() === 'immediate') {
        return 'change';
      }
      return (/android/i).test(navigator.userAgent) ? 'change' : 'focusout';
    }
  });

});
