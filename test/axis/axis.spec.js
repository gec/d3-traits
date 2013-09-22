
describe('d3.trait.axis', function() {

var chartDiv
var selection
var data = [[
    {x: 1, y: 4},
    {x: 2, y: 5},
    {x: 3, y: 6}
]]
var timeData = [[
    {x: new Date( 1), y: 4},
    {x: new Date( 2), y: 5},
    {x: new Date( 3), y: 6}
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

function makeChartContainer( selection) {
    var div = selection[0][0]
    var svg = selection.append("svg")
        .classed('chart', true)
        .attr("width", 300)
        .attr("height", 200)

    div._container = svg.append('g').classed('container-group', true)
    div._chartGroup = div._container.append('g').classed('chart-group', true);
    return selection
}

function makeLinearY1() {
    var scale = d3.scale.linear()
    var maxY = d3.max( data, function(s) { return d3.max( config.seriesData(s), config.y1); })
    scale.domain([0, maxY])
        .range([200, 0]);
    return scale
}

function makeOrdinalX1() {
    var scale = d3.scale.ordinal()
    var ordinals = data[0].map( config.x1)
    scale.domain(ordinals)
        .range([200, 0]);
    return scale
}

function makeTimeX1() {
    var scale = d3.time.scale()
    var minX = d3.min( data, function(s) { return d3.max( config.seriesData(s), config.x1); })
    var maxX = d3.max( data, function(s) { return d3.max( config.seriesData(s), config.x1); })
    scale.domain( [minX, maxX])
        .range([200, 0]);
    return scale
}

it('axis.linear should call _super y1, ease, and plusMarginLeft', function() {
    makeChartContainer( selection)
    var _super = {
        y1: makeLinearY1,
        ease: function() { return 'cubic-in-out'},
        plusMarginTop: function( value) {},
        plusMarginLeft: function( value) {},
        onChartResized: function() {},
        onRangeMarginChanged: function() {}
    }
    spyOn( _super, 'plusMarginLeft').andCallThrough()
    spyOn( _super, 'onChartResized').andCallThrough()
    spyOn( _super, 'onRangeMarginChanged').andCallThrough()

    var axis = d3.trait.axis.linear( _super, { axis: 'y1'})
    selection.call( axis)
    expect( _super.plusMarginLeft).toHaveBeenCalledWith( 30)
    expect( _super.onChartResized).toHaveBeenCalledWith( 'axisLinear-y1', axis)
    expect( _super.onRangeMarginChanged).toHaveBeenCalledWith( 'axisLinear-y1', axis)
})

it('axis.linear should create g.axis-y1', function() {

    selection.datum( data)
        .traitConfig( config)
        .trait( d3.trait.chart.base)
        .trait( d3.trait.scale.linear, {axis: 'y1'})
        .trait( d3.trait.axis.linear, {axis: 'y1'})

    var div = selection[0][0]
    var container = div._container[0][0]

    var $axisGroup = $(container).children( ".axis-y1")
    expect($axisGroup.size()).toBe( 1)
})

it('axis.time.month should call _super x1, ease, and plusMarginLeft', function() {
    makeChartContainer( selection)
    var _super = {
        x1: makeTimeX1,
        ease: function() { return 'cubic-in-out'},
        plusMarginBottom: function( value) {},
        chartHeight: function() {return 190},
        onChartResized: function() {},
        onRangeMarginChanged: function() {}
    }
    spyOn( _super, 'plusMarginBottom').andCallThrough()
    spyOn( _super, 'chartHeight').andCallThrough()
    spyOn( _super, 'onChartResized').andCallThrough()
    spyOn( _super, 'onRangeMarginChanged').andCallThrough()

    var axis = d3.trait.axis.time.month( _super, {axis: 'x1'})
    selection.call( axis)
    expect( _super.plusMarginBottom).toHaveBeenCalledWith( 30)
    expect( _super.chartHeight).toHaveBeenCalled()
    expect( _super.onChartResized).toHaveBeenCalledWith( 'axisMonth-x1', axis)
    expect( _super.onRangeMarginChanged).toHaveBeenCalledWith( 'axisMonth-x1', axis)
})

it('axis.time.month should create g.axis-x1', function() {

    selection.datum( data)
        .traitConfig( config)
        .trait( d3.trait.chart.base)
        .trait( d3.trait.scale.time, {axis: 'x1'})
        .trait( d3.trait.axis.time.month, {axis: 'x1'})

    var div = selection[0][0]
    var container = div._container[0][0]

    var $axisGroup = $(container).children( ".axis-x1")
    expect($axisGroup.size()).toBe( 1)
})


});


