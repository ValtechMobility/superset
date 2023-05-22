/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { useEffect } from 'react';
// @ts-ignore
import { styled } from '@superset-ui/core';
import * as d3 from 'd3';
import { Arc } from 'd3';
import {
  GeoData,
  PluginCountryMapPieChartProps,
  PluginCountryMapPieChartStylesProps,
  Point,
} from './types';
// eslint-disable-next-line import/extensions
import * as geoData from './data/geo.json';

// The following Styles component is a <div> element, which has been styled using Emotion
// For docs, visit https://emotion.sh/docs/styled

// Theming variables are provided for your use via a ThemeProvider
// imported from @superset-ui/core. For variables available, please visit
// https://github.com/apache-superset/superset-ui/blob/master/packages/superset-ui-core/src/style/index.ts

const Styles = styled.div<PluginCountryMapPieChartStylesProps>`
  padding: ${({ theme }) => theme.gridUnit * 4}px;
  border-radius: ${({ theme }) => theme.gridUnit * 2}px;
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;

  h3 {
    /* You can use your props to control CSS! */
    margin-top: 0;
    margin-bottom: ${({ theme }) => theme.gridUnit * 3}px;
    font-size: ${({ theme, headerFontSize }) =>
      theme.typography.sizes[headerFontSize]}px;
    font-weight: ${({ theme, boldText }) =>
      theme.typography.weights[boldText ? 'bold' : 'normal']};
  }
`;

/**
 * ******************* WHAT YOU CAN BUILD HERE *******************
 *  In essence, a chart is given a few key ingredients to work with:
 *  * Data: provided via `props.data`
 *  * A DOM element
 *  * FormData (your controls!) provided as props by transformProps.ts
 */

export default function PluginCountryMapPieChart(
  props: PluginCountryMapPieChartProps,
) {
  const { data, height, width } = props;
  const dummyData = [2, 4, 8, 10];

  const color = d3.scaleOrdinal([
    '#4daf4a',
    '#377eb8',
    '#ff7f00',
    '#984ea3',
    '#e41a1c',
  ]);

  // Generate the pie
  const pie = d3.pie();

  // Generate the arcs
  const arc = d3.arc().innerRadius(0).outerRadius(100);

  useEffect(() => {
    const projection = d3
      .geoMercator()
      .center([4, 47]) // GPS of location to zoom on
      .scale(100) // This is like the zoom
      .translate([width / 2, height / 2]);

    // @ts-ignore
    // @ts-ignore
    d3.select('#country_pie_map')
      .classed('plugin-country-map-pie-chart', true)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('id', 'groot')
      .selectAll('path')
      .data(geoData.features)
      .enter()
      .append('path')
      .attr('fill', '#888888')
      .attr('d', d3.geoPath().projection(projection))
      .attr('id', d => (d as GeoData).iso)
      .style('stroke', 'black')
      .style('opacity', 0.3);

    d3.select('#FR').attr('fill', '#770000');

    d3.select('#groot')
      .append('circle')
      .attr('cx', 100)
      .attr('cy', 100)
      .attr('r', 50)
      .attr('stroke', 'black')
      .attr('fill', '#69a3b2');

    // d3.select('#svgroot')
    //   // .append('svg')
    //   // .attr('width', 200)
    //   // .attr('height', 200)
    //   .append('g')
    //   .attr('transform', `translate(100,100)`)
    //   .selectAll('arc')
    //   .data(pie(dummyData))
    //   .enter()
    //   .append('g')
    //   .attr('class', 'arc')
    //   .attr('fill', function (d, i) {
    //     return color(String(i));
    //   })
    //   .attr('d', arc);
  }, []);

  const selected = 'France';

  return (
    <Styles
      boldText={props.boldText}
      headerFontSize={props.headerFontSize}
      scale={800}
      center={new Point()}
      height={30}
      width={30}
    >
      <h3>Campaign Status {selected}</h3>
      <div id="country_pie_map" />
    </Styles>
  );
}
