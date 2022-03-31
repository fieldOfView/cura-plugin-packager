const core = require('@actions/core');

const fs = require('fs');
const path = require('path');

const archiver = require('archiver');

// most @actions toolkit packages have async methods
async function run() {
  try {
    //const pluginId = core.getInput('plugin_id');
    //const sourcePath = core.getInput('source_folder');
    //let packageInfoPath = core.getInput('package_info_path')
    const pluginId = 'OctoPrintPlugin';
    const sourcePath = '../OctoPrintPlugin';
    let packageInfoPath = '';


    const archiveFileName = pluginId + '.curapackage';
    const staticFilePath = fs.existsSync(__dirname + "/files") ? __dirname + "/files" : __dirname + "/dist/files";

    // get package info, or load "empty" package info template
    if (!fs.existsSync(packageInfoPath)){
      packageInfoPath = staticFilePath + "/package.json";
    }

    let packageInfo = {};
    try {
      const packageInfoData = fs.readFileSync(packageInfoPath, 'utf8');

      // parse JSON string to JSON object
      packageInfo = JSON.parse(packageInfoData);
    } catch (err) {
      throw err;
    }

    // get plugin info
    let pluginInfo = {};
    try {
      const pluginInfoData = fs.readFileSync(sourcePath + "/plugin.json", 'utf8');

      // parse JSON string to JSON object
      pluginInfo = JSON.parse(pluginInfoData);
    } catch (err) {
      throw err;
    }


    // create a file to stream archive data to.
    const output = fs.createWriteStream(archiveFileName);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function() {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function() {
      console.log('Data has been drained');
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        // log warning
      } else {
        // throw error
        throw err;
      }
    });

    // good practice to catch this error explicitly
    archive.on('error', function(err) {
      throw err;
    });

    // pipe archive data to the file
    archive.pipe(output);

    archive.directory(
      sourcePath,
      'files/plugins/' + pluginId,
      file => file.name.startsWith('.git') ? false : file
    );

    archive.append(
      JSON.stringify(packageInfo),
      {name: 'package.json'}
    );

    archive.file(
      staticFilePath + "/[Content_Types].xml",
      {name: "[Content_Types].xml"}
    );

    archive.directory(
      staticFilePath + "/_rels",
      '_rels'
    );

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    archive.finalize();


    //core.setOutput('time', new Date().toTimeString());
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
