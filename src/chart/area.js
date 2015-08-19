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


  function makeArea( stacked, access, x, y, interpolate) {
    var area, rangeX, rangeY0, rangeY1

    rangeY0 = function(d) { return y(d.y0); }
    rangeX = function(d) { return x( access.actualX(d)); }
    rangeY1 = stacked ? function(d) { return y(d.y0 + access.actualY(d)); }
                      : function(d) { return y(access.actualY(d)); }

    area = d3.svg.area()
      .interpolate( interpolate || "linear")
      .x(rangeX)
      .y1(rangeY1)

    if( stacked)
      area.y0( rangeY0)

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
    var group, series, filteredData, area, lastDomainMax, stackLayout, uniformInterpolator,
        axes = trait.config.axes( _config),
        access = trait.config.accessorsXY( _config, axes),
        x = _super[axes.x](),
        y = _super[axes.y](),
        yExtendDomainKey = axes.y + 'ExtendDomain',
        yExtendDomainKeyCalled = false,
        domainPadding = d3.trait.utils.configFloat(_config.domainPadding, 0),
        //yMinDomainExtentFromData = _super[axes.y + 'MinDomainExtentFromData'],
        focusConfig = d3.trait.focus.utils.makeConfig(_config),
        interpolate = _config.interpolate || "linear",
        resample = configResample( _config.resample),
        stacked = _config.stacked === true,
        extentFromAreaDataAccess = {},
        seriesFilter = _config.seriesFilter ? function( s) {return s.filter(_config.seriesFilter)} : function( s) { return s}

    if( _config.stacked === 'true')
      console.error( 'chart.area config stacked:\'true\' should not have quotes. Ignored.')

    function oneSeriesResampledData( d) {
      return d._resampledData
    }
    function oneSeriesData( d, i) {
      //if( debug) console.log( '******* oneSeriesData( d) ' + access.seriesLabel(d, i) + ' ' + JSON.stringify( trait.murts.utils.getOrElse( access.seriesData(d, i), x)))
      if( debug) console.log( '******* oneSeriesData( d) ' + access.seriesLabel(d, i))
      return trait.murts.utils.getOrElse( access.seriesData(d, i), x)
    }
    if( resample.interpolate === RESAMPLE_UNIFORM_X) {
      access.actualValues = oneSeriesResampledData
      access.actualX    = function( d) {return d.x}
      access.actualY    = function( d) {return d.y}
    } else {
      access.actualValues = oneSeriesData
      access.actualX    = access.x
      access.actualY    = access.y
    }
    extentFromAreaDataAccess.series = access.actualValues
    extentFromAreaDataAccess.data = access.actualY

    area = makeArea( stacked, access, x, y, interpolate, _super.chartHeight()),


    // Return simple array of series data.
    function getSeriesData( filteredData) {
      var data = filteredData.map( oneSeriesData)
      if( resample.interpolate === RESAMPLE_UNIFORM_X)
        data = uniformInterpolator( data)
      return data
    }

    function makeAreaAttrD( d, i) {
      if( debug) console.log( '******* makeAreaAttrD( d)')
      var data = access.actualValues( d, i)
      return area(data);
    }

    if( resample.interpolate === RESAMPLE_UNIFORM_X) {
      uniformInterpolator = trait.layout.uniformInterpolator()
        .x( access.x)
        .y( access.y)
        //.out( resample.out)  // TODO: use out. Currently, we're hiding the data from the user.
      if( resample.epsilon !== undefined)
        uniformInterpolator.epsilon( resample.epsilon)
    }

    if( stacked ) {
      stackLayout = d3.layout.stack()
        .values( access.actualValues)
        .x( access.actualX)
        .y( access.actualY)
    }

    var dispatch = d3.dispatch('customHover');

    function processFilteredData( data) {
      if( resample.interpolate === RESAMPLE_UNIFORM_X) {
        var i,
            resampledData = data.map( oneSeriesData)

        resampledData = uniformInterpolator( resampledData)
        for( i = 0; i < data.length; i++)
          data[i]._resampledData = resampledData[i]
      }
    }

    function transitionEachSeriesPath( oneSeries)  {
      var path = d3.select(this)
        .selectAll('path')
        .datum(oneSeries)
        //.transition()//.duration( 0)
          .attr("d", makeAreaAttrD)
    }

    function chartArea(_selection) {
      var self = chartArea

      _selection.each(function(_data) {
        var element = this

        if( debug) console.log( '******* begin selection.each')
        if( !group ) {
          var classes = _config.chartClass ? "chart-area " + _config.chartClass : 'chart-area'
          group = this._chartGroup.append('g').classed(classes, true);
        }

        filteredData = seriesFilter( _data)

        if( debug) console.log( '******* before stackLayout( filteredData)')
        if( stacked) {
          // This is done in chartArea[yExtendDomainKey]

          if( filteredData.length > 0 && ! yExtendDomainKeyCalled) {
            if( debug) console.log( '******* stackLayout( filteredData)')
            processFilteredData( filteredData)
            stackLayout( filteredData)
          }
          yExtendDomainKeyCalled = false
          //var extent = trait.utils.extentFromAreaData( filteredData, extentFromAreaDataAccess, domainPadding)
          ////yMinDomainExtentFromData( extent)
        } else {
          processFilteredData( filteredData)
          area.y0(self.chartHeight())
        }

        // DATA JOIN
        series = group.selectAll(".series")
          .data(filteredData)

        // UPDATE
        series.transition().duration( 500)
          .each( transitionEachSeriesPath)

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

    /**
     * When called from selection.each it passes us data. When called from .update, we
     * use our previous data.
     *
     * @param domain {[]} The current domain extent from the scale
     * @param data {[]} The data series or undefined.
     * @returns {Array}
     */
    chartArea[yExtendDomainKey] = function( domain, data) {
      domain = this._super( domain, data)
      yExtendDomainKeyCalled = true

      if( debug) console.log( 'chartArea.' + yExtendDomainKey + ': begin')
      if( ! stacked)
        return domain

      if( data)
        filteredData = seriesFilter( data)

      if( filteredData.length === 0)
        return domain

      if( debug) console.log( 'chartArea.' + yExtendDomainKey + ': before processFilteredData')
      processFilteredData( filteredData)
      if( debug) console.log( 'chartArea.' + yExtendDomainKey + ': before stackLayout')
      stackLayout( filteredData)
      var extent = trait.utils.extentFromAreaData( filteredData, extentFromAreaDataAccess, domainPadding)
      if( debug) console.log( 'chartArea.' + yExtendDomainKey + ': domain: ' + JSON.stringify(domain) + ' data extent: ' + JSON.stringify( extent))
      trait.utils.extendExtent( domain, extent)

      return domain
    }

    chartArea.update = function(type, duration) {
      this._super(type, duration)
      if( debug) console.log( '------- chartArea.update begin')

      var dur = duration || _super.duration()

      if( stacked) {
        if( debug) console.log( '------- chartArea.update stackLayout( filteredData)')
        processFilteredData( filteredData)
        if( filteredData.length > 0)
          stackLayout( filteredData);
        series = group.selectAll(".series").data( filteredData)
        if( debug) console.log( '------- chartArea.update extentFromAreaData')
        var extent = trait.utils.extentFromAreaData( filteredData, extentFromAreaDataAccess, domainPadding)
        //if( debug) console.log( '------- chartArea.update yMinDomainExtentFromData')
        //yMinDomainExtentFromData( extent)
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
