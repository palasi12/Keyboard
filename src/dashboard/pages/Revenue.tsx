/**
 * Revenue (handoff §5.2).
 *
 * The range switcher is the page. All four KPIs, both delta chips and the
 * chart redraw from one piece of state, so nothing can disagree with anything
 * else. Refunds always renders rose/down — a refund figure climbing in lime
 * reads as good news, which it is not.
 */

import { useState } from 'react';
import { PageBody, PageHeader } from '../layout/AppShell';
import { Avatar, Bar, Card, CardTitle, Chip, Kpi, Pill, Row } from '../ui';
import { AreaChart, Donut, Sparkline } from '../ui/charts';
import { COHORT, FILL_IN, RANGES, VARIANTS } from '../mock';
import { currency, number } from '../lib/format';
import { CHART } from '../lib/chart';

const BEST_DAY = [120, 90, 260, 916, 380, 240, 300];

export default function Revenue() {
  const [rangeKey, setRangeKey] = useState<(typeof RANGES)[number]['key']>('12m');
  const range = RANGES.find((item) => item.key === rangeKey)!;

  return (
    <>
      <PageHeader title="Revenue" description="Gross, refunds and net across the selected range." />

      <PageBody
        rail={
          <>
            <Card pad={16}>
              <CardTitle>Best day so far</CardTitle>
              <p className="dash-metric-md">{currency(916)}</p>
              <p className="mt-[3px] text-[10.5px] text-ink-4">2 Sep — the day the TikTok landed</p>
              <div className="mt-[10px]">
                <Sparkline data={BEST_DAY} height={38} ariaLabel="Revenue over the last seven days" />
              </div>
            </Card>

            <Card pad={16}>
              <CardTitle>Biggest single order</CardTitle>
              <Row
                left={<Avatar name="T. Kahu" size={30} />}
                name="T. Kahu"
                sub="TD-0014 · 3 units"
                value={currency(687)}
                to="/admin/orders"
              />
            </Card>

            <Card pad={16}>
              <CardTitle>Pending payouts</CardTitle>
              <p className="dash-metric-md">{currency(1480)}</p>
              <div className="mt-[12px] flex flex-col gap-[10px]">
                <Bar label="Released" value={currency(1130)} pct={76} />
                <Bar label="Held" value={currency(350)} pct={24} active={false} />
              </div>
            </Card>

            <Card pad={16}>
              <div className="flex items-start gap-[10px]">
                <Pill tone="rose" label="Price not locked" />
              </div>
              <p className="mt-[9px] text-[11px] text-ink-4">
                Every margin figure on this page is computed against a placeholder price of{' '}
                {FILL_IN}. Treat them as shape, not amounts.
              </p>
            </Card>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Gross revenue" value={currency(range.gross)} delta={range.deltas.gross} />
          <Kpi
            label="Refunds"
            value={currency(range.refunds)}
            delta={range.deltas.refunds}
            deltaDown
          />
          <Kpi label="Net revenue" value={currency(range.net)} delta={range.deltas.net} />
          <Kpi label="Margin" value={`${range.margin}%`} delta={range.deltas.margin} />
        </div>

        <Card pad={18}>
          <CardTitle
            action={
              <div className="flex flex-wrap gap-[6px]">
                {RANGES.map((item) => (
                  <Chip
                    key={item.key}
                    label={item.label}
                    active={item.key === rangeKey}
                    onClick={() => setRangeKey(item.key)}
                  />
                ))}
              </div>
            }
          >
            Revenue
          </CardTitle>
          <AreaChart
            data={range.series}
            labels={range.ticks}
            height={210}
            marker={range.marker}
            markerLabel={range.marker !== undefined ? 'Pre-orders opened' : undefined}
            ariaLabel={`Revenue over the ${range.label} range`}
            formatValue={(value) => currency(value)}
          />
        </Card>

        <div className="flex flex-col gap-[14px] lg:flex-row">
          <Card pad={18} className="flex-[1.7]">
            <CardTitle>Breakdown by variant</CardTitle>
            <div className="flex flex-col">
              <div className="dash-th grid grid-cols-12 gap-[10px] border-b border-line pb-[9px]">
                <span className="col-span-5">Variant</span>
                <span className="col-span-2 text-right">Units</span>
                <span className="col-span-2 text-right">Revenue</span>
                <span className="col-span-2 text-right">Margin</span>
                <span className="col-span-1 text-right">Share</span>
              </div>
              {VARIANTS.map((variant, index) => (
                <div
                  key={variant.name}
                  className={`grid grid-cols-12 items-center gap-[10px] py-[13px] text-[12.5px] ${
                    index < VARIANTS.length - 1 ? 'border-b border-line-row' : ''
                  }`}
                >
                  <span className="col-span-5 truncate font-semibold text-ink-1">
                    {variant.name}
                  </span>
                  <span className="col-span-2 text-right text-ink-2">{number(variant.units)}</span>
                  <span className="col-span-2 text-right font-bold text-ink-1">
                    {currency(variant.revenue)}
                  </span>
                  <span className="col-span-2 text-right text-ink-2">{variant.margin}%</span>
                  <span className="col-span-1 text-right text-ink-4">{variant.share}%</span>
                </div>
              ))}
            </div>
          </Card>

          <Card pad={18} className="flex-1">
            <CardTitle>Buyer cohort</CardTitle>
            <Donut
              segments={COHORT.map((item, index) => ({
                label: item.label,
                value: item.value,
                colour: CHART.series[index],
              }))}
              centerValue={number(COHORT.reduce((sum, item) => sum + item.value, 0))}
              centerLabel="Buyers"
              size={146}
              ariaLabel="Buyer cohort: 15 first-time, 3 repeat"
            />
            <div className="mt-[14px] flex flex-col">
              {COHORT.map((item, index) => (
                <div
                  key={item.label}
                  className="flex items-center gap-[10px] border-t border-line-row py-[9px] first:border-t-0"
                >
                  <span
                    className="h-[9px] w-[9px] rounded-[3px]"
                    style={{ background: CHART.series[index] }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-[12.5px] font-semibold text-ink-1">
                    {item.label}
                  </span>
                  <span className="text-[12.5px] font-bold text-ink-1">{number(item.value)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </PageBody>
    </>
  );
}
