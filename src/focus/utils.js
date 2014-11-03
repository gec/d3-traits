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

  function makeConfig(config) {
    var focus = {
      distance: 14,
      axis:     null
    }
    if( config.focus ) {
      focus.distance = d3.trait.utils.configFloat(config.focus.distance, focus.distance)
      focus.axis = config.focus.axis
    }
    return focus
  }


  function getRangePointNormal( item, access, x, y) {
    return new d3.trait.Point(x(access.x(item)), y(access.y(item)))
  }

  function getRangePointStacked( item, access, x, y) {
    return new d3.trait.Point(x(access.x(item)), y(item.y0 + access.y(item)))
  }

  function getFocusItem(series, data, index, access, x, y, getRangePoint, focusPoint) {
    var dist, distX,
        item = data[index],
        rangePoint = getRangePoint( item, access, x, y)
    dist = rangePoint.distance( focusPoint)
    distX = rangePoint.distanceX( focusPoint)
    return {
      series: series,
      index: index,
      item: item,
      point: rangePoint,
      distance: dist,
      distanceX: distX
    }
  }

  function withinFocusDistance( found, focusConfig) {
    var distance = focusConfig.axis === 'x' ? found.distanceX : found.distance
    return distance <= focusConfig.distance
  }
  /**
   *
   * @param data Series data to search for focus points.
   * @param focusPoint Find data closest to this point.
   * @param focusConfig From trait.focus.utils.makeConfig
   * @param access x, y, seriesData
   * @param color  function( series) returns color for series.
   * @param isDataStacked  T: This is an area plot with access.y(d) and d.y0. F: Use access.y(d)
   * @returns Array of focus objects
   */
  function getFocusItems( data, focusPoint, focusConfig, access, x, y, color, isDataStacked) {
    var foci = [],
        targetDomain = new d3.trait.Point(x.invert(focusPoint.x), y.invert(focusPoint.y)),
        bisectLeft = d3.bisector(access.x).left,
        getRangePoint = isDataStacked ? getRangePointStacked : getRangePointNormal

    data.forEach(function(series, seriesIndex, array) {
      var found, alterIndex,
          data = trait.murts.utils.getOrElse( access.seriesData(series), x),
          // search the domain for the closest point in x
          index = bisectLeft(data, targetDomain.x)

      if( index >= data.length )
        index = data.length - 1
      found = getFocusItem(series, data, index, access, x, y, getRangePoint, focusPoint)

      alterIndex = found.index - 1
      if( alterIndex >= 0 ) {
        var alter = getFocusItem(series, data, alterIndex, access, x, y, getRangePoint, focusPoint)
        // console.log( "found x=" + access.x( found.item) + " y=" + access.y( found.item) + " d=" + found.distance + "  " + targetDomain.x + " " + targetDomain.y)
        // console.log( "alter x=" + access.x( alter.item) + " y=" + access.y( alter.item) + " d=" + alter.distance + "  " + targetDomain.x + " " + targetDomain.y)
        if( focusConfig.axis === 'x' ) {
          if( alter.distanceX < found.distanceX )
            found = alter
        } else {
          if( alter.distance < found.distance )
            found = alter
        }
      }

      if( withinFocusDistance( found, focusConfig) ) {
        found.color = color(series)
        foci.push(found)
      }
    })

    return foci
  }


  if( ! trait.focus)
    trait.focus = {}

  trait.focus.utils = {
    makeConfig: makeConfig,
    getFocusItems: getFocusItems
  }


}(d3, d3.trait));
