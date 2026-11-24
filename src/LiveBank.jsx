import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Chip, MenuItem, TextField } from '@mui/material';
import {
  ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, Calculator, ChartNoAxesCombined,
  ChevronRight, CircleHelp, CreditCard, FileText, Globe2, Landmark, LayoutDashboard,
  LogOut, Menu, Percent, RefreshCw, Send, ShieldCheck, Wallet, X
} from 'lucide-react';
import { toPaise } from './amount';
import { configuredEndpoint, liveApi, parseEndpoint, readStorage, saveStorage } from './live-api';
import './live.css';

const money = minor => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((Number(minor) || 0) / 100);
const rupees = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value) || 0);
const time = value => value ? new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
}).format(new Date(value)) : '—';

const statusNames = {
  PENDING: 'Pending', PROCESSING: 'Processing', COMPLETED: 'Completed', REJECTED: 'Rejected', MANUAL_REVIEW: 'Manual review',
};
const rejectionNames = {
  INSUFFICIENT_FUNDS: 'Insufficient available balance',
  LIMIT_EXCEEDED: 'Transfer limit exceeded',
  DESTINATION_ACCOUNT_UNAVAILABLE: 'The destination is unavailable',
};
const byId = (directory, id) => directory.find(bank => bank.bankId === id)?.bankName || id;

function TransferForm({ bank, accounts, directory, send }) {
  const [type, setType] = useState('interbank');
  const [from, setFrom] = useState('');
  const [destination, setDestination] = useState('');
  const [number, setNumber] = useState('');
  const [amount, setAmount] = useState('200');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const sources = accounts.filter(account => account.status === 'ACTIVE');
  const fromId = sources.some(item => item.accountId === from) ? from : (sources[0]?.accountId || '');
  const routes = directory.filter(item => item.bankId !== bank.id && item.status === 'ACTIVE');
  const route = destination ? (routes.find(item => item.ifsc === destination)?.ifsc || '') : (routes[0]?.ifsc || '');
  const target = type === 'internal' ? bank.ifsc : route;

  async function submit(event) {
    event.preventDefault();
    setError('');
    const amountMinor = toPaise(amount);
    if (!fromId || !target || !number.trim() || amountMinor === null) {
      setError('Choose a source, destination and positive amount with at most two decimal places.');
      return;
    }
    setBusy(true);
    try {
      await send({ fromAccountId: fromId, destinationIfsc: target,
        destinationAccountNumber: number.trim(), amountMinor, currency: 'INR' });
      setNumber('');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  return <section className="panel live-transfer">
    <header className="panel-head"><div><h2>Make a transfer</h2><p>Send money within Iris Bank or to another participating bank.</p></div><Send size={19} /></header>
    <form className="transfer-form" onSubmit={submit}>
      <div className="type-switch">
        {[['interbank', 'Other bank'], ['internal', 'Iris Bank']].map(([value, label]) => <Button key={value}
          type="button" aria-pressed={type === value} variant={type === value ? 'contained' : 'outlined'}
          disabled={busy} onClick={() => setType(value)}>{label}</Button>)}
      </div>
      <TextField select label="From account" required value={fromId} onChange={e => setFrom(e.target.value)} disabled={busy || !sources.length} fullWidth>
        {sources.map(account => <MenuItem key={account.accountId} value={account.accountId}>
          {account.accountNumber} · {money(account.availableMinor)} available
        </MenuItem>)}
      </TextField>
      {type === 'interbank' && <TextField select label="Destination bank" required value={route}
        onChange={e => setDestination(e.target.value)} disabled={busy || !routes.length} fullWidth>
        {routes.map(item => <MenuItem key={item.ifsc} value={item.ifsc}>{item.bankName} · {item.ifsc}</MenuItem>)}
      </TextField>}
      <TextField label="Destination account number" required value={number} onChange={e => setNumber(e.target.value)} disabled={busy} fullWidth />
      <TextField label="Amount (INR)" required value={amount} onChange={e => setAmount(e.target.value)} disabled={busy}
        fullWidth slotProps={{ htmlInput: { inputMode: 'decimal' } }} />
      {error && <Alert severity="error">{error}</Alert>}
      <div><Button type="submit" variant="contained" disabled={busy || !fromId || !target} startIcon={<Send size={16} />}>
        {busy ? 'Submitting…' : 'Review and submit'}
      </Button></div>
    </form>
  </section>;
}

function Activity({ rows, directory }) {
  return <section className="panel">
    <header className="panel-head"><div><h2>Recent transfer activity</h2><p>Latest 50 transfers available to this signed-in user.</p></div><FileText size={19} /></header>
    {rows.length ? <div className="table-scroll"><table>
      <thead><tr><th>Transfer reference</th><th>Route</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.transferId}>
        <td><strong>{row.transferId}</strong><small>{time(row.createdAt)}</small></td>
        <td><strong>{byId(directory, row.sourceBankId)} → {byId(directory, row.destinationBankId)}</strong><small>
          {row.type === 'INTERNAL' ? 'Same bank' : row.direction === 'CREDIT' ? 'Incoming' : 'Outgoing'}
        </small></td>
        <td className={row.direction === 'CREDIT' ? 'incoming amount' : 'amount'}>{money(row.amountMinor)}</td>
        <td><Chip size="small" label={statusNames[row.status] || row.status}
          className={row.status === 'COMPLETED' ? 'completed' : 'live-' + row.status?.toLowerCase()} />
          {row.code && <small>{rejectionNames[row.code] || row.code.toLowerCase().replaceAll('_', ' ')}</small>}</td>
      </tr>)}</tbody>
    </table></div> : <div className="empty"><ArrowLeftRight size={23} /><strong>No transfers yet</strong><p>Your transfers will appear here after the banking service processes them.</p></div>}
  </section>;
}

