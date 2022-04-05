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
import { SupersetClient, t, styled } from '@superset-ui/core';
import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Loading from 'src/components/Loading';
import { isFeatureEnabled, FeatureFlag } from 'src/featureFlags';
import { useListViewResource } from 'src/views/CRUD/hooks';
import { createErrorHandler, uploadUserPerms } from 'src/views/CRUD/utils';
import withToasts from 'src/components/MessageToasts/withToasts';
import SubMenu, { SubMenuProps } from 'src/views/components/SubMenu';
import DeleteModal from 'src/components/DeleteModal';
import { Tooltip } from 'src/components/Tooltip';
import Icons from 'src/components/Icons';
import ListView, { FilterOperator, Filters } from 'src/components/ListView';
import { commonMenuData } from 'src/views/CRUD/data/common';
import ImportModelsModal from 'src/components/ImportModal/index';
import handleResourceExport from 'src/utils/export';
import { ExtentionConfigs } from 'src/views/components/types';
import { UserWithPermissionsAndRoles } from 'src/types/bootstrapTypes';
import DatabaseModal from './DatabaseModal';

import { DatabaseObject } from './types';
import { APP_PREFIX } from '../../../../constants';

const PAGE_SIZE = 25;
const PASSWORDS_NEEDED_MESSAGE = t(
  'The passwords for the databases below are needed in order to ' +
    'import them. Please note that the "Secure Extra" and "Certificate" ' +
    'sections of the database configuration are not present in export ' +
    'files, and should be added manually after the import if they are needed.',
);
const CONFIRM_OVERWRITE_MESSAGE = t(
  'You are importing one or more databases that already exist. ' +
    'Overwriting might cause you to lose some of your work. Are you ' +
    'sure you want to overwrite?',
);

interface DatabaseDeleteObject extends DatabaseObject {
  chart_count: number;
  dashboard_count: number;
  sqllab_tab_count: number;
}
interface DatabaseListProps {
  addDangerToast: (msg: string) => void;
  addSuccessToast: (msg: string) => void;
}

const IconCheck = styled(Icons.Check)`
  color: ${({ theme }) => theme.colors.grayscale.dark1};
`;

const IconCancelX = styled(Icons.CancelX)`
  color: ${({ theme }) => theme.colors.grayscale.dark1};
`;

const Actions = styled.div`
  color: ${({ theme }) => theme.colors.grayscale.base};

  .action-button {
    display: inline-block;
    height: 100%;
  }
`;

function BooleanDisplay({ value }: { value: Boolean }) {
  return value ? <IconCheck /> : <IconCancelX />;
}

