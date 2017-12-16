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
    extents = data.map(function(s, i) {
      var series = access.series(s, i)
      var extent = [
        d3.min( series, function( d, ii) { return d.y0 + access.data(d, ii)}),
        d3.max( series, function( d, ii) { return d.y0 + access.data(d, ii)})
      ]
      return extent
    })

    return extentFromExtents( extents, padding, defaultValue)
  }

  /**
   *
   * @param {array} extents Array of extents for each series.
   * @param {array} defaultValue if no extents, use default if available.
   * @returns {array} Extent array.
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
    if( newExtent === undefined) {
      return false
    } else if( currentExtent === undefined) {
      return true
    } else {
      var currentMin = currentExtent[0],
          currentMax = trait.utils.extentMax( currentExtent),
          newMin = newExtent[0],
          newMax = trait.utils.extentMax( newExtent)
      return (currentMin === undefined && newMin !== undefined) ||
          (currentMax === undefined && newMax !== undefined ) ||
          newMin < currentMin ||
          newMax > currentMax
    }
  }

  // TODO: Update to functional (i.e. remove side effect of updating parameter)
  function extendExtent( currentExtent, newExtent) {
    if( newExtent === undefined || newExtent.length === 0)
      return currentExtent

    if( currentExtent === undefined || currentExtent.length === 0)
      return newExtent

    var currentMin = currentExtent[0],
        currentMax = trait.utils.extentMax( currentExtent),
        newMin = newExtent[0],
        newMax = trait.utils.extentMax( newExtent)

    if( currentMin === undefined || newMin < currentMin) {
      currentExtent[0] = newMin
    }
    if( currentMax === undefined || newMax > currentMax) {
      var maxIndex = Math.max(1, currentExtent.length-1)
      currentExtent[ maxIndex] = newMax
    }
    return currentExtent
  }


  var log10  = typeof Math.log10 === 'function' ? Math.log10 : function(x) {return Math.log(x) * Math.LOG10E}

  function roundToNearest(number, nearest){
    var absoluteNearest = Math.abs(nearest),
        nearestSameSign = number >= 0 ? absoluteNearest : - absoluteNearest
    return nearestSameSign * Math.round(number/nearestSameSign)
  }

  /**
   * Return extent with nice minimum.
   * @param [[]} extent array
   * @return {[]} extent nice extent
   */
  function niceExtent(extent) {
    var niceFraction1To10, niceFractionOfExtent, niceMin,
        min = trait.utils.extentMin( extent),
        max = trait.utils.extentMax( extent)

    if( min === 0 || max - min === 0)
      return extent

    var ext = (max - min) * 1.2, // padding of 0.2
        exponent = Math.floor(log10(ext)),
        fractionOf10 = ext / Math.pow(10,exponent) // between 1 and 10

    niceFraction1To10 = fractionOf10 <= 0.9 ? 1
        : fractionOf10 <= 1.7 ? 2
        : fractionOf10 <= 4 ? 5
        : 10
    niceFractionOfExtent = niceFraction1To10 * Math.pow(10,exponent) / 10.0
    niceMin = roundToNearest( min - niceFractionOfExtent, niceFractionOfExtent)
    return [niceMin, max]
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
  trait.utils.niceExtent = niceExtent

}(d3, d3.trait));
