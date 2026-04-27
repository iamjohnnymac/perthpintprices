# Andrew voice research — late 2026

Goal: lift answer + completion rate on cold calls to Perth bartenders by fixing cadence drift, mid-sentence murmuring, and turn-to-turn volume swings.

---

## 1. TL;DR — top 3 actions, ranked

1. **Move from `eleven_flash_v2` → `eleven_flash_v2_5`, then test `eleven_v3_conversational` (Expressive Mode) on a small slice.** Flash v2 is a generation behind. Flash v2.5 is the current "real-time" recommendation at ~75 ms TTFB. Eleven v3 Conversational is the new model purpose-built for ElevenAgents (launched Feb 2026, GA after) — same v3 voice quality but optimised for real-time turn-taking. v3 itself is *not* recommended for real-time, but v3 Conversational is the bridge. ([ElevenLabs Models](https://elevenlabs.io/docs/overview/models), [Expressive Mode launch](https://elevenlabs.io/blog/introducing-expressive-mode))
2. **Bump stability to 0.65–0.75 (from default ~0.5) and turn `use_speaker_boost` ON.** Both the official troubleshooting article and the cheat sheet point to low stability + variable dynamic range as *the* root cause of the whisper/volume-drop pattern Andrew is showing. ([Why does my voice start whispering…](https://help.elevenlabs.io/hc/en-us/articles/13416095176977), [ElevenLabs Cheat Sheet 2026](https://www.webfuse.com/elevenlabs-cheat-sheet))
3. **Build a Professional Voice Clone (PVC) of one consistent Australian male reference and replace the stock Andrew voice.** Stock voices "generalise less well" — mid-sentence whisper is largely a cloning-quality / dynamic-range artefact, and PVC is documented as the production fix for it. Every production AU phone bot you cited uses PVC for a reason. ([IVC vs PVC](https://elevenlabs.io/docs/eleven-api/concepts/voice-cloning))

---

## 2. Model recommendations

Current ElevenLabs lineup as of April 2026 ([source](https://elevenlabs.io/docs/overview/models)):

| Model | TTFB | Use | Verdict for Andrew |
|---|---|---|---|
| `eleven_flash_v2` (current) | ~75 ms | real-time | **deprecated track**, drop |
| `eleven_flash_v2_5` | ~75 ms | real-time, 32 lang | **Default. Try first.** Drop-in replacement, better text handling |
| `eleven_turbo_v2_5` | slightly higher | real-time | functionally equivalent to Flash, no advantage |
| `eleven_multilingual_v2` | higher (~250–400ms) | quality narration | only if Flash v2.5 keeps mispronouncing dollar values |
| `eleven_v3` (GA Mar 2026) | high | expressive non-realtime | **NOT for phone agents** — explicit ElevenLabs guidance |
| `eleven_v3_conversational` (GA Feb 2026 via Expressive Mode) | optimised for real-time | ElevenAgents only | **Test as second priority** — purpose-built for Andrew's use case |
| `eleven_realtime` | n/a | does not exist as a TTS model — "Realtime" is the Scribe v2 ASR | informational only |

Concrete recommendation:

- **Phase 1 (this week):** flip `eleven_flash_v2` → `eleven_flash_v2_5`. Same voice ID still works. Side benefit: text normaliser v3.1 (Apr 2026) and reduced 100ms audio chunk vs older 250ms. ([release notes](https://releasebot.io/updates/eleven-labs))
- **Phase 2 (A/B):** enable Expressive Mode in the agent settings (boolean field added Q1 2026) and route 20% of calls through `eleven_v3_conversational`. Measure completion rate and time-to-quote.
- **Don't touch v3 (non-conversational).** ElevenLabs explicitly: *"v3 is not made for real-time applications like Conversational AI."* ([Inworld v3 review](https://inworld.ai/resources/elevenlabs-v3-review))

Flash v2.5 quirk: numbers aren't normalised by default. `"$8.50"` can read as "eight thousand thousand dollars". Either set `apply_text_normalization: "on"` (Enterprise) or have the LLM spell numbers ("eight dollars fifty"). Mostly affects Andrew's confirmations, not the bartender's own speech. ([ElevenLabs normalisation](https://github.com/elevenlabs/elevenlabs-docs/blob/main/fern/docs/pages/best-practices/prompting/normalization.mdx))

---

## 3. Voice strategy — clone vs stock

**Yes, switch to a clone.** This is the highest-leverage single change after the model bump.

The murmur-and-volume-drop you're seeing is the textbook stability-issue pattern, and ElevenLabs' own troubleshooting points at *voice quality* as half the cause: *"prevalence is very dependent on the voice used, how wide the dynamic range is… and how well cloned it is."* ([ElevenLabs help](https://help.elevenlabs.io/hc/en-us/articles/13416095176977)) Stock voices are conditioned at inference, not fine-tuned, so they generalise less well to short conversational turns ([IVC vs PVC](https://elevenlabs.io/docs/eleven-api/concepts/voice-cloning)).

| | IVC (Instant) | PVC (Professional) |
|---|---|---|
| Audio needed | ~1–2 min | ~30 min, recommended 3 hrs |
| Training time | seconds | 3–6 hrs |
| Plan | any paid | Creator+ |
| Inference latency | same as stock | same as stock (no penalty) |
| Quality / consistency | OK; variable on style shifts | substantially higher; "captures stylistic tendencies" |
| Phone-agent fit | prototype | **production** |

**Concrete next steps:**
1. **Source 30–60 min of clean reference audio** — a single Australian male speaker, recorded in a quiet room with consistent mic distance, NO whispering, NO shouting, even loudness. Conversational tone, not narration. (Per ElevenLabs: dynamic-range consistency is critical.)
2. **Submit for PVC.** Wait 3–6 hrs. Plan: Creator ($22/mo) is enough.
3. **Do a 100-call A/B** vs current stock Andrew, holding model + settings constant. Measure: pickup-to-price-quote rate, average call length, transcript completeness.
4. If you can't get clean reference audio, fall back to **IVC** with 1–2 min of professionally recorded sample first — it's a meaningful step up from stock and ships in seconds.

Caveat: if you go PVC, you need clear consent from the speaker (legal/ethical, plus ElevenLabs require it).

---

## 4. Parameter tuning

ElevenLabs voice settings, with phone-agent values:

| Setting | What it does | Phone-agent recommendation |
|---|---|---|
| **stability** | how much randomness/expressivity per turn. Low = animated and wandering, high = consistent and flat. | **0.65–0.75** (default ~0.5 is too low for phone). Raise it — this is the primary fix for murmur and volume drift. ([Cheat sheet](https://www.webfuse.com/elevenlabs-cheat-sheet)) |
| **similarity_boost** | how aggressively to anchor to source voice. Higher = more like reference, slightly higher latency. | **0.75–0.80**. Sweet spot per docs. >0.85 risks distortion. |
| **style** | exaggeration of source style. Adds latency. | **0.0**. Keep at zero for phone — official guidance. Style >0 amplifies the cadence randomness Andrew already has. |
| **use_speaker_boost** | post-processing that improves clarity / loudness consistency on the cloned/source voice. Slight latency cost. | **TRUE**. Directly addresses perceived volume drift. Note: not available on `eleven_v3` — but works on Flash v2.5 and v3 Conversational. |
| **speed** | playback rate, 0.7–1.2 | **0.95–1.0**. You're at 0.95 already; nudge to 1.0 once stability is up — at 0.95 + low stability, slow turns can sound mumbled. |

This is also exposed per-agent under the Conversational AI security/overrides settings, so you can A/B in production without redeploying ([Overrides](https://elevenlabs.io/docs/eleven-agents/customization/personalization/overrides)).

The single highest-leverage change: **stability 0.5 → 0.7, speaker_boost ON.** Test that first before changing model or voice.

---

## 5. Prompt-side tricks

Flash v2 / v2.5 supports SSML break tags; v3 / v3 Conversational does not, but accepts bracketed audio tags. Mix into the agent's first-turn output and into tool-result confirmations:

**For Flash v2.5 (current path):**
- `<break time="0.4s"/>` between distinct utterances. Don't overuse — *"excessive SSML breaks can cause the AI to start speeding up or introduce noise"* ([ElevenLabs help](https://help.elevenlabs.io/hc/en-us/articles/24352686926609)).
- **Em-dashes** for natural pauses: `"G'day — quick one for ya."` More natural than `<break>` and zero artefact risk.
- **Periods over commas** at sentence boundaries — gives a full pause and resets prosody.
- **Don't UPPERCASE for emphasis** in Flash v2 — it gets read literally as shouting on phone audio. Save caps for v3.
- **Spell out prices** in LLM output: `"eight dollars fifty"` not `"$8.50"`.
- **Keep utterances short** — 1–2 sentences per turn. ElevenLabs explicitly recommends *"breaking text into smaller segments helps maintain consistent volume"* — that's the murmur fix in prompt form. ([whispering troubleshooting](https://help.elevenlabs.io/hc/en-us/articles/13416095176977))

**For v3 Conversational (when you A/B test):**
- Audio tags in brackets at start of utterance: `[calm] [conversational tone]` for the standard greeting, `[friendly]` for confirmations. Keep the tag list small — your 20-tag suggested-tags field (added Q1 2026 in agent config) should hold them.
- **Avoid** `[whispers]`, `[hesitates]`, `[stammers]` — these will *cause* the murmur, not fix it.
- Em-dashes still work; ellipsis `…` produces hesitation (avoid for confidence).
- ([v3 markup guide](https://medium.com/@v-jur-kh/on-text-markup-for-the-elevenlabs-v3-text-to-speech-2b0a330110e1))

**Greeting line tweak** (highest-leverage prompt change): hard-code the *first* utterance with consistent punctuation, not a templated LLM response. The first 2 seconds determine whether the bartender stays on the line. Example: `"G'day — calling from Perth Pint Prices. Quick one — what's a pint of Swan Draught running at?"`

---

## 6. Alternative providers worth real A/B effort

Honest cut. Three are production-ready and worth your time; the others aren't.

**Worth testing:**

1. **Cartesia Sonic-3 + Line** — strongest credible alternative. ~40–90 ms TTFB (vs ElevenLabs ~75–400 ms depending on model), Twilio integration documented and clean (PCM → mu-law 8kHz), SOC2/PCI/HIPAA-compliant, owns full agent stack. *Caveat:* AU English support is real but not specifically marketed; voice library is smaller than ElevenLabs. Pricing: Vapi+Deepgram+Sonic-2 stacks land at ~$0.10–0.15/min all-in. Run a 50-call pilot. ([Cartesia Sonic](https://cartesia.ai/sonic), [Cartesia Line](https://cartesia.ai/agents))

2. **OpenAI gpt-realtime (S2S, not TTS)** — speech-to-speech in one bidirectional stream, GA, full SIP support to Twilio. Removes the LLM↔TTS↔ASR latency seams entirely. *Caveat:* less voice control than ElevenLabs (smaller voice catalogue, no PVC), cost is meaningfully higher per minute. Best as a "ceiling test" — if Andrew with gpt-realtime gets dramatically higher completion, you know the issue is pipeline seams, not voice. ([OpenAI gpt-realtime](https://openai.com/index/introducing-gpt-realtime/))

3. **Deepgram Aura-2** — sub-200 ms latency, very low variance (which is exactly your cadence problem), Twilio reference implementations published, mu-law 8kHz native. Simplest swap if you just want a TTS-only A/B leaving ASR/LLM unchanged. *Caveat:* fewer character voices, less expressive than ElevenLabs. ([Aura-2](https://deepgram.com/learn/introducing-aura-2-enterprise-text-to-speech))

**Skip for now:**

- **Hume EVI 2** — emotionally expressive S2S, 500–800 ms response time. *Too slow for cold calls* — bartenders won't wait. ([Hume EVI 2](https://venturebeat.com/ai/who-needs-gpt-4o-voice-mode-humes-evi-2-is-here-with-emotionally-inflected-voice-ai-and-api))
- **PlayHT 3.0** — quality is fine, but no production track record on AU phone bots and Twilio integration is more DIY than ElevenLabs/Cartesia.
- **Sesame CSM** — open-weight conversational speech model, research-quality, not production-ready for telephony.
- **Rime AI** — niche US-English focus, weak AU support.

**Bottom line on alternatives:** Cartesia Sonic-3 is the only one likely to outperform a properly-tuned ElevenLabs setup on phone *today*. Tune ElevenLabs first; only A/B Cartesia if Andrew is still inconsistent after stability + PVC fixes.

---

## 7. Phone-pipeline gotchas

- **mu-law 8 kHz is the universal Twilio format.** ElevenLabs supports it natively in the agent platform, no conversion needed. If you've got *any* custom audio plumbing in front of the ElevenLabs Twilio native integration, rip it out — that's a common source of volume artefacts. ([Twilio integration](https://elevenlabs.io/docs/eleven-agents/phone-numbers/twilio-integration/native-integration))
- **Audio chunk size:** ElevenLabs reduced from 250 ms → 100 ms in Q1 2026. If your `silence_end_call_timeout` or VAD config is tuned to old chunk size, retune — perceived cadence on the bartender's side actually depends on this.
- **Compounding compression.** Twilio's mu-law downsampling is brutal at the high frequency end. Voices with strong sibilance or breathy attack lose intelligibility. *This compounds the murmur problem* — a near-whisper that sounds fine in the ElevenLabs preview can disappear on the phone. PVC + speaker_boost mitigates by compressing dynamic range *before* the codec strips it.
- **Network jitter, not buffer underruns, is usually the culprit on volume swings between turns.** ElevenLabs streams over WebSocket; brief packet loss between turns sounds like volume drop. Twilio Voice Insights can confirm — check MOS (mean opinion score) and packet-loss numbers on your test calls before assuming it's the model. ([Twilio debugging](https://www.usesherlock.ai/blog/how-to-debug-twilio-call-failures))
- **Turn eagerness setting (Eager/Normal/Patient):** if Andrew sometimes starts a turn while the bartender is still half-talking, it can read as cadence drift on Andrew's side because his TTS is fighting overlapping audio. For cold calls to bartenders (slower environment, background noise), set to **Patient**. ([Conversational AI overview](https://elevenlabs.io/docs/conversational-ai/overview))

---

## Recommended rollout order

1. **Day 0**: change `eleven_flash_v2` → `eleven_flash_v2_5`, stability `0.5 → 0.70`, similarity `0.75`, style `0.0`, speaker_boost ON. Turn eagerness → Patient. Hard-code greeting line. Spell out dollar amounts in LLM output. **Run 30 calls. Measure.**
2. **Day 7**: if still inconsistent, kick off PVC build. 30 min reference audio, single AU male speaker, consistent loudness.
3. **Day 14**: PVC live. Re-run 30 calls. Compare.
4. **Day 21**: enable Expressive Mode (`eleven_v3_conversational`) on 20% of calls. Compare.
5. **Day 30**: if Andrew is still drifting, run Cartesia Sonic-3 pilot on 50 calls — same prompt, same flow.

Don't change two variables at once. Save call recordings for blind comparisons.
