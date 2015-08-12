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

  var RESAMPLE_NONE = 'none',
      RESAMPLE_UNIFORM_X = 'uniform-x'


  function makeArea( stacked, resample, access, x, y, interpolate) {
    var area, rangeX, rangeY0, rangeY1

    rangeY0 = function(d) { return y(d.y0); }
    rangeX = resample.interpolate === RESAMPLE_NONE ? function(d) { return x( access.x(d)); } : function(d) { return x(d.x); }
    rangeY1 = stacked ? ( resample.interpolate === RESAMPLE_NONE ? function(d) { return y(d.y0 + access.y(d)); } : function(d) { return y(d.y0 + d.y); })
                     : ( resample.interpolate === RESAMPLE_NONE ? function(d) { return y(access.y(d)); } : function(d) { return y(d.y); })

    area = d3.svg.area()
      .interpolate( interpolate || "linear")
      .x(rangeX)
      .y1(rangeY1)

    if( stacked)
      area.y0( rangeY0)

    //if( stacked ) {
    //  area = area
    //    .x(rangeX)
    //    .y0( rangeY0)
    //    .y1(rangeY1)
    //
    //} else {
    //
    //  area = area
    //    .x(rangeX)
    //    .y1(rangeY1)
    //  // y0 is set in _selection.each.
    //}

    return area
  }

  function configResample( resample) {
    if( typeof( resample) === 'object') {
      return {
        interpolate: resample.interpolate || RESAMPLE_NONE,
        out: resample.out,       // TODO: not useing resample.out yet.
        epsilon: resample.epsilon
      }
    } else {
      return {
        interpolate: RESAMPLE_NONE
      }
    }
  }

  function _chartArea(_super, _config) {
    // Store the group element here so we can have multiple area charts in one chart.
    // A second "area chart" might have a different y-axis, style or orientation.
    var group, series, filteredData, seriesData, lastDomainMax, stackLayout, uniformInterpolator,
        axes = trait.config.axes( _config),
        access = trait.config.accessorsXY( _config, axes),
        x = _super[axes.x](),
        y = _super[axes.y](),
        domainPadding = d3.trait.utils.configFloat(_config.domainPadding, 0),
        yMinDomainExtentFromData = _super[axes.y + 'MinDomainExtentFromData'],
        focusConfig = d3.trait.focus.utils.makeConfig(_config),
        interpolate = _config.interpolate || "linear",
        resample = configResample( _config.resample),
        stacked = _config.stacked === true,
        area = makeArea( stacked, resample, access, x, y, interpolate, _super.chartHeight()),
        extentFromAreaDataAccess = {}

    extentFromAreaDataAccess.series = function( d) {return d}
    extentFromAreaDataAccess.data = resample.interpolate === RESAMPLE_NONE ? access.y : function( d) {return d.y}

    // For resample.interpolate === RESAMPLE_UNIFORM_X, we resample the data and use that
    // for the stacked area chart. When calling extentFromAreaData and
    // getFocusItems, we use the original series (less data). That way, the
    // library user doesn't have to provide an out() method in the config.
    // Stack layout uses the default accessor for values.


    function oneSeriesData( d) {
      if( debug) console.log( '******* oneSeriesData( d) ' + access.seriesLabel(d))
      return trait.murts.utils.getOrElse( access.seriesData(d), x)
    }

    // Return simple array of series data.
    function getSeriesData( filteredData) {
      var data = filteredData.map( oneSeriesData)
      if( resample.interpolate === RESAMPLE_UNIFORM_X)
        data = uniformInterpolator( data)
      return data
    }

    function makeAreaAttrD( d) {
      if( debug) console.log( '******* makeAreaAttrD( d)')
      //return area(getSeriesData(d));
      return area(d);
    }

    if( resample.interpolate === RESAMPLE_UNIFORM_X) {
      uniformInterpolator = trait.layout.uniformInterpolator()
        //.values( access.seriesData)
        .x( access.x)
        .y( access.y)
        //.out( resample.out)  // TODO: use out. Currently, we're hiding the data from the user.
      if( resample.epsilon !== undefined)
        uniformInterpolator.epsilon( resample.epsilon)
    }

    if( stacked ) {
      stackLayout = d3.layout.stack()

      if( resample.interpolate === RESAMPLE_NONE)
        stackLayout
          .x( access.x)
          .y( access.y);
      // else the output of resample is default accessors.
    }

    var dispatch = d3.dispatch('customHover');

    function chartArea(_selection) {
      var self = chartArea

      _selection.each(function(_data) {
        var element = this

        if( debug) console.log( '******* begin selection.each')
        if( !group ) {
          var classes = _config.chartClass ? "chart-area " + _config.chartClass : 'chart-area'
          group = this._chartGroup.append('g').classed(classes, true);
        }

        filteredData = _config.seriesFilter ? _data.filter(_config.seriesFilter) : _data
        seriesData = getSeriesData( filteredData)

        if( debug) console.log( '******* before stackLayout( seriesData)')
        if( stacked) {
          if( seriesData.length > 0) {
            if( debug) console.log( '******* stackLayout( seriesData)')
            stackLayout( seriesData)
          }
          var extent = trait.utils.extentFromAreaData( seriesData, extentFromAreaDataAccess, domainPadding)
          yMinDomainExtentFromData( extent)
        } else {
          area.y0(self.chartHeight())
        }

        // DATA JOIN
        series = group.selectAll(".series")
          .data(seriesData)

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
        if( debug) console.log( '******* end selection.each')

      })
    }

    chartArea.update = function(type, duration) {
      this._super(type, duration)
      if( debug) console.log( '------- chartArea.update begin')

      var dur = duration || _super.duration()

      if( stacked) {
        if( debug) console.log( '------- chartArea.update stackLayout( filteredData)')
        seriesData = getSeriesData( filteredData)
        stackLayout( seriesData);
        series = group.selectAll(".series").data( seriesData)
        if( debug) console.log( '------- chartArea.update extentFromAreaData')
        var extent = trait.utils.extentFromAreaData( seriesData, extentFromAreaDataAccess, domainPadding)
        if( debug) console.log( '------- chartArea.update yMinDomainExtentFromData')
        yMinDomainExtentFromData( extent)
      }

      if( debug) console.log( '------- chartArea.update updatePathWithTrend')
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
