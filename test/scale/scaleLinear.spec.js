describe('d3.trait.scale.linear', function() {

  var chartDiv, selection, data,
      parseDate = d3.time.format("%Y-%m-%d").parse,   // ISO 8601 ex: "2013 07 31"
      Jan01 = parseDate("2013-01-01"),
      Jan15 = parseDate("2013-01-15"),
      Jan31 = parseDate("2013-01-31"),
      Feb01 = parseDate("2013-02-01"),
      dataWithDates = [
        [
          {x: Jan01, y: 4},
          {x: Jan15, y: 5},
          {x: Jan31, y: 6}
        ]
      ]

  var accessX1 = function(d) { return d.x; }
  var accessY1 = function(d) { return d.y; }
  var config = {
    x1: accessX1,
    y1: accessY1
  }

  var _element,
      mockY1ExtendDomain = jasmine.createSpy('y1ExtendDomain')

  function _mockChart(_super, _config) {
    function mockChart(_selection) {
      var self = mockChart

      _selection.each(function(_data) {
        _element = this
      })
    }
    mockChart.y1ExtendDomain = mockY1ExtendDomain

    return mockChart
  }
  var mockChart = _mockChart


  beforeEach(function() {
    chartDiv = affix('.chart-div[style="width: 300px; height: 200px"]')
    selection = d3.select(".chart-div")
    mockY1ExtendDomain.calls.reset()

    data = [
      [
        {x: 1, y: 4},
        {x: 2, y: 5},
        {x: 3, y: 6}
      ]
    ]

  })

  it('should setup Y domain and range', function() {
    selection.datum(data)
    var chart = d3.trait(d3.trait.chart.base, config)
      .trait(d3.trait.scale.linear, {axis: 'y1'})
      .call(selection)

    var scale = chart.y1()
    expect(scale).toBeDefined()

    var min = d3.min(data[0], accessY1)
    var max = d3.max(data[0], accessY1)
    expect(scale.domain()).toEqual([ min, max])
    expect(scale.range()).toEqual([190, 0])
  });

  it('should setup X domain and range', function() {
    selection.datum(data)
    var chart = d3.trait(d3.trait.chart.base, config)
      .trait(d3.trait.scale.linear, {axis: 'x1'})
      .call(selection)

    var scale = chart.x1()
    expect(scale).toBeDefined()

    var min = d3.min(data[0], accessX1)
    var max = d3.max(data[0], accessX1)
    expect(scale.domain()).toEqual([ min, max])
    expect(scale.range()).toEqual([0, 290])
  });

  it('should configure domain with manual', function() {
    var chart, scale,
        min = 0,
        max = d3.max(data[0], accessY1)

    selection.datum(data)
    chart = d3.trait(d3.trait.chart.base, config)
      .trait(d3.trait.scale.linear, {axis: 'y1', domain: 'manual'})
      .call(selection)

    scale = chart.y1()
    expect(scale).toBeDefined()

    expect(scale.domain()).toEqual([ 0, 1])
    expect(scale.range()).toEqual([190, 0])
  });

  it('should configure domain with min', function() {
    var chart, scale,
        min = 0,
        max = d3.max(data[0], accessY1)

    selection.datum(data)
    chart = d3.trait(d3.trait.chart.base, config)
      .trait(d3.trait.scale.linear, {axis: 'y1', domain: {min: min}})
      .call(selection)

    scale = chart.y1()
    expect(scale).toBeDefined()

    expect(scale.domain()).toEqual([ min, max])
    expect(scale.range()).toEqual([190, 0])
  });

  it('should configure domain with max', function() {
    var chart, scale,
        min = d3.min(data[0], accessY1),
        max = 0

    selection.datum(data)
    chart = d3.trait(d3.trait.chart.base, config)
      .trait(d3.trait.scale.linear, {axis: 'y1', domain: {max: max}})
      .call(selection)

    scale = chart.y1()
    expect(scale).toBeDefined()

    expect(scale.domain()).toEqual([ min, max])
    expect(scale.range()).toEqual([190, 0])
  });

  it('should configure domain with min and max', function() {
    var chart, scale,
        min = 0,
        max = 999

    selection.datum(data)
    chart = d3.trait(d3.trait.chart.base, config)
      .trait(d3.trait.scale.linear, {axis: 'y1', domain: {min: 0, max: 999}})
      .call(selection)

    scale = chart.y1()
    expect(scale).toBeDefined()

    expect(scale.domain()).toEqual([ min, max])
    expect(scale.range()).toEqual([190, 0])
  });

  it('should configure domain', function() {
    var chart, scale,
        min = 0,
        max = 999

    selection.datum(data)
    chart = d3.trait(d3.trait.chart.base, config)
      .trait(d3.trait.scale.linear, {axis: 'y1', domain: [min, max]})
      .call(selection)

    scale = chart.y1()
    expect(scale).toBeDefined()

    expect(scale.domain()).toEqual([ min, max])
    expect(scale.range()).toEqual([190, 0])
  });

  it('should ask child chart to extend domain and call y1 listener', function() {
    var chart, scale,
        min = 0,
        max = 999,
        extent = [0, 10],
        y1Listener = jasmine.createSpy('y1Listener'),
        arrayUndefined = []
    arrayUndefined[0] = undefined
    arrayUndefined[1] = undefined

    mockY1ExtendDomain.and.returnValue(extent)
    selection.datum(data)
    chart = d3.trait(d3.trait.chart.base, config)
      .trait(d3.trait.scale.linear, {axis: 'y1'})
      .trait(mockChart, {})
      .y1AddListener( y1Listener)

    // Domain is based on data, so won't call listener until the chart.call( selection) with data.
    expect( y1Listener.calls.count()).toBe( 0)

    chart.call(selection)
    scale = chart.y1()

    expect( y1Listener.calls.count()).toBe( 1)
    expect( y1Listener.calls.first()).toEqual( {object: _element, args: [scale]})

    expect( mockY1ExtendDomain.calls.count()).toBe( 1)
    expect( mockY1ExtendDomain.calls.first()).toEqual( {object: chart._super, args: [ arrayUndefined, data]})
    expect(scale.domain()).toEqual(extent)


  });

  it('should ask child chart to extend domain', function() {
    var chart, scale,
        min = 0,
        max = 999,
        extent = [0, 10],
        y1Listener = jasmine.createSpy('y1Listener')

    mockY1ExtendDomain.and.returnValue(extent)
    selection.datum(data)
    chart = d3.trait(d3.trait.chart.base, config)
      .trait(d3.trait.scale.linear, {axis: 'y1', domain: [min, max]})
      .trait(mockChart, {})
      .y1AddListener( y1Listener)

    scale = chart.y1()

    // Calls listener immediately upon add because the domain is defined in config as constant.
    expect( y1Listener.calls.count()).toBe( 1)
    expect( y1Listener.calls.first()).toEqual( {object: chart, args: [scale]})

    chart.call(selection)

    // Never calls listener again because the domain is defined in config as constant.
    expect( y1Listener.calls.count()).toBe( 1)

    // Never calls y1ExtendDomain because the domain is defined in config as constant.
    expect( mockY1ExtendDomain.calls.count()).toBe( 0)

    expect(scale.domain()).toEqual([min,max])

  });

  it('should constrain domain to domain.min', function() {
    var chart, scale,
        min = 5,
        max = d3.max(data[0], accessY1),
        extent = [0, 10]

    mockY1ExtendDomain.and.returnValue(extent)
    selection.datum(data)
    chart = d3.trait(d3.trait.chart.base, config)
      .trait(d3.trait.scale.linear, {axis: 'y1', domain: {min: min}})
      .trait(mockChart, {})

    chart.call(selection)
    scale = chart.y1()

    expect(scale.domain()).toEqual([min,extent[1]])

    chart.update( 'domain', 0)

    expect(scale.domain()).toEqual([min,extent[1]])

  });


  it('should update domain after UpdateUnion', function() {
    var chart, scale, externalScale,
        min = 5,
        max = d3.max(data[0], accessY1),
        extent = [0, 10]

    mockY1ExtendDomain.and.returnValue(extent)
    selection.datum(data)
    chart = d3.trait(d3.trait.chart.base, config)
      .trait(d3.trait.scale.linear, {axis: 'y1', domain: {min: min}})
      .trait(mockChart, {})

    chart.call(selection)
    scale = chart.y1()

    expect(scale.domain()).toEqual([min,extent[1]])


    chart.update( 'domain', 0)
    expect(scale.domain()).toEqual([min,extent[1]])

    // y1UpdateUnion with [0, 15]
    externalScale = d3.scale.linear()
      .domain([0,15])
    chart.y1UpdateUnion( externalScale)
    expect(scale.domain()).toEqual([min,15])

    // y1ExtendDomain with [0, 15]
    extent = [0, 20]
    mockY1ExtendDomain.and.returnValue(extent)
    chart.update( 'domain', 0)
    expect(scale.domain()).toEqual([min,extent[1]])

  });

  it('should not update domain set to manual', function() {
    var chart, scale, externalScale, domain,
        min = 5,
        max = d3.max(data[0], accessY1),
        extent = [0, 10]

    mockY1ExtendDomain.and.returnValue(extent)
    selection.datum(data)
    chart = d3.trait(d3.trait.chart.base, config)
      .trait(d3.trait.scale.linear, {axis: 'y1', domain: 'manual'})
      .trait(mockChart, {})

    chart.y1Domain( [-1,2])
    domain = chart.y1Domain()
    expect(domain).toEqual([-1, 2])

    chart.call(selection)
    scale = chart.y1()

    expect(scale.domain()).toEqual([-1, 2])


    chart.update( 'domain', 0)
    expect(scale.domain()).toEqual([-1,2])

  });


});


