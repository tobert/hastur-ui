/* start namespace.js */

if (typeof(hastur) == "undefined") {
  // support node.js
  if (typeof(exports) == "object")
    hastur = exports;
  // everything else (browsers)
  else
    hastur = {};
}

hastur.namespace = function (ns) {
  hastur[ns] = hastur[ns] || {};
};

hastur.namespace("browser");

/* end namespace.js */
