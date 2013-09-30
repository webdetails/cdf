var InputBaseComponent = UnmanagedComponent.extend({

  update: function(){
    var qd = this.queryDefinition;
    if(this.valuesArray && this.valuesArray.length > 0) {
      var handler = _.bind(function() {
        this.draw(this.valuesArray);
      },this);
      this.synchronous(handler);
    } else if(qd && (qd.dataAccessId || qd.query)){
      var handler = _.bind(function(data){
        var filtered;
        if(this.valueAsId) {
          filtered = data.resultset.map(function(e){
            return [e[0],e[0]];
          });
        } else {
          filtered = data.resultset;
        }
        this.draw(filtered);
      },this);
      this.triggerQuery(qd,handler);
    } else {
      /* Legacy XAction-based components are a wasps' nest, so
       * we'll steer clearfrom updating those for the time being
       */
      var handler = _.bind(function() {
        var data = this.getValuesArray();
        this.draw(data);
      },this);
      this.synchronous(handler);

    }
  },

  // TODO: is the result of Dashboards.getParameterValue subject or not to HTML encoding?
  // Some controls in this file do html encode the result while others don't.

  /**
   * Obtains the value of this component's parameter.
   * <p>
   * If the parameter value is a function, the result of evaluating it is returned instead.
   * </p>
   * <p>
   * Normalizes return values by using {@link Dashboards.normalizeValue}.
   * </p>
   *
   * @return {*} the parameter value.
   */
  _getParameterValue: function() {
    return Dashboards.normalizeValue(
            Dashboards.ev(
              Dashboards.getParameterValue(this.parameter)));
  }
});


