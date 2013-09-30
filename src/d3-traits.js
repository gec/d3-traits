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

function getTraitCache( element, traitInstanceId) {
    var elStore = element[traitInstanceId]
    if( !elStore) {
        element[traitInstanceId] = {}
        elStore = element[traitInstanceId]
    }
    return elStore
}

/**
 * Is this an x scale, axis, etc.
 * @param scaleName  'x1', 'x2', etc.
 * @returns {boolean}
 */
function isX( scaleName) { return scaleName.charAt(0) === 'x'}

/**
 * Is this a y scale, axis, etc.
 * @param scaleName  'y1', 'y2', etc.
 * @returns {boolean}
 */
function isY( scaleName) { return scaleName.charAt(0) === 'y'}

function extentMax( extent) { return extent[ extent.length - 1] }

function getChartRange( _super, name) {
    // SVG origin is top-left
    if( d3.trait.utils.isX( name))
        return [ _super.minRangeMarginLeft( name), _super.chartWidth() - _super.minRangeMarginRight( name)]
    else
        return [ _super.chartHeight() - _super.minRangeMarginBottom( name), _super.minRangeMarginTop( name)]
}

function configFloat( valueConfig, valueDefault) {
    var vc = parseFloat( valueConfig)
    return isNaN( vc) ? valueDefault : vc
}
function configMargin( marginConfig, marginDefault) {
    if( ! marginConfig)
        return marginDefault

    var margin = {}
    margin.top = configFloat( marginConfig.top, marginDefault.top)
    margin.right = configFloat( marginConfig.right, marginDefault.right)
    margin.bottom = configFloat( marginConfig.bottom, marginDefault.bottom)
    margin.left = configFloat( marginConfig.left, marginDefault.left)
    return margin
}

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

function Trait( trait, config, _super) {
    //console.log( "trait( " + trait.name + ")")



    var id, imp,
        self = this,
        traitIndex = 0

    self._config = config
    self._super = _super
    self._traitIndex = 0
    if( _super)
        self._traitIndex = _super.__traitIndex + 1

    self.getTraitId = function( name, index) { return "_" + name + "_" + index }


    self.getImp = function() { return self.imp}

    config = extendTraitsConfig( config, self.__getRoot()._config)
    id = self.getTraitId( trait.name, self._traitIndex)
    imp = trait( _super, config, id)
    stackTrait( _super, imp)
    //imp.prototype = Trait.prototype
    imp.call = Trait.prototype.call
    imp.callInstance = Trait.prototype.callInstance
    imp.trait = Trait.prototype.trait
    imp.__traitIndex = traitIndex
    imp.__traitId = id
    imp.__getRoot = Trait.prototype.__getRoot
    imp._super = _super
    imp._config = config
    self.imp = imp
}

Trait.prototype = {

    trait: function( _trait, config) {
        //console.log( ".trait( " + _trait.name + ")")
        var t = new Trait( _trait, config, this)
        var imp = t.getImp()
        return imp
    },

    __getRoot: function() {
        if( this._super)
            return this._super.__getRoot()
        else
            return this
    },

    callInstance: function( _selection) {
        var self = this
        _selection.call( function( selection) {
            selection.each( function( _data) {
//                if( ! this[self.__traitId])
//                    this[self.__traitId] = {}
//                self( _data, selection, this[self.__traitId]) // callee example: traitName( selection, data, traitStore)
                self( _data, selection) // callee example: traitName( selection, data, traitStore)
                //self.apply( this[self.__traitId], [this, _data, selection] ) // callee example: traitName( element, data, selection)
            })

        })
    },

    call: function( _selection, leafTrait) {
        if( ! leafTrait)
            leafTrait = this
        this.__leafTrait = leafTrait
        if( this._super)
            this._super.call( _selection, leafTrait)

        //this.callInstance( _selection)
        _selection.call( this)
        return this
    }


}
Trait.prototype.constructor = Trait

d3.selection.prototype.trait = function( trait, config)
{
    if( Array.isArray( trait) ) {
        for( var index in trait)
            this.trait( trait[index])
    } else {
        //console.log( ".trait( " + trait.name + ")")
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
        //console.log( ".callTraits  " + index + " " + traitInstance.name)
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

function trait( aTrait, config) {
    return new Trait( aTrait, config).getImp()
}

// Export traits to d3
d3.trait = trait
d3.trait.scale = {}
d3.trait.chart = { utils: {} }
d3.trait.axis = {}
d3.trait.control = {}
d3.trait.focus = {}
d3.trait.legend = {}

d3.trait.utils = {
    clone: clone,
    extend: extendObject,
    isX: isX,
    isY: isY,
    extentMax: extentMax,
    getChartRange: getChartRange,
    getTraitCache: getTraitCache,
    configMargin: configMargin,
    configFloat: configFloat
}

}(d3));