wd = wd || {};
wd.helpers = wd.helpers || {};

wd.helpers.cccHelper = {
    getCccScriptPath: function(scriptName){
    	// Dasboards.context path example:
        // "/public/cde/mine/MySampleDash.wcdf"
        // Remove the last segment.
        // TODO: Using the script name without the dashboard name prefix, for backward compatibility.
        return Dashboards.context.path.replace(/[^\/]+$/, "") + scriptName + ".js";
    }
}