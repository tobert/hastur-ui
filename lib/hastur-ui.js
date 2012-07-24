(function(){
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
/* begin hastur/rickshaw.js */

/*
 * This is a wrapper for Rickshaw to make hooking up simple Hastur graphs really easy.
 */

hastur.namespace("rickshaw");

/*
 * default options for rendering functions
 */
hastur.rickshaw.defaults = {
  width: 800,
  height: 400,
  ago: "five_minutes",
  renderer: "line"
};

// merge the passed-in options with the default options
hastur.rickshaw.merge_options = function (options) {
  // copy first
  out = {};
  d3.keys(options).forEach(function (key) {
    out[key] = options[key];
  });

  // apply global defaults that aren't already present
  d3.keys(hastur.rickshaw.defaults).forEach(function (key) {
    if (!out.hasOwnProperty(key))
      out[key] = hastur.rickshaw.defaults[key];
  });

  return out;
};

hastur.rickshaw.render = function (series, options) {
  var graph = new Rickshaw.Graph({
    element: options.chart,
    width: options.width,
    height: options.height,
    renderer: options.renderer,
    stroke: options.stroke,
    series: series
  });

  var x_axis = new Rickshaw.Graph.Axis.Time({ graph: graph });

  if (options.hasOwnProperty("y_axis")) {
    var y_axis = new Rickshaw.Graph.Axis.Y({
      graph: graph,
      orientation: 'left',
      tickFormat: Rickshaw.Fixtures.Number.formatBase1024KMGTP,
      element: options.y_axis
    });
  }

  if (options.hasOwnProperty("legend")) {
    var legend = new Rickshaw.Graph.Legend({
      graph: graph,
      element: options.legend
    });
  }

  var hoverDetail = new Rickshaw.Graph.HoverDetail({ graph: graph });

  graph.render();

  return graph;
};

hastur.rickshaw.color_list = function (data, options) {
  var palette = new Rickshaw.Color.Palette( { scheme: "munin" } );
  var colors = {};

  // extract all message names from the data across all uuids
  Rickshaw.keys(data).forEach(function(uuid) {
    Rickshaw.keys(data[uuid]).sort().forEach(function(name) {
      if (!colors.hasOwnProperty(name))
        colors[name] = null;
    });
  });

  // sort it once and get colors for every name so the order is
  // consistent as long as new names don't show up
  Rickshaw.keys(colors).sort().forEach(function(name) {
      colors[name] = palette.color();
  });

  return colors;
};

/*
 * Convert the Hastur data structure into a rickshaw series.
 */
hastur.rickshaw.to_series = function (data, options) {
  var hseries = [];
  var colors = hastur.rickshaw.color_list(data, options);

  d3.keys(data).forEach(function (node) {
    d3.keys(data[node]).sort().forEach(function (name) {
      var items = [];
      var sname = node + ":" + name;
      if (node == "") sname = name;
      if (name == "") sname = node;

      hseries.push({
        name: sname,
        data: items,
        color: colors[name]
      });

      d3.keys(data[node][name]).sort().forEach(function (tss) {
        var ts = parseInt(tss) / 1000000;
        var val = data[node][name][tss];

        // hastur raw messages
        if (typeof(val) === "object" && val.hasOwnProperty("value"))
          items.push({ x: ts, y: val.value });
        else
          items.push({ x: ts, y: val });
      });
    });
  });

  Rickshaw.Series.zeroFill(hseries);

  return hseries;
};

/*
 * Draw a Rickshaw graph.
 */
hastur.rickshaw.graph = function(name_in, options_in) {
  var names = [].concat(name_in);
  var options = hastur.rickshaw.merge_options(options_in);
  var graph = null;

  var params = [];
  ["ago", "fun", "start", "end", "uuid"].forEach(function (key) {
    if (options.hasOwnProperty(key))
      params.push(key + "=" + options[key]);
  });

  var url = "/api/name/" + names.join() + "/value?" + params.join("&")
  console.log("URL: ", url);

  d3.json(url, function (data) {
    var hseries = hastur.rickshaw.to_series(data, options);
    if (graph == null)
      graph = hastur.rickshaw.render(hseries, options);
    else {
      graph.series = hseries;
      graph.render();
    }
  });
};

/* end hastur/rickshaw.js */
})();