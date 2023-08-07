// @ts-nocheck
/* eslint-disable */
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
import { GeoData, PluginCountryMapPieChartProps, PluginCountryMapPieChartStylesProps, UpdateData, } from './types';
// eslint-disable-next-line import/extensions
import * as geoData from './data/geo.json';
import useForceUpdate from 'antd/lib/_util/hooks/useForceUpdate';

const Styles = styled.div<PluginCountryMapPieChartStylesProps>`
  padding: ${ ({ theme }) => theme.gridUnit * 4 }px;
  border-radius: ${ ({ theme }) => theme.gridUnit * 2 }px;
  height: ${ ({ height }) => height }px;
  width: ${ ({ width }) => width }px;

  h3 {
    /* You can use your props to control CSS! */
    margin-top: 0;
    margin-bottom: ${ ({ theme }) => theme.gridUnit * 3 }px;
    font-size: ${ ({ theme, headerFontSize }) =>
      theme.typography.sizes[headerFontSize] }px;
    font-weight: ${ ({ theme, boldText }) =>
      theme.typography.weights[boldText ? 'bold' : 'normal'] };
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

  @font-face {
    font-family: 'FKGrotesk';
    font-weight: 700;
    src: url('css/fonts/FKGrotesk-Medium.otf') format('opentype');
  }

  .unselected-country {
    stroke: #7d9485;
    stroke-linecap: round;
    fill: #c2e0c8;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(5px);
  }

  .place-label {
    fill: #000;
    font-size: 10px;
  }
`;

