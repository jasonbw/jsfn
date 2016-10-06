#! /usr/bin/env node

const readline = require('readline');
const fs = require('fs');
var argv = require('minimist')(process.argv.slice(2), { 'stopEarly': true });
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

// the option flags
const jsClosureInline = "c"
const jsClosureFile = "e";
const jsScriptInline = "i";
const jsScriptFile = "f";

// code - as a string - that will be `eval`d to set up the closure
var jsfnClosure = "";
// code - as a string - that will be `eval`d within the closure on each line of STDIN
var jsfnScript = "";


 // Parse the option flags and ensure that at most one closure and one script is used.
function parseInput(argv) {
    if (("h" in argv) || ("help" in argv)) {
        // print help text and quit
        printUsageStatement();
        process.exit();
    }
    if ("d" in argv) {
        printDebug();
    }

    // check that only one flag from each group is set
    if ((jsClosureInline in argv) && (jsClosureFile in argv)) {
        console.log("Error: -" + jsClosureInline + " and -" + jsClosureFile + "flags can't be used together.");
        process.exit(1);
    }
    if ((jsScriptInline in argv) && (jsScriptFile in argv)) {
        console.log("Error: -" + jsScriptInline + " and -" + jsScriptFile + "flags can't be used together.");
        process.exit(1);
    }

    // parse each type of input
    if (jsClosureInline in argv) {
        parseJSClosureInline(argv);
    }

    if (jsClosureFile in argv) {
        parseJSClosureFile(argv);
    }

    if (jsScriptInline in argv) {
        parseJSScriptInline(argv);
    }

    if (jsScriptFile in argv) {
        parseJSScriptFile(argv);
    }
}

function printUsageStatement() {
    console.log("Usage: jsfn [-" + jsClosureInline + " \"inline_closure\" | -" + jsClosureFile + " closure.js] [-" + jsScriptInline + " \"inline_script\" | -" + jsScriptFile + " script.js]");
    console.log("       jsfn -" + jsClosureFile + " closure.js -" + jsScriptFile + " script.js");
    console.log("");
    console.log("Magic referenceable variables (others can be added with closures):");
    console.log("  'input': the current line from STDIN");
    console.log("");
    console.log("Example usage:");
    console.log("  ls | jsfn -c \"var count = 0;\" -i \"console.log(count + ': ' + input); count += 1;\"");
    console.log("");
    console.log("Options:");
    console.log("  -" + jsClosureInline + ": js string that will be executed to set up the closure environment");
    console.log("  -" + jsClosureFile + ": js file that will be executed to set up the closure environment");
    console.log("  -" + jsScriptInline + ": js string that will be executed within the closure on each line of STDIN");
    console.log("  -" + jsScriptFile + ": js file that will be executed within the closure on each line of STDIN");
    console.log("");
    console.log("Documentation is at https://github.com/jasonbw/jsfn");
}

// This flag outputs to STDOUT and may cause havoc with IO pipes.
function printDebug(args) {
    console.log("argv: " + JSON.stringify(argv));
}

function parseJSClosureInline(argv) {
    if (Array.isArray(argv[jsClosureInline])) {
        console.log("Error: multiple -" + jsClosureFile + " flags can't be used");
        process.exit(1);
    } else {
        jsfnClosure += argv[jsClosureInline] + " ";
    }
}

function parseJSClosureFile(argv) {
    if (Array.isArray(argv[jsClosureFile])) {
        console.log("Error: multiple -" + jsClosureInline + " flags can't be used");
        process.exit(1);
    } else {
        jsfnClosure += fs.readFileSync(argv[jsClosureFile], 'utf8').toString() + " ";
    }
}

function parseJSScriptInline(argv) {
    if (Array.isArray(argv[jsScriptInline])) {
        console.log("Error: multiple -" + jsScriptInline + " flags can't be used");
        process.exit(1);
    } else {
        jsfnScript += argv[jsScriptInline] + " ";
    }
}

function parseJSScriptFile(argv) {
    if (Array.isArray(argv[jsScriptFile])) {
        console.log("Error: multiple -" + jsScriptFile + " flags can't be used");
        process.exit(1);
    } else {
        jsfnScript += fs.readFileSync(argv[jsScriptFile], 'utf8').toString() + " ";
    }
}


//
// Main workflow.
//

parseInput(argv);

// self-executing function that returns a closure
var _jsfn = function(input) {
    eval(jsfnClosure);
    return function(input) {
        eval(jsfnScript);
    };
}();

rl.on('line', _jsfn);