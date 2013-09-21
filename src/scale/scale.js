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

function calculateDomainFromData( data, access) {
    var extents, min, max

    // Get array of extents for each series.
    extents = data.map( function(s) { return d3.extent( access.series(s), access.data)})
    min = d3.min( extents, function(e) { return e[0] }) // the minimums of each extent
    max = d3.max( extents, function(e) { return e[1] }) // the maximums of each extent
    //var min = d3.min( data, function(s) { return d3.min( _config.seriesData(s), accessData); })
    //var max = d3.max( data, function(s) { return d3.max( _config.seriesData(s), accessData); })

    return [min, max]
}

function maxFromData( data, access) {
    return d3.max( data.map( function(s) { return d3.max( access.series(s), access.data)}))
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

    if( domainConfig.tracking === TRACKING_CURRENT_TIME) {
        max = new Date()
        min = domainConfig.interval.interval.offset( max, 0 - domainConfig.interval.count)
        return [min, max]
    }

    // TODO: on some updates, we don't need to calculate min. use maxFromData
    dataDomain = calculateDomainFromData( data, access)

    if( domainConfig.interval) {

        // tracking is domain-max or none. In either case, since a time interval
        // is specified, we'll do domain-max
        //
        max = dataDomain[ dataDomain.length - 1]
        min = domainConfig.interval.interval.offset( max, 0 - domainConfig.interval.count)
        return [min, max]

    } else {

        return dataDomain
    }

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


    if( domainConfig.tracking === TRACKING_CURRENT_TIME) {
        max = new Date()
        min = domainConfig.interval.interval.offset( max, 0 - domainConfig.interval.count)
    } else {

        if( domainConfig.interval) {

            // tracking is domain-max or none. In either case, since a time interval
            // is specified, we'll do domain-max
            //

            max = maxFromData( data, access)

            // The scale is translated off to the left.
            // Reset domain with oldMax to get rid of the part not visible.
            min = domainConfig.interval.interval.offset( oldMax, 0 - domainConfig.interval.count)
            scale.domain( [min, oldMax])
            //console.log( "updateScale domain [min, oldMax]: " + pd( min) + " " + pd( oldMax))

            newRangeMax = scale( max)

            // Expand the domain to the right with the new max.
            min = domainConfig.interval.interval.offset( max, 0 - domainConfig.interval.count)
            scale.domain( [min, max])
            //console.log( "updateScale domain [min,    max]: " + pd(min) + " " + pd( max) + " end")
            // Expand the range to the right, so we can scroll it slowly to the left.
            scale.range( [range[0], newRangeMax])

        } else {
            dataDomain = calculateDomainFromData( data, access)
            scale.domain( dataDomain)
        }
    }


}


function _scaleOrdinalBars( _super, _config) {
    var scaleName = _config.axis,
        axisChar = scaleName.charAt(0), // x | y
        accessData = _config[scaleName],
        scale = d3.scale.ordinal()

    function scaleOrdinalBars( _selection) {
        _selection.each(function(_data) {
            var element = this

            var rangeMax = axisChar === 'x' ? _super.chartWidth() : _super.chartHeight()
            scale.rangeRoundBands([0, rangeMax], 0.1)

            // Use the first series for the ordinals. TODO: should we merge the series ordinals?
            var ordinals = _data[0].map( accessData)
            scale.domain( ordinals);
        })
    }
    scaleOrdinalBars[scaleName] = function() {
        return scale;
    };
    return scaleOrdinalBars;
}

function _scaleTime( _super,  _config) {

    var scaleName = _config.axis,
        axisChar = scaleName.charAt(0 ),
        access = makeAccessorsFromConfig( _config, scaleName ),
        domainConfig = {
            domain: _config.domain,
            interval: makeIntervalFromConfig( _config),
            tracking: _config.tracking
        },
        scale = d3.time.scale(),
        theData
    ;

    _super.minRangeMargin( scaleName, _config.minRangeMargin)

    function getChartRange( name) {
        if( d3.trait.utils.isX( name))
            return [ _super.minRangeMarginLeft( name), _super.chartWidth() - _super.minRangeMarginRight( name)]
        else
            return [ _super.minRangeMarginTop( name), _super.chartHeight() - _super.minRangeMarginBottom( name)]
    }

    function scaleTime( _selection) {
        _selection.each(function(_data, i , j) {
            var currentDomain,
                element = this
            theData = _data // TODO: store this in each selection.

            scale.domain( getDomain( domainConfig, _data, access))

            // TODO: nice overlaps wth interval. Maybe it's one or the other?
            if( _config.nice)
                scale.nice( _config.nice) // start and end on month. Ex Jan 1 00:00 to Feb 1 00:00
            scale.range( d3.trait.utils.getChartRange( _super, scaleName))
        })
    }
    scaleTime[scaleName] = function() {
        return scale;
    }

    function shiftExtentMin( extent, translate) {
        var r0 = new Date( extent[0].getTime() + translate)
        var r1 = extent[ extent.length - 1]  // don't translate
        return [r0, r1]
    }

    scaleTime.update = function() {

        if( _super.update)
            _super.update()

        // Reset the range to the physical chart coordinates. We'll use this range to
        // calculate newRangeMax below, then we'll extend the range to that.
        var range = d3.trait.utils.getChartRange( _super, scaleName)

        updateScale( scale, range, domainConfig, theData, access)

        return this;
    };


    _super.onChartResized( 'scaleTime' + scaleName, scaleTime)
    _super.onRangeMarginChanged( 'scaleTime-' + scaleName, scaleTime)

    return scaleTime;
}


/**
 * Each time this trait is stacked it produces an addition yScale (ex: y1, y2, ... y10)
 * @param _super
 * @returns {Function}
 */
function _scaleLinear( _super,  _config) {

//    function makeUniqueIndex( prefix) {
//        for( var index = 0; index < 10; index++ ) {
//            var name = prefix + index
//            if( !(name in _super))
//                return index
//        }
//        return undefined
//    }
//
//    function makeUniqueName( prefix) {
//        for( var index = 1; index <= 10; index++ ) {
//            var name = prefix + index
//            if( !(name in _super))
//                return name
//        }
//        return undefined
//    }

    var scaleName = _config.axis
    var accessData = _config[scaleName]
    var scale = d3.scale.linear()

    _super.minRangeMargin( _config.axis, _config.minRangeMargin)


    function scaleLinear( _selection) {
        _selection.each(function(_data) {
            var element = this

            // Get array of extents for each series.
            var extents = _data.map( function(s) { return d3.extent( _config.seriesData(s), accessData)})
            var min = d3.min( extents, function(e) { return e[0] }) // the minimums of each extent
            var max = d3.max( extents, function(e) { return e[1] }) // the maximums of each extent
            //var max = d3.max( _data, function(s) { return d3.max( _config.seriesData(s), accessData); })

            scale.domain([min, max])
                .range([_super.chartHeight(), 0]);
        })
    }
    scaleLinear[scaleName] = function() {
        return scale;
    };
    scaleLinear.update = function() {
        if( _super.update)
            _super.update()
//        var max = d3.max( _data, function(s) { return d3.max( _config.seriesData(s), accessData); })
//        scale.domain([0, max])
//            .range([_super.chartHeight(), 0]);
        return this;
    };


    _super.onChartResized( scaleName, scaleLinear)

    return scaleLinear;
}

if( ! trait.scale.ordinal)
    trait.scale.ordinal = {}

trait.scale.linear = _scaleLinear
trait.scale.ordinal.bars = _scaleOrdinalBars
trait.scale.time = _scaleTime

}(d3, d3.trait));
