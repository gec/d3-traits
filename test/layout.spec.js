describe('d3-traits.layout', function() {


  beforeEach(function() {
  })

  it('adjustOrientationToFitWidth should flip on item left', function() {
    var inRect = new d3.trait.Rect(0, 0, 100, 0),
        items = [
          { name: 'right', rect: new d3.trait.Rect(50, 10, 10, 10) },
          // rigt doesn't fit
          { name: 'left', rect: new d3.trait.Rect(50, 10, 51, 10) }
        ]
    var array = d3.trait.layout.adjustOrientationToFitWidth(items, inRect)
    expect(items[0].rect.anchor.x).toBe(0)
    expect(items[1].rect.anchor.x).toBe(1)

    var left = array[0]
    var right = array[1]
    expect(left[0].name).toBe('left')
    expect(right[0].name).toBe('right')

    //expect( left[0] === items[1]).toBeTruthy()
    //expect( right[0] === items[0]).toBeTruthy()


  });

  it('adjustOrientationToFitWidth should flip a left item to the right', function() {
    var inRect = new d3.trait.Rect(0, 0, 100, 0),
        items = [
          { name: 'right1', rect: new d3.trait.Rect(50, 10, 10, 10) },
          // left doesn't fit (i.e. anchor.x == 1)
          { name: 'right2', rect: new d3.trait.Rect(50, 10, 51, 10, 1, 0) }
        ]
    var array = d3.trait.layout.adjustOrientationToFitWidth(items, inRect)
    expect(items[0].rect.anchor.x).toBe(0)
    expect(items[1].rect.anchor.x).toBe(0)

    var left = array[0]
    var right = array[1]
    expect(left.length).toBe(0)
    expect(right[0].name).toBe('right1')
    expect(right[1].name).toBe('right2')
  });

  it('listNudgeUpFromBottom should translate one item off bottom', function() {
    var items = [
      { name: 'static', rect: new d3.trait.Rect(10, 50, 10, 10) },
      { name: 'toolow', rect: new d3.trait.Rect(10, 100, 10, 10) }
    ]
    var array = d3.trait.layout.utils.listNudgeUpFromBottom(items, 100)
    expect(items[0].rect.origin.y).toBe(50)
    expect(items[1].rect.origin.y).toBe(90)
  });

  it('listNudgeUpFromBottom should translate one item off bottom and the one above', function() {
    var items = [
      { name: 'nudge', rect: new d3.trait.Rect(10, 90, 10, 10) },
      { name: 'toolow', rect: new d3.trait.Rect(10, 100, 10, 10) }
    ]
    var array = d3.trait.layout.utils.listNudgeUpFromBottom(items, 100)
    expect(items[0].rect.origin.y).toBe(80)
    expect(items[1].rect.origin.y).toBe(90)
  });

  it('listNudgeUpFromBottom should translate one item that overlaps another', function() {
    var items = [
      { name: 'nudge', rect: new d3.trait.Rect(10, 51, 10, 10) },
      { name: 'toolow', rect: new d3.trait.Rect(10, 60, 10, 10) }
    ]
    var array = d3.trait.layout.utils.listNudgeUpFromBottom(items, 100)
    expect(items[0].rect.origin.y).toBe(50)
    expect(items[1].rect.origin.y).toBe(60)
  });


  it('removeOverlapFromTop should translate one item off the top', function() {
    var inRect = new d3.trait.Rect(0, 0, 100, 100),
        items = [
          { name: 'nudge', rect: new d3.trait.Rect(10, -1, 10, 10) },
          { name: 'static', rect: new d3.trait.Rect(10, 60, 10, 10) }
        ]
    var array = d3.trait.layout.utils.removeOverlapFromTop(items, inRect)
    expect(items[0].rect.origin.y).toBe(0)
    expect(items[1].rect.origin.y).toBe(60)
  });

  it('removeOverlapFromTop should translate one item off the top and one below', function() {
    var inRect = new d3.trait.Rect(0, 0, 100, 100),
        items = [
          { name: 'nudge', rect: new d3.trait.Rect(10, -1, 10, 10) },
          { name: 'collide', rect: new d3.trait.Rect(10, 5, 10, 10) }
        ]
    var array = d3.trait.layout.utils.removeOverlapFromTop(items, inRect)
    expect(items[0].rect.origin.y).toBe(0)
    expect(items[1].rect.origin.y).toBe(10)
  });

  it('removeOverlapFromTop should translate for minOverlap', function() {
    var inRect = new d3.trait.Rect(0, 0, 100, 100),
        items = [
          { name: 'nudge', rect: new d3.trait.Rect(10, 0, 10, 10) },
          { name: 'nudge', rect: new d3.trait.Rect(10, 5, 10, 10) },
          { name: 'nudge', rect: new d3.trait.Rect(10, 50, 10, 10) }
        ]
    var array = d3.trait.layout.utils.removeOverlapFromTop(items, inRect, 1)
    expect(items[0].rect.origin.y).toBe(-1)
    expect(items[1].rect.origin.y).toBe(8)
    expect(items[2].rect.origin.y).toBe(17)
  });

  it('listBalanceFromTop should translate two items up', function() {
    var inRect = new d3.trait.Rect(0, 0, 100, 100),
        items = [
          { name: 'toolow', rect: new d3.trait.Rect(10, 50, 10, 10) },
          { name: 'toolow', rect: new d3.trait.Rect(10, 60, 10, 10) }
        ],
        originalYs = [ 40, 50]

    var array = d3.trait.layout.utils.listBalanceFromTop(items, inRect, originalYs)
    expect(items[0].rect.origin.y).toBe(40)
    expect(items[1].rect.origin.y).toBe(50)
  });

  it('listBalanceFromTop should translate one item down', function() {
    var inRect = new d3.trait.Rect(0, 0, 100, 100),
        items = [
          { name: 'toohigh', rect: new d3.trait.Rect(10, 50, 10, 10) },
          { name: 'static', rect: new d3.trait.Rect(10, 70, 10, 10) }
        ],
        originalYs = [ 52, 70]

    var array = d3.trait.layout.utils.listBalanceFromTop(items, inRect, originalYs)
    expect(items[0].rect.origin.y).toBe(52)
    expect(items[1].rect.origin.y).toBe(70)
  });

  it('listBalanceFromTop should translate two items down', function() {
    var inRect = new d3.trait.Rect(0, 0, 100, 100),
        items = [
          { name: 'toohigh', rect: new d3.trait.Rect(10, 50, 10, 10) },
          { name: 'toohigh', rect: new d3.trait.Rect(10, 60, 10, 10) }
        ],
        originalYs = [ 60, 70]

    var array = d3.trait.layout.utils.listBalanceFromTop(items, inRect, originalYs)
    expect(items[0].rect.origin.y).toBe(60)
    expect(items[1].rect.origin.y).toBe(70)
  });

  it('listBalanceFromTop should translate two items down', function() {
    var inRect = new d3.trait.Rect(0, 0, 100, 100),
        items = [
          { name: 'toohigh', rect: new d3.trait.Rect(10, 0, 10, 10) },
          { name: 'toohigh', rect: new d3.trait.Rect(10, 10, 10, 10) }
        ],
        originalYs = [ 10, 20]

    var array = d3.trait.layout.utils.listBalanceFromTop(items, inRect, originalYs)
    expect(items[0].rect.origin.y).toBe(10)
    expect(items[1].rect.origin.y).toBe(20)
  });

  it('listBalanceFromTop should translate three items up', function() {
    var inRect = new d3.trait.Rect(0, 0, 100, 100),
        items = [
          { name: 'toolow', rect: new d3.trait.Rect(10, 0, 10, 10) },
          { name: 'toolow', rect: new d3.trait.Rect(10, 10, 10, 10) },
          { name: 'toolow', rect: new d3.trait.Rect(10, 22, 10, 10) }
        ],
        originalYs = [ 10, 20, 0]

    var array = d3.trait.layout.utils.listBalanceFromTop(items, inRect, originalYs)
    expect(items[0].rect.origin.y).toBe(0)
    expect(items[1].rect.origin.y).toBe(10)
    expect(items[2].rect.origin.y).toBe(20)
  });

  it('listBalanceFromTop should translate three items down', function() {
    var inRect = new d3.trait.Rect(0, 0, 100, 100),
        items = [
          { name: 'toohigh', rect: new d3.trait.Rect(10, 0, 10, 10) },
          { name: 'toohigh', rect: new d3.trait.Rect(10, 10, 10, 10) },
          { name: 'static', rect: new d3.trait.Rect(10, 22, 10, 10) }
        ],
        originalYs = [ 10, 20, 30]

    var array = d3.trait.layout.utils.listBalanceFromTop(items, inRect, originalYs)
    expect(items[0].rect.origin.y).toBe(10)
    expect(items[1].rect.origin.y).toBe(20)
    expect(items[2].rect.origin.y).toBe(30)
  });

  it('listBalanceFromTop should see three items in tension, but balanced', function() {
    var inRect = new d3.trait.Rect(0, 0, 100, 100),
        items = [
          { name: 'static', rect: new d3.trait.Rect(10, 0, 10, 10) },
          { name: 'static', rect: new d3.trait.Rect(10, 10, 10, 10) },
          { name: 'static', rect: new d3.trait.Rect(10, 20, 10, 10) }
        ],
        originalYs = [ 10, 10, 10]

    var array = d3.trait.layout.utils.listBalanceFromTop(items, inRect, originalYs)
    expect(items[0].rect.origin.y).toBe(0)
    expect(items[1].rect.origin.y).toBe(10)
    expect(items[2].rect.origin.y).toBe(20)
  });


  it('layoutByOrientation should layout one rect on left', function() {
    var inRect = new d3.trait.Rect(),
        item1 = { rect: new d3.trait.Rect(10, 0, 10, 0, 1, 0) }
    d3.trait.layout.byOrientation([item1], inRect, 'left')
    expect(item1.rect.origin).toEqual( new d3.trait.Point(10, 0))

    item1 = { rect: new d3.trait.Rect(20, 0, 10, 0, 1, 0) }
    d3.trait.layout.byOrientation([item1], inRect, 'left')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 10, 0))

    item1 = { rect: new d3.trait.Rect(0, 0, 10, 0, 1, 0) }
    d3.trait.layout.byOrientation([item1], inRect, 'left')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 10, 0))

    item1 = { rect: new d3.trait.Rect(0, 0, 10, 0) }
    d3.trait.layout.byOrientation([item1], inRect, 'left')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 0, 0))

    item1 = { rect: new d3.trait.Rect(10, 0, 10, 0) }
    d3.trait.layout.byOrientation([item1], inRect, 'left')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 0, 0))
  });

  it('layoutByOrientation should layout two rects on left', function() {

    var inRect = new d3.trait.Rect(),
        item1 = { rect: new d3.trait.Rect(0, 0, 10, 0, 1, 0) },
        item2 = { rect: new d3.trait.Rect(0, 0, 10, 0, 1, 0) }
    d3.trait.layout.byOrientation([item1, item2], inRect, 'left')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 10, 0))
    expect(item2.rect.origin).toEqual(new d3.trait.Point( 20, 0))

    item1 = { rect: new d3.trait.Rect(10, 0, 10, 0, 1, 0) }
    item2 = { rect: new d3.trait.Rect(10, 0, 10, 0, 1, 0) }
    d3.trait.layout.byOrientation([item1, item2], inRect, 'left')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 10, 0))
    expect(item2.rect.origin).toEqual(new d3.trait.Point( 20, 0))

    item1 = { rect: new d3.trait.Rect(10, 0, 20, 0, 1, 0) }
    item2 = { rect: new d3.trait.Rect(10, 0, 10, 0, 1, 0) }
    d3.trait.layout.byOrientation([item1, item2], inRect, 'left')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 20, 0))
    expect(item2.rect.origin).toEqual(new d3.trait.Point( 30, 0))

    item1 = { rect: new d3.trait.Rect(10, 0, 20, 0) }
    item2 = { rect: new d3.trait.Rect(10, 0, 10, 0) }
    d3.trait.layout.byOrientation([item1, item2], inRect, 'left')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 0, 0))
    expect(item2.rect.origin).toEqual(new d3.trait.Point( 20, 0))
  });

  it('layoutByOrientation should layout one rect on right', function() {
    var inRect = new d3.trait.Rect(0, 0, 100, 0),
        item1 = { rect: new d3.trait.Rect(10, 0, 10, 0) }
    d3.trait.layout.byOrientation([item1], inRect, 'right')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 90, 0))

    item1 = { rect: new d3.trait.Rect(110, 0, 10, 0) }
    d3.trait.layout.byOrientation([item1], inRect, 'right')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 90, 0))

    item1 = { rect: new d3.trait.Rect(0, 0, 10, 0) }
    d3.trait.layout.byOrientation([item1], inRect, 'right')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 90, 0))


    item1 = { rect: new d3.trait.Rect(0, 0, 10, 0, 1, 0) }
    d3.trait.layout.byOrientation([item1], inRect, 'right')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 100, 0))
  });

  it('layoutByOrientation should layout two rects on right', function() {

    var inRect = new d3.trait.Rect(0, 0, 100, 0),
        item1 = { rect: new d3.trait.Rect(0, 0, 10, 0) },
        item2 = { rect: new d3.trait.Rect(0, 0, 10, 0) }
    d3.trait.layout.byOrientation([item1, item2], inRect, 'right')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 80, 0))
    expect(item2.rect.origin).toEqual(new d3.trait.Point( 90, 0))

    item1 = { rect: new d3.trait.Rect(100, 0, 10, 0) }
    item2 = { rect: new d3.trait.Rect(100, 0, 10, 0) }
    d3.trait.layout.byOrientation([item1, item2], inRect, 'right')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 80, 0))
    expect(item2.rect.origin).toEqual(new d3.trait.Point( 90, 0))

    item1 = { rect: new d3.trait.Rect(10, 0, 20, 0) }
    item2 = { rect: new d3.trait.Rect(10, 0, 10, 0) }
    d3.trait.layout.byOrientation([item1, item2], inRect, 'right')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 70, 0))
    expect(item2.rect.origin).toEqual(new d3.trait.Point( 90, 0))

    item1 = { rect: new d3.trait.Rect(10, 0, 20, 0, 1, 0) }
    item2 = { rect: new d3.trait.Rect(10, 0, 10, 0, 1, 0) }
    d3.trait.layout.byOrientation([item1, item2], inRect, 'right')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 90, 0))
    expect(item2.rect.origin).toEqual(new d3.trait.Point( 100, 0))
  });

  it('layoutByOrientation should layout one rect on top', function() {
    var inRect = new d3.trait.Rect(),
        item1 = { rect: new d3.trait.Rect(0, 10, 0, 10, 0, 1) }
    d3.trait.layout.byOrientation([item1], inRect, 'top')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 0, 10))

    item1 = { rect: new d3.trait.Rect(0, 20, 0, 10, 0, 1) }
    d3.trait.layout.byOrientation([item1], inRect, 'top')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 0, 10))

    item1 = { rect: new d3.trait.Rect(0, 0, 0, 10, 0, 1) }
    d3.trait.layout.byOrientation([item1], inRect, 'top')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 0, 10))

    item1 = { rect: new d3.trait.Rect(0, 0, 0, 10) }
    d3.trait.layout.byOrientation([item1], inRect, 'top')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 0, 0))

    item1 = { rect: new d3.trait.Rect(0, 10, 0, 10) }
    d3.trait.layout.byOrientation([item1], inRect, 'top')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 0, 0))
  });

  it('layoutByOrientation should layout two rects on top', function() {

    var inRect = new d3.trait.Rect(),
        item1 = { rect: new d3.trait.Rect(0, 0, 0, 10, 0, 1) },
        item2 = { rect: new d3.trait.Rect(0, 0, 0, 10, 0, 1) }
    d3.trait.layout.byOrientation([item1, item2], inRect, 'top')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 0, 10))
    expect(item2.rect.origin).toEqual(new d3.trait.Point( 0, 20))

    item1 = { rect: new d3.trait.Rect(0, 10, 0, 10, 0, 1) }
    item2 = { rect: new d3.trait.Rect(0, 10, 0, 10, 0, 1) }
    d3.trait.layout.byOrientation([item1, item2], inRect, 'top')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 0, 10))
    expect(item2.rect.origin).toEqual(new d3.trait.Point( 0, 20))

    item1 = { rect: new d3.trait.Rect(0, 10, 0, 20, 0, 1) }
    item2 = { rect: new d3.trait.Rect(0, 10, 0, 10, 0, 1) }
    d3.trait.layout.byOrientation([item1, item2], inRect, 'top')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 0, 20))
    expect(item2.rect.origin).toEqual(new d3.trait.Point( 0, 30))

    item1 = { rect: new d3.trait.Rect(0, 10, 0, 20) }
    item2 = { rect: new d3.trait.Rect(0, 10, 0, 10) }
    d3.trait.layout.byOrientation([item1, item2], inRect, 'top')
    expect(item1.rect.origin).toEqual(new d3.trait.Point( 0, 0))
    expect(item2.rect.origin).toEqual(new d3.trait.Point( 0, 20))
  });

  function makeRowOfColWidths( colWidths, height) {
    return colWidths.map( function( colWidth) {
      return { rect: new d3.trait.Rect( new d3.trait.Point(), new d3.trait.Size( colWidth, height))}
    })
  }

  function makeRowsFromColWidths( rowsOfColWidths, height) {
    return rowsOfColWidths.map( function( colWidths) {
      return makeRowOfColWidths( colWidths, height)
    })
  }

  it('pack.utils.colWidthsMax should  ...', function() {

    var colWidthsMax, rows,
        colWidths1 = [10, 0, 20],
        colWidths2 = [8, 10, 10],
        height = 10

    rows = makeRowsFromColWidths( [colWidths1], height)
    colWidthsMax = d3.trait.layout.pack.utils.colWidthsMax( rows)
    expect( colWidthsMax).toEqual( [colWidths1[0], colWidths1[1], colWidths1[2]])

    rows = makeRowsFromColWidths( [colWidths1, colWidths2], height)
    colWidthsMax = d3.trait.layout.pack.utils.colWidthsMax( rows)
    expect( colWidthsMax).toEqual( [colWidths1[0], colWidths2[1], colWidths1[2]])

  });

  it('pack.utils.lineHeightFromRow should  ...', function() {

    var lineHeight, rows,
        colWidths1 = [10, 0, 20],
        colWidths2 = [8, 10, 10],
        padding1 = new d3.trait.Margin( 10),
        padding2 = new d3.trait.Margin( 10),
        padding3 = new d3.trait.Margin( 10),
        colPaddings = [padding1, padding2, padding3],
        height = 10

    rows = makeRowsFromColWidths( [colWidths1], height)
    lineHeight = d3.trait.layout.pack.utils.lineHeightFromRow( rows[0], colPaddings)
    expect( lineHeight).toEqual(
      Math.max( height + padding1.top + padding1.bottom,
        Math.max( height + padding2.top + padding2.bottom,
                  height + padding3.top + padding3.bottom)

      )
    )

  });

  it('pack.utils.colOriginsX should  ...', function() {

    var lineHeight, rows, originsX,
        colWidths1 = [10, 0, 20],
        colWidths2 = [8, 10, 10],
        padding1 = new d3.trait.Margin( 10),
        padding2 = new d3.trait.Margin( 10),
        padding3 = new d3.trait.Margin( 10),
        colPaddings = [padding1, padding2, padding3],
        colJustifications = [ {horizontal: 'left'}, {horizontal: 'right'}, {horizontal: 'left'}],
        origin = new d3.trait.Point()
        height = 10

    rows = makeRowsFromColWidths( [colWidths1], height)
    originsX = d3.trait.layout.pack.utils.colOriginsX( rows, origin, colPaddings, colJustifications)

    var x1 = origin.x + padding1.left,
        x2 = x1 + colWidths1[0] + padding1.right + padding2.left + colWidths1[1],// right justified.
        x3 = x2 + padding2.right + padding3.left
    expect( originsX).toEqual( [ x1, x2, x3 ])
  });

  it('pack.utils.row should  ...', function() {

    var lineHeight, rows, colOriginsX,
        colWidths1 = [10, 0, 20],
        colWidths2 = [8, 10, 10],
        padding1 = new d3.trait.Margin( 10),
        padding2 = new d3.trait.Margin( 10),
        padding3 = new d3.trait.Margin( 10),
        colPaddings = [padding1, padding2, padding3],
        colJustifications = [
          {horizontal: 'left'},
          {horizontal: 'right'},
          {horizontal: 'left'}
        ],
        height = 10,
        y = 0

    rows = makeRowsFromColWidths( [colWidths1], height)
    lineHeight = d3.trait.layout.pack.utils.lineHeightFromRow( rows[0], colPaddings)
    colOriginsX = d3.trait.layout.pack.utils.colOriginsX( rows, new d3.trait.Point(), colPaddings, colJustifications)

    d3.trait.layout.pack.utils.row( rows[0], colOriginsX, colPaddings, colJustifications, lineHeight, y)

    var r1 = rows[0][0].rect,
        r2 = rows[0][1].rect,
        r3 = rows[0][2].rect,
        y1 = y + padding1.top + r1.size.height,
        y2 = y1 + padding1.bottom + padding2.top + r2.size.height,
        y3 = y2 + padding2.bottom  + padding3.top + r3.size.height
    expect( r1.origin).toEqual( new d3.trait.Point( colOriginsX[0], y1))

  });

  it('pack.rows should layout ...', function() {

    var p = new d3.trait.Point(),
        s = new d3.trait.Size( 10, 10),
        c1 = { rect: new d3.trait.Rect( p, s)},
        c2 = { rect: new d3.trait.Rect( p, s)},
        c3 = { rect: new d3.trait.Rect( p, s)},
        row1 = [c1, c2, c3],
        rows = [ row1 ],
        padding1 = new d3.trait.Margin( 10),
        padding2 = new d3.trait.Margin( 10),
        padding3 = new d3.trait.Margin( 10),
        colPaddings = [padding1, padding2, padding3],
        colJustifications = [ {horizontal: 'left'}, {horizontal: 'right'}, {horizontal: 'left'}],
        origin = new d3.trait.Point(100, 100)

    d3.trait.layout.pack.rows( rows, origin, colPaddings, colJustifications)

    var y1 = origin.y + padding1.top + c1.rect.size.height,
        x1 = origin.x + padding1.left,
        x2 = x1 + c1.rect.size.width + padding1.right + padding2.left + c2.rect.size.width,  // right justified.
        x3 = x2 + padding2.right + padding3.left

    expect(c1.rect.origin).toEqual(new d3.trait.Point( x1, y1))
    expect(c2.rect.origin).toEqual(new d3.trait.Point( x2, y1))
    expect(c3.rect.origin).toEqual(new d3.trait.Point( x3, y1))

  });


});


