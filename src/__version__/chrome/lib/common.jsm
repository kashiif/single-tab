'use strict';
var EXPORTED_SYMBOLS = ['_prefManager', 'utils', 'xulUtils', 'chromeUtils', 'logger', 'unloadCommonJsm'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

// @ifdef PrefManager
Cu.import('resource://single-tab/__version__/chrome/lib/prefmanager.jsm');

PrefManager.init('extensions.singletab.', 'resource://single-tab/__version__/defaults/preferences/defaults.js');

var _prefManager = PrefManager;
// @endif

var unloadCommonJsm = function() {
// @ifdef PrefManager
  Cu.unload('resource://single-tab/__version__/chrome/lib/prefmanager.jsm');  
// @endif
};



function _getDir(dirType) {
    var dirService = Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties);
    var file = dirService.get(dirType, Ci.nsIFile);
  return file;
}

var chromeUtils = {
    getProfileDir: function() {
        // get profile directory  
        return _getDir('ProfD');
    },

    getUserHomeDir: function() {
        // get user's home directory (for example, /home/username).  
        return _getDir('Home');
    },

    getFileObjectFromPath: function(path) {
        var file = Cc['@mozilla.org/file/local;1'].getService(Ci.nsIFile);
        file.initWithPath(path);
        
        return file;
    },

    getPrefService: function(key) {
        var prefService = null;
        try 
        {
            prefService = gPrefService;
        }
        catch(err)
        {
            // gPrefService not available in SeaMonkey
            prefService = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService);
        }
        
        prefService = prefService.getBranch(key);
        return prefService;
    },
  
  getFuelApplicationService: function() {
    return Cc["@mozilla.org/fuel/application;1"].getService(Ci.fuelIApplication);
  },
  
  makeURI: function(aURL, aOriginCharset, aBaseURI) {
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
    return ioService.newURI(aURL, aOriginCharset, aBaseURI);
  },

};

var gConsoleService = null;

var logger = {

    init: function() {
        gConsoleService = Cc['@mozilla.org/consoleservice;1'].
                          getService(Ci.nsIConsoleService);
    },

    log: function(msg) {
        if (!gConsoleService) return;
        gConsoleService.logStringMessage(msg);
    },
  
    debug: function(msg) {
        if (!gConsoleService) return;
        gConsoleService.logStringMessage(msg);
    },
};

