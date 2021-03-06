/* borrowed from https://gist.github.com/701407
 * This is a simple stub server for testing out of this repo without
 * a Hastur retrieval service or any funny business.
 * Usage: node server.js &
 * http://localhost:8888/
 */


var port = process.argv[2] || 8888;

var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    exec = require('child_process').exec;

http.createServer(function(request, response) {

  // rebuild hastur-ui.js
  var child = exec("/usr/bin/make", function (error, stdout, stderr) { });

  var uri = url.parse(request.url).pathname
  console.log("URI: " + uri);
  if (uri == "" || uri == "/" || uri == "/browser.html")
    uri = "./public/browser.html";
  else if (uri.match(/^\/?api\//))
    uri = "./test" + uri;

  var filename = path.join(process.cwd(), uri);

  fs.readFile(filename, "binary", function(err, file) {
      if (err) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }

      var extension = filename.split('.').pop();
      var head = { "Content-Type": "application/json" };

      if (extension == "js")
        head["Content-Type"] = "application/javascript";
      else if (extension == "css")
        head["Content-Type"] = "text/css";
      else if (extension == "png")
        head["Content-Type"] = "image/png";
      else if (extension == "jpg")
        head["Content-Type"] = "image/jpeg";
      else if (extension == "gif")
        head["Content-Type"] = "image/gif";
      else if (extension == "html")
        head["Content-Type"] = "text/html";

      response.writeHead(200, head);
      response.write(file, "binary");
      response.end();
  });
}).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
