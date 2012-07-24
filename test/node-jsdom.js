var assert = require("assert");
var jsdom = require("jsdom");

var html = "<!doctype html><html lang=\"en\"><head></head><body></body></html>";

jsdom.env({
  html: html,
  scripts: [
    "../lib/d3.v2.min.js",
    "../lib/rickshaw.min.js",
    "../lib/hastur-ui.js"
  ],
  src: [
    "hastur.browser.init();",
  ],
  done: function (errors, window) {
    if (errors) {
      console.log("Error: " + errors);
      process.exit(1);
    }
    else {
      assert.ok(window.hasOwnProperty("hastur"), "Hastur JS loaded");
      assert.ok(window.hastur.hasOwnProperty("browser"), "Hastur namespace hastur.browser exists");
      assert.ok(window.hastur.hasOwnProperty("rickshaw"), "Hastur namespace hastur.rickshaw exists");
    }
  }
});

