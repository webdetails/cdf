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
  '../Logger',
  './UnmanagedComponent',
  'amd!../lib/underscore',
  '../lib/jquery',
  'css!./AutocompleteBoxComponent'
], function(Logger, UnmanagedComponent, _, $) {

  return UnmanagedComponent.extend(/** @lends cdf.components.AutocompleteBoxComponent# */{

    /**
     * Builds new autocompletebox instances.
     *
     * @constructs
     * @amd cdf/components/AutocompleteBoxComponent
     * @classdesc The AutocompleteBox component class.
     * @ignore
     */
    constructor: function() {
      this.base.apply(this, arguments);
      this.selectedValues = [];
    },

    result: [],

    /**
     * Executes a query using a provided search text and if successful
     * executes the provided callback function.
     *
     * @param {string}   searchString    A text to search for.
     * @param {function} successCallback A success callback function.
     * @private
     */
    _queryServer: function(searchString, successCallback) {
      if(!this.parameters) {
        this.parameters = [];
      }

      if(_.isString(searchString)) {
        this.searchParam = searchString;
      }
      if(this.searchParam) {
        this.parameters.push([this.searchParam, this._getInnerParameterName()]);
      }
      if(this.maxResults) {
        this.queryDefinition.pageSize = this.maxResults;
      }
      this.dashboard.setParameter(this._getInnerParameterName(), this._getTextBoxValue());

      if(this.queryDefinition) {
        this.triggerQuery(this.queryDefinition, successCallback);
      } else {
        Logger.error("No query definition found");
      }
    },

    /**
     * Gets the text box value.
     *
     * @return {string} The text box value.
     * @private
     */
    _getTextBoxValue: function() {
      return this.textbox.val();
    },

    /**
     * Gets the inner parameter name.
     *
     * @return {string} The inner parameter name.
     * @private
     */
    _getInnerParameterName: function() {
      return this.parameter + '_textboxValue';
    },

    /**
     * Executes {@link cdf.components.AutocompleteBoxComponent#_selectValue|_selectValue}
     * for each value to be initially set as selected.
     *
     * @private
     */
    _setInitialValue: function() {
      var param = this.parameter;
      var initialValue = null;

      if(param) {
        initialValue = this.dashboard.getParameterValue(param);
      }

      if(initialValue != null && _.isArray(initialValue)) {
        for(var i = 0, L = initialValue.length; i < L; i++) {
          this._selectValue(initialValue[i]);
        }
      }
    },

    /**
     * Updates the component.
     */
    update: function() {
      // Allow the component to be silent
      if(this.lifecycle) { this.lifecycle.silent = this.silent === true; }
      else { this.lifecycle = {silent: this.silent === true}; }

      if(!this.preExec()) {
        return;
      }

      if(!this.isSilent()) {
        this.block();
      }

      this.ph = this.placeholder().empty();

      if(this.ph.length === 0) {
        Logger.warn("Placeholder not in DOM - Will not draw");
        return false;
      }
      this.defaultParameters = _.isArray(this.parameters) ? this.parameters.slice() : [];
      var myself = this;

      if(!_.isFunction(this.processChange)) {
        this.processChange = function() {
          myself.value = myself.selectedValues;
          myself.dashboard.processChange(myself.name);
        }
      }

      var isMultiple = this.selectMulti || false;

      //init parameter
      if(!this.dashboard.getParameterValue(this._getInnerParameterName())) {
        this.dashboard.setParameter(this._getInnerParameterName(), '');
      }

      this.textbox = $('<input class="autocomplete-input">');
      var autoComplete = $('<div class="autocomplete-container">');

      if(isMultiple) {
        var title = this.tooltipMessage || "Click it to Apply";
        var apply = $('<input type="button" class="autocomplete-input-apply" style="display: none" title="' + title + '" value="' + ( this.submitLabel || "S" ) +'"/>')
          .click(function() {
            myself._endSearch();
          });
        autoComplete.append(apply);
      }

      autoComplete
        .append(this.textbox)
        .append('<ul class="list-data-selection">')
        .appendTo(this.ph);

      this.textbox.autocomplete(this._getOptions());

      this.ph.find('.autocomplete-container .ui-autocomplete').off('menuselect');
      this.ph.find('.autocomplete-container .ui-autocomplete').on('menuselect', function(event, ui) {
          var checkbox = ui ? ui.item.find('input') : $(event.target).find('input');
          if(checkbox.length > 0) {
            checkbox.prop('checked', !checkbox.is(':checked'))
          }
          var label = ui ? ui.item.find('a').text() : $(event.target).text();

          if(!isMultiple) {
            myself._selectValue(label);
            myself._endSearch();
          } else if(checkbox.is(':checked')) {
            myself._selectValue(label);
          } else {
            myself._removeValue(label);
          }
        });
      this.textbox.data('ui-autocomplete')._renderItem = function(ul, item) {
        var listItem = $('<li class="list-item">');
        var content = $('<a>' + item.label + '</a>');
        if(isMultiple) {
          $('<input type="checkbox"/>').click(function() {
            $(this).parent().trigger('menuselect');
          }).prependTo(content);
        }
        content.appendTo(listItem);
        return listItem.appendTo(ul);
      };

      //if defined and it exists bind a click event to this button
      this.ph.find('#' + this.externalApplyButtonId).click(function() {
        myself._endSearch();
      });

      this._setInitialValue();

      this.postExec();

      if(!this.isSilent()) {
        this.unblock();
      }
    },

    /**
     * Gets the component _value_ property value.
     *
     * @return {*} The value of _value_.
     */
    getValue: function() {
      return this.value;
    },

    /**
     * Gets the values of the component options.
     *
     * @return {{appendTo: string, minLength: (AutocompleteBoxComponent.minTextLength|0), source: function, focus: function, open: function, close: function}}
     *   The component options.
     * @private
     */
    _getOptions: function() {
      var myself = this;

      var options = {
        appendTo: this.ph.find('.autocomplete-container'),
        minLength: this.minTextLength || 0,
        source: function(search, callback) {
          myself._search(search, callback);
        },

        focus: function(event, ui) {
          event.preventDefault();
        },

        open: function(event, ui) {
          var scroll = myself.scrollHeight || 0;

          if(scroll > 0) {
            myself.ph.find('.autocomplete-container .ui-autocomplete').css({'max-height': scroll + 'px', 'overflow-y': 'auto'});
          }

          myself._filterData();
        },

        close: function(event, ui) {
          myself.processChange();
        }
      };

      return options;
    },

    /**
     * Marks a value in the list as selected according to a providade HTML element identifier.
     *
     * @param {string} label The HTML element identifier.
     * @private
     */
    _selectValue: function(label) {
      var myself = this;
      var addTextElements = this.addTextElements != null ? this.addTextElements : true;
      var showApplyButton = this.showApplyButton != null ? this.showApplyButton : true;
      var list = this.ph.find('.autocomplete-container .list-data-selection');
      var listItem = $('<li id="' + label + '"><input type="button" class="close-button" value="x"/>' + label + '</li>');

      if(!this.selectMulti) {
        list.empty();
        this.selectedValues = [];
      } else if(showApplyButton) {
        this.ph.find('.autocomplete-container').addClass('show-apply-button');
        this.ph.find('.autocomplete-input-apply').show();
      }

      listItem.find('input').click(function() {
        myself._removeValue(label, true);
      });

      if(addTextElements) {
        listItem.appendTo(list);
      }
      this.selectedValues.push(label);
    },

    /**
     * Removes a value from the list according to a providade HTML element identifier.
     * Executes {@link cdf.component.AutocompleteBoxComponent#processChange|processChange}
     * if the _change_ parameter has a truthy value.
     *
     * @param {string}  id             The HTML element identifier.
     * @param {boolean} [change=false] Flag indicating if {@link cdf.component.AutocompleteBoxComponent#processChange|processChange} should execute.
     * @private
     */
    _removeValue: function(id, change) {
      this.selectedValues = _.without(this.selectedValues, id);
      this.ph.find('.autocomplete-container .list-data-selection li[id="' + id + '"]').remove();
      if(change) {
        this.processChange();
      }
    },

    /**
     * Updates the element list of the component and hides the list if no element is found.
     */
    _filterData: function() {
      var menu = this.ph.find('.autocomplete-container .ui-autocomplete');
      var data = this.selectedValues || [];
      var addTextElements = this.addTextElements != null ? this.addTextElements : true;

      if(data.length > 0) {
        menu.find('li').each(function () {
          var $this = $(this);
          var label = $this.text();
          if(data.indexOf(label) > -1) {
            if(addTextElements) {
              $this.remove();
            } else {
              $this.find('input').prop('checked', true);
            }
          }
        });

        if(menu.find('li').length == 0) {
          menu.hide();
        }
      }
    },

    /**
     * Executes a query according to the provided _search_ parameter.
     * If the query is successfull the _callback_ parameter is also executed.
     * 
     * @param {string}   search   The search text to be used in the query.
     * @param {function} callback The success callback.
     * @private
     */
    _search: function(search, callback) {
      var matchType = this.matchType || 'fromStart';
      var val = search.term.toLowerCase();
      var myself = this;

      this._queryServer(val, function(data) {

        myself.parameters = myself.defaultParameters.slice();
        var result = data.resultset ? data.resultset : data;
        var list = [];

        for(var p in result) if(result.hasOwnProperty(p)) {
          var value = result[p][0];
          if(value != null
            && (matchType === 'fromStart' && value.toLowerCase().indexOf(val) == 0)
            || (matchType === 'all' && value.toLowerCase().indexOf(val) > -1)) {
            list.push(value);
          }
        }
        callback(list);
      });

    },

    /**
     * Closes the component UI and resets the input value.
     *
     * @private
     */
    _endSearch: function() {
      var container = this.ph.find('.autocomplete-container');

      container.removeClass('show-apply-button');
      container.find('.autocomplete-input-apply').hide();

      this.textbox.val('');
      this.textbox.autocomplete("close");
    },

    /**
     * Triggers a _change_ event using the
     * {@link http://plugins.jquery.com/ui.autocomplete|jQueryUI.autocomplete} plugin.
     *
     * @private
     */
    _processAutoBoxChange: function() {
      this.textbox.autocomplete("change");
    }
  });

});
