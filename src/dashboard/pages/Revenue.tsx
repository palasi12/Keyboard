/**
 * Revenue.
 *
 * Deliberately empty. This page used to render the design handoff's sample
 * figures; they were removed because invented numbers on an internal
 * dashboard eventually get read as fact. It fills in when real data exists.
 */

import { PageBody, PageHeader } from '../layout/AppShell';
import { Card, EmptyState } from '../ui';
import { Coin } from '../icons';

export default function Revenue() {
  return (
    <>
      <PageHeader
        title="Revenue"
        live
        description="Revenue, refunds and margin, once there is a first sale."
      />

      <PageBody>
        <Card pad={20}>
          <EmptyState
            icon={Coin}
            title="No revenue yet"
            body="Nothing has sold. When pre-orders open and the first payment clears, this page starts showing gross, refunds, net and margin."
          />
        </Card>
      </PageBody>
    </>
  );
}
