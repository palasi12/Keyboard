/**
 * Production & inventory (handoff §5.4).
 *
 * Marking a short stock item as ordered fills its bar, rewrites its note and
 * removes it from the reorder alerts — the alert list is derived from the
 * ordered set, never stored alongside it.
 */

import { useState } from 'react';
import { PageBody, PageHeader } from '../layout/AppShell';
import { Card, CardTitle, EmptyState, Pill, Tile } from '../ui';
import { Donut, Sparkline } from '../ui/charts';
import { FIGURES, REORDER_ALERTS, SPEC, STAGES, STOCK, UNIT_COST_PARTS } from '../mock';
import { currency, number } from '../lib/format';
import { cn } from '../lib/cn';
import { CHART } from '../lib/chart';
import { Check, Printer } from '../icons';

const WEEK_BUILD = [0, 1, 1, 0, 2, 1, 0];

export default function Production() {
  const [stage, setStage] = useState(2);
  const [ordered, setOrdered] = useState<number[]>([]);

  const selected = STAGES[stage]!;
  const stagePct = Math.round((selected.done / selected.total) * 100);
  const alerts = REORDER_ALERTS.filter((alert) => !ordered.includes(alert.stockIndex));

  function markOrdered(index: number) {
    setOrdered((current) => (current.includes(index) ? current : [...current, index]));
  }

  return (
    <>
      <PageHeader
        title="Production"
        description="Six stages between a panel of boards and a packed box."
      />

      <PageBody
        rail={
          <>
            <Card pad={16}>
              <CardTitle>This week</CardTitle>
              <p className="dash-metric-md">
                5 <span className="text-[13px] font-semibold text-ink-4">units</span>
              </p>
              <div className="mt-[10px]">
                <Sparkline data={WEEK_BUILD} height={38} ariaLabel="Units built each day this week" />
              </div>
            </Card>

            <Card pad={16}>
              <CardTitle>Bottleneck</CardTitle>
              <div className="flex items-start gap-[10px]">
                <span className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-tile bg-status-rose/[0.16] text-status-rose">
                  <Printer size={16} />
                </span>
                <p className="text-[11.5px] text-ink-2">
                  Case printing. One printer, roughly 4.5 hours per case, 11 still to print.
                </p>
              </div>
            </Card>

            <Card pad={16}>
              <CardTitle>Product spec</CardTitle>
              <dl className="flex flex-col">
                {SPEC.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 border-t border-line-row py-[8px] first:border-t-0"
                  >
                    <dt className="dash-eyebrow">{item.label}</dt>
                    <dd className="text-right text-[11.5px] font-semibold text-ink-1">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          </>
        }
      >
        <Card pad={18}>
          <CardTitle>Pipeline</CardTitle>
          <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 xl:grid-cols-6">
            {STAGES.map((item, index) => {
              const pct = Math.round((item.done / item.total) * 100);
              const active = index === stage;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setStage(index)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-tile border bg-tile-grad p-[11px] text-left transition duration-120',
                    active
                      ? 'border-transparent shadow-[0_0_0_1px_theme(colors.lime.DEFAULT)]'
                      : 'border-line-strong hover:brightness-110',
                  )}
                >
                  <p className="dash-eyebrow truncate">{item.name}</p>
                  <p className="mt-[5px] text-[15px] font-extrabold tracking-[-0.5px] text-ink-1">
                    {item.done}
                    <span className="text-[11px] font-bold text-ink-4">/{item.total}</span>
                  </p>
                  <div className="mt-[7px] h-[6px] w-full overflow-hidden rounded-[8px] bg-tile-track shadow-track">
                    <div
                      className="h-full rounded-[8px]"
                      style={{
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg,#8ade33,#b6ff56)',
                        boxShadow: active ? '0 0 12px rgba(182,255,86,0.22)' : undefined,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <Tile className="mt-[14px] p-[14px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12.5px] font-bold text-ink-1">{selected.name}</p>
              <p className="text-[12.5px] font-bold text-lime">{stagePct}%</p>
            </div>
            <p className="mt-[5px] text-[11.5px] text-ink-4">{selected.note}</p>
          </Tile>
        </Card>

        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-3">
          {STOCK.map((item, index) => {
            const isOrdered = ordered.includes(index);
            const short = item.short && !isOrdered;
            return (
              <Card
                key={item.name}
                pad={16}
                className={cn(short && 'border-short')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-ink-1">{item.name}</p>
                    <p className="mt-[2px] truncate text-[10.5px] text-ink-4">{item.spec}</p>
                  </div>
                  <p className="dash-metric-sm shrink-0">{number(item.qty)}</p>
                </div>

                <div className="mt-[12px] h-[10px] w-full overflow-hidden rounded-[8px] bg-tile-track shadow-track">
                  <div
                    className="h-full rounded-[8px] transition-[width] duration-300"
                    style={{
                      width: `${isOrdered ? 100 : item.pct}%`,
                      background: short
                        ? 'linear-gradient(90deg,#f0abfc,#d67ae0)'
                        : 'linear-gradient(90deg,#8ade33,#b6ff56)',
                      boxShadow: short ? undefined : '0 0 12px rgba(182,255,86,0.22)',
                    }}
                  />
                </div>

                <div className="mt-[9px] flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      'text-[10.5px]',
                      short ? 'text-status-rose' : 'text-ink-4',
                    )}
                  >
                    {isOrdered
                      ? 'Reorder placed · on the way'
                      : `covers ${item.covers} units`}
                  </p>
                  {item.short && !isOrdered && (
                    <button
                      type="button"
                      onClick={() => markOrdered(index)}
                      className="shrink-0 rounded-chip border border-line-strong bg-tile-grad px-[9px] py-[3px] text-[10px] font-bold text-ink-2 transition hover:text-ink-1"
                    >
                      Mark ordered
                    </button>
                  )}
                  {isOrdered && (
                    <span className="text-lime">
                      <Check size={13} />
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col gap-[14px] lg:flex-row">
          <Card pad={18} className="flex-[1.3]">
            <CardTitle>Reorder alerts</CardTitle>
            {alerts.length === 0 ? (
              <EmptyState
                icon={Check}
                title="Everything is ordered"
                body="No component is short for the 25-unit run."
              />
            ) : (
              <div className="flex flex-col">
                {alerts.map((alert) => (
                  <div
                    key={alert.name}
                    className="flex items-center gap-[10px] border-t border-line-row py-[11px] first:border-t-0"
                  >
                    <Pill tone="rose" label="Short" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-semibold text-ink-1">
                        {alert.name}
                      </span>
                      <span className="block truncate text-[10.5px] text-ink-4">
                        {alert.detail}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => markOrdered(alert.stockIndex)}
                      className="shrink-0 rounded-chip border border-line-strong bg-tile-grad px-[10px] py-[5px] text-[10.5px] font-bold text-ink-2 transition hover:text-ink-1"
                    >
                      Order
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card pad={18} className="flex-1">
            <CardTitle>Unit cost</CardTitle>
            <Donut
              segments={UNIT_COST_PARTS.map((part, index) => ({
                label: part.label,
                value: part.value,
                colour: CHART.series[index],
              }))}
              centerValue={currency(FIGURES.unitCost, { cents: true })}
              centerLabel="Per unit"
              size={146}
              ariaLabel={`Unit cost ${currency(FIGURES.unitCost, { cents: true })} split across five components`}
            />
            <div className="mt-[14px] flex flex-col">
              {UNIT_COST_PARTS.map((part, index) => (
                <div
                  key={part.label}
                  className="flex items-center gap-[10px] border-t border-line-row py-[8px] first:border-t-0"
                >
                  <span
                    className="h-[9px] w-[9px] rounded-[3px]"
                    style={{ background: CHART.series[index] }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-[12px] font-semibold text-ink-2">{part.label}</span>
                  <span className="text-[12px] font-bold text-ink-1">
                    {currency(part.value, { cents: true })}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </PageBody>
    </>
  );
}
