(function(exports) {

  // Create common objects
  function newConfig() {
    // Null means a limit is not applied
    return {
      enabled: false,
      count_remaining: null,
      start_time: null,
      end_time: null
    };
  }

  function newStats() {
    return {
      num_downloads: 0
    };
  }

  // Helper to render the count_remaining
  exports.renderCount = function(count) {
    if (count === null) {
      return '-';
    } else {
      return count;
    }
  };

  // Helper to build a URL path from category and file
  exports.makeUrlPath = function(category, file) {
    return category + '/' + file;
  };

  // Create a Category record
  exports.newCategoryRecord = function() {
    return {
      name: '',
      description: '',
      stats: newStats()
    };
  };

  // Create a File record
  exports.newFileRecord = function() {
    return {
      name: '', // file name (path within file repository)
      size: 0, // length in bytes
      md5: '', // MD5 sum
      stats: newStats()
    };
  };

  // Create an URL record
  exports.newUrlRecord = function() {
    return {
      name: '', // the URL path (category/file)
      category: '', // category name
      file: '', // file name (path within file repository)
      description: '',
      config: newConfig(),
      stats: newStats()
    };
  };

  // Use code in node or browser
})(typeof exports === 'undefined' ? this.record_definitions = {} : exports);
