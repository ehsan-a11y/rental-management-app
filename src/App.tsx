import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/* ── helpers ── */
const uid = () => Math.random().toString(36).slice(2,9);
const fmtN = n => Number(n||0).toLocaleString();
const nowMonth = () => new Date().toISOString().slice(0,7);
const calcStatus = (paid, total) => +paid >= +total ? "PAID" : +paid > 0 ? "PARTIALLY_PAID" : "UNPAID";

const SEED = {
  buildings: [
    { id:"b1", name:"Al Noor Tower",  address:"Al Nahda, Dubai",  notes:"Main building" },
    { id:"b2", name:"Gulf Residency", address:"Deira, Dubai",      notes:"Waterfront property" },
  ],
  flats: [
    { id:"f1", buildingId:"b1", flatNumber:"A-101", flatSize:1200, totalRent:30000, notes:"Ground floor" },
    { id:"f2", buildingId:"b2", flatNumber:"B-201", flatSize:900,  totalRent:22000, notes:"Sea view" },
  ],
  partitions: [
    { id:"p1", flatId:"f1", partitionName:"Room A", partitionSize:400, monthlyRent:10000, maxResidents:2 },
    { id:"p2", flatId:"f1", partitionName:"Room B", partitionSize:350, monthlyRent:9000,  maxResidents:2 },
    { id:"p3", flatId:"f1", partitionName:"Room C", partitionSize:450, monthlyRent:11000, maxResidents:2 },
    { id:"p4", flatId:"f2", partitionName:"Room A", partitionSize:450, monthlyRent:12000, maxResidents:2 },
    { id:"p5", flatId:"f2", partitionName:"Room B", partitionSize:450, monthlyRent:10000, maxResidents:2 },
  ],
  residents: [
    { id:"r1", partitionId:"p1", fullName:"Ahmed Hassan",  phone:"050-111-2222", email:"ahmed@m.com",  moveInDate:"2024-01-15", moveOutDate:null, status:"Active", monthlyRent:10000 },
    { id:"r2", partitionId:"p2", fullName:"Mohammed Ali",  phone:"050-222-3333", email:"mali@m.com",   moveInDate:"2024-02-01", moveOutDate:null, status:"Active", monthlyRent:9000  },
    { id:"r3", partitionId:"p3", fullName:"Fatima Noor",   phone:"050-333-4444", email:"fnoor@m.com",  moveInDate:"2024-03-10", moveOutDate:null, status:"Active", monthlyRent:11000 },
    { id:"r4", partitionId:"p4", fullName:"Khalid Omar",   phone:"050-444-5555", email:"komar@m.com",  moveInDate:"2024-01-20", moveOutDate:null, status:"Active", monthlyRent:12000 },
    { id:"r5", partitionId:"p5", fullName:"Sara Mansour",  phone:"050-555-6666", email:"sara@m.com",   moveInDate:"2024-04-01", moveOutDate:null, status:"Active", monthlyRent:10000 },
  ],
  rentPayments: [
    { id:"rp1", residentId:"r1", month:"2025-01", totalRent:10000, paidAmount:10000, paymentStatus:"PAID",           paymentDate:"2025-01-05", notes:"" },
    { id:"rp2", residentId:"r2", month:"2025-01", totalRent:9000,  paidAmount:5000,  paymentStatus:"PARTIALLY_PAID", paymentDate:"2025-01-08", notes:"" },
    { id:"rp3", residentId:"r3", month:"2025-01", totalRent:11000, paidAmount:0,     paymentStatus:"UNPAID",         paymentDate:null,         notes:"" },
    { id:"rp4", residentId:"r4", month:"2025-01", totalRent:12000, paidAmount:12000, paymentStatus:"PAID",           paymentDate:"2025-01-03", notes:"" },
    { id:"rp5", residentId:"r5", month:"2025-01", totalRent:10000, paidAmount:7000,  paymentStatus:"PARTIALLY_PAID", paymentDate:"2025-01-10", notes:"" },
    { id:"rp6", residentId:"r1", month:"2025-02", totalRent:10000, paidAmount:10000, paymentStatus:"PAID",           paymentDate:"2025-02-04", notes:"" },
    { id:"rp7", residentId:"r4", month:"2025-02", totalRent:12000, paidAmount:12000, paymentStatus:"PAID",           paymentDate:"2025-02-02", notes:"" },
    { id:"rp8", residentId:"r2", month:"2025-02", totalRent:9000,  paidAmount:0,     paymentStatus:"UNPAID",         paymentDate:null,         notes:"" },
  ],
  expenses: [
    { id:"e1", flatId:"f1", title:"Electricity", amount:2500, expenseDate:"2025-01-10", notes:"" },
    { id:"e2", flatId:"f1", title:"Water",        amount:800,  expenseDate:"2025-01-12", notes:"" },
    { id:"e3", flatId:"f2", title:"Maintenance",  amount:1500, expenseDate:"2025-01-15", notes:"Plumbing" },
    { id:"e4", flatId:"f1", title:"Electricity",  amount:2700, expenseDate:"2025-02-10", notes:"" },
    { id:"e5", flatId:"f2", title:"Water",        amount:600,  expenseDate:"2025-02-12", notes:"" },
    { id:"e6", flatId:"f2", title:"Maintenance",  amount:900,  expenseDate:"2025-02-20", notes:"AC" },
  ],
};

/* ── tiny primitives ── */
const SC = { PAID:"bg-emerald-100 text-emerald-700", PARTIALLY_PAID:"bg-amber-100 text-amber-700", UNPAID:"bg-red-100 text-red-700", Active:"bg-blue-100 text-blue-700", Vacated:"bg-gray-100 text-gray-500" };
const SL = { PAID:"Paid", PARTIALLY_PAID:"Partial", UNPAID:"Unpaid" };
const Badge = ({v}) => <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SC[v]||"bg-gray-100 text-gray-500"}`}>{SL[v]||v}</span>;
const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300";
const btnCls = (e="") => `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${e}`;
const Th = ({c}) => <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">{c}</th>;
const Td = ({c,className=""}) => <td className={`px-4 py-3 text-sm text-gray-700 ${className}`}>{c}</td>;
const Empty = ({msg}) => <div className="text-center py-14 text-gray-400 text-sm">{msg}</div>;

function Modal({title, onClose, children, wide}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide?"max-w-2xl":"max-w-md"} max-h-[90vh] overflow-y-auto`} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
function Field({label, children, err}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
    </div>
  );
}
function Confirm({msg, onYes, onNo}) {
  return (
    <Modal title="Confirm" onClose={onNo}>
      <p className="text-gray-600 mb-6">{msg}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onNo}  className={btnCls("bg-gray-100 hover:bg-gray-200 text-gray-700")}>Cancel</button>
        <button onClick={onYes} className={btnCls("bg-red-500 hover:bg-red-600 text-white")}>Delete</button>
      </div>
    </Modal>
  );
}

/* ── Dashboard components ── */
function KpiCard({icon, label, value, sub, grad, badge, progress, progressMax, onClick}) {
  const pct = progressMax > 0 ? Math.min((progress/progressMax)*100,100) : 0;
  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-lg p-5 ${onClick?"cursor-pointer hover:opacity-90 transition-opacity":""}`} style={{background:grad}} onClick={onClick}>
      <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full" style={{background:"rgba(255,255,255,0.08)"}}/>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{background:"rgba(255,255,255,0.2)"}}>{icon}</div>
        {badge && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:"rgba(255,255,255,0.2)",color:"#fff"}}>{badge}</span>}
      </div>
      <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">{label}</p>
      <p className="text-white text-2xl font-extrabold mt-0.5">{value}</p>
      {sub && <p className="text-white/60 text-xs mt-0.5">{sub}</p>}
      {progress != null && (
        <div className="mt-3 rounded-full h-1.5" style={{background:"rgba(255,255,255,0.2)"}}>
          <div className="h-1.5 rounded-full" style={{width:`${pct}%`,background:"rgba(255,255,255,0.8)"}}/>
        </div>
      )}
    </div>
  );
}

function DonutRing({paid, partial, unpaid, selected, onSelect}) {
  const total = paid+partial+unpaid||1;
  const r=48, cx=60, cy=60, circ=2*Math.PI*r;
  const seg=(pct,off)=>({strokeDasharray:`${(pct/total)*circ} ${circ}`,strokeDashoffset:-(off/total)*circ});
  const segments = [
    {key:"PAID",    color:"#10b981", count:paid,    label:"Paid",    bg:"bg-emerald-400"},
    {key:"PARTIALLY_PAID", color:"#f59e0b", count:partial, label:"Partial", bg:"bg-amber-400"},
    {key:"UNPAID",  color:"#f87171", count:unpaid,  label:"Unpaid",  bg:"bg-red-400"},
  ];
  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative cursor-pointer" onClick={()=>onSelect(null)}>
        <svg width="130" height="130" viewBox="0 0 120 120" style={{transform:"rotate(-90deg)"}}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="12"/>
          {segments.map((s,i)=>{
            const off = i===0?0:i===1?paid:paid+partial;
            const isSelected = selected===s.key;
            return (
              <circle key={s.key} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
                strokeWidth={isSelected?16:12} strokeLinecap="round"
                style={{...seg(s.count,off), opacity: selected && !isSelected ? 0.3 : 1, transition:"all 0.2s", cursor:"pointer"}}
                onClick={e=>{e.stopPropagation(); onSelect(selected===s.key?null:s.key);}}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xl font-extrabold text-gray-800">{paid+partial+unpaid}</p>
          <p className="text-xs text-gray-400">{selected?"filtered":"records"}</p>
        </div>
      </div>
      <div className="flex gap-3 mt-3 text-xs">
        {segments.map(({key,bg,label,count})=>(
          <button key={key} onClick={()=>onSelect(selected===key?null:key)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${selected===key?"ring-2 ring-offset-1 ring-gray-400 bg-gray-50 font-bold":""}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${bg}`}/><span className="text-gray-500">{label} <b>{count}</b></span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Forms ── */
