var assert = require("assert");

var hastur = null;
try {
  hastur = require("../lib/hastur-ui");
}
catch (e) {
  assert.ok(false, "load the hastur-ui javascript library: " + e);
}

assert.equal(typeof(hastur), "object", "document.hastur is an object");

assert.equal(typeof(hastur.browser), "object", "document.hastur.browser is an object");
