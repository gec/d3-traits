
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

  var SOURCE = '1s',
      seconds = 1000,
      minutes = 60 * seconds,
      hours = 60 * minutes,
      days = 24 * hours,
      weeks = 7 * days,
      months = 30 * days,
      years = 365 * days,  // don't use 365.25 so matches '1y' when == 365
      resolutions = [ SOURCE, '5s', '15s', '30s', '1m', '5m', '15m', '30m', '1h', '6h', '12h', '1d', '1w', '1mo', '1y'],
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
      } else if( step <= 6 * days) {
        res = '1d'
      } else if( step <= 3 * weeks) {
        res = '1w'
      } else if( step <= 10 * months) {
        res = '1mo'
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
    var step, extent,
        size = 100,
        resolution = '1s'



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

          var from, to, calculatedStep
          if( Array.isArray( extent) ) {
            from = extent[0]
            to = extent[extent.length-1]
          } else {
            from = extent
            to = Date.now()
          }
          calculatedStep = Math.max( 0, (to - from) / size)
          resolution = mapResolution( calculatedStep)
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

    return murtsRequest
  }


  function ResCache( resolution, access, data) {
    this.resolution = resolution
    this.step = resolutionMillis[ this.resolution]
    this.access = access
    this.data = data
    this.unsampledCount = 0
    this.extent = undefined
    this.nextHigherResolution = null
    this.nextLowerResolution = null
    this.lastRead = Date.now()
  }

  ResCache.prototype.initialSample = function( source) {
    this.data = sample( source.data, this.step, this.access)
  }

  ResCache.prototype.sampleUpdates = function() {
    var startIndex = this.data.length - this.unsampledCount,
        sampledData = sampleUpdates( this.data, startIndex, this.step, this.access)
    this.data.splice( startIndex, this.unsampledCount)
    this.data = this.data.concat( sampledData)
    this.unsampledCount = 0
  }

  ResCache.prototype.push = function( data) {
    if( this.data === undefined)
      this.data = []

    if( Array.isArray( data)) {
      this.unsampledCount += data.length
      this.data = this.data.concat( data)
    } else {
      this.data[this.data.length] = data
      this.unsampledCount ++
    }

    if( this.data.length > 0) {
      this.extent = [
        this.access.x( this.data[0]),
        this.access.x( this.data[this.data.length-1])
      ]
    }

    // TODO: what about updating sampled resolutions?

    // TODO: resample some time

    return this;
  }





  function _murtsDataStore() {
    var access = {
          x: function( d) { return d[0] },
          y: function( d) { return d[1] }
        },
        caches = {}

    function findHigherResolution( index) {
      var i, r

      for(i = index - 1; i >= 0; i-- ) {
        r = resolutions[i]
        if( caches.hasOwnProperty(r)) {
          return caches[r]
        }
      }
      return null
    }
    function findLowerResolution( index) {
      var i, r

      for(i = index + 1; i < resolutions.length; i++ ) {
        r = resolutions[i]
        if( caches.hasOwnProperty(r)) {
          return caches[r]
        }
      }
      return null
    }
    function linkCache( cache) {
      var i, r, c, lower, higher,
          index = resolutions.indexOf( cache.resolution)

      lower = findLowerResolution( index)
      if( lower) {
        cache.nextLowerResolution = lower
        lower.nextHigherResolution = cache
      }

      higher = findHigherResolution( index)
      if( higher) {
        cache.nextHigherResolution = higher
        higher.nextLowerResolution = cache
      }
    }

    function unlinkCache( cache) {
      var lower, higher,
          index = resolutions.indexOf( cache.resolution)

      lower = findLowerResolution( index)
      higher = findHigherResolution( index)

      if( higher)
        higher.nextLowerResolution = lower
      if( lower)
        lower.nextHigherResolution = higher

      cache.nextLowerResolution = null
      cache.nextHigherResolution = null
    }

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
        c = new ResCache( r, access)
        caches[r] = c
        linkCache( c)
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
     * @param data
     * @param resolution
     * @returns {murtsDataStore}
     */
    murtsDataStore.push = function( data, resolution) {
      var c = getCache( resolution)

      c.push( data)

      // Push to lower resolutions
      //
      c = c.nextLowerResolution
      while( c) {
        c.push( data)
        c = c.nextLowerResolution
      }

      return this;
    }


    murtsDataStore.get = function( request, callback) {
      var resolution = request.resolution(),
          target = getCache( resolution)

      if( target.data === undefined) {
        // TODO: What if there is no source?
        var index = resolutions.indexOf( target.resolution),
            source = findHigherResolution( index),
            step = resolutionMillis[ target.resolution]
        if( source && source.data) {
          target.initialSample( source)
        } else {
          if( ! source)
            console.error( 'murts.get findHigherResolution( ' + target.resolution + ') -- no cache found to sample from')
          else
            console.error( 'murts.get findHigherResolution( ' + target.resolution + ') -- no data found in cache')
          target.data = []
        }
      }

      target.lastRead = Date.now()
      return target;
    }


    return murtsDataStore;

  }



  function collectStepStats( data, sourceIndex, timeStop, sourceIndexLast, access) {
    var d = data[ sourceIndex],
        x = access.x( d),
        y = access.y( d),
        min = { x: x, y: y, d: d },
        max = { x: x, y: y, d: d },
        sum = { x: x, y: y, count: 1}

    // TODO: What if there is no point within this step? Shouldn't we go to the next step.

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
   * For now, let's sample everything at once. No tiling.
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

    // TODO: For three points, b (aka. source[1]) is never used!
    // TODO: What if there is no point within the last step?

    for( ; sourceIndex < sourceIndexLast; sourceIndex++) {
      var areaUsingBMin, areaUsingBMax, aX, aY, maxAreaPoint

      c = collectStepStats( source, sourceIndex, stepEnd, sourceIndexLast, access)
      sourceIndex = c.sourceIndex
      // TODO: what if c doesn't find any data points in that step?

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
  /**
   * For now, let's sample everything at once. No tiling.
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
  function sampleUpdates( source, startIndex, step, access) {
    var a, b, c, stepEnd,
        sourceIndex = startIndex,
        unsampledLength = source.length - startIndex,
        sampled = [],
        sourceIndexLast = source.length - 1

    var startTimer = Date.now()
    console.log( 'murts.sampleUpdates unsampledLength: ' + unsampledLength + ' start ')



    if( unsampledLength === 0)
      return sampled

    if( startIndex < 2) {
      sampled = sample( source, step, access)
      if( startIndex === 1) {
        sampled = sampled.slice( 1)
      }
      return sampled
    }

    a = source[sourceIndex - 2]
    b = source[sourceIndex - 1]

    stepEnd = access.x( b) + step

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

    console.log( 'murts.sample unsampledLength: ' + unsampledLength + ' end  ' + (Date.now()-startTimer) + ' ms')

    return sampled
  }



  trait.murts = {
    request: _murtsRequest,
    dataStore: _murtsDataStore,
    utils: {
           ResCache: ResCache,
           sample: sample,
           sampleUpdates: sampleUpdates,
           mapResolution: mapResolution
    }
  }

}(d3, d3.trait));
