describe('d3-traits.layout.uniformInterpolator', function() {

  var interpolator,
      uniformIterator = d3.trait.layout.uniformIterator,
      uniformInterpolator = d3.trait.layout.uniformInterpolator

  beforeEach(function() {
    interpolator = uniformInterpolator()
  })

  it('should iterate an empty series', function() {
    var data, result

    data = [[],[]]
    result = interpolator(data)
    expect( result).toEqual(data)
  });

  it('should iterate a non-empty series', function() {
    var data, result

    data = [ [{x:1, y:2}] ]
    result = interpolator(data)
    expect( result).toEqual(data)
  });

  it('should map points to uniform X values', function() {
    var series, result

    series = [
      [                                              ],
      [ {x:1, y:2},                        {x:7, y:8}],
      [             {x:3, y:4}, {x:5, y:6}           ]
    ]

    result = interpolator( series)

    expect( result[0].length).toEqual(4)
    expect( result[1].length).toEqual(4)
    expect( result[2].length).toEqual(4)


    expect( result[0][0]).toEqual( {x: 1, y: 0})
    expect( result[1][0]).toEqual( {x: 1, y: 2})
    expect( result[2][0]).toEqual( {x: 1, y: 0})

    expect( result[0][1]).toEqual( {x: 3, y: 0})
    expect( result[1][1]).toEqual( {x: 3, y: 2})
    expect( result[2][1]).toEqual( {x: 3, y: 4})

    expect( result[0][2]).toEqual( {x: 5, y: 0})
    expect( result[1][2]).toEqual( {x: 5, y: 2})
    expect( result[2][2]).toEqual( {x: 5, y: 6})

    expect( result[0][3]).toEqual( {x: 7, y: 0})
    expect( result[1][3]).toEqual( {x: 7, y: 8})
    expect( result[2][3]).toEqual( {x: 7, y: 6})

  });

  it('should map points to uniform X values within epsilon of 500 milliseconds', function() {
    var series, result,
        date0 = new Date( 0),
        date1 = new Date( 1),
        date1000 = new Date( 1000),
        date2000 = new Date( 2000)

    series = [
      [                                                    ],
      [ {x:date0, y:2},                   {x:date2000, y:8}],
      [ {x:date1, y:4}, {x:date1000, y:6}                  ]
    ]

    interpolator.epsilon( 500)
    expect( interpolator.epsilon()).toEqual( 500)

    result = interpolator( series)

    expect( result[0].length).toEqual(3)
    expect( result[1].length).toEqual(3)
    expect( result[2].length).toEqual(3)


    expect( result[0][0]).toEqual( {x: date0, y: 0})
    expect( result[1][0]).toEqual( {x: date0, y: 2})
    expect( result[2][0]).toEqual( {x: date1, y: 4})

    expect( result[0][1]).toEqual( {x: date1000, y: 0})
    expect( result[1][1]).toEqual( {x: date1000, y: 2})
    expect( result[2][1]).toEqual( {x: date1000, y: 6})

    expect( result[0][2]).toEqual( {x: date2000, y: 0})
    expect( result[1][2]).toEqual( {x: date2000, y: 8})
    expect( result[2][2]).toEqual( {x: date2000, y: 6})

  });



});


