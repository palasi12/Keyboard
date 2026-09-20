/**
 * Settings (handoff §5.10).
 *
 * Five tabs on desktop; Integrations drops off below 1024 (§6) because the
 * connect flows are not usable on a phone. The danger zone is deliberately
 * two-step: the first click only arms it and reveals a field that must be
 * typed exactly. Nothing here is destructive on a single click.
 */

import { useState } from 'react';
import { PageBody, PageHeader } from '../layout/AppShell';
import { Avatar, Button, Card, CardTitle, Field, Pill, Tab, Toggle } from '../ui';
import { useAuth } from '../../lib/auth';
import {
  CO_FOUNDER,
  FIGURES,
  FILL_IN,
  INTEGRATIONS,
  INVOICES,
  OWNER,
} from '../mock';
import { currency, longDate, number } from '../lib/format';
import { Gear, Shield, Users } from '../icons';

type TabKey = 'profile' | 'team' | 'billing' | 'notifications' | 'integrations';

const TABS: { key: TabKey; label: string; phone: boolean }[] = [
  { key: 'profile', label: 'Profile', phone: true },
  { key: 'team', label: 'Team', phone: true },
  { key: 'billing', label: 'Billing', phone: true },
  { key: 'notifications', label: 'Alerts', phone: true },
  { key: 'integrations', label: 'Integrations', phone: false },
];

const NOTIFICATIONS = [
  { key: 'n1', title: 'New order', description: 'Every pre-order, the moment it lands.' },
  { key: 'n2', title: 'New waitlist signup', description: 'Batched into one message a day.' },
  { key: 'n3', title: 'Stock runs short', description: 'When a component drops below the run.' },
  { key: 'n4', title: 'A launch gate changes', description: 'Cleared, blocked or back in progress.' },
  { key: 'n5', title: 'Supplier replies', description: 'Messages from anyone tagged supplier.' },
  { key: 'n6', title: 'Weekly summary', description: 'Monday morning, the week behind.' },
] as const;

