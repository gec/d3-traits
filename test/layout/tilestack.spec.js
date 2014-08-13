describe('d3-traits.table', function() {

  var tilestack,
      Point = d3.trait.Point,
      Size = d3.trait.Size,
      Rect = d3.trait.Rect,
      Margin = d3.trait.Margin

  beforeEach(function() {
    tilestack = d3.trait.layout.tilestack()
      .translate( function( node, x, y) { node.translate = new Point( x, y)})

  })

  var AnchorBottomLeft = new Point(0, 1),
      AnchorBottomRight = new Point(1, 1),
      AnchorBottomCenter = new Point(0.5, 1),
      AnchorTopLeft = new Point(0,0),
      AnchorMiddleLeft = new Point(0,0.5),
      AnchorMiddle = new Point(0.5,0.5)

  function makeChild( x, y, w, h, a, em) {
    em = em || 10
    return {
      em: em,
      rect: new Rect(x, y, w, h, a.x, a.y)
    }
  }
  function makeParent( children, layoutChildren) {
    return {
      children: children,
      layoutChildren: layoutChildren
    }
  }

  it('tilestack.LeftToRight should  ...', function() {

    var x = 0, y = 0,
        w = 10, h = 5,
        node = makeChild( x, y, w, h, AnchorBottomLeft, 10),
        origin = new Point()

    //tilestack.paddingEm( paddingEm)
    tilestack.layouts.LeftToRight( node, origin)
    expect( node.rect.origin.x).toEqual( 0)
    expect( node.rect.origin.y).toEqual( 0)
    expect( node.translate).toEqual( new Point(0,0))

    origin.x = 100
    tilestack.layouts.LeftToRight( node, origin)
    expect( node.rect.origin.x).toEqual( 100)
    expect( node.rect.origin.y).toEqual( 0)
    expect( node.translate).toEqual( new Point(100,0))

    node = makeChild( x, y, w, h, AnchorBottomRight, 10)
    origin.x = 100
    node.rect.origin = new Point()
    tilestack.layouts.LeftToRight( node, origin)
    expect( node.rect.origin.x).toEqual( 110)
    expect( node.rect.origin.y).toEqual( 0)
    expect( node.translate).toEqual( new Point(110,0))
  });

  it('tilestack.TopToBottom should  ...', function() {

    var x = 0, y = 0,
        w = 10, h = 5,
        node = makeChild( x, y, w, h, AnchorBottomLeft, 10),
        origin = new Point()

    //tilestack.paddingEm( paddingEm)
    tilestack.layouts.TopToBottom( node, origin)
    expect( node.rect.origin.x).toEqual( 0)
    expect( node.rect.origin.y).toEqual( 5)
    expect( node.translate).toEqual( new Point(0,5))

    origin.y = 100
    tilestack.layouts.TopToBottom( node, origin)
    expect( node.rect.origin.x).toEqual( 0)
    expect( node.rect.origin.y).toEqual( 105)
    expect( node.translate).toEqual( new Point(0,105))

    node = makeChild( x, y, w, h, AnchorBottomRight, 10)
    origin.y = 100
    node.rect.origin = new Point()
    tilestack.layouts.TopToBottom( node, origin)
    expect( node.rect.origin.x).toEqual( 0)
    expect( node.rect.origin.y).toEqual( 105)
    expect( node.translate).toEqual( new Point(0,105))
  });

  it('tilestack.utils.pack should pack nodes LeftToRight  ...', function() {

    var x = 0, y = 0,
        w = 10, h = 5,
        n1 = makeChild( x, h, w, h, AnchorBottomLeft, 10),
        n2 = makeChild( x, h, w, h, AnchorBottomLeft, 10),
        parent = makeParent( [n1, n2], 'LeftToRight'),
        origin = new Point()

    tilestack.utils.pack( parent)
    expect( parent.rect).toBeDefined()
    expect( parent.rect.origin).toEqual( new Point(0,0))
    expect( parent.rect.size).toEqual( new Size( w*2, h))
    expect( parent.translate).not.toBeDefined()

    n1.rect.anchor.x = 1
    tilestack.utils.pack( parent)
    expect( parent.rect.origin).toEqual( new Point(0,0))
    expect( parent.rect.size).toEqual( new Size( w*2, h))
    expect( n1.rect.origin).toEqual( new Point(w,h))
    expect( n2.rect.origin).toEqual( new Point(w,h))
  });

  it('tilestack.utils.pack should pack TopToBottom ...', function() {

    var x = 0, y = 0,
        w = 10, h = 5,
        n1 = makeChild( w, h, w, h, AnchorBottomRight, 10),
        n2 = makeChild( x, h, w, h, AnchorBottomLeft, 10),
        parent = makeParent( [n1, n2], 'TopToBottom'),
        origin = new Point()

    tilestack.utils.pack( parent)
    expect( parent.em).toEqual( 10)
    expect( parent.rect.origin).toEqual( new Point(0,0))
    expect( parent.rect.size).toEqual( new Size( w, h*2))
    expect( n1.rect.origin).toEqual( new Point(w,h))
    expect( n2.rect.origin).toEqual( new Point(0,h*2))

    //////expect( node.translate).toEqual( new Point(0,105))

  });

  it('tilestack.utils.pack should pack hierarchically TB, LR...', function() {

    var x = 0, y = 0,
        w = 10, h = 5,
        h1 = makeChild( 0, h, w*2, h, AnchorBottomLeft, 20),
        n1 = makeChild( w, h*4, w, h*4, AnchorBottomRight, 10),
        n2 = makeChild( x, h*4, w, h*4, AnchorBottomLeft, 10),
        header = makeParent( [h1], 'LeftToRight'),
        body = makeParent( [n1, n2], 'LeftToRight'),
        table = makeParent( [header, body], 'TopToBottom'),
        origin = new Point()

    tilestack.utils.pack( table)
    expect( n1.rect.origin).toEqual( new Point(w,h*4))
    expect( n2.rect.origin).toEqual( new Point(10,h*4))
    expect( header.rect.origin).toEqual( new Point(0,0))
    expect( body.rect.origin).toEqual( new Point(0,h))
    expect( body.rect.size).toEqual( new Size( w*2, h*4))
  });

});


