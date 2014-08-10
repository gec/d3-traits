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


  var ItemY = 0,
      ItemLabel = 1
  var AnchorLeft = new trait.Point(0, 0),
      AnchorRight = new trait.Point(1, 0),
      AnchorCenter = new trait.Point(0.5, 0)


  /**
   *
   *
   * line = {
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
  function updateFocusLine( line, focus, config) {

    var item = focus.item,
        xValue = formatDate(config.x1(item)),
        yValue = config.y1(item),
        label = config.seriesLabel( focus.series)

    updateFocusLineItem( line[ItemY], yValue, AnchorRight, config.formatY)
    updateFocusLineItem( line[ItemLabel], label, AnchorLeft)

    return line[ItemY].changed || line[ItemLabel].changed
  }

  function updateFocusLineItem( item, value, anchor, format) {
    if( item.value && item.value === value) {
      item.changed = false
      return
    }

    item.value = value
    item.text = format ? format(value) : value

    item.element.text = item.text
    item.bbox = item.element.node().getBBox()
    item.rect = new trait.Rect( 0, 0, item.bbox.width, item.bbox.height, anchor.x, anchor.y)

    item.changed = true

    return item
  }

//  function getLineItemWidthMax( lines, lineItem) {
//    var max = 0
//    lines.forEach( function( line) {
//      max = Math.max( max, line[lineItem].bbox.width)
//    })
//    return max
//  }

  function makeNewLine( focus, config, group) {
    var item = focus.item,
        xValue = formatDate(config.x1(item)),
        yValue = config.y1(item),
        label = config.seriesLabel( focus.series),
        line = {
          group: undefined,
          children: [{}, {}]
        },
        lineY = line.children[ItemY],
        lineLabel = line.children[ItemLabel]

    line.group = group.append('g')
      .attr({
        'class':      'tooltip-line'
      });


    lineY.element = line.group.append('text')
      .style({
        'font-family':    'monospace',
        'font-size':      10,
        'fill':           'black',
        'text-rendering': 'geometric-precision',
        'text-anchor': 'end'  // right justified.
      })
    lineLabel.element = line.group.append('text')
      .style({
        'font-family':    'monospace',
        'font-size':      10,
        'fill':           'black',
        'text-rendering': 'geometric-precision'
      })


    lineY = updateFocusLineItem( lineY, yValue, config.formatY)
    lineLabel = updateFocusLineItem( lineLabel, label)

    return line
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

    var group,
        lines = [],
        axis = _config.axis,
        transitionDuration = trait.utils.configFloat( _config.transitionDuration, 100),
        radius = 4,
        margin = 3

    function focusChange( foci, focusPoint) {

      if( foci.length <= 0 ) {
        //removeAllTooltips(cache)
        return
      }

      var filteredFoci = getFilteredFoci( foci, _config.seriesFilter)

      var changes = { values: false, count: false },
          lineCount = 0
      filteredFoci.forEach(function( focus, index, array) {
        var line = lines[index]
        if( ! line) {
          line[index] = makeNewLine( focus, _config, group)
          changes.count = true
        }
        else
          changes.values = changes.values || updateFocusLine( line, focus, _config)
        lineCount ++
      })
      // TODO: remove lines if the lineCount is less than previous


      // o 134.00 Grid
      // o   1.00 ESS
      var origin = new d3.trait.Point(),
          padding = new d3.trait.Margin( 6, 6), // top/bottom right/left
          colJustifications = [
            //{horizontal: 'left'},   // vertical defaults to 'bottom'.
            {horizontal: 'right'},
            {horizontal: 'left'}
          ]
      d3.trait.layout.pack.rows( lines, origin, padding, colJustifications)

      // rects are good
      // translate the elements
      // do the box

    }

    function tooltipUnified(_selection) {
      var self = tooltipUnified

      _selection.each(function(_data) {
        var element = this

        if( ! group) {
          group = element._container.append('g')
            .attr({
              'class':      'tooltip-unified-group'
            });

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
