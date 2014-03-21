
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
var chartWidth = 300,
    chartHeight = 200

beforeEach(function() {
    chartDiv = affix( '.chart-div[style="width: ' + chartWidth + 'px; height: ' + chartHeight + 'px"]')
    selection = d3.select( ".chart-div")
})

function makeChartContainer( selection) {
    var div = selection[0][0]
    var svg = selection.append("svg")
        .classed('chart', true)
        .attr("width", chartWidth)
        .attr("height", chartHeight)

    div._container = svg.append('g').classed('container-group', true)
    div._chartGroup = div._container.append('g').classed('chart-group', true);
    return selection
}

function makeLinearY1() {
    var scale = d3.scale.linear()
    var maxY = d3.max( data, function(s) { return d3.max( config.seriesData(s), config.y1); })
    scale.domain([0, maxY])
        .range([chartHeight, 0]);
    return scale
}

function makeOrdinalX1() {
    var scale = d3.scale.ordinal()
    var ordinals = data[0].map( config.x1)
    scale.domain(ordinals)
        .range([chartHeight, 0]);
    return scale
}

function makeTimeX1() {
    var scale = d3.time.scale()
    var minX = d3.min( data, function(s) { return d3.max( config.seriesData(s), config.x1); })
    var maxX = d3.max( data, function(s) { return d3.max( config.seriesData(s), config.x1); })
    scale.domain( [minX, maxX])
        .range([chartHeight, 0]);
    return scale
}

it('axis.linear should call _super y1, ease, and plusMarginLeft', function() {
    makeChartContainer( selection)
    var _super = {
        y1: makeLinearY1,
        ease: function() { return 'cubic-in-out'},
        marginTop: function( value) {},
        marginLeft: function( value) {},
        onChartResized: function() {},
        onRangeMarginChanged: function() {},
        layoutAxis: function() {}
    }
    spyOn( _super, 'layoutAxis').andCallThrough()
    spyOn( _super, 'onChartResized').andCallThrough()
    spyOn( _super, 'onRangeMarginChanged').andCallThrough()

    var axis = d3.trait.axis.linear( _super, { axis: 'y1'})
    d3.trait.utils.extend( axis, _super)
    selection.call( axis)
    expect( _super.layoutAxis).toHaveBeenCalledWith( jasmine.any(Object), 'left', 40)
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

    var $axisGroup = $(container).children( ".axis")
    expect($axisGroup.size()).toBe( 1)
    var $axisGroupAxis = $axisGroup.children( ".axis-y1")
    expect($axisGroupAxis.size()).toBe( 1)
})

function makeLinearAxisWithMarginAndOrient( axis, margin, orient) {
    var configWithMargin = {
        x1: accessX1,
        y1: accessY1,
        seriesData: accessSeriesData,
        margin: margin
    }

    var axisConfig = {axis: axis}
    if( orient)
        axisConfig.orient = orient

    selection.datum( data)
        .traitConfig( configWithMargin)
        .trait( d3.trait.chart.base)
        .trait( d3.trait.scale.linear, {axis: axis})
        .trait( d3.trait.axis.linear, axisConfig)
}
function getAxisGroup() {
    var div = selection[0][0]
    var container = div._container[0][0]

    return $(container).children( ".axis")
}
it('axis.linear should layout axis accounting for large margin on chart left.', function() {

    makeLinearAxisWithMarginAndOrient( 'y1', {left: 100})
    var $axisGroup = getAxisGroup()
    expect($axisGroup.size()).toBe( 1)
    expect( $axisGroup[0].getAttribute( 'transform') ).toEqual( 'translate(100,5)')
})

it('axis.linear should layout axis accounting for large margin on chart top.', function() {

    makeLinearAxisWithMarginAndOrient( 'x1', {top: 100}, 'top')
    var $axisGroup = getAxisGroup()
    expect($axisGroup.size()).toBe( 1)
    expect( $axisGroup[0].getAttribute( 'transform') ).toEqual( 'translate(5,100)')
})

it('axis.linear should layout axis accounting for large margin on chart right.', function() {

    makeLinearAxisWithMarginAndOrient( 'y1', {right: 100}, 'right')
    var $axisGroup = getAxisGroup()
    expect($axisGroup.size()).toBe( 1)
    expect( $axisGroup[0].getAttribute( 'transform') ).toEqual( 'translate(' + (chartWidth-100) + ',5)')
})

it('axis.linear should layout axis accounting for large margin on chart bottom.', function() {

    makeLinearAxisWithMarginAndOrient( 'x1', {bottom: 100}, 'bottom')
    var $axisGroup = getAxisGroup()
    expect($axisGroup.size()).toBe( 1)
    expect( $axisGroup[0].getAttribute( 'transform') ).toEqual( 'translate(5,' + (chartHeight-100) + ')')
})

it('axis.time.month should call _super x1, ease, and plusMarginLeft', function() {
    makeChartContainer( selection)
    var _super = {
        x1: makeTimeX1,
        ease: function() { return 'cubic-in-out'},
        marginTop: function( value) {},
        marginLeft: function( value) {},
        onChartResized: function() {},
        onRangeMarginChanged: function() {},
        layoutAxis: function() {}
    }
    spyOn( _super, 'layoutAxis').andCallThrough()
    spyOn( _super, 'onChartResized').andCallThrough()
    spyOn( _super, 'onRangeMarginChanged').andCallThrough()

    var axis = d3.trait.axis.time.month( _super, {axis: 'x1'})
    d3.trait.utils.extend( axis, _super)
    selection.call( axis)
    expect( _super.layoutAxis).toHaveBeenCalledWith( jasmine.any(Object), 'bottom', 40)
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

    var $axisGroup = $(container).children( ".axis")
    expect($axisGroup.size()).toBe( 1)
})


});