function BuildingForm({init, onSave, onClose}) {
  const [name, setName] = useState(init?.name||"");
  const [address, setAddress] = useState(init?.address||"");
  const [notes, setNotes] = useState(init?.notes||"");
  const [err, setErr] = useState({});
  const submit = () => {
    const e = {};
    if (!name.trim()) e.name="Required";
    if (!address.trim()) e.address="Required";
    if (Object.keys(e).length) { setErr(e); return; }
    const d = {name:name.trim(), address:address.trim(), notes:notes.trim()};
    if (init?.id) d.id = init.id;
    onSave(d);
  };
  return (
    <>
      <Field label="Building Name *" err={err.name}><input className={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Al Noor Tower"/></Field>
      <Field label="Address *" err={err.address}><input className={inp} value={address} onChange={e=>setAddress(e.target.value)} placeholder="e.g. Al Nahda, Dubai"/></Field>
      <Field label="Notes"><textarea className={inp} rows={2} value={notes} onChange={e=>setNotes(e.target.value)}/></Field>
      <div className="flex gap-3 justify-end mt-2">
        <button type="button" onClick={onClose} className={btnCls("bg-gray-100 hover:bg-gray-200 text-gray-700")}>Cancel</button>
        <button type="button" onClick={submit}  className={btnCls("bg-indigo-600 hover:bg-indigo-700 text-white")}>Save Building</button>
      </div>
    </>
  );
}

function FlatForm({init, buildings, onSave, onClose}) {
  const [f, setF] = useState(init||{buildingId:buildings[0]?.id||"", flatNumber:"", flatSize:"", totalRent:"", notes:""});
  const [err, setErr] = useState({});
  const set = k => e => setF(p=>({...p,[k]:e.target.value}));
  const submit = () => {
    const e={};
    if (!f.buildingId) e.buildingId="Required";
    if (!f.flatNumber.trim()) e.flatNumber="Required";
    if (!f.flatSize||isNaN(f.flatSize)) e.flatSize="Required";
    if (!f.totalRent||isNaN(f.totalRent)) e.totalRent="Required";
    if (Object.keys(e).length){setErr(e);return;}
    onSave({...f, flatSize:+f.flatSize, totalRent:+f.totalRent});
  };
  return (
    <>
      <Field label="Building *" err={err.buildingId}>
        <select className={inp} value={f.buildingId} onChange={set("buildingId")}>{buildings.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
      </Field>
      <Field label="Flat Number *" err={err.flatNumber}><input className={inp} value={f.flatNumber} onChange={set("flatNumber")} placeholder="A-101"/></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Size (sq ft) *" err={err.flatSize}><input className={inp} type="number" value={f.flatSize} onChange={set("flatSize")}/></Field>
        <Field label="Monthly Rent (AED) *" err={err.totalRent}><input className={inp} type="number" value={f.totalRent} onChange={set("totalRent")}/></Field>
      </div>
      <Field label="Notes"><textarea className={inp} rows={2} value={f.notes} onChange={set("notes")}/></Field>
      <div className="flex gap-3 justify-end mt-2">
        <button type="button" onClick={onClose} className={btnCls("bg-gray-100 hover:bg-gray-200 text-gray-700")}>Cancel</button>
        <button type="button" onClick={submit}  className={btnCls("bg-indigo-600 hover:bg-indigo-700 text-white")}>Save</button>
      </div>
    </>
  );
}

function PartitionForm({init, flats, buildings, onSave, onClose}) {
  const [f, setF] = useState(init||{flatId:flats[0]?.id||"", partitionName:"", partitionSize:"", monthlyRent:"", maxResidents:2});
  const [err, setErr] = useState({});
  const set = k => e => setF(p=>({...p,[k]:e.target.value}));
  const getLabel = fl => { const b=buildings.find(x=>x.id===fl.buildingId); return `${b?.name} › ${fl.flatNumber}`; };
  const submit = () => {
    const e={};
    if (!f.flatId) e.flatId="Required";
    if (!f.partitionName.trim()) e.partitionName="Required";
    if (!f.monthlyRent||isNaN(f.monthlyRent)) e.monthlyRent="Required";
    if (Object.keys(e).length){setErr(e);return;}
    onSave({...f, partitionSize:+f.partitionSize, monthlyRent:+f.monthlyRent, maxResidents:+f.maxResidents});
  };
  return (
    <>
      <Field label="Flat *" err={err.flatId}>
        <select className={inp} value={f.flatId} onChange={set("flatId")}>{flats.map(fl=><option key={fl.id} value={fl.id}>{getLabel(fl)}</option>)}</select>
      </Field>
      <Field label="Partition Name *" err={err.partitionName}><input className={inp} value={f.partitionName} onChange={set("partitionName")} placeholder="Room A"/></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Size (sq ft)"><input className={inp} type="number" value={f.partitionSize} onChange={set("partitionSize")}/></Field>
        <Field label="Monthly Rent *" err={err.monthlyRent}><input className={inp} type="number" value={f.monthlyRent} onChange={set("monthlyRent")}/></Field>
      </div>
      <Field label="Max Residents"><input className={inp} type="number" min={1} value={f.maxResidents} onChange={set("maxResidents")}/></Field>
      <div className="flex gap-3 justify-end mt-2">
        <button type="button" onClick={onClose} className={btnCls("bg-gray-100 hover:bg-gray-200 text-gray-700")}>Cancel</button>
        <button type="button" onClick={submit}  className={btnCls("bg-indigo-600 hover:bg-indigo-700 text-white")}>Save</button>
      </div>
    </>
  );
}

function ResidentForm({init, partitions, flats, buildings, residents, onSave, onClose}) {
  const getPartRent = pid => partitions.find(x=>x.id===pid)?.monthlyRent || 0;
  const defPartId = init?.partitionId || partitions[0]?.id || "";
  const [f, setF] = useState(init || {partitionId:defPartId, fullName:"", phone:"", email:"", moveInDate:new Date().toISOString().slice(0,10), moveOutDate:"", status:"Active", monthlyRent:getPartRent(defPartId)});
  const [err, setErr] = useState({});
  const set = k => e => { setF(p=>({...p,[k]:e.target.value})); if(err[k]) setErr(p=>({...p,[k]:undefined})); };
  const selPart = partitions.find(x=>x.id===f.partitionId);
  const occupied = residents.filter(r=>r.partitionId===f.partitionId && r.status==="Active" && r.id!==init?.id).length;
  const isFull = selPart && occupied >= selPart.maxResidents;
  const getLabel = pid => {
    const p=partitions.find(x=>x.id===pid), fl=flats.find(x=>x.id===p?.flatId), b=buildings.find(x=>x.id===fl?.buildingId);
    return `${b?.name} › ${fl?.flatNumber} › ${p?.partitionName}`;
  };
  const submit = () => {
    const e={};
    if (!f.partitionId) e.partitionId="Required";
    if (!f.fullName.trim()) e.fullName="Required";
    if (!f.phone.trim()) e.phone="Required";
    if (!f.monthlyRent || isNaN(f.monthlyRent) || +f.monthlyRent <= 0) e.monthlyRent="Enter a valid rent amount";
    if (f.status==="Active" && isFull) e.partitionId=`Partition full (${occupied}/${selPart.maxResidents})`;
    if (Object.keys(e).length){setErr(e);return;}
    onSave({...f, moveOutDate:f.moveOutDate||null, monthlyRent:+f.monthlyRent});
  };
  return (
    <>
      <Field label="Partition *" err={err.partitionId}>
        <select className={inp} value={f.partitionId} onChange={e=>{
          const pid=e.target.value;
          setF(p=>({...p, partitionId:pid, monthlyRent:getPartRent(pid)}));
          setErr({});
        }}>
          {partitions.map(p=>{
            const occ=residents.filter(r=>r.partitionId===p.id&&r.status==="Active"&&r.id!==init?.id).length;
            const full=occ>=p.maxResidents;
            return <option key={p.id} value={p.id}>{getLabel(p.id)} — {occ}/{p.maxResidents} {full?"🔴 FULL":"🟢"}</option>;
          })}
        </select>
        {selPart && <p className={`text-xs mt-1 font-medium ${isFull?"text-red-500":"text-emerald-600"}`}>{isFull?`⛔ Full — ${occupied}/${selPart.maxResidents}`:`✅ ${selPart.maxResidents-occupied} slot(s) available`}</p>}
      </Field>
      <Field label="Full Name *" err={err.fullName}><input className={inp} value={f.fullName} onChange={set("fullName")}/></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone *" err={err.phone}><input className={inp} value={f.phone} onChange={set("phone")}/></Field>
        <Field label="Email"><input className={inp} value={f.email} onChange={set("email")}/></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Move-in Date"><input className={inp} type="date" value={f.moveInDate} onChange={set("moveInDate")}/></Field>
        <Field label="Move-out Date"><input className={inp} type="date" value={f.moveOutDate||""} onChange={set("moveOutDate")}/></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Monthly Rent (AED) *" err={err.monthlyRent}>
          <input className={inp} type="number" min={0} value={f.monthlyRent} onChange={set("monthlyRent")}/>
          {selPart && +f.monthlyRent !== selPart.monthlyRent && (
            <p className="text-xs text-amber-500 mt-1">⚠️ Differs from partition default (AED {fmtN(selPart.monthlyRent)})</p>
          )}
        </Field>
        <Field label="Status"><select className={inp} value={f.status} onChange={set("status")}><option>Active</option><option>Vacated</option></select></Field>
      </div>
      <div className="flex gap-3 justify-end mt-2">
        <button type="button" onClick={onClose} className={btnCls("bg-gray-100 hover:bg-gray-200 text-gray-700")}>Cancel</button>
        <button type="button" onClick={submit}  className={btnCls("bg-indigo-600 hover:bg-indigo-700 text-white")}>Save</button>
      </div>
    </>
  );
}

function PaymentForm({init, residents, partitions, flats, buildings, onSave, onClose}) {
  const activeRes = residents.filter(r=>r.status==="Active");
  const defRes = init?.residentId||activeRes[0]?.id||"";
  const getPRent = rid => residents.find(x=>x.id===rid)?.monthlyRent || 0;
  const [f, setF] = useState(init||{residentId:defRes, month:nowMonth(), totalRent:getPRent(defRes), paidAmount:"", paymentDate:new Date().toISOString().slice(0,10), notes:""});
  const [err, setErr] = useState({});
  const set = k => e => { const v=e.target.value; setF(p=>({...p,[k]:v,...(k==="residentId"?{totalRent:getPRent(v)}:{})})); };
  const balance = +f.totalRent - +f.paidAmount;
  const status = calcStatus(f.paidAmount, f.totalRent);
  const getLabel = r => { const p=partitions.find(x=>x.id===r.partitionId),fl=flats.find(x=>x.id===p?.flatId),b=buildings.find(x=>x.id===fl?.buildingId); return `${r.fullName} (${b?.name} › ${fl?.flatNumber} › ${p?.partitionName})`; };
  const submit = () => {
    const e={};
    if (!f.residentId) e.residentId="Required";
    if (!f.month) e.month="Required";
    if (f.paidAmount==="") e.paidAmount="Required";
    if (Object.keys(e).length){setErr(e);return;}
    onSave({...f, totalRent:+f.totalRent, paidAmount:+f.paidAmount, paymentStatus:status});
  };
  return (
    <>
      <Field label="Resident *" err={err.residentId}>
        <select className={inp} value={f.residentId} onChange={set("residentId")}>{activeRes.map(r=><option key={r.id} value={r.id}>{getLabel(r)}</option>)}</select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Month *" err={err.month}><input className={inp} type="month" value={f.month} onChange={set("month")}/></Field>
        <Field label="Total Rent (AED)"><input className={inp} type="number" value={f.totalRent} onChange={set("totalRent")}/></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Paid Amount *" err={err.paidAmount}><input className={inp} type="number" value={f.paidAmount} onChange={set("paidAmount")}/></Field>
        <Field label="Payment Date"><input className={inp} type="date" value={f.paymentDate} onChange={set("paymentDate")}/></Field>
      </div>
      <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-xl text-sm">
        <span className="text-gray-500">Balance: <strong className="text-red-600">AED {fmtN(Math.max(balance,0))}</strong></span>
        <Badge v={status}/>
      </div>
      <Field label="Notes"><textarea className={inp} rows={2} value={f.notes} onChange={set("notes")}/></Field>
      <div className="flex gap-3 justify-end mt-2">
        <button type="button" onClick={onClose} className={btnCls("bg-gray-100 hover:bg-gray-200 text-gray-700")}>Cancel</button>
        <button type="button" onClick={submit}  className={btnCls("bg-indigo-600 hover:bg-indigo-700 text-white")}>Save</button>
      </div>
    </>
  );
}

function ExpenseForm({init, flats, buildings, onSave, onClose}) {
  const [f, setF] = useState(init||{flatId:flats[0]?.id||"", title:"Electricity", amount:"", expenseDate:new Date().toISOString().slice(0,10), notes:""});
  const [err, setErr] = useState({});
  const set = k => e => setF(p=>({...p,[k]:e.target.value}));
  const getLabel = fl => { const b=buildings.find(x=>x.id===fl.buildingId); return `${b?.name} › ${fl.flatNumber}`; };
  const submit = () => {
    const e={};
    if (!f.flatId) e.flatId="Required";
    if (!f.amount||isNaN(f.amount)) e.amount="Required";
    if (Object.keys(e).length){setErr(e);return;}
    onSave({...f, amount:+f.amount});
  };
  return (
    <>
      <Field label="Flat *" err={err.flatId}>
        <select className={inp} value={f.flatId} onChange={set("flatId")}>{flats.map(fl=><option key={fl.id} value={fl.id}>{getLabel(fl)}</option>)}</select>
      </Field>
      <Field label="Category"><select className={inp} value={f.title} onChange={set("title")}>{["Electricity","Water","Maintenance","Internet","Gas","Other"].map(t=><option key={t}>{t}</option>)}</select></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Amount (AED) *" err={err.amount}><input className={inp} type="number" value={f.amount} onChange={set("amount")}/></Field>
        <Field label="Date"><input className={inp} type="date" value={f.expenseDate} onChange={set("expenseDate")}/></Field>
      </div>
      <Field label="Notes"><textarea className={inp} rows={2} value={f.notes} onChange={set("notes")}/></Field>
      <div className="flex gap-3 justify-end mt-2">
        <button type="button" onClick={onClose} className={btnCls("bg-gray-100 hover:bg-gray-200 text-gray-700")}>Cancel</button>
        <button type="button" onClick={submit}  className={btnCls("bg-indigo-600 hover:bg-indigo-700 text-white")}>Save</button>
      </div>
    </>
  );
}

/* ── RESIDENT SEARCH ── */
function ResidentSearch({residents, partitions, flats, buildings, rentPayments}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  const matches = query.trim().length === 0 ? [] : residents.filter(r =>
    r.fullName.toLowerCase().includes(query.toLowerCase()) ||
    r.phone.includes(query)
  );

  const pick = r => { setSelected(r); setQuery(r.fullName); setOpen(false); };
  const clear = () => { setSelected(null); setQuery(""); setOpen(false); };

  const info = r => {
    const part = partitions.find(x => x.id === r.partitionId);
    const fl   = flats.find(x => x.id === part?.flatId);
    const bld  = buildings.find(x => x.id === fl?.buildingId);
    return { part, fl, bld };
  };

  const stayDuration = moveIn => {
    const d1 = new Date(moveIn), d2 = new Date();
    let months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
    const years = Math.floor(months / 12); months = months % 12;
    return [years > 0 ? `${years}y` : "", months > 0 ? `${months}mo` : ""].filter(Boolean).join(" ") || "< 1 month";
  };

  const pendingBalance = r => rentPayments
    .filter(p => p.residentId === r.id)
    .reduce((s, p) => s + Math.max(p.totalRent - p.paidAmount, 0), 0);

  const sel = selected;
  const selInfo = sel ? info(sel) : null;
  const selBalance = sel ? pendingBalance(sel) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              className={`${inp} pl-8 pr-8`}
              placeholder="Type resident name or phone…"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null); setOpen(true); }}
              onFocus={() => setOpen(true)}
            />
            {query && (
              <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
            )}
          </div>
        </div>
        {/* Dropdown */}
        {open && matches.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
            {matches.slice(0,8).map(r => {
              const {part, fl, bld} = info(r);
              return (
                <button key={r.id} onClick={() => pick(r)}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{background:"linear-gradient(135deg,#6366f1,#a855f7)"}}>{r.fullName.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{r.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{bld?.name} › {fl?.flatNumber} › {part?.partitionName}</p>
                  </div>
                  <Badge v={r.status}/>
                </button>
              );
            })}
          </div>
        )}
        {open && query.trim().length > 0 && matches.length === 0 && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-sm text-gray-400">
            No residents found
          </div>
        )}
      </div>

      {/* Detail card */}
      {sel && selInfo && (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/40 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 bg-indigo-600">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-indigo-600 font-extrabold text-lg bg-white flex-shrink-0">
              {sel.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-extrabold text-lg leading-tight truncate">{sel.fullName}</p>
              <p className="text-indigo-200 text-xs">{sel.phone}{sel.email ? ` · ${sel.email}` : ""}</p>
            </div>
            <Badge v={sel.status}/>
          </div>
          {/* Hierarchy */}
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="flex items-center gap-1 bg-white rounded-lg px-3 py-1.5 border border-gray-200 font-medium text-indigo-700 shadow-sm">
                🏙️ {selInfo.bld?.name}
              </span>
              <span className="text-gray-300">›</span>
              <span className="flex items-center gap-1 bg-white rounded-lg px-3 py-1.5 border border-gray-200 font-medium text-blue-700 shadow-sm">
                🏢 Flat {selInfo.fl?.flatNumber}
              </span>
              <span className="text-gray-300">›</span>
              <span className="flex items-center gap-1 bg-white rounded-lg px-3 py-1.5 border border-gray-200 font-medium text-violet-700 shadow-sm">
                🚪 {selInfo.part?.partitionName}
              </span>
            </div>
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
              <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                <p className="text-xs text-gray-400 mb-1">Monthly Rent</p>
                <p className="text-lg font-extrabold text-indigo-600">AED {fmtN(sel.monthlyRent)}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                <p className="text-xs text-gray-400 mb-1">Stay Duration</p>
                <p className="text-lg font-extrabold text-blue-600">{stayDuration(sel.moveInDate)}</p>
                <p className="text-xs text-gray-400">since {sel.moveInDate}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                <p className="text-xs text-gray-400 mb-1">Pending Balance</p>
                <p className={`text-lg font-extrabold ${selBalance > 0 ? "text-red-500" : "text-emerald-500"}`}>
                  AED {fmtN(selBalance)}
                </p>
                <p className="text-xs text-gray-400">{selBalance > 0 ? "outstanding" : "all clear"}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm text-center">
                <p className="text-xs text-gray-400 mb-1">Room Size</p>
                <p className="text-lg font-extrabold text-gray-700">{selInfo.part?.partitionSize || "—"}</p>
                <p className="text-xs text-gray-400">sq ft</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── DASHBOARD ── */
function Dashboard({buildings, flats, partitions, residents, rentPayments, expenses, onNav}) {
  const mon = nowMonth();
  const monLabel = new Date(mon+"-01").toLocaleString("default",{month:"long",year:"numeric"});
  const today = new Date().toLocaleDateString("en-AE",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const activeRes = residents.filter(r=>r.status==="Active");
  const estRent = partitions.reduce((s,p)=>s+p.monthlyRent,0);
  const monPay = rentPayments.filter(r=>r.month===mon);
  const collected = monPay.reduce((s,r)=>s+r.paidAmount,0);
  const monExp = expenses.filter(e=>e.expenseDate.slice(0,7)===mon).reduce((s,e)=>s+e.amount,0);
  const pending = Math.max(estRent-collected,0);
  const net = collected-monExp;
  const colRate = estRent>0 ? Math.round((collected/estRent)*100) : 0;
  const totalSlots = partitions.reduce((s,p)=>s+p.maxResidents,0);
  const emptySlots = totalSlots-activeRes.length;
  const occRate = totalSlots>0 ? Math.round((activeRes.length/totalSlots)*100) : 0;
  const paidC = monPay.filter(p=>p.paymentStatus==="PAID").length;
  const partC = monPay.filter(p=>p.paymentStatus==="PARTIALLY_PAID").length;
  const unpC  = monPay.filter(p=>p.paymentStatus==="UNPAID").length;
  const [payFilter, setPayFilter] = useState(null);

  // Resident search state (inline in hero)
  const [srchQuery, setSrchQuery] = useState("");
  const [srchOpen,  setSrchOpen]  = useState(false);
  const [srchSel,   setSrchSel]   = useState(null);
  const srchMatches = srchQuery.trim().length === 0 ? [] : residents.filter(r =>
    r.fullName.toLowerCase().includes(srchQuery.toLowerCase()) || r.phone.includes(srchQuery)
  );
  const srchInfo = r => {
    const part=partitions.find(x=>x.id===r.partitionId), fl=flats.find(x=>x.id===part?.flatId), bld=buildings.find(x=>x.id===fl?.buildingId);
    return {part,fl,bld};
  };
  const srchDur = moveIn => {
    let months=(new Date().getFullYear()-new Date(moveIn).getFullYear())*12+(new Date().getMonth()-new Date(moveIn).getMonth());
    const y=Math.floor(months/12); months%=12;
    return [y>0?`${y}y`:"",months>0?`${months}mo`:""].filter(Boolean).join(" ")||"< 1 month";
  };
  const srchBal = r => rentPayments.filter(p=>p.residentId===r.id).reduce((s,p)=>s+Math.max(p.totalRent-p.paidAmount,0),0);

  const chartData = useMemo(()=>{
    const arr=[];
    for(let i=2;i>=0;i--){
      const d=new Date(); d.setMonth(d.getMonth()-i);
      const m=d.toISOString().slice(0,7);
      const col=rentPayments.filter(r=>r.month===m).reduce((s,r)=>s+r.paidAmount,0);
      const exp=expenses.filter(e=>e.expenseDate.slice(0,7)===m).reduce((s,e)=>s+e.amount,0);
      arr.push({month:m.slice(5), Collected:col, Expenses:exp, Net:Math.max(col-exp,0)});
    }
    return arr;
  },[rentPayments,expenses]);

  const expCat = useMemo(()=>{
    const acc={};
    expenses.filter(e=>e.expenseDate.slice(0,7)===mon).forEach(e=>{acc[e.title]=(acc[e.title]||0)+e.amount;});
    return Object.entries(acc).map(([name,value])=>({name,value}));
  },[expenses,mon]);
  const CAT_CLR=["#6366f1","#f59e0b","#10b981","#f87171","#3b82f6","#a78bfa"];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-3xl p-6 relative shadow-xl" style={{background:"linear-gradient(135deg,#1e1b4b,#312e81,#4f46e5)"}}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10 pointer-events-none" style={{background:"radial-gradient(circle,#a5b4fc,transparent)"}}/>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative">
          <div>
            <p className="text-indigo-300 text-sm">{today}</p>
            <h1 className="text-white text-3xl font-extrabold mt-1">Property Dashboard</h1>
            <p className="text-indigo-200 text-sm mt-1">{buildings.length} buildings · {flats.length} flats · {partitions.length} rooms</p>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            {[
              {label:"Collection Rate", val:`${colRate}%`,  color:colRate>=80?"#10b981":colRate>=50?"#f59e0b":"#f87171"},
              {label:"Occupancy",       val:`${occRate}%`,  color:occRate>=80?"#10b981":"#f59e0b"},
              {label:"Net Profit",      val:`AED ${fmtN(Math.abs(net))}`, color:net>=0?"#10b981":"#f87171"},
            ].map(b=>(
              <div key={b.label} className="rounded-2xl px-4 py-3 text-center border" style={{background:"rgba(255,255,255,0.1)",borderColor:"rgba(255,255,255,0.1)"}}>
                <p className="text-2xl font-extrabold" style={{color:b.color}}>{b.val}</p>
                <p className="text-indigo-200 text-xs mt-0.5">{b.label}</p>
              </div>
            ))}
            {/* Inline resident search */}
            <div className="relative">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">🔍</span>
                <input
                  className="rounded-2xl px-4 py-3 pl-9 pr-8 text-sm text-white placeholder-white/50 border outline-none focus:ring-2 focus:ring-white/30 w-52"
                  style={{background:"rgba(255,255,255,0.1)",borderColor:"rgba(255,255,255,0.1)"}}
                  placeholder="Search resident…"
                  value={srchQuery}
                  onChange={e=>{setSrchQuery(e.target.value);setSrchSel(null);setSrchOpen(true);}}
                  onFocus={()=>setSrchOpen(true)}
                />
                {srchQuery && (
                  <button onClick={()=>{setSrchQuery("");setSrchSel(null);setSrchOpen(false);}}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-xs">✕</button>
                )}
              </div>
              {srchOpen && srchMatches.length > 0 && (
                <div className="absolute z-50 mt-1 right-0 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                  {srchMatches.slice(0,6).map(r=>{
                    const {part,fl,bld}=srchInfo(r);
                    return (
                      <button key={r.id} onClick={()=>{setSrchSel(r);setSrchQuery(r.fullName);setSrchOpen(false);}}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{background:"linear-gradient(135deg,#6366f1,#a855f7)"}}>{r.fullName.charAt(0)}</div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{r.fullName}</p>
                          <p className="text-xs text-gray-400 truncate">{bld?.name} › {fl?.flatNumber} › {part?.partitionName}</p>
                        </div>
                        <Badge v={r.status}/>
                      </button>
                    );
                  })}
                </div>
              )}
              {srchOpen && srchQuery.trim().length > 0 && srchMatches.length === 0 && (
                <div className="absolute z-50 mt-1 right-0 w-64 bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-sm text-gray-400">No residents found</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resident detail card (appears below hero when selected) */}
      {srchSel && (()=>{
        const {part,fl,bld}=srchInfo(srchSel);
        const bal=srchBal(srchSel);
        return (
          <div className="rounded-2xl border border-indigo-100 overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-5 py-4 bg-indigo-600">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-indigo-600 font-extrabold text-lg bg-white flex-shrink-0">{srchSel.fullName.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-extrabold text-lg leading-tight truncate">{srchSel.fullName}</p>
                <p className="text-indigo-200 text-xs">{srchSel.phone}{srchSel.email?` · ${srchSel.email}`:""}</p>
              </div>
              <Badge v={srchSel.status}/>
              <button onClick={()=>{setSrchSel(null);setSrchQuery("");}} className="text-white/60 hover:text-white ml-2">✕</button>
            </div>
            <div className="bg-white px-5 py-4 space-y-3">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="flex items-center gap-1 bg-indigo-50 rounded-lg px-3 py-1.5 border border-indigo-100 font-medium text-indigo-700">🏙️ {bld?.name}</span>
                <span className="text-gray-300">›</span>
                <span className="flex items-center gap-1 bg-blue-50 rounded-lg px-3 py-1.5 border border-blue-100 font-medium text-blue-700">🏢 Flat {fl?.flatNumber}</span>
                <span className="text-gray-300">›</span>
                <span className="flex items-center gap-1 bg-violet-50 rounded-lg px-3 py-1.5 border border-violet-100 font-medium text-violet-700">🚪 {part?.partitionName}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {label:"Monthly Rent",    val:`AED ${fmtN(srchSel.monthlyRent)}`, color:"text-indigo-600"},
                  {label:"Stay Duration",   val:srchDur(srchSel.moveInDate),        color:"text-blue-600",   sub:`since ${srchSel.moveInDate}`},
                  {label:"Pending Balance", val:`AED ${fmtN(bal)}`,                 color:bal>0?"text-red-500":"text-emerald-500", sub:bal>0?"outstanding":"all clear"},
                  {label:"Room Size",       val:part?.partitionSize||"—",           color:"text-gray-700",   sub:"sq ft"},
                ].map(c=>(
                  <div key={c.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                    <p className="text-xs text-gray-400 mb-1">{c.label}</p>
                    <p className={`text-lg font-extrabold ${c.color}`}>{c.val}</p>
                    {c.sub && <p className="text-xs text-gray-400">{c.sub}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* KPI row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon="🏙️" label="Buildings"    value={buildings.length}  sub={`${flats.length} flats`}       grad="linear-gradient(135deg,#4f46e5,#7c3aed)" onClick={()=>onNav("buildings")}/>
        <KpiCard icon="👥" label="Residents"     value={activeRes.length}  sub={`${residents.filter(r=>r.status==="Vacated").length} vacated`} grad="linear-gradient(135deg,#0284c7,#0891b2)" onClick={()=>onNav("residents")}/>
        <KpiCard icon="🚪" label="Empty Slots"   value={emptySlots}        sub={`of ${totalSlots} total`}     grad="linear-gradient(135deg,#0f766e,#059669)" badge={emptySlots>0?"Available":"Full"} onClick={()=>onNav("flats")}/>
        <KpiCard icon="📊" label="Est. Rent"     value={`AED ${fmtN(estRent)}`} sub="monthly target"        grad="linear-gradient(135deg,#b45309,#d97706)"/>
        <KpiCard icon="💰" label="Net Profit"    value={`AED ${fmtN(Math.abs(net))}`} sub={net>=0?"profit":"loss"} grad={net>=0?"linear-gradient(135deg,#15803d,#16a34a)":"linear-gradient(135deg,#b91c1c,#dc2626)"}/>
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {icon:"✅",label:"Collected",   val:`AED ${fmtN(collected)}`, sub:`${colRate}% of target`,   pct:colRate,   bg:"linear-gradient(135deg,#ecfdf5,#d1fae5)", tc:"text-emerald-800", bc:"#10b981", pc:"bg-emerald-100 text-emerald-700"},
          {icon:"⏳",label:"Pending",     val:`AED ${fmtN(pending)}`,   sub:`${100-colRate}% outstanding`, pct:100-colRate, bg:"linear-gradient(135deg,#fffbeb,#fef3c7)", tc:"text-amber-800",   bc:"#f59e0b", pc:"bg-amber-100 text-amber-700"},
          {icon:"💸",label:"Expenses",    val:`AED ${fmtN(monExp)}`,    sub:"this month",              pct:collected>0?Math.min((monExp/collected)*100,100):0, bg:"linear-gradient(135deg,#fff1f2,#fee2e2)", tc:"text-red-800", bc:"#f87171", pc:"bg-red-100 text-red-700"},
        ].map(c=>(
          <div key={c.label} className="rounded-2xl p-5 border shadow-sm" style={{background:c.bg}}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-white/60">{c.icon}</div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.pc}`}>{c.label === "Collected" ? `${colRate}%` : c.label === "Pending" ? `${100-colRate}%` : monLabel}</span>
            </div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${c.tc} opacity-60`}>{c.label}</p>
            <p className={`text-2xl font-extrabold ${c.tc}`}>{c.val}</p>
            <div className="mt-2 rounded-full h-1.5 bg-black/10">
              <div className="h-1.5 rounded-full transition-all duration-700" style={{width:`${c.pct}%`,background:c.bc}}/>
            </div>
            <p className={`text-xs mt-1 ${c.tc} opacity-50`}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-extrabold text-gray-800 mb-1">Expense Breakdown</h3>
          <p className="text-xs text-gray-400 mb-4">{monLabel}</p>
          {expCat.length===0
            ? <div className="text-center py-10 text-gray-300"><p className="text-3xl mb-2">📭</p><p className="text-sm">No expenses</p></div>
            : <div className="space-y-4">
                {expCat.map(({name,value},i)=>{
                  const pct=monExp>0?Math.round((value/monExp)*100):0;
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-2 font-medium text-gray-700">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{background:CAT_CLR[i%CAT_CLR.length]}}/>{name}
                        </span>
                        <span className="text-xs font-bold text-gray-600">AED {fmtN(value)} <span className="text-gray-400">({pct}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{width:`${pct}%`,background:CAT_CLR[i%CAT_CLR.length]}}/>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-gray-100 flex justify-between text-sm">
                  <span className="text-gray-400">Total</span><span className="font-extrabold text-red-500">AED {fmtN(monExp)}</span>
                </div>
              </div>
          }
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-full mb-3">
            <h3 className="font-extrabold text-gray-800">Payment Status</h3>
            <p className="text-xs text-gray-400">{monLabel} · {payFilter?"click segment to deselect":"click to filter"}</p>
          </div>
          <DonutRing paid={paidC} partial={partC} unpaid={unpC} selected={payFilter} onSelect={setPayFilter}/>
          <div className="w-full mt-4 grid grid-cols-3 gap-2 text-center">
            {[["PAID","text-emerald-500","bg-emerald-50","Paid",paidC],["PARTIALLY_PAID","text-amber-500","bg-amber-50","Partial",partC],["UNPAID","text-red-400","bg-red-50","Unpaid",unpC]].map(([key,tc,bg,l,v])=>(
              <button key={l} onClick={()=>setPayFilter(payFilter===key?null:key)}
                className={`rounded-xl py-2 ${bg} transition-all ${payFilter===key?"ring-2 ring-offset-1 ring-gray-400":""}`}>
                <p className={`text-xl font-extrabold ${tc}`}>{v}</p><p className="text-xs text-gray-400">{l}</p>
              </button>
            ))}
          </div>
          {/* Resident detail list */}
          {payFilter && (()=>{
            const filtered = monPay.filter(p=>p.paymentStatus===payFilter);
            const labelMap = {PAID:"Fully Paid", PARTIALLY_PAID:"Partially Paid", UNPAID:"Unpaid"};
            const colorMap = {PAID:"text-emerald-600", PARTIALLY_PAID:"text-amber-600", UNPAID:"text-red-500"};
            return (
              <div className="w-full mt-4 border-t border-gray-100 pt-4">
                <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${colorMap[payFilter]}`}>{labelMap[payFilter]} — {filtered.length} resident{filtered.length!==1?"s":""}</p>
                {filtered.length===0
                  ? <p className="text-xs text-gray-400 text-center py-3">No records</p>
                  : <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {filtered.map(p=>{
                        const res=residents.find(r=>r.id===p.residentId);
                        const part=partitions.find(x=>x.id===res?.partitionId);
                        const fl=flats.find(x=>x.id===part?.flatId);
                        const bld=buildings.find(x=>x.id===fl?.buildingId);
                        const bal=p.totalRent-p.paidAmount;
                        return (
                          <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{background:"linear-gradient(135deg,#6366f1,#a855f7)"}}>
                              {res?.fullName?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{res?.fullName}</p>
                              <p className="text-xs text-gray-400 truncate">{bld?.name} › {fl?.flatNumber} › {part?.partitionName}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-bold text-emerald-600">AED {fmtN(p.paidAmount)}</p>
                              {bal>0 && <p className="text-xs text-red-400">−{fmtN(bal)} due</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                }
              </div>
            );
          })()}
        </div>
      </div>

      {/* Revenue Overview + Flat Performance side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-extrabold text-gray-800 mb-1">Revenue Overview</h3>
          <p className="text-xs text-gray-400 mb-4">Last 3 months</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={chartData} barGap={3} barCategoryGap="28%">
              <defs>
                {[["cg","#6366f1","#818cf8"],["eg","#f87171","#fca5a5"],["ng","#10b981","#34d399"]].map(([id,c1,c2])=>(
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c1}/><stop offset="100%" stopColor={c2}/></linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:"#9ca3af"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:"#9ca3af"}} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k`}/>
              <Tooltip formatter={v=>`AED ${fmtN(v)}`} contentStyle={{borderRadius:14,border:"none",boxShadow:"0 8px 30px rgba(0,0,0,0.12)",fontSize:12}}/>
              <Bar dataKey="Collected" fill="url(#cg)" radius={[6,6,0,0]}/>
              <Bar dataKey="Expenses"  fill="url(#eg)" radius={[6,6,0,0]}/>
              <Bar dataKey="Net"       fill="url(#ng)" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center text-xs text-gray-400">
            {[["#6366f1","Collected"],["#f87171","Expenses"],["#10b981","Net"]].map(([c,l])=>(
              <span key={l} className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{background:c}}/>{l}</span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="font-extrabold text-gray-800">Flat Performance</h3>
            <p className="text-xs text-gray-400 mt-0.5">Occupancy & collection per flat · {monLabel}</p>
          </div>
          {flats.length===0 ? <Empty msg="No flats added yet."/> :
            <div className="divide-y divide-gray-50">
              {flats.map(fl=>{
                const b=buildings.find(x=>x.id===fl.buildingId);
                const parts=partitions.filter(p=>p.flatId===fl.id);
                const ts=parts.reduce((s,p)=>s+p.maxResidents,0);
                const ar=residents.filter(r=>r.status==="Active"&&parts.some(p=>p.id===r.partitionId));
                const occ=ts>0?Math.round((ar.length/ts)*100):0;
                const rIds=ar.map(r=>r.id);
                const col=rentPayments.filter(r=>r.month===mon&&rIds.includes(r.residentId)).reduce((s,r)=>s+r.paidAmount,0);
                const est=parts.reduce((s,p)=>s+p.monthlyRent,0);
                const cp=est>0?Math.round((col/est)*100):0;
                const occColor=occ>=80?"#10b981":occ>=50?"#f59e0b":"#f87171";
                return (
                  <div key={fl.id} className="px-6 py-4 hover:bg-gray-50/60 transition-colors">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0" style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>{fl.flatNumber.slice(0,2)}</div>
                      <div className="w-28 flex-shrink-0"><p className="font-bold text-gray-800 text-sm">{fl.flatNumber}</p><p className="text-xs text-indigo-400">{b?.name}</p></div>
                      <div className="flex-1 min-w-28">
                        <div className="flex justify-between text-xs mb-1"><span className="text-gray-400">Occupancy</span><span className="font-bold" style={{color:occColor}}>{occ}%</span></div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{width:`${occ}%`,background:occColor}}/></div>
                        <p className="text-xs text-gray-400 mt-0.5">{ar.length}/{ts} residents</p>
                      </div>
                      <div className="flex-1 min-w-28">
                        <div className="flex justify-between text-xs mb-1"><span className="text-gray-400">Collection</span><span className="font-bold text-indigo-500">{cp}%</span></div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-indigo-400" style={{width:`${cp}%`}}/></div>
                        <p className="text-xs text-gray-400 mt-0.5">AED {fmtN(col)} / {fmtN(est)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          }
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div><h3 className="font-extrabold text-gray-800">Recent Payments</h3><p className="text-xs text-gray-400">{monLabel}</p></div>
          <span className="text-xs bg-indigo-50 text-indigo-600 font-bold px-3 py-1 rounded-full">{monPay.length} records</span>
        </div>
        {monPay.length===0 ? <Empty msg="No payments this month."/> :
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/60 border-b border-gray-50"><tr>
                {["Resident","Flat/Room","Total","Paid","Balance","Status"].map(h=><Th key={h} c={h}/>)}
              </tr></thead>
              <tbody>
                {monPay.map(p=>{
                  const res=residents.find(r=>r.id===p.residentId);
                  const part=partitions.find(x=>x.id===res?.partitionId);
                  const fl=flats.find(x=>x.id===part?.flatId);
                  const bal=p.totalRent-p.paidAmount;
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors">
                      <Td className="font-medium" c={
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0" style={{background:"linear-gradient(135deg,#6366f1,#a855f7)"}}>{res?.fullName?.charAt(0)}</div>
                          {res?.fullName}
                        </div>
                      }/>
                      <Td c={<span><span className="text-gray-400 text-xs">{fl?.flatNumber} › </span>{part?.partitionName}</span>}/>
                      <Td c={`AED ${fmtN(p.totalRent)}`}/>
                      <Td c={<span className="font-extrabold text-emerald-600">AED {fmtN(p.paidAmount)}</span>}/>
                      <Td c={<span className={bal>0?"font-semibold text-red-500":"text-gray-300"}>AED {fmtN(bal)}</span>}/>
                      <Td c={<Badge v={p.paymentStatus}/>}/>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        }
      </div>

    </div>
  );
}

/* ── BUILDINGS PAGE ── */
const BGRADS = ["linear-gradient(135deg,#1e3a8a,#3b82f6)","linear-gradient(135deg,#064e3b,#10b981)","linear-gradient(135deg,#4c1d95,#8b5cf6)","linear-gradient(135deg,#7c2d12,#f97316)","linear-gradient(135deg,#0c4a6e,#06b6d4)","linear-gradient(135deg,#1f2937,#6b7280)"];

function BuildingCard({building, index, flats, partitions, residents, expenses, rentPayments, onEdit, onDelete}) {
  const mon=nowMonth();
  const bFlats=flats.filter(f=>f.buildingId===building.id);
  const bFlatIds=bFlats.map(f=>f.id);
  const bParts=partitions.filter(p=>bFlatIds.includes(p.flatId));
  const bRes=residents.filter(r=>bParts.some(p=>p.id===r.partitionId)&&r.status==="Active");
  const est=bParts.reduce((s,p)=>s+p.monthlyRent,0);
  const col=rentPayments.filter(r=>r.month===mon&&bRes.some(x=>x.id===r.residentId)).reduce((s,r)=>s+r.paidAmount,0);
  const exp=expenses.filter(e=>e.expenseDate.slice(0,7)===mon&&bFlatIds.includes(e.flatId)).reduce((s,e)=>s+e.amount,0);
  const ts=bParts.reduce((s,p)=>s+p.maxResidents,0);
  const occ=ts>0?Math.round((bRes.length/ts)*100):0;
  const grad=BGRADS[index%BGRADS.length];
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
      <div className="relative h-28 flex items-end p-5" style={{background:grad}}>
        <div className="absolute inset-0 flex items-center justify-end pr-6 opacity-10 text-8xl select-none">🏢</div>
        <div><h3 className="text-white font-extrabold text-xl">{building.name}</h3><p className="text-white/70 text-xs">📍 {building.address}</p></div>
        <div className="absolute top-3 right-3 flex gap-1">
          <button onClick={()=>onEdit(building)} className="bg-white/20 hover:bg-white/40 text-white rounded-lg px-2 py-1 text-xs">✏️</button>
          <button onClick={()=>onDelete(building.id)} className="bg-white/20 hover:bg-red-500 text-white rounded-lg px-2 py-1 text-xs">🗑️</button>
        </div>
      </div>
      <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
        {[["Flats",bFlats.length,"text-indigo-600"],["Rooms",bParts.length,"text-blue-600"],["Residents",bRes.length,"text-emerald-600"],["Occupancy",`${occ}%`,occ>=80?"text-emerald-600":"text-amber-500"]].map(([l,v,c])=>(
          <div key={l} className="py-3 text-center"><p className={`text-lg font-extrabold ${c}`}>{v}</p><p className="text-xs text-gray-400">{l}</p></div>
        ))}
      </div>
      <div className="px-5 py-4 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-gray-400">Est. Rent</span><span className="font-bold text-gray-700">AED {fmtN(est)}</span></div>
        <div>
          <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">Collected ({mon})</span><span className="font-bold text-emerald-600">AED {fmtN(col)}</span></div>
          <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-emerald-400 transition-all" style={{width:`${est>0?Math.min((col/est)*100,100):0}%`}}/></div>
        </div>
        <div className="flex justify-between text-sm"><span className="text-gray-400">Expenses ({mon})</span><span className="font-semibold text-red-400">AED {fmtN(exp)}</span></div>
        {building.notes && <p className="text-xs text-gray-400 italic border-t border-gray-50 pt-2">{building.notes}</p>}
      </div>
    </div>
  );
}

function BuildingsPage({buildings, flats, partitions, residents, expenses, rentPayments, onAdd, onEdit, onDelete}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-800">🏙️ Buildings</h2><p className="text-sm text-gray-400">{buildings.length} properties</p></div>
        <button onClick={onAdd} className={btnCls("bg-indigo-600 hover:bg-indigo-700 text-white")}>+ Add Building</button>
      </div>
      {buildings.length===0
        ? <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center text-gray-400">
            <p className="text-5xl mb-3">🏗️</p><p className="font-semibold text-gray-500 text-lg">No buildings yet</p><p className="text-sm mt-1">Click "+ Add Building" to get started</p>
          </div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildings.map((b,i)=><BuildingCard key={b.id} building={b} index={i} flats={flats} partitions={partitions} residents={residents} expenses={expenses} rentPayments={rentPayments} onEdit={onEdit} onDelete={onDelete}/>)}
          </div>
      }
    </div>
  );
}

/* ── FLATS PAGE ── */
function FlatsPage({buildings, flats, partitions, residents, onAdd, onEdit, onDelete, onView}) {
  const [bFilter, setBFilter] = useState("all");
  const filtered = bFilter==="all" ? flats : flats.filter(f=>f.buildingId===bFilter);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Flats</h2>
        <button onClick={onAdd} className={btnCls("bg-indigo-600 hover:bg-indigo-700 text-white")}>+ Add Flat</button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={()=>setBFilter("all")} className={btnCls(bFilter==="all"?"bg-indigo-600 text-white":"bg-gray-100 text-gray-600")}>All</button>
        {buildings.map(b=><button key={b.id} onClick={()=>setBFilter(b.id)} className={btnCls(bFilter===b.id?"bg-indigo-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200")}>{b.name}</button>)}
      </div>
      {filtered.length===0 ? <Empty msg="No flats found."/> :
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(fl=>{
            const bld=buildings.find(b=>b.id===fl.buildingId);
            const parts=partitions.filter(p=>p.flatId===fl.id);
            const ar=residents.filter(r=>r.status==="Active"&&parts.some(p=>p.id===r.partitionId));
            const est=parts.reduce((s,p)=>s+p.monthlyRent,0);
            return (
              <div key={fl.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div><h3 className="font-bold text-gray-800 text-lg">Flat {fl.flatNumber}</h3><p className="text-xs text-indigo-500 font-medium">{bld?.name}</p><p className="text-xs text-gray-400">{fl.flatSize} sq ft</p></div>
                  <div className="flex gap-1">
                    <button onClick={()=>onEdit(fl)} className="text-gray-400 hover:text-indigo-600 p-1">✏️</button>
                    <button onClick={()=>onDelete(fl.id)} className="text-gray-400 hover:text-red-500 p-1">🗑️</button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center my-3">
                  {[["bg-indigo-50 text-indigo-600",parts.length,"Rooms"],["bg-blue-50 text-blue-600",ar.length,"Residents"],["bg-emerald-50 text-emerald-600",fmtN(est),"Est.Rent"]].map(([c,v,l])=>(
                    <div key={l} className={`rounded-xl p-2 ${c.split(" ")[0]}`}><p className={`font-bold text-sm ${c.split(" ")[1]}`}>{v}</p><p className="text-xs text-gray-400">{l}</p></div>
                  ))}
                </div>
                <button onClick={()=>onView(fl)} className="w-full text-sm text-indigo-600 hover:text-indigo-800 font-medium py-2 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">View Details →</button>
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}

/* ── FLAT DETAIL ── */
function FlatDetail({flat, buildings, partitions, residents, expenses, rentPayments, onEditPartition, onDeletePartition, onAddPartition, onAddResident, onEditResident, onDeleteResident, onAddExpense, onDeleteExpense, onBack}) {
  const [tab, setTab] = useState("partitions");
  const parts=partitions.filter(p=>p.flatId===flat.id);
  const partIds=parts.map(p=>p.id);
  const flatRes=residents.filter(r=>partIds.includes(r.partitionId));
  const flatExp=expenses.filter(e=>e.flatId===flat.id);
  const bld=buildings.find(b=>b.id===flat.buildingId);
  const tCls=t=>`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab===t?"bg-indigo-600 text-white":"text-gray-500 hover:bg-gray-100"}`;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700">← Back</button>
        <div><h2 className="text-2xl font-bold text-gray-800">Flat {flat.flatNumber}</h2><p className="text-xs text-indigo-500 font-medium">{bld?.name} · {flat.flatSize} sq ft</p></div>
      </div>
      <div className="flex gap-2">{["partitions","residents","expenses"].map(t=><button key={t} onClick={()=>setTab(t)} className={tCls(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>)}</div>
      {tab==="partitions" && (
        <div className="space-y-3">
          <div className="flex justify-end"><button onClick={onAddPartition} className={btnCls("bg-indigo-600 hover:bg-indigo-700 text-white")}>+ Add Partition</button></div>
          {parts.length===0 ? <Empty msg="No partitions yet."/> :
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-gray-100 bg-gray-50"><tr>{["Name","Size","Monthly Rent","Max","Occupied","Actions"].map(h=><Th key={h} c={h}/>)}</tr></thead>
                <tbody>
                  {parts.map(p=>{
                    const occ=flatRes.filter(r=>r.partitionId===p.id&&r.status==="Active").length;
                    return (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <Td c={<span className="font-medium text-gray-800">{p.partitionName}</span>}/>
                        <Td c={`${p.partitionSize} sq ft`}/>
                        <Td c={<span className="font-semibold text-indigo-600">AED {fmtN(p.monthlyRent)}</span>}/>
                        <Td c={p.maxResidents}/>
                        <Td c={<span className={occ>=p.maxResidents?"text-red-500":"text-emerald-600"}>{occ}/{p.maxResidents}</span>}/>
                        <Td c={<><button onClick={()=>onEditPartition(p)} className="text-indigo-500 hover:text-indigo-700 mr-2 text-sm">Edit</button><button onClick={()=>onDeletePartition(p.id)} className="text-red-400 hover:text-red-600 text-sm">Del</button></>}/>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          }
        </div>
      )}
      {tab==="residents" && (
        <div className="space-y-3">
          <div className="flex justify-end"><button onClick={onAddResident} className={btnCls("bg-indigo-600 hover:bg-indigo-700 text-white")}>+ Add Resident</button></div>
          {flatRes.length===0 ? <Empty msg="No residents."/> :
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-gray-100 bg-gray-50"><tr>{["Name","Room","Phone","Move-in","Status","Actions"].map(h=><Th key={h} c={h}/>)}</tr></thead>
                <tbody>
                  {flatRes.map(r=>{
                    const p=parts.find(x=>x.id===r.partitionId);
                    return (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <Td c={<span className="font-medium text-gray-800">{r.fullName}</span>}/>
                        <Td c={p?.partitionName}/><Td c={r.phone}/><Td c={r.moveInDate}/>
                        <Td c={<Badge v={r.status}/>}/>
                        <Td c={<><button onClick={()=>onEditResident(r)} className="text-indigo-500 mr-2 text-sm">Edit</button><button onClick={()=>onDeleteResident(r.id)} className="text-red-400 text-sm">Del</button></>}/>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          }
        </div>
      )}
      {tab==="expenses" && (
        <div className="space-y-3">
          <div className="flex justify-end"><button onClick={onAddExpense} className={btnCls("bg-indigo-600 hover:bg-indigo-700 text-white")}>+ Add Expense</button></div>
          {flatExp.length===0 ? <Empty msg="No expenses."/> :
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-gray-100 bg-gray-50"><tr>{["Category","Amount","Date","Notes","Actions"].map(h=><Th key={h} c={h}/>)}</tr></thead>
                <tbody>
                  {flatExp.sort((a,b)=>b.expenseDate.localeCompare(a.expenseDate)).map(e=>(
                    <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <Td c={<span className="font-medium">{e.title}</span>}/>
                      <Td c={<span className="text-red-500 font-semibold">AED {fmtN(e.amount)}</span>}/>
                      <Td c={e.expenseDate}/><Td c={e.notes||"—"}/>
                      <Td c={<button onClick={()=>onDeleteExpense(e.id)} className="text-red-400 text-sm">Del</button>}/>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </div>
      )}
    </div>
  );
}

/* ── RESIDENTS PAGE ── */
function ResidentsPage({residents, partitions, flats, buildings, onAdd, onEdit, onDelete}) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const filtered=residents.filter(r=>(filter==="All"||r.status===filter)&&r.fullName.toLowerCase().includes(search.toLowerCase()));
  const info=r=>{const p=partitions.find(x=>x.id===r.partitionId),fl=flats.find(x=>x.id===p?.flatId),b=buildings.find(x=>x.id===fl?.buildingId);return{p,fl,b};};
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">All Residents</h2>
        <button onClick={onAdd} className={btnCls("bg-indigo-600 hover:bg-indigo-700 text-white")}>+ Add Resident</button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <input className={`${inp} max-w-xs`} placeholder="Search name…" value={search} onChange={e=>setSearch(e.target.value)}/>
        {["All","Active","Vacated"].map(s=><button key={s} onClick={()=>setFilter(s)} className={btnCls(filter===s?"bg-indigo-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200")}>{s}</button>)}
      </div>
      {filtered.length===0 ? <Empty msg="No residents found."/> :
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50"><tr>{["Name","Building","Flat/Room","Phone","Move-in","Status","Actions"].map(h=><Th key={h} c={h}/>)}</tr></thead>
            <tbody>
              {filtered.map(r=>{
                const {p,fl,b}=info(r);
                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <Td c={<div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{background:"linear-gradient(135deg,#6366f1,#a855f7)"}}>{r.fullName.charAt(0)}</div><span className="font-medium text-gray-800">{r.fullName}</span></div>}/>
                    <Td c={<span className="text-indigo-500 text-xs font-medium">{b?.name}</span>}/>
                    <Td c={<span><span className="text-gray-400">{fl?.flatNumber} › </span>{p?.partitionName}</span>}/>
                    <Td c={r.phone}/><Td c={r.moveInDate}/>
                    <Td c={<Badge v={r.status}/>}/>
                    <Td c={<><button onClick={()=>onEdit(r)} className="text-indigo-500 mr-2 text-sm">Edit</button><button onClick={()=>onDelete(r.id)} className="text-red-400 text-sm">Del</button></>}/>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}

/* ── RENT PAGE ── */
function RentPage({rentPayments, residents, partitions, flats, buildings, onAdd, onEdit, onDelete}) {
  const [mon, setMon] = useState(nowMonth());
  const monPay=rentPayments.filter(r=>r.month===mon);
  const totCol=monPay.reduce((s,r)=>s+r.paidAmount,0);
  const totPend=monPay.reduce((s,r)=>s+Math.max(r.totalRent-r.paidAmount,0),0);
  const info=p=>{const res=residents.find(r=>r.id===p.residentId),part=partitions.find(x=>x.id===res?.partitionId),fl=flats.find(x=>x.id===part?.flatId),b=buildings.find(x=>x.id===fl?.buildingId);return{res,part,fl,b};};
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Rent Payments</h2>
        <div className="flex gap-3 items-center">
          <input className={`${inp} w-36`} type="month" value={mon} onChange={e=>setMon(e.target.value)}/>
          <button onClick={onAdd} className={btnCls("bg-indigo-600 hover:bg-indigo-700 text-white")}>+ Record Payment</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard icon="✅" label="Collected This Month" value={`AED ${fmtN(totCol)}`}  sub={`${monPay.filter(p=>p.paymentStatus==="PAID").length} fully paid`}     grad="linear-gradient(135deg,#064e3b,#059669)" badge="Received"/>
        <KpiCard icon="⏳" label="Pending Balance"    value={`AED ${fmtN(totPend)}`} sub={`${monPay.filter(p=>p.paymentStatus==="UNPAID").length} unpaid records`}  grad="linear-gradient(135deg,#78350f,#d97706)" badge="Outstanding"/>
        <KpiCard icon="📋" label="Total Records"      value={monPay.length}           sub={`${monPay.filter(p=>p.paymentStatus==="PARTIALLY_PAID").length} partial payments`} grad="linear-gradient(135deg,#1e1b4b,#4f46e5)" badge={mon}/>
      </div>
      {monPay.length===0 ? <Empty msg={`No payments for ${mon}.`}/> :
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50"><tr>{["Resident","Building","Flat/Room","Total","Paid","Balance","Date","Status","Actions"].map(h=><Th key={h} c={h}/>)}</tr></thead>
            <tbody>
              {monPay.map(p=>{
                const {res,part,fl,b}=info(p);
                const bal=p.totalRent-p.paidAmount;
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <Td c={<span className="font-medium">{res?.fullName}</span>}/>
                    <Td c={<span className="text-indigo-500 text-xs font-medium">{b?.name}</span>}/>
                    <Td c={<span><span className="text-gray-400">{fl?.flatNumber} › </span>{part?.partitionName}</span>}/>
                    <Td c={`AED ${fmtN(p.totalRent)}`}/>
                    <Td c={<span className="font-bold text-emerald-600">AED {fmtN(p.paidAmount)}</span>}/>
                    <Td c={<span className={bal>0?"text-red-500 font-semibold":"text-gray-400"}>AED {fmtN(bal)}</span>}/>
                    <Td c={p.paymentDate||"—"}/>
                    <Td c={<Badge v={p.paymentStatus}/>}/>
                    <Td c={<><button onClick={()=>onEdit(p)} className="text-indigo-500 mr-2 text-sm">Edit</button><button onClick={()=>onDelete(p.id)} className="text-red-400 text-sm">Del</button></>}/>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}

/* ── EXPENSES PAGE ── */
function ExpensesPage({expenses, flats, buildings, onAdd, onDelete}) {
  const [mon, setMon] = useState(nowMonth());
  const [ff, setFf] = useState("all");
  const filtered=expenses.filter(e=>e.expenseDate.slice(0,7)===mon&&(ff==="all"||e.flatId===ff));
  const total=filtered.reduce((s,e)=>s+e.amount,0);
  const byCat=filtered.reduce((acc,e)=>{acc[e.title]=(acc[e.title]||0)+e.amount;return acc;},{});
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Expenses</h2>
        <div className="flex gap-3 items-center flex-wrap">
          <input className={`${inp} w-36`} type="month" value={mon} onChange={e=>setMon(e.target.value)}/>
          <select className={`${inp} w-52`} value={ff} onChange={e=>setFf(e.target.value)}>
            <option value="all">All Flats</option>
            {flats.map(f=>{const b=buildings.find(x=>x.id===f.buildingId);return <option key={f.id} value={f.id}>{b?.name} › {f.flatNumber}</option>;})}
          </select>
          <button onClick={onAdd} className={btnCls("bg-indigo-600 hover:bg-indigo-700 text-white")}>+ Add Expense</button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total Expenses</p>
          <p className="text-3xl font-bold text-red-500 mt-1">AED {fmtN(total)}</p>
          <p className="text-xs text-gray-400 mt-1">{mon} · {filtered.length} records</p>
        </div>
        {Object.entries(byCat).map(([cat,amt])=>(
          <div key={cat} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400">{cat}</p><p className="text-xl font-bold text-gray-700 mt-1">AED {fmtN(amt)}</p>
          </div>
        ))}
      </div>
      {filtered.length===0 ? <Empty msg="No expenses for selected period."/> :
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50"><tr>{["Category","Building","Flat","Amount","Date","Notes","Actions"].map(h=><Th key={h} c={h}/>)}</tr></thead>
            <tbody>
              {filtered.sort((a,b)=>b.expenseDate.localeCompare(a.expenseDate)).map(e=>{
                const fl=flats.find(f=>f.id===e.flatId),b=buildings.find(x=>x.id===fl?.buildingId);
                return (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <Td c={<span className="font-medium">{e.title}</span>}/>
                    <Td c={<span className="text-indigo-500 text-xs font-medium">{b?.name}</span>}/>
                    <Td c={fl?.flatNumber}/>
                    <Td c={<span className="text-red-500 font-semibold">AED {fmtN(e.amount)}</span>}/>
                    <Td c={e.expenseDate}/><Td c={e.notes||"—"}/>
                    <Td c={<button onClick={()=>onDelete(e.id)} className="text-red-400 text-sm">Del</button>}/>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}

/* ── MAIN APP ── */
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [selFlat, setSelFlat] = useState(null);
  const [buildings,     setBuildings]     = useState([]);
  const [flats,         setFlats]         = useState([]);
  const [partitions,    setPartitions]    = useState([]);
  const [residents,     setResidents]     = useState([]);
  const [rentPayments,  setRentPayments]  = useState([]);
  const [expenses,      setExpenses]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [modal,         setModal]         = useState(null);
  const [confirm,       setConfirm]       = useState(null);
  const [sideOpen,      setSideOpen]      = useState(false);

  useEffect(()=>{
    (async()=>{
      try {
        const s=await window.storage.get("rmv3");
        if(s){const d=JSON.parse(s.value);setBuildings(d.buildings||SEED.buildings);setFlats(d.flats||SEED.flats);setPartitions(d.partitions||SEED.partitions);setResidents(d.residents||SEED.residents);setRentPayments(d.rentPayments||SEED.rentPayments);setExpenses(d.expenses||SEED.expenses);}
        else{setBuildings(SEED.buildings);setFlats(SEED.flats);setPartitions(SEED.partitions);setResidents(SEED.residents);setRentPayments(SEED.rentPayments);setExpenses(SEED.expenses);}
      } catch {setBuildings(SEED.buildings);setFlats(SEED.flats);setPartitions(SEED.partitions);setResidents(SEED.residents);setRentPayments(SEED.rentPayments);setExpenses(SEED.expenses);}
      setLoading(false);
    })();
  },[]);

  const persist = upd => {
    const d={buildings:upd.buildings??buildings,flats:upd.flats??flats,partitions:upd.partitions??partitions,residents:upd.residents??residents,rentPayments:upd.rentPayments??rentPayments,expenses:upd.expenses??expenses};
    window.storage.set("rmv3",JSON.stringify(d)).catch(()=>{});
  };
  const close = () => setModal(null);

  const saveBuilding = d => {
    const entry = d.id ? d : {...d, id:uid()};
    const nxt = d.id ? buildings.map(b=>b.id===d.id?entry:b) : [...buildings,entry];
    setBuildings(nxt); persist({buildings:nxt}); close();
  };
  const deleteBuilding = id => {
    const fIds=flats.filter(f=>f.buildingId===id).map(f=>f.id);
    const pIds=partitions.filter(p=>fIds.includes(p.flatId)).map(p=>p.id);
    const rIds=residents.filter(r=>pIds.includes(r.partitionId)).map(r=>r.id);
    const nb=buildings.filter(b=>b.id!==id),nf=flats.filter(f=>f.buildingId!==id),np=partitions.filter(p=>!fIds.includes(p.flatId)),nr=residents.filter(r=>!pIds.includes(r.partitionId)),nrp=rentPayments.filter(r=>!rIds.includes(r.residentId)),ne=expenses.filter(e=>!fIds.includes(e.flatId));
    setBuildings(nb);setFlats(nf);setPartitions(np);setResidents(nr);setRentPayments(nrp);setExpenses(ne);
    persist({buildings:nb,flats:nf,partitions:np,residents:nr,rentPayments:nrp,expenses:ne});
  };
  const saveFlat = d => {
    const entry=d.id?d:{...d,id:uid()};
    const nxt=d.id?flats.map(f=>f.id===d.id?entry:f):[...flats,entry];
    setFlats(nxt);persist({flats:nxt});close();
  };
  const deleteFlat = id => {
    const pIds=partitions.filter(p=>p.flatId===id).map(p=>p.id);
    const rIds=residents.filter(r=>pIds.includes(r.partitionId)).map(r=>r.id);
    const nf=flats.filter(f=>f.id!==id),np=partitions.filter(p=>p.flatId!==id),nr=residents.filter(r=>!pIds.includes(r.partitionId)),nrp=rentPayments.filter(r=>!rIds.includes(r.residentId)),ne=expenses.filter(e=>e.flatId!==id);
    setFlats(nf);setPartitions(np);setResidents(nr);setRentPayments(nrp);setExpenses(ne);
    persist({flats:nf,partitions:np,residents:nr,rentPayments:nrp,expenses:ne});
    if(selFlat?.id===id){setSelFlat(null);setPage("flats");}
  };
  const savePartition = d => {
    const entry=d.id?d:{...d,id:uid()};
    const nxt=d.id?partitions.map(p=>p.id===d.id?entry:p):[...partitions,entry];
    setPartitions(nxt);persist({partitions:nxt});close();
  };
  const deletePartition = id => {
    const rIds=residents.filter(r=>r.partitionId===id).map(r=>r.id);
    const np=partitions.filter(p=>p.id!==id),nr=residents.filter(r=>r.partitionId!==id),nrp=rentPayments.filter(r=>!rIds.includes(r.residentId));
    setPartitions(np);setResidents(nr);setRentPayments(nrp);persist({partitions:np,residents:nr,rentPayments:nrp});
  };
  const saveResident = d => {
    const entry=d.id?d:{...d,id:uid()};
    const nxt=d.id?residents.map(r=>r.id===d.id?entry:r):[...residents,entry];
    setResidents(nxt);persist({residents:nxt});close();
  };
  const deleteResident = id => {
    const nr=residents.filter(r=>r.id!==id),nrp=rentPayments.filter(r=>r.residentId!==id);
    setResidents(nr);setRentPayments(nrp);persist({residents:nr,rentPayments:nrp});
  };
  const savePayment = d => {
    const entry=d.id?d:{...d,id:uid()};
    const nxt=d.id?rentPayments.map(r=>r.id===d.id?entry:r):[...rentPayments,entry];
    setRentPayments(nxt);persist({rentPayments:nxt});close();
  };
  const deletePayment = id => { const nxt=rentPayments.filter(r=>r.id!==id);setRentPayments(nxt);persist({rentPayments:nxt}); };
  const saveExpense = d => { const nxt=[...expenses,{...d,id:uid()}];setExpenses(nxt);persist({expenses:nxt});close(); };
  const deleteExpense = id => { const nxt=expenses.filter(e=>e.id!==id);setExpenses(nxt);persist({expenses:nxt}); };

  const nav = p => { setPage(p); setSelFlat(null); setSideOpen(false); };
  const NAV = [
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"buildings",icon:"🏙️",label:"Buildings"},
    {id:"flats",    icon:"🏢",label:"Flats"},
    {id:"residents",icon:"👥",label:"Residents"},
    {id:"rent",     icon:"💳",label:"Rent Payments"},
    {id:"expenses", icon:"💸",label:"Expenses"},
  ];
  const isActive = p => page===p||(page==="flatDetail"&&p==="flats");
  const activeRes = residents.filter(r=>r.status==="Active");

  if(loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400 text-lg">Loading…</div></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
      {sideOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={()=>setSideOpen(false)}/>}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-60 bg-white border-r border-gray-100 shadow-sm z-50 flex flex-col transition-transform duration-200 ${sideOpen?"translate-x-0":"-translate-x-full lg:translate-x-0"}`}>
        <div className="px-5 py-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <div><p className="font-bold text-gray-800 text-sm">RentManage</p><p className="text-xs text-gray-400">Property Manager</p></div>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>nav(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(n.id)?"bg-indigo-600 text-white shadow-sm":"text-gray-600 hover:bg-gray-100"}`}>
              <span>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">{buildings.length} Buildings · {activeRes.length} Active</p>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={()=>setSideOpen(true)} className="text-gray-500 text-xl">☰</button>
          <span className="font-semibold text-gray-800">RentManage</span>
        </div>
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {page==="dashboard" && <Dashboard buildings={buildings} flats={flats} partitions={partitions} residents={residents} rentPayments={rentPayments} expenses={expenses} onNav={nav}/>}
          {page==="buildings" && <BuildingsPage buildings={buildings} flats={flats} partitions={partitions} residents={residents} expenses={expenses} rentPayments={rentPayments} onAdd={()=>setModal({type:"building"})} onEdit={b=>setModal({type:"building",data:b})} onDelete={id=>setConfirm({msg:"Delete this building and all its data?",action:()=>deleteBuilding(id)})}/>}
          {page==="flats" && <FlatsPage buildings={buildings} flats={flats} partitions={partitions} residents={residents} onAdd={()=>setModal({type:"flat"})} onEdit={fl=>setModal({type:"flat",data:fl})} onDelete={id=>setConfirm({msg:"Delete this flat?",action:()=>deleteFlat(id)})} onView={fl=>{setSelFlat(fl);setPage("flatDetail");}}/>}
          {page==="flatDetail" && selFlat && (
            <FlatDetail
              flat={selFlat} buildings={buildings}
              partitions={partitions.filter(p=>p.flatId===selFlat.id)}
              residents={residents} expenses={expenses} rentPayments={rentPayments}
              onBack={()=>{setPage("flats");setSelFlat(null);}}
              onAddPartition={()=>setModal({type:"partition",data:{flatId:selFlat.id}})}
              onEditPartition={p=>setModal({type:"partition",data:p})}
              onDeletePartition={id=>setConfirm({msg:"Delete this partition?",action:()=>deletePartition(id)})}
              onAddResident={()=>setModal({type:"resident",data:{partitionId:partitions.find(p=>p.flatId===selFlat.id)?.id}})}
              onEditResident={r=>setModal({type:"resident",data:r})}
              onDeleteResident={id=>setConfirm({msg:"Delete this resident?",action:()=>deleteResident(id)})}
              onAddExpense={()=>setModal({type:"expense",data:{flatId:selFlat.id}})}
              onDeleteExpense={id=>setConfirm({msg:"Delete this expense?",action:()=>deleteExpense(id)})}
            />
          )}
          {page==="residents" && <ResidentsPage residents={residents} partitions={partitions} flats={flats} buildings={buildings} onAdd={()=>setModal({type:"resident"})} onEdit={r=>setModal({type:"resident",data:r})} onDelete={id=>setConfirm({msg:"Delete this resident?",action:()=>deleteResident(id)})}/>}
          {page==="rent"      && <RentPage rentPayments={rentPayments} residents={residents} partitions={partitions} flats={flats} buildings={buildings} onAdd={()=>setModal({type:"payment"})} onEdit={p=>setModal({type:"payment",data:p})} onDelete={id=>setConfirm({msg:"Delete this payment?",action:()=>deletePayment(id)})}/>}
          {page==="expenses"  && <ExpensesPage expenses={expenses} flats={flats} buildings={buildings} onAdd={()=>setModal({type:"expense"})} onDelete={id=>setConfirm({msg:"Delete this expense?",action:()=>deleteExpense(id)})}/>}
        </div>
      </main>

      {modal?.type==="building"  && <Modal title={modal.data?.id?"Edit Building":"Add Building"}   onClose={close}><BuildingForm   key={modal.data?.id||"new"} init={modal.data} onSave={saveBuilding} onClose={close}/></Modal>}
      {modal?.type==="flat"      && <Modal title={modal.data?.id?"Edit Flat":"Add Flat"}            onClose={close}><FlatForm       key={modal.data?.id||"new"} init={modal.data} buildings={buildings} onSave={saveFlat} onClose={close}/></Modal>}
      {modal?.type==="partition" && <Modal title={modal.data?.id?"Edit Partition":"Add Partition"}  onClose={close}><PartitionForm  key={modal.data?.id||"new"} init={modal.data} flats={flats} buildings={buildings} onSave={savePartition} onClose={close}/></Modal>}
      {modal?.type==="resident"  && <Modal title={modal.data?.id?"Edit Resident":"Add Resident"}    onClose={close} wide><ResidentForm key={modal.data?.id||"new"} init={modal.data} partitions={partitions} flats={flats} buildings={buildings} residents={residents} onSave={saveResident} onClose={close}/></Modal>}
      {modal?.type==="payment"   && <Modal title={modal.data?.id?"Edit Payment":"Record Payment"}   onClose={close} wide><PaymentForm  key={modal.data?.id||"new"} init={modal.data} residents={residents} partitions={partitions} flats={flats} buildings={buildings} onSave={savePayment} onClose={close}/></Modal>}
      {modal?.type==="expense"   && <Modal title="Add Expense" onClose={close}><ExpenseForm key="new" init={modal.data} flats={flats} buildings={buildings} onSave={saveExpense} onClose={close}/></Modal>}
      {confirm && <Confirm msg={confirm.msg} onYes={()=>{confirm.action();setConfirm(null);}} onNo={()=>setConfirm(null)}/>}
    </div>
  );
}
