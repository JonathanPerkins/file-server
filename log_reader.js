/**
 * nedb-logger file reader
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */

 var fs = require('fs');

 module.exports = {

     // Read all the given log file, returning callback(err, results)
     readAll: function(logFile, callback) {

         fs.readFile(logFile, 'utf8', function (err, data) {
             if (err) callback(err, null);

             var records = [];

             // Each line in the log file is a JSON object
             var lines = data.split("\n");
             for(var i=0; i<lines.length-1; i++) {
                 try {
                     records.push(JSON.parse(lines[i]));
                 }
                 catch(e) {
                     console.log('skipping log entry, error: ', e);
                 }
             }

             callback(null, records);
         });
     },

 };
