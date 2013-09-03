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
(function (d3) {

Array.isArray = Array.isArray || function (vArg) {
    return Object.prototype.toString.call(vArg) === "[object Array]";
};

// Export traits to d3
d3.traits = {
    chart: {},
    scale: {},
    axis: {}
}

/**
 * Copy all the properties for the super to the new trait.
 * @param superTrait
 * @param newTrait
 */
var stackTrait = function(superTrait, newTrait) {
    //newTrait._super = superTrait
    // Copy the properties over onto the new trait
    for (var name in superTrait) {
        if( !(name in newTrait))
            newTrait[name] = superTrait[ name]
    }
};

function clone( obj) {
    if (null == obj || "object" !== typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function extendObject( obj, extensions) {
    for (var key in extensions) {
        if (! obj.hasOwnProperty(key))
            obj[key] = extensions[key];
    }
    return obj
}
function makeTraitAccessors( defaultAccessors, accessors) {
    var obj = clone( accessors)
    if( !obj)
        obj = {}
    return extendObject( obj, defaultAccessors)
}

d3.selection.prototype.trait = function( trait, accessors, args)
{
    if( Array.isArray( trait) ) {
        for( var index in trait)
            this.trait( trait[index])
    } else {
        console.log( ".trait( " + trait.name + ")")
        this._traitsInitialize()

        var traitCount = this.traits.length

        var _super = {}
        if( traitCount > 0)
            _super = this.traits[ traitCount-1]

        var traitAccessors = makeTraitAccessors( this._access, accessors)
        var traitInstance = trait( _super, traitAccessors, args)
        stackTrait( _super, traitInstance)

        this.call( traitInstance)
        this.traits.push( traitInstance)
    }
    return this
}

d3.selection.prototype.callTraits = function() {

    for( var index in this.traits) {
        var traitInstance = this.traits[ index]
        console.log( ".callTraits  " + index + " " + traitInstance.name)
        this.call( traitInstance)
    }
    return this
}

var DEFALUT_ACCESSORS = {
    seriesFilter: function( d, i) { return true}
}

d3.selection.prototype._traitsInitialize = function() {
    if( ! this._access)
        this._access = clone( DEFALUT_ACCESSORS)
    if( ! this.traits)
        this.traits = []
    return this
}

d3.selection.prototype.accessors = function( accessors)
{
    this._traitsInitialize()
    for( var key in accessors) {
        this._access[key] = accessors[key]
    }
    return this
}
}(d3));