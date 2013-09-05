
describe('d3.traits.chart.bar', function() {

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

function isString( obj) {
    return Object.prototype.toString.call(obj) == '[object String]'
}

beforeEach(function() {
    chartDiv = affix( '.chart-div[style="width: 300px; height: 200px"]')
    selection = d3.select( ".chart-div")
})


it('should create g.chart-bar and rect.bar', function() {

    selection.datum( data)
        .traitConfig( config)
        .trait( d3.traits.chart.base)
        .trait( d3.traits.scale.ordinal.bars.x)
        .trait( d3.traits.scale.linear.y)
        .trait( d3.traits.chart.bar)
        //.trait( d3.traits.axis.y)

    var div = selection[0][0]
    var chartGroup = div._chartGroup[0][0]

    var chartInstanceGroup = chartGroup.firstChild
    expect( chartInstanceGroup).toBeElement( "g.chart-bar")
    expect( chartInstanceGroup.childElementCount).toBe( data.length)

    var seriesGroup = chartInstanceGroup.firstChild
    expect( seriesGroup).toBeElement( "g.series")
    expect( seriesGroup.childElementCount).toBe( data[0].length)

    var rect = seriesGroup.firstChild
    expect( rect).toBeElement( "rect.bar")

});

});


