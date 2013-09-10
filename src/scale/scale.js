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
(function (d3, traits) {

function _scaleOrdinalBarsX( _super, _config) {
    var x1 = d3.scale.ordinal()

    function scaleOrdinalBarsX( _selection) {
        _selection.each(function(_data) {
            var element = this

            // Use the first series for the ordinals. TODO: should we merge the series ordinals?
            var ordinals = _data[0].map( _config.x1)
            x1.rangeRoundBands([0, _super.chartWidth()], 0.1)
                .domain( ordinals);
        })
    }
    scaleOrdinalBarsX.x1 = function() {
        return x1;
    };
    return scaleOrdinalBarsX;
}

function _scaleTimeX( _super,  _config) {
    var x1 = d3.time.scale()
    if( _config.x1Margin) {
        if( _config.x1Margin.left)
            _super.x1MarginLeft( _config.x1Margin.left)
        if( _config.x1Margin.right)
            _super.x1MarginRight( _config.x1Margin.right)
    }

    function scaleTimeX( _selection) {
        _selection.each(function(_data, i , j) {
            var element = this

            // Get array of extents for each series.
            var extents = _data.map( function(s) { return d3.extent( _config.seriesData(s), _config.x1)})
            var minX = d3.min( extents, function(e) { return e[0] }) // this minimums of each extent
            var maxX = d3.max( extents, function(e) { return e[1] }) // the maximums of each extent
            //var minX = d3.min( _data, function(s) { return d3.min( _config.seriesData(s), _config.x1); })
            //var maxX = d3.max( _data, function(s) { return d3.max( _config.seriesData(s), _config.x1); })

            x1.domain([minX, maxX])
                .nice(d3.time.month)// start and end on month. Ex Jan 1 00:00 to Feb 1 00:00
                .range([ _super.x1MarginLeft(), _super.chartWidth() - _super.x1MarginRight()])
        })
    }
    scaleTimeX.x1 = function() {
        return x1;
    };

    _super.onChartResized( 'scaleTimeX', scaleTimeX)
    _super.onX1Resized( 'scaleTimeX', scaleTimeX)

    return scaleTimeX;
}

var TRACKING_NONE = "none"
var TRACKING_CURRENT_TIME = "current-time"
var TRACKING_DOMAIN_MAX = "domain-max"

function _scaleTimeTrendX( _super,  _config) {
    var ONE_DAY = 1000 * 60 * 60 * 24
    var tracking = _config.tracking || TRACKING_CURRENT_TIME

    function getDomain( config) {
        var result, now, then

        if( _config.domain) {
            if( Array.isArray( _config.domain)) {
                result = _config.domain.clone()
            } else {
                now = new Date()
                then = new Date( now.getTime() - _config.domain)
                result = [ then, now]
            }
        } else {
            now = new Date()
            then = new Date( now.getTime() - ONE_DAY)
            result = [ then, now]
        }
        return result
    }

    var x1 = d3.time.scale()
        .domain( getDomain( _config))
        //.nice()
    function getTimeSpanFromDomain( domain) { return domain[ domain.length-1].getTime() - domain[0].getTime() }
    var domainTimeSpan = getTimeSpanFromDomain( x1.domain())

    function makeDomainTimeNow() {
        var now, then
        now = new Date()
        then = new Date( now.getTime() - domainTimeSpan)
        return [ then, now]
    }
    var theData
    function makeDomainSpanFromMax() {
        var last, then, domain
        var maxX = theData.map( function(s) { return d3.max( _config.seriesData(s), _config.x1)})
        maxX = d3.max( maxX)
//        domain = x1.domain()
//        last = domain[ domain.length - 1]
        then = new Date( maxX - domainTimeSpan)
        return [ then, maxX]
    }

    if( _config.x1Margin) {
        if( _config.x1Margin.left)
            _super.x1MarginLeft( _config.x1Margin.left)
        if( _config.x1Margin.right)
            _super.x1MarginRight( _config.x1Margin.right)
    }

    function scaleTimeTrendX( _selection) {
        _selection.each(function(_data, i , j) {
            var element = this
            theData = _data

            if( tracking === TRACKING_CURRENT_TIME)
                x1.domain( makeDomainTimeNow())
            else if( tracking === TRACKING_DOMAIN_MAX) {
                // Get array of extents for each series.
                var extents = _data.map( function(s) { return d3.extent( _config.seriesData(s), _config.x1)})
                var minX = d3.min( extents, function(e) { return e[0] }) // this minimums of each extent
                var maxX = d3.max( extents, function(e) { return e[1] }) // the maximums of each extent

                minX = new Date( maxX - domainTimeSpan)
                x1.domain([minX, maxX])

            }

            x1.range([ _super.x1MarginLeft(), _super.chartWidth() - _super.x1MarginRight()])
        })
    }
    scaleTimeTrendX.x1 = function() {
        return x1;
    };
    scaleTimeTrendX.x1Tracking = function( track) {
        if (!arguments.length) return tracking;
        tracking = track;
        return this;
    };

    scaleTimeTrendX.x1TimeSpan= function( span) {
        if (!arguments.length) return domainTimeSpan;
        domainTimeSpan = span;
        return this;
    };

    scaleTimeTrendX.update = function() {
        if( _super.update)
            _super.update()
        if( tracking === TRACKING_CURRENT_TIME)
            x1.domain( makeDomainTimeNow())
        else if( tracking === TRACKING_DOMAIN_MAX)
            x1.domain( makeDomainSpanFromMax())

        return this;
    };


    _super.onChartResized( 'scaleTimeTrendX', scaleTimeTrendX)
    _super.onX1Resized( 'scaleTimeTrendX', scaleTimeTrendX)

    return scaleTimeTrendX;
}

/**
 * Each time this trait is stacked it produces an addition yScale (ex: y1, y2, ... y10)
 * @param _super
 * @returns {Function}
 */
function _scaleLinearY( _super,  _config) {

    function makeUniqueIndex( prefix) {
        for( var index = 0; index < 10; index++ ) {
            var name = prefix + index
            if( !(name in _super))
                return index
        }
        return undefined
    }

    function makeUniqueName( prefix) {
        for( var index = 1; index <= 10; index++ ) {
            var name = prefix + index
            if( !(name in _super))
                return name
        }
        return undefined
    }

    //var scaleIndex = makeUniqueIndex( 'y')
    //var scaleY = 'y' + scaleIndex
    var scaleName = makeUniqueName( 'y')
    var scale = d3.scale.linear()

    function scaleLinearY( _selection) {
        _selection.each(function(_data) {
            var element = this

            var maxY = d3.max( _data, function(s) { return d3.max( _config.seriesData(s), _config.y1); })
            scale.domain([0, maxY])
                .range([_super.chartHeight(), 0]);
        })
    }
    scaleLinearY[scaleName] = function() {
        return scale;
    };
    scaleLinearY.update = function() {
        if( _super.update)
            _super.update()
//        var maxY = d3.max( _data, function(s) { return d3.max( _config.seriesData(s), _config.y1); })
//        scale.domain([0, maxY])
//            .range([_super.chartHeight(), 0]);
        return this;
    };


    _super.onChartResized( scaleName, scaleLinearY)

    return scaleLinearY;
}

if( ! traits.scale.linear)
    traits.scale.linear = {}
if( ! traits.scale.ordinal)
    traits.scale.ordinal = {}
if( ! traits.scale.ordinal.bars)
    traits.scale.ordinal.bars = {}
if( ! traits.scale.time)
    traits.scale.time = {}
if( ! traits.scale.time.trend)
    traits.scale.time.trend = {}

traits.scale.linear.y = _scaleLinearY
traits.scale.ordinal.bars.x = _scaleOrdinalBarsX
traits.scale.time.x = _scaleTimeX
traits.scale.time.trend.x = _scaleTimeTrendX

}(d3, d3.traits));
