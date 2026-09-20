/**
 * Overview (handoff §5.1).
 *
 * The four KPIs are links, because the question a KPI raises is always
 * "where does that come from". The waitlist card on the rail is the one panel
 * reading real data — it is the same count the Launch gate is measured on.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageBody, PageHeader } from '../layout/AppShell';
import { Bar, Card, CardTitle, Kpi, Pill, Row, StackedBar, Skeleton } from '../ui';
import { AreaChart, Donut, Ring, Sparkline } from '../ui/charts';
import { Avatar } from '../ui';
import { CHANNELS, FIGURES, FILL_IN, GATES, ORDERS, RANGES } from '../mock';
import { currency, number, shortDate } from '../lib/format';
import { useWaitlist } from '../lib/useLiveData';
import { CHART } from '../lib/chart';
import { ArrowRight } from '../icons';

export default function Overview() {
  const waitlist = useWaitlist();
  const [channel, setChannel] = useState<string | null>(null);

  const year = RANGES.find((range) => range.key === '12m')!;
  const cleared = GATES.filter((gate) => gate.state === 'done').length;

  const signups = waitlist.data.length;
  const target = FIGURES.waitlistTarget;
  const waitlistPct = Math.min(100, Math.round((signups / target) * 100));

  const latest = ORDERS.filter((order) => order.status === 'pre').slice(0, 3);

  const channelTotal = CHANNELS.reduce((sum, item) => sum + item.value, 0);
  const isolated = channel ? CHANNELS.find((item) => item.label === channel) : undefined;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Can we open pre-orders yet, and what is stopping us?"
      />

      <PageBody
        rail={
          <>
            <Card pad={16}>
              <CardTitle>Launch readiness</CardTitle>
              <div className="flex flex-col items-center">
                <Ring
                  pct={cleared / GATES.length}
                  size={146}
                  label={`${cleared}/${GATES.length}`}
                  sub="Cleared"
                  ariaLabel={`Launch readiness: ${cleared} of ${GATES.length} gates cleared`}
                />
                <p className="mt-[12px] text-center text-[11.5px] text-ink-4">
                  Every blocker traces back to one decision: the price.
                </p>
                <Link
                  to="/admin/launch"
                  className="on-lime mt-[12px] inline-flex h-[34px] w-full items-center justify-center gap-[7px] rounded-chip bg-lime-grad text-[12px] font-bold text-lime-ink shadow-lime transition hover:brightness-110"
                >
                  Open the launch gates
                  <ArrowRight size={14} />
                </Link>
              </div>
            </Card>

            <Card pad={16}>
              <CardTitle
                action={
                  <Link to="/admin/customers" className="text-[10.5px] font-semibold text-lime">
                    View
                  </Link>
                }
              >
                Waitlist
              </CardTitle>
              {waitlist.loading ? (
                <Skeleton height={64} />
              ) : (
                <>
                  <p className="dash-metric-md">
                    {number(signups)}{' '}
                    <span className="text-[13px] font-semibold text-ink-4">of {target}</span>
                  </p>
                  <div className="mt-[10px]">
                    <Sparkline
                      data={waitlist.growth}
                      height={38}
                      ariaLabel="Waitlist signups over the last 12 weeks"
                    />
                  </div>
                  <div className="mt-[10px]">
                    <Bar label="To the gate" value={`${waitlistPct}%`} pct={waitlistPct} />
                  </div>
                  <p className="mt-[9px] text-[10.5px] text-ink-4">
                    {signups >= target
                      ? 'The waitlist gate is cleared.'
                      : `${target - signups} signups to the gate.`}
                  </p>
                </>
              )}
            </Card>

            <Card pad={16}>
              <CardTitle
                action={
                  <Link to="/admin/orders" className="text-[10.5px] font-semibold text-lime">
                    All
                  </Link>
                }
              >
                Latest pre-orders
              </CardTitle>
              <div className="flex flex-col">
                {latest.map((order) => (
                  <Row
                    key={order.id}
                    left={<Avatar name={order.name} size={28} />}
                    name={order.name}
                    sub={`${order.id} · ${shortDate(order.date)}`}
                    value={currency(order.total)}
                    valueSub={`${order.units} unit${order.units === 1 ? '' : 's'}`}
                  />
                ))}
              </div>
            </Card>

            <Card pad={16}>
              <CardTitle>Spec</CardTitle>
              <div className="flex flex-wrap gap-[6px]">
                <Pill tone="lime" label="13 underglow LEDs" />
                <Pill tone="grey" label="Underside only" />
                <Pill tone="grey" label="MX-compatible" />
              </div>
            </Card>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Revenue this month"
            value={currency(FIGURES.revenueMonth)}
            delta="112%"
            to="/admin/revenue"
          />
          <Kpi
            label="Revenue all-time"
            value={currency(FIGURES.revenueAllTime)}
            to="/admin/revenue"
          />
          <Kpi
            label="Avg order value"
            value={currency(FIGURES.avgOrderValue)}
            sub={`Sample · price ${FILL_IN}`}
            to="/admin/orders"
          />
          <Kpi
            label="Units sold"
            value={number(FIGURES.unitsSold)}
            sub={`of ${FIGURES.runSize} in the first run`}
            to="/admin/orders"
          />
        </div>

        <Card pad={18}>
          <CardTitle>Revenue over time</CardTitle>
          <AreaChart
            data={year.series}
            labels={year.ticks}
            height={200}
            marker={year.marker}
            markerLabel="Pre-orders opened"
            ariaLabel="Revenue over the last twelve months"
            formatValue={(value) => currency(value)}
          />
        </Card>

        <div className="flex flex-col gap-[14px] lg:flex-row">
          <Card pad={18} className="flex-[1.25]">
            <CardTitle>Revenue by channel</CardTitle>
            <StackedBar
              segments={CHANNELS.map((item, index) => ({
                label: item.label,
                pct: item.pct,
                colour: CHART.series[index]!,
                dim: channel !== null && channel !== item.label,
              }))}
            />
            <div className="mt-[14px] flex flex-col">
              {CHANNELS.map((item, index) => {
                const active = channel === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setChannel(active ? null : item.label)}
                    className="flex items-center gap-[10px] rounded-chip px-[2px] py-[9px] text-left transition hover:bg-white/[0.025]"
                    style={{ opacity: channel !== null && !active ? 0.28 : 1 }}
                  >
                    <span
                      className="h-[9px] w-[9px] shrink-0 rounded-[3px]"
                      style={{ background: CHART.series[index] }}
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-[12.5px] font-semibold text-ink-1">
                      {item.label}
                    </span>
                    <span className="text-[12.5px] font-bold text-ink-1">
                      {currency(item.value)}
                    </span>
                    <span className="w-[34px] text-right text-[10.5px] text-ink-4">
                      {item.pct}%
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-[10px] text-[10.5px] text-ink-4">
              {isolated
                ? `${isolated.label} is ${isolated.pct}% of ${currency(channelTotal)}.`
                : 'Own site carries most of it. Marketplace fees make it the weakest channel per unit.'}
            </p>
          </Card>

          <Card pad={18} className="flex-1">
            <CardTitle>Gross margin</CardTitle>
            <Donut
              segments={[
                { label: 'Margin', value: FIGURES.margin },
                { label: 'Cost', value: 100 - FIGURES.margin },
              ]}
              centerValue={`${FIGURES.margin}%`}
              centerLabel="Margin"
              size={136}
              ariaLabel={`Gross margin ${FIGURES.margin} percent`}
            />
            <div className="mt-[14px] flex flex-col gap-[2px]">
              <div className="flex items-center justify-between py-[7px]">
                <span className="dash-eyebrow">Price</span>
                <span className="text-[12.5px] font-bold text-lime">{FILL_IN}</span>
              </div>
              <div className="flex items-center justify-between border-t border-line-row py-[7px]">
                <span className="dash-eyebrow">Unit cost</span>
                <span className="text-[12.5px] font-bold text-ink-1">
                  {currency(FIGURES.unitCost, { cents: true })}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-line-row py-[7px]">
                <span className="dash-eyebrow">Margin / unit</span>
                <span className="text-[12.5px] font-bold text-ink-1">{FILL_IN}</span>
              </div>
            </div>
            <Link
              to="/admin/production"
              className="mt-[10px] inline-flex items-center gap-[5px] text-[10.5px] font-semibold text-lime"
            >
              Where the unit cost goes
              <ArrowRight size={12} />
            </Link>
          </Card>
        </div>
      </PageBody>
    </>
  );
}
