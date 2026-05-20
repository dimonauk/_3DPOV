# MATH — AI Agents, Transformers, and the ReAct Loop

The long-form companion to the codex entry
`transformer-and-agent-mathematics`. This is the foundational maths
brief Holoflow Studio specialists work from: what happens inside the
language model, what the agentic wrapper does around it, and where
every piece of it lives in the studio's crew at `lib/agents/`. Aimed
at engineers who can read an equation but have not internalised the
geometry behind one. British spellings throughout.

## The shape of the problem

A modern language model is, underneath the marketing, a function from
a finite sequence of integers — token ids drawn from a fixed vocabulary
— to a probability distribution over the next integer. Nothing more
ambitious than that. The chat interface is a wrapper; the agent loop
is a wrapper around the wrapper; retrieval is a way of injecting
extra integers into the input; tool use is a parsing convention
applied to the model's own output. Internalise this and the rest of
the document follows: every clever-sounding capability of an LLM is
some discipline of prompt-construction or output-parsing layered on
top of the same underlying conditional probability table.

The table itself is gigantic — for an 8-billion-parameter open model
the parameters number, well, eight billion — and stored implicitly,
factored through a sequence of learned matrices. The transformer
architecture is the recipe for that factorisation. Vaswani and
colleagues introduced it in *Attention Is All You Need* (NeurIPS
2017) [1], and the recipe has barely moved in the years since;
everything new is either a tweak to a sub-block or a different
training recipe applied to broadly the same architecture.

## Tokens, vocabularies, and embeddings

The first step is to turn text into integers. A *tokeniser* — usually
a byte-pair encoding or one of its descendants — chops the input into
sub-word pieces and looks each one up in a fixed table. Vocabulary
sizes of 30,000 to 200,000 are normal. The output is a list of token
ids, length roughly three-quarters of the original character count
for English prose.

Each id is then mapped to a continuous vector by a learned look-up:

```
E ∈ ℝ^{V × d},   x_i = E[token_id_i]
```

The width `d` is the model's internal dimension — 768 for the
original BERT, 1,024 for GPT-2 medium, 4,096 for Llama-3 8B, 8,192
for the larger frontier models. The whole point of this lift is that
tokens with related meaning land near each other in ℝ^d, so the
geometry of the embedding space is already doing semantic work
before any attention has happened. The matrix `E` is trained
end-to-end with the rest of the model.

## Position has to be told

Self-attention as defined below is permutation-invariant by
construction: shuffle the order of the input vectors and the output
shuffles the same way. That is fatal for language, where *dog bites
man* and *man bites dog* share a vocabulary and differ only in order.
Some positional signal must be mixed into the token vectors before
the first attention layer. Three families are in use:

**Absolute sinusoidal.** The original Vaswani paper assigned position
`p` a deterministic vector of sines and cosines at geometrically
spaced frequencies,

```
PE(p, 2i)   = sin(p / 10000^{2i/d})
PE(p, 2i+1) = cos(p / 10000^{2i/d})
```

added to the token embedding before the first layer. Cheap and
parameter-free; the wave-frequency arrangement was meant to let the
model read relative offsets out of phase differences.

**Learned absolute.** Replace the sin/cos table with a learned matrix
of position embeddings. Easier to implement, harder to extrapolate
beyond the training-time context length.

**Rotary (RoPE).** Pair adjacent dimensions of the query and key
vectors and rotate each pair by an angle `p · θ` that depends on
absolute position `p`. The dot-product of two rotated vectors then
depends only on the *relative* offset `p − q` — relative positional
information falls out of absolute rotation. This is the method
introduced by Su and colleagues in *RoFormer* [2] and adopted by
Llama, Qwen, Mistral, and most modern open models. RoPE extrapolates
more gracefully than the alternatives, especially with the
"NTK-aware" rescaling trick that stretches the base frequency `θ`
to extend a 4k-trained model to 128k context.

## Scaled dot-product attention

The geometric heart of the transformer is one equation:

```
Attention(Q, K, V) = softmax(Q K^T / √d_k) · V
```

Read it as a content-addressable look-up. Each token produces three
vectors from learned linear maps applied to its embedding:

