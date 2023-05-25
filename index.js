"use strict";

//Loading dependencies & initializing express
var os = require("os"); //for operating system-related utility methods and properties
var path = require("path");
var express = require("express");
var expressWs = require("express-ws");
//var http = require('http');//for creating http server

var expressWs = expressWs(express());
var app = expressWs.app;


function getUniqueID() {
  function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return s4() + s4() + '-' + s4();
};

app.ws("/testews", function (ws, req) {

  ws.id = getUniqueID();
  console.log("Cliente conectado: " + ws.id);

  // ws.send(JSON.stringify({tipo: 'id', dados: { msg: id}}));

  ws.on("message", function (msg) {

    const msgJ = JSON.parse(msg);
    msgJ.idClient = ws.id;
    console.log(ws.id);
    
    var aWss = expressWs.getWss('/testewsf');
      aWss.clients.forEach(function (client) {
        client.send(JSON.stringify(msgJ));
      });
    });
});

app.ws("/testewsf", function (ws, req) {
  ws.id = getUniqueID();

  console.log("FRIGATE conectado: " + ws.id);
  
  ws.on("message", function (msg) {

    const msgJ = JSON.parse(msg);
    console.log(msgJ);

    var aWss = expressWs.getWss('/testews');
      aWss.clients.forEach(function (client) {
        if (msgJ.tipo == "teste" || client.id == msgJ.idClient) {
          client.send(msg);
        }
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
