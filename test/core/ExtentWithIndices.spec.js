describe('trait.ExtentWithIndices', function() {

  var ra = [ {x:1}, {x:2}, {x:3}]
  var access = function(d) {return d.x}

  beforeEach(function() {
  })

  it('empty constructor should initialize extent', function() {
    var e = new d3.trait.ExtentWithIndices()
    expect(e.values[0]).toBeUndefined()
    expect(e.values[1]).toBeUndefined()
    expect(e.indices[0]).toBeUndefined()
    expect(e.indices[1]).toBeUndefined()
  });

  it('constructor should find extent without accessor', function() {
    var e = new d3.trait.ExtentWithIndices( [1, 2, 3])
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(3)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(2)

    e = new d3.trait.ExtentWithIndices( [3, 1, 2])
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(3)
    expect(e.indices[0]).toBe(1)
    expect(e.indices[1]).toBe(0)
  });

  it('constructor should find extent with manual 4 arguments', function() {
    var e = new d3.trait.ExtentWithIndices( 1, 0, 3, 2)
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(3)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(2)

    e = new d3.trait.ExtentWithIndices( 1, 1, 3, 0)
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(3)
    expect(e.indices[0]).toBe(1)
    expect(e.indices[1]).toBe(0)
  });

  it('constructor should find extent with accessor', function() {
    var e = new d3.trait.ExtentWithIndices( ra, access)
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(3)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(2)

  });

  it('set should apply values and use optional offset', function() {
    var e = new d3.trait.ExtentWithIndices( [1, 2, 3])
    e.set( [3, 1, 2])
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(3)
    expect(e.indices[0]).toBe(1)
    expect(e.indices[1]).toBe(0)

    e.set( [3, 1, 2], 1)
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(2)
    expect(e.indices[0]).toBe(1)
    expect(e.indices[1]).toBe(2)

    e.set( [3, 1, 2], 2)
    expect(e.values[0]).toBe(2)
    expect(e.values[1]).toBe(2)
    expect(e.indices[0]).toBe(2)
    expect(e.indices[1]).toBe(2)

    e.set( [3, 1, 2], 3)
    expect(e.values[0]).toBeUndefined()
    expect(e.values[1]).toBeUndefined()
    expect(e.indices[0]).toBeUndefined()
    expect(e.indices[1]).toBeUndefined()
  });

  it('reset should set all values to undefined', function() {
    var e = new d3.trait.ExtentWithIndices( [1, 2, 3])
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(3)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(2)

    e.reset()
    expect(e.values[0]).toBeUndefined()
    expect(e.values[1]).toBeUndefined()
    expect(e.indices[0]).toBeUndefined()
    expect(e.indices[1]).toBeUndefined()
  });

  it('union should work with ExtentWithIndices as first argument', function() {
    var e = new d3.trait.ExtentWithIndices( [1, 2, 3])
    e.union( new d3.trait.ExtentWithIndices( [1, 2, 3, 0, 5]))
    expect(e.values[0]).toBe(0)
    expect(e.values[1]).toBe(5)
    expect(e.indices[0]).toBe(3)
    expect(e.indices[1]).toBe(4)

    e.set( [1, 2])
    e.union( new d3.trait.ExtentWithIndices( [1, 2, 0]))
    expect(e.values[0]).toBe(0)
    expect(e.values[1]).toBe(2)
    expect(e.indices[0]).toBe(2)
    expect(e.indices[1]).toBe(1)

    e.set( [1, 2])
    e.union( new d3.trait.ExtentWithIndices( [1, 2, 3]))
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(3)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(2)

  });

  it('union should work with data', function() {
    var e = new d3.trait.ExtentWithIndices( [1, 2, 3])
    e.union( [1, 2, 3, 0, 5])
    expect(e.values[0]).toBe(0)
    expect(e.values[1]).toBe(5)
    expect(e.indices[0]).toBe(3)
    expect(e.indices[1]).toBe(4)

    e = new d3.trait.ExtentWithIndices( [1, 2, 3])
    e.union( [1, 2, 3, 0, 5], 3)
    expect(e.values[0]).toBe(0)
    expect(e.values[1]).toBe(5)
    expect(e.indices[0]).toBe(3)
    expect(e.indices[1]).toBe(4)

    e = new d3.trait.ExtentWithIndices( [1, 2, 3])
    e.union( [1, 2, 3, 0, 5], 4)
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(5)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(4)

    e.set( [1, 2])
    e.union( [1, 2, 0])
    expect(e.values[0]).toBe(0)
    expect(e.values[1]).toBe(2)
    expect(e.indices[0]).toBe(2)
    expect(e.indices[1]).toBe(1)

    e.set( [1, 2])
    e.union( [1, 2, 3])
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(3)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(2)

  });


});




