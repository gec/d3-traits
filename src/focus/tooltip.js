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
        return Math.max( h * 0.16, 5)
    }
    function getCalloutRightPath( w, h, r, cp2) {
        // Start at the left on the callout point and go clockwise
        //
        //<path d="m10,0 L90,0 Q100,0 100,10 L100,90" fill="none" stroke="red"/>
        //
        var //c2 = Math.floor(  ),  // call-out half size (half width and half height)
            //h2 = Math.floor( h/2 ),
            ht = Math.floor( h/2 - cp2 - r ),// h top (i.e. callout to radius)
            ih = ht * 2 + cp2*2,// inner height (i.e. height - radii)
            iw = Math.floor( w - r - r ), // inner width
            p = m( 0, 0) +
                l( cp2*2, -cp2) +
                l( 0, -ht) +
                q( 0, -r, r, -r) +  // top-left corner
                l( iw, 0) +
                q( r, 0, r, r) + // top-right corner
                l( 0, ih) +
                q( 0, r, -r, r) + // bottom-right corner
                l( -iw, 0) +
                q( -r, 0, -r, -r) + // bottom-left corner
                l( 0, -ht) +
                'z'  // close path

        return p
    }

    var formatDate = d3.time.format("%Y-%m-%d");

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
    function _tooltip( _super, _config) {

        var distance = d3.trait.utils.configFloat( _config.distance, 12)
        var axis = _config.axis
        var radius = 4
        var margin = 3

        var dispatch = d3.dispatch('customHover');
        function tooltip( _selection) {
            _selection.each(function(_data) {
                var element = this

                this._svg.on("mousemove", function() {
                    var p1 = d3.mouse( element._chartGroup.node()),
                        focusPoint = { x: p1[0], y: p1[1]}

                    var foci =_super.focus.call( element, focusPoint, distance, axis)
                    foci.forEach( function( item, index, array) {
                        //console.log( "foci: " + item.point.x + " distance: " + item.distance)

                        var seriesIndex = _data.indexOf( item.series),
                            w = 40,
                            h = 30,
                            ttGroup = '_tooltip_g_' + seriesIndex,
                            ttPath = '_tooltip_path_' + seriesIndex,
                            ttText = '_tooltip_text_' + seriesIndex,
                            formattedText = formatDate( _config.x1( item.item)) + " " + _config.y1(item.item)

                        if( ! element[ttGroup]) {

                            var ttip = element._container.append('g')
                                .attr({
                                    'id': 'tooltip',
                                    'opacity': 0//,
                                    //'transform': 'translate(' + tx + ',' + ty + ')'
                                });

                            element[ttPath] = ttip.append('path')
                                .attr('fill', 'darkgray')

                            element[ttText] = ttip.append('text')
                                .attr({
                                    'width': h,
                                    'height': w,
                                    'font-family': 'monospace',
                                    'font-size': 10,
                                    'fill': 'black',
                                    'text-rendering': 'geometric-precision'
                                })

                            element[ttGroup] = ttip
                        }

                        element[ttText].text( formattedText );
                        var bbox = element[ttText].node().getBBox()
                        var boxHeight = bbox.height * 2 + margin * 2
                        item.bbox = { width: bbox.width + margin * 2, height: boxHeight}
                    })

                    //layoutLeftAndRight( foci, _super.chartWidth(), _super.chartHeight(), focusPoint)

                    foci.forEach( function( item, index, array) {
                        var seriesIndex = _data.indexOf( item.series),
                            ttGroup = '_tooltip_g_' + seriesIndex,
                            ttPath = '_tooltip_path_' + seriesIndex,
                            ttText = '_tooltip_text_' + seriesIndex

                        //var pathFill = d3.rgb( item.color ).brighter().toString()
                        var pathStroke = d3.rgb( item.color ).darker(1.4).toString()

                        //console.log( "bbox: " + bbox.width + ", " + bbox.height)
                        var calloutPointerHalfHeight = getCalloutPointerHalfHeight( item.bbox.height)
                        var calloutPath = getCalloutRightPath( item.bbox.width, item.bbox.height, radius, calloutPointerHalfHeight)

                        var tx = item.tx + item.point.x,
                            ty = item.ty + item.point.y

                        element[ttGroup].transition()
                            .attr({
                                'opacity': 1,
                                'transform': 'translate(' + tx + ',' + ty + ')'
                            });
                        element[ttText].transition()
                            .attr( 'transform', 'translate(' + (calloutPointerHalfHeight * 2 + margin) + ',' + 0 + ')' )

                        element[ttPath].transition()
                            .attr({
                                'opacity': 0.72,
                                'fill': item.color,
                                'stroke': pathStroke,
                                'd': calloutPath
                            })

                    })
                });

            })
        }

        d3.rebind(tooltip, dispatch, 'on');

        return tooltip;

    }

    trait.focus.tooltip = _tooltip

}(d3, d3.trait));
