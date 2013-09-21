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
    var group, series, lastDomainMax,
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
            var element = this

            if( !group) {
                var classes = _config.chartClass ? "chart-line " + _config.chartClass : 'chart-line'
                group = this._chartGroup.append('g').classed( classes, true);
            }

            var filtered = _config.seriesFilter ? _data.filter( _config.seriesFilter) : _data

            color.domain( filtered)

            // DATA JOIN
            series = group.selectAll( ".series")
                .data( filtered)

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
    chartLine.update = function() {
        if( _super.update)
            _super.update()

        // TODO: The x1.range() needs to be wider, so we draw the new line off the right
        // then translate it to the left with a transition animation.

        var domainMax = d3.trait.utils.extentMax( x1.domain())
        var translateX = x1(lastDomainMax) - x1( domainMax)

        // redraw the line and no transform
        series.attr( "transform", null)
        series.selectAll("path")
            .attr("d", function(d) { return line( _config.seriesData(d)); })


        // slide the line left
        series.transition()
            .duration( _super.duration())
            .ease("linear")
            .attr("transform", "translate(" + translateX + ")")
        //.each("end", tick);

        lastDomainMax = d3.trait.utils.extentMax( x1.domain())

        // Could pop the data off the front (off the left side of chart)

        return this;
    };

    d3.rebind(chartLine, dispatch, 'on');
    _super.onChartResized( 'chartLine', chartLine)

    return chartLine;

}

trait.chart.line = _chartLine

}(d3, d3.trait));
