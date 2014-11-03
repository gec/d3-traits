
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


  function mapResolutionFromStep( step) {

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

  function calculateResolution( scale) {

    var range, domainMin

    range= scale.range()
    if( ! range)
      return undefined

    domainMin = scale.invert(range[0])
    if( isNaN( domainMin))
      return undefined

    var rangeMax = d3.trait.utils.extentMax(range),
        rangeSpan = Math.abs( rangeMax - range[0]),
        domainMax = scale.invert(rangeMax),
        domainSpan = Math.abs( domainMax - domainMin),
        step = domainSpan / rangeSpan

    return mapResolutionFromStep( step)
  }


  var d3Scale = {

    time: d3.time.scale,
    linear: d3.scale.linear,
//    ordinal: d3.scale.ordinal,  TODO: How do ordinal scales have multiple resolutions? Could this be used for buckets?
    identity: d3.scale.identity
  }



  d3.time.scale = function() {
    var resolution,
        scale = d3Scale.time(),
        range = scale.range,
        rangeRound = scale.rangeRound,
        domain = scale.domain

    scale.range = function( values) {
      if( !arguments.length ) return range()
      range(values)
      resolution = undefined
      return this
    }
    scale.rangeRound = function( values) {
      if( !arguments.length ) return rangeRound()
      rangeRound(values)
      resolution = undefined
      return this
    }
    scale.domain = function( values) {
      if( !arguments.length ) return domain()
      domain(values)
      resolution = undefined
      return this
    }

    scale.resolution = function( res) {
      if( !arguments.length ) {
        if( resolution === undefined)
          resolution = calculateResolution( scale)
        return resolution
      }

      if( resolutions.indexOf( res) >= 0)
        resolution = res

      return this
    }

    return scale
  }

  d3.scale.linear = function() {
    var resolution,
        scale = d3Scale.linear(),
        range = scale.range,
        rangeRound = scale.rangeRound,
        domain = scale.domain

    scale.range = function( values) {
      if( !arguments.length ) return range()
      range(values)
      resolution = undefined
      return this
    }
    scale.rangeRound = function( values) {
      if( !arguments.length ) return rangeRound()
      rangeRound(values)
      resolution = undefined
      return this
    }
    scale.domain = function( values) {
      if( !arguments.length ) return domain()
      domain(values)
      resolution = undefined
      return this
    }

    scale.resolution = function( res) {
      if( !arguments.length ) {
        if( resolution === undefined)
          resolution = calculateResolution( scale)
        return resolution
      }

      if( resolutions.indexOf( res) >= 0)
        resolution = res

      return this
    }

    return scale
  }

  d3.scale.identity = function() {
    var resolution,
        scale = d3Scale.identity(),
        range = scale.range,
        rangeRound = scale.rangeRound,
        domain = scale.domain

    scale.range = function( values) {
      if( !arguments.length ) return range()
      range(values)
      resolution = undefined
      return this
    }
    scale.domain = function( values) {
      if( !arguments.length ) return domain()
      domain(values)
      resolution = undefined
      return this
    }

    scale.resolution = function( res) {
      if( !arguments.length ) {
        if( resolution === undefined)
          resolution = calculateResolution( scale)
        return resolution
      }

      if( resolutions.indexOf( res) >= 0)
        resolution = res

      return this
    }

    return scale
  }


  /**
   * Sampling is a time-series data store for a single resolution. It may be sampled data
   * or raw source data.
   *
   * @param resolution
   * @param access
   * @param data      Data or undefined
   * @param sampled   True if data is sampled data
   * @constructor
   */
  function Sampling( resolution, access, data, sampled) {
    this.resolution = resolution
    this.stepSize = resolutionMillis[ this.resolution]
    this.access = access
    this.data = data  // Murts.get() will key off undefined to initiate sampling.
    this.sampled = sampled
    this.extents = undefined  // {x: [], y, []}
    this.nextResolution = { higher: null, lower: null}
    this.lastRead = Date.now()
    this.resampling = {
      nextStep: 0,
      source: undefined,
      unsampledCount:0
    }
    this.onHandlers = {
      update: []
    }
  }

  var nullFunction = function() {}

  Sampling.prototype.on = function( event, handler) {
    var handlers, deregister

    if( ! this.onHandlers.hasOwnProperty( event))
      this.onHandlers[event] = []

    handlers = this.onHandlers[event]
    var index = handlers.indexOf( handler)
    if( index < 0) {
      handlers.push( handler)

      deregister = function() {
        var i = handlers.indexOf( handler)
        if( i >= 0)
          handlers.splice( i, 1)
      }
    } else {
      deregister = nullFunction
    }

    return deregister
  }

  Sampling.prototype.extendNextStepPastExtent = function() {
    if( ! this.extents)  // No data, so no extents.
      return

    var maxX = this.extents.x[1]

    // If the last point is beyond nextStep, advance nextStep to one step beyond.
    if( maxX >= this.resampling.nextStep) {
      var jump = maxX - this.resampling.nextStep,
          steps = Math.floor( jump / this.stepSize) + 1
      this.resampling.nextStep += steps * this.stepSize
    }
  }

  Sampling.prototype.initialSample = function( source) {
    var s = sample( source.data, this.stepSize, this.access)
    this.data = s.data
    this.extents = s.extents
    this.sampled = true
    this.resampling.nextStep = s.nextStep
    this.resampling.source = source
    this.resampling.unsampledCount = 0

    if( this.data.length > 0)
      this.extendNextStepPastExtent()

  }

  /**
   * Update the x and y extents based on the new data.
   * Assume points have been added to the end of the data so x min
   * is not updated (except in the case where there is no previous
   * extents).
   *
   * @param newPoints
   */
  Sampling.prototype.updateExtentsFromPoints = function( newPoints) {

    var newPointsExtentY = d3.extent( newPoints, this.access.y)

    if( ! this.extents) {
      this.extents = {
        x: [this.access.x(this.data[0])],
        y: newPointsExtentY
      }
    } else {
      trait.utils.extendExtent( this.extents.y, newPointsExtentY)
    }

    // Update x max. X min is already set.
    this.extents.x[1] = this.access.x(this.data[this.data.length - 1])
  }

  /**
   * Update the x and y extents based on the new data.
   * Assume points have been added to the end of the data so x min
   * is not updated (except in the case where there is no previous
   * extents).
   *
   * @param newPoints
   */
  Sampling.prototype.updateExtentsFromExtents = function( newExtents) {
    if( ! newExtents)
      return

    if( this.extents) {
      trait.utils.extendExtent( this.extents.x, newExtents.x)
      trait.utils.extendExtent( this.extents.y, newExtents.y)
    } else {
      this.extents = newExtents
    }
  }

  /**
   * We've got new raw or sampled data. We need to notify our nextResolution.lower that we have more data.
   * The next lower resolution sample can keep track of when it wants to resample.
   */
  Sampling.prototype.pushPoints = function( points, sampled) {
    var pushedCount = points.length

    if( this.data === undefined)
      this.data = []

    // If any data pushed to us is sampled, we'll always be sampled.
    if( sampled !== undefined)
      this.sampled = this.sampled || sampled

    if( pushedCount > 0) {

      this.data = this.data.concat( points)
      this.updateExtentsFromPoints( points)

      var self = this
      this.onHandlers.update.forEach( function( handler) {
        handler( 'update', self.data, self)
      })

      if( pushedCount > 0 && this.nextResolution.lower)
        this.nextResolution.lower.sourceUpdated( pushedCount)
    }


    return this;
  }

  Sampling.prototype.findIndexOfStepStartFromEnd = function( data, stepStart, fromEnd) {
    var i

    fromEnd = fromEnd === undefined ? 0 : fromEnd
    i = data.length - 1 - fromEnd
    i = Math.min( i, data.length - 1)

    while( i >= 0 && this.access.x( data[i]) >= stepStart)
      i--
    i++
    return Math.max( i, 0)
  }

  Sampling.prototype.sampleUpdatesFromSource = function() {
    var source = this.resampling.source,
        length = this.data.length

    if( length <= 2) {
      this.initialSample( source)
      return
    }

    var stepStart = this.resampling.nextStep - this.stepSize
    var sourceIndex = this.findIndexOfStepStartFromEnd( source.data, stepStart, this.resampling.unsampledCount)
    var sampledIndex = this.findIndexOfStepStartFromEnd( this.data, stepStart)

    // Remove the last and, possibly, the second to last samples.
    this.data.splice( sampledIndex, length - sampledIndex)

    var a = this.data[this.data.length-1],
        s = sampleUpdates( source.data, sourceIndex, a, this.stepSize, this.resampling.nextStep, this.access)
    this.data = this.data.concat( s.data)
    this.updateExtentsFromExtents(s.extents)

    this.resampling.nextStep = s.nextStep
    this.resampling.unsampledCount = 0

    this.extendNextStepPastExtent()
  }

  /**
   * This source has more data. Consider resampling source now.
   *
   *  | .  .| .. | .. l   |NS n    Sample to nextStep
   *  | .  .| .. |    l   |NS n    Sample to nextStep
   *  | .  .| .. | .. l n |NS      Don't sample
   *  | .  .| .. |    l n |NS      Don't sample
   *
   *  | - step boundary
   *  |NS - nextStep
   *  . - Point
   *  l - Last point
   *  n - New point
   *
   * @param count
   */
  Sampling.prototype.sourceUpdated = function( pushedCount) {
    if( pushedCount <= 0)
      return

    var source = this.resampling.source
    if( this.nextResolution.higher === source) {
      this.resampling.unsampledCount += pushedCount

      // if source's latest point is beyond our nextStep
      if( source && source.extents && source.extents.x[1] >= this.resampling.nextStep) {
        this.sampleUpdatesFromSource()
      }

    } else {
      this.initialSample( this.nextResolution.higher)
    }

    var self = this
    this.onHandlers.update.forEach( function( handler) {
      handler( 'update', self.data, self)
    })

  }


  function _murtsDataStore() {
    var access = {
          x: function( d) { return d[0] },
          y: function( d) { return d[1] }
        },
        samples = {}

    function findHigherResolution( index) {
      var i, r

      for(i = index - 1; i >= 0; i-- ) {
        r = resolutions[i]
        if( samples.hasOwnProperty(r)) {
          return samples[r]
        }
      }
      return null
    }
    function findLowerResolution( index) {
      var i, r

      for(i = index + 1; i < resolutions.length; i++ ) {
        r = resolutions[i]
        if( samples.hasOwnProperty(r)) {
          return samples[r]
        }
      }
      return null
    }

    /**
     * Put sample into linked list of higher and lower resolution samples
     * @param sample
     */
    function linkSample( sample) {
      var lower, higher,
          index = resolutions.indexOf( sample.resolution)

      lower = findLowerResolution( index)
      if( lower) {
        sample.nextResolution.lower = lower
        lower.nextResolution.higher = sample
      }

      higher = findHigherResolution( index)
      if( higher) {
        sample.nextResolution.higher = higher
        higher.nextResolution.lower = sample
      }
    }

    /**
     * Remove sample from linked list of higher and lower resolution samples
     * @param sample
     */
    function unlinkSample( sample) {
      var lower, higher,
          index = resolutions.indexOf( sample.resolution)

      lower = findLowerResolution( index)
      higher = findHigherResolution( index)

      if( higher)
        higher.nextResolution.lower = lower
      if( lower)
        lower.nextResolution.higher = higher

      sample.nextResolution.lower = null
      sample.nextResolution.higher = null
    }

    /**
     * MUltiple Resolution Time Series (murtsDataStore) data store.
     *
     * .x( accessor)
     * .y( accessor)
     * .push( newValue) single or array
     * .on( 'push', callback)
     * .get( scale, callback)
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


    // TODO: remove sample from list of samples

    function getSampling( resolution) {
      var r = resolution || SOURCE
      var c = samples[r]
      if( c === undefined){
        c = new Sampling( r, access)
        samples[r] = c
        linkSample( c)
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
    murtsDataStore.pushPoints = function( data, sampled, resolution) {
      var sampling = getSampling( resolution)
      sampling.pushPoints( data, sampled)
      return this;
    }


    murtsDataStore.get = function( scale) {
      var resolution = scale ? scale.resolution() : undefined,
          sampling = getSampling( resolution)

      if( sampling.data === undefined) {
        // TODO: What if there is no source?
        var index = resolutions.indexOf( sampling.resolution),
            source = findHigherResolution( index)
        if( source && source.data) {
          sampling.initialSample( source)
        } else {
          if( ! source)
            console.error( 'murts.get findHigherResolution( ' + sampling.resolution + ') -- no source data found to sample from')
          else
            console.error( 'murts.get findHigherResolution( ' + sampling.resolution + ') -- no data found in source')
          sampling.data = []
        }
      }

      sampling.lastRead = Date.now()
      return sampling;
    }

    murtsDataStore.removeOnUpdate = function( scale, onUpdate) {
      var resolution = scale.resolution(),
          sampling = getSampling(resolution)

      sampling.removeOnUpdate( onUpdate)
    }

    murtsDataStore.reset = function() {
      samples = {}
      access = {
        x: function( d) { return d[0] },
        y: function( d) { return d[1] }
      }
    }

    return murtsDataStore;

  }



  function collectStep( data, sourceIndex, stepSize, nextStep, sourceIndexLast, access) {
    var d = data[ sourceIndex],  // may not be inside step (before timeStop). Calculate a new nextStep
        x = access.x( d),
        y = access.y( d),
        extents = {
          x: [x, x],
          y: [y, y],
          d: [d, d]
        },
        sum = { x: x, y: y, count: 1}

    // If no data in current step, skip forward.
    if( x >= nextStep) {
      var jump = x - nextStep,
          steps = Math.floor( jump / stepSize) + 1
      nextStep = steps * stepSize + nextStep
    }


    var stillInStep = true
    sourceIndex ++
    while( stillInStep && sourceIndex < sourceIndexLast) {

      d = data[ sourceIndex]
      x = access.x(d)
      stillInStep = x < nextStep

      if( stillInStep) {
        y = access.y(d)

        sum.x += x
        sum.y += y
        sum.count ++

        if( y < extents.y[0]) {
          extents.x[0] = x
          extents.y[0] = y
          extents.d[0] = d
        } else if( y > extents.y[1]) {
          extents.x[1] = x
          extents.y[1] = y
          extents.d[1] = d
        }

        sourceIndex ++
      }

    }

    return {
      extents: extents,
      ave: {
        x: sum.x / sum.count,
        y: sum.y / sum.count,
        count: sum.count  // for debug or performance stats
      },
      sourceIndex: sourceIndex,
      nextStep: nextStep
    }
  }


  function findMaxAreaPointB( a, b, c, access) {
    var areaUsingBMin, areaUsingBMax,
        aX = access.x(a),
        aY = access.y(a)
    areaUsingBMin = Math.abs(
        (aX - c.ave.x) * (b.extents.y[0] - aY) -
        (aX - b.extents.x[0]) * (c.ave.y - aY)
    ) * 0.5
    areaUsingBMax = Math.abs(
        (aX - c.ave.x) * (b.extents.y[1] - aY) -
        (aX - b.extents.x[1]) * (c.ave.y - aY)
    ) * 0.5

    return areaUsingBMin > areaUsingBMax ? b.extents.d[0] : b.extents.d[1]
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
   * @param stepSize Millisecond step used for sampling
   * @param access Access functions for x and y
   */
  function sample( source, stepSize, access) {
    var a, // a is the first "bucket"
        nextStep,
        sourceIndex = 0,
        sampled = []

    var startTimer = Date.now()
    console.log( 'murts.sample source.length: ' + source.length + ' start')

    if( source.length === 0) {
      console.log('murts.sample source.length: ' + source.length + ' end  ' + (Date.now() - startTimer) + ' ms')
      return {
        data:    sampled,
        nextStep: 0
      }
    }

    // TODO: Find first data point within extent
    //

    // Always use the first point
    a = source[sourceIndex++]

    sampled[0] = a
    nextStep = access.x( a) + stepSize
    if( source.length < 3) {
      if( source.length === 2)
        sampled[1] = source[sourceIndex++]
      console.log( 'murts.sample source.length: ' + source.length + ' end  ' + (Date.now()-startTimer) + ' ms')
      return {
        data: sampled,
        nextStep: nextStep,
        extents: {
          x: d3.extent( sampled, access.x),
          y: d3.extent( sampled, access.y)
        }
      }
    }

    var s = sampleFromIndex( sampled, source, sourceIndex, a, stepSize, nextStep, access)

    console.log( 'murts.sample source.length: ' + source.length + ', sample.length: ' + s.data.length + ' end  ' + (Date.now()-startTimer) + ' ms')

    return s
  }


  function sampleFromIndex( sampled, source, sourceIndex, a, stepSize, nextStep, access) {
    var b, c,   // the three "buckets" (including 'a' which is passed in)
        maxAreaPoint,
        sourceIndexLast = source.length - 1,
        aX = access.x( a),
        aY = access.y( a),
        extents = {
          x: [ aX, aX],
          y: [ aY, aY]
        }


    // Find the first b. At the end of the following for loop, c becomes the next b.
    b = collectStep( source, sourceIndex, stepSize, nextStep, sourceIndexLast, access)
    sourceIndex = b.sourceIndex
    trait.utils.extendExtent( extents.y, b.extents.y)


    for( ; sourceIndex < sourceIndexLast; sourceIndex++) {

      nextStep = b.nextStep + stepSize
      c = collectStep( source, sourceIndex, stepSize, nextStep, sourceIndexLast, access)
      sourceIndex = c.sourceIndex
      trait.utils.extendExtent( extents.y, c.extents.y)

      // Now we have a, b, c
      maxAreaPoint = findMaxAreaPointB( a, b, c, access)
      sampled[ sampled.length] = maxAreaPoint

      a = maxAreaPoint
      b = c
    }

    // sourceIndex is set to sourceIndexLast or sourceIndexLast + 1

    // Process the last b using the last point as c.
    var lastPoint = source[sourceIndexLast],
        lastX = access.x( lastPoint),
        lastY = access.y( lastPoint)

    c = {
      ave: {
        x: lastX,
        y: lastY,
        count: 1  // for debug or performance stats
      }
    }
    maxAreaPoint = findMaxAreaPointB( a, b, c, access)
    sampled[ sampled.length] = maxAreaPoint

    // Always use last point
    sampled[sampled.length] = lastPoint
    extents.x[1] = access.x( lastPoint)
    extents.y[0] = Math.min( extents.y[0], lastY)
    extents.y[1] = Math.max( extents.y[1], lastY)

    return {
      data: sampled,
      extents: extents,
      nextStep: nextStep // Start of next step. The last point may be before this.
    }

  }


  /**
   *
   * @param source Source data used for sampling
   * @param stepSize Millisecond step used for sampling
   * @param access Access functions for x and y
   */
  function sampleUpdates( source, sourceIndex, a, stepSize, nextStep, access) {
    var sampled = [],
        updateCount = source.length - sourceIndex

    var startTimer = Date.now()
    //console.log( 'murts.sampleUdates source.length-start: ' + (updateCount) + ' start')

    if( updateCount <= 1) {
      var extents

      if( updateCount === 1) {
        sampled[0] = source[sourceIndex++]
        extents = {
          x: d3.extent( sampled, access.x),
          y: d3.extent( sampled, access.y)
        }
      }

      console.log( 'murts.sampleUdates source.length-start: ' + updateCount + ' end  ' + (Date.now()-startTimer) + ' ms')

      return {
        data: sampled,
        nextStep: nextStep,
        extents: extents
      }
    }

    // The first point, 'a' is already in the caller's sampled array.
    var s = sampleFromIndex( sampled, source, sourceIndex, a, stepSize, nextStep, access)

    //console.log( 'murts.sampleUdates source.length-start: ' + updateCount + ', sample.length: ' + s.data.length + ' end  ' + (Date.now()-startTimer) + ' ms')

    return s
  }

  function isMurtsDataStore( obj) {
    return typeof obj === 'function' && obj.toString().indexOf( 'function murtsDataStore(') === 0

//    var arr = obj.toString().match(/function\s*(\w+)/)
//    return arr && arr.length === 2 && arr[1] === 'murtsDataStore'
  }

  function getOrElse( obj, scale) {
    return isMurtsDataStore( obj) ? obj.get( scale).data : obj
  }

  trait.murts = {
    dataStore: _murtsDataStore,
    utils: {
           Sampling: Sampling,
           sample: sample,
           sampleUpdates: sampleUpdates,
           mapResolution: mapResolutionFromStep,
           isDataStore: isMurtsDataStore,
           getOrElse: getOrElse
    }
  }

}(d3, d3.trait));