var utils = {
    _handleStartup: function (url) {
        /*
        var oldVersion = '__version__';
        var currVersion = '__version__';
        
        try {
            oldVersion = this._prefService.getCharPref('version');
        }
        catch(e) {}
        
        if (oldVersion != currVersion) {
            this._prefService.setCharPref('version', currVersion);
            try {
                setTimeout(function() { 
                    try {
                        openUILinkIn( url, 'tab');
                    } 
                    catch(e) {}
                ;},100);
            }
            catch(e) {}
        }
        */
    },

  getNewLineChar: function() {
  
        var platformStr =  Cc['@mozilla.org/network/protocol;1?name=http']
                          .getService(Ci.nsIHttpProtocolHandler).oscpu.toLowerCase();

        if (platformStr.indexOf('win') != -1) {
          return '\r\n';
        }
        else if (platformStr.indexOf('mac') != -1) {
          return '\r';
        }
        else if (platformStr.indexOf('unix') != -1
                    || platformStr.indexOf('linux') != -1
                    || platformStr.indexOf('sun') != -1) {
          return '\n';
        }  
        return '\n';
  },

    writeDataToFile: function(content, file, fptr, append) {
        /*******************************************************************************
        Writes data to file asynchronously.
        Parameters:
          content - string to be written to file
          file - nsIFile instance to which string would be written
          fptr - function that would be invoked after write operation
          append - [optional] append to file if exists
        *******************************************************************************/
        
        Cu.import('resource://gre/modules/NetUtil.jsm');    
        Cu.import('resource://gre/modules/FileUtils.jsm'); 

    /*
    var flags = -1; //open the file in default mode
    if (append === true && file.exists()) {
      flags = PR_Open_Flags.PR_WRONLY | PR_Open_Flags.0x08 | PR_Open_Flags.0x10;
    }
    var ostream = Cc["@mozilla.org/network/file-output-stream;1"].
      createInstance(Ci.nsIFileOutputStream);
    ostream.init(file,  //instance of nsIFile,
                 flags, //long ioFlags. -1 to open the file in default mode (PR_WRONLY | PR_CREATE_FILE | PR_TRUNCATE)
                 -1,    // long permission File mode bits. -1 for the default permissions (0664) will be used.
                 1);    // long behaviorFlags

    */
    
    // Bug in openSafeFileOutputStream implementation that ignores append flag
        var flags = FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_TRUNCATE;
    if (append === true && file.exists()) {
      flags = FileUtils.MODE_WRONLY | FileUtils.MODE_APPEND;
    }
    var ostream = FileUtils.openFileOutputStream(file, flags);  
          
        var converter = Cc['@mozilla.org/intl/scriptableunicodeconverter']
                            .createInstance(Ci.nsIScriptableUnicodeConverter); 
        converter.charset = 'UTF-8';  
        var istream = converter.convertToInputStream(content);  
        
        // The last argument (the callback) is optional.  
        NetUtil.asyncCopy(istream, ostream, fptr);  
    },

    readStream: function(inputStream) {
        // The file data is contained within inputStream.
        // You can read it into a string with
        var data = '';
        
        var converterStream = null;
        const BUFFER_SIZE = 1024;
        converterStream = Cc['@mozilla.org/intl/converter-input-stream;1']  
                           .createInstance(Ci.nsIConverterInputStream);  
        converterStream.init(inputStream, 'UTF-8', BUFFER_SIZE, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

        var input = {};
        var numChars = 0;
        // read all "bytes" (not characters) into the input
        try {
            do {
                numChars = converterStream.readString(BUFFER_SIZE, input);  
                data += input.value;
            } while(numChars == BUFFER_SIZE);
        }
        finally {
            if (converterStream) {
                try { converterStream.close(); }
                catch(ex) {}
            }
        }
        return data;
    },

    getPropsAsString: function(objects, propName) {
        var ids = [o[propName] for each(o in objects)];
        return ids.join(',');
    },

  getItemsFromPropsString: function(propValues, objects, pkPropName, returnPropName) {
      /*
      * Returns an array of propValues/Objects where the value object.pkPropname is found in propValues
      *
      * propValues - array of property values
      * objects - array of objects
      * pkPropName - the property name which will be looked-up in propValues
      * returnPropName - the property name that would be returned on every object
      */

      var items = [];

      var f = null;

      if (returnPropName) f = function(o) { return o[returnPropName]; };
      else f = function(o) { return o; }; 


      for (var i=0 ; i<objects.length; i++) {
          var o = objects[i];

          var index = propValues.indexOf(o[pkPropName]);
          if (index != -1) {
                  items.push(f(o));
          }
      }
      return items;
  },

  UI : {
        validateControls: function(controls) {
            var o = {ctrl: null, msg: '' };

            for each(var ctrl in controls) {
                var result = this.validateControl(ctrl);

                if (result) {
                    o.ctrl = ctrl;
                    o.msg = result;
                    break;
                }
            }

            return o;
        },

        validateControl: function(ctrl) {
            if (ctrl.hasAttribute('data-required') && ctrl.getAttribute('data-required') == 'true') {
                if (ctrl.value.trim().length == 0) {
                    return 'Empty value is not allowed.';
                }
            }

            if (ctrl.hasAttribute('data-validation-regex')) {
                var re = new RegExp(ctrl.getAttribute('data-validation-regex'));

                var value = ctrl.value.trim();

                if (!re.test(value)) {
                    return '\'' + value + '\' is invalid.';
                }
            }

            return '';

        },

  },
};

var xulUtils = {
  /*****************************************************
  * Returns the most recent browser window
  *****************************************************/
  
  getWindow: function() {
    return Cc['@mozilla.org/appshell/window-mediator;1']
              .getService(Ci.nsIWindowMediator)
              .getMostRecentWindow('navigator:browser');
  },
  
  findTabForURI: function(linkURI, ignorePound) {
    var tab, tabURI, browser;
    
    var browserEnumerator = Cc['@mozilla.org/appshell/window-mediator;1']
                        .getService(Ci.nsIWindowMediator)
                        .getEnumerator('navigator:browser');

    while(browserEnumerator.hasMoreElements()) {

      try {
        browser = browserEnumerator.getNext().gBrowser;
        for(var j = 0; browser && j < browser.mTabs.length; j++) {
          tab = browser.mTabs[j],
          tabURI = tab.linkedBrowser.currentURI;
          
          //Cu.reportError("checking " + (tabURI == linkURI)  + " " + tabURI );
          //TODO: see if there is a pound symbol
          if(tabURI) {
            if (tabURI.spec == linkURI.spec) {
              return tab;
            }
          }
        }
      } catch(e) {
        Cu.reportError(e);
      }
    }
    return null;
  },


};



// Add functions to any imported module that are needed in both extension module and options module
/*
utils.commonFunction1 = function() {
};

utils.commonFunction2 = function() {
};
*/
