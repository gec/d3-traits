describe('d3.trait.utils', function() {

  var access = {
    series: function(d) { return d; },
    data: function(d) { return d; },
    value:   function(d) { return d; },
    scaleName: 'y1'
  }

  beforeEach(function() {
  })


  it('minFromData should return minimum value', function() {

    var min

    min = d3.trait.utils.minFromData([ [] ], access)
    expect(min).toBeCloseTo(0, .01)

    min = d3.trait.utils.minFromData([ [0, 1, 2] ], access)
    expect(min).toBeCloseTo(0, .01)

    min = d3.trait.utils.minFromData([ [0, 1], [2, 3] ], access)
    expect(min).toBeCloseTo(0, .01)

    min = d3.trait.utils.minFromData([ [5, 6], [2, 3] ], access)
    expect(min).toBeCloseTo(2, .01)

  });

  it('minFromData should return minimum stacked value', function() {

    var min,
        access2 = {
          series: function(d) { return d.series },
          data:   function(d) { return d },
          value:  function(d) { return d.y }
        }

    min = d3.trait.utils.minFromAreaData([ {series: [ {y0: 2, y: 1}, {y0: 3, y:2}, {y0: 4, y: 3}]} ], access2)
    expect(min).toBeCloseTo(2, .01)
  });

  it('maxFromData should return maximum value', function() {

    var min

    min = d3.trait.utils.maxFromData([ [] ], access)
    expect(min).toBeCloseTo(0, .01)

    min = d3.trait.utils.maxFromData([ [] ], access, 1)
    expect(min).toBeCloseTo(1, .01)

    min = d3.trait.utils.maxFromData([ [0, 1, 2] ], access)
    expect(min).toBeCloseTo(2, .01)

    min = d3.trait.utils.maxFromData([ [0, 1], [2, 3] ], access)
    expect(min).toBeCloseTo(3, .01)

    min = d3.trait.utils.maxFromData([ [5, 6], [2, 3] ], access)
    expect(min).toBeCloseTo(6, .01)

  });

  it('maxFromAreaData should return maximum area value', function() {

    var min,
        access2 = {
          series: function(d) { return d.series },
          data:   function(d) { return d },
          value:  function(d) { return d.y }
        }

    min = d3.trait.utils.maxFromAreaData([ {series: [ {y0: 2, y: 1}, {y0: 3, y:2}, {y0: 4, y: 3}]} ], access2)
    expect(min).toBeCloseTo(7, .01)
  });

  it('extentFromData should return default extents when data is empty', function() {

    var extent,
        padding = 0

    extent = d3.trait.utils.extentFromData([ [] ], access, padding)
    expect(extent).toEqual([0, 1])

    extent = d3.trait.utils.extentFromData([ [] ], access, padding, [1, 2])
    expect(extent).toEqual([1, 2])

  });

  it('extentFromData should return [min-1 , max+1] if min == max', function() {

    var extent,
        padding = 0

    extent = d3.trait.utils.extentFromData([ [1] ], access, padding)
    expect(extent).toEqual([0, 2])

    extent = d3.trait.utils.extentFromData([ [1], [1] ], access, padding)
    expect(extent).toEqual([0, 2])

  });

  it('extentFromData should return extents', function() {

    var extent,
        padding = 0

    extent = d3.trait.utils.extentFromData([ [0, 1, 2] ], access, padding)
    expect(extent).toEqual([0, 2])

    extent = d3.trait.utils.extentFromData([ [0, 1], [2, 3] ], access, padding)
    expect(extent).toEqual([0, 3])

    extent = d3.trait.utils.extentFromData([ [5, 6], [2, 3] ], access, padding)
    expect(extent).toEqual([2, 6])

    extent = d3.trait.utils.extentFromData([ [1, 2] ], access, 1)
    expect(extent).toEqual([0, 3])

  });

  it('extentFromAreaData should return area extents', function() {

    var extent,
        padding = 0,
        access2 = {
          series: function(d) { return d.series },
          data:   function(d) { return d.y }
        }

    extent = d3.trait.utils.extentFromAreaData([ {series: [ {y0: 0, y: 1}, {y0: 0, y:2}, {y0: 0, y: 3}]} ], access2, padding)
    expect(extent).toEqual([1, 3])

  });

  it('niceExtent should return same extent when extent min is 0', function() {
    expect(d3.trait.utils.niceExtent([0, 0])).toEqual([0, 0])
    expect(d3.trait.utils.niceExtent([0, 1])).toEqual([0, 1])
    expect(d3.trait.utils.niceExtent([0, 10])).toEqual([0, 10])
    expect(d3.trait.utils.niceExtent([0, 100])).toEqual([0, 100])
  });

  it('niceExtent should return same extent when extent is zero', function() {
    expect(d3.trait.utils.niceExtent([4, 4])).toEqual([4, 4])
    expect(d3.trait.utils.niceExtent([10, 10])).toEqual([10, 10])
    expect(d3.trait.utils.niceExtent([253, 253])).toEqual([253, 253])
  });

  it('niceExtent should return nice extent with updated minimum', function() {
    expect(d3.trait.utils.niceExtent([10, 11])).toEqual([9.8, 11])
    expect(d3.trait.utils.niceExtent([10, 20])).toEqual([8, 20])
    expect(d3.trait.utils.niceExtent([100, 120])).toEqual([95, 120])
    expect(d3.trait.utils.niceExtent([100, 900])).toEqual([ 0, 900])
    expect(d3.trait.utils.niceExtent([200, 250])).toEqual([ 190, 250])
    expect(d3.trait.utils.niceExtent([200, 300])).toEqual([ 180, 300])
    expect(d3.trait.utils.niceExtent([310, 450])).toEqual([ 300, 450])
    expect(d3.trait.utils.niceExtent([390, 420])).toEqual([ 385, 420])
    expect(d3.trait.utils.niceExtent([400, 420])).toEqual([ 395, 420])
    expect(d3.trait.utils.niceExtent([400, 460])).toEqual([ 390, 460])
    expect(d3.trait.utils.niceExtent([400, 500])).toEqual([ 380, 500])
    expect(d3.trait.utils.niceExtent([450, 520])).toEqual([ 440, 520])
    expect(d3.trait.utils.niceExtent([450, 720])).toEqual([ 400, 720])
    expect(d3.trait.utils.niceExtent([500, 520])).toEqual([ 495, 520])
    expect(d3.trait.utils.niceExtent([500, 560])).toEqual([ 490, 560])
    expect(d3.trait.utils.niceExtent([500, 600])).toEqual([ 480, 600])
    expect(d3.trait.utils.niceExtent([500, 700])).toEqual([ 450, 700])
  });


});


