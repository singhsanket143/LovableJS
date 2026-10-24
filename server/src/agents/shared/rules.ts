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

Icons (lucide-react only):
- You may import ONLY from "lucide-react" using icons that exist in the Lucide set (generic UI icons).
- Do NOT import brand, social, or trademark icons — they are NOT in lucide-react and will break the preview bundle. Never use: Instagram, Facebook, Twitter, X (logo), YouTube, LinkedIn, TikTok, GitHub (logo), Apple, Google, Amazon, Discord, Slack, etc.
- For footer/social links use generic icons instead, e.g. Share2, Link, Globe, Mail, ExternalLink, or text labels ("Instagram", "X") with no logo icon.
- If a fix task mentions "No matching export" for lucide-react, replace those imports with valid generic icons from the same package — do not add another icon library unless the task explicitly allows npm install.
- Prefer a small set of icons you reuse; avoid importing dozens of rare icon names.

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