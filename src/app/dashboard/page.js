"use client";

import { useEffect, useState } from "react";
import { endpoints } from "@/config/api";
import { fetchApi } from "@/lib/fetchApi";

const ESTADOS = ["todos", "pendiente", "aprobada", "cancelada", "finalizada"];
const LIMIT = 10;

const estadoColor = {
    pendiente:  { bg: "#fef3c7", color: "#92400e" },
    aprobada:   { bg: "#d1fae5", color: "#065f46" },
    cancelada:  { bg: "#fee2e2", color: "#991b1b" },
    finalizada: { bg: "#f3f4f6", color: "#374151" },
};

export default function DashboardPage() {
    const [visitas, setVisitas] = useState([]);
    const [todasVisitas, setTodasVisitas] = useState([]);
    const [filtro, setFiltro] = useState("todos");
    const [loading, setLoading] = useState(true);
    const [usuario, setUsuario] = useState(null);
    const [modal, setModal] = useState(null);
    const [motivo, setMotivo] = useState("");
    const [procesando, setProcesando] = useState(false);
    const [msg, setMsg] = useState(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const data = sessionStorage.getItem("usuario");
        if (data) setUsuario(JSON.parse(data));
    }, []);

    useEffect(() => {
        cargarVisitas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, filtro]);

    const cargarVisitas = async () => {
        setLoading(true);
        try {
            const res = await fetchApi(endpoints.visits);
            const json = await res.json();
            const todas = json.data || [];
            const filtradas = filtro === "todos"
                ? todas
                : todas.filter(v => v.estado === filtro);
            setTotal(filtradas.length);
            const inicio = (page - 1) * LIMIT;
            setVisitas(filtradas.slice(inicio, inicio + LIMIT));
        } catch {
            setMsg({ text: "Error cargando visitas", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(total / LIMIT);

    const cambiarEstado = async () => {
        if (!modal) return;
        if (modal.accion === "cancelada" && !motivo.trim()) {
            setMsg({ text: "El motivo es requerido para cancelar", type: "error" });
            return;
        }
        setProcesando(true);
        try {
            const res = await fetchApi(endpoints.visitStatus(modal.visita.id), {
                method: "PATCH",
                body: JSON.stringify({ estado: modal.accion, motivo: motivo || null })
            });
            const json = await res.json();
            if (res.ok) {
                setMsg({ text: `Visita ${modal.accion} correctamente`, type: "success" });
                setModal(null);
                setMotivo("");
                cargarVisitas();
            } else {
                setMsg({ text: json.error, type: "error" });
            }
        } catch {
            setMsg({ text: "Error de conexión", type: "error" });
        } finally {
            setProcesando(false);
        }
    };

    const canAprobar = usuario?.rol === "recepcionista" || usuario?.rol === "administrador";

    return (
        <div>
            <div style={styles.pageHeader}>
                <h1 style={styles.pageTitle}>📋 Visitas</h1>
                <button onClick={() => { setPage(1); cargarVisitas(); }} style={styles.refreshBtn}>
                    🔄 Actualizar
                </button>
            </div>

            {msg && (
                <div style={{ ...styles.alert, ...(msg.type === "success" ? styles.alertSuccess : styles.alertError) }}>
                    {msg.text}
                    <button onClick={() => setMsg(null)} style={styles.closeAlert}>✕</button>
                </div>
            )}

            <div style={styles.filtros}>
                {ESTADOS.map(e => (
                    <button
                        key={e}
                        onClick={() => { setFiltro(e); setPage(1); }}
                        style={{ ...styles.filtroBtn, ...(filtro === e ? styles.filtroBtnActive : {}) }}
                    >
                        {e.charAt(0).toUpperCase() + e.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <p style={styles.loading}>Cargando visitas...</p>
            ) : visitas.length === 0 ? (
                <p style={styles.empty}>No hay visitas {filtro !== "todos" ? `con estado "${filtro}"` : ""}.</p>
            ) : (
                <>
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    {["ID", "Visitante", "Departamento", "Fecha", "Hora", "Motivo", "Estado", "Acciones"].map(h => (
                                        <th key={h} style={styles.th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visitas.map(v => (
                                    <tr key={v.id} style={styles.tr}>
                                        <td style={styles.td}>{v.id}</td>
                                        <td style={styles.td}>
                                            {v.Visitantes?.nombre} {v.Visitantes?.apellido_paterno}
                                            <br />
                                            <small style={{ color: "#888" }}>{v.Visitantes?.correo}</small>
                                        </td>
                                        <td style={styles.td}>{v.Departamentos?.nombre}</td>
                                        <td style={styles.td}>{new Date(v.fecha).toLocaleDateString("es-MX")}</td>
                                        <td style={styles.td}>{v.hora_inicio}</td>
                                        <td style={styles.td}>{v.motivo}</td>
                                        <td style={styles.td}>
                                            <span style={{ ...styles.badge, ...estadoColor[v.estado] }}>
                                                {v.estado}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.acciones}>
                                                {v.estado === "pendiente" && canAprobar && (
                                                    <button style={styles.btnAprobar} onClick={() => { setModal({ visita: v, accion: "aprobada" }); setMotivo(""); }}>
                                                        ✅
                                                    </button>
                                                )}
                                                {["pendiente", "aprobada"].includes(v.estado) && (
                                                    <button style={styles.btnCancelar} onClick={() => { setModal({ visita: v, accion: "cancelada" }); setMotivo(""); }}>
                                                        ❌
                                                    </button>
                                                )}
                                                {v.estado === "aprobada" && (
                                                    <button style={styles.btnFinalizar} onClick={() => { setModal({ visita: v, accion: "finalizada" }); setMotivo(""); }}>
                                                        🏁
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div style={styles.pagination}>
                            {page > 1 && (
                                <button style={styles.pageBtn} onClick={() => setPage(p => p - 1)}>
                                    ← Anterior
                                </button>
                            )}
                            <span style={styles.pageInfo}>Página {page} de {totalPages}</span>
                            {page < totalPages && (
                                <button style={styles.pageBtn} onClick={() => setPage(p => p + 1)}>
                                    Siguiente →
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {modal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h3 style={styles.modalTitle}>
                            {modal.accion === "aprobada" && "✅ Aprobar visita"}
                            {modal.accion === "cancelada" && "❌ Cancelar visita"}
                            {modal.accion === "finalizada" && "🏁 Finalizar visita"}
                        </h3>
                        <p style={styles.modalInfo}>
                            <strong>{modal.visita.Visitantes?.nombre} {modal.visita.Visitantes?.apellido_paterno}</strong>
                            <br />
                            {modal.visita.Departamentos?.nombre} — {new Date(modal.visita.fecha).toLocaleDateString("es-MX")}
                        </p>
                        {modal.accion === "cancelada" && (
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={styles.label}>Motivo de cancelación *</label>
                                <textarea
                                    style={styles.textarea}
                                    value={motivo}
                                    onChange={e => setMotivo(e.target.value)}
                                    rows={3}
                                    placeholder="Escribe el motivo..."
                                />
                            </div>
                        )}
                        <div style={styles.modalBtns}>
                            <button style={styles.btnSecondary} onClick={() => setModal(null)} disabled={procesando}>
                                Cancelar
                            </button>
                            <button style={styles.btnPrimary} onClick={cambiarEstado} disabled={procesando}>
                                {procesando ? "Procesando..." : "Confirmar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
    pageTitle: { fontSize: "1.4rem", color: "#1a56db" },
    refreshBtn: { padding: "0.5rem 1rem", background: "white", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem" },
    alert: { padding: "0.75rem 1rem", borderRadius: 6, marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" },
    alertSuccess: { background: "#d1fae5", color: "#065f46" },
    alertError: { background: "#fee2e2", color: "#991b1b" },
    closeAlert: { background: "none", border: "none", cursor: "pointer", fontSize: "1rem" },
    filtros: { display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" },
    filtroBtn: { padding: "0.4rem 1rem", border: "1px solid #ddd", borderRadius: 999, background: "white", cursor: "pointer", fontSize: "0.85rem" },
    filtroBtnActive: { padding: "0.4rem 1rem", border: "1px solid #1a56db", borderRadius: 999, background: "#1a56db", color: "white", cursor: "pointer", fontSize: "0.85rem" },
    loading: { color: "#888", textAlign: "center", padding: "2rem" },
    empty: { color: "#888", textAlign: "center", padding: "2rem" },
    tableWrapper: { background: "white", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", overflow: "auto" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" },
    th: { padding: "0.75rem 1rem", textAlign: "left", background: "#f8fafc", fontWeight: 600, color: "#555", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap" },
    tr: { borderBottom: "1px solid #f0f0f0" },
    td: { padding: "0.75rem 1rem", verticalAlign: "middle" },
    badge: { padding: "0.25rem 0.6rem", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600 },
    acciones: { display: "flex", gap: "0.3rem" },
    btnAprobar: { padding: "0.3rem 0.6rem", background: "#d1fae5", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "1rem" },
    btnCancelar: { padding: "0.3rem 0.6rem", background: "#fee2e2", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "1rem" },
    btnFinalizar: { padding: "0.3rem 0.6rem", background: "#f3f4f6", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "1rem" },
    pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "1rem" },
    pageBtn: { padding: "0.5rem 1rem", border: "1px solid #ddd", borderRadius: 6, background: "white", cursor: "pointer", fontSize: "0.85rem" },
    pageInfo: { fontSize: "0.85rem", color: "#666" },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    modal: { background: "white", borderRadius: 10, padding: "2rem", width: "100%", maxWidth: 420, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" },
    modalTitle: { fontSize: "1.1rem", marginBottom: "1rem", color: "#1a56db" },
    modalInfo: { background: "#f8fafc", padding: "0.75rem", borderRadius: 6, marginBottom: "1rem", fontSize: "0.9rem", lineHeight: 1.6 },
    label: { display: "block", fontSize: "0.9rem", fontWeight: 500, marginBottom: "0.3rem" },
    textarea: { width: "100%", padding: "0.6rem", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.9rem", boxSizing: "border-box", fontFamily: "inherit" },
    modalBtns: { display: "flex", gap: "0.75rem", justifyContent: "flex-end" },
    btnPrimary: { padding: "0.6rem 1.2rem", background: "#1a56db", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 },
    btnSecondary: { padding: "0.6rem 1.2rem", background: "white", color: "#333", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer" },
};