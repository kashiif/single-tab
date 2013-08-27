'use strict;'
var singleTabOptions = {
	_consoleService: null,
	
	log : function (message) {
	},

	handleLoad: function (evt) {
    window.removeEventListener("load", singleTabOptions.handleLoad);
    window.setTimeout(function() {
        singleTabOptions.init();
      }, 200);		
	},

	init: function() {

		// __debug__ // /* 
		this._consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
		this.log = function (message) {
			this._consoleService.logStringMessage('singleTab: ' + message);
		}
		// __debug__ // */
	},



};

window.addEventListener("load", singleTabOptions.handleLoad, false);
