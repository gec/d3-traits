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
Array.prototype.clone = function() {
    return this.slice(0);
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

/**
 * Extend the first object with the properties from the second, third, etc. objects.
 * Ignore properties that are null or undefined.
 *
 * @param target
 * @param obj, obj, ...
 * @returns The first object merged with the following objects.
 */
function extendObject() {
    var i, options, key, value,
        target = arguments[0] || {},
        length = arguments.length;

    for ( i = 1; i < length; i++ ) {
        // Ignore non-null/undefined values
        if ( (options = arguments[ i ]) != null ) {
            // Extend the target object
            for ( key in options ) {
                value = options[key]
                if( value)
                    target[key] = value
            }
        }
    }

    return target
}

/**
 * Extend the first object with the properties from the second.
 * Do not overwrite any properties of the first object.
 * Ignore properties that are null or undefined.
 *
 * @param target
 * @param extensions
 * @returns {*}
 */
function extendObjectNoOverwrite( target, extensions) {
    for (var key in extensions) {
        if (! target.hasOwnProperty(key))
            if( extensions[key])
                target[key] = extensions[key];
    }
    return target
}
function extendTraitsConfig( config, defaultConfig) {
    var obj = clone( config)
    if( !obj)
        obj = {}
    return extendObjectNoOverwrite( obj, defaultConfig)
}

function Trait( _traitFunction, config, _super) {
    console.log( "trait( " + _traitFunction.name + ")")

    var self = this
    this._config = config
    this._super = _super

    this.getImp = function() { return self.imp}

    config = extendTraitsConfig( config, this.getBaseConfig())
    self.imp = _traitFunction( _super, config )
    stackTrait( _super, self.imp)
    //self.imp.prototype = Trait.prototype
    self.imp.call = Trait.prototype.call
    self.imp.trait = Trait.prototype.trait
    self.imp.getBaseConfig = Trait.prototype.getBaseConfig
    self.imp._super = _super
    self.imp._config = config
}

Trait.prototype = {

    trait: function( _trait, config) {
        console.log( ".trait( " + _trait.name + ")")
        var t = new Trait( _trait, config, this)
        var imp = t.getImp()
        return imp
    },

    getBaseConfig: function() {
        if( this._super)
            return this._super.getBaseConfig()
        else
            return this._config
    },

    call: function( _selection) {
        if( this._super)
            this._super.call( _selection)
        _selection.call( this)
        return this
    }


}
Trait.prototype.constructor = Trait

function traitsTrait( trait, config) {
    return new Trait( trait, config).getImp()
}
d3.traits.trait = traitsTrait

d3.selection.prototype.trait = function( trait, config)
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

        var _config = extendTraitsConfig( this._traitsConfig, config)
        var traitInstance = trait( _super, _config, this)
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

var DEFAULT_TRAITS_CONFIG = {
//    seriesFilter: function( d, i) { return true}
}

d3.selection.prototype._traitsInitialize = function() {
    if( ! this._traitsConfig)
        this._traitsConfig = clone( DEFAULT_TRAITS_CONFIG)
    if( ! this.traits)
        this.traits = []
    return this
}

d3.selection.prototype.traitConfig = function( config)
{
    this._traitsInitialize()
    for( var key in config) {
        this._traitsConfig[key] = config[key]
    }
    return this
}

d3.traits.utils = {
    clone: clone,
    extend: extendObject
}
}(d3));