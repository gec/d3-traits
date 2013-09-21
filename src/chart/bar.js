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

function barAttr( _config, barOffsetX, barW, chartHeight, x1, y1) {
    // NOTE: for transition from enter, use  y1(0) for y: and height:
    return {
        x: function(d, i) { return x1(_config.x1(d)) + barOffsetX; },
        y: function(d, i) { return y1(_config.y1(d)); },
        width: barW,
        height: function(d, i) { return chartHeight - y1(_config.y1(d)); }
    }
}

function _chartBar( _super,  _config) {
    // Store the group element here so we can have multiple bar charts in one chart.
    // A second "bar chart" might have a different y-axis, style or orientation.
    var group, series, bars, barW, barOffsetX, lastDomainMax,
        x1 = _super.x1(),
        y1 = _super.y1(),
        color = d3.scale.category10(),
        gap = 0,                        // gap is the extra spacing beyond bar padding of 0.1 * barWidth.
        barCount = _config.barCount

    // TODO: Need to have the scale setup the number of bars.
    // - For time scale, the data is not evenly speaced, so it's the minimum space between data (although very wide bars may not be good either).
    // - For ordinal scale, the data is evenly spaced (always?), so it's the number of elements in the series.
    // - Needs to work with zoom too.
    function getBarCountRange( filteredData) {
        var countRange
        if( barCount) {
            var count = typeof( barCount) === "function" ? barCount( filteredData) : barCount
            countRange = d3.range( count)
        } else {
            var series1 = _config.seriesData( filteredData[0])
            countRange = series1.map(function(d, i){ return i; })
        }
        return countRange
    }

    var dispatch = d3.dispatch('customHover');
    function chartBar( _selection) {
        _selection.each(function(_data) {
            var element = this

            var filtered = _config.seriesFilter ? _data.filter( _config.seriesFilter) : _data

            var xBand = d3.scale.ordinal()
                .domain( getBarCountRange( filtered))
                .rangeRoundBands([0, _super.chartWidth()], 0.1); // bar padding will be 0.1 * bar width
            var gapSize = xBand.rangeBand() / 100 * gap;
            barW = xBand.rangeBand() - gapSize;
            barOffsetX = Math.round( gapSize / 2 - barW / 2);
            // The bar padding is already .1 * bar width. Let's use * 0.4 for better outer padding
            _super.minRangeMarginLeft( "x1", Math.ceil( gapSize / 2 + barW * 0.4 + barW / 2))

            if( !group) {
                var classes = _config.chartClass ? "chart-bar " + _config.chartClass : 'chart-bar'
                group = this._chartGroup.append('g').classed( classes, true);
            }

            color.domain( filtered)

            // DATA JOIN
            series = group.selectAll(".series")
                .data( filtered)
            {
                // UPDATE

                // ENTER
                series.enter()
                    .append("g")
                        .attr("class", "series")
                        .style("fill", function(d, i) { return color(i); });
            }

            // DATA JOIN
            bars = series.selectAll("rect")
                .data( _config.seriesData)
            {
                // UPDATE
                bars.transition()
                    .duration(500).delay(500).ease(_super.ease())
                    .attr( barAttr( _config, barOffsetX, barW, _super.chartHeight(), x1, y1));

                // ENTER
                bars.enter().append('rect')
                    .classed('bar', true)
                    .attr( barAttr( _config, barOffsetX, barW, _super.chartHeight(), x1, y1))
                    .on('mouseover', dispatch.customHover);

                // EXIT
                bars.exit()
                    .transition()
                    .style({opacity: 0})
                    .remove();

                lastDomainMax = d3.trait.utils.extentMax( x1.domain())
            }

        })
    }
    chartBar.update = function() {
        if( _super.update)
            _super.update()

        // TODO: The x1.range() needs to be wider, so we draw the new line off the right
        // then translate it to the left with a transition animation.

        var domainMax = d3.trait.utils.extentMax( x1.domain())
        var translateX = x1(lastDomainMax) - x1( domainMax)

        // redraw the line and no transform
        series.attr( "transform", null)
        bars.attr( barAttr( _config, barOffsetX, barW, _super.chartHeight(), x1, y1));

        bars = series.selectAll("rect" )
            .data( _config.seriesData)

        // ENTER
        bars.enter().append('rect')
            .classed('bar', true)
            .attr( barAttr( _config, barOffsetX, barW, _super.chartHeight(), x1, y1))

        bars.exit()
            .transition()
            .style({opacity: 0})
            .remove();


        // slide the line left
        series.transition()
            .duration( _super.duration())
            .ease("linear")
            .attr("transform", "translate(" + translateX + ")")
        //.each("end", tick);

        lastDomainMax = d3.trait.utils.extentMax( x1.domain())

        // Could pop the data off the front (off the left side of chart)

        return this;
    };

    chartBar.gap = function(_x) {
        if (!arguments.length) return gap;
        gap = _x;
        return this;
    };
    d3.rebind(chartBar, dispatch, 'on');
    _super.onChartResized( 'chartBar', chartBar)
    _super.onRangeMarginChanged( 'chartBar', chartBar)

    return chartBar;

}

trait.chart.bar = _chartBar

}(d3, d3.trait));
