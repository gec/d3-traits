
describe('d3-traits.layout', function() {

    beforeEach(function() {
    })

    it('should create a Point', function() {
        var p = new d3.trait.Point( 1, 2)
        expect( p.x).toBe( 1)
        expect( p.y).toBe( 2)
    });

    it('should create a Size', function() {
        var s = new d3.trait.Size( 1, 2)
        expect( s.width).toBe( 1)
        expect( s.height).toBe( 2)
    });

    it('should create a Margin top, left, bottom, right', function() {
        var m = new d3.trait.Margin( 1, 2, 3, 4)
        expect( m.top).toBe( 1)
        expect( m.right).toBe( 2)
        expect( m.bottom).toBe( 3)
        expect( m.left).toBe( 4)
    });

    it('should create a Margin top, right-left, bottom', function() {
        var m = new d3.trait.Margin( 1, 2, 3)
        expect( m.top).toBe( 1)
        expect( m.right).toBe( 2)
        expect( m.bottom).toBe( 3)
        expect( m.left).toBe( 2)
    });

    it('should create a Margin top-bottom, right-left', function() {
        var m = new d3.trait.Margin( 1, 2)
        expect( m.top).toBe( 1)
        expect( m.right).toBe( 2)
        expect( m.bottom).toBe( 1)
        expect( m.left).toBe( 2)
    });

    it('should create a Margin( n)', function() {
        var m = new d3.trait.Margin( 1)
        expect( m.top).toBe( 1)
        expect( m.right).toBe( 1)
        expect( m.bottom).toBe( 1)
        expect( m.left).toBe( 1)
    });

    it('should create a default Margin()', function() {
        var m = new d3.trait.Margin()
        expect( m.top).toBe( 0)
        expect( m.right).toBe( 0)
        expect( m.bottom).toBe( 0)
        expect( m.left).toBe( 0)
    });

    it('should create a default Rect()', function() {
        var r = new d3.trait.Rect()
        expect( r.origin.x).toBe( 0)
        expect( r.origin.y).toBe( 0)
        expect( r.size.width).toBe( 0)
        expect( r.size.height).toBe( 0)
        expect( r.anchor.x).toBe( 0)
        expect( r.anchor.y).toBe( 0)
    });

    it('should create a Rect( x, y, w, h)', function() {
        var r = new d3.trait.Rect( 1, 2, 3, 4)
        expect( r.origin.x).toBe( 1)
        expect( r.origin.y).toBe( 2)
        expect( r.size.width).toBe( 3)
        expect( r.size.height).toBe( 4)
        expect( r.anchor.x).toBe( 0)
        expect( r.anchor.y).toBe( 0)
    });

    it('should create a Rect( origin, size)', function() {
        var o = new d3.trait.Point( 1, 2 ),
            s = new d3.trait.Size( 3, 4 ),
            r = new d3.trait.Rect( o, s)
        expect( r.origin.x).toBe( 1)
        expect( r.origin.y).toBe( 2)
        expect( r.size.width).toBe( 3)
        expect( r.size.height).toBe( 4)
        expect( r.anchor.x).toBe( 0)
        expect( r.anchor.y).toBe( 0)
    });

    it('should create a Rect( origin, size, anchor)', function() {
        var o = new d3.trait.Point( 1, 2 ),
            s = new d3.trait.Size( 3, 4 ),
            a = new d3.trait.Point( 5, 6 ),
            r = new d3.trait.Rect( o, s, a)
        expect( r.origin.x).toBe( 1)
        expect( r.origin.y).toBe( 2)
        expect( r.size.width).toBe( 3)
        expect( r.size.height).toBe( 4)
        expect( r.anchor.x).toBe( 5)
        expect( r.anchor.y).toBe( 6)
    });

    it('should create a Rect( x, y, w, h, ax, ay)', function() {
        var r = new d3.trait.Rect( 1, 2, 3, 4, 5, 6)
        expect( r.origin.x).toBe( 1)
        expect( r.origin.y).toBe( 2)
        expect( r.size.width).toBe( 3)
        expect( r.size.height).toBe( 4)
        expect( r.anchor.x).toBe( 5)
        expect( r.anchor.y).toBe( 6)
    });

    it('should calculate Rect.minX()', function() {
        var r = new d3.trait.Rect( 10, 100, 2, 4)
        expect( r.minX()).toBe( 10)
        r = new d3.trait.Rect( 10, 100, 2, 4, 0.5, 0.5)
        expect( r.minX()).toBe( 9)
        r = new d3.trait.Rect( 10, 100, 2, 4, 1, 1)
        expect( r.minX()).toBe( 8)
    });

    it('should calculate Rect.maxX()', function() {
        var r = new d3.trait.Rect( 10, 100, 2, 4)
        expect( r.maxX()).toBe( 12)
        r = new d3.trait.Rect( 10, 100, 2, 4, 0.5, 0.5)
        expect( r.maxX()).toBe( 11)
        r = new d3.trait.Rect( 10, 100, 2, 4, 1, 1)
        expect( r.maxX()).toBe( 10)
    });

    it('should calculate Rect.minY()', function() {
        var r = new d3.trait.Rect( 100, 10, 4, 2)
        expect( r.minY()).toBe( 10)
        r = new d3.trait.Rect( 100, 10, 4, 2, 0.5, 0.5)
        expect( r.minY()).toBe( 9)
        r = new d3.trait.Rect( 100, 10, 4, 2, 1, 1)
        expect( r.minY()).toBe( 8)
    });

    it('should calculate Rect.maxY()', function() {
        var r = new d3.trait.Rect( 100, 10, 4, 2)
        expect( r.maxY()).toBe( 12)
        r = new d3.trait.Rect( 100, 10, 4, 2, 0.5, 0.5)
        expect( r.maxY()).toBe( 11)
        r = new d3.trait.Rect( 100, 10, 4, 2, 1, 1)
        expect( r.maxY()).toBe( 10)
    });

    it('should calculate Rect.RoomOnRight( roomWidth)', function() {
        var r = new d3.trait.Rect( 10, 100, 2, 4)
        expect( r.roomOnRight( 20)).toBe( 8)
        r = new d3.trait.Rect( 10, 100, 2, 4, 0.5, 0.5)
        expect( r.roomOnRight( 20)).toBe( 9)
        r = new d3.trait.Rect( 10, 100, 2, 4, 1, 1)
        expect( r.roomOnRight( 20)).toBe( 10)
    });

    it('should calculate Rect.RoomOnLeft()', function() {
        var r = new d3.trait.Rect( 10, 100, 2, 4)
        expect( r.roomOnLeft()).toBe( 10)
        r = new d3.trait.Rect( 10, 100, 2, 4, 0.5, 0.5)
        expect( r.roomOnLeft()).toBe( 9)
        r = new d3.trait.Rect( 10, 100, 2, 4, 1, 1)
        expect( r.roomOnLeft()).toBe( 8)
    });

    it('should calculate Rect.RoomOnBottom( roomHeight)', function() {
        var r = new d3.trait.Rect( 100, 10, 4, 2)
        expect( r.roomOnBottom( 20)).toBe( 8)
        r = new d3.trait.Rect( 100, 10, 4, 2, 0.5, 0.5)
        expect( r.roomOnBottom( 20)).toBe( 9)
        r = new d3.trait.Rect( 100, 10, 4, 2, 1, 1)
        expect( r.roomOnBottom( 20)).toBe( 10)
    });

    it('should calculate Rect.RoomOnTop()', function() {
        var r = new d3.trait.Rect( 100, 10, 4, 2)
        expect( r.roomOnTop()).toBe( 10)
        r = new d3.trait.Rect( 100, 10, 4, 2, 0.5, 0.5)
        expect( r.roomOnTop()).toBe( 9)
        r = new d3.trait.Rect( 100, 10, 4, 2, 1, 1)
        expect( r.roomOnTop()).toBe( 8)
    });

    it('should calculate Rect.spaceOnTop( rectAbove)', function() {
        var above = new d3.trait.Rect( 100, 10, 4, 2 ),
            r = new d3.trait.Rect( 100, 20, 4, 2 )
        expect( r.spaceOnTop( above)).toBe( 8)
        above = new d3.trait.Rect( 100, 10, 4, 2, 0.5, 0.5)
        expect( r.spaceOnTop( above)).toBe( 9)
        above = new d3.trait.Rect( 100, 10, 4, 2, 1, 1)
        expect( r.spaceOnTop( above)).toBe( 10)
    });

    it('should calculate Rect.spaceOnBottom( rectBelow)', function() {
        var r = new d3.trait.Rect( 100, 10, 4, 2 ),
            below = new d3.trait.Rect( 100, 20, 4, 2 )
        expect( r.spaceOnBottom( below)).toBe( 8)
        below = new d3.trait.Rect( 100, 20, 4, 2, 0.5, 0.5)
        expect( r.spaceOnBottom( below)).toBe( 7)
        below = new d3.trait.Rect( 100, 20, 4, 2, 1, 1)
        expect( r.spaceOnBottom( below)).toBe( 6)
    });



});

