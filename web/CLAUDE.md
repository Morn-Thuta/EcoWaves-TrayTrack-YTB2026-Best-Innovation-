@AGENTS.md

---

# UI Design Standards — Always Apply Without Being Asked

These rules are MANDATORY for every UI change. Do not wait for the user to request them.

## Impeccable Design Principles

### Spacing — strict 4/8pt grid
- Use only Tailwind spacing steps: `p-2` (8px), `p-4` (16px), `p-6` (24px), `gap-4`, `gap-6`
- Never mix random pixel values. No `p-3` next to `p-5` without reason.
- Consistent section padding: `p-5` inside cards, `p-6` for page-level padding

### Typography hierarchy
- Page titles: `text-2xl font-black` (chef) or `text-xl font-bold` (management)
- Card titles: `text-xl font-bold` or `text-2xl font-black` for primary KPIs
- Labels: `text-xs font-semibold uppercase tracking-widest text-gray-400`
- Body: `text-sm text-gray-300`
- Never use more than 3 distinct font sizes in one component

### Colour intentionality — every colour must mean something
- Green = healthy / positive / confirmed
- Amber = warning / needs attention / approaching threshold
- Red = critical / immediate action required
- Blue = informational / notification (table alerts)
- Gray = neutral / offline / secondary content
- Never use colour purely for decoration

### Information density
- Show only what a chef needs in the next 60 seconds
- Remove labels that repeat what the visual already says
- If a number and a bar say the same thing, consider removing one

### Component consistency
- All management section headers: `flex items-center justify-between` with title left, action button right
- All action buttons: `bg-green-700 hover:bg-green-600 text-white text-sm font-semibold`
- All cards/panels: `bg-gray-900 border border-gray-800 rounded-2xl`
- All tables: `rounded-xl border border-gray-800 overflow-hidden`

---

## Motion Principles — Apply to All Interactive Elements

### Transitions
- All hover states: `transition-all duration-150` (fast, snappy)
- Level/color changes on tray cards: `transition-colors duration-700` (slow, noticeable)
- Modal/toast appear: use `transition-opacity` or slide-in with `translate-y`
- Progress bars: `transition-all duration-700 ease-out`

### Easing
- Always prefer `ease-out` for elements entering the screen
- Use `ease-in-out` for state changes within the page
- Never use linear transitions on UI elements

### Purposeful animation rules
- Tray cards going from green→amber→red should have a visible color transition (already implemented)
- New alerts (table arrival banner) should slide down from the top, not pop in
- Cook suggestion cards with `immediate` urgency: subtle `animate-pulse` on the label only
- Button press: `active:scale-95` for tactile feedback
- Loading states: `animate-pulse` on skeleton placeholders, not spinners

### Timing guidelines
- Hover: 150ms
- State change (color, border): 300–700ms
- Slide in/out: 200–300ms
- Never exceed 700ms for any transition (feels sluggish)

### Micro-interactions to always include
- Buttons: `hover:brightness-110 active:scale-95`
- Tray cards (clickable): `hover:brightness-110 hover:scale-[1.01]`
- Toggle switches: smooth thumb slide (already implemented)
- Alert dismiss: fade out on ✕ click

---

## Chef Dashboard Specific Rules
- The chef screen is read at a glance from 2–3 metres away — use large fonts
- Tray cards must be scannable in under 1 second: level badge + dish name + percentage
- COOK NOW suggestions must visually dominate — red border, large kg number
- Never add information that requires the chef to think or calculate

## Management Screen Specific Rules
- Dense but clean — more information is OK here since managers are seated
- All editable fields must have clear save/cancel affordances
- Errors must appear inline, next to the offending field
- Success states: green flash for 2 seconds, then return to normal
