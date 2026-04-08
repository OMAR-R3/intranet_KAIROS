"use client";

import { useEffect, useState } from "react";
import { endpoints } from "@/config/api";
import { fetchApi } from "@/lib/fetchApi";
import { useRouter } from "next/navigation";

const ROLES = ["todos", "administrador", "recepcionista", "guardia"];

export default function UsersPage() {
    const router = useRouter();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroRol, setFiltroRol] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ nombre: "", apellido_paterno: "", apellido_materno: "", rol: "recepcionista", password: "" });
    const [editId, setEditId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [msg, setMsg] = useState(null);
    const [procesando, setProcesando] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const data = sessionStorage.getItem("usuario");
        if (!data) { router.push("/login"); return; }
        const u = JSON.parse(data);
        if (u.rol !== "administrador") { router.push("/dashboard"); return; }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtroRol, busqueda, page]);

    const cargar = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                ...(filtroRol && { rol: filtroRol }),
                ...(busqueda && { q: busqueda }),
                page,
                limit: 10
            });
            const res = await fetchApi(`${endpoints.internUsers}?${params}`);
            const json = await res.json();
            setUsuarios(json.usuarios || []);
            setTotalPages(json.totalPages || 1);
        } catch {
            setMsg({ text: "Error cargando usuarios", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const abrirCrear = () => {
        setForm({ nombre: "", apellido_paterno: "", apellido_materno: "", rol: "recepcionista", password: "" });
        setEditId(null);
        setModal("form");
    };

    const abrirEditar = (u) => {
        setForm({ nombre: u.nombre, apellido_paterno: u.apellido_paterno, apellido_materno: u.apellido_materno || "", rol: u.rol, password: "" });
        setEditId(u.id);
        setModal("form");
    };

    const guardar = async () => {
        if (!form.nombre.trim() || !form.apellido_paterno.trim()) {
            setMsg({ text: "Nombre y apellido paterno son requeridos", type: "error" });
            return;
        }
        if (!editId && !form.password.trim()) {
            setMsg({ text: "La contraseña es requerida al crear un usuario", type: "error" });
            return;
        }
        setProcesando(true);
        try {
            const body = { ...form };
            if (editId && !body.password) delete body.password;
            const res = await fetchApi(endpoints.internUsers, {
                method: editId ? "PUT" : "POST",
                body: JSON.stringify(editId ? { id: editId, ...body } : body)
            });
            const json = await res.json();
            if (res.ok) {
                setMsg({ text: editId ? "Usuario actualizado" : "Usuario creado", type: "success" });
                setModal(null);
                cargar();
            } else {
                setMsg({ text: json.error, type: "error" });
            }
        } catch {
            setMsg({ text: "Error de conexión", type: "error" });
        } finally {
            setProcesando(false);
        }
    };

    const eliminar = async () => {
        if (!confirmDelete) return;
        setProcesando(true);
        try {
            const res = await fetchApi(endpoints.internUsers, {
                method: "DELETE",
                body: JSON.stringify({ id: confirmDelete.id })
            });
            if (res.ok) {
                setMsg({ text: "Usuario eliminado", type: "success" });
                setConfirmDelete(null);
                cargar();
            } else {
                const json = await res.json();
                setMsg({ text: json.error, type: "error" });
                setConfirmDelete(null);
            }
        } catch {
            setMsg({ text: "Error de conexión", type: "error" });
        } finally {
            setProcesando(false);
        }
    };

    const rolColor = {
        administrador: { bg: "#ede9fe", color: "#5b21b6" },
        recepcionista:  { bg: "#dbeafe", color: "#1e40af" },
        guardia:        { bg: "#d1fae5", color: "#065f46" }
    };

    return (
        <div>
            <div style={styles.pageHeader}>
                <h1 style={styles.title}>👥 Usuarios Internos</h1>
                <button style={styles.btnPrimary} onClick={abrirCrear}>+ Nuevo usuario</button>
            </div>

            {msg && (
                <div style={{ ...styles.alert, ...(msg.type === "success" ? styles.alertSuccess : styles.alertError) }}>
                    {msg.text}
                    <button onClick={() => setMsg(null)} style={styles.closeAlert}>✕</button>
                </div>
            )}

            <div style={styles.filtros}>
                <input
                    style={styles.searchInput}
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={busqueda}
                    onChange={e => { setBusqueda(e.target.value); setPage(1); }}
                />
                <select
                    style={styles.select}
                    value={filtroRol}
                    onChange={e => { setFiltroRol(e.target.value); setPage(1); }}
                >
                    {ROLES.map(r => (
                        <option key={r} value={r === "todos" ? "" : r}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <p style={styles.empty}>Cargando...</p>
            ) : usuarios.length === 0 ? (
                <p style={styles.empty}>No se encontraron usuarios.</p>
            ) : (
                <>
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    {["ID", "Nombre", "Rol", "Creado", "Acciones"].map(h => (
                                        <th key={h} style={styles.th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map(u => (
                                    <tr key={u.id} style={styles.tr}>
                                        <td style={styles.td}>{u.id}</td>
                                        <td style={styles.td}>
                                            {u.nombre} {u.apellido_paterno} {u.apellido_materno}
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{ ...styles.badge, background: rolColor[u.rol]?.bg, color: rolColor[u.rol]?.color }}>
                                                {u.rol}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            {new Date(u.created_at).toLocaleDateString("es-MX")}
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.acciones}>
                                                <button style={styles.btnEdit} onClick={() => abrirEditar(u)}>✏️</button>
                                                <button style={styles.btnDelete} onClick={() => setConfirmDelete(u)}>🗑️</button>
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

            {modal === "form" && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h3 style={styles.modalTitle}>
                            {editId ? "✏️ Editar usuario" : "➕ Nuevo usuario"}
                        </h3>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Nombre *</label>
                                <input style={styles.input} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Apellido paterno *</label>
                                <input style={styles.input} value={form.apellido_paterno} onChange={e => setForm({ ...form, apellido_paterno: e.target.value })} />
                            </div>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Apellido materno</label>
                            <input style={styles.input} value={form.apellido_materno} onChange={e => setForm({ ...form, apellido_materno: e.target.value })} />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Rol *</label>
                            <select style={styles.input} value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
                                <option value="administrador">Administrador</option>
                                <option value="recepcionista">Recepcionista</option>
                                <option value="guardia">Guardia</option>
                            </select>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>
                                Contraseña {editId ? "(dejar vacío para no cambiar)" : "*"}
                            </label>
                            <input
                                style={styles.input}
                                type="password"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                placeholder={editId ? "••••••••" : ""}
                            />
                        </div>
                        <div style={styles.modalBtns}>
                            <button style={styles.btnSecondary} onClick={() => setModal(null)} disabled={procesando}>Cancelar</button>
                            <button style={styles.btnPrimary} onClick={guardar} disabled={procesando}>
                                {procesando ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDelete && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h3 style={styles.modalTitle}>🗑️ Eliminar usuario</h3>
                        <p style={styles.modalInfo}>
                            ¿Estás seguro de eliminar a <strong>{confirmDelete.nombre} {confirmDelete.apellido_paterno}</strong>?
                        </p>
                        <div style={styles.modalBtns}>
                            <button style={styles.btnSecondary} onClick={() => setConfirmDelete(null)} disabled={procesando}>Cancelar</button>
                            <button style={styles.btnDanger} onClick={eliminar} disabled={procesando}>
                                {procesando ? "Eliminando..." : "Eliminar"}
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
    title: { fontSize: "1.4rem", color: "#1a56db" },
    alert: { padding: "0.75rem 1rem", borderRadius: 6, marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" },
    alertSuccess: { background: "#d1fae5", color: "#065f46" },
    alertError: { background: "#fee2e2", color: "#991b1b" },
    closeAlert: { background: "none", border: "none", cursor: "pointer", fontSize: "1rem" },
    filtros: { display: "flex", gap: "0.75rem", marginBottom: "1.5rem" },
    searchInput: { flex: 1, padding: "0.6rem 0.8rem", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.9rem" },
    select: { padding: "0.6rem 0.8rem", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.9rem" },
    empty: { color: "#888", textAlign: "center", padding: "2rem" },
    tableWrapper: { background: "white", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", overflow: "auto" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" },
    th: { padding: "0.75rem 1rem", textAlign: "left", background: "#f8fafc", fontWeight: 600, color: "#555", borderBottom: "2px solid #e5e7eb" },
    tr: { borderBottom: "1px solid #f0f0f0" },
    td: { padding: "0.75rem 1rem", verticalAlign: "middle" },
    badge: { padding: "0.25rem 0.6rem", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600 },
    acciones: { display: "flex", gap: "0.3rem" },
    btnEdit: { padding: "0.3rem 0.6rem", background: "#e0f2fe", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "1rem" },
    btnDelete: { padding: "0.3rem 0.6rem", background: "#fee2e2", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "1rem" },
    pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "1rem" },
    pageBtn: { padding: "0.5rem 1rem", border: "1px solid #ddd", borderRadius: 6, background: "white", cursor: "pointer", fontSize: "0.85rem" },
    pageInfo: { fontSize: "0.85rem", color: "#666" },
    btnPrimary: { padding: "0.6rem 1.2rem", background: "#1a56db", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },
    btnSecondary: { padding: "0.6rem 1.2rem", background: "white", color: "#333", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: "0.9rem" },
    btnDanger: { padding: "0.6rem 1.2rem", background: "#ef4444", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    modal: { background: "white", borderRadius: 10, padding: "2rem", width: "100%", maxWidth: 480, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" },
    modalTitle: { fontSize: "1.1rem", marginBottom: "1rem", color: "#1a56db" },
    modalInfo: { background: "#f8fafc", padding: "0.75rem", borderRadius: 6, marginBottom: "1rem", fontSize: "0.9rem", lineHeight: 1.6 },
    formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
    formGroup: { marginBottom: "1rem" },
    label: { display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.3rem" },
    input: { width: "100%", padding: "0.6rem 0.8rem", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.9rem", boxSizing: "border-box", fontFamily: "inherit" },
    modalBtns: { display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" },
};