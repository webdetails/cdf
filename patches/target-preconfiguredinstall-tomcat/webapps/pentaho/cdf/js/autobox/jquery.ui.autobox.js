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
(function($){

  function LOG(obj){
    if(console && console.log){
      console.log(obj);
    }
    else{
      var cons=$('#log');
      if(!cons){cons=$('<div id="log"></div>');}
      if(cons){cons.append(obj).append('<br/>\n');}
    }
  }

  $.fn.resizableTextbox=function(el, options) {
    var opts=$.extend({ min: 5, max: 500, step: 7 }, options);
    var width=el.attr('offsetWidth');
    el.bind('keydown', function(e) {
        $(this).data('rt-value', this.value.length);
    })
    .bind('keyup', function(e) {
        var self=$(this);
        var newsize=opts.step * self.val().length;
        if (newsize <= opts.min) {
          newsize=width;
        }
        if (!(self.val().length == self.data('rt-value') ||
              newsize <= opts.min || newsize >= opts.max)) {
          self.width(newsize);
        }
     });
  };

  $.ui=$.ui || {}; $.ui.autobox=$.ui.autobox || {}; var active; var count=0;

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

  function addBox(opt,input, text, name){
    var li=$('<li class="bit-box"></li>').attr('id', 'bit-' + count++).text(text);
    li.append($('<a href="#" class="closebutton"></a>')
          .bind('click', function(e) {
              li.remove();
              e.preventDefault();
			  processChange(input,opt);
          }))
      .append($('<input type="hidden" />')
          .attr('name', name)
          .val(text)
      );
    input.parent().after(li);
    input.val('');
  }
  
  function addText(opt,input, text, name){
	if(opt.multiSellection == true && text.length > 0)
		addBox(opt,input, text, name);
	else
		input.val(text);
	}
	
   function getSelectedValues(input){
      var vals=input.parent().parent().find('li');
	  var values = new Array();
      for(var i=0,j=0; i<vals.length; ++i){
		var value = vals[i].innerHTML.match(/^[^<]+/);
		if(value!= null){
			values[j] = value;j++;
		}
      }
      return values;
    }
	
  function processChange(input,opt){
	if(opt.multiSellection == true){
		var selectedValues = getSelectedValues(input);
		opt.processChange(opt.parent,selectedValues);
		}
	else
		opt.processChange(opt.parent,input.val());
	}
	
	function getCurrentValsHash(input){//return the currently selected values as a hash
      var vals=input.parent().parent().find('li');
      var hash={};
      for(var i=0; i<vals.length; ++i){
        var s=vals[i].innerHTML.match(/^[^<]+/);
        if(s){ hash[s]=true; }
      }
      return hash;
    }

  $.fn.autoboxMode=function(multiSellection,container, input, size, opt){
    var original=input.val(); var selected=-1; var self=this;

    $.data(document.body, "autoboxMode", true);

    $("body").one("cancel.autobox", function(){
      input.trigger("cancel.autobox");
      $("body").trigger("off.autobox");
      input.val(original);
    });

    $("body").one("activate.autobox", function(){
      // Try hitting return to activate autobox and then hitting it again on blank input
      // to close it.  w/o checking the active object first this input.trigger() will barf.
      if(active && active[0] && $.data(active[0], "originalObject")){
			var hash = getCurrentValsHash(input);
			if(hash == null || hash[input.val()] != true){
				addText(opt,input, $.data(active[0], "originalObject").text, opt.name);
				processChange(input,opt);
			}
      }
      else if(input.val()){ 
			var hash = getCurrentValsHash(input);
			if(hash == null || hash[input.val()] != true){
				addText(opt,input, input.val(), opt.name);
				processChange(input,opt);
		}
	  }

      active && input.trigger("activate.autobox", [$.data(active[0], "originalObject")]);
      $("body").trigger("off.autobox");
    });

    $("body").one("off.autobox", function(e, reset){
      container.remove();
      $.data(document.body, "autoboxMode", false);
      input.unbind("keydown.autobox");
      $("body").add(window).unbind("click.autobox").unbind("cancel.autobox").unbind("activate.autobox");
    });

    // If a click bubbles all the way up to the window, close the autobox
    $(window).bind("click.autobox", function(){
      $("body").trigger("cancel.autobox");
    });

    function select(){
      active=$("> *", container).removeClass("active").slice(selected, selected + 1).addClass("active");
      input.trigger("itemSelected.autobox", [$.data(active[0], "originalObject")]);
      input.val(opt.insertText($.data(active[0], "originalObject")));
    };

    container.mouseover(function(e){
      // If you hover over the container, but not its children, return
      if(e.target == container[0]) return;
      // Set the selected item to the item hovered over and make it active
      selected=$("> *", container).index($(e.target).is('li') ? $(e.target)[0] : $(e.target).parents('li')[0]);
      select();
    }).bind("click.autobox", function(e){
      $("body").trigger("activate.autobox");
      $.data(document.body, "suppressKey", false);
    });

    input
      .bind("keydown.autobox", function(e){
        var k=e.which || e.keyCode;
        if(k == KEY.ESC){ $("body").trigger("cancel.autobox"); }
        else if(k == KEY.RETURN){ $("body").trigger("activate.autobox"); e.preventDefault(); }
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

  $.fn.autobox=function(opt){

    opt=$.extend({}, {
      timeout: 500,
      getList: function(input, hash){
          var list=opt.list;
          if(hash){ list=$(list).filter(function(){  return !hash[this.text]; }); }
          input.trigger("updateList", [list]);
      },
      template: function(str){ return "<li>" + opt.insertText(str) + "</li>"; },
      insertText: function(str){ return str; },
      match: function(typed){ return this.match(new RegExp(typed)); },
      wrapper: '<ul class="autobox-list"></ul>',

      resizable: {}
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
      var input=$('<input type="text"></input>')
      input
        .keydown(function(e){
          preventTabInAutocompleteMode(e);
        })
        .keyup(function(e){
          var k=e.which || e.keyCode;
          if(!$.data(document.body, "autoboxMode") &&
              (k == KEY.UP || k == KEY.DOWN)){
            clearTypingTimeout(this);
            startTypingTimeout(e, this, 0);
          }
          else{
            preventTabInAutocompleteMode(e);
          }
        })
        .keypress(function(e){
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
			
				var hash = getCurrentValsHash(input);
				if(hash == null || hash[input.val()] != true){
					if(opt.checkValue == false){
						addText(opt,input, input.val(), opt.name);
						processChange(input,opt)
					}
					else{
						opt.valueMatched = false;
						$(opt.list).filter(function(){
							opt.valueMatched = this.text == input.val() ? true : opt.valueMatched;
						});
						if(opt.checkValue == true && opt.valueMatched){
							addText(opt,input, input.val(), opt.name);
							processChange(input,opt)
						}
						else
							addText(opt,input, "", opt.name);
					}	
				}else
					addText(opt,input, "", opt.name);
			}
            e.preventDefault();
          }
          else if(k == KEY.BS || k == KEY.DEL || k > 32){ // more than ESC and RETURN and the like
            startTypingTimeout(e, this, opt.timeout);
          }
        })
        .bind("autobox", function(){
          var self=$(this);

          self.one("updateList", function(e, list){//clear/update/redraw list
			//opt.valueMatched = false;
            list=$(list)
              .filter(function(){ 
				//opt.valueMatched = this.text == self.val() ? true : opt.valueMatched;
				return  opt.match.call(this, self.val()); 
				})
              .map(function(){
                var node=$(opt.template(this))[0];
                $.data(node, "originalObject", this);
                return node;
              });

            $("body").trigger("off.autobox");

            if(!list.length) return false;

            var container=list.wrapAll(opt.wrapper).parents(":last").children();
            // IE seems to wrap the wrapper in a random div wrapper so
            // drill down to the node in opt.wrapper.
            var wrapper_tagName=$(opt.wrapper)[0].tagName;
            for(;container[0].tagName !== wrapper_tagName; container=container.children(':first')){}

            var offset=self.offset();
            opt.container=container
              .css({top: offset.top + self.outerHeight(), left: offset.left, width: self.width()})
              .appendTo("body");

            $("body").autoboxMode(opt.multiSellection,container, self, list.length, opt);
          });

          opt.getList(self, getCurrentValsHash(self));
        });
        return input;
    }
    function createHolder(self){
      var input=createInput();
	  var holder;
	  if(opt.multiSellection == true){
      holder=$('<ul class="autobox-hldr"></ul>')
        .append($('<li class="autobox-input"></li>')
        .append(input));
		self.append(holder);
		$.fn.resizableTextbox(input, $.extend(opt.resizable, { min: input.attr('offsetWidth'), max: holder.width() }));
	  }
	  else
		 self.append(input);
		 
	  return holder;
    }

    return this.each(function(){
      var self=$(this);
      createHolder(self);
	  opt.name=opt.parent.name;
    });
  };

})(jQuery);
