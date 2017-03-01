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
   * Legend on top or bottom that is a single row of colored circles with a label after each circle.
   *
   * Example:
   *    @ label1   @ label2
   *
   * @param _super
   * @param _config
   * @returns {legendSeries}
   * @private
   */
  function _legendSeries(_super, _config) {
    // Store the group element here so we can have multiple line charts in one chart.
    // A second "line chart" might have a different y-axis, style or orientation.

    var orient = _config.orient || "top"

    function topOrBottom() { return orient === "top" || orient === "bottom"}

    function marginStyle() {
      var style, m = {left: 10, right: 10}
      if( _config.legendMargin ) {
        m.left = _config.legendMargin.left || m.left
        m.right = _config.legendMargin.right || m.right
        m.top = _config.legendMargin.top
        m.bottom = _config.legendMargin.bottom
      }
      m.left += _super.marginLeft()
      m.right += _super.marginRight()
      style = "margin-left:" + m.left + "px;"
      style += "margin-right:" + m.right + "px;"
      if( m.top )
        style += "margin-top:" + m.top + "px;"
      if( m.bottom )
        style += "margin-bottom:" + m.bottom + "px;"

      style += 'top:' + Math.max(0,_super.marginTop()-5) + 'px;'

      return style
    }

    var dispatch = d3.dispatch('customHover');

    function legendSeries(_selection) {
      var self = legendSeries

      _selection.each(function(_data) {
        var element = this

        if( !this._legend ) {
          var classes = _config.legendClass ? "legend " + _config.legendClass : 'legend'

          if( topOrBottom() ) {
            // insert before svg element. Could use ":first-child"
            var select = d3.select(this)
            this._legend = orient === "top" ? select.insert("ul", "svg") : select.append("ul")
            this._legend.attr("style", marginStyle())
              .attr("class", classes)
          } else {
            this._legend = this._container.append('g').classed(classes, true);
          }
        }

        var filtered = _config.legendFilter ? _data.filter(_config.legendFilter) : _data

        if( topOrBottom() ) {
          // DATA JOIN
          var legendTop = this._legend.selectAll("li")
            .data(filtered)

          // UPDATE

          // ENTER
          var lis = legendTop.enter()
            .append("li")
            .classed("legend-item", true)
            .style("border-bottom-color", self.color)

          lis.append('span')
              .classed('legend-mark', true)
              .style('background-color', self.color)
          lis.append('span')// If we don't append a span here, the text() call will overwrite span.legend-mark.
            .text(_config.seriesLabel)

          // also try: <li><span>• </span>Lorem ipsum</li> with css span { font-size: 20pt; }
        } else {
          // DATA JOIN
          var legend = this._legend.selectAll(".legend")
            .data(filtered)

          // UPDATE


          // ENTER
          legend.enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })

          legend.append("rect")
            .attr("x", self.chartWidth() - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", self.color)

          legend.append("text")
            .attr("x", self.chartWidth() - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(_config.seriesLabel)
        }

      })
    }

    d3.rebind(legendSeries, dispatch, 'on');

    return legendSeries;

  }

  trait.legend.series = _legendSeries

}(d3, d3.trait));
