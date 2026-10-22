import { test, expect, Page } from "@playwright/test";

const password = process.env.E2E_PASSWORD!;
const studentEmail = process.env.E2E_STUDENT_EMAIL!;
const adminEmail = process.env.E2E_ADMIN_EMAIL!;
const mentorEmail = process.env.E2E_MENTOR_EMAIL!;
const superEmail = process.env.E2E_SUPER_EMAIL!;

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /Hello,/ })).toBeVisible();
}

test("auth screens validate inputs, show password, and stay responsive", async ({ page }) => {
  await page.goto("/login");
  await page.screenshot({ path: "artifacts/login-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("Please enter your password.")).toBeVisible();
  await page.getByLabel("Email address", { exact: true }).fill(studentEmail);
  await page.getByLabel("Password", { exact: true }).fill("IncorrectPassword!");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Sign in to your workspace" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Invalid email or password" })).toBeVisible();
  await page.getByRole("link", { name: "Create an account" }).click();
  await page.screenshot({ path: "artifacts/register-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: /Make room/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/register-mobile.png", fullPage: true });
});

test("student can filter, paginate, submit, see duplicate errors, and sign out", async ({ page }) => {
  await signIn(page, studentEmail);
  await expect(page.getByRole("button", { name: /^Your projects: 6\./ })).toBeVisible();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(6);
  const sidebar = page.getByRole("complementary", { name: "Workspace sidebar" });
  await expect(page.getByRole("button", { name: "Collapse sidebar" })).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toHaveAttribute("aria-expanded", "false");
  await expect(sidebar.locator(".nav-link-label").first()).toBeHidden();
  await expect.poll(async () => Math.round((await sidebar.boundingBox())!.width)).toBe(78);
  await page.screenshot({ path: "artifacts/sidebar-collapsed.png", fullPage: true });
  await sidebar.getByRole("link", { name: "My projects", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/);
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  await sidebar.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("button", { name: "Expand sidebar" }).click();
  await expect(sidebar.locator(".nav-link-label").first()).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(/roboto/i);
  await page.screenshot({ path: "artifacts/student-dashboard.png", fullPage: true });
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Next page", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Approved", exact: true }).click();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(3);
  await expect(page.getByRole("table").getByText("Approved", { exact: true })).toHaveCount(2);
  await page.getByRole("link", { name: "Submit a project", exact: true }).first().click();
  await page.getByRole("button", { name: "Hand in your project" }).click();
  await expect(page.getByText("Give your project a name with at least 3 characters.")).toBeVisible();
  await page.getByLabel("Project name", { exact: true }).fill("Sunday Planner");
  await page.getByLabel("Frontend repository URL", { exact: true }).fill("https://github.com/minarahman/sunday-planner");
  await page.getByLabel("Backend repository URL", { exact: true }).fill("https://github.com/minarahman/sunday-planner-server");
  await page.getByLabel("Deployed live URL", { exact: true }).fill("https://sunday-planner.example.com");
  await page.getByLabel("Tell us about it", { exact: true }).fill("A small weekly planning app that makes room for meaningful work and time to rest.");
  await page.screenshot({ path: "artifacts/submission-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Hand in your project" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/);
  await expect(page.getByRole("button", { name: "Sunday Planner", exact: true })).toBeVisible();
  const submittedRow = page.getByRole("row").filter({ has: page.getByRole("button", { name: "Sunday Planner", exact: true }) });
  await expect(submittedRow.getByRole("link", { name: /^Frontend:/ })).toHaveCount(0);
  await expect(submittedRow.getByRole("link", { name: /^Backend:/ })).toHaveCount(0);
  await expect(submittedRow.getByRole("link", { name: /^Live project:/ })).toHaveAttribute("href", "https://sunday-planner.example.com");
  await page.getByRole("button", { name: "Sunday Planner", exact: true }).click();
  const projectDialog = page.getByRole("dialog");
  await expect(projectDialog.getByRole("link", { name: /^Backend:/ })).toContainText("minarahman/sunday-planner-server");
  expect(await projectDialog.locator(".detail-description p").evaluate(element => getComputedStyle(element).color)).toBe("rgb(23, 33, 59)");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await projectDialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/project-links-mobile.png", fullPage: false });
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/project-list-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const studentProjects = await (await page.request.get("/api/workspace/projects/mine")).json();
  const ownProjectId = studentProjects.data.projects.find((project: { name: string }) => project.name === "Sunday Planner").id;
  const forbiddenMarks = await page.request.patch(`/api/workspace/projects/${ownProjectId}/marks`, { headers: { Origin: "http://localhost:3010" }, data: { score: 100 } });
  expect(forbiddenMarks.status()).toBe(403);
  const ownStats = await (await page.request.get("/api/workspace/projects/mine/stats")).json();
  expect(ownStats.data.averageScore).toBeNull();
  expect(ownStats.data.markedProjects).toBe(0);
  const forbidden = await page.request.get("/api/workspace/projects/stats");
  expect(forbidden.status()).toBe(403);
  await page.getByRole("link", { name: "Submit a project", exact: true }).first().click();
  await page.getByLabel("Project name", { exact: true }).fill("Sunday Planner Duplicate");
  await page.getByLabel("Frontend repository URL", { exact: true }).fill("http://www.github.com/MINARAHMAN/sunday-planner.git");
  await page.getByLabel("Backend repository URL", { exact: true }).fill("https://github.com/minarahman/sunday-planner-server");
  await page.getByLabel("Deployed live URL", { exact: true }).fill("https://sunday-planner.example.com");
  await page.getByLabel("Tell us about it", { exact: true }).fill("A duplicate request should keep these details and show a useful error.");
  await page.getByRole("button", { name: "Hand in your project" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "already been submitted" })).toBeVisible();
  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue("Sunday Planner Duplicate");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  const session = (await page.context().cookies()).find(cookie => cookie.name === "handin_session");
  expect(session).toBeUndefined();
});

