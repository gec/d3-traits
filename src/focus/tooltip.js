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
        radius = 6,
        margin = 3,
        formatX = _config.formatX || formatDate

    function tooltipDiscrete(_selection) {
      var self = tooltipDiscrete

      _selection.each(function(_data) {
        if( _data.length === 0)
          return

        var element = this
        var cache = trait.utils.getTraitCache(element, _id)

        cache.tooltips = _data.map(function(d) { return null})

        function focusChange(foci, focusPoint) {

          if( foci.length <= 0 ) {
            removeAllTooltips(cache)
            return
          }

          if( _data.length <= 0) {
            console.error( 'tooltipDiscrete.focusChange foci.length=' + foci.length + ' but _data.length=' + _data.length)
            return
          }

          var anchorMidY = new trait.Point(0, 0.5)

          markTooltipsForRemoval(cache.tooltips)

          // TODO: Can this huge function be broken up a bit?
          foci.forEach(function(item, index, array) {
            //console.log( "foci: " + item.point.x + " distance: " + item.distance)

            var formattedText,
                seriesIndex = _data.indexOf(item.series),
                ttip = seriesIndex >= 0 ? cache.tooltips[ seriesIndex] : null,
                xValue = formatX(_config.x1(item.item)),
                yValue = _config.y1(item.item)

            if( seriesIndex < 0) {
              console.error( 'tooltipDiscrete.focusChange forci.forEach seriesIndex=' + seriesIndex + ' but should have found a series.')
              return
            }

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

        }

        self.onChartMouseOut( function() { removeAllTooltips(cache) }, element)

        self.onFocusChange( focusChange, element)

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
  var AnchorBottomLeft = new trait.Point(0, 1),
      AnchorBottomRight = new trait.Point(1, 1),
      AnchorBottomCenter = new trait.Point(0.5, 1),
      AnchorTopLeft = new trait.Point(0,0),
      AnchorMiddleLeft = new trait.Point(0,0.5),
      AnchorMiddle = new trait.Point(0.5,0.5)


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
        anchor: AnchorBottomRight,
        accessValue: function( f, config) {return config.y1( f.item)},
        format: this.config.formatY
      },
      {
        anchor: AnchorBottomLeft,
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

  // TODO: How about
  //   var row = table.addRow( cols)
  //   row.setValue( focus) or row.update( focus)
  //
  FocusTable.prototype.setHeaderRow = function( focus) {

    if( ! this.header) {

      var cols = [
        {
          colspan: 2,
          anchor: AnchorBottomLeft,
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

        if( col.anchor === AnchorBottomRight)
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

  function formatNull( d) { return d}

  var defaultConfig = {
    transition: {
      duration: 100
    },
    radius: 3,
    paddingEm: new trait.Margin( 0, 0.6, 0.25),  // top, left/right bottom
    offsetX: 8,
    em: undefined,
    formatHeader: formatNull,
    targets: undefined // object or array of objects
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

    var group, table,
        axis = _config.axis,
        transitionDuration = trait.utils.configFloat( _config.transitionDuration, 100),
        radius = trait.utils.configFloat( _config.radius, 3),
        paddingEm = _config.padding || new trait.Margin( 0, 0.6, 0.25),  // top, left/right bottom
//        paddingEm = _config.padding || new trait.Margin( 0, 0, 0),  // top, left/right bottom
        offsetX = 8,
        emDefault= 10,  // size of em space
        formatHeader = _config.formatHeader || formatNull,
        targets = _config.target

    if( targets && ! Array.isArray( targets))
      targets = [targets]

    var layout = trait.layout.tilestack()
      .paddingEm( paddingEm)
      .translate( function( node, x, y) { node.group.attr('transform', 'translate(' + x + ',' + y + ')' )})

    var box,
        klass = { main: _config['class'] || 'd3-trait-tooltip'}
    klass.box = klass.main + '-box'



    function valueY( f) {
      var v = _config.y1( f.item)
      if( _config.formatY)
        v = _config.formatY( v)
      return v
    }

    // [ Header         ]
    // circle value label
    // circle value label
    // circle value label
    //

    table = {
      group: undefined,
      klass: klass.main + '-table',
      layoutChildren: 'TopToBottom',
      em: emDefault, // TODO: update em at all depths to max em of children.
      children: [
        { // Header
          group: undefined,
          klass: klass.main + '-header',
          limit: 1,  // one header for all foci.
          anchor: AnchorTopLeft,
          layoutChildren: 'LeftToRight',
          em: emDefault,
          children: [  // columns
            {
              type: 'text',
              group: undefined,
              klass: klass.main + '-header-td',
              anchor: AnchorBottomLeft,
              textAnchor: 'start',
              accessValue: function( f) { return formatHeader( _config.x1( f.item)) },
              em: emDefault
            }
          ]
        },
        { // Body
          group: undefined,
          klass: klass.main + '-body',
          anchor: AnchorTopLeft,
          layoutChildren: 'LeftToRight',
          em: emDefault,
          children: [  // columns
            {
              type: 'mark',
              group: undefined,
              klass: klass.main + '-mark',
              anchor: AnchorBottomRight,
              textAnchor: 'end',
              accessValue: valueY,
              em: emDefault
            },
            {
              type: 'text',
              group: undefined,
              klass: klass.main + '-value',
              anchor: AnchorBottomRight,
              textAnchor: 'end',
              accessValue: valueY,
              em: emDefault
            },
            {
              type: 'text',
              group: undefined,
              klass: klass.main + '-label',
              anchor: AnchorBottomLeft,
              textAnchor: 'start',
              accessValue: function( f) { return _config.seriesLabel( f.series)},
              em: emDefault
            }
          ]
        }
      ]
    }

    function setOrigin( obj, focusPoint, chartRect) {
      var  offsetX = 8,
           x = focusPoint.x + chartRect.origin.x,
           y = focusPoint.y + chartRect.origin.y
      obj.rect.origin.x = x
      obj.rect.origin.y = y

      // Fit the tooltip to the left or right of the vertical line.
      // Use an offset so the box is sitting a little away from the
      // vertical crosshair.
      //
      obj.rect.size.width += offsetX
      trait.layout.verticalAnchorLeftRight( [obj], chartRect)
      obj.rect.size.width -= offsetX
      if( obj.rect.anchor.x < 0.5)
        obj.rect.origin.x += offsetX
      else
        obj.rect.origin.x -= offsetX

    }

    function getSelectionRect( selection, anchor) {
      var bbox = selection[0][0].getBBox()
      var x = anchor ? anchor.x * bbox.width : 0,
          y = 0 // anchor ? anchor.y * bbox.height : 0
      return new trait.Rect(
        x, y,
        bbox.width, bbox.height,
        anchor ? anchor.x : 0,
        0 //anchor ? anchor.y : 0
      )
    }


    function yEmWithPadding( d, i) {
      // The first line is y = 1em because character y is the baseline.
      var p = i === 0 ? paddingEm.top + 1 : paddingEm.top + (paddingEm.top + paddingEm.bottom + 1) * i + 1
      return p + 'em'
    }
    function yEmWithPaddingCircle( d, i) {
      // The first line is y = 1em because character y is the baseline.
      var p = i === 0 ? paddingEm.top + 0.64 : paddingEm.top + (paddingEm.top + paddingEm.bottom + 1) * i + 0.64
      return p + 'em'
    }

    function calculateEm( col, fociLength) {
      var heightEm = 0,
          padBottom = 0,
          size = col.rect.size

      if( fociLength > 0) {
        if( fociLength === 1)
          // h = (1+.t)*em
          heightEm = size.height / ( 1+ paddingEm.top)
        else
          // h = (1+.t)*em + (1+.t+.b)*em * (length-1)
          // h = {(1+.t) + (1+.t+.b) * (length-1)} * em
          // em = h / {(1+.t) + (1+.t+.b) * (length-1)}
          heightEm = size.height / (paddingEm.top + 1 + (paddingEm.top + paddingEm.bottom + 1) * (fociLength-1))
        padBottom = heightEm * paddingEm.bottom
        size.height += padBottom
      }
      return heightEm
    }

    function textColumnEnter( col, foci) {
      var li

      li = col.group.selectAll('text')
        .data(foci)

      li.enter()
        .append('text')
        .attr('y', yEmWithPadding)
        .attr('x',0)
        .style('text-anchor', col.textAnchor)
        .text( col.accessValue )

      // UPDATE
      li.text( col.accessValue )

      li.exit()
        .remove()

      col.rect = getSelectionRect( col.group, col.anchor)
      col.em = calculateEm( col, foci.length)

//      return foci.length === 0 ? 0 : size.height / foci.length
      return col.em
    }
    function markColumnEnter( col, foci, color) {
      var li

      li = col.group.selectAll('circle')
        .data(foci)

      li.enter()
        .append('circle')
        .attr('cy', yEmWithPaddingCircle)
        .attr('cx', '0.5em')
        .attr('r','0.4em')
        .style('fill', function( f) { return color(f.series)})

      // UPDATE
      li.style('fill', function( f) { return color(f.series)})

      li.exit()
        .remove()

      col.rect = getSelectionRect( col.group, col.anchor)
      col.em = calculateEm( col, foci.length)

      return col.em
    }

    function sectionEnter( section, foci, color) {
      var markCol,
          em = 10

      if( section.limit)
        foci = foci.slice( 0, section.limit)

      section.children.forEach( function( col) {
        if( col.type === 'text')
          em = textColumnEnter( col, foci)
        else
          markCol = col
      })

      if( markCol)
        markColumnEnter( markCol, foci, color)

    }

//    function layoutColsHorizontal( section) {
//
//      var x = 0
//      section.children.forEach( function( col) {
//        x += padding.left * col.em
//        if( col.rect.anchor.x < 0.5) {
//          col.rect.origin.x = x
//          col.group.attr('transform', 'translate(' + col.rect.minX() + ',' + col.rect.maxY() + ')')
//          x += col.rect.size.width
//        } else {
//          x += col.rect.size.width
//          col.rect.origin.x = x
//          col.group.attr('transform', 'translate(' + col.rect.maxX() + ',' + col.rect.maxY() + ')')
//        }
//        x += padding.right * col.em
//      })
//    }

    function focusChange( foci, focusPoint, color) {

      var filteredFoci,
          headerFoci,
          headerHeight

      // Reverse so stack area charts have the series in the correct visual order.
      foci = foci.reverse()
      filteredFoci = getFilteredFoci( foci, _config.seriesFilter)
      table.children.forEach( function( child) {
        sectionEnter( child, filteredFoci, color)
      })

      layout( table)

      setOrigin( table, focusPoint, _super.chartRect())
      group.attr('transform', 'translate(' + table.rect.minX() + ',' + table.rect.minY() + ')')

      box.attr({
        x: 0.5,
        y: Math.round( table.em * -0.25) + 0.5,
        rx: radius,
        ry: radius,
        width:  Math.round( table.rect.size.width + table.em * 0.1),
        height: Math.round( table.rect.size.height + table.em * 0.25)
      })

      group.style('opacity', 1)


//      if( filteredFoci.length <= 0 ) {
//        // TODO: Don't truncate here. Hide the whole tooltip. When we come back we'll reuse the rows.
//        table.truncateRows(0)
//        return
//      }
//
//      // TODO: change to addRow and take col args. Same for addRow below.
//      table.setHeaderRow( filteredFoci[0])
//
//      // rowCount            1 2 1 2
//      // table.rowCount      1 2 3 3
//      // table.rowCount - 1  0 1 2 2
//      // t.rC - 1 < rowCount T T F F
//      //                     + + s s
//      var rowCount = 1
//      filteredFoci.forEach(function( focus, index, array) {
//        if( table.rowCount() - 1 < rowCount)
//          table.addRow( focus)
//        else
//          table.getRow( rowCount).setFocus( focus)
//        rowCount ++
//      })
//      table.truncateRows( rowCount)
//
//
//      // o 134.00 Grid
//      // o   1.00 ESS
//      if( ! layout) {
//        layout = d3.trait.layout.table()
//          .padding( padding)
//          .textAlign( textAlignRLL)
//      }
//      table.render( layout, focusPoint, _super.chartRect())
    }


    function makeChildGroups( parent) {

      parent.children.forEach( function( child) {

        child.group = group.append('g')
          .classed(child.klass,true)
        child.children.forEach( function( col) {
          col.group = child.group.append('g')
            .classed(col.klass,true)
            .attr('transform', 'translate(0,0)')
        })
      })

    }

    function updateTargets( foci, focusPoint) {
      if( ! targets)
        return

      targets.forEach( function(target) {
        target.update( 'focus', foci, focusPoint)
      })
    }

    function tooltipUnified(_selection) {
      var self = tooltipUnified

      function focusChangeListener( foci, focusPoint){
        focusChange( foci, focusPoint, self.color)
//            updateTargets( foci, focusPoint)
      }
      function chartMouseOutListener() {
        if( group)
          group.transition().duration(100).style('opacity', 0)
//            updateTargets( [])
      }

      _selection.each(function(_data) {
        var element = this

        if( ! group) {
          group = element._container.append('g')
            .attr({
              'class':      'd3-trait-tooltip'
            });
          box = group.append('rect')
            .classed(klass.box,true)

          makeChildGroups( table)
//          table = new FocusTable( _config, group)

          self.onFocusChange( focusChangeListener, element)
          self.onChartMouseOut( chartMouseOutListener, element)
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
