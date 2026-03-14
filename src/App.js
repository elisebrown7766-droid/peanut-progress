import { useState, useRef, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

const FONT_LINK = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');`;

const THEME = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Inter', sans-serif;
  background: #faf9f8;
  color: #1a1a1a;
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="%231a1a1a"/></svg>') 12 12, auto;
}
:root {
  --bg: #faf9f8;
  --bg2: #ffffff;
  --bg3: #f0eeec;
  --surface: #ffffff;
  --surface-hover: #f9f9f9;
  --border: #eaeaea;
  --border-strong: #d0d0d0;
  --text: #1a1a1a;
  --text-2: #6b6b6b;
  --text-3: #9e9e9e;
  --ellie: #d4a398;
  --ellie-dim: rgba(212,163,152,0.12);
  --ellie-glow: rgba(212,163,152,0.25);
  --martin: #8ba3ab;
  --martin-dim: rgba(139,163,171,0.12);
  --martin-glow: rgba(139,163,171,0.25);
  --radius: 12px;
}
input, textarea, select {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
}
button, a, input[type="checkbox"] { 
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 1L14.59 9.41L23 12L14.59 14.59L12 23L9.41 14.59L1 12L9.41 9.41L12 1Z" fill="%23d4a398"/></svg>') 12 12, pointer !important; 
  font-family: 'Inter', sans-serif; 
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
button:active {
  transform: scale(0.97);
}
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #d0d0d0; border-radius: 4px; }

/* Subtle interactions replace glassmorphism */
.glass {
  background: #ffffff;
  border: 1px solid var(--border);
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.glass:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.06);
}
.glass-strong {
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}
.fu0 { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
.fu1 { animation: fadeUp 0.5s 0.08s cubic-bezier(0.16, 1, 0.3, 1) both; }
.fu2 { animation: fadeUp 0.5s 0.16s cubic-bezier(0.16, 1, 0.3, 1) both; }
.fu3 { animation: fadeUp 0.5s 0.24s cubic-bezier(0.16, 1, 0.3, 1) both; }
.fu4 { animation: fadeUp 0.5s 0.32s cubic-bezier(0.16, 1, 0.3, 1) both; }

/* Desktop layout */
@media (min-width: 900px) {
  .desktop-shell { max-width: 100% !important; }
  .desktop-header { max-width: 100% !important; padding: 16px 40px 12px !important; }
  .desktop-header-inner { max-width: 1200px; margin: 0 auto; }
  .desktop-cols { display: grid !important; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 1200px; margin: 0 auto; padding: 20px 40px !important; }
  .desktop-week { max-width: 900px; margin: 0 auto; padding: 20px 40px !important; }
  .mobile-user-switcher { display: none !important; }
  .desktop-col-label { display: block !important; }
}
@media (max-width: 899px) {
  .desktop-col-label { display: none !important; }
}
`;

const DEFAULT_GOALS = {
  ellie: { calories: 1800, protein: 120, fat: 60, carbs: 200, fiber: 25, sugar: 40, water: 8 },
  martin: { calories: 2400, protein: 160, fat: 80, carbs: 280, fiber: 30, sugar: 50, water: 10 },
};
const EXERCISES = ["Running","Walking","Cycling","Swimming","Weight Training","HIIT","Yoga","Pilates","Boxing","Rock Climbing","Other"];
const todayKey = () => new Date().toISOString().split("T")[0];
const fmtDate = d => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
const addDays = (d, n) => { const dt = new Date(d + "T12:00:00"); dt.setDate(dt.getDate() + n); return dt.toISOString().split("T")[0]; };
const EMPTY_DAY = () => ({ meals: [], water: 0, workouts: [], weight: null });

const firebaseConfig = {
  apiKey: "AIzaSyAabofKnw7IygBDqvX3kAp0_KRZj7ohfW0",
  authDomain: "peanut-progress-e88fa.firebaseapp.com",
  projectId: "peanut-progress-e88fa",
  storageBucket: "peanut-progress-e88fa.firebasestorage.app",
  messagingSenderId: "730032937757",
  appId: "1:730032937757:web:01bf7a05fffb26c1cd9ff4",
  measurementId: "G-VTMGH4E6Q9"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const useStorage = () => {
  const [data, setData] = useState(() => window._ppData || { ellie: {}, martin: {}, goals: DEFAULT_GOALS });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "sync", "v1"), (d) => {
      if (d.exists()) {
        const cloudData = d.data();
        window._ppData = cloudData;
        setData(cloudData);
      } else {
        const initData = { ellie: {}, martin: {}, goals: DEFAULT_GOALS };
        setDoc(doc(db, "sync", "v1"), initData);
        window._ppData = initData;
        setData(initData);
      }
    });
    return () => unsub();
  }, []);

  const save = next => { 
    window._ppData = next; 
    setData(next); 
    setDoc(doc(db, "sync", "v1"), next).catch(e => console.error("Firebase Sync Error:", e));
  };
  
  const getDay = (user, date) => data[user]?.[date] || EMPTY_DAY();
  const setDay = (user, date, day) => save({ ...data, [user]: { ...data[user], [date]: day } });
  const getGoals = user => data.goals?.[user] || DEFAULT_GOALS[user];
  const setGoals = (user, goals) => save({ ...data, goals: { ...data.goals, [user]: goals } });
  return { data, getDay, setDay, getGoals, setGoals };
};

async function analyzeFood(input, isImage = false) {
  const key = process.env.REACT_APP_GEMINI_API_KEY;
  console.log("API Key loaded:", key ? "Yes (length " + key.length + ")" : "No");
  if (!key) { throw new Error("No API key found in .env"); }
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + key;
  
  console.log("Fetching exact URL:", url.replace(key, "[HIDDEN]"));
  
  const body = isImage
    ? { contents: [{ parts: [{ inline_data: { mime_type: input.type, data: input.data } }, { text: "Analyse this food. Return ONLY JSON: { mealName, calories, protein, carbs, fat, fiber, sugar } all numbers, no markdown." }] }] }
    : { contents: [{ parts: [{ text: "Analyse this meal: " + input + ". Return ONLY JSON: { mealName, calories, protein, carbs, fat, fiber, sugar } all numbers, no markdown." }] }] };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini API Error:", errText);
    throw new Error(`API Error ${res.status}: Check your API key or quota.`);
  }
  const json = await res.json();
  console.log("Gemini response:", JSON.stringify(json));
  
  if (!json.candidates || !json.candidates[0] || !json.candidates[0].content || !json.candidates[0].content.parts || !json.candidates[0].content.parts[0]) {
       console.error("Unexpected Gemini response structure:", json);
       throw new Error("Received unexpected response format from Gemini.");
  }

  const text = json.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
  try {
     return JSON.parse(text);
  } catch (e) {
     console.error("Failed to parse JSON from Gemini:", text);
     throw new Error("Gemini returned invalid data format.");
  }
}

// ─── MacroRing ────────────────────────────────────────────────────────────────
const MacroRing = ({ label, value, goal, color, size = 58 }) => {
  const pct = goal ? Math.min(value / goal, 1) : 0;
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth="3.5" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3.5"
            strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>{Math.round(value)}</span>
          <span style={{ fontSize: 8, color: "var(--text-3)", marginTop: 1 }}>{label === "Calories" ? "kcal" : "g"}</span>
        </div>
      </div>
      <span style={{ fontSize: 10, color: "var(--text-2)", fontWeight: 500 }}>{label}</span>
    </div>
  );
};

// ─── Bar ──────────────────────────────────────────────────────────────────────
const Bar = ({ label, value, goal, color, unit = "g" }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: "var(--text-2)" }}>{label}</span>
      <span style={{ color: "var(--text)", fontWeight: 600 }}>{Math.round(value)}<span style={{ color: "var(--text-3)", fontWeight: 400 }}>/{goal}{unit}</span></span>
    </div>
    <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: `${Math.min((value/goal)*100,100)}%`, height: "100%", background: `${color}`, borderRadius: 2, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
    </div>
  </div>
);

// ─── BarChart ─────────────────────────────────────────────────────────────────
const BarChart = ({ data, color, goal, label }) => {
  const max = Math.max(...data.map(d => d.value), goal || 1, 1);
  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 7 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 44 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%" }}>
            <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
              <div style={{
                width: "100%", borderRadius: "3px 3px 2px 2px",
                background: i === data.length-1 ? color : `${color}35`,
                height: `${(d.value/max)*100}%`, minHeight: d.value > 0 ? 2 : 0,
                transition: "height 0.5s ease",
                boxShadow: i === data.length-1 ? `0 0 6px ${color}66` : "none"
              }} />
            </div>
            <span style={{ fontSize: 8, color: "var(--text-3)" }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── LineChart ────────────────────────────────────────────────────────────────
const LineChart = ({ data, color }) => {
  const vals = data.map(d => d.value).filter(Boolean);
  if (vals.length < 2) return <div style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", padding: "20px 0" }}>Not enough data yet</div>;
  const min = Math.min(...vals) - 0.5, max = Math.max(...vals) + 0.5;
  const W = 280, H = 54;
  const x = i => (i / (data.length - 1)) * W;
  const y = v => v ? H - ((v - min) / (max - min)) * H : null;
  const pts = data.map((d, i) => ({ x: x(i), y: y(d.value), l: d.label }));
  const valid = pts.filter(p => p.y !== null);
  const path = valid.map((p, i) => `${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");
  const area = valid.length > 1 ? `M ${valid[0].x} ${H} L ${valid.map(p=>`${p.x} ${p.y}`).join(" L ")} L ${valid[valid.length-1].x} ${H} Z` : "";
  const gid = `g${color.replace(/[^a-z0-9]/gi,"")}`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {area && <path d={area} fill={`url(#${gid})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {valid.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />)}
    </svg>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ title, color, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(6px)" }}>
    <div className="glass-strong fu0" style={{ borderRadius: "24px 24px 0 0", padding: 24, width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: "-0.01em" }}>{title}</span>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 99, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ─── VoiceInput ───────────────────────────────────────────────────────────────
const VoiceInput = ({ onTranscription, color, variant = "default", isProcessing = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [supported, setSupported] = useState(true);
  
  const recognitionRef = useRef(null);
  const finalTextRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) setSupported(false);
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Voice input requires Safari (iPhone) or Chrome (Android).");
      return;
    }

    finalTextRef.current = "";
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US"; 
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsRecording(true);
      setLiveText("");
    };

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTextRef.current += t;
        } else {
          interim += t;
        }
      }
      setLiveText(interim || finalTextRef.current);
    };

    recognition.onend = () => {
      setIsRecording(false);
      const transcript = finalTextRef.current || liveText;
      if (transcript.trim()) {
        onTranscription(transcript.trim());
      }
      setLiveText("");
    };

    recognition.onerror = (event) => {
      setIsRecording(false);
      if (event.error !== "no-speech") {
        console.error("Voice error:", event.error);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [liveText, onTranscription]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  if (!supported) return null;

  if (variant === "compact") {
    return (
      <button type="button" onClick={isRecording ? stopRecording : (!isProcessing ? startRecording : undefined)}
        disabled={isProcessing}
        style={{
          padding: "5px 14px", borderRadius: 99, border: `1px solid ${isProcessing || isRecording ? color : "var(--border)"}`,
          background: isProcessing || isRecording ? `${color}18` : "var(--surface)",
          color: isProcessing || isRecording ? color : "var(--text-3)",
          fontWeight: 600, fontSize: 12, display: "flex", justifyContent: "center", alignItems: "center", gap: 6,
          transition: "all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)", opacity: isProcessing ? 0.7 : 1, cursor: isProcessing ? "wait" : "pointer"
        }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%", background: isProcessing || isRecording ? color : "var(--text-3)",
          animation: isRecording || isProcessing ? "pulse 1.5s infinite" : "none"
        }} />
        {isProcessing ? "Analyzing..." : isRecording ? "Listening..." : "Dictate"}
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
      <button type="button" onClick={isRecording ? stopRecording : startRecording}
        style={{
          width: "100%", padding: 13, borderRadius: 12, border: "1px solid var(--border)",
          background: isRecording ? "rgba(255,100,100,0.06)" : "rgba(255,255,255,0.04)",
          color: isRecording ? "#d94b4b" : "var(--text-2)",
          fontWeight: 600, fontSize: 14, display: "flex", justifyContent: "center", alignItems: "center", gap: 8,
          transition: "all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)"
        }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: isRecording ? "#d94b4b" : "var(--text-3)", animation: isRecording ? "pulse 1.5s infinite" : "none" }} />
        {isRecording ? "Listening... tap to stop" : "Tap to dictate"}
      </button>
      
      {liveText && (
        <div style={{ padding: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, color: "var(--text)", fontStyle: "italic", textAlign: "center" }}>
          "{liveText}"
        </div>
      )}
    </div>
  );
};

// ─── FoodModal ────────────────────────────────────────────────────────────────
const FoodModal = ({ onAdd, onClose, color }) => {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const analyse = async () => {
    setLoading(true); setError("");
    try { setResult(await analyzeFood(text.trim())); } catch (err) { setError(err.message || "Analysis failed — please try again"); }
    setLoading(false);
  };

  const handleImg = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      setPreview(ev.target.result); setLoading(true); setError("");
      try { setResult(await analyzeFood({ type: file.type, data: ev.target.result.split(",")[1] }, true)); } catch (err) { setError(err.message || "Couldn't analyse image"); }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const inp = { width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)", color: "var(--text)", outline: "none", fontSize: 14 };
  const btn = { width: "100%", padding: 13, borderRadius: 12, border: "none", background: color, color: "#fff", fontWeight: 700, fontSize: 15 };

  return (
    <Modal title="Log a Meal" color={color} onClose={onClose}>
      <div style={{ display: "flex", background: "var(--bg3)", borderRadius: 12, padding: 3, gap: 3, marginBottom: 18 }}>
        {["text","photo"].map(m => (
          <button key={m} onClick={() => { setMode(m); setResult(null); setPreview(null); }}
            style={{ flex: 1, padding: "7px", borderRadius: 9, border: "none", background: mode===m ? "#fff" : "transparent", color: mode===m ? "var(--text)" : "var(--text-2)", fontWeight: 600, fontSize: 13, boxShadow: mode===m ? "0 2px 8px rgba(0,0,0,0.04)" : "none", transition: "all 0.2s" }}>
            {m === "text" ? "Describe" : "Photo"}
          </button>
        ))}
      </div>
      {!result && mode === "text" && (
        <>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="e.g. 2 scrambled eggs, toast with butter, oat milk latte..."
            style={{ ...inp, minHeight: 80, resize: "none", marginBottom: 12 }} />
          <VoiceInput color={color} onTranscription={(t) => setText(prev => prev ? prev + " " + t : t)} />
          <button onClick={analyse} disabled={loading || !text.trim()} style={{ ...btn, opacity: loading || !text.trim() ? 0.45 : 1 }}>
            {loading ? "Analysing…" : "Analyse Nutrition"}
          </button>
        </>
      )}
      {!result && mode === "photo" && (
        <>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImg} />
          {preview
            ? <img src={preview} alt="" style={{ width: "100%", borderRadius: 12, marginBottom: 12, maxHeight: 220, objectFit: "cover" }} />
            : <div onClick={() => fileRef.current.click()} style={{ border: "1px dashed var(--border-strong)", borderRadius: 12, padding: 40, textAlign: "center", cursor: "pointer", color: "var(--text-3)", fontSize: 13, marginBottom: 12, background: "var(--bg)" }}>Tap to upload a photo of your plate</div>
          }
          {!preview && !loading && <button onClick={() => fileRef.current.click()} style={btn}>Choose Photo</button>}
          {loading && <div style={{ textAlign: "center", color: "var(--text-2)", fontSize: 13, padding: 12 }}>Analysing…</div>}
        </>
      )}
      {error && <div style={{ color: "#f08a6c", fontSize: 13, marginTop: 8 }}>{error}</div>}
      {result && (
        <div className="fu0">
          <div style={{ fontSize: 20, fontWeight: 700, color, marginBottom: 16 }}>{result.mealName}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
            {[["Calories",result.calories,"kcal"],["Protein",result.protein,"g"],["Carbs",result.carbs,"g"],["Fat",result.fat,"g"],["Fiber",result.fiber,"g"],["Sugar",result.sugar,"g"]].map(([l,v,u]) => (
              <div key={l} style={{ background: "var(--bg)", borderRadius: 12, padding: "12px 8px", textAlign: "center", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 20, fontWeight: 600, color }}>{Math.round(v)}<span style={{ fontSize: 10, fontWeight: 400, color: "var(--text-3)" }}>{u}</span></div>
                <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          <button onClick={() => { onAdd(result); onClose(); }} style={btn}>Add to Log ✓</button>
        </div>
      )}
    </Modal>
  );
};

// ─── WorkoutModal ─────────────────────────────────────────────────────────────
const WorkoutModal = ({ onAdd, onClose, color }) => {
  const [type, setType] = useState("Running");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");
  const inp = { width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)", color: "var(--text)", outline: "none", fontSize: 14 };
  const lbl = { fontSize: 11, color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 };
  return (
    <Modal title="Log Workout" color={color} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><div style={lbl}>Exercise</div><select value={type} onChange={e => setType(e.target.value)} style={inp}>{EXERCISES.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><div style={lbl}>Minutes</div><input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="30" style={inp} /></div>
          <div style={{ flex: 1 }}><div style={lbl}>Cals burned</div><input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="200" style={inp} /></div>
        </div>
        <div><div style={lbl}>Notes (optional)</div><input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Morning run in the park…" style={inp} /></div>
        <button onClick={() => { if (duration) { onAdd({ type, duration: Number(duration), calories: Number(calories)||0, notes }); onClose(); }}}
          style={{ padding: 13, borderRadius: 12, border: "none", background: color, color: "#fff", fontWeight: 700, fontSize: 15, marginTop: 4 }}>
          Save Workout
        </button>
      </div>
    </Modal>
  );
};

// ─── GoalsModal ───────────────────────────────────────────────────────────────
const GoalsModal = ({ goals, user, onSave, onClose }) => {
  const [g, setG] = useState({ ...goals });
  const color = user === "ellie" ? "var(--ellie)" : "var(--martin)";
  const fields = [["calories","Calories","kcal"],["protein","Protein","g"],["fat","Fat","g"],["carbs","Carbs","g"],["fiber","Fiber","g"],["sugar","Sugar","g"],["water","Water","glasses"]];
  return (
    <Modal title="Daily Goals" color={color} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {fields.map(([k,l,u]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ fontSize: 13, color: "var(--text-2)", width: 68 }}>{l}</label>
            <input type="number" value={g[k]} onChange={e => setG({ ...g, [k]: Number(e.target.value) })}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)", color: "var(--text)", outline: "none" }} />
            <span style={{ fontSize: 11, color: "var(--text-3)", width: 44 }}>{u}</span>
          </div>
        ))}
        <button onClick={() => { onSave(g); onClose(); }}
          style={{ marginTop: 8, padding: 13, borderRadius: 12, border: "none", background: color, color: "#fff", fontWeight: 700, fontSize: 15 }}>
          Save Goals
        </button>
      </div>
    </Modal>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = ({ user, date, storage, readOnly, compact }) => {
  const { getDay, setDay, getGoals } = storage;
  const day = getDay(user, date);
  const goals = getGoals(user);
  const color = user === "ellie" ? "var(--ellie)" : "var(--martin)";
  const [showFood, setShowFood] = useState(false);
  const [showWorkout, setShowWorkout] = useState(false);
  const [isQuickDictating, setIsQuickDictating] = useState(false);
  const [wval, setWval] = useState(day.weight || "");

  const handleQuickDictate = async (text) => {
    setIsQuickDictating(true);
    try {
      const result = await analyzeFood(text, false);
      setDay(user, date, { ...day, meals: [...day.meals, result] });
    } catch (e) {
      alert("Analysis failed. Try manually adding the food.");
    }
    setIsQuickDictating(false);
  };

  const totals = day.meals.reduce((a, m) => ({
    calories: a.calories + m.calories, protein: a.protein + m.protein,
    carbs: a.carbs + m.carbs, fat: a.fat + m.fat,
    fiber: a.fiber + m.fiber, sugar: a.sugar + m.sugar,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 });

  const lbl = txt => <div style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{txt}</div>;

  if (compact) return (
    <div className="glass" style={{ borderRadius: "var(--radius)", padding: 16, border: `1px solid ${color}22` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color, letterSpacing: "-0.01em" }}>{user === "ellie" ? "Ellie" : "Martin"}</span>
        {day.weight && <span style={{ fontSize: 12, color, background: "var(--surface)", border: `1px solid ${color}33`, padding: "3px 10px", borderRadius: 99, fontWeight: 600 }}>{day.weight} kg</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <Bar label="Calories" value={totals.calories} goal={goals.calories} color={color} unit="kcal" />
        <Bar label="Protein" value={totals.protein} goal={goals.protein} color={color} />
      </div>
      <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: day.meals.length ? 6 : 0 }}>{day.water} / {goals.water} glasses</div>
      {day.meals.length > 0 && <div style={{ fontSize: 12, color: "var(--text-3)" }}>{day.meals.map(m => m.mealName).join(" · ")}</div>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* Hero calorie card */}
      <div className="glass fu0" style={{ borderRadius: "var(--radius)", padding: 20, background: "var(--surface)", border: `1px solid ${color}20` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <svg width={88} height={88} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={44} cy={44} r={36} fill="none" stroke="var(--border)" strokeWidth="5" />
              <circle cx={44} cy={44} r={36} fill="none" stroke={color} strokeWidth="5"
                strokeDasharray={`${Math.min(totals.calories/goals.calories,1)*2*Math.PI*36} ${2*Math.PI*36}`}
                strokeLinecap="round" style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{Math.round(totals.calories)}</span>
              <span style={{ fontSize: 9, color: "var(--text-3)", marginTop: 1 }}>kcal</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color, marginBottom: 3, letterSpacing: "-0.01em" }}>{user === "ellie" ? "Ellie" : "Martin"}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>{Math.round(totals.calories)}<span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-3)" }}>/{goals.calories} kcal</span></div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
              {goals.calories - Math.round(totals.calories) > 0 ? `${goals.calories - Math.round(totals.calories)} kcal remaining` : "Goal reached!"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {[["Protein",totals.protein,goals.protein],["Carbs",totals.carbs,goals.carbs],["Fat",totals.fat,goals.fat],["Fiber",totals.fiber,goals.fiber],["Sugar",totals.sugar,goals.sugar]]
            .map(([l,v,g]) => <MacroRing key={l} label={l} value={v} goal={g} color={color} size={58} />)}
        </div>
      </div>

      {/* Meals */}
      <div className="glass fu1" style={{ borderRadius: "var(--radius)", padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
          {lbl("Meals")}
          <div style={{ display: "flex", gap: 8 }}>
            {!readOnly && <VoiceInput onTranscription={handleQuickDictate} color={color} variant="compact" isProcessing={isQuickDictating} />}
            {!readOnly && <button onClick={() => setShowFood(true)} style={{ padding: "5px 14px", borderRadius: 99, border: `1px solid ${color}`, background: `${color}18`, color, fontSize: 12, fontWeight: 700 }}>+ Add Food</button>}
          </div>
        </div>
        {day.meals.length === 0
          ? <div style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "12px 0" }}>No meals logged yet</div>
          : day.meals.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < day.meals.length-1 ? "1px solid var(--border)" : "none" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.mealName}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{Math.round(m.calories)} kcal · {Math.round(m.protein)}g P · {Math.round(m.carbs)}g C · {Math.round(m.fat)}g F</div>
              </div>
              {!readOnly && <button onClick={() => setDay(user, date, { ...day, meals: day.meals.filter((_,j)=>j!==i) })} style={{ background: "none", border: "none", color: "var(--text-3)", fontSize: 20, lineHeight: 1 }}>×</button>}
            </div>
          ))}
      </div>

      {/* Water + Weight */}
      <div className="fu2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="glass" style={{ borderRadius: "var(--radius)", padding: 16 }}>
          {lbl("Water")}
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--martin)", lineHeight: 1, marginBottom: 10 }}>
            {day.water}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-3)" }}>/{goals.water}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: readOnly ? 0 : 10 }}>
            {Array.from({ length: Math.min(goals.water, 10) }, (_, i) => (
              <div key={i} onClick={() => !readOnly && setDay(user, date, { ...day, water: i < day.water ? i : i+1 })}
                style={{ width: 16, height: 22, borderRadius: "3px 3px 4px 4px", border: `1px solid ${i < day.water ? "var(--martin)" : "var(--border)"}`, background: i < day.water ? "var(--martin-dim)" : "transparent", cursor: readOnly ? "default" : "pointer", transition: "all 0.15s" }} />
            ))}
          </div>
          {!readOnly && (
            <div style={{ display: "flex", gap: 4 }}>
              {[1,2,3].map(n => (
                <button key={n} onClick={() => setDay(user, date, { ...day, water: Math.min(day.water+n, goals.water) })}
                  style={{ flex: 1, padding: "4px 0", borderRadius: 8, border: "1px solid var(--martin)", background: "var(--martin-dim)", color: "var(--martin)", fontSize: 11, fontWeight: 700 }}>+{n}</button>
              ))}
            </div>
          )}
        </div>

        <div className="glass" style={{ borderRadius: "var(--radius)", padding: 16 }}>
          {lbl("Weight")}
          {day.weight ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color }}>{day.weight}</span>
              <span style={{ fontSize: 13, color: "var(--text-3)" }}>kg</span>
              {!readOnly && <button onClick={() => setDay(user, date, { ...day, weight: null })} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-3)", fontSize: 12 }}>edit</button>}
            </div>
          ) : !readOnly ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input type="number" step="0.1" value={wval} onChange={e => setWval(e.target.value)} placeholder="65.4"
                style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "rgba(255,255,255,0.04)", color: "var(--text)", outline: "none", fontSize: 16, fontWeight: 700, width: "100%" }} />
              <button onClick={() => { const w = parseFloat(wval); if (!isNaN(w)) setDay(user, date, { ...day, weight: w }); }}
                style={{ padding: "8px", borderRadius: 10, border: "none", background: color, color: "#fff", fontWeight: 700, fontSize: 13 }}>Save</button>
            </div>
          ) : <div style={{ fontSize: 13, color: "var(--text-3)" }}>Not logged</div>}
        </div>
      </div>

      {/* Workouts */}
      <div className="glass fu3" style={{ borderRadius: "var(--radius)", padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          {lbl("Workouts")}
          {!readOnly && <button onClick={() => setShowWorkout(true)} style={{ padding: "5px 14px", borderRadius: 99, border: `1px solid ${color}`, background: `${color}18`, color, fontSize: 12, fontWeight: 700 }}>+ Add</button>}
        </div>
        {day.workouts.length === 0
          ? <div style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "8px 0" }}>No workouts logged</div>
          : day.workouts.map((w, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: i < day.workouts.length-1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{w.type}</span>
                <span style={{ fontSize: 12, color: "var(--text-2)" }}>{w.duration} min · {w.calories} kcal</span>
              </div>
              {w.notes && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{w.notes}</div>}
            </div>
          ))}
      </div>

      {showFood && <FoodModal onAdd={m => setDay(user, date, { ...day, meals: [...day.meals, m] })} onClose={() => setShowFood(false)} color={color} />}
      {showWorkout && <WorkoutModal onAdd={w => setDay(user, date, { ...day, workouts: [...day.workouts, w] })} onClose={() => setShowWorkout(false)} color={color} />}
    </div>
  );
};

// ─── WeeklyView ───────────────────────────────────────────────────────────────
const WeeklyView = ({ user, storage }) => {
  const { getDay, getGoals } = storage;
  const color = user === "ellie" ? "var(--ellie)" : "var(--martin)";
  const goals = getGoals(user);
  const today = todayKey();
  const days7 = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const dayLbls = days7.map(d => ["S","M","T","W","T","F","S"][new Date(d+"T12:00:00").getDay()]);
  const macro = key => days7.map((d, i) => ({ label: dayLbls[i], value: key === "water" ? getDay(user,d).water : getDay(user,d).meals.reduce((s,m) => s+(m[key]||0), 0) }));
  const weights = days7.map((d, i) => ({ label: dayLbls[i], value: getDay(user,d).weight }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="glass fu0" style={{ borderRadius: "var(--radius)", padding: 18 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color, marginBottom: 18 }}>7-Day Overview</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <BarChart data={macro("calories")} color={color} goal={goals.calories} label="Calories" />
          <BarChart data={macro("protein")} color={color} goal={goals.protein} label="Protein" />
          <BarChart data={macro("carbs")} color={color} goal={goals.carbs} label="Carbs" />
          <BarChart data={macro("fat")} color={color} goal={goals.fat} label="Fat" />
          <BarChart data={macro("fiber")} color={color} goal={goals.fiber} label="Fiber" />
          <BarChart data={macro("water")} color="var(--martin)" goal={goals.water} label="Water" />
        </div>
      </div>
      <div className="glass fu1" style={{ borderRadius: "var(--radius)", padding: 18 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color, marginBottom: 14 }}>Weight Trend</div>
        <LineChart data={weights} color={color} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          {weights.map((w, i) => <span key={i} style={{ fontSize: 9, color: "var(--text-3)", flex: 1, textAlign: "center" }}>{w.label}</span>)}
        </div>
      </div>
    </div>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const storage = useStorage();
  const [user, setUser] = useState("ellie");
  const [date, setDate] = useState(todayKey());
  const [tab, setTab] = useState("today");
  const [showGoals, setShowGoals] = useState(false);

  const isToday = date === todayKey();


  return (
    <>
      <style>{FONT_LINK + THEME}</style>
      <div className="desktop-shell" style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "var(--bg)" }}>

        {/* Sticky header */}
        <div className="glass-strong desktop-header" style={{ position: "sticky", top: 0, zIndex: 50, padding: "12px 16px 10px", borderBottom: "1px solid var(--border)" }}>
          <div className="desktop-header-inner">
            {/* Logo + date nav */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <button onClick={() => setDate(addDays(date,-1))} style={{ width: 32, height: 32, borderRadius: 99, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>Peanut Progress</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, fontWeight: 500 }}>
                  {isToday ? "Today" : fmtDate(date)}
                  {!isToday && <span style={{ marginLeft: 6, background: "var(--bg3)", color: "var(--text-2)", fontSize: 10, padding: "2px 8px", borderRadius: 99 }}>view only</span>}
                </div>
              </div>
              <button onClick={() => !isToday && setDate(addDays(date,1))} style={{ width: 32, height: 32, borderRadius: 99, border: "1px solid var(--border)", background: "var(--surface)", color: isToday ? "var(--text-3)" : "var(--text-2)", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
            </div>

            {/* Mobile user switcher — hidden on desktop */}
            <div className="mobile-user-switcher" style={{ display: "flex", background: "var(--bg3)", borderRadius: 12, padding: 3, gap: 3, marginBottom: 10 }}>
              {[["ellie","Ellie"],["martin","Martin"]].map(([u, label]) => (
                <button key={u} onClick={() => setUser(u)}
                  style={{ flex: 1, padding: "7px 0", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 13, transition: "all 0.2s",
                    background: user===u ? (u==="ellie" ? "var(--ellie-dim)" : "var(--martin-dim)") : "transparent",
                    color: user===u ? (u==="ellie" ? "var(--ellie)" : "var(--martin)") : "var(--text-3)" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Tabs + Goals */}
            <div style={{ display: "flex", gap: 6 }}>
              {[["today","Today"],["week","This Week"]].map(([t,label]) => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ flex: 1, padding: "7px 0", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600, transition: "all 0.2s",
                    background: tab===t ? "var(--text)" : "var(--bg3)",
                    color: tab===t ? "#fff" : "var(--text-2)", boxShadow: tab===t ? "0 2px 10px rgba(0,0,0,0.08)" : "none" }}>
                  {label}
                </button>
              ))}
              <button onClick={() => setShowGoals(true)} style={{ padding: "7px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13, fontWeight: 500 }}>Goals</button>
            </div>
          </div>
        </div>

        {/* Page content */}
        {tab === "today" ? (
          <div className="desktop-cols" style={{ padding: 14 }}>
            {/* Ellie column */}
            <div>
              <div className="desktop-col-label" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 12, letterSpacing: "0.05em", textTransform: "uppercase" }}>Ellie</div>
              <Dashboard user="ellie" date={date} storage={storage} readOnly={!isToday} />
            </div>
            {/* Martin column */}
            <div>
              <div className="desktop-col-label" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 12, letterSpacing: "0.05em", textTransform: "uppercase" }}>Martin</div>
              <Dashboard user="martin" date={date} storage={storage} readOnly={!isToday} />
            </div>
          </div>
        ) : (
          <div className="desktop-week" style={{ padding: 14 }}>
            {/* Mobile: show active user. Desktop: show both side by side */}
            <div className="desktop-cols" style={{ padding: 0 }}>
              <div>
                <div className="desktop-col-label" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 12, letterSpacing: "0.05em", textTransform: "uppercase" }}>Ellie</div>
                <WeeklyView user="ellie" storage={storage} />
              </div>
              <div>
                <div className="desktop-col-label" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 12, letterSpacing: "0.05em", textTransform: "uppercase" }}>Martin</div>
                <WeeklyView user="martin" storage={storage} />
              </div>
            </div>
            {/* Mobile fallback */}
            <div className="mobile-user-switcher" style={{ display: "block" }}>
              <WeeklyView user={user} storage={storage} />
            </div>
          </div>
        )}

        {showGoals && <GoalsModal goals={storage.getGoals(user)} user={user} onSave={g => storage.setGoals(user, g)} onClose={() => setShowGoals(false)} />}
      </div>
    </>
  );
}
