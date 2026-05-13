import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

const COLORS = {
  bg: "#F5F2ED",
  surface: "#FFFCF7",
  card: "#1C1B19",
  cardAlt: "#2A2825",
  coral: "#D85A30",
  teal: "#1D9E75",
  blue: "#378ADD",
  purple: "#7F77DD",
  amber: "#BA7517",
  pink: "#D4537E",
  green: "#639922",
  text: "#1C1B19",
  textMuted: "#7A756E",
  textLight: "#A39E96",
  border: "rgba(28,27,25,0.08)",
};

const TAG_COLORS = [COLORS.coral, COLORS.teal, COLORS.blue, COLORS.purple, COLORS.amber, COLORS.pink, COLORS.green];

const VIEWS = ["dashboard", "tasks", "collections", "handbook"];

const INIT_TASKS = [
  { id: 1, title: "Learn CSS Grid layout", topic: "Frontend", status: "done", confidence: 6, notes: "Understood grid-template-columns and fr units. Still need practice with grid-area naming.", date: "2026-05-01", fuzzy: "Subgrid behavior" },
  { id: 2, title: "Study React hooks patterns", topic: "Frontend", status: "done", confidence: 4, notes: "useState and useEffect are clear. useCallback and useMemo need more work.", date: "2026-05-03", fuzzy: "When to memoize" },
  { id: 3, title: "Read about spaced repetition", topic: "Learning Science", status: "done", confidence: 7, notes: "Ebbinghaus forgetting curve, Leitner system, Anki algorithm basics.", date: "2026-05-05", fuzzy: "" },
  { id: 4, title: "Build a REST API with Node", topic: "Backend", status: "in-progress", confidence: 2, notes: "Started with Express routing. Need to learn middleware patterns.", date: "2026-05-08", fuzzy: "Error handling middleware" },
  { id: 5, title: "Explore MCP protocol", topic: "AI Tools", status: "todo", confidence: 1, notes: "", date: "2026-05-12", fuzzy: "" },
  { id: 6, title: "Mental models for decision making", topic: "Learning Science", status: "done", confidence: 5, notes: "First principles, inversion, second-order thinking.", date: "2026-05-06", fuzzy: "Applying inversion consistently" },
  { id: 7, title: "PostgreSQL indexing strategies", topic: "Backend", status: "done", confidence: 4, notes: "B-tree vs hash indexes. Composite indexes. EXPLAIN ANALYZE.", date: "2026-05-09", fuzzy: "Partial indexes" },
  { id: 8, title: "Design system color theory", topic: "Design", status: "in-progress", confidence: 3, notes: "Color contrast ratios, WCAG standards.", date: "2026-05-11", fuzzy: "Accessible color palettes" },
];

