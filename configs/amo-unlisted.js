/* eslint-disable */

'use strict';

const base = require('./common/system');
const subprojects = require('./common/subprojects/bundles');

module.exports = {
  "platform": "firefox",
  "baseURL": "chrome://cliqz/content/",
  "testsBasePath": "./build/cliqz@cliqz.com/chrome/content", "testem_launchers": ["unit-node", "Chrome"],
  "testem_launchers_ci": ["unit-node"],
  "settings": {
    "id": "description_test@cliqz.com",
    "name": "Cliqz",
    "channel": "FF01",
    "homepageURL": "https://cliqz.com/",
    "updateURL": "https://s3.amazonaws.com/cdncliqz/update/description_test@cliqz.com/latest.rdf",
    "freshTabNews": true,
    "showDataCollectionMessage": true,
    "antitrackingButton": true,
    "showNewBrandAlert": false,
    "suggestions": false,
    "geolocation": "yes",
    "ENDPOINT_BLIND_SIGNER": "https://hpn-sign.cliqz.com/sign",
    "ENDPOINT_USER_REG": "https://hpn-sign.cliqz.com/register",
    "ENDPOINT_SOURCE_MAP_PROVIDER": "https://hpn-collector.cliqz.com/sourcemapjson?q=1",
    "ENDPOINT_LOOKUP_TABLE_PROVIDER": "https://hpn-collector.cliqz.com/v2/lookuptable?q=1",
    "ENDPOINT_KEYS_PROVIDER": "https://hpn-collector.cliqz.com/signerKey?q=1",
    "ENDPOINT_PROXY_LIST_PROVIDER": "https://hpn-collector.cliqz.com/v2/proxyList?q=1",
    "ENDPOINT_PATTERNSURL": "https://cdn.cliqz.com/human-web/patterns",
    "ENDPOINT_ANONPATTERNSURL": "https://cdn.cliqz.com/human-web/patterns-anon",
    "ENDPOINT_CONFIGURL": "https://safe-browsing.cliqz.com/config",
    "ENDPOINT_SAFE_QUORUM_ENDPOINT": "https://safe-browsing-quorum.cliqz.com/",
    "ENDPOINT_SAFE_QUORUM_PROVIDER": "https://safe-browsing-quorum.cliqz.com/config",
    "KEY_DS_PUBKEY": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwXo4hXvboKHCggNJ0UNFvZQfDWi0jNcF1kBHthxilMu6LB\/hFrSMQ+\/FgTqVE36cCezWE0K1UcwmYGVsuqxcvql82RfCmYUVBroJ3UFG8qnetYfU5FOk43C555p5l5HzlF8QilcCUBCO4SCj9lEZ3\/8FJboCupTqxEUq7nwUgaNZOiGKMdDUBZJO1tW4LSH4lj9IAZccEJ5HKVmJKopQ3hmzWgDqowxni4NQz+0DnsSfCGAupKaJDxjfajJosX5i674rgdHbZGtgHB3M9jhc6HFNPcmtUgLwgtUtRwMhSnya6q\/O06euouNi1h0m5eRrWeMRlJSdUnelLSU8QNy7LQIDAQAB",
    "KEY_SECURE_LOGGER_PUBKEY": "MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAh5HhcRAn6+6woXQXl\/NtZ+fOooNglZct\/HSpYuqkcmrPauHW7EuOSq5bvpBZRTDROjR\/kUPomqVZIzqhdCFPA8BwXSCz7hAel2Q157vtBvh9sngMMLXb5Fgzef5N4EuKO8pL5KrS+I9tfZac41vFJSdpgAirZYhh+tdcQQ1z0Qv\/Rw0zOXjfvddCz3gEv2gB9KsLMVnTS1J4YOOgfza2adg9Ebz1z99DiF4vtCwn0IUwH\/3ToTBwJLbMnC3Ol43yBNk8rgK2mkgCi614vOSD3hnVmio+iW6+AUklM8VPl6l7hEK9cljJY+9UsMVmTrvaFbMPwS6AdZCXKTmNdaMJcy3zSOXu5zvzihoQLwAu9LM3l2eVk0Mw0K7JXOP20fc8BtzWCOLYVP32r4R0BNuhTtvGqjHNZHPJN5OwaxkLpn2dujL9uDWGjRiOItKMVq\/nOqmNGghrbf8IOaKT7VQhqOU4cXRkB\/uF1UjYETBavwUZAxx9Wd\/cMcAGmKiDxighxxQ29jDufl+2WG065tmJz+zCxmgrPh6Zb3KFUxPTe6yksAhWJhmGShA9v20t84M5c6NpZXoUsFcVja6XxzHeSB8dWq9Uu5QcZ83Gz\/ronwdEjT2OGTtBgOFeTDqLYUgphC1gcUEHOCnTNXRMQOXqGwBfZHp+Mq61QcMq2rNS7xECAwEAAQ==",
    "HW_CHANNEL": "FF01",
    "HPN_CHANNEL": "cliqz",
    "NEW_TAB_URL": "chrome://cliqz/content/freshtab/home.html",
    "ICONS": {
      "active": { "default": "control-center/images/privacy-shield-active.svg" },
      "inactive": { "default": "control-center/images/privacy-shield-inactive.svg" },
      "critical": { "default": "control-center/images/privacy-shield-inactive.svg" }
    },
    "PAGE_ACTION_ICONS": {
      "default": "control-center/images/page-action-dark.svg",
      "dark": "control-center/images/page-action-light.svg"
    },
    "BACKGROUNDS": {
      "active": "#999999",
      "critical": "#999999"
    },
    "CONFIG_PROVIDER": "https://api.cliqz.com/api/v1/config",
    "CDN_BASEURL": "https://cdn.cliqz.com",
    "ALLOWED_COUNTRY_CODES": ["de", "at", "ch", "es", "us", "fr", "nl", "gb", "it", "se"],
    "OFFERS_BE_BASE_URL": "https://offers-api.cliqz.com"
  },
  "modules": [
    "core",
    "core-cliqz",
    "dropdown",
    "firefox-specific",
    "static",
    "autocomplete",
    "geolocation",
    "ui",
    "last-query",
    "human-web",
    "anti-phishing",
    "context-menu",
    "webrequest-pipeline",
    "antitracking",
    "performance",
    "hpn",
    "control-center",
    "message-center",
    "offboarding"
  ],
  "subprojects": subprojects([
    '@cliqz-oss/pouchdb',
    'handlebars',
    'jquery',
    'mathjs',
    'moment',
    'moment-range',
    'pako',
    'simple-statistics',
    'ua-parser-js',
    'rxjs',
    'tooltipster-sideTip-theme',
    'tooltipster-js',
    'tooltipster-css',
  ]),
  systemDefault: base.systemConfig,
  builderDefault: base.builderConfig,
  bundleConfigs: Object.assign({}, base.appBundleConfig),
}
