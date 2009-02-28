var evaluateCode = function(cleanComponents){
	// Clean dashboard components or else they would be added
	if (cleanComponents){
		Dashboards.components = [];
	}
	try{
		eval($('#samplecode').val());
	}
	catch(e){
		alert("Error: " + e);
		return;
	}
	tabs.tabs("select",0);
};
