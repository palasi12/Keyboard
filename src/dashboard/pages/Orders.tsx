/**
 * Orders (handoff §5.3).
 *
 * Four StatCards double as filters; clicking the active one clears it. Row
 * selection drives the rail drawer. Step 4 of the timeline is always [FILL IN]
 * and never done, because the ship window is gate-blocked.
 */

import { useMemo, useState } from 'react';
import { PageBody, PageHeader } from '../layout/AppShell';
import {
  Avatar,
  Bar,
  Button,
  Card,
  CardTitle,
  Chip,
  EmptyState,
  Pill,
  SearchField,
  StatCard,
} from '../ui';
import { DataTable, type Column } from '../ui/DataTable';
import {
  FILL_IN,
  ORDERS,
  ORDERS_BY_COUNTRY,
  type Order,
  STATUS_LABEL,
  STATUS_TONE,
  type Status,
} from '../mock';
import { currency, longDate, number, shortDate } from '../lib/format';
import { Box, Check, Download, Package, Truck } from '../icons';

type Filter = 'all' | Status;

const FILTERS: { key: Status; label: string; tone: 'lime' | 'blue' | 'grey' | 'rose'; icon: typeof Box }[] = [
  { key: 'pre', label: 'Pre-orders', tone: 'lime', icon: Box },
  { key: 'prod', label: 'In production', tone: 'blue', icon: Package },
  { key: 'ship', label: 'Shipped', tone: 'grey', icon: Truck },
  { key: 'ref', label: 'Refunded', tone: 'rose', icon: Check },
];

