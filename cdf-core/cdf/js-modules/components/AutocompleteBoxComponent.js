/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

define(['./QueryComponent', './BaseComponent', '../lib/jquery.ui.autobox.ext'],
  function(QueryComponent, BaseComponent) {

  var AutocompleteBoxComponent = BaseComponent.extend({

    searchedWord : '',
    result: [],

    /**
     *
     * @param searchString
     * @private
     */
    _queryServer : function(searchString) {

      if(!this.parameters) {
        this.parameters = []
      };

      if(this.searchParam) {
        this.parameters = [ [this.searchParam, this._getInnerParameterName()] ];
      } else if (this.parameters.length > 0) {
        this.parameters[0][1] = this._getInnerParameterName();
      }

      if(this.maxResults) {
        this.queryDefinition.pageSize = this.maxResults;
      }
      this.dashboard.setParameter(this._getInnerParameterName(),this._getTextBoxValue());
      QueryComponent.makeQuery(this);
    },

    /**
     *
     * @returns {*}
     */
    _getTextBoxValue: function() {
      return this.textbox.val();
    },

    /**
     *
     * @returns {string}
     */
    _getInnerParameterName : function() {
      return this.parameter + '_textboxValue';
    },

    /**
     *
     */
    update : function() {

      var myself = this;

      myself.placeholder().empty();

      var initialValue = null;
      if(myself.parameter) {
        initialValue = myself.dashboard.getParameterValue(myself.parameter);
      }

      //init parameter
      if(!myself.dashboard.getParameterValue(myself._getInnerParameterName())) {
        myself.dashboard.setParameter(myself._getInnerParameterName(), '');
      }

      var processChange = ((myself.processChange == undefined)
        ? function(objName) {
            myself.dashboard.processChange(objName);
          }
        : function(objName) {
          myself.processChange();
        }
      );
      var processElementChange = ((myself.processElementChange == true)
        ? function(value) {
            myself.dashboard.fireChange(myself.parameter,value);
          }
        : undefined
      );

      //TODO:typo on minTextLength
      if(myself.minTextLenght == undefined) {
        myself.minTextLenght = 0;
      }

      var opt = {
        list: function() {
          var val = myself._getTextBoxValue();
          if(val.length >= myself.minTextLenght
            && !(val == '' //nothing to search
              || val == myself.searchedWord
              || ((myself.queryInfo != null && myself.result.length == myself.queryInfo.totalRows)
                //has all results
                && myself.searchedWord != ''
                && ((myself.matchType == "fromStart")
                    ? val.indexOf(myself.searchedWord) == 0
                    : val.indexOf(myself.searchedWord) > -1)))) //searchable in local results
          {
            myself._queryServer(val);
            myself.searchedWord = val;
          }
          var list = [];
          for(p in myself.result) if (myself.result.hasOwnProperty(p)) {
            var obj = {};
            obj.text = myself.result[p][0];
            list.push(obj);
          }
          return list;
        },
        matchType: myself.matchType == undefined ? "fromStart" : myself.matchType, /*fromStart,all*/
        processElementChange:  processElementChange,
        processChange: function(obj,value) {
          obj.value = value;
          processChange(obj.name);
        },
        multiSelection: myself.selectMulti == undefined ? false : myself.selectMulti,
        checkValue: myself.checkValue == undefined ? true : myself.checkValue,
        minTextLenght: myself.minTextLenght == undefined ? 0 : myself.minTextLenght,
        scrollHeight: myself.scrollHeight,
        applyButton: myself.showApplyButton == undefined ? true : myself.showApplyButton,
        tooltipMessage: myself.tooltipMessage == undefined ? "Click it to Apply" : myself.tooltipMessage,
        addTextElements: myself.addTextElements == undefined ? true : myself.addTextElements,
        externalApplyButtonId: myself.externalApplyButtonId,
        //    selectedValues: initialValue,
        parent: myself
      };

      myself.autoBoxOpt = myself.placeholder().autobox(opt);

      //setInitialValue
      myself.autoBoxOpt.setInitialValue(myself.htmlObject, initialValue, myself.name);

      myself.textbox = myself.placeholder('input');

      myself._doAutoFocus();
    },

    /**
     *
     * @returns {*}
     * @private
     */
    _getValue : function() {
      return this.value;
    },

    /**
     *
     * @private
     */
    _processAutoBoxChange : function() {
      this.autoBoxOpt.processAutoBoxChange();
    }
  });

  return AutocompleteBoxComponent;

});
