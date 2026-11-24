import { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { Alert, Button, Chip, MenuItem, TextField } from '@mui/material';
import { auth, db } from './firebase';
import LiveBank from './LiveBank';
import bank from './bank-config';

const field = { fullWidth: true, size: 'medium' };
export default function FirebasePortal({ switchUrl }) {
  const [user,setUser]=useState(null), [role,setRole]=useState(''), [profile,setProfile]=useState(null);
  const [mode,setMode]=useState('login'), [busy,setBusy]=useState(false), [error,setError]=useState('');
  const [applications,setApplications]=useState([]), [notice,setNotice]=useState(''), [showLegacy,setShowLegacy]=useState(false);
  const [form,setForm]=useState({name:'',phone:'',dob:'',address:'',documentType:'AADHAAR',documentNumber:'',email:'',password:''});
  const change=(k,v)=>setForm(s=>({...s,[k]:v}));
  useEffect(()=>onAuthStateChanged(auth,async u=>{
    setUser(u); setRole(''); setProfile(null);
    if(!u)return;
    try{
      const snap=await getDoc(doc(db,'users',u.uid));
      if(!snap.exists()){setError('Your profile role is not configured. Contact Iris Bank administration.');return;}
      setProfile(snap.data()); setRole(snap.data().role||'CUSTOMER');
    }catch(e){setError(e.message);}
  }),[]);
  async function register(e){
    e.preventDefault();setBusy(true);setError('');
    try{
      const cred=await createUserWithEmailAndPassword(auth,form.email.trim(),form.password);
      await addDoc(collection(db,'customer_applications'),{
        uid:cred.user.uid,email:form.email.trim(),name:form.name.trim(),phone:form.phone.trim(),
        dateOfBirth:form.dob,address:form.address.trim(),kyc:{documentType:form.documentType,documentNumber:form.documentNumber.trim(),status:'PENDING'},
        accountRequest:{initialDepositMinor:100000,currency:'INR'},status:'PENDING',createdAt:serverTimestamp(),updatedAt:serverTimestamp()
      });
      await (await import('firebase/firestore')).setDoc(doc(db,'users',cred.user.uid),{
        uid:cred.user.uid,email:form.email.trim(),name:form.name.trim(),role:'CUSTOMER',applicationStatus:'PENDING',createdAt:serverTimestamp()
      });
      setProfile({uid:cred.user.uid,email:form.email.trim(),name:form.name.trim(),role:'CUSTOMER',applicationStatus:'PENDING'});
      setRole('CUSTOMER');
      setNotice('Registration submitted. Your KYC and account request are pending Admin review.');
    }catch(e){setError(e.message);}finally{setBusy(false);}
  }
  async function login(e){e.preventDefault();setBusy(true);setError('');try{await signInWithEmailAndPassword(auth,form.email.trim(),form.password);}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function loadApplications(){
    try{const q=query(collection(db,'customer_applications'),orderBy('createdAt','desc'),limit(100));const s=await getDocs(q);setApplications(s.docs.map(d=>({id:d.id,...d.data()})));}catch(e){setError(e.message);}
  }
  useEffect(()=>{if(role==='ADMIN')loadApplications();},[role]);
  async function decide(app,status){
    try{
      await updateDoc(doc(db,'customer_applications',app.id),{status,updatedAt:serverTimestamp(),reviewedBy:user.uid});
      await updateDoc(doc(db,'users',app.uid),{applicationStatus:status});
      if(status==='APPROVED'){
        // Account creation/balance posting is deliberately not performed by client code.
        setNotice('Application approved. A trusted account-provisioning process must create/activate the account and post the ₹1,000 opening balance.');
      } else setNotice('Application marked '+status+'.');
      await loadApplications();
    }catch(e){setError(e.message);}
  }
  if(user && role==='ADMIN') return <div className="firebase-admin">
    <header className="admin-header"><div><b>IRIS BANK</b><small>ADMINISTRATION PORTAL · {bank.id}</small></div><Button onClick={()=>signOut(auth)}>Sign out</Button></header>
    <main className="admin-content"><span className="eyebrow">ADMINISTRATOR</span><h1>Customer applications</h1><p>Review registration details and KYC declarations.</p>
      {error&&<Alert severity="error">{error}</Alert>}{notice&&<Alert severity="info">{notice}</Alert>}
      <div className="admin-summary"><b>{applications.length}</b><span>Applications loaded</span></div>
      {applications.map(a=><section className="panel application-card" key={a.id}>
        <div className="application-head"><div><h2>{a.name}</h2><small>{a.email} · {a.phone}</small></div><Chip label={a.status||'PENDING'} color={a.status==='APPROVED'?'success':a.status==='REJECTED'?'error':'warning'}/></div>
        <div className="application-details"><span><b>Date of birth</b>{a.dateOfBirth||'—'}</span><span><b>Address</b>{a.address||'—'}</span><span><b>KYC document</b>{a.kyc?.documentType||'—'}</span><span><b>Document number</b>{a.kyc?.documentNumber||'—'}</span><span><b>Requested opening deposit</b>₹1,000</span></div>
        {a.status==='PENDING'&&<div className="application-actions"><Button variant="contained" onClick={()=>decide(a,'APPROVED')}>Approve</Button><Button variant="outlined" color="warning" onClick={()=>decide(a,'HOLD')}>Hold</Button><Button variant="outlined" color="error" onClick={()=>decide(a,'REJECTED')}>Reject</Button></div>}
      </section>)}
    </main>
  </div>;
  if(user && role==='CUSTOMER' && showLegacy) return <div><div style={{padding:'12px 20px',background:'#fff'}}><Button onClick={()=>setShowLegacy(false)}>← Back to Firebase customer dashboard</Button></div><LiveBank bank={bank} switchUrl={switchUrl}/></div>;
  if(user && role==='CUSTOMER') return <div className="customer-shell">
    <header className="admin-header"><div><b>IRIS BANK</b><small>CUSTOMER PORTAL · {bank.id}</small></div><Button onClick={()=>signOut(auth)}>Sign out</Button></header>
    <main className="admin-content"><span className="eyebrow">CUSTOMER DASHBOARD</span><h1>Welcome, {profile?.name||user.email}</h1>
      <section className="panel customer-status"><h2>Account application status</h2><Chip label={profile?.applicationStatus||'PENDING'} color={profile?.applicationStatus==='APPROVED'?'success':'warning'}/><p>Your registration and KYC declaration are reviewed by Iris Bank administration.</p></section>
      <section className="panel customer-status"><h2>Your profile</h2><p>{profile?.email}</p><p>Customer UID: {user.uid}</p></section>
      <Alert severity="info">Your account and balance are displayed only after account provisioning. Existing transfer service is retained separately and requires its existing banking-service login.</Alert>
      <div className="application-actions"><Button variant="contained" onClick={()=>setShowLegacy(true)}>Open existing transfer portal</Button><Button variant="outlined" onClick={()=>signOut(auth)}>Sign out</Button></div>
    </main>
  </div>;
  if(user && !role) return <main className="auth-wrap"><section className="panel auth-card"><h1>Profile not configured</h1><p>{error||'Contact Iris Bank administration.'}</p><Button onClick={()=>signOut(auth)}>Sign out</Button></section></main>;
  return <main className="auth-wrap"><section className="auth-brand"><div className="brand-icon">✦</div><span className="eyebrow">IRIS BANK · {bank.id}</span><h1>Banking, made clearer.</h1><p>Secure access to your banking relationship.</p></section>
    <section className="panel auth-card"><div className="auth-tabs"><button className={mode==='login'?'selected':''} onClick={()=>setMode('login')}>Sign in</button><button className={mode==='register'?'selected':''} onClick={()=>setMode('register')}>Register</button></div>
      <h2>{mode==='login'?'Welcome back':'Open an account'}</h2><p>{mode==='login'?'Sign in with your registered customer or administrator account.':'Submit your details for KYC and account review.'}</p>
      {error&&<Alert severity="error">{error}</Alert>}{notice&&<Alert severity="success">{notice}</Alert>}
      <form className="auth-form" onSubmit={mode==='login'?login:register}>
        {mode==='register'&&<><TextField {...field} label="Full name" required value={form.name} onChange={e=>change('name',e.target.value)}/><TextField {...field} label="Mobile number" required value={form.phone} onChange={e=>change('phone',e.target.value)}/><TextField {...field} label="Date of birth" type="date" required InputLabelProps={{shrink:true}} value={form.dob} onChange={e=>change('dob',e.target.value)}/><TextField {...field} label="Residential address" multiline minRows={2} required value={form.address} onChange={e=>change('address',e.target.value)}/><TextField {...field} select label="KYC document type" value={form.documentType} onChange={e=>change('documentType',e.target.value)}><MenuItem value="AADHAAR">Aadhaar</MenuItem><MenuItem value="PAN">PAN</MenuItem><MenuItem value="PASSPORT">Passport</MenuItem><MenuItem value="DRIVING_LICENSE">Driving licence</MenuItem></TextField><TextField {...field} label="Document reference (last 4 characters only)" required inputProps={{maxLength:4}} value={form.documentNumber} onChange={e=>change('documentNumber',e.target.value)}/></>}
        <TextField {...field} label="Email address" type="email" required value={form.email} onChange={e=>change('email',e.target.value)}/><TextField {...field} label="Password" type="password" required inputProps={{minLength:8}} value={form.password} onChange={e=>change('password',e.target.value)}/>
        <Button type="submit" variant="contained" size="large" disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign in securely':'Submit registration'}</Button>
      </form>
      {mode==='register'&&<Alert severity="warning">This is a KYC application workflow only. It does not verify identity or accept document uploads. Enter only the last four characters of a test document reference; do not enter real Aadhaar/PAN numbers.</Alert>}
    </section>
  </main>;
}
