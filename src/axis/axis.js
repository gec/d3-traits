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

    function _axisY( _super, _access, args) {
        var yAxisGroup;

        function axisY( _selection) {
            var _a = this.access
            _selection.each(function(_data) {
                var element = this
                //var _access = element._access

                var svg = _super.svg()
                if( !yAxisGroup) {
                    var container = svg.select('.container-group')
                    yAxisGroup = container.append('g').classed('y-axis-group axis', true)

                    //_super.duration( 5000)
                    _super.plusMarginLeft( 30)
                }

                var maxY = d3.max( _data, function(s) { return d3.max( _access.seriesData(s), _access.y1); })
                var y1 = d3.scale.linear()
                    .domain([0, maxY])
                    .range([_super.chartHeight(), 0]);
                var yAxis = d3.svg.axis()
                    .scale(y1)
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

    function _axisMonthX( _super, _access, args) {
        var xAxisGroup
        var xAxisTranslateX = 0

        function axisMonthX( _selection) {
            _selection.each(function(_data) {
                var element = this

                var svg = _super.svg()
                if( !xAxisGroup) {
                    var container = svg.select('.container-group')
                    xAxisGroup = container.append('g').classed('x-axis-group axis', true)
                    _super.plusMarginBottom( 30)
                }

                var x1 = _super.x1()

                var minDate = d3.min( _data, function(s) { return d3.min( _access.seriesData(s), _access.x1); })
                var maxDate = d3.max( _data, function(s) { return d3.max( _access.seriesData(s), _access.x1); })
                //var minDate = d3.min(_data, _access.x1)
                //var maxDate = d3.max(_data, _access.x1)
                var everyDate = d3.time.day.range(minDate, maxDate);
                var ticksAtOneAndEveryFifth = everyDate.filter(function (d, i) {
                    return i === 0 || (i+1) % 5 === 0;
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
    traits.axis.month = { x: _axisMonthX }

}(d3, d3.traits));
