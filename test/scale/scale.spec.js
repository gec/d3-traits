
describe('d3.traits.scale', function() {

var chartDiv
var selection
var data = [[
    {x: 1, y: 4},
    {x: 2, y: 5},
    {x: 3, y: 6}
]]
var accessX1 = function(d) { return d.x; }
var accessY1 = function(d) { return d.y; }
var accessSeriesData = function(s) { return s}
var config = {
    x1: accessX1,
    y1: accessY1,
    seriesData: accessSeriesData
}


beforeEach(function() {
    chartDiv = affix( '.chart-div[style="width: 300px; height: 200px"]')
    selection = d3.select( ".chart-div")
})

it('scale.ordinal.bars.x should setup domain and range', function() {
    selection.datum( data)
        .traitConfig( config)
        .trait( d3.traits.chart.base)
        .trait( d3.traits.scale.ordinal.bars.x)

    var scale = selection.traits[1].x1()

    expect( scale).toBeDefined()
    expect( scale.domain().length).toBe( data[0].length)
    expect( scale.domain()).toEqual( [ 1, 2, 3])

    // 296 * 0.1 = 29.6 which is 14.8 on each side. Guess it rounds to 10 on each side.
    expect( scale.range()).toEqual( [10, 105, 200])
    expect( scale.rangeExtent()).toEqual( [0, 296])
    expect( scale.rangeBand()).toEqual( 86)
});

it('scale.linear.y should setup domain and range', function() {
    selection.datum( data)
        .traitConfig( config)
        .trait( d3.traits.chart.base)
        .trait( d3.traits.scale.linear.y)

    var scale = selection.traits[1].y1()
    expect( scale).toBeDefined()

    var max = d3.max( data[0], accessY1)
    expect( scale.domain()).toEqual( [ 0, max])
    expect( scale.range()).toEqual( [196, 0])
});

});


