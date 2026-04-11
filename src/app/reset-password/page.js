"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { endpoints } from "@/config/api";
import Link from "next/link";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [form, setForm] = useState({ password: "", confirmar: "" });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [exito, setExito] = useState(false);

    useEffect(() => {
        if (!token) {
            setMsg({ text: "Token inválido. Solicita un nuevo enlace.", type: "error" });
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg(null);

        if (form.password !== form.confirmar) {
            setMsg({ text: "Las contraseñas no coinciden", type: "error" });
            return;
        }

        if (form.password.length < 6) {
            setMsg({ text: "La contraseña debe tener al menos 6 caracteres", type: "error" });
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(endpoints.resetPassword, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify({ token, password: form.password })
            });

            const json = await res.json();

            if (res.ok) {
                setExito(true);
                setTimeout(() => router.push("/login"), 3000);
            } else {
                setMsg({ text: json.error, type: "error" });
            }
        } catch {
            setMsg({ text: "Error de conexión con el servidor", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    if (exito) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.exitoIcon}>✅</div>
                    <h2 style={styles.exitoTitle}>Contraseña actualizada</h2>
                    <p style={styles.exitoMsg}>
                        Tu contraseña fue cambiada correctamente. Serás redirigido al login en unos segundos.
                    </p>
                    <Link href="/login" style={styles.btn}>
                        Ir al inicio de sesión
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>🔐 Nueva contraseña</h1>
                <p style={styles.subtitle}>Ingresa tu nueva contraseña.</p>

                {msg && (
                    <div style={{
                        ...styles.alert,
                        ...(msg.type === "success" ? styles.alertSuccess : styles.alertError)
                    }}>
                        {msg.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Nueva contraseña</label>
                        <input
                            style={styles.input}
                            type="password"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            placeholder="Mínimo 6 caracteres"
                            required
                            autoFocus
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Confirmar contraseña</label>
                        <input
                            style={styles.input}
                            type="password"
                            value={form.confirmar}
                            onChange={e => setForm({ ...form, confirmar: e.target.value })}
                            placeholder="Repite la contraseña"
                            required
                        />
                    </div>
                    <button
                        style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
                        type="submit"
                        disabled={loading || !token}
                    >
                        {loading ? "Actualizando..." : "Actualizar contraseña"}
                    </button>
                </form>

                <Link href="/login" style={styles.back}>
                    ← Volver al inicio de sesión
                </Link>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: "center", marginTop: "2rem" }}>Cargando...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}

const styles = {
    container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff" },
    card: { background: "white", borderRadius: 10, padding: "2.5rem", width: "100%", maxWidth: 420, boxShadow: "0 2px 12px rgba(0,0,0,0.1)" },
    title: { textAlign: "center", fontSize: "1.4rem", marginBottom: "0.5rem", color: "#1a56db" },
    subtitle: { textAlign: "center", color: "#666", marginBottom: "1.5rem", fontSize: "0.9rem" },
    alert: { padding: "0.75rem 1rem", borderRadius: 6, marginBottom: "1rem", fontSize: "0.9rem" },
    alertSuccess: { background: "#d1fae5", color: "#065f46" },
    alertError: { background: "#fee2e2", color: "#991b1b" },
    formGroup: { marginBottom: "1rem" },
    label: { display: "block", fontSize: "0.9rem", fontWeight: 500, marginBottom: "0.3rem" },
    input: { width: "100%", padding: "0.6rem 0.8rem", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.95rem", boxSizing: "border-box" },
    btn: { display: "block", width: "100%", padding: "0.75rem", background: "#1a56db", color: "white", border: "none", borderRadius: 6, fontSize: "1rem", fontWeight: 600, cursor: "pointer", marginTop: "0.5rem", textAlign: "center", textDecoration: "none", boxSizing: "border-box" },
    btnDisabled: { background: "#93b4f5", cursor: "not-allowed" },
    back: { display: "block", textAlign: "center", marginTop: "1.5rem", color: "#1a56db", fontSize: "0.9rem", textDecoration: "none" },
    exitoIcon: { textAlign: "center", fontSize: "3rem", marginBottom: "1rem" },
    exitoTitle: { textAlign: "center", color: "#065f46", marginBottom: "0.5rem" },
    exitoMsg: { textAlign: "center", color: "#666", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.6 },
};