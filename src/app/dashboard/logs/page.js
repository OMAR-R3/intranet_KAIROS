"use client";

import { useEffect, useState } from "react";
import { endpoints } from "@/config/api";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/fetchApi";

const LIMIT = 10;

export default function LogsPage() {
    const [logs, setLogs] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroUsuario, setFiltroUsuario] = useState("");
    const [msg, setMsg] = useState(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const router = useRouter();

    useEffect(() => {
        const data = sessionStorage.getItem("usuario");
        if (!data) { router.push("/login"); return; }
        const u = JSON.parse(data);
        if (u.rol !== "administrador") { router.push("/dashboard"); return; }
        cargarUsuarios();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Recargar logs cuando cambia filtro o página
    useEffect(() => {
        cargarLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtroUsuario, page]);

    const cargarUsuarios = async () => {
        try {
            const res = await fetchApi(`${endpoints.internUsers}?limit=100`);
            const json = await res.json();
            setUsuarios(json.usuarios || []);
        } catch {
            console.error("Error cargando usuarios");
        }
    };

    const cargarLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtroUsuario) params.set("usuario_id", filtroUsuario);
            const res = await fetchApi(`${endpoints.logs}?${params}`);
            const json = await res.json();
            const todos = json.data || [];
            setTotal(todos.length);
            // Paginación local
            const inicio = (page - 1) * LIMIT;
            setLogs(todos.slice(inicio, inicio + LIMIT));
        } catch {
            setMsg({ text: "Error cargando logs", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(total / LIMIT);

    const handleFiltroChange = (e) => {
        setFiltroUsuario(e.target.value);
        setPage(1); // resetear a página 1 al cambiar filtro
    };

    const formatFecha = (iso) => new Date(iso).toLocaleString("es-MX", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
        timeZone: "America/Mexico_City"
    });

    return (
        <div>
            <div style={styles.pageHeader}>
                <h1 style={styles.title}>🧾 Logs del sistema</h1>
                <button onClick={() => { setPage(1); cargarLogs(); }} style={styles.refreshBtn}>
                    🔄 Actualizar
                </button>
            </div>

            {msg && (
                <div style={{ ...styles.alert, ...styles.alertError }}>
                    {msg.text}
                    <button onClick={() => setMsg(null)} style={styles.closeAlert}>✕</button>
                </div>
            )}

            <div style={styles.filtros}>
                <select style={styles.select} value={filtroUsuario} onChange={handleFiltroChange}>
                    <option value="">Todos los usuarios</option>
                    {usuarios.map(u => (
                        <option key={u.id} value={u.id}>
                            {u.nombre} {u.apellido_paterno} — {u.rol}
                        </option>
                    ))}
                </select>
                <span style={styles.total}>
                    {loading ? "..." : `${total} registro${total !== 1 ? "s" : ""}`}
                </span>
            </div>

            {loading ? (
                <p style={styles.empty}>Cargando logs...</p>
            ) : logs.length === 0 ? (
                <p style={styles.empty}>No hay logs registrados.</p>
            ) : (
                <>
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    {["Fecha", "Usuario", "Rol", "Acción"].map(h => (
                                        <th key={h} style={styles.th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <span style={styles.fecha}>{formatFecha(log.fecha)}</span>
                                        </td>
                                        <td style={styles.td}>
                                            {log.Usuarios_Internos
                                                ? `${log.Usuarios_Internos.nombre} ${log.Usuarios_Internos.apellido_paterno}`
                                                : <span style={styles.sistema}>Sistema</span>
                                            }
                                        </td>
                                        <td style={styles.td}>
                                            {log.Usuarios_Internos
                                                ? <span style={{ ...styles.badge, ...rolColor(log) }}>{getRol(log, usuarios)}</span>
                                                : "—"
                                            }
                                        </td>
                                        <td style={styles.td}>{log.accion}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación — solo aparece si hay más de una página */}
                    {totalPages > 1 && (
                        <div style={styles.pagination}>
                            {page > 1 && (
                                <button style={styles.pageBtn} onClick={() => setPage(p => p - 1)}>
                                    ← Anterior
                                </button>
                            )}
                            <span style={styles.pageInfo}>
                                Página {page} de {totalPages}
                            </span>
                            {page < totalPages && (
                                <button style={styles.pageBtn} onClick={() => setPage(p => p + 1)}>
                                    Siguiente →
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function getRol(log, usuarios) {
    const u = usuarios.find(u => u.id === log.usuario_id);
    return u?.rol || "—";
}

function rolColor(log) {
    const colors = {
        administrador: { background: "#ede9fe", color: "#5b21b6" },
        recepcionista:  { background: "#dbeafe", color: "#1e40af" },
        guardia:        { background: "#d1fae5", color: "#065f46" }
    };
    return colors[log.Usuarios_Internos?.rol] || {};
}

const styles = {
    pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
    title: { fontSize: "1.4rem", color: "#1a56db" },
    refreshBtn: { padding: "0.5rem 1rem", background: "white", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem" },
    alert: { padding: "0.75rem 1rem", borderRadius: 6, marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" },
    alertError: { background: "#fee2e2", color: "#991b1b" },
    closeAlert: { background: "none", border: "none", cursor: "pointer", fontSize: "1rem" },
    filtros: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" },
    select: { padding: "0.6rem 0.8rem", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.9rem", minWidth: 250 },
    total: { fontSize: "0.85rem", color: "#888" },
    empty: { color: "#888", textAlign: "center", padding: "2rem" },
    tableWrapper: { background: "white", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", overflow: "auto" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" },
    th: { padding: "0.75rem 1rem", textAlign: "left", background: "#f8fafc", fontWeight: 600, color: "#555", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap" },
    tr: { borderBottom: "1px solid #f0f0f0" },
    td: { padding: "0.75rem 1rem", verticalAlign: "middle" },
    fecha: { fontSize: "0.85rem", color: "#555", whiteSpace: "nowrap" },
    sistema: { color: "#aaa", fontStyle: "italic" },
    badge: { padding: "0.25rem 0.6rem", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600 },
    pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "1rem" },
    pageBtn: { padding: "0.5rem 1rem", border: "1px solid #ddd", borderRadius: 6, background: "white", cursor: "pointer", fontSize: "0.85rem" },
    pageInfo: { fontSize: "0.85rem", color: "#666" },
};