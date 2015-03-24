define(["cdf/lib/jquery"], function($){
  var myModule = {
    string: "TEST"
  };

  myModule.getString = function() {
    return this.string;
  };
  
  myModule.writeOnElement = function(selector, text) {
      var element = $(selector);
      if(element && element.length > 0 ) {
          element.text(text);
      } else {
          if(console) {
            console.log("Selector " + selector + " wielded no results");  
          }
      }
  };

  return myModule;
});
