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
        x1 = _super[axes.x](),
        y = _super[axes.y](),
        focusConfig = d3.trait.focus.utils.makeConfig(_config),
        line = d3.svg.line()
          .interpolate(_config.interpolate || "linear")
          .x(function(d) { return x1(access.x(d)); })
          .y(function(d) { return y(access.y(d)); });

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
          .attr("d", function(d) {
            return line(getDataInRange(_config.seriesData(d), x1, _config.x1));
          })

        // ENTER
        series.enter()
          .append("g")
          .attr("class", "series")
          .append("path")
          .attr("class", "line")
          .attr("d", function(d) { return line(_config.seriesData(d)); })
          .style("stroke", self.color);

        // EXIT
        series.exit()
          .transition()
          .style({opacity: 0})
          .remove();

        // Leave lastDomainMax == undefined if chart starts with no data.

        if( d3.trait.utils.isData(filteredData, _config.seriesData) )
          lastDomainMax = d3.trait.utils.extentMax(x1.domain())
      })
    }

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

    function getDataInRange(data, scale, access) {
      var domainMin, domainMax,
        indexMin, indexMax,
        endIndex = data.length - 1,
        range = scale.range(),
        rangeMax = d3.trait.utils.extentMax(range)

      domainMin = scale.invert(range[0])
      domainMax = scale.invert(rangeMax)

      indexMin = findClosestIndex(data, access, domainMin, -1)
      indexMax = findClosestIndex(data, access, domainMax, 1, indexMin, endIndex)
      indexMax++ // because slice doesn't include max

      return data.slice(indexMin, indexMax)
    }

    chartLine.update = function(type, duration) {
      this._super(type, duration)

      var dur = duration || _super.duration()
      var attrD = function(d) {
        return line(getDataInRange(_config.seriesData(d), x1, _config.x1));
      }
      lastDomainMax = trait.chart.utils.updatePathWithTrend(type, dur, x1, series, attrD, lastDomainMax)

      // Could pop the data off the front (off the left side of chart)

      return this;
    }

    chartLine.getFocusItems = function(focusPoint) {
      var foci = this._super(focusPoint),
          myFoci = trait.focus.utils.getFocusItems( filteredData, focusPoint, focusConfig, access, x1, y, chartLine.color)

      foci = foci.concat( myFoci)
      return foci
    }

    return chartLine;

  }

trait.chart.line = _chartLine

}(d3, d3.trait));
