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

//    var a, b, c, d, e
//
//    var t1 = d3.trait( a)       // 1
//            .trait( b, {})      // 1
//            .trait( c, {})      // 1
//            .config( { x1: 1})
//
//    var t2 = d3.trait( t1 )     // .. 1, 3
//            .trait( d, {})      // 2, 3
//            .trait( e, {})      // 2, 3
//            .config( { x1: 2, y1: 3})
//
//    var t3 = d3.trait( c)
//            .config( { x1: 3})
//            .trait( d, {})
//            .trait( e, {})
//            .config( { x1: 4})

var DEBUG = false

Array.isArray = Array.isArray || function (vArg) {
    return Object.prototype.toString.call(vArg) === "[object Array]";
};

/**
 * Copy all the properties for the super to the new trait.
 * @param superTrait
 * @param newTrait
 */
function stackTrait( superTrait, newTrait) {
    //newTrait._super = superTrait
    // Copy the properties over onto the new trait
    for (var name in superTrait) {
        if( !(name in newTrait))
            newTrait[name] = superTrait[ name]
    }
}

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

function extentMin( extent) { return extent[ 0] }
function extentMax( extent) { return extent[ extent.length - 1] }

function isData( _data, accessSeries) {
    return d3.max( _data, function(s) { return accessSeries(s ).length}) > 0
}

function isValidDate(d) {
    if ( Object.prototype.toString.call(d) !== "[object Date]" )
        return false;
    return !isNaN(d.getTime());
}

function getScaleRange( _super, name) {
    // SVG origin is top-left
    if( d3.trait.utils.isX( name))
        return [ _super.minRangeMarginLeft( name), _super.chartWidth() - _super.minRangeMarginRight( name)]
    else
        return [ _super.chartHeight() - _super.minRangeMarginBottom( name), _super.minRangeMarginTop( name)]
}

