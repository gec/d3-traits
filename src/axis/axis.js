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

    function _axisY( _super, config) {
        var yAxisGroup
        var yAxis

        _super.plusMarginLeft( 30)

        function axisY( _selection) {
            _selection.each(function(_data) {
                var element = this

                if( !yAxisGroup) {
                    yAxisGroup = this._container.append('g').classed('y-axis-group axis', true)
                    yAxis = d3.svg.axis()
                }

                yAxis = d3.svg.axis()
                    .scale( _super.y1())
                    .orient('left');


                yAxisGroup
                    .transition()
                    .duration( 500)
                    .ease( _super.ease())
                    .call(yAxis);
            })
        }
        return axisY;
    }

    function _axisMonthX( _super, _config) {
        var xAxisGroup
        var xAxisTranslateX = 0

        _super.plusMarginBottom( 30)

        function axisMonthX( _selection) {
            _selection.each(function(_data) {
                var element = this

                if( !xAxisGroup) {
                    xAxisGroup = this._container.append('g').classed('x-axis-group axis', true)
                }

                var x1 = _super.x1()

                var extent = x1.domain()
                var minDate = extent[0]
                var maxDate = extent[extent.length-1]
//                var minDate = d3.min( _data, function(s) { return d3.min( _config.seriesData(s), _config.x1); })
//                var maxDate = d3.max( _data, function(s) { return d3.max( _config.seriesData(s), _config.x1); })

                var everyDate = d3.time.day.range(minDate, maxDate);
                var ticksAtOneAndEveryFifth = everyDate.filter(function (d, i) {
                    var date = d.getDate()
                    return date === 1 || date % 5 === 0;
                });

                var xAxis = d3.svg.axis()
                    .scale(x1)
                    .orient('bottom')
                    .tickFormat(d3.time.format('%e')) // %d is 01, 02. %e is \b1, \b2
                    .tickValues( ticksAtOneAndEveryFifth)


                xAxisGroup
                    .transition()
                    .duration( 500)
                    .ease( _super.ease())
                    .attr({transform: 'translate(' + xAxisTranslateX + ',' + _super.chartHeight() + ')'})
                    .call(xAxis);

                var extension = xAxisGroup.selectAll( "path.axis-extension")
                    .data( [minDate])

                extension.transition()
                    .attr("class", "axis-extension")
                    .attr( "d", function( d) {
                        return "M0,0L" + x1(d) + ",0";
                    })

                extension.enter()
                    .append( "path")
                    .attr("class", "axis-extension")
                    .attr( "d", function( d) {
                        return "M0,0L" + x1(d) + ",0";
                    })
            })
        }
        axisMonthX.xAxisTranslateX = function(_x) {
            if (!arguments.length) return xAxisTranslateX;
            xAxisTranslateX = _x;
            return this;
        };

        return axisMonthX;
    }

    traits.axis.y = _axisY

    if( ! traits.axis.month)
        traits.axis.month = {}
    traits.axis.month.x = _axisMonthX

}(d3, d3.traits));
