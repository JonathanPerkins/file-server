(function(exports) {

  // The number of rows to grow to before scrolling kicks in
  var displayRows = 1;

  // Default grid options
  exports.getDefaultGridOptions = function() {
    return {
      columnDefs: columnDefs,
      rowData: null,
      rowSelection: 'single',
      rowHeight: 25,
      headerHeight: 25,
      suppressCellSelection: true,
      defaultColDef: { filter: true },
      onGridReady: grid_helper.gridSize,
      overlayNoRowsTemplate: '<span style="padding: 10px; border: 2px solid #444; background: lightgoldenrodyellow;">No data for this view</span>'
    };
  };

  // Create a Category record
  exports.setGridSize = function(numRows) {
    displayRows = numRows;
  };

  // Store new data array in the grid
  exports.newData = function(data) {
    gridOptions.api.setRowData(data);
    grid_helper.gridSize();
  };

  // Setup the quick filter
  exports.addQuickFilterListener = function() {
    var eInput = document.querySelector('#quickFilterInput');
    eInput.addEventListener("input", function() {
      var text = eInput.value;
      gridOptions.api.setQuickFilter(text);
      // Update the grid size because the number of displayed rows may have changed
      grid_helper.gridSize();
    });
  };

  // Dynamically resize the grid up to limit, then let scrolling take over
  exports.gridSize = function() {

    var numRowsFiltered = gridOptions.api.getModel().getRowCount();

    // Avoid ugly grey area in grid for small number of rows
    // by dynamically adjusting the grid-container div's height
    // for (header+n*rows) or less
    var gridSizeRows = displayRows;
    if (numRowsFiltered === 0) {
      // For an empty table, allow space for the 'No rows to show' message
      gridSizeRows = 3;
    } else if (numRowsFiltered < displayRows) {
      gridSizeRows = numRowsFiltered;
    }
    // Allow a small margin for borders
    var gridHeight = gridOptions.headerHeight + (gridSizeRows * gridOptions.rowHeight) + 4;
    document.getElementById('grid-container').style.height = gridHeight + 'px';

    gridOptions.api.doLayout();
    gridOptions.api.sizeColumnsToFit();
  };

  // Use code in node or browser
})(typeof exports === 'undefined' ? this.grid_helper = {} : exports);
