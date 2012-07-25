/* begin hastur/browser.js */

/*
 * Accesses the Hastur REST API and builds a browser interface.
 *
 * Dependencies:
 *  - Twitter Bootstrap
 *  - D3
 *  - Hastur retrieval service
 */

hastur.namespace("browser");

// place node data into a globally-accessible hash so it can be updated
hastur.browser.uuid_name = {}; // { $uuid => { $name => { } } }
hastur.browser.uuid_host = {}; // { $uuid => { hostname: => "", fqdn: => "", ... } }

// similarly with selections, this may be serialized and stored server-side
hastur.browser.selections = {
  nodes: {},
  metrics: {},
  functions: []
};

// used for tracking the current size of the status bar
hastur.browser.progress_percent = 0;

hastur.browser.set_path = function (items, data) {
  items.unshift("nodes");

  d3.select("#node-path")
    .text(items.join(" / "));
};

hastur.browser.progress = function (pcnt) {
  var display = "block";

  if (pcnt < 0) {
    display = "none";
    hastur.browser.progress_percent = 0;
  }
  else {
    hastur.browser.progress_percent += pcnt;
  }

  d3.select("#load-progress-container")
    .style("display", display);

  d3.select("#load-progress")
    .style("width", hastur.browser.progress_percent + "%");
};

hastur.browser.rickshaw_graph = function (name, hostname, uuid) {
  // hastur.browser.set_path([hostname, name], data);

  d3.select("#chart-area")
    .html("<div id=\"chart-container\"> <div id=\"y-axis\"></div> <div id=\"chart\"></div> </div> <div id=\"legend\"></div>");

  var ago = "one_hour";
  var fun = "hostname(compact())";
  if (name.indexOf("linux.") == 0) {
    fun = "hostname(derivative(compact(compound())))";
    ago = "five_minutes";
  }

  // http://localhost:8888/api/name/hastur.agent.cutime/value?ago=one_hour&fun=hostname(compact())&uuid=523b6b18-4529-4b41-a42a-e3ebd930b0b9

  hastur.rickshaw.graph(name, {
    chart: document.querySelector("#chart"),
    width: 500,
    height: 300,
    uuid: uuid,
    ago: ago,
    fun: fun
  });
};

hastur.browser.display_node = function (hostname, uuid) {
  // hastur.browser.set_path([hostname], data);

  d3.select("#name-list").selectAll("li").remove();

  d3.select("#name-list")
    .selectAll("li")
    .data(d3.keys(hastur.browser.uuid_name[uuid]).sort())
    .enter()
      .append("li")
      .append("a")
      .text(function (d) { return d; })
      .on("click", function (d) {
          hastur.browser.rickshaw_graph(d, hostname, uuid);
      });
};

hastur.browser.host_uuids = function () {
  var out = {};
  d3.keys(hastur.browser.uuid_host).forEach(function (uuid) {
    var data = hastur.browser.uuid_host[uuid];
    if (data.hasOwnProperty("all"))
      out[data.all.pop()] = uuid;
  });
  return out;
};

hastur.browser.display_nodelist = function () {
  // hastur.browser.set_path([], data);
  var hostnames = hastur.browser.host_uuids();

  d3.select("#node-list")
    .selectAll("li")
    .data(d3.keys(hostnames).sort())
    .enter()
      .append("li")
      .append("a")
      .text(function (d) { return d; })
      .on("click", function (d) {
        hastur.browser.display_node(d, hostnames[d]);
      });
};

hastur.browser.load_names = function (cb) {
  d3.json("/api/lookup/name?ago=two_days", function(data) {
    hastur.browser.uuid_name = data;

    if (typeof(cb) === "function")
      cb.call(null, data);
  });
};

hastur.browser.load_hosts = function (cb) {
  d3.json("/api/lookup/hostname/uuid?ago=two_days", function (data) {
    hastur.browser.uuid_host = data;

    if (typeof(cb) === "function")
      cb.call(null, data);
  });
};

/**
 * @param {String} target
 */
hastur.browser.init = function (target) {
  hastur.browser.progress(5); // turn it on
  hastur.browser.load_names(function (names) {
    hastur.browser.progress(30); // turn it on
    hastur.browser.load_hosts(function (nodes) {
      hastur.browser.progress(70); // turn it on
      hastur.browser.display_nodelist();
      hastur.browser.progress(-1); // turn it off
    });
  });
};

/* end hastur/browser.js */
