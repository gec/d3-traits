
describe('d3.trait.utils', function() {

var access = {
    series: function(d) { return d; },
    data: function(d) { return d; }
}

beforeEach(function() {
})


it('minFromData should return minimum value', function() {

    var min

    min = d3.trait.utils.minFromData( [ [] ], access)
    expect( min).toBeCloseTo( 0, .01)

    min = d3.trait.utils.minFromData( [ [] ], access, 1)
    expect( min).toBeCloseTo( 1, .01)

    min = d3.trait.utils.minFromData( [[0,1, 2]], access)
    expect( min).toBeCloseTo( 0, .01)

    min = d3.trait.utils.minFromData( [[0,1], [2, 3]], access)
    expect( min).toBeCloseTo( 0, .01)

    min = d3.trait.utils.minFromData( [[5,6], [2, 3]], access)
    expect( min).toBeCloseTo( 2, .01)

});

it('maxFromData should return maximum value', function() {

    var min

    min = d3.trait.utils.maxFromData( [ [] ], access)
    expect( min).toBeCloseTo( 0, .01)

    min = d3.trait.utils.maxFromData( [ [] ], access, 1)
    expect( min).toBeCloseTo( 1, .01)

    min = d3.trait.utils.maxFromData( [[0,1, 2]], access)
    expect( min).toBeCloseTo( 2, .01)

    min = d3.trait.utils.maxFromData( [[0,1], [2, 3]], access)
    expect( min).toBeCloseTo( 3, .01)

    min = d3.trait.utils.maxFromData( [[5,6], [2, 3]], access)
    expect( min).toBeCloseTo( 6, .01)

});

it('extentFromData should return default extents when data is empty', function() {

    var extent

    extent = d3.trait.utils.extentFromData( [ [] ], access)
    expect( extent).toEqual( [0, 1])

    extent = d3.trait.utils.extentFromData( [ [] ], access, [1,2])
    expect( extent).toEqual( [1,2])

});

it('extentFromData should return [min-1 , max+1] if min == max', function() {

    var extent

    extent = d3.trait.utils.extentFromData( [[1]], access)
    expect( extent).toEqual( [0,2])

    extent = d3.trait.utils.extentFromData( [ [1], [1] ], access)
    expect( extent).toEqual( [0,2])

});

it('extentFromData should return extents', function() {

    var extent

    extent = d3.trait.utils.extentFromData( [[0,1, 2]], access)
    expect( extent).toEqual( [0,2])

    extent = d3.trait.utils.extentFromData( [[0,1], [2, 3]], access)
    expect( extent).toEqual( [0,3])

    extent = d3.trait.utils.extentFromData( [[5,6], [2, 3]], access)
    expect( extent).toEqual( [2,6])

});



});