function getTopicColor(topic, topics) {
  const idx = topics.indexOf(topic);
  return TAG_COLORS[idx % TAG_COLORS.length];
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${color}dd, ${color})`, borderRadius: 16, padding: "22px 20px", color: "#fff", position: "relative", overflow: "hidden", minHeight: 110 }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
      <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.8, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function TaskRow({ task, topics, onEdit }) {
  const c = getTopicColor(task.topic, topics);
  const statusStyles = {
    done: { bg: "#E1F5EE", color: "#085041", label: "Done" },
    "in-progress": { bg: "#FAEEDA", color: "#633806", label: "In progress" },
    todo: { bg: "#F1EFE8", color: "#5F5E5A", label: "To do" },
  };
  const s = statusStyles[task.status];
  return (
    <div
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 16, alignItems: "center", cursor: "pointer", transition: "transform 0.15s" }}
      onClick={() => onEdit(task)}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{task.title}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 100, background: c + "18", color: c }}>{task.topic}</span>
          <span style={{ fontSize: 12, color: COLORS.textLight }}>{task.date}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= task.confidence ? c : COLORS.border }} />
        ))}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 100, background: s.bg, color: s.color }}>{s.label}</span>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,27,25,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }} onClick={onClose}>
      <div style={{ background: COLORS.surface, borderRadius: 20, maxWidth: 560, width: "100%", maxHeight: "90vh", overflow: "auto", padding: 32 }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function TaskForm({ task, topics, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(task || { title: "", topic: topics[0] || "", status: "todo", confidence: 1, notes: "", date: new Date().toISOString().slice(0, 10), fuzzy: "" });
  const [newTopic, setNewTopic] = useState("");
  const isEdit = !!task;
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 14, fontFamily: "inherit", background: COLORS.bg, outline: "none", color: COLORS.text };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isEdit ? "Edit task" : "New learning task"}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLORS.textMuted, fontFamily: "inherit" }}>x</button>
      </div>
      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, display: "block", marginBottom: 6 }}>Task title</label>
          <input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} placeholder="What are you learning?" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, display: "block", marginBottom: 6 }}>Topic</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={form.topic} onChange={e => { if (e.target.value === "__new") { setNewTopic(""); } else { set("topic", e.target.value); } }}>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="__new">+ New topic</option>
            </select>
            {form.topic === "__new" && <input style={{ ...inputStyle, marginTop: 8 }} placeholder="Topic name" value={newTopic} onChange={e => setNewTopic(e.target.value)} onBlur={() => { if (newTopic.trim()) set("topic", newTopic.trim()); }} />}
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, display: "block", marginBottom: 6 }}>Status</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, display: "block", marginBottom: 6 }}>Date</label>
            <input type="date" style={inputStyle} value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, display: "block", marginBottom: 6 }}>Confidence (1-7)</label>
            <div style={{ display: "flex", gap: 6, paddingTop: 8, flexWrap: "wrap" }}>
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <button key={i} onClick={() => set("confidence", i)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${form.confidence === i ? COLORS.coral : COLORS.border}`, background: form.confidence === i ? COLORS.coral : "transparent", color: form.confidence === i ? "#fff" : COLORS.textMuted, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
                  {i}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, display: "block", marginBottom: 6 }}>What I learned</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Key takeaways in your own words..." />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted, display: "block", marginBottom: 6 }}>What is still fuzzy</label>
          <input style={inputStyle} value={form.fuzzy} onChange={e => set("fuzzy", e.target.value)} placeholder="Knowledge gaps to revisit" />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={() => onSave(form)} style={{ flex: 1, padding: "12px 20px", borderRadius: 12, border: "none", background: COLORS.card, color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
            {isEdit ? "Save changes" : "Add task"}
          </button>
          {isEdit && (
            <button onClick={() => onDelete(task.id)} style={{ padding: "12px 20px", borderRadius: 12, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.coral, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("dashboard");
  const [tasks, setTasks] = useState(INIT_TASKS);
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState("all");

  const topics = [...new Set(tasks.map(t => t.topic))];
  const done = tasks.filter(t => t.status === "done");
  const inProg = tasks.filter(t => t.status === "in-progress");
  const avgConf = done.length ? (done.reduce((a, t) => a + t.confidence, 0) / done.length) : 0;

  const topicData = topics.map(tp => ({
    name: tp,
    count: tasks.filter(t => t.topic === tp).length,
    done: tasks.filter(t => t.topic === tp && t.status === "done").length,
    confidence: Math.round((tasks.filter(t => t.topic === tp && t.confidence > 0).reduce((a, t) => a + t.confidence, 0) / Math.max(1, tasks.filter(t => t.topic === tp && t.confidence > 0).length)) * 10) / 10,
    color: getTopicColor(tp, topics),
  }));

  const weeklyData = (() => {
    const weeks = {};
    tasks.forEach(t => {
      const d = new Date(t.date);
      const wk = `W${Math.ceil(d.getDate() / 7)}`;
      if (!weeks[wk]) weeks[wk] = { name: wk, tasks: 0, done: 0 };
      weeks[wk].tasks++;
      if (t.status === "done") weeks[wk].done++;
    });
    return Object.values(weeks);
  })();

  const radarData = topics.map(tp => {
    const topicTasks = tasks.filter(t => t.topic === tp);
    return {
      subject: tp.length > 12 ? tp.slice(0, 10) + ".." : tp,
      volume: topicTasks.length * 20,
      confidence: Math.round((topicTasks.reduce((a, t) => a + t.confidence, 0) / Math.max(1, topicTasks.length)) * 14),
    };
  });

  const saveTask = (form) => {
    if (!form.title.trim()) return;
    if (form.id) {
      setTasks(p => p.map(t => t.id === form.id ? form : t));
    } else {
      setTasks(p => [...p, { ...form, id: Date.now() }]);
    }
    setModal(null);
  };

  const deleteTask = (id) => {
    setTasks(p => p.filter(t => t.id !== id));
    setModal(null);
  };

  const filteredTasks = filter === "all" ? tasks : tasks.filter(t => t.topic === filter);

  const navBtn = (v, label, icon) => (
    <button
      key={v}
      onClick={() => setView(v)}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "10px 16px", borderRadius: 10, border: "none",
        background: view === v ? COLORS.card : "transparent",
        color: view === v ? "#fff" : COLORS.textMuted,
        fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        transition: "all 0.15s", textAlign: "left",
      }}
    >
      <i className={`ti ti-${icon}`} style={{ fontSize: 18 }} aria-hidden="true" />
      {label}
    </button>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", background: COLORS.bg, color: COLORS.text, minHeight: "100vh", display: "grid", gridTemplateColumns: "220px 1fr" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* SIDEBAR */}
      <aside style={{ background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, padding: "24px 16px", display: "flex", flexDirection: "column", gap: 4, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ fontSize: 17, fontWeight: 700, padding: "8px 16px 20px", letterSpacing: -0.3 }}>Second Brain</div>
        {navBtn("dashboard", "Dashboard", "layout-dashboard")}
        {navBtn("tasks", "Tasks", "checkbox")}
        {navBtn("collections", "Collections", "folder")}
        {navBtn("handbook", "Handbook", "book")}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setModal("new")}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderRadius: 12, border: "none", background: COLORS.coral, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", width: "100%" }}
        >
          <i className="ti ti-plus" style={{ fontSize: 16 }} aria-hidden="true" /> New task
        </button>
      </aside>

      {/* MAIN */}
      <main style={{ padding: "32px 40px", maxWidth: 960, width: "100%" }}>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, letterSpacing: -0.5 }}>Dashboard</h1>
            <p style={{ color: COLORS.textMuted, fontSize: 15, marginBottom: 28 }}>Your learning progress at a glance</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 32 }}>
              <StatCard label="Total tasks" value={tasks.length} sub={`${inProg.length} in progress`} color={COLORS.blue} />
              <StatCard label="Completed" value={done.length} sub={`${Math.round(done.length / Math.max(1, tasks.length) * 100)}% completion`} color={COLORS.teal} />
              <StatCard label="Topics" value={topics.length} sub="knowledge areas" color={COLORS.purple} />
              <StatCard label="Avg confidence" value={Math.round(avgConf * 10) / 10} sub="out of 7" color={COLORS.coral} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 24 }}>
              {/* Progress area chart */}
              <div style={{ background: COLORS.card, borderRadius: 16, padding: "24px 20px" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 4 }}>Weekly activity</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>Tasks completed per week</div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="gTeal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.teal} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={COLORS.teal} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: COLORS.cardAlt, border: "none", borderRadius: 8, color: "#fff", fontSize: 13 }} />
                    <Area type="monotone" dataKey="done" stroke={COLORS.teal} strokeWidth={2} fill="url(#gTeal)" name="Completed" />
                    <Area type="monotone" dataKey="tasks" stroke={COLORS.purple} strokeWidth={2} fill="transparent" name="Total" strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Topic pie chart */}
              <div style={{ background: COLORS.card, borderRadius: 16, padding: "24px 20px" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 4 }}>Topics breakdown</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>Tasks by knowledge area</div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={topicData} dataKey="count" cx="50%" cy="50%" innerRadius={36} outerRadius={62} paddingAngle={3} strokeWidth={0}>
                        {topicData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {topicData.map(d => (
                      <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                        {d.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Confidence radar */}
            <div style={{ background: COLORS.card, borderRadius: 16, padding: "24px 20px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 4 }}>Knowledge radar</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Confidence and volume across topics</div>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar name="Volume" dataKey="volume" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.2} strokeWidth={2} />
                  <Radar name="Confidence" dataKey="confidence" stroke={COLORS.teal} fill={COLORS.teal} fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip contentStyle={{ background: COLORS.cardAlt, border: "none", borderRadius: 8, color: "#fff", fontSize: 13 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent tasks */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recent tasks</div>
              <div style={{ display: "grid", gap: 8 }}>
                {tasks.slice(-4).reverse().map(t => (
                  <TaskRow key={t.id} task={t} topics={topics} onEdit={t => setModal(t)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TASKS */}
        {view === "tasks" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, letterSpacing: -0.5 }}>Tasks</h1>
                <p style={{ color: COLORS.textMuted, fontSize: 15, margin: 0 }}>{tasks.length} learning tasks across {topics.length} topics</p>
              </div>
              <button
                onClick={() => setModal("new")}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "none", background: COLORS.card, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                <i className="ti ti-plus" style={{ fontSize: 15 }} aria-hidden="true" /> Add task
              </button>
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
              <button onClick={() => setFilter("all")} style={{ padding: "6px 16px", borderRadius: 100, border: `1px solid ${filter === "all" ? COLORS.card : COLORS.border}`, background: filter === "all" ? COLORS.card : "transparent", color: filter === "all" ? "#fff" : COLORS.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                All
              </button>
              {topics.map(tp => {
                const c = getTopicColor(tp, topics);
                return (
                  <button key={tp} onClick={() => setFilter(tp)} style={{ padding: "6px 16px", borderRadius: 100, border: `1px solid ${filter === tp ? c : COLORS.border}`, background: filter === tp ? c : "transparent", color: filter === tp ? "#fff" : COLORS.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {tp}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {filteredTasks.map(t => <TaskRow key={t.id} task={t} topics={topics} onEdit={t => setModal(t)} />)}
            </div>
            {filteredTasks.length === 0 && (
              <div style={{ textAlign: "center", padding: 48, color: COLORS.textLight }}>
                No tasks yet. Click "Add task" to start tracking your learning.
              </div>
            )}
          </div>
        )}

        {/* COLLECTIONS */}
        {view === "collections" && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, letterSpacing: -0.5 }}>Collections</h1>
            <p style={{ color: COLORS.textMuted, fontSize: 15, marginBottom: 28 }}>Your learning organized by topic</p>

            <div style={{ display: "grid", gap: 20 }}>
              {topicData.map(td => {
                const topicTasks = tasks.filter(t => t.topic === td.name);
                const doneTasks = topicTasks.filter(t => t.status === "done");
                const pct = Math.round(doneTasks.length / Math.max(1, topicTasks.length) * 100);
                const fuzzyItems = topicTasks.filter(t => t.fuzzy).map(t => t.fuzzy);
                return (
                  <div key={td.name} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${COLORS.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: td.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <i className="ti ti-folder" style={{ color: "#fff", fontSize: 20 }} aria-hidden="true" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{td.name}</div>
                          <div style={{ fontSize: 13, color: COLORS.textMuted }}>{topicTasks.length} tasks, {doneTasks.length} completed</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 100, height: 6, borderRadius: 3, background: COLORS.border, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: td.color, transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: td.color }}>{pct}%</span>
                      </div>
                    </div>

                    <div style={{ padding: "16px 24px" }}>
                      {/* Confidence bar chart */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8 }}>Confidence levels</div>
                          <ResponsiveContainer width="100%" height={80}>
                            <BarChart data={topicTasks.map(t => ({ name: t.title.slice(0, 15), confidence: t.confidence }))} barCategoryGap="20%">
                              <YAxis hide domain={[0, 7]} />
                              <Bar dataKey="confidence" radius={[4, 4, 0, 0]} cursor="pointer">
                                {topicTasks.map((_, i) => <Cell key={i} fill={td.color} opacity={0.25 + (topicTasks[i]?.confidence || 1) * 0.107} />)}
                              </Bar>
                              <Tooltip
                                cursor={false}
                                content={({ active, payload }) => {
                                  if (!active || !payload || !payload.length) return null;
                                  const d = payload[0].payload;
                                  return (
                                    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                                      <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 2 }}>{d.name}</div>
                                      <div style={{ fontSize: 12, color: td.color, fontWeight: 600 }}>{d.confidence} / 7</div>
                                    </div>
                                  );
                                }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8 }}>Still fuzzy</div>
                          {fuzzyItems.length > 0 ? fuzzyItems.map((f, i) => (
                            <div key={i} style={{ fontSize: 13, color: COLORS.textMuted, padding: "4px 0", display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS.amber, flexShrink: 0 }} />
                              {f}
                            </div>
                          )) : <div style={{ fontSize: 13, color: COLORS.textLight }}>No open gaps</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HANDBOOK */}
        {view === "handbook" && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, letterSpacing: -0.5 }}>Handbook</h1>
            <p style={{ color: COLORS.textMuted, fontSize: 15, marginBottom: 28 }}>The frameworks behind your second brain</p>

            {/* CODE */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
              {[
                { l: "C", w: "Capture", d: "Keep what resonates", bg: COLORS.coral },
                { l: "O", w: "Organize", d: "Save for actionability", bg: COLORS.teal },
                { l: "D", w: "Distill", d: "Find the essence", bg: COLORS.blue },
                { l: "E", w: "Express", d: "Show your work", bg: COLORS.purple },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, color: "#fff", padding: "32px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}>{s.l}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>{s.w}</div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{s.d}</div>
                </div>
              ))}
            </div>

            {/* 7 Steps */}
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>The 7-step self-talk learning cycle</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 32 }}>
              {[
                { n: 1, t: "Set learning intention", d: "Define the goal, question, or skill before opening any tool.", c: COLORS.blue },
                { n: 2, t: "Capture all inputs", d: "Notes, lectures, papers, books, podcasts — cast a wide net.", c: COLORS.teal },
                { n: 3, t: "Selection", d: "Find patterns, edge cases. Group info for easy retrieval.", c: COLORS.purple },
                { n: 4, t: "Mental models", d: "Map conflicts, differences, and context behind ideas.", c: COLORS.amber },
                { n: 5, t: "Build small artifacts", d: "Recall, explain, simulate. Build reusable knowledge gems.", c: COLORS.coral },
                { n: 6, t: "Express artifacts", d: "Ship your knowledge. Make it useful to another human.", c: COLORS.pink },
                { n: 7, t: "Reflection and feedback", d: "What worked? What is missing? What to learn next?", c: COLORS.card },
              ].map(s => (
                <div key={s.n} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 16px", borderTop: `3px solid ${s.c}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: s.c, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{s.n}</div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{s.t}</div>
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>{s.d}</div>
                </div>
              ))}
            </div>

            {/* A.C.T.I.V.E. */}
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>A.C.T.I.V.E. learning cycle</div>
            <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 16, maxWidth: 600 }}>Use AI without losing your edge. Each stage keeps you active and limits passive overreliance.</div>
            <div style={{ display: "grid", gap: 8, marginBottom: 32 }}>
              {[
                { l: "A", t: "Achieve", d: "Set your goal and make a first attempt before using AI." },
                { l: "C", t: "Choose tools", d: "Pick 1-2 tools. Write what they may and may not do." },
                { l: "T", t: "Try first", d: "Spend 5-20 minutes solving by yourself." },
                { l: "I", t: "Interrogate", d: "Request hints, not answers. Ask why, not what." },
                { l: "V", t: "Verify", d: "Cross-check. Never use the same tool as generator and verifier." },
                { l: "E", t: "Express", d: "Put it in your own words. The final work must stand without AI." },
              ].map((r, i) => (
                <div key={r.l} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: COLORS.coral, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>{r.l}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.t}</div>
                    <div style={{ fontSize: 13, color: COLORS.textMuted }}>{r.d}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: COLORS.card, borderRadius: 16, padding: 28, color: "#fff" }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Self-talk before every task</div>
              {["What is my goal of building this?", "Why is building this component important to me?", "How to build this work? What tools can help?"].map((q, i) => (
                <div key={i} style={{ fontSize: 15, fontStyle: "italic", opacity: 0.7, paddingLeft: 16, borderLeft: `2px solid ${COLORS.amber}`, marginBottom: 12, lineHeight: 1.5 }}>{q}</div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL */}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          <TaskForm
            task={modal === "new" ? null : modal}
            topics={topics}
            onSave={saveTask}
            onClose={() => setModal(null)}
            onDelete={deleteTask}
          />
        </Modal>
      )}
    </div>
  );
}
