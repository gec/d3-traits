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

  function Point(x, y) {
    if( arguments.length <= 0 ) {
      this.x = 0
      this.y = 0
    } else {
      this.x = x
      this.y = y
    }

  }
  Point.prototype.distanceX = function( other) {
    return other.x > this.x ? other.x - this.x : this.x - other.x
  }
  Point.prototype.distanceY = function( other) {
    return other.y > this.y ? other.y - this.y : this.y - other.y
  }
  Point.prototype.distance = function( other) {
    var dx = this.distanceX( other),
        dy = this.distanceY( other)
    return Math.sqrt(dx * dx + dy * dy)
  }

  function Size(width, height) {
    if( arguments.length <= 0 ) {
      this.width = 0
      this.height = 0
    } else {
      this.width = width
      this.height = height
    }
  }

  /**
   * top, right, bottom, left
   * top, right-left, bottom
   * top-bottom, right-left
   * all
   */
  function Margin(/* variable */) {
    var a, b
    switch( arguments.length ) {
      case 0:
        this.top = 0
        this.right = 0
        this.bottom = 0
        this.left = 0
        break;
      case 1:
        a = arguments[0]
        this.top = a
        this.right = a
        this.bottom = a
        this.left = a
        break;
      case 2:
        a = arguments[0]
        b = arguments[1]
        this.top = a
        this.right = b
        this.bottom = a
        this.left = b
        break;
      case 3:
        this.top = arguments[0]
        this.right = arguments[1]
        this.bottom = arguments[2]
        this.left = arguments[1]
        break;
      case 4:
        this.top = arguments[0]
        this.right = arguments[1]
        this.bottom = arguments[2]
        this.left = arguments[3]
        break;

    }
  }

  /**
   * Rect is a rectangle with origin, and size. The origin is in relation to the anchor.
   * The anchor defaults to top left (0,0). Center left is (0,0.5). Bottom right is (1,1).
   *
   * Top left coordinate is 0.
   *
   * Rects can also have a margin. TBD.
   */
  function Rect(x, y, w, h, ax, ay) {
    switch( arguments.length ) {
      case 0:
        this.origin = new Point(0, 0)
        this.size = new Size(0, 0)
        this.anchor = new Point(0, 0)
        break;
      case 2:
        this.origin = new Point(x.x, x.y)
        this.size = new Size(y.width, y.height)
        this.anchor = new Point(0, 0)
        break;
      case 3:
        this.origin = new Point(x.x, x.y)
        this.size = new Size(y.width, y.height)
        this.anchor = new Point(w.x, w.y)
        break;
      case 4:
        this.origin = new Point(x, y)
        this.size = new Size(w, h)
        this.anchor = new Point(0, 0)
        break;
      case 6:
        this.origin = new Point(x, y)
        this.size = new Size(w, h)
        this.anchor = new Point(ax, ay)
        break;
    }

    this.minX = function() { return this.origin.x - this.size.width * this.anchor.x}
    this.maxX = function() { return this.origin.x + this.size.width * (1 - this.anchor.x)}
    this.minY = function() { return this.origin.y - this.size.height * this.anchor.y}
    this.maxY = function() { return this.origin.y + this.size.height * (1 - this.anchor.y)}

    this.spaceOnTop = function(rectAbove) { return this.minY() - rectAbove.maxY() }
    this.spaceOnBottom = function(rectBelow) { return rectBelow.minY() - this.maxY() }

    this.roomOnRight = function(room) { return room.maxX() - this.maxX()}
    this.roomOnBottom = function(room) { return room.maxY() - this.maxY()}
    this.roomOnLeft = function(room) { return this.minX() - room.minX()}
    this.roomOnTop = function(room) { return this.minY() - room.minY()}

//        this.roomOnRight = function( roomWidth) { return roomWidth - this.maxX()}
//        this.roomOnBottom = function( roomHeight) { return roomHeight - this.maxY()}
//        this.roomOnLeft = function() { return this.minX()}
//        this.roomOnTop = function() { return this.minY()}

    this.translate = function(point) {
      this.origin.x += point.x
      this.origin.y += point.y
    }
  }

  var LEFT = -1,
      RIGHT = 1

  function sortOnY(a, b) { return a.rect.origin.y - b.rect.origin.y}

  // We have enough space to fit everything.
  function listNudgeUpFromBottom(itemsWithRect, maxY) {
    var last = null,
        index = itemsWithRect.length - 1

    for( ; index >= 0; index-- ) {
      var spacingBottom,
          item = itemsWithRect[index],
          r = item.rect

      if( index === itemsWithRect.length - 1 ) {
        spacingBottom = maxY - r.maxY()
      } else {
        spacingBottom = last.rect.spaceOnTop(r)
      }

      if( spacingBottom < 0 )
        r.origin.y += spacingBottom
      last = item
    }
  }

  // top: 10, mo: 0  noop
  // top: -1, mo: 0  ty = 1
  // top: 10, mo: 1  ty = -11  -mo - top
  // top: -1, mo: 2  ty = -1   -mo - top
  function rectRemoveOverlap(r, spacingTop, minOverlap) {
    var ty = 0

    if( minOverlap > 0 ) {
      ty = -minOverlap - spacingTop
    } else if( spacingTop < 0 ) {
      ty = -spacingTop
    }
    r.origin.y += ty
  }

  // Starting from top, remove overlaps by nudging down
  // if minOverlap > 0, then we know they won't fit and need to overlap
  //
  function removeOverlapFromTop(itemsWithRect, inRect, minOverlap) {
    var r, last = null

    itemsWithRect.forEach(function(item, index, array) {
      r = item.rect
      if( index === 0 ) {
        rectRemoveOverlap(r, r.roomOnTop(inRect), minOverlap)
      } else {
        rectRemoveOverlap(r, r.spaceOnTop(last.rect), minOverlap)
      }
      last = item
    })
  }

  /**
   * Translate all items from start to stop-1 by ty.
   * @param itemsWithRect
   * @param start Starting index
   * @param stop Do not include stop index
   * @param ty Amount to translate
   */
  function listTranslateY(itemsWithRect, start, stop, ty) {
    var item,
        index = start

    for( ; index < stop; index++ ) {
      item = itemsWithRect[ index]
      item.rect.origin.y += ty
    }
  }

  // Starting from top, nudge up to restore balance so callouts are
  // more equally offset
  //
  // There is no overlap
  //
  function listBalanceFromTop(itemsWithRect, inRect, originalYs) {
    var r, itemSpaceOnTop, item,
        index = 0,
        spanStart = 0,
        spanCount = 0,
        spanSpaceOnTop = 0,
        last = null,
        yOffsetSum = 0,
        yOffsetAve = 0

    // Find a span of +y offsets with no spacing. Get the average offset.
    // If space above, move all up by average offset. Find the next span.
    for( ; index < itemsWithRect.length; index++ ) {
      item = itemsWithRect[ index]
      r = item.rect
      itemSpaceOnTop = index === 0 ? r.roomOnTop(inRect) : r.spaceOnTop(last.rect)

      if( itemSpaceOnTop > 0 ) {
        // end of last span or start of new span

        if( spanCount > 0 ) {
          // work the span
          yOffsetAve = yOffsetSum / spanCount
          if( yOffsetAve < -1 || yOffsetAve > 1 ) {
            var saveYOffsetAve = yOffsetAve
            // move the span
            if( yOffsetAve > 0 ) {
              // Move up, but not more than spanSpaceOnTOp
              yOffsetAve = Math.min(yOffsetAve, spanSpaceOnTop)
            } else {
              // Move down, but not more than current itemSpaceOnTOp
              yOffsetAve = -Math.min(-yOffsetAve, itemSpaceOnTop)
            }

            listTranslateY(itemsWithRect, spanStart, index, -yOffsetAve)
            spanSpaceOnTop -= yOffsetAve
            itemSpaceOnTop += yOffsetAve

            if( itemSpaceOnTop > 0 ) {
              // Reset counters to start a new span.
              spanCount = 1
              spanStart = index
              spanSpaceOnTop = itemSpaceOnTop
              yOffsetSum = 0
            } else {
              // Span moved down and joined the current item.
              // span was moved down so the yOffset needs adjusting.
              yOffsetSum = (saveYOffsetAve - yOffsetAve) * spanCount
              spanCount++
              yOffsetSum += r.origin.y - originalYs[index]
            }
          }

        } else {
          // Reset counters
          spanCount = 1
          spanStart = index
          spanSpaceOnTop = itemSpaceOnTop
          yOffsetSum += r.origin.y - originalYs[index]
        }
      } else {
        // part of current span
        spanCount++
        yOffsetSum += r.origin.y - originalYs[index]
      }

      last = item
    }

    if( spanCount > 1 ) {
      // work the span
      yOffsetAve = yOffsetSum / spanCount
//            console.log( "yOffsetAve = yOffsetSum / spanCount " + yOffsetAve + " " + yOffsetSum + " " + spanCount)
      if( yOffsetAve < -1 || yOffsetAve > 1 ) {
        // move the span
        if( yOffsetAve > 0 ) {
          // Move up, but not more than spanSpaceOnTOp
          yOffsetAve = Math.min(yOffsetAve, spanSpaceOnTop)
        } else {
          // Move down, but not more than space on bottom
          var bottom = last.rect.roomOnBottom(inRect)
          if( bottom > 0 )
            yOffsetAve = -Math.min(-yOffsetAve, bottom)
          else
            yOffsetAve = 0
        }

        listTranslateY(itemsWithRect, spanStart, index, -yOffsetAve)

      }

    }
  }

  function layoutVertical(itemsWithRect, inRect) {
    if( itemsWithRect.length <= 0 )
      return;

    itemsWithRect.sort(sortOnY)

    var totalSpacing = 0,
        minOverlap = 0,
        height = inRect.size.height,
        totalHeight = d3.sum(itemsWithRect, function(item) { return item.rect.size.height}),
        originalYs = itemsWithRect.map(function(item) { return item.rect.origin.y})

    if( totalHeight > height )
      minOverlap = ( totalHeight - height ) / itemsWithRect.length
    else
      totalSpacing = height - totalHeight

    removeOverlapFromTop(itemsWithRect, inRect, minOverlap)

    if( totalSpacing > 0 ) {
      listNudgeUpFromBottom(itemsWithRect, inRect.maxY())
      listBalanceFromTop(itemsWithRect, inRect, originalYs)
    }
  }

  /**
   * adjustOrientationToFitWidth
   *
   * Items may already be anchored left or right. If they don't fit on the right,
   * change the anchor to left. If it still doesn't fit, nudge it to the left.
   * @param itemsWithRect
   * @param width
   * @param height
   */
  function adjustOrientationToFitWidth(itemsWithRect, inRect) {
    var r,
        left = [],
        right = []

    itemsWithRect.forEach(function(item, index, array) {
      r = item.rect
      if( r.anchor.x < 0.5 ) {
        // right justified
        if( r.roomOnRight(inRect) >= 0 ) {
          item.orient = RIGHT
          right.push(item)
        } else {
          item.orient = LEFT
          r.anchor.x = 1
          left.push(item)
        }
      } else {
        // left justified
        if( r.roomOnLeft(inRect) >= 0 ) {
          item.orient = LEFT
          left.push(item)
        } else {
          item.orient = RIGHT
          r.anchor.x = 0
          right.push(item)
        }
      }

    })

    return [left, right]
  }

  function layoutVerticalAnchorLeftRight(itemsWithRect, inRect) {
    var leftRight = adjustOrientationToFitWidth(itemsWithRect, inRect)
    layoutVertical(leftRight[0], inRect)
    layoutVertical(leftRight[1], inRect)
  }

  function layoutByOrientation(itemsWithRect, rect, orient, _wrap) {
    var r, i,
        coordinate = 0,
        wrap = _wrap || false

    switch( orient ) {
      case 'left':
        coordinate = rect.minX()
        itemsWithRect.forEach(function(item, index, array) {
          r = item.rect
          r.origin.x += coordinate - r.minX()
          coordinate = r.maxX()
        })
        break;
      case 'right':
        coordinate = rect.maxX()
        for( i = itemsWithRect.length - 1; i >= 0; i-- ) {
          r = itemsWithRect[i].rect
          r.origin.x += coordinate - r.maxX()
          coordinate = r.minX()
        }
        break;
      case 'top':
        coordinate = rect.minY()
        itemsWithRect.forEach(function(item, index, array) {
          r = item.rect
          r.origin.y += coordinate - r.minY()
          coordinate = r.maxY()
        })
        break;
      case 'bottom':
        coordinate = rect.maxY()
        for( i = itemsWithRect.length - 1; i >= 0; i-- ) {
          r = itemsWithRect[i].rect
          r.origin.y += coordinate - r.maxY()
          coordinate = r.minY()
        }
        break;
      default:
    }
  }


  ///////////////////////////////////
  // Export to d3.trait
  //

  if( !trait.layout )
    trait.layout = { utils: {} }

  trait.Point = Point
  trait.Size = Size
  trait.Margin = Margin
  trait.Rect = Rect

  trait.layout.adjustOrientationToFitWidth = adjustOrientationToFitWidth
  trait.layout.vertical = layoutVertical
  trait.layout.byOrientation = layoutByOrientation
  trait.layout.verticalAnchorLeftRight = layoutVerticalAnchorLeftRight
  trait.layout.utils.listNudgeUpFromBottom = listNudgeUpFromBottom
  trait.layout.utils.removeOverlapFromTop = removeOverlapFromTop
  trait.layout.utils.listBalanceFromTop = listBalanceFromTop

}(d3, d3.trait));