export default function Orders() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('TD-0018');

  const counts = useMemo(() => {
    const map = { pre: 0, prod: 0, ship: 0, ref: 0 } as Record<Status, number>;
    for (const order of ORDERS) map[order.status] += 1;
    return map;
  }, []);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ORDERS.filter((order) => {
      if (filter !== 'all' && order.status !== filter) return false;
      if (!needle) return true;
      return (
        order.name.toLowerCase().includes(needle) || order.id.toLowerCase().includes(needle)
      );
    });
  }, [filter, query]);

  const selected = ORDERS.find((order) => order.id === selectedId);
  const maxCountry = Math.max(...ORDERS_BY_COUNTRY.map((item) => item.units));

  const columns: Column<Order>[] = [
    {
      key: 'id',
      label: 'Order',
      span: 2,
      render: (order) => <span className="font-bold text-ink-1">{order.id}</span>,
    },
    {
      key: 'name',
      label: 'Customer',
      span: 3,
      render: (order) => (
        <span className="flex min-w-0 items-center gap-[8px]">
          <Avatar name={order.name} size={24} />
          <span className="truncate font-semibold text-ink-1" title={order.name}>
            {order.name}
          </span>
        </span>
      ),
    },
    { key: 'country', label: 'Country', span: 1, render: (order) => order.country },
    {
      key: 'units',
      label: 'Units',
      span: 1,
      align: 'right',
      render: (order) => number(order.units),
    },
    {
      key: 'total',
      label: 'Total',
      span: 2,
      align: 'right',
      render: (order) => <span className="font-bold text-ink-1">{currency(order.total)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      span: 2,
      render: (order) => <Pill tone={STATUS_TONE[order.status]} label={STATUS_LABEL[order.status]} />,
    },
    {
      key: 'date',
      label: 'Date',
      span: 1,
      align: 'right',
      render: (order) => <span className="text-ink-4">{shortDate(order.date)}</span>,
    },
  ];

  return (
    <>
      <PageHeader title="Orders" description="Eight orders across the first run of 25." />

      <PageBody
        rail={
          <>
            <Card pad={16}>
              <CardTitle>Order detail</CardTitle>
              {selected ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-extrabold text-ink-1">{selected.id}</span>
                    <Pill tone={STATUS_TONE[selected.status]} label={STATUS_LABEL[selected.status]} />
                  </div>
                  <div className="mt-[12px] flex items-center gap-[9px]">
                    <Avatar name={selected.name} size={30} />
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-bold text-ink-1">
                        {selected.name}
                      </span>
                      <span className="block truncate text-[10.5px] text-ink-4">
                        {selected.email}
                      </span>
                    </span>
                  </div>

                  <dl className="mt-[14px] flex flex-col">
                    {[
                      ['Variant', selected.variant],
                      ['Units', number(selected.units)],
                      ['Unit price', FILL_IN],
                      ['Shipping', selected.shipping],
                      ['Total', currency(selected.total)],
                      ['Ship window', FILL_IN],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-3 border-t border-line-row py-[8px] first:border-t-0"
                      >
                        <dt className="dash-eyebrow">{label}</dt>
                        <dd className="truncate text-[12px] font-semibold text-ink-1">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <p className="text-[11.5px] text-ink-4">Select an order to see its detail.</p>
              )}
            </Card>

            {selected && (
              <Card pad={16}>
                <CardTitle>Timeline</CardTitle>
                <ol className="flex flex-col">
                  {[
                    { label: 'Order placed', sub: longDate(selected.date), done: true },
                    { label: 'Payment confirmed', sub: 'Processor cleared', done: selected.status !== 'ref' },
                    {
                      label:
                        selected.status === 'prod' ? 'In the build queue' : 'Waiting on cases',
                      sub: selected.status === 'prod' ? 'Moved to production' : 'Case printing is the bottleneck',
                      done: selected.status === 'prod',
                    },
                    { label: 'Shipped', sub: FILL_IN, done: false },
                  ].map((step, index, all) => (
                    <li key={step.label} className="flex gap-[10px]">
                      <span className="flex flex-col items-center">
                        <span
                          className={`inline-flex h-[18px] w-[18px] items-center justify-center rounded-full ${
                            step.done ? 'bg-lime text-lime-ink' : 'bg-tile text-ink-5'
                          }`}
                          aria-hidden="true"
                        >
                          {step.done ? <Check size={11} /> : null}
                        </span>
                        {index < all.length - 1 && <span className="w-px flex-1 bg-line-strong" />}
                      </span>
                      <span className="pb-[14px]">
                        <span
                          className={`block text-[12px] font-semibold ${
                            step.done ? 'text-ink-1' : 'text-ink-4'
                          }`}
                        >
                          {step.label}
                        </span>
                        <span className="block text-[10.5px] text-ink-4">{step.sub}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </Card>
            )}

            <Card pad={16}>
              <CardTitle>Orders by country</CardTitle>
              <div className="flex flex-col gap-[10px]">
                {ORDERS_BY_COUNTRY.map((item) => (
                  <Bar
                    key={item.country}
                    label={item.country}
                    value={number(item.units)}
                    pct={(item.units / maxCountry) * 100}
                  />
                ))}
              </div>
            </Card>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-[14px] xl:grid-cols-4">
          {FILTERS.map((item) => (
            <StatCard
              key={item.key}
              label={item.label}
              value={counts[item.key]}
              tone={item.tone}
              icon={item.icon}
              active={filter === item.key}
              onClick={() => setFilter(filter === item.key ? 'all' : item.key)}
            />
          ))}
        </div>

        <Card pad={18}>
          <div className="mb-[14px] flex flex-wrap items-center gap-[10px]">
            <div className="w-full sm:w-[220px]">
              <SearchField
                value={query}
                onChange={setQuery}
                label="Search orders"
                placeholder="Search orders"
                height={32}
              />
            </div>
            <Chip
              label={`All ${ORDERS.length}`}
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            />
            {filter !== 'all' && (
              <span className="text-[11px] text-ink-4">
                Filtered to {FILTERS.find((item) => item.key === filter)?.label.toLowerCase()}
              </span>
            )}
            <div className="ms-auto">
              <Button icon={Download} size="sm">
                Export
              </Button>
            </div>
          </div>

          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(order) => order.id}
            onRowClick={(order) => setSelectedId(order.id)}
            rowLabel={(order) => `Open order ${order.id} for ${order.name}`}
            isSelected={(order) => order.id === selectedId}
            empty={
              <EmptyState
                icon={Box}
                title="No orders match"
                body="The filter is still on so you can undo it. Clear it to see all eight orders."
                cta={
                  <Button
                    onClick={() => {
                      setFilter('all');
                      setQuery('');
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            }
          />

          <div className="mt-[14px] flex items-center justify-between gap-3">
            <p className="text-[11px] text-ink-4">
              Showing {rows.length} of {ORDERS.length} orders
            </p>
            <div className="flex gap-[7px]">
              <Button size="sm" disabled>
                Previous
              </Button>
              <Button size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </Card>
      </PageBody>
    </>
  );
}
