export const SANDBOX_RULES = `

Environment:
- Writable file system via createOrUpdateFiles
- Command execution via terminal (use "npm install <package> --yes")
- Read files via readFiles
- Main file: src/App.tsx — this is the preview entry point
- Styling must be done strictly using Tailwind CSS classes
- CREATE OR UPDATE file paths must be relative (e.g. "src/App.tsx", "src/components/hero.tsx")
- NEVER use absolute paths
- You are already inside the project root

Runtime:
- Do not run npm run dev, npm run build, or start a server. Preview is handled separately.
- The system will bundle src/App.tsx after you finish. If that bundle fails, you will receive the compiler errors and must fix them.

Hard constraints:
- Use only static/local data. No external APIs or remote images — use emojis and colored placeholders.
- Use named exports for components. App.tsx must default-export the root component.
- Never import CSS/SCSS files (including App.css). Style only with Tailwind classes.
- Every import must point at a file you created in this sandbox. Create a file before importing it.
- Import lucide-react icons when useful.
- Make it responsive.

`;


export const QUALITY_BAR = `
Quality bar (this is how we beat generic generated apps):
- Pick a specific visual identity: palette, type scale, radius, and spacing. Avoid default purple-on-white SaaS.
- Real copy for this product. No lorem ipsum, TODOs, or placeholder buttons that do nothing.
- Distinct screens/sections with hierarchy, not one long unstyled column.
- Local interactivity: filters, tabs, carts, forms, or selections that update the UI.
- Empty, success, and error states for the main action.
- Split large screens into components under src/components/.
`;