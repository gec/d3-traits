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

  var debug = false

  var INSETS_NONE = 'none',          // Don't adjust insets
      INSETS_EXTEND_DOMAIN = 'extend-domain', // Extend the domain extents so bars are completely visible
      INSETS_INSET_RANGE = 'inset-range'    // Inset the scales range so bars are completely visible


  /**
   * @param config
   * @param scale - The x-scale. If the scale is ordinal with rangeBand, then justification is left by default.
   * @returns { width:, gap:, justification, insets:, stacked:}
   */
  function barConfig(config, scale) {

    if( config.stacked === 'true')
      console.error( 'chart.bar config stacked:\'true\' should not have quotes. Ignored.')

    var justification = config.justification !== undefined ? config.justification
          : scale !== null && typeof scale === 'function' && scale.rangeBand ? 'left'
          : 'center',
        defaultGap = scale.rangeBand ? 0 : 0.1,
        gap = d3.trait.utils.configFloat(config.gap, defaultGap),
        outerGap = d3.trait.utils.configFloat(config.outerGap, gap),
        c = {
          width:         config.width || 'auto',
          // gap is percentage of bar width (0-1)
          gap:           gap,
          // outerGap can be 0 to greater than 1
          outerGap:      outerGap,
          justification: justification,
          //insets: 'none' 'extend-domain', 'inset-range', {top: 0, right: 0, bottom: 0, left: 0}
          insets:        config.insets || INSETS_INSET_RANGE,
          stacked: config.stacked === true
        }

    return c
  }


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
  function barAttr(access, barDimensions, chartHeight, x1, y, stacked) {
    // NOTE: for transition from enter, use  y(0) for y: and height:
    // x is middle of bar.
    // y is top of bar. Remember, the scale range is flipped for y.
    // height - chartHeight - y OR y0 - y for stacked.
    function xxx( d, i) {
      return x1(access.x(d,i)) + barDimensions.offset;
    }

    function getY( d, i) {
      return y(access.y(d,i))
    }
    function getYStacked( d, i) {
      var yValue = access.y(d,i)
      return yValue >= 0 ? y(d.y0 + yValue) : y(d.y0)
    }
    function getHeight( d, i) {
      return y(0) - y( Math.abs(access.y(d,i)))
    }
    function getHeightStacked( d, i) {
      return Math.abs(y(d.y0) - y(d.y0 + access.y(d,i)))
    }
    // For pos/neg bars:
    // x - same
    // y - pos: same. neg:
    //
    return {
      x:      xxx, //function(d,i) { return x1(access.x(d,i)) + barDimensions.offset; },
      y:      stacked ? getYStacked : getY,
      width:  barDimensions.width,
      height: stacked ? getHeightStacked : getHeight
//      height: function(d) { return chartHeight - y( Math.abs( access.y(d,i))); }
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

    i = indicesExtent[0]
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
  function getBarDimensions(filteredData, accessSeriesData, accessor, c, scale, chartWidth) {

    // minimum scale distance between any two adjacent bars visible within the current domain.
    var width,
        minRangeMargin = null,
        domainExtent = null,
        gap = 0,
        outerGap = 0


    if( scale.rangeBand ) {
      width = c.width === 'auto' ? scale.rangeBand() : c.width
      if( debug)
        console.log( 'getBarDimmensions scale.rangeBand width ' + width + ', domain ' + JSON.stringify(scale.domain()) + ', range ' + JSON.stringify(scale.range()))
      // gap isn't known with range bands
    } else {
      var scaleDomain = scale.domain(),
          // Find the data indices (across all series) for what's visible with current domain.
          indicesExtents = filteredData.map(function(s) { return trait.chart.utils.dataIndicesExtentForDomainExtent(accessSeriesData(s), accessor, scaleDomain) }),
          // Get the minimum distance between bar centers across all data in all series
          minDistanceX = d3.min(filteredData, function(s, i) { return trait.chart.utils.minDistanceBetween(accessSeriesData(s), indicesExtents[i], accessor, scale) })

      width = c.width === 'auto' ? Math.max(1, Math.floor(minDistanceX * (1 - c.gap))) : c.width
      gap = Math.round(width * c.gap)
      outerGap = Math.floor(width * c.outerGap)

      // Get the minimun distance between bar centers across all data in all series
      var rangeExtent = rangeExtentOfBarsAndOuterGap(filteredData, indicesExtents, accessSeriesData, accessor, scale, width, gap, outerGap, c.justification),
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
            rangeExtent = rangeExtentOfBarsAndOuterGap(filteredData, indicesExtents, accessSeriesData, accessor, scale, width, gap, outerGap, c.justification)
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

  // Modified from http://bl.ocks.org/micahstubbs/a40254b6cb914018ff81
  function stackLayoutPositiveAndNegativeValues(data, access) {
    var di = access.seriesData(data[0]).length
    while (di--) {
      var d, si, y,
          length = data.length,
          positiveBase = 0,
          negativeBase = 0

      for( si = 0; si < length; si++) {
        d = access.seriesData(data[si])
        d = d[di]
        y = access.y(d)
        d.size = Math.abs(y)
        if (y < 0) {
          d.y0 = negativeBase
          negativeBase -= d.size
        } else
        {
          d.y0 = positiveBase
          positiveBase += d.size
        }
      }
    }
    data.extent = d3.extent(
      d3.merge(
        d3.merge(
          data.map(function(e) {
            return access.seriesData(e).map(function(f) { return [f.y0,f.y0+f.size] })
          })
        )
      )
    )
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
    var group, series, filteredData, bars, barDimensions, lastDomainMax, // stackLayout,
        axes = trait.config.axes( _config),
        access = trait.config.accessorsXY( _config, axes),
        x1 = _super[axes.x](),
        y = _super[axes.y](),
        yExtendDomainKey = axes.y + 'ExtendDomain',
        dispatch = d3.dispatch('customHover'),
        c = barConfig(_config, x1),
        focusConfig = d3.trait.focus.utils.makeConfig(_config),
        x1IsRangeBand = typeof x1.rangeBand === "function",
        seriesFilter = _config.seriesFilter ? function( s) {return s.filter(_config.seriesFilter)} : function( s) { return s}


    //if( c.stacked) {
    //  stackLayout = d3.layout.stack()
    //    .values( access.seriesData)
    //    .x( access.x)
    //    .y( access.y)
    //}

    function chartBar(_selection) {
      var self = chartBar

      _selection.each(function(_data) {
        var element = this,
            chartWidth = _super.chartWidth()

        if( debug)
          console.log( 'chartBar._selection.each begin -------------------------------')

        filteredData = seriesFilter(_data)

        barDimensions = getBarDimensions(filteredData, access.seriesData, access.x, c, x1, chartWidth)

        if( barDimensions.minRangeMargin || barDimensions.domainExtent ) {

          if( barDimensions.minRangeMargin ) {
            self.minRangeMargin('x1', barDimensions.minRangeMargin)
          } else if( barDimensions.domainExtent ) {
            _super.x1Domain(barDimensions.domainExtent)
          }

          barDimensions = getBarDimensions(filteredData, access.seriesData, access.x, c, x1, chartWidth)
        }

        if( !group ) {
          var classes = _config.chartClass ? "chart-bar " + _config.chartClass : 'chart-bar'
          group = this._chartGroup.append('g').classed(classes, true);
        }

        if(c.stacked)
          stackLayoutPositiveAndNegativeValues( filteredData, access)

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

        function barColorFromSeries( d, i, seriesIndex) {
          return self.color( filteredData[seriesIndex])
        }
        // ENTER
        bars.enter().append('rect')
          .classed('bar', true)
          .attr(barAttr(access, barDimensions, self.chartHeight(), x1, y, c.stacked))
          .style("fill", barColorFromSeries)
          .on('mouseover', dispatch.customHover);

        // UPDATE
        bars.transition()
          .duration(0).delay(0).ease(self.ease())
          .attr(barAttr(access, barDimensions, self.chartHeight(), x1, y, c.stacked));

        // EXIT
        bars.exit()
          .transition()
          .style({opacity: 0})
          .remove();

        lastDomainMax = d3.trait.utils.extentMax(x1.domain())

      })
    }

    /**
     * When called from selection.each it passes us data. When called from .update, we
     * use our previous data.
     *
     * @param domain {[]} The current domain extent from the scale
     * @param data {[]} The data series or undefined.
     * @returns {Array}
     */
    chartBar[yExtendDomainKey] = function( domain, data) {
      var extent,
          methodName = 'chartArea.' + yExtendDomainKey
      domain = this._super( domain, data)

      if( debug) console.log( methodName + ': begin')

      if( data)
        filteredData = seriesFilter( data)
      if( filteredData.length === 0)
        return domain

      if( c.stacked) {
        if( debug) console.log( methodName + ': before stackLayout')
        stackLayoutPositiveAndNegativeValues( filteredData, access)
        extent = filteredData.extent
      }  else {
        if( debug) console.log( methodName + ' unstacked : before extentFromData')
        extent = trait.utils.extentFromData(filteredData, access, 0, domain)
      }

      if( trait.utils.isExtentExtended( domain, extent)) {
        domain = trait.utils.extendExtent( domain, extent)
        if( debug)
          console.log( methodName + ' updated domain:' + domain)
      }

      return domain
    }

    chartBar.update = function(type, duration) {
      this._super(type, duration)
      if( debug)
        console.log( 'chartBar.update begin ++++++++++++++++++++++++++++++++')

      var chartWidth = _super.chartWidth()

      // TODO: The x1.range() needs to be wider, so we draw the new line off the right
      // then translate it to the left with a transition animation.

      if( debug)
        console.log( 'chartBar.update x1.domain ' + JSON.stringify(x1.domain()) + ', range ' + JSON.stringify(x1.range()))
      var domainMax = d3.trait.utils.extentMax(x1.domain())
      var translateX = lastDomainMax !== undefined && domainMax !== undefined ? x1(lastDomainMax) - x1(domainMax) : 0

      // I don't think we need this because chartBar[yExtendDomainKey] calls stackLayout..
      //stackLayoutPositiveAndNegativeValues( filteredData, access)
      barDimensions = getBarDimensions(filteredData, access.seriesData, access.x, c, x1, chartWidth)

      // redraw the line and no transform
      series.attr("transform", null)

      bars = series.selectAll("rect")
        .data(access.seriesData)

      // UPDATE
      bars.attr(barAttr(access, barDimensions, _super.chartHeight(), x1, y, c.stacked));

      // ENTER
      bars.enter().append('rect')
        .classed('bar', true)
        .attr(barAttr(access, barDimensions, _super.chartHeight(), x1, y, c.stacked))

      bars.exit()
        .transition().duration(duration)
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
          myFoci = trait.focus.utils.getFocusItems( filteredData, focusPoint, focusConfig, access, x1, y, chartBar.color, c.stacked)

      foci = foci.concat( myFoci)
      return foci
    }


    d3.rebind(chartBar, dispatch, 'on');
//    _super.onRangeMarginChanged( 'chartBar', chartBar)

    return chartBar;

  }

  trait.chart.bar = _chartBar
  trait.chart.barUtils = {
    barConfig:                                barConfig,
    barAttr:                                  barAttr,
    barOffsetForJustification:                barOffsetForJustification,
    rangeExtentOfBarsAndOuterGapForOneSeries: rangeExtentOfBarsAndOuterGapForOneSeries,
    rangeExtentOfBarsAndOuterGap:             rangeExtentOfBarsAndOuterGap,
    getBarDimensions:                         getBarDimensions
  }

}(d3, d3.trait));
