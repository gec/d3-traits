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
    switch( arguments.length) {
      case 0:
        this.x = 0
        this.y = 0
        break;
      case 1:
        this.x = x.x
        this.y = x.y
        break;
      default:
        this.x = x
        this.y = y
    }
  }
  Point.prototype.set = function( other) {
    if( other && typeof other === 'object') {
      this.x = other.x
      this.y = other.y
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

  }
  Rect.prototype.minX = function() { return this.origin.x - this.size.width * this.anchor.x}
  Rect.prototype.maxX = function() { return this.origin.x + this.size.width * (1 - this.anchor.x)}
  Rect.prototype.midX = function() { return this.origin.x + (this.size.width * (1 - 2 * this.anchor.x)) / 2}
  Rect.prototype.minY = function() { return this.origin.y - this.size.height * this.anchor.y}
  Rect.prototype.maxY = function() { return this.origin.y + this.size.height * (1 - this.anchor.y)}
  Rect.prototype.midY = function() { return this.origin.y + (this.size.height * (1 - 2 *this.anchor.y)) / 2}

  Rect.prototype.spaceOnTop = function(rectAbove) { return this.minY() - rectAbove.maxY() }
  Rect.prototype.spaceOnBottom = function(rectBelow) { return rectBelow.minY() - this.maxY() }

  Rect.prototype.roomOnRight = function(room) { return room.maxX() - this.maxX()}
  Rect.prototype.roomOnBottom = function(room) { return room.maxY() - this.maxY()}
  Rect.prototype.roomOnLeft = function(room) { return this.minX() - room.minX()}
  Rect.prototype.roomOnTop = function(room) { return this.minY() - room.minY()}

  Rect.prototype.translate = function(point) {
    this.origin.x += point.x
    this.origin.y += point.y
  }

  function ExtentWithIndices_reset() {
    this.values = [undefined, undefined]
    this.indices = [undefined, undefined]
  }

  function ExtentWithIndices_set( array, offset) {
    var i = offset === undefined ? -1 : offset - 1,
        n = array.length,
        a, ai,
        b,
        c, ci,
        f = this.access;

    if( f === undefined) {
      while (++i < n && !((a = c = array[i]) != null && a <= a)) a = c = undefined;
      if( a !== undefined)
        ai = ci = i
      while (++i < n) if ((b = array[i]) != null) {
        if (a > b) {a = b; ai = i}
        if (c < b) {c = b; ci = i}
      }
    } else {
      while (++i < n && !((a = c = f.call(array, array[i], i)) != null && a <= a)) a = undefined;
      if( a !== undefined)
        ai = ci = i
      while (++i < n) if ((b = f.call(array, array[i], i)) != null) {
        if (a > b) {a = b; ai = i}
        if (c < b) {c = b; ci = i}
      }
    }
    this.values = [a, c]
    this.indices = [ai, ci]
  }

  /**
   * ExtentWithIndices()
   * ExtentWithIndices( array, access)
   * ExtentWithIndices( array, access, offset)
   * ExtentWithIndices( min, minIndex, max, maxIndex)
   *
   * @param min
   * @param minIndex
   * @param max
   * @param maxIndex
   * @constructor
   */
  function ExtentWithIndices_init( min, minIndex, max, maxIndex) {

    switch( arguments.length) {
      case 0:
        ExtentWithIndices_reset.call(this)
        this.access = undefined
        break;
      case 4:
        this.values = [min, max]
        this.indices = [minIndex, maxIndex]
        break;
      default:
        this.access = minIndex
        ExtentWithIndices_set.call( this, min, max)
    }
  }


  /**
   * ExtentWithIndices()
   * ExtentWithIndices( array, f)
   * ExtentWithIndices( min, minIndex, max, maxIndex)
   *
   * @param array
   * @param f
   * @constructor
   */
  function ExtentWithIndices() {
    ExtentWithIndices_init.apply( this, arguments)
  }

//  ExtentWithIndices.prototype.constructor = ExtentWithIndices
  ExtentWithIndices.prototype.set = ExtentWithIndices_set

  ExtentWithIndices.prototype.reset = ExtentWithIndices_reset

  /**
   *
   * union( extentWithIndices)
   * union( array, offset)
   * union( minOrMaxValue, valueIndex)
   *
   * @param extentWithIndices
   * @param offset
   * @returns {boolean}
   */
  ExtentWithIndices.prototype.union = function( extentWithIndices, offset) {
    var didExtend = false

    if( arguments.length === 0)
      return didExtend

    if( Array.isArray( extentWithIndices)) {
      // Need to call the constructor of 'this' class.
      var thisProto = Object.getPrototypeOf( this),
          newby = new thisProto.constructor(extentWithIndices, this.access, offset)
      didExtend = this.union( newby)
    } else if( extentWithIndices instanceof ExtentWithIndices) {
      // Note: undefined on either side evaluates to false.
      if( extentWithIndices.values[0] < this.values[0]) {
        this.values[0] = extentWithIndices.values[0]
        this.indices[0] = extentWithIndices.indices[0]
        didExtend = true
      }
      if( extentWithIndices.values[1] > this.values[1]) {
        this.values[1] = extentWithIndices.values[1]
        this.indices[1] = extentWithIndices.indices[1]
        didExtend = true
      }
    } else {
      var v = extentWithIndices,
          i = offset

      if( v < this.values[0]) {
        this.values[0] = v
        this.indices[0] = i
        didExtend = true
      }
      if( v > this.values[1]) {
        this.values[1] = v
        this.indices[1] = i
        didExtend = true
      }
    }


    return didExtend
  }

  ExtentWithIndices.prototype.shifted = function( data, count) {
    this.indices[0] -= count
    this.indices[1] -= count

    if( isNaN( this.indices[0]) || this.indices[0] < 0 ||
        isNaN( this.indices[1]) || this.indices[1] < 0) {
      this.set( data)
    }
  }

//  /**
//   * extendMax( array)
//   * extendMax( array, offset)
//   * extendMax( max, maxIndex)
//   *
//   * @param max
//   * @param maxIndex
//   * @returns {boolean}
//   */
//  ExtentWithIndices.prototype.max = function( max, maxIndex) {
//    var v, i
//
//    if( Array.isArray( max)) {
//      //TODO: do the max with offset
//      i = max.length - 1
//      if( i >= 0)
//        v = this.access !== undefined ? this.access.call( this, max[i], i) : max[i]
//    } else {
//      v = max
//      i = maxIndex
//    }
//
//    // Note: undefined on either side evaluates to false.
//    if( i >= 0 && v > this.values[i]) {
//      this.values[1] = v
//      this.indices[1] = i
//      return true
//    } else
//      return false
//  }
//
//  /**
//   * setMax( array)
//   * setMax( max, maxIndex)
//   *
//   * @param max New max extent
//   * @param maxIndex New index of max extent
//   */
//  ExtentWithIndices.prototype.setMax = function( max, maxIndex) {
//    var v, i
//
//    if( Array.isArray( max)) {
//      i = max.length - 1
//      if( i >= 0)
//        v = this.access !== undefined ? this.access.call( this, max[i], i) : max[i]
//    } else {
//      v = max
//      i = maxIndex
//    }
//
//    this.values[1] = v
//    this.indices[1] = i
//  }
//
//  /**
//   * setMin( array)
//   * setMin( min, minIndex)
//   *
//   * @param min New min extent
//   * @param minIndex New index of min extent
//   */
//  ExtentWithIndices.prototype.setMin = function( min, minIndex) {
//    var v, i
//
//    if( Array.isArray( min)) {
//      i = 0
//      if( min.length > 0)
//        v = this.access !== undefined ? this.access.call( this, min[i], i) : min[i]
//    } else {
//      v = min
//      i = minIndex
//    }
//
//    this.values[1] = v
//    this.indices[1] = i
//  }


  function ExtentWithIndicesSorted_set( array) {
    if( ! array)
      return

    var a, c,
        f = this.access,
        last = array.length - 1

    if( f !== undefined)
      this.access = f

    if( last < 0) {
      ExtentWithIndices_reset.call(this)
    } else {
      a = f === undefined ? array[0] : this.access.call( array, array[0], 0)
      c = f === undefined ? array[last] : this.access.call( array, array[last], last)
      this.values = [a, c]
      this.indices = [0, last]
    }
  }

  function ExtentWithIndicesSorted( min, minIndex, max, maxIndex) {
    switch( arguments.length) {
      case 0:
        ExtentWithIndices_reset.call(this)
        this.access = undefined
        break;
      case 4:
        this.values = [min, max]
        this.indices = [minIndex, maxIndex]
        break;
      default:
        this.access = minIndex
        ExtentWithIndicesSorted_set.call( this, min)
    }
  }
  ExtentWithIndicesSorted.prototype = new ExtentWithIndices()
  ExtentWithIndicesSorted.prototype.constructor = ExtentWithIndicesSorted
  ExtentWithIndicesSorted.prototype.set = ExtentWithIndicesSorted_set

  /**
   * extendMax( array)
   * extendMax( extentWithIndices)
   * extendMax( max, maxIndex)
   *
   * @param max If max is greater than old max, use it for max extent
   * @param maxIndex Index of new max (if max > current max)
   * @returns {boolean} True: The extent was extended.
   */
  ExtentWithIndicesSorted.prototype.max = function( max, maxIndex) {
    var v, i

    if( Array.isArray( max)) {
      i = max.length - 1
      if( i >= 0)
        v = this.access !== undefined ? this.access.call( this, max[i], i) : max[i]
    } else if( max instanceof ExtentWithIndices) {
      v = max.values[1]
      i = max.indices[1]
    } else {
      v = max
      i = maxIndex
    }

    // Note: undefined on either side evaluates to false.
    if( i >= 0 && (this.values[1] === undefined || v > this.values[1])) {
      this.values[1] = v
      this.indices[1] = i
      return true
    } else
      return false
  }




//  Rect.prototype.fitInColumn = function(x, colWidth) {
//
//    if( this.anchor.x === 0) {
//      this.origin.x += x - this.minX()
//    } else if( this.anchor.x === 1) {
//      this.origin.x += (x + colWidth) - this.maxX()
//    } else {
//      // TODO:
//    }
//  }


  ///////////////////////////////////
  // Export to d3.trait
  //


  trait.Point = Point
  trait.Size = Size
  trait.Margin = Margin
  trait.Rect = Rect
  trait.ExtentWithIndices = ExtentWithIndices
  trait.ExtentWithIndicesSorted = ExtentWithIndicesSorted

}(d3, d3.trait));
