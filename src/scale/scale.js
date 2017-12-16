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
(function(d3, trait) {

  trait.scale.EXTEND_DOMAIN = 'ExtendDomain'
  trait.scale.NICE = 'nice'

  var debug = false

  var extentMax = trait.utils.extentMax,
      isExtentExtended = trait.utils.isExtentExtended,
      extendExtent = trait.utils.extendExtent

  var TRACKING_NONE = "none"

// Force domain to follow current wall-time (i.e. domain max = current time).
  var TRACKING_CURRENT_TIME = "current-time"

// Force domain to follow latest date in data (i.e. domain max = _data.max().
  var TRACKING_DOMAIN_MAX = "domain-max"

  var DOMAIN_CONFIG = {
    DATA: 0,    // Domain min and max are based on data.
    MIN: 1,     // Only domain min is specified in config.
    MAX: 2,     // Only domain max is specified in config.
    DOMAIN: 3,  // Domain min and max are specified in config.
    TREND: 4,   // This is a trend chart that scrolls horizontally based on tracking configuration.
    MANUAL: 5,  // Domain is only updated via call to <axis>Domain().  Example: chart.y1Domain( [-1,2])
    NICE: 6     // DATA with nice minimum
  }
  var DOMAIN_CONFIG_NAMES = []
  DOMAIN_CONFIG_NAMES[DOMAIN_CONFIG.DATA] = 'DATA'
  DOMAIN_CONFIG_NAMES[DOMAIN_CONFIG.MIN] = 'MIN'
  DOMAIN_CONFIG_NAMES[DOMAIN_CONFIG.MAX] = 'MAX'
  DOMAIN_CONFIG_NAMES[DOMAIN_CONFIG.DOMAIN] = 'DOMAIN'
  DOMAIN_CONFIG_NAMES[DOMAIN_CONFIG.TREND] = 'TREND'
  DOMAIN_CONFIG_NAMES[DOMAIN_CONFIG.MANUAL] = 'MANUAL'
  DOMAIN_CONFIG_NAMES[DOMAIN_CONFIG.NICE] = 'NICE'

  var timeIntervals = [
    d3.time.second,
    d3.time.minute,
    d3.time.hour,
    d3.time.day,
    d3.time.week,
    d3.time.month,
    d3.time.year
  ]

  function isTimeInterval(d) { return timeIntervals.indexOf(d) >= 0 }

  function getMillisFromDomain(domain) { return domain[ domain.length - 1].getTime() - domain[0].getTime() }

  function makeAccessorsFromConfig(config, scaleName, scale) {
    return {
      series: config.seriesData,
      data: function( s) {return trait.murts.utils.getOrElse( s, scale)},
      value:   config[scaleName],
      scaleName: scaleName,
      axisChar: scaleName.charAt(0),
      scale: scale
    }
  }

  /**
   *
   * padding 0.1 is 10%
   *
   * @param config
   * @returns {object} domain config { trend, domain, min, max, padding }
   */
  function makeDomainConfig(config) {
    var dc = {
          padding: d3.trait.utils.configFloat(config.domainPadding, 0)
        }

    if( config.hasOwnProperty( 'trend')) {

      dc.type = DOMAIN_CONFIG.TREND
      dc.trend = config.trend

    } else if (config.hasOwnProperty( 'domain')) {

      if( Array.isArray( config.domain)) {
        dc.type = DOMAIN_CONFIG.DOMAIN
        dc.domain = config.domain
      } else if( typeof config.domain === 'object') {
        var dMin = d3.trait.utils.configFloat(config.domain.min, null),
            dMax = d3.trait.utils.configFloat(config.domain.max, null)
        if( dMin !== null && dMax !== null ) {
          dc.type = DOMAIN_CONFIG.DOMAIN
          dc.domain = [dMin, dMax]
        } else if( dMin !== null) {
          dc.type = DOMAIN_CONFIG.MIN
          dc.min = dMin
        } else if( dMax !== null) {
          dc.type = DOMAIN_CONFIG.MAX
          dc.max = dMax
        } else {
          dc.type = DOMAIN_CONFIG.DATA
          console.error( 'makeDomainConfig: Unrecognized domain specification object: ' + JSON.stringify( config.domain))
        }

        // nice recalculates min, so DOMAIN_CONFIG.MIN is incompatible with nice
        dc.nice = dc.type !== DOMAIN_CONFIG.MIN && config.domain.hasOwnProperty('nice') && (config.domain.nice === true || config.domain.nice.toLowerCase() === 'true')

      } else if( typeof config.domain === 'string') {
        var upperCase = config.domain.toUpperCase()
        if( upperCase === DOMAIN_CONFIG_NAMES[DOMAIN_CONFIG.MANUAL]) {
          dc.type = DOMAIN_CONFIG.MANUAL
        } else if( upperCase === DOMAIN_CONFIG_NAMES[DOMAIN_CONFIG.NICE]) {
          dc.type = DOMAIN_CONFIG.DATA
          dc.nice = true
        } else {
          console.error( 'makeDomainConfig: Unrecognized domain specification string: ' + JSON.stringify( config.domain))
          dc.type = DOMAIN_CONFIG.DATA
        }
      } else
        dc.type = DOMAIN_CONFIG.DATA
      // TODO: Could also specify domain config as a function

    } else {
      dc.type = DOMAIN_CONFIG.DATA
    }

    return dc
  }


  /**
   * Return an object with interval and count or null
   *
   * { interval: d3.time.minute,
 *   intervalCount: 15
 * }
   *
   * @param config  {interval: d3.time.interval, intervalCount: 1}
   * @returns null or {interval: d3.time.interval, count: number}
   */
  function makeIntervalFromConfig(config) {

    return !config.interval ? null
      : {
      interval: config.interval,
      count:    config.intervalCount || 1
    }
  }

// trendDomain: { interval: d3.time.month, count: 1 }
// trendDomain: { interval: milliseconds, count: 1 }
  function getTrendMin(max, trendDomain) {
    var min,
        count = trendDomain.count || 1

    if( isTimeInterval(trendDomain.interval) )
      min = trendDomain.interval.offset(max, 0 - count)
    else if( max instanceof Date )
      min = max.getTime() - (trendDomain.interval * count)
    else
      min = max - (trendDomain.interval * count)

    return min
  }

  /**
   * { track: "domain-max", domain: { interval: d3.time.month, count: 1 } }
   * @param trend
   * @param data
   * @param access
   * @returns {*}
   */
  function getDomainTrend(trend, data, access, domainPadding) {
    var min, max, domain

    if( trend.track === TRACKING_CURRENT_TIME ) {

      max = new Date()
      min = getTrendMin(max, trend.domain)
      domain = [min, max]

    } else {

      // assume TRACKING_DOMAIN_MAX

      if( trend.domain && trend.domain.interval ) {

        // tracking is domain-max or none. In either case, since a time interval
        // is specified, we'll do domain-max
        //
        max = trait.utils.maxFromData(data, access)
        min = getTrendMin(max, trend.domain)
        domain = [min, max]

      } else {

        domain = trait.utils.extentFromData(data, access, domainPadding)
      }
    }
    return domain
  }

  function constrainDomainMinOrMax( domain, domainConfig) {
    switch( domainConfig.type) {
      case DOMAIN_CONFIG.MIN: domain[0] = domainConfig.min; break;
      case DOMAIN_CONFIG.MAX: domain[domain.length-1] = domainConfig.max; break;
      default:
    }
  }

  /**
   * Get a default domain based on configuration information (unless it's a trend).
   * @param domainConfig Config object with domain, interval, tracking
   * @param data The chart data
   * @param access object containing series, data
   * @returns {array} An array which may be [undefined, undefined]
   */
  function getDomainFromConfig( domainConfig, data, access) {
    var domain = []

    domain[0] = undefined
    domain[1] = undefined
    data = trait.murts.utils.getOrElse( data)

    switch( domainConfig.type) {
      case DOMAIN_CONFIG.DOMAIN: domain = domainConfig.domain; break;
      case DOMAIN_CONFIG.TREND: domain = getDomainTrend(domainConfig, data, access, domainConfig.padding); break;
      case DOMAIN_CONFIG.MIN: domain[0] = domainConfig.min; break;
      case DOMAIN_CONFIG.MAX: domain[1] = domainConfig.max; break;
      case DOMAIN_CONFIG.DATA: break;
      default: console.error( "scale getDomainFromConfig - Unknown domainConfig.type: " + domainConfig.type)
    }

    return domain
  }

//function pd( d) {
//    var m, day
//    m = d.getMonth() + 1
//    day = d.getDate()
//    return "" + m + "-" + day
//}


// 1. reset the range to chart dimensions
// 2. get new max from data or date now
// 3. domainTranslateNew = max - oldMax
// 4. newDomain = shift domain by domainTranslateLast
// 5. newRangeMax = scale( max)
// 6. domain = [newDomain[0], max]
// 7. extend range to newRangeMax
// 8. save oldMax and domainTranslateLast
//
  function updateScale(scale, scaleName, range, externalScaleSet, extendDomainFn, listeners, domainConfig, data, access) {
    var min, max, domain, oldDomain, oldMax, newRangeMax

    // if domainConfig.domain is specified, it trumps other configs
    if( domainConfig.type === DOMAIN_CONFIG.MANUAL )
      return
    else if( domainConfig.type === DOMAIN_CONFIG.DOMAIN ) {
      scale.domain(domainConfig.domain)
      return
    }

    oldDomain = scale.domain()
    oldMax = oldDomain[ oldDomain.length - 1]

    if( domainConfig.type === DOMAIN_CONFIG.TREND ) {
      var trend = domainConfig.trend

      if( trend.track === TRACKING_CURRENT_TIME ) {

        max = new Date()
        min = getTrendMin(max, trend.domain)
        scale.domain([min, max])

      } else {
        if( trend.domain && trend.domain.interval ) {

          // track is domain-max or none. In either case, since a time interval
          // is specified, we'll do domain-max
          //

          max = trait.utils.maxFromData(data, access)

          // The scale is translated off to the left.
          // Reset domain with oldMax to get rid of the part not visible.
          min = getTrendMin(oldMax, trend.domain)
          scale.domain([min, oldMax])
          newRangeMax = scale(max)
          //console.log( "updateScale' + scaleName + ' domain [min, oldMax]: " + pd( min) + " " + pd( oldMax))

          // Expand the domain to the right with the new max.
          min = getTrendMin(max, trend.domain)
          scale.domain([min, max])
          //console.log( "updateScale' + scaleName + ' domain [min,    max]: " + pd(min) + " " + pd( max) + " end")
          // Expand the range to the right, so we can scroll it slowly to the left.
          scale.range([range[0], newRangeMax])

        } else {
          domain = trait.utils.extentFromData(data, access, domainConfig.padding)
          scale.domain(domain)
        }
      }

    } else {
      domain = getDomainFromConfig( domainConfig, data, access)
      if( debug)
        console.log( 'updateScale ' + scaleName + ': domainConfig.type: ' + DOMAIN_CONFIG_NAMES[domainConfig.type] + ' domain: ' + JSON.stringify( domain))

      var extendedDomain = extendDomainFn( [domain[0], extentMax(domain)])
      if( isExtentExtended( domain, extendedDomain)) {
        extendExtent( domain, extendedDomain)
        if( debug)
          console.log( 'updateScale' + scaleName + ': child trait extended domain: ' + JSON.stringify( domain))
      }

      if( domainConfig.nice)
        domain = trait.utils.niceExtent( domain);

      if( externalScaleSet.length) {
        var unionDomain = domainFromExternalScaleSet.call( this, externalScaleSet, domain)
        if( isExtentExtended( domain, unionDomain)) {
          extendExtent( domain, unionDomain)
          if( debug)
            console.log( 'updateScale' + scaleName + ' union updated domain:' + domain)
        }
      }

      constrainDomainMinOrMax( domain, domainConfig)

      if( debug)
        console.log( 'updateScale' + scaleName + ': setting domain: ' + JSON.stringify( domain))
      scale.domain(domain)

      if( listeners.length && ( domain[0] !== oldDomain[0] || extentMax( domain) !== extentMax( oldDomain)) )
        notifyListeners.call( this, listeners, scale)
    }

  }


  function notifyListeners( listeners, scale) {
    if( ! listeners)
      return

    var i, listener

    i = listeners.length
    while( --i >= 0) {
      listener = listeners[i]
      listener.call( this, scale)
    }
  }



  function _scaleOrdinalBars(_super, _config) {
    var filteredData,
        scaleName = _config.axis,
        axisChar = scaleName.charAt(0), // x | y
        scale = d3.scale.ordinal(),
        access = makeAccessorsFromConfig(_config, scaleName, scale),
        axes = trait.config.axes( _config),
        //access = trait.config.accessorsXY( _config, axes),
        domainConfig = makeDomainConfig(_config),
        extendDomainKey = scaleName + trait.scale.EXTEND_DOMAIN,
        externalScaleSet = [], // scales we're doing a union with
        listeners = []

    if( typeof scale.invert !== 'function') {
      scale.invert = function( rangeValue) {
        var domain = scale.domain()
        if( domain.length === 0)
          return undefined

        var domainMin = trait.utils.extentMin( domain),
            domainMax = trait.utils.extentMax( domain)

        if( rangeValue < scale(domainMin))
          return domainMin
        else if( rangeValue > scale(domainMax))
          return domainMax
        else {
          var last = domainMin
          for( var i = 1; i < domain.length -2; i++ ) {
            var domainValue = domain[i]
            if( scale(domainValue) > rangeValue)
              return last
            last = domainValue
          }
          return last
        }
      }
    }

    function scaleOrdinalBars(_selection) {
      var self = scaleOrdinalBars

      _selection.each(function(_data) {
        var ordinals,
            element = this

        filteredData = _config.seriesFilter ? _data.filter(_config.seriesFilter) : _data

        var rangeMax = axisChar === 'x' ? self.chartWidth() : self.chartHeight()
        scale.rangeRoundBands([0, rangeMax], 0.1)

        // Use the first series for the ordinals. TODO: should we merge the series ordinals?
        ordinals = access.series(filteredData[0]).map(access.value)
        scale.domain(ordinals);
      })
    }

    scaleOrdinalBars[scaleName] = function() {
      return scale;
    };
    scaleOrdinalBars[extendDomainKey] = function(domain, data) {
      return domain
    }

    scaleOrdinalBars.update = function(type, duration) {
      this._super(type, duration)
      if( ! filteredData)
        return this

      var range = d3.trait.utils.getScaleRange(_super, scaleName)
      if( debug)
        console.log( 'scaleOrdinalBars.update1 ' + scaleName + ' range:' + range + ' domain:' + scale.domain());

      // reset the minimum domain from visible data, so later traits can grow the min domain as needed.
      //delete domainConfig.minDomainFromData;
      var rangeMax = axisChar === 'x' ? this.chartWidth() : this.chartHeight()
      scale.rangeRoundBands([0, rangeMax], 0.1)
      updateScale(scale, scaleName, range, externalScaleSet, scaleOrdinalBars[extendDomainKey], listeners, domainConfig, filteredData, access)
      if( debug)
        console.log( 'scaleOrdinalBars.update2 ' + scaleName + ' range:' + range + ' domain:' + scale.domain())

      return this;
    };

    return scaleOrdinalBars;
  }

  function _scaleTime(_super, _config) {

    var filteredData,
        scaleName = _config.axis,
        axisChar = scaleName.charAt(0),
        scale = d3.time.scale(),
        access = makeAccessorsFromConfig(_config, scaleName, scale),
        domainConfig = makeDomainConfig(_config),
        extendDomainKey = scaleName + trait.scale.EXTEND_DOMAIN,
        addListenerKey = scaleName + 'AddListener',
        removeListenerKey = scaleName + 'RemoveListener',
        updateUnionKey = scaleName + 'UpdateUnion',
        removeUnionKey = scaleName + 'RemoveUnion',
        listeners = [],
        externalScaleSet = [] // scales we're doing a union with

    _super.minRangeMargin(scaleName, _config.minRangeMargin)

    // if domainConfig.domain is specified, it trumps other configs
    // scale.domain never changes.
    if( domainConfig.type === DOMAIN_CONFIG.DOMAIN )
      scale.domain(  domainConfig.domain)  // notify listeners on add
    if( _config.nice )
      scale.nice(_config.nice) // start and end on month. Ex Jan 1 00:00 to Feb 1 00:00


    function scaleTime(_selection) {
      var self = scaleTime

      _selection.each(function(_data, i, j) {
        var range,
            element = this

        // TODO: store this in each selection?
        filteredData = _config.seriesFilter ? _data.filter(_config.seriesFilter) : _data
        range = d3.trait.utils.getScaleRange(self, scaleName)
        scale.range( range)

        if( domainConfig.type !== DOMAIN_CONFIG.DOMAIN && domainConfig.type !== DOMAIN_CONFIG.MANUAL) {
          var domain, extendedDomain,
              oldDomain = scale.domain()

          domain = getDomainFromConfig( domainConfig, filteredData, access)

          // TODO: nice overlaps wth interval. Maybe it's one or the other?

          extendedDomain = scaleTime[extendDomainKey]( domain, _data)
          if( extendedDomain !== domain) {
            domain = extendedDomain
            if( debug)
              console.log( 'scaleTime.each ' + extendDomainKey + ' updated domain:' + domain)
          }
          if( domain[0] === undefined && extentMax(domain) === undefined)
            domain = trait.utils.extentFromData(filteredData, access, domainConfig.padding)
          else if( domain[0] === undefined)
            domain = [trait.utils.minFromData(filteredData, access), extentMax(domain)]
          else if( extentMax(domain) === undefined)
            domain = [domain[0], trait.utils.maxFromData(filteredData, access)]
          scale.domain( domain)
          if( _config.nice )
            scale.nice(_config.nice) // start and end on month. Ex Jan 1 00:00 to Feb 1 00:00

          if( debug)
            console.log( 'scaleTime.each ' + scaleName + ' range:' + range + ' domain:' + domain)

          if( listeners.length && ( domain[0] !== oldDomain[0] || extentMax( domain) !== extentMax( oldDomain)) )
            notifyListeners.call( this, listeners, scale)

        }
      })
    }

    scaleTime[scaleName] = function() {
      return scale;
    }
    scaleTime[scaleName + 'Domain'] = function(newDomain) {
      if( !arguments.length ) return scale.domain()
      if( domainConfig.type !== DOMAIN_CONFIG.MANUAL)
        domainConfig.domain = newDomain
      scale.domain(newDomain)
      // TODO: domain updated event?
    }
    scaleTime[extendDomainKey] = function(domain, data) {
      return domain
    }
    scaleTime[addListenerKey] = function( listener) {
      listeners[listeners.length] = listener
      if( domainConfig.domain )
        listener.call(this, scale)
      return this
    }
    scaleTime[removeListenerKey] = function( listener) {
      var i = listeners.indexOf( listener)
      if( i >= 0)
        listeners.splice(i,1)
      return this
    }
    scaleTime.update = function(type, duration) {

      this._super(type, duration)

      // Reset the range to the physical chart coordinates. We'll use this range to
      // calculate newRangeMax below, then we'll extend the range to that.
      var range = d3.trait.utils.getScaleRange(_super, scaleName)

      scale.range(range)
      updateScale(scale, scaleName, range, externalScaleSet, scaleTime[extendDomainKey], listeners, domainConfig, filteredData, access)

      return this;
    };


    _super.onRangeMarginChanged('scaleTime-' + scaleName, scaleTime)

    return scaleTime;
  }

  //function listenerDomain( listener) {
  //  var d3Scale = listener.traits[listener.scaleName](),
  //      domain = d3Scale.domain()
  //  return domain
  //}
  //
  //function findExtendedDomain(  listeners, minOriginal, maxOriginal) {
  //  var i, listener, minExt, maxExt,
  //      min     = minOriginal,
  //      max     = maxOriginal,
  //      outlier = false
  //
  //  i = listeners.length
  //  while( --i >= 0 ) {
  //    listener = listeners[i]
  //    listener.extent = listenerDomain(listener)
  //    minExt = listener.extent[0]
  //    maxExt = extentMax(listener.extent)
  //    if( min < minExt ) {
  //      min = minExt
  //      outlier = true
  //    }
  //    if( max > maxExt ) {
  //      max = maxExt
  //      outlier = true
  //    }
  //  }
  //
  //  return outlier ? [min, max] : undefined
  //}
  //
  //function scaleUnion( listeners, domain) {
  //  if( ! listeners)
  //    return
  //
  //  var extendedDomain = findExtendedDomain( listeners, domain[0], extentMax( domain))
  //
  //  if( extendedDomain) {
  //    var i, listener, externalDomain
  //
  //    i = listeners.length
  //    while( --i >= 0) {
  //      listener = listeners[i]
  //      if( isExtentExtended( listener.extent, extendedDomain)) {
  //        externalDomain = listener.traits[listener.scaleName + 'ExternalDomain']
  //        externalDomain( extendedDomain)
  //      }
  //    }
  //
  //  }
  //
  //  return extendedDomain
  //}

  function domainFromExternalScaleSet( externalScaleSet, domain) {
    var s,
        i = externalScaleSet.length

    while( --i >= 0) {
      s = externalScaleSet[i]
      extendExtent( domain, s.domain())
    }

    return domain
  }

  /**
   * Each time this trait is stacked it produces an addition yScale (ex: y1, y2, ... y10)
   * @param _super
   * @returns {Function}
   */
  function _scaleLinear(_super, _config) {

    var filteredData,
        scaleName = _config.axis,
        axisChar = scaleName.charAt(0),
        scale = d3.scale.linear(),
        access = makeAccessorsFromConfig(_config, scaleName, scale),
        domainConfig = makeDomainConfig(_config),
        extendDomainKey = scaleName + trait.scale.EXTEND_DOMAIN,
        addListenerKey = scaleName + 'AddListener',
        removeListenerKey = scaleName + 'RemoveListener',
        updateUnionKey = scaleName + 'UpdateUnion',
        removeUnionKey = scaleName + 'RemoveUnion',
        listeners = [],
        externalScaleSet = [] // scales we're doing a union with

    _super.minRangeMargin(_config.axis, _config.minRangeMargin)

    // if domainConfig.domain is specified, it trumps other configs
    // scale.domain never changes.
    if( domainConfig.type === DOMAIN_CONFIG.DOMAIN )
      scale.domain(  domainConfig.domain)  // notify listeners on add

    function scaleLinear(_selection) {
      var self = scaleLinear

      _selection.each(function(_data) {
        var range,
            element = this

        filteredData = _config.seriesFilter ? _data.filter(_config.seriesFilter) : _data
        range = d3.trait.utils.getScaleRange(self, scaleName)
        scale.range(range)

        if( domainConfig.type !== DOMAIN_CONFIG.DOMAIN && domainConfig.type !== DOMAIN_CONFIG.MANUAL ) {
          var domain, extendedDomain, unionDomain,
              oldDomain = scale.domain()

          domain = getDomainFromConfig( domainConfig, filteredData, access)

          if( debug)
            console.log( 'scaleLinear.each ' + scaleName + ' range:' + range + ' domain:' + domain)

          extendedDomain = scaleLinear[extendDomainKey]( [domain[0], extentMax(domain)], filteredData)
          if( isExtentExtended( domain, extendedDomain)) {
            extendExtent( domain, extendedDomain)
            constrainDomainMinOrMax( domain, domainConfig)
            if( debug)
              console.log( 'scaleLinear.each ' + extendDomainKey + ' updated domain:' + domain)
          }
          if( domain[0] === undefined && extentMax(domain) === undefined)
            domain = trait.utils.extentFromData(filteredData, access, domainConfig.padding)
          else if( domain[0] === undefined)
            domain = [trait.utils.minFromData(filteredData, access), extentMax(domain)]
          else if( extentMax(domain) === undefined)
            domain = [domain[0], trait.utils.maxFromData(filteredData, access)]

          if( domainConfig.nice)
            domain = trait.utils.niceExtent( domain);

          // Finally, set the scale!
          scale.domain( domain)

          if( externalScaleSet.length) {
            unionDomain = domainFromExternalScaleSet.call( this, externalScaleSet, domain)
            // This overrides config domain min/max.
            if( unionDomain !== domain) {
              domain = unionDomain
              scale.domain( domain)
              if( debug)
                console.log( 'scaleLinear.each ' + scaleName + ' union updated domain:' + domain)
            }
          }

          if( listeners.length && ( domain[0] !== oldDomain[0] || extentMax( domain) !== extentMax( oldDomain)) )
            notifyListeners.call( this, listeners, scale)
        }

        //scaleUnion( listeners, data, domain, self, scale, self[extendDomainKey])
      })
    }

    scaleLinear[scaleName] = function() {
      return scale;
    };
    scaleLinear[scaleName + 'Domain'] = function(newDomain) {
      if( !arguments.length ) return scale.domain()

      if( domainConfig.type !== DOMAIN_CONFIG.MANUAL)
        domainConfig.domain = newDomain
      scale.domain(newDomain)
      // TODO: domain updated event?
    }

    /**
     * Override to extend the domain with local chart knowledge
     * @param {array} domain Array with two elements. One or both elements could be undefined.
     * @param {array} data
     * @returns {*}
     */
    scaleLinear[extendDomainKey] = function( domain, data) {
      return domain
    }
    scaleLinear[addListenerKey] = function( listener) {
      listeners[listeners.length] = listener
      if( domainConfig.domain )
        listener.call(this, scale)
      return this
    }
    scaleLinear[removeListenerKey] = function( listener) {
      var i = listeners.indexOf( listener)
      if( i >= 0)
        listeners.splice(i,1)
      return this
    }
    scaleLinear[updateUnionKey] = function( scale) {
      var i = externalScaleSet.indexOf( scale)
      if( i < 0)
        externalScaleSet[externalScaleSet.length] = scale
      scaleLinear.update( scaleName, 0)
      return this
    }
    scaleLinear[removeUnionKey] = function( scale) {
      var i = externalScaleSet.indexOf( scale)
      if( i >= 0)
        externalScaleSet.splice(i,1)
      scaleLinear.update( scaleName, 0)
      return this
    }
    scaleLinear[scaleName + 'MinDomainExtent'] = function(minDomain) {
      if( !arguments.length ) return domainConfig.minDomain

      if( trait.utils.isExtentExtended( domainConfig.minDomain, minDomain)) {
        domainConfig.minDomain = trait.utils.extendExtent( domainConfig.minDomain, minDomain)

        var domain = scale.domain()
        if( trait.utils.isExtentExtended( domain, domainConfig.minDomain)) {
          domain = trait.utils.extendExtent( domain, domainConfig.minDomain)
          scale.domain( domain)
          // TODO: domain updated event?
        }
      }
    }

    /**
     * Each chart can specify the minimum required for domain extent (ex: min height or width).
     * If a chart is stacked it needs more height from the scale's domain.
     *
     * @param minDomain
     * @returns {*|minDomainFromData}
     */
    //scaleLinear[scaleName + 'MinDomainExtentFromData'] = function(minDomain) {
    //  if( !arguments.length ) return domainConfig.minDomainFromData
    //
    //  // Is new extend greater than current extent?
    //  if( trait.utils.isExtentExtended( domainConfig.minDomainFromData, minDomain)) {
    //    domainConfig.minDomainFromData = trait.utils.extendExtent( domainConfig.minDomainFromData, minDomain)
    //
    //    var domain = scale.domain()
    //    if( trait.utils.isExtentExtended( domain, domainConfig.minDomainFromData)) {
    //      domain = trait.utils.extendExtent( domain, domainConfig.minDomainFromData)
    //      scale.domain( domain)
    //      // TODO: domain updated event?
    //    }
    //  }
    //}

    scaleLinear.update = function(type, duration) {
      this._super(type, duration)
      if( ! filteredData)
        return this

      var range = d3.trait.utils.getScaleRange(_super, scaleName)
      if( debug)
        console.log( 'scaleLinear.update1 ' + scaleName + ' range:' + range + ' domain:' + scale.domain());

      // reset the minimum domain from visible data, so later traits can grow the min domain as needed.
      //delete domainConfig.minDomainFromData;
      scale.range(range)
      updateScale(scale, scaleName, range, externalScaleSet, scaleLinear[extendDomainKey], listeners, domainConfig, filteredData, access)
      if( debug)
        console.log( 'scaleLinear.update2 ' + scaleName + ' range:' + range + ' domain:' + scale.domain())

      return this;
    };


    _super.onRangeMarginChanged('scaleLinear-' + scaleName, scaleLinear)

    return scaleLinear;
  }

  if( !trait.scale.ordinal )
    trait.scale.ordinal = {}

  trait.scale.linear = _scaleLinear
  trait.scale.ordinal.bars = _scaleOrdinalBars
  trait.scale.time = _scaleTime

}(d3, d3.trait));
