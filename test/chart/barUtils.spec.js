describe('d3.trait.chart.utils', function() {

  var c, scale, data,
      chartWidth = 100,
      scale = {},
      accessX1 = function(d) { return d.x; },
      accessY1 = function(d) { return d.y;},
      accessSeriesData = function(s) { return s},
      config = {
        x1:         accessX1,
        y1:         accessY1,
        seriesData: accessSeriesData
      }


  beforeEach(function() {
    scale = d3.scale.linear()
      .domain([0, 10])
      .range([0, 10])
    c = {
      width:         'auto',
      // gap is percentage of bar width (0-1)
      gap:           0.1,
      // outerGap can be 0 to greater than 1
      outerGap:      1,
      justification: 'center',
      //insets: 'none' 'extend-domain', 'inset-range', {top: 0, right: 0, bottom: 0, left: 0}
      insets:        'inset-range'
    }
    data = [
      [
        {x: 20, y: 2},
        {x: 30, y: 4}
      ]
    ]
  })


  it('barConfig should return default config', function() {

    c = d3.trait.chart.barUtils.barConfig({},scale)
    expect(c).toEqual({
      width:         'auto',
      gap:           0.1,
      outerGap:      .1,
      justification: 'center',
      insets:        'inset-range',
      stacked:       false
    })
  });

  it('barConfig should return config with specified options', function() {

    c = d3.trait.chart.barUtils.barConfig({
      width:         10,
      gap:           0.5,
      outerGap:      0.7,
      justification: 'left',
      insets:        'extend-domain'
    }, scale)
    expect(c).toEqual({
      width:         10,
      gap:           0.5,
      outerGap:      0.7,
      justification: 'left',
      insets:        'extend-domain',
      stacked:       false
    })

    // if outerGap is not specified, it's the same as gap.
    c = d3.trait.chart.barUtils.barConfig({
      width:         10,
      gap:           0.5,
      justification: 'left',
      insets:        'extend-domain'
    }, scale)
    expect(c).toEqual({
      width:         10,
      gap:           0.5,
      outerGap:      0.5,
      justification: 'left',
      insets:        'extend-domain',
      stacked:       false
    })

  });

  it('rangeExtentOfBarsAndOuterGapForOneSeries should handle empty data', function() {
    var indicesExtent = null
    data = []
    scale.domain([0, 10]).range([0, 10])

    d = d3.trait.chart.barUtils.rangeExtentOfBarsAndOuterGapForOneSeries(data, indicesExtent, accessX1, scale, 5, 1, 1, 'center')
    expect(d).toEqual([0, 10])
  });

  it('rangeExtentOfBarsAndOuterGapForOneSeries should ', function() {
    var indicesExtent = [0, 0]
    data = [
      {x: 5, y: 2}
    ]
    scale.domain([0, 10]).range([0, 10])

    d = d3.trait.chart.barUtils.rangeExtentOfBarsAndOuterGapForOneSeries(data, indicesExtent, accessX1, scale, 5, 1, 1, 'center')
    expect(d).toEqual([1, 8])
  });

  it('getBarDimensions should ', function() {

    scale.domain([0, 100]).range([0, 100])

    d = d3.trait.chart.barUtils.getBarDimensions(data, accessSeriesData, accessX1, c, scale, chartWidth)
    expect(d.width).toBeCloseTo(9, .01)
    expect(d.gap).toBeCloseTo(1, .01)
    expect(d.outerGap).toBeCloseTo(9, .01)
    expect(d.offset).toBeCloseTo(-5, .01)
    expect(d.domainExtent).toBeNull()
    expect(d.minRangeMargin).toBeNull()

  });

  it('getBarDimensions should handle when there is only one data point', function() {

    data = [
      [
        {x: 5, y: 2}
      ]
    ]
    scale.domain([0, 10]).range([0, 10])

    d = d3.trait.chart.barUtils.getBarDimensions(data, accessSeriesData, accessX1, c, scale, chartWidth)
    expect(d.width).toBeCloseTo(8, .01)
    expect(d.gap).toBeCloseTo(1, .01)
    expect(d.outerGap).toBeCloseTo(8, .01)
    expect(d.offset).toBeCloseTo(-4, .01)
    expect(d.domainExtent).toBeNull()
    expect(d.minRangeMargin).toEqual({left: 8})

  });


});


