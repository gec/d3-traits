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

  it('sample algorithm should work with simple sources', function() {
    var s, data,
        sample = d3.trait.murts.utils.sample

    data = []
    s = sample( data, 1000, access)
    expect(s.data.length).toBe( 0)

    data = makeData( 1000, 1)
    s = sample( data, 1000, access)
    expect(s.data.length).toBe( 1)
    expect(s.data).toEqual( data)

    data = makeData( 1000, 2)
    s = sample( data, 1000, access)
    expect(s.data.length).toBe( 2)
    expect(s.data).toEqual( data)

    data = makeData( 1000, 3)
    s = sample( data, 1000, access)
    expect(s.data.length).toBe( 3)
    expect(s.data).toEqual( data)

    // Data ever 2000, sample every 1000. Needs to skip forward steps.
    data = makeData( 2000, 4)
    s = sample( data, 1000, access)
    expect(s.data.length).toBe( 4)
    expect(s.data).toEqual( data)

    data = makeData( 1, 100000)
    s = sample( data, 1000, access)
    expect(s.data.length).toBe( 102)

  })

  it('sample algorithm should choose the correct point B', function() {
    var s, data,
        sample = d3.trait.murts.utils.sample,
        step = 10,
        a = [  0, 10],
        c = [ 20, 10]

    data = [ a, [ 10, 10], [ 11, 20], c ]
    s = sample( data, step, access)
    expect(s.data.length).toBe( 3)
    expect(s.data).toEqual( [ a, [11, 20], c])

    data = [ a, [ 10, 20], [ 11, 10], c ]
    s = sample( data, step, access)
    expect(s.data.length).toBe( 3)
    expect(s.data).toEqual( [ a, [10, 20], c])
  })

  it('sample algorithm should use an average for point C', function() {
    var s, data,
        sample = d3.trait.murts.utils.sample,
        step = 10,
        step1 = [ [  0, 10] ],
        step2 = [ [ 10, 10], [11, 20] ],  // b = 10 to 20
        step3 = [ [ 20,  0], [21, 20] ],// c = 10, b = 0 to 20
        step4  = [ [ 50, 10] ]

    data = []
    data = data.concat( step1, step2, step3, step4)
    s = sample( data, step, access)
    expect(s.data.length).toBe( 4)
    expect(s.data).toEqual( [ step1[0], step2[1], step3[0], step4[0]])

    data = []
    step3 = [ [ 20, 10], [21, 30] ],// c = 20, b = 10 to 30
    data = data.concat( step1, step2, step3, step4)
    s = sample( data, step, access)
    expect(s.data.length).toBe( 4)
    expect(s.data).toEqual( [ step1[0], step2[0], step3[1], step4[0]])
  })


  it('sampleUpdates should sample updates with correct point B', function() {
    var s, data,
        sampleUpdates = d3.trait.murts.utils.sampleUpdates,
        step = 10,
        a = [  0, 10],
        c = [ 20, 10]

    // NOTE: sampleUpdates() does not return 'a'.

    data = [ a, [ 10, 10], [ 11, 20], c ]
    s = sampleUpdates( data, 1, a, step, 20, access)
    expect(s.data.length).toBe( 2)
    expect(s.data).toEqual( [ [11, 20], c])

    data = [ a, [ 10, 20], [ 11, 10], c ]
    s = sampleUpdates( data, 1, a, step, 20, access)
    expect(s.data.length).toBe( 2)
    expect(s.data).toEqual( [ [10, 20], c])


  })

  it('murts.dataStore should get various resolutions', function() {
    var s, data, data1s, data5s, data1m,
        murts = d3.trait.murts.dataStore(),
        request1s = d3.trait.murts.request().step(  1000),
        request5s = d3.trait.murts.request().step(  5000),
        request1m = d3.trait.murts.request().step( 60000),
        ResCache = d3.trait.murts.utils.ResCache,
        step = 1000,
        a = [     0, 10],
        c = [ 10000, 10]

    // NOTE: sampleUpdates() does not return 'a'.

    data = [ a, [ 5000, 10], [ 5001, 20], c ]
    murts.pushPoints( data)

    data1s = murts.get( request1s)
    expect(data1s.length).toBe( 4)
    expect(data1s).toEqual( data)


    data5s = murts.get( request5s)
    expect(data5s.length).toBe( 3)
    expect(data5s).toEqual( [ a, [ 5001, 20], c ])

    data1m = murts.get( request1m)
    expect(data1m.length).toBe( 3)
    expect(data1m).toEqual( [ a, [ 5001, 20], c ])

  })

  it('murts.dataStore should handle updates', function() {
    var s, data, data1s, data5s, data1m,
        murts = d3.trait.murts.dataStore(),
        request1s = d3.trait.murts.request().step(  1000),
        request5s = d3.trait.murts.request().step(  5000),
        request1m = d3.trait.murts.request().step( 60000),
        ResCache = d3.trait.murts.utils.ResCache,
        step = 1000,
        a = [     0, 10],
        c = [ 10000, 10],
        d = [ 60000, 60]

    // NOTE: sampleUpdates() does not return 'a'.

    data = [ a, [ 5000, 10], [ 5001, 20], c ]
    murts.pushPoints( data)

    data1s = murts.get( request1s)
    expect(data1s.length).toBe( 4)
    expect(data1s).toEqual( data)


    data5s = murts.get( request5s)
    expect(data5s.length).toBe( 3)
    expect(data5s).toEqual( [ a, [ 5001, 20], c ])

    murts.pushPoints( [d])

    data5s = murts.get( request5s)
    expect(data5s.length).toBe( 4)
    expect(data5s).toEqual( [ a, [ 5001, 20], c, d ])


    data1m = murts.get( request1m)
    expect(data1m.length).toBe( 3)
    expect(data1m).toEqual( [ a, c, d ])

  })

  it('murts.dataStore should call onUpdate handler', function() {
    var s, data, data1s, data5s, data1m,
        murts = d3.trait.murts.dataStore(),
        request1s = d3.trait.murts.request().step(  1000),
        request5s = d3.trait.murts.request().step(  5000),
        request1m = d3.trait.murts.request().step( 60000),
        ResCache = d3.trait.murts.utils.ResCache,
        step = 1000,
        a = [     0, 10],
        c = [ 10000, 10],
        d = [ 60000, 60]

    var notify1sData = [],
        notify5sData = [],
        notify1s = function( d) { notify1sData = d },
        notify5s = function( d) { notify5sData = d }

    // NOTE: sampleUpdates() does not return 'a'.

    data = [ a, [ 5000, 10], [ 5001, 20], c ]
    murts.pushPoints( data)

    data1s = murts.get( request1s, notify1s)
    expect(data1s.length).toBe( 4)
    expect(data1s).toEqual( data)


    data5s = murts.get( request5s, notify5s)
    expect(data5s.length).toBe( 3)
    expect(data5s).toEqual( [ a, [ 5001, 20], c ])

    murts.pushPoints( [d])

    // Notifies
    expect(notify1sData.length).toBe( 5)
    expect(notify1sData).toEqual( [ a, [ 5000, 10], [ 5001, 20], c, d ])
    expect(notify5sData.length).toBe( 4)
    expect(notify5sData).toEqual( [ a, [ 5001, 20], c, d ])

    data5s = murts.get( request5s)
    expect(data5s.length).toBe( 4)
    expect(data5s).toEqual( [ a, [ 5001, 20], c, d ])


    data1m = murts.get( request1m)
    expect(data1m.length).toBe( 3)
    expect(data1m).toEqual( [ a, c, d ])

  })

  it('murts.utilsisDataStore detects murts.dataStore', function() {
    var murts = d3.trait.murts.dataStore()

    expect( d3.trait.murts.utils.isDataStore( murts)).toBeTruthy()
    expect( d3.trait.murts.utils.isDataStore( 1)).toBeFalsy()
    expect( d3.trait.murts.utils.isDataStore( {})).toBeFalsy()
    expect( d3.trait.murts.utils.isDataStore( true)).toBeFalsy()

  })

});