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
            //return date === 1 || date % 5 === 0;
            return date % 5 === 0;
        });
    }

    function _axisMonth( _super, _config) {
        var group, lastDomainMax,
            axis = d3.svg.axis(),
            scaleForUpdate = d3.time.scale(),
            c = axisConfig( _config)

        adjustChartMarginForAxis( _super, c)

        function axisMonth( _selection) {
            _selection.each(function(_data) {
                var element = this

                if( !group) {
                    group = this._container.append('g').classed('axis axis-' + c.name, true)
                }

                var scale = _super[c.name]()
                var domain = scale.domain()

                scaleForUpdate.range( scale.range())
                scaleForUpdate.domain( scale.domain())
                    .nice( d3.time.day)

                scale = scaleForUpdate


                axis.scale(scale)
                    .orient( c.orient )
                    .tickFormat(d3.time.format('%e')) // %d is 01, 02. %e is \b1, \b2
                    //.tickValues( tickValuesForMonthDays( scale))
                    .ticks( 15)
                    //.tickSubdivide(4)


                group.transition()
                    .duration( 500)
                    .ease( _super.ease())
                    .attr({transform: axisTransform( _super, c)})
                    .call(axis);

                var extension = group.selectAll( "path.axis-extension")
                    .data( [domain[0]])

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
                lastDomainMax = d3.trait.utils.extentMax( domain)

            })
        }
//        function pd( d) {
//            var m, day
//            m = d.getMonth() + 1
//            day = d.getDate()
//            return "" + m + "-" + day
//        }

        axisMonth.update = function() {
            if( _super.update)
                _super.update()

            var scale2 = _super[c.name]()
            scaleForUpdate.range( d3.trait.utils.getChartRange( _super, c.name))

            var domain = scale2.domain()
            var domainMax = d3.trait.utils.extentMax( domain)
            var delta = domainMax.getTime() - lastDomainMax.getTime()
            var min = new Date( domain[0].getTime() + delta)
            scaleForUpdate.domain( [min, domainMax])
            lastDomainMax = domainMax

//            console.log( "axis.update domain [min, domMax]: " + pd( min) + " " + pd( domainMax))

            // slide the x-axis left for trends
            group.transition()
                .duration( _super.duration())
                .ease( "linear")
                .call( axis);
            return this;
        }

        _super.onChartResized( 'axisMonth-' + c.name, axisMonth)
        _super.onRangeMarginChanged( 'axisMonth-' + c.name, axisMonth)


        return axisMonth;
    }


    trait.axis.linear = _axisLinear


    if( ! trait.axis.time)
        trait.axis.time = {}
    trait.axis.time.month = _axisMonth

}(d3, d3.trait));
