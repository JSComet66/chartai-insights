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

- Chart analysis runs in `runAnalysis` server fn (src/lib/analysis.functions.ts) delegating to src/lib/external-analysis/ (service validates + applies rules.ts, provider.server.ts composes the ExternalAnalysisProvider). Current adapter: direct OpenAI Responses (openai-responses.provider.server.ts), key server env OPENAI_API_KEY, optional OPENAI_MODEL; output validated/mapped server-side by openai-schema.ts. Why: provider swappable without frontend changes; never use Lovable AI Gateway here.
- Chart images live in private `charts` bucket under `<user_id>/…`; UI uses signed URLs.
- Technical engine (src/lib/technical-engine/) runs client-side on the chart image via canvas, deterministic, recomputed on view and never stored; kept separate from AI result so both can be compared.
