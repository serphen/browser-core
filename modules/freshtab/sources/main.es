const { classes: Cc, interfaces: Ci, utils: Cu, manager: Cm } = Components;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');
Cu.import("resource://gre/modules/Services.jsm");
Cu.import('chrome://cliqzmodules/content/CliqzUtils.jsm');
Cu.import('chrome://cliqzmodules/content/CliqzABTests.jsm');

var CLIQZ_NEW_TAB = "about:cliqz",
    CLIQZ_NEW_TAB_URL = "chrome://cliqz/content/fresh-tab-frontend/index.html",
    DEF_HOMEPAGE = "browser.startup.homepage",
    DEF_NEWTAB = "browser.newtab.url",
    DEF_STARTUP = "browser.startup.page",
    CLIQZ_STARTUP_PREF = 1, //http://kb.mozillazine.org/Browser.startup.page
    BAK_HOMEPAGE = "backup.homepage",
    BAK_NEWTAB = "backup.newtab",
    BAK_STARTUP = "backup.startup",
    FRESH_TAB_AB = "freshTabAB", // true = AB test active
    FRESH_TAB_STATE = "freshTabState", // true = active
    FRESH_TAB_BACKUP_DONE = "freshTabBackupDone", // true = active
    OLD_FRESH_TAB = "freshtabdone",
    HAS_BUTTON = true,
    FF41_OR_ABOVE = false;

try{
  var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
      .getService(Components.interfaces.nsIXULAppInfo);
  var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"]
      .getService(Components.interfaces.nsIVersionComparator);

  if(versionChecker.compare(appInfo.version, "41.0") >= 0){
    FF41_OR_ABOVE = true;
    if(versionChecker.compare(appInfo.version, "44.0") < 0){
      Cu.import("resource:///modules/NewTabURL.jsm");
    } else {
      const aboutNewTabService = Cc['@mozilla.org/browser/aboutnewtab-service;1'].getService(Ci.nsIAboutNewTabService);
    }
  }
} catch(e){}


Cm.QueryInterface(Ci.nsIComponentRegistrar);
function AboutURL() {}
var AboutURLFactory;

var FreshTab = {
    signalType: "home",
    initialized: false,
    cliqzOnboarding: 0,
    isBrowser: false,

    startup: function(abTest, hasButton, cliqzOnboarding, channel){
        var disable = false;

        //show cliqz onboarding on 1st installation of browser
        if(cliqzOnboarding && !CliqzUtils.hasPref('session')) {
          FreshTab.cliqzOnboarding = 1;
        }

        HAS_BUTTON = hasButton;

        FreshTab.isBrowser = channel === "40";

        // exit if not in the AB test
        if(abTest && (!CliqzUtils.hasPref(FRESH_TAB_AB) || CliqzUtils.getPref(FRESH_TAB_AB) == false)) disable = true;

        // disable the AB test if the user doesnt have FF41 or above
        if(!FF41_OR_ABOVE){
          CliqzABTests.disable("1056_B");
          CliqzABTests.disable("1065_B");
          disable = true;
        }

        if(disable){
          //in case 'about:cliqz' remained set as default homepage - reset it
          if(CliqzUtils.getPref(DEF_HOMEPAGE, null, '') == CLIQZ_NEW_TAB){
            //in case we did a backup - use it
            if(CliqzUtils.hasPref(BAK_HOMEPAGE)){
              CliqzUtils.setPref(DEF_HOMEPAGE, CliqzUtils.getPref(BAK_HOMEPAGE), '');
            } else {
              //otherwise simply reset
              CliqzUtils.clearPref(DEF_HOMEPAGE, '');
            }
          }
          return;
        }

        // first start
        if(HAS_BUTTON && !CliqzUtils.hasPref(FRESH_TAB_STATE)){
          CliqzUtils.setPref(FRESH_TAB_STATE,  false); //opt-in
        }
        AboutURL.prototype = {
            QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule]),
            classDescription: CLIQZ_NEW_TAB,
            classID: Components.ID("{D5889F72-0F01-4aee-9B88-FEACC5038C34}"),
            contractID: "@mozilla.org/network/protocol/about;1?what=cliqz",

            newChannel: function(uri) {
                var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
                var html =  ["data:text/html,<!DOCTYPE html><html><head><meta charset=\"UTF-8\">",
                            "<style>* {margin:0;padding:0;width:100%;height:100%;overflow:hidden;border: 0}</style>",
                            "</head><body><iframe src=\"" + CLIQZ_NEW_TAB_URL + "?cliqzOnboarding=" + FreshTab.cliqzOnboarding + "\"></iframe></body></html>"].join('')

                var securityManager = Cc["@mozilla.org/scriptsecuritymanager;1"].getService(Ci.nsIScriptSecurityManager);
                var channel = ioService.newChannel(html, null, null);
                channel.originalURI = uri;
                channel.owner = securityManager.getSystemPrincipal();

                return channel;
            },

            getURIFlags: function(uri) { return Ci.nsIAboutModule.ALLOW_SCRIPT; }
        }

        AboutURLFactory = XPCOMUtils.generateNSGetFactory([AboutURL])(AboutURL.prototype.classID);

        Cm.registerFactory(
            AboutURL.prototype.classID,
            AboutURL.prototype.classDescription,
            AboutURL.prototype.contractID,
            AboutURLFactory
        );

        // reset preferences in case of inconsistency
        if(CliqzUtils.hasPref(OLD_FRESH_TAB) || //  old FreshTab settings
           (CliqzUtils.hasPref(BAK_HOMEPAGE) && CliqzUtils.getPref(BAK_HOMEPAGE) == CLIQZ_NEW_TAB)  // inconsistency
          ){

          CliqzUtils.clearPref(OLD_FRESH_TAB);
          CliqzUtils.clearPref(DEF_HOMEPAGE, '');
          CliqzUtils.clearPref(DEF_NEWTAB, '');
          CliqzUtils.clearPref(DEF_STARTUP, '');
          CliqzUtils.clearPref(BAK_HOMEPAGE);
          CliqzUtils.clearPref(BAK_NEWTAB);
          CliqzUtils.clearPref(BAK_STARTUP);
          CliqzUtils.clearPref(FRESH_TAB_BACKUP_DONE);
        }

        FreshTab.updateState();
        FreshTab.initialized = true;
    },

    shutdown: function(){
        if(!FreshTab.initialized) return;

        Cm.unregisterFactory(AboutURL.prototype.classID, AboutURLFactory);

        deactivate();
    },
    toggleState: function(){
      CliqzUtils.setPref(FRESH_TAB_STATE, !CliqzUtils.getPref(FRESH_TAB_STATE));
      FreshTab.updateState();
    },
    updateState: function(){
      if(isActive()){
        activate();
      } else {
        deactivate();
      }
    }
}

