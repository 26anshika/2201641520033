import React, { useState, useEffect, createContext, useContext } from "react";
import Grid from "@mui/material/Grid";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  TextField,
  Button,
  Paper,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";

// ----------------------
// Types & Utilities
// ----------------------

type User = { id: string; username: string; passwordHash: string };

type ClickRecord = { ts: string; source: string };

type ShortLink = {
  id: string; // short code
  originalUrl: string;
  createdAt: string; // ISO
  expiresAt: string; // ISO
  clicks: ClickRecord[];
  createdBy: string; // user id
};

const STORAGE_KEYS = {
  USERS: "campus_users_v1",
  SESSION: "campus_session_v1",
  LINKS: "campus_links_v1",
  LOGS: "campus_logs_v1",
};

function nowIso() {
  return new Date().toISOString();
}

function addMinutesToIso(iso: string, mins: number) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + mins);
  return d.toISOString();
}

// Simple custom logger that writes to localStorage (inbuilt loggers prohibited by spec)
function appLog(msg: string) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || "[]");
    existing.push({ ts: nowIso(), msg });
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(existing));
  } catch (e) {
    // swallow
  }
}

// Generate a short code (avoid collisions)
function genShortCode() {
  // uuid + base36 trim
  return Math.random().toString(36).substring(2, 8);
}

function isValidUrl(url: string) {
  try {
    const u = new URL(url);
    return !!u.protocol && (u.protocol === "http:" || u.protocol === "https:");
  } catch (e) {
    return false;
  }
}

// ----------------------
// Storage helpers
// ----------------------

function loadUsers(): User[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
}
function saveUsers(u: User[]) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(u));
}

function loadLinks(): ShortLink[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.LINKS) || "[]");
}
function saveLinks(l: ShortLink[]) {
  localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(l));
}

function saveSession(userId: string) {
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ userId, ts: nowIso() }));
}
function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}
function loadSession() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION) || "null");
}

// ----------------------
// Auth Context
// ----------------------

const AuthContext = createContext<{
  user: User | null;
  login: (username: string, password: string) => boolean;
  register: (username: string, password: string) => boolean;
  logout: () => void;
} | null>(null);

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function simpleHash(s: string) {
  // NOT cryptographically secure; fine for demo
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return (h >>> 0).toString(16);
}

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const ses = loadSession();
    if (!ses) return null;
    const users = loadUsers();
    return users.find((u) => u.id === ses.userId) || null;
  });

  useEffect(() => {
    appLog("Auth initialized");
  }, []);

  function login(username: string, password: string) {
    const users = loadUsers();
    const hash = simpleHash(password);
    const found = users.find((u) => u.username === username && u.passwordHash === hash);
    if (found) {
      saveSession(found.id);
      setUser(found);
      appLog(`user_login:${username}`);
      return true;
    }
    return false;
  }

  function register(username: string, password: string) {
    const users = loadUsers();
    if (users.find((u) => u.username === username)) return false;
    const newUser: User = { id: uuidv4(), username, passwordHash: simpleHash(password) };
    users.push(newUser);
    saveUsers(users);
    saveSession(newUser.id);
    setUser(newUser);
    appLog(`user_register:${username}`);
    return true;
  }

  function logout() {
    clearSession();
    setUser(null);
    appLog("user_logout");
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>
  );
};

// ----------------------
// Protected Route
// ----------------------

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  if (!auth.user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ----------------------
// Pages
// ----------------------

function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [err, setErr] = useState("");

  function submit() {
    setErr("");
    if (!username || !password) return setErr("Username and password required");
    const ok = isRegister ? auth.register(username, password) : auth.login(username, password);
    if (!ok) return setErr(isRegister ? "Username already exists" : "Incorrect credentials");
    navigate("/");
  }

  return (
    <Container maxWidth="sm">
      <Paper sx={{ mt: 6, p: 3 }}>
        <Typography variant="h6">{isRegister ? "Register" : "Login"}</Typography>
        <Box mt={2}>
          <TextField fullWidth label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </Box>
        <Box mt={2}>
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Box>
        {err && (
          <Typography color="error" mt={2}>
            {err}
          </Typography>
        )}
        <Box mt={3} display="flex" justifyContent="space-between">
          <Button variant="contained" onClick={submit}>
            {isRegister ? "Create Account" : "Login"}
          </Button>
          <Button onClick={() => setIsRegister((s) => !s)}>{isRegister ? "Have an account? Login" : "Register"}</Button>
        </Box>
      </Paper>
    </Container>
  );
}

