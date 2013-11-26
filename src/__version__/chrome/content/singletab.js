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
    this.debug("bind");
		window.setTimeout(function() { singleTab._handleLoad(window); }, 500);		
	},
	
	unbind : function (window) {
    this.debug("unbind");
		var document = window.document;
	
    // unbind gBrowser  event
    var gBrowser = document.getElementById('content');

    this._restoreOriginalFunctions(window, gBrowser);
	
	},

  /**
  * The delayed load handler for the windows
  */
	_handleLoad: function (window) {
    this.debug("_handleLoad");
		var document = window.document;

		// bind window event
		//window.addEventListener('some-window-event', singleTab._handleWindowEvent, false); 

		// bind gBrowser event
		var gBrowser = document.getElementById('content');
		//gBrowser.addEventListener('DOMContentLoaded', singleTab._handleDOMContentLoaded, false);
    
    this.overrideHandleLinkClick(window);
    //this.overrideOpenLink(window);
    //this.overrideOpenLinkInTab(window);
    this.overrideAddTab(gBrowser);
    this.overrideOpenDialog(window, gBrowser);
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

  _switchToTab: function(aUri) {
    var tab = this.xulUtils.findTabForURI(aUri);
    if(tab) {
      singleTab.selectTab(tab);
      return true;
    }
    
    return false;
  },

  // Most of the functions us AddTab to open a new tab, e.g. bookmarks or histroy items
  // Open in New Tab
  overrideAddTab : function (gBrowser) {
    gBrowser.addTabCopyBySingleTab = gBrowser.addTab;

    gBrowser.addTab = function( aURI,
                                aReferrerURI,
                                aCharset,
                                aPostData,
                                aOwner,
                                aAllowThirdPartyFixup) {

      var tab = singleTab.findTabForHref(aURI);
      singleTab.debug("gBrowser.addTab: " + tab + " " + aURI);

      if(tab) {
        singleTab.selectTab(tab);
        return tab;
      }

      return gBrowser.addTabCopyBySingleTab.apply(this, arguments);
    }
  },

  overrideOpenDialog : function (window, gBrowser) {
    singleTab.debug("overriding window.overrideOpenDialog");

    window.openLinkInCopyBySingleTab = window.openLinkIn;
    window.openLinkIn = function(url, where) {
        if (where == "window") {
          var tab = singleTab.findTabForHref( url );
          singleTab.debug("window.openLinkInCopyBySingleTab: " + tab + " " + url);

          if(tab) {
            singleTab.selectTab(tab);
            return tab.ownerDocument.defaultView;
          }
        }

        return window.openLinkInCopyBySingleTab.apply(this, arguments);
      };
  },

  // this is for links clicked
  overrideHandleLinkClick : function(win) {
    
    win.handleLinkClickOriginal = win.handleLinkClick;
    
    win.handleLinkClick = function handleLinkClick(event, href, linkNode) {
    
      if (event.button == 0 || event.button == 1) {
        var aUri = singleTab.chromeUtils.makeURI(href)
        var success = singleTab._switchToTab(aUri);
        singleTab.debug("handleLinkClick: " + success);
        if(success) {
          event.preventDefault();
          return true;
        }
      }
      return win.handleLinkClickOriginal.apply(this, arguments);
    };

  },
  
  /*
  // right-click "open link in new tab"
  overrideOpenLinkInTab : function(win) {    
    //singleTab.debug("setting custom openLinkInTab: " + win.nsContextMenu.prototype.openLinkInTab);
    win.nsContextMenu.prototype.openLinkInTabOriginal = win.nsContextMenu.prototype.openLinkInTab;

    win.nsContextMenu.prototype.openLinkInTab = function() {
      var success = singleTab._switchToTab(this.linkURI);
      if(!success) {
        win.nsContextMenu.prototype.openLinkInTabOriginal.apply(this, arguments);
      }
    };
  },
    
  // right-click "open link in new window"
  overrideOpenLink : function(win) {

    win.nsContextMenu.prototype.openLinkOriginal = win.nsContextMenu.prototype.openLink;

    win.nsContextMenu.prototype.openLink = function() {
      singleTab.debug("overridden openLink...");
      var success = singleTab._switchToTab(this.linkURI);
      if(!success) {
        win.nsContextMenu.prototype.openLinkOriginal.apply(this, arguments);
      }
    };
  },
  */

  _restoreOriginalFunctions: function(win, gBrowser) {
    win.handleLinkClick = win.handleLinkClickOriginal;
    win.handleLinkClickOriginal = null;
    
    /*
    win.nsContextMenu.prototype.openLink = win.nsContextMenu.prototype.openLinkOriginal;
    win.nsContextMenu.prototype.openLinkOriginal = null;
    
    singleTab.debug("restoring openLinkInTab: " + win.nsContextMenu.prototype.openLinkInTabOriginal);
    win.nsContextMenu.prototype.openLinkInTab = win.nsContextMenu.prototype.openLinkInTabOriginal;
    win.nsContextMenu.prototype.openLinkInTabOriginal = null;
    */


    gBrowser.addTab = gBrowser.addTabCopyBySingleTab;
    gBrowser.addTabCopyBySingleTab = null;

    win.openLinkIn = win.openLinkInCopyBySingleTab;
    win.openLinkInCopyBySingleTab = null;

  },

  selectTab: function(tab) {
    var win = tab.ownerDocument.defaultView;
    // focus tab and containing window
    win.getBrowser().selectedTab = tab;

    if(win != this.xulUtils.getWindow()) {
      win.setTimeout(function(){win.focus();}, 50); //async because sync doesn't work all the time
    }
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