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

### HTML
```html
<body>
  <div id="chart" style="height: 240px;"></div>
  <div id="brush-chart" style="height: 66px; margin-top: 30px;"></div>
</body>
```

### Javascript

Define some data.
```javascript
var data = [
   {  // Series zero
      name: 'Energy',
      values: [
         { date: new Date( 2014, 1, 1, 0, 0, 0, 0),  value: 10 },
         ...
      ]
   },
   // mmre series ... 
]
```

Configure the accessors for each series and the data within each series.
```javascript

var config = {
   x1: function(d) { return d.date; },
   y1: function(d) { return d.value; },
   seriesData: function(s) { return s.values}
   seriesLabel: function(s) { return s.name}
}
```

Need a trait for each component of the chart.
```javascript
var chart = d3.trait( d3.trait.chart.base, config)
   // X & Y scales
   .trait( d3.trait.scale.time,   { axis: "x1"})
   .trait( d3.trait.scale.linear, { axis: "y1" })
   // Area chart is series 0, line chart is series 1
   .trait( d3.trait.chart.area,   { seriesFilter: function ( s, i) { return i == 0} })
   .trait( d3.trait.chart.line,   { seriesFilter: function ( s, i) { return i == 1} })
   // Show an X & Y axis and a legend
   .trait( d3.trait.axis.time.month, { axis: "x1", ticks: 5 })
   .trait( d3.trait.axis.linear,  { axis: "y1" })
   .trait( d3.trait.legend.series, {})

var chartEl = d3.select('#chart')
var selection = chartEl.datum( data)
chart.call( selection)
```

Bottom chart can be any type of chart. The "brush" trait targets the top chart
```javascript
var brushChart = d3.trait( d3.trait.chart.base, config)
   .trait( d3.trait.scale.time, { axis: "x1"})
   .trait( d3.trait.scale.linear, { axis: "y1" })
   .trait( d3.trait.chart.area, {})  // "linear"
   .trait( d3.trait.control.brush, { axis: 'x1', target: chart, targetAxis: 'x1'})
   .trait( d3.trait.axis.time.month, { axis: "x1", ticks: 3})
   .trait( d3.trait.axis.linear, { axis: "y1", extentTicks: true})
var brushChartEl = d3.select('#brush-chart')
selection = brushChartEl.datum( data)
brushChart.call( selection)
                
```

[d3]: http://d3js.org/
[scala]: http://scala-lang.org/
