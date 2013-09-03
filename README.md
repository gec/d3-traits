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

```javascript
var myData = [
  {x: 1, y: 3},
  {x: 2, y: 5},
  {x: 4, y: 4}
]
var dataAccessors = {
  x1: function(d) { return d.x; },
  y1: function(d) { return d.y; },
}
d3.select("#my-chart-div")
  .datum( myData)
  .accessors( dataAccessors)
  .trait( d3.traits.chart.base)
  .trait( d3.traits.scale.linear.y)
  .trait( d3.traits.scale.ordinal.x)
  .trait( d3.traits.axis.x)
  .trait( d3.traits.axis.y)
  .trait( d3.traits.chart.bar)
```

[d3]: http://d3js.org/
[scala]: http://scala-lang.org/
