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
      console.error( 'label.side config stacked:\'true\' should not have quotes. Ignored.')

    var c = {
          width:  config.width || 'auto',
          orient: config.orient || 'right',
          labelOffset: config.labelOffset || 10,
          gutter: config.gutter || 10,
          lineHeight: config.lineHeight || 10,
          stacked: config.stacked === true,
          formatY: config.formatY
        }

    return c
  }


  function layoutLabelsNoOverlap(data, access, getSeriesEndpoint, getY, chartRect, textHeight, padding) {

    var i,
        ends = data.map( function( s, i) { return getSeriesEndpoint(s, i)})

    function makeRect( d, i) {
      return new trait.Rect( 0, getY(d, i), 0, textHeight + padding, 0, 1) // 1 anchor on bottom.
    }
    var justDs = ends.map( function( lastOrFirst) { lastOrFirst.d.rect = makeRect( lastOrFirst.d, lastOrFirst.di); return lastOrFirst.d })

    trait.layout.vertical( justDs, chartRect)
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

    function getSeriesEndpoint( data, si) {
      var di,
          seriesData = access.seriesData( data, si)
      switch( c.orient) {
        case 'left': di = 0; break;
        case 'right': di = seriesData.length - 1; break;
        default: di = seriesData.length - 1; break;
      }
      return { d: seriesData[di], di: di}
    }
    function getCenterY( d, di) {
      var yValue = access.y(d, di),
          yPositive = y(Math.max(yValue,0)),
          height = y(0) - y( Math.abs(yValue))
      return yPositive + (height / 2.0)
    }
    function getCenterYStacked( d, di) {
      var halfHeight = (y(0) - y(d.size)) / 2.0
      return y(d.y0) + halfHeight
    }

    var getY = c.stacked ? getCenterYStacked : getCenterY

    //function getSeriesEndCenterY( data, si) {
    //  var last =  getSeriesEndpoint(data, si);
    //  return getY( last.d, last.di)
    //}
    function getSeriesEndRectY( data, si) {
      var last =  getSeriesEndpoint(data, si);
      return last.d.rect.origin.y
    }

    function getSeriesEndY( data, si) {
      var last = getSeriesEndpoint( data, si),
          value = access.y(last.d, last.di)
      if(c.formatY)
        value = c.formatY( value)
      return value
    }

    function getAttrs( chartWidth, marginLeft, c ) {
      if(c.orient === 'left') {
        // TODO: left x needs to subtract text width for value.x. Use 3 * lineHeight for now.
        var left = marginLeft - c.labelOffset - 2 * c.lineHeight
        return {
          value:  {
            x: left,
            anchor: 'start'
          },
          label: {
            x: left - c.gutter,
            anchor: 'end'
          }
        }
      } else {
        // TODO: right label.x needs to add text value width for label.x.  Use 3 * lineHeight for now.
        var right = chartWidth + marginLeft + c.labelOffset + 1 * c.lineHeight
        return {
          value: {
            x: right,
            anchor: 'end'
          },
          label: {
            x: right + c.gutter,
            anchor: 'start'
          }
        }
      }
    }

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

        layoutLabelsNoOverlap( filteredData, access, getSeriesEndpoint, getY, self.chartRect(), 10, 2)

        // DATA JOIN
        series = group.selectAll(".series")
          .data(filteredData)

        // ENTER
        var seriesEnter = series.enter()
          .append("g")
          .attr("class", "series")
          .style("fill", self.color);

        //series.append( 'rect')
        //  .attr( 'x', self.chartWidth() - 18)
        //  .attr( 'y', getSeriesEndCenterY)
        //  .attr("width", 18)
        //  .attr("height", 18)
        //  .style("fill", self.color)

        var attr = getAttrs( chartWidth, self.marginLeft(), c)

        seriesEnter.append("text")
          .attr("class", "value")
          .attr("x", attr.value.x)
          .attr("y", getSeriesEndRectY)
          .attr("dy", ".35em")
          .style("text-anchor", attr.value.anchor)
          .text(getSeriesEndY)
        seriesEnter.append("text")
          .attr("class", "label")
          .attr("x", attr.label.x)
          .attr("y", getSeriesEndRectY)
          .attr("dy", ".35em")
          .style("text-anchor", attr.label.anchor)
          .text(_config.seriesLabel)



      })
    }

    labelSide.update = function(type, duration) {
      this._super(type, duration)
      var self = labelSide

      layoutLabelsNoOverlap( filteredData, access, getSeriesEndpoint, getY, self.chartRect(), 10, 2)
      var attr = getAttrs( self.chartWidth(), self.marginLeft(), c)

      // DATA JOIN
      series = group.selectAll(".series")
        .data(filteredData)

      // EXIT
      series.exit()
        .remove()

      // ENTER
      var seriesEnter = series.enter()
        .append("g")
        .attr("class", "series")
        .style("fill", self.color);

      seriesEnter.append("text")
        .attr("class", "value")
        .attr("x", attr.value.x)
        .attr("y", getSeriesEndRectY)
        .attr("dy", ".35em")
        .style("text-anchor", attr.value.anchor)
        .text(getSeriesEndY)
      seriesEnter.append("text")
        .attr("class", "label")
        .attr("x", attr.label.x)
        .attr("y", getSeriesEndRectY)
        .attr("dy", ".35em")
        .style("text-anchor", attr.label.anchor)
        .text(_config.seriesLabel)


      // UPDATE
      // Select will apply data to the text element (selectAll does not).
      series.select('text.value')
        .attr("x", self.chartWidth() + self.marginLeft() + 5)
        .attr("y", getSeriesEndRectY)
        .text(getSeriesEndY)

      series.select('text.label')
        .attr("x", self.chartWidth() + self.marginLeft() + 15)
        .attr("y", getSeriesEndRectY)
        .text(_config.seriesLabel) // I suppose the label could change.

      return this;
    };


    return labelSide;

  }

  trait.label.side = _labelSide

}(d3, d3.trait));
