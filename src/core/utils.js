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

}(d3, d3.trait));
