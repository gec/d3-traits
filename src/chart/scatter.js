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

    function barAttr( _config, barOffsetX, barW, chartHeight, x1, y1) {
        // NOTE: for transition from enter, use  y1(0) for y: and height:
        return {
            x: function(d, i) { return x1(_config.x1(d)) + barOffsetX; },
            y: function(d, i) { return y1(_config.y1(d)); },
            width: barW,
            height: function(d, i) { return chartHeight - y1(_config.y1(d)); }
        }
    }
    function circleAttr( _config, x1, y1) {
        return {
            cx: function(d, i) { return x1(_config.x1(d)) },
            cy: function(d, i) { return y1(_config.y1(d)) },
            r: 8
        }
    }

    function _chartScatter( _super,  _config) {
        // Store the group element here so we can have multiple bar charts in one chart.
        // A second "bar chart" might have a different y-axis, style or orientation.
        var group, series, points, barW, barOffsetX, lastDomainMax,
            x1 = _super.x1(),
            y1 = _super.y1(),
            color = d3.scale.category10(),
            shape = "circle" // rect

        var dispatch = d3.dispatch('customHover');
        function chartScatter( _selection) {
            _selection.each(function(_data) {
                var element = this

                var filtered = _config.seriesFilter ? _data.filter( _config.seriesFilter) : _data

                if( !group) {
                    var classes = _config.chartClass ? "chart-scatter " + _config.chartClass : 'chart-scatter'
                    group = this._chartGroup.append('g').classed( classes, true);
                }

                color.domain( filtered)

                // DATA JOIN
                series = group.selectAll(".series")
                    .data( filtered)
                {
                    // UPDATE

                    // ENTER
                    series.enter()
                        .append("g")
                        .attr("class", "series")
                        .style("fill", function(d, i) { return color(i); });
                }

                // DATA JOIN
                points = series.selectAll( shape)
                    .data( _config.seriesData)
                {
                    // UPDATE
                    points.transition()
                        .duration(500).delay(500).ease(_super.ease())
                        .attr( circleAttr( _config, x1, y1));

                    // ENTER
                    points.enter().append( shape)
                        .classed('scatter-point', true)
                        .attr( circleAttr( _config, x1, y1))
                        //.on('mouseover', dispatch.customHover);
                        .on("mouseover", function(d, i) {
                            return _super.svg().append("text").text( "data: " + _config.y1(d ).toFixed(1))
                                .attr("id", "tooltip")
                                .attr("x", x1( _config.x1(d)) + 10)
                                .attr("y", y1( _config.y1(d)))
                                .attr("fill", "black")
                                .attr("opacity", 0)
                                .style("font-family", "sans-serif")
                                .transition().attr("opacity", 1);
                        })
                        .on("mouseout", function() {
                            d3.select(this)
                                .transition()
                                .duration(500)
                                .attr("fill", "slateblue");
                        d3.selectAll("#tooltip")
                            .transition().duration ( 500 )
                                .attr("opacity", 0)
                                .remove();
                    })

                    // EXIT
                    points.exit()
                        .transition()
                        .style({opacity: 0})
                        .remove();

                    lastDomainMax = d3.trait.utils.extentMax( x1.domain())
                }

            })
        }
        chartScatter.update = function( type, duration) {
            if( _super.update)
                _super.update( type, duration)

            // TODO: The x1.range() needs to be wider, so we draw the new line off the right
            // then translate it to the left with a transition animation.

            var domainMax = d3.trait.utils.extentMax( x1.domain())
            var translateX = x1(lastDomainMax) - x1( domainMax)

            // redraw the line and no transform
            series.attr( "transform", null)
            points.attr( barAttr( _config, barOffsetX, barW, _super.chartHeight(), x1, y1));

            points = series.selectAll("rect" )
                .data( _config.seriesData)

            // ENTER
            points.enter().append('rect')
                .classed('bar', true)
                .attr( barAttr( _config, barOffsetX, barW, _super.chartHeight(), x1, y1))

            points.exit()
                .transition()
                .style({opacity: 0})
                .remove();


            // slide the bars left
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

        d3.rebind(chartScatter, dispatch, 'on');
        _super.onChartResized( 'chartScatter', chartScatter)
        _super.onRangeMarginChanged( 'chartScatter', chartScatter)

        return chartScatter;

    }

    trait.chart.scatter = _chartScatter

}(d3, d3.trait));
