import console from '../core/console';
import prefs from '../core/prefs';
import utils from '../core/utils';
import { promiseHttpHandler } from '../core/http';
import { Components, Services } from '../platform/globals';

// TODO: please just use Components
const {
  utils: Cu,
  interfaces: Ci,
  classes: Cc,
} = Components;

try {
  Cu.import('resource://gre/modules/XPCOMUtils.jsm');
  Cu.import('resource://gre/modules/NewTabUtils.jsm');
} catch(e) {}

var CLIQZEnvironment = {
    setTimeout,
    setInterval,
    clearTimeout,
    clearInterval,
    Promise,
    RESULTS_PROVIDER: 'https://api.cliqz.com/api/v2/results?nrh=1&q=',
    RICH_HEADER: 'https://api.cliqz.com/api/v2/rich-header?path=/v2/map',
    LOG: 'https://stats.cliqz.com',
    TEMPLATES_PATH: 'chrome://cliqz/content/static/templates/',
    SKIN_PATH: 'chrome://cliqz/content/static/skin/',
    prefs: Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch(''),
    RERANKERS: [],
    RESULTS_TIMEOUT: 1000, // 1 second
    TEMPLATES: {},
    MESSAGE_TEMPLATES: [],
    PARTIALS: [],
    CLIQZ_ONBOARDING: "about:onboarding",
    CLIQZ_ONBOARDING_URL: "chrome://cliqz/content/onboarding-v3/index.html",
    BASE_CONTENT_URL: "chrome://cliqz/content/",
    BROWSER_ONBOARDING_PREF: "browserOnboarding",

    init: function(){},

    unload: function() {},

    getAllCliqzPrefs: function() {
      return Cc['@mozilla.org/preferences-service;1']
             .getService(Ci.nsIPrefService)
             .getBranch('extensions.cliqz.')
             .getChildList('')
    },

    isUnknownTemplate: function(template){
      return template &&
        CLIQZEnvironment.TEMPLATES.hasOwnProperty(template) == false;
    },
    isDefaultBrowser: function(){
      try {
        var shell = Components.classes["@mozilla.org/browser/shell-service;1"]
                      .getService(Components.interfaces.nsIShellService)
        if (shell) {
          return shell.isDefaultBrowser(false);
        }
      } catch(e) {}

      return null;
    },
    openLink: function(win, url, newTab, newWindow, newPrivateWindow, focus){
        // make sure there is a protocol (this is required
        // for storing it properly in Firefoxe's history DB)
        if(url.indexOf("://") == -1 && url.trim().indexOf('about:') != 0) {
          url = "http://" + url;
        }

        // Firefox history boosts URLs that are typed in the URL bar, autocompleted,
        // or selected from the history dropbdown; thus, mark page the user is
        // going to see as "typed" (i.e, the value Firefox would assign to such URLs)
        try {
            var historyService =
                Cc["@mozilla.org/browser/nav-history-service;1"].getService(Ci.nsINavHistoryService);
            var ioService =
                Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
            var urlObject = ioService.newURI(url, null, null);
                historyService.markPageAsTyped(urlObject);
        } catch(e) { }

        if(newTab) {
          const tab = win.gBrowser.addTab(url);
          if (focus) {
            win.gBrowser.selectedTab = tab;
          }
          return tab;
        } else if(newWindow) {
            win.open(url, '_blank');
        } else if(newPrivateWindow) {
            win.openLinkIn(url, "window", { private: true });
        }
        else {
            // Set urlbar value to url immediately
            if(win.CLIQZ.Core.urlbar) {
              win.CLIQZ.Core.urlbar.value = url;
            }
            //win.openUILink(url);
            win.gBrowser.loadURI(url);
        }
    },
    copyResult: function(val) {
        var gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
        gClipboardHelper.copyString(val);
    },
    isPrivate: function(win) {
        // try to get the current active window
        if(!win) win = CLIQZEnvironment.getWindow();

        // return false if we still do not have a window
        if(!win) return false;

        if(win && win.cliqzIsPrivate === undefined){
            try {
                // Firefox 20+
                Cu.import('resource://gre/modules/PrivateBrowsingUtils.jsm');
                win.cliqzIsPrivate = PrivateBrowsingUtils.isWindowPrivate(win);
            } catch(e) {
                // pre Firefox 20
                try {
                  win.cliqzIsPrivate = Cc['@mozilla.org/privatebrowsing;1'].
                                          getService(Ci.nsIPrivateBrowsingService).
                                          privateBrowsingEnabled;
                } catch(ex) {
                  Cu.reportError(ex);
                  win.cliqzIsPrivate = true;
                }
            }
        }

        return win.cliqzIsPrivate
    },

    /**
     * @param {ChromeWindow} win - browser window to check.
     * @return whether |win|'s current tab is in private mode.
     */
    isOnPrivateTab: function(win) {
      return (
        win &&
        win.gBrowser.selectedBrowser !== undefined &&
        win.gBrowser.selectedBrowser.loadContext.usePrivateBrowsing
      );
    },

    getWindow: function(){
        var wm = Cc['@mozilla.org/appshell/window-mediator;1']
                            .getService(Ci.nsIWindowMediator);
        return wm.getMostRecentWindow("navigator:browser");
    },
    getWindowID: function(win){
        win = win || CLIQZEnvironment.getWindow();
        var util = win.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
        return util.outerWindowID;
    },
    openTabInWindow: function(win, url, relatedToCurrent = false){
        var tBrowser = win.document.getElementById('content');
        var tab = tBrowser.addTab(url, {relatedToCurrent: relatedToCurrent});
        tBrowser.selectedTab = tab;
    },
    // TODO: move this
    trk: [],
    telemetry: (function(url){
      var trkTimer = null,
          telemetrySeq = -1,
          telemetryReq = null,
          telemetrySending = [],
          TELEMETRY_MAX_SIZE = 500;

      function getNextSeq(){
        if(telemetrySeq == -1)
          telemetrySeq = prefs.get('telemetrySeq', 0)

        telemetrySeq = (telemetrySeq + 1) % 2147483647;

        return telemetrySeq;
      }

      function pushTelemetry() {
        prefs.set('telemetrySeq', telemetrySeq);
        if(telemetryReq) return;

        // put current data aside in case of failure
        telemetrySending = CLIQZEnvironment.trk.slice(0);
        CLIQZEnvironment.trk = [];

        console.log('push telemetry data: ' + telemetrySending.length + ' elements', "pushTelemetry");

        telemetryReq = promiseHttpHandler('POST', CLIQZEnvironment.LOG, JSON.stringify(telemetrySending), 10000, true);
        telemetryReq.then( pushTelemetryCallback );
        telemetryReq.catch( pushTelemetryError );
      }

      function pushTelemetryCallback(req){
        try {
          var response = JSON.parse(req.response);

          if(response.new_session){
            prefs.set('session', response.new_session);
          }
          telemetrySending = [];
          telemetryReq = null;
        } catch(e){}
      }

      function pushTelemetryError(req){
        // pushTelemetry failed, put data back in queue to be sent again later
        console.log('push telemetry failed: ' + telemetrySending.length + ' elements', "pushTelemetry");
        CLIQZEnvironment.trk = telemetrySending.concat(CLIQZEnvironment.trk);

        // Remove some old entries if too many are stored, to prevent unbounded growth when problems with network.
        var slice_pos = CLIQZEnvironment.trk.length - TELEMETRY_MAX_SIZE + 100;
        if(slice_pos > 0){
          console.log('discarding ' + slice_pos + ' old telemetry data', "pushTelemetry");
          CLIQZEnvironment.trk = CLIQZEnvironment.trk.slice(slice_pos);
        }

        telemetrySending = [];
        telemetryReq = null;
      }

      return function(msg, instantPush) {
        // no telemetry in private windows & tabs
        if (msg.type !== 'environment' && utils.isPrivateMode()) {
          return;
        }

        console.log(msg, 'Utils.telemetry');
        if(!prefs.get('telemetry', true))return;
        msg.session = prefs.get('session');
        msg.ts = Date.now();
        msg.seq = getNextSeq();

        CLIQZEnvironment.trk.push(msg);
        CLIQZEnvironment.clearTimeout(trkTimer);
        if(instantPush || CLIQZEnvironment.trk.length % 100 == 0){
          pushTelemetry();
        } else {
          trkTimer = CLIQZEnvironment.setTimeout(pushTelemetry, 60000);
        }
      }
    })(),
    _isSearchServiceInitialized: (() => {
      if (Services.search.init) {
        Services.search.init(() => {
          CLIQZEnvironment._isSearchServiceInitialized = true;
        });
        return false;
      }
      return true;
    })(),
    getDefaultSearchEngine() {
      var searchEngines = CLIQZEnvironment.getSearchEngines();
      return searchEngines.filter(function (se) { return se.default; })[0];
    },
    getSearchEngines: function(blackListed = []) {
      const SEARCH_ENGINES = CLIQZEnvironment._isSearchServiceInitialized ?
        {
          defaultEngine: Services.search.defaultEngine,
          engines: Services.search.getEngines()
        } : {
          defaultEngine: null,
          engines: []
        };

      return SEARCH_ENGINES.engines
        .filter((e) => !e.hidden && e.iconURI != null && blackListed.indexOf(e.name) < 0)
        .map((e) => {
          return {
            name: e.name,
            alias: e.alias,
            default: e === SEARCH_ENGINES.defaultEngine,
            icon: e.iconURI.spec,
            base_url: e.searchForm,
            urlDetails: utils.getDetailsFromUrl(e.searchForm),
            getSubmissionForQuery: function(q, type){
              // 'keyword' is used by one of the Mozilla probes
              // to measure source for search actions
              // https://dxr.mozilla.org/mozilla-central/rev/e4107773cffb1baefd5446666fce22c4d6eb0517/browser/locales/searchplugins/google.xml#15
              const submission = e.getSubmission(q, type, 'keyword');

              // some engines cannot create submissions for all types
              // eg 'application/x-suggestions+json'
              if (submission) {
                return submission.uri.spec;
              } else {
                return null
              }
            }
          };
        });
    },

    updateAlias: function(name, newAlias) {
      Services.search.getEngineByName(name).alias = newAlias;
    },
    getEngineByAlias: function(alias) {
      return CLIQZEnvironment.getSearchEngines().find(engine => { return engine.alias === alias; });
    },
    getEngineByName: function(name) {
      return CLIQZEnvironment.getSearchEngines().find(engine => { return engine.name === name; });
    },
    addEngineWithDetails: function(engine) {
      const existedEngine = Services.search.getEngineByName(engine.name);
      if (existedEngine) {
        // Update the engine alias in case it has been removed
        if (!existedEngine.alias) {
          existedEngine.alias = engine.key;
        }

        return;
      }

      Services.search.addEngineWithDetails(
        engine.name,
        engine.iconURL,
        engine.key,
        engine.name,
        engine.method,
        engine.url
      );
      if (engine.encoding) {
        Services.search.getEngineByName(engine.name).wrappedJSObject._queryCharset = engine.encoding;
      }
    },
    /* eslint no-param-reassign: ["error", { "props": false }] */
    restoreHiddenSearchEngines: function() {
      // YouTube - special case
      const SEARCH_ENGINE_ALIAS = {
        youtube: '#yt',
        'youtube-de': '#yt',
      };

      Services.search.getEngines().forEach((e) => {
        if (e.hidden === true) {
          e.hidden = false;
          // Restore the alias as well
          if (!e.alias && e.identifier) {
            if (SEARCH_ENGINE_ALIAS[e.identifier]) {
              e.alias = SEARCH_ENGINE_ALIAS[e.identifier];
            } else {
              e.alias = `#${e.identifier.toLowerCase().substring(0, 2)}`;
            }
          }
        }
      });
    },
    /*
      We want to remove the search engine in order to update it by addEngineWithDetails function
      If the search engines are stored in user profile, we can remove them
    */
    removeEngine: function(name) {
      let engine = Services.search.getEngineByName(name);
      if (engine) {
        Services.search.removeEngine(engine);
      }
      // Check if the engine has been removed or not
      engine = Services.search.getEngineByName(name);
      // If not, search engines cannot be removed since they are stored in global location
      // removeEngine will just hide the engine, we can restore it by unhiding it
      if (engine) {
        engine.hidden = false;
      }
    },
    // from ContextMenu
    openPopup: function(contextMenu, ev, x, y) {
      contextMenu.openPopupAtScreen(x, y, false);
    },
    /**
     * Construct a uri from a url
     * @param {string}  aUrl - url
     * @param {string}  aOriginCharset - optional character set for the URI
     * @param {nsIURI}  aBaseURI - base URI for the spec
     */
    makeUri: function(aUrl, aOriginCharset, aBaseURI) {
      var uri;
      try {
        uri = Services.io.newURI(aUrl, aOriginCharset, aBaseURI);
      } catch(e) {
        uri = null
      }
      return uri;
    },
    getNoResults: function(q) {


      var res = CLIQZEnvironment.Result.cliqz(
        {
          template:'noResult',
          snippet: {},
          type: 'rh',
          subType: {empty:true}
        },
        q
      );

      return res;
    }
}

