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


  /**
   * Implementation inspired by: http://bl.ocks.org/ZJONSSON/3918369
   *
   * @param _super
   * @param _config
   * @param _id
   * @returns {legendStandard}
   * @private
   */
  function _legendStandard(_super, _config, _id) {

    var group, ul, box,
        legendPadding = 5

    var klass = { main: _config['class'] || 'd3-trait-legend'}
    klass.box = klass.main + '-box'
    klass.items = klass.main + '-items'
    klass.item = klass.main + '-item'


    function legendStandard(_selection) {
      var self = legendStandard

      _selection.each(function(_data) {
        var element = this

        var li, liEnter

        var marginLeft = _super.marginLeft() + 20
        var marginTop = _super.marginTop() + 20
        if( ! group) {

          group = element._container.append('g')
            .attr({
              'class':      klass.main
            });
          box = group.append('rect')
            .classed(klass.box,true)
          ul = group.append('g')
            .classed(klass.items,true)
            .attr('transform', 'translate('+marginLeft+','+marginTop+')')
        }


        var filtered = _config.legendFilter ? _data.filter(_config.legendFilter) : _data

//        li = ul.selectAll('.' + klass.item)
        li = ul.selectAll('.' + klass.item)
          .data(filtered)

        liEnter = li.enter()
//          .append('g')
//            .classed(klass.items,true)
//            .attr('transform', function(d,i) { return 'translate(0,'+i+'em)'})


        liEnter.append('text')
          .classed(klass.item,true)
//          .attr('y',0)
          .attr('y',function(d,i) { return i+'em'})
          .attr('x','1em')
          .text(_config.seriesLabel)

        liEnter.append('circle')
//          .attr('cy', '' + (-0.25) +'em')
          .attr('cy',function(d,i) { return i-0.3+'em'})
          .attr('cx',0)
          .attr('r','0.4em')
          .style('fill', self.color)


        li.exit()
          .remove()

        // Reposition and resize the box
        // BBox is bbox for ul group
        var lbbox = ul[0][0].getBBox()
        box.attr('x', Math.floor(marginLeft + lbbox.x-legendPadding) + 0.5)// add 0.5 so line is crisp!
          .attr('y', Math.floor(marginTop + lbbox.y-legendPadding) + 0.5)
          .attr('height', Math.ceil(lbbox.height+2*legendPadding))
          .attr('width', Math.ceil(lbbox.width+2*legendPadding))
      })
    }

    return legendStandard;

  }

  trait.legend.standard = _legendStandard

}(d3, d3.trait));
