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
import React, { useMemo } from 'react';
import {
  css,
  DataMaskState,
  DataMaskStateWithId,
  t,
  isDefined,
  SupersetTheme,
} from '@superset-ui/core';
import Button from 'src/components/Button';
import { OPEN_FILTER_BAR_WIDTH } from 'src/dashboard/constants';
import { FilterBarOrientation } from 'src/dashboard/types';
import { getFilterBarTestId } from '../utils';

interface ActionButtonsProps {
  width?: number;
  onApply: () => void;
  onClearAll: () => void;
  dataMaskSelected: DataMaskState;
  dataMaskApplied: DataMaskStateWithId;
  isApplyDisabled: boolean;
  filterBarOrientation?: FilterBarOrientation;
}

const containerStyle = (theme: SupersetTheme) => css`
  display: flex;

  && > .filter-clear-all-button {
    color: ${theme.colors.grayscale.base};
    margin-left: 0;
    &:hover {
      color: ${theme.colors.primary.dark1};
    }

    &[disabled],
    &[disabled]:hover {
      color: ${theme.colors.grayscale.light1};
    }
  }
`;

const ActionButtons = ({
  width = OPEN_FILTER_BAR_WIDTH,
  onApply,
  onClearAll,
  dataMaskApplied,
  dataMaskSelected,
  isApplyDisabled,
  filterBarOrientation = FilterBarOrientation.VERTICAL,
}: ActionButtonsProps) => {
  const isClearAllEnabled = useMemo(
    () =>
      Object.values(dataMaskApplied).some(
        filter =>
          isDefined(dataMaskSelected[filter.id]?.filterState?.value) ||
          (!dataMaskSelected[filter.id] &&
            isDefined(filter.filterState?.value)),
      ),
    [dataMaskApplied, dataMaskSelected],
  );
  const isVertical = filterBarOrientation === FilterBarOrientation.VERTICAL;

  return (
    <div
      css={(theme: SupersetTheme) => [
        containerStyle(theme),
        css`
          display: grid;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          grid-gap: 10px;
          grid-template-columns: 1fr 1fr;
          padding: 0 ${theme.gridUnit * 2}px;
          .btn {
            flex: 1;
          }
        `,
      ]}
      data-test="filterbar-action-buttons"
    >
      <Button
        disabled={!isClearAllEnabled}
        buttonStyle="tertiary"
        buttonSize="small"
        className="filter-clear-all-button"
        onClick={onClearAll}
        {...getFilterBarTestId('clear-button')}
      >
        {t('Clear all')}
      </Button>
      <Button
        disabled={isApplyDisabled}
        buttonStyle="primary"
        htmlType="submit"
        className="filter-apply-button"
        onClick={onApply}
        {...getFilterBarTestId('apply-button')}
      >
        {isVertical ? t('Apply filters') : t('Apply')}
      </Button>
    </div>
  );
};

export default ActionButtons;