function DatabaseList({ addDangerToast, addSuccessToast }: DatabaseListProps) {
  const {
    state: {
      loading,
      resourceCount: databaseCount,
      resourceCollection: databases,
    },
    hasPerm,
    fetchData,
    refreshData,
  } = useListViewResource<DatabaseObject>(
    'database',
    t('database'),
    addDangerToast,
  );
  const [databaseModalOpen, setDatabaseModalOpen] = useState<boolean>(false);
  const [databaseCurrentlyDeleting, setDatabaseCurrentlyDeleting] =
    useState<DatabaseDeleteObject | null>(null);
  const [currentDatabase, setCurrentDatabase] = useState<DatabaseObject | null>(
    null,
  );
  const [importingDatabase, showImportModal] = useState<boolean>(false);
  const [passwordFields, setPasswordFields] = useState<string[]>([]);
  const [preparingExport, setPreparingExport] = useState<boolean>(false);
  const { roles } = useSelector<any, UserWithPermissionsAndRoles>(
    state => state.user,
  );
  const {
    CSV_EXTENSIONS,
    COLUMNAR_EXTENSIONS,
    EXCEL_EXTENSIONS,
    ALLOWED_EXTENSIONS,
  } = useSelector<any, ExtentionConfigs>(state => state.common.conf);

  const openDatabaseImportModal = () => {
    showImportModal(true);
  };

  const closeDatabaseImportModal = () => {
    showImportModal(false);
  };

  const handleDatabaseImport = () => {
    showImportModal(false);
    refreshData();
    addSuccessToast(t('Database imported'));
  };

  const openDatabaseDeleteModal = (database: DatabaseObject) =>
    SupersetClient.get({
      endpoint: `/${APP_PREFIX}/api/v1/database/${database.id}/related_objects/`,
    })
      .then(({ json = {} }) => {
        setDatabaseCurrentlyDeleting({
          ...database,
          chart_count: json.charts.count,
          dashboard_count: json.dashboards.count,
          sqllab_tab_count: json.sqllab_tab_states.count,
        });
      })
      .catch(
        createErrorHandler(errMsg =>
          t(
            'An error occurred while fetching database related data: %s',
            errMsg,
          ),
        ),
      );

  function handleDatabaseDelete({ id, database_name: dbName }: DatabaseObject) {
    SupersetClient.delete({
      endpoint: `/${APP_PREFIX}/api/v1/database/${id}`,
    }).then(
      () => {
        refreshData();
        addSuccessToast(t('Deleted: %s', dbName));

        // Close delete modal
        setDatabaseCurrentlyDeleting(null);
      },
      createErrorHandler(errMsg =>
        addDangerToast(t('There was an issue deleting %s: %s', dbName, errMsg)),
      ),
    );
  }

  function handleDatabaseEditModal({
    database = null,
    modalOpen = false,
  }: { database?: DatabaseObject | null; modalOpen?: boolean } = {}) {
    // Set database and modal
    setCurrentDatabase(database);
    setDatabaseModalOpen(modalOpen);
  }

  const canCreate = hasPerm('can_write');
  const canEdit = hasPerm('can_write');
  const canDelete = hasPerm('can_write');
  const canExport =
    hasPerm('can_export') && isFeatureEnabled(FeatureFlag.VERSIONED_EXPORT);

  const { canUploadCSV, canUploadColumnar, canUploadExcel } = uploadUserPerms(
    roles,
    CSV_EXTENSIONS,
    COLUMNAR_EXTENSIONS,
    EXCEL_EXTENSIONS,
    ALLOWED_EXTENSIONS,
  );

  const uploadDropdownMenu = [
    {
      label: t('Upload file to database'),
      childs: [
        {
          label: t('Upload CSV'),
          name: 'Upload CSV file',
          url: '/csvtodatabaseview/form',
          perm: canUploadCSV,
        },
        {
          label: t('Upload columnar file'),
          name: 'Upload columnar file',
          url: '/columnartodatabaseview/form',
          perm: canUploadColumnar,
        },
        {
          label: t('Upload Excel file'),
          name: 'Upload Excel file',
          url: '/exceltodatabaseview/form',
          perm: canUploadExcel,
        },
      ],
    },
  ];

  const filteredDropDown = uploadDropdownMenu.map(link => {
    // eslint-disable-next-line no-param-reassign
    link.childs = link.childs.filter(item => item.perm);
    return link;
  });

  const menuData: SubMenuProps = {
    activeChild: 'Databases',
    dropDownLinks: filteredDropDown,
    ...commonMenuData,
  };

  if (canCreate) {
    menuData.buttons = [
      {
        'data-test': 'btn-create-database',
        name: (
          <>
            <i className="fa fa-plus" /> {t('Database')}{' '}
          </>
        ),
        buttonStyle: 'primary',
        onClick: () => {
          // Ensure modal will be opened in add mode
          handleDatabaseEditModal({ modalOpen: true });
        },
      },
    ];

    if (isFeatureEnabled(FeatureFlag.VERSIONED_EXPORT)) {
      menuData.buttons.push({
        name: (
          <Tooltip
            id="import-tooltip"
            title={t('Import databases')}
            placement="bottomRight"
          >
            <Icons.Import data-test="import-button" />
          </Tooltip>
        ),
        buttonStyle: 'link',
        onClick: openDatabaseImportModal,
      });
    }
  }

  function handleDatabaseExport(database: DatabaseObject) {
    if (database.id === undefined) {
      return;
    }

    handleResourceExport('database', [database.id], () => {
      setPreparingExport(false);
    });
    setPreparingExport(true);
  }

  const initialSort = [{ id: 'changed_on_delta_humanized', desc: true }];

  const columns = useMemo(
    () => [
      {
        accessor: 'database_name',
        Header: t('Database'),
      },
      {
        accessor: 'backend',
        Header: t('Backend'),
        size: 'lg',
        disableSortBy: true, // TODO: api support for sorting by 'backend'
      },
      {
        accessor: 'allow_run_async',
        Header: (
          <Tooltip
            id="allow-run-async-header-tooltip"
            title={t('Asynchronous query execution')}
            placement="top"
          >
            <span>{t('AQE')}</span>
          </Tooltip>
        ),
        Cell: ({
          row: {
            original: { allow_run_async: allowRunAsync },
          },
        }: {
          row: { original: { allow_run_async: boolean } };
        }) => <BooleanDisplay value={allowRunAsync} />,
        size: 'sm',
      },
      {
        accessor: 'allow_dml',
        Header: (
          <Tooltip
            id="allow-dml-header-tooltip"
            title={t('Allow data manipulation language')}
            placement="top"
          >
            <span>{t('DML')}</span>
          </Tooltip>
        ),
        Cell: ({
          row: {
            original: { allow_dml: allowDML },
          },
        }: any) => <BooleanDisplay value={allowDML} />,
        size: 'sm',
      },
      {
        accessor: 'allow_file_upload',
        Header: t('CSV upload'),
        Cell: ({
          row: {
            original: { allow_file_upload: allowFileUpload },
          },
        }: any) => <BooleanDisplay value={allowFileUpload} />,
        size: 'md',
      },
      {
        accessor: 'expose_in_sqllab',
        Header: t('Expose in SQL Lab'),
        Cell: ({
          row: {
            original: { expose_in_sqllab: exposeInSqllab },
          },
        }: any) => <BooleanDisplay value={exposeInSqllab} />,
        size: 'md',
      },
      {
        accessor: 'created_by',
        disableSortBy: true,
        Header: t('Created by'),
        Cell: ({
          row: {
            original: { created_by: createdBy },
          },
        }: any) =>
          createdBy ? `${createdBy.first_name} ${createdBy.last_name}` : '',
        size: 'xl',
      },
      {
        Cell: ({
          row: {
            original: { changed_on_delta_humanized: changedOn },
          },
        }: any) => changedOn,
        Header: t('Last modified'),
        accessor: 'changed_on_delta_humanized',
        size: 'xl',
      },
      {
        Cell: ({ row: { original } }: any) => {
          const handleEdit = () =>
            handleDatabaseEditModal({ database: original, modalOpen: true });
          const handleDelete = () => openDatabaseDeleteModal(original);
          const handleExport = () => handleDatabaseExport(original);
          if (!canEdit && !canDelete && !canExport) {
            return null;
          }
          return (
            <Actions className="actions">
              {canDelete && (
                <span
                  role="button"
                  tabIndex={0}
                  className="action-button"
                  data-test="database-delete"
                  onClick={handleDelete}
                >
                  <Tooltip
                    id="delete-action-tooltip"
                    title={t('Delete database')}
                    placement="bottom"
                  >
                    <Icons.Trash />
                  </Tooltip>
                </span>
              )}
              {canExport && (
                <Tooltip
                  id="export-action-tooltip"
                  title={t('Export')}
                  placement="bottom"
                >
                  <span
                    role="button"
                    tabIndex={0}
                    className="action-button"
                    onClick={handleExport}
                  >
                    <Icons.Share />
                  </span>
                </Tooltip>
              )}
              {canEdit && (
                <Tooltip
                  id="edit-action-tooltip"
                  title={t('Edit')}
                  placement="bottom"
                >
                  <span
                    role="button"
                    data-test="database-edit"
                    tabIndex={0}
                    className="action-button"
                    onClick={handleEdit}
                  >
                    <Icons.EditAlt data-test="edit-alt" />
                  </span>
                </Tooltip>
              )}
            </Actions>
          );
        },
        Header: t('Actions'),
        id: 'actions',
        hidden: !canEdit && !canDelete,
        disableSortBy: true,
      },
    ],
    [canDelete, canEdit, canExport],
  );

  const filters: Filters = useMemo(
    () => [
      {
        Header: t('Expose in SQL Lab'),
        id: 'expose_in_sqllab',
        input: 'select',
        operator: FilterOperator.equals,
        unfilteredLabel: 'All',
        selects: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      {
        Header: (
          <Tooltip
            id="allow-run-async-filter-header-tooltip"
            title={t('Asynchronous query execution')}
            placement="top"
          >
            <span>{t('AQE')}</span>
          </Tooltip>
        ),
        id: 'allow_run_async',
        input: 'select',
        operator: FilterOperator.equals,
        unfilteredLabel: 'All',
        selects: [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ],
      },
      {
        Header: t('Search'),
        id: 'database_name',
        input: 'search',
        operator: FilterOperator.contains,
      },
    ],
    [],
  );

  return (
    <>
      <SubMenu {...menuData} />
      <DatabaseModal
        databaseId={currentDatabase?.id}
        show={databaseModalOpen}
        onHide={handleDatabaseEditModal}
        onDatabaseAdd={() => {
          refreshData();
        }}
      />
      {databaseCurrentlyDeleting && (
        <DeleteModal
          description={t(
            'The database %s is linked to %s charts that appear on %s dashboards and users have %s SQL Lab tabs using this database open. Are you sure you want to continue? Deleting the database will break those objects.',
            databaseCurrentlyDeleting.database_name,
            databaseCurrentlyDeleting.chart_count,
            databaseCurrentlyDeleting.dashboard_count,
            databaseCurrentlyDeleting.sqllab_tab_count,
          )}
          onConfirm={() => {
            if (databaseCurrentlyDeleting) {
              handleDatabaseDelete(databaseCurrentlyDeleting);
            }
          }}
          onHide={() => setDatabaseCurrentlyDeleting(null)}
          open
          title={t('Delete Database?')}
        />
      )}

      <ListView<DatabaseObject>
        className="database-list-view"
        columns={columns}
        count={databaseCount}
        data={databases}
        fetchData={fetchData}
        filters={filters}
        initialSort={initialSort}
        loading={loading}
        pageSize={PAGE_SIZE}
      />

      <ImportModelsModal
        resourceName="database"
        resourceLabel={t('database')}
        passwordsNeededMessage={PASSWORDS_NEEDED_MESSAGE}
        confirmOverwriteMessage={CONFIRM_OVERWRITE_MESSAGE}
        addDangerToast={addDangerToast}
        addSuccessToast={addSuccessToast}
        onModelImport={handleDatabaseImport}
        show={importingDatabase}
        onHide={closeDatabaseImportModal}
        passwordFields={passwordFields}
        setPasswordFields={setPasswordFields}
      />
      {preparingExport && <Loading />}
    </>
  );
}

export default withToasts(DatabaseList);
