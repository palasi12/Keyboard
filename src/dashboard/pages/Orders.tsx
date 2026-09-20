/**
 * Orders.
 *
 * Deliberately empty. This page used to render the design handoff's sample
 * figures; they were removed because invented numbers on an internal
 * dashboard eventually get read as fact. It fills in when real data exists.
 */

import { PageBody, PageHeader } from '../layout/AppShell';
import { Card, EmptyState } from '../ui';
import { Box } from '../icons';

export default function Orders() {
  return (
    <>
      <PageHeader
        title="Orders"
        live
        description="Every pre-order, its status and where it is going."
      />

      <PageBody>
        <Card pad={20}>
          <EmptyState
            icon={Box}
            title="No orders yet"
            body="Pre-orders cannot open until the price is locked and the ship window is set — launch gates 7 and 8. Orders will appear here once they do."
          />
        </Card>
      </PageBody>
    </>
  );
}
