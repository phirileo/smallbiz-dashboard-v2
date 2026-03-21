import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { 
  LayoutDashboard, Users, LogOut, Plus, TrendingUp, 
  DollarSign, Calendar, Tag, Briefcase, Activity, 
  CreditCard, Lock, Mail, ArrowUpRight, ArrowDownRight, Sun, Moon, Settings, Camera, Trash2, Palette, UserPlus 
} from "lucide-react";

// --- CHART ENGINE ---
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

// --- AUTHENTICATION SCREEN ---
const AuthScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleAuth = async (type) => {
    try {
      if (type === "login") await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) { alert(err.message); }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9' }}>
      <div style={{ backgroundColor: 'white', padding: 40, borderRadius: 24, textAlign: 'center', width: 350, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <div style={{marginBottom: 20}}><TrendingUp size={48} color="#3b82f6"/></div>
        <h2 style={{margin: '0 0 10px 0', color: '#1e293b'}}>SmallBiz Pro</h2>
        <p style={{color: '#64748b', fontSize: 13, marginBottom: 20}}>Enterprise Financial Management</p>
        <input type="email" placeholder="Email" style={authInput} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" style={authInput} onChange={e => setPassword(e.target.value)} />
        <button onClick={() => handleAuth("login")} style={authBtn}>Sign In</button>
        <button onClick={() => handleAuth("signup")} style={{background: 'none', border: 'none', color: '#3b82f6', marginTop: 15, cursor: 'pointer', fontSize: 12}}>Create New Admin Account</button>
      </div>
    </div>
  );
};

const authInput = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' };
const authBtn = { width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currency, setCurrency] = useState("ZMW");

  // --- STAFF INPUT STATES ---
  const [sName, setSName] = useState("");
  const [sRole, setSRole] = useState("");
  const [sSalary, setSSalary] = useState("");

  const [bizInfo, setBizInfo] = useState({ 
    name: "SmallBiz Pro", 
    tagline: "Your Business, Simplified", 
    logo: "",
    themeColor: "#3b82f6" 
  });

  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Sale");
  const currencyMap = { ZMW: "K", USD: "$", GBP: "£" };

  const colors = {
    bg: darkMode ? "#0f172a" : "#f8fafc",
    sidebar: darkMode ? "#020617" : "#0f172a",
    card: darkMode ? "#1e293b" : "#ffffff",
    text: darkMode ? "#f8fafc" : "#1e293b",
    subtext: darkMode ? "#94a3b8" : "#64748b",
    border: darkMode ? "#334155" : "#e2e8f0",
    accent: bizInfo.themeColor || "#3b82f6" 
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => { 
      setUser(u); 
      if (u) {
        const docRef = doc(db, "settings", "profile");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setBizInfo(docSnap.data());
      }
      setLoading(false); 
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const qT = query(collection(db, "transactions"), orderBy("date", "asc"));
    const unsubT = onSnapshot(qT, (s) => setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubE = onSnapshot(query(collection(db, "employees")), (s) => setEmployees(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubT(); unsubE(); };
  }, [user]);

  const saveBizProfile = async () => {
    await setDoc(doc(db, "settings", "profile"), bizInfo);
    alert("Profile & Theme Updated!");
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!item || !amount) return;
    await addDoc(collection(db, "transactions"), { item, amount: parseFloat(amount), type, date: new Date().toISOString() });
    setItem(""); setAmount("");
  };

  // --- STAFF HANDLERS ---
  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!sName || !sSalary) return;
    await addDoc(collection(db, "employees"), { name: sName, role: sRole, salary: parseFloat(sSalary), dateJoined: new Date().toISOString() });
    setSName(""); setSRole(""); setSSalary("");
  };

  const deleteStaff = async (id) => {
    if (window.confirm("Remove this employee?")) await deleteDoc(doc(db, "employees", id));
  };

  if (loading) return <div style={center}><h3>Initializing...</h3></div>;
  if (!user) return <AuthScreen />;

  const today = new Date().toLocaleDateString();
  const totalSales = transactions.filter(t => t.type === "Sale").reduce((a, b) => a + (b.amount || 0), 0);
  const totalExpenses = transactions.filter(t => t.type === "Expense").reduce((a, b) => a + (b.amount || 0), 0);
  const totalPayroll = employees.reduce((a, b) => a + (b.salary || 0), 0);
  const netProfit = totalSales - totalExpenses;
  const dailySales = transactions.filter(t => t.type === "Sale" && new Date(t.date).toLocaleDateString() === today).reduce((a, b) => a + (b.amount || 0), 0);

  const lineData = {
    labels: transactions.map(t => new Date(t.date).toLocaleDateString()),
    datasets: [{ 
      label: 'Cash Flow', 
      data: transactions.map((_, i) => {
        const sub = transactions.slice(0, i + 1);
        return sub.filter(x => x.type === "Sale").reduce((a, b) => a + b.amount, 0) - sub.filter(x => x.type === "Expense").reduce((a, b) => a + b.amount, 0);
      }), 
      borderColor: colors.accent, fill: true, backgroundColor: `${colors.accent}15`, tension: 0.4 
    }]
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, transition: "0.3s", fontFamily: 'Inter, sans-serif' }}>
      
      <aside style={{ width: 280, backgroundColor: colors.sidebar, color: "white", display: "flex", flexDirection: "column", padding: "30px 20px" }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {bizInfo.logo ? (
            <img src={bizInfo.logo} alt="logo" style={{ width: 60, height: 60, borderRadius: 12, marginBottom: 15, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: colors.accent, margin: '0 auto 15px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={30} color="white"/>
            </div>
          )}
          <h3 style={{ margin: 0, fontSize: 18 }}>{bizInfo.name}</h3>
          <p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>{bizInfo.tagline}</p>
        </div>
        
        <nav style={{flex: 1}}>
          <div onClick={() => setPage("dashboard")} style={page === "dashboard" ? { ...navItem, color: "white", backgroundColor: colors.accent } : navItem}><LayoutDashboard size={18}/> Dashboard</div>
          <div onClick={() => setPage("employees")} style={page === "employees" ? { ...navItem, color: "white", backgroundColor: colors.accent } : navItem}><Users size={18}/> Staff & Payroll</div>
          <div onClick={() => setPage("settings")} style={page === "settings" ? { ...navItem, color: "white", backgroundColor: colors.accent } : navItem}><Settings size={18}/> Company Profile</div>
          
          <div onClick={() => setDarkMode(!darkMode)} style={{...navItem, marginTop: 20}}>
            {darkMode ? <Sun size={18} color="#fbbf24"/> : <Moon size={18} color="#94a3b8"/>}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </div>
        </nav>

        <button onClick={() => signOut(auth)} style={btnLogout}><LogOut size={16}/> Logout</button>
      </aside>

      <main style={{ flex: 1, padding: "40px 60px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 35 }}>
          <h1 style={{fontSize: 26, fontWeight: 800}}>{page === "dashboard" ? "Executive Summary" : page === "employees" ? "Staffing & Payroll" : "Settings"}</h1>
          <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ padding: "10px 15px", borderRadius: 10, border: `1px solid ${colors.border}`, backgroundColor: colors.card, color: colors.text, fontWeight: 'bold' }}>
            <option value="ZMW">ZMW (K)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </header>

        {page === "dashboard" && (
          <>
            <div style={grid4}>
              <div style={{ ...metricCard, backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
                <div style={cardHead}><span style={{color: colors.subtext, fontSize: 11, fontWeight: 700}}>TOTAL REVENUE</span><ArrowUpRight color="#10b981" size={18}/></div>
                <h2 style={{margin: 0, fontSize: 26}}>{currencyMap[currency]}{totalSales.toLocaleString()}</h2>
              </div>
              <div style={{ ...metricCard, backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
                <div style={cardHead}><span style={{color: colors.subtext, fontSize: 11, fontWeight: 700}}>PAYROLL BURDEN</span><Users color={colors.accent} size={18}/></div>
                <h2 style={{margin: 0, fontSize: 26}}>{currencyMap[currency]}{totalPayroll.toLocaleString()}</h2>
              </div>
              <div style={{ ...metricCard, backgroundColor: colors.accent, color: "white" }}>
                <div style={cardHead}><span style={{fontSize: 11, fontWeight: 700}}>NET PROFIT</span><TrendingUp color="white" size={18}/></div>
                <h2 style={{margin: 0, fontSize: 26}}>{currencyMap[currency]}{netProfit.toLocaleString()}</h2>
              </div>
              <div style={{ ...metricCard, backgroundColor: darkMode ? "#422006" : "#fef9c3", border: darkMode ? "1px solid #713f12" : "1px solid #fde047" }}>
                <div style={cardHead}><span style={{color: darkMode ? "#fbbf24" : "#854d0e", fontSize: 11, fontWeight: 700}}>DAILY SALES</span><Activity color={darkMode ? "#fbbf24" : "#854d0e"} size={18}/></div>
                <h2 style={{margin: 0, fontSize: 26, color: darkMode ? "#fbbf24" : "#854d0e"}}>{currencyMap[currency]}{dailySales.toLocaleString()}</h2>
              </div>
            </div>

            <div style={{ ...whiteCard, backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
              <h3 style={{marginBottom: 20}}>Profitability Trend</h3>
              <div style={{height: 250}}><Line data={lineData} options={{maintainAspectRatio: false}} /></div>
            </div>

            <section style={{ ...actionBar, backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
                <div style={{...inputGroup, border: `1px solid ${colors.border}`}}><Tag size={16} color={colors.subtext}/><input value={item} onChange={e => setItem(e.target.value)} placeholder="What was sold/bought?" style={{...inputStyle, backgroundColor: "transparent", color: colors.text}}/></div>
                <div style={{...inputGroup, border: `1px solid ${colors.border}`}}><DollarSign size={16} color={colors.subtext}/><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" style={{...inputStyle, backgroundColor: "transparent", color: colors.text}}/></div>
                <select value={type} onChange={e => setType(e.target.value)} style={{background: 'none', border: 'none', color: colors.text, fontWeight: 'bold'}}><option value="Sale">Sale</option><option value="Expense">Expense</option></select>
                <button onClick={handlePost} style={{...btnSubmit, backgroundColor: colors.accent}}><Plus size={18}/> Post</button>
            </section>
          </>
        )}

        {page === "employees" && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 30 }}>
            {/* Staff Table */}
            <div style={{ ...whiteCard, backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
              <h3 style={{marginBottom: 20}}>Employee Directory</h3>
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{textAlign: 'left', borderBottom: `1px solid ${colors.border}`}}>
                      <th style={{padding: '12px', color: colors.subtext, fontSize: 11}}>NAME</th>
                      <th style={{padding: '12px', color: colors.subtext, fontSize: 11}}>ROLE</th>
                      <th style={{padding: '12px', color: colors.subtext, fontSize: 11}}>SALARY</th>
                      <th style={{padding: '12px', color: colors.subtext, fontSize: 11}}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => (
                      <tr key={emp.id} style={{borderBottom: `1px solid ${colors.border}`}}>
                        <td style={{padding: '12px', fontWeight: 600}}>{emp.name}</td>
                        <td style={{padding: '12px'}}>{emp.role}</td>
                        <td style={{padding: '12px'}}>{currencyMap[currency]}{emp.salary.toLocaleString()}</td>
                        <td style={{padding: '12px'}}><Trash2 size={16} color="#ef4444" style={{cursor: 'pointer'}} onClick={() => deleteStaff(emp.id)}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Staff Form */}
            <div style={{ ...whiteCard, backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
              <h3 style={{marginBottom: 20}}>Add Personnel</h3>
              <div style={{marginBottom: 15}}><label style={labelStyle}>Full Name</label><input style={{...authInput, backgroundColor: 'transparent', color: colors.text}} value={sName} onChange={e => setSName(e.target.value)} placeholder="John Doe" /></div>
              <div style={{marginBottom: 15}}><label style={labelStyle}>Designation</label><input style={{...authInput, backgroundColor: 'transparent', color: colors.text}} value={sRole} onChange={e => setSRole(e.target.value)} placeholder="Manager" /></div>
              <div style={{marginBottom: 20}}><label style={labelStyle}>Monthly Salary</label><input type="number" style={{...authInput, backgroundColor: 'transparent', color: colors.text}} value={sSalary} onChange={e => setSSalary(e.target.value)} placeholder="0.00" /></div>
              <button onClick={handleAddStaff} style={{...btnSubmit, backgroundColor: colors.accent, width: '100%', justifyContent: 'center'}}><UserPlus size={18}/> Add Employee</button>
              
              <div style={{marginTop: 30, padding: 20, borderRadius: 15, backgroundColor: `${colors.accent}15`, textAlign: 'center'}}>
                 <span style={labelStyle}>Total Monthly Commitment</span>
                 <h2 style={{margin: 0, color: colors.accent}}>{currencyMap[currency]}{totalPayroll.toLocaleString()}</h2>
              </div>
            </div>
          </div>
        )}

        {page === "settings" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
            <div style={{ ...whiteCard, backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
               <h3 style={{marginBottom: 25}}>Company Identity</h3>
               <div style={{marginBottom: 20}}><label style={labelStyle}>Business Name</label><input style={{...authInput, backgroundColor: 'transparent', color: colors.text}} value={bizInfo.name} onChange={e => setBizInfo({...bizInfo, name: e.target.value})} /></div>
               <div style={{marginBottom: 20}}><label style={labelStyle}>Motto</label><input style={{...authInput, backgroundColor: 'transparent', color: colors.text}} value={bizInfo.tagline} onChange={e => setBizInfo({...bizInfo, tagline: e.target.value})} /></div>
               
               <div style={{marginBottom: 20}}>
                 <label style={labelStyle}>Brand Theme Color</label>
                 <div style={{display:'flex', gap: 10, alignItems:'center'}}>
                    <input type="color" value={bizInfo.themeColor} onChange={e => setBizInfo({...bizInfo, themeColor: e.target.value})} style={{width: 50, height: 40, border:'none', cursor:'pointer', background:'none'}} />
                    <span style={{fontSize: 12, color: colors.subtext}}>{bizInfo.themeColor}</span>
                 </div>
               </div>

               <div style={{marginBottom: 20}}><label style={labelStyle}>Logo URL</label><input style={{...authInput, backgroundColor: 'transparent', color: colors.text}} value={bizInfo.logo} onChange={e => setBizInfo({...bizInfo, logo: e.target.value})} /></div>
               <button onClick={saveBizProfile} style={{...authBtn, backgroundColor: colors.accent, width: 'auto', padding: '10px 30px'}}>Save Profile</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const navItem = { display: "flex", alignItems: "center", gap: 12, padding: "12px 15px", color: "#94a3b8", cursor: "pointer", borderRadius: 8, fontSize: 14, marginBottom: 5 };
const grid4 = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" };
const metricCard = { padding: "25px", borderRadius: "20px" };
const whiteCard = { padding: "30px", borderRadius: "24px", marginBottom: "20px" };
const cardHead = { display: 'flex', justifyContent: 'space-between', marginBottom: 10 };
const actionBar = { padding: 20, borderRadius: 24, display: "flex", gap: 15, alignItems: "center", marginTop: 20 };
const inputGroup = { display: "flex", alignItems: "center", gap: 10, padding: "12px 15px", borderRadius: 14, flex: 1 };
const inputStyle = { border: "none", outline: "none", width: "100%", fontSize: 14 };
const btnSubmit = { color: "white", border: "none", padding: "12px 25px", borderRadius: 12, fontWeight: 700, cursor: "pointer", display:'flex', alignItems:'center', gap: 5 };
const btnLogout = { marginTop: "auto", padding: 12, backgroundColor: "#1e293b", border: "none", color: "white", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 };
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' };
const center = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' };