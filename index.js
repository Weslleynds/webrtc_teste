"use strict";

//Loading dependencies & initializing express
var os = require("os"); //for operating system-related utility methods and properties
var path = require("path");
var express = require("express");
var expressWs = require("express-ws");
//var http = require('http');//for creating http server

var expressWs = expressWs(express());
var app = expressWs.app;

app.ws("/testews", function (ws, req) {
  ws.on("message", function (msg) {
    var aWss = expressWs.getWss('/testews');
    aWss.clients.forEach(function (client) {
      client.send(msg);
    });
  });
});


//Define the folder which contains the CSS and JS for the fontend
app.use(express.static("public"));

//Define a route
app.get("/", function (req, res) {
  //Render a view (located in the directory views/) on this route
  res.render("index.ejs");
});

//Initialize http server and associate it with express
//var server = http.createServer(app);

//Ports on which server should listen - 8080 or the one provided by the environment
app.listen(process.env.PORT || 8080);
