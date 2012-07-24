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
