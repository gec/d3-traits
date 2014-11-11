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

  it('murts.dataStore should manage time constraints', function() {
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