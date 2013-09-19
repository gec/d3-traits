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

    function orientFromConfig( axisChar, orient) {
        if( orient)
            return orient
        else
            return axisChar === 'x' ? 'bottom' : 'left'
    }
    function axisConfig( config) {
        var name = config.axis,        // x1, y1, x2, etc.
            axisChar = name.charAt(0) // x | y
        return {
            name: name,
            axisChar: axisChar,
            accessData: config[name],
            axisMargin: config.axisMargin || 30,
            orient: orientFromConfig( axisChar, config.orient)
        }
    }

    function adjustChartMarginForAxis( _super, c) {
        switch( c.orient) {
            case 'left': _super.plusMarginLeft( c.axisMargin); break;
            case 'bottom': _super.plusMarginBottom( c.axisMargin); break;
            case 'top': _super.plusMarginTop( c.axisMargin); break;
            case 'right': _super.plusMarginRight( c.axisMargin); break;
            default:
        }
    }

    function axisTransform( _super, c) {

        switch( c.orient) {
            case 'left': return null;
            case 'bottom': return 'translate(0,' + _super.chartHeight() + ')';
            case 'top': return null;
            case 'right': return 'translate(' + _super.chartWidth() + ')';
            default:
                return null;
        }
    }

    function _axisLinear( _super, _config) {
        var group, axis,
            c = axisConfig( _config)

        adjustChartMarginForAxis( _super, c)

        function axisLinear( _selection) {
            _selection.each(function(_data) {
                var element = this

                if( !group) {
                    group = this._container.append('g').classed('axis axis-' + c.name, true)
                    axis = d3.svg.axis()
                }

                axis.scale( _super[c.name]())
                    .orient( c.orient);

                group
                    .transition()
                    .duration( 500)
                    .ease( _super.ease())
                    .attr({transform: axisTransform( _super, c)})
                    .call(axis);
            })
        }

        _super.onChartResized( 'axisLinear-' + c.name, axisLinear)
        _super.onRangeMarginChanged( 'axisLinear-' + c.name, axisLinear)

        return axisLinear;
    }

    function tickValuesForMonthDays( x) {
        var domain = x.domain()
        var minDate = domain[0]
        var maxDate = domain[ domain.length-1]
        var everyDate = d3.time.day.range(minDate, maxDate);
        return everyDate.filter(function (d, i) {
            var date = d.getDate()
            return date === 1 || date % 5 === 0;
        });
    }

    function _axisMonth( _super, _config) {
        var group, axis,
            c = axisConfig( _config)

        adjustChartMarginForAxis( _super, c)

        function axisMonth( _selection) {
            _selection.each(function(_data) {
                var element = this

                if( !group) {
                    group = this._container.append('g').classed('axis axis-' + c.name, true)
                    axis = d3.svg.axis()
                }

                var scale = _super[c.name]()

                axis.scale(scale)
                    .orient( c.orient )
                    .tickFormat(d3.time.format('%e')) // %d is 01, 02. %e is \b1, \b2
                    .tickValues( tickValuesForMonthDays( scale))


                group.transition()
                    .duration( 500)
                    .ease( _super.ease())
                    .attr({transform: axisTransform( _super, c)})
                    .call(axis);

                var extension = group.selectAll( "path.axis-extension")
                    .data( [scale.domain()[0]])

                extension.transition()
                    .attr("class", "axis-extension")
                    .attr( "d", function( d) {
                        return "M0,0L" + scale(d) + ",0";
                    })

                extension.enter()
                    .append( "path")
                    .attr("class", "axis-extension")
                    .attr( "d", function( d) {
                        return "M0,0L" + scale(d) + ",0";
                    })
            })
        }
        _super.onChartResized( 'axisMonth-' + c.name, axisMonth)
        _super.onRangeMarginChanged( 'axisMonth-' + c.name, axisMonth)


        return axisMonth;
    }

    function _axisTimeTrendX( _super, _config) {
        var group

        var x1 = _super.x1ForAxis()
        var xAxis = d3.svg.axis()
            .scale(x1)

        _super.plusMarginBottom( 30)


        function axisTimeTrendX( _selection) {
            _selection.each(function(_data) {
                var element = this

                if( !group) {
                    group = this._container.append('g').classed('x-axis-group axis', true)
                }

                var extent = x1.domain()
                var minDate = extent[0]
                var maxDate = extent[extent.length-1]

                xAxis.orient('bottom')
                    .ticks( d3.time.days, 5)
//                    .tickFormat(d3.time.format('%e')) // %d is 01, 02. %e is \b1, \b2

                group
                    .transition()
                    .duration( _super.duration())
                    .ease( _super.ease())
                    .attr({transform: 'translate(0,' + _super.chartHeight() + ')'})
                    .call(xAxis);

                var extension = group.selectAll( "path.axis-extension")
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

                // slide the x-axis left for tends
//                xAxisGroup.transition()
//                    .duration( _super.duration())
//                    .ease( "linear")
//                    .call( xAxis);
            })
        }
        axisTimeTrendX.update = function() {
            if( _super.update)
                _super.update()

            // slide the x-axis left for trends
            group.transition()
                .duration( _super.duration())
                .ease( "linear")
                .call( xAxis);
            return this;
        };


        _super.onChartResized( 'axisTimeTrendX', axisTimeTrendX)
        _super.onRangeMarginChanged( 'axisTimeTrendX', axisTimeTrendX)


        return axisTimeTrendX;
    }

    traits.axis.linear = _axisLinear


    if( ! traits.axis.time)
        traits.axis.time = {}
    traits.axis.time.month = _axisMonth

    if( ! traits.axis.time.trend)
        traits.axis.time.trend = {}
    traits.axis.time.trend.x = _axisTimeTrendX

}(d3, d3.traits));
