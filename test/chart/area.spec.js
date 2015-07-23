describe('d3.trait.chart.area', function() {

  var chartDiv
  var selection
  var data = [
    [{x: 1, y: 2}, {x: 2, y: 3}, {x: 5, y: 5}],
    [{x: 1, y: 2}, {x: 2, y: 3}, {x: 5, y: 5}],
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

  function actualNumber( n) {
    return n === 4
      ? 3.999999999999999
      : n
  }

  function makePath( series, yMax) {
    var index,
        path = 'M' + series[0].x + ',' + (yMax - series[0].y)

    for( index = 1; index < series.length; index++)
      path += 'L' + series[index].x + ',' + (yMax - series[index].y)
    for( index = series.length - 1; index >= 0; index--)
      path += 'L' + series[index].x + ',' + yMax
    path += 'Z'

    return path
  }

  function makeStackedPath( series, yMax, seriesUnderStack) {
    var index,
        path = 'M' + series[0].x + ',' + actualNumber(yMax - (series[0].y + seriesUnderStack[0].y))

    for( index = 1; index < series.length; index++)
      path += 'L' + series[index].x + ',' + actualNumber(yMax - (series[index].y + seriesUnderStack[index].y))
    for( index = series.length - 1; index >= 0; index--)
      path += 'L' + series[index].x + ',' + actualNumber(yMax - seriesUnderStack[index].y)
    path += 'Z'

    return path
  }

  beforeEach(function() {
    chartDiv = affix('.chart-div[style="width: 10px; height: 10px"]')
    selection = d3.select(".chart-div")
  })


  it('should create g.chart-area and path.area', function() {

    var div, chartGroup, chartInstanceGroup, seriesGroup, path,
        domain = [0,10]

    selection.datum(data)
      .traitConfig(config)
      .trait(d3.trait.chart.base)
      .trait(d3.trait.scale.linear, {axis: 'x1', domain: domain})
      .trait(d3.trait.scale.linear, {axis: 'y1', domain: domain})
      .trait(d3.trait.chart.area)

    div = selection[0][0]
    chartGroup = div._chartGroup[0][0]
    chartInstanceGroup = chartGroup.firstChild
    expect(chartInstanceGroup).toBeElement("g.chart-area")
    expect(chartInstanceGroup.childElementCount).toBe(data.length)

    // area 1
    seriesGroup = chartInstanceGroup.firstChild
    expect(seriesGroup).toBeElement("g.series")
    expect(seriesGroup.childElementCount).toBe(1)

    path = seriesGroup.firstChild
    expect(path).toBeElement("path.area")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( makePath( data[0], 10))


    // area 2
    seriesGroup = chartInstanceGroup.children[1]
    expect(seriesGroup).toBeElement("g.series")
    expect(seriesGroup.childElementCount).toBe(1)

    path = seriesGroup.firstChild
    expect(path).toBeElement("path.area")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( makePath( data[0], 10))

  });

  it('should create stacked g.chart-area and path.area', function() {

    var div, chartGroup, chartInstanceGroup, seriesGroup, path,
        domain = [0,10]

    selection.datum(data)
      .traitConfig(config)
      .trait(d3.trait.chart.base)
      .trait(d3.trait.scale.linear, {axis: 'x1', domain: domain})
      .trait(d3.trait.scale.linear, {axis: 'y1', domain: domain})
      .trait(d3.trait.chart.area,   {stacked: true})

    div = selection[0][0]
    chartGroup = div._chartGroup[0][0]
    chartInstanceGroup = chartGroup.firstChild

    // area 1
    seriesGroup = chartInstanceGroup.firstChild
    path = seriesGroup.firstChild
    expect(path).toBeElement("path.area")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( makePath( data[0], 10))


    // stacked area 2
    seriesGroup = chartInstanceGroup.children[1]
    path = seriesGroup.firstChild
    expect(path).toBeElement("path.area")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( makeStackedPath( data[1], 10, data[0]))


  });


});


