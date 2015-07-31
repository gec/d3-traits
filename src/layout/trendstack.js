/**
 * Copyright 2013 Green Energy Corp.
 *
 * Licensed to Green Energy Corp (www.greenenergycorp.com) under one or more
 * contributor license agreements. See the NOTICE file distributed with this
 * work for additional information regarding copyright ownership. Green Energy
 * Corp licenses this file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Author: Flint O'Brien
 */
function d3traits_layout_trendstack_makeCursors( series, points) {
  var cursor = {
    current: []
  }
}

(function (d3, trait) {

  function defaultIdentity(d) { return d }
  function defaultX(d) { return d.x }
  function defaultY(d) { return d.y }
  function defaultOutXY(d, x, y) { d.x = x; d.y = y}
  function defaultOut(d, x, y0, y) { d.x = x; d.y0 = y0; d.y = y}

  /**
   * Iterate over a continuous series, always returning a point at the 240
   * x value (between x and x + epsilon inclusive). The caller guarantees the
   * supplied x is greater than or equal to the next point of the iterator.
   *
   * If the next point is greater thn x + epsilon, a new interpolated point is
   * returned and the iterator is not advanced.
   *
   * @returns {uniformIterator}
   */
  trait.layout.uniformIterator = function () {

    var data, current, index, nextX,
        epsilon = 0.01

    var values = defaultIdentity,
        out = defaultOutXY,
        x = defaultX,
        y = defaultY

    function uniformIterator( _data) {
      data = _data
      current = {x: undefined, y: 0}

      if( !data.length) {
        index = undefined
        nextX = undefined
      } else {
        index = -1
        nextX = x.call( uniformIterator, data[0], 0)
      }

      return uniformIterator
    }

    uniformIterator.isNext = function( ) {
      return nextX !== undefined
    }

    /**
     * Return the next x value, but don't advance the iterator.
     *
     * @returns {number} The next x value or undefined if past the end of the series.
     */
    uniformIterator.peekNextX = function( ) {
      return nextX
    }

    uniformIterator.next = function( xMin) {
      var d, point, outPoint

      // cursor. index      nextX
      //         ---------  ---------
      //         -1         number        Start of series
      //         >=0        number        Middle of series.
      //         >=0        undefined     At end of series or past end of series.
      //         undefined  undefined     Series is empty

      if( nextX !== undefined) {
        if( nextX <= xMin + epsilon) {
          // Advance and use value
          index++              // have a nextX, so next index is valid.
          d = data[index]
          current.y = y.call( uniformIterator, d, index)
          current.x = nextX
          nextX = index + 1 < data.length ? x.call( uniformIterator,  data[index + 1], index + 1) : undefined
          point = [current.x, current.y]
        } else {
          // nextX is too far away from xMin. Use xMin and interpolate y. Don't advance index.
          point = [xMin, current.y]  // TODO: Assuming interpolate: 'step-after'. Add others later.
        }
      } else {
        // no next. Use xMin and interpolate y.
        point = [xMin, current.y]  // TODO: Assuming interpolate: 'step-after'. Add others later.
      }

      outPoint = {}
      point = out.call( uniformIterator, outPoint, point[0], point[1])

      return outPoint
    }



    uniformIterator.values = function(x) {
      if (!arguments.length) return values;
      values = x;
      return uniformIterator;
    };

    uniformIterator.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      return uniformIterator;
    };

    uniformIterator.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      return uniformIterator;
    };

    uniformIterator.out = function(z) {
      if (!arguments.length) return out;
      out = z;
      return uniformIterator;
    };

    uniformIterator.epsilon = function(z) {
      if (!arguments.length) return epsilon;
      epsilon = z;
      return uniformIterator;
    };

    return uniformIterator;

  } // end trait.layout.uniformIterator





  /**
   * Iterate over a continuous series, always returning a point at the 240
   * x value (between x and x + epsilon inclusive). The caller guarantees the
   * supplied x is greater than or equal to the next point of the iterator.
   *
   * If the next point is greater thn x + epsilon, a new interpolated point is
   * returned and the iterator is not advanced.
   *
   * @returns {uniformInterpolator}
   */
  trait.layout.uniformInterpolator = function () {

    var data, current, index, nextX,
        iterators = [],
        epsilon = 0.01


    var values = defaultIdentity,
        out = defaultOutXY,
        x = defaultX,
        y = defaultY,
        mapUniform = trait.layout.mapUniform

    function applyAccessorsToIterator( iter) {
      if( values !== defaultIdentity)
        iter.values( values)
      if( x !== defaultX)
        iter.x( x)
      if( y !== defaultY)
        iter.y( y)
      if( out !== defaultOut)
        iter.out( out)
    }

    function initializeIterators( data) {
      var s, iter

      // Add iterators
      s = iterators.length - 1
      while( ++s < data.length) {
        iter = trait.layout.uniformIterator()
        applyAccessorsToIterator( iter)
        iterators[s] = iter
      }

      // Remove extra iterators
      var extra = data.length - iterators.length
      if( extra > 0) {
        iterators.splice( iterators.length, extra)
      }
    }

    function uniformInterpolator( _data) {
      data = _data
      initializeIterators( data)

      return mapUniform( iterators)
    }

    uniformInterpolator.values = function(x) {
      if (!arguments.length) return values;
      values = x;
      var s = iterators.length
      while( --s >= 0)
        iterators[s].values( values)
      return uniformInterpolator;
    };

    uniformInterpolator.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      var s = iterators.length
      while( --s >= 0)
        iterators[s].x( x)
      return uniformInterpolator;
    };

    uniformInterpolator.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      var s = iterators.length
      while( --s >= 0)
        iterators[s].y( y)
      return uniformInterpolator;
    };

    uniformInterpolator.out = function(z) {
      if (!arguments.length) return out;
      out = z;
      var s = iterators.length
      while( --s >= 0)
        iterators[s].out( out)
      return uniformInterpolator;
    };

    uniformInterpolator.epsilon = function(z) {
      if (!arguments.length) return epsilon;
      epsilon = z;
      return uniformInterpolator;
    };

    return uniformInterpolator;

  } // end trait.layout.uniformInterpolator





  trait.layout.trendstack = function () {

    var values = function(d) { return d },
        order = function( data) { return d3.range(data.length)},
        offset = stackOffsetZero,
        out = defaultOut,
        x = function(d) { return d.x },
        y = function(d) { return d.y }


    function trendstack(data) {
      var n = data.length
      if (!n) return data;

      // Convert series to canonical two-dimensional representation.
      var series = data.map(function(d, i) {
        return values.call(trendstack, d, i);
      });

      // Convert each series to canonical [[x,y]] representation.
      var points = series.map(function(d) {
        return d.map(function(v, i) {
          return [x.call(trendstack, v, i), y.call(trendstack, v, i)];
        });
      });

      // Compute the order of series, and permute them.
      var orders = order.call(trendstack, points);
      series = d3.permute(series, orders);
      points = d3.permute(points, orders);

      // Compute the baseline…
      var offsets = offset.call(trendstack, points);

      // And propagate it to other series.
      var m = series[0].length,
          i, // seriesIndex
          j, // xIndex
          o; // running total
      for (j = 0; j < m; ++j) { // for x
        out.call(trendstack, series[0][j], o = offsets[j], points[0][j][1]);
        for (i = 1; i < n; ++i) {
          // out(d, y0, y)
          out.call(trendstack, series[i][j], o += points[i - 1][j][1], points[i][j][1]);
        }
      }

      return data;
    }
    trendstack.makeCursors = function( ) {

    }

    trendstack.values = function(x) {
      if (!arguments.length) return values;
      values = x;
      return trendstack;
    };

    trendstack.order = function(x) {
      if (!arguments.length) return order;
      order = typeof x === "function" ? x : d3_layout_stackOrders.get(x) || d3_layout_stackOrderDefault;
      return trendstack;
    };

    trendstack.offset = function(x) {
      if (!arguments.length) return offset;
      offset = typeof x === "function" ? x : d3_layout_stackOffsets.get(x) || d3_layout_stackOffsetZero;
      return trendstack;
    };

    trendstack.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      return trendstack;
    };

    trendstack.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      return trendstack;
    };

    trendstack.out = function(z) {
      if (!arguments.length) return out;
      out = z;
      return trendstack;
    };

    return trendstack;

  } // end trait.layout.trendstack


  function stackOffsetZero(data) {
    var j = -1,
        m = data[0].length,
        y0 = [];
    while (++j < m) y0[j] = 0;
    return y0;
  }



}(d3, d3.trait));
