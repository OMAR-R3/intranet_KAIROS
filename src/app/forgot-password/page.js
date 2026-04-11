"use client";

import { useState } from "react";
import { endpoints } from "@/config/api";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [correo, setCorreo] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        try {
            const res = await fetch(endpoints.forgotPassword, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify({ correo })
            });

            const json = await res.json();

            if (res.ok) {
                setMsg({ text: json.message, type: "success" });
                setCorreo("");
            } else {
                setMsg({ text: json.error, type: "error" });
            }
        } catch {
            setMsg({ text: "Error de conexión con el servidor", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>🔑 Recuperar contraseña</h1>
                <p style={styles.subtitle}>
                    Ingresa tu correo institucional y te enviaremos un enlace para restablecer tu contraseña.
                </p>

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
                        <label style={styles.label}>Correo electrónico</label>
                        <input
                            style={styles.input}
                            type="email"
                            value={correo}
                            onChange={e => setCorreo(e.target.value)}
                            placeholder="usuario@institucion.edu.mx"
                            required
                            autoFocus
                        />
                    </div>
                    <button
                        style={styles.btn}
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                    </button>
                </form>

                <Link href="/login" style={styles.back}>
                    ← Volver al inicio de sesión
                </Link>
            </div>
        </div>
    );
}

const styles = {
    container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff" },
    card: { background: "white", borderRadius: 10, padding: "2.5rem", width: "100%", maxWidth: 420, boxShadow: "0 2px 12px rgba(0,0,0,0.1)" },
    title: { textAlign: "center", fontSize: "1.4rem", marginBottom: "0.5rem", color: "#1a56db" },
    subtitle: { textAlign: "center", color: "#666", marginBottom: "1.5rem", fontSize: "0.9rem", lineHeight: 1.6 },
    alert: { padding: "0.75rem 1rem", borderRadius: 6, marginBottom: "1rem", fontSize: "0.9rem" },
    alertSuccess: { background: "#d1fae5", color: "#065f46" },
    alertError: { background: "#fee2e2", color: "#991b1b" },
    formGroup: { marginBottom: "1rem" },
    label: { display: "block", fontSize: "0.9rem", fontWeight: 500, marginBottom: "0.3rem" },
    input: { width: "100%", padding: "0.6rem 0.8rem", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.95rem", boxSizing: "border-box" },
    btn: { width: "100%", padding: "0.75rem", background: "#1a56db", color: "white", border: "none", borderRadius: 6, fontSize: "1rem", fontWeight: 600, cursor: "pointer", marginTop: "0.5rem" },
    back: { display: "block", textAlign: "center", marginTop: "1.5rem", color: "#1a56db", fontSize: "0.9rem", textDecoration: "none" }
};