var SelectBaseComponent = InputBaseComponent.extend({
  visible: false,

  //defaultIfEmpty: [false]
  //isMultiple: [true]
  //size: when isMultiple==true, the default value is the number of possible values
  //externalPlugin:
  //extraOptions:
  //changeMode: ['immediate'], 'focus', 'timeout-focus'
  //NOTE: changeMode 'timeout-focus' is not supported in mobile and fallsback to 'focus'
  //changeTimeout: [2000], // in milliseconds
  //changeTimeoutScrollFraction: 1,
  //changeTimeoutChangeFraction: 5/8,
  //autoTopValue: ''
  //autoTopIndex: ''
  
  draw: function(myArray) {
    var ph = this.placeholder();
    var name = this.name;

    // Build the HTML
    var selectHTML = "<select";

    var allowMultiple = this._allowMultipleValues();
    if(allowMultiple) { selectHTML += " multiple"; }

    var placeholderText = this._getPlaceholderText();
    if(placeholderText) { selectHTML += " data-placeholder='" + placeholderText + "'" ; }

    var size = this._getListSize(myArray);
    if(size != null) { selectHTML += " size='" + size + "'"; }

    var extPlugin = this.externalPlugin;
    switch(extPlugin) {
      case "chosen": selectHTML += " class='chzn-select'" ; break;
      case "hynds":  selectHTML += " class='hynds-select'"; break;
    }

    selectHTML += ">";

    // ------

    var currentVal  = this._getParameterValue();
    var currentVals = Dashboards.parseMultipleValues(currentVal); // may be null
    var valuesIndex = {};
    var firstVal;

    Dashboards.eachValuesArray(myArray, {valueAsId: this.valueAsId},
      function(value, label, id, index) {
        selectHTML += "<option value = '" + Dashboards.escapeHtml(value) + "' >" +
                        Dashboards.escapeHtml(label) +
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
     * If defaultIfEmpty is true, the first possible value is selected,
     * otherwise, nothing is selected.
     */
    var isEmpty    = currentVals == null;
    var hasChanged = !currentIsValid;
    if(isEmpty && this.defaultIfEmpty && firstVal != null) {
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
      Dashboards.setParameter(this.parameter, currentVals);
      Dashboards.processChange(name);
    }

    // TODO: shouldn't this be called right after setting the value of select?
    // Before hasChanged firing?
    switch(extPlugin) {
      case "chosen": ph.find("select.chzn-select" ).chosen(this._readExtraOptions()); break;
      case "hynds":  ph.find("select.hynds-select").multiselect({multiple: allowMultiple}); break;
    }

    this._listenElement(ph);
  },

  /**
   * Indicates if the user can select multiple values.
   * The default implementation returns <tt>false</tt>.
   * @return {boolean}
   * @protected
   */
  _allowMultipleValues: function() {
    return false;
  },

  /**
   * Returns the placeholder label for empty values, or false if it is an non-empty String.
   * @protected
   */
  _getPlaceholderText: function() {
    var txt = this.placeholderText;
    return ( _.isString(txt) && !_.isEmpty(txt) && txt ) || false;
  },

  /**
   * The number of elements that the list should show
   * without scrolling.
   * The default implementation
   * returns the value of the {@link #size} property.
   *
   * @param {Array.<Array.<*>>} values the values array.
   * @return {?number}
   * @protected
   */
  _getListSize: function(values) {
    return this.size;
  },

  /**
   * Currently, reads extra options for the "chosen" plugin,
   * by transforming the array of key/value pair arrays
   * in {@link #extraOptions} into a JS object.
   *
   * @return {!Object.<string,*>} an options object.
   */
  _readExtraOptions: function() {
    if(this.externalPlugin && this.extraOptions) {
      return Dashboards.propertiesArrayToObject(this.extraOptions);
    }
  },

  /**
   * Installs listeners in the HTML element/object.
   * <p>
   *    The default implementation listens to the change event
   *    and dashboard-processes each change.
   * </p>
   * @param {!HTMLElement} elem the element.
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
        if(!dash.equalValues(prevValue, currValue)) {
          prevValue = currValue;
          dash.processChange(me.name);
        }
      }
    };
    
    var selElem = $("select", elem);
    
    selElem
        .keypress(function(ev) { if(ev.which === 13) { check(); } });

    var changeMode = this._getChangeMode();
    if(changeMode !== 'timeout-focus') {
      selElem
        .on(me._changeTrigger(), check);
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
   *
   * @return {!string} one of values: 
   * <tt>'immediate'</tt>, 
   * <tt>'focus'</tt> or 
   * <tt>'timeout-focus'</tt>.
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
          Dashboards.log("Invalid 'changeMode' value: '" + changeMode + "'.", 'warn');
      }
    }
    return 'immediate';
  },

  /**
   * Obtains an appropriate jQuery event name
   * for when testing for changes is done.
   * 
   * @return {!string} the name of the event.
   */
  _changeTrigger: function() {
    /**
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
    if(this._getChangeMode() === 'immediate') { return 'change'; }
    return (/android/i).test(navigator.userAgent) ? 'change' : 'focusout';
  }
});

var SelectComponent = SelectBaseComponent.extend({
  defaultIfEmpty: true,
  getValue : function() {
    return this.placeholder("select").val();
  }
});

var SelectMultiComponent = SelectBaseComponent.extend({
  getValue : function() {
    var ph = this.placeholder("select");
    var val = ph.val();
    return val == null ? [] : val;
  },


  /**
   * Obtains the normalized and defaulted value of
   * the {@link #isMultiple} option.
   * 
   * @override
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
   * @override
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
    if(!L) { return arguments.length ? this : 0; }

    var h  = Math.max(1, elem.scrollHeight);
    var hi = Math.max(1, h / L);

    if(arguments.length) {
      var topIndex = +_;
      
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


var TextInputComponent = BaseComponent.extend({
  update: function() {
    var name = this.name;
    var selectHTML = "<input type='text' id='" + name +
      "' name='"  + name +
      "' value='" + Dashboards.getParameterValue(this.parameter) +
      (this.size ? ("' size='" + this.size) : "") +
      (this.maxLength ? ("' maxlength='" + this.maxLength) : "") +
      "'>";

    this.placeholder().html(selectHTML);

    $("#" + name)
      .change(function() { Dashboards.processChange(name); })
      .keyup(function(ev) { if (ev.keyCode == 13) { Dashboards.processChange(name); } });

    this._doAutoFocus();
  },
  getValue : function() {
    return $("#"+this.name).val();
  }
});


var TextareaInputComponent = BaseComponent.extend({
  update: function() {
    var name = this.name;
    var selectHTML = "<textarea id='" + name +
      "' name='" + name +
      (this.numRows ? ("' rows='" + this.numRows) : "") +
      (this.numColumns ? ("' cols='" + this.numColumns) : "") +
      "'>" +
      Dashboards.getParameterValue(this.parameter) +
      '</textarea>';

    this.placeholder().html(selectHTML);

    $("#" + name)
      .change(function() { Dashboards.processChange(name); })
      .keyup(function(ev){ if (ev.keyCode == 13) { Dashboards.processChange(name); }
    });
  },
  getValue : function() {
    return $("#"+this.name).val();
  }
});



// Start by setting a sane i18n default to datepicker
//TODO: move this to where we know for sure datepicker is loaded..
if($.datepicker) {
  $(function(){$.datepicker.setDefaults($.datepicker.regional[''])});
}

var DateInputComponent = BaseComponent.extend({
  update: function(){
    var format = (this.dateFormat == undefined || this.dateFormat == null)? 'yy-mm-dd' : this.dateFormat;
    var myself = this;

    var startDate, endDate;

    if(this.startDate == 'TODAY') startDate = new Date();
    else if(this.startDate) startDate = $.datepicker.parseDate( format, this.startDate);

    if(this.endDate == 'TODAY') endDate = new Date();
    else if(this.endDate) endDate = $.datepicker.parseDate( format, this.endDate);

    //ToDo: stretch interval to catch defaultValue?..
    //Dashboards.getParameterValue(this.parameter))

    this.placeholder().html($("<input/>").attr("id", this.name).attr("value", Dashboards.getParameterValue(this.parameter)).css("width", "80px"));
    $(function(){
      myself.placeholder("input").datepicker({
        dateFormat: format,
        changeMonth: true,
        changeYear: true,
        minDate: startDate,
        maxDate: endDate,
        onSelect: function(date, input){
          Dashboards.processChange(myself.name);
        }
      });
      // Add JQuery DatePicker standard localization support only if the dashboard is localized
      if (typeof Dashboards.i18nSupport !== "undefined" && Dashboards.i18nSupport != null) {
        var $input = myself.placeholder("input");

        $input.datepicker('option', $.datepicker.regional[Dashboards.i18nCurrentLanguageCode]);


        //Setup alt field and format to keep iso format
        $input.parent().append($('<hidden>').attr("id", myself.name + "_hidden"));
        $input.datepicker("option", "altField", "#" + myself.name + "_hidden" );
        $input.datepicker("option", "altFormat", format );
      }
      myself._doAutoFocus();
    });
  },
  getValue : function() {
    if (typeof Dashboards.i18nSupport !== "undefined" && Dashboards.i18nSupport != null)
        return $("#" + this.name + "_hidden").val();
    else
        return $("#"+this.name).val();
  }
});


var DateRangeInputComponent = BaseComponent.extend({
  update : function() {
    var dr;
    if (this.singleInput == undefined || this.singleInput == true){
      dr = $("<input/>").attr("id",this.name).attr("value",Dashboards.getParameterValue(this.parameter[0]) + " > " + Dashboards.getParameterValue(this.parameter[1]) ).css("width","170px");
      this.placeholder().html(dr);
    } else {
      dr = $("<input/>").attr("id",this.name).attr("value",Dashboards.getParameterValue(this.parameter[0])).css("width","80px");
      this.placeholder().html(dr);
      dr.after($("<input/>").attr("id",this.name + "2").attr("value",Dashboards.getParameterValue(this.parameter[1])).css("width","80px"));
      if(this.inputSeparator != undefined){
        dr.after(this.inputSeparator);
      }
    }
    var offset = dr.offset();
    var myself = this;
    var earliestDate = this.earliestDate != undefined  ?  this.earliestDate : Date.parse('-1years');
    var latestDate = this.latestDate != undefined  ?  this.latestDate : Date.parse('+1years');
    var leftOffset = this.leftOffset != undefined ?  this.leftOffset : 0;
    var topOffset = this.topOffset != undefined ?  this.topOffset : 15;

    var changed, closed;
    function triggerWhenDone() {
      if(changed && closed) {
        myself.fireInputChange(myself.startValue,myself.endValue);
        changed = closed = false;
      }
    };

    var format = (myself.dateFormat == undefined || myself.dateFormat == null)? 'yy-mm-dd' : myself.dateFormat;

    $(function(){
      myself.placeholder("input").daterangepicker({
        posX: offset.left + leftOffset,
        posY: offset.top + topOffset,
        earliestDate: earliestDate,
        latestDate: latestDate,
        dateFormat: format,
        onOpen: function() {
          changed = closed = false;
          myself.startValue = null;
          myself.endValue = null;
        },
        onDateSelect: function(rangeA, rangeB) {
          changed = true;
          myself.storeChanges(rangeA, rangeB);
          triggerWhenDone();
        },
        onClose: function() {
          closed = true;
          triggerWhenDone();
        }
      });
      myself._doAutoFocus();
    });
  },

  fireInputChange : function(start, end){
    //TODO: review this!
    if(this.preChange){
      this.preChange(start, end);
    }

    if(this.parameter)
    {
      if( this.parameter.length == 2) Dashboards.setParameter(this.parameter[1], end);
      if( this.parameter.length > 0) Dashboards.fireChange(this.parameter[0], start);
    }

    if(this.postChange){
      this.postChange(start, end);
    }
  },

  storeChanges : function(start,end){
    this.startValue = start;
    this.endValue = end;
  }
},
{
  fireDateRangeInputChange : function(name, rangeA, rangeB){
    // WPG: can we just use the parameter directly?
    var object = Dashboards.getComponentByName(name);
    if(!(typeof(object.preChange)=='undefined')){
      object.preChange(rangeA, rangeB);
    }
    var parameters = eval(name + ".parameter");
    // set the second date and fireChange the first
    Dashboards.setParameter(parameters[1], rangeB);
    Dashboards.fireChange(parameters[0],rangeA);
    if(!(typeof(object.postChange)=='undefined')){
      object.postChange(rangeA, rangeB);
    }
  }
}
);

var MonthPickerComponent = BaseComponent.extend({
  update : function() {
    var selectHTML = this.getMonthPicker(this.name, this.size, this.initialDate, this.minDate, this.maxDate, this.months);
    this.placeholder().html(selectHTML);
    var myself = this;
    $("#"+this.name).change(function() {
      Dashboards.processChange(myself.name);
    });
    this._doAutoFocus();
  },
  getValue : function() {
    var value = $("#" + this.name).val();

    var year = value.substring(0,4);
    var month = parseInt(value.substring(5,7) - 1);
    var d = new Date(year,month,1);

    // rebuild picker
    var selectHTML = this.getMonthPicker(this.name, this.size, d, this.minDate, this.maxDate, this.months);
    this.placeholder().html(selectHTML);
    var myself = this;
    $("#"+this.name).change(function() {
      Dashboards.processChange(myself.name);
    });
    return value;
  },
  getMonthPicker : function(object_name, object_size, initialDate, minDate, maxDate, monthCount) {


    var selectHTML = "<select";
    selectHTML += " id='" + object_name + "'";

    if (minDate == undefined){
      minDate = new Date();
      minDate.setYear(1980);
    }
    if (maxDate == undefined){
      maxDate = new Date();
      maxDate.setYear(2060);
    }

    // if monthCount is not defined we'll use everything between max and mindate
    if(monthCount == undefined || monthCount == 0) {
      var monthsToAdd = (maxDate.getFullYear() - minDate.getFullYear())*12;
      monthCount = (maxDate.getMonth() - minDate.getMonth()) + monthsToAdd;
    }

    //set size
    if (object_size != undefined){
      selectHTML += " size='" + object_size + "'";
    }
    selectHTML += '>';

    var currentDate = new Date(+initialDate);
    currentDate.setMonth(currentDate.getMonth()- monthCount/2 - 1);

    for(var i= 0; i <= monthCount; i++){

      currentDate.setMonth(currentDate.getMonth() + 1);
      if(currentDate >= minDate && currentDate <= maxDate)
      {
        selectHTML += "<option value = '" + currentDate.getFullYear() + "-" + this.zeroPad(currentDate.getMonth()+1,2) + "' ";

        if(currentDate.getFullYear() == initialDate.getFullYear() && currentDate.getMonth() == initialDate.getMonth()){
          selectHTML += "selected='selected'"
        }

        selectHTML += ">" + Dashboards.monthNames[currentDate.getMonth()] + " " +currentDate.getFullYear()  + "</option>";
      }
    }

    selectHTML += "</select>";

    return selectHTML;
  },
  zeroPad : function(num,size) {
    var n = "00000000000000" + num;
    return n.substring(n.length-size,n.length);
  }
});

var ToggleButtonBaseComponent = InputBaseComponent.extend({
  draw: function(myArray){

    var selectHTML = "";

    //default
    var currentVal = Dashboards.getParameterValue(this.parameter);
    currentVal = (typeof currentVal == 'function') ? currentVal() : currentVal;

    var isSelected = false;

    var currentValArray = [];
    if(currentVal instanceof Array || (typeof(currentVal) == "object" && currentVal.join)) {
      currentValArray = currentVal;
    } else if(typeof(currentVal) == "string"){
      currentValArray = currentVal.split("|");
    }

    // check to see if current selected values are in the current values array. If not check to see if we should default to the first
    var vid = this.valueAsId==false?0:1;
    var hasCurrentVal = false;
      outer:
      for(var i = 0; i < currentValArray.length; i++){
        for(var y = 0; y < myArray.length; y++) {
          if (currentValArray[i] == myArray[y][vid]) {
            hasCurrentVal = true;
            break outer;
          }
        }
      }
    // if there will be no selected value, but we're to default if empty, select the first
    if(!hasCurrentVal && this.defaultIfEmpty){
      currentValArray = [myArray[0][vid]];

      this.currentVal = currentValArray;
      Dashboards.setParameter(this.parameter,currentValArray);
      Dashboards.processChange(this.name);
    }
    // (currentValArray == null && this.defaultIfEmpty)? firstVal : null


    selectHTML += "<ul class='"+ ((this.verticalOrientation)? "toggleGroup vertical":"toggleGroup horizontal")+"'>"
    for (var i = 0, len = myArray.length; i < len; i++) {
      selectHTML += "<li class='"+ ((this.verticalOrientation)? "toggleGroup vertical":"toggleGroup horizontal")+"'><label><input onclick='ToggleButtonBaseComponent.prototype.callAjaxAfterRender(\"" + this.name + "\")'";

      isSelected = false;
      for (var j = 0, valLength = currentValArray.length; j < valLength; j++) {
        isSelected = currentValArray[j] == myArray[i][vid];
        if(isSelected) {
          break;
        }
      }

      if (this.type == 'radio' || this.type == 'radioComponent'){
        if ((i == 0 && !hasCurrentVal) ||
          (hasCurrentVal && (myArray[i][vid] == currentVal ))) {
          selectHTML += " CHECKED";
        }
        selectHTML += " type='radio'";
      }else{
        if ((i == 0 && !hasCurrentVal && this.defaultIfEmpty) ||
          (hasCurrentVal && isSelected)) {
          selectHTML += " CHECKED";
        }
        selectHTML += " type='checkbox'";
      }
      selectHTML += "class='" + this.name +"' name='" + this.name +"' value='" + myArray[i][vid] + "' /> " + myArray[i][1] + "</label></li>" + ((this.separator == undefined || this.separator == null || this.separator == "null")?"":this.separator);
    }
    selectHTML += "</ul>"
    // update the placeholder
    this.placeholder().html(selectHTML);
    this.currentVal = null;
    this._doAutoFocus();
  },
  callAjaxAfterRender: function(name){
    setTimeout(function(){
      Dashboards.processChange(name)
    },1);
  }
});

var RadioComponent = ToggleButtonBaseComponent.extend({
  getValue : function() {
    if (this.currentVal != 'undefined' && this.currentVal != null) {
      return this.currentVal;
    } else {
      return this.placeholder("."+this.name+":checked").val();
    }
  }
});

var CheckComponent = ToggleButtonBaseComponent.extend({
  getValue : function() {
    if (this.currentVal != 'undefined' && this.currentVal != null) {
      return this.currentVal;
    } else {
      var a = new Array()
      this.placeholder("."+this.name + ":checked").each(function(i,val){
        a.push($(this).val());
      });
      return a;
    }
  }
});

var MultiButtonComponent = ToggleButtonBaseComponent.extend({
  indexes: [],//used as static
  draw: function(myArray){
    this.cachedArray = myArray;
    var cssWrapperClass= "pentaho-toggle-button pentaho-toggle-button-up "+ ((this.verticalOrientation)? "pentaho-toggle-button-vertical" : "pentaho-toggle-button-horizontal");
    var selectHTML = "";
    var firstVal;

    var valIdx = this.valueAsId ? 1 : 0;
    var lblIdx = 1;

    if (this.isMultiple == undefined) this.isMultiple = false;

    var ph = $("<div>");
    ph.appendTo(this.placeholder().empty());

    for (var i = 0, len = myArray.length; i < len; i++){
      var value = myArray[i][valIdx],
        label = myArray[i][lblIdx],
        classes = cssWrapperClass + this.getExtraCss(i,len,this.verticalOrientation),
        selector;

      value = (value == null ? null : value.replace('"','&quot;' ));
      label = (label == null ? null : label.replace('"','&quot;' ));

      if(i == 0){
        firstVal = value;
      }

      selectHTML = "<div class='" + classes +"'><button name='" + this.name + "'>" + label + "</button  >" +"</div>";
      selector = $(selectHTML);
      // We wrap the click handler in a self-executing function so that we can capture 'i'.
      var myself = this;
      (function(index){ selector.click(function(){
        MultiButtonComponent.prototype.clickButton(myself.htmlObject, myself.name, index, myself.isMultiple, myself.verticalOrientation);
      });}(i));
      ph.append(selector);
      if (!(this.separator == undefined || this.separator == null || this.separator == "null") && i != myArray.length - 1) {
        ph.append(this.separator);
      }
    }


    //default
    var currentVal = Dashboards.ev(Dashboards.getParameterValue(this.parameter));

    var isSelected = false;

    var currentValArray;
    if(currentVal == null) {
      currentValArray = [];
    } else if(currentVal instanceof Array || (typeof(currentVal) == "object" && currentVal.join)) {
      currentValArray = currentVal;
    } else {
      currentValArray = currentVal.toString().split("|");
    }

    var foundDefault = false;
    this.clearSelections(this.htmlObject, this.name, this.verticalOrientation);
    for (var i = 0; i < myArray.length; i++) {

      isSelected = false;
      for (var j = 0, valLength = currentValArray.length; j < valLength; j++) {
        isSelected = currentValArray[j] == myArray[i][valIdx];
        if(isSelected) {
          break;
        }
      }


      if ( ( $.isArray(currentVal) && isSelected || isSelected)
        || (myArray[i][valIdx] == currentVal || myArray[i][lblIdx] == currentVal) ) {

        MultiButtonComponent.prototype.clickButton(this.htmlObject, this.name, i, this.isMultiple, this.verticalOrientation, true);

        foundDefault = true;
        if(!this.isMultiple) {
          break;
        }
      }
    }
    if(((!foundDefault && !this.isMultiple) || (!foundDefault && this.isMultiple && this.defaultIfEmpty)) && myArray.length > 0){
      //select first value
      if((currentVal == null || currentVal == "" || (typeof(currentVal) == "object" && currentVal.length == 0)) && this.parameter){
        Dashboards.fireChange(this.parameter, (this.isMultiple) ? [firstVal] : firstVal);
      }

      MultiButtonComponent.prototype.clickButton(this.htmlObject, this.name, 0, this.isMultiple, this.verticalOrientation, true);
    }

    // set up hovering
    $(".pentaho-toggle-button").hover(function() {
      $(this).addClass("pentaho-toggle-button-up-hovering");
    }, function() {
      $(this).removeClass("pentaho-toggle-button-up-hovering");
    });
    // set up hovering when inner button is hovered
    $(".pentaho-toggle-button button").hover(function() {
      $(this).parent().addClass("pentaho-toggle-button-up-hovering");
    }, function() {
      // don't remove it, since it's inside the outer div it will handle that
    });

    this._doAutoFocus();
  },

  getValue: function(){
    if(this.isMultiple){
      var indexes = MultiButtonComponent.prototype.getSelectedIndex(this.name);
      var a = new Array();
      // if it is not an array, handle that too
      if (indexes.length == undefined) {
        a.push(this.getValueByIdx(indexes));
      } else {
        for(var i=0; i < indexes.length; i++){
          a.push(this.getValueByIdx(indexes[i]));
        }
      }
      return a;
    }
    else {
      return this.getValueByIdx(MultiButtonComponent.prototype.getSelectedIndex(this.name));
    }
  },

  getValueByIdx: function(idx){
    return this.cachedArray[idx][this.valueAsId ? 1 : 0];
  },

  getSelecetedCss: function(verticalOrientation) {
    return "pentaho-toggle-button pentaho-toggle-button-down "+ ((verticalOrientation)? "pentaho-toggle-button-vertical" : "pentaho-toggle-button-horizontal");
  },
  getUnselectedCss: function(verticalOrientation) {
    return "pentaho-toggle-button pentaho-toggle-button-up "+ ((verticalOrientation)? "pentaho-toggle-button-vertical" : "pentaho-toggle-button-horizontal");
  },

  //static MultiButtonComponent.prototype.clickButton
  // This method should be broken up so the UI state code is reusable outside of event processing
  clickButton: function(htmlObject, name, index, isMultiple, verticalOrientation, updateUIOnly){

    var cssWrapperClass= this.getUnselectedCss(verticalOrientation);
    var cssWrapperClassSelected= this.getSelecetedCss(verticalOrientation);

    var buttons = $("#" + htmlObject + " button");
    if (isMultiple) {//toggle button
      if (this.indexes[name] == undefined) this.indexes[name] = [];
      else if(!$.isArray(this.indexes[name])) this.indexes[name] = [this.indexes[name]];//!isMultiple->isMultiple

      var disable = false;
      for (var i = 0; i < this.indexes[name].length; ++i) {
        if (this.indexes[name][i] == index) {
          disable = true;
          this.indexes[name].splice(i, 1);
          break;
        }
      }
      if (disable){
        buttons[index].parentNode.className = cssWrapperClass + this.getExtraCss(index,buttons.length,verticalOrientation);
      } else {
        buttons[index].parentNode.className = cssWrapperClassSelected + this.getExtraCss(index,buttons.length,verticalOrientation);
        this.indexes[name].push(index);
      }
    }
    else {//de-select old, select new
      this.clearSelections(htmlObject, name, verticalOrientation);
      this.indexes[name] = index;
      buttons[index].parentNode.className = cssWrapperClassSelected + this.getExtraCss(index,buttons.length,verticalOrientation);
    }
    if(!updateUIOnly){
      this.callAjaxAfterRender(name);
    }
  },

  clearSelections: function(htmlObject, name, verticalOrientation) {
    var buttons = $("#" + htmlObject + " button");
    var cssWrapperClass = this.getUnselectedCss(verticalOrientation);
    for(var i = 0; i < buttons.length; i++){
      buttons[i].parentNode.className = cssWrapperClass + this.getExtraCss(i,buttons.length,verticalOrientation);
    }

    this.indexes[name] = [];
  },

  getExtraCss: function(index, count, verticalOrientation) {
    var css = "";
    if (index == 0 && count == 1) {
      // both first & last
      return " pentaho-toggle-button-single";
    }
    if (index == 0) {
      css += " "+ ((verticalOrientation) ? " pentaho-toggle-button-vertical-first" : " pentaho-toggle-button-horizontal-first");
    } else if (index == count-1) {
      css += " "+ ((verticalOrientation) ? " pentaho-toggle-button-vertical-last" : " pentaho-toggle-button-horizontal-last");
    }
    return css;
  },

  //static MultiButtonComponent.prototype.getSelectedIndex
  getSelectedIndex: function(name){
    return this.indexes[name];
  }
});

var AutocompleteBoxComponent = BaseComponent.extend({

  searchedWord : '',
  result: [],

  queryServer : function(searchString){

    if(!this.parameters) this.parameters = [];

    if(this.searchParam){
      this.parameters = [ [this.searchParam, this.getInnerParameterName()] ];
    }
    else if (this.parameters.length > 0){
      this.parameters[0][1] = this.getInnerParameterName();
    }

    if(this.maxResults){
      this.queryDefinition.pageSize = this.maxResults;
    }
    Dashboards.setParameter(this.getInnerParameterName(),this.getTextBoxValue());
    QueryComponent.makeQuery(this);
  },

  getTextBoxValue: function(){
    return this.textbox.val();
  },

  getInnerParameterName : function(){
    return this.parameter + '_textboxValue';
  },

  update : function() {

    this.placeholder().empty();

    var initialValue = null;
    if(this.parameter){
      initialValue = Dashboards.getParameterValue(this.parameter);
    }

    var myself = this;

    //init parameter
    // TODO: FIXME: dcl - Isn't the following
    // this.getInnerParameterName missing parentesis?
    if(!Dashboards.getParameterValue(this.getInnerParameterName)){
      Dashboards.setParameter(this.getInnerParameterName(), '' );
    }

    var processChange = myself.processChange == undefined ? function(objName){
      Dashboards.processChange(objName);
    } : function(objName) {
      myself.processChange();
    };
    var processElementChange = myself.processElementChange == true ? function(value){
      Dashboards.fireChange(myself.parameter,value);
    } : undefined;

    //TODO:typo on minTextLength
    if(this.minTextLenght == undefined){
      this.minTextLenght = 0;
    }

    var opt = {
      list: function(){
        var val = myself.textbox.val();
        if(val.length >= myself.minTextLenght &&
           !(val == '' //nothing to search
             ||
             val == myself.searchedWord
             ||
            ((myself.queryInfo != null && myself.result.length == myself.queryInfo.totalRows) && //has all results
             myself.searchedWord != '' &&
             ((myself.matchType == "fromStart")?
                val.indexOf(myself.searchedWord) == 0 :
                val.indexOf(myself.searchedWord) > -1)))) //searchable in local results
        {
          myself.queryServer(val);
          myself.searchedWord = val;
        }
        var list = [];
        for(p in myself.result) if (myself.result.hasOwnProperty(p)){
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


    this.autoBoxOpt = this.placeholder().autobox(opt);

    //setInitialValue
    this.autoBoxOpt.setInitialValue(this.htmlObject, initialValue, this.name);

    this.textbox = this.placeholder('input');

    this._doAutoFocus();
  },
  getValue : function() {
    return this.value;
  },
  processAutoBoxChange : function() {
    this.autoBoxOpt.processAutoBoxChange();
  }
});

var ButtonComponent = BaseComponent.extend({
  update : function() {
    var myself = this;
    var b = $("<button type='button'/>").text(this.label).unbind("click").bind("click", function(){
        return myself.expression.apply(myself,arguments);
    });
    if (typeof this.buttonStyle === "undefined" || this.buttonStyle === "themeroller")
      b.button();
    b.appendTo(this.placeholder().empty());

    this._doAutoFocus();
  }
});
