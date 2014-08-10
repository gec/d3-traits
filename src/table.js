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

  var PADDING_NULL = new trait.Margin()

  trait.layout.table = function () {

    var children = d3_trait_tableChildren,
//        value = d3_trait_tableValue;
        nodes = null,
        padding = {
          arg: null,  // value get/set via table.padding
          getNull: function() { return PADDING_NULL},
          expandConstantType: 'number',
          expandConstant: function( p) {return new trait.Margin(p)}
        },
        textAlign = {
          arg: 'left',  // value get/set via table.padding
          getNull: function() {return 'left'}
        },
        verticalAlign = {
          arg: null,  // value get/set via table.padding
          getNull:  function() {return 'bottom'}
        }
    padding.get = padding.getNull
    textAlign.get = textAlign.getNull
    verticalAlign.get = verticalAlign.getNull


    function fillArray(array, length, defaultValue) {
      if (!array || length < 0 || length > 100)
        return
      while (array.length < length)
        array.push(defaultValue)
    }

    // Include padding.
    function calculateColWidths( rows) {
      var widths = []
      rows.forEach(function (row, rowIndex) {
        var cols = children.call(table, row, row.depth)
        fillArray(widths, cols.length, 0)
        cols.forEach(function (node, colIndex) {
          var pad = padding.get( node, rowIndex, colIndex),
              w = pad.left + node.rect.size.width + pad.right
          widths[colIndex] = widths[colIndex] ? Math.max(widths[colIndex], w) : w
        })
      })
      return widths
    }

    // Include padding.
    function setDepthOnNodes( node, depth) {
      node.depth = depth
      var childs = children.call(table, node, depth)
      if( childs && childs.length > 0) {
        depth ++
        childs.forEach(function (child) {
          setDepthOnNodes( child, depth)
        })
      }
    }

    function calculateRowHeight(row, rowIndex) {
      var height = 0,
          cols = children.call(table, row, row.depth)

      cols.forEach(function (node, colIndex) {
        var pad = padding.get( node, rowIndex, colIndex),
            h = pad.top + node.rect.size.height + pad.bottom
        height = Math.max(height, h)
      })
      return height
    }

    /**
     * For now, we assume that the rect anchor matches the alignment, so textAlign='right' goes
     * with Rect anchor 1.0 and we set the x origin on the right side of the box.
     * @param node
     * @param rowIndex
     * @param colIndex
     * @param cellRect The bounding box for the table cell.
     * @returns {d3.trait.Point}
     */
    function nodeOriginInCellRect( node, rowIndex, colIndex, cellRect) {
      var pad = padding.get( node, rowIndex, colIndex),
          tAlign = textAlign.get( node, rowIndex, colIndex),
          vAlign = verticalAlign.get( node, rowIndex, colIndex),
          origin = new trait.Point()

      origin.x = tAlign === 'right' ? cellRect.maxX() - pad.right
        : tAlign === 'center' ? Math.round(cellRect.midX() + (pad.left - pad.right) / 2)
        : cellRect.minX() + pad.left // 'left'

      origin.y = vAlign === 'top' ? cellRect.minY() + pad.top
        : vAlign === 'middle' ? Math.round(cellRect.midY() + (pad.top - pad.bottom) / 2)
        : cellRect.maxY() - pad.bottom  // 'bottom'

      return origin
    }

    function layoutRow(row, rowIndex, colWidths) {
      // row origin and size are already set. Need to set width.

      var cols = children.call(table, row, row.depth),
          lineHeight = row.rect.size.height,
          x = 0,
          y = 0

      cols.forEach(function (node, colIndex) {
        var cellRect = new trait.Rect( x, y, colWidths[colIndex], lineHeight)
        node.rect.origin = nodeOriginInCellRect( node, rowIndex, colIndex, cellRect)
        x += cellRect.size.width
      })
    }



    /**
     * set parameter value or function.
     * @param param Parameters are padding, textAlign, verticalAlign, etc.
     * @param x The value or function to use
     */
    function setParameter( param, x) {

      function paramFunction(node, row, col) {
        var p = x.call(table, node, node.depth, row, col);
        return p == null ? param.getNull(node)
          : param.expandConstantType && typeof p === param.expandConstantType ? param.expandConstant(p)
          : p;
      }

      function paramConstant(node) {
        return x;
      }

      var type;
      param.get = (param.arg = x) == null ? param.getNull
        : (type = typeof x) === "function" ? paramFunction
        : param.expandConstantType && type === param.expandConstantType ? (x = param.expandConstant(x), paramConstant)
        : paramConstant;
    }

    /**
     *
     * table: {
     *    rect:,  // rect for whole table
     *    group:,
     *    children: [
     *      {
     *        rect:,  // rect for tr.
     *        group:,
     *        children: [
     *          {
     *            rect:,  // rect for td
     *            element:,
     *            value:,
     *            text:,  // format( value)
     *            bbox:,  // width, height
     *          },
     *          ...
     *        ]
     *      },
     *      ...
     * }
     *
     * @param rows Rows of columns of items with Rect.
     *
     * @returns {Size}
     */
    function table(d) {
      var nodes = d
      setDepthOnNodes( nodes, 0)

      var r = 0, c = 0,
          rect = nodes.rect,
          rows = children.call(table, nodes, nodes.depth),
          colWidths = calculateColWidths(rows)


      var y = rect.origin.y
      rows.forEach(function (row, rowIndex) {
        var rowHeight = calculateRowHeight(row, rowIndex)
        row.rect.origin.x = 0  // TODO: row padding?
        row.rect.origin.y = y
        row.rect.size.height = rowHeight
        layoutRow(row, rowIndex, colWidths)
        y += rowHeight
      })

      rect.size.width = d3.sum( colWidths)
      rect.size.height = y - rect.origin.y

      return nodes
    }

    table.padding = function(x) {
      if (!arguments.length) return padding.arg;
      setParameter( padding, x)
      return table
    };

    table.textAlign = function(x) {
      if (!arguments.length) return textAlign.arg;
      setParameter( textAlign, x)
      return table
    };

    table.verticalAlign = function(x) {
      if (!arguments.length) return verticalAlign.arg;
      setParameter( verticalAlign, x)
      return table
    };

    table.children = function(x) {
      if (!arguments.length) return children;
      children = x;
      return table;
    };

//    table.value = function(x) {
//      if (!arguments.length) return value;
//      value = x;
//      return table;
//    };

    table.utils = {
      setDepthOnNodes: setDepthOnNodes,
      calculateColWidths: calculateColWidths,
      calculateRowHeight: calculateRowHeight,
      nodeOriginInCellRect: nodeOriginInCellRect,
      layoutRow: layoutRow
    }

    return table
  } // end trait.layout.table

  function d3_trait_tableChildren(d) {
    return d.children;
  }

//  function d3_trait_tableValue(d) {
//    return d.value;
//  }



}(d3, d3.trait));
