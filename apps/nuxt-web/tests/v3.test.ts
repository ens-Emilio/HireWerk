/**
 * Teste das decisões puras da v3 — sem framework (node --test).
 * Roda com: node --experimental-strip-types --test app/lib/**\/*.test.ts
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { decideMerge } from "../app/lib/sync/merge.ts";
import { tokenize } from "../app/lib/ats.ts";
import { diffResumeData } from "../app/lib/versioning/diff.ts";
import { lintResume } from "../app/lib/lint.ts";

/** Stub de tradução: devolve a chave, o teste só olha ids/severidade. */
const t = (key: string) => key;
import { generateCoverLetter } from "../app/lib/coverletter.ts";
import { fromJsonResume, toJsonResume, looksLikeJsonResume } from "../app/lib/export/jsonresume.ts";

const T1 = "2026-01-01T00:00:00.000Z";
const T2 = "2026-02-01T00:00:00.000Z";
const T3 = "2026-03-01T00:00:00.000Z";

/* ============ sync merge ============ */

test("merge: doc só no servidor é aceito", () => {
    assert.equal(decideMerge({ local: null, remote: { updatedAt: T1 }, since: null }), "take-remote");
});

test("merge: só o local mudou → mantém local", () => {
    assert.equal(decideMerge({ local: { updatedAt: T3 }, remote: { updatedAt: T1 }, since: T2 }), "keep-local");
});

test("merge: só o remoto mudou → aceita remoto", () => {
    assert.equal(decideMerge({ local: { updatedAt: T1 }, remote: { updatedAt: T3 }, since: T2 }), "take-remote");
});

test("merge: os dois mudaram → conflito, nada é sobrescrito", () => {
    assert.equal(decideMerge({ local: { updatedAt: T3 }, remote: { updatedAt: T2 }, since: T1 }), "conflict");
});

test("merge: mesmo timestamp → mantém local (sem escrita)", () => {
    assert.equal(decideMerge({ local: { updatedAt: T2 }, remote: { updatedAt: T2 }, since: T1 }), "keep-local");
});

test("merge: primeiro sync sem histórico cai em LWW", () => {
    assert.equal(decideMerge({ local: { updatedAt: T1 }, remote: { updatedAt: T3 }, since: null }), "take-remote");
});

/* ============ ATS tokenizer ============ */

test("tokenize remove pontuação de fim de frase", () => {
    const tokens = tokenize("produto digital. requisitos, prototipagem!");
    assert.ok(tokens.includes("digital"));
    assert.ok(!tokens.includes("digital."));
    assert.ok(!tokens.includes("requisitos"));
});

test("tokenize preserva pontuação interna", () => {
    const tokens = tokenize("Node.js e C#");
    assert.ok(tokens.includes("node.js"));
    assert.ok(tokens.includes("c#"));
});

/* ============ diff ============ */

test("diff aponta campo alterado com rótulo", () => {
    const before = { name: "Ana", summary: "antigo" };
    const after = { name: "Ana", summary: "novo" };
    const changes = diffResumeData(before, after);
    assert.equal(changes.length, 1);
    assert.equal(changes[0]!.path, "summary");
    assert.equal(changes[0]!.before, "antigo");
    assert.equal(changes[0]!.after, "novo");
});

test("diff detecta item de array adicionado", () => {
    const changes = diffResumeData(
        { skills: ["Figma"] },
        { skills: ["Figma", "Rive"] },
    );
    assert.equal(changes.length, 1);
    assert.equal(changes[0]!.path, "skills[1]");
    assert.equal(changes[0]!.after, "Rive");
});

/* ============ lint ============ */

test("lint flagra verbo fraco e falta de métrica", () => {
    const findings = lintResume({
        name: "Ana", headline: "Designer", summary: "", location: "", photo: null,
        emails: [], phones: [], links: [], education: [], skills: [], softSkills: [],
        languages: [], projects: [], certifications: [], volunteer: [],
        birthDate: "", maritalStatus: "", salaryExpectation: "", showOptionalBR: false,
        experiences: [{ role: "Designer", company: "Acme", period: "", description: "Responsável por manter o design system atualizado todos os dias" }],
    }, t);
    assert.ok(findings.some(f => f.id.startsWith("weak:")));
    assert.ok(findings.some(f => f.id.startsWith("metric:")));
});

