
describe('d3-traits', function() {

var chartDiv
var selection
var data = [
    {x: 1, y: 4},
    {x: 2, y: 5},
    {x: 3, y: 6}
]
var accessX1 = function(d) { return d.x; }
var accessY1 = function(d) { return d.y; }
var accessSeriesData = function(s) { return s}
var config = {
    x1: accessX1,
    y1: accessY1,
    seriesData: accessSeriesData
}

//    beforeEach(inject(function(n3utils) {
//        spyOn(n3utils, 'getDefaultMargins').andReturn(
//            {top: 20, right: 50, bottom: 30, left: 50}
//        )
//    }))

function _mockTrait( _super, _config) {
    var callCount = 0
    function mockTrait( _selection) {
        _selection.each(function(_data) {
            var element = this
            callCount ++
        })
    }
    mockTrait.callCount = function( count) {
        if (!arguments.length) return callCount;
        callCount = count
        return this;
    }
    mockTrait.super = function() { return _super }
    mockTrait.config = function() { return _config }

    return mockTrait
}
var mockTrait = _mockTrait

beforeEach(function() {
    chartDiv = affix( '.chart-div[style="width: 300px; height: 200px"]')
    selection = d3.select( ".chart-div")
})

function _t0( _super, _config, _id) {

    function t0( selection) {
    }
    t0.notOverridden = function() {
        return "notOverridden"
    }
    t0.a = function( arg) {
        return "t0.a(" + arg + ")"
    }
    t0.b = function() {
        return "t0.b"
    }
    t0.callA = function(arg) {
        return this.a(arg)
    }
    return t0
}
function _t1( _super, _config, _id) {

    function t1( selection) {
        var self = t1
       self.a( "t1")
    }
    t1.a = function(arg) {
        return this._super(arg) + " t1.a"
    }
    return t1
}
function _t2( _super, _config, _id) {

    function t2( selection) {

    }
    t2.a = function(arg) {
        return this._super(arg) + " t2.a"
    }
    t2.b = function() {
        return this._super() + " t2.b"
    }
    return t2
}

it('d3.trait() should setup vtable', function() {
    var t0 = d3.trait( _t0)
    expect( t0.a('someArg') ).toBe( 't0.a(someArg)')

    var t1 = d3.trait( _t0)
        .trait( _t1)
    expect( t1.a('someArg') ).toBe( 't0.a(someArg) t1.a')

    spyOn(t1, 'a').andCallThrough()
    t1.call( selection)
    expect( t1.a ).toHaveBeenCalledWith( 't1')

    var t2 = d3.trait( _t0)
        .trait( _t1)
        .trait( _t2)
    expect( t2.a('someArg') ).toBe( 't0.a(someArg) t1.a t2.a')
    expect( t2.b() ).toBe( 't0.b t2.b')
    expect( t2.callA('someArg') ).toBe( 't0.a(someArg) t1.a t2.a')
    expect( t2.notOverridden() ).toBe( 'notOverridden')
});


it('should find the selection', function() {
    expect( selection.length).toBe( 1)
    expect( selection[0].length).toBe( 1)
    expect( selection[0][0].tagName).toBe( "DIV")
});

it('.traitConfig should set _traitsConfig on selection', function() {

    selection.datum( data)
        .traitConfig( config)

    expect( selection._traitsConfig).toBeDefined()
    expect( selection._traitsConfig.x1).toEqual( accessX1)
    expect( selection._traitsConfig.y1).toEqual( accessY1)
    expect( selection._traitsConfig.seriesData).toEqual( accessSeriesData)
});

it('.trait() should add trait to selection', function() {
    selection.datum( data)
        .trait( mockTrait)
    expect( selection.traits).toBeDefined()
    expect( selection.traits.length).toBe( 1)
});

it('.trait() and .callTraits() should each call trait once', function() {
    selection.datum( data)
        .trait( mockTrait)
    var traitInstance = selection.traits[0]
    expect( traitInstance.callCount()).toBe(1)
    selection.callTraits()
    expect( traitInstance.callCount()).toBe(2)
});


it('selection.callTraits() should call each trait', function() {

    selection.datum( data)
        .trait( mockTrait)
        .trait( mockTrait)

    expect( selection.traits[0].callCount()).toBe(1)
    expect( selection.traits[1].callCount()).toBe(1)

    selection.callTraits()
    expect( selection.traits[0].callCount()).toBe(2)
    expect( selection.traits[1].callCount()).toBe(2)


});

it('.trait should stack traits and setup _super', function() {

    var config = { someConfig: "someConfig"}
    function anotherFunction( value) {
        if (!arguments.length) return config.someConfig;
        config.someConfig = value
        return this;
    }

    // Add anotherFunction() to traits[0] and it should be available
    // on traits[1] via _super.
    //
    // callCount() is defined on every mockTrait, so it should be unique
    // for each trait instance and not reference super.
    //
    selection.datum( data)
        .traitConfig( config)
        .trait( mockTrait)
    selection.traits[0].anotherFunction = anotherFunction

    selection
        .trait( mockTrait)

    expect( selection.traits[1].super()).toBe( selection.traits[0])

    // traits[1].anotherFunction should call traits[0].anotherFunction
    expect( selection.traits[1].anotherFunction()).toBe( "someConfig")
    selection.traits[0].anotherFunction( "differentConfig")
    expect( selection.traits[1].anotherFunction()).toBe( "differentConfig")

    // traits[1].callCount should NOT call traits[0].callCount
    selection.traits[1].callCount(0)
    selection.traits[0].callCount(-1) // should not affect traits[1]
    expect( selection.traits[1].callCount()).toBe( 0)

});

it('.traitConfig and .trait should setup default and override configs', function() {

    var defaultConfig = { someConfig: "someConfig" }
    var extraConfig = { extraConfig: "extraConfig"}

    var differentConfig = $.extend( {someConfig: "someConfig"}, extraConfig)
    var defaultAndExtraConfig = $.extend( {}, defaultConfig, extraConfig)

    selection.datum( data)
        .traitConfig( defaultConfig)
        .trait( mockTrait)
        .trait( mockTrait, differentConfig)
        .trait( mockTrait)
        .trait( mockTrait, extraConfig)

    expect( selection.traits[0].config()).toEqual( defaultConfig)
    expect( selection.traits[1].config()).toEqual( differentConfig)
    expect( selection.traits[2].config()).toEqual( defaultConfig)
    expect( selection.traits[3].config()).toEqual( defaultAndExtraConfig)
});


});


