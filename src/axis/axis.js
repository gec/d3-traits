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

  function orientFromConfig(axisChar, orient) {
    if( orient )
      return orient
    else
      return axisChar === 'x' ? 'bottom' : 'left'
  }

  /**
   * extentTicks: T: ticks on each extent. Overrides ticks.
   * ticks: Approximate number of ticks
   * @param config
   * @returns {{name: (*|Function|d3.trait.axis|d3.trait.axis|Function|Function), axisChar: string, accessData: *, axisMargin: (*|number), orient: *, ticks: (*|Function|Function|Function|Function|Function|Function|Function|Function|Function|Function|Function|Function|Function|Function|Function|Function|Function|Function|Function|null), extentTicks: (*|boolean)}}
   */
  function axisConfig(config) {
    var name = config.axis,        // x1, y1, x2, etc.
        axisChar = name.charAt(0), // x | y
        c = {
          name:        name,
          axisChar:    axisChar,
          accessData:  config[name],
          orient:      orientFromConfig(axisChar, config.orient),
          ticks:       config.ticks,
          extentTicks: config.extentTicks || false,
          tickSize:    config.tickSize,
          tickPadding: config.tickPadding,
          tickFormat:  config.tickFormat,
          nice:        config.nice,
          label:       config.label,
          lines:       config.lines
        }

    c.labelLineHeight = c.label ? (config.labelLineHeight || 14) : 0
    c.axisMargin = config.axisMargin || (40 + c.labelLineHeight)
    return c
  }

  // TODO: No! Delete this. We're using self.layoutAxis now! We do need to adjust 2 for extent label.
  function adjustChartMarginForAxis(_super, c) {
    switch( c.orient ) {
      case 'left':
        _super.plusMarginTop(2) // Make room for top extent label
        _super.plusMarginLeft(c.axisMargin)
        break;
      case 'bottom':
        _super.plusMarginBottom(c.axisMargin);
        break;
      case 'top':
        _super.plusMarginTop(c.axisMargin);
        break;
      case 'right':
        _super.plusMarginTop(2) // Make room for top extent label
        _super.plusMarginRight(c.axisMargin);
        break;
      default:
    }
  }

  function containerTransform(self, c) {

    switch( c.orient ) {
      case 'left':
        return 'translate(' + self.marginLeft() + ',' + self.marginTop() + ')';
      case 'bottom':
        return 'translate(' + self.marginLeft() + ',' + (self.chartHeight() + self.marginTop()) + ')';
      case 'top':
        return 'translate(' + self.marginLeft() + ',0)';
      case 'right':
        return 'translate(' + (self.marginLeft() + self.chartWidth()) + ',' + self.marginTop() + ')';
      default:
        return null;
    }
  }

  function axisTransform(self, c) {
    if( !c.label )
      return null;

    switch( c.orient ) {
      case 'left':
        return 'translate(' + c.labelLineHeight + ',0)';
      case 'bottom':
        return null;
      case 'top':
        return 'translate(0,' + c.labelLineHeight + ',0)';
      case 'right':
        return null;
      default:
        return null;
    }
  }

  function labelTransform(self, c, label) {
    if( !c.label )
      return null;

    var tx, ty,
        bBox = label.node().getBBox(),
        labelWidth2 = Math.round(bBox.width / 2),
        tXorY = c.axisMargin - c.labelLineHeight
    switch( c.orient ) {
      case 'left':
        tx = -c.axisMargin + c.labelLineHeight
        ty = self.chartHeight() / 2 + labelWidth2
        return 'translate( ' + tx + ',' + ty + ') rotate( -90)';
      case 'bottom':
        tx = self.chartWidth() / 2 - labelWidth2
        ty = c.axisMargin - c.labelLineHeight
        return 'translate( ' + tx + ',' + ty + ')';
      case 'top':
        tx = self.chartWidth() / 2 - labelWidth2
        ty = -c.axisMargin + c.labelLineHeight
        return 'translate( ' + tx + ',' + ty + ')';
      case 'right':
        tx = c.axisMargin - c.labelLineHeight
        ty = self.chartHeight() / 2 - labelWidth2
        return 'translate( ' + tx + ',' + ty + ') rotate( 90)';
      default:
        return null;
    }
  }

  function applyTickConfig(axis, scale, c) {
    if( c.extentTicks )
      axis.tickValues(scale.domain())
    else if( c.ticks )
      axis.ticks(c.ticks)

    if( c.tickSize )
      axis.tickSize(c.tickSize)
    if( c.tickPadding )
      axis.tickPadding(c.tickPadding)

    if( c.tickFormat )
      axis.tickFormat(c.tickFormat)
  }

  var AxisLineClass = 'axis-line'

  function makeLineClass( d) {
    return typeof(d) === 'object' && d.hasOwnProperty( 'class') ? AxisLineClass + ' ' + d['class'] : AxisLineClass
  }


  /**
   *
   * config.ticks
   *  ticks(d3.time.years) -- tick every year for time scale
   *  tickValues(x.domain())
   *  tickSubdivide(9) -- 10 subticks per tick
   *  tickSubdivide(9).tickSize(6, 3, 10) -- 10 (smaller) subticks and longer start/end ticks
   * @param _super
   * @param _config
   * @returns {Function}
   * @private
   */
  function _axisLinear(_super, _config) {
    var group, groupAxis, label, axis,
        c = axisConfig(_config),
        scale = _super[c.name]()  // ex: x1()

    function makeLinePath( d) {
      var v = isNaN( d) ? d.value : d,
          sv = scale(v)
      if( c.axisChar === 'x')
        return 'M' + sv + ','+'0L' + sv + ',' + _super.chartHeight()
      else
        return 'M0,' + sv + 'L' + _super.chartWidth() + ',' + sv
    }


    // TODO: No don't call this. We're using self.layoutAxis now!
    //adjustChartMarginForAxis( _super, c)

    function axisLinear(_selection) {
      var self = axisLinear

      _selection.each(function(_data) {
        var element = this

        if( !group ) {
          group = this._container.append('g').classed('axis', true)
          groupAxis = group.append('g').classed('axis-' + c.name, true)
          if( c.label )
            label = group.append('text').classed('axis-label axis-label-' + c.name, true)
          axis = d3.svg.axis()
        }

        axis.scale(scale)
          .orient(c.orient)
        applyTickConfig(axis, scale, c)

        // c.axisMargin is the width or height of the axis.
        self.layoutAxis(group, c.orient, c.axisMargin)

        //group.attr( {transform: containerTransform( self, c)})
        if( c.label ) {
          //groupAxis.attr( {transform: axisTransform( self, c)})
          label.text(c.label)
          label.attr({ transform: labelTransform(self, c, label) })
        }
        groupAxis.call(axis);

        // Do we have to provide a line to extend each end of the axis?
        if( _super.isMinRangeMargin(c.name) ) {

          var extData = d3.trait.utils.getScaleExtensions(_super, c.name, scale)

          var extension = groupAxis.selectAll("path.axis-extension")
            .data(extData)

          extension.enter()
            .append("path")
            .attr("class", "axis-extension")
            .attr("d", function(d) {
              return "M" + d[0] + ",0L" + d[1] + ",0";
            })

          extension.transition().duration(0)
            .attr("class", "axis-extension")
            .attr("d", function(d) {
              return "M" + d[0] + ",0L" + d[1] + ",0";
            })
        }

        if(c.lines && Array.isArray(c.lines)) {
          var line = groupAxis.selectAll('path.' + AxisLineClass)
            .data(c.lines)
          line.enter()
            .append("path")
            .attr("class", makeLineClass)
            .attr("d", makeLinePath)

          line.attr("class", "axis-line")
            .attr("d", makeLinePath)
        }


      })
    }

    axisLinear.update = function(type, duration) {
      this._super(type, duration)

      // Need this for extentTicks, maybe others
      //
      applyTickConfig(axis, scale, c)

      if( duration === 0 ) {
        groupAxis.call(axis);
      } else {
        groupAxis.transition()
          .duration(duration || _super.duration())
          .ease("linear")
          .call(axis);
      }

      return this;
    }

    _super.onRangeMarginChanged('axisLinear-' + c.name, axisLinear)

    return axisLinear;
  }

  function tickValuesForMonthDays(x) {
    var domain = x.domain()
    var minDate = domain[0]
    var maxDate = domain[ domain.length - 1]
    var everyDate = d3.time.day.range(minDate, maxDate);
    return everyDate.filter(function(d, i) {
      var date = d.getDate()
      //return date === 1 || date % 5 === 0;
      return date % 5 === 0;
    });
  }

  function _axisMonth(_super, _config) {
    var group, groupAxis, label, lastDomainMax,
        axis = d3.svg.axis(),
        scaleForUpdate = d3.time.scale(),
        c = axisConfig(_config),
        scale = _super[c.name]()

    // TODO: No don't call this. We're using self.layoutAxis now!
//        adjustChartMarginForAxis( _super, c)

    function axisMonth(_selection) {
      var self = axisMonth

      _selection.each(function(_data) {
        var element = this

        if( !group ) {
          group = this._container.append('g').classed('axis', true)
          groupAxis = group.append('g').classed('axis-' + c.name, true)
          if( c.label )
            label = group.append('text').classed('axis-label axis-label-' + c.name, true)
          axis = d3.svg.axis()
        }

        var domain = scale.domain()

        scaleForUpdate.range(scale.range())
        scaleForUpdate.domain(scale.domain())
        if( c.nice )
          scaleForUpdate.nice(c.nice)

        axis.scale(scaleForUpdate)
          .orient(c.orient)
        applyTickConfig(axis, scaleForUpdate, c)

        //.tickFormat(d3.time.format('%e')) // %d is 01, 02. %e is \b1, \b2
        //.ticks( 15)
        //.tickValues( tickValuesForMonthDays( scaleForUpdate))
        //.tickSubdivide(4)

        self.layoutAxis(group, c.orient, c.axisMargin)
        if( c.label ) {
          label.text(c.label)
          label.attr({ transform: labelTransform(self, c, label) })
        }

        group
//                    .attr({transform: containerTransform( self, c)})
          .call(axis);

        var extension = group.selectAll("path.axis-extension")
          .data(d3.trait.utils.isValidDate(domain[0]) ? [domain[0]] : [])

        extension.transition()
          .attr("class", "axis-extension")
          .attr("d", function(d) {
            return "M0,0L" + scaleForUpdate(d) + ",0";
          })

        extension.enter()
          .append("path")
          .attr("class", "axis-extension")
          .attr("d", function(d) {
            return "M0,0L" + scaleForUpdate(d) + ",0";
          })

        if( d3.trait.utils.isData(_data, _config.seriesData) )
          lastDomainMax = d3.trait.utils.extentMax(domain)

      })
    }

    function getScaleForUpdate() {

      // |<------- scale ------>|
      //   |<--scaleForUpdate-->|
      var domain = scale.domain() // original scale
      var domainMin = d3.trait.utils.extentMin(domain)
      var domainMax = d3.trait.utils.extentMax(domain)
      if( lastDomainMax ) {
        var lastDomainMaxTime = lastDomainMax.getTime()
        if( lastDomainMaxTime > domainMin.getTime() ) {
          var delta = domainMax.getTime() - lastDomainMaxTime
          domainMin = new Date(domainMin.getTime() + delta)
        }
      }
      return [domainMin, domainMax]
    }

    axisMonth.update = function(type, duration) {
      this._super(type, duration)

      scaleForUpdate.range(d3.trait.utils.getScaleRange(_super, c.name))

      var domainForUpdate = getScaleForUpdate()
      scaleForUpdate.domain(domainForUpdate)
      lastDomainMax = d3.trait.utils.extentMax(domainForUpdate)

      // slide the x-axis left for trends
      if( duration === 0 ) {
        group.call(axis);
      } else {
        group.transition()
          .duration(duration || _super.duration())
          .ease("linear")
          .call(axis);
      }
      return this;
    }

    _super.onChartResized('axisMonth-' + c.name, axisMonth)
    _super.onRangeMarginChanged('axisMonth-' + c.name, axisMonth)


    return axisMonth;
  }


  trait.axis.linear = _axisLinear


  if( !trait.axis.time )
    trait.axis.time = {}
  trait.axis.time.month = _axisMonth

}(d3, d3.trait));
