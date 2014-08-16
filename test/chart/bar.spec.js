describe('d3.trait.chart.bar', function() {

  var chartDiv
  var selection
  var data = [
    [
      {x: 1, y: 5},
      {x: 2, y: 4},
      {x: 3, y: 6}
    ]
  ]
  var accessX1 = function(d) { return d.x; }
  var accessY1 = function(d) { return d.y; }
  var accessSeriesData = function(s) { return s}
  var config = {
    x1:         accessX1,
    y1:         accessY1,
    seriesData: accessSeriesData,
    margin: {top: 0, right: 0, bottom: 0, left: 0}
  }

  function isString(obj) {
    return Object.prototype.toString.call(obj) == '[object String]'
  }

  beforeEach(function() {
    chartDiv = affix('.chart-div[style="width: 300px; height: 20px"]')
    selection = d3.select(".chart-div")
  })


  it('should create g.chart-bar and rect.bar', function() {

    var domain = [0,10]
    selection.datum(data)
      .traitConfig(config)
      .trait(d3.trait.chart.base)
      .trait(d3.trait.scale.ordinal.bars, {axis: 'x1'})
      .trait(d3.trait.scale.linear, {axis: 'y1', domain: domain})
      .trait(d3.trait.chart.bar)
    //.trait( d3.trait.axis.linear, {axis: 'y1'})

    var div = selection[0][0]
    var chartGroup = div._chartGroup[0][0]

    var chartInstanceGroup = chartGroup.firstChild
    expect(chartInstanceGroup).toBeElement("g.chart-bar")
    expect(chartInstanceGroup.childElementCount).toBe(data.length)

    var seriesGroup = chartInstanceGroup.firstChild
    expect(seriesGroup).toBeElement("g.series")
    expect(seriesGroup.childElementCount).toBe(data[0].length)

    var rect1 = seriesGroup.firstChild
    expect(rect1).toBeElement("rect.bar")
    rect1 = d3.select( rect1)
    expect( rect1.attr('y')).toEqual( '10')
    expect( rect1.attr('height')).toEqual( '10')

  });

  it('should create g.chart-bar and negative rect.bar', function() {

    var dataNegative = [
      [
        {x: 1, y: -5},
        {x: 2, y: 5},
        {x: 3, y: 6}
      ]
    ]

    var domain = [-10,10]
    selection.datum(dataNegative)
      .traitConfig(config)
      .trait(d3.trait.chart.base)
      .trait(d3.trait.scale.ordinal.bars, {axis: 'x1'})
      .trait(d3.trait.scale.linear, {axis: 'y1', domain: domain})
      .trait(d3.trait.chart.bar)
    //.trait( d3.trait.axis.linear, {axis: 'y1'})

    var div = selection[0][0]
    var chartGroup = div._chartGroup[0][0]

    var chartInstanceGroup = chartGroup.firstChild
    expect(chartInstanceGroup).toBeElement("g.chart-bar")
    expect(chartInstanceGroup.childElementCount).toBe(data.length)

    var seriesGroup = chartInstanceGroup.firstChild
    expect(seriesGroup).toBeElement("g.series")
    expect(seriesGroup.childElementCount).toBe(data[0].length)

    // Domain        Scale
    //  10             0
    //
    //   5       --    5
    //          |**|
    //   0 ---------  10
    //     |**|
    //  -5  --        15
    //
    // -10            20
    //
    var rectNeg = seriesGroup.firstChild
    expect(rectNeg).toBeElement("rect.bar")
    rectNeg = d3.select( rectNeg)
    expect( rectNeg.attr('y')).toEqual( '10')
    expect( rectNeg.attr('height')).toEqual( '5')   //15

    var rectPos = d3.select( seriesGroup.children[1])
    expect( rectPos.attr('y')).toEqual( '5')
    expect( rectPos.attr('height')).toEqual( '5')

  });

});


