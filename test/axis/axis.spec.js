
describe('d3.traits.axis', function() {

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

it('axis.y should call _super y1, ease, and plusMarginLeft', function() {
    makeChartContainer( selection)
    var _super = {
        y1: makeLinearY1,
        ease: function() { return 'cubic-in-out'},
        plusMarginLeft: function( value) {}
    }
    spyOn( _super, 'plusMarginLeft').andCallThrough()

    var axis = d3.traits.axis.y( _super, {})
    selection.call( axis)
    expect( _super.plusMarginLeft).toHaveBeenCalledWith( 30)
})

it('axis.y should create g.y-axis-group', function() {

    selection.datum( data)
        .traitConfig( config)
        .trait( d3.traits.chart.base)
        .trait( d3.traits.scale.linear.y)
        .trait( d3.traits.axis.y)

    var div = selection[0][0]
    var container = div._container[0][0]

    var $yAxisGroup = $(container).children( ".y-axis-group")
    expect($yAxisGroup.size()).toBe( 1)
})

it('axis.month.x should call _super x1, ease, and plusMarginLeft', function() {
    makeChartContainer( selection)
    var _super = {
        x1: makeOrdinalX1,
        ease: function() { return 'cubic-in-out'},
        plusMarginBottom: function( value) {},
        chartHeight: function() {return 196}
    }
    spyOn( _super, 'plusMarginBottom').andCallThrough()
    spyOn( _super, 'chartHeight').andCallThrough()

    var axis = d3.traits.axis.month.x( _super, {})
    selection.call( axis)
    expect( _super.plusMarginBottom).toHaveBeenCalledWith( 30)
    expect( _super.chartHeight).toHaveBeenCalled()
})

it('axis.month.x should create g.x-axis-group', function() {

    selection.datum( data)
        .traitConfig( config)
        .trait( d3.traits.chart.base)
        .trait( d3.traits.scale.ordinal.bars.x)
        .trait( d3.traits.axis.month.x)

    var div = selection[0][0]
    var container = div._container[0][0]

    var $yAxisGroup = $(container).children( ".x-axis-group")
    expect($yAxisGroup.size()).toBe( 1)
})


});


