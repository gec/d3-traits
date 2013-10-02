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

var chartGroupClipPathNextId = 1


function _chartBase( _super, _config) {



    var margin = d3.trait.utils.configMargin( _config.margin, {top: 5, right: 5, bottom: 5, left: 5})

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

    var select, duration = 0
    var selection
    var ChartResized = 'chartResized'
    var RangeMarginChanged = 'rangeMarginChanged'
    var dispatch = d3.dispatch( ChartResized, RangeMarginChanged)

    function appendClipPathDef( selected, svgDefs) {
        var pathId = "chart-group-clip-path-" + chartGroupClipPathNextId

        selected._chartGroupClipPath = svgDefs.append("clipPath")
            .attr("id", pathId )
        selected._chartGroupClipPathRect = selected._chartGroupClipPath.append("rect")
            .attr("width", chartWidth)
            .attr("height", chartHeight)

        chartGroupClipPathNextId ++
        return pathId
    }

    function mouseOnChart( mousePoint, chartWidth, chartHeight) {
        return  mousePoint[0] >= 0 && mousePoint[0] <= chartWidth &&
                mousePoint[1] >= 0 && mousePoint[1] <= chartHeight

    }

    function chartBase( _selection) {
        var self = chartBase
        selection = _selection
        _selection.each(function(_data) {
            var element = this // the div element

            select = d3.select(element)
//            width = element.parentElement.offsetWidth || width
//            height = element.parentElement.offsetHeight || height
            width = element.offsetWidth || width
            height = element.offsetHeight || height

            chartWidth = width - margin.left - margin.right
            chartHeight = height - margin.top - margin.bottom

            if( !element._svg) {
                element._svg = d3.select(element)
                    .append("svg")
                    .classed('chart', true)
                    .attr("width", width)
                    .attr("height", height)
                element._svgDefs = element._svg.append("defs")

                var clipId = appendClipPathDef( element, element._svgDefs)

                // Outer container group for charts, axes, labels, etc.
                element._container = element._svg.append('g').classed('container-group', true)

                // Inner container group for actual chart data paths, rectangles, circles, etc.
                element._chartGroup = element._container.append('g').classed('chart-group', true);

                // Clip all chart innards to chartWidth and chartHeight
                element._chartGroup.attr("clip-path", "url(#" + clipId + ")")


                this._svg.on("mousemove", function() {
                    var foci,
                        mousePoint = d3.mouse( element._chartGroup.node() ),
                        onChart = mouseOnChart( mousePoint,  chartWidth, chartHeight ),
                        focusPoint = new d3.trait.Point( mousePoint[0], mousePoint[1] )

                    foci = onChart ? self.getFocusItems.call( element, focusPoint) : []
                    if( fociDifferentFromLast( element, foci))
                        onFocusDispatch( element, foci, focusPoint)
                    element.__onFocusChangeLastFoci = foci
                })
                this._svg.on("mouseout", function() {
                    var mousePoint = d3.mouse( element._chartGroup.node() ),
                        onChart = mouseOnChart( mousePoint,  chartWidth, chartHeight )
                    if( ! onChart)
                        onChartMouseOutDispatch( element)
                })
            }

            element._svg.transition()
                .duration(duration)
                .attr({width: width, height: height})
            element._svg.select('.container-group')
                .attr({transform: 'translate(' + margin.left + ',' + margin.top + ')'});

            element._chartGroupClipPathRect.attr("width", chartWidth).attr("height", chartHeight)

            duration = 500;
        })
    }

    function fociDifferentFromLast( element, current) {
        var last = element.__onFocusChangeLastFoci
        if( !last || last.length !== current.length)
            return true

        var l, c,
            index = last.length - 1

        for( ; index >=0; index--) {
            l = last[index]
            c = current[index]
            if( l.index !== c.index || l.point.x !== c.point.x || l.point.y !== c.point.y)
                return true
        }
        return false
    }

    function onFocusDispatch( element, foci, focusPoint) {
        elementDispatch( element, '__onFocusChangeListeners', [foci, focusPoint])
    }
    function onChartMouseOutDispatch( element) {
        elementDispatch( element, '__onChartMouseOutListeners', [])
    }
    // __onFocusChangeListeners
    function elementDispatch( element, whichListeners, args) {
        if( ! element[ whichListeners])
            return
        var listener,
            i = 0,
            listeners = element[whichListeners],
            length = listeners.length
        for( ; i < length; i++) {
            listener = listeners[ i]
            listener.apply( element, args)
        }
    }
    chartBase.onFocusChange = function( element, fn) {
        if( !element.__onFocusChangeListeners)
            element.__onFocusChangeListeners = []
        if( fn)
            element.__onFocusChangeListeners.push( fn)
    }
    chartBase.onChartMouseOut = function( element, fn) {
        if( !element.__onChartMouseOutListeners)
            element.__onChartMouseOutListeners = []
        if( fn)
            element.__onChartMouseOutListeners.push( fn)
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

    /**
     * Remove everything that was added to element.
     */
    chartBase.remove = function() {
        selection.each(function(_data) {
            var element = this // the div element

            if( element._svg) {
                element._svg.remove();
                delete element._svg;
                delete element._svgDefs;
                delete element._container;
                delete element._chartGroup;
                delete element._chartGroupClipPath;
                delete element._chartGroupClipPathRect;
                delete element.__onFocusChangeListeners;
                delete element.__onChartMouseOutListeners;
            }
        })

    };

    // Return a list of points in focus.
    chartBase.getFocusItems = function( point) {
        return []
    };

    chartBase.update = function(  type, duration) {
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
    chartBase.minRangeMarginTop = function( axis, marginTop) {
        if( !arguments.length) return 0
        if( arguments.length === 1) return minRangeMargins[axis] ? minRangeMargins[axis].top : 0
        initMinRangeMargin( axis)
        if( minRangeMargins[axis].top < marginTop) {
            minRangeMargins[axis].top = marginTop
            dispatch.rangeMarginChanged()
        }
        return this;
    }
    chartBase.minRangeMarginBottom = function( axis, marginBottom) {
        if( !arguments.length) return 0
        if( arguments.length === 1) return minRangeMargins[axis] ? minRangeMargins[axis].bottom : 0
        initMinRangeMargin( axis)
        if( minRangeMargins[axis].bottom < marginBottom) {
            minRangeMargins[axis].bottom = marginBottom
            dispatch.rangeMarginChanged()
        }
        return this;
    }

    chartBase.onRangeMarginChanged = function( namespace, traitInstance) {
        var event = RangeMarginChanged
        if( namespace && namespace.length > 0)
            event = event + "." + namespace
        if( traitInstance)
            dispatch.on( event, function() {
                if( selection)
                    selection.call( traitInstance)
            })
        else
            dispatch.on( event) // remove
    }

    return chartBase;
}

//if( ! traits.chart)
//    traits.chart = {}

trait.chart.base = _chartBase

}(d3, d3.trait));