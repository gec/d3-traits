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

  function l(x, y) { return 'l' + x + ',' + y }

  function q(x1, y1, x, y) { return 'q' + x1 + ',' + y1 + ' ' + x + ',' + y }

  function m(x, y) { return 'm' + x + ',' + y }

  // // call-out half size (half width and half height)
  function getCalloutPointerHalfHeight(h) {
    return Math.max(h * 0.16, 6)
  }

  /**
   * Return a path for a call-out tooltip (has a little pointer pointing to data).
   * @param w Width
   * @param h Height
   * @param r Radius for rounded corners
   * @param cp2  Half of the call-out point's width and height
   * @param anchor  Distinguishes left or right.
   * @param offsetY  Nudge the call-out point up or down to point to original focus (before layout adjustments)
   * @returns {string}
   */
  function getCalloutPath(w, h, r, cp2, anchor, offsetY) {
    // Start at the left on the callout point and go clockwise
    //
    //<path d="m10,0 L90,0 Q100,0 100,10 L100,90" fill="none" stroke="red"/>
    //
    var dx = anchor.x < 0.5 ? 1 : -1,
        ht = Math.floor(h / 2 - cp2 - r),// h top (i.e. callout to radius)
        ih = ht * 2 + cp2 * 2,// inner height (i.e. height - radii)
        iw = Math.floor(w - r - r), // inner width
        p = m(0, 0 + offsetY) +
          l(dx * cp2 * 2, -cp2 - offsetY) +
          l(0, -ht) +
          q(0, -r, dx * r, -r) +  // top-left corner
          l(dx * iw, 0) +
          q(dx * r, 0, dx * r, r) + // top-right corner
          l(0, ih) +
          q(0, r, dx * -r, r) + // bottom-right corner
          l(dx * -iw, 0) +
          q(dx * -r, 0, dx * -r, -r) + // bottom-left corner
          l(0, -ht) +
          'z'  // close path

    return p
  }

  var formatDate = d3.time.format("%Y-%m-%d");

  function markTooltipsForRemoval(tooltips) {
    tooltips.forEach(function(item) {
      if( item )
        item.remove = true
    })
  }

  function removeUnusedTooltips(tooltips) {
    tooltips.forEach(function(item, index) {
      if( item && item.remove ) {
        item.group.remove()
        tooltips[index] = null
      }
    })
  }

  function removeAllTooltips(cache) {

    delete cache.lastFoci;

    if( !cache.tooltips )
      return
    cache.tooltips.forEach(function(item, index) {
      if( item ) {
        item.group.remove()
        cache.tooltips[index] = null
      }
    })
  }

  /**
   * Tooltip will call focus super. Any charts traits can return a list of items that need tooltips.
   * For example a line chart with two series can return two times.
   *
   * Configure
   *  formatY -- d3.format function.
   *  transitionDuration — In milliseconds
   *

   */
  function _tooltipDiscrete(_super, _config, _id) {

    var axis = _config.axis,
        transitionDuration = trait.utils.configFloat( _config.transitionDuration, 100),
        radius = 4,
        margin = 3

    function tooltipDiscrete(_selection) {
      var self = tooltipDiscrete

      _selection.each(function(_data) {
        var element = this
        var cache = trait.utils.getTraitCache(element, _id)

        cache.tooltips = _data.map(function(d) { return null})

        self.onChartMouseOut(element, function() { removeAllTooltips(cache) })

        self.onFocusChange(element, function(foci, focusPoint) {

          if( foci.length <= 0 ) {
            removeAllTooltips(cache)
            return
          }

          var anchorMidY = new trait.Point(0, 0.5)

          markTooltipsForRemoval(cache.tooltips)

          // TODO: Can this huge function be broken up a bit?
          foci.forEach(function(item, index, array) {
            //console.log( "foci: " + item.point.x + " distance: " + item.distance)

            var formattedText,
                seriesIndex = _data.indexOf(item.series),
                ttip = cache.tooltips[ seriesIndex],
                xValue = formatDate(_config.x1(item.item)),
                yValue = _config.y1(item.item)

            if( _config.formatY )
              yValue = _config.formatY(yValue)
            formattedText = xValue + " " + yValue

            if( !ttip ) {
              ttip = { newby: true}

              ttip.group = element._container.append('g')
                .attr({
                  'id':      'tooltip',
                  'opacity': 0
                });

              ttip.path = ttip.group.append('path')
                .attr('fill', 'darkgray')

              ttip.text = ttip.group.append('text')
                .attr({
                  'font-family':    'monospace',
                  'font-size':      10,
                  'fill':           'black',
                  'text-rendering': 'geometric-precision'
                })

              cache.tooltips[ seriesIndex] = ttip
            }

            ttip.remove = false

            ttip.text.text(formattedText);
            var bbox = ttip.text.node().getBBox()
            bbox.height = bbox.height * 2 + margin * 2
            bbox.width += margin * 2 + getCalloutPointerHalfHeight(bbox.height)
            item.rect = new trait.Rect(item.point, bbox, anchorMidY)
          })

          trait.layout.verticalAnchorLeftRight(foci, self.chartRect())

          foci.forEach(function(item, index, array) {
            var seriesIndex = _data.indexOf(item.series),
                ttip = cache.tooltips[ seriesIndex]

            //var pathFill = d3.rgb( item.color ).brighter().toString()
            var pathStroke = d3.rgb(item.color).darker(1.4).toString()

            //console.log( "bbox: " + bbox.width + ", " + bbox.height)
            var offsetY = item.point.y - item.rect.origin.y
            var calloutPointerHalfHeight = getCalloutPointerHalfHeight(item.rect.size.height)
            var calloutPath = getCalloutPath(item.rect.size.width, item.rect.size.height, radius, calloutPointerHalfHeight, item.rect.anchor, offsetY)

            var textMargin = calloutPointerHalfHeight * 2 + margin + radius,
                tx = item.rect.anchor.x < 0.5 ? textMargin : -item.rect.size.width - margin - radius

            ttip.text.attr('transform', 'translate(' + tx + ',' + 0 + ')')

            if( ttip.newby ) {
              ttip.group.attr('transform', 'translate(' + item.rect.origin.x + ',' + item.rect.origin.y + ')')
              ttip.group.transition().attr('opacity', 1);
            } else {
              ttip.group.transition().attr({
                'opacity':   1,
                'transform': 'translate(' + item.rect.origin.x + ',' + item.rect.origin.y + ')'
              })
            }

            ttip.path.transition().duration(transitionDuration)
              .attr({
                'opacity': 0.72,
                'fill':    item.color,
                'stroke':  pathStroke,
                'd':       calloutPath
              })
            ttip.newby = false
          })

          removeUnusedTooltips(cache.tooltips)
          cache.lastFoci = foci

        })

      })
    }

    return tooltipDiscrete;

  }

  // TODO: The seriesFilter can't used series index because we don't have it. It can filter on a series attribute.
  function getFilteredFoci( foci, seriesFilter) {
    if( ! seriesFilter)
      return foci

    var filtered = foci.filter( function( focus, index, array) {
      return seriesFilter( focus.series)
    })
    return filtered
  }


  var ColY = 0,
      ColLabel = 1
  var AnchorLeft = new trait.Point(0, 0),
      AnchorRight = new trait.Point(1, 0),
      AnchorCenter = new trait.Point(0.5, 0)


  /**
   *
   *
   * row = {
   *    elements: [
   *    ],
   *    group:
   *
   *      y: {
   *        value,
   *        text,
   *        bbox,
   *        element
   *      },
   *      label: {
   *        text,
   *        bbox,
   *        element,
   *      },
   *      group  -- group element for line
   *    },
   * }
   *
   * o 134.00 Grid  seriesMarker, seriesValue, seriesLabel
   * o   1.00 ESS
   *
   * @param element
   * @param focus
   * @param config
   */

  function textAlignLRL( node, depth, row, col) {
    return col === 0 ? 'left'
      : col === 1 ? 'right'
      : 'left'
  }
  function textAlignRLL( node, depth, row, col) {
    return row === 0 ? 'left'
      : col === 0 ? 'right'
      : col === 1 ? 'left'
      : 'left'
  }

  function FocusTable( config, group) {
    this.config = config
    this.group = group
    this.rect = new trait.Rect( 0, 0, 0, 0, 0, 0.5) // y anchor in middle
    this.children = []
    this.dirtyRows = []
    this.radius = 2

    this.element = group.append('rect')   // for background
      .attr({
        x:  0,
        y:  0,
        rx: this.radius,
        ry: this.radius
      })
//      .style({
//        fill: 'white',
//        stroke: 'gray',
//        'stroke-width': 1,
//        opacity: 0.9
//      })
  }

  FocusTable.prototype.addRow   = function( focus) {

    var cols = [
      {
        anchor: AnchorRight,
        accessValue: function( f, config) {return config.y1( f.item)},
        format: this.config.formatY
      },
      {
        anchor: AnchorLeft,
        accessValue: function( f, config) { return config.seriesLabel( f.series)}
      }
    ]

    var row = new FocusTableRow( this, focus, cols)
    this.children.push( row)
    // the new FocusTableRow will call table.rowDirty.

    return row
  }

  FocusTable.prototype.getRow = function( index) { return this.children[ index]}
  FocusTable.prototype.rowCount = function() { return this.children.length }
  FocusTable.prototype.rowDirty = function( row) { this.dirtyRows.push( row) }
  FocusTable.prototype.truncateRows = function( rowCount) {
    // TODO: We have less focus items. Remove excess rows.
  }

  FocusTable.prototype.setHeaderRow = function( focus) {

    if( ! this.header) {

      var cols = [
        {
          colspan: 2,
          anchor: AnchorLeft,
          accessValue: function( f, config) {return config.x1( f.item)},
          format: this.config.formatHeader
        }
      ]

      this.header = new FocusTableRow( this, focus, cols)
      this.children.unshift( this.header)
      // the new FocusTableRow will call table.rowDirty.
    } else {
      this.header.setFocus( focus)
    }

    return this.header
  }

  FocusTable.prototype.render = function( layout, focusPoint, chartRect) {

    // TODO: use dirtyRows.
    if( this.dirtyRows.length === 0)
      return

    // TODO: what can we do to optimize dirtyRows?
    layout( this)
    this.setOrigin( focusPoint, chartRect)

    this.group.attr('transform', 'translate(' + this.rect.minX() + ',' + this.rect.minY() + ')')

    this.renderTableBox()
    this.children.forEach( function( row, rowIndex) {
      row.render()
    })

    this.dirtyRows = []
  }

  FocusTable.prototype.setOrigin = function( focusPoint, chartRect) {
    var  offsetX = 8,
         x = focusPoint.x + chartRect.origin.x,
         y = focusPoint.y + chartRect.origin.y
    this.rect.origin.x = x
    this.rect.origin.y = y

    // Fit the tooltip to the left or right of the vertical line.
    // Use an offset so the box is sitting a little away from the
    // vertical crosshair.
    //
    this.rect.size.width += offsetX
    trait.layout.verticalAnchorLeftRight( [this], chartRect)
    this.rect.size.width -= offsetX
    if( this.rect.anchor.x < 0.5)
      this.rect.origin.x += offsetX
    else
      this.rect.origin.x -= offsetX

  }

  FocusTable.prototype.renderTableBox = function() {
    this.element.attr({
      width:  this.rect.size.width,
      height: this.rect.size.height + 2
    })
    this.group.transition().style('opacity', 1)
  }


  function FocusTableRow( focusTable, focus, cols) {
    this.focusTable = focusTable
    this.focus = focus
    this.rect = new trait.Rect()
//    this.children = [{}, {}]
    this.children = cols
    this.config = focusTable.config

    this.item = focus.item
//    this.value = this.config.y1( this.item)
//    this.label = this.config.seriesLabel( focus.series)

    this.group = this.focusTable.group.append('g')
      .attr({
        'class':      'd3-trait-tooltip-row'
      })

    this.setFocus( focus)

//    this.children.forEach( function( col) {
//      col.element = this.group.append('text')
//
//      if( col.anchor == AnchorRight)
//        col.element.style('text-anchor', 'end')
//
//      var value = col.accessValue( focus, this.config)
//      this.setCol( col, value, col.anchor, col.format)
//    })


//    var colY = this.children[ColY],
//        colLabel = this.children[ColLabel]
//
//    colY.element = this.group.append('text')
//      .style({
//        'text-anchor': 'end'  // right justified.
//      })
//    colLabel.element = this.group.append('text')
//
//    this.setCol( ColY, this.value, AnchorRight, this.config.formatY)
//    this.setCol( ColLabel, this.label, AnchorLeft)
  }

  FocusTableRow.prototype.setFocus = function( focus) {
    var self = this,
        rectChanged = false

    self.focus = focus
    self.item = focus.item
//    this.value = this.config.y1( this.item)
//    this.label = this.config.seriesLabel( focus.series)

    self.children.forEach( function( col) {
      if( ! col.element) {
        col.element = self.group.append('text')

        if( col.anchor === AnchorRight)
          col.element.style('text-anchor', 'end')
      }

      rectChanged = rectChanged || self.setCol( col, col.accessValue, col.anchor, col.format)
    })

//    rectChanged = rectChanged || this.setCol( ColY, this.value, AnchorRight, this.config.formatY)
//    rectChanged = rectChanged || this.setCol( ColLabel, this.label, AnchorLeft)

    if( rectChanged)
      self.focusTable.rowDirty( self)
    return rectChanged
  }

  FocusTableRow.prototype.setCol = function( col, accessValue, anchor, format) {
    var value = col.accessValue( this.focus, this.config)

    if( col.value && col.value === value && !col.rect)
      console.error( 'how did we get here!')
    if( col.value && col.value === value)
      return false // no change

    col.value = value
    col.text = format ? format(value) : value

    col.element.text(col.text)
    col.bbox = col.element.node().getBBox()
    col.rect = new trait.Rect( 0, 0, col.bbox.width, col.bbox.height, anchor.x, anchor.y)

    return true // rect changed
  }

  FocusTableRow.prototype.render = function() {
    var origin = this.rect.origin
    this.group.attr('transform', 'translate(' + this.rect.minX() + ',' + this.rect.minY() + ')')

    this.children.forEach( function( col, colIndex) {
      origin = col.rect.origin
      col.element.attr('transform', 'translate(' + origin.x + ',' + origin.y + ')')
    })
  }


  /**
   * Tooltip will call focus super. Any charts traits can return a list of items that need tooltips.
   * For example a line chart with two series can return two times.
   *
   * o Value Label
   *
   * Configure
   *  formatY -- d3.format function.
   *  transitionDuration — In milliseconds
   *
   */
  function _tooltipUnified(_super, _config, _id) {

    var group, layout, table,
        axis = _config.axis,
        transitionDuration = trait.utils.configFloat( _config.transitionDuration, 100),
        padding = _config.padding || new trait.Margin( 0, 8, 4),  // top, left/right bottom
        offsetX = 8

    function focusChange( foci, focusPoint) {

      var filteredFoci = getFilteredFoci( foci, _config.seriesFilter)

      if( filteredFoci.length <= 0 ) {
        table.truncateRows(0)
        return
      }

      table.setHeaderRow( filteredFoci[0])

      // rowCount            1 2 1 2
      // table.rowCount      1 2 3 3
      // table.rowCount - 1  0 1 2 2
      // t.rC - 1 < rowCount T T F F
      //                     + + s s
      var rowCount = 1
      filteredFoci.forEach(function( focus, index, array) {
        if( table.rowCount() - 1 < rowCount)
          table.addRow( focus)
        else
          table.getRow( rowCount).setFocus( focus)
        rowCount ++
      })
      table.truncateRows( rowCount)


      // o 134.00 Grid
      // o   1.00 ESS
      if( ! layout) {
        layout = d3.trait.layout.table()
          .padding( padding)
          .textAlign( textAlignRLL)
      }
      table.render( layout, focusPoint, _super.chartRect())
    }



    function tooltipUnified(_selection) {
      var self = tooltipUnified

      _selection.each(function(_data) {
        var element = this

        if( ! group) {
          group = element._container.append('g')
            .attr({
              'class':      'd3-trait-tooltip'
            });
          table = new FocusTable( _config, group)

          self.onFocusChange( element, focusChange)
          //self.onChartMouseOut( element, focusChange)
        }

      })
    }

    return tooltipUnified;

  }

  if( ! trait.focus.tooltip)
    trait.focus.tooltip = {}

  trait.focus.tooltip.discrete = _tooltipDiscrete
  trait.focus.tooltip.unified = _tooltipUnified

}(d3, d3.trait));
