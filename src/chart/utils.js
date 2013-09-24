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

    /**
     * Update the paths with current data and scale. If trending, slide the new
     * data onto the chart from the right.
     *
     * @param type Type of update: "domain", "trend"
     * @param duration If available, the duration for the update in millisecods
     * @param scale
     * @param series The series list to update.
     * @param lastDomainMax
     * @returns domainMax
     */
    function updatePathWithTrend( type, duration, scale, series, attrD, lastDomainMax) {

        // TODO: The scale.range() needs to be wider, so we draw the new line off the right
        // then translate it to the left with a transition animation.

        var domainMax = d3.trait.utils.extentMax( scale.domain())

        // redraw the line and no transform
        if( type === "trend") {
            var translateX = scale(lastDomainMax) - scale( domainMax)

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
        } else {
            series.selectAll("path")
                .attr("d", attrD)
        }

        return domainMax
    }


    trait.chart.utils.updatePathWithTrend = updatePathWithTrend

}(d3, d3.trait));
