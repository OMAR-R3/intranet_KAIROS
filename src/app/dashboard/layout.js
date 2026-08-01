"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { endpoints } from "@/config/api";


// Decodifica el JWT sin librería externa
function decodeToken(token) {
    try {
        const payload = token.split(".")[1];
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [usuario, setUsuario] = useState(null);
    const [tiempoRestante, setTiempoRestante] = useState("");
    const [avisoExpiracion, setAvisoExpiracion] = useState(false);

    const intervaloRef = useRef(null);

    useEffect(() => {
        const data = sessionStorage.getItem("usuario");
        const token = sessionStorage.getItem("token");

        if (!data || !token) {
            router.push("/login");
            return;
        }

        setUsuario(JSON.parse(data));

        let decoded = decodeToken(token);
        if (!decoded) {
            sessionStorage.clear();
            router.push("/login");
            return;
        }

        const actualizarTiempo = async () => {
            const ahora = Math.floor(Date.now() / 1000);
            const segundosRestantes = decoded.exp - ahora;

            if (segundosRestantes <= 0) {
                clearInterval(intervaloRef.current);
                sessionStorage.clear();
                window.location.href = "/login";
                return;
            }

            // Renovar token automáticamente cuando queden menos de 30 minutos
            if (segundosRestantes <= 1800 && segundosRestantes > 1795) {
                try {
                    const res = await fetch(endpoints.refresh, {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "ngrok-skip-browser-warning": "true",
                            "Authorization": `Bearer ${sessionStorage.getItem("token")}`
                        }
                    });
                    if (res.ok) {
                        const json = await res.json();
                        sessionStorage.setItem("token", json.token);
                        // Actualizar decoded con el nuevo token
                        decoded = decodeToken(json.token);
                        console.log("Token renovado automáticamente");
                    }
                } catch {
                    console.error("Error renovando token");
                }
            }

            const horas = Math.floor(segundosRestantes / 3600);
            const minutos = Math.floor((segundosRestantes % 3600) / 60);
            const segundos = segundosRestantes % 60;

            if (horas > 0) {
                setTiempoRestante(`${horas}h ${minutos}m`);
            } else if (minutos > 0) {
                setTiempoRestante(`${minutos}m ${segundos}s`);
            } else {
                setTiempoRestante(`${segundos}s`);
            }

            setAvisoExpiracion(segundosRestantes <= 600 /*99999*/);
        };
        // Ejecutar inmediatamente
        actualizarTiempo();

        // Luego cada segundo
        intervaloRef.current = setInterval(actualizarTiempo, 1000);

        return () => clearInterval(intervaloRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogout = async () => {
        await fetch(endpoints.logout, {
            method: "POST",
            credentials: "include",
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        sessionStorage.removeItem("usuario");
        sessionStorage.removeItem("token");
        router.push("/login");
    };

    const navItems = [
        { href: "/dashboard", label: "📋 Visitas", roles: ["administrador", "recepcionista", "guardia"] },
        { href: "/dashboard/validate", label: "📷 Validar QR", roles: ["administrador", "recepcionista", "guardia"] },
        { href: "/dashboard/departments", label: "🏢 Departamentos", roles: ["administrador"] },
        { href: "/dashboard/users", label: "👥 Usuarios", roles: ["administrador"] },
        { href: "/dashboard/logs", label: "🧾 Logs", roles: ["administrador"] },
    ];

    if (!usuario) return null;

    return (
        <div style={styles.wrapper}>
            <aside style={styles.sidebar}>
                <div style={styles.sidebarHeader}>
                    <p style={styles.sidebarTitle}>Control de Visitas</p>
                    <p style={styles.sidebarUser}>{usuario.nombre}</p>
                    <span style={styles.badge}>{usuario.rol}</span>
                    {usuario.dispositivo && (
                        <p style={styles.dispositivo}>
                            💻 {usuario.dispositivo}
                        </p>
                    )}
                </div>
                <nav>
                    {navItems
                        .filter(item => item.roles.includes(usuario.rol))
                        .map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    ...styles.navLink,
                                    ...(pathname === item.href ? styles.navLinkActive : {})
                                }}
                            >
                                {item.label}
                            </Link>
                        ))
                    }
                </nav>

                {/* Indicador de sesión */}
                <div style={{
                    ...styles.sessionInfo,
                    ...(avisoExpiracion ? styles.sessionWarning : {})
                }}>
                    <p style={styles.sessionLabel}>
                        {avisoExpiracion ? "⚠️ Sesión por expirar" : "🕐 Sesión activa"}
                    </p>
                    <p style={styles.sessionTime}>{tiempoRestante}</p>
                </div>

                <button onClick={handleLogout} style={styles.logoutBtn}>
                    🚪 Cerrar sesión
                </button>
            </aside>
            <main style={styles.main}>
                {/* Aviso flotante cuando queden 10 minutos */}
                {avisoExpiracion && (
                    <div style={styles.warningBanner}>
                        ⚠️ Tu sesión expirará en menos de 10 minutos. Guarda tu trabajo.
                    </div>
                )}
                {children}
            </main>
        </div>
    );
}

const styles = {
    wrapper: { display: "flex", minHeight: "100vh" },
    sidebar: { width: 220, background: "#1a56db", color: "white", display: "flex", flexDirection: "column", padding: "1.5rem 0" },
    sidebarHeader: { padding: "0 1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.2)" },
    sidebarTitle: { fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.5rem" },
    sidebarUser: { fontSize: "0.85rem", opacity: 0.9, marginBottom: "0.25rem" },
    badge: { background: "rgba(255,255,255,0.2)", padding: "0.15rem 0.5rem", borderRadius: 999, fontSize: "0.75rem" },
    navLink: { display: "block", padding: "0.75rem 1.25rem", color: "white", textDecoration: "none", fontSize: "0.9rem", opacity: 0.85 },
    navLinkActive: { background: "rgba(255,255,255,0.15)", opacity: 1, fontWeight: 600 },
    sessionInfo: { margin: "auto 1.25rem 0.5rem", padding: "0.6rem 0.75rem", background: "rgba(255,255,255,0.1)", borderRadius: 6 },
    sessionWarning: { background: "rgba(255,165,0,0.3)", border: "1px solid rgba(255,165,0,0.5)" },
    sessionLabel: { fontSize: "0.75rem", opacity: 0.9, margin: 0, marginBottom: "0.2rem" },
    sessionTime: { fontSize: "1rem", fontWeight: 700, margin: 0 },
    logoutBtn: { margin: "0.5rem 1.25rem 0", padding: "0.6rem", background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem" },
    main: { flex: 1, padding: "2rem", overflow: "auto" },
    warningBanner: { background: "#fef3c7", color: "#92400e", padding: "0.75rem 1rem", borderRadius: 6, marginBottom: "1.5rem", fontSize: "0.9rem", border: "1px solid #f59e0b" },
    dispositivo: { fontSize: "0.75rem", opacity: 0.75, margin: "0.4rem 0 0", fontStyle: "italic" }
};  