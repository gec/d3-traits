describe('d3-traits.layout.utils.trendstack', function() {

  var uniformIterator = d3.trait.layout.uniformIterator,
      mapUniform = d3.trait.layout.mapUniform,
      utils = d3.trait.layout.utils,
      makeTargetSeries                      = utils.trendstack.makeTargetSeries,
      seriesIndexOfMinNextX                 = utils.trendstack.seriesIndexOfMinNextX,
      populateVerticalSliceAndAdvanceCursor = utils.trendstack.populateVerticalSliceAndAdvanceCursor,
      mapSeriesToUniformX                   = utils.trendstack.mapSeriesToUniformX

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
    expect( iter.peakNextX).toBeUndefined()

    var point = iter.next(1)
    expect( point).toEqual( {x:1, y:0})
  });

  it('uniformIterator should iterate a non-empty series', function() {
    var data, iter, cursors, series

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

  it('seriesIndexOfMinNextX should find the series with minimum nextX', function() {
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
    index = seriesIndexOfMinNextX( iterators)
    expect( index).toEqual(1)
    nextX = iterators[index].peekNextX()
    expect( iterators[0].next( nextX)).toEqual( {x: 1, y: 0})
    expect( iterators[1].next( nextX)).toEqual( {x: 1, y: 2})
    expect( iterators[2].next( nextX)).toEqual( {x: 1, y: 0})

    expect( iterators[0].isNext()).toBeFalsy()
    expect( iterators[1].isNext()).toBeTruthy()
    expect( iterators[2].isNext()).toBeTruthy()
    index = seriesIndexOfMinNextX( iterators)
    expect( index).toEqual(2)
    nextX = iterators[index].peekNextX()
    expect( iterators[0].next( nextX)).toEqual( {x: 3, y: 0})
    expect( iterators[1].next( nextX)).toEqual( {x: 3, y: 2})
    expect( iterators[2].next( nextX)).toEqual( {x: 3, y: 4})

    expect( iterators[0].isNext()).toBeFalsy()
    expect( iterators[1].isNext()).toBeTruthy()
    expect( iterators[2].isNext()).toBeTruthy()
    index = seriesIndexOfMinNextX( iterators)
    expect( index).toEqual(2)
    nextX = iterators[index].peekNextX()
    expect( iterators[0].next( nextX)).toEqual( {x: 5, y: 0})
    expect( iterators[1].next( nextX)).toEqual( {x: 5, y: 2})
    expect( iterators[2].next( nextX)).toEqual( {x: 5, y: 6})

    expect( iterators[0].isNext()).toBeFalsy()
    expect( iterators[1].isNext()).toBeTruthy()
    expect( iterators[2].isNext()).toBeFalsy()
    index = seriesIndexOfMinNextX( iterators)
    expect( index).toEqual(1)
    nextX = iterators[index].peekNextX()
    expect( iterators[0].next( nextX)).toEqual( {x: 7, y: 0})
    expect( iterators[1].next( nextX)).toEqual( {x: 7, y: 8})
    expect( iterators[2].next( nextX)).toEqual( {x: 7, y: 6})

    expect( iterators[0].isNext()).toBeFalsy()
    expect( iterators[1].isNext()).toBeFalsy()
    expect( iterators[2].isNext()).toBeFalsy()
    index = seriesIndexOfMinNextX( iterators)
    expect( index).toBeUndefined()

  });

  it('mapUniform should map points to uniform X values', function() {
    var series, iterators, target

    series = [
      [                                              ],
      [ {x:1, y:2},                        {x:7, y:8}],
      [             {x:3, y:4}, {x:5, y:6}           ]
    ]
    iterators = series.map( function(s, i) { return uniformIterator()(s) })

    target = mapUniform( iterators)

    expect( target[0].length).toEqual(4)
    expect( target[1].length).toEqual(4)
    expect( target[2].length).toEqual(4)


    expect( target[0][0]).toEqual( {x: 1, y: 0})
    expect( target[1][0]).toEqual( {x: 1, y: 2})
    expect( target[2][0]).toEqual( {x: 1, y: 0})

    expect( target[0][1]).toEqual( {x: 3, y: 0})
    expect( target[1][1]).toEqual( {x: 3, y: 2})
    expect( target[2][1]).toEqual( {x: 3, y: 4})

    expect( target[0][2]).toEqual( {x: 5, y: 0})
    expect( target[1][2]).toEqual( {x: 5, y: 2})
    expect( target[2][2]).toEqual( {x: 5, y: 6})

    expect( target[0][3]).toEqual( {x: 7, y: 0})
    expect( target[1][3]).toEqual( {x: 7, y: 8})
    expect( target[2][3]).toEqual( {x: 7, y: 6})

  });


});


