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
(function(d3, trait) {

  var chartGroupClipPathNextId = 1,
      debug = {
        layoutAxes: false,
        resize: false
      }


  function _chartBase(_super, _config) {


    if( !_config )
      _config = {}

    if( !_config.seriesData )
      _config.seriesData = function(s) { return s }
    if( !_config.seriesLabel )
      _config.seriesLabel = function(s, i) { return "Series " + i }

    if( !_config.x1 )
      _config.x1 = function(d) { return d[0] }
    if( !_config.y1 )
      _config.y1 = function(d) { return d[1] }

    var margin = d3.trait.utils.configMargin(_config.margin, {top: 5, right: 5, bottom: 5, left: 5})

    _config.clip = _config.clip === undefined || _config.clip === true


    // Margin for adjusting the x1-scale range
    // Example: { x1: {left: 5, right: 5} }
    // Without this margin, the outer bars on a bar chart may be half off the chart.
    var minRangeMargins = {}

    /*
     allAxesWithLayoutInfo
     chartBase manages the layout of axes. There may be more than one axis on each
     orientation (Left, Right, Bottom, Top}. As axes are added (via traits), the
     chart margins are adjusted to accommodate each axis.
     Each array element contains the following:
     group: The SVG g element for the axis and axis label
     orient: left, right, top, bottom
     rect: d3.trait.Rect
     */
    var allAxesWithLayoutInfo = []

    var MIN_RANGE_MARGIN_DEFAULT = {left: 0, right: 0, top: 0, bottom: 0}

    function initMinRangeMargin(axis) {
      if( !minRangeMargins[axis] )
        minRangeMargins[axis] = trait.utils.clone(MIN_RANGE_MARGIN_DEFAULT)
    }

    function isMinRangeMargin(axis) {
      if( !minRangeMargins[axis] )
        return false

      var current = minRangeMargins[axis]

      if( d3.trait.utils.isX(axis) )
        return current.left !== 0 || current.right !== 0
      else
        return current.top !== 0 || current.bottom !== 0
    }

    // Whomever needs the largest margins will get their way.
    // This avoids cyclic events (ex: two traits setting 3 then 4 then 3 ...)
    function minRangeMargin(axis, rangeMargin) {
      if( !arguments.length ) return {}

      initMinRangeMargin(axis)

      if( arguments.length === 1 )
        return minRangeMargins[axis]

      if( !rangeMargin )
        return this

      var current = minRangeMargins[axis],
          changed = false;

      if( rangeMargin.left && current.left < rangeMargin.left ) {
        current.left = rangeMargin.left
        changed = true
      }
      if( rangeMargin.right && current.right < rangeMargin.right ) {
        current.right = rangeMargin.right
        changed = true
      }
      if( rangeMargin.top && current.top < rangeMargin.top ) {
        current.top = rangeMargin.top
        changed = true
      }
      if( rangeMargin.bottom && current.bottom < rangeMargin.bottom ) {
        current.bottom = rangeMargin.bottom
        changed = true
      }

      if( changed )
        dispatch.rangeMarginChanged()

      return this;
    }

    if( _config.minRangeMargin ) {
      for( var axis in _config.minRangeMargin ) {
        minRangeMargin(axis, _config.minRangeMargin[ axis])
      }
    }

    var ease = 'cubic-in-out'
    var sizeFromElement = true
    var size = new d3.trait.Size(),
        chartSize = { attrWidth: null, attrHeight: null}
    var width = 200
    var height = 100
    var chartWidth = width - margin.left - margin.right,
        chartHeight = height - margin.top - margin.bottom,
        colorIndexNext = 0,
        colors = d3.scale.category10(),
        colorsUsed = [],
        externalListeners = {}  // subscribption listeners here or on each element.


    var select, duration = 0
    var selection
    var ChartResized = 'chartResized'
    var RangeMarginChanged = 'rangeMarginChanged'
    var dispatch = d3.dispatch(ChartResized, RangeMarginChanged)

    function appendClipPathDef(selected, svgDefs) {
      var pathId = "chart-group-clip-path-" + chartGroupClipPathNextId

      selected._chartGroupClipPath = svgDefs.append("clipPath")
        .attr("id", pathId)
      selected._chartGroupClipPathRect = selected._chartGroupClipPath.append("rect")
        .attr("width", chartWidth)
        .attr("height", chartHeight)

      chartGroupClipPathNextId++
      return pathId
    }

    function mouseOnChart(focusPoint, chartWidth, chartHeight) {
      return  focusPoint.x >= 0 && focusPoint.x <= chartWidth &&
        focusPoint.y >= 0 && focusPoint.y <= chartHeight

    }

    function onMouseMoveListener( element, focusPoint, onChart, sourceInternal, marginLeft, marginTop) {
      var foci
      if( onChart)
        onChartMouseMoveDispatch(element, [focusPoint], sourceInternal)


      foci = onChart ? chartBase.getFocusItems.call(element, focusPoint) : []
      foci.forEach(function(item) {
        item.point.x += margin.left
        item.point.y += margin.top
      })

      if( fociDifferentFromLast(element, foci) )
        onFocusDispatch(element, [foci, focusPoint], sourceInternal)
      element.__onFocusChangeLastFoci = foci

    }

    function onMouseOutListener( element, sourceInternal) {
      onChartMouseOutDispatch(element, sourceInternal)
    }


    function getDimension(sizeFromElement, dimension, elementOffsetDimension) {
      if( !sizeFromElement )
        return dimension
      else
        return elementOffsetDimension;
    }

    function getDimensionAttr(sizeFromElement, dimension, elementOffsetDimension, elementStyleDimension) {
      if( !sizeFromElement )
        return dimension

      if( elementStyleDimension.indexOf('%') >= 0 )
        return elementStyleDimension;
      else
        return elementOffsetDimension;
    }

    function getChartSizeAttrs(element, sizeFromElement, width, height) {
      var attrs = {}

      attrs.width = getDimensionAttr(sizeFromElement, width, element.offsetWidth, element.style.width)
      attrs.height = getDimensionAttr(sizeFromElement, height, element.offsetHeight, element.style.height)
      return attrs
    }

    function getChartSize(element, sizeFromElement, width, height, margin) {
      var size = new d3.trait.Size()

      size.width = getDimension(sizeFromElement, width, element.offsetWidth) - margin.left - margin.right
      size.height = getDimension(sizeFromElement, height, element.offsetHeight) - margin.top - margin.bottom
      return size
    }

    function getSize(element, sizeFromElement, width, height) {
      return new d3.trait.Size(
        getDimension(sizeFromElement, width, element.offsetWidth),
        getDimension(sizeFromElement, height, element.offsetHeight)
      )
    }

    function chartBase(_selection) {
      var self = chartBase
      selection = _selection
      _selection.each(function(_data) {
        var chartSize,
            element = this, // the div element
            sizeAttrs = getChartSizeAttrs(element, sizeFromElement, width, height)

        select = d3.select(element)

        if( !element._svg ) {
          element._svg = d3.select(element)
            .append("svg")
            .classed('chart', true)
            .attr("width", sizeAttrs.width)
            .attr("height", sizeAttrs.height)
          element._svgDefs = element._svg.append("defs")

          size = getSize(element, sizeFromElement, width, height)
          width = size.width
          height = size.height
          chartWidth = size.width - margin.left - margin.right
          chartHeight = size.height - margin.top - margin.bottom

          var clipId = null
          if( _config.clip )
            clipId = appendClipPathDef(element, element._svgDefs)

          // Outer container group for charts, axes, labels, etc.
          element._container = element._svg.append('g').classed('container-group', true)

          // Inner container group for actual chart data paths, rectangles, circles, etc.
          element._chartGroup = element._container.append('g').classed('chart-group', true);

          // Clip all chart innards to chartWidth and chartHeight
          if( _config.clip )
            element._chartGroup.attr("clip-path", "url(#" + clipId + ")")


          this._svg.on("mousemove", function() {
            var foci,
                mousePoint = d3.mouse(element._chartGroup.node()),
                focusPoint = new d3.trait.Point(mousePoint[0], mousePoint[1]),
                onChart = mouseOnChart(focusPoint, chartWidth, chartHeight)
            onMouseMoveListener( element, focusPoint, onChart, true, margin.left, margin.top)
          })

          this._svg.on("mouseout", function() {
            var mousePoint = d3.mouse(element._chartGroup.node()),
                focusPoint = new d3.trait.Point(mousePoint[0], mousePoint[1]),
                onChart = mouseOnChart(focusPoint, chartWidth, chartHeight)
            if( !onChart )
              onMouseOutListener( element, true) // t: sourceInternal
          })

          colorsUsed = []
          _data.forEach(function(d) {
            var i
            if( d.__color__ ) {
              i = colorsUsed.indexOf(d.__color__)
              if( i >= 0 ) {
                delete d.__color__;
              } else {
                colorsUsed.push(d.__color__)
              }
            }
          })
        }

        //console.log( "chartBase w=" + width + ", h=" + height + " cW=" + chartWidth + ", cH=" + chartHeight)

        element._svg.transition()
          .duration(duration)
          .attr({width: width, height: height})
        element._svg.select('.chart-group')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        if( _config.clip )
          element._chartGroupClipPathRect.attr("width", chartWidth).attr("height", chartHeight)

        duration = 500;
      })
    }

    function fociDifferentFromLast(element, current) {
      var last = element.__onFocusChangeLastFoci
      if( !last || last.length !== current.length )
        return true

      var l, c,
          index = last.length - 1

      for( ; index >= 0; index-- ) {
        l = last[index]
        c = current[index]
        if( l.index !== c.index || l.point.x !== c.point.x || l.point.y !== c.point.y )
          return true
      }
      return false
    }

    function onFocusDispatch(element, args, sourceInternal) {
      elementDispatch(element, '__onFocusChangeListeners', args)
      if( sourceInternal)
        elementDispatch(externalListeners, '__onFocusChangeListeners', args)
    }

    function onChartMouseMoveDispatch(element, args, sourceInternal) {
      elementDispatch(element, '__onChartMouseMoveListeners', args)
      if( sourceInternal)
        elementDispatch(externalListeners, '__onChartMouseMoveListeners', args)
    }
    function onChartMouseOutDispatch(element, sourceInternal) {
      elementDispatch(element, '__onChartMouseOutListeners', [])
      if( sourceInternal)
        elementDispatch(externalListeners, '__onChartMouseOutListeners', [])
    }

    // __onFocusChangeListeners
    function elementDispatch(element, whichListeners, args) {
      if( !element[ whichListeners] )
        return
      var listener,
          i = 0,
          listeners = element[whichListeners],
          length = listeners.length
      for( ; i < length; i++ ) {
        listener = listeners[ i]
        listener.apply(element, args)
      }
    }

    /**
     *
     * Subscribe:
     *    subscribe( function(){}, element)
     *    subscribe( function(){})
     *
     * Unsubscribe:
     *    subscribe( function(){}, element, false)
     *    subscribe( function(){}, false)
     * @param name
     * @param fn
     * @param element
     * @param isSubscribe
     * @returns {boolean}
     */
    function subscribe( name, fn, element, isSubscribe) {
      var unsub = element === false || isSubscribe === false

      if( ! fn)
        return false

      var listenerMap = element === undefined || element === false ? externalListeners : element
      if( !listenerMap[name] ) {
        if( unsub)
          return false
        else
          listenerMap[name] = []
      }
      if( unsub) {
        var listeners = listenerMap[name]
        if( listeners ) {
          var index = listeners.indexOf(fn)
          if( index >= 0) {
            listeners.splice( index, 1)
          }
        }
        return false
      } else {
        listenerMap[name].push(fn)
      }
      return true // successful subscribe or unsubscribe
    }

    /**
     * Subscribe to events from another chart and treat them as our own.
     * This is useful when we want the crosshair from another chart to
     * show up in our chart (along with our tooltips).
     *
     * @param source The source chart that we're subscribing to.
     * @param events List of events to subscribe to.
     * @returns {chartBase}
     */
    chartBase.subscribeToEvents = function( source, events) {
      if( ! source)
        return this

      events.forEach( function( event) {
        var eventHandler
        if( event === 'onChartMouseMove') {
          eventHandler = function() {
            var args = arguments // 0 or more arguments
            if( selection )
              selection.each(function(_data) {
                var element = this, // the div element
                    focusPoint = args[0]
                focusPoint.x = Math.min(focusPoint.x, chartWidth)
                focusPoint.y = Math.min(focusPoint.y, chartHeight)
                onMouseMoveListener(element, focusPoint, true, false, margin.left, margin.top)
              })
          }
        } else if( event === 'onChartMouseOut') {
          eventHandler =  function() {
            var args = arguments // 0 or more arguments
            if( selection)
              selection.each(function(_data) {
                var element = this // the div element
                onMouseOutListener(element, false)
              })
            }
        }

        // subscribe to source
        if( eventHandler)
          source[event]( eventHandler)
      })
      return this
    }

    /**
     * Subscribe or unsubscribe to focus change events.
     *
     * Subscribe:
     *    onFocusChange( function(){}, element)
     *    onFocusChange( function(){})
     *
     * Unsubscribe:
     *    onFocusChange( function(){}, element, false)
     *    onFocusChange( function(){}, false)
     *
     *
     * @param fn Function to call. Ex: function( foci, focusPoint)
     * @param element Current element to hang listeners on or isSubscribe=false
     * @param isSubscribe If isSubscribe === false, unsubscribe
     * @return True on success
     */
    chartBase.onFocusChange = function(fn, element, isSubscribe) {
      return subscribe( '__onFocusChangeListeners', fn, element, isSubscribe)
    }
    chartBase.onChartMouseMove = function(fn, element, isSubscribe) {
      return subscribe( '__onChartMouseMoveListeners', fn, element, isSubscribe)
    }

    chartBase.onChartMouseOut = function(fn, element, isSubscribe) {
      return subscribe( '__onChartMouseOutListeners', fn, element, isSubscribe)
    }

    function updateChartSize() {
      var prev = {
        chartWidth:  chartWidth,
        chartHeight: chartHeight
      }
      chartWidth = Math.max( 0, width - margin.left - margin.right)
      chartHeight = Math.max( 0, height - margin.top - margin.bottom)
      if( debug.resize)
        console.log( 'chartBase.updateChartSize() chartWidth ' + prev.chartWidth + '->' + chartWidth + ', chartHeight ' + prev.chartHeight + '->' + chartHeight + ' selection:' + (!!selection))
      if( prev.chartWidth !== chartWidth || prev.chartHeight !== chartHeight ) {
        if( selection )
          chartBase.callTraits(selection)
        dispatch.chartResized()
      }
    }

    function updateSize() {
      var prev = {
        width:  width,
        height: height
      }
      width = chartWidth + margin.left + margin.right
      height = chartHeight + margin.top + margin.bottom
      if( prev.width !== width || prev.height !== height )
        dispatch.chartResized()
    }

    /**
     * Remove everything that was added to element.
     */
    chartBase.remove = function() {
      selection.each(function(_data) {
        var element = this // the div element

        if( element._svg ) {
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

    function findAxisWithLayoutInfo(group) {
      var i, axisWithLayoutInfo,
          length = allAxesWithLayoutInfo.length

      for( i = 0; i < length; i++ ) {
        axisWithLayoutInfo = allAxesWithLayoutInfo[i]
        if( axisWithLayoutInfo.group === group )
          return axisWithLayoutInfo
      }
      return null
    }

    function updateChartMarginForAxis(axes, orient) {
      var axisMargin,
          updatedMargin = false

      if( axes.length <= 0 )
        return updatedMargin

      switch( orient ) {
        case 'left':
          axisMargin = axes[ axes.length - 1].rect.maxX()
          if( margin.left < axisMargin ) {
            margin.left = axisMargin
            updatedMargin = true;
          }
          break;
        case 'right':
          axisMargin = width - axes[0].rect.minX()
          if( margin.right < axisMargin ) {
            margin.right = axisMargin
            updatedMargin = true;
          }
          break;
        case 'top':
          axisMargin = axes[ axes.length - 1].rect.maxY()
          if( margin.top < axisMargin ) {
            margin.top = axisMargin
            updatedMargin = true;
          }
          break;

        case 'bottom':
          axisMargin = height - axes[0].rect.minY()
          if( margin.bottom < axisMargin ) {
            margin.bottom = axisMargin
            updatedMargin = true;
          }
          break;

        default:
      }
      return updatedMargin
    }

    function updateAxesExtentsForChartMarginTop(axes) {
      var updatedOrigin = false
      axes.forEach(function(axis) {
        if( axis.rect.minY() < margin.top ) {
          axis.rect.origin.y = margin.top
          updatedOrigin = true;
        }
      })
      return updatedOrigin
    }

    function updateAxesExtentsForChartMarginLeft(axes) {
      var updatedOrigin = false
      axes.forEach(function(axis) {
        if( axis.rect.minX() < margin.left ) {
          axis.rect.origin.x = margin.left
          updatedOrigin = true;
        }
      })
      return updatedOrigin
    }

    function updateAxesForChartMargin(axes, orient) {
      var updatedOrigin = false,
          edge = 0,
          delta = 0

      if( axes.length <= 0 )
        return updatedOrigin

      switch( orient ) {
        case 'left':
          updatedOrigin = updateAxesExtentsForChartMarginTop(axes)
          // If the chart's left margin is more than the axes width,
          // shift the axes up against the left edge.
          edge = axes[ axes.length - 1].rect.maxX()
          if( edge < margin.left ) {
            delta = margin.left - edge
            axes.forEach(function(axis) {
              axis.rect.origin.x += delta;
            })
            updatedOrigin = true;
          }
          break;
        case 'right':
          // If the chart's right margin is more than the axes width,
          // shift the axes up against the right edge.
          updatedOrigin = updateAxesExtentsForChartMarginTop(axes)
          edge = axes[0].rect.minX()
          if( edge > width - margin.right ) {
            delta = width - margin.right - edge
            axes.forEach(function(axis) {
              axis.rect.origin.x += delta;
            })
            updatedOrigin = true;
          }
          break;
        case 'top':
          // If the chart's top margin is more than the axes height,
          // shift the axes up against the top edge.
          updatedOrigin = updateAxesExtentsForChartMarginLeft(axes)
          edge = axes[ axes.length - 1].rect.maxY()
          if( edge < margin.top ) {
            delta = margin.top - edge
            axes.forEach(function(axis) {
              axis.rect.origin.y += delta;
            })
            updatedOrigin = true;
          }
          break;
        case 'bottom':
          updatedOrigin = updateAxesExtentsForChartMarginLeft(axes)
          // If the chart's bottom margin is more than the axes height,
          // shift the axes up against the bottom edge.
          edge = axes[0].rect.minY()
          if( edge > height - margin.bottom ) {
            delta = height - margin.bottom - edge
            axes.forEach(function(axis) {
              axis.rect.origin.y += delta;
            })
            updatedOrigin = true;
          }
          break;
        default:
      }
      return updatedOrigin
    }

    function makeAxisRectWithProperAnchor(orient, widthOrHeight) {
      // The left axis (for example) is drawn correctly when translated to the left edge
      // of the chart; therefore, the anchor is on the right side of the rect.
      switch( orient ) {
        case 'left':
          return new d3.trait.Rect(0, 0, widthOrHeight, 0, 1, 0);
        case 'right':
          return new d3.trait.Rect(0, 0, widthOrHeight, 0);
        case 'top':
          return new d3.trait.Rect(0, 0, 0, widthOrHeight, 0, 1);
        case 'bottom':
          return new d3.trait.Rect(0, 0, 0, widthOrHeight);
        default:
          return  new d3.trait.Rect();
      }
    }

    function relayoutAxes() {
      var axesWithLayoutInfo, key,
          updatedMargin = false,
          rect = new d3.trait.Rect(0, 0, width, height),
          orients = [ 'left', 'right', 'top', 'bottom'],
          axesByOrient = {}

      orients.forEach(function(orient) {
        axesWithLayoutInfo = allAxesWithLayoutInfo.filter(function(e) {
          return e.orient === orient
        })
        d3.trait.layout.byOrientation(axesWithLayoutInfo, rect, orient)
        updatedMargin = updatedMargin || updateChartMarginForAxis(axesWithLayoutInfo, orient)
        axesByOrient[orient] = axesWithLayoutInfo
      })
      for( key in axesByOrient ) {
        axesWithLayoutInfo = axesByOrient[key]
        updateAxesForChartMargin(axesWithLayoutInfo, key)
      }

      if( updatedMargin )
        updateChartSize()
    }

    chartBase.layoutAxis = function( name, group, orient, widthOrHeight) {
      var axisWithLayoutInfo = findAxisWithLayoutInfo(group),
          rect = makeAxisRectWithProperAnchor(orient, widthOrHeight)

      if( debug.layoutAxes) {
        console.log( 'layoutAxis( '+name+', ' + orient + ', ' + widthOrHeight + ') BEGIN width:' + width + ' height:' + height + ' margin l:' + margin.left + ' r:' + margin.right + ' t:' + margin.top + ' b:' + margin.bottom)
        allAxesWithLayoutInfo.forEach( function(a){
          console.log( '   ' + a.name + ', ' + a.orient + ' origin:'+ a.rect.origin.x + ',' + a.rect.origin.y +' size:' + a.rect.size.width + ',' + a.rect.size.height + ' anchor:' + a.rect.anchor.x + ',' + a.rect.anchor.y)
        })
      }
      if( !axisWithLayoutInfo ) {
        axisWithLayoutInfo = { name: name, group: group, orient: orient, rect: rect}
        allAxesWithLayoutInfo.push(axisWithLayoutInfo)
        relayoutAxes()
      } else if( axisWithLayoutInfo.orient !== orient || axisWithLayoutInfo.rect.size !== rect.size ) {
        axisWithLayoutInfo.orient = orient
        axisWithLayoutInfo.rect = rect
        relayoutAxes()
      }
      if( debug.layoutAxes) {
        console.log( 'layoutAxis( '+name+', ' + orient + ', ' + widthOrHeight + ') END   width:' + width + ' height:' + height + ' margin l:' + margin.left + ' r:' + margin.right + ' t:' + margin.top + ' b:' + margin.bottom)
        allAxesWithLayoutInfo.forEach( function(a){
          console.log( '   ' + a.name + ', ' + a.orient + ' origin:'+ a.rect.origin.x + ',' + a.rect.origin.y +' size:' + a.rect.size.width + ',' + a.rect.size.height + ' anchor:' + a.rect.anchor.x + ',' + a.rect.anchor.y)
        })
      }
      axisWithLayoutInfo.group.attr('transform', 'translate(' + axisWithLayoutInfo.rect.origin.x + ',' + axisWithLayoutInfo.rect.origin.y + ')');
    }

    // Return a list of points in focus.
    chartBase.getFocusItems = function(point) {
      return []
    };

    /**
     *
     * @param type  trend - New date for trend. Slide the new data from the right.
     *              domain - The domain has been updated and all traits need to udpate based on the
     *                      new domain extent (ex: brush event).
     * @param duration
     */
    chartBase.update = function(type, duration) {
    };

    chartBase.select = function() {
      return select;
    };

    function getColor(series) {
      if( series.__color__ )
        return series.__color__

      var i,
          count = 0;
      while( count < 10 ) {
        series.__color__ = colors(colorIndexNext++)
        i = colorsUsed.indexOf(series.__color__)
        if( i < 0 )
          break;
        count++
      }
      colorsUsed.push(series.__color__)
      return series.__color__
    }

    chartBase.color = function(series, _color) {
      switch( arguments.length ) {
        case 1:
          return getColor(series);
        case 3:
          return getColor(series); // d3 attribute call with (series, seriesIndex, array)
        case 2:
          series.__color__ = _color
          return this;
        default:
          return 'black'; // What else to do?
      }
    };

    chartBase.size = function(_s) {
      if( !arguments.length ) return width;
      sizeFromElement = false
      width = parseInt(_s.width, 10);
      height = parseInt(_s.height, 10);
      if( debug.resize)
        console.log( 'chartBase.size( weight=' + width + ', height=' + height + ')')
      updateChartSize()
      return this;
    };
    chartBase.width = function(_x) {
      if( !arguments.length ) return width;
      sizeFromElement = false
      width = parseInt(_x, 10);
      if( debug.resize)
        console.log( 'chartBase.width( ' + width + ')')
      updateChartSize()
      return this;
    };
    chartBase.height = function(_x) {
      if( !arguments.length ) return height;
      sizeFromElement = false
      height = parseInt(_x, 10);
      if( debug.resize)
        console.log( 'chartBase.height( ' + height + ')')
      updateChartSize()
      duration = 0;
      return this;
    };

    chartBase.marginTop = function(_marginTop) {
      if( !arguments.length ) return margin.top;
      margin.top = _marginTop;
      updateChartSize()
      return this;
    };
    chartBase.marginBottom = function(_marginBottom) {
      if( !arguments.length ) return margin.bottom;
      margin.bottom = _marginBottom;
      updateChartSize()
      return this;
    };
    chartBase.marginLeft = function(_marginLeft) {
      if( !arguments.length ) return margin.left;
      margin.left = _marginLeft;
      updateChartSize()

      return this;
    };
    chartBase.marginRight = function(_marginRight) {
      if( !arguments.length ) return margin.right;
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

    chartBase.chartRect = function() {
      return new d3.trait.Rect(margin.left, margin.top, chartWidth, chartHeight)
    }

    chartBase.chartWidth = function(_x) {
      if( !arguments.length ) return chartWidth;
      chartWidth = parseInt(_x, 10);
      updateSize()
      return this;
    };
    chartBase.chartHeight = function(_x) {
      if( !arguments.length ) return chartHeight;
      chartHeight = parseInt(_x, 10);
      updateSize()
      return this;
    };

    chartBase.ease = function(_x) {
      if( !arguments.length ) return ease;
      ease = _x;
      return this;
    };

    chartBase.duration = function(_x) {
      if( !arguments.length ) return duration;
      duration = _x;
      return this;
    };

    //d3.rebind(chartBase, dispatch, 'on');

    chartBase.onChartResized = function(namespace, traitInstance) {
      var event = ChartResized
      if( namespace && namespace.length > 0 )
        event = event + "." + namespace
      dispatch.on(event, function() {
        if( selection )
          selection.call(traitInstance)
      })
    }

    chartBase.minRangeMargin = minRangeMargin
    chartBase.isMinRangeMargin = isMinRangeMargin

    chartBase.minRangeMarginLeft = function(axis, marginLeft) {
      if( !arguments.length ) return 0
      if( arguments.length === 1 ) return minRangeMargins[axis] ? minRangeMargins[axis].left : 0
      initMinRangeMargin(axis)
      if( minRangeMargins[axis].left < marginLeft ) {
        minRangeMargins[axis].left = marginLeft
        dispatch.rangeMarginChanged()
      }
      return this;
    }
    chartBase.minRangeMarginRight = function(axis, marginRight) {
      if( !arguments.length ) return 0
      if( arguments.length === 1 ) return minRangeMargins[axis] ? minRangeMargins[axis].right : 0
      initMinRangeMargin(axis)
      if( minRangeMargins[axis].right < marginRight ) {
        minRangeMargins[axis].right = marginRight
        dispatch.rangeMarginChanged()
      }
      return this;
    }
    chartBase.minRangeMarginTop = function(axis, marginTop) {
      if( !arguments.length ) return 0
      if( arguments.length === 1 ) return minRangeMargins[axis] ? minRangeMargins[axis].top : 0
      initMinRangeMargin(axis)
      if( minRangeMargins[axis].top < marginTop ) {
        minRangeMargins[axis].top = marginTop
        dispatch.rangeMarginChanged()
      }
      return this;
    }
    chartBase.minRangeMarginBottom = function(axis, marginBottom) {
      if( !arguments.length ) return 0
      if( arguments.length === 1 ) return minRangeMargins[axis] ? minRangeMargins[axis].bottom : 0
      initMinRangeMargin(axis)
      if( minRangeMargins[axis].bottom < marginBottom ) {
        minRangeMargins[axis].bottom = marginBottom
        dispatch.rangeMarginChanged()
      }
      return this;
    }

    chartBase.onRangeMarginChanged = function(namespace, traitInstance) {
      var event = RangeMarginChanged
      if( namespace && namespace.length > 0 )
        event = event + "." + namespace
      if( traitInstance )
        dispatch.on(event, function() {
          if( selection )
            selection.call(traitInstance)
        })
      else
        dispatch.on(event) // remove
    }

    return chartBase;
  }

//if( ! traits.chart)
//    traits.chart = {}

  trait.chart.base = _chartBase

}(d3, d3.trait));