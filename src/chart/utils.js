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

    function rangeTranslate(  lastDomainMax, domain, scale) {
      if( ! lastDomainMax)
        return 0

      //   |<-------- range ------->|
      //      |<-- visible range -->|

      var domainMax = d3.trait.utils.extentMax( domain)
      var domainMin = d3.trait.utils.extentMin( domain)

      var lastRangeMax =  scale(lastDomainMax)
      var rangeMin = scale( domainMin)
      if( lastRangeMax < rangeMin)
        return 0
      else
        return lastRangeMax - scale( domainMax)
    }

    function simplePathRedraw( series, attrD) {
      series.selectAll("path")
        .attr("d", attrD)
        .attr("transform", null)
    }

    /**
     * Update the paths with current data and scale. If trending, slide the new
     * data onto the chart from the right.
     *
     * @param type Type of update: "domain", "trend"
     * @param duration If available, the duration for the update in millisecods
     * @param scale
     * @param series The series list to update.
     * @param lastDomainMax Domain max from last trend update. Can be undefined if chart starts with no data.
     * @returns domainMax
     */
    function updatePathWithTrend( type, duration, scale, series, attrD, lastDomainMax) {

        // TODO: The scale.range() needs to be wider, so we draw the new line off the right
        // then translate it to the left with a transition animation.

        var domain = scale.domain()
        var domainMax = d3.trait.utils.extentMax( domain)

        if( type === "trend") {

            var translateX = rangeTranslate( lastDomainMax, domain, scale)

            if( translateX !== 0) {

              series.attr( "transform", null)
              series.selectAll("path")
                  .attr("d", attrD)

              // slide the line left
              if( duration === 0 || !duration) {
                  series.attr("transform", "translate(" + translateX + ")")
              } else {
                  series.transition()
                      .duration( duration)
                      .ease("linear")
                      .attr("transform", "translate(" + translateX + ")")
                  //.each("end", tick);
              }
            }  else {
              simplePathRedraw( series, attrD)
            }

        } else {
          simplePathRedraw( series, attrD)
        }

        return domainMax
    }

    function configFocus( config) {
        var focus = {
            distance: 14,
            axis: null
        }
        if( config.focus) {
            focus.distance = d3.trait.utils.configFloat( config.focus.distance, focus.distance )
            focus.axis = config.focus.axis
        }
        return focus
    }

    /**
     * Return the minimum distance between each data point that is within
     * the indicesExtent. The indicesExtent is typically the data indices
     * that are currently visible on the chart. The distance used is the
     * scale's range, not the domain space.
     *
     * @param data          Array of data.
     * @param indicesExtent Extent of indices used to calculate minimum distance.
     * @param accessor      Data accessor
     * @param scale         Scale for data
     * @returns Minimum distance as a number
     */
    function minDistanceBetween( data, indicesExtent, accessor, scale) {
        var range = scale.range(), //Number.MAX_VALUE,
            min = range[range.length-1] - range[0],
            length = data.length

        if( length < 2 || indicesExtent.length < 2)
            return min

        var i = indicesExtent[0],
            lastIndex = Math.min( length-1, indicesExtent[1])

        if( i < 0 || i >= length)
            return min

        var current,
            last = scale( accessor( data[i], i))

        i++
        for( ; i <= lastIndex; i++) {
            current = scale( accessor( data[i], i))
            min = Math.min( min, current-last)
            last = current
        }

        return min
    }

    /**
     * Return the extent of indices withing the domain extent. This is typicaly
     * used to return the indices that are currently visible on the chart.
     *
     * @param data         Array of data
     * @param accessor     Data accessor
     * @param domainExtent Domain extent. Array with 0 being min and 1 being max.
     * @returns Indices extent with array 0 being first and array 1 being last.
     */
    function dataIndicesExtentForDomainExtent( data, accessor, domainExtent) {
        if( data.length <= 0)
            return null

        var min = d3.trait.utils.extentMin( domainExtent),
            max = d3.trait.utils.extentMax( domainExtent )

        var bisector = d3.bisector( accessor ),
            biLeft = bisector.left,
            biRight = bisector.right,
            firstIndex = biLeft( data, min ),
            lastIndexPlusOne = biRight( data, max)

        //return {first: firstIndex, lastPlusOne: lastIndexPlusOne}
        return [firstIndex, lastIndexPlusOne-1]
    }



    trait.chart.utils.updatePathWithTrend = updatePathWithTrend
    trait.chart.utils.configFocus = configFocus
    trait.chart.utils.minDistanceBetween = minDistanceBetween
    trait.chart.utils.dataIndicesExtentForDomainExtent = dataIndicesExtentForDomainExtent


}(d3, d3.trait));
