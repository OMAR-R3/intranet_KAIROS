"use client";

import { useEffect, useRef, useState } from "react";
import { endpoints } from "@/config/api";
import { fetchApi } from "@/lib/fetchApi";
import jsQR from "jsqr";

export default function ValidatePage() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const animRef = useRef(null);

    const [camaraActiva, setCamaraActiva] = useState(false);
    const [tokenManual, setTokenManual] = useState("");
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState("");
    const [validando, setValidando] = useState(false);
    const [escaneando, setEscaneando] = useState(false);

    const activarCamara = async () => {
        setError("");
        setResultado(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setCamaraActiva(true);
            setEscaneando(true);
        } catch {
            setError("No se pudo acceder a la cámara. Verifica los permisos.");
        }
    };

    const detenerCamara = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        cancelAnimationFrame(animRef.current);
        setCamaraActiva(false);
        setEscaneando(false);
    };

    const validarToken = async (token) => {
        if (validando) return;
        setValidando(true);
        setEscaneando(false);
        detenerCamara();

        try {
            const res = await fetchApi(endpoints.validateQR, {
                method: "POST",
                body: JSON.stringify({ token })
            });
            const json = await res.json();

            if (res.ok) {
                setResultado({ ok: true, data: json.data });
            } else {
                setResultado({ ok: false, msg: json.error });
            }
        } catch {
            setResultado({ ok: false, msg: "Error de conexión" });
        } finally {
            setValidando(false);
        }
    };

    // Loop de escaneo con jsQR
    useEffect(() => {
        if (!escaneando) return;

        const scan = () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas) return;

            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code?.data) {
                    validarToken(code.data);
                    return;
                }
            }
            animRef.current = requestAnimationFrame(scan);
        };

        animRef.current = requestAnimationFrame(scan);
        return () => cancelAnimationFrame(animRef.current);
    }, [escaneando]);

    // Limpiar cámara al salir
    useEffect(() => {
        return () => detenerCamara();
    }, []);

    const resetear = () => {
        setResultado(null);
        setTokenManual("");
        setError("");
    };

    const formatFecha = (iso) => new Date(iso).toLocaleDateString("es-MX", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        timeZone: "America/Mexico_City"
    });

    return (
        <div>
            <h1 style={styles.title}>📷 Validar QR de Acceso</h1>

            {!resultado ? (
                <div style={styles.grid}>
                    {/* Cámara */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitle}>Escanear con cámara</h2>
                        <p style={styles.cardDesc}>Apunta la cámara al código QR del visitante.</p>

                        <div style={styles.videoWrapper}>
                            <video
                                ref={videoRef}
                                style={{ ...styles.video, display: camaraActiva ? "block" : "none" }}
                                muted
                                playsInline
                            />
                            {!camaraActiva && (
                                <div style={styles.videoPlaceholder}>
                                    📷
                                    <span>Cámara inactiva</span>
                                </div>
                            )}
                            <canvas ref={canvasRef} style={{ display: "none" }} />
                        </div>

                        {error && <div style={styles.alertError}>{error}</div>}

                        {validando && <p style={styles.validando}>Validando QR...</p>}

                        <div style={styles.btnGroup}>
                            {!camaraActiva ? (
                                <button style={styles.btnPrimary} onClick={activarCamara}>
                                    Activar cámara
                                </button>
                            ) : (
                                <button style={styles.btnSecondary} onClick={detenerCamara}>
                                    Detener cámara
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Manual */}
                    <div style={styles.card}>
                        <h2 style={styles.cardTitle}>Ingresar token manualmente</h2>
                        <p style={styles.cardDesc}>Pega el token UUID del QR si no tienes cámara disponible.</p>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Token QR</label>
                            <input
                                style={styles.input}
                                type="text"
                                value={tokenManual}
                                onChange={e => setTokenManual(e.target.value)}
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            />
                        </div>

                        <button
                            style={styles.btnPrimary}
                            onClick={() => validarToken(tokenManual.trim())}
                            disabled={!tokenManual.trim() || validando}
                        >
                            {validando ? "Validando..." : "Validar"}
                        </button>
                    </div>
                </div>
            ) : (
                // Resultado
                <div style={styles.card}>
                    {resultado.ok ? (
                        <>
                            <div style={styles.resultHeader}>
                                <span style={styles.resultIconOk}>✅</span>
                                <div>
                                    <h2 style={{ color: "#065f46", margin: 0 }}>Acceso válido</h2>
                                    <p style={{ color: "#6b7280", margin: 0, fontSize: "0.9rem" }}>La visita está aprobada</p>
                                </div>
                            </div>
                            <div style={styles.resultGrid}>
                                <div style={styles.resultItem}>
                                    <span style={styles.resultLabel}>Visitante</span>
                                    <span style={styles.resultValue}>
                                        {resultado.data.Visitantes?.nombre} — {resultado.data.Visitantes?.correo}
                                    </span>
                                </div>
                                <div style={styles.resultItem}>
                                    <span style={styles.resultLabel}>Departamento</span>
                                    <span style={styles.resultValue}>{resultado.data.Departamentos?.nombre}</span>
                                </div>
                                <div style={styles.resultItem}>
                                    <span style={styles.resultLabel}>Fecha</span>
                                    <span style={styles.resultValue}>{formatFecha(resultado.data.fecha)}</span>
                                </div>
                                <div style={styles.resultItem}>
                                    <span style={styles.resultLabel}>Hora</span>
                                    <span style={styles.resultValue}>{resultado.data.hora_inicio}</span>
                                </div>
                                <div style={styles.resultItem}>
                                    <span style={styles.resultLabel}>Motivo</span>
                                    <span style={styles.resultValue}>{resultado.data.motivo}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={styles.resultError}>
                            <span style={styles.resultIconError}>❌</span>
                            <div>
                                <h2 style={{ color: "#991b1b", margin: 0 }}>Acceso no válido</h2>
                                <p style={{ color: "#6b7280", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>{resultado.msg}</p>
                            </div>
                        </div>
                    )}
                    <button style={{ ...styles.btnSecondary, marginTop: "1.5rem" }} onClick={resetear}>
                        🔄 Escanear otro
                    </button>
                </div>
            )}
        </div>
    );
}

const styles = {
    title: { fontSize: "1.4rem", color: "#1a56db", marginBottom: "1.5rem" },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" },
    card: { background: "white", borderRadius: 8, padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
    cardTitle: { fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem", color: "#333" },
    cardDesc: { fontSize: "0.85rem", color: "#888", marginBottom: "1rem" },
    videoWrapper: { width: "100%", aspectRatio: "4/3", background: "#f0f0f0", borderRadius: 8, overflow: "hidden", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "center" },
    video: { width: "100%", height: "100%", objectFit: "cover" },
    videoPlaceholder: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", color: "#aaa", fontSize: "3rem" },
    alertError: { background: "#fee2e2", color: "#991b1b", padding: "0.6rem 0.8rem", borderRadius: 6, fontSize: "0.85rem", marginBottom: "1rem" },
    validando: { textAlign: "center", color: "#1a56db", fontSize: "0.9rem", marginBottom: "0.5rem" },
    btnGroup: { display: "flex", gap: "0.5rem" },
    btnPrimary: { padding: "0.6rem 1.2rem", background: "#1a56db", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", width: "100%" },
    btnSecondary: { padding: "0.6rem 1.2rem", background: "white", color: "#333", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: "0.9rem" },
    formGroup: { marginBottom: "1rem" },
    label: { display: "block", fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.3rem" },
    input: { width: "100%", padding: "0.6rem 0.8rem", border: "1px solid #ddd", borderRadius: 6, fontSize: "0.9rem", boxSizing: "border-box" },
    resultHeader: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", padding: "1rem", background: "#d1fae5", borderRadius: 8 },
    resultIconOk: { fontSize: "2.5rem" },
    resultIconError: { fontSize: "2.5rem" },
    resultError: { display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", background: "#fee2e2", borderRadius: 8 },
    resultGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
    resultItem: { display: "flex", flexDirection: "column", gap: "0.2rem" },
    resultLabel: { fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#888", letterSpacing: "0.05em" },
    resultValue: { fontSize: "0.95rem", color: "#333" },
};