function InterestTools() {
  const [principal, setPrincipal] = useState('50000');
  const [rate, setRate] = useState('3.5');
  const [years, setYears] = useState('1');
  const [compound, setCompound] = useState('4');
  const [loanAmount, setLoanAmount] = useState('500000');
  const [loanRate, setLoanRate] = useState('9');
  const [loanYears, setLoanYears] = useState('5');
  const savings = Math.max(0, Number(principal) || 0);
  const annualRate = Math.max(0, Number(rate) || 0);
  const term = Math.max(0, Number(years) || 0);
  const frequency = Math.max(1, Number(compound) || 1);
  const maturity = savings * Math.pow(1 + annualRate / 100 / frequency, frequency * term);
  const interest = maturity - savings;
  const amount = Math.max(0, Number(loanAmount) || 0);
  const monthlyRate = Math.max(0, Number(loanRate) || 0) / 1200;
  const months = Math.max(1, (Number(loanYears) || 1) * 12);
  const emi = monthlyRate === 0 ? amount / months : amount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  return <div className="tools-grid">
    <section className="panel tool-panel">
      <header className="panel-head"><div><h2>Deposit interest calculator</h2><p>Estimate compound interest using a rate you enter.</p></div><Percent size={20}/></header>
      <div className="tool-fields">
        <TextField label="Principal (₹)" type="number" value={principal} onChange={e => setPrincipal(e.target.value)} fullWidth />
        <div className="field-pair">
          <TextField label="Annual rate (%)" type="number" value={rate} onChange={e => setRate(e.target.value)} fullWidth />
          <TextField label="Years" type="number" value={years} onChange={e => setYears(e.target.value)} fullWidth />
        </div>
        <TextField select label="Compounding frequency" value={compound} onChange={e => setCompound(e.target.value)} fullWidth>
          <MenuItem value="1">Annually</MenuItem><MenuItem value="2">Half-yearly</MenuItem><MenuItem value="4">Quarterly</MenuItem><MenuItem value="12">Monthly</MenuItem>
        </TextField>
      </div>
      <div className="calculator-result"><span>Estimated maturity value</span><strong>{rupees(maturity)}</strong><small>Estimated interest: {rupees(interest)}</small></div>
    </section>
    <section className="panel tool-panel">
      <header className="panel-head"><div><h2>Loan EMI calculator</h2><p>Estimate monthly instalments.</p></div><Calculator size={20}/></header>
      <div className="tool-fields">
        <TextField label="Loan amount (₹)" type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} fullWidth />
        <div className="field-pair">
          <TextField label="Annual rate (%)" type="number" value={loanRate} onChange={e => setLoanRate(e.target.value)} fullWidth />
          <TextField label="Tenure (years)" type="number" value={loanYears} onChange={e => setLoanYears(e.target.value)} fullWidth />
        </div>
      </div>
      <div className="calculator-result"><span>Estimated monthly EMI</span><strong>{rupees(emi)}</strong><small>Total repayment: {rupees(emi * months)}</small></div>
    </section>
    <Alert severity="info" className="tool-disclaimer">These are planning calculators only. Rates are entered by you and are not live Iris Bank product rates. Actual interest and loan terms must be supplied by the bank and confirmed by its backend.</Alert>
  </div>;
}

