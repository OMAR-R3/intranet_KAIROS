"use client";

import { useEffect, useState } from "react";
import { endpoints } from "@/config/api";
import { fetchApi } from "@/lib/fetchApi";
import { useRouter } from "next/navigation";

export default function DepartmentsPage() {
    const router = useRouter();
    const [departamentos, setDepartamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ nombre: "", ubicacion: "" });
    const [editId, setEditId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [msg, setMsg] = useState(null);
    const [procesando, setProcesando] = useState(false);

    useEffect(() => {
        const data = sessionStorage.getItem("usuario");
        if (!data) { router.push("/login"); return; }
        const u = JSON.parse(data);
        if (u.rol !== "administrador") { router.push("/dashboard"); return; }
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cargar = async () => {
        setLoading(true);
        try {
            const res = await fetchApi(endpoints.department);
            const json = await res.json();
            setDepartamentos(json.data || []);
        } catch {
            setMsg({ text: "Error cargando departamentos", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const abrirCrear = () => {
        setForm({ nombre: "", ubicacion: "" });
        setEditId(null);
        setModal("form");
    };

    const abrirEditar = (d) => {
        setForm({ nombre: d.nombre, ubicacion: d.ubicacion || "" });
        setEditId(d.id);
        setModal("form");
    };

    const guardar = async () => {
        if (!form.nombre.trim()) {
            setMsg({ text: "El nombre es requerido", type: "error" });
            return;
        }
        setProcesando(true);
        try {
            const body = { ...form };
            const res = await fetchApi(endpoints.department, {
                method: editId ? "PUT" : "POST",
                body: JSON.stringify(editId ? { id: editId, ...body } : body)
            });
            const json = await res.json();
            if (res.ok && json.success) {
                setMsg({ text: editId ? "Departamento actualizado" : "Departamento creado", type: "success" });
                setModal(null);
                cargar();
            } else {
                setMsg({ text: json.error || "No se pudo guardar", type: "error" });
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
            const res = await fetchApi(endpoints.department, {
                method: "DELETE",
                body: JSON.stringify({ id: confirmDelete.id })
            });
            const json = await res.json();
            if (res.ok && json.success) {
                setMsg({ text: "Departamento eliminado", type: "success" });
                setConfirmDelete(null);
                cargar();
            } else {
                setMsg({ text: json.error || "No se pudo eliminar", type: "error" });
                setConfirmDelete(null);
            }
        } catch {
            setMsg({ text: "Error de conexión", type: "error" });
        } finally {
            setProcesando(false);
        }
    };

    const departamentosFiltrados = departamentos.filter(d =>
        d.nombre?.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div>
            <div style={styles.pageHeader}>
                <h1 style={styles.title}>🏢 Departamentos</h1>
                <button style={styles.btnPrimary} onClick={abrirCrear}>+ Nuevo departamento</button>
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
                    onChange={e => setBusqueda(e.target.value)}
                />
            </div>

            {loading ? (
                <p style={styles.empty}>Cargando...</p>
            ) : departamentosFiltrados.length === 0 ? (
                <p style={styles.empty}>No se encontraron departamentos.</p>
            ) : (
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                {["ID", "Nombre", "Ubicación", "Acciones"].map(h => (
                                    <th key={h} style={styles.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {departamentosFiltrados.map(d => (
                                <tr key={d.id} style={styles.tr}>
                                    <td style={styles.td}>{d.id}</td>
                                    <td style={styles.td}>{d.nombre}</td>
                                    <td style={styles.td}>{d.ubicacion || "—"}</td>
                                    <td style={styles.td}>
                                        <div style={styles.acciones}>
                                            <button style={styles.btnEdit} onClick={() => abrirEditar(d)}>✏️</button>
                                            <button style={styles.btnDelete} onClick={() => setConfirmDelete(d)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modal === "form" && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h3 style={styles.modalTitle}>
                            {editId ? "✏️ Editar departamento" : "➕ Nuevo departamento"}
                        </h3>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Nombre *</label>
                            <input style={styles.input} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Ubicación</label>
                            <input style={styles.input} value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} />
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
                        <h3 style={styles.modalTitle}>🗑️ Eliminar departamento</h3>
                        <p style={styles.modalInfo}>
                            ¿Estás seguro de eliminar <strong>{confirmDelete.nombre}</strong>?
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
    empty: { color: "#888", textAlign: "center", padding: "2rem" },
    tableWrapper: { background: "white", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", overflow: "auto" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" },
    th: { padding: "0.75rem 1rem", textAlign: "left", background: "#f8fafc", fontWeight: 600, color: "#555", borderBottom: "2px solid #e5e7eb" },
    tr: { borderBottom: "1px solid #f0f0f0" },
    td: { padding: "0.75rem 1rem", verticalAlign: "middle" },
    acciones: { display: "flex", gap: "0.3rem" },
    btnEdit: { padding: "0.3rem 0.6rem", background: "#e0f2fe", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "1rem" },
    btnDelete: { padding: "0.3rem 0.6rem", background: "#fee2e2", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "1rem" },
    btnPrimary: { padding: "0.6rem 1.2rem", background: "#1a56db", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },
    btnSecondary: { padding: "0.6rem 1.2rem", background: "white", color: "#333", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: "0.9rem" },
    btnDanger: { padding: "0.6rem 1.2rem", background: "#ef4444", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    modal: { background: "white", borderRadius: 10, padding: "2rem", width: "100%", maxWidth: 480, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" },
    modalTitle: { fontSize: "1.1rem", marginBottom: "1rem", color: "#1a56db" },
    modalInfo: { background: "#f8fafc", padding: "0.75rem", borderRadius: 6, marginBottom: "1rem", fontSize: "0.9rem", lineHeight: 1.6 },
    formGroup: { marginBottom: "1rem" },
    label: { display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.3rem" },
    input: { width: "100%", padding: "0.6rem 0.8rem", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.9rem", boxSizing: "border-box", fontFamily: "inherit" },
    modalBtns: { display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" },
};