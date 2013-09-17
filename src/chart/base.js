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

function _chartBase( _super, _config) {

    var margin = {top: 5, right: 5, bottom: 5, left: 5}
    if( _config.margin) {
        margin.top = _config.margin.top || margin.top
        margin.right = _config.margin.right || margin.right
        margin.bottom = _config.margin.bottom || margin.bottom
        margin.left = _config.margin.left || margin.left
    }

    // Margin for adjusting the x1-scale range
    // Without this margin, the outer bars on a bar chart may be half off the chart.
    var x1Margin = { left: 0, right: 0}
    if( _config.x1Margin) {
        x1Margin.left = _config.x1Margin.left || x1Margin.left
        x1Margin.right = _config.x1Margin.right || x1Margin.right
    }

    var ease = 'cubic-in-out'
    var width = 200
    var height = 100
    var chartWidth = width - margin.left - margin.right,
        chartHeight = height - margin.top - margin.bottom;

    var svg, select, duration = 0
    var selection
    var ChartResized = 'chartResized'
    var X1Resized = 'x1Resized'
    var dispatch = d3.dispatch( ChartResized, X1Resized)


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

                this._container = svg.append('g').classed('container-group', true)
                this._chartGroup = this._container.append('g').classed('chart-group', true);

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

    function updateX1Margin( left, right) {
        // Whomever needs the largest margins will get their way.
        // This avoids cyclic events (ex: two traits setting 3 then 4 then 3 ...)
        if( x1Margin.left < left || x1Margin.right < right) {
            x1Margin.left = left
            x1Margin.right = right
            dispatch.x1Resized()
        }
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

    chartBase.x1MarginLeft = function(marginLeft) {
        if (!arguments.length) return x1Margin.left;
        updateX1Margin( marginLeft, x1Margin.right)
        return this;
    };
    chartBase.x1MarginRight = function(marginRight) {
        if (!arguments.length) return x1Margin.right;
        updateX1Margin( x1Margin.left, marginRight)
        return this;
    };

    chartBase.onX1Resized = function( namespace, traitInstance) {
        var event = X1Resized
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

traits.chart.base = _chartBase

}(d3, d3.traits));