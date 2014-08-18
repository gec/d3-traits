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

  var INSETS_NONE = 'none',          // Don't adjust insets
      INSETS_EXTEND_DOMAIN = 'extend-domain', // Extend the domain extents so bars are completely visible
      INSETS_INSET_RANGE = 'inset-range'    // Inset the scales range so bars are completely visible


  /**
   * extentTicks: T: ticks on each extent. Overrides ticks.
   * ticks: Approximate number of ticks
   * @param config
   * @returns { width:, gap:, justification, insets:}
   */
  function barConfig(config) {
    var gap = d3.trait.utils.configFloat(config.gap, 0.1),
        outerGap = d3.trait.utils.configFloat(config.outerGap, gap),
        c = {
          width:         config.width || 'auto',
          // gap is percentage of bar width (0-1)
          gap:           gap,
          // outerGap can be 0 to greater than 1
          outerGap:      outerGap,
          justification: config.justification || 'center',
          //insets: 'none' 'extend-domain', 'inset-range', {top: 0, right: 0, bottom: 0, left: 0}
          insets:        config.insets || INSETS_INSET_RANGE
        }
    return c
  }

  function ChartConfig( _config, _base) {
    trait.config.Configuration.call( this, _base)
    this.init( _base)

    // Decide that two axes that this chart will access
    this.axes = {
      x: _config.xAxis || 'x1',
      y: _config.yAxis || 'y1'
    }
    this._stacked = _config.stacked || false
  }
  ChartConfig.prototype = Object.create( trait.config.Configuration.prototype)
  ChartConfig.prototype.constructor = ChartConfig
  ChartConfig.prototype._super = trait.config.Configuration.prototype
  trait.chart.Configuration = ChartConfig

  ChartConfig.prototype.init = function( _base) {
    console.log( 'ChartConfig.prototype.init')
    if( !_base)
      return
    this.initBase( _base)
    this.access = {
      x: _base[this.axes.x],
      y: _base[this.axes.y]
    }
  }
  ChartConfig.prototype.stacked = function( x) {
    if (!arguments.length) return this._stacked;
    this._stacked = x
    return this
  }



  function BarConfig( _config, _base) {
    trait.chart.Configuration.call( this, _config, _base)
    this._width =          _config.width || 'auto'
    this._gap =            d3.trait.utils.configFloat( _config.gap, 0.1)
    this._outerGap =       d3.trait.utils.configFloat( _config.outerGap, this._gap)
    this._justification =  _config.justification || 'center'
    this._insets =         _config.insets || INSETS_INSET_RANGE
  }
  BarConfig.prototype = Object.create( trait.chart.Configuration.prototype)
  BarConfig.prototype.constructor = BarConfig
