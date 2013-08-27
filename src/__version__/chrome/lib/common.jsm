'use strict';
var EXPORTED_SYMBOLS = ['_prefManager', 'utils', 'xulUtils', 'domUtils', 'chromeUtils', 'dateUtils', 'logger', 'unloadCommonJsm'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var scope = this;

Cu.import('resource://single-tab/__version__/chrome/lib/kashiif-shared.jsm');
Cu.import('resource://single-tab/__version__/chrome/lib/prefmanager.jsm');

PrefManager.init('extensions.singletab.', 'resource://single-tab/__version__/defaults/preferences/defaults.js');

var _prefManager = PrefManager;

var unloadCommonJsm = function() {
  Cu.unload('resource://single-tab/__version__/chrome/lib/kashiif-shared.jsm');
  Cu.unload('resource://single-tab/__version__/chrome/lib/prefmanager.jsm');  
};


// Add functions to any imported module that are needed in both extension module and options module
utils.commonFunction1 = function() {
};

utils.commonFunction2 = function() {
};

