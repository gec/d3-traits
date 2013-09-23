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

function _chartArea( _super, _config) {
    // Store the group element here so we can have multiple area charts in one chart.
    // A second "area chart" might have a different y-axis, style or orientation.
    var group, series, lastDomainMax,
        x1 = _super.x1(),
        y1 = _super.y1(),
        color = d3.scale.category10(),
        area = d3.svg.area()
            .interpolate( _config.interpolate || "linear")
            .x(function(d) { return x1( _config.x1(d)); })
            .y0( _super.chartHeight())
            .y1(function(d) { return y1( _config.y1(d)); });

    var dispatch = d3.dispatch('customHover');
    function chartArea( _selection) {
        _selection.each(function(_data) {
            var element = this

            if( !group) {
                var classes = _config.chartClass ? "chart-area " + _config.chartClass : 'chart-area'
                group = this._chartGroup.append('g').classed( classes, true);
            }

            var filtered = _config.seriesFilter ? _data.filter( _config.seriesFilter) : _data

            color.domain( filtered)
            area.y0( _super.chartHeight())

            // DATA JOIN
            series = group.selectAll( ".series")
                .data( filtered)

            // UPDATE
            series.selectAll( "path")
                .transition()
                .duration( 500)
                .attr("d", function(d) { return area( _config.seriesData(d)); })

            // ENTER
            series.enter()
                .append("g")
                    .attr("class", "series")
                .append("path")
                    .attr("class", "area")
                    .attr("d", function(d) { return area( _config.seriesData(d)); })
                    .style("fill", function(d, i) { return color(i); });

            lastDomainMax = d3.trait.utils.extentMax( x1.domain())
        })
    }
    chartArea.update = function( type, duration) {
        if( _super.update)
            _super.update( type, duration)

        // TODO: The x1.range() needs to be wider, so we draw the new area off the right
        // then translate it to the left with a transition animation.

        var domainMax = d3.trait.utils.extentMax( x1.domain())
        var translateX = x1(lastDomainMax) - x1( domainMax)

        // redraw the area and no transform
        series.attr( "transform", null)
        series.selectAll("path")
            .attr("d", function(d) { return area( _config.seriesData(d)); })


        // slide the area left
        if( duration === 0) {
            series.attr("transform", "translate(" + translateX + ")")
        } else {

            series.transition()
                .duration( duration || _super.duration())
                .ease("linear")
                .attr("transform", "translate(" + translateX + ")")
            //.each("end", tick);
        }

        lastDomainMax = d3.trait.utils.extentMax( x1.domain())

        // Could pop the data off the front (off the left side of chart)

        return this;
    };

    d3.rebind(chartArea, dispatch, 'on');
    _super.onChartResized( 'chartArea', chartArea)

    return chartArea;

}

trait.chart.area = _chartArea

}(d3, d3.trait));
