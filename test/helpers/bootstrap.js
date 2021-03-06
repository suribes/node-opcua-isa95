
process.env.NODE_PATH="c:\\projects\\NodeOPCUA\\node-opcua" + ";" + process.env.NODE_PATH;
require('module').Module._initPaths();
//xx module.paths.push("c:\\projects\\NodeOPCUA\\node-opcua");

var opcua  = require("node-opcua");
var should = require("should");
var fs = require("fs");
var path = require("path");

var construct_ISA95_addressSpace = function (callback) {


    // add ISA95 Extensions
    require("../../index")(opcua);

    var addressSpace = new opcua.AddressSpace();

    fs.existsSync(opcua.ISA95.nodeset_file).should.be.eql(true,opcua.ISA95.nodeset_file + " should exist");

    var xml_files = [
        opcua.standard_nodeset_file,
        opcua.ISA95.nodeset_file
    ];
    opcua.generate_address_space(addressSpace, xml_files, function (err) {


        callback(err,addressSpace);
    });
};
exports.construct_ISA95_addressSpace = construct_ISA95_addressSpace;
//xx after(function () {
//xx s    addressSpace.dispose();
//xx     addressSpace = null;
//xx });


