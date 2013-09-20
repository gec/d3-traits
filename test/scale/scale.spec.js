
describe('d3.trait.scale', function() {

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
        .trait( d3.trait.chart.base)
        .trait( d3.trait.scale.ordinal.bars.x)

    var scale = selection.traits[1].x1()

    expect( scale).toBeDefined()
    expect( scale.domain().length).toBe( data[0].length)
    expect( scale.domain()).toEqual( [ 1, 2, 3])

    // 296 * 0.1 = 29.6 which is 14.8 on each side. Guess it rounds to 10 on each side.
    expect( scale.range()).toEqual( [10, 103, 196])
    expect( scale.rangeExtent()).toEqual( [0, 290])
    expect( scale.rangeBand()).toEqual( 84)
});

it('scale.time should setup domain and range', function() {
    // ISO 8601 ex: "2013 07 31"
    var parseDate = d3.time.format("%Y-%m-%d").parse
    var Jan01 = parseDate( "2013-01-01")
    var Jan15 = parseDate( "2013-01-15")
    var Jan31 = parseDate( "2013-01-31")
    var Feb01 = parseDate( "2013-02-01")
    data = [[
        {x: Jan01, y: 4},
        {x: Jan15, y: 5},
        {x: Jan31, y: 6}
    ]]

    selection.datum( data)
        .traitConfig( config)
        .trait( d3.trait.chart.base)
        .trait( d3.trait.scale.time, { axis: 'x1', nice: d3.time.month})

    var scale = selection.traits[1].x1()

    expect( scale).toBeDefined()
    expect( scale.domain()).toEqual( [ Jan01, Feb01])
    expect( scale.range()).toEqual( [0, 290])

});

it('scale.linear should setup domain and range', function() {
    selection.datum( data)
        .traitConfig( config)
        .trait( d3.trait.chart.base)
        .trait( d3.trait.scale.linear, {axis: 'y1'})

    var scale = selection.traits[1].y1()
    expect( scale).toBeDefined()

    var max = d3.max( data[0], accessY1)
    expect( scale.domain()).toEqual( [ 4, max])
    expect( scale.range()).toEqual( [190, 0])
});

});


