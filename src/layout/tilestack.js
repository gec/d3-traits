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

  var paddingEm = new trait.Margin(),
      translate = function( node, x, y){}

  trait.layout.tilestack = function () {

    var layouts = {

      /**
       * translate X, but don't touch Y
       */
      LeftToRight: function( node, offset) {
        var r = node.rect

        offset.x += paddingEm.left * node.em

        if( r.anchor.x < 0.5) {
          r.origin.x = offset.x
          translate( node, r.minX(), r.origin.y)
          offset.x += r.size.width
        } else {
          offset.x += r.size.width
          r.origin.x = offset.x
          translate( node, r.maxX(), r.origin.y)
        }

        offset.x += paddingEm.right * node.em
        offset.y = Math.max( offset.y, r.maxY())
        return offset
      },

      /**
       * translate Y, but don't touch X
       */
      TopToBottom: function( node, offset) {
        var r = node.rect

        offset.y += paddingEm.top * node.em

        if( r.anchor.y < 0.5) {
          r.origin.y = offset.y
          translate( node, r.origin.x, r.minY())
          offset.y += r.size.height
        } else {
          offset.y += r.size.height
          r.origin.y = offset.y
          translate( node, r.origin.x, r.maxY())
        }

        offset.x = Math.max( offset.x, r.maxX())
        offset.y += paddingEm.bottom * node.em
        return offset
      }

    }


    function pack( node) {
      var emSum = 0,
          offset = new trait.Point()

      node.children.forEach( function( child) {
        if( child.children)
          pack( child)
        offset = layouts[ node.layoutChildren]( child, offset, paddingEm)
        emSum += child.em
      })

      //var nodeYMax = (paddingEm.top + paddingEm.bottom) * node.em  + r.maxY()

      node.rect = new trait.Rect( 0, 0, offset.x, offset.y)

      var length = node.children.length
      node.em = length === 0 ? 0 : emSum / length

      // TODO: resize children so vertical layout has the same widths, etc.
    }

    function tilestack( node) {
      pack( node)
      return node
    }

    tilestack.paddingEm = function(x) {
      if (!arguments.length) return paddingEm;
      paddingEm = x
      return tilestack
    };
    tilestack.translate = function(x) {
      if (!arguments.length) return translate;
      translate = x
      return tilestack
    };


    tilestack.utils = {
      pack: pack

    }
    tilestack.layouts = layouts


    return tilestack

  } // end trait.layout.tilestack


}(d3, d3.trait));