export default function PluginCountryMapPieChart(
  props: PluginCountryMapPieChartProps,
) {
  const { data, height, width, metric } = props;
  const selectedCountries = getAllSelectedCountries();
  let scale;
  let center;
  let radius;

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
      '#008833',
      '#ACA2F1',
      '#7E24FF',
      '#FAA000',
      '#F80556',
      '#FFC55B',
      '#FF8E86',
      '#2E218E',
      '#442EE0',
      '#00FA9A',
      '#9E00FF',
      '#FFF049',
      '#EE4C40',
    ]);

  // canvas of the world map
  const svg = d3
    .select('#groot')
    .attr('style', 'background-color: #92B4F2; border-radius: 8px;')
    .attr('width', width - 32)
    .attr('height', height - 64)
    .select('#canvas');

  if (selectedCountries.length === 1) {
    const filtered = geoData.features.filter(function (f) {
      return f.iso === selectedCountries[0];
    })[0];
    center = filtered.centroid;
    scale = 2000;
    radius = 75;
  } else {
    scale = 1150;
    center = [5, 60];
    radius = 25;
  }

  const forceUpdate = useForceUpdate();

  function getAllSelectedCountries(): string[] {
    const countryList = [];
    data.forEach(function (entry: UpdateData) {
      const countryIso = entry.country_iso;
      if (
        countryList.filter(function (x: string) {
          return x === countryIso;
        }).length === 0
      )
        countryList.push(countryIso);
    });
    return countryList;
  }

  function drawWorldMap(center: number[], scale: number, selectedCountries: any[]) {
    // remove all drawn content from canvas
    d3.select('#canvas').selectAll('*').remove();

    // create a projection to position the map on the canvas
    const filtered = geoData.features.filter(function (f) {
      return f.iso === selectedCountries[0];
    })[0];
    // outline of selectedCountries
    let projection;
    if (selectedCountries.length === 1) {
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

      // labels for each country
      svg
        .append('g')
        .selectAll('text')
        .data(
          geoData.features.filter(function (f) {
            return selectedCountries.includes(f.iso);
          }),
        )
        .enter()
        .append('text')
        .attr('id', d => `${ (d as unknown as GeoData).iso }Label`)
        .attr('transform', function (d) {
          let distance = 0.5;
          if (d.properties.name.match('Norway') || d.properties.name.match('Sweden')) {
            distance = -2.5;
          }
          if (d.properties.name.match('Cyprus') || d.properties.name.match('Luxembourg')) {
            distance = 0.2;
          }
          if (d.properties.name.match('Germany') || d.properties.name.match('Spain')
            || d.properties.name.match('Finland') || d.properties.name.match('France')
            || d.properties.name.match('England') || d.properties.name.match('Greece')
            || d.properties.name.match('Italy') || d.properties.name.match('Poland')
            || d.properties.name.match('Portugal') || d.properties.name.match('Romania')
            || d.properties.name.match('Bulgaria')
          ) {
            distance = 1.3;
          }
          return `translate(${ projection([
            d.centroid[0],
            d.centroid[1] - distance,
          ]) })`;
        })
        .attr('text-anchor', 'end')
        .text(function (d) {
          return d.properties.name;
        })
        .attr('style', 'font-size: 30px;');
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

      // labels for all countries
      svg
        .append('g')
        .selectAll('text')
        .data(
          geoData.features.filter(function (f) {
            return selectedCountries.includes(f.iso);
          }),
        )
        .enter()
        .append('text')
        .attr('id', d => `${ (d as unknown as GeoData).iso }Label`)
        .attr('class', 'place-label')
        .attr('transform', function (d) {
          let distance = 0;
          if (d.properties.name.match('Germany')) {
            distance = 0.7;
          }
          return `translate(${ projection([
            d.centroid[0] - 2,
            d.centroid[1] + distance,
          ]) })`;
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
    return { projection, div };
  }

  function drawPieChartForCountry(pieChartSlices, maxOperations: number, country: Selection<BaseType, unknown, HTMLElement, any>, countryIso, projection, div: Selection<BaseType, unknown, HTMLElement, any>) {
    let totalOperationCount = 0;
    pieChartSlices.forEach(function (x: UpdateData) {
      totalOperationCount += x[metric.label];
    });

    let scaledRadius;
    if (selectedCountries.length === 1) {
      scaledRadius = radius;
    } else {
      scaledRadius = Math.min(
        Math.max(radius * (totalOperationCount / maxOperations), 15),
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
        .sort(function (a, b) {
          return b.pie_detail.localeCompare(a.pie_detail);
        })
        .value(function (d) {
          return d[metric.label];
        })(pieChartSlices);

      const pieChart = svg
        .append('g')
        .attr('id', `${ countryIso }Pie`)
        .classed('pie-chart', true)
        // .style('opacity', 1)
        .attr(
          'transform',
          `translate(${ projection([centroid[0], centroid[1]]) })`,
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
        .on('mouseover', function (d) {
          const svg = document
            .getElementById('groot')
            .getBoundingClientRect();
          const { x } = svg;
          const { y } = svg;
          d3.select(this).attr('opacity', '100');
          div
            .html(`${ d.data.pie_detail }: ${ d.data[metric.label] }`)
            .style('opacity', 1)
            .style('left', `${ d3.event.pageX - x + 5}px`)
            .style('top', `${ d3.event.pageY - y - 5}px`);
        })
        .on('mouseout', function () {
          div.html('').style('opacity', 0);
        });
    }
  }

  function processAllSelectedCountries(projection, div: Selection<BaseType, unknown, HTMLElement, any>) {
    let maxOperations = calculateMaxOperations();

    selectedCountries.forEach(function (countryIso) {
      const pieChartSlices = data.filter(function (x: UpdateData) {
        return x.country_iso === countryIso;
      });
      const country = unblurCountry(countryIso);
      drawPieChartForCountry(pieChartSlices, maxOperations, country, countryIso, projection, div);
    });
  }

  function unblurCountry(countryIso) {
    const country = d3
      .select(`#${ countryIso }`)
      .attr('class', 'selected-country')
      .attr('filter', 'blur(0px)');

    d3.select(`#${ countryIso }Label`).attr('class', 'place-label');
    return country;
  }

  function calculateMaxOperations() {
    let maxOperations = 0;
    selectedCountries.forEach(function (countryIso) {
      const entries = data.filter(function (x: UpdateData) {
        return x.country_iso === countryIso;
      });
      let totalOperationCount = 0;
      entries.forEach(function (x: UpdateData) {
        totalOperationCount += x[metric.label];
      });

      if (totalOperationCount > maxOperations) {
        maxOperations = totalOperationCount;
      }
    });
    return maxOperations;
  }

  useEffect(() => {
    const { projection, div } = drawWorldMap(center, scale, selectedCountries);
    processAllSelectedCountries(projection, div);
    if (d3.select('#canvas').selectAll('*').size() === 0) {
      console.log('Force updating chart since the map was not rendered correctly...');
      forceUpdate();
    }
  }, [selectedCountries]);

  return (
    <Styles boldText={ props.boldText } headerFontSize={ props.headerFontSize }>
      <div id="country_pie_map">
        <div id="tooltip_text"/>
        <svg id="groot">
          <g id="canvas"/>
        </svg>
      </div>
    </Styles>
  );
}
