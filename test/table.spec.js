describe('d3-traits.table', function() {


  beforeEach(function() {
  })

  // [{rect: }, {rect:}]
  function makeTds( colCount, width, height) {
    var tds = []
    for( var i = 0; i < colCount; i++) {
      var w = d3.trait.utils.getValueOrArrayItem( width, i, 0),
          h = d3.trait.utils.getValueOrArrayItem( height, i, 0),
          td = { rect: new d3.trait.Rect( new d3.trait.Point(), new d3.trait.Size( w, h))}
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
    function textAlign( node, depth, row, col) {
      return col === 0 ? 'left'
        : col === 1 ? 'right'
        : 'left'
    }

    layout.padding( padding)
      .textAlign( textAlign)

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

//  it('table.layout should layout ...', function() {
//
//    var p = new d3.trait.Point(),
//        s = new d3.trait.Size( 10, 10),
//        c1 = { rect: new d3.trait.Rect( p, s)},
//        c2 = { rect: new d3.trait.Rect( p, s)},
//        c3 = { rect: new d3.trait.Rect( p, s)},
//        row1 = [c1, c2, c3],
//        rows = [ row1 ],
//        padding1 = new d3.trait.Margin( 10),
//        padding2 = new d3.trait.Margin( 10),
//        padding3 = new d3.trait.Margin( 10),
//        colPaddings = [padding1, padding2, padding3],
//        colJustifications = [
//          {horizontal: 'left'},   // vertical defaults to 'bottom'.
//          {horizontal: 'right'},
//          {horizontal: 'left'}
//        ],
//        origin = new d3.trait.Point(100, 100)
//
//    d3.trait.table.layout( rows, origin, colPaddings, colJustifications)
//
//    var y1 = origin.y + padding1.top + c1.rect.size.height,
//        x1 = origin.x + padding1.left,
//        x2 = x1 + c1.rect.size.width + padding1.right + padding2.left + c2.rect.size.width,  // right justified.
//        x3 = x2 + padding2.right + padding3.left
//
//    expect(c1.rect.origin).toEqual(new d3.trait.Point( x1, y1))
//    expect(c2.rect.origin).toEqual(new d3.trait.Point( x2, y1))
//    expect(c3.rect.origin).toEqual(new d3.trait.Point( x3, y1))
//
//  });


});


