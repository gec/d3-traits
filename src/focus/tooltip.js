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

    function getPathRightCallout( w, h, r) {
        // Start at the left on the callout point and go clockwise
        //
        //<path d="m10,0 L90,0 Q100,0 100,10 L100,90" fill="none" stroke="red"/>
        //
        var c2 = Math.floor( h * 0.16 ),  // call-out half size (half width and half height)
            //h2 = Math.floor( h/2 ),
            ht = Math.floor( h/2 - c2 - r ),// h top (i.e. callout to radius)
            ih = ht * 2 + c2*2,// inner height (i.e. height - radii)
            iw = Math.floor( w - r - r ), // inner width
            p = m( 0, 0) +
                l( c2*2, -c2) +
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
//    function updateTooltip( svg, target) {
//        var yTooltip = svg.select("#yTooltip")
//            .transition()
//            .attr({
//                'opacity': 1.0,
//                'transform': 'translate(0, ' + target.y + ')'
//            });
//
//        var textY = '' + target.datum.value;
//        var yTooltipText = yTooltip.select('text').text(textY);
//        yTooltipText.attr(
//            'transform',
//            'translate(-' + (this.getTextWidth(textY) + 3) + ',3)'
//        );
//        yTooltip.select('path')
//            .attr('fill', target.series.color)
//            .attr('d', this.getYTooltipPath(textY));
//    }

    var formatDate = d3.time.format("%Y-%m-%d");

    function _tooltip( _super, _config) {
        // Store the group element here so we can have multiple line charts in one chart.
        // A second "line chart" might have a different y-axis, style or orientation.

        var dispatch = d3.dispatch('customHover');
        function tooltip( _selection) {
            _selection.each(function(_data) {
                var element = this


                this._chartGroup.on("mousemove", function() {
                    var p1 = d3.mouse( this),
                        point = { x: p1[0], y: p1[1]}

                    var foci =_super.focus.call( element, point)
                    foci.forEach( function( item, index, array) {
                        console.log( "foci: " + item.point.x + " distance: " + item.distance)

                        var w = 40,
                            h = 30,
                            name = 'tooltip' + index
                        if( ! element[name]) {

                            var ttip = element._container.append('g')
                                .attr({
                                    'id': 'tooltip',
                                    'opacity': 0,
                                    'transform': 'translate(' + item.point.x + ',' + item.point.y + ')'
                                });

                            var path = ttip.append('path')
                                .attr('fill', 'darkgray')

                            var formattedText = formatDate( _config.x1( item.item)) + " " + _config.y1(item.item)
                            var text = ttip.append('text')
                                .attr({
                                    'width': h,
                                    'height': w,
                                    'font-family': 'monospace',
                                    'font-size': 10,
                                    'fill': 'white',
                                    'text-rendering': 'geometric-precision'
                                })
                                .text( formattedText);

                            var bbox = text.node().getBBox()
                            console.log( "bbox: " + bbox.width + ", " + bbox.height)
                            path.attr('d', getPathRightCallout( bbox.width, bbox.height*2, 4))


                            element[name] = ttip


                        }

                        element[name].transition()
                            .attr({
                                'opacity': 1.0,
                                'transform': 'translate(' + item.point.x + ',' + item.point.y + ')'
                            });

                    })
                });

            })
        }

        d3.rebind(tooltip, dispatch, 'on');

        return tooltip;

    }

    trait.focus.tooltip = _tooltip

}(d3, d3.trait));
