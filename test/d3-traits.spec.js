
var chartDiv
var selection
var data = [
    {x: 1, y: 4},
    {x: 2, y: 5},
    {x: 3, y: 6}
]
var accessX1 = function(d) { return d.x; }
var accessY1 = function(d) { return d.y; }
var accessSeriesData = function(s) { return s}
var access = {
    x1: accessX1,
    y1: accessY1,
    seriesData: accessSeriesData
}

//    beforeEach(inject(function(n3utils) {
//        spyOn(n3utils, 'getDefaultMargins').andReturn(
//            {top: 20, right: 50, bottom: 30, left: 50}
//        )
//    }))


beforeEach(function() {

    chartDiv = document.createElement( 'div' )
    chartDiv.className = "chart-div"
    window.document.body.appendChild( chartDiv)
    chartDiv.setAttribute( "style", "width: 300px; height: 200px; margin: 0; padding: 0; border: 0")
    chartDiv.setAttribute( "width", 300)
    chartDiv.setAttribute( "height", 200)

    selection = d3.select( ".chart-div")
})

it('should find the selection', function() {
    expect( selection.length).toBe( 1)
    expect( selection[0].length).toBe( 1)
    expect( selection[0][0].tagName).toBe( "DIV")
});

it('should set accessors on selection', function() {

    selection.datum( data)
        .accessors( access)

    expect( selection._access).toBeDefined()
    expect( selection._access.x1).toEqual( accessX1)
    expect( selection._access.y1).toEqual( accessY1)
    expect( selection._access.seriesData).toEqual( accessSeriesData)
});

it('should setup trait chart.base', function() {

    selection.datum( data)
        .accessors( access)
        .trait( d3.traits.chart.base)

    expect( selection.traits).toBeDefined()
    expect( selection.traits.length).toBe( 1)
    var trait = selection.traits[0]
    expect( trait.width()).toBe( 300)
    expect( trait.height()).toBe( 200)
    expect( trait.marginTop()).toBe( 2)
    expect( trait.marginBottom()).toBe( 2)
    expect( trait.marginLeft()).toBe( 2)
    expect( trait.marginRight()).toBe( 2)
    expect( trait.chartWidth()).toBe( 296)
    expect( trait.chartHeight()).toBe( 196)

    var selectionElem = selection[0][0]
    expect( selectionElem.tagName).toBe( "DIV")
    expect( selectionElem.firstChild.tagName).toBe( "svg")

    var svgElem = trait.svg()[0][0]
    expect( svgElem.tagName).toBe( "svg")
    expect( svgElem.getAttribute( "width")).toBe( "300")
    expect( svgElem.getAttribute( "height")).toBe( "200")

    var g = svgElem.firstChild
    expect( g.tagName).toBe( "g")
    expect( g.className.baseVal).toBe( "container-group")



    trait.width( 400)
    trait.height( 300)
    expect( trait.width()).toBe( 400)
    expect( trait.height()).toBe( 300)
    expect( trait.chartWidth()).toBe( 396)
    expect( trait.chartHeight()).toBe( 296)


//        .trait( d3.traits.scale.linear.y)
//        .trait( d3.traits.scale.time.x)
//        .trait( d3.traits.axis.month.x)
//        .trait( d3.traits.chart.bar, { seriesFilter: function( s, i) { return i == 0} })
//        .trait( d3.traits.chart.line2)
//        .trait( d3.traits.axis.y)

});


