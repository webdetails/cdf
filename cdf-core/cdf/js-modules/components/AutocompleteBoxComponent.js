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

define([
  '../Logger',
  './UnmanagedComponent',
  'amd!../lib/underscore',
  '../lib/jquery',
  'css!./AutocompleteBoxComponent'
], function(Logger, UnmanagedComponent, _, $) {

  var AutocompleteBoxComponent = UnmanagedComponent.extend({

    result: [],
    selectedValues: [],

    /**
     *
     * @method _queryServer
     * @param searchString
     * @private
     */
    _queryServer: function(searchString, successCallback) {
      if(!this.parameters) {
        this.parameters = [];
      }

      if(this.searchParam) {
        this.parameters = [[this.searchParam, this._getInnerParameterName()]];
      } else if(this.parameters.length > 0) {
        this.parameters[0][1] = this._getInnerParameterName();
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
     *
     * @method _getTextBoxValue
     * @return {*}
     * @private
     */
    _getTextBoxValue: function() {
      return this.textbox.val();
    },

    /**
     *
     * @method _getInnerParameterName
     * @return {string}
     * @private
     */
    _getInnerParameterName: function() {
      return this.parameter + '_textboxValue';
    },

    /**
     *
     * @method _setInitialValue
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
     *
     * @method update
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

      this.placeholder().empty();

      var myself = this;

      var isMultiple = this.selectMulti || false;
      var options = this._getOptions();

      //init parameter
      if(!this.dashboard.getParameterValue(this._getInnerParameterName())) {
        this.dashboard.setParameter(this._getInnerParameterName(), '');
      }

      this.textbox = $('<input class="autocomplete-input">');
      var autoComplete = $('<div class="autocomplete-container">');

      if(isMultiple) {
        var title = this.tooltipMessage || "Click it to Apply";
        var apply = $('<input type="button" class="autocomplete-input-apply" style="display: none" title="' + title + '" value="S"/>')
          .click(function() {
            myself._endSearch();
          });
        autoComplete.append(apply);
      }

      autoComplete
        .append(this.textbox)
        .append('<ul class="list-data-selection">')
        .appendTo(this.placeholder());

      this.textbox.autocomplete(options);

      $('.autocomplete-container .ui-autocomplete').off('menuselect');
      this.textbox.data('ui-autocomplete')._renderItem = function(ul, item) {
        var listItem = $('<li class="list-item">');

        var content = $('<a>' + (isMultiple ? '<input type="checkbox"/>' : '') + item.label + '</a>').click(function(event) {
          var checkbox = $(this).find('input');
          if($(event.srcElement).is('a')) {
            checkbox.prop('checked', !checkbox.is(':checked'))
          }
          if(!isMultiple) {
            myself._selectValue(item.label);
            myself._endSearch();
          } else if(checkbox.is(':checked')) {
            myself._selectValue(item.label);
          } else {
            myself._removeValue(item.label);
          }
        });

        content.appendTo(listItem);
        return listItem.appendTo(ul);
      };

      //if defined and it exists bind a click event to this button
      $('#' + this.externalApplyButtonId).click(function() {
        myself._endSearch();
      });

      this._setInitialValue();

      this.postExec();

      if(!this.isSilent()) {
        this.unblock();
      }
    },

    /**
     *
     * @method getValue
     * @return {*}
     */
    getValue: function() {
      return this.value;
    },

    /**
     *
     * @method _getOptions
     * @return {{appendTo: string, minLength: (AutocompleteBoxComponent.minTextLength|*|number), source: Function, focus: Function, open: Function, close: Function}}
     * @private
     */
    _getOptions: function() {
      var myself = this;

      var processChange = this.processChange == null
        ? function() {
            var object = _.extend({}, myself);
            object.value = myself.selectedValues;
            myself.dashboard.processChange(object.name);
          }
        : function() {
            myself.processChange();
          };

      var options = {
        appendTo: '.autocomplete-container',
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
            $('.autocomplete-container .ui-autocomplete').css({'max-height': scroll + 'px', 'overflow-y': 'auto'});
          }

          myself._filterData();
        },

        close: function(event, ui) {
          processChange();
        }
      };

      return options;
    },

    /**
     *
     * @method _selectValue
     * @param label
     * @private
     */
    _selectValue: function(label) {
      var myself = this;
      var addTextElements = this.addTextElements != null ? this.addTextElements : true;
      var showApplyButton = this.showApplyButton != null ? this.showApplyButton : true;
      var list = $('.autocomplete-container .list-data-selection');
      var listItem = $('<li id="' + label + '"><input type="button" class="close-button" value="x"/>' + label + '</li>');

      if(!this.selectMulti) {
        list.empty();
        this.selectedValues = [];
      } else if(showApplyButton) {
        $('.autocomplete-container').addClass('show-apply-button');
        $('.autocomplete-input-apply').show();
      }

      listItem.find('input').click(function() {
        myself._removeValue(label);
      });

      if(addTextElements) {
        listItem.appendTo(list);
      }
      this.selectedValues.push(label);
    },

    /**
     *
     * @method _removeValue
     * @param id
     * @private
     */
    _removeValue: function(id) {
      this.selectedValues = _.without(this.selectedValues, id);
      $('.autocomplete-container .list-data-selection li[id="' + id + '"]').remove();
    },

    _filterData: function() {
      var menu = $('.autocomplete-container .ui-autocomplete');
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
     *
     * @method _search
     * @param search
     * @param callback
     * @private
     */
    _search: function(search, callback) {
      var matchType = this.matchType || 'fromStart';
      var val = search.term.toLowerCase();

      this._queryServer(val, function(data) {

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
     *
     * @method _endSearch
     * @private
     */
    _endSearch: function() {
      var container = $('.autocomplete-container');

      container.removeClass('show-apply-button');
      container.find('.autocomplete-input-apply').hide();

      this.textbox.val('');
      this.textbox.autocomplete("close");
    },

    /**
     *
     * @method _processAutoBoxChange
     * @private
     */
    _processAutoBoxChange: function() {
      this.textbox.autocomplete("change");
    }
  });

  return AutocompleteBoxComponent;

});
