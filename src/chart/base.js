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

function _chartBase( _super, _config) {



    var margin = {top: 5, right: 5, bottom: 5, left: 5}
    if( _config.margin) {
        margin.top = _config.margin.top || margin.top
        margin.right = _config.margin.right || margin.right
        margin.bottom = _config.margin.bottom || margin.bottom
        margin.left = _config.margin.left || margin.left
    }

    // Margin for adjusting the x1-scale range
    // Example: { x1: {left: 5, right: 5} }
    // Without this margin, the outer bars on a bar chart may be half off the chart.
    var minRangeMargins = {}

    var MIN_RANGE_MARGIN_DEFAULT = {left: 0, right: 0, top: 0, bottom: 0}
    function initMinRangeMargin( axis) {
        if( ! minRangeMargins[axis])
            minRangeMargins[axis] = trait.utils.clone( MIN_RANGE_MARGIN_DEFAULT)
    }

    // Whomever needs the largest margins will get their way.
    // This avoids cyclic events (ex: two traits setting 3 then 4 then 3 ...)
    function minRangeMargin( axis, rangeMargin) {
        if( !arguments.length) return {}

        initMinRangeMargin( axis)

        if( arguments.length === 1)
            return minRangeMargins[axis]

        if( ! rangeMargin)
            return this

        var m = minRangeMargins[axis],
            changed = false;

        if( rangeMargin.left && rangeMargin.left < m.left) {
            m.left = rangeMargin.left
            changed = true
        }
        if( rangeMargin.right && rangeMargin.right < m.right) {
            m.right = rangeMargin.right
            changed = true
        }
        if( rangeMargin.top && rangeMargin.top < m.top) {
            m.top = rangeMargin.top
            changed = true
        }
        if( rangeMargin.bottom && rangeMargin.bottom < m.bottom) {
            m.bottom = rangeMargin.bottom
            changed = true
        }

        if( changed)
            dispatch.rangeMarginChanged()

        return this;
    }

    if( _config.minRangeMargin) {
        for( var axis in _config.minRangeMargin) {
            minRangeMargin( axis, _config.minRangeMargin[ axis])
        }
    }

    var ease = 'cubic-in-out'
    var width = 200
    var height = 100
    var chartWidth = width - margin.left - margin.right,
        chartHeight = height - margin.top - margin.bottom;

    var svg, select, duration = 0
    var selection
    var ChartResized = 'chartResized'
    var RangeMarginChanged = 'rangeMarginChanged'
    var dispatch = d3.dispatch( ChartResized, RangeMarginChanged)

    function appendClipPathDef( selected, svgDefs) {
        selected._chartGroupClipPath = svgDefs.append("clipPath")
            .attr("id", "chart-group-clip-path")
        selected._chartGroupClipPathRect = selected._chartGroupClipPath.append("rect")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
    }

    function chartBase( _selection) {
        selection = _selection
        _selection.each(function(_data) {

            // this == the div
            select = d3.select(this)
//            width = this.parentElement.offsetWidth || width
//            height = this.parentElement.offsetHeight || height
            width = this.offsetWidth || width
            height = this.offsetHeight || height

            chartWidth = width - margin.left - margin.right
            chartHeight = height - margin.top - margin.bottom

            if(!svg) {
                svg = d3.select(this)
                    .append("svg")
                    .classed('chart', true)
                    .attr("width", width)
                    .attr("height", height)
                this._svgDefs = svg.append("defs")

                appendClipPathDef( this, this._svgDefs)

                // Outer container group for charts, axes, labels, etc.
                this._container = svg.append('g').classed('container-group', true)

                // Inner container group for actual chart data paths, rectangles, circles, etc.
                this._chartGroup = this._container.append('g').classed('chart-group', true);

                // Clip all chart innards to chartWidth and chartHeight
                this._chartGroup.attr("clip-path", "url(#chart-group-clip-path)")
            }

            svg.transition()
                .duration(duration)
                .attr({width: width, height: height})
            svg.select('.container-group')
                .attr({transform: 'translate(' + margin.left + ',' + margin.top + ')'});

            this._chartGroupClipPathRect.attr("width", chartWidth).attr("height", chartHeight)

            duration = 500;
        })
    }

    function updateChartSize() {
        var prev = {
            chartWidth: chartWidth,
            chartHeight: chartHeight
        }
        chartWidth = width - margin.left - margin.right
        chartHeight = height - margin.top - margin.bottom
        //console.log( "baseChart.updateChartSize chartWidth=" + chartWidth + ", chartHeight=" + chartHeight)
        if( prev.chartWidth !== chartWidth || prev.chartHeight !== chartHeight)
            dispatch.chartResized()
    }

    function updateSize() {
        var prev = {
            width: width,
            height: height
        }
        width = chartWidth + margin.left + margin.right
        height = chartHeight + margin.top + margin.bottom
        if( prev.width !== width || prev.height !== height)
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
        width = parseInt(_x, 10);
        updateChartSize()
        return this;
    };
    chartBase.height = function(_x) {
        if (!arguments.length) return height;
        height = parseInt(_x, 10);
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
        margin.top += parseInt(_marginTop, 10);
        updateChartSize()
        return this;
    };
    chartBase.plusMarginBottom = function(_marginBottom) {
        margin.bottom += parseInt(_marginBottom, 10);
        updateChartSize()
        return this;
    };
    chartBase.plusMarginLeft = function(_marginLeft) {
        margin.left += parseInt(_marginLeft, 10);
        updateChartSize()
        return this;
    };
    chartBase.plusMarginRight = function(_marginRight) {
        margin.right += parseInt(_marginRight, 10);
        updateChartSize()
        return this;
    };

    chartBase.chartWidth = function(_x) {
        if (!arguments.length) return chartWidth;
        chartWidth = parseInt(_x, 10);
        updateSize()
        return this;
    };
    chartBase.chartHeight = function(_x) {
        if (!arguments.length) return chartHeight;
        chartHeight = parseInt(_x, 10);
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
            if( selection)
                selection.call( traitInstance)
        })
    }

    chartBase.minRangeMargin = minRangeMargin

    chartBase.minRangeMarginLeft = function( axis, marginLeft) {
        if( !arguments.length) return 0
        if( arguments.length === 1) return minRangeMargins[axis] ? minRangeMargins[axis].left : 0
        initMinRangeMargin( axis)
        if( minRangeMargins[axis].left < marginLeft) {
            minRangeMargins[axis].left = marginLeft
            dispatch.rangeMarginChanged()
        }
        return this;
    }
    chartBase.minRangeMarginRight = function( axis, marginRight) {
        if( !arguments.length) return 0
        if( arguments.length === 1) return minRangeMargins[axis] ? minRangeMargins[axis].left : 0
        initMinRangeMargin( axis)
        if( minRangeMargins[axis].right < marginRight) {
            minRangeMargins[axis].right = marginRight
            dispatch.rangeMarginChanged()
        }
        return this;
    }

    chartBase.onRangeMarginChanged = function( namespace, traitInstance) {
        var event = RangeMarginChanged
        if( namespace && namespace.length > 0)
            event = event + "." + namespace
        dispatch.on( event, function() {
            if( selection)
                selection.call( traitInstance)
        })
    }

    return chartBase;
}

//if( ! traits.chart)
//    traits.chart = {}

trait.chart.base = _chartBase

}(d3, d3.trait));