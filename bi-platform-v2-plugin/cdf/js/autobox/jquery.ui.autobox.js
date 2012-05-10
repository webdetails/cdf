/**
 * jQuery Autobox Plugin
 * Copyright (c) 2008 Big Red Switch
 *
 * http://www.bigredswitch.com/blog/2008/12/autobox2/
 *
 * Dual licensed under the BSD and GPL licenses:
 *  http://en.wikipedia.org/wiki/Bsd_license
 *  http://en.wikipedia.org/wiki/GNU_General_Public_License
 *
 * 0.7.0 : Initial version
 *         Rolled up autocomplete and autotext plugins
 *
 * ****************************************************************************
 *
 * jQuery Autocomplete
 * Written by Yehuda Katz (wycats@gmail.com) and Rein Henrichs (reinh@reinh.com)
 * Copyright 2007 Yehuda Katz, Rein Henrichs
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Facebook style text list from Guillermo Rauch's mootools script:
 *  http://devthought.com/textboxlist-fancy-facebook-like-dynamic-inputs/
 *
 * Caret position method: Diego Perini: http://javascript.nwbox.com/cursor_position/cursor.js
 */

//TODO: should be completely redone, using new jquery autobox; current component code is too cryptic and fragile

(function($){

  $.fn.resizableTextbox=function(el, options) {
    var opts=$.extend({ min: 5, max: 500, step: 7 }, options);
    var width=el.attr('offsetWidth');
    el.bind('keydown', function(e) {
        $(this).data('rt-value', this.value.length);
    })
    .bind('keyup', function(e) {
/*        var self=$(this);
        var newsize=opts.step * self.val().length;
        if (newsize <= opts.min) {
          newsize=width;
        }
        if (!(self.val().length == self.data('rt-value') ||
              newsize <= opts.min || newsize >= opts.max)) {
          self.width(newsize);
        }*/
     });
  };

  $.ui=$.ui || {}; $.ui.autobox=$.ui.autobox || {}; var active; var count=0; var valueMatched=false;

  var KEY={
    ESC: 27,
    RETURN: 13,
    TAB: 9,
    BS: 8,
    DEL: 46,
    LEFT: 37,
    RIGHT: 39,
    UP: 38,
    DOWN: 40
  };
  
  var inputId='';
  
  function addBox(opt,input, text, name){
    var li=$('<li class="bit-box"></li>').attr('id', opt.name + 'bit-' + count++).text(text);
    li.append($('<a href="" class="closebutton"></a>')
          .bind('click', function(e) {
              li.remove();
              e.preventDefault();
			  if(!opt.multiSelection)
				opt.processAutoBoxChange(input,opt);
			  else if(opt.processElementChange!= undefined)
				opt.processAutoBoxElement();
			
			  if(opt.multiSelection && opt.applyButton != false)
				 opt.showApplyButton();
				
          }))
      .append($('<input type="hidden" />')
          .attr('name', name)
          .val(text)
      );

    return li;
  }
  
    function addText(opt,input, text, name){
      if(text.length > 0)
      {
        if(opt.addTextElements){
          var li;
          if(opt.multiSelection != true){
            count = 0;
            li = addBox(opt,input, text, name);
            $("#" +opt.name + "bit-0").replaceWith(li);
          }
          else
            li = addBox(opt,input, text, name);
  
          if(opt.multiSelection && opt.applyButton != false)
            opt.showApplyButton();
            
          input.after(li);
          input.val("");
        }
        else{
          opt.selectedValues = opt.selectedValues  == undefined ? {} : opt.selectedValues;
          opt.selectedValues[text] = true;
        }
      }
    }
	
	function getCurrentValsHash(input,opt){//return the currently selected values as a hash
		if(opt.addTextElements){
	      var vals=input.parent().parent().find('li');
	      var hash={};
	      for(var i=0; i<vals.length; ++i){
	        var s=vals[i].innerHTML.match(/^[^<]+/);
	        if(s){ 
          if(!opt.multiSelection) 
            hash[s]=true; 
          else
            hash[s[0]]=true; 
          }
	      }
	      return hash;
		}
		else
			return opt.selectedValues;
    }
	
	
  $.fn.autoboxMode=function(multiSelection,container, input, size, opt){
    var original=input.val(); var selected=-1; var self=this;
		
		

    $.data(document.body, "autoboxMode", true);

    $("body").one("cancel.autobox", function(){
      input.trigger("cancel.autobox");
      $("body").trigger("off.autobox");
      input.val(original);
    });

	
    $("body").bind("activate.autobox", function(e, k){
      // Try hitting return to activate autobox and then hitting it again on blank input
      // to close it.  w/o checking the active object first this input.trigger() will barf.
      if(active && active[0] && $.data(active[0], "originalObject")){
			var hash = getCurrentValsHash(input,opt);
			if(valueMatched)
			if(hash == null || hash[input.val()] != true){
				var value = $.data(active[0], "originalObject").text;
				if(!opt.multiSelection || (active[0].childNodes[0].checked || k == KEY.RETURN))
					addText(opt,input,value, opt.name);
				if(!opt.multiSelection)
					opt.processAutoBoxChange(input,opt);
				else if(opt.processElementChange!= undefined)
					opt.processAutoBoxElement();
			}
			
			if(!opt.multiSelection || k == KEY.RETURN){				
				$("body").trigger("off.autobox");
			}
      }
      else if(input.val()){ 
		var hash = getCurrentValsHash(input,opt);
		if(!valueMatched){
			var aux = $(opt.list).filter(function(){valueMatched = this.text == input.val() ? true : valueMatched;});
		}
		if(valueMatched)
			if(hash == null || hash[input.val()] != true){
				addText(opt,input, input.val(), opt.name);
				if(!opt.multiSelection)
					opt.processAutoBoxChange(input,opt);
				else if(opt.processElementChange!= undefined)
					opt.processAutoBoxElement();
				$("body").trigger("off.autobox");
			}
	  }
		//active && input.trigger("activate.autobox", [$.data(active[0], "originalObject")]);
    });
	
	
	
	 $("body").bind("click", function(e) {
		if(e.target.id != inputId && e.target.id != "listElement" && e.target.id != "listElementCheckBox")
			$("body").trigger("cancel.autobox");
	 });

    $("body").bind("off.autobox", function(e, reset){
      container.remove();
      $.data(document.body, "autoboxMode", false);
      input.unbind("keydown.autobox");
      $("body").add(window).unbind("click.autobox").unbind("cancel.autobox").unbind("activate.autobox");
    });

    // If a click bubbles all the way up to the window, close the autobox
    /* $(window).bind("click.autobox", function(){
	   if(!opt.multiSelection)
			$("body").trigger("cancel.autobox");
	});*/

    function select(){
      active=$("> *", container).removeClass("active").slice(selected, selected + 1).addClass("active");
      input.trigger("itemSelected.autobox", [$.data(active[0], "originalObject")]);
      input.val(opt.insertText($.data(active[0], "originalObject")));
	  valueMatched = true;
    };
	
    container.mouseover(function(e){
      // If you hover over the container, but not its children, return
      if(e.target == container[0])return;
      // Set the selected item to the item hovered over and make it active
      selected=$("> *", container).index($(e.target).is('li') ? $(e.target)[0] : $(e.target).parents('li')[0]);
      select();
    }).bind("click.autobox", function(e){
	  if(opt.multiSelection && e.target.childNodes.length > 0) 
		 e.target.childNodes[0].checked = true;
	  $("body").trigger("activate.autobox");
      $.data(document.body, "suppressKey", false);
    });
	
    input
      .bind("keydown.autobox", function(e){
        var k=e.which || e.keyCode;
        if(k == KEY.ESC){ $("body").trigger("cancel.autobox"); }
        else if(k == KEY.RETURN){ $("body").trigger("activate.autobox",[k]); e.preventDefault(); }
        else if(k == KEY.UP || k == KEY.TAB || k == KEY.DOWN){
		 
          switch(k){
		 
            case KEY.DOWN:
            case KEY.TAB:
              selected=selected >= size - 1 ? 0 : selected + 1; break;
            case KEY.UP:
              selected=selected <= 0 ? size - 1 : selected - 1; break;
            default: break;
          }
          select();
        } else { return true; }
        $.data(document.body, "suppressKey", true);
      });
  };
  
  
  /**
   * AUTOBOX
   **/

  $.fn.autobox=function(opt){
    opt.selectedValues = [];
    opt=$.extend({}, {
      timeout: 500,
     
     setInitialValue: function(htmlObject, initialValue, name){ 
      var selectedPH = $('#' + htmlObject + ' .autobox-input');
      var input = $('input#' + inputId);
      if($.isArray(initialValue)){
        for(var i =0; i <initialValue.length;i++){
          selectedPH.append(addBox(this, input, initialValue[i], name));
        }
      } else if(initialValue){
        selectedPH.append(addBox(this, input, initialValue, name));
      }
     },
      getList: function(input, hash){
          var list=opt.list;
          if(typeof list == 'function'){
            list = list();
          }
          
          if(hash && opt.addTextElements){ list=$(list).filter(function(){  return !hash[this.text]; }); }
          input.trigger("updateList", [list]);
      },
      template: function(str){ 
        if(!opt.multiSelection) {
          return "<li id=\"listElement\">" + opt.insertText(str) + "</li>";
        }
        else if(opt.addTextElements) {
          return "<li id=\"listElement\">" +  "<input id=\"listElementCheckBox\" name=\"" + opt.insertText(str) + "\" value=\"" + opt.insertText(str) + "\" type=\"checkbox\">" + opt.insertText(str) + "</input>" + "</li>";
        }
        else{
          var value =  opt.insertText(str);
          return "<li id=\"listElement\">" +  "<input " + (opt.selectedValues[value] ? 'checked="yes"' : "") + "\" id=\"listElementCheckBox\" name=\"" + value + "\" value=\"" +value+ "\" type=\"checkbox\">" + opt.insertText(str) + "</input>" + "</li>";
        }
      },
	
    insertText: function(str){ return unescape(escape(str.text)); },
	  minTextLenght: 0,
    match: function(typed){ 
      if (opt.matchType == "fromStart"){
        this.typed = typed;
        this.pre_match = this.text;
        this.match = this.post_match = '';
        if (!this.ajax && !typed || typed.length == 0){
          return true;
        }
        var match_at = this.text.search(new RegExp("\\b^" + typed, "i"));
        if (match_at != -1) {
          this.pre_match = this.text.slice(0,match_at);
          this.match = this.text.slice(match_at,match_at + typed.length);
          this.post_match = this.text.slice(match_at + typed.length);
          return true;
        }
        return false;
      }
      else {
        return this.text.match(new RegExp(typed, "i"));
      }
    },
    wrapper: '<ul ' + (opt.scrollHeight != undefined ? 'style="height:' + opt.scrollHeight + 'px;"' : '')  + 'class="autobox-list"></ul>',

    resizable: {},
		
		emptyValues: function(){
			return (this.input.parent().parent().find('li').length == 1);
		},
		
		removeValue: function(value){
			if(opt.addTextElements){
			    var vals=this.input.parent().parent().find('li');
				var values = new Array();
				for(var i=0; i<vals.length; ++i){
					var v = vals[i].innerHTML.match(/^[^<]+/);	
					if(v!= null && value == v ){
						$(vals[i]).remove();
						if(this.multiSelection && this.applyButton && this.emptyValues())
							this.hideApplyButton();
						return;
					}
				}
			}
			else if(this.selectedValues[value]){
				delete this.selectedValues[value];
			}
		},
		
	 getSelectedValues: function(){
			var values = new Array();
			if(opt.addTextElements){
			  var vals= this.input.parent().parent().find('li');
			  for(var i=0,j=0; i<vals.length; ++i){
          var value = vals[i].innerHTML.match(/^[^<]+/);
          if(value!= null){
            values[j] = value[0];j++;
          }
			  }
			}
			else{
				for(v in opt.selectedValues){
					values.push(v);
				}
			}
			
			return values;
		},
		
		valueAlreadySelected: function(value){
			var vals= this.input.parent().parent().find('li');
			var values = new Array();
			for(var i=0,j=0; i<vals.length; ++i){
				var v = vals[i].innerHTML.match(/^[^<]+/);
				if(v!= null && v == value){
					return true;
				}
			}
			return false;
		},
		
		processAutoBoxChange: function processAutoBoxChange(){
			if(this.multiSelection == true){
				var selectedValues = this.getSelectedValues();
				this.processChange(this.parent,selectedValues);
			}
			else {
				this.processChange(this.parent,this.getSelectedValues());
			}
			
			this.input.val("");
		},
		
		processAutoBoxElement: function processAutoBoxChange(){
			this.processElementChange(this.getSelectedValues());
		},
		
		showApplyButton: function showApplyButton(){
				if(this.applyButton.is(":hidden")){
					this.applyButton.css("left",this.applyButton.parent().width());
					this.applyButton.fadeIn('normal');
					var tooltip = this.applyButton.buttonApplyMessage;
					tooltip.css("left",this.applyButton.offset().left+5);
					tooltip.css("top",this.applyButton.offset().top+20);
					tooltip.fadeIn('normal', function(){
						tooltip.fadeOut(4000)});
				}
				
				//this.applyButton.buttonApplyMessage.fadeOut(4000);
		},
	
		hideApplyButton: function hideApplyButton(){
			this.applyButton.fadeOut("fast");
			this.applyButton.buttonApplyMessage.fadeOut("fast");
		}
		
    }, opt);

    if($.ui.autobox.ext){
      for(var ext in $.ui.autobox.ext){
        if(opt[ext]){
          opt=$.extend(opt, $.ui.autobox.ext[ext](opt));
          delete opt[ext];
        }
    } }

    function preventTabInAutocompleteMode(e){
      var k=e.which || e.keyCode;
      if($.data(document.body, "autoboxMode") && k == KEY.TAB){
        e.preventDefault();
      }
    }
    function startTypingTimeout(e, input, timeout){
      $.data(input, "typingTimeout", window.setTimeout(function(){
        $(e.target || e.srcElement).trigger("autobox");
      }, timeout));
    }
    function clearTypingTimeout(input){
        var typingTimeout=$.data(input, "typingTimeout");
        if(typingTimeout) window.clearInterval(typingTimeout);
    }

  function createInput(){
    var input=$('<input id="' + inputId +'" type="text"></input>')
    
    input.keydown(function(e){
       preventTabInAutocompleteMode(e);
    });
    
    input.click(function(e){
      if(input.val().length == 0){
        input.trigger("autobox");
      }
    });
    
    input.keyup(function(e){
      var k=e.which || e.keyCode;
      if(!$.data(document.body, "autoboxMode") &&
          (k == KEY.UP || k == KEY.DOWN)){
        clearTypingTimeout(this);
        startTypingTimeout(e, this, 0);
      }
      else{
        preventTabInAutocompleteMode(e);
      }
    });
        
    input.keypress(function(e){
      var k=e.keyCode || e.which; // keyCode == 0 in Gecko/FF on keypress
      clearTypingTimeout(this);
      if($.data(document.body, "suppressKey")){
        $.data(document.body, "suppressKey", false);
        //note that IE does not generate keypress for arrow/tab keys
        if(k == KEY.TAB || k == KEY.UP || k == KEY.DOWN) return false;
      }
      if($.data(document.body, "autoboxMode") && k < 32 && k != KEY.BS && k != KEY.DEL) return false;
      else if(k == KEY.RETURN){
        if(input.val()){ 	
          var hash = getCurrentValsHash(input,opt);
          if(hash == null || hash[input.val()] != true){
            if(opt.checkValue == false){
              addText(opt,input, input.val(), opt.name);
              if(!opt.multiSelection)
                opt.processAutoBoxChange(input,opt)
              else if(opt.processElementChange!= undefined)
                opt.processAutoBoxElement();
            }
            else{
              valueMatched = false;
              var list = (typeof opt.list == 'function')? opt.list() : opt.list;
              $(list).filter(function(){
                valueMatched = this.text == input.val() ? true : valueMatched;
              });
              if(opt.checkValue == true && valueMatched){
                addText(opt,input, input.val(), opt.name);
                if(!opt.multiSelection){
                  opt.processAutoBoxChange(input,opt)
                }
                else if(opt.processElementChange!= undefined){
                  opt.processAutoBoxElement();
                }
              }
              else {
                addText(opt,input, "", opt.name);
              }
            }	
          }else
            addText(opt,input, "", opt.name);
        }
        if(opt.selectedValue){
          
        }
        e.preventDefault();
      }
      else if(k == KEY.BS || k == KEY.DEL || k > 32){ // more than ESC and RETURN and the like
        startTypingTimeout(e, this, opt.timeout);
      }
    });
    
    input.bind("autobox", function(){
      var self=$(this);
      self.one("updateList", function(e, list){//clear/update/redraw list
        //opt.valueMatched = false;
        valueMatched = false;
        if(opt.minTextLenght > input.val().length){
          list = [];
        }
        list=$(list)
          .filter(function(){ 
            valueMatched = this.text.replace(/^\s*|\s*$/g,'') == self.val().replace(/^\s*|\s*$/g,'') ? true : valueMatched;
            return  opt.match.call(this, self.val()); 
          })
          .map(function(){
            var node=$(opt.template(this))[0];
            if(opt.multiSelection){
              var el = node.childNodes[0];
              $(el).click(function () { 
                if(!el.checked){
                  opt.removeValue(el.value);
                }
              });
            }
            $.data(node, "originalObject", this);
            return node;
            });
        $("body").trigger("off.autobox");

        if(!list.length) {
          return false;
        }

        var container=list.wrapAll(opt.wrapper).parent();
        var offset=self.offset();

        opt.container=container
          .css({top: offset.top + self.outerHeight(), left: offset.left, width: self.width()})
          .appendTo("body");
          $("body").autoboxMode(opt.multiSelection,container, self, list.length, opt);
      });
      opt.getList(self, getCurrentValsHash(self,opt));
    });
    
    return input;
  } //createInput...

  function createApplyButton(){
    
      var button=$('<a href="#" class="applybutton" ></a>')
       .bind('click', function(e) {
        opt.hideApplyButton();
        //button.hide('slow');
        $("body").trigger("off.autobox");
        opt.processAutoBoxChange($(button.parent().children()[0]),opt);
       });
	   
	   button.attr("title","Click it to Apply");
	   button.hide();
	   
	   var buttonApplyMessage =$('<div class="applybutton" >' + opt.tooltipMessage + '</div>');
	   buttonApplyMessage.hide();
	   
	   button.buttonApplyMessage = buttonApplyMessage;
	  
	   
	   return [button,buttonApplyMessage];
	}
	  
	 
    function createHolder(self){
      
      var input=createInput();
      opt.input = input;
      var applyButton;
      if(opt.applyButton != false){
        applyButton	= createApplyButton();
        opt.applyButton = applyButton[0];
      }
      
      if(opt.externalApplyButtonId){
        var button=$('#' + opt.externalApplyButtonId);
        if (button){
          button.bind('click', function(e) {
            $("body").trigger("off.autobox");
            opt.processAutoBoxChange($(button.parent().children()[0]),opt);
          });
        }
      }
      
      var holder;
      var classHolder = "autobox-hldr";
      if(opt.multiSelection == false || opt.addTextElements == false){
        classHolder = "autobox-hldr-2";
      }
  
      holder=$('<ul class="'+ classHolder + '"></ul>');
      self.append(holder);
      var li = $('<li class="autobox-input"></li>');
      holder.append(li.append(input));
      if(opt.multiSelection && opt.applyButton != false){
        li.append(applyButton[0]);
        li.append(applyButton[1]);
      }
      
      $.fn.resizableTextbox(input, $.extend(opt.resizable, { min: input.attr('offsetWidth'), max: holder.width() }));
      
      return holder;
    }

    this.each(function(){//??
      var self=$(this);
      inputId = opt.parent.htmlObject + 'autoboxInput';
      createHolder(self);
      opt.name=opt.parent.name;
    });
	
    return opt;
  };

})(jQuery);
