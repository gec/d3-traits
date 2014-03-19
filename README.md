# d3-traits

### Perfect charts. Minimal coding.

D3 charts via reusable traits (aka mixins)

### Problem

* [D3][d3] enables powerful visualizations, but no standard chart library.
* D3 isn't easy.
* D3 chart libraries hide D3 behind a limited set of options, so you never get exactly the chart you need.
* Chart libraries require a special format for data instead of the format it comes in.

### Solution

* Keep D3 front and center for easy customizations
* Extend D3 with a `trait` function
  * Traits are simple components that can be mixed together to create whole charts
  * A trait can be a list of traits
  * Users can create custom traits written in D3
* Extend D3 with a data `accessors` function so traits can access data in its native format
* Provide a standard set of charts (bar, line, pie) and chart components (axes, labels, interactions)

## Example

![Reef GUI Screenshot](https://github.com/gec/d3-traits/raw/master/screenshot.png)

```javascript
var chartEl = d3.select('#chart')
var myData = [
  {x: 1, y: 3},
  {x: 2, y: 5},
  {x: 4, y: 4}
]
var config = {
  x1: function(d) { return d.x; },
  y1: function(d) { return d.y; },
}
var chart = d3.trait( d3.trait.chart.base, config)
    .trait( d3.trait.scale.linear, { axis: "x1" })
    .trait( d3.trait.scale.linear, { axis: "y1" })
    .trait( d3.trait.chart.line, { interpolate: "linear" })
    .trait( d3.trait.axis.linear, { axis: "x1", ticks: 5 })
    .trait( d3.trait.axis.linear, { axis: "y1" })
    .trait( d3.trait.focus.tooltip, {})
var selection = chartEl.datum( data)
chart.call( selection)  
```

[d3]: http://d3js.org/
[scala]: http://scala-lang.org/
