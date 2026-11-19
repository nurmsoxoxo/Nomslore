# NOMSLORE
Next.js (static export) + Supabase. Database, RLS, storage and functions already live in your Supabase project.

## Deploy on Netlify
1. Push this folder to a GitHub repo, then Netlify > Add new site > Import from Git.
2. Build command `npm run build`, publish directory `out` (already set in netlify.toml, along with the public Supabase URL and publishable key).
3. After deploy, Supabase > Authentication > URL Configuration: set Site URL and Redirect URLs to your Netlify URL.
4. Register on the site, then in the Supabase SQL editor run: `select private.provision_admin('your@email.com');`

## Run locally
`npm install && npm run dev`
