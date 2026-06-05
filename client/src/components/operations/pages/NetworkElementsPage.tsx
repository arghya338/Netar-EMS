import { Boxes, Gauge, Lock, Search, Server } from 'lucide-react';
import { useState } from 'react';
import {
  type ApiRow,
  type PageProps,
  ActionButton,
  ApiNotice,
  DataTable,
  DetailDrawer,
  PageHeader,
  PanelFrame,
  displayValue,
  getRowId,
  rowsFromResult,
  tableColumns,
  totalFromResult,
  useApiQuery,
} from '../shared';

export function NetworkElementsPage({ session, onOpenAction }: PageProps) {
  const [selected, setSelected] = useState<ApiRow | null>(null);
  const list = useApiQuery(session, '/ne/info/list', { bandStatus: true, pageNum: 1, pageSize: 25 });
  const rows = rowsFromResult(list.result);
  const selectedType = displayValue(selected?.neType ?? rows[0]?.neType ?? 'IMS');
  const selectedNeId = displayValue(selected?.neId ?? rows[0]?.neId ?? '001');
  const selectedRowId = displayValue(selected?.id);
  const detailById = useApiQuery(session, selectedRowId !== '—' ? `/ne/info/${selectedRowId}` : '/ne/info/{value}', undefined, selectedRowId !== '—');
  const detailByType = useApiQuery(session, '/ne/info/byTypeAndID', { neType: selectedType, neId: selectedNeId }, selectedType !== '—' && selectedNeId !== '—');
  const state = useApiQuery(session, '/ne/info/state', { neType: selectedType, neId: selectedNeId }, selectedType !== '—' && selectedNeId !== '—');

  return (
    <div className="ops-page">
      <PageHeader title="Network Elements" detail="Inventory, status, detail inspection, and operator-controlled record actions." icon={Boxes} count={totalFromResult(list.result)} />
      <div className="ops-content-with-drawer">
        <div className="stacked-panels">
          <PanelFrame title="Element inventory" icon={Server}>
            <ApiNotice result={list.result} loading={list.loading} />
            <DataTable
              rows={rows}
              columns={tableColumns.networkElement}
              selectedId={selected ? getRowId(selected) : undefined}
              onSelect={setSelected}
              action={(row) => (
                <ActionButton
                  variant="danger"
                  icon={Lock}
                  onClick={() => onOpenAction({
                    title: 'Delete network element',
                    method: 'DELETE',
                    path: `/ne/info/${displayValue(row.id)}`,
                    summary: 'Deletes the selected network element record after explicit operator confirmation.',
                    risk: 'mutation',
                  })}
                >
                  Delete
                </ActionButton>
              )}
            />
          </PanelFrame>
          <div className="ops-grid one-one">
            <PanelFrame title="Detail lookup" icon={Search}>
              <ApiNotice result={detailByType.result ?? detailById.result} loading={detailByType.loading || detailById.loading} />
              <DataTable rows={[...rowsFromResult(detailByType.result), ...rowsFromResult(detailById.result)].slice(0, 2)} columns={tableColumns.networkElement} />
            </PanelFrame>
            <PanelFrame title="Hardware state" icon={Gauge}>
              <ApiNotice result={state.result} loading={state.loading} />
              <DataTable rows={rowsFromResult(state.result)} columns={[{ key: 'neType', label: 'Type' }, { key: 'neId', label: 'NE ID' }, { key: 'state', label: 'State' }, { key: 'cpu', label: 'CPU' }, { key: 'mem', label: 'Memory' }]} />
            </PanelFrame>
          </div>
        </div>
        <DetailDrawer row={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
}