function DashboardPage() {
  const auth = useAuth();
  const [originalUrl, setOriginalUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [validityMinutes, setValidityMinutes] = useState<number | "">(30); // default 30 minutes
  const [links, setLinks] = useState<ShortLink[]>(() => loadLinks());
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState<ShortLink | null>(null);

  useEffect(() => {
    saveLinks(links);
  }, [links]);

  function createShort() {
    setErr("");
    if (!isValidUrl(originalUrl)) return setErr("Enter a valid http(s) URL");
    const minutes = validityMinutes === "" ? 30 : Number(validityMinutes);
    if (Number.isNaN(minutes) || minutes <= 0) return setErr("Validity must be a positive number of minutes");
    // build short code
    let code = customCode.trim() || genShortCode();
    // prevent collision
    if (links.find((l) => l.id === code)) return setErr("Short code collision, try another custom code");
    const createdAt = nowIso();
    const expiresAt = addMinutesToIso(createdAt, minutes);
    const newLink: ShortLink = {
      id: code,
      originalUrl,
      createdAt,
      expiresAt,
      clicks: [],
      createdBy: auth.user!.id,
    };
    setLinks((s) => [newLink, ...s]);
    appLog(`short_created:${code}`);
    // reset form
    setOriginalUrl("");
    setCustomCode("");
    setValidityMinutes(30);
  }

  function removeLink(id: string) {
    setLinks((s) => s.filter((l) => l.id !== id));
    appLog(`short_deleted:${id}`);
  }

  function simulateClick(link: ShortLink, source = "manual-sim") {
    const now = nowIso();
    const rec: ClickRecord = { ts: now, source };
    setLinks((prev) =>
      prev.map((l) => (l.id === link.id ? { ...l, clicks: [...l.clicks, rec] } : l))
    );
    appLog(`click_sim:${link.id}:${source}`);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    appLog(`copied:${text}`);
  }

  // Render table rows
  return (
    <Container sx={{ mt: 4 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Create Short Link</Typography>
              <Box mt={2}>
                <TextField
                  label="Original URL"
                  fullWidth
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                />
              </Box>
              <Box mt={2} display="flex" gap={2}>
                <TextField
                  label="Custom short code (optional)"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                />
                <FormControl sx={{ minWidth: 140 }}>
                  <InputLabel id="validity-label">Validity</InputLabel>
                  <Select
                    labelId="validity-label"
                    label="Validity"
                    value={validityMinutes}
                    onChange={(e) => setValidityMinutes(e.target.value as number | "")}
                  >
                    <MenuItem value={30}>30 minutes</MenuItem>
                    <MenuItem value={60}>1 hour</MenuItem>
                    <MenuItem value={180}>3 hours</MenuItem>
                    <MenuItem value={1440}>1 day</MenuItem>
                    <MenuItem value={10080}>1 week</MenuItem>
                    <MenuItem value={""}>Custom...</MenuItem>
                  </Select>
                </FormControl>
                {validityMinutes === "" && (
                  <TextField
                    label="minutes"
                    type="number"
                    onChange={(e) => setValidityMinutes(Number(e.target.value))}
                  />
                )}
              </Box>
              {err && (
                <Typography color="error" mt={2}>
                  {err}
                </Typography>
              )}
              <Box mt={3} display="flex" gap={2}>
                <Button variant="contained" onClick={createShort}>
                  Create
                </Button>
                <Button
                  onClick={() => {
                    setOriginalUrl("");
                    setCustomCode("");
                    setValidityMinutes(30);
                  }}
                >
                  Reset
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Box mt={2}>
            <Card>
              <CardContent>
                <Typography variant="h6">Your Short Links</Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Short</TableCell>
                      <TableCell>Original</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Expires</TableCell>
                      <TableCell>Clicks</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {links.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography>{`http://localhost:3000/r/${l.id}`}</Typography>
                            <IconButton size="small" onClick={() => copyToClipboard(`http://localhost:3000/r/${l.id}`)}>
                              <ContentCopyIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis" }}>{l.originalUrl}</TableCell>
                        <TableCell>{new Date(l.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{new Date(l.expiresAt).toLocaleString()}</TableCell>
                        <TableCell>{l.clicks.length}</TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => { setSelected(l); }}>
                            View
                          </Button>
                          <Button size="small" onClick={() => simulateClick(l)}>
                            Sim Click
                          </Button>
                          <IconButton size="small" onClick={() => removeLink(l.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6">Account</Typography>
            <Box mt={1}>
              <Typography>Username: {auth.user?.username}</Typography>
              <Button sx={{ mt: 2 }} onClick={() => auth.logout()}>
                Logout
              </Button>
            </Box>

            <Box mt={3}>
              <Typography variant="subtitle1">App Logs (recent)</Typography>
              <Box mt={1} sx={{ maxHeight: 300, overflow: "auto" }}>
                <pre>{JSON.stringify(JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || "[]").slice(-20), null, 2)}</pre>
              </Box>
            </Box>
          </Card>

          <Box mt={2}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6">Instructions / Constraints</Typography>
              <Box mt={1}>
                <ul>
                  <li>TypeScript only (this project file is .tsx)</li>
                  <li>Material UI used for styling</li>
                  <li>Default validity 30 minutes if not specified</li>
                  <li>All data persisted client-side (localStorage) for this test</li>
                </ul>
              </Box>
            </Card>
          </Box>
        </Grid>
      </Grid>

      <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth maxWidth="md">
        <DialogTitle>Link Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Box>
              <Typography>Short: http://localhost:3000/r/{selected.id}</Typography>
              <Typography>Original: {selected.originalUrl}</Typography>
              <Typography>Created: {new Date(selected.createdAt).toLocaleString()}</Typography>
              <Typography>Expires: {new Date(selected.expiresAt).toLocaleString()}</Typography>
              <Typography>Total Clicks: {selected.clicks.length}</Typography>

              <Box mt={2}>
                <Typography variant="subtitle1">Click History</Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Source</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selected.clicks.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell>{new Date(c.ts).toLocaleString()}</TableCell>
                        <TableCell>{c.source}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

// Redirect handler for short links (simulate server behaviour)
function RedirectHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    const path = window.location.pathname; // /r/:id
    const parts = path.split("/");
    const id = parts[2];
    const links = loadLinks();
    const found = links.find((l) => l.id === id);
    if (!found) {
      appLog(`redir_not_found:${id}`);
      navigate("/404", { replace: true });
      return;
    }
    // check expiry
    if (new Date(found.expiresAt) < new Date()) {
      appLog(`redir_expired:${id}`);
      navigate("/expired", { replace: true });
      return;
    }
    // register click (we simulate 'source' from document.referrer)
    const source = document.referrer || "direct";
    const rec: ClickRecord = { ts: nowIso(), source };
    const updated = links.map((l) => (l.id === id ? { ...l, clicks: [...l.clicks, rec] } : l));
    saveLinks(updated);
    appLog(`redir_success:${id}:${source}`);
    // navigate to external url AFTER short delay to simulate redirect
    setTimeout(() => {
      window.location.href = found.originalUrl;
    }, 500);
  }, [navigate]);
  return (
    <Container sx={{ mt: 6 }}>
      <Typography>Redirecting...</Typography>
    </Container>
  );
}

function NotFound() {
  return (
    <Container sx={{ mt: 6 }}>
      <Typography>Short link not found</Typography>
    </Container>
  );
}

function Expired() {
  return (
    <Container sx={{ mt: 6 }}>
      <Typography>This short link has expired</Typography>
    </Container>
  );
}

// ----------------------
// App Shell
// ----------------------

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6">Efford Campus Shortener (Frontend)</Typography>
          </Toolbar>
        </AppBar>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route path="/r/:id" element={<RedirectHandler />} />
          <Route path="/expired" element={<Expired />} />
          <Route path="/404" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}