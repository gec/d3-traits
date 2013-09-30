
describe('d3-traits.layout', function() {



    beforeEach(function() {
    })

    it( 'adjustOrientationToFitWidth should flip on item left', function() {
        var items = [
            { name: 'right', rect: new d3.trait.Rect( 50, 10, 10, 10) },
            // rigt doesn't fit
            { name: 'left', rect: new d3.trait.Rect( 50, 10, 51, 10) }
        ]
        var array = d3.trait.layout.adjustOrientationToFitWidth( items, 100)
        expect( items[0].rect.anchor.x).toBe( 0)
        expect( items[1].rect.anchor.x).toBe( 1)

        var left = array[0]
        var right = array[1]
        expect( left[0].name).toBe( 'left')
        expect( right[0].name).toBe( 'right')

        //expect( left[0] === items[1]).toBeTruthy()
        //expect( right[0] === items[0]).toBeTruthy()


    });

    it( 'adjustOrientationToFitWidth should flip a left item to the right', function() {
        var items = [
            { name: 'right1', rect: new d3.trait.Rect( 50, 10, 10, 10) },
            // left doesn't fit (i.e. anchor.x == 1)
            { name: 'right2', rect: new d3.trait.Rect( 50, 10, 51, 10, 1, 0) }
        ]
        var array = d3.trait.layout.adjustOrientationToFitWidth( items, 100)
        expect( items[0].rect.anchor.x).toBe( 0)
        expect( items[1].rect.anchor.x).toBe( 0)

        var left = array[0]
        var right = array[1]
        expect( left.length).toBe( 0)
        expect( right[0].name).toBe( 'right1')
        expect( right[1].name).toBe( 'right2')
    });

    it( 'listNudgeUpFromBottom should translate one item off bottom', function() {
        var items = [
            { name: 'static', rect: new d3.trait.Rect( 10,  50, 10, 10) },
            { name: 'toolow', rect: new d3.trait.Rect( 10, 100, 10, 10) }
        ]
        var array = d3.trait.layout.utils.listNudgeUpFromBottom( items, 100)
        expect( items[0].rect.origin.y).toBe( 50)
        expect( items[1].rect.origin.y).toBe( 90)
    });

    it( 'listNudgeUpFromBottom should translate one item off bottom and the one above', function() {
        var items = [
            { name: 'nudge',  rect: new d3.trait.Rect( 10,  90, 10, 10) },
            { name: 'toolow', rect: new d3.trait.Rect( 10, 100, 10, 10) }
        ]
        var array = d3.trait.layout.utils.listNudgeUpFromBottom( items, 100)
        expect( items[0].rect.origin.y).toBe( 80)
        expect( items[1].rect.origin.y).toBe( 90)
    });

    it( 'listNudgeUpFromBottom should translate one item that overlaps another', function() {
        var items = [
            { name: 'nudge',  rect: new d3.trait.Rect( 10,  51, 10, 10) },
            { name: 'toolow', rect: new d3.trait.Rect( 10,  60, 10, 10) }
        ]
        var array = d3.trait.layout.utils.listNudgeUpFromBottom( items, 100)
        expect( items[0].rect.origin.y).toBe( 50)
        expect( items[1].rect.origin.y).toBe( 60)
    });


    it( 'removeOverlapFromTop should translate one item off the top', function() {
        var items = [
            { name: 'nudge',  rect: new d3.trait.Rect( 10,  -1, 10, 10) },
            { name: 'static', rect: new d3.trait.Rect( 10,  60, 10, 10) }
        ]
        var array = d3.trait.layout.utils.removeOverlapFromTop( items)
        expect( items[0].rect.origin.y).toBe(  0)
        expect( items[1].rect.origin.y).toBe( 60)
    });

    it( 'removeOverlapFromTop should translate one item off the top and one below', function() {
        var items = [
            { name: 'nudge',   rect: new d3.trait.Rect( 10,  -1, 10, 10) },
            { name: 'collide', rect: new d3.trait.Rect( 10,   5, 10, 10) }
        ]
        var array = d3.trait.layout.utils.removeOverlapFromTop( items)
        expect( items[0].rect.origin.y).toBe(  0)
        expect( items[1].rect.origin.y).toBe( 10)
    });

    it( 'removeOverlapFromTop should translate for minOverlap', function() {
        var items = [
            { name: 'nudge', rect: new d3.trait.Rect( 10,  0, 10, 10) },
            { name: 'nudge', rect: new d3.trait.Rect( 10,  5, 10, 10) },
            { name: 'nudge', rect: new d3.trait.Rect( 10, 50, 10, 10) }
        ]
        var array = d3.trait.layout.utils.removeOverlapFromTop( items, 1)
        expect( items[0].rect.origin.y).toBe( -1)
        expect( items[1].rect.origin.y).toBe(  8)
        expect( items[2].rect.origin.y).toBe( 17)
    });

    it( 'listBalanceFromTop should translate two items up', function() {
        var items = [
                { name: 'toolow', rect: new d3.trait.Rect( 10,  50, 10, 10) },
                { name: 'toolow', rect: new d3.trait.Rect( 10,  60, 10, 10) }
            ],
            originalYs = [ 40, 50]

        var array = d3.trait.layout.utils.listBalanceFromTop( items, 100, originalYs)
        expect( items[0].rect.origin.y).toBe( 40)
        expect( items[1].rect.origin.y).toBe( 50)
    });

    it( 'listBalanceFromTop should translate one item down', function() {
        var items = [
                { name: 'toohigh', rect: new d3.trait.Rect( 10,  50, 10, 10) },
                { name: 'static',  rect: new d3.trait.Rect( 10,  70, 10, 10) }
            ],
            originalYs = [ 52, 70]

        var array = d3.trait.layout.utils.listBalanceFromTop( items, 100, originalYs)
        expect( items[0].rect.origin.y).toBe( 52)
        expect( items[1].rect.origin.y).toBe( 70)
    });

    it( 'listBalanceFromTop should translate two items down', function() {
        var items = [
                { name: 'toohigh', rect: new d3.trait.Rect( 10,  50, 10, 10) },
                { name: 'toohigh', rect: new d3.trait.Rect( 10,  60, 10, 10) }
            ],
            originalYs = [ 60, 70]

        var array = d3.trait.layout.utils.listBalanceFromTop( items, 100, originalYs)
        expect( items[0].rect.origin.y).toBe( 60)
        expect( items[1].rect.origin.y).toBe( 70)
    });

    it( 'listBalanceFromTop should translate two items down', function() {
        var items = [
                { name: 'toohigh', rect: new d3.trait.Rect( 10,   0, 10, 10) },
                { name: 'toohigh', rect: new d3.trait.Rect( 10,  10, 10, 10) }
            ],
            originalYs = [ 10, 20]

        var array = d3.trait.layout.utils.listBalanceFromTop( items, 100, originalYs)
        expect( items[0].rect.origin.y).toBe( 10)
        expect( items[1].rect.origin.y).toBe( 20)
    });

    it( 'listBalanceFromTop should translate three items up', function() {
        var items = [
                { name: 'toolow', rect: new d3.trait.Rect( 10,   0, 10, 10) },
                { name: 'toolow', rect: new d3.trait.Rect( 10,  10, 10, 10) },
                { name: 'toolow', rect: new d3.trait.Rect( 10,  22, 10, 10) }
            ],
            originalYs = [ 10, 20, 0]

        var array = d3.trait.layout.utils.listBalanceFromTop( items, 100, originalYs)
        expect( items[0].rect.origin.y).toBe(  0)
        expect( items[1].rect.origin.y).toBe( 10)
        expect( items[2].rect.origin.y).toBe( 20)
    });

    it( 'listBalanceFromTop should translate three items down', function() {
        var items = [
                { name: 'toohigh', rect: new d3.trait.Rect( 10,   0, 10, 10) },
                { name: 'toohigh', rect: new d3.trait.Rect( 10,  10, 10, 10) },
                { name: 'static',  rect: new d3.trait.Rect( 10,  22, 10, 10) }
            ],
            originalYs = [ 10, 20, 30]

        var array = d3.trait.layout.utils.listBalanceFromTop( items, 100, originalYs)
        expect( items[0].rect.origin.y).toBe( 10)
        expect( items[1].rect.origin.y).toBe( 20)
        expect( items[2].rect.origin.y).toBe( 30)
    });

    it( 'listBalanceFromTop should see three items in tension, but balanced', function() {
        var items = [
                { name: 'static', rect: new d3.trait.Rect( 10,   0, 10, 10) },
                { name: 'static', rect: new d3.trait.Rect( 10,  10, 10, 10) },
                { name: 'static', rect: new d3.trait.Rect( 10,  20, 10, 10) }
            ],
            originalYs = [ 10, 10, 10]

        var array = d3.trait.layout.utils.listBalanceFromTop( items, 100, originalYs)
        expect( items[0].rect.origin.y).toBe(  0)
        expect( items[1].rect.origin.y).toBe( 10)
        expect( items[2].rect.origin.y).toBe( 20)
    });


});


