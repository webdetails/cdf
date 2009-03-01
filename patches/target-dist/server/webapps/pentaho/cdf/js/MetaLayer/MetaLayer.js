//
// Empty file to be used as a metalayer for the CDF. Completely optional, 
// but may be used to provide a cleaner separation between html and code
//
//


var MetaLayer ={

	getCurrentDate:function(){

		var currentDate=new Date();
		return MetaLayer.toDateString(currentDate);

	},

	getYesterdayDate:function(){

		var currentDate=new Date();
		currentDate.setDate(currentDate.getDate()-1);
		return MetaLayer.toDateString(currentDate);

	},

	getFirstDayOfYearDate:function(){

		var currentDate=new Date();
		return currentDate.getFullYear() + "-01-01";

	},
	
	getFirstDayOfLastMonth:function(){

		var currentDate=new Date();
		currentDate.setMonth(currentDate.getMonth() - 1);
		currentDate.setDate(1);
		return MetaLayer.toDateString(currentDate);

	},

	getLastDayOfLastMonth:function(){

		var currentDate=new Date();
		currentDate.setDate(0);
		return MetaLayer.toDateString(currentDate);

	},
	
	getLastMonthDate:function(){


		var currentDate=new Date();
		var prevDate = new Date(currentDate.getFullYear(),currentDate.getMonth(),currentDate.getDate()-30);
		var prevMonth = "0" + (prevDate.getMonth() + 1);
		var prevDay = "0" + (prevDate.getDate());

		var prevDateStr = prevDate.getFullYear() + "-" + (prevMonth.substring(prevMonth.length-2, prevMonth.length)) + "-" + (prevDay.substring(prevDay.length-2, prevDay.length));
		return prevDateStr;

	},

	toDateString: function(d){
		var currentMonth = "0" + (d.getMonth() + 1);
		var currentDay = "0" + (d.getDate());

		var dStr = d.getFullYear() + "-" + (currentMonth.substring(currentMonth.length-2, currentMonth.length)) + "-" + (currentDay.substring(currentDay.length-2, currentDay.length));
		return dStr;
	
	},
	
	getMonth:function(){

		var currentDate=new Date();
		var currentMonth = "0" + (currentDate.getMonth() + 1);
		var currentDateStr = currentDate.getFullYear() + "-" + (currentMonth.substring(currentMonth.length-2, currentMonth.length));
		return currentDateStr;

	},
	
	getMdxMonth:function(){
		var currentDate=new Date();
		var currentDateStr = "[Date].[" + currentDate.getFullYear() + "].[" + currentDate.getMonth() + "]";
		return currentDateStr;
	},
	
	getInitialMonth:function(){

		var c = new Date();
		c.setMonth(c.getMonth() - 1 );
		return c;

	},
	
	
	allValues: [["All","All"]]  // Used in the All checkboxes
};

jQuery.fn.check = function(mode) {
	// if mode is undefined, use 'on' as default
	var mode = mode || 'on';

	return this.each(function() {
			switch(mode) {
			case 'on':
				this.checked = true;
				break;
			case 'off':
				this.checked = false;
				break;
			case 'toggle':
				this.checked = !this.checked;
				break;
			}
		});
};
