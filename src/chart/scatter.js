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

  function barAttr(access, barOffsetX, barW, chartHeight, x1, y) {
    // NOTE: for transition from enter, use  y(0) for y: and height:
    return {
      x:      function(d) { return x1(access.x(d)) + barOffsetX; },
      y:      function(d) { return y(access.y(d)); },
      width:  barW,
      height: function(d) { return chartHeight - y(access.y(d)); }
    }
  }

  function circleAttr(access, x1, y) {
    return {
      cx: function(d) { return x1(access.x(d)) },
      cy: function(d) { return y(access.y(d)) },
      r:  8
    }
  }

  function _chartScatter(_super, _config) {
    // Store the group element here so we can have multiple bar charts in one chart.
    // A second "bar chart" might have a different y-axis, style or orientation.
    var group, series, points, barW, barOffsetX, lastDomainMax,
        axes = trait.config.axes( _config),
        access = trait.config.accessorsXY( _config, axes),
        x1 = _super[axes.x](),
        y = _super[axes.y](),
        shape = "circle" // rect

    var dispatch = d3.dispatch('customHover');

    function chartScatter(_selection) {
      var self = chartScatter

      _selection.each(function(_data) {
        var element = this

        var filtered = _config.seriesFilter ? _data.filter(_config.seriesFilter) : _data

        if( !group ) {
          var classes = _config.chartClass ? "chart-scatter " + _config.chartClass : 'chart-scatter'
          group = this._chartGroup.append('g').classed(classes, true);
        }

        // DATA JOIN
        series = group.selectAll(".series")
          .data(filtered)
        {
          // UPDATE

          // ENTER
          series.enter()
            .append("g")
            .attr("class", "series")
            .style("fill", self.color);
        }

        // DATA JOIN
        points = series.selectAll(shape)
          .data(access.seriesData)
        {
          // UPDATE
          points.transition()
            .duration(500).delay(500).ease(self.ease())
            .attr(circleAttr(access, x1, y));

          // ENTER
          points.enter().append(shape)
            .classed('scatter-point', true)
            .attr(circleAttr(access, x1, y))
            //.on('mouseover', dispatch.customHover);
            .on("mouseover", function(d, i) {
              return element._svg.append("text").text("data: " + access.y(d).toFixed(1))
                .attr("id", "tooltip")
                .attr("x", x1(access.x(d)) + 10)
                .attr("y", y(access.y(d)))
                .attr("fill", "black")
                .attr("opacity", 0)
                .style("font-family", "sans-serif")
                .transition().attr("opacity", 1);
            })
            .on("mouseout", function() {
              d3.select(this)
                .transition()
                .duration(500)
                .attr("fill", "slateblue");
              d3.selectAll("#tooltip")
                .transition().duration(500)
                .attr("opacity", 0)
                .remove();
            })

          // EXIT
          points.exit()
            .transition()
            .style({opacity: 0})
            .remove();

          lastDomainMax = d3.trait.utils.extentMax(x1.domain())
        }

      })
    }

    chartScatter.update = function(type, duration) {
      this._super(type, duration)

      // TODO: The x1.range() needs to be wider, so we draw the new line off the right
      // then translate it to the left with a transition animation.

      var domainMax = d3.trait.utils.extentMax(x1.domain())
      var translateX = x1(lastDomainMax) - x1(domainMax)

      // redraw the line and no transform
      series.attr("transform", null)
      points.attr(barAttr(access, barOffsetX, barW, _super.chartHeight(), x1, y));

      points = series.selectAll("rect")
        .data(access.seriesData)

      // ENTER
      points.enter().append('rect')
        .classed('bar', true)
        .attr(barAttr(access, barOffsetX, barW, _super.chartHeight(), x1, y))

      points.exit()
        .transition()
        .style({opacity: 0})
        .remove();


      // slide the bars left
      if( duration === 0 ) {
        series.attr("transform", "translate(" + translateX + ")")
      } else {

        series.transition()
          .duration(duration || _super.duration())
          .ease("linear")
          .attr("transform", "translate(" + translateX + ")")
        //.each("end", tick);
      }

      lastDomainMax = d3.trait.utils.extentMax(x1.domain())

      // Could pop the data off the front (off the left side of chart)

      return this;
    };

    d3.rebind(chartScatter, dispatch, 'on');
    _super.onRangeMarginChanged('chartScatter', chartScatter)

    return chartScatter;

  }

  trait.chart.scatter = _chartScatter

}(d3, d3.trait));