test("new students can register and receive an HttpOnly session", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Your name", { exact: true }).fill("Nadia Karim");
  await page.getByLabel("Email address", { exact: true }).fill("nadia@handin.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create your account", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Your first project belongs here." })).toBeVisible();
  const session = (await page.context().cookies()).find(cookie => cookie.name === "handin_session");
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Lax");
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test("mentor can approve, reject, and view server-filtered results", async ({ page }) => {
  await signIn(page, mentorEmail);
  await expect(page.getByRole("link", { name: "Manage users", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Total submissions: 7\./ })).toBeVisible();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(6);
  await page.screenshot({ path: "artifacts/mentor-dashboard.png", fullPage: true });
  await page.getByRole("button", { name: "Pending", exact: true }).click();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(5);
  await page.getByRole("button", { name: "Approve Field Notes", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Field Notes", exact: true })).toBeVisible();
  await dialog.getByLabel("A note for the student", { exact: false }).fill("A focused idea, beautifully considered. Well done.");
  await page.screenshot({ path: "artifacts/review-dialog.png", fullPage: true });
  await dialog.getByLabel("Obtained marks", { exact: true }).fill("85");
  await dialog.getByRole("button", { name: "Confirm approval", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: /^Approved: 3\./ })).toBeVisible();
  await expect(page.getByRole("table").getByRole("button", { name: "Field Notes", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Reject Focus Room", exact: true }).click();
  await page.getByRole("dialog").getByLabel("A note for the student", { exact: false }).fill("Please add keyboard navigation and a clear empty state.");
  await page.getByRole("dialog").getByLabel("Obtained marks", { exact: true }).fill("45");
  await page.getByRole("button", { name: "Confirm rejection", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("button", { name: "Rejected", exact: true }).click();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(3);
  await page.getByRole("button", { name: "Focus Room", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Please add keyboard navigation");
  await expect(page.getByRole("button", { name: "Confirm rejection" })).toHaveCount(0);
  await expect(page.getByRole("dialog").locator(".score-detail")).toContainText("45");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: "Marks overview" })).toHaveCount(0);
  await page.getByRole("button", { name: "Approved", exact: true }).click();
  await page.getByRole("button", { name: "Field Notes", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Obtained marks", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Update marks", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("status", { name: "Average marks" })).toHaveCount(0);

});

test("mobile navigation, project details and submission layout work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, studentEmail);
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Your projects: 7\./ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/student-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.locator("#workspace-sidebar")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#workspace-sidebar")).toBeHidden();
  await expect(page.getByRole("button", { name: "Open navigation" })).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Submit a project", exact: true }).first().click();
  await expect(page.getByLabel("Project name", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/submission-mobile.png", fullPage: true });
});

test("protected routes reject missing or expired sessions", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await page.context().addCookies([{ name: "handin_session", value: "invalid-token", url: "http://localhost:3010" }]);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  const response = await page.request.post("/api/session", { data: { accessToken: "fake" } });
  expect(response.status()).toBe(403);
});


test("dark mode persists and marks are visible to the student on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, studentEmail);
  await expect(page.getByRole("status", { name: "Average marks" })).toHaveText("22.5%");
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("heading", { name: /Hello,/ })).toBeVisible();
  await expect(page.getByRole("status", { name: "Average marks" })).toHaveText("22.5%");
  await expect(page.getByRole("button", { name: "Field Notes", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/dashboard-dark-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Field Notes", exact: true }).click();
  await expect(page.getByRole("dialog").locator(".score-detail strong")).toHaveText("0");
  expect(await page.getByRole("dialog").locator(".detail-description p").evaluate(element => getComputedStyle(element).color)).toBe("rgb(241, 245, 255)");
  expect(await page.getByRole("dialog").locator("[data-slot=dialog-description]").evaluate(element => getComputedStyle(element).color)).toBe("rgb(180, 193, 217)");
  await expect(page.getByRole("button", { name: "Update marks", exact: true })).toHaveCount(0);
  await page.screenshot({ path: "artifacts/project-dark-mobile.png" });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});


test("admin and super admin can edit feedback and assign marks without dashboard averages", async ({ page }) => {
  for (const email of [adminEmail, superEmail]) {
    await signIn(page, email);
    await expect(page.getByRole("region", { name: "Marks overview" })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: "Marks", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Field Notes", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator(".score-detail")).toHaveCount(0);
    await expect(dialog.getByLabel("Obtained marks", { exact: true })).toBeVisible();
    const feedback = dialog.getByRole("region", { name: "Mentor feedback", exact: true });
    await expect(feedback).not.toContainText("Super Admin");
    expect(await dialog.evaluate(element => !!(element.querySelector(".mentor-feedback")!.compareDocumentPosition(element.querySelector(".detail-description")!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    await dialog.getByRole("button", { name: "Edit feedback", exact: true }).click();
    const editor = dialog.getByRole("textbox", { name: "A note for the student", exact: true });
    await editor.fill("");
    await editor.pressSequentially("Fix navigation. Update the README.");
    await editor.press("ControlOrMeta+a");
    await dialog.getByRole("button", { name: "Normal text", exact: true }).click();
    await dialog.getByRole("button", { name: "Underline", exact: true }).click();
    await dialog.getByRole("button", { name: "Text color: red", exact: true }).click();
    await dialog.getByRole("button", { name: "Save feedback", exact: true }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole("button", { name: "Field Notes", exact: true }).click();
    const text = page.getByRole("dialog").locator(".mentor-feedback-content span").first();
    await expect(text).toHaveText("Fix navigation. Update the README.");
    await expect(text).toHaveCSS("font-weight", "400");
    await expect(text).toHaveCSS("text-decoration-line", "underline");
    await expect(text).toHaveCSS("color", "rgb(190, 18, 60)");
    await page.getByRole("dialog").getByLabel("Total marks", { exact: true }).fill(email === adminEmail ? "60" : "50");
    await page.getByRole("dialog").getByLabel("Obtained marks", { exact: true }).fill(email === adminEmail ? "45" : "40");
    await page.getByRole("button", { name: "Update marks", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    const result = await (await page.request.get("/api/workspace/projects?limit=100")).json();
    const marked = result.data.projects.find((project: { name: string }) => project.name === "Field Notes");
    expect(marked.score).toBe(email === adminEmail ? 45 : 40);
    expect(marked.scoreOutOf).toBe(email === adminEmail ? 60 : 50);

    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
  }
});


test("students see custom project totals and a normalized average", async ({ page }) => {
  await signIn(page, studentEmail);
  await expect(page.getByRole("status", { name: "Average marks" })).toHaveText("62.5%");
  const row = page.getByRole("row").filter({ has: page.getByRole("button", { name: "Field Notes", exact: true }) });
  await expect(row.locator(".project-score")).toHaveText("40 / 50");
  await page.getByRole("button", { name: "Field Notes", exact: true }).click();
  await expect(page.getByRole("dialog").locator(".score-detail")).toContainText("40 / 50");
  await expect(page.getByRole("dialog").getByLabel("Total marks", { exact: true })).toHaveCount(0);
});


test("admin can edit and delete projects and manage user accounts", async ({ page }) => {
  await signIn(page, adminEmail);
  await page.getByRole("button", { name: "Edit Field Notes", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Project name", { exact: true }).fill("Field Notes Admin Edited");
  await dialog.getByLabel("Project status", { exact: true }).selectOption("REJECTED");
  await dialog.getByLabel("Total marks", { exact: true }).fill("30");
  await dialog.getByLabel("Obtained marks (optional)", { exact: true }).fill("20");
  await dialog.getByRole("textbox", { name: "A note for the student", exact: true }).fill("Please improve the documentation and keyboard navigation.");
  await dialog.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: "Field Notes Admin Edited", exact: true }).click();
  await expect(page.getByRole("dialog").locator(".mentor-feedback-content")).toContainText("Please improve the documentation");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Delete Field Notes Admin Edited", exact: true }).click();
  await page.getByRole("button", { name: "Delete permanently", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("button", { name: "Field Notes Admin Edited", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Manage users", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Manage users", exact: true })).toBeVisible();
  await page.getByLabel("Search users", { exact: true }).fill("nadia@handin.test");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("button", { name: "Edit user nadia@handin.test", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Name", { exact: true }).fill("Nadia Updated");
  await page.getByRole("dialog").getByLabel("Account role", { exact: true }).selectOption("MENTOR");
  await page.getByRole("dialog").getByLabel("Account status", { exact: true }).selectOption("BLOCKED");
  await page.getByRole("button", { name: "Save user", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("table")).toContainText("Nadia Updated");
  await expect(page.getByRole("table")).toContainText("Blocked");
  await page.screenshot({ path: "artifacts/admin-user-management.png", fullPage: true });
  await page.getByRole("button", { name: "Delete user nadia@handin.test", exact: true }).click();
  await page.getByRole("button", { name: "Delete account", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText("No accounts match your search.")).toBeVisible();
});
