describe('d3-traits.table', function() {


  beforeEach(function() {
  })

  // [{rect: }, {rect:}]
  function makeTds( colCount, width, height) {
    var tds = []
    for( var i = 0; i < colCount; i++) {
      var origin = new d3.trait.Point(),
          w = d3.trait.utils.getValueOrArrayItem( width, i, 0),
          h = d3.trait.utils.getValueOrArrayItem( height, i, 0),
          size = new d3.trait.Size( w, h),
          anchor = new d3.trait.Point( i % 2, 1)
          td = { rect: new d3.trait.Rect( origin, size, anchor)}
      tds.push(td)
    }
    return tds
  }

  /**
   *
   * table: {
   *    rect:,  // rect for whole table
   *    children: [
   *      {
   *        rect:,  // rect for tr.
   *        children: [
   *          {
   *            rect:,  // rect for td
   *          },
   *          ...
   *        ]
   *      },
   *      ...
   * }
   *
   */
  function makeTrs( rowCount, colCount, width, height) {
    var trs = []
    for( var i = 0; i < rowCount; i++) {
      var w = d3.trait.utils.getValueOrArrayItem( width, i, 0),
          h = d3.trait.utils.getValueOrArrayItem( height, i, 0),
          tds = makeTds( colCount, w, h)
      trs.push( { rect: new d3.trait.Rect(), children: tds})
    }
    return trs
  }

  function makeTable( rowCount, colCount, width, height, padding, textAlign, verticalAlign) {
    var trs = makeTrs( rowCount, colCount, width, height)
    return {
      rect: new d3.trait.Rect(),
      children: trs
    }
  }

  function textAlignLRL( node, depth, row, col) {
    return col === 0 ? 'left'
      : col === 1 ? 'right'
      : 'left'
  }
  function textAlignRLR( node, depth, row, col) {
    return col === 0 ? 'right'
      : col === 1 ? 'left'
      : 'right'
  }


  it('layout.table.utils.calculateColWidths should  ...', function() {

    var colWidths, table,
        layout = d3.trait.layout.table(),
        colWidths1 = [10, 0, 20],
        colWidths2 = [8, 10, 10],
        height = 10

    table = makeTable( 2, 3, [colWidths1], height)

    layout.utils.setDepthOnNodes( table, 0)
    colWidths = layout.utils.calculateColWidths( table.children)
    expect( colWidths).toEqual( [colWidths1[0], colWidths1[1], colWidths1[2]])

    table = makeTable( 2, 3, [colWidths1, colWidths2], height)
    layout.utils.setDepthOnNodes( table, 0)
    colWidths = layout.utils.calculateColWidths( table.children)
    expect( colWidths).toEqual( [colWidths1[0], colWidths2[1], colWidths1[2]])

  });

  it('layout.table.utils.calculateColWidths should process colspans', function() {

    var colWidths, table, tds, header,
        layout = d3.trait.layout.table(),
        colWidths1 = [10, 0, 20],
        colWidths2 = [8, 10, 10],
        totalWidth = colWidths1[0] + colWidths2[1] + colWidths1[2],
        height = 10

    table = makeTable( 2, 3, [colWidths1, colWidths2], height)

    // Add a header row that spans all three columns.
    tds = makeTds( 1, 30, height),
    header = { rect: new d3.trait.Rect(), children:tds}
    tds[0].colspan = 3
    table.children.unshift( header)

    // Header fits within calculated column widths for non-header rows.
    //
    layout.utils.setDepthOnNodes( table, 0)
    colWidths = layout.utils.calculateColWidths( table.children)
    expect( colWidths).toEqual( [colWidths1[0], colWidths2[1], colWidths1[2]])

    // Header bigger than calculated column widths for non-header rows.
    // Need to stretch all column widths to fit header.
    //
    tds[0].rect.size.width = 80
    colWidths = layout.utils.calculateColWidths( table.children)
    expect( colWidths).toEqual( [colWidths1[0]+14, colWidths2[1]+13, colWidths1[2]+13])

  });

  it('layout.table.utils.calculateRowHeight should work with various paddings', function() {

    var rowHeight, table, rows,
        layout = d3.trait.layout.table(),
        colWidths1 = [10, 0, 20],
        height = 10

    table = makeTable( 1, 3, [colWidths1], height)
    layout.padding( 10)

    layout.utils.setDepthOnNodes( table, 0)
    rowHeight = layout.utils.calculateRowHeight( table.children[0], 0)
    expect( rowHeight).toEqual(  30)


    function pad( node, depth, row, col) {
      return col + 10
    }
    layout.padding( pad)
    rowHeight = layout.utils.calculateRowHeight( table.children[0], 0)
    expect( rowHeight).toEqual(  34)
  });

  it('layout.table.utils.nodeOriginInCellRect should align text left, center, and right.', function() {

    var origin,
        layout = d3.trait.layout.table(),
        cellRect = new d3.trait.Rect( 0, 0, 10, 8),
        node = {
          rect: new d3.trait.Rect( 0, 0, 3, 2),  // x, y, w, h
          depth: 2
        },
        padding = 0

    origin = layout.utils.nodeOriginInCellRect( node, 0, 0, cellRect)
    expect( origin).toEqual( new d3.trait.Point( padding, cellRect.maxY() - padding))

    layout.padding( padding = 1)
    origin = layout.utils.nodeOriginInCellRect( node, 0, 0, cellRect)
    expect( origin).toEqual( new d3.trait.Point( padding, cellRect.maxY() - padding))

    layout.textAlign( 'right')
    origin = layout.utils.nodeOriginInCellRect( node, 0, 0, cellRect)
    expect( origin).toEqual( new d3.trait.Point( cellRect.maxX() - padding, cellRect.maxY() - padding))

    layout.textAlign( 'center')
    origin = layout.utils.nodeOriginInCellRect( node, 0, 0, cellRect)
    expect( origin).toEqual( new d3.trait.Point( cellRect.midX(), cellRect.maxY() - padding))

    layout.textAlign( 'left')
    origin = layout.utils.nodeOriginInCellRect( node, 0, 0, cellRect)
    expect( origin).toEqual( new d3.trait.Point( padding, cellRect.maxY() - padding))

  });

  it('layout.table.utils.nodeOriginInCellRect should align text top, middle, bottom.', function() {

    var origin,
        layout = d3.trait.layout.table(),
        cellRect = new d3.trait.Rect( 0, 0, 10, 8),
        node = {
          rect: new d3.trait.Rect( 0, 0, 3, 2),  // x, y, w, h
          depth: 2
        },
        padding = 1

    layout.padding( padding)
    origin = layout.utils.nodeOriginInCellRect( node, 0, 0, cellRect)
    expect( origin).toEqual( new d3.trait.Point( padding, cellRect.maxY() - padding))

    layout.verticalAlign( 'top')
    origin = layout.utils.nodeOriginInCellRect( node, 0, 0, cellRect)
    expect( origin).toEqual( new d3.trait.Point( padding, cellRect.minY() + padding))

    layout.verticalAlign( 'middle')
    origin = layout.utils.nodeOriginInCellRect( node, 0, 0, cellRect)
    expect( origin).toEqual( new d3.trait.Point( padding, cellRect.midY()))

    layout.verticalAlign( 'bottom')
    origin = layout.utils.nodeOriginInCellRect( node, 0, 0, cellRect)
    expect( origin).toEqual( new d3.trait.Point( padding, cellRect.maxY() - padding))
  });

  it('layout.table.utils.nodeOriginInCellRect should calculate heterogeneous padding non-0 cellRect.origin.', function() {

    var origin,
        layout = d3.trait.layout.table(),
        cellRect = new d3.trait.Rect( 0, 0, 20, 10),
        node = {
          rect: new d3.trait.Rect( 0, 0, 4, 2),  // x, y, w, h
          depth: 2
        },
        padding = new d3.trait.Margin( 1, 2, 3, 4) // top, right, bottom, left

    layout.padding( padding)
    //layout.textAlign( 'left')
    origin = layout.utils.nodeOriginInCellRect( node, 0, 0, cellRect)
    expect( origin).toEqual( new d3.trait.Point( padding.left, cellRect.maxY() - padding.bottom))

    layout.textAlign( 'right')
      .verticalAlign( 'top')
    origin = layout.utils.nodeOriginInCellRect( node, 0, 0, cellRect)
    expect( origin).toEqual( new d3.trait.Point( cellRect.maxX() - padding.right, cellRect.minY() + padding.top))

    cellRect.origin.x = 100
    cellRect.origin.y = 200
    origin = layout.utils.nodeOriginInCellRect( node, 0, 0, cellRect)
    expect( origin).toEqual( new d3.trait.Point( cellRect.maxX() - padding.right, cellRect.minY() + padding.top))

    layout.textAlign( 'left')
      .verticalAlign( 'bottom')
    origin = layout.utils.nodeOriginInCellRect( node, 0, 0, cellRect)
    expect( origin).toEqual( new d3.trait.Point( cellRect.minX() + padding.left, cellRect.maxY() - padding.bottom))
  });

  it('table.utils.layoutRow should  ...', function() {

    var rowHeight, table, row, colWidths,
        layout = d3.trait.layout.table(),
        colWidths1 = [10, 0, 20],
        height = 10

    function padding( node, depth, row, col) {
      return new d3.trait.Margin( 5+col, 10+col) // top/bottom, right/left
    }

    layout.padding( padding)
      .textAlign( textAlignLRL)

    table = makeTable( 1, 3, [colWidths1], height)
    row = table.children[0]
    layout.utils.setDepthOnNodes( table, 0)
    colWidths = layout.utils.calculateColWidths( table.children)
    rowHeight = layout.utils.calculateRowHeight( table.children[0], 0)
    expect( rowHeight).toEqual( 24)
    row.rect.origin.x = 100
    row.rect.origin.y = 200  // node y is relative to row, so shouldn't include 100
    row.rect.size.height = rowHeight
    layout.utils.layoutRow( row, 0, colWidths)

    var r1 = row.children[0].rect,
        r2 = row.children[1].rect,
        r3 = row.children[2].rect
    expect( r1.origin).toEqual( new d3.trait.Point( 10, rowHeight - 5))
    expect( r2.origin).toEqual( new d3.trait.Point( colWidths[0] + colWidths[1] - 11, rowHeight - 6))
    expect( r3.origin).toEqual( new d3.trait.Point( colWidths[0] + colWidths[1] + 12, rowHeight - 7))

  });

  it('table.utils.layoutRow should handle colspans', function() {

    var rowHeight, table, row, colWidths,
        layout = d3.trait.layout.table(),
        colWidths1 = [10, 0, 20],
        totalWidths = d3.sum( colWidths1)
        height = 10

    function padding( node, depth, row, col) {
      return new d3.trait.Margin( 5+col, 10+col) // top/bottom, right/left
    }

    layout.padding( padding)
      .textAlign( textAlignRLR)   // first row is right, so header is right.

    table = makeTable( 1, 3, [colWidths1], height)
    // Add a header row that spans all three columns.
    tds = makeTds( 1, 30, height),
      header = { rect: new d3.trait.Rect(), children:tds}
    tds[0].colspan = 3
    table.children.unshift( header)

    row = table.children[0]
    layout.utils.setDepthOnNodes( table, 0)
    colWidths = layout.utils.calculateColWidths( table.children)
    rowHeight = layout.utils.calculateRowHeight( table.children[0], 0)
    expect( rowHeight).toEqual( 20)  // just one row and column
    row.rect.origin.x = 100
    row.rect.origin.y = 200  // node y is relative to row, so shouldn't include 100
    row.rect.size.height = rowHeight
    layout.utils.layoutRow( row, 0, colWidths)

    var r1 = row.children[0].rect
    expect( r1.origin).toEqual( new d3.trait.Point( totalWidths - 10 , rowHeight - 5))
  });

  it('layout.table should layout rows and columns ...', function() {

    var table, row,
        layout = d3.trait.layout.table(),
        colWidths1 = [5, 10, 20],
        height = 10,
        padding = new d3.trait.Margin( 5, 10),  // top/bottom, right/left
        rowWidth = d3.sum( colWidths1, function( d) { return padding.left + d + padding.right}),
        rowHeight = padding.top + height + padding.bottom,
        rowCount = 2,
        colCount = 3

    layout.padding( padding)
      .textAlign( textAlignLRL)

    table = makeTable( rowCount, colCount, [colWidths1], height)
    layout( table)

    expect( table.rect.size.width).toEqual( rowWidth)
    expect( table.rect.size.height).toEqual( rowHeight * rowCount)

    // Row rects
    var r1 = table.children[0].rect,
        r2 = table.children[1].rect
    expect( r1.origin).toEqual( new d3.trait.Point( 0, 0 * rowHeight))
    expect( r2.origin).toEqual( new d3.trait.Point( 0, 1 * rowHeight))

    expect( r1.size).toEqual( new d3.trait.Size( rowWidth, rowHeight))
    expect( r2.size).toEqual( new d3.trait.Size( rowWidth, rowHeight))

    // Col rects for row 1
    var x = 0,
        row = table.children[0],
        cols = row.children
    x += padding.left   // textAlign left
    expect( cols[0].rect.origin).toEqual( new d3.trait.Point( x, 1 * rowHeight - padding.bottom))
    x += colWidths1[0] + padding.right
    x += padding.left + colWidths1[1]  // textAlign right
    expect( cols[1].rect.origin).toEqual( new d3.trait.Point( x, 1 * rowHeight - padding.bottom))
    x += padding.right + padding.left   // textAlign left
    expect( cols[2].rect.origin).toEqual( new d3.trait.Point( x, 1 * rowHeight - padding.bottom))

    // Col rects for row 2
    x = 0
    row = table.children[1]
    cols = row.children
    x += padding.left   // textAlign left
    expect( cols[0].rect.origin).toEqual( new d3.trait.Point( x, 1 * rowHeight - padding.bottom))
    x += colWidths1[0] + padding.right
    x += padding.left + colWidths1[1]  // textAlign right
    expect( cols[1].rect.origin).toEqual( new d3.trait.Point( x, 1 * rowHeight - padding.bottom))
    x += padding.right + padding.left   // textAlign left
    expect( cols[2].rect.origin).toEqual( new d3.trait.Point( x, 1 * rowHeight - padding.bottom))

  });


});


