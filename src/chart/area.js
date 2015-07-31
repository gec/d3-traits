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

  function makeArea( stacked, access, x, y, interpolate) {
    var area = d3.svg.area()
      .interpolate( interpolate || "linear")

    if( stacked ) {
      area = area.x(function(d) { return x( access.x(d)); })
        .y0(function(d) { return y(d.y0); })
        .y1(function(d) { return y(d.y0 + access.y(d)); })

    } else {

      area = area.x(function(d) { return x(access.x(d)); })
        .y1(function(d) { return y(access.y(d)); })
      // y0 is set in _selection.each.
    }

    return area
  }



  function _chartArea(_super, _config) {
    // Store the group element here so we can have multiple area charts in one chart.
    // A second "area chart" might have a different y-axis, style or orientation.
    var group, series, filteredData, lastDomainMax, stackLayout, uniformInterpolator,
        axes = trait.config.axes( _config),
        access = trait.config.accessorsXY( _config, axes),
        x = _super[axes.x](),
        y = _super[axes.y](),
        domainPadding = d3.trait.utils.configFloat(_config.domainPadding, 0),
        yMinDomainExtentFromData = _super[axes.y + 'MinDomainExtentFromData'],
        focusConfig = d3.trait.focus.utils.makeConfig(_config),
        interpolate = _config.interpolate || "linear",
        unifyX = _config.unifyX || false,
        stacked = _config.stacked ? true : false,
        area = makeArea( stacked, access, x, y, interpolate, _super.chartHeight())


    function getSeriesData( d) {
      console.log( '******* getSeriesData( d) ' + access.seriesLabel(d))
      return trait.murts.utils.getOrElse( access.seriesData(d), x)
    }

    function makeAreaAttrD( d) {
      console.log( '******* makeAreaAttrD( d)')
      return area(getSeriesData(d));
    }

    if( unifyX) {
      uniformInterpolator = trait.layout.uniformInterpolator()
        .values( access.seriesData)
        .x( access.x)
        .y( access.y)
    }

    if( stacked ) {
      stackLayout = d3.layout.stack()
        .values( getSeriesData)          TODO: new accessors
        .y( access.y);
    }

    var dispatch = d3.dispatch('customHover');

    function chartArea(_selection) {
      var self = chartArea

      _selection.each(function(_data) {
        var element = this

        console.log( '******* begin selection.each')
        if( !group ) {
          var classes = _config.chartClass ? "chart-area " + _config.chartClass : 'chart-area'
          group = this._chartGroup.append('g').classed(classes, true);
        }

        filteredData = _config.seriesFilter ? _data.filter(_config.seriesFilter) : _data
        if( unifyX)
          filteredData = uniformInterpolator( filteredData)

        console.log( '******* before stackLayout( filteredData)')
        if( stacked) {
          if( filteredData.length > 0) {
            console.log( '******* stackLayout( filteredData)')
            stackLayout( filteredData)
          }
          access.series = access.seriesData
          access.data = access.y
          var extent = trait.utils.extentFromAreaData( filteredData, access, domainPadding)
          yMinDomainExtentFromData( extent)
        } else {
          area.y0(self.chartHeight())
        }

        // DATA JOIN
        series = group.selectAll(".series")
          .data(filteredData)

        // UPDATE
        series.selectAll("path")
          .transition()
          .duration(500)
          .attr("d", makeAreaAttrD)

        // ENTER
        series.enter()
          .append("g")
          .attr("class", "series")
          .append("path")
          .attr("class", "area")
          .attr("d", makeAreaAttrD)
          .style("fill", self.color);

        lastDomainMax = d3.trait.utils.extentMax(x.domain())
        console.log( '******* end selection.each')

      })
    }

    chartArea.update = function(type, duration) {
      this._super(type, duration)
      console.log( '------- chartArea.update begin')

      var dur = duration || _super.duration()

      if( stacked) {
        console.log( '------- chartArea.update stackLayout( filteredData)')
        stackLayout( filteredData);
        access.series = access.seriesData
        access.data = access.y
        console.log( '------- chartArea.update extentFromAreaData')
        var extent = trait.utils.extentFromAreaData( filteredData, access, domainPadding)
        console.log( '------- chartArea.update yMinDomainExtentFromData')
        yMinDomainExtentFromData( extent)
      }

      console.log( '------- chartArea.update updatePathWithTrend')
      lastDomainMax = trait.chart.utils.updatePathWithTrend(type, dur, x, series, makeAreaAttrD, lastDomainMax)

      return this;
    }

    chartArea.getFocusItems = function(focusPoint) {
      var foci = this._super(focusPoint),
          myFoci = trait.focus.utils.getFocusItems( filteredData, focusPoint, focusConfig, access, x, y, chartArea.color, stacked) // t: isStacked

      foci = foci.concat( myFoci)
      return foci
    }


    d3.rebind(chartArea, dispatch, 'on');

    return chartArea;

  }

  trait.chart.area = _chartArea

}(d3, d3.trait));
