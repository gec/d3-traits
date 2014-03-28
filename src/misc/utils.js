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

    function minFromData( data, access, defaultValue) {
        var min = d3.min( data, function(s) { return d3.min( access.series(s), access.data); })
        if( ! min)
            min = defaultValue ? defaultValue : 0
        return min
    }

    function maxFromData( data, access, defaultValue) {
        var max = d3.max( data, function(s) { return d3.max( access.series(s), access.data); })
        if( ! max)
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
    function extentFromData( data, access, defaultValue) {
        var extents, min, max

        // Get array of extents for each series.
        extents = data.map( function(s) { return d3.extent( access.series(s), access.data)})
        min = d3.min( extents, function(e) { return e[0] }) // the minimums of each extent
        max = d3.max( extents, function(e) { return e[1] }) // the maximums of each extent

        if( ! min && ! max)
            return defaultValue ? defaultValue : [0,1]

        if( min === max) {
            min -= 1
            max += 1
        }
        return [min, max]
    }

    if( ! trait.utils)
        trait.utils = {}

    trait.utils.minFromData = minFromData
    trait.utils.maxFromData = maxFromData
    trait.utils.extentFromData = extentFromData

}(d3, d3.trait));
