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
        xIsDate = false,
        epsilon = 0.01

    var values = defaultIdentity,
        out = defaultOutXY,
        x = defaultX,
        y = defaultY

    function uniformIterator( _data) {
      data = _data
      current = {x: undefined, y: undefined}

      if( !data.length) {
        index = undefined
        nextX = undefined
      } else {
        index = -1
        nextX = x.call( uniformIterator, data[0], 0)
        if( nextX instanceof Date)
          xIsDate = true
      }

      return uniformIterator
    }

    function advance() {
      if( nextX !== undefined) {
        index++              // have a nextX, so next index is valid.
        current.y = y.call( uniformIterator, data[index], index)
        current.x = nextX
        nextX = index + 1 < data.length ? x.call( uniformIterator,  data[index + 1], index + 1) : undefined
      }
    }

    uniformIterator.isNext = function( ) {
      return nextX !== undefined
    }

    uniformIterator.empty = function( ) {
      return data.length === 0
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
      var point, outPoint

      // cursor. index      nextX
      //         ---------  ---------
      //         -1         number        Start of series
      //         >=0        number        Middle of series.
      //         >=0        undefined     At end of series or past end of series.
      //         undefined  undefined     Series is empty

      if( nextX !== undefined) {
        while( nextX !== undefined && nextX.valueOf() <= xMin.valueOf() + epsilon) {
          advance()
        }
        if( Math.abs(current.x.valueOf() - xMin.valueOf()) < epsilon)
          point = [current.x, current.y]
        else
          point = [xMin, current.y]  // TODO: Assuming interpolate: 'step-after'. Add others later.

        // if( nextX.valueOf() <= xMin.valueOf() + epsilon) {
        //   advance()
        //   point = [current.x, current.y]
        // } else {
        //   // nextX is too far away from xMin. Use xMin and interpolate y. Don't advance index.
        //   point = [xMin, current.y]  // TODO: Assuming interpolate: 'step-after'. Add others later.
        // }
      } else {
        // no next. Use xMin and interpolate y.
        point = [xMin, current.y]  // TODO: Assuming interpolate: 'step-after'. Add others later.
      }

      outPoint = {}
      out.call( uniformIterator, outPoint, point[0], point[1])

      return outPoint
    }


    /**
     * Advance the iterator so a call to next(xValue) will return the specified xValue.
     * @param {*} xValue Date or number
     * @returns {boolean}
     */
    uniformIterator.advanceToNextX = function( xValue) {
      if( xValue === undefined)
        return false

      var xValueMinusEpsilon = xValue.valueOf() - epsilon

      // cursor. index      nextX
      //         ---------  ---------
      //         -1         number        Start of series
      //         >=0        number        Middle of series.
      //         >=0        undefined     At end of series or past end of series.
      //         undefined  undefined     Series is empty

      if( data.length === 0)
        return false

      // advance until nextX is past xMin, so current.x is at xMin
      while( nextX !== undefined && nextX < xValueMinusEpsilon) {
        advance()
      }

      return true
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
   * Iterate over a continuous series, always returning a point at the
   * x value (between x and x + epsilon inclusive). The caller guarantees the
   * supplied x is greater than or equal to the next point of the iterator.
   *
   * If the next point is greater than x + epsilon, a new interpolated point is
   * returned and the iterator is not advanced.
   *
   * @returns {uniformInterpolator}
   */
  trait.layout.uniformInterpolator = function () {

    var data,
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
      iter.epsilon( epsilon)
    }

    function initializeNumberOfIteratorToNumberOfSeries( data) {
      var s, iter

      // Add to current list of iterators up to data.length.
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

    function initializeIteratatorsWithSeriesData( data) {
      var s = -1
      while( ++s < data.length)
        iterators[s]( data[s])
    }

    function uniformInterpolator( _data) {
      data = _data
      initializeNumberOfIteratorToNumberOfSeries( data)
      initializeIteratatorsWithSeriesData( data)
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
      var s = iterators.length
      while( --s >= 0)
        iterators[s].epsilon( epsilon)
      return uniformInterpolator;
    };

    return uniformInterpolator;

  } // end trait.layout.uniformInterpolator


}(d3, d3.trait));
