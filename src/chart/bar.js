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
(function (d3, traits) {

function _chartBar( _super,  _access,  args) {
    var gap = 0
    var chartGroup

    var dispatch = d3.dispatch('customHover');
    function chartBar( _selection) {
        _selection.each(function(_data) {
            var element = this
            //var _access = element._access
            console.log( "call( chartBar) margin.left: " + _super.marginLeft() + ", chartWidth: " + _super.chartWidth())

            var data = _access.seriesData( _data.filter( _access.seriesFilter)[0])

            var xBand = d3.scale.ordinal()
                .domain( data.map(function(d, i){ return i; }))
                .rangeRoundBands([0, _super.chartWidth()], 0.1);
            var gapSize = xBand.rangeBand() / 100 * gap;
            var barW = xBand.rangeBand() - gapSize;
            console.log( "call( chartBar) barW: " + barW)

            // The xAxis doesn't know we're a bar graph and we want to center the ticks on the bars.
            if( 'xAxisTranslateX' in _super)
                _super.xAxisTranslateX( barW / 2)

            var x1 = _super.x1()
            var y1 = _super.y1()


            var svg = _super.svg()
            if( !chartGroup) {
                var container = svg.select('.container-group')
                chartGroup = container.append('g').classed('chart-group', true);
            }

            var bars = chartGroup
                .selectAll('.bar')
                .data( data);
            bars.enter().append('rect')
                .classed('bar', true)
                .attr({x: function(d, i) { return x1(_access.x1(d)) + gapSize/2; },
                    width: barW,
                    y: function(d, i) {return y1(0)}, //{ return y1(d.value); },
                    height: function(d, i) {return _super.chartHeight() - y1(0)}
                })
                .on('mouseover', dispatch.customHover);
            bars.transition()
                .duration(500)
                .delay(500)
                .ease(_super.ease())
                .attr({
                    width: barW,
                    x: function(d, i) { return x1(_access.x1(d)) + gapSize/2; },
                    y: function(d, i) { return y1(_access.y1(d)); },
                    height: function(d, i) { if(i===0) console.log( "chartH2: " + _super.chartHeight());  return _super.chartHeight() - y1(_access.y1(d)); }
                });
            bars.exit().transition().style({opacity: 0}).remove();
        })
    }

    chartBar.gap = function(_x) {
        if (!arguments.length) return gap;
        gap = _x;
        return this;
    };
    d3.rebind(chartBar, dispatch, 'on');

    return chartBar;

}

traits.chart.bar = _chartBar

}(d3, d3.traits));
