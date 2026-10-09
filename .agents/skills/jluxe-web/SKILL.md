---
name: jluxe-web
description: Work on the existing JLUXE website while preserving its approved content, four-service hierarchy, established design, and requested scope.
---

# JLUXE Website

Use this skill for changes to the JLUXE website in this repository. JLUXE is an existing website; preserve its implementation and identity unless the user explicitly requests otherwise.

## Service structure

JLUXE has exactly four primary service categories:

1. Real Estate
2. Recruitment & Staffing
3. Business Solutions
4. Training & Consulting

Keep these as the only top-level services throughout navigation, pages, cards, headings, content, breadcrumbs, CTAs, and future UI. Offerings such as Sales, Marketing, CRM, Banking, Channel Partner Services, Corporate Training, and College Training belong under the appropriate category; do not present them as primary services or invent new categories.

## Existing implementation and scope

Before editing, inspect the current page structure, relevant components, styling, effects, and Git status and branch. Reuse existing components where practical, and do not overwrite user changes. Work page by page: identify the requested page and section, make the smallest change that satisfies the request, and preserve everything unrelated.

Do not redesign or replace layouts, navigation, cards, visual systems, fonts, animations, spacing, content, or site structure unless explicitly requested. Do not introduce a UI framework, refactor unrelated code, or expand the task scope. If asked to change one section, change only that section. When uncertain, preserve the current implementation.

## Design and content

Preserve JLUXE's premium, modern, editorial, professional, clean, sophisticated, restrained visual direction, including its viridian green and ivory identity. Avoid generic SaaS styling, excessive rounded cards or gradients, luxury clichés, childish visuals, excessive glassmorphism, visual noise, and template-like layouts.

Use approved JLUXE content and terminology. Do not invent services, projects, clients, locations, prices, statistics, certifications, or business claims, and do not silently alter approved meaning. For unconfirmed content, use a clear placeholder.

## Components, dependencies, and responsive behavior

Check for an existing component before creating one; reuse or extend it when practical while preserving its styles and behavior. Prefer the existing stack and do not add packages unless necessary and justified.

Requested UI changes must work on desktop, tablet, and mobile. For interactive elements, support click and tap, semantic HTML where practical, keyboard use, visible focus, readable text, and reduced-motion behavior consistent with the existing site. Do not rely only on hover.

## Verification and Git safety

Preserve existing user changes. Never reset user changes, force-push, delete branches, merge branches, commit, or deploy unless explicitly requested. After implementation, inspect the diff and verify that only relevant files changed. Verify the requested behavior and affected page; check responsive behavior and obvious build, runtime, or console errors when relevant. Do not claim checks that were not performed, and do not fix unrelated issues.

## Working with design skills

The generic frontend-design skill may inform design expertise when relevant, but it does not authorize a redesign. The existing design and the user's explicit request take priority over generic design suggestions.

## Completion summary

Report briefly what changed, which files changed, what verification was performed, whether unrelated areas were left untouched, and any unresolved issue. Do not claim deployment or testing that did not happen.
