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

  function defaultIdentity(d) { return d }
  function defaultX(d) { return d.x }
  function defaultY(d) { return d.y }
  function defaultOut(d, x, y0, y) { d.x = x; d.y0 = y0; d.y = y}


  trait.layout.trendstack = function () {

    var values = defaultIdentity,
        order = function( data) { return d3.range(data.length)},
        offset = stackOffsetZero,
        out = defaultOut,
        x = defaultX,
        y = defaultY


    function trendstack(data) {
      var n = data.length
      if (!n) return data;

      // Convert series to canonical two-dimensional representation.
      var series = data.map(function(d, i) {
        return values.call(trendstack, d, i);
      });

      // Convert each series to canonical [[x,y]] representation.
      var points = series.map(function(d) {
        return d.map(function(v, i) {
          return [x.call(trendstack, v, i), y.call(trendstack, v, i)];
        });
      });

      // Compute the order of series, and permute them.
      var orders = order.call(trendstack, points);
      series = d3.permute(series, orders);
      points = d3.permute(points, orders);

      // Compute the baseline…
      var offsets = offset.call(trendstack, points);

      // And propagate it to other series.
      var m = series[0].length,
          i, // seriesIndex
          j, // xIndex
          o; // running total
      for (j = 0; j < m; ++j) { // for x
        out.call(trendstack, series[0][j], o = offsets[j], points[0][j][1]);
        for (i = 1; i < n; ++i) {
          // out(d, y0, y)
          out.call(trendstack, series[i][j], o += points[i - 1][j][1], points[i][j][1]);
        }
      }

      return data;
    }
    trendstack.makeCursors = function( ) {

    }

    trendstack.values = function(x) {
      if (!arguments.length) return values;
      values = x;
      return trendstack;
    };

    trendstack.order = function(x) {
      if (!arguments.length) return order;
      order = typeof x === "function" ? x : d3_layout_stackOrders.get(x) || d3_layout_stackOrderDefault;
      return trendstack;
    };

    trendstack.offset = function(x) {
      if (!arguments.length) return offset;
      offset = typeof x === "function" ? x : d3_layout_stackOffsets.get(x) || d3_layout_stackOffsetZero;
      return trendstack;
    };

    trendstack.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      return trendstack;
    };

    trendstack.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      return trendstack;
    };

    trendstack.out = function(z) {
      if (!arguments.length) return out;
      out = z;
      return trendstack;
    };

    return trendstack;

  } // end trait.layout.trendstack


  function stackOffsetZero(data) {
    var j = -1,
        m = data[0].length,
        y0 = [];
    while (++j < m) y0[j] = 0;
    return y0;
  }



}(d3, d3.trait));
