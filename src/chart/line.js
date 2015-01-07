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

  function _chartLine(_super, _config) {
    // Store the group element here so we can have multiple line charts in one chart.
    // A second "line chart" might have a different y-axis, style or orientation.
    var group, series, filteredData, lastDomainMax,
        axes = trait.config.axes( _config),
        access = trait.config.accessorsXY( _config, axes),
        x = _super[axes.x](),
        y = _super[axes.y](),
        focusConfig = d3.trait.focus.utils.makeConfig(_config),
        interpolate = _config.interpolate || 'linear',
        trend = _config.trend && ( interpolate === 'linear' || interpolate === 'step-after' ),
        line = d3.svg.line()
          .interpolate( interpolate)
          .x(function(d) { return x(access.x(d)); })
          .y(function(d) { return y(access.y(d)); });

    function findClosestIndex(data, access, target, direction, minIndex, maxIndex) {

      var index, d

      if( minIndex === undefined )
        minIndex = 0
      if( maxIndex === undefined )
        maxIndex = data.length - 1

      while( minIndex <= maxIndex ) {
        index = Math.floor((minIndex + maxIndex) / 2);
        d = access(data[index]);

        //   t   t
        // 2   4   6   8
        // ^   d    ^
        if( d < target ) {
          minIndex = index + 1;
        } else if( d > target ) {
          maxIndex = index - 1;
        } else {
          return index;
        }
      }

      if( direction < 0 )
        return minIndex + direction < 0 ? 0 : minIndex + direction
      else
        return maxIndex + direction >= data.length ? data.length - 1 : maxIndex + direction
    }

//    function getDataInRange(seriesData, scale, access) {
//      var indexMin, indexMax,
//          range = scale.range(),
//          rangeMax = d3.trait.utils.extentMax(range),
//          domainMin = scale.invert(range[0]),
//          domainMax = scale.invert(rangeMax)
//
//      seriesData = trait.murts.utils.getOrElse( seriesData, scale)
//
//      indexMin = findClosestIndex(seriesData, access, domainMin, -1)
//      indexMax = findClosestIndex(seriesData, access, domainMax, 1, indexMin, seriesData.length - 1)
//      indexMax++ // because slice doesn't include max
//
//      return seriesData.slice(indexMin, indexMax)
//    }

    function makeLine( d) {

      var indexMin, indexMax, indexMaxIsTheLastPoint, attrD,
          range = x.range(),
          rangeMax = d3.trait.utils.extentMax(range),
          domainMin = x.invert ? x.invert(range[0]) : 0,  // ordinal scale doesn't have invert.
          domainMax = x.invert ? x.invert(rangeMax) : range.length - 1,
          seriesData = _config.seriesData(d)

      seriesData = trait.murts.utils.getOrElse( seriesData, x)

      indexMin = findClosestIndex(seriesData, access.x, domainMin, -1)
      indexMax = findClosestIndex(seriesData, access.x, domainMax, 1, indexMin, seriesData.length - 1)
      indexMaxIsTheLastPoint = indexMax === seriesData.length - 1

      if( indexMin > 0 || ! indexMaxIsTheLastPoint) {
        seriesData = seriesData.slice(indexMin, indexMax + 1) // because slice doesn't include max
      }

      attrD = line( seriesData)

      if( attrD && indexMaxIsTheLastPoint && trend) {
        // Extend the line out to the right edge of the chart.
        var rightExtent = rangeMax * 1.1
        rightExtent.toFixed()
        attrD += 'H' + rightExtent
      }

      return attrD
    }

    function chartLine(_selection) {
      var self = chartLine

      _selection.each(function(_data) {

        if( !group ) {
          var classes = _config.chartClass ? "chart-line " + _config.chartClass : 'chart-line'
          group = this._chartGroup.append('g').classed(classes, true);
        }

        filteredData = _config.seriesFilter ? _data.filter(_config.seriesFilter) : _data

        // DATA JOIN
        series = group.selectAll(".series")
          .data(filteredData)

        // UPDATE
        series.selectAll("path")
          .transition()
          .duration(500)
          .attr("d", makeLine)

        // ENTER
        series.enter()
          .append("g")
          .attr("class", "series")
          .append("path")
          .attr("class", "line")
          .attr("d", makeLine)
          .style("stroke", self.color);

        // EXIT
        series.exit()
          .transition()
          .style({opacity: 0})
          .remove();

        // Leave lastDomainMax == undefined if chart starts with no data.

        if( d3.trait.utils.isData(filteredData, _config.seriesData) )
          lastDomainMax = d3.trait.utils.extentMax(x.domain())
      })
    }

    chartLine.update = function(type, duration) {
      this._super(type, duration)

      var dur = duration === undefined ? _super.duration() : duration
      lastDomainMax = trait.chart.utils.updatePathWithTrend(type, dur, x, series, makeLine, lastDomainMax)

      // Could pop the data off the front (off the left side of chart)

      return this;
    }

    chartLine.getFocusItems = function(focusPoint) {
      var foci = this._super(focusPoint),
          myFoci = trait.focus.utils.getFocusItems( filteredData, focusPoint, focusConfig, access, x, y, chartLine.color)

      foci = foci.concat( myFoci)
      return foci
    }

    return chartLine;

  }

trait.chart.line = _chartLine

}(d3, d3.trait));