function getScaleExtensions( _super, name, scale) {
    var domainExtent = scale.domain()
    // SVG origin is top-left
    if( d3.trait.utils.isX( name))
        return [
            [0, scale( domainExtent[0])],
            [scale(domainExtent[1]), _super.chartWidth()]
        ]
    else
        return [
            [0, scale( domainExtent[0])],
            [ scale(domainExtent[1]), _super.chartHeight()]
        ]
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

function TraitOld( trait, config, _super) {
    //if( DEBUG) console.log( "trait( " + trait.name + ")")

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
function Trait( _trait, _config, _super) {
    if( DEBUG) console.log( "trait( " + _trait.name + ")")

    var id, imp,
        self = this

    self.config = _config
    self._super = _super
    self.index = -1
    self.__leafTrait = null


    function makeTraitId( name, index) { return "_" + name + "_" + index }

    self.getImp = function() { return imp}

    self.trait = function( _trait, config) {
        //if( DEBUG) console.log( ".trait( " + _trait.name + ")")
        var t = new Trait( _trait, config, imp)
        return t.getImp()
    }

//    self.config = function( _config) {
//        //if( DEBUG) console.log( ".config( {...})")
//        if( self._super)
//            self._super.config( _config)
//
//        if( _trait instanceof Trait)
//            _trait.config( _config)
//        else
//            self.configs.push( _config)
//        return self
//    }

    self.call = function( _selection, leafTrait) {
        if( ! leafTrait)
          leafTrait = this
        if( ! this.__leafTrait)
          this.__leafTrait = leafTrait

        if( this._super)
          this._super.call( _selection, leafTrait)
        _selection.call( imp)
        return imp
    }

    self.callTraits = function( _selection) {
        if( this.__leafTrait)
          return this.__leafTrait.call( _selection)
        else
          return this
    }

    function makeVirtual( name, fn, _superFn) {
        if( DEBUG) console.log( "makeVirtual " + name)
        return (function(name, fn){
            return function() {
                var tmp = this._super;

                // Add a new ._super() method that is the same method
                // but on the super-class
                this._super = _superFn;

                // The method only need to be bound temporarily, so we
                // remove it when we're done executing
                var ret = fn.apply(this, arguments);
                this._super = tmp;

                return ret;
            };
        })(name, fn)
    }
    self.__replaceVirtual = function( name, fn) {
        if( imp.hasOwnProperty( name))
            imp[name] = fn
        if( _super)
            _super.__replaceVirtual( name, fn)
    }

    self.__virtualize = function( name, fn) {
        if( DEBUG) console.log( "__virtualize begin " + _trait.name + " name=" + name)

        var virtual = null
        if( imp.hasOwnProperty( name) && typeof imp[name] === "function" ) {
            // The first parent has the same function.
            // The parent's version could be normal or virtualized.
            //
            if( DEBUG) console.log( "__virtualize " + _trait.name + " name=" + name + " hasFunction")
//            var original = '__original__' + name

            // imp[name] could be virtualized or normal
            virtual = makeVirtual( name, fn, imp[name])

//            if( ! imp.hasOwnProperty( original)) {
//                if( DEBUG) console.log( "__virtualize " + _trait.name + " name=" + name + " newly virtualized save original")
//                // save original
//                imp[original] = imp[name]
//            }
            imp[name] = virtual
            if( _super)
                _super.__replaceVirtual( name, virtual)
        } else {
            if( DEBUG) console.log( "__virtualize " + _trait.name + " name=" + name + " hasFunction NOT  ")
        }
//        if( _super)
//            virtual = _super.__virtualize( name, fn)
        return virtual
    }
    //       self.a  this._super()
    // t0 a  t3.a    -
    // t1    t3.a    t0.a
    // t2 a  t3.a    t0.a
    // t3 a  t3.a    t2.a
    //
    // t0 a  a
    //
    // t0 a  vt1.a   t0.a  __original__a
    // t1 a  vt1.a   t0.a  __original__a
    //
    // t0 a  vt2.a    -
    // t1 a  vt2.a    vt1.a  t0.a
    // t2 a  vt2.a    vt1.a  t0.a
    //
    // _stack[0] is most derived trait imp.
    //
    self.__makeVTable = function() {
        if( DEBUG) console.log( "__makeVTable begin " + _trait.name)

        var name, virtualized

        for( name in imp) {

            virtualized = _super.__virtualize( name, imp[name])
            if( virtualized) {
                if( DEBUG) console.log( _trait.name +".__makeVTable name " + name + "   virtualized")
//                imp[ '__original__' + name] = imp[name]
                imp[name] = virtualized
            } else {
                if( DEBUG) console.log( _trait.name +".__makeVTable name " + name + " ! virtualized")
            }

        }

        // Replicate super methods in imp; no overrides.
        for( name in _super) {
            //if( DEBUG) console.log( _trait.name +".__makeVTable replicate " + name + "  in _super")
            if( !(name in imp))
                imp[name] = _super[ name]
        }

        if( DEBUG) console.log( "__makeVTable end")
    }

    self.__getRoot = function() {
        if( self._super)
            return self._super.__getRoot()
        else
            return self
    },

    // TODO: make config from configs

//    config = extendTraitsConfig( config, self.__getRoot()._config)
    id = makeTraitId( _trait.name, self._traitIndex)
    if( _super)
        self.config = extendTraitsConfig( _config, self.__getRoot().config)

    imp = _trait( _super, self.config, id)

    if( _super)
        self.__makeVTable()


    imp.call = self.call
    imp.callTraits = self.callTraits
    imp.trait = self.trait
    imp.getImp = self.getImp
    imp.config = self.config
    imp.__makeVTable = self.__makeVTable
    imp.__virtualize = self.__virtualize
    imp.__replaceVirtual = self.__replaceVirtual
    imp.__getRoot = self.__getRoot
    imp._super = _super
}

Trait.prototype = {

    trait: function( _trait, config) {
        //if( DEBUG) console.log( ".trait( " + _trait.name + ")")
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
        //if( DEBUG) console.log( ".trait( " + trait.name + ")")
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
        //if( DEBUG) console.log( ".callTraits  " + index + " " + traitInstance.name)
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
    isData: isData,
    isValidDate: isValidDate,
    extentMin: extentMin,
    extentMax: extentMax,
    getScaleRange: getScaleRange,
    getScaleExtensions: getScaleExtensions,
    getTraitCache: getTraitCache,
    configMargin: configMargin,
    configFloat: configFloat
}

}(d3));