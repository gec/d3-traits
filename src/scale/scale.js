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

var TRACKING_NONE = "none"

// Force domain to follow current wall-time (i.e. domain max = current time).
var TRACKING_CURRENT_TIME = "current-time"

// Force domain to follow latest date in data (i.e. domain max = _data.max().
var TRACKING_DOMAIN_MAX = "domain-max"


var timeIntervals = [
    d3.time.second,
    d3.time.minute,
    d3.time.hour,
    d3.time.day,
    d3.time.week,
    d3.time.month,
    d3.time.year
]
function isTimeInterval( d) { return timeIntervals.indexOf( d) >= 0 }

function getMillisFromDomain( domain) { return domain[ domain.length-1].getTime() - domain[0].getTime() }

function makeAccessorsFromConfig( config, axisName) {
    return {
        series: config.seriesData,
        data: config[axisName]
    }
}

/**
 * domainMin or domainMax overrides domain.
 *
 * @param config
 * @returns domain config { trend, domain, domainMin, domainMax }
 */
function makeDomainConfig( config) {
    var dMin = d3.trait.utils.configFloat( config.domainMin, null),
        dMax = d3.trait.utils.configFloat( config.domainMax, null),
        dc = {
            trend: config.trend
        }

    if( dMin !== null && dMax !== null) {
        dc.domain = [dMin, dMax]
    } else if( dMin !== null || dMax != null) {
        dc.domainMin = dMin
        dc.domainMax = dMax
    } else {
        dc.domain = config.domain
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
function makeIntervalFromConfig( config) {

    return ! config.interval ? null
        : {
            interval: config.interval,
            count: config.intervalCount || 1
        }
}

// trendDomain: { interval: d3.time.month, count: 1 }
// trendDomain: { interval: milliseconds, count: 1 }
function getTrendMin( max, trendDomain) {
    var min,
        count = trendDomain.count || 1

    if( isTimeInterval( trendDomain.interval))
        min = trendDomain.interval.offset( max, 0 - count)
    else if( max instanceof Date)
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
function getDomainTrend( trend, data, access) {
    var min, max, domain

    if( trend.track === TRACKING_CURRENT_TIME) {

        max = new Date()
        min = getTrendMin( max, trend.domain)
        domain = [min, max]

    } else {

        // assume TRACKING_DOMAIN_MAX

        if( trend.domain && trend.domain.interval) {

            // tracking is domain-max or none. In either case, since a time interval
            // is specified, we'll do domain-max
            //
            max = trait.utils.maxFromData( data, access)
            min = getTrendMin( max, trend.domain)
            domain = [min, max]

        } else {

            domain = trait.utils.extentFromData( data, access)
        }
    }
    return domain
}

/**
 *
 *
 *
 * @param domainConfig Config object with domain, interval, tracking
 * @param data The chart data
 * @param access object containing series, data
 * @returns {*}
 */
function getDomain( domainConfig, data, access) {
    var min, max, dataDomain

    // if domainConfig.domain is specified, it trumps other configs
    if( domainConfig.domain)
        return domainConfig.domain

    var domain

    if( domainConfig.trend)
        domain = getDomainTrend( domainConfig, data, access)
    else if( domainConfig.domainMin != null)
        domain = [domainConfig.domainMin, trait.utils.maxFromData( data, access)]
    else if( domainConfig.domainMax != null)
        domain = [trait.utils.minFromData( data, access), domainConfig.domainMax]
    else
        domain = trait.utils.extentFromData( data, access)

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
function updateScale( scale, range, domainConfig, data, access) {
    var min, max, dataDomain, oldDomain, oldMax, newRangeMax

    scale.range( range)

    // if domainConfig.domain is specified, it trumps other configs
    if( domainConfig.domain) {
        scale.domain( domainConfig.domain)
        return
    }

    oldDomain = scale.domain()
    oldMax = oldDomain[ oldDomain.length - 1]

    if( domainConfig.trend) {
        var trend = domainConfig.trend

        if( trend.track === TRACKING_CURRENT_TIME) {

            max = new Date()
            min = getTrendMin( max, trend.domain)
            scale.domain( [min, max])

        } else {
            if( trend.domain && trend.domain.interval) {

                // track is domain-max or none. In either case, since a time interval
                // is specified, we'll do domain-max
                //

                max = trait.utils.maxFromData( data, access)

                // The scale is translated off to the left.
                // Reset domain with oldMax to get rid of the part not visible.
                min = getTrendMin( oldMax, trend.domain)
                scale.domain( [min, oldMax])
                //console.log( "updateScale domain [min, oldMax]: " + pd( min) + " " + pd( oldMax))

                newRangeMax = scale( max)

                // Expand the domain to the right with the new max.
                min = getTrendMin( max, trend.domain)
                scale.domain( [min, max])
                //console.log( "updateScale domain [min,    max]: " + pd(min) + " " + pd( max) + " end")
                // Expand the range to the right, so we can scroll it slowly to the left.
                scale.range( [range[0], newRangeMax])

            } else {
                dataDomain = trait.utils.extentFromData( data, access)
                scale.domain( dataDomain)
            }
        }

    } else {
        dataDomain = trait.utils.extentFromData( data, access)
        scale.domain( dataDomain)
    }

}


function _scaleOrdinalBars( _super, _config) {
    var filteredData,
        scaleName = _config.axis,
        axisChar = scaleName.charAt(0), // x | y
        accessData = _config[scaleName],
        scale = d3.scale.ordinal()

    function scaleOrdinalBars( _selection) {
        var self = scaleOrdinalBars

        _selection.each(function(_data) {
            var ordinals,
                element = this

            filteredData = _config.seriesFilter ? _data.filter( _config.seriesFilter) : _data

            var rangeMax = axisChar === 'x' ? self.chartWidth() : self.chartHeight()
            scale.rangeRoundBands([0, rangeMax], 0.1)

            // Use the first series for the ordinals. TODO: should we merge the series ordinals?
            ordinals = filteredData[0].map( accessData)
            scale.domain( ordinals);
        })
    }
    scaleOrdinalBars[scaleName] = function() {
        return scale;
    };
    return scaleOrdinalBars;
}

function _scaleTime( _super,  _config) {

    var filteredData,
        scaleName = _config.axis,
        axisChar = scaleName.charAt(0 ),
        access = makeAccessorsFromConfig( _config, scaleName ),
        domainConfig = makeDomainConfig( _config),
        scale = d3.time.scale()
    ;

    _super.minRangeMargin( scaleName, _config.minRangeMargin)


    function scaleTime( _selection) {
        var self = scaleTime

        _selection.each(function(_data, i , j) {
            var currentDomain,
                element = this

            // TODO: store this in each selection?
            filteredData = _config.seriesFilter ? _data.filter( _config.seriesFilter) : _data

            scale.domain( getDomain( domainConfig, filteredData, access))

            // TODO: nice overlaps wth interval. Maybe it's one or the other?
            if( _config.nice)
                scale.nice( _config.nice) // start and end on month. Ex Jan 1 00:00 to Feb 1 00:00
            scale.range( d3.trait.utils.getScaleRange( self, scaleName))
        })
    }
    scaleTime[scaleName] = function() {
        return scale;
    }
    scaleTime[scaleName + 'Domain'] = function( newDomain) {
        domainConfig.domain = newDomain
        scale.domain( newDomain)
        // TODO: domain updated event?
    }
    scaleTime.update = function( type, duration) {

        this._super( type, duration)

        // Reset the range to the physical chart coordinates. We'll use this range to
        // calculate newRangeMax below, then we'll extend the range to that.
        var range = d3.trait.utils.getScaleRange( _super, scaleName)

        updateScale( scale, range, domainConfig, filteredData, access)

        return this;
    };


    _super.onRangeMarginChanged( 'scaleTime-' + scaleName, scaleTime)

    return scaleTime;
}


/**
 * Each time this trait is stacked it produces an addition yScale (ex: y1, y2, ... y10)
 * @param _super
 * @returns {Function}
 */
function _scaleLinear( _super,  _config) {

    var filteredData,
        scaleName = _config.axis,
        axisChar = scaleName.charAt(0 ),
        access = makeAccessorsFromConfig( _config, scaleName ),
        domainConfig = makeDomainConfig( _config),
        scale = d3.scale.linear()

    _super.minRangeMargin( _config.axis, _config.minRangeMargin)


    function scaleLinear( _selection) {
        var self = scaleLinear

        _selection.each(function(_data) {
            var extents, min, max,
                element = this

            filteredData = _config.seriesFilter ? _data.filter( _config.seriesFilter) : _data

            scale.domain( getDomain( domainConfig, filteredData, access))
            scale.range( d3.trait.utils.getScaleRange( self, scaleName))

        })
    }
    scaleLinear[scaleName] = function() {
        return scale;
    };
    scaleLinear[scaleName + 'Domain'] = function( newDomain) {
        domainConfig.domain = newDomain
        scale.domain( newDomain)
        // TODO: domain updated event?
    }
    scaleLinear.update = function( type, duration) {
        this._super( type, duration)
        var range = d3.trait.utils.getScaleRange( _super, scaleName)
        updateScale( scale, range, domainConfig, filteredData, access)

        return this;
    };


    _super.onRangeMarginChanged( 'scaleLinear-' + scaleName, scaleLinear)

    return scaleLinear;
}

if( ! trait.scale.ordinal)
    trait.scale.ordinal = {}

trait.scale.linear = _scaleLinear
trait.scale.ordinal.bars = _scaleOrdinalBars
trait.scale.time = _scaleTime

}(d3, d3.trait));
