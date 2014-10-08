
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
        SOURCE: 1 * seconds
      }


  function mapResolution( step) {

    if( step === undefined || step === null)
      return undefined
    if( step === 0)
      return SOURCE

    if( step < hours) {
      if( step < minutes) {
        return step <= 3 * seconds ? '1s'
          : step <= 12 * seconds ? '5s'
          : step <= 24 * seconds ? '15s'
          : '30s'
      } else { // 1m to 30m
        return step <= 3 * minutes ? '1m'
          : step <= 12 * minutes ? '5m'
          : step <= 24 * minutes ? '15m'
          : '30m'
      }
    } else {
      if( step < days) {
        return step <= 4 * hours ? '1h'
          : step <= 9 * hours ? '6h'
          : '12h'
      } else if( step < 6 * days) {
        return '1d'
      } else if( step <= 3 * weeks) {
        return '1w'
      } else if( step < 10 * months) {
        return '1m'
      } else {
        return '1y'
      }
    }

    if( step <= 1000)
      return '1s'
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
    var step = 1000,
        size = 100,
        resolution = '1s',
        extent = undefined


    function murtsRequest() {
      var self = murtsRequest

    }

    function calculateResolution() {
      // Ether do size/extent or step
      var resolution = mapResolution( step)
      if( resolution === undefined) {
        if( extent === undefined) {
          resolution = '1s'
        } else {

          var from, to, step,
              extent = request.extent(),
              size = request.size() || 500
          if( Array.isArray( extent) ) {
            from = extent[0]
            to = extent[extent.length-1]
          } else {
            from = extent
            to = Date.now()
          }
          step = (to - from) / size
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
      step = _step
      resolution = calculateResolution()
      return this
    }

    /**
     * The size is the numbert of data points.
     * @param _size
     */
    murtsRequest.size = function ( _size) {
      if( !arguments.length ) return size
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
        x = function( d) { return d[0] },
        y = function( d) { return d[1] },
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
      if( !arguments.length ) return x
      x = _accessor
      return this
    }
    murtsDataStore.y = function ( _accessor) {
      if( !arguments.length ) return y
      y = _accessor
      return this
    }


    function getCache( resolution) {
      var r = resolution || SOURCE
      var c = caches[r]
      if( c === undefined){
        c = makeCache( r)
        caches[r] = c
      }
      return c
    }

    murtsDataStore.push = function( _data, resolution) {
      var c = getCache( resolution)

      if( c.data === undefined)
        c.data = []

      if( Array.isArray( _data)) {
        c.unsampledCount += _data.length
        c.data = c.data.concat( _data)
        c.extent = [
          acessor( c.data[0]),
          acessor( c.data[data.length-1])
        ]
      } else {
        c.data[c.data.length] = _data
        c.unsampledCount ++
        var newEnd = x( _data)
        if( !c.extent)
          c.extent = [newEnd]  // first data point pushed
        c.extent[1] = newEnd
      }

      // TODO: resample some time

      return this;
    }

    murtsDataStore.get = function( request, callback) {
      var c,
          resolution = request.resolution(),
          extent = request.extent()

      c = getCache( resolution)
      if( c.data === undefined)
        sample( c)

      return c;
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


  function stepStats( data, sourceIndex, timeStop, last, x, y) {
    var d = data[ sourceIndex],
        t = x( d),
        v = y( d),
        min = { v: v, d: d },
        max = { v: v, d: d },
        sum = { v: 0, d: 0, count: 0}

    for( sourceIndex ++; t < timeStop && sourceIndex < last; sourceIndex ++) {

      d = data[ sourceIndex]
      t = x( d)
      v = y(d)

      sum.t += t
      sum.v += v
      sum.count ++

      if( min.v < v) {
        min.v = v
        min.d = d
      } else if( max.v > v) {
        max.v = v
        max.d = d
      }
    }

    return {
      min: min,
      max: max,
      ava: {
         t: sum.t / sum.count,
         v: sum.v / sum.count
      },
      sourceIndex: sourceIndex
    }
  }

  /**
   * For now, lets sample everything at once. No tiling.
   * @param caches
   * @param target
   */
  function sample( caches, target, x, y) {
    var a, b, c, timeStop,
        sourceIndex = 0,
        sampled = [],
        source = findSourceCache( caches, target.resolution),
        data = source.data,
        last = data.length - 1,
        step = resolutionMillis[ target.resolution]


    // TODO: Find first data point within extent
    //


    a = data[sourceIndex]
    sampled[0] = a
    if( data.length <= 1)
      return sampled

    timeStop = x( a) + step

    // Find the first b. After this, b will be the previous c.
    b = stepStats( data, sourceIndex, timeStop, last, x, y)
    sourceIndex = b.sourceIndex
    timeStop = timeStop + step


    for( ; sourceIndex < last; sourceIndex++) {
      var d = data[ sourceIndex],
          t = x( d),
          v = y( d),
          min = { v: v, d: d },
          max = { v: v, d: d }

      c = stepStats( data, sourceIndex, timeStop, last, x, y)

      // Now we have a, b, c


      sourceIndex = b.sourceIndex
      timeStop = timeStop + step

      // Make next b out of c
    }
  }


  trait.murts = {
    request: _murtsRequest(),
    dataStore: _murtsDataStore
  }

}(d3, d3.trait));
