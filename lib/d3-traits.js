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
(function (d3) {

    Array.isArray = Array.isArray || function (vArg) {
        return Object.prototype.toString.call(vArg) === "[object Array]";
    };


    function chartBase( _super, _access, args) {

    var margin = {top: 2, right: 2, bottom: 4, left: 10},
        ease = 'cubic-in-out';
    var width = 200
    var height = 100
    var chartWidth = width - margin.left - margin.right,
        chartHeight = height - margin.top - margin.bottom;

    var svg, select, duration = 0;
    var ChartResized = 'chartResized'
    var dispatch = d3.dispatch( ChartResized)

    function chartBase( _selection) {
        var self = this
        _selection.each(function(_data) {

            // this == the div
            select = d3.select(this)
            width = this.parentElement.offsetWidth || width
            height = this.parentElement.offsetHeight || height

            chartWidth = width - margin.left - margin.right
            chartHeight = height - margin.top - margin.bottom
            //console.log( "call( chartBase ) margin.left: " + margin.left + ", chartWidth: " + chartWidth)

            if(!svg) {
                svg = d3.select(this)
                    .append("svg")
                    .classed('chart', true)
                    .attr("width", width)
                    .attr("height", height)

                var container = svg.append('g').classed('container-group', true)
                this._container = container
            }

            svg.transition()
                .duration(duration)
                .attr({width: width, height: height})
            svg.select('.container-group')
                .attr({transform: 'translate(' + margin.left + ',' + margin.top + ')'});

            duration = 1000;
        })
    }

    function updateChartSize() {
        chartWidth = width - margin.left - margin.right
        chartHeight = height - margin.top - margin.bottom
        console.log( "baseChart.updateChartSize chartWidth=" + chartWidth + ", chartHeight=" + chartHeight)
        dispatch.chartResized()
    }

    function updateSize() {
        width = chartWidth + margin.left + margin.right
        height = chartHeight + margin.top + margin.bottom
        dispatch.chartResized()
    }

    chartBase.svg = function() {
        return svg;
    };

    chartBase.select = function() {
        return select;
    };

    chartBase.width = function(_x) {
        if (!arguments.length) return width;
        width = parseInt(_x);
        updateChartSize()
        return this;
    };
    chartBase.height = function(_x) {
        if (!arguments.length) return height;
        height = parseInt(_x);
        updateChartSize()
        duration = 0;
        return this;
    };

    chartBase.marginTop = function(_marginTop) {
        if (!arguments.length) return margin.top;
        margin.top = _marginTop;
        updateChartSize()
        return this;
    };
    chartBase.marginBottom = function(_marginBottom) {
        if (!arguments.length) return margin.bottom;
        margin.bottom = _marginBottom;
        updateChartSize()
        return this;
    };
    chartBase.marginLeft = function(_marginLeft) {
        if (!arguments.length) return margin.left;
        margin.left = _marginLeft;
        updateChartSize()

        return this;
    };
    chartBase.marginRight = function(_marginRight) {
        if (!arguments.length) return margin.right;
        margin.right = _marginRight;
        updateChartSize()
        return this;
    };

    chartBase.plusMarginTop = function(_marginTop) {
        margin.top += parseInt(_marginTop);
        updateChartSize()
        return this;
    };
    chartBase.plusMarginBottom = function(_marginBottom) {
        margin.bottom += parseInt(_marginBottom);
        console.log( "baseChart.plusMarginBottom( " + _marginBottom + ") = " + margin.bottom)
        updateChartSize()
        return this;
    };
    chartBase.plusMarginLeft = function(_marginLeft) {
        margin.left += parseInt(_marginLeft);
        console.log( "baseChart.plusMarginLeft( " + _marginLeft + ") = " + margin.left)
        updateChartSize()
        return this;
    };
    chartBase.plusMarginRight = function(_marginRight) {
        margin.right += parseInt(_marginRight);
        updateChartSize()
        return this;
    };

    chartBase.chartWidth = function(_x) {
        if (!arguments.length) return chartWidth;
        chartWidth = parseInt(_x);
        updateSize()
        return this;
    };
    chartBase.chartHeight = function(_x) {
        if (!arguments.length) return chartHeight;
        chartHeight = parseInt(_x);
        updateSize()
        return this;
    };

    chartBase.ease = function(_x) {
        if (!arguments.length) return ease;
        ease = _x;
        return this;
    };

    chartBase.duration = function(_x) {
        if (!arguments.length) return duration;
        duration = _x;
        return this;
    };
    //d3.rebind(chartBase, dispatch, 'on');
    chartBase.onChartResized = function( namespace, traitInstance) {
        var event = ChartResized
        if( namespace && namespace.length > 0)
            event = event + "." + namespace
        dispatch.on( event, function() {
            console.log( "dispatch.on( " + event + ")")
            select.call( traitInstance)
        })
    }

    return chartBase;
}


function scaleOrdinalX( _super, _access, args) {
    var x1

    function scaleOrdinalX( _selection) {
        _selection.each(function(_data) {
            var element = this
            //var _access = element._access

            if( !x1)
                x1 = d3.scale.ordinal()
            x1.rangeRoundBands([0, _super.chartWidth()], .1)
                .domain( _data.map( _access.x1));
        })
    }
    scaleOrdinalX.x1 = function() {
        return x1;
    };
    return scaleOrdinalX;
}

function scaleTimeX( _super,  _access,  args) {
    var x1

    function scaleTimeX( _selection) {
        _selection.each(function(_data, i , j) {
            var element = this
            //var _access = element._access

            // Get array of extents for each series.
            var extents = _data.map( function(s) { return d3.extent( _access.seriesData(s), _access.x1)})
            var minX = d3.min( extents, function(e) { return e[0] }) // this minimums of each extent
            var maxX = d3.max( extents, function(e) { return e[1] }) // the maximums of each extent
            //var minX = d3.min( _data, function(s) { return d3.min( _access.seriesData(s), _access.x1); })
            //var maxX = d3.max( _data, function(s) { return d3.max( _access.seriesData(s), _access.x1); })

            x1 = d3.time.scale()
                //.domain(d3.extent(_data[0].values, _access.x1))
                .domain([minX, maxX])
                .nice(d3.time.month)   // start and end on month
                .range([0, _super.chartWidth()])
        })
    }
    scaleTimeX.x1 = function() {
        return x1;
    };
    return scaleTimeX;
}

/**
 * Each time this trait is stacked it produces an addition yScale (ex: y1, y2, ... y10)
 * @param _super
 * @returns {Function}
 */
function scaleLinearY( _super,  _access,  args) {

    //var scaleIndex = makeUniqueIndex( 'y')
    //var scaleY = 'y' + scaleIndex
    var scaleName = makeUniqueName( 'y')
    var scale

    function makeUniqueIndex( prefix) {
        for( var index = 0; index < 10; index++ ) {
            var name = prefix + index
            if( !(name in _super))
                return index
        }
        return undefined
    }

    function makeUniqueName( prefix) {
        for( var index = 1; index <= 10; index++ ) {
            var name = prefix + index
            if( !(name in _super))
                return name
        }
        return undefined
    }

    function scaleLinearY( _selection) {
        _selection.each(function(_data) {
            var element = this
            //var _access = element._access


            if( ! scale)
                scale = d3.scale.linear()
            var maxY = d3.max( _data, function(s) { return d3.max( _access.seriesData(s), _access.y1); })
            scale.domain([0, maxY])
                .range([_super.chartHeight(), 0]);
        })
    }
    scaleLinearY[scaleName] = function() {
        return scale;
    };

    _super.onChartResized( scaleName, scaleLinearY)

    return scaleLinearY;
}

function chartBar( _super,  _access,  args) {
    var gap = 0
    var chartGroup

    var dispatch = d3.dispatch('customHover');
    function chartBar( _selection) {
        _selection.each(function(_data) {
            var element = this
            //var _access = element._access
            console.log( "call( chartBar) margin.left: " + _super.marginLeft() + ", chartWidth: " + _super.chartWidth())

            var data = _access.seriesData( _data.filter( _access.seriesFilter)[0])

            var xBand = d3.scale.ordinal()
                .domain( data.map(function(d, i){ return i; }))
                .rangeRoundBands([0, _super.chartWidth()], .1);
            var gapSize = xBand.rangeBand() / 100 * gap;
            var barW = xBand.rangeBand() - gapSize;
            console.log( "call( chartBar) barW: " + barW)

            // The xAxis doesn't know we're a bar graph and we want to center the ticks on the bars.
            if( 'xAxisTranslateX' in _super)
                _super.xAxisTranslateX( barW / 2)

            var x1 = _super.x1()
            var y1 = _super.y1()


            var svg = _super.svg()
            if( !chartGroup) {
                var container = svg.select('.container-group')
                chartGroup = container.append('g').classed('chart-group', true);
            }

            var bars = chartGroup
                .selectAll('.bar')
                .data( data);
            bars.enter().append('rect')
                .classed('bar', true)
                .attr({x: function(d, i) { return x1(_access.x1(d)) + gapSize/2; },
                    width: barW,
                    y: function(d, i) {return y1(0)}, //{ return y1(d.value); },
                    height: function(d, i) {return _super.chartHeight() - y1(0)}
                })
                .on('mouseover', dispatch.customHover);
            bars.transition()
                .duration(500)
                .delay(500)
                .ease(_super.ease())
                .attr({
                    width: barW,
                    x: function(d, i) { return x1(_access.x1(d)) + gapSize/2; },
                    y: function(d, i) { return y1(_access.y1(d)); },
                    height: function(d, i) { if(i==0) console.log( "chartH2: " + _super.chartHeight());  return _super.chartHeight() - y1(_access.y1(d)); }
                });
            bars.exit().transition().style({opacity: 0}).remove();
        })
    }

    chartBar.gap = function(_x) {
        if (!arguments.length) return gap;
        gap = _x;
        return this;
    };
    d3.rebind(chartBar, dispatch, 'on');

    return chartBar;

}

function chartLine( _super,  _access,  args) {
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

function chartLine2( _super, _access,  args) {

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

function axisY( _super, _access, args) {
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

function axisMonthX( _super, _access, args) {
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
                return i==0 || (i+1) % 5 == 0;
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


// Export traits to d3
d3.traits = {
    chart: {
        base: chartBase,
        bar: chartBar,
        line: chartLine,
        line2: chartLine2
    },
    scale: {
        linear: {
            y: scaleLinearY
        },
        ordinal: {
            x: scaleOrdinalX
        },
        time: {
            x: scaleTimeX
        }
    },
    axis: {
        y: axisY,
        month: {
            x: axisMonthX
        }
    }
}


/**
 * Copy all the properties for the super to the new trait.
 * @param superTrait
 * @param newTrait
 */
var stackTrait = function(superTrait, newTrait) {
    //newTrait._super = superTrait
    // Copy the properties over onto the new trait
    for (var name in superTrait) {
        if( !(name in newTrait))
            newTrait[name] = superTrait[ name]
    }
};

function clone( obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function extendObject( obj, extensions) {
    for (var key in extensions) {
        if (! obj.hasOwnProperty(key))
            obj[key] = extensions[key];
    }
    return obj
}
function makeTraitAccessors( defaultAccessors, accessors) {
    var obj = clone( accessors)
    if( !obj)
        obj = {}
    return extendObject( obj, defaultAccessors)
}

d3.selection.prototype.trait = function( trait, accessors, args)
{
    if( Array.isArray( trait) ) {
        for( var index in trait)
            this.trait( trait[index])
    } else {
        console.log( ".trait( " + trait.name + ")")
        this._traitsInitialize()

        var traitCount = this.traits.length

        var _super = {}
        if( traitCount > 0)
            _super = this.traits[ traitCount-1]

        var traitAccessors = makeTraitAccessors( this._access, accessors)
        var traitInstance = trait( _super, traitAccessors, args)
        stackTrait( _super, traitInstance)

        this.call( traitInstance)
        this.traits.push( traitInstance)
    }
    return this
}

d3.selection.prototype.callTraits = function() {

    for( var index in this.traits) {
        var traitInstance = this.traits[ index]
        console.log( ".callTraits  " + index + " " + traitInstance.name)
        this.call( traitInstance)
    }
    return this
}

var DEFALUT_ACCESSORS = {
    seriesFilter: function( d, i) { return true}
}

d3.selection.prototype._traitsInitialize = function() {
    if( ! this._access)
        this._access = clone( DEFALUT_ACCESSORS)
    if( ! this.traits)
        this.traits = []
    return this
}

d3.selection.prototype.accessors = function( accessors)
{
    this._traitsInitialize()
    for( var key in accessors) {
        this._access[key] = accessors[key]
    }
    return this
}
}(d3));