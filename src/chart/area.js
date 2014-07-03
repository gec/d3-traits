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
        area = d3.svg.area()
            .interpolate( _config.interpolate || "linear")
            .x(function(d) { return x1( _config.x1(d)); })
            .y0( _super.chartHeight())
            .y1(function(d) { return y1( _config.y1(d)); });

    var dispatch = d3.dispatch('customHover');
    function chartArea( _selection) {
        var self = chartArea

        _selection.each(function(_data) {
            var element = this

            if( !group) {
                var classes = _config.chartClass ? "chart-area " + _config.chartClass : 'chart-area'
                group = this._chartGroup.append('g').classed( classes, true);
            }

            var filtered = _config.seriesFilter ? _data.filter( _config.seriesFilter) : _data

            area.y0( self.chartHeight())

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
                    .style("fill", self.color);

            lastDomainMax = d3.trait.utils.extentMax( x1.domain())
        })
    }
    chartArea.update = function( type, duration) {
        this._super( type, duration)

        var dur = duration || _super.duration()
        var attrD = function(d) { return area( _config.seriesData(d)); }
        lastDomainMax = trait.chart.utils.updatePathWithTrend( type, dur, x1, series, attrD, lastDomainMax)

        return this;
    };

    d3.rebind(chartArea, dispatch, 'on');

    return chartArea;

}

trait.chart.area = _chartArea

}(d3, d3.trait));
