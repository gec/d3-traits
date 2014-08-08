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

  /**
   * Tooltip will call focus super. Any charts traits can return a list of items that need crosshairs.
   * For example a line chart with two series can return two times.
   *
   * Configure
   *  axis: 'x1', 'y1', ['x1', 'y1']
   */
  function _crosshair(_super, _config, _id) {

    var group, series, lastX,
        line = d3.svg.line(),
        crosshairs = [],
        axis = _config.axis || 'x1'

    function removeCrosshair() {
      if( group ) {
        group.remove()
        group = undefined
      }
    }

    function chartMouseMove( focusPoint) {
      var chartHeight = _super.chartHeight(),
          marginLeft = _super.marginLeft(),
          marginTop = _super.marginTop()

      if( focusPoint && focusPoint.x === lastX)
        return

      if( focusPoint) {

        if( crosshairs.length === 0)
          crosshairs[0] = []
        var crosshairX = crosshairs[0]

        crosshairX[0] = [focusPoint.x + marginLeft, marginTop]
        crosshairX[1] = [focusPoint.x + marginLeft, chartHeight + marginTop]

        lastX = focusPoint.x

      } else {

        if( crosshairs.length > 0)
          crosshairs.splice(0, 1)
        lastX =  undefined
      }

      // DATA JOIN
      series = group.selectAll(".crosshair")
        .data(crosshairs)

      // ENTER
      series.enter()
        .append("g")
        .attr("class", "crosshair")
        .append("path")
        .attr({
          'class': "line",
          'd': function(d) { return line(d); }
        })

      // UPDATE
      series.selectAll("path")
        .attr('d', function(d) {
          return line(d);
        })

      // EXIT
      series.exit()
        .style({opacity: 0})
        .remove();

    }



    function crosshair(_selection) {
      var self = crosshair

      _selection.each(function(_data) {
        var element = this

        if( ! group) {
          group = element._container.append('g')
            .attr({
              'class':      'crosshair-group'
            });

          self.onChartMouseMove( element, chartMouseMove)
          self.onChartMouseOut(element, chartMouseMove)
        }
      })
    }

    return crosshair;

  }

  trait.focus.crosshair = _crosshair

}(d3, d3.trait));
