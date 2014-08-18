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

//  function makeAxes( config) {
//    return {
//      x: config.xAxis || 'x1',
//      y: config.yAxis || 'y1'
//    }
//  }
//
//  function accessXDefault( d) { return d[0]}
//  function accessYDefault( d) { return d[1]}
//  function accessNull( d) { return d}
//  function accessIndex( d, i) { return i}
//
//  function accessorsXY( config, axes) {
//    return {
//      x: config[axes.x] || accessXDefault,
//      y: config[axes.y] || accessYDefault,
//      seriesData: config.seriesData || accessNull,
//      seriesName: config.seriesName || accessIndex
//    }
//  }
//
//  function makeConstantAccessors( proto, keys) {
//    var i = keys.length
//    while( --i >= 0) {
//      var key = keys[i]
//      makeConfigAccessor( proto, key)
//    }
//  }
//  function makeConfigAccessor( proto, key) {
//    var variable = '_' + key
//    proto[key] = function (x) {
//      if (!arguments.length) {
//        return this[variable]
//      }
//      this[variable] = x
//      return this
//    }
//  }
//
//
//  function Configuration( _config) {
//    this.axes = makeAxes( _config)
//    this.access = accessorsXY( _config, this.axes)
//    this._stacked = _config.stacked || false
//
//  }
//  Configuration.prototype.stacked = function( x) {
//    if (!arguments.length) return this._stacked;
//    this._stacked = x
//    return this
//  }
//
//
//  var allValidProps = {
//    focus: ['distance', 'axis']
//  }
//  Configuration.prototype.setGetProps = function( root, validProps, name, value, argLength) {
//    if (argLength < 2) {
//      if( name === 'string') {
//        return root[name]
////        return validProps.indexOf( name) >= 0 ? root[name] : undefined
//      }
//      else {
//        // name is an object with name-value pairs.
//        for( var key in name) {
//          if( validProps.indexOf( name) >= 0)
//            root[key] = name[key]
//        }
//      }
//    } else {
//      if( validProps.indexOf( name) >= 0)
//        root[name] = value
//    }
//    return this
//  }
//
//
//
//  // Focus
//  Configuration.prototype.focus = function( name, value) {
//    if( this.focus === undefined)
//      this.focus = {
//        distance: 14,
//        axis:     null
//      }
//    return this.setGetProps( this.focus, allValidProps.focus, name, value, arguments.length)
//  }
//
//
//
//
//  trait.config = function(_config) {
//    return new Configuration( _config);
//  }




  function emptyIfNotObjectOrNull( target) {
    return typeof(target) !== 'object' || target === null || target === 'undefined' ? {} : target
  }


  function updateDeep(target, o) {
    // Inspired by: https://github.com/danvk/dygraphs/blob/master/dygraph-utils.js updateDeep
    if (typeof(o) !== 'undefined' && o !== null) {
      for (var k in o) {
        if (o.hasOwnProperty(k)) {
          var val = o[k]
          target[k] = val === null || val === undefined ? val
            : Array.isArray(val) ? val.slice(0)
            : typeof(val) === 'object' ? updateDeep( emptyIfNotObjectOrNull(target[k]), val)
            : val
        }
      }
    }
    return target;
  }

  // Code depends on certain object hierarchies in the config. We don't want the user
  // to supply null to clip a whole object out of the config.
  //
  function wontOverwriteObjectWithNull( tVal, oVal) {
    // if tVal is not an object, we're OK
    // if tVal is an object then
    //  tVal  oVal
    // ----- -----
    // !null !null true deepUpdate
    //  null !null true assign with deep copy
    // !null  null false
    //  null  null // no op
    //
    if( typeof( tVal) !== 'object') {
      return true
    } else {
      var tNull = tVal === null || tVal === undefined
      var oNull = oVal === null || oVal === undefined
      var bothNotNull = ! tNull && ! oNull
      return bothNotNull || (tNull && ! oNull)
    }
  }

  /**
   * Nice idea to force the user config to match the default config. The problem is when
   * a config parameter can be a number or array or function. We would need extra meta data
   * to support this. Even with that, the Javascript type system isn't great at determining
   * types.
   *
   * @param target
   * @param o
   * @returns {*}
   */
  function updateExistingKeysDeep(target, o) {
    if( typeof(o) !== 'undefined' && o !== null) {
      for( var k in target) {
        if( target.hasOwnProperty(k) && o.hasOwnProperty(k)) {
          var tVal = target[k],
              oVal = o[k],
              oTyp = typeof oVal
          if( typeof(tVal) === oTyp && wontOverwriteObjectWithNull( tVal, oVal) )
          target[k] = oVal === null ? target[k] = null
            : Array.isArray(oVal) ? target[k] = oVal.slice(0)  // TODO: should we make array objects deep update?
            : oTyp === 'object' ? updateExistingKeysDeep( tVal, oVal)
            : oVal
        }
      }
    }
    return target
  }

  function makeConfig( defaultConfig, config) {
    var deepCopy = JSON.parse(JSON.stringify(defaultConfig))
    return updateDeep( deepCopy, config)
  }

  ///////////////////////////////////
  // Export to d3.trait
  //


//  trait.config.axes = makeAxes
//  trait.config.accessorsXY = accessorsXY
//  trait.config.Configuration = Configuration
//  trait.config.utils = {
//    makeConstantAccessors: makeConstantAccessors
//  }

}(d3, d3.trait));
