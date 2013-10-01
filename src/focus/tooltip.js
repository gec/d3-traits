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

    function l( x, y) { return 'l' + x + ',' + y }
    function q( x1, y1, x, y) { return 'q' + x1 + ',' + y1 + ' ' + x + ',' + y }
    function m( x, y) { return 'm' + x + ',' + y }

    // // call-out half size (half width and half height)
    function getCalloutPointerHalfHeight( h) {
        return Math.max( h * 0.16, 6)
    }

    /**
     * Return a path for a call-out tooltip (has a little pointer pointing to data).
     * @param w Width
     * @param h Height
     * @param r Radius for rounded corners
     * @param cp2  Half of the call-out point's width and height
     * @param anchor  Distinguishes left or right.
     * @param offsetY  Nudge the call-out point up or down to point to original focus (before layout adjustments)
     * @returns {string}
     */
    function getCalloutPath( w, h, r, cp2, anchor, offsetY) {
        // Start at the left on the callout point and go clockwise
        //
        //<path d="m10,0 L90,0 Q100,0 100,10 L100,90" fill="none" stroke="red"/>
        //
        var dx = anchor.x < 0.5 ? 1 : -1,
            ht = Math.floor( h/2 - cp2 - r ),// h top (i.e. callout to radius)
            ih = ht * 2 + cp2*2,// inner height (i.e. height - radii)
            iw = Math.floor( w - r - r ), // inner width
            p = m( 0, 0 + offsetY) +
                l( dx*cp2*2, -cp2 - offsetY) +
                l( 0, -ht) +
                q( 0, -r, dx*r, -r) +  // top-left corner
                l( dx*iw, 0) +
                q( dx*r, 0, dx*r, r) + // top-right corner
                l( 0, ih) +
                q( 0, r, dx*-r, r) + // bottom-right corner
                l( dx*-iw, 0) +
                q( dx*-r, 0, dx*-r, -r) + // bottom-left corner
                l( 0, -ht) +
                'z'  // close path

        return p
    }

    var formatDate = d3.time.format("%Y-%m-%d");

    function markTooltipsForRemoval( tooltips) {
        tooltips.forEach( function( item) {
            if( item)
                item.remove = true
        })
    }
    function removeUnusedTooltips( tooltips) {
        tooltips.forEach( function( item, index) {
            if( item && item.remove) {
                item.group.remove()
                tooltips[index] = null
            }
        })
    }
    function removeAllTooltips( cache) {

        delete cache.lastFoci;

        if( ! cache.tooltips)
            return
        cache.tooltips.forEach( function( item, index) {
            if( item) {
                item.group.remove()
                cache.tooltips[index] = null
            }
        })
    }
    function fociAreTheSame( last, current) {
        if( !last || last.length !== current.length)
            return false

        var l, c,
            index = last.length - 1

        for( ; index >=0; index--) {
            l = last[index]
            c = current[index]
            if( l.index !== c.index || l.point.x !== c.point.x || l.point.y !== c.point.y)
                return false
        }
        return true
    }

    function mouseNotOnChart( mousePoint, chartWidth, chartHeight) {
        return  mousePoint[0] < 0 ||
                mousePoint[0] > chartWidth ||
                mousePoint[1] < 0 ||
                mousePoint[1] > chartHeight

    }

    /**
     * Tooltip will call focus super. Any charts traits can return a list of items that need tooltips.
     * For example a line chart with two series can return two times.
     *
     * Configure
     *  Closest x & y
     *  Closest in x
     *  Point within distance. Distance can be in domain or range.
     *
     *  distance: 6  -- x & y range
     *  axis: 'x'
     */
    function _tooltip( _super, _config, _id) {

        var distance = d3.trait.utils.configFloat( _config.distance, 14)
        var axis = _config.axis
        var radius = 4
        var margin = 3

        function tooltip( _selection) {
            var self = tooltip

            _selection.each(function(_data) {
                var element = this
                var cache = d3.trait.utils.getTraitCache( element, _id)

                cache.tooltips = _data.map( function(d) { return null})

                this._svg.on("mouseout", function() {
                    var mousePoint = d3.mouse( element._chartGroup.node())
                    if( mouseNotOnChart( mousePoint,  self.chartWidth(), self.chartHeight()) ) {
                        removeAllTooltips( cache)
                    }
                })

                this._svg.on("mousemove", function() {
                    var mousePoint = d3.mouse( element._chartGroup.node())

                    if( mouseNotOnChart( mousePoint,  self.chartWidth(), self.chartHeight()) ) {
                        removeAllTooltips( cache)
                        return
                    }

                    var focusPoint = new d3.trait.Point( mousePoint[0], mousePoint[1] ),
                        anchorMidY = new d3.trait.Point( 0, 0.5 )

                    var foci =self.focus.call( element, focusPoint, distance, axis)

                    if( foci.length <= 0) {
                        removeAllTooltips( cache)
                        return
                    }
                    if( fociAreTheSame( cache.lastFoci, foci))
                        return

                    markTooltipsForRemoval( cache.tooltips)

                    foci.forEach( function( item, index, array) {
                        //console.log( "foci: " + item.point.x + " distance: " + item.distance)

                        var seriesIndex = _data.indexOf( item.series),
                            ttip = cache.tooltips[ seriesIndex],
                            formattedText = formatDate( _config.x1( item.item)) + " " + _config.y1(item.item)

                        if( ! ttip) {
                            ttip = { newby: true}

                            ttip.group = element._container.append('g')
                                .attr({
                                    'id': 'tooltip',
                                    'opacity': 0
                                });

                            ttip.path = ttip.group.append('path')
                                .attr('fill', 'darkgray')

                            ttip.text = ttip.group.append('text')
                                .attr({
                                    'font-family': 'monospace',
                                    'font-size': 10,
                                    'fill': 'black',
                                    'text-rendering': 'geometric-precision'
                                })

                            cache.tooltips[ seriesIndex] = ttip
                        }

                        ttip.remove = false

                        ttip.text.text( formattedText );
                        var bbox = ttip.text.node().getBBox()
                        bbox.height = bbox.height * 2 + margin * 2
                        bbox.width += margin * 2 + getCalloutPointerHalfHeight( bbox.height)
                        item.rect = new d3.trait.Rect( item.point, bbox, anchorMidY)
                    })

                    d3.trait.layout.verticalAnchorLeftRight( foci, self.chartWidth(), self.chartHeight())

                    foci.forEach( function( item, index, array) {
                        var seriesIndex = _data.indexOf( item.series),
                            ttip = cache.tooltips[ seriesIndex]

                        //var pathFill = d3.rgb( item.color ).brighter().toString()
                        var pathStroke = d3.rgb( item.color ).darker(1.4).toString()

                        //console.log( "bbox: " + bbox.width + ", " + bbox.height)
                        var offsetY = item.point.y - item.rect.origin.y
                        var calloutPointerHalfHeight = getCalloutPointerHalfHeight( item.rect.size.height)
                        var calloutPath = getCalloutPath( item.rect.size.width, item.rect.size.height, radius, calloutPointerHalfHeight, item.rect.anchor, offsetY)

                        var textMargin = calloutPointerHalfHeight * 2 + margin,
                            tx = item.rect.anchor.x < 0.5 ? textMargin : -item.rect.size.width - textMargin

                        ttip.text.attr ( 'transform', 'translate(' + tx + ',' + 0 + ')' )

                        if( ttip.newby) {
                            ttip.group.attr( 'transform', 'translate(' + item.rect.origin.x + ',' + item.rect.origin.y + ')')
                            ttip.group.transition().attr ( 'opacity', 1 );
                        } else {
                            ttip.group.transition().attr({
                                'opacity': 1,
                                'transform': 'translate(' + item.rect.origin.x + ',' + item.rect.origin.y + ')'
                            })
                        }

                        ttip.path.transition()
                            .attr({
                                'opacity': 0.72,
                                'fill': item.color,
                                'stroke': pathStroke,
                                'd': calloutPath
                            })
                        ttip.newby = false
                    })

                    removeUnusedTooltips( cache.tooltips)
                    cache.lastFoci = foci
                });

            })
        }

        return tooltip;

    }

    trait.focus.tooltip = _tooltip

}(d3, d3.trait));
