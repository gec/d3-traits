describe('d3.trait.chart.area', function() {

  var chartDiv, selection, data, scaleY,
      yMax = 10,
      access = {
        x: function(d) { return d.x; },
        y: function(d) { return d.y; },
        seriesData: function(s) { return s},
        seriesLabel: function(s, i) { return 'Series ' + i}
      },
      config = {
        x1:         access.x,
        y1:         access.y,
        seriesData: access.seriesData,
        margin: {top: 0, right: 0, bottom: 0, left: 0}
      }

  function isString(obj) {
    return Object.prototype.toString.call(obj) == '[object String]'
  }

  function actualNumber( n) {
    // 2 is 1.9999999999999996
    // 4 is 3.999999999999999
    if( n === 2)
      return 1.9999999999999996

    if( n === 5.833333333333333)
      return 5.833333333333332

    if( n === 1.666666666666666)
      return 1.6666666666666663

    return n
  }

  function makePath( series, scaleY, access) {
    var index,
        path = 'M' + access.x( series[0]) + ',' + actualNumber(yMax - scaleY(access.y( series[0])))

    for( index = 1; index < series.length; index++)
      path += 'L' + access.x( series[index]) + ',' + actualNumber(yMax - scaleY(access.y( series[index])))
    for( index = series.length - 1; index >= 0; index--)
      path += 'L' + access.x( series[index]) + ',' + yMax
    path += 'Z'

    return path
  }

  function makeStackedPath( series, scaleY, seriesUnderStack, access) {
    var index,
        path = 'M' + access.x( series[0]) + ',' + actualNumber(yMax - scaleY(access.y( series[0]) + access.y( seriesUnderStack[0])))

    for( index = 1; index < series.length; index++)
      path += 'L' + access.x( series[index]) + ',' + actualNumber(yMax - scaleY(access.y( series[index]) + access.y( seriesUnderStack[index])))
    for( index = series.length - 1; index >= 0; index--)
      path += 'L' + access.x( series[index]) + ',' + actualNumber(yMax - scaleY(access.y( seriesUnderStack[index])))
    path += 'Z'

    return path
  }

  beforeEach(function() {
    chartDiv = affix('.chart-div[style="width: 10px; height: '+yMax+'px"]')
    selection = d3.select(".chart-div")
    data = [
      [{x: 1, y: 2}, {x: 2, y: 3}, {x: 5, y: 5}],
      [{x: 1, y: 2}, {x: 2, y: 3}, {x: 5, y: 5}]
    ]
    scaleY = d3.scale.linear()
      .range( [0, yMax])
      .domain( [0, 5])  // not stacked.
  })


  it('should create g.chart-area and path.area', function() {

    var div, chartGroup, chartInstanceGroup, seriesGroup, path,
        domain = [0,10]

    scaleY.domain(domain) // constant

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
    expect( path.attr('d')).toEqual( makePath( data[0], scaleY, access))


    // area 2
    seriesGroup = chartInstanceGroup.children[1]
    expect(seriesGroup).toBeElement("g.series")
    expect(seriesGroup.childElementCount).toBe(1)

    path = seriesGroup.firstChild
    expect(path).toBeElement("path.area")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( makePath( data[0], scaleY, access))

  });

  it('should create stacked g.chart-area and path.area', function() {

    var traits, div, chartGroup, chartInstanceGroup, seriesGroup, path,
        domain = [0,10]

    scaleY.domain(domain) // constant

    traits = d3.trait( d3.trait.chart.base, config )
      .trait(d3.trait.scale.linear, {axis: 'x1', domain: domain})
      .trait(d3.trait.scale.linear, {axis: 'y1', domain: domain})
      .trait(d3.trait.chart.area,   {stacked: true})
    selectionDatum = selection.datum( data)
    traits.call( selectionDatum)

    div = selection[0][0]
    chartGroup = div._chartGroup[0][0]
    chartInstanceGroup = chartGroup.firstChild

    // area 1
    seriesGroup = chartInstanceGroup.firstChild
    path = seriesGroup.firstChild
    expect(path).toBeElement("path.area")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( makePath( data[0], scaleY, access))


    // stacked area 2
    seriesGroup = chartInstanceGroup.children[1]
    path = seriesGroup.firstChild
    expect(path).toBeElement("path.area")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( makeStackedPath( data[1], scaleY, data[0], access))


  });

  it('should update stacked g.chart-area and path.area with new data', function() {

    var traits, selectionDatum, div, chartGroup, chartInstanceGroup, seriesGroup, path,
        domain = [0,10]

    traits = d3.trait( d3.trait.chart.base, config )
      .trait(d3.trait.scale.linear, {axis: 'x1', domain: domain})
      .trait(d3.trait.scale.linear, {axis: 'y1'})
      .trait(d3.trait.chart.area,   {stacked: true})
    selectionDatum = selection.datum( data)
    traits.call( selectionDatum)

    data = [
      [{x: 1, y: 5}, {x: 2, y: 4}, {x: 5, y: 2}],
      [{x: 1, y: 5}, {x: 2, y: 4}, {x: 5, y: 2}]
    ]
    scaleY.domain([0,10]) // stacked

    console.log( '--------------------------------- area.spec.js traits.call')
    console.log( '--------------------------------- area.spec.js traits.call')
    console.log( '--------------------------------- area.spec.js traits.call')
    selectionDatum = selection.datum( data)
    traits.call( selectionDatum)

    div = selectionDatum[0][0]
    chartGroup = div._chartGroup[0][0]
    chartInstanceGroup = chartGroup.firstChild

    // area 1
    seriesGroup = chartInstanceGroup.firstChild
    path = seriesGroup.firstChild
    expect(path).toBeElement("path.area")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( makePath( data[0], scaleY, access))


    // stacked area 2
    seriesGroup = chartInstanceGroup.children[1]
    path = seriesGroup.firstChild
    expect(path).toBeElement("path.area")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( makeStackedPath( data[1], scaleY, data[0], access))

    var i,
        s = data.length
    while( --s >= 0) {
      i = data[s].length
      while( --i >= 0)
        data[s][i].y += 1
    }
    scaleY.domain([0,12]) // stacked

console.log( '--------------------------------- area.spec.js update domain')
console.log( '--------------------------------- area.spec.js update domain')
console.log( '--------------------------------- area.spec.js update domain')
    traits.update( "domain", 0)

    // area 1
    seriesGroup = chartInstanceGroup.firstChild
    path = seriesGroup.firstChild
    expect(path).toBeElement("path.area")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( makePath( data[0], scaleY, access))

    // stacked area 2
    seriesGroup = chartInstanceGroup.children[1]
    path = seriesGroup.firstChild
    expect(path).toBeElement("path.area")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( makeStackedPath( data[1], scaleY, data[0], access))

  });

  it('should create stacked resample g.chart-area and path.area', function() {

    var div, chartGroup, chartInstanceGroup, seriesGroup, path,
        domain = [0,10],
        access2 = {
          x: function(d) { return d.x1; },
          y: function(d) { return d.y1; },
          seriesData: function(s) { return s}
        },
        config2 = {
          x1:         access2.x,
          y1:         access2.y,
          seriesData: accessSeriesData,
          margin: {top: 0, right: 0, bottom: 0, left: 0}
        },
        data2 = [
          [{x1: 1, y1: 2}, {x1: 2, y1: 3}, {x1: 5, y1: 5}],
          [{x1: 1, y1: 2}, {x1: 2, y1: 3}, {x1: 5, y1: 5}]
        ]

    scaleY.domain(domain) // constant

    selection.datum(data2)
      .traitConfig(config2)
      .trait(d3.trait.chart.base)
      .trait(d3.trait.scale.linear, {axis: 'x1', domain: domain})
      .trait(d3.trait.scale.linear, {axis: 'y1', domain: domain})
      .trait(d3.trait.chart.area,   {stacked: true, resample: {interpolate: 'uniform-x'}})

    div = selection[0][0]
    chartGroup = div._chartGroup[0][0]
    chartInstanceGroup = chartGroup.firstChild

    // area 1
    seriesGroup = chartInstanceGroup.firstChild
    path = seriesGroup.firstChild
    expect(path).toBeElement("path.area")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( makePath( data2[0], scaleY, access2))


    // stacked area 2
    seriesGroup = chartInstanceGroup.children[1]
    path = seriesGroup.firstChild
    expect(path).toBeElement("path.area")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( makeStackedPath( data2[1], scaleY, data2[0], access2))


  });

  it('should update stacked resample g.chart-area and path.area', function() {

    var traits, selectionDatum, div, chartGroup, chartInstanceGroup, seriesGroup, path,
        domain = [0,10],
        access2 = {
          x: function(d) { return d.x1; },
          y: function(d) { return d.y1; },
          seriesData: function(s) { return s}
        },
        config2 = {
          x1:         access2.x,
          y1:         access2.y,
          seriesData: accessSeriesData,
          margin: {top: 0, right: 0, bottom: 0, left: 0}
        },
        data2 = [
          [{x1: 1, y1: 2}, {x1: 2, y1: 3}, {x1: 5, y1: 5}],
          [{x1: 1, y1: 2}, {x1: 2, y1: 3}, {x1: 5, y1: 5}]
        ]

    scaleY.domain(domain) // constant

    traits = d3.trait( d3.trait.chart.base, config2 )
      .trait(d3.trait.scale.linear, {axis: 'x1', domain: domain})
      .trait(d3.trait.scale.linear, {axis: 'y1', domain: domain})
      .trait(d3.trait.chart.area,   {stacked: true, resample: {interpolate: 'uniform-x'}})
    selectionDatum = selection.datum( data2)
    traits.call( selectionDatum)

    div = selection[0][0]
    chartGroup = div._chartGroup[0][0]
    chartInstanceGroup = chartGroup.firstChild

    // area 1
    seriesGroup = chartInstanceGroup.firstChild
    path = seriesGroup.firstChild
    expect(path).toBeElement("path.area")
    path = d3.select( path)
    console.log( "area path before 10 " + makePath( data2[0], scaleY, access2))
    expect( path.attr('d')).toEqual( makePath( data2[0], scaleY, access2))


    // stacked area 2
    seriesGroup = chartInstanceGroup.children[1]
    path = seriesGroup.firstChild
    expect(path).toBeElement("path.area")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( makeStackedPath( data2[1], scaleY, data2[0], access2))


    var i,
        s = data2.length
    while( --s >= 0) {
      i = data2[s].length
      while( --i >= 0)
        data2[s][i].y1 -= 1
    }

    traits.update( 'trend', 0)

    seriesGroup = chartInstanceGroup.firstChild
    path = seriesGroup.firstChild
    expect(path).toBeElement("path.area")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( makePath( data2[0], scaleY, access2))


    // stacked area 2
    seriesGroup = chartInstanceGroup.children[1]
    path = seriesGroup.firstChild
    expect(path).toBeElement("path.area")
    path = d3.select( path)
    expect( path.attr('d')).toEqual( makeStackedPath( data2[1], scaleY, data2[0], access2))

  });


});


