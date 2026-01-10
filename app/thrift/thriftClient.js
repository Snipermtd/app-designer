//Apache Thrift client for sending files via adbpush

//Imports
const thrift = require("thrift");
const fileService_types = require("../../gen-nodejs/fileService_types.js");

const FileService = require("../../gen-nodejs/FileService");

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

//Constants
const HOST = "localhost";
const PORT = 9090;

//Serialization and transport protocols
var transport = thrift.TBufferedTransport;
var protocol = thrift.TBinaryProtocol;

var connection = thrift.createConnection(HOST, PORT, {
    transport: transport,
    protocol: protocol
});

//Create client stub instance 
var fileClient = thrift.createClient(FileService, connection);

connection.on("error", function(err) {
    console.error("Thrift connection error: ", err);
    connection.end();
});

fileClient.ping(function(err, response) {
    if (!err)
        console.log("Ping ok.");
});

    //Creating the FilePayload
const payload = new fileService_types.FilePayload({
    fileName: "",
    relativePath: "",
    fileSize: fileData.length,
    md5_hash: md5hash,
    fileData: fileData,

});


fileClient.exportFile(payload, function(err, response) {
    if (err)
        console.log(err);
    else
        console.log("Server responded: ", response);

    connection.end();
});