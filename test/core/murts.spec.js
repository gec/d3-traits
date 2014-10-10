describe('d3-traits.murts', function() {

  var SOURCE = '1s',
      seconds = 1000,
      minutes = 60 * seconds,
      hours = 60 * minutes,
      days = 24 * hours,
      weeks = 7 * days,
      months = 30 * days,
      years = 365 * days,
      resolutionMillis = {
        '1s': 1 * seconds,
        '5s':  5 * seconds,
        '15s': 15 * seconds,
        '30s': 30 * seconds,
        '1m':  1 * minutes,
        '5m':  5 * minutes,
        '15m': 15 * minutes,
        '30m': 30 * minutes,
        '12h': 12 * hours,
        '6h':  6 * hours,
        '1h':  1 * hours,
        '1d':  1 * days,
        '1w':  1 * weeks,
        '1mo':  1 * months,
        '1y':  1 * years + 0.25 * days
      }


  var access = {
    x: function( d) { return d[0] },
    y: function( d) { return d[1] }
  }

  function makeData( step, count) {
    var i,
        d = []
    for( i = 0; i < count; i++)
      d[d.length] = [ i * step, i]
    return d
  }



  beforeEach(function() {
  })

  it('murts.request should have the correct resolution', function() {
    var r = d3.trait.murts.request().size( 2)

    r.extent( [0, 2 * seconds])
    expect(r.resolution()).toBe( '1s')
    r.extent( [0, 2 * 5 * seconds])
    expect(r.resolution()).toBe( '5s')
    r.extent( [0, 2 * 15 * seconds])
    expect(r.resolution()).toBe( '15s')
    r.extent( [0, 2 * 30 * seconds])
    expect(r.resolution()).toBe( '30s')

    r.extent( [0, 2 * minutes])
    expect(r.resolution()).toBe( '1m')
    r.extent( [0, 2 * 5 * minutes])
    expect(r.resolution()).toBe( '5m')
    r.extent( [0, 2 * 15 * minutes])
    expect(r.resolution()).toBe( '15m')
    r.extent( [0, 2 * 30 * minutes])
    expect(r.resolution()).toBe( '30m')

    r.extent( [0, 2 * hours])
    expect(r.resolution()).toBe( '1h')
    r.extent( [0, 2 * 6 * hours])
    expect(r.resolution()).toBe( '6h')
    r.extent( [0, 2 * 12 * hours])
    expect(r.resolution()).toBe( '12h')

    r.extent( [0, 2 * days])
    expect(r.resolution()).toBe( '1d')
    r.extent( [0, 2 * 2 * days])
    expect(r.resolution()).toBe( '1d')
    r.extent( [0, 2 * 3 * days])
    expect(r.resolution()).toBe( '1d')
    r.extent( [0, 2 * 4 * days])
    expect(r.resolution()).toBe( '1d')
    r.extent( [0, 2 * 5 * days])
    expect(r.resolution()).toBe( '1d')
    r.extent( [0, 2 * 6 * days])
    expect(r.resolution()).toBe( '1d')
    r.extent( [0, 2 * 6.1 * days])
    expect(r.resolution()).toBe( '1w')
    r.extent( [0, 2 * 7 * days])
    expect(r.resolution()).toBe( '1w')

    r.extent( [0, 2 * weeks])
    expect(r.resolution()).toBe( '1w')
    r.extent( [0, 2 * 2 * weeks])
    expect(r.resolution()).toBe( '1w')
    r.extent( [0, 2 * 3 * weeks])
    expect(r.resolution()).toBe( '1w')
    r.extent( [0, 2 * 3.1 * weeks])
    expect(r.resolution()).toBe( '1mo')

    r.extent( [0, 2 * months])
    expect(r.resolution()).toBe( '1mo')
    r.extent( [0, 2 * 10 * months])
    expect(r.resolution()).toBe( '1mo')
    r.extent( [0, 2 * 10.1 * months])
    expect(r.resolution()).toBe( '1y')

    r.extent( [0, 2 * years])
    expect(r.resolution()).toBe( '1y')
    r.extent( [0, 2 * 10 * years])
    expect(r.resolution()).toBe( '1y')

  })

  it('sample should work', function() {
    var s,
        ResCache = d3.trait.murts.utils.ResCache,
        sample = d3.trait.murts.utils.sample,
        r = d3.trait.murts.request().size(2).extent([0, 2 * seconds]),
        data0 = [],
        data1 = makeData( 1000, 1),
        data2 = makeData( 1000, 2),
        data3 = makeData( 1000, 3)

    s = sample( data0, 1000, access)
    expect(s.length).toBe( 0)

    s = sample( data1, 1000, access)
    expect(s.length).toBe( 1)
    expect(s).toEqual( data1)

    s = sample( data2, 1000, access)
    expect(s.length).toBe( 2)
    expect(s).toEqual( data2)

    s = sample( data3, 1000, access)
    expect(s.length).toBe( 3)
    expect(s).toEqual( data3)

  })

});