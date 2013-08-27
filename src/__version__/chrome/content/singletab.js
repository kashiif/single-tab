'use strict;'

/*********************************************************************************
//<!-- build:include author-info -->
//<!-- endbuild -->
*********************************************************************************/

var EXPORTED_SYMBOLS = ['singleTab'];
/*************************************************************************************
* The core module for Single Tab.
* Workflow:
*   bootstrap.startup() --------------------------------> singleTab.init()
*                       ---(for all existing windows)---> singleTab.bind()
*         window.load() --------------------------------> singleTab.bind()
*         window.unload() ------------------------------> singleTab.unbind()
*   bootstrap.shutdown() -------------------------------> singleTab.uninit()
**************************************************************************************/

var singleTab = {
	_consoleService: null,

  /**
  * Initialization function of extension core module. Called once at the start-up/extension activation/extension upgrade
  */
	init: function() {
    this.debug('init called.');

    Components.utils.import('resource://single-tab/__version__/chrome/lib/common.jsm', this);

    // TODO: _consoleService is nor more needed when kashiif-shared.jsm/common.jsm is imported
		// __debug__ // /* 
    // The code block between __debug__ will be removed by build script
		this._consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
		this.log = function (message) {
			this._consoleService.logStringMessage('singleTab: ' + message);
		}
		this.debug = function (message) {
			this._consoleService.logStringMessage('singleTab: ' + message);
		}
		// __debug__ // */

    this._prefManager.watch(this.handlePrefChanged);
    this.debug('init complete');
  },

  /**
  * destructor function of extension core module. Called once at the extension deactivation
  */
	uninit: function() {
    this.debug('Uninit called. Extension is either disabled or uninstalled.');

    // unloadCommonJsm comes from common.jsm module
    this.unloadCommonJsm();

    // unload whatever we loaded
    Components.utils.unload('resource://single-tab/__version__/chrome/lib/common.jsm');
  },

	bind: function (window) {
		window.setTimeout(function() { singleTab._handleLoad(window); }, 500);		
	},
	
	unbind : function (window) {
		var document = window.document;
	
		// unbind gBrowser  event
		var gBrowser = document.getElementById('content');
	
	
	},

  /**
  * The delayed load handler for the windows
  */
	_handleLoad: function (window) {
		var document = window.document;

		// bind window event
		//window.addEventListener('some-window-event', singleTab._handleWindowEvent, false); 

		// bind gBrowser event
		var gBrowser = document.getElementById('content');
		//gBrowser.addEventListener('DOMContentLoaded', singleTab._handleDOMContentLoaded, false);
    
    this.overrideHandleLinkClick(window);
    
		
	},

  handlePrefChanged: function(prefName, newValue) {
  },
	
	log : function (message) {
	},

	debug : function (message) {
	},

  /****************************************** Overrides ****************************************/
	/*********************************************************************************************/
  findTabForHref: function(href) {
    var uri = this.chromeUtils.makeURI(href);
    return this.xulUtils.findTabForURI(uri);
  },  
  
  // this is for links clicked
  overrideHandleLinkClick : function(win) {
    
    var origHandleLinkClick = win.handleLinkClick;
    
    win.handleLinkClick = function handleLinkClick(event, href, linkNode) {
    
      if (event.button == 0 || event.button == 1) {
        
        var tab = singleTab.findTabForHref(href);
        singleTab.debug("tab for " + href + ": " + tab);
        if(tab) {
          singleTab.debug("Intercepted in handleLinkClick...");
          selectTab(tab);
          return true;
        }
      }
      return origHandleLinkClick.apply(this, arguments);
    };

  },

  
  
	/*********************************** Code Stubs **********************************************/
	/*********************************************************************************************/


	/*********************************** Context Menu **********************************************/

	_addMenuItemToContentContextMenu: function(document) {
		var mnuItem = document.createElement('menuitem');
    mnuItem.setAttribute('id', 'singleTab-content-context');
    mnuItem.setAttribute('class','menuitem-iconic');
    mnuItem.setAttribute('label', 'Single Tab');
    mnuItem.setAttribute('image','chrome://single-tab/skin/default/icon16.png');
    mnuItem.addEventListener('command', this._handleContextMenuClick);

    var cm = document.getElementById('contentAreaContextMenu');
    cm.appendChild(mnuItem);

		cm.addEventListener('popupshowing', this._handleContentContextMenuShowing);

	},

	_removeMenuItem: function(document) {
		// remove menu item and event handlers
    var cm = document.getElementById('contentAreaContextMenu');

    var mnuItem =  document.getElementById('singleTab-content-context')
    mnuItem.removeEventListener('command', this._handleContextMenuClick);

    cm.removeChild(mnuItem);

		cm.removeEventListener('popupshowing', this._handleContentContextMenuShowing);
	},

	_handleContextMenuClick: function(evt) {

	},

	_handleContentContextMenuShowing: function(evt) {
		if (evt.target.id != 'contentAreaContextMenu') return;
		var document = evt.target.ownerDocument;
		
		// enable / disable context menu here
		var mnuItm = document.getElementById('singleTab-content-context');
		mnuItm.collapsed = false;
	},

};