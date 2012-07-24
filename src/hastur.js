/* start hastur.js */

hastur.namespace("hastur");

/**
 * A simple merge() that returns a new object with all of the keys of both
 * provided objects. If keys exist in both, the values of the second wins.
 *
 * @param {Object} obj1 first object
 * @param {Object} obj2 second object, overwrites keys present in both
 * @returns {Object} combined object
 */
hastur.merge = function (obj1, obj2) {
  var out = {};
  d3.keys(obj1, function (key) { out[key] = obj1[key]; });
  d3.keys(obj2, function (key) { out[key] = obj2[key]; });
  return out;
};

/* end hastur.js */
