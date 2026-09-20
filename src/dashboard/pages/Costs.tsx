/**
 * Costs.
 *
 * Deliberately empty. This page used to render the design handoff's sample
 * figures; they were removed because invented numbers on an internal
 * dashboard eventually get read as fact. It fills in when real data exists.
 */

import { PageBody, PageHeader } from '../layout/AppShell';
import { Card, EmptyState } from '../ui';
import { Wallet } from '../icons';

export default function Costs() {
  return (
    <>
      <PageHeader
        title="Costs"
        live
        description="Spend, commitments and runway."
      />

      <PageBody>
        <Card pad={20}>
          <EmptyState
            icon={Wallet}
            title="No expenses recorded"
            body="There is no expense table yet. Once spend is tracked, this page shows what has gone out, what is committed, and how many months that leaves."
          />
        </Card>
      </PageBody>
    </>
  );
}
