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

function _chartLine( _super, _config) {
    // Store the group element here so we can have multiple line charts in one chart.
    // A second "line chart" might have a different y-axis, style or orientation.
    var group, series, filteredData, lastDomainMax,
        x1 = _super.x1(),
        y1 = _super.y1(),
        color = d3.scale.category10(),
        line = d3.svg.line()
            .interpolate( _config.interpolate || "linear")
            .x(function(d) { return x1( _config.x1(d)); })
            .y(function(d) { return y1( _config.y1(d)); });

    var dispatch = d3.dispatch('customHover');
    function chartLine( _selection) {
        _selection.each(function(_data) {

            if( !group) {
                var classes = _config.chartClass ? "chart-line " + _config.chartClass : 'chart-line'
                group = this._chartGroup.append('g').classed( classes, true);
            }

            filteredData = _config.seriesFilter ? _data.filter( _config.seriesFilter) : _data

            color.domain( filteredData)

            // DATA JOIN
            series = group.selectAll( ".series")
                .data( filteredData)

            // UPDATE
            series.selectAll( "path")
                .transition()
                .duration( 500)
                .attr("d", function(d) { return line( _config.seriesData(d)); })

            // ENTER
            series.enter()
                .append("g")
                    .attr("class", "series")
                .append("path")
                    .attr("class", "line")
                    .attr("d", function(d) { return line( _config.seriesData(d)); })
                    .style("stroke", function(d, i) { return color(i); });

            lastDomainMax = d3.trait.utils.extentMax( x1.domain())
        })
    }

    function findProximateIndex(data, access, point, minIndex, maxIndex, direction) {

        var index, d, dx, dy

        if( minIndex === undefined)
            minIndex = 0
        if( maxIndex === undefined)
            maxIndex = data.length - 1

        while (minIndex <= maxIndex) {
            index = Math.floor( (minIndex + maxIndex) / 2 );
            d = data[index];
            dx = access.x( d);
            dy = access.y( d);

            //   t   t
            // 2   4   6   8
            // ^   d    ^
            if (dx < point.x) {
                minIndex = index + 1;
            } else if ( d.x > point.x) {
                maxIndex = index - 1;
            } else {
                return index;
            }
        }

        if( direction < 0)
            return minIndex + direction < 0 ? 0 : minIndex + direction
        else
            return maxIndex + direction >= data.length ?  data.length - 1 : maxIndex + direction
    }

    function findClosestIndex(data, access, target, direction, minIndex, maxIndex) {

        var index, d

        if( minIndex === undefined)
            minIndex = 0
        if( maxIndex === undefined)
            maxIndex = data.length - 1

        while (minIndex <= maxIndex) {
            index = Math.floor( (minIndex + maxIndex) / 2 );
            d = access( data[index]);

            //   t   t
            // 2   4   6   8
            // ^   d    ^
            if (d < target) {
                minIndex = index + 1;
            } else if ( d > target) {
                maxIndex = index - 1;
            } else {
                return index;
            }
        }

        if( direction < 0)
            return minIndex + direction < 0 ? 0 : minIndex + direction
        else
            return maxIndex + direction >= data.length ?  data.length - 1 : maxIndex + direction
    }

    function getDataInRange( data, scale, access) {
        var domainMin, domainMax,
            indexMin, indexMax,
            endIndex = data.length - 1,
            range = scale.range(),
            rangeMax = d3.trait.utils.extentMax( range)

        domainMin = scale.invert( range[0])
        domainMax = scale.invert( rangeMax)

        indexMin = findClosestIndex( data, access, domainMin, -1)
        indexMax = findClosestIndex( data, access, domainMax, 1, indexMin, endIndex)
        indexMax ++ // because slice doesn't include max

        return data.slice( indexMin, indexMax)
    }
    chartLine.update = function( type, duration) {
        if( _super.update)
            _super.update( type, duration)

        var dur = duration || _super.duration()
        var attrD = function(d) { return line( getDataInRange( _config.seriesData(d), x1, _config.x1 )); }
        lastDomainMax = trait.chart.utils.updatePathWithTrend( type, dur, x1, series, attrD, lastDomainMax)

        // Could pop the data off the front (off the left side of chart)

        return this;
    }
    function distance( p1, p2) {
        var dx = p2.x > p1.x ?  p2.x - p1.x : p1.x - p2.x,
            dy = p2.y > p1.y ?  p2.y - p1.y : p1.y - p2.y
        return Math.sqrt( dx * dx + dy * dy)
    }
    function getFocusItem( data, index, point) {
        var item, p, dist
        item = data[index]
        p = { x: x1( _config.x1(item)), y: y1( _config.y1(item))}
        dist = distance( p, point)
        return {
            index: index,
            item: item,
            point: p,
            distance: dist
        }
    }
    chartLine.focus = function( rangePoint) {
        var foci = _super.focus( rangePoint)

        var point = {
            x: x1.invert( rangePoint.x ),
            y: y1.invert( rangePoint.y)
        }
        var bisectLeft = d3.bisector( _config.x1 ).left

        filteredData.forEach( function( series, seriesIndex, array) {
            var indexRight,
                data = _config.seriesData( series ),
                index = bisectLeft( data, point.x ),
                found = getFocusItem( data, index, point)

            indexRight = found.index + 1
            if( indexRight < data.length) {
                var alter = getFocusItem( data, indexRight, point)
                if( alter.distance < found.distance)
                    found = alter
            }

            found.color = color( seriesIndex)
            foci.push( found)
        })

        return foci
    }

    d3.rebind(chartLine, dispatch, 'on');
    _super.onChartResized( 'chartLine', chartLine)

    return chartLine;

}

trait.chart.line = _chartLine

}(d3, d3.trait));