function isActive(){
  //always active if the user doesn't have the activator button
  return !HAS_BUTTON || CliqzUtils.getPref(FRESH_TAB_STATE);
}

function activate(){
  // save the backup state only once
  var firstStart = false;
  if(!CliqzUtils.hasPref(FRESH_TAB_BACKUP_DONE)){
    CliqzUtils.setPref(FRESH_TAB_BACKUP_DONE, true);
    firstStart = true
  }

  if(FF41_OR_ABOVE){
      // newtab.url needs to be changed in the browser itself in FF 41
      // https://dxr.mozilla.org/mozilla-central/source/browser/modules/NewTabURL.jsm
      if(firstStart){
        CliqzUtils.setPref(BAK_STARTUP, CliqzUtils.getPref(DEF_STARTUP, null, ''));
        CliqzUtils.setPref(DEF_STARTUP, CLIQZ_STARTUP_PREF, ''); // set the startup page to be the homepage
      }

      if(versionChecker.compare(appInfo.version, "44.0") < 0){
        NewTabURL.override(CLIQZ_NEW_TAB);
      } else {
        const aboutNewTabService = Cc['@mozilla.org/browser/aboutnewtab-service;1'].getService(Ci.nsIAboutNewTabService);
        aboutNewTabService.newTabURL = CLIQZ_NEW_TAB;
      }
  } else { //FF 40 or older
      if(firstStart) CliqzUtils.setPref(BAK_NEWTAB, CliqzUtils.getPref(DEF_NEWTAB, null, ''));
      CliqzUtils.setPref(DEF_NEWTAB, CLIQZ_NEW_TAB, '');
  }

  if(firstStart){
    CliqzUtils.setPref(BAK_HOMEPAGE, CliqzUtils.getPref(DEF_HOMEPAGE, null, ''));
    CliqzUtils.setPref(DEF_HOMEPAGE, CLIQZ_NEW_TAB, '');
  }
}

function deactivate(){
  if(!CliqzUtils.hasPref(FRESH_TAB_BACKUP_DONE)) return;

  CliqzUtils.setPref(DEF_HOMEPAGE, CliqzUtils.getPref(BAK_HOMEPAGE), '');
  if(FF41_OR_ABOVE){ // FF41+
      if(versionChecker.compare(appInfo.version, "44.0") < 0){
        NewTabURL.reset();
      } else {
        const aboutNewTabService = Cc['@mozilla.org/browser/aboutnewtab-service;1'].getService(Ci.nsIAboutNewTabService);
        aboutNewTabService.resetNewTabURL();
      }

      if(CliqzUtils.getPref(DEF_STARTUP, '', '') == CLIQZ_STARTUP_PREF){
        // reset the startup page if the user didnt change it
        CliqzUtils.setPref(DEF_STARTUP, CliqzUtils.getPref(BAK_STARTUP), '');
      }
  }
  else {//FF40 and older
      CLiqzUtils.setPref(DEF_NEWTAB, CliqzUtils.getPref(BAK_NEWTAB), '');
  }
}

export default FreshTab;