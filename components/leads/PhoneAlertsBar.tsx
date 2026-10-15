import React, { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, Download, Smartphone, Stethoscope, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { getAlertsState, isInstalledApp, runAlertsCheck, sendTestAlert, turnOffAlerts, turnOnAlerts, type AlertsState, type CheckStep } from '../../services/phoneAlerts';

/**
 * "Phone alerts" strip at the top of the enquiries inbox: turn new-enquiry
 * notifications on/off for this device, send a test, and install the CRM as
 * an app where the browser allows it.
 */
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export const PhoneAlertsBar: React.FC = () => {
  const [state, setState] = useState<AlertsState | 'loading'>('loading');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [check, setCheck] = useState<CheckStep[] | null>(null);
  const [install, setInstall] = useState<InstallPrompt | null>(
    () => ((window as unknown as { __installPrompt?: InstallPrompt }).__installPrompt ?? null),
  );

  useEffect(() => {
    getAlertsState().then(setState);
    const onAvail = () => setInstall((window as unknown as { __installPrompt?: InstallPrompt }).__installPrompt ?? null);
    window.addEventListener('crm-install-available', onAvail);
    return () => window.removeEventListener('crm-install-available', onAvail);
  }, []);

  const run = async (fn: () => Promise<AlertsState | void>, ok?: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const next = await fn();
      if (next) setState(next);
      if (ok) setMsg(ok);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const doInstall = async () => {
    if (!install) return;
    await install.prompt();
    await install.userChoice.catch(() => null);
    setInstall(null);
  };

  if (state === 'loading') return null;

  const btn =
    'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-50';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-3 flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 mr-auto">
        {state === 'on' ? <BellRing className="w-4 h-4 text-emerald-600" /> : <Bell className="w-4 h-4" />}
        {state === 'on' && 'Phone alerts are on for this device'}
        {state === 'off' && 'Get an alert on this phone for every new enquiry'}
        {state === 'blocked' && 'Notifications are blocked. Allow them for this site in your browser settings.'}
        {state === 'unsupported' && 'This browser cannot show notifications. Try Chrome.'}
        {state === 'needs-install' && 'On iPhone: tap Share → “Add to Home Screen”, open the app from there, then turn on alerts.'}
        {state === 'not-configured' && 'Phone alerts are not available in this preview.'}
      </span>

      {install && !isInstalledApp() && (
        <button type="button" onClick={doInstall} className={`${btn} border-slate-300 text-slate-700 dark:text-slate-200 hover:border-slate-500`}>
          <Download className="w-3.5 h-3.5" /> Install app
        </button>
      )}
      {state === 'off' && (
        <button type="button" disabled={busy} onClick={() => run(turnOnAlerts, 'Alerts are on. Send a test to check.')} className={`${btn} bg-amber-400 border-amber-400 text-slate-900 hover:bg-amber-300`}>
          <Smartphone className="w-3.5 h-3.5" /> Turn on alerts
        </button>
      )}
      {state === 'on' && (
        <>
          <button type="button" disabled={busy} onClick={() => run(sendTestAlert, 'Test sent. It should pop up in a few seconds.')} className={`${btn} border-slate-300 text-slate-700 dark:text-slate-200 hover:border-slate-500`}>
            <BellRing className="w-3.5 h-3.5" /> Send test
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                setCheck([]);
                await runAlertsCheck(setCheck);
              })
            }
            className={`${btn} border-slate-300 text-slate-700 dark:text-slate-200 hover:border-slate-500`}
          >
            <Stethoscope className="w-3.5 h-3.5" /> Check alerts
          </button>
          <button type="button" disabled={busy} onClick={() => run(turnOffAlerts)} className={`${btn} border-slate-300 text-slate-500 hover:border-slate-500`}>
            <BellOff className="w-3.5 h-3.5" /> Turn off
          </button>
        </>
      )}
      {msg && <p className="w-full text-xs text-slate-600 dark:text-slate-300">{msg}</p>}
      {check && (
        <ol className="w-full mt-1 space-y-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3">
          {check.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              {c.ok === true ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : c.ok === false ? (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <MinusCircle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{c.label}:</span>{' '}
                <span className="text-slate-600 dark:text-slate-300 break-all">{c.detail}</span>
              </span>
            </li>
          ))}
          {busy && <li className="text-xs text-slate-500">Checking…</li>}
        </ol>
      )}
    </div>
  );
};
