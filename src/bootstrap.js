"use strict;"
/*********************************************************************************
//<!-- build:include author-info -->
//<!-- endbuild -->
*********************************************************************************/

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');

var WindowListener = {
  setupBrowserUI: function(window) {
    // Notify the extension module of the new window
    singleTab.bind(window);
  },

  tearDownBrowserUI: function(window) {
    // Notify the extension module of the closing window
    singleTab.unbind(window);
  },

  // nsIWindowMediatorListener functions
  onOpenWindow: function(xulWindow) {
    // A new window has opened
    let domWindow = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                             .getInterface(Ci.nsIDOMWindowInternal);

    // Wait for it to finish loading
    domWindow.addEventListener('load', function listener() {
      domWindow.removeEventListener('load', listener, false);

      // If this is a browser window then setup its UI
      if (domWindow.document.documentElement.getAttribute('windowtype') == 'navigator:browser')
        WindowListener.setupBrowserUI(domWindow);
    }, false);
  },

  onCloseWindow: function(xulWindow) {
  },

  onWindowTitleChange: function(xulWindow, newTitle) {
  }
};

function install(data, reason) {
}

function uninstall(data, reason) {
}

function startup(data, reason) {

  // somebody decided that bootstrapped addons won't load default prefs.
  // crashes on 19.0.2
  /*
  Cc["@mozilla.org/preferences-service;1"]
    .getService(Ci.nsIPrefServiceInternal)
    .readExtensionPrefs(data.installPath);
  */  
  
  let resource = Services.io.getProtocolHandler('resource').QueryInterface(Ci.nsIResProtocolHandler);
  let alias = Services.io.newFileURI(data.installPath);
  if (!data.installPath.isDirectory())
    alias = Services.io.newURI('jar:' + alias.spec + '!/', null, null);
  resource.setSubstitution('single-tab', alias);

  Cu.import('resource://single-tab/__version__/chrome/content/singletab.js');
  Cu.import('resource://single-tab/__version__/chrome/lib/propertyfile.jsm');

  var propertyFile = new PropertyFile('chrome://single-tab/locale/singletab.properties');

  singleTab.init(propertyFile);

  let wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);

  // Get the list of browser windows already open
  let windows = wm.getEnumerator('navigator:browser');
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);

    WindowListener.setupBrowserUI(domWindow);
  }

  // Wait for any new browser windows to open
  wm.addListener(WindowListener);
}

function shutdown(data, reason) {
  // When the application is shutting down we normally don't have to clean
  // up any UI changes made
  if (reason == APP_SHUTDOWN)
    return;

    
  // Do the clean-up
  let wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);

  // Get the list of browser windows already open
  let windows = wm.getEnumerator('navigator:browser');
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    // Clean up browser UI
    WindowListener.tearDownBrowserUI(domWindow);
  }

  singleTab.uninit();

  // Unload all our modules that we imported!
  Cu.unload('resource://single-tab/__version__/chrome/content/singletab.js');
  Cu.unload('resource://single-tab/__version__/chrome/lib/propertyfile.jsm');

  // un-register resource protocol substitution
  let resource = Services.io.getProtocolHandler('resource').QueryInterface(Ci.nsIResProtocolHandler);
  resource.setSubstitution('single-tab', null);

  // Stop listening for any new browser windows to open
  wm.removeListener(WindowListener);
}