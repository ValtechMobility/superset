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
import {
  ChartDataResponseResult,
  ChartProps,
  DataRecordValue,
  QueryFormColumn,
  QueryFormData,
  SetDataMaskHook,
} from '@superset-ui/core';
import { EChartsCoreOption } from 'echarts';
import { EchartsTitleFormData, DEFAULT_TITLE_FORM_DATA } from '../types';

export type MapPieQueryFormData = QueryFormData & {
  numberFormat?: string;
  whiskerOptions?: MapPieFormDataWhiskerOptions;
  xTickLayout?: MapPieFormXTickLayout;
  emitFilter: boolean;
} & EchartsTitleFormData;

export type MapPieFormDataWhiskerOptions =
  | 'Tukey'
  | 'Min/max (no outliers)'
  | '2/98 percentiles'
  | '9/91 percentiles';

export type MapPieFormXTickLayout =
  | '45°'
  | '90°'
  | 'auto'
  | 'flat'
  | 'staggered';

// @ts-ignore
export const DEFAULT_FORM_DATA: MapPieQueryFormData = {
  emitFilter: false,
  ...DEFAULT_TITLE_FORM_DATA,
};

export interface EchartsMapPieChartProps
  extends ChartProps<MapPieQueryFormData> {
  formData: MapPieQueryFormData;
  queriesData: ChartDataResponseResult[];
}

export interface MapPieChartTransformedProps {
  formData: MapPieQueryFormData;
  height: number;
  width: number;
  echartOptions: EChartsCoreOption;
  emitFilter: boolean;
  setDataMask: SetDataMaskHook;
  labelMap: Record<string, DataRecordValue[]>;
  groupby: QueryFormColumn[];
  selectedValues: Record<number, string>;
}
