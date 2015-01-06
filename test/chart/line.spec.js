describe('d3.trait.chart.line', function() {

  var chartDiv
  var selection
  var data = [
    [
      {x: 1, y: 4},
      {x: 2, y: 5},
      {x: 3, y: 6}
    ]
  ]
  var accessX1 = function(d) { return d.x; }
  var accessY1 = function(d) { return d.y; }
  var accessSeriesData = function(s, i) { return s}
  var config = {
    x1:         accessX1,
    y1:         accessY1,
    seriesData: accessSeriesData
  }

  beforeEach(function() {
    chartDiv = affix('.chart-div[style="width: 300px; height: 200px"]')
    selection = d3.select(".chart-div")
  })


  it('should create g.chart-line, g.series, and path.line', function() {

    var traits =  d3.trait( d3.trait.chart.base, config )
      .trait( d3.trait.scale.time, {axis: 'x1'})
      .trait( d3.trait.scale.linear, {axis: 'y1'})
      .trait(d3.trait.chart.line)

    selection.datum( data)
    traits.call( selection)

    var div = selection[0][0]
    var chartGroup = div._chartGroup[0][0]

    var chartInstanceGroup = chartGroup.firstChild
    expect(chartInstanceGroup).toBeElement("g.chart-line")
    expect(chartInstanceGroup.childElementCount).toBe(data.length)

    var seriesGroup = chartInstanceGroup.firstChild
    expect(seriesGroup).toBeElement("g.series")
    expect(seriesGroup.childElementCount).toBe(1)

    var path = seriesGroup.firstChild
    expect(path).toBeElement("path.line")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( 'M0,190L145,95L290,0')

  });

  it('should create trend line extending to right edge of chart', function() {

    var traits =  d3.trait( d3.trait.chart.base, config )
      .trait( d3.trait.scale.time, {axis: 'x1', domainMax: 290})
      .trait( d3.trait.scale.linear, {axis: 'y1'})
      .trait(d3.trait.chart.line, { interpolate: 'step-after', trend: true})

    var data2 = [
      [
        {x:   0, y: 4},
        {x:  90, y: 5},
        {x: 190, y: 3}
      ]
    ]

    selection.datum( data2)
    traits.call( selection)

    var div = selection[0][0]
    var chartGroup = div._chartGroup[0][0]

    var chartInstanceGroup = chartGroup.firstChild
    expect(chartInstanceGroup).toBeElement("g.chart-line")
    expect(chartInstanceGroup.childElementCount).toBe(data.length)

    var seriesGroup = chartInstanceGroup.firstChild
    expect(seriesGroup).toBeElement("g.series")
    expect(seriesGroup.childElementCount).toBe(1)

    var path = seriesGroup.firstChild
    expect(path).toBeElement("path.line")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( 'M0,95H90V0H190V190H290')

  });

  it('should create trend line that updates with time', function() {

    var timeConfig = {
          axis: 'x1',
          trend: {
            track: 'current-time',
            domain: {
              interval: d3.time.minute,
              count: 1 }
          }
        }

    var traits =  d3.trait( d3.trait.chart.base, config )
      .trait( d3.trait.scale.time, timeConfig)
      .trait( d3.trait.scale.linear, {axis: 'y1'})
      .trait(d3.trait.chart.line, { interpolate: 'step-after', trend: true})

    var data2 = [
      [
        {x:  0, y: 0}
      ]
    ]

    selection.datum( data2)
    traits.call( selection)

    var div = selection[0][0]
    var chartGroup = div._chartGroup[0][0]
    var chartInstanceGroup = chartGroup.firstChild
    var seriesGroup = chartInstanceGroup.firstChild
    var path = d3.select( seriesGroup.firstChild)
    expect( path.attr('d')).toEqual( 'M0,190H290')

  });

});


