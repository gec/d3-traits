describe('d3-traits.layout.uniformIterator', function() {

  var uniformIterator = d3.trait.layout.uniformIterator,
      mapUniform = d3.trait.layout.mapUniform,
      utils = d3.trait.layout.utils,
      makeTargetSeries                      = utils.trendstack.makeTargetSeries,
      seriesIndexOfMinNextX                 = utils.trendstack.seriesIndexOfMinNextX,
      greatestNextX                         = utils.trendstack.greatestNextX,
      smallestNextX                         = utils.trendstack.smallestNextX

  var access  = d3.trait.config.accessorsXY( {}, {x: 'x', y: 'y'})

  beforeEach(function() {
  })

  it('makeTargetSeries should handle series with varying lengths including empty', function() {
    var target, series

    series = []
    target = makeTargetSeries( series)
    expect( target).toEqual([])

    series = [
      [              ],
      [ {x:1, y:2}        ],
      [ {x:3, y:4}, {x:5, y:6} ]
    ]
    target = makeTargetSeries( series)
    expect( target).toEqual( [ [],[],[] ])

  });

  it('uniformIterator should iterate an empty series', function() {
    var data, iter, cursors, series

    data = []
    iter = uniformIterator()
      .epsilon(.01)
    iter(data)
    expect( iter.isNext()).toBeFalsy()
    expect( iter.peekNextX()).toBeUndefined()

    var x = 1,
        point = iter.next(x)
    expect( point).toEqual( {x:x, y:undefined})
  });

  it('uniformIterator should iterate a non-empty series', function() {
    var data, iter

    data = [ {x:1, y:2} ]
    iter = uniformIterator()
      .epsilon(.01)
    iter(data)
    expect( iter.isNext()).toBeTruthy()
    expect( iter.peekNextX()).toEqual(1)

    var point = iter.next(1)
    expect( point).toEqual( {x:1, y:2})

    expect( iter.isNext()).toBeFalsy()
    expect( iter.peekNextX()).toBeUndefined()
    var point = iter.next(2)
    expect( point).toEqual( {x:2, y:2})

  });

  it('uniformIterator should iterate a series with date x values', function() {
    var data, iter,
        now = new Date(),
        later = new Date( now.valueOf() + 1000)

    data = [ {x:now, y:2} ]
    iter = uniformIterator()
      .epsilon(.01)
    iter(data)
    expect( iter.isNext()).toBeTruthy()
    expect( iter.peekNextX()).toEqual(now)

    var point = iter.next(now)
    expect( point).toEqual( data[0])

    expect( iter.isNext()).toBeFalsy()
    expect( iter.peekNextX()).toBeUndefined()
    var point = iter.next(later)
    expect( point).toEqual( {x:later, y:2})

  });

  it('seriesIndexOfMinNextX should return unknown if one series is empty', function() {
    var series, index, iterators, nextX, point

    series = []
    iterators = []
    expect( seriesIndexOfMinNextX( iterators)).toBeUndefined()

    series = [
      [                                              ],
      [ {x:1, y:2},                        {x:7, y:8}],
      [             {x:3, y:4}, {x:5, y:6}           ]
    ]
    iterators = [ uniformIterator(), uniformIterator(), uniformIterator()]
    iterators.forEach( function( iter, i) { iter(series[i])})

    expect( iterators[0].isNext()).toBeFalsy()
    expect( iterators[1].isNext()).toBeTruthy()
    expect( iterators[2].isNext()).toBeTruthy()
    nextX = greatestNextX( iterators)
    expect( index).toBeUndefined()
  });

  it('greatestNextX should find the series with greatest nextX', function() {
    var series, index, iterators, nextX, point

    series = []
    iterators = []
    expect( greatestNextX( iterators)).toBeUndefined()

    series = [
      [                        {x:4.999, y:5}        ],
      [ {x:1, y:2},                        {x:7, y:8}],
      [             {x:3, y:4}, {x:5, y:6}           ]
    ]
    iterators = [ uniformIterator(), uniformIterator(), uniformIterator()]
    iterators.forEach( function( iter, i) { iter(series[i])})

    nextX = greatestNextX( iterators)
    expect( nextX).toEqual( 4.999)
    expect( iterators[0].next( nextX)).toEqual( {x: 4.999, y: 5})
    expect( iterators[1].next( nextX)).toEqual( {x: 4.999, y: 2})
    expect( iterators[2].next( nextX)).toEqual( {x: 5, y: 6})

    expect( iterators[0].isNext()).toBeFalsy()
    expect( iterators[1].isNext()).toBeTruthy()
    expect( iterators[2].isNext()).toBeFalsy()
    nextX = smallestNextX( iterators)
    expect( nextX).toEqual(7)

    expect( iterators[0].next( nextX)).toEqual( {x: 7, y: 5})
    expect( iterators[1].next( nextX)).toEqual( {x: 7, y: 8})
    expect( iterators[2].next( nextX)).toEqual( {x: 7, y: 6})

    expect( iterators[0].isNext()).toBeFalsy()
    expect( iterators[1].isNext()).toBeFalsy()
    expect( iterators[2].isNext()).toBeFalsy()
  });

  it('mapUniform should map points to uniform X values, starting with ', function() {
    var series, iterators, target

    series = [
      [                          {x:5.001, y:5}      ],
      [ {x:1, y:2},                        {x:7, y:8}],
      [             {x:3, y:4}, {x:5, y:6}           ]
    ]
    iterators = series.map( function(s, i) { return uniformIterator()(s) })

    target = mapUniform( iterators)

    expect( target[0].length).toEqual(2)
    expect( target[1].length).toEqual(2)
    expect( target[2].length).toEqual(2)


    expect( target[0][0]).toEqual( {x: 5.001, y: 5})
    expect( target[1][0]).toEqual( {x: 5.001, y: 2})
    expect( target[2][0]).toEqual( {x: 5, y: 6})

    expect( target[0][1]).toEqual( {x: 7, y: 5})
    expect( target[1][1]).toEqual( {x: 7, y: 8})
    expect( target[2][1]).toEqual( {x: 7, y: 6})

  });

  it('mapUniform should map points to uniform X values', function() {
    var series, iterators, target

    series = [
      [            {x:2.999, y:2}, {x:5.001, y:5}      ],
      [ {x:1, y:3},                        {x:7, y:8}],
      [             {x:3, y:4}, {x:5, y:6}           ]
    ]
    iterators = series.map( function(s, i) { return uniformIterator()(s) })

    target = mapUniform( iterators)

    expect( target[0].length).toEqual(3)
    expect( target[1].length).toEqual(3)
    expect( target[2].length).toEqual(3)

    expect( target[0][0]).toEqual( {x: 2.999, y: 2})
    expect( target[1][0]).toEqual( {x: 3, y: 3})
    expect( target[2][0]).toEqual( {x: 3, y: 4})

    expect( target[0][1]).toEqual( {x: 5.001, y: 5})
    expect( target[1][1]).toEqual( {x: 5, y: 3})
    expect( target[2][1]).toEqual( {x: 5, y: 6})

    expect( target[0][2]).toEqual( {x: 7, y: 5})
    expect( target[1][2]).toEqual( {x: 7, y: 8})
    expect( target[2][2]).toEqual( {x: 7, y: 6})

  });

  it('mapUniform should map points to uniform X values within epsilon of 500 milliseconds', function() {
    var series, iterators, target,
        date0 = new Date( 0),
        date1 = new Date( 1),
        date1000 = new Date( 1000),
        date2000 = new Date( 2000)

    series = [
      [ {x:date0, y:1},                   {x:date2000, y:7}],
      [ {x:date0, y:2},                   {x:date2000, y:8}],
      [ {x:date1, y:4}, {x:date1000, y:6}                  ]
    ]
    iterators = series.map( function(s, i) {
      return uniformIterator().epsilon(500)(s)
    })

    expect( iterators[0].epsilon()).toEqual( 500)
    expect( iterators[1].epsilon()).toEqual( 500)
    expect( iterators[2].epsilon()).toEqual( 500)

    target = mapUniform( iterators)

    expect( target[0].length).toEqual(3)
    expect( target[1].length).toEqual(3)
    expect( target[2].length).toEqual(3)


    expect( target[0][0]).toEqual( {x: date0, y: 1})
    expect( target[1][0]).toEqual( {x: date0, y: 2})
    expect( target[2][0]).toEqual( {x: date1, y: 4})

    expect( target[0][1]).toEqual( {x: date1000, y: 1})
    expect( target[1][1]).toEqual( {x: date1000, y: 2})
    expect( target[2][1]).toEqual( {x: date1000, y: 6})

    expect( target[0][2]).toEqual( {x: date2000, y: 7})
    expect( target[1][2]).toEqual( {x: date2000, y: 8})
    expect( target[2][2]).toEqual( {x: date2000, y: 6})

  });


});


