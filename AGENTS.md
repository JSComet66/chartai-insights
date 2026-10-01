<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Chart analysis runs in `runAnalysis` server fn (src/lib/analysis.functions.ts) delegates to src/lib/external-analysis/ (service validates + applies rules.ts, provider.server.ts selects an ExternalAnalysisProvider); no provider yet, so no AI network call. Add a provider there, key via server env EXTERNAL_AI_API_KEY only.
- Chart images live in private `charts` bucket under `<user_id>/…`; UI uses signed URLs.
- Technical engine (src/lib/technical-engine/) runs client-side on the chart image via canvas, deterministic, recomputed on view and never stored; kept separate from AI result so both can be compared.
