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
 *
 * d3.trait( d3.trait.control.brush, { axis: 'x1', target: obj, targetAxis: 'x1'})
 * @param _super
 * @param _config
 * @returns {Function}
 * @private
 */
function _controlBrush( _super, _config) {
    // Store the group element here so we can have multiple line charts in one chart.
    // A second "line chart" might have a different y-axis, style or orientation.
    var group, lastDomainMax,
//        x1 = _super.x1(),
//        y1 = _super.y1(),
        name= _config.axis,
        axisChar= name.charAt(0 ),
        scale  = _super[name](),        // ex: x1()
        target = _config.target,
        targetAxis = _config.targetAxis,
        targetScale = target[_config.targetAxis](),
        brush = d3.svg.brush()[axisChar]( scale )

    function brushed() {
        var extent = brush.empty() ? scale.domain() : brush.extent()
        target[ targetAxis + "Domain"]( extent)
        //targetScale.domain( extent);
        target.update( "domain", 0)
//        focus.select("path").attr("d", area);
//        focus.select(".x.axis").call(xAxis);
    }
    brush.on("brush", brushed)

    var dispatch = d3.dispatch('customHover');
    function controlBrush( _selection) {
        var self = controlBrush

        _selection.each(function(_data) {
            var element = this

            if( !group) {
                var brushClasses = "brush brush-" + name
                var classes = _config.chartClass ? brushClasses  + _config.chartClass : brushClasses
                //brushChart = this._chartGroup.lastChild
                group = this._chartGroup.append('g').classed( classes, true)
                    .call( brush)
            }

            group.selectAll( "rect")
                .attr("y", -6)
                .attr("height", self.chartHeight() + 7);

            lastDomainMax = d3.trait.utils.extentMax( scale.domain())
        })
    }
    controlBrush.update = function( type, duration) {
        this._super( type, duration)


        lastDomainMax = d3.trait.utils.extentMax( scale.domain())
        return this;
    };

    d3.rebind(controlBrush, dispatch, 'on');
    _super.onChartResized( 'controlBrush', controlBrush)

    return controlBrush;

}

trait.control.brush = _controlBrush

}(d3, d3.trait));
