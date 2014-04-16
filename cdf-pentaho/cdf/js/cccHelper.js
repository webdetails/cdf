wd = wd || {};
wd.helpers = wd.helpers || {};

wd.helpers.cccHelper = {
    getCccScriptPath: function(scriptName){
    	/* Dashboards.context.file.split('.')[0] + "_" + */ 
        // TODO: This prevents deprecating the generation of 2 file names in CDE/CGG
        return ("/" + Dashboards.context.solution + "/" + Dashboards.context.path + "/" + scriptName + ".js").replace(/\/+/g, '/');
    }
}