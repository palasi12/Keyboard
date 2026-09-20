/**
 * Production.
 *
 * Deliberately empty. This page used to render the design handoff's sample
 * figures; they were removed because invented numbers on an internal
 * dashboard eventually get read as fact. It fills in when real data exists.
 */

import { PageBody, PageHeader } from '../layout/AppShell';
import { Card, EmptyState } from '../ui';
import { Chip } from '../icons';

export default function Production() {
  return (
    <>
      <PageHeader
        title="Production"
        live
        description="The six stages between a panel of boards and a packed box."
      />

      <PageBody>
        <Card pad={20}>
          <EmptyState
            icon={Chip}
            title="No build data yet"
            body="Nothing here is tracked in the database yet. When the build pipeline and stock counts are recorded, this page shows the six stages and what is short."
          />
        </Card>
      </PageBody>
    </>
  );
}