test("lint não flagra texto com métrica e verbo de ação", () => {
    const findings = lintResume({
        name: "Ana", headline: "Designer", summary: "", location: "", photo: null,
        emails: [], phones: [], links: [], education: [], skills: [], softSkills: [],
        languages: [], projects: [], certifications: [], volunteer: [],
        birthDate: "", maritalStatus: "", salaryExpectation: "", showOptionalBR: false,
        experiences: [{ role: "Designer", company: "Acme", period: "", description: "Reduzi o tempo de onboarding em 40% em três meses." }],
    }, t);
    assert.equal(findings.filter(f => f.severity === "warn").length, 0);
});

/* ============ carta ============ */

test("carta usa empresa, vaga e resumo existentes", () => {
    const body = generateCoverLetter({
        data: {
            name: "Ana Costa", headline: "Product Designer", location: "", photo: null,
            summary: "Designer com 8 anos em fintechs.", emails: [], phones: [], links: [],
            experiences: [{ role: "Designer", company: "Acme", period: "", description: "Liderei o redesign do app." }],
            education: [], skills: ["Figma"], softSkills: [], languages: [], projects: [],
            certifications: [], volunteer: [], birthDate: "", maritalStatus: "",
            salaryExpectation: "", showOptionalBR: false,
        },
        company: "Nubank", role: "Designer Sênior", tone: "formal", matched: ["figma"],
    });
    assert.ok(body.includes("Nubank"));
    assert.ok(body.includes("Designer Sênior"));
    assert.ok(body.includes("Ana Costa"));
    assert.ok(body.includes("figma"));
});

test("carta vazia quando não há nome nem título", () => {
    const body = generateCoverLetter({
        data: {
            name: "", headline: "", summary: "", location: "", photo: null,
            emails: [], phones: [], links: [], experiences: [], education: [], skills: [],
            softSkills: [], languages: [], projects: [], certifications: [], volunteer: [],
            birthDate: "", maritalStatus: "", salaryExpectation: "", showOptionalBR: false,
        },
        company: "X", role: "Y", tone: "formal",
    });
    assert.equal(body, "");
});

/* ============ JSON Resume ============ */

test("JSON Resume: round-trip preserva nome, vaga e skills", () => {
    const doc = {
        id: "11111111-1111-4111-8111-111111111111",
        title: "CV", kind: "resume" as const, templateId: "classic",
        style: { accentColor: "", fontScale: "normal" as const, density: "normal" as const, paper: "a4" as const, footerText: "", iconTheme: "outline" as const, sectionOrder: [] },
        data: {
            name: "Ana Costa", headline: "Designer", summary: "Resumo.", location: "Recife",
            photo: null, emails: [{ value: "ana@x.com", label: "pessoal" as const, type: "email" as const }],
            phones: [], links: [], experiences: [{ role: "Designer", company: "Acme", period: "2020 — 2024", description: "Fiz X." }],
            education: [{ course: "Design", institution: "UFPE" }], skills: ["Figma"], softSkills: [],
            languages: [{ name: "Inglês", level: "C1" as const }], projects: [], certifications: [], volunteer: [],
            birthDate: "", maritalStatus: "", salaryExpectation: "", showOptionalBR: false,
        },
        coverLetter: { body: "", company: "", role: "", tone: "formal" as const },
        jobDescription: "", atsHistory: [], locale: "pt-BR", version: 1,
        tags: [], pinned: false, jobTitle: "", createdAt: T1, updatedAt: T1, deletedAt: null,
    };
    const jr = toJsonResume(doc);
    assert.ok(looksLikeJsonResume(jr));
    const back = fromJsonResume(jr);
    assert.equal(back.name, "Ana Costa");
    assert.equal(back.experiences?.[0]?.company, "Acme");
    assert.equal((back.languages?.[0] as { level?: string } | undefined)?.level, "C1");
    assert.deepEqual(back.skills, ["Figma"]);
});

test("JSON Resume: fluency textual vira CEFR", () => {
    const back = fromJsonResume({ languages: [{ language: "Espanhol", fluency: "native" }] });
    assert.equal((back.languages?.[0] as { level?: string } | undefined)?.level, "nativo");
});

test("backup do HireWerk não é confundido com JSON Resume", () => {
    assert.equal(looksLikeJsonResume({ app: "hirewerk", resumes: [] }), false);
});
