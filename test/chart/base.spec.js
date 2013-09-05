
describe('d3.traits.chart.base', function() {

var chartDiv
var selection
var data = [[
    {x: 1, y: 4},
    {x: 2, y: 5},
    {x: 3, y: 6}
]]

beforeEach(function() {
    chartDiv = affix( '.chart-div[style="width: 300px; height: 200px"]')
    selection = d3.select( ".chart-div")
})

it('should append svg.chart and g.container-group', function() {
    selection.datum( data)
        .trait( d3.traits.chart.base)
    var div = selection[0][0]
    expect( div.tagName).toBe( "DIV")
    expect( div.firstChild.tagName).toBe( "svg")

    var svgElem = selection.traits[0].svg()[0][0]
    expect( svgElem.tagName).toBe( "svg")
    expect( svgElem.className.baseVal).toBe( "chart")
    expect( svgElem.getAttribute( "width")).toBe( "300")
    expect( svgElem.getAttribute( "height")).toBe( "200")

    var containerGroup = svgElem.firstChild
    expect( containerGroup.tagName).toBe( "g")
    expect( containerGroup.className.baseVal).toBe( "container-group")

    var chartGroup = containerGroup.firstChild
    expect( chartGroup.tagName).toBe( "g")
    expect( chartGroup.className.baseVal).toBe( "chart-group")

    expect( div._container[0][0]).toBe( containerGroup)
    expect( div._chartGroup[0][0]).toBe( chartGroup)
});

it('should get/update width, height, chartWidth and chartHeight', function() {

    selection.datum( data)
        .trait( d3.traits.chart.base)
    var traitInstance = selection.traits[0]

    var chartResizedCount = 0
    traitInstance.onChartResized( "nameSpace", function() { chartResizedCount++})

    expect( traitInstance.width()).toBe( 300)
    expect( traitInstance.height()).toBe( 200)

    expect( traitInstance.marginTop()).toBe( 2)
    expect( traitInstance.marginBottom()).toBe( 2)
    expect( traitInstance.marginLeft()).toBe( 2)
    expect( traitInstance.marginRight()).toBe( 2)

    expect( traitInstance.chartWidth()).toBe( 296)
    expect( traitInstance.chartHeight()).toBe( 196)

    // Update width/height will effect chartWidth/chartHeight
    traitInstance.width( 400)
    expect( chartResizedCount).toBe( 1)
    traitInstance.height( 300)
    expect( chartResizedCount).toBe( 2)
    expect( traitInstance.width()).toBe( 400)
    expect( traitInstance.height()).toBe( 300)
    expect( traitInstance.chartWidth()).toBe( 396)
    expect( traitInstance.chartHeight()).toBe( 296)

    // Update chartWidth/chartHeight will effect width/height
    traitInstance.chartWidth( 400)
    expect( chartResizedCount).toBe( 3)
    traitInstance.chartHeight( 300)
    expect( chartResizedCount).toBe( 4)
    expect( traitInstance.width()).toBe( 404)
    expect( traitInstance.height()).toBe( 304)
    expect( traitInstance.chartWidth()).toBe( 400)
    expect( traitInstance.chartHeight()).toBe( 300)


//        .trait( d3.traits.scale.linear.y)
//        .trait( d3.traits.scale.time.x)
//        .trait( d3.traits.axis.month.x)
//        .trait( d3.traits.chart.bar, { seriesFilter: function( s, i) { return i == 0} })
//        .trait( d3.traits.chart.line2)
//        .trait( d3.traits.axis.y)

});
it('margin update should effect chartWidth and chartHeight', function() {

    selection.datum( data)
        .trait( d3.traits.chart.base)
    var traitInstance = selection.traits[0]

    var chartResizedCount = 0
    traitInstance.onChartResized( "nameSpace", function() { chartResizedCount++})

    expect( traitInstance.width()).toBe( 300)
    expect( traitInstance.height()).toBe( 200)
    expect( traitInstance.chartWidth()).toBe( 296)
    expect( traitInstance.chartHeight()).toBe( 196)

    traitInstance.marginTop( 10)
    expect( chartResizedCount).toBe( 1)
    expect( traitInstance.marginTop()).toBe( 10)
    expect( traitInstance.height()).toBe( 200)
    expect( traitInstance.chartHeight()).toBe( 188)

    traitInstance.plusMarginTop( 10)
    expect( chartResizedCount).toBe( 2)
    expect( traitInstance.marginTop()).toBe( 20)
    expect( traitInstance.height()).toBe( 200)
    expect( traitInstance.chartHeight()).toBe( 178)

    traitInstance.marginBottom( 10)
    expect( chartResizedCount).toBe( 3)
    expect( traitInstance.marginBottom()).toBe( 10)
    expect( traitInstance.height()).toBe( 200)
    expect( traitInstance.chartHeight()).toBe( 170)

    traitInstance.plusMarginBottom( 10)
    expect( chartResizedCount).toBe( 4)
    expect( traitInstance.marginBottom()).toBe( 20)
    expect( traitInstance.height()).toBe( 200)
    expect( traitInstance.chartHeight()).toBe( 160)

    traitInstance.marginRight( 10)
    expect( chartResizedCount).toBe( 5)
    expect( traitInstance.marginRight()).toBe( 10)
    expect( traitInstance.width()).toBe( 300)
    expect( traitInstance.chartWidth()).toBe( 288)

    traitInstance.plusMarginRight( 10)
    expect( chartResizedCount).toBe( 6)
    expect( traitInstance.marginRight()).toBe( 20)
    expect( traitInstance.width()).toBe( 300)
    expect( traitInstance.chartWidth()).toBe( 278)

    traitInstance.marginLeft( 10)
    expect( chartResizedCount).toBe( 7)
    expect( traitInstance.marginLeft()).toBe( 10)
    expect( traitInstance.width()).toBe( 300)
    expect( traitInstance.chartWidth()).toBe( 270)

    traitInstance.plusMarginLeft( 10)
    expect( chartResizedCount).toBe( 8)
    expect( traitInstance.marginLeft()).toBe( 20)
    expect( traitInstance.width()).toBe( 300)
    expect( traitInstance.chartWidth()).toBe( 260)
});

});


