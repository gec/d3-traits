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

function _chartLine( _super,  _access,  args) {
    var chartGroup, series, lines
    var count = 0;

    var dispatch = d3.dispatch('customHover');
    function chartLine( _selection) {
        _selection.each(function(_data) {
            var element = this
            //var _access = element._access
            count ++

            var x1 = _super.x1()
            var y1 = _super.y1()

            var line = d3.svg.line()
                .interpolate("basis")
                .x(function(d) { return x1( _access.x1(d)); })
                .y(function(d) { return y1( _access.y1(d)); });

            var color = d3.scale.category10()
            color.domain( _data)

            var svg = _super.svg()
            if( !chartGroup) {
                var container = svg.select('.container-group')
                chartGroup = container.append('g').classed('chart-group', true);

                series = chartGroup.selectAll( ".series")
                    .data( _data)
                    .enter()
                    .append("g")
                    .attr("class", "series")

                series.append("path")
                    .attr("class", "line")
                    .attr("d", function(d) { return line( _access.seriesData(d)); })
                    .style("stroke", function(d, i) { return color(i); });

                lines = series.selectAll( "path")

//            lines = chartGroup.selectAll( "path")
//                    //.data(function(d) { return d; })
//                    .data( _data)
//                    .enter()
//                    .append("g")
//                    .attr("class", "series")
//                    .append("path")
//                    .attr("class", "line")
//                    .attr("d", function(d) { return line( d2( d)); })
//                    .style("stroke", function(d, i) { return color(i); });
            }

            lines.transition()
                .duration( 500)
                .attr("d", function(d) { return line( _access.seriesData(d)); })
        })
    }

    d3.rebind(chartLine, dispatch, 'on');
    _super.onChartResized( 'chartLine', chartLine)

    return chartLine;

}

function _chartLine2( _super, _access,  args) {

    var x1 = _super.x1()
    var y1 = _super.y1()
    var line = d3.svg.line()
        .interpolate("basis")
        .x(function(d) { return x1( _access.x1(d)); })
        .y(function(d) { return y1( _access.y1(d)); });

    var color = d3.scale.category10()


    var dispatch = d3.dispatch('customHover');
    function chartLine( _selection) {
        _selection.each(function(_data) {
            var element = this

            if( !this._chartGroup)
                this._chartGroup = this._container.append('g').classed('chart-group', true);

            color.domain( _data)

            // DATA JOIN
            var series = this._chartGroup.selectAll( ".series")
                .data( _data)

            // UPDATE
            series.selectAll( "path")
                .transition()
                .duration( 500)
                .attr("d", function(d) { return line( _access.seriesData(d)); })

            // ENTER
            series.enter()
                .append("g")
                .attr("class", "series")
                .append("path")
                .attr("class", "line")
                .attr("d", function(d) { return line( _access.seriesData(d)); })
                .style("stroke", function(d, i) { return color(i); });
        })
    }

    d3.rebind(chartLine, dispatch, 'on');
    _super.onChartResized( 'chartLine', chartLine)

    return chartLine;

}

traits.chart.line = _chartLine
traits.chart.line2 = _chartLine2

}(d3, d3.traits));