- a **query** `q` — "what am I looking for?"
- a **key** `k` — "what do I advertise about myself?"
- a **value** `v` — "what I will hand over if asked"

The dot-product `q · k` is high when the query and key point the same
way in ℝ^d. Softmax over all keys turns those scores into a
probability distribution. The output is the weighted sum of the
values. The `√d_k` denominator is a variance correction: without it,
dot-products of two random d-vectors drawn from a unit-variance
distribution have variance `d`, the softmax saturates, the gradient
vanishes, and training fails at depth.

### A four-token attention by hand

Take an embedding dimension of 2 and four tokens — *the*, *cat*,
*sat*, *down* — with embeddings

```
x₁ = (1, 0)     "the"
x₂ = (0, 1)     "cat"
x₃ = (1, 1)     "sat"
x₄ = (−1, 1)    "down"
```

Assume the linear maps `W_Q`, `W_K`, `W_V` are the 2×2 identity, so
`q_i = k_i = v_i = x_i`. Compute attention for token 3, *sat*:

1. **Raw scores** `q₃ · k_j`:
   - q₃·k₁ = (1,1)·(1,0) = 1
   - q₃·k₂ = (1,1)·(0,1) = 1
   - q₃·k₃ = (1,1)·(1,1) = 2
   - q₃·k₄ = (1,1)·(−1,1) = 0

2. **Scaled by √2 ≈ 1.414**: 0.707, 0.707, 1.414, 0.

3. **Softmax**: exponentiate, then normalise. exp(0.707) = 2.028,
   exp(1.414) = 4.113, exp(0) = 1.000; sum = 9.169. Weights:
   - w₁ = 2.028/9.169 = 0.221
   - w₂ = 0.221
   - w₃ = 4.113/9.169 = 0.449
   - w₄ = 1.000/9.169 = 0.109

4. **Output**:
   ```
   o₃ = 0.221·(1,0) + 0.221·(0,1) + 0.449·(1,1) + 0.109·(−1,1)
      = (0.561, 0.779)
   ```

Token 3 has pulled most of its new value from itself (weight 0.449,
because its own key points in its own query direction) and the rest
from a weighted blend of the other three. That is the entire
mechanism. Stack twelve to ninety-six of these blocks, sprinkle in
the feed-forward and norms below, and you have GPT.

## Multi-head attention

One attention block has a single query/key/value space; multi-head
attention splits the embedding dimension into `h` parallel heads.
Each head has its own `W_Q, W_K, W_V` of width `d/h`, runs the same
attention computation in parallel, and the results are concatenated
and projected back to width `d`.

The motivation is that different heads end up asking different
"questions" about the sequence:

- one head attends to the immediately previous token (positional);
- one to the matching opening bracket eighty positions back (syntactic);
- one to the subject of the current clause (semantic).

Eight to sixty-four heads is typical. A single head is rarely
expressive enough; beyond a few dozen the returns diminish, and
recent architectures (grouped-query attention, multi-query attention)
share keys and values across groups of heads to cut KV-cache
memory at inference time.

## The KV cache

Autoregressive generation produces one token at a time. Naively the
cost per new token is `O(n²)` in sequence length `n`: the new token
attends to every previous token, and every previous token's keys and
values would be re-derived. The trick is that once a token has been
seen, its key and value do not change. Cache them.

A KV cache is a pair of tensors per layer, per head, of shape
`(n, d/h)` that grows by one row per generation step. Cost per new
token drops to `O(n)`; cost for the whole sequence remains `O(n²)`
but the constant is dramatically smaller, and the *memory* footprint
is what binds.

For an 8B model at `d = 4096`, 32 layers, fp16:

```
cache per token = 2 (K and V) × 32 layers × 4096 dims × 2 bytes
                ≈ 524 kB / token

128k context  ≈ 67 GB of cache  ← per request
```

That is why frontier-context windows demand grouped-query attention,
KV-cache quantisation, paged attention, or all three. Prompt caching
at the API level is the same KV cache, persisted between calls for a
shared prefix — which is why the studio's long cast-bible system
prompts cost milliseconds on the second call and seconds on the
first.

## The transformer block

