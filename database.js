/**
 * Database support
 *
 * (c) Jonathan Perkins https://github.com/JonathanPerkins 2015
 */

 // Database
var Datastore = require('nedb');

var category_db = null;
var file_db = null;
var url_db = null;
// Default to console logging
var logger = console;

 // Get the available records
 // Returns result asyncronously via callback(err, records[])
 function getRecords(database, callback) {
     // { name: "", .... }
     database.find({}, function (err, docs) {
         if (err) {
             logger.log('db.find error: '+JSON.stringify(err));
         }
         callback(err, docs);
     });
 }

 // Get a specific record (or doc === null if the record does not exist)
 // Returns result asyncronously via callback(err, record)
 function getRecord(database, name, callback) {
     // { name: "", .... }
     database.findOne({ name: name }, function (err, doc) {
         if (err) {
             logger.log('db.find error: '+JSON.stringify(err));
         }
         callback(err, doc);
     });
 }

 // Create/update a record
 // Returns result asyncronously via callback(err)
 function setRecord(database, name, record, callback) {
     // { name: "", .... }
     if (name === record.name) {
         database.update(  { name: name },  // key
                     record,
                     { upsert: true },  // insert if not exists, otherwise update
                     function(err) {
                         if (err) {
                             logger.log('db.insert error: '+JSON.stringify(err));
                         }
                         callback(err);
                     } );
     }
     else {
         callback('name: '+name+' does not match record name: '+record.name);
     }
 }

 // Delete the given record
 // Returns result asyncronously via callback(err, numRemoved)
 function deleteRecord(database, name, callback) {
     // { name: "", .... }
     database.remove({ name: name }, function (err, numRemoved) {
         if (err) {
             logger.log('db.remove error: '+JSON.stringify(err));
         }
         callback(err, numRemoved);
     });
 }

 module.exports = {

     // Initialise with reference to config module
     init: function(config, log) {
         logger = log;
         category_db = new Datastore({ filename: config.db_directory+'/categories.db', autoload: true });
         file_db     = new Datastore({ filename: config.db_directory+'/files.db', autoload: true });
         url_db      = new Datastore({ filename: config.db_directory+'/urls.db', autoload: true });

         // Auto-compaction every 10 mins
         category_db.persistence.setAutocompactionInterval(10*60*1000);
         file_db.persistence.setAutocompactionInterval(10*60*1000);
         url_db.persistence.setAutocompactionInterval(10*60*1000);
     },

     // ********************************************************
     // Categories
     // ********************************************************

     // Get the available categories
     // Returns result asyncronously via callback(err, categories[])
     getCategories: function(callback) {
         getRecords(category_db, callback);
     },

     // Get the available public categories
     // Returns result asyncronously via callback(err, categories[])
     getPublicCategories: function(callback) {
         category_db.find({public:true}, function (err, docs) {
             if (err) {
                 logger.log('db.find error: '+JSON.stringify(err));
             }
             callback(err, docs);
         });
     },

     // Get the given category
     // Returns result asyncronously via callback(err, category)
     getCategory: function(name, callback) {
         getRecord(category_db, name, callback);
     },

     // Create/update a category
     // Returns result asyncronously via callback(err)
     setCategory: function(name, category, callback) {
         setRecord(category_db, name, category, callback);
     },

     // Delete the given category
     // Returns result asyncronously via callback(err)
     deleteCategory: function(name, callback) {
         deleteRecord(category_db, name, callback);
     },

     // ********************************************************
     // Files
     // ********************************************************

     // Get the available files
     // Returns result asyncronously via callback(err, files[])
     getFiles: function(callback) {
         getRecords(file_db, callback);
     },

     // Get the given file record
     // Returns result asyncronously via callback(err, file)
     getFile: function(name, callback) {
         getRecord(file_db, name, callback);
     },

     // Create/update a file record
     // Returns result asyncronously via callback(err)
     setFile: function(name, file_record, callback) {
         setRecord(file_db, name, file_record, callback);
     },

     // Delete the given file record
     // Returns result asyncronously via callback(err)
     deleteFile: function(name, callback) {
         deleteRecord(file_db, name, callback);
     },

     // ********************************************************
     // URLs
     // ********************************************************

     // Get the available URLs
     // Returns result asyncronously via callback(err, urls[])
     getUrls: function(callback) {
         getRecords(url_db, callback);
     },

     // Get the given URL record
     // Returns result asyncronously via callback(err, url)
     getUrl: function(name, callback) {
         getRecord(url_db, name, callback);
     },

     // Create/update an URL
     // Returns result asyncronously via callback(err)
     setUrl: function(name, url, callback) {
         setRecord(url_db, name, url, callback);
     },

     // Delete the given category
     // Returns result asyncronously via callback(err)
     deleteUrl: function(name, callback) {
         deleteRecord(url_db, name, callback);
     }

 };
