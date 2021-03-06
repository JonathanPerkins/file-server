(function(exports) {

  // On/off toggle
  exports.widgetOnOffToggle = function(enabled) {
    if (enabled) {
      return '<span class="fa fa-toggle-on fa-lg widget-enable"/>';
    } else {
      return '<span class="fa fa-toggle-off fa-lg"/>';
    }
  };

  // Locked/unlocked
  exports.widgetLocked = function(locked) {
    if (locked) {
      return '<span class="fa fa-lock fa-lg"/>';
    } else {
      return '<span class="fa fa-unlock fa-lg"/>';
    }
  };

  // Download
  exports.widgetDownload = function(url) {
    return '<a href="' + url + '"><span class="fa fa-download fa-lg widget-download"/></a>';
  };

  // Trash
  exports.widgetTrash = function() {
    return '<span class="fa fa-trash fa-lg widget-trash"/>';
  };

  // Refresh
  exports.widgetRefresh = function() {
    return '<span class="fa fa-refresh fa-lg widget-refresh"/>';
  };

  // Use code in node or browser
})(typeof exports === 'undefined' ? this.widgets = {} : exports);