One block is attention plus a position-wise feed-forward network,
each wrapped in a residual connection and a layer-norm:

```
x ← x + Attention(LayerNorm(x))
x ← x + FFN(LayerNorm(x))
```

The feed-forward is two linear maps with a non-linearity between —
usually a gated variant such as SwiGLU in modern models — widened to
`4d` in the hidden layer. By parameter count, it is the larger half
of the block; attention gets the headlines but feed-forward does the
heavier lifting on storage of facts.

**Pre-norm vs post-norm.** The original Vaswani arrangement applied
the layer-norm *after* the residual addition. That trains unstably at
depth: the residual path acquires the norm, gradients explode at the
top of the stack, and 100-layer models do not converge. Modern
practice is *pre-norm*: norm inside the sub-layer, residual path
clean from end to end. Almost every credible model after 2020 is
pre-norm. The switch is small in description and load-bearing in
practice; most of the reason 70B-parameter models train at all is
that the norm is on the correct side of the residual.

## From logits to a token

The final layer projects the top-of-stack hidden state back into
vocabulary space, yielding a *logits* vector of length `V`. Softmax
turns it into a probability over the next token; sampling picks one.
The studio cares about four sampling decisions, in increasing order
of nuance:

**Greedy.** Always pick `argmax`. Deterministic, dull, and prone to
repetitive loops because once the model finds a high-likelihood
phrase the locally-optimal next token usually continues it.

**Temperature.** Divide the logits by a scalar `T` before softmax.
`T → 0` collapses to greedy; `T = 1` leaves the distribution
unchanged; `T > 1` flattens it. The studio defaults to 0.7 for prose
and 0.0 for tool-call extraction.

**Top-k.** Keep only the `k` highest-probability tokens; re-normalise;
sample from those. A blunt tail-truncation.

**Top-p (nucleus).** Sort tokens by descending probability and keep
the smallest prefix whose cumulative probability exceeds `p`
(commonly 0.9 or 0.95); re-normalise; sample. Adaptive: when the
model is confident the nucleus is small, when it is uncertain the
nucleus widens. Holtzman and colleagues introduced this in *The
Curious Case of Neural Text Degeneration* [3] and showed it
substantially reduces the flat, repetitive quality of
maximum-likelihood-decoded text. For any open-ended studio
generation, `temperature 0.7–0.9` with `top_p = 0.95` is the safe
default.

A **repetition penalty** additionally divides the logit of any token
that already appeared in the context by a factor slightly greater
than 1, discouraging the model from looping on the same phrase. Most
studio calls leave it at the provider default; the ReAct loop's
"do not retry the same call with the same args" rule does coarser
work at the prompt level.

## The ReAct loop

Reason + Act, after Yao and colleagues, ICLR 2023 [4]. The pattern
wraps a vanilla chat-completion model in a four-beat prompt contract:
*Thought*, *Action*, *Observation*, repeating until a *Final Answer*.
No weights are changed; the cleverness is in the prompt format and a
parser that runs after each turn.

The text contract the studio uses is the simplified two-shape form:

```
Shape A — call a tool:
  Thought: <one sentence on what you're about to do and why>
  Action: <one tool name, copied verbatim from the tool list>
  Args: <single-line JSON object matching that tool's args schema>

Shape B — finish:
  Thought: <one sentence summarising the answer you reached>
  Final Answer: <your full answer to the task, free form>
```

After each model turn the runner parses the output, looks up the
named tool in the specialist's allow-list, executes it, and pushes
the result back into the conversation as `Observation: <tool result>`
on the next user turn. If the model emits a `Final Answer:`, the
loop exits with that answer. If it emits malformed output, the
runner tells it so and lets it retry. A hard ceiling of eight
iterations stops a runaway. Every failure mode — bad JSON, unknown
tool, tool returning `ok:false`, network error, ceiling exhausted —
is folded into a `ReactLoopResult` with `ok:false` and a descriptive
`error`. The loop never throws; the crew layer above it depends on
that contract.

The reason ReAct works at all is that interleaving free-text
reasoning with structured tool calls converts the model's "talking
to itself" into actual external work. The model gets to think on
paper before each action and revise after each observation, which
turns out to recover a surprising amount of the gap between a single
greedy completion and a properly thought-through answer.

