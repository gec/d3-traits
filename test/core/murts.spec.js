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
    var s = d3.scale.linear().range( [0, 2])

    s.domain( [0, 2 * seconds])
    expect(s.resolution()).toBe( '1s')

    s.domain( [0, 2 * 5 * seconds])
    expect(s.resolution()).toBe( '5s')
    s.domain( [0, 2 * 15 * seconds])
    expect(s.resolution()).toBe( '15s')
    s.domain( [0, 2 * 30 * seconds])
    expect(s.resolution()).toBe( '30s')

    s.domain( [0, 2 * minutes])
    expect(s.resolution()).toBe( '1m')
    s.domain( [0, 2 * 5 * minutes])
    expect(s.resolution()).toBe( '5m')
    s.domain( [0, 2 * 15 * minutes])
    expect(s.resolution()).toBe( '15m')
    s.domain( [0, 2 * 30 * minutes])
    expect(s.resolution()).toBe( '30m')

    s.domain( [0, 2 * hours])
    expect(s.resolution()).toBe( '1h')
    s.domain( [0, 2 * 6 * hours])
    expect(s.resolution()).toBe( '6h')
    s.domain( [0, 2 * 12 * hours])
    expect(s.resolution()).toBe( '12h')

    s.domain( [0, 2 * days])
    expect(s.resolution()).toBe( '1d')
    s.domain( [0, 2 * 2 * days])
    expect(s.resolution()).toBe( '1d')
    s.domain( [0, 2 * 3 * days])
    expect(s.resolution()).toBe( '1d')
    s.domain( [0, 2 * 4 * days])
    expect(s.resolution()).toBe( '1d')
    s.domain( [0, 2 * 5 * days])
    expect(s.resolution()).toBe( '1d')
    s.domain( [0, 2 * 6 * days])
    expect(s.resolution()).toBe( '1d')
    s.domain( [0, 2 * 6.1 * days])
    expect(s.resolution()).toBe( '1w')
    s.domain( [0, 2 * 7 * days])
    expect(s.resolution()).toBe( '1w')

    s.domain( [0, 2 * weeks])
    expect(s.resolution()).toBe( '1w')
    s.domain( [0, 2 * 2 * weeks])
    expect(s.resolution()).toBe( '1w')
    s.domain( [0, 2 * 3 * weeks])
    expect(s.resolution()).toBe( '1w')
    s.domain( [0, 2 * 3.1 * weeks])
    expect(s.resolution()).toBe( '1mo')

    s.domain( [0, 2 * months])
    expect(s.resolution()).toBe( '1mo')
    s.domain( [0, 2 * 10 * months])
    expect(s.resolution()).toBe( '1mo')
    s.domain( [0, 2 * 10.1 * months])
    expect(s.resolution()).toBe( '1y')

    s.domain( [0, 2 * years])
    expect(s.resolution()).toBe( '1y')
    s.domain( [0, 2 * 10 * years])
    expect(s.resolution()).toBe( '1y')

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
    var data, sample1s, sample5s, sample1m,
        murts = d3.trait.murts.dataStore(),
        scale1s = d3.scale.linear().range( [0, 1]).domain( [0, 1000]),
        scale5s = d3.scale.linear().range( [0, 1]).domain( [0, 5000]),
        scale1m = d3.scale.linear().range( [0, 1]).domain( [0, 60000]),
        a = [     0, 10],
        c = [ 10000, 10]

    expect( scale1s.resolution()).toEqual( '1s')
    expect( scale5s.resolution()).toEqual( '5s')
    expect( scale1m.resolution()).toEqual( '1m')

    // NOTE: sampleUpdates() does not return 'a'.

    data = [ a, [ 5000, 10], [ 5001, 20], c ]
    murts.pushPoints( data)

    sample1s = murts.get( scale1s)
    expect(sample1s.data.length).toBe( 4)
    expect(sample1s.data).toEqual( data)
    expect(sample1s.extents.x.values).toEqual( [0, 10000])
    expect(sample1s.extents.y.values).toEqual( [10, 20])


    sample5s = murts.get( scale5s)
    expect(sample5s.data.length).toBe( 3)
    expect(sample5s.data).toEqual( [ a, [ 5001, 20], c ])
    expect(sample5s.extents.x.values).toEqual( [0, 10000])
    expect(sample5s.extents.y.values).toEqual( [10, 20])

    sample1m = murts.get( scale1m)
    expect(sample1m.data.length).toBe( 3)
    expect(sample1m.data).toEqual( [ a, [ 5001, 20], c ])
    expect(sample1m.extents.x.values).toEqual( [0, 10000])
    expect(sample1m.extents.y.values).toEqual( [10, 20])

  })

  it('murts.dataStore should push new points and update lower resolution samples', function() {
    var data, sample1s, sample5s, sample1m,
        murts = d3.trait.murts.dataStore(),
        scale1s = d3.scale.linear().range( [0, 1]).domain( [0, 1000]),
        scale5s = d3.scale.linear().range( [0, 1]).domain( [0, 5000]),
        scale1m = d3.scale.linear().range( [0, 1]).domain( [0, 60000]),
        a = [     0, 10],
        c = [ 10000, 10],
        d = [ 60000, 60]

    // NOTE: sampleUpdates() does not return 'a'.

    data = [ a, [ 5000, 10], [ 5001, 20], c ]
    murts.pushPoints( data)

    sample1s = murts.get( scale1s)
    expect(sample1s.data.length).toBe( 4)
    expect(sample1s.data).toEqual( data)
    expect(sample1s.extents.x.values).toEqual( [0, 10000])
    expect(sample1s.extents.y.values).toEqual( [10, 20])


    sample5s = murts.get( scale5s)
    expect(sample5s.data.length).toBe( 3)
    expect(sample5s.data).toEqual( [ a, [ 5001, 20], c ])
    expect(sample5s.extents.x.values).toEqual( [0, 10000])
    expect(sample5s.extents.y.values).toEqual( [10, 20])

    murts.pushPoints( [d])

    sample5s = murts.get( scale5s)
    expect(sample5s.data.length).toBe( 4)
    expect(sample5s.data).toEqual( [ a, [ 5001, 20], c, d ])
    expect(sample5s.extents.x.values).toEqual( [0, 60000])
    expect(sample5s.extents.y.values).toEqual( [10, 60])


    sample1m = murts.get( scale1m)
    expect(sample1m.data.length).toBe( 3)
    expect(sample1m.data).toEqual( [ a, c, d ])
    expect(sample1m.extents.x.values).toEqual( [0, 60000])
    expect(sample1m.extents.y.values).toEqual( [10, 60])

  })

  it('murts.dataStore should push new points and update lower resolution samples after starting with no data', function() {
    var data, sample1s, sample5s, sample1m,
        murts = d3.trait.murts.dataStore(),
        scale1s = d3.scale.linear().range( [0, 1]).domain( [0, 1000]),
        scale5s = d3.scale.linear().range( [0, 1]).domain( [0, 5000]),
        scale1m = d3.scale.linear().range( [0, 1]).domain( [0, 60000]),
        a = [     0, 10],
        c = [ 10000, 10],
        d = [ 60000, 60]

    sample1s = murts.get()
    sample5s = murts.get(scale5s)
    sample1m = murts.get(scale1m)

    expect( sample1s.resolution).toBe('1s')
    expect( sample5s.resolution).toBe('5s')
    expect( sample1m.resolution).toBe('1m')

    data = [ a, [ 5000, 10], [ 5001, 20], c ]
    murts.pushPoints( data)
    expect(sample1s.data.length).toBe( 4)
    expect(sample1s.data).toEqual( data)
    expect(sample1s.extents.x.values).toEqual( [0, 10000])
    expect(sample1s.extents.y.values).toEqual( [10, 20])
    expect(sample5s.data.length).toBe( 3)
    expect(sample5s.data).toEqual( [ a, [ 5001, 20], c ])
    expect(sample5s.extents.x.values).toEqual( [0, 10000])
    expect(sample5s.extents.y.values).toEqual( [10, 20])
    expect(sample1m.data.length).toBe( 3)

    murts.pushPoints( [d])
    expect(sample5s.data.length).toBe( 4)
    expect(sample5s.data).toEqual( [ a, [ 5001, 20], c, d ])
    expect(sample5s.extents.x.values).toEqual( [0, 60000])
    expect(sample5s.extents.y.values).toEqual( [10, 60])
    expect(sample1m.data.length).toBe( 3)
    expect(sample1m.data).toEqual( [ a, c, d ])
    expect(sample1m.extents.x.values).toEqual( [0, 60000])
    expect(sample1m.extents.y.values).toEqual( [10, 60])
  })

  it('murts.dataStore should push unsampled data to all resolutions and resample when nextStep thresholds are crossed.', function() {
    var data, sample1s, sample5s, sample1m,
        murts = d3.trait.murts.dataStore(),
        scale1s = d3.scale.linear().range( [0, 1]).domain( [0, 1000]),
        scale5s = d3.scale.linear().range( [0, 1]).domain( [0, 5000]),
        scale1m = d3.scale.linear().range( [0, 1]).domain( [0, 60000]),
        d1sA = [    0,     0],
        d1sB = [   10,    10],
        d1sC = [   20,    20],
        d5sA = [ 5000,  5000],
        d5sB = [ 6000,  6000],
        d1mA = [60000, 60000],
        d1mB = [60010, 60010]

    sample1s = murts.get()
    sample5s = murts.get(scale5s)
    sample1m = murts.get(scale1m)

    murts.pushPoints( [d1sA])
    // 1s
    expect(sample1s.data.length).toBe( 1)
    expect(sample1s.data).toEqual( [ d1sA ])
    expect(sample1s.extents.x.values).toEqual( [0, 0])
    expect(sample1s.extents.y.values).toEqual( [0, 0])
    // 5s
    expect(sample5s.data.length).toBe( 1)
    expect(sample5s.data).toEqual( [ d1sA ])
    expect(sample5s.extents.x.values).toEqual( [0, 0])
    expect(sample5s.extents.y.values).toEqual( [0, 0])
    // 1m
    expect(sample1m.data.length).toBe( 1)
    expect(sample1m.data).toEqual( [ d1sA ])
    expect(sample1m.extents.x.values).toEqual( [0, 0])
    expect(sample1m.extents.y.values).toEqual( [0, 0])

    murts.pushPoints( [d1sB, d1sC])
    // 1s
    expect(sample1s.data.length).toBe( 3)
    expect(sample1s.data).toEqual( [ d1sA, d1sB, d1sC ])
    expect(sample1s.extents.x.values).toEqual( [0, d1sC[0]])
    expect(sample1s.extents.y.values).toEqual( [0, d1sC[1]])
    // 5s
    expect(sample5s.data.length).toBe( 3)
    expect(sample5s.data).toEqual( [ d1sA, d1sB, d1sC ])
    expect(sample5s.extents.x.values).toEqual( [0, d1sC[0]])
    expect(sample5s.extents.y.values).toEqual( [0, d1sC[1]])
    // 1m
    expect(sample1m.data.length).toBe( 3)
    expect(sample1m.data).toEqual( [ d1sA, d1sB, d1sC ])
    expect(sample1m.extents.x.values).toEqual( [0, d1sC[0]])
    expect(sample1m.extents.y.values).toEqual( [0, d1sC[1]])

    murts.pushPoints( [d5sA])
    // 1s
    expect(sample1s.data.length).toBe( 4)
    expect(sample1s.data).toEqual( [ d1sA, d1sB, d1sC, d5sA ])
    expect(sample1s.extents.x.values).toEqual( [0, d5sA[0]])
    expect(sample1s.extents.y.values).toEqual( [0, d5sA[1]])
    // 5s should resample
    expect(sample5s.data.length).toBe( 3)
    expect(sample5s.data).toEqual( [ d1sA, d1sC, d5sA ])
    expect(sample5s.extents.x.values).toEqual( [0, d5sA[0]])
    expect(sample5s.extents.y.values).toEqual( [0, d5sA[1]])
    // 1m should retrieve 5s resampling
    expect(sample1m.data.length).toBe( 3)
    expect(sample1m.data).toEqual( [ d1sA, d1sC, d5sA ])
    expect(sample1m.extents.x.values).toEqual( [0, d5sA[0]])
    expect(sample1m.extents.y.values).toEqual( [0, d5sA[1]])

    murts.pushPoints( [d5sB])
    // 1s
    expect(sample1s.data.length).toBe( 5)
    expect(sample1s.data).toEqual( [ d1sA, d1sB, d1sC, d5sA, d5sB ])
    expect(sample1s.extents.x.values).toEqual( [0, d5sB[0]])
    expect(sample1s.extents.y.values).toEqual( [0, d5sB[1]])
    // 5s should retrieve d5sB
    expect(sample5s.data.length).toBe( 4)
    expect(sample5s.data).toEqual( [ d1sA, d1sC, d5sA, d5sB ])
    expect(sample5s.extents.x.values).toEqual( [0, d5sB[0]])
    expect(sample5s.extents.y.values).toEqual( [0, d5sB[1]])
    // 1m should retrieve 5s
    expect(sample1m.data.length).toBe( 4)
    expect(sample1m.data).toEqual( [ d1sA, d1sC, d5sA, d5sB ])
    expect(sample1m.extents.x.values).toEqual( [0, d5sB[0]])
    expect(sample1m.extents.y.values).toEqual( [0, d5sB[1]])

    murts.pushPoints( [d1mA])
    // 1s
    expect(sample1s.data.length).toBe( 6)
    expect(sample1s.data).toEqual( [ d1sA, d1sB, d1sC, d5sA, d5sB, d1mA ])
    expect(sample1s.extents.x.values).toEqual( [0, d1mA[0]])
    expect(sample1s.extents.y.values).toEqual( [0, d1mA[1]])
    // 5s should resample
    expect(sample5s.data.length).toBe( 4)
    expect(sample5s.data).toEqual( [ d1sA, d1sC, d5sB, d1mA ])
    expect(sample5s.extents.x.values).toEqual( [0, d1mA[0]])
    expect(sample5s.extents.y.values).toEqual( [0, d1mA[1]])
    // 1m should resample
    expect(sample1m.data.length).toBe( 3)
    expect(sample1m.data).toEqual( [ d1sA, d5sB, d1mA ])
    expect(sample1m.extents.x.values).toEqual( [0, d1mA[0]])
    expect(sample1m.extents.y.values).toEqual( [0, d1mA[1]])

    murts.pushPoints( [d1mB])
    // 1s
    expect(sample1s.data.length).toBe( 7)
    expect(sample1s.data).toEqual( [ d1sA, d1sB, d1sC, d5sA, d5sB, d1mA, d1mB ])
    expect(sample1s.extents.x.values).toEqual( [0, d1mB[0]])
    expect(sample1s.extents.y.values).toEqual( [0, d1mB[1]])
    // 5s should retrieve
    expect(sample5s.data.length).toBe( 5)
    expect(sample5s.data).toEqual( [ d1sA, d1sC, d5sB, d1mA, d1mB ])
    expect(sample5s.extents.x.values).toEqual( [0, d1mB[0]])
    expect(sample5s.extents.y.values).toEqual( [0, d1mB[1]])
    // 1m should retrieve
    expect(sample1m.data.length).toBe( 4)
    expect(sample1m.data).toEqual( [ d1sA, d5sB, d1mA, d1mB ])
    expect(sample1m.extents.x.values).toEqual( [0, d1mB[0]])
    expect(sample1m.extents.y.values).toEqual( [0, d1mB[1]])

  })

  it('murts.dataStore should manage size constraints', function() {
    var data, sample1s, sample5s, sample1m,
        murts = d3.trait.murts.dataStore(),
        scale1s = d3.scale.linear().range( [0, 1]).domain( [0, 1000]),
        scale5s = d3.scale.linear().range( [0, 1]).domain( [0, 5000]),
        scale1m = d3.scale.linear().range( [0, 1]).domain( [0, 60000]),
        a = [     0, 10],
        c = [ 10000, 10],
        d = [ 60000, 60]

    // NOTE: sampleUpdates() does not return 'a'.

    expect( murts.constrainSize()).toBe(0)
    murts.constrainSize(3)
    expect( murts.constrainSize()).toBe(3)

    data = [ a, [ 5000, 10], [ 5001, 20], c ]
    murts.pushPoints( data)

    sample1s = murts.get( scale1s)
    expect(sample1s.data.length).toBe( 3)
    expect(sample1s.data).toEqual( [[ 5000, 10], [ 5001, 20], c ])
    expect(sample1s.extents.x.values).toEqual( [5000, 10000])
    expect(sample1s.extents.y.values).toEqual( [10, 20])


    sample5s = murts.get( scale5s)
    expect(sample5s.data.length).toBe( 3)
    expect(sample5s.data).toEqual( [ [ 5000, 10], [ 5001, 20], c ])

    murts.pushPoints( [d])

    sample5s = murts.get( scale5s)
    expect(sample5s.data.length).toBe( 3)
    expect(sample5s.data).toEqual( [ [ 5001, 20], c, d ])
    expect(sample5s.extents.x.values).toEqual( [5001, 60000])
    expect(sample5s.extents.y.values).toEqual( [10, 60])


    sample1m = murts.get( scale1m)
    expect(sample1m.data.length).toBe( 3)
    expect(sample1m.data).toEqual( [ [ 5001, 20], c, d ])
    expect(sample1m.extents.x.values).toEqual( [5001, 60000])
    expect(sample1m.extents.y.values).toEqual( [10, 60])

  })

  describe( 'murts.dataStore time constraint', function() {
    var data, sample1s, murts,
        scale1s = d3.scale.linear().range( [0, 1]).domain( [0, 1000]),
        p0 = [  0,  100],
        p4 = [  4,  104],
        p5 = [  5,  105],
        p6 = [  6,  106],
        p9 = [  9,  109],
        p10 = [ 10, 110],
        p11 = [ 11, 111],
        p14 = [ 14, 114],
        p15 = [ 15, 115],
        p16 = [ 16, 116],
        p19 = [ 19, 119],
        p20 = [ 20, 120],
        p21 = [ 21, 121],
        p24 = [ 24, 124],
        p25 = [ 25, 125],
        p29 = [ 29, 129],
        p30 = [ 30, 130],
        p32 = [ 32, 132],
        p35 = [ 35, 135],
        p50 = [ 50, 150]

    beforeEach(function() {
      murts = d3.trait.murts.dataStore()
      murts.constrainTime( 10)
      sample1s = murts.get( scale1s)
    })

    it('should roll off in the middle', function() {

      expect( murts.constrainTime()).toBe(10)
      expect(sample1s.data.length).toBe( 0)

      data = [ p0, p4, p5, p6, p9, p10 ]
      murts.pushPoints( data)
      expect(sample1s.data.length).toBe( 6)
      expect(sample1s.data).toEqual( data)
      expect(sample1s.extents.x.values).toEqual( [p0[0], p10[0]])
      expect(sample1s.extents.y.values).toEqual( [p0[1], p10[1]])

      murts.pushPoints( [p15])
      expect(sample1s.data.length).toBe( 5)
      expect(sample1s.data).toEqual( [ p5, p6, p9, p10, p15 ])
      expect(sample1s.extents.x.values).toEqual( [p5[0], p15[0]])
      expect(sample1s.extents.y.values).toEqual( [p5[1], p15[1]])

    })

    it('should roll off the first point', function() {

      expect( murts.constrainTime()).toBe(10)
      expect(sample1s.data.length).toBe( 0)

      data = [ p0, p4, p5, p6, p9, p10 ]
      murts.pushPoints( data)

      murts.pushPoints( [p11])
      expect(sample1s.data.length).toBe( 6)
      expect(sample1s.data).toEqual( [ p4, p5, p6, p9, p10, p11 ])
      expect(sample1s.extents.x.values).toEqual( [p4[0], p11[0]])
      expect(sample1s.extents.y.values).toEqual( [p4[1], p11[1]])

    })

    it('should roll off most points', function() {

      expect( murts.constrainTime()).toBe(10)
      expect(sample1s.data.length).toBe( 0)

      data = [ p0, p4, p5, p6, p9, p10 ]
      murts.pushPoints( data)

      murts.pushPoints( [p19])
      expect(sample1s.data.length).toBe( 3)
      expect(sample1s.data).toEqual( [ p9, p10, p19 ])
      expect(sample1s.extents.x.values).toEqual( [p9[0], p19[0]])
      expect(sample1s.extents.y.values).toEqual( [p9[1], p19[1]])

    })

    it('should roll off points except last', function() {

      expect( murts.constrainTime()).toBe(10)
      expect(sample1s.data.length).toBe( 0)

      data = [ p0, p4, p5, p6, p9, p10 ]
      murts.pushPoints( data)

      murts.pushPoints( [p20])
      expect(sample1s.data.length).toBe( 2)
      expect(sample1s.data).toEqual( [ p10, p20 ])
      expect(sample1s.extents.x.values).toEqual( [p10[0], p20[0]])
      expect(sample1s.extents.y.values).toEqual( [p10[1], p20[1]])

    })

    it('should roll off all points', function() {

      expect( murts.constrainTime()).toBe(10)
      expect(sample1s.data.length).toBe( 0)

      data = [ p0, p4, p5, p6, p9, p10 ]
      murts.pushPoints( data)

      murts.pushPoints( [p21])
      expect(sample1s.data.length).toBe( 1)
      expect(sample1s.data).toEqual( [ p21 ])
      expect(sample1s.extents.x.values).toEqual( [p21[0], p21[0]])
      expect(sample1s.extents.y.values).toEqual( [p21[1], p21[1]])

    })

    it('should roll off all points and one of pushed points', function() {

      expect( murts.constrainTime()).toBe(10)
      expect(sample1s.data.length).toBe( 0)

      data = [ p0, p4, p5, p6, p9, p10 ]
      murts.pushPoints( data)

      murts.pushPoints( [p21, p24, p25, p29, p30, p32])
      expect(sample1s.data.length).toBe( 5)
      expect(sample1s.data).toEqual( [ p24, p25, p29, p30, p32 ])
      expect(sample1s.extents.x.values).toEqual ( [p24[0], p32[0]])
      expect(sample1s.extents.y.values).toEqual( [p24[1], p32[1]])

    })

    it('should roll off all points and half of pushed points', function() {

      expect( murts.constrainTime()).toBe(10)
      expect(sample1s.data.length).toBe( 0)

      data = [ p0, p4, p5, p6, p9, p10 ]
      murts.pushPoints( data)

      murts.pushPoints( [p21, p24, p25, p29, p30, p32, p35])
      expect(sample1s.data.length).toBe( 5)
      expect(sample1s.data).toEqual( [ p25, p29, p30, p32, p35 ])
      expect(sample1s.extents.x.values).toEqual ( [p25[0], p35[0]])
      expect(sample1s.extents.y.values).toEqual( [p25[1], p35[1]])

    })

    it('should roll off all points and all but last of pushed points', function() {

      expect( murts.constrainTime()).toBe(10)
      expect(sample1s.data.length).toBe( 0)

      data = [ p0, p4, p5, p6, p9, p10 ]
      murts.pushPoints( data)

      murts.pushPoints( [p21, p24, p25, p29, p30, p32, p35, p50])
      expect(sample1s.data.length).toBe( 1)
      expect(sample1s.data).toEqual( [ p50 ])
      expect(sample1s.extents.x.values).toEqual ( [p50[0], p50[0]])
      expect(sample1s.extents.y.values).toEqual( [p50[1], p50[1]])

    })

  })


  it('murts.dataStore should manage time constraints with multiple resolutions', function() {
    var data, sample1s, sample5s, sample1m,
        murts = d3.trait.murts.dataStore(),
        scale1s = d3.scale.linear().range( [0, 1]).domain( [0, 1000]),
        scale5s = d3.scale.linear().range( [0, 1]).domain( [0, 5000]),
        scale1m = d3.scale.linear().range( [0, 1]).domain( [0, 60000]),
        a = [     0, 10],
        c = [ 10000, 10],
        d = [ 60000, 60]

    // NOTE: sampleUpdates() does not return 'a'.

    expect( murts.constrainTime()).toBe(0)
    murts.constrainTime( 9000)
    expect( murts.constrainTime()).toBe(9000)

    data = [ a, [ 5000, 10], [ 5001, 20], c ]
    murts.pushPoints( data)

    sample1s = murts.get( scale1s)
    expect(sample1s.data.length).toBe( 3)
    expect(sample1s.data).toEqual( [[ 5000, 10], [ 5001, 20], c ])
    expect(sample1s.extents.x.values).toEqual( [5000, 10000])
    expect(sample1s.extents.y.values).toEqual( [10, 20])


    sample5s = murts.get( scale5s)
    expect(sample5s.data.length).toBe( 3)
    expect(sample5s.data).toEqual( [ [ 5000, 10], [ 5001, 20], c ])

    murts.pushPoints( [d])

    sample5s = murts.get( scale5s)
    expect(sample5s.data.length).toBe( 1)
    expect(sample5s.data).toEqual( [ d ])
    expect(sample5s.extents.x.values).toEqual( [60000, 60000])
    expect(sample5s.extents.y.values).toEqual( [60, 60])


    sample1m = murts.get( scale1m)
    expect(sample1m.data.length).toBe( 1)
    expect(sample1m.data).toEqual( [ d ])
    expect(sample1m.extents.x.values).toEqual( [60000, 60000])
    expect(sample1m.extents.y.values).toEqual( [60, 60])

  })


  it('murts.dataStore time constraints should not remove last point', function() {
    var data, sample1s, sample5s,
        murts = d3.trait.murts.dataStore(),
        scale1s = d3.scale.linear().range( [0, 1]).domain( [0, 1000]),
        scale5s = d3.scale.linear().range( [0, 1]).domain( [0, 5000]),
        a = [     0, 10],
        c = [ 10000, 10],
        d = [ 60000, 60]

    // NOTE: sampleUpdates() does not return 'a'.

    expect( murts.constrainTime()).toBe(0)
    murts.constrainTime( 9000)
    expect( murts.constrainTime()).toBe(9000)

    data = [ a, [ 5000, 10], [ 5001, 20], c ]
    murts.pushPoints( data)

    sample1s = murts.get( scale1s)
    expect(sample1s.data.length).toBe( 3)
    expect(sample1s.data).toEqual( [[ 5000, 10], [ 5001, 20], c ])
    expect(sample1s.extents.x.values).toEqual( [5000, 10000])
    expect(sample1s.extents.y.values).toEqual( [10, 20])

    sample5s = murts.get( scale5s)
    expect(sample5s.data.length).toBe( 3)
    expect(sample5s.data).toEqual( [ [ 5000, 10], [ 5001, 20], c ])

    murts.constrainTime( 1000)

    expect(sample1s.data.length).toBe( 1)
    expect(sample1s.data).toEqual( [c])
    expect(sample1s.extents.x.values).toEqual( [c[0], c[0]])
    expect(sample1s.extents.y.values).toEqual( [c[1], c[1]])

    expect(sample5s.data.length).toBe( 1)
    expect(sample5s.data).toEqual( [c])
    expect(sample5s.extents.x.values).toEqual( [c[0], c[0]])
    expect(sample5s.extents.y.values).toEqual( [c[1], c[1]])

    murts.pushPoints( [d])

    expect(sample1s.data.length).toBe( 1)
    expect(sample1s.data).toEqual( [d])
    expect(sample1s.extents.x.values).toEqual( [d[0], d[0]])
    expect(sample1s.extents.y.values).toEqual( [d[1], d[1]])

    expect(sample5s.data.length).toBe( 1)
    expect(sample5s.data).toEqual( [d])
    expect(sample5s.extents.x.values).toEqual( [d[0], d[0]])
    expect(sample5s.extents.y.values).toEqual( [d[1], d[1]])

  })

  describe( 'murts.dataStore constraint throttling', function() {

    beforeEach(function() {
      timerCallback = jasmine.createSpy("timerCallback")
      jasmine.clock().install()
    })

    afterEach(function() {
      jasmine.clock().uninstall()
    });

    it('murts.dataStore time constraints should be throttled', function() {
      var data, sample1s, sample5s,
          murts = d3.trait.murts.dataStore(),
          scale1s = d3.scale.linear().range( [0, 1]).domain( [0, 1000]),
          scale5s = d3.scale.linear().range( [0, 1]).domain( [0, 5000]),
          a = [     0, 10],
          c = [ 10000, 10],
          d = [ 60000, 60],
          time = 1000

      spyOn(Date, 'now').and.callFake(function() {
        return time;
      })

      // NOTE: sampleUpdates() does not return 'a'.

      murts.constrainTime( 1000)
      murts.constrainThrottling( 1000)

      data = [ a, [ 5000, 10], [ 5001, 20], c ]
      murts.pushPoints( data)

      sample1s = murts.get( scale1s)
      sample5s = murts.get( scale5s)

      expect(sample1s.data.length).toBe( 1)
      expect(sample1s.data).toEqual( [c])
      expect(sample1s.extents.x.values).toEqual( [c[0], c[0]])
      expect(sample1s.extents.y.values).toEqual( [c[1], c[1]])

      expect(sample5s.data.length).toBe( 1)
      expect(sample5s.data).toEqual( [c])
      expect(sample5s.extents.x.values).toEqual( [c[0], c[0]])
      expect(sample5s.extents.y.values).toEqual( [c[1], c[1]])

      expect(sample1s.throttling.timer).toBeUndefined()
      murts.pushPoints( [d])

      expect(sample1s.throttling.timer).toBeDefined()
      expect(sample1s.data.length).toBe( 2)
      expect(sample1s.data).toEqual( [c, d])

      expect(sample5s.throttling.timer).toBeUndefined()  // because source <= 2
      expect(sample5s.data.length).toBe( 1)
      expect(sample5s.data).toEqual( [d])

      time = 2001
      jasmine.clock().tick(1001)

      expect(sample1s.data.length).toBe( 1)
      expect(sample1s.data).toEqual( [d])
      expect(sample1s.extents.x.values).toEqual( [d[0], d[0]])
      expect(sample1s.extents.y.values).toEqual( [d[1], d[1]])

      expect(sample5s.data.length).toBe( 1)
      expect(sample5s.data).toEqual( [d])
      expect(sample5s.extents.x.values).toEqual( [d[0], d[0]])
      expect(sample5s.extents.y.values).toEqual( [d[1], d[1]])

    })
  })

  it('murts.dataStore should call onUpdate handler', function() {
    var data, sample1s, sample5s, sample1m,
        murts = d3.trait.murts.dataStore(),
        scale1s = d3.scale.linear().range( [0, 1]).domain( [0, 1000]),
        scale5s = d3.scale.linear().range( [0, 1]).domain( [0, 5000]),
        scale1m = d3.scale.linear().range( [0, 1]).domain( [0, 60000]),
        a = [     0, 10],
        c = [ 10000, 10],
        d = [ 60000, 60],
        e = [120000, 60]

    var deregister1s, deregister5s,
        notify = jasmine.createSpyObj('notify', ['n1s', 'n5s'])

    // NOTE: sampleUpdates() does not return 'a'.

    data = [ a, [ 5000, 10], [ 5001, 20], c ]
    murts.pushPoints( data)

    sample1s = murts.get( scale1s)
    deregister1s = sample1s.on( 'update', notify.n1s)
    expect(sample1s.data.length).toBe( 4)
    expect(sample1s.data).toEqual( data)


    sample5s = murts.get( scale5s)
    deregister5s = sample5s.on( 'update', notify.n5s)
    expect(sample5s.data.length).toBe( 3)
    expect(sample5s.data).toEqual( [ a, [ 5001, 20], c ])

    murts.pushPoints( [d])

    // Notifies
    expect( notify.n1s).toHaveBeenCalledWith( 'update', [ a, [ 5000, 10], [ 5001, 20], c, d ], jasmine.any(Object))
    expect( notify.n5s).toHaveBeenCalledWith( 'update', [ a, [ 5001, 20], c, d ], jasmine.any(Object))

    sample5s = murts.get( scale5s)
    expect(sample5s.data.length).toBe( 4)
    expect(sample5s.data).toEqual( [ a, [ 5001, 20], c, d ])


    sample1m = murts.get( scale1m)
    expect(sample1m.data.length).toBe( 3)
    expect(sample1m.data).toEqual( [ a, c, d ])

    notify.n1s.calls.reset()
    notify.n5s.calls.reset()
    deregister1s()
    deregister5s()


    murts.pushPoints( [e])
    expect( notify.n1s).not.toHaveBeenCalled()
    expect( notify.n5s).not.toHaveBeenCalled()

  })

  it('murts.utilsisDataStore detects murts.dataStore', function() {
    var murts = d3.trait.murts.dataStore()

    expect( d3.trait.murts.utils.isDataStore( murts)).toBeTruthy()
    expect( d3.trait.murts.utils.isDataStore( 1)).toBeFalsy()
    expect( d3.trait.murts.utils.isDataStore( {})).toBeFalsy()
    expect( d3.trait.murts.utils.isDataStore( true)).toBeFalsy()

  })

});