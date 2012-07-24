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

  d3.select("#hastur-node-path")
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

  d3.select("#hastur-load-progress-container")
    .style("display", display);

  d3.select("#hastur-load-progress")
    .style("width", hastur.browser.progress_percent + "%");
};

hastur.browser.rickshaw_graph = function (hostname, uuid, name, data) {
  hastur.browser.set_path([hostname, name], data);

  d3.select("#chart-area")
    .html("<div id=\"chart-container\"> <div id=\"y-axis\"></div> <div id=\"chart\"></div> </div> <div id=\"legend\"></div>");

  var ago = "one_hour";
  var fun = "hostname(compact())";
  if (name.indexOf("linux.") == 0) {
    fun = "hostname(derivative(compact(compound())))";
    ago = "five_minutes";
  }

  hastur.rickshaw.graph(name, {
    chart: document.querySelector("#chart"),
    width: 500,
    height: 300,
    uuid: uuid,
    ago: ago,
    fun: fun
  });
};

hastur.browser.display_node = function (hostname, uuid, data) {
  hastur.browser.set_path([hostname], data);

  d3.select("#name-list").selectAll("li").remove();

  var names = d3.keys(data.u[uuid]).sort();
  d3.select("#name-list")
    .selectAll("li")
    .data(names)
    .enter()
      .append("li")
      .append("a")
      .text(function (d) { return d; })
      .on("click", function (d) {
          hastur.browser.rickshaw_graph(hostname, uuid, d, data);
      });
};

hastur.browser.display_nodelist = function (data) {
  hastur.browser.set_path([], data);
  hastur.browser.progress(0); // turn it on

  d3.select("#node-list")
    .selectAll("li")
    .data(d3.keys(data.h).sort())
    .enter()
      .append("li")
      .append("a")
      .text(function (d) { return d; })
      .on("click", function (d) {
        hastur.browser.display_node(d, data.h[d], data)
      });
};

hastur.browser.load_names = function () {
  d3.json("/api/lookup/name?ago=two_days", function(data) {
    hastur.browser.progress(20);
    hastur.browser.uuid_name = data;
  });
};

hastur.browser.load_hosts = function () {
  d3.json("/api/lookup/hostname/uuid?ago=two_days", function (data) {
    hastur.browser.progress(20);
    hastur.browser.uuid_host = data;
  });
};

/**
 * @param {String} target
 */
hastur.browser.init = function (target) {
  var container = d3.select(target).append("div").classed("container-fluid");
  var topbar = container.append("div").classed("row-fluid well shorten")
                        .attr("id", "hastur-topbar");

      // the left side of the bar has the current node/name selections
      topbar.append("div").classed("span9").append("p").attr("id", "hastur-node-path");

      // a div on the right side of the top bar to display a progress meter
      topbar.append("div").classed("span3")
            .append("div").classed("progress progress-striped active")
                          .attr("id", "hastur-load-progress-container")
                          .append("div").classed("bar")
                                        .attr("id", "hastur-load-progress");

  // main div is broken into left | right
  var main = container.append("div").classed("row-fluid");
  var left = main.append("div").classed("span4 well");
  var right = main.append("div").classed("span8");

  // left panel has two tabs
  var left_ul = left.append("ul").classed("nav nav-tabs");
  // first tab is stat names
  var namelist = left_ul.append("li").classed("active")
                        .append("a").attr("href", "#").text("Metrics");
  var hostlist = left_ul.append("li")
                        .append("a").attr("href", "#").text("Nodes");

  hastur.browser.load_names();
  hastur.browser.load_hosts();
};

/* end hastur/browser.js */