export default function Settings() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>('profile');
  const [armed, setArmed] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    s2: true,
    s3: false,
    n1: true,
    n2: true,
    n3: true,
    n4: true,
    n5: false,
    n6: true,
    d1: true,
    d2: false,
  });

  const email = user?.email ?? 'Not signed in';
  const set = (key: string) => (next: boolean) =>
    setToggles((current) => ({ ...current, [key]: next }));

  function disarm() {
    setArmed(false);
    setConfirmText('');
  }

  return (
    <>
      <PageHeader title="Settings" description="Workspace, team and delivery preferences." />

      <PageBody>
        <div className="flex flex-wrap gap-[7px]">
          {TABS.map((item) => (
            <span key={item.key} className={item.phone ? '' : 'hidden lg:inline-flex'}>
              <Tab label={item.label} active={tab === item.key} onClick={() => setTab(item.key)} />
            </span>
          ))}
        </div>

        {tab === 'profile' && (
          <>
            <Card pad={18}>
              <CardTitle>Profile</CardTitle>
              <div className="flex flex-wrap items-center gap-[14px]">
                <Avatar name={email} size={56} />
                <div className="flex gap-[7px]">
                  <Button size="sm">Upload</Button>
                  <Button size="sm">Remove</Button>
                </div>
              </div>
              <div className="mt-[18px] grid grid-cols-1 gap-[14px] sm:grid-cols-2">
                <Field label="Full name" value={OWNER} readOnly />
                <Field label="Display name" value="Jenil" readOnly />
                <Field label="Email" value={email} readOnly hint="From the signed-in account." />
                <Field label="Registered in" value="New Zealand" readOnly />
              </div>
            </Card>

            <Card pad={18}>
              <CardTitle>Security</CardTitle>
              <Toggle
                checked={toggles.s2!}
                onChange={set('s2')}
                title="Two-factor authentication"
                description="Required to reach this dashboard from a new device."
              />
              <div className="border-t border-line-row" />
              <Toggle
                checked={toggles.s3!}
                onChange={set('s3')}
                title="Alert on new device sign-in"
                description="Emails you whenever a session starts somewhere new."
              />
              <div className="mt-[12px] flex items-center justify-between gap-3 rounded-tile border border-line-strong bg-tile-grad p-[12px]">
                <span className="flex items-center gap-[10px]">
                  <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-tile bg-lime/[0.16] text-lime">
                    <Shield size={15} />
                  </span>
                  <span>
                    <span className="block text-[12px] font-semibold text-ink-1">Password</span>
                    <span className="block text-[10.5px] text-ink-4">
                      Changed through the reset flow on the public site.
                    </span>
                  </span>
                </span>
                <a
                  href="/forgot-password"
                  className="shrink-0 text-[11px] font-semibold text-lime"
                >
                  Reset
                </a>
              </div>
            </Card>

            <Card pad={18}>
              <CardTitle>Workspace</CardTitle>
              <dl className="flex flex-col">
                {[
                  ['Plan', 'Free while pre-launch'],
                  ['Seats', '2'],
                  ['Product', 'Taptile Dialect'],
                  ['First run', `${FIGURES.runSize} units`],
                  ['Unit price', FILL_IN],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 border-t border-line-row py-[9px] first:border-t-0"
                  >
                    <dt className="dash-eyebrow">{label}</dt>
                    <dd
                      className={`text-[12px] font-semibold ${
                        value === FILL_IN ? 'text-lime' : 'text-ink-1'
                      }`}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card pad={18} className="border-alert-line bg-alert-grad">
              <CardTitle>Danger zone</CardTitle>
              <p className="text-[11.5px] text-alert-muted">
                Deleting the workspace removes the waitlist, every devlog post and both accounts.
                There is no undo and no export afterwards.
              </p>

              {armed ? (
                <div className="mt-[14px] flex flex-col gap-[12px]">
                  <Field
                    label="Type TAPTILE to confirm"
                    value={confirmText}
                    onChange={setConfirmText}
                    placeholder="TAPTILE"
                  />
                  <div className="flex flex-wrap gap-[7px]">
                    <Button
                      variant="danger"
                      disabled={confirmText !== 'TAPTILE'}
                      onClick={disarm}
                    >
                      Delete the workspace
                    </Button>
                    <Button onClick={disarm}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-[14px]">
                  <Button variant="danger" onClick={() => setArmed(true)}>
                    Delete the workspace
                  </Button>
                </div>
              )}
            </Card>
          </>
        )}

        {tab === 'team' && (
          <>
            <Card pad={18}>
              <CardTitle>Team</CardTitle>
              <div className="flex flex-col">
                {[
                  { name: OWNER, role: 'Owner', mail: email },
                  { name: CO_FOUNDER, role: 'Founder', mail: '[CO-FOUNDER EMAIL]' },
                ].map((member, index) => (
                  <div
                    key={member.name}
                    className={`flex items-center gap-[10px] py-[13px] ${
                      index === 0 ? '' : 'border-t border-line-row'
                    }`}
                  >
                    <Avatar name={member.name} size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-bold text-ink-1">
                        {member.name}
                      </span>
                      <span className="block truncate text-[10.5px] text-ink-4">
                        {member.mail}
                      </span>
                    </span>
                    <Pill tone={index === 0 ? 'lime' : 'grey'} label={member.role} />
                  </div>
                ))}
              </div>
            </Card>

            <Card pad={18}>
              <CardTitle>Ownership split</CardTitle>
              <div className="flex h-[12px] w-full gap-[3px]">
                <div
                  className="h-full rounded-[6px] bg-lime-grad"
                  style={{ width: '60%' }}
                  aria-hidden="true"
                />
                <div
                  className="h-full rounded-[6px] bg-tile-track"
                  style={{ width: '40%' }}
                  aria-hidden="true"
                />
              </div>
              <div className="mt-[12px] flex justify-between text-[11.5px]">
                <span className="font-semibold text-ink-1">{OWNER} · 60%</span>
                <span className="text-ink-4">{CO_FOUNDER} · 40%</span>
              </div>
            </Card>

            <Card pad={18}>
              <CardTitle>Invites</CardTitle>
              <div className="flex flex-col items-center py-6 text-center">
                <span className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-tile bg-tile text-ink-5">
                  <Users size={22} />
                </span>
                <p className="mt-[14px] text-[13.5px] font-bold text-ink-2">No pending invites</p>
                <p className="mt-[5px] max-w-[280px] text-[11.5px] text-ink-4">
                  Two seats, both taken. Adding a third changes the plan.
                </p>
              </div>
            </Card>
          </>
        )}

        {tab === 'billing' && (
          <>
            <Card pad={18}>
              <CardTitle>Plan</CardTitle>
              <p className="dash-metric">{currency(0)}</p>
              <p className="mt-[5px] text-[11.5px] text-ink-4">
                Free while pre-launch. Renews {FILL_IN}.
              </p>
            </Card>

            <Card pad={18}>
              <CardTitle>Payment method</CardTitle>
              <div className="flex items-center gap-[10px] rounded-tile border border-line-strong bg-tile-grad p-[12px]">
                <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-tile bg-status-blue/[0.16] text-status-blue">
                  <Gear size={15} />
                </span>
                <span className="flex-1">
                  <span className="block text-[12px] font-semibold text-ink-1">
                    Visa ending 4417
                  </span>
                  <span className="block text-[10.5px] text-ink-4">Not charged while free</span>
                </span>
              </div>
            </Card>

            <Card pad={18}>
              <CardTitle>Invoices</CardTitle>
              <div className="flex flex-col">
                {INVOICES.map((invoice, index) => (
                  <div
                    key={invoice.id}
                    className={`flex items-center gap-[10px] py-[12px] ${
                      index === 0 ? '' : 'border-t border-line-row'
                    }`}
                  >
                    <span className="flex-1 text-[12px] font-semibold text-ink-1">
                      {invoice.id}
                    </span>
                    <span className="text-[11px] text-ink-4">{longDate(invoice.date)}</span>
                    <span className="w-[60px] text-right text-[12px] font-bold text-ink-1">
                      {currency(invoice.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {tab === 'notifications' && (
          <>
            <Card pad={18}>
              <CardTitle>What to send</CardTitle>
              {NOTIFICATIONS.map((item, index) => (
                <div key={item.key} className={index === 0 ? '' : 'border-t border-line-row'}>
                  <Toggle
                    checked={toggles[item.key]!}
                    onChange={set(item.key)}
                    title={item.title}
                    description={item.description}
                  />
                </div>
              ))}
            </Card>

            <Card pad={18}>
              <CardTitle>Where to send it</CardTitle>
              <Toggle
                checked={toggles.d1!}
                onChange={set('d1')}
                title="Email"
                description={email}
              />
              <div className="border-t border-line-row" />
              <Toggle
                checked={toggles.d2!}
                onChange={set('d2')}
                title="Push"
                description="Browser notifications on this device."
              />
              <div className="mt-[12px] rounded-tile border border-line-strong bg-tile-grad p-[12px]">
                <p className="text-[12px] font-semibold text-ink-1">Quiet hours</p>
                <p className="mt-[3px] text-[10.5px] text-ink-4">
                  10pm – 7am. Nothing but a failed payment gets through.
                </p>
              </div>
            </Card>
          </>
        )}

        {tab === 'integrations' && (
          <>
            <Card pad={18}>
              <CardTitle>Tools</CardTitle>
              <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2">
                {INTEGRATIONS.map((tool) => (
                  <div
                    key={tool.name}
                    className="flex items-center gap-[10px] rounded-tile border border-line-strong bg-tile-grad p-[12px]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold text-ink-1">
                        {tool.name}
                      </span>
                      <span className="block truncate text-[10.5px] text-ink-4">
                        {tool.detail}
                      </span>
                    </span>
                    <Pill
                      tone={tool.connected ? 'lime' : 'grey'}
                      label={tool.connected ? 'Connected' : 'Not connected'}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-[12px] text-[10.5px] text-ink-5">
                Shown as connected in the design handoff. Nothing on this dashboard reads from
                them yet — the real figures still come from {number(2)} Supabase tables.
              </p>
            </Card>

            <Card pad={18}>
              <CardTitle>API keys</CardTitle>
              <div className="flex flex-col gap-[12px]">
                <Field label="Publishable key" value="pk_live_••••••••••••4417" readOnly />
                <Field label="Secret key" value="sk_live_••••••••••••9c21" readOnly />
              </div>
            </Card>
          </>
        )}
      </PageBody>
    </>
  );
}
