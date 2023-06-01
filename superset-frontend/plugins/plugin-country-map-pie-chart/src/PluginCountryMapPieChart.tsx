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
import {
  GeoData,
  PluginCountryMapPieChartProps,
  PluginCountryMapPieChartStylesProps,
  Point,
  UpdateData,
} from './types';
// eslint-disable-next-line import/extensions
import * as geoData from './data/geo.json';

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

  .pie-chart {
    opacity: 1;
    box-shadow: -4px 5px 5px 0px black;
  }

  .tooltip {
    background-color: white;
    padding: 5px;
    border-radius: 10px;
  }

  .selected-country {
    stroke: #7d9485;
    stroke-linecap: round;
    fill: #c2e0c8;
  }

  .unselected-country {
    stroke: #7d9485;
    stroke-linecap: round;
    fill: #c2e0c8;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(5px);
    font: 400 5px/1.5 'Source Sans Pro', 'Noto Sans', sans-serif;
  }

  .place-label {
    fill: #000;
    font: 400 10px/1.5 'Source Sans Pro', 'Noto Sans', sans-serif;
  }
`;

export default function PluginCountryMapPieChart(
  props: PluginCountryMapPieChartProps,
) {
  const { data, height, width } = props;
  const countries = [];
  data.forEach(function (entry: UpdateData) {
    const countryIso = entry.country_iso;
    if (
      countries.filter(function (x: string) {
        return x === countryIso;
      }).length === 0
    )
      countries.push(countryIso);
  });

  // Todo: This is an artificial filter, we should remove this before deployment
  // countries = ['IT', 'DE', 'FR', 'PT'];

  let selected = '';
  let center = [7, 55];
  let scale = 800;
  let radius = 15; // Todo Relative to amount of vehicles
  if (countries.length === 1) {
    const filtered = geoData.features.filter(function (f) {
      return f.iso === countries[0];
    })[0];
    selected = filtered.properties.name;
    center = filtered.centroid;
    scale = 2000;
    radius = 100;
  }

  const color = d3
    .scaleOrdinal()
    .range(['#F80556', '#008833', '#D8D3F8', '#7E24FF', '#FAA000']);

  const pie = d3
    .pie()
    .sort(null)
    .value(function (d) {
      return d['COUNT(pie_detail)'];
    });

  const centerX = width / 2;
  const centerY = height / 2;
  const projection = d3
    .geoTransverseMercator()
    .center(center)
    .scale(scale) // This is like the zoom
    .translate([centerX, centerY]);

  // canvas of the world map
  const svg = d3
    .select('#country_pie_map')
    .select('#canvas')
    .attr('id', 'groot')
    .attr('style', 'background-color:#92B4F2;')
    .attr('width', width)
    .attr('height', height)
    .append('g');


  // outline of countries
  svg
    .append('g')
    .selectAll('path')
    .data(geoData.features)
    .enter()
    .append('path')
    .attr('d', d3.geoPath().projection(projection))
    .attr('id', d => (d as unknown as GeoData).iso)
    .attr('class', 'unselected-country')
    .attr('filter', 'blur(5px)');


  // country label
  svg
    .append('g')
    .selectAll('text')
    .data(geoData.features)
    .enter()
    .append('text')
    .attr('id', d => `${(d as unknown as GeoData).iso}Label`)
    .attr('class', 'place-label')
    .attr('transform', function (d) {
      return `translate(${projection([d.centroid[0] - 1.7, d.centroid[1]])})`;
    })
    .attr('text-anchor', 'end')
    .text(function (d) {
      return d.properties.name;
    })
    .attr('class', 'unselected-country')
    .attr('filter', 'blur(5px)');

  // tooltip
  const div = d3
    .select('#country_pie_map')
    .select('#tooltip_text')
    .attr('class', 'tooltip');

  useEffect(() => {
    d3.selectAll('.selected-country')
      .attr('class', 'unselected-country')
      .attr('filter', 'blur(5px)');

    countries.forEach(function (countryIso) {
      const entries = data.filter(function (x: UpdateData) {
        return x.country_iso === countryIso;
      });

      const country = d3
        .select(`#${countryIso}`)
        .attr('class', 'selected-country')
        .attr('filter', 'blur(0px)');

      d3.select(`#${countryIso}Label`)
        .attr('class', 'place-label')
        .attr('filter', 'blur(0px)');

      let totalOperationCount = 0;
      entries.forEach(function (x: UpdateData) {
        totalOperationCount += x['COUNT(pie_detail)'];
      });

      const scaledRadius = Math.min(
        Math.max(radius * (totalOperationCount / 1000), 5),
        15,
      );

      const arc = d3.arc().outerRadius(scaledRadius).innerRadius(0);

      if (country.node() != null) {
        const { centroid } = geoData.features.filter(function (x) {
          return x.iso === countryIso;
        })[0];

        const pieData = pie(entries);

        const pieChart = svg
          .append('g')
          .attr('id', `${countryIso}Pie`)
          .classed('pie-chart', true)
          // .style('opacity', 1)
          .attr(
            'transform',
            `translate(${projection([centroid[0], centroid[1]])})`,
          )
          .selectAll('.arc')
          .data(pieData)
          .enter()
          .append('g')
          .attr('class', 'arc')
          .append('path')
          .attr('d', arc)
          .style('fill', function (d) {
            return color((d.data as unknown as UpdateData).pie_detail);
          });

        pieChart
          .on('mouseover', function (d, i) {
            const svg = document
              .getElementById('groot')
              .getBoundingClientRect();
            const { x } = svg;
            const { y } = svg;
            d3.select(this).attr('opacity', '100');
            div
              .html(`${d.data.pie_detail}: ${d.data['COUNT(pie_detail)']}`)
              .style('opacity', 1)
              .style('left', `${d3.event.pageX - x + 5}px`)
              .style('top', `${d3.event.pageY - y - 5}px`);
          })
          .on('mouseout', function () {
            div.html('').style('opacity', 0);
          });
      }
    });
  }, [color, countries, svg, data, pie, projection, div]);

  return (
    <Styles
      boldText={props.boldText}
      headerFontSize={props.headerFontSize}
      scale={scale}
      center={new Point()}
      height={300}
      width={300}
    >
      <h3>Campaign Status {selected}</h3>
      <div id="country_pie_map">
        <div id="tooltip_text" />
        <svg id="canvas" />
      </div>
    </Styles>
  );
}
