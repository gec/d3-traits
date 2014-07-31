describe('d3.trait.chart.utils', function() {

  var scale,
      data,
      accessX1 = function(d) { return d.x; },
      accessY1 = function(d) { return d.y; }

  beforeEach(function() {
    scale = d3.scale.linear()
      .domain([0, 10])
      .range([0, 10])
    data = [
      {x: 1, y: 2},
      {x: 3, y: 4},
      {x: 4, y: 8}
    ]
  })


  it('minDistanceBetween should handle data with mixed distances', function() {

    var min,
        indices = [0, data.length - 1]

    scale.domain([0, 10]).range([0, 10])

    min = d3.trait.chart.utils.minDistanceBetween(data, indices, accessX1, scale)
    expect(min).toBeCloseTo(1, .01)

    min = d3.trait.chart.utils.minDistanceBetween(data, indices, accessY1, scale)
    expect(min).toBeCloseTo(2, .01)
  });

  it('minDistanceBetween should return scale range when data.length < 2', function() {

    var min,
        indices = [0, data.length - 1]

    data = [ ]

    min = d3.trait.chart.utils.minDistanceBetween(data, indices, accessX1, scale)
    expect(min).toBeCloseTo(10, .01)

    data = [
      {x: 1, y: 2}
    ]
    min = d3.trait.chart.utils.minDistanceBetween(data, indices, accessY1, scale)
    expect(min).toBeCloseTo(10, .01)
  });

  it('minDistanceBetween should return scale range when indices extent is invalid', function() {

    var min, indices

    indices = [0]
    min = d3.trait.chart.utils.minDistanceBetween(data, indices, accessX1, scale)
    expect(min).toBeCloseTo(10, .01)

    indices = [1, 1]
    min = d3.trait.chart.utils.minDistanceBetween(data, indices, accessX1, scale)
    expect(min).toBeCloseTo(10, .01)

    indices = [2, 1]
    min = d3.trait.chart.utils.minDistanceBetween(data, indices, accessX1, scale)
    expect(min).toBeCloseTo(10, .01)

  });

  it("minDistanceBetween should return scale range when indices start out of bounds", function() {

    var min,
        indices = [10, 20]

    min = d3.trait.chart.utils.minDistanceBetween(data, indices, accessX1, scale)
    expect(min).toBeCloseTo(10, .01)
  });

  it("minDistanceBetween should return min when indices end out of bounds", function() {

    var min,
        indices = [0, 10]

    min = d3.trait.chart.utils.minDistanceBetween(data, indices, accessX1, scale)
    expect(min).toBeCloseTo(1, .01)

  });

  it('minDistanceBetween should handle indices that are less than full data', function() {

    var min,
        indices = [0, 1]

    min = d3.trait.chart.utils.minDistanceBetween(data, indices, accessX1, scale)
    expect(min).toBeCloseTo(2, .01)

    min = d3.trait.chart.utils.minDistanceBetween(data, indices, accessY1, scale)
    expect(min).toBeCloseTo(2, .01)


    indices = [1, 2]

    min = d3.trait.chart.utils.minDistanceBetween(data, indices, accessX1, scale)
    expect(min).toBeCloseTo(1, .01)

    min = d3.trait.chart.utils.minDistanceBetween(data, indices, accessY1, scale)
    expect(min).toBeCloseTo(4, .01)
  });

  it('dataIndicesExtentForDomainExtent should return all data indices', function() {

    var result, extent

    extent = [1, 4]
    result = d3.trait.chart.utils.dataIndicesExtentForDomainExtent(data, accessX1, extent)
    expect(result).toEqual([0, 2])

    extent = [0, 5]
    result = d3.trait.chart.utils.dataIndicesExtentForDomainExtent(data, accessX1, extent)
    expect(result).toEqual([0, 2])

  });

  it('dataIndicesExtentForDomainExtent should return subset of data indices', function() {

    var result, extent

    extent = [1, 3]
    result = d3.trait.chart.utils.dataIndicesExtentForDomainExtent(data, accessX1, extent)
    expect(result).toEqual([0, 1])

    extent = [0, 3]
    result = d3.trait.chart.utils.dataIndicesExtentForDomainExtent(data, accessX1, extent)
    expect(result).toEqual([0, 1])

    extent = [2, 4]
    result = d3.trait.chart.utils.dataIndicesExtentForDomainExtent(data, accessX1, extent)
    expect(result).toEqual([1, 2])

    extent = [2, 5]
    result = d3.trait.chart.utils.dataIndicesExtentForDomainExtent(data, accessX1, extent)
    expect(result).toEqual([1, 2])

  });

  it('dataIndicesExtentForDomainExtent should handle empty data', function() {

    var result, extent

    data = []

    extent = [1, 3]
    result = d3.trait.chart.utils.dataIndicesExtentForDomainExtent(data, accessX1, extent)
    expect(result).toEqual(null)

  });


});


