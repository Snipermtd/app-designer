//Apache Thrift client for sending files via adbpush
"use strict";
//Imports
const thrift = require("thrift");
const fileService_types = require("../../gen-nodejs/fileService_types.js");
const FileService = require("../../gen-nodejs/FileService");
const { execSync } = require("child_process");

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

//Constants
const HOST = "localhost";
const PORT = 9090;

//Serialization and transport protocols
var transport = thrift.TBufferedTransport;
var protocol = thrift.TBinaryProtocol;

//File handling logic
function computeMD5(fileData) {
    return crypto.createHash("md5").update(fileData).digest("hex");
}

//Function that executes ADB port forwarding
function adbForward() {
    try {
        execSync(`adb forward tcp:${PORT} tcp:${PORT}`, {
            stdio: "inherit", //This argument controls the granularity of the error messages that adb will show.
                              //Inherit will show grunt side errors. Change to "ignore" to only see the result of the throw.
        });
    } catch (err) {
        throw new Error("Failed to foward ports.");
    }
}

function startServicesServer() {
    try {
        execSync(`adb shell am startservice -n org.opendatakit.services/.thrift_file_importer.ThriftServerService`, {
            stdio: "inherit" //This argument controls the granularity of the error messages that adb will show.
                             // Inherit will show grunt side errors. Change to "ignore" to only see the result of the throw. 
        });
    } catch (err) {
        throw new Error("Failed to start server.");
    }
}

//Async method that opens a socket for communication and calls importFile from the server
//This is what needs to be implemented in each adbpush command.
async function sendFile({ localPath, relativePath }) {
    if (!fs.existsSync(localPath)) {
        throw new Error(`File not found: ${localPath}`);
    }

    //Forward ports
    adbForward();
    //Start server
    startServicesServer();

    const fileData = fs.readFileSync(localPath);
    const md5 = computeMD5(fileData);
    //Creating the FilePayload
    const payload = new fileService_types.FilePayload({
        fileName: path.basename(localPath),
        relativePath: relativePath,
        fileSize: fileData.length,
        md5_hash: md5,
        fileData: fileData,
    });
    //Create a socket for communication
    var connection = thrift.createConnection(HOST, PORT, {
        transport: transport,
        protocol: protocol,
    });

    //Create client stub instance
    var fileClient = thrift.createClient(FileService, connection);

    //Grunt expects synchronous completion or a Promise, we choose to go async and use promises for non-blocking.
    //Grunt doesn't stop what it's doing to wait.
    return new Promise((resolve, reject) => {
        connection.on("error", (err) => {
            reject(err);
        });

        fileClient.importFile(payload, function (err, result) {
            connection.end();

            if (err) {
                console.log(err);
                return reject(err);
            }

            if (!result.success) return reject(new Error(result.message));

            resolve(result);
        });
    });
}

module.exports = {
    sendFile
};