function OperationsNotice() {
  return <section className="panel operations-panel">
    <header className="panel-head"><div><h2>Account services</h2><p>Additional account operations planned for the secure banking service.</p></div><ShieldCheck size={20}/></header>
    <div className="operation-grid">
      <div className="operation-item"><span className="operation-icon credit"><ArrowDownLeft size={19}/></span><div><strong>Cash deposit / credit</strong><small>Requires authorized deposit posting and a matching ledger entry.</small></div><Chip size="small" label="Backend required"/></div>
      <div className="operation-item"><span className="operation-icon debit"><ArrowUpRight size={19}/></span><div><strong>Cash withdrawal / debit</strong><small>Requires balance validation, limits and an authorized ledger posting.</small></div><Chip size="small" label="Backend required"/></div>
      <div className="operation-item"><span className="operation-icon interest"><Percent size={19}/></span><div><strong>Savings interest credit</strong><small>Requires an approved rate schedule and scheduled calculation.</small></div><Chip size="small" label="Backend required"/></div>
      <div className="operation-item"><span className="operation-icon deposit"><Wallet size={19}/></span><div><strong>Fixed deposits and loans</strong><small>Requires product terms, approvals and repayment records.</small></div><Chip size="small" label="Backend required"/></div>
    </div>
  </section>;
}

function Overview({ bank, accounts, transfers, onTransfer, onActivity, onTools }) {
  const totalAvailable = accounts.reduce((sum, a) => sum + (Number(a.availableMinor) || 0), 0);
  const totalHeld = accounts.reduce((sum, a) => sum + (Number(a.heldMinor) || 0), 0);
  const completed = transfers.filter(t => t.status === 'COMPLETED');
  const credits = completed.filter(t => t.direction === 'CREDIT').reduce((s, t) => s + (Number(t.amountMinor) || 0), 0);
  const debits = completed.filter(t => t.direction !== 'CREDIT').reduce((s, t) => s + (Number(t.amountMinor) || 0), 0);
  return <>
    <section className="welcome-row"><div><span className="eyebrow">YOUR FINANCIAL OVERVIEW</span><h1>Welcome to better banking.</h1><p>Manage your Iris Bank accounts and transfers in one place.</p></div><div className="welcome-mark"><Landmark size={34}/></div></section>
    <div className="overview-grid">
      <section className="balance-hero">
        <div className="balance-top"><span>Total available balance</span><Wallet size={20}/></div>
        <div className="balance-number">{money(totalAvailable)}</div>
        <div className="balance-bottom"><span>{accounts.length} linked account{accounts.length === 1 ? '' : 's'}</span><span>Held {money(totalHeld)}</span></div>
        <div className="balance-glow"/>
      </section>
      <section className="metric-card"><span className="metric-icon credit"><ArrowDownLeft size={19}/></span><small>Completed incoming transfers</small><strong>{money(credits)}</strong><span className="metric-note">From loaded transfer history</span></section>
      <section className="metric-card"><span className="metric-icon debit"><ArrowUpRight size={19}/></span><small>Completed outgoing transfers</small><strong>{money(debits)}</strong><span className="metric-note">From loaded transfer history</span></section>
    </div>
    <div className="quick-actions">
      <button onClick={onTransfer}><span className="quick-icon"><Send size={19}/></span><span><strong>Transfer money</strong><small>Same bank or another bank</small></span><ChevronRight size={17}/></button>
      <button onClick={onActivity}><span className="quick-icon"><FileText size={19}/></span><span><strong>Transaction activity</strong><small>Review recent transfers</small></span><ChevronRight size={17}/></button>
      <button onClick={onTools}><span className="quick-icon"><Calculator size={19}/></span><span><strong>Financial calculators</strong><small>Interest and loan estimates</small></span><ChevronRight size={17}/></button>
    </div>
    <section className="section-block"><div className="section-title"><div><h2>Your accounts</h2><p>Account balances returned by the existing banking service.</p></div></div>
      <div className="accounts">{accounts.map((account, i) =>
        <section key={account.accountId} className={'account-card ' + (i === 0 ? 'primary-account' : 'light-account')}>
          <div className="account-head"><span>{bankLabel(account.accountNumber)}</span><Landmark size={19}/></div>
          <div className="account-value">{money(account.availableMinor)}</div>
          <div className="account-foot"><span>Available · Held {money(account.heldMinor)}</span><span>{account.accountId}</span></div>
        </section>)}</div>
    </section>
    <OperationsNotice/>
  </>;
}
function bankLabel(accountNumber) { return accountNumber ? 'IRIS BANK · ' + accountNumber : 'IRIS BANK ACCOUNT'; }

