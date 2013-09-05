
describe('d3.traits.chart.line', function() {

var chartDiv
var selection
var data = [[
    {x: 1, y: 4},
    {x: 2, y: 5},
    {x: 3, y: 6}
]]
var accessX1 = function(d) { return d.x; }
var accessY1 = function(d) { return d.y; }
var accessSeriesData = function(s, i) { return s}
var config = {
    x1: accessX1,
    y1: accessY1,
    seriesData: accessSeriesData
}

beforeEach(function() {
    chartDiv = affix( '.chart-div[style="width: 300px; height: 200px"]')
    selection = d3.select( ".chart-div")
})


it('should register with onChartResized', function() {

    var _super = jasmine.createSpyObj('_super', ['x1', 'y1', 'onChartResized']);
    var chartLine = d3.traits.chart.line( _super, {})
    expect( _super.onChartResized).toHaveBeenCalledWith( 'chartLine', chartLine)
})

it('should create g.chart-line, g.series, and path.line', function() {

    selection.datum( data)
        .traitConfig( config)
        .trait( d3.traits.chart.base)
        .trait( d3.traits.scale.ordinal.bars.x)
        .trait( d3.traits.scale.linear.y)
        .trait( d3.traits.chart.line)
        //.trait( d3.traits.axis.y)

    var div = selection[0][0]
    var chartGroup = div._chartGroup[0][0]

    var chartInstanceGroup = chartGroup.firstChild
    expect( chartInstanceGroup).toBeElement( "g.chart-line")
    expect( chartInstanceGroup.childElementCount).toBe( data.length)

    var seriesGroup = chartInstanceGroup.firstChild
    expect( seriesGroup).toBeElement( "g.series")
    expect( seriesGroup.childElementCount).toBe( 1)

    var path = seriesGroup.firstChild
    expect( path).toBeElement( "path.line")

});

});


