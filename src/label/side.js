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

  /**
   * @param config
   * @param scale - The x-scale. If the scale is ordinal with rangeBand, then justification is left by default.
   * @returns { width:, gap:, justification, insets:, stacked:}
   */
  function labelConfig(config, scale) {

    if( config.stacked === 'true')
      console.error( 'chart.bar config stacked:\'true\' should not have quotes. Ignored.')

    var defaultGap = scale.rangeBand ? 0 : 0.1,
        gap = d3.trait.utils.configFloat(config.gap, defaultGap),
        outerGap = d3.trait.utils.configFloat(config.outerGap, gap),
        c = {
          width:         config.width || 'auto',
          // gap is percentage of bar width (0-1)
          gap:           gap,
          // outerGap can be 0 to greater than 1
          outerGap:      outerGap,
          orient: config.orient || 'right',
          //insets: 'none' 'extend-domain', 'inset-range', {top: 0, right: 0, bottom: 0, left: 0}
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
//  function barAttr(access, barDimensions, chartHeight, x1, y, stacked) {
//    // NOTE: for transition from enter, use  y(0) for y: and height:
//    // x is middle of bar.
//    // y is top of bar. Remember, the scale range is flipped for y.
//    // height - chartHeight - y OR y0 - y for stacked.
//    function xxx( d, i) {
//      return x1(access.x(d,i)) + barDimensions.offset;
//    }
//
//    function getY( d, i) {
//      return y(Math.max(access.y(d,i),0))
//    }
//    function getYStacked( d, i) {
//      return y(d.y0)
//    }
//    function getHeight( d, i) {
//      return y(0) - y( Math.abs(access.y(d,i)))
//    }
//    function getHeightStacked( d, i) {
//      return y(0) - y(d.size)
//    }
//    // For pos/neg bars:
//    // x - same
//    // y - pos: same. neg:
//    //
//    return {
//      x:      xxx, //function(d,i) { return x1(access.x(d,i)) + barDimensions.offset; },
//      y:      stacked ? getYStacked : getY,
//      width:  barDimensions.width,
//      height: stacked ? getHeightStacked : getHeight //function(d,i) { return y(0) - y( Math.abs( access.y(d,i))); }
////      height: function(d) { return chartHeight - y( Math.abs( access.y(d,i))); }
//    }
//  }


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
   * @returns {labelEdge}
   * @private
   */
  function _labelSide(_super, _config) {
    // Store the group element here so we can have multiple bar charts in one chart.
    // A second "bar chart" might have a different y-axis, style or orientation.
    var group, series, filteredData, bars, barDimensions, lastDomainMax, // stackLayout,
        axes = trait.config.axes( _config),
        access = trait.config.accessorsXY( _config, axes),
        x1 = _super[axes.x](),
        y = _super[axes.y](),
        dispatch = d3.dispatch('customHover'),
        c = labelConfig(_config, x1),
        seriesFilter = _config.seriesFilter ? function( s) {return s.filter(_config.seriesFilter)} : function( s) { return s}

    function getLastDataPointInSeries( data, si) {
      var seriesData = access.seriesData( data, si),
          di = seriesData.length - 1,
          d = seriesData[di]
      return { index: di, data: d}
    }
    function getCenterYNormal( data, si) {
      var d = getLastDataPointInSeries( data, si),
          yy = access.y(d.data, d.index),
          theY = y(Math.max(yy,0)),
          height = y(0) - y( Math.abs(yy))
      return theY + (height / 2.0)
    }
    function getCenterYStacked( data, si) {
      var d = getLastDataPointInSeries( data, si),
          heightDiv2 = (y(0) - y(d.data.size)) / 2.0
      return y(d.data.y0) + heightDiv2
    }
    function getLastValueY( data, si) {
      var d = getLastDataPointInSeries( data, si)
      return access.y(d.data, d.index)
    }
    var getCenterY = c.stacked ? getCenterYStacked : getCenterYNormal

    //if( c.stacked) {
    //  stackLayout = d3.layout.stack()
    //    .values( access.seriesData)
    //    .x( access.x)
    //    .y( access.y)
    //}

    function labelSide(_selection) {
      var self = labelSide

      _selection.each(function(_data) {
        var element = this,
            chartWidth = _super.chartWidth()

        filteredData = seriesFilter(_data)

        if( !group ) {
          var classes = _config.labelClass ? "label-edge " + _config.labelClass : 'label-edge'
          group = this._container.append('g').classed(classes, true);
        }

        // DATA JOIN
        series = group.selectAll(".series")
          .data(filteredData)
        {
          // UPDATE

          // ENTER
          var seriesEnter = series.enter()
            .append("g")
            .attr("class", "series")
            .style("fill", self.color);

          //series.append( 'rect')
          //  .attr( 'x', self.chartWidth() - 18)
          //  .attr( 'y', getCenterY)
          //  .attr("width", 18)
          //  .attr("height", 18)
          //  .style("fill", self.color)

          seriesEnter.append("text")
            .attr("x", self.chartWidth() + self.marginLeft() + 5)
            .attr("y", getCenterY)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(getLastValueY)
          seriesEnter.append("text")
            .attr("x", self.chartWidth() + self.marginLeft() + 15)
            .attr("y", getCenterY)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(_config.seriesLabel)


        }

      })
    }

    //labelSide.update = function(type, duration) {
    //  this._super(type, duration)
    //
    //  // TODO: The x1.range() needs to be wider, so we draw the new line off the right
    //  // then translate it to the left with a transition animation.
    //
    //  var domainMax = d3.trait.utils.extentMax(x1.domain())
    //  var translateX = x1(lastDomainMax) - x1(domainMax)
    //
    //  // redraw the line and no transform
    //  series.attr("transform", null)
    //  bars.attr(barAttr(access, barDimensions, _super.chartHeight(), x1, y, c.stacked));
    //
    //  bars = series.selectAll("rect")
    //    .data(access.seriesData)
    //
    //  // ENTER
    //  bars.enter().append('rect')
    //    .classed('bar', true)
    //    .attr(barAttr(access, barDimensions, _super.chartHeight(), x1, y, c.stacked))
    //
    //  bars.exit()
    //    .transition()
    //    .style({opacity: 0})
    //    .remove();
    //
    //
    //  // slide the bars left
    //  if( duration === 0 ) {
    //    series.attr("transform", "translate(" + translateX + ")")
    //  } else {
    //
    //    series.transition()
    //      .duration(duration || _super.duration())
    //      .ease("linear")
    //      .attr("transform", "translate(" + translateX + ")")
    //    //.each("end", tick);
    //  }
    //
    //  lastDomainMax = d3.trait.utils.extentMax(x1.domain())
    //
    //  // Could pop the data off the front (off the left side of chart)
    //
    //  return this;
    //};


    return labelSide;

  }

  trait.label.side = _labelSide

}(d3, d3.trait));
