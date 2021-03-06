"use strict";
const fs = require("fs");
const path = require("path");
const Q = require("q");
const readdirRecursive = require("fs-readdir-recursive");
const webidl2js = require("webidl2js");

const outputDir = path.resolve(__dirname, "../../lib/jsdom/living/generated/");
Q.longStackSupport = true;

function readConcatenatedSource(files) {
  return Q.all(files.map(f => {
    return Q.nfcall(fs.readFile, f, { encoding: "utf8" });
  })).then(sources => {
    let src = "";
    for (let i = 0; i < sources.length; ++i) {
      src += sources[i];
    }
    return src;
  });
}

function generateClasses(src, implDir) {
  webidl2js.generate(src, outputDir, implDir, { suppressErrors: true, implSuffix: "-impl" });
}

function doConversion(inputPath) {
  let isDir;

  return Q.nfcall(fs.stat, inputPath)
  .then(inputStat => {
    isDir = inputStat.isDirectory();
    if (isDir) {
      return readdirRecursive(inputPath, onlyIDL).map(relativePath => path.resolve(inputPath, relativePath));
    }

    return [inputPath]; // get dir name
  })
  .then(readConcatenatedSource)
  .then(src => {
    const folder = isDir ? inputPath : path.dirname(inputPath);
    generateClasses(src, folder);
  });
}

function onlyIDL(filePath) {
  return path.extname(filePath) === ".idl";
}

doConversion(path.resolve(__dirname, "../../lib/jsdom/living/traversal"))
  .then(() => doConversion(path.resolve(__dirname, "../../lib/jsdom/living/events")))
  .then(() => doConversion(path.resolve(__dirname, "../../lib/jsdom/living/attributes")))
  .then(() => doConversion(path.resolve(__dirname, "../../lib/jsdom/living/window")))
  .then(() => doConversion(path.resolve(__dirname, "../../lib/jsdom/living/nodes")))
  .then(() => doConversion(path.resolve(__dirname, "../../lib/jsdom/living/navigator")))
  .done();
