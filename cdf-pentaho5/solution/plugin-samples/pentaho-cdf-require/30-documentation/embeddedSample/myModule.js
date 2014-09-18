define([], function(){
  var myModule = {
    string: "TEST"
  };

  myModule.getString = function() {
    return this.string;
  };

  return myModule;
});