//  BarConfig.prototype._super = trait.chart.Configuration.prototype

  var BarConfigKeys = ['width', 'gap', 'outerGap', 'justification', 'insets']
  trait.config.utils.makeConstantAccessors( BarConfig.prototype, BarConfigKeys)

  var hey = new BarConfig( {})
  if( hey instanceof BarConfig)
    console.log( 'Found BarConfig (((((((((((((((((((((((((((((')
  else
    console.log( 'Found BarConfig NOT (((((((((((((((((((((((((((((')
  if( hey instanceof trait.chart.Configuration)
    console.log( 'Found bar ChartConfig (((((((((((((((((((((((((((((')
  else
    console.log( 'Found bar ChartConfig NOT (((((((((((((((((((((((((((((')

  /**
   *
   *  Domain                 Range
   *   5     +-----------    0
   *   4                     1
   *   3   y  ___            2
   *   2     |***|           3
   *   1     |***|           4
   *   0  y0 +-----------+   5 chartHeight
   *  -1           |***| y0  6
   *  -2           |***|     7
   *  -3            ---  y   8 chartHeight
   *
   *  y = y < 0 ? y0 : y same as Math.max( y, y0)
   *  h = y(0) - y( abs(y-y0))
   *
   * @param access
   * @param barDimensions
   * @param chartHeight
   * @param x1
   * @param y
   * @returns {{x: x, y: y, width: *, height: height}}
   */
  function barAttr(access, barDimensions, chartHeight, x1, y) {
    // NOTE: for transition from enter, use  y(0) for y: and height:
    // x is middle of bar.
    // y is top of bar. Remember, the scale range is flipped for y.
    // height - chartHeight - y OR y0 - y for stacked.

    // For pos/neg bars:
    // x - same
    // y - pos: same. neg:
    //
    return {
      x:      function(d) { return x1(access.x(d)) + barDimensions.offset; },
      y:      function(d) { return y(  Math.max(access.y(d),0) ); },
      width:  barDimensions.width,
      height: function(d) { return y(0) - y( Math.abs( access.y(d))); }
//      height: function(d) { return chartHeight - y( Math.abs( access.y(d))); }
    }
  }

  function barOffsetForJustification(justification, width, gap) {
    var offset = 0
    switch( justification ) {
      case 'left':
        offset = Math.round(gap / 2);
        break;
      case 'right':
        offset = Math.round(0 - width - gap / 2);
        break;
      default:
        // center
        offset = 0 - Math.round(width / 2);
        break;
    }
    return offset
  }

  function rangeExtentOfBarsAndOuterGapForOneSeries(data, indicesExtent, accessor, scale, width, gap, outerGap, justification) {

    var i, minValue, maxValue,
        offsetLeft = barOffsetForJustification(justification, width, gap) - outerGap,
        offsetRight = barOffsetForJustification(justification, width, gap) + width + outerGap

    if( !indicesExtent )
      return scale.range()

    i = indicesExtent[0],
      minValue = scale(accessor(data[i], i)) + offsetLeft

    i = indicesExtent[1]
    maxValue = scale(accessor(data[i], i)) + offsetRight

    return [Math.floor(minValue), Math.ceil(maxValue)]
  }

  function rangeExtentOfBarsAndOuterGap(filteredData, indicesExtents, seriesData, accessor, scale, barWidth, gap, outerGap, justification) {

    var rangeExtents = filteredData.map(function(s, i) { return rangeExtentOfBarsAndOuterGapForOneSeries(seriesData(s), indicesExtents[i], accessor, scale, barWidth, gap, outerGap, justification) })
    var min = d3.min(rangeExtents, function(extent, i) { return extent[0]})
    var max = d3.min(rangeExtents, function(extent, i) { return extent[1]})

    return [min, max]
  }


  /**
   *   Handle pathological case where outer bars are centered on scale extents (so half off chart).
   *
   *    Original        inset-range       extend-domain
   *     |     |      |             |   |               |
   *    _|_   _|_     |  ___   ___  |   |   ___   ___   |
   *   |*|*| |*|*|    | |***| |***| |   |  |***| |***|  |
   *     +-----+       ---+-----+---    +----+-----+----+
   *     1     2          1     2       0    1     2    3
   *
   *   Calculate the first and last bar outer edges plus a nice "inset" and scale that down
   *   to fit in the pixels available (current range).
   */
  function getBarDimensions(filteredData, seriesData, accessor, c, scale, chartWidth) {

    // minimum scale distance between any two adjacent bars visible within the current domain.
    var width,
        minRangeMargin = null,
        domainExtent = null,
        gap = 0,
        outerGap = 0


    if( scale.rangeBand ) {
      width = c.width === 'auto' ? scale.rangeBand() : c.width
      // gap isn't known with range bands
    } else {
      var scaleDomain = scale.domain(),
          // Find the data indices (across all series) for what's visible with current domain.
          indicesExtents = filteredData.map(function(s) { return trait.chart.utils.dataIndicesExtentForDomainExtent(seriesData(s), accessor, scaleDomain) }),
          // Get the minimum distance between bar centers across all data in all series
          minDistanceX = d3.min(filteredData, function(s, i) { return trait.chart.utils.minDistanceBetween(seriesData(s), indicesExtents[i], accessor, scale) })

      width = c.width === 'auto' ? Math.max(1, Math.floor(minDistanceX * (1 - c.gap))) : c.width
      gap = Math.round(width * c.gap)
      outerGap = Math.floor(width * c.outerGap)

      // Get the minimun distance between bar centers across all data in all series
      var rangeExtent = rangeExtentOfBarsAndOuterGap(filteredData, indicesExtents, seriesData, accessor, scale, width, gap, outerGap, c.justification),
          min = rangeExtent[0],
          max = rangeExtent[1]
      //console.log( "minDistanceX: " + minDistanceX + " width: " + width + " rangeExtent: " + rangeExtent)

      if( min < 0 || max > chartWidth ) {

        if( c.insets === INSETS_INSET_RANGE ) {
          // Careful, one bar may be within chart and one bar off chart.
          var totalWidth = Math.max(max, chartWidth) - Math.min(0, min),
              scaleItDown = chartWidth / totalWidth

          if( c.width === 'auto' ) {
            width = Math.max(1, Math.floor(width * scaleItDown))
            gap = Math.round(width * c.gap)
            outerGap = Math.floor(width * c.outerGap)
          }

          if( c.insets === INSETS_INSET_RANGE ) {
            rangeExtent = rangeExtentOfBarsAndOuterGap(filteredData, indicesExtents, seriesData, accessor, scale, width, gap, outerGap, c.justification)
            min = rangeExtent[0]
            max = rangeExtent[1]

            if( min < 0 || max > chartWidth ) {
              minRangeMargin = {}
              if( min < 0 )
                minRangeMargin.left = 1 - min
              if( max > chartWidth )
                minRangeMargin.right = max - chartWidth
            }
          }
        } else if( c.insets === INSETS_EXTEND_DOMAIN ) {
          var domainMin = min < 0 ? scale.invert(min) : scaleDomain[0] ,
              domainMax = max > chartWidth ? scale.invert(max) : scaleDomain[ scaleDomain.length - 1]
          domainExtent = [domainMin, domainMax]
        }

      }

    }

    var offset = barOffsetForJustification(c.justification, width, gap)

    //console.log( "barDimensions: width, gap, offset: " + width + ", " + gap + ", " + offset)

    return {
      width:          width,
      gap:            gap,
      outerGap:       outerGap,
      offset:         offset,
      domainExtent:   domainExtent,
      minRangeMargin: minRangeMargin
    }
  }


  /**
   *
   * Example Bar Chart Configurations
   *
   * ONE            TWO            THREE          FOUR           FIVE
   * Linear Axis    Linear Axis    Ordinal Axis   Ordinal Axis   Ordinal Grouped
   * Tick centered  Tick centered  Tick centered  Tick left      Tick left
   * x(0) == 0      x(0) > 0
   * 0 label        No 0 label                                   Label left
   * scale != data  Scale == data
   *  _________      _________      _________      _________      _______________
   * |      _  |    |      _  |    |      _  |    |      _  |    |     _   _     |
   * |  _  |*| |    |  _  |*| |    |  _  |*| |    |  _  |*| |    |  _ |~| |*| _  |
   * | |*| |*| |    | |*| |*| |    | |*| |*| |    | |*| |*| |    | |*||~| |*||~| |
   * +--+---+--+     --+---+--      --+---+--      -+---+---      -+------+------+
   * 0  1   2  3       1   2          A   B          A   B          A      B
   *
   *    ONE
   *    Linear axis with scala extents outside of data min/max.
   *    Auto bar width based on min data distance
   *    Auto extents based on domain extent and bar width. I.e. Don't want have of the first bar off the chart.
   *
   *    TWO
   *    Linear axis with scale extents equal to data min/max.
   *    Auto inset for axis so x(1) is not left edge of chart
   *    No axis labels outside of data domain. noAxisLabelsOnExtents.
   *
   *    insets: 'none' 'extend-domain', 'inset-range', {top: 0, right: 0, bottom: 0, left: 0}
   *    justification: centered, right or left
   *
   *    THREE & FOUR
   *    Oridnal axis with ticks centered or left.
   *
   * @param _super
   * @param _config
   * @returns {chartBar}
   * @private
   */
  function _chartBar(_super, _config) {
    // Store the group element here so we can have multiple bar charts in one chart.
    // A second "bar chart" might have a different y-axis, style or orientation.
    var group, series, filteredData, bars, barDimensions, lastDomainMax,
        axes = trait.config.axes( _config),
        access = trait.config.accessorsXY( _config, axes),
        x1 = _super[axes.x](),
        y = _super[axes.y](),
        dispatch = d3.dispatch('customHover'),
        c = barConfig(_config),
        focusConfig = d3.trait.focus.utils.makeConfig(_config),
        x1IsRangeBand = typeof x1.rangeBand === "function"


    function chartBar(_selection) {
      var self = chartBar

      _selection.each(function(_data) {
        var element = this,
            chartWidth = _super.chartWidth()

        filteredData = _config.seriesFilter ? _data.filter(_config.seriesFilter) : _data

        barDimensions = getBarDimensions(filteredData, access.seriesData, access.x, c, x1, chartWidth)

        if( barDimensions.minRangeMargin || barDimensions.domainExtent ) {

          if( barDimensions.minRangeMargin ) {
            self.minRangeMargin('x1', barDimensions.minRangeMargin)
          } else if( barDimensions.domainExtent ) {
            _super[axes.x +'Domain'](barDimensions.domainExtent)
          }

          barDimensions = getBarDimensions(filteredData, access.seriesData, access.x, c, x1, chartWidth)
        }

        if( !group ) {
          var classes = _config.chartClass ? "chart-bar " + _config.chartClass : 'chart-bar'
          group = this._chartGroup.append('g').classed(classes, true);
        }

        // DATA JOIN
        series = group.selectAll(".series")
          .data(filteredData)
        {
          // UPDATE

          // ENTER
          series.enter()
            .append("g")
            .attr("class", "series")
            .style("fill", self.color);
        }

        // DATA JOIN
        bars = series.selectAll("rect")
          .data(access.seriesData)

        // ENTER
        bars.enter().append('rect')
          .classed('bar', true)
          .attr(barAttr(access, barDimensions, self.chartHeight(), x1, y))
          .on('mouseover', dispatch.customHover);

        // UPDATE
        bars.transition()
          .duration(0).delay(0).ease(self.ease())
          .attr(barAttr(access, barDimensions, self.chartHeight(), x1, y));

        // EXIT
        bars.exit()
          .transition()
          .style({opacity: 0})
          .remove();

        lastDomainMax = d3.trait.utils.extentMax(x1.domain())

      })
    }

    chartBar.update = function(type, duration) {
      this._super(type, duration)

      // TODO: The x1.range() needs to be wider, so we draw the new line off the right
      // then translate it to the left with a transition animation.

      var domainMax = d3.trait.utils.extentMax(x1.domain())
      var translateX = x1(lastDomainMax) - x1(domainMax)

      // redraw the line and no transform
      series.attr("transform", null)
      bars.attr(barAttr(access, barDimensions, _super.chartHeight(), x1, y));

      bars = series.selectAll("rect")
        .data(access.seriesData)

      // ENTER
      bars.enter().append('rect')
        .classed('bar', true)
        .attr(barAttr(access, barDimensions, _super.chartHeight(), x1, y))

      bars.exit()
        .transition()
        .style({opacity: 0})
        .remove();


      // slide the bars left
      if( duration === 0 ) {
        series.attr("transform", "translate(" + translateX + ")")
      } else {

        series.transition()
          .duration(duration || _super.duration())
          .ease("linear")
          .attr("transform", "translate(" + translateX + ")")
        //.each("end", tick);
      }

      lastDomainMax = d3.trait.utils.extentMax(x1.domain())

      // Could pop the data off the front (off the left side of chart)

      return this;
    };

    chartBar.getFocusItems = function(focusPoint) {
      var foci = this._super(focusPoint),
          myFoci = trait.focus.utils.getFocusItems( filteredData, focusPoint, focusConfig, access, x1, y, chartBar.color, false) // t: isStacked

      foci = foci.concat( myFoci)
      return foci
    }


    d3.rebind(chartBar, dispatch, 'on');
//    _super.onRangeMarginChanged( 'chartBar', chartBar)

    return chartBar;

  }

  trait.chart.bar = _chartBar
  trait.chart.barConfig = function( c, base) {return new BarConfig( c, base)}
  trait.chart.barUtils = {
    barConfig:                                barConfig,
    barAttr:                                  barAttr,
    barOffsetForJustification:                barOffsetForJustification,
    rangeExtentOfBarsAndOuterGapForOneSeries: rangeExtentOfBarsAndOuterGapForOneSeries,
    rangeExtentOfBarsAndOuterGap:             rangeExtentOfBarsAndOuterGap,
    getBarDimensions:                         getBarDimensions
  }

}(d3, d3.trait));
