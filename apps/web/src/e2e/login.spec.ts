import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test("abre /login e exibe campos principais", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Entrar no HireWerk/i })).toBeVisible();
    await expect(page.getByLabel(/E-mail/i)).toBeVisible();
    await expect(page.getByLabel(/Senha/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Entrar/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Criar conta/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Esqueci minha senha/i })).toBeVisible();
  });
});
