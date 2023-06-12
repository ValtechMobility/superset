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
  let selected = '';
  data.forEach(function (entry: UpdateData) {
    const countryIso = entry.country_iso;
    if (
      countries.filter(function (x: string) {
        return x === countryIso;
      }).length === 0
    )
      countries.push(countryIso);
  });

  const color = d3
    .scaleOrdinal()
    .domain([
      'Success',
      'Up-To-Date',
      'In Update Process',
      'Disenrolled',
      'Error in Front of Customer',
      'UpdateJob Not Requested',
      'Failed - Waiting for Retry',
      'DL Preparation',
      'DL Started',
      'DL Session Completed',
      'Installation Process',
      'Campaign Not Feasible',
      'Failed',
    ])
    .range([
      '#00872B',
      '#48AD3E',
      '#00437A',
      '#C2CACF',
      '#A9E3FF',
      '#A9E3FF',
      '#FFD100',
      '#4CC7F4',
      '#4CC7F4',
      '#0082D6',
      '#001E50',
      '#6A767D',
      '#EE7203',
    ]);

  // canvas of the world map
  const svg = d3
    .select('#groot')
    .attr('style', 'background-color:#92B4F2;')
    .attr('width', width - 32)
    .attr('height', height - 64)
    .select('#canvas');

  let scale;
  let center;
  let radius;

  if (countries.length === 1) {
    const filtered = geoData.features.filter(function (f) {
      return f.iso === countries[0];
    })[0];
    selected = filtered.properties.name;
    center = filtered.centroid;
    scale = 2000;
    radius = 50;
  } else {
    scale = 800;
    center = [15, 58];
    radius = 25;
  }

  function drawWorldMap(center: number[], scale: number, countries: any[]) {
    // remove all drawn content from canvas
    d3.select('#canvas').selectAll('*').remove();

    // create a projection to position the map on the canvas
    const filtered = geoData.features.filter(function (f) {
      return f.iso === countries[0];
    })[0];
    // outline of countries
    let projection;
    if (countries.length === 1) {
      projection = d3
        .geoTransverseMercator()
        .fitSize([width * 0.9, height * 0.9], filtered);
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
    } else {
      projection = d3.geoTransverseMercator().center(center).scale(scale); // This is like the zoom
      svg
        .append('g')
        .selectAll('path')
        .data(geoData.features)
        .enter()
        .append('path')
        .attr('d', d3.geoPath().projection(projection))
        .attr('id', d => (d as unknown as GeoData).iso)
        .attr('class', 'unselected-country');
    }

    // country label
    if (countries.length > 1) {
      svg
        .append('g')
        .selectAll('text')
        .data(
          geoData.features.filter(function (f) {
            return countries.includes(f.iso);
          }),
        )
        .enter()
        .append('text')
        .attr('id', d => `${(d as unknown as GeoData).iso}Label`)
        .attr('class', 'place-label')
        .attr('transform', function (d) {
          return `translate(${projection([
            d.centroid[0] - 1.7,
            d.centroid[1],
          ])})`;
        })
        .attr('text-anchor', 'end')
        .text(function (d) {
          return d.properties.name;
        })
        .attr('class', 'unselected-country');
    }

    // tooltip
    const div = d3
      .select('#country_pie_map')
      .select('#tooltip_text')
      .attr('class', 'tooltip');

    d3.selectAll('.selected-country')
      .attr('class', 'unselected-country')
      .attr('filter', 'blur(5px)');
    return { projection, svg, div };
  }

  useEffect(() => {
    const { projection, div } = drawWorldMap(center, scale, countries);

    let maxOperations = 0;

    countries.forEach(function (countryIso) {
      const entries = data.filter(function (x: UpdateData) {
        return x.country_iso === countryIso;
      });
      let totalOperationCount = 0;
      entries.forEach(function (x: UpdateData) {
        totalOperationCount += x['COUNT(pie_detail)'];
      });

      if (totalOperationCount > maxOperations) {
        maxOperations = totalOperationCount;
      }
    });

    countries.forEach(function (countryIso) {
      const entries = data.filter(function (x: UpdateData) {
        return x.country_iso === countryIso;
      });

      // unblur the selected country and matching label
      const country = d3
        .select(`#${countryIso}`)
        .attr('class', 'selected-country')
        .attr('filter', 'blur(0px)');

      d3.select(`#${countryIso}Label`).attr('class', 'place-label');

      // calculate size of pie chart
      let totalOperationCount = 0;
      entries.forEach(function (x: UpdateData) {
        totalOperationCount += x['COUNT(pie_detail)'];
      });

      let scaledRadius;
      if (countries.length === 1) {
        scaledRadius = radius;
      } else {
        scaledRadius = Math.min(
          Math.max(radius * (totalOperationCount / maxOperations), 7),
          radius,
        );
      }

      const arc = d3.arc().outerRadius(scaledRadius).innerRadius(0);

      if (country.node() != null) {
        const { centroid } = geoData.features.filter(function (x) {
          return x.iso === countryIso;
        })[0];

        const pieData = d3
          .pie()
          .sort(null)
          .value(function (d) {
            return d['COUNT(pie_detail)'];
          })(entries);

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
  }, [data, selected]);

  return (
    <Styles boldText={props.boldText} headerFontSize={props.headerFontSize}>
      <h3>Campaign Status {selected}</h3>
      <div id="country_pie_map">
        <div id="tooltip_text" />
        <svg id="groot">
          <g id="canvas" />
        </svg>
      </div>
    </Styles>
  );
}
