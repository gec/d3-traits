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

  var accessDataY0 = function( d) { return d.y0}

  function minFromData(data, access, defaultValue) {
    return minFromDataDo( data, access, access.value, defaultValue)
  }
  function minFromAreaData(data, access, defaultValue) {
    return minFromDataDo( data, access, accessDataY0, defaultValue)
  }
  function minFromDataDo( data, access, accessValue, defaultValue) {
    var min = d3.min(data, function(s, i, ra) { return minFromMurtsOrArray( access.series(s, i, ra), access, accessValue) })
    if( !min )
      min = defaultValue ? defaultValue : 0
    return min
  }

  function maxFromData(data, access, defaultValue) {
    return maxFromDataDo( data, access, access.value, defaultValue)
  }

  function maxFromAreaData(data, access, defaultValue) {
    var accessY0PlusData = function( d) { return d.y0 + access.value(d)}
    return maxFromDataDo( data, access, accessY0PlusData, defaultValue)
  }
  function maxFromDataDo(data, access, accessValue, defaultValue) {
    var max = d3.max(data, function(s, i, ra) { return maxFromMurtsOrArray( access.series(s, i, ra), access, accessValue) })
    if( !max )
      max = defaultValue ? defaultValue : 0
    return max
  }

  function minFromMurtsOrArray( series, access, accessValue) {
    if( trait.murts.utils.isDataStore( series)) {
      var sampling = series.get()
      return sampling.extents === undefined ? undefined
        : access.axisChar === 'x' ? sampling.extents.x.values[0]
        : sampling.extents.y.values[0]
    } else {
      return d3.min( series, accessValue)
    }
  }
  function maxFromMurtsOrArray( series, access, accessValue) {
    if( trait.murts.utils.isDataStore( series)) {
      var sampling = series.get()
      return sampling.extents === undefined ? undefined
        : access.axisChar === 'x' ? sampling.extents.x.values[1]
        : sampling.extents.y.values[1]
    } else {
      return d3.max( series, accessValue)
    }
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
  function extentFromData(data, access, padding, defaultValue) {
    // Get array of extents for each series.
    var extents = data.map(function(s) { return extentFromMurtsOrArray(access.series(s), access) })
    return extentFromExtents( extents, padding, defaultValue)
  }

  function extentFromMurtsOrArray( series, access) {
    if( trait.murts.utils.isDataStore( series)) {
      var sampling = series.get()
      return sampling.extents === undefined ? [undefined, undefined]
        : access.axisChar === 'x' ? sampling.extents.x.values
        : sampling.extents.y.values
    } else {
      return d3.extent( series, access.value)
    }
  }

  function extentFromAreaData(data, access, padding, defaultValue) {
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

    return extentFromExtents( extents, padding, defaultValue)
  }

  /**
   *
   * @param extents Array of extents for each series.
   * @param defaultValue if no extents, use default if available.
   * @returns Extent array.
   */
  function extentFromExtents( extents, padding, defaultValue) {
    var min, max

    min = d3.min(extents, function(e) { return e[0] }) // the minimums of each extent
    max = d3.max(extents, function(e) { return e[1] }) // the maximums of each extent

    if( !min && !max )
      return defaultValue ? defaultValue : [0, 1]

    if( !(min instanceof Date) && !(max instanceof Date) && ! isNaN( min) && ! isNaN( max)) {
      if( min === max ) {
        min -= 1
        max += 1
      } else {
        var p = (max - min) * padding
        min -= p
        max += p
      }
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