## Vector embeddings and RAG

The same embedding idea that lifts tokens into vectors lifts whole
sentences, paragraphs, or documents into vectors — via a dedicated
*embedding model* whose output is a single fixed-width vector,
typically 384 to 1,536 dimensions. Cosine similarity

```
cos(u, v) = (u · v) / (‖u‖ ‖v‖)
```

ranges from −1 to 1 and approximates semantic closeness cheaply:
documents about the same topic land near each other on the unit
sphere regardless of whether they share keywords.

Retrieval-Augmented Generation is the obvious composition:

1. embed the user's question;
2. find the top-k nearest neighbours in a corpus by cosine;
3. paste them into the prompt as context;
4. let the model answer with the retrieved material in view.

The vector-store implementations the studio reaches for are Qdrant on
the bench and pgvector in production; the maths underneath either is
the same dot product on normalised vectors, accelerated by an
approximate-nearest-neighbour index (HNSW graphs, IVF-PQ) so a
million-vector search returns in milliseconds rather than seconds.
The index-side mathematics — HNSW navigation, product quantisation,
the recall/latency trade-off — is the subject of a future
`embeddings-and-vector-search` codex entry.

## Where this lives at Holoflow

I keep the client at `lib/agents/llm-client.ts`: a single
`callLLM({ provider, model, via, messages, ... })` with a `via`
switch that picks transport. `aperture` routes through Tailscale's
gateway at `https://ai.tail99b2a4.ts.net/v1` (OpenAI-compatible wire,
provider-prefixed model strings like `anthropic/claude-opus-4-7`).
`direct` calls the provider's own REST — Anthropic native, OpenAI,
Google Gemini, or Ollama. `local` is Ollama on the bench. Auth-class
errors (401/403), network errors and 5xx failures fall back to local
Ollama if it answers a ping; 400/422 do not, because that's the
caller's bug. Default fallback model is `qwen3:8b`. Zero SDK deps —
just native fetch with `AbortSignal.timeout`. The whole file is one
function plus four adapters plus a fallback dispatcher.

The ReAct loop at `lib/agents/loop/react-loop.ts` is the engine.
Specialist definitions live in `lib/agents/specialists/` — one TS
file each for Aura the Architect, Marcel the Bench Hand, Coco the
Curator, Penny the Quick Lookup, and the Scribe — each with a slug,
a system prompt, a preferred-model triple `{provider, model, via}`,
and a tool allow-list. The public surface is
`app/api/agents/crew/route.ts`, which composes a planning specialist
with delegated sub-tasks; smaller specialist-direct routes follow
the same pattern.

That whole stack is one function plus a parser plus a JSON file per
specialist. No LangChain, no agentic framework. The agent layer is
shorter than this document.

## Cross-references

- `linear-algebra-essentials` — the dot products, matrix maps,
  softmax, and norm operations this entry assumes you can read.
- `numerical-optimization-essentials` — the gradient descent and
  Adam variants that train every transformer weight in the first
  place.
- Future `embeddings-and-vector-search` — picks up where the RAG
  section above stops: HNSW, IVF-PQ, recall vs latency, hybrid
  sparse/dense retrieval.

## References

[1] Vaswani, A., Shazeer, N., Parmar, N., *et al.* (2017).
*Attention Is All You Need.* Advances in Neural Information
Processing Systems 30. https://arxiv.org/abs/1706.03762

[2] Su, J., Lu, Y., Pan, S., Murtadha, A., Wen, B., Liu, Y. (2021).
*RoFormer: Enhanced Transformer with Rotary Position Embedding.*
Preprint; journal version in *Neurocomputing* (2024).
https://arxiv.org/abs/2104.09864

[3] Holtzman, A., Buys, J., Du, L., Forbes, M., Choi, Y. (2020).
*The Curious Case of Neural Text Degeneration.* International
Conference on Learning Representations.
https://arxiv.org/abs/1904.09751

[4] Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K.,
Cao, Y. (2023). *ReAct: Synergizing Reasoning and Acting in Language
Models.* International Conference on Learning Representations.
https://arxiv.org/abs/2210.03629