describe('trait.ExtentWithIndicesSorted', function() {

  var ra = [ {x:1}, {x:2}, {x:3}]
  var access = function(d) {return d.x}

  beforeEach(function() {
  })

  it('empty constructor should initialize extent', function() {
    var e = new d3.trait.ExtentWithIndicesSorted()
    expect(e.values[0]).toBeUndefined()
    expect(e.values[1]).toBeUndefined()
    expect(e.indices[0]).toBeUndefined()
    expect(e.indices[1]).toBeUndefined()
  });

  it('constructor should find extent without accessor', function() {
    var e = new d3.trait.ExtentWithIndicesSorted( [1, 2, 3])
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(3)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(2)

    e = new d3.trait.ExtentWithIndicesSorted( [3, 1, 2])
    expect(e.values[0]).toBe(3)
    expect(e.values[1]).toBe(2)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(2)
  });

  it('constructor should find extent with manual 4 arguments', function() {
    var e = new d3.trait.ExtentWithIndicesSorted( 1, 0, 3, 2)
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(3)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(2)

    e = new d3.trait.ExtentWithIndicesSorted( 1, 1, 3, 0)
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(3)
    expect(e.indices[0]).toBe(1)
    expect(e.indices[1]).toBe(0)
  });

  it('constructor should find extent with accessor', function() {
    var e = new d3.trait.ExtentWithIndicesSorted( ra, access)
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(3)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(2)

  });

  it('set should apply values', function() {
    var e = new d3.trait.ExtentWithIndicesSorted( [1, 2, 3])
    e.set( [4, 5, 6])
    expect(e.values[0]).toBe(4)
    expect(e.values[1]).toBe(6)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(2)
  });

  it('reset should set all values to undefined', function() {
    var e = new d3.trait.ExtentWithIndicesSorted( [1, 2, 3])
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(3)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(2)

    e.reset()
    expect(e.values[0]).toBeUndefined()
    expect(e.values[1]).toBeUndefined()
    expect(e.indices[0]).toBeUndefined()
    expect(e.indices[1]).toBeUndefined()
  });

  it('union should work with ExtentWithIndicesSorted as first argument', function() {
    var e = new d3.trait.ExtentWithIndicesSorted( [1, 2, 3])
    e.union( new d3.trait.ExtentWithIndicesSorted( [1, 2, 3, 4, 5]))
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(5)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(4)

    e.set( [1, 2])
    e.union( new d3.trait.ExtentWithIndicesSorted( [1, 2, 3]))
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(3)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(2)
  });

  it('union should work with data', function() {
    var e = new d3.trait.ExtentWithIndicesSorted( [1, 2, 3])
    e.union( [1, 2, 3, 4, 5])
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(5)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(4)

    e = new d3.trait.ExtentWithIndicesSorted( [1, 2, 3])
    e.union( [1, 2, 3, 4, 5], 3)
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(5)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(4)

    e = new d3.trait.ExtentWithIndicesSorted( [1, 2, 3])
    e.union( [1, 2, 3, 4, 5], 4)
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(5)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(4)

  });

  it('max should work with ExtentWithIndicesSorted as first argument', function() {
    var e = new d3.trait.ExtentWithIndicesSorted( [1, 2, 3])
    e.max( new d3.trait.ExtentWithIndicesSorted( [1, 2, 3, 4, 5]))
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(5)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(4)

    e.set( [1, 2])
    e.max( new d3.trait.ExtentWithIndicesSorted( [1, 2, 3]))
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(3)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(2)

    e.set( [1, 2, 3])
    e.max( new d3.trait.ExtentWithIndicesSorted( [1, 2]))
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(3)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(2)
  });

  it('max should work with data', function() {
    var e = new d3.trait.ExtentWithIndicesSorted( [1, 2, 3])
    e.max( [0, 2, 3, 4, 5])
    expect(e.values[0]).toBe(1)
    expect(e.values[1]).toBe(5)
    expect(e.indices[0]).toBe(0)
    expect(e.indices[1]).toBe(4)

  });


});


