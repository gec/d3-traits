describe('d3.trait.chart.base', function() {

  var chartDiv
  var selection
  var data = [
    [
      {x: 1, y: 4},
      {x: 2, y: 5},
      {x: 3, y: 6}
    ]
  ]

  beforeEach(function() {
    chartDiv = affix('.chart-div[style="width: 300px; height: 200px"]')
    selection = d3.select(".chart-div")
  })

  it('should handle undefined base config', function() {
    var chart = d3.trait(d3.trait.chart.base)
  });

  it('should supply default seriesData accessor for empty base config', function() {
    var config = {}
    var chart = d3.trait(d3.trait.chart.base, config)
    var d = config.seriesData(data[0])
    expect(d.length).toBe(3)
  });

  it('should seriesData accessor for base config', function() {
    var seriesAccessor = function(s) { return s}
    var config = { seriesData: seriesAccessor }
    var chart = d3.trait(d3.trait.chart.base, config)
    expect(config.seriesData).toBe(seriesAccessor)
  });

  it('should append svg.chart and g.container-group', function() {
    selection.datum(data)
      .trait(d3.trait.chart.base)
    var div = selection[0][0]
    expect(div.tagName).toBe("DIV")
    expect(div.firstChild.tagName).toBe("svg")

    var svgElem = selection[0][0].firstChild
    expect(svgElem.tagName).toBe("svg")
    expect(svgElem.className.baseVal).toBe("chart")
    expect(svgElem.getAttribute("width")).toBe("300")
    expect(svgElem.getAttribute("height")).toBe("200")

    var containerGroup = svgElem.childNodes[1]
    expect(containerGroup.tagName).toBe("g")
    expect(containerGroup.className.baseVal).toBe("container-group")

    var chartGroup = containerGroup.firstChild
    expect(chartGroup.tagName).toBe("g")
    expect(chartGroup.className.baseVal).toBe("chart-group")

    expect(div._container[0][0]).toBe(containerGroup)
    expect(div._chartGroup[0][0]).toBe(chartGroup)
  });

  it('should define a clip path and apply it to chart-group', function() {
    selection.datum(data)
      .trait(d3.trait.chart.base)
    var svgElem = selection[0][0].firstChild


    // Clip path defined
    var defs = svgElem.firstChild
    expect(defs.tagName).toBe("defs")
    var clipPath = defs.firstChild
    expect(clipPath.tagName).toBe("clipPath")
    expect(clipPath.id).toMatch(/chart-group-clip-path/)
    var rect = clipPath.firstChild
    expect(rect.tagName).toBe("rect")
    expect(rect.getAttribute("width")).toBe("290")
    expect(rect.getAttribute("height")).toBe("190")

    // Clip path applied to chartGroup
    var containerGroup = svgElem.childNodes[1]
    var chartGroup = containerGroup.firstChild
    expect(chartGroup.tagName).toBe("g")
    expect(chartGroup.getAttribute("clip-path")).toMatch(/chart-group-clip-path/)

  });

  it('should get/update width, height, chartWidth and chartHeight', function() {

    var chart = d3.trait(d3.trait.chart.base)
    var s = selection.datum(data)
    chart.call(s)

    var chartResizedCount = 0
    chart.onChartResized("nameSpace", function() { chartResizedCount++})

    expect(chart.width()).toBe(300)
    expect(chart.height()).toBe(200)

    expect(chart.marginTop()).toBe(5)
    expect(chart.marginBottom()).toBe(5)
    expect(chart.marginLeft()).toBe(5)
    expect(chart.marginRight()).toBe(5)

    expect(chart.chartWidth()).toBe(290)
    expect(chart.chartHeight()).toBe(190)

    // Update width/height will effect chartWidth/chartHeight
    chart.width(400)
    expect(chartResizedCount).toBe(1)
    chart.height(300)
    expect(chartResizedCount).toBe(2)
    expect(chart.width()).toBe(400)
    expect(chart.height()).toBe(300)
    expect(chart.chartWidth()).toBe(390)
    expect(chart.chartHeight()).toBe(290)

    // Update chartWidth/chartHeight will effect width/height
    chart.chartWidth(400)
    expect(chartResizedCount).toBe(3)
    chart.chartHeight(300)
    expect(chartResizedCount).toBe(4)
    expect(chart.width()).toBe(410)
    expect(chart.height()).toBe(310)
    expect(chart.chartWidth()).toBe(400)
    expect(chart.chartHeight()).toBe(300)

  });

  it('margin update should effect chartWidth and chartHeight', function() {

    var chart = d3.trait(d3.trait.chart.base)
    var s = selection.datum(data)
    chart.call(s)

    var chartResizedCount = 0
    chart.onChartResized("nameSpace", function() { chartResizedCount++})

    expect(chart.width()).toBe(300)
    expect(chart.height()).toBe(200)
    expect(chart.chartWidth()).toBe(290)
    expect(chart.chartHeight()).toBe(190)

    chart.marginTop(10)
    expect(chartResizedCount).toBe(1)
    expect(chart.marginTop()).toBe(10)
    expect(chart.height()).toBe(200)
    expect(chart.chartHeight()).toBe(185)

    chart.plusMarginTop(10)
    expect(chartResizedCount).toBe(2)
    expect(chart.marginTop()).toBe(20)
    expect(chart.height()).toBe(200)
    expect(chart.chartHeight()).toBe(175)

    chart.marginBottom(10)
    expect(chartResizedCount).toBe(3)
    expect(chart.marginBottom()).toBe(10)
    expect(chart.height()).toBe(200)
    expect(chart.chartHeight()).toBe(170)

    chart.plusMarginBottom(10)
    expect(chartResizedCount).toBe(4)
    expect(chart.marginBottom()).toBe(20)
    expect(chart.height()).toBe(200)
    expect(chart.chartHeight()).toBe(160)

    chart.marginRight(10)
    expect(chartResizedCount).toBe(5)
    expect(chart.marginRight()).toBe(10)
    expect(chart.width()).toBe(300)
    expect(chart.chartWidth()).toBe(285)

    chart.plusMarginRight(10)
    expect(chartResizedCount).toBe(6)
    expect(chart.marginRight()).toBe(20)
    expect(chart.width()).toBe(300)
    expect(chart.chartWidth()).toBe(275)

    chart.marginLeft(10)
    expect(chartResizedCount).toBe(7)
    expect(chart.marginLeft()).toBe(10)
    expect(chart.width()).toBe(300)
    expect(chart.chartWidth()).toBe(270)

    chart.plusMarginLeft(10)
    expect(chartResizedCount).toBe(8)
    expect(chart.marginLeft()).toBe(20)
    expect(chart.width()).toBe(300)
    expect(chart.chartWidth()).toBe(260)
  });

  it('minRangeMargin with object {left, right, top, bottom} should get/update respective range margins', function() {
    var rangeMargin, rangeMarginChangedCount,
        chart = d3.trait(d3.trait.chart.base),
        axis = "x1"

    // onRangeMarginChanged will not notify without selection
    selection.datum(data)
    chart.call(selection)

    rangeMarginChangedCount = 0
    chart.onRangeMarginChanged("nameSpace", function() { rangeMarginChangedCount++})

    rangeMargin = chart.minRangeMargin(axis)
    expect(rangeMargin.left).toBe(0)
    expect(rangeMargin.right).toBe(0)
    expect(rangeMargin.top).toBe(0)
    expect(rangeMargin.bottom).toBe(0)
    expect(rangeMarginChangedCount).toBe(0)

    chart.minRangeMargin(axis, {left: 11, right: 12, top: 13, bottom: 14})
    expect(chart.minRangeMarginLeft(axis)).toBe(11)
    expect(chart.minRangeMarginRight(axis)).toBe(12)
    expect(chart.minRangeMarginTop(axis)).toBe(13)
    expect(chart.minRangeMarginBottom(axis)).toBe(14)
    expect(rangeMarginChangedCount).toBe(1)

    rangeMargin = chart.minRangeMargin(axis)
    expect(rangeMargin.left).toBe(11)
    expect(rangeMargin.right).toBe(12)
    expect(rangeMargin.top).toBe(13)
    expect(rangeMargin.bottom).toBe(14)
    expect(rangeMarginChangedCount).toBe(1)


    chart.minRangeMargin(axis, {left: 21})
    expect(chart.minRangeMarginLeft(axis)).toBe(21)
    expect(chart.minRangeMarginRight(axis)).toBe(12)
    expect(chart.minRangeMarginTop(axis)).toBe(13)
    expect(chart.minRangeMarginBottom(axis)).toBe(14)
    expect(rangeMarginChangedCount).toBe(2)

    chart.minRangeMargin(axis, {right: 22})
    expect(chart.minRangeMarginLeft(axis)).toBe(21)
    expect(chart.minRangeMarginRight(axis)).toBe(22)
    expect(chart.minRangeMarginTop(axis)).toBe(13)
    expect(chart.minRangeMarginBottom(axis)).toBe(14)
    expect(rangeMarginChangedCount).toBe(3)

    chart.minRangeMargin(axis, {top: 23})
    expect(chart.minRangeMarginLeft(axis)).toBe(21)
    expect(chart.minRangeMarginRight(axis)).toBe(22)
    expect(chart.minRangeMarginTop(axis)).toBe(23)
    expect(chart.minRangeMarginBottom(axis)).toBe(14)
    expect(rangeMarginChangedCount).toBe(4)

    chart.minRangeMargin(axis, {bottom: 24})
    expect(chart.minRangeMarginLeft(axis)).toBe(21)
    expect(chart.minRangeMarginRight(axis)).toBe(22)
    expect(chart.minRangeMarginTop(axis)).toBe(23)
    expect(chart.minRangeMarginBottom(axis)).toBe(24)
    expect(rangeMarginChangedCount).toBe(5)

  })

  it('minRangeMarginLeft, Right, Top, Bottom should get/update respective range margins', function() {
    var chart = d3.trait(d3.trait.chart.base),
        axis = "x1"

    // onRangeMarginChanged will not notify without selection
    selection.datum(data)
    chart.call(selection)

    var rangeMarginChangedCount = 0
    chart.onRangeMarginChanged("nameSpace", function() { rangeMarginChangedCount++})

    expect(chart.minRangeMarginLeft(axis)).toBe(0)
    expect(chart.minRangeMarginRight(axis)).toBe(0)
    expect(chart.minRangeMarginTop(axis)).toBe(0)
    expect(chart.minRangeMarginBottom(axis)).toBe(0)
    expect(rangeMarginChangedCount).toBe(0)

    chart.minRangeMarginLeft(axis, 1)
    expect(rangeMarginChangedCount).toBe(1)
    expect(chart.minRangeMarginLeft(axis)).toBe(1)
    expect(chart.minRangeMarginRight(axis)).toBe(0)
    expect(chart.minRangeMarginTop(axis)).toBe(0)
    expect(chart.minRangeMarginBottom(axis)).toBe(0)
    expect(rangeMarginChangedCount).toBe(1)

    chart.minRangeMarginRight(axis, 2)
    expect(chart.minRangeMarginLeft(axis)).toBe(1)
    expect(chart.minRangeMarginRight(axis)).toBe(2)
    expect(chart.minRangeMarginTop(axis)).toBe(0)
    expect(chart.minRangeMarginBottom(axis)).toBe(0)
    expect(rangeMarginChangedCount).toBe(2)

    chart.minRangeMarginTop(axis, 3)
    expect(chart.minRangeMarginLeft(axis)).toBe(1)
    expect(chart.minRangeMarginRight(axis)).toBe(2)
    expect(chart.minRangeMarginTop(axis)).toBe(3)
    expect(chart.minRangeMarginBottom(axis)).toBe(0)
    expect(rangeMarginChangedCount).toBe(3)

    chart.minRangeMarginBottom(axis, 4)
    expect(chart.minRangeMarginLeft(axis)).toBe(1)
    expect(chart.minRangeMarginRight(axis)).toBe(2)
    expect(chart.minRangeMarginTop(axis)).toBe(3)
    expect(chart.minRangeMarginBottom(axis)).toBe(4)
    expect(rangeMarginChangedCount).toBe(4)

  });


});


