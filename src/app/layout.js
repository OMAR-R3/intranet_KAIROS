export const metadata = {
    title: "Intranet — Control de Visitas",
};

export default function RootLayout({ children }) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f5f5f5" }}>
                {children}
            </body>
        </html>
    );
}