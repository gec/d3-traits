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

  function minFromData(data, access, defaultValue) {
    return minFromDataDo( data, access.series, access.data, defaultValue)
  }
  function minFromAreaData(data, access, defaultValue) {
    return minFromDataDo( data, access.series, function( d) { return d.y0}, defaultValue)
  }
  function minFromDataDo( data, accessSeries, accessData, defaultValue) {
    var min = d3.min(data, function(s) { return d3.min(accessSeries(s), accessData); })
    if( !min )
      min = defaultValue ? defaultValue : 0
    return min
  }

  function maxFromData(data, access, defaultValue) {
    return maxFromDataDo( data, access.series, access.data, defaultValue)
  }

  function maxFromAreaData(data, access, defaultValue) {
    return maxFromDataDo( data, access.series, function( d) { return d.y0 + access.data(d)}, defaultValue)
  }
  function maxFromDataDo(data, accessSeries, accessData, defaultValue) {
    var max = d3.max(data, function(s) { return d3.max(accessSeries(s), accessData); })
    if( !max )
      max = defaultValue ? defaultValue : 0
    return max
  }


  /**
   * Return the extent for all data in all series, example: [min, max] .
   * If the data in each series is empty, return the supplied default or [0,1]
   * if min === max, return [min-1, max+1]
   *
   * @param data     Multiple series of data
   * @param access   Accessors {series: function, data: function}
   * @param defaultValue A default in case there is no data otherwise [0,1] is returned
   * @returns  The extent of all data in an array of the form [min,max]
   */
  function extentFromData(data, access, defaultValue) {
    var extents, min, max

    // Get array of extents for each series.
    extents = data.map(function(s) { return d3.extent( access.series(s), access.data) })
    return extentFromData2( extents, defaultValue)
  }

  function extentFromAreaData(data, access, defaultValue) {
    var extents, min, max

    // Get array of extents for each series.
    extents = data.map(function(s) {
      var series = access.series(s)
      var extent = [
        d3.min( series, function( d) { return d.y0}),
        d3.max( series, function( d) { return d.y0 + access.data(d)})
      ]
      return extent
    })

    return extentFromData2( extents, defaultValue)
  }

  /**
   *
   * @param extents Array of extents for each series.
   * @param defaultValue if no extents, use default if available.
   * @returns Extent array.
   */
  function extentFromData2( extents, defaultValue) {
    var min, max

    min = d3.min(extents, function(e) { return e[0] }) // the minimums of each extent
    max = d3.max(extents, function(e) { return e[1] }) // the maximums of each extent

    if( !min && !max )
      return defaultValue ? defaultValue : [0, 1]

    if( min === max ) {
      min -= 1
      max += 1
    }
    return [min, max]
  }

  /**
   * Is new extend greater than current extent?
   * @param currentExtent
   * @param newExtent
   * @returns {boolean}
   */
  function isExtentExtended( currentExtent, newExtent) {
    if( ! currentExtent || currentExtent.length < 2) {
      return true
    } else {
      return newExtent[0] < currentExtent[0] ||
        trait.utils.extentMax( newExtent) > trait.utils.extentMax( currentExtent)
    }
  }

  function extendExtent( currentExtent, newExtent) {
    if( ! newExtent || newExtent.length < 2)
      return currentExtent

    if( ! currentExtent || currentExtent.length < 2)
      return newExtent

    if( newExtent[0] < currentExtent[0]) {
      currentExtent[0] = newExtent[0]
    }
    if( trait.utils.extentMax( newExtent) > trait.utils.extentMax( currentExtent)) {
      currentExtent[ currentExtent.length-1] = trait.utils.extentMax( newExtent)
    }
    return currentExtent
  }


  if( !trait.utils )
    trait.utils = {}

  trait.utils.minFromData = minFromData
  trait.utils.maxFromData = maxFromData
  trait.utils.minFromAreaData = minFromAreaData
  trait.utils.maxFromAreaData = maxFromAreaData
  trait.utils.extentFromData = extentFromData
  trait.utils.extentFromAreaData = extentFromAreaData
  trait.utils.isExtentExtended = isExtentExtended
  trait.utils.extendExtent = extendExtent

}(d3, d3.trait));