function urlbar(){
  return CLIQZEnvironment.getWindow().CLIQZ.Core.urlbar;
}

// TODO - revive this one
function getTopSites(){
    var results = NewTabUtils.links.getLinks().slice(0, 5);
    if(results.length>0){
        var top = CLIQZEnvironment.Result.generic('cliqz-extra', '', null, '', null, '', null, JSON.stringify({topsites:true}));
        top.data.title = CLIQZEnvironment.getLocalizedString('topSitesTitle');
        top.data.message = CLIQZEnvironment.getLocalizedString('topSitesMessage');
        top.data.message1 = CLIQZEnvironment.getLocalizedString('topSitesMessage1');
        top.data.cliqz_logo = CLIQZEnvironment.SKIN_PATH + 'img/cliqz.svg';
        top.data.lastQ = CLIQZEnvironment.getWindow().gBrowser.selectedTab.cliqz;
        top.data.url = results[0].url;
        top.data.template = 'topsites';
        top.data.urls = results.map(function(r, i){
            var urlDetails = CLIQZEnvironment.getDetailsFromUrl(r.url),
                logoDetails = CLIQZEnvironment.getLogoDetails(urlDetails);

            return {
              url: r.url,
              href: r.url.replace(urlDetails.path, ''),
              link: r.url.replace(urlDetails.path, ''),
              name: urlDetails.name,
              text: logoDetails.text,
              style: logoDetails.style,
              extra: "top-sites-" + i
            }
        });
        return top
    }
}

export default CLIQZEnvironment;
