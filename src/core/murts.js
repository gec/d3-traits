
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

  var SOURCE = 'source',
      seconds = 1000,
      minutes = 60 * seconds,
      hours = 60 * minutes,
      days = 24 * hours,
      weeks = 7 * days,
      months = 30 * days,
      years = 365 * days,  // don't use 365.25 so matches '1y' when == 365
      resolutions = ['1y', '1m', '1w', '1d', '12h', '6h', '1h', '30m', '15m', '5m', '1m', '30s', '15s', '5s', '1s', SOURCE],
      resolutionMillis = {
         '1y':  1 * years + 0.25 * days,
         '1m':  1 * months,
         '1w':  1 * weeks,
         '1d':  1 * days,
        '12h': 12 * hours,
         '6h':  6 * hours,
         '1h':  1 * hours,
        '30m': 30 * minutes,
        '15m': 15 * minutes,
         '5m':  5 * minutes,
         '1m':  1 * minutes,
        '30s': 30 * seconds,
        '15s': 15 * seconds,
         '5s':  5 * seconds,
         '1s':  1 * seconds,
        'source': 1 * seconds
      }


  function mapResolution( step) {

    if( step === undefined || step === null)
      return undefined
    if( step <= 0)
      return SOURCE

    var res = SOURCE

    if( step < hours) {
      if( step < minutes) {
        res =  step <= 3 * seconds ? '1s'
          : step <= 12 * seconds ? '5s'
          : step <= 24 * seconds ? '15s'
          : '30s'
      } else { // 1m to 30m
        res =  step <= 3 * minutes ? '1m'
          : step <= 12 * minutes ? '5m'
          : step <= 24 * minutes ? '15m'
          : '30m'
      }
    } else {
      if( step < days) {
        res =  step <= 4 * hours ? '1h'
          : step <= 9 * hours ? '6h'
          : '12h'
      } else if( step < 6 * days) {
        res = '1d'
      } else if( step <= 3 * weeks) {
        res = '1w'
      } else if( step < 10 * months) {
        res = '1m'
      } else {
        res = '1y'
      }
    }

    return res
  }


  /**
   * MUltiple Resolution Time Series (murtsDataStore) data store.
   *
   * request()
   *   .step( milliseconds)
   *   .size( count)
   *   .extent( [from, to]) [from, to] or from
   */
  function _murtsRequest() {
    var step = undefined,
        size = 100,
        resolution = '1s',
        extent = undefined


    function murtsRequest() {
      var self = murtsRequest

    }

    function calculateResolution() {
      // Use either step or extent/size
      var resolution = mapResolution( step)
      if( resolution === undefined) {

        if( extent === undefined) {
          resolution = '1s'
        } else {

          var from, to
          if( Array.isArray( extent) ) {
            from = extent[0]
            to = extent[extent.length-1]
          } else {
            from = extent
            to = Date.now()
          }
          step = Math.max( 0, (to - from) / size)
          resolution = mapResolution( step)
        }

      }
      return resolution
    }


    /**
     * The step is the amount of milliseconds between each data point.
     * @param _step
     */
    murtsRequest.step = function ( _step) {
      if( !arguments.length ) return step
      step = Math.max( 0, _step)
      resolution = calculateResolution()
      return this
    }

    /**
     * The size is the numbert of data points.
     * @param _size
     */
    murtsRequest.size = function ( _size) {
      if( !arguments.length ) return size
      size = Math.max( 1, _size)
      resolution = calculateResolution()
      return this
    }

    /**
     * The extent is the numbert of data points.
     * @param _extent
     */
    murtsRequest.extent = function ( _extent) {
      if( !arguments.length ) return extent
      extent = _extent
      resolution = calculateResolution()
      return this
    }

    /**
     * The extent is the numbert of data points.
     * @param _resolution
     */
    murtsRequest.resolution = function () {
      return resolution
    }

  }






  function _murtsDataStore() {
    var source,
        access = {
          x: function( d) { return d[0] },
          y: function( d) { return d[1] }
        },
        caches = {}

    function makeCache( res, data) {
      return {
        resolution: res,
        data: data,
        unsampledCount: 0,
        extent: undefined
      }
    }

    caches[SOURCE] = makeCache( SOURCE, [])
    source = caches[SOURCE]

    /**
     * MUltiple Resolution Time Series (murtsDataStore) data store.
     *
     * .x( accessor)
     * .y( accessor)
     * .push( newValue) single or array
     * .on( 'push', callback)
     * .get( request, callback)
     *
     */

    function murtsDataStore() {
      var self = murtsDataStore

    }

    /**
     * The accessor for the time dimension
     * @param _accessor
     */
    murtsDataStore.x = function ( _accessor) {
      if( !arguments.length ) return access.x
      access.x = _accessor
      return this
    }
    murtsDataStore.y = function ( _accessor) {
      if( !arguments.length ) return access.y
      access.y = _accessor
      return this
    }


    // TODO: remove cache

    function getCache( resolution) {
      var r = resolution || SOURCE
      var c = caches[r]
      if( c === undefined){
        c = makeCache( r)
        caches[r] = c
      }
      return c
    }

    /**
     *
     * Push source and samples. Resample when?
     *
     * Push source. Each sample has a resample timer that executes at each step.
     * It knows the last index of the source data that it sampled.
     * Problem when data falls off left.
     *
     * @param _data
     * @param resolution
     * @returns {murtsDataStore}
     */
    murtsDataStore.push = function( _data, resolution) {
      var c = getCache( resolution)

      if( c.data === undefined)
        c.data = []

      if( Array.isArray( _data)) {
        c.unsampledCount += _data.length
        c.data = c.data.concat( _data)
        c.extent = [
          access.x( c.data[0]),
          access.x( c.data[data.length-1])
        ]
      } else {
        c.data[c.data.length] = _data
        c.unsampledCount ++
        var newEnd = access.x( _data)
        if( !c.extent)
          c.extent = [newEnd]  // first data point pushed
        c.extent[1] = newEnd
      }

      // TODO: what about updating sampled resolutions?

      // TODO: resample some time

      return this;
    }

    murtsDataStore.get = function( request, callback) {
      var resolution = request.resolution(),
          target = getCache( resolution)

      if( target.data === undefined) {
        // TODO: What if there is no source?
        var source = findSourceCache( caches, target.resolution),
            step = resolutionMillis[ target.resolution]
        sample( source.data, step, access)
      }

      return target;
    }


    return murtsDataStore;

  }

  function findSourceCache( caches, res) {
    var c,
        index = resolutions.indexOf( res)
    for( ; index < resolutions.length; index++) {
      c = caches[ resolutions[index]]
      if( c && c.data)
        return c
    }
    console.error( 'murts.findSourceCache( ' + res + ') -- none found')
  }


  function collectStepStats( data, sourceIndex, timeStop, sourceIndexLast, access) {
    var d = data[ sourceIndex],
        x = access.x( d),
        y = access.y( d),
        min = { x: x, y: y, d: d },
        max = { x: x, y: y, d: d },
        sum = { x: x, y: y, count: 1}

    for( sourceIndex ++; x < timeStop && sourceIndex < sourceIndexLast; sourceIndex ++) {

      d = data[ sourceIndex]
      x = access.x(d)
      y = access.y(d)

      sum.x += x
      sum.y += y
      sum.count ++

      if( y < min.y) {
        min.x = x
        min.y = y
        min.d = d
      } else if( y > max.y) {
        max.x = x
        max.y = y
        max.d = d
      }
    }

    return {
      min: min,
      max: max,
      ave: {
         x: sum.x / sum.count,
         y: sum.y / sum.count,
         count: sum.count  // for debug or performance stats
      },
      sourceIndex: sourceIndex
    }
  }

  /**
   * For now, lets sample everything at once. No tiling.
   *
   * For Largest Triangle Three Buckets algorithm see:
   * Sveinn Steinarsson - Downsampling Time Series for Visual Representation
   * http://skemman.is/stream/get/1946/15343/37285/3/SS_MSthesis.pdf
   * https://github.com/sveinn-steinarsson/flot-downsample/blob/master/jquery.flot.downsample.js
   *
   * @param source Source data used for sampling
   * @param step Millisecond step used for sampling
   * @param access Access functions for x and y
   */
  function sample( source, step, access) {
    var a, b, c, stepEnd,
        sourceIndex = 0,
        sampled = [],
        sourceIndexLast = source.length - 1

    var startTimer = Date.now()
    console.log( 'murts.sample source.length: ' + source.length + ' start ')

    if( source.length === 0)
      return sampled

    // TODO: Find first data point within extent
    //

    // Always use first point
    a = source[sourceIndex++]
    sampled[0] = a
    if( source.length === 1)
      return sampled
    if( source.length === 2) {
      sampled[1] = source[sourceIndex++]
      return sampled
    }

    stepEnd = access.x( a) + step

    // Find the first b. At the end of the following for loop, c becomes the next b.
    b = collectStepStats( source, sourceIndex, stepEnd, sourceIndexLast, access)
    sourceIndex = b.sourceIndex
    stepEnd = stepEnd + step


    for( ; sourceIndex < sourceIndexLast; sourceIndex++) {
      var areaUsingBMin, areaUsingBMax, aX, aY, maxAreaPoint

      c = collectStepStats( source, sourceIndex, stepEnd, sourceIndexLast, access)
      sourceIndex = c.sourceIndex

      // Now we have a, b, c
      aX = access.x(a)
      aY = access.y(a)
      areaUsingBMin = Math.abs(
        (aX - c.ave.x) * (b.min.y - aY) -
        (aX - b.min.x) * (c.ave.y - aY)
      ) * 0.5
      areaUsingBMax = Math.abs(
        (aX - c.ave.x) * (b.max.y - aY) -
        (aX - b.max.x) * (c.ave.y - aY)
      ) * 0.5

      maxAreaPoint = areaUsingBMin < areaUsingBMax ? b.min.d : b.max.d
      sampled[ sampled.length] = maxAreaPoint

      a = maxAreaPoint
      b = c
      stepEnd = stepEnd + step
    }

    // Always use last point
    sampled[sampled.length] = source[sourceIndex]

    console.log( 'murts.sample source.length: ' + source.length + ' end  ' + (Date.now()-startTimer) + ' ms')

    return sampled
  }


  trait.murts = {
    request: _murtsRequest(),
    dataStore: _murtsDataStore,
    utils: {
           sample: sample,
           mapResolution: mapResolution
    }
  }

}(d3, d3.trait));
