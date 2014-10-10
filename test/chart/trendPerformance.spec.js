describe('trend performance', function() {

  function FrameRateTimer( _start) {
    this.start = _start
    this.frames = 0
    this.end = _start
  }
  FrameRateTimer.prototype.rate = function() {
    var elapsed = this.elapsed() / 1000.0
    return elapsed > 0 ? Math.round(this.frames / elapsed)
      : 0
  }
  FrameRateTimer.prototype.frame = function( now) {
    this.frames ++
    this.end = now
  }
  FrameRateTimer.prototype.elapsed = function() {
    return this.end - this.start
  }
  FrameRateTimer.prototype.reset = function(now) {
    this.frames = 0
    this.start = now
    this.end = now
  }

  var chartDiv, brushDiv
  var selection, brushSelection
  function getData( count) {
    var i = 0,
        time = 0, //new Date().getTime()
        data = []

    for( i = 0; i < count; i++) {
      data.push( {date: time, y: i + Math.random()})
      time += 1000
    }
    return data
  }
  var dataCount = 100,
      data = [ getData( dataCount) ]

  var accessX1 = function(d) { return d.date; }
  var accessY1 = function(d) { return d.y; }
  var accessSeriesData = function(s, i) { return s}
  var config = {
    x1:         accessX1,
    y1:         accessY1,
    seriesData: accessSeriesData
  }

  function makeBrushTraits( target) {
    return d3.trait( d3.trait.chart.base, config )
      .trait( d3.trait.scale.time, { axis: "x1"})
      .trait( d3.trait.scale.linear, { axis: "y1" })
      .trait( d3.trait.chart.line, { interpolate: "monotone" })  // "linear"
      .trait( d3.trait.control.brush, { axis: 'x1', target: target, targetAxis: 'x1'})
      .trait( d3.trait.axis.time.month, { axis: "x1", ticks: 3})
      .trait( d3.trait.axis.linear, { axis: "y1", extentTicks: true})
  }


  beforeEach(function() {
    chartDiv = affix('.chart-div[style="width: 600px; height: 400px; fill: none"]')
    brushDiv = affix('.brush-div[style="width: 600px; height: 100px; fill: none"]')
    selection = d3.select(".chart-div")
    brushSelection = d3.select(".brush-div")
  })

  describe("Chart update", function() {
    var originalTimeout;
    beforeEach(function() {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 50 * 60 * 1000;
    });

    it("should handle chart updates with reasonable frame rate", function(done) {
      selection.datum(data)
      brushSelection.datum(data)
      var chart = d3.trait(d3.trait.chart.base, config)
        .trait(d3.trait.scale.time, {axis: 'x1'})
        .trait(d3.trait.scale.linear, {axis: 'y1'})
        .trait(d3.trait.axis.time.month, {axis: 'x1', gridLines: true})
        .trait(d3.trait.axis.linear, {axis: 'y1', gridLines: true})
        .trait(d3.trait.chart.line)
        .call(selection)

      var brush = makeBrushTraits( chart)
      brush.call( brushSelection)

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

      var frameRateDone = false,
          now = Date.now(),
          timerTotal = new FrameRateTimer( now),
          timerOneSecond = new FrameRateTimer( now),
          timings = []

      console.log( 'now = ' + now)
      function animationFrame() {
        if( ! frameRateDone) {
          var now = Date.now()

          timerTotal.frame( now)
          timerOneSecond.frame( now)
          if( timerOneSecond.elapsed() >= 1000) {
            timings.push( timerOneSecond.rate())
            timerOneSecond.reset( now)
          }
          requestAnimationFrame(animationFrame)
        }
      }
      requestAnimationFrame(animationFrame)

      function startUpdates() {

        var intervalId = setInterval( function() {
          var series = data[0],
              length = series.length,
              last = series[ length-1],
              rate = timings.length > 0 ? timings[timings.length-1] : '-'

          console.log( 'interval ' + last.y + ', timerOneSecond.rate: ' + rate )
          if( length < dataCount + 2) {
            series.push( {date: last.date+500, y: last.y+1+Math.random()})
//            chart.update( "trend")
            brush.update( "trend")
          } else {
            clearInterval( intervalId)
            frameRateDone = true
            console.log( 'Framerates = ' + timings)
            console.log( 'Framerate Average = ' + timerTotal.rate())
            done()
          }
        }, 500)
      }

      setTimeout( startUpdates, 1000)

    });

    afterEach(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });
  });

});


