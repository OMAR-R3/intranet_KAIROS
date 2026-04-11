"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { endpoints } from "@/config/api";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ nombre_usuario: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(endpoints.login, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                },
                credentials: "include",
                body: JSON.stringify(form)
            });

            const json = await res.json();

            if (res.ok) {
                sessionStorage.setItem("usuario", JSON.stringify(json.usuario));
                sessionStorage.setItem("token", json.token);  // ← guardar token
                router.push("/dashboard");
            } else {
                setError(json.error || "Credenciales incorrectas");
            }
        } catch {
            setError("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>🔐 Intranet</h1>
                <p style={styles.subtitle}>Control de Visitas</p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Usuario</label>
                        <input
                            style={styles.input}
                            type="text"
                            value={form.nombre_usuario}
                            onChange={e => setForm({ ...form, nombre_usuario: e.target.value })}
                            required
                            autoFocus
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Contraseña</label>
                        <input
                            style={styles.input}
                            type="password"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>
                    <button style={styles.btn} type="submit" disabled={loading}>
                        {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                    </button>
                    <Link href="/forgot-password" style={styles.forgotLink}>
                        ¿Olvidaste tu contraseña?
                    </Link>
                </form>
            </div>
        </div>
    );
}

const styles = {
    container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff" },
    card: { background: "white", borderRadius: 10, padding: "2.5rem", width: "100%", maxWidth: 380, boxShadow: "0 2px 12px rgba(0,0,0,0.1)" },
    title: { textAlign: "center", fontSize: "1.5rem", marginBottom: "0.25rem", color: "#1a56db" },
    subtitle: { textAlign: "center", color: "#888", marginBottom: "1.5rem", fontSize: "0.9rem" },
    formGroup: { marginBottom: "1rem" },
    label: { display: "block", fontSize: "0.9rem", fontWeight: 500, marginBottom: "0.3rem" },
    input: { width: "100%", padding: "0.6rem 0.8rem", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.95rem", boxSizing: "border-box" },
    btn: { width: "100%", padding: "0.75rem", background: "#1a56db", color: "white", border: "none", borderRadius: 6, fontSize: "1rem", fontWeight: 600, cursor: "pointer", marginTop: "0.5rem" },
    error: { background: "#fee2e2", color: "#991b1b", padding: "0.75rem", borderRadius: 6, marginBottom: "1rem", fontSize: "0.9rem" },
    forgotLink: { display: "block", textAlign: "center", marginTop: "1rem", color: "#1a56db", fontSize: "0.85rem", textDecoration: "none" },
};