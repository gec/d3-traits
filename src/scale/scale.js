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

function _scaleOrdinalX( _super, _access, args) {
    var x1

    function scaleOrdinalX( _selection) {
        _selection.each(function(_data) {
            var element = this
            //var _access = element._access

            if( !x1)
                x1 = d3.scale.ordinal()
            x1.rangeRoundBands([0, _super.chartWidth()], 0.1)
                .domain( _data.map( _access.x1));
        })
    }
    scaleOrdinalX.x1 = function() {
        return x1;
    };
    return scaleOrdinalX;
}

function _scaleTimeX( _super,  _access,  args) {
    var x1

    function scaleTimeX( _selection) {
        _selection.each(function(_data, i , j) {
            var element = this
            //var _access = element._access

            // Get array of extents for each series.
            var extents = _data.map( function(s) { return d3.extent( _access.seriesData(s), _access.x1)})
            var minX = d3.min( extents, function(e) { return e[0] }) // this minimums of each extent
            var maxX = d3.max( extents, function(e) { return e[1] }) // the maximums of each extent
            //var minX = d3.min( _data, function(s) { return d3.min( _access.seriesData(s), _access.x1); })
            //var maxX = d3.max( _data, function(s) { return d3.max( _access.seriesData(s), _access.x1); })

            x1 = d3.time.scale()
                .domain([minX, maxX])
                .nice(d3.time.month)   // start and end on month
                .range([0, _super.chartWidth()])
        })
    }
    scaleTimeX.x1 = function() {
        return x1;
    };
    return scaleTimeX;
}

/**
 * Each time this trait is stacked it produces an addition yScale (ex: y1, y2, ... y10)
 * @param _super
 * @returns {Function}
 */
function _scaleLinearY( _super,  _access,  args) {

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
    var scale

    function scaleLinearY( _selection) {
        _selection.each(function(_data) {
            var element = this
            //var _access = element._access


            if( ! scale)
                scale = d3.scale.linear()
            var maxY = d3.max( _data, function(s) { return d3.max( _access.seriesData(s), _access.y1); })
            scale.domain([0, maxY])
                .range([_super.chartHeight(), 0]);
        })
    }
    scaleLinearY[scaleName] = function() {
        return scale;
    };

    _super.onChartResized( scaleName, scaleLinearY)

    return scaleLinearY;
}


traits.scale.linear = { y: _scaleLinearY }
traits.scale.ordinal = { x: _scaleOrdinalX }
traits.scale.time = { x: _scaleTimeX }

}(d3, d3.traits));