export default function LiveBank({ bank, switchUrl, openDemo }) {
  const urlKey = 'x42-cloudflare-worker-url';
  const [base, setBase] = useState(() => configuredEndpoint || readStorage(localStorage, urlKey, ''));
  const [session, setSession] = useState(null);
  const prefix = '/banks/' + bank.id;
  const [url, setUrl] = useState(base);
  const [editUrl, setEditUrl] = useState(!base);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [data, setData] = useState({ accounts: [], transfers: [] });
  const [directory, setDirectory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const activeToken = useRef(null);
  activeToken.current = session?.token;
  const pending = useRef(new Map());
  const refresh = useCallback(async signal => {
    if (!session) return;
    try {
      const value = await liveApi(base, prefix + '/dashboard', { token: session.token, signal });
      if (signal?.aborted || activeToken.current !== session.token) return;
      setData(value);
      setLoaded(true);
      setError('');
    } catch (failure) {
      if (signal?.aborted || activeToken.current !== session.token) return;
      if (failure.status === 401) {
        setSession(null);
        setData({ accounts: [], transfers: [] });
        setLoaded(false);
      }
      setError(failure.message);
    }
  }, [base, prefix, session]);

  useEffect(() => {
    if (!session) return undefined;
    const controller = new AbortController();
    const update = () => { if (document.visibilityState === 'visible') refresh(controller.signal); };
    refresh(controller.signal);
    const timer = setInterval(update, 12_000);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(timer); controller.abort(); document.removeEventListener('visibilitychange', update); };
  }, [session, refresh]);

  useEffect(() => {
    if (!session) return undefined;
    const controller = new AbortController();
    liveApi(base, '/directory/banks', { signal: controller.signal })
      .then(value => setDirectory(value.banks || []))
      .catch(failure => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, [base, session]);

  function logout() {
    setSession(null); setLoaded(false); setData({ accounts: [], transfers: [] }); setNote(''); setView('overview');
  }

  async function signIn(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { const value = await liveApi(base, prefix + '/sign-in', { data: { email: email.trim(), password } }); setSession(value); }
    catch (failure) { setError(failure.message); }
    finally { setPassword(''); setBusy(false); }
  }

  function connect(event) {
    event.preventDefault(); setError('');
    try {
      const endpoint = parseEndpoint(url);
      if (endpoint !== base) { logout(); setDirectory([]); }
      saveStorage(localStorage, urlKey, endpoint); setBase(endpoint); setEditUrl(false);
    } catch (failure) { setError(failure.message); }
  }

  async function send(transfer) {
    const raw = JSON.stringify([bank.id, base, session.uid, transfer]);
    const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)));
    const hash = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    const keyName = 'x42-pending-' + hash;
    const key = pending.current.get(keyName) || readStorage(sessionStorage, keyName, null) || crypto.randomUUID();
    pending.current.set(keyName, key); saveStorage(sessionStorage, keyName, key);
    const row = await liveApi(base, prefix + '/transfers', { token: session.token, data: transfer, key });
    pending.current.delete(keyName); saveStorage(sessionStorage, keyName, null);
    const verb = row.status === 'COMPLETED' ? 'Completed' : row.status === 'REJECTED' ? 'Rejected' :
      row.status === 'MANUAL_REVIEW' ? 'Manual review' : 'Accepted';
    setNote(verb + ' · ' + row.transferId); await refresh();
  }

  const navItems = [
    ['overview', 'Overview', LayoutDashboard], ['transfers', 'Transfers', ArrowLeftRight],
    ['activity', 'Activity', FileText], ['tools', 'Interest & loans', ChartNoAxesCombined],
  ];
  const title = navItems.find(item => item[0] === view)?.[1] || 'Overview';
  const accounts = data.accounts || [];
  const transfers = data.transfers || [];

  return <div className="bank-shell">
    <aside className={'bank-sidebar ' + (mobileNav ? 'nav-open' : '')}>
      <div className="brand"><span className="brand-icon"><Landmark size={23}/></span><span><strong>{bank.wordmark}</strong><small>PERSONAL BANKING</small></span>
        <button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={19}/></button>
      </div>
      <div className="sidebar-caption">BANKING</div>
      <nav aria-label="Bank navigation">
        {navItems.map(([key, label, Icon]) => <button key={key} className={view === key ? 'active' : ''} onClick={() => { setView(key); setMobileNav(false); }}><Icon size={18}/><span>{label}</span></button>)}
      </nav>
      <div className="sidebar-bottom">
        {!configuredEndpoint && <button onClick={() => { setUrl(base); setEditUrl(!editUrl); setMobileNav(false); }}><Globe2 size={18}/><span>Worker connection</span></button>}
        {openDemo && <button onClick={openDemo}><CircleHelp size={18}/><span>Browser demo</span></button>}
        <a className="switch-link" href={switchUrl}><Globe2 size={18}/><span>SharedBank switch</span></a>
        {session && <button onClick={logout}><LogOut size={18}/><span>Sign out</span></button>}
        <div className="sidebar-security"><ShieldCheck size={16}/><span>Secure banking session</span></div>
      </div>
    </aside>
    {mobileNav && <button className="nav-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
    <div className="bank-main">
      <header className="bank-topbar">
        <div className="topbar-left"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={21}/></button><div><strong>{bank.name}</strong><small>{bank.id} · Personal banking</small></div></div>
        <div className="topbar-right"><span className="secure-label"><ShieldCheck size={15}/> Secure portal</span>{session && <span className="user-pill">{session.email?.slice(0,1)?.toUpperCase() || 'U'}</span>}</div>
      </header>
      <main className="bank-content">
        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
        {note && <Alert severity="info" onClose={() => setNote('')}>{note}</Alert>}
        {editUrl && <section className="panel connection-panel"><header className="panel-head"><div><h2>Banking service connection</h2><p>Connect to the existing banking API. The current integration is retained.</p></div></header>
          <form className="transfer-form" onSubmit={connect}><TextField label="Banking API URL" fullWidth required value={url} onChange={e => setUrl(e.target.value)}/><div><Button type="submit" variant="contained">Save connection</Button></div></form>
        </section>}
        {!session && base && !editUrl && <section className="login-layout">
          <div className="login-art"><div className="login-art-logo"><Landmark size={28}/></div><span className="eyebrow">IRIS BANK · DIGITAL BANKING</span><h1>Banking that moves with you.</h1><p>A clearer view of your accounts, transfers and everyday finances.</p><div className="login-art-foot"><ShieldCheck size={16}/> Protected banking access</div></div>
          <section className="panel login-panel"><div className="login-panel-heading"><span className="eyebrow">WELCOME BACK</span><h2>Sign in to Iris Bank</h2><p>Use your existing bank customer login.</p></div>
            <form className="transfer-form" onSubmit={signIn}><TextField label="Email address" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} fullWidth/><TextField label="Password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} fullWidth/><Button type="submit" variant="contained" disabled={busy} size="large">{busy ? 'Signing in…' : 'Sign in securely'}</Button></form>
            <div className="login-foot"><ShieldCheck size={15}/> Your existing authentication flow is unchanged.</div>
          </section>
        </section>}
        {session && <>
          <div className="content-heading"><div><span className="eyebrow">IRIS BANK / {title.toUpperCase()}</span><h1>{title}</h1><p>{view === 'overview' ? 'Your accounts and everyday banking at a glance.' : view === 'transfers' ? 'Move money securely between participating accounts.' : view === 'activity' ? 'Review the latest transfer activity returned by the banking service.' : 'Explore interest and repayment estimates.'}</p></div><Button variant="outlined" startIcon={<RefreshCw size={16}/>} onClick={() => refresh()} className="refresh-button">Refresh</Button></div>
          {!loaded && <Alert severity="info">Loading your accounts and activity…</Alert>}
          {loaded && !accounts.length && <Alert severity="info">This Firebase user has no synthetic account in this bank. Attach an account to this Firebase UID.</Alert>}
          {view === 'overview' && loaded && <Overview bank={bank} accounts={accounts} transfers={transfers} onTransfer={() => setView('transfers')} onActivity={() => setView('activity')} onTools={() => setView('tools')}/>}
          {view === 'transfers' && accounts.length > 0 && <TransferForm bank={bank} accounts={accounts} directory={directory} send={send}/>}
          {view === 'activity' && <Activity rows={transfers} directory={directory}/>}
          {view === 'tools' && <InterestTools/>}
        </>}
        <footer className="bank-footer"><span>© {new Date().getFullYear()} {bank.name}</span><span><ShieldCheck size={14}/> Banking portal · INR</span></footer>
      </main>
    </div>
  </div>;
}
