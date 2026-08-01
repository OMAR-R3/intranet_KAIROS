import { test, expect } from "@playwright/test";

const ADMIN_USER = process.env.TEST_ADMIN_USER;
const ADMIN_PASS = process.env.TEST_ADMIN_PASS;

test.describe("Login del intranet (integración E2E)", () => {
    test.beforeEach(() => {
        if (!ADMIN_USER || !ADMIN_PASS) {
            throw new Error(
                "Faltan TEST_ADMIN_USER / TEST_ADMIN_PASS en .env.test — revisa el archivo antes de correr las pruebas."
            );
        }
    });

    test("un administrador puede iniciar sesión y llega al dashboard", async ({ page }) => {
        await page.goto("/login");

        await expect(page.getByRole("heading", { name: "🔐 Intranet" })).toBeVisible();

        // Los inputs no tienen id/name; se ubican por tipo, en el orden en que aparecen en el form.
        const usuarioInput = page.locator('input[type="text"]');
        const passwordInput = page.locator('input[type="password"]');

        await usuarioInput.fill(ADMIN_USER);
        await passwordInput.fill(ADMIN_PASS);

        await page.getByRole("button", { name: "Iniciar sesión" }).click();

        // Confirma la redirección real al dashboard (comportamiento de negocio, no solo la URL)
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    });

    test("credenciales incorrectas muestran mensaje de error y no redirige", async ({ page }) => {
        await page.goto("/login");

        await page.locator('input[type="text"]').fill("usuario_que_no_existe");
        await page.locator('input[type="password"]').fill("password_incorrecto_123");
        await page.getByRole("button", { name: "Iniciar sesión" }).click();

        // El componente muestra el error dentro de un div con el texto que venga del backend
        await expect(page.getByText(/incorrecta|error/i)).toBeVisible({ timeout: 10_000 });
        await expect(page).toHaveURL(/\/login/);
    });
});