/**
 * Costs & spend (handoff §5.5).
 *
 * Spent and Committed are computed from the paid flags on the expense rows,
 * so flipping a status pill moves money between the two KPIs and pushes the
 * runway figure with it. Nothing here is stored twice.
 */

import { useMemo, useState } from 'react';
import { PageBody, PageHeader } from '../layout/AppShell';
import { Bar, Card, CardTitle, EmptyState, Kpi, Pill } from '../ui';
import { LinePlot } from '../ui/charts';
import { DataTable, type Column } from '../ui/DataTable';
import {
  CO_FOUNDER,
  EXPENSES,
  type Expense,
  FIGURES,
  FOUNDER_SPLIT,
  RUN_SIZE_COST,
  SPEND_BY_CATEGORY,
} from '../mock';
import { currency, number, shortDate } from '../lib/format';
import { Wallet } from '../icons';

type Category = Expense['category'] | 'all';

export default function Costs() {
  const [category, setCategory] = useState<Category>('all');
  const [paid, setPaid] = useState<boolean[]>(() => EXPENSES.map((expense) => expense.paid));

  const spent = useMemo(
    () => EXPENSES.reduce((sum, expense, index) => (paid[index] ? sum + expense.amount : sum), 0),
    [paid],
  );
  const committed = useMemo(
    () => EXPENSES.reduce((sum, expense, index) => (paid[index] ? sum : sum + expense.amount), 0),
    [paid],
  );

  const runway = FIGURES.monthlyBurn > 0 ? FIGURES.cashOnHand / FIGURES.monthlyBurn : 0;

  const rows = useMemo(
    () =>
      EXPENSES.map((expense, index) => ({ ...expense, index, paid: paid[index]! })).filter(
        (expense) => category === 'all' || expense.category === category,
      ),
    [category, paid],
  );

  const filteredTotal = rows.reduce((sum, expense) => sum + expense.amount, 0);
  const maxCategory = Math.max(...SPEND_BY_CATEGORY.map((item) => item.amount));

  function togglePaid(index: number) {
    setPaid((current) => current.map((value, i) => (i === index ? !value : value)));
  }

  type ExpenseRow = Expense & { index: number };

  const columns: Column<ExpenseRow>[] = [
    {
      key: 'date',
      label: 'Date',
      span: 2,
      render: (expense) => <span className="text-ink-4">{shortDate(expense.date)}</span>,
    },
    {
      key: 'item',
      label: 'Item',
      span: 4,
      render: (expense) => (
        <span className="truncate font-semibold text-ink-1" title={expense.item}>
          {expense.item}
        </span>
      ),
    },
    {
      key: 'supplier',
      label: 'Supplier',
      span: 2,
      render: (expense) => <span className="truncate text-ink-2">{expense.supplier}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      span: 2,
      align: 'right',
      render: (expense) => (
        <span className="font-bold text-ink-1">{currency(expense.amount, { cents: true })}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      span: 2,
      align: 'right',
      render: (expense) => (
        <button
          type="button"
          onClick={() => togglePaid(expense.index)}
          aria-label={`${expense.item} is ${expense.paid ? 'paid' : 'planned'}. Mark as ${
            expense.paid ? 'planned' : 'paid'
          }.`}
          className="rounded-pill transition hover:brightness-110"
        >
          <Pill tone={expense.paid ? 'lime' : 'grey'} label={expense.paid ? 'Paid' : 'Planned'} />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Costs"
        description="Flip a status pill to move money between spent and committed."
      />

      <PageBody
        rail={
          <>
            <Card pad={16}>
              <CardTitle>Runway</CardTitle>
              <p className="dash-metric-md">
                {runway.toFixed(1)} <span className="text-[13px] font-semibold text-ink-4">months</span>
              </p>
              <p className="mt-[5px] text-[10.5px] text-ink-4">
                {currency(FIGURES.cashOnHand)} on hand ÷ {currency(FIGURES.monthlyBurn)} a month
              </p>
            </Card>

            <Card pad={16}>
              <CardTitle>Biggest line item</CardTitle>
              <p className="text-[12.5px] font-bold text-ink-1">PCB run — 25 boards</p>
              <p className="mt-[2px] text-[10.5px] text-ink-4">JLCPCB · 15 Sep</p>
              <p className="dash-metric-sm mt-[9px]">{currency(842, { cents: true })}</p>
            </Card>

            <Card pad={16}>
              <CardTitle>Split between founders</CardTitle>
              <div className="flex flex-col gap-[10px]">
                {FOUNDER_SPLIT.map((founder) => (
                  <Bar
                    key={founder.name}
                    label={founder.name}
                    value={currency(founder.amount)}
                    pct={
                      (founder.amount /
                        FOUNDER_SPLIT.reduce((sum, item) => sum + item.amount, 0)) *
                      100
                    }
                  />
                ))}
              </div>
            </Card>

            {committed > 0 && (
              <Card pad={16} className="border-alert-line bg-alert-grad">
                <p className="text-[12.5px] font-bold text-alert-text">
                  {currency(committed)} committed
                </p>
                <p className="mt-[5px] text-[11px] text-alert-muted">
                  Money promised but not yet paid. It comes out of the runway above the moment it
                  lands, not when it is planned.
                </p>
              </Card>
            )}
          </>
        }
      >
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Spent to date" value={currency(spent)} />
          <Kpi label="Committed" value={currency(committed)} sub="Not yet paid" />
          <Kpi label="Monthly burn" value={currency(FIGURES.monthlyBurn)} />
          <Kpi
            label="Cost per unit"
            value={currency(FIGURES.unitCost, { cents: true })}
            sub={`at ${FIGURES.runSize} units`}
          />
        </div>

        <div className="flex flex-col gap-[14px] lg:flex-row">
          <Card pad={18} className="flex-[1.35]">
            <CardTitle>Spend by category</CardTitle>
            <div className="flex flex-col gap-[12px]">
              {SPEND_BY_CATEGORY.map((item) => {
                const active = category === item.category;
                return (
                  <Bar
                    key={item.category}
                    label={item.category}
                    value={currency(item.amount)}
                    pct={(item.amount / maxCategory) * 100}
                    active={category === 'all' || active}
                    pressed={active}
                    onClick={() => setCategory(active ? 'all' : item.category)}
                  />
                );
              })}
            </div>
          </Card>

          <Card pad={18} className="flex-1">
            <CardTitle>Cost per unit by run size</CardTitle>
            <LinePlot
              data={RUN_SIZE_COST.map((point) => point.cost)}
              labels={RUN_SIZE_COST.map((point) => String(point.size))}
              highlight={1}
              height={150}
              ariaLabel="Cost per unit falls as the run size grows"
              formatValue={(value) => currency(value)}
            />
            <p className="mt-[10px] text-[10.5px] text-ink-4">
              The first run of {FIGURES.runSize} is the highlighted point. Doubling it takes roughly{' '}
              {currency(18)} off each unit.
            </p>
          </Card>
        </div>

        <Card pad={18}>
          <CardTitle
            action={
              category !== 'all' ? (
                <button
                  type="button"
                  onClick={() => setCategory('all')}
                  className="text-[10.5px] font-semibold text-lime"
                >
                  Clear filter
                </button>
              ) : undefined
            }
          >
            Expenses
          </CardTitle>

          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(expense) => `${expense.index}`}
            empty={
              <EmptyState
                icon={Wallet}
                title="Nothing in this category"
                body="The category filter is still on so you can undo it."
              />
            }
          />

          <div className="mt-[14px] flex items-center justify-between gap-3">
            <p className="text-[11px] text-ink-4">
              Showing {rows.length} of {EXPENSES.length} expenses
              {category !== 'all' && ` in ${category}`}
            </p>
            <p className="text-[12.5px] font-bold text-ink-1">
              {currency(filteredTotal, { cents: true })}
            </p>
          </div>
        </Card>

        <p className="text-[10.5px] text-ink-5">
          Ownership split is recorded against {CO_FOUNDER} until the second founder name is filled
          in. {number(EXPENSES.length)} expense rows in the sample set.
        </p>
      </PageBody>
    </>
  );
}
