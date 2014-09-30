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

function isString(obj) {
  return Object.prototype.toString.call(obj) == '[object String]'
}

beforeEach(function() {

  function toHaveClass( actual, expected) {
    var className = actual.className
    if( !isString(className) )
      className = className.baseVal
    var classes = className.trim().split(" ")
    return -1 !== classes.indexOf(expected);
  }

  jasmine.Expectation.addMatchers({
    toHaveClass:    function() {
      return {
        compare: function(actual, expected) {
          var pass = toHaveClass(actual, expected),
              message = 'Expected ' + actual.className + ' to be ' + expected
          return {
            pass:    pass,
            message: message
          }
        }
      }
    },

    // toBeElement( 'g')
    // toBeElement( 'g.className')
    toBeElement: function () {
      return {
        compare: function( actual, expected) {
          var pass, message
          var types = expected.split(".")
          var isElement = actual.tagName.toUpperCase() === types[0].toUpperCase()

          if( isElement) {
            if( types.length > 1 ) {
              pass = toHaveClass.call(this, actual, types[1]);
              message = pass ? 'Element ' + actual.tagName + ' with unexpected class ' + types[1]
                : 'Element ' + actual.tagName + ' with expected class ' + types[1]
            } else {
              pass = true
              message = 'Expected element ' + expected + ' found'
            }
          } else {
            pass = false
            message = 'Expected ' + actual.tagName + ' to be an element'
          }

          return {
            pass:    pass,
            message: message
          }
        }
      }
    }

  });
})
