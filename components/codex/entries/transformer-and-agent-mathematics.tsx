export default function TransformerAndAgentMathematics() {
  return (
    <>
      <p>
        A language model is, underneath the marketing, a function that
        eats a sequence of integers and returns a probability
        distribution over the next integer. Everything else &mdash; the
        chat interface, the agentic loop, the retrieval layer, the
        polite refusal to misbehave &mdash; is scaffolding around that
        single function. This entry is the maths of the scaffolding:
        what the transformer does on the inside, how the agent loop
        wraps it on the outside, and where each piece lives in the
        studio&rsquo;s crew system.<sup>1</sup>
      </p>

      <p>
        <strong>Tokens to vectors.</strong> The input to a transformer
        is a list of token ids &mdash; small integers indexing a fixed
        vocabulary, typically 30,000 to 200,000 entries. The first
        operation lifts each id into a continuous{" "}
        <em>embedding</em>: a high-dimensional real vector pulled out
        of a learned look-up table{" "}
        <code className="font-mono text-chrome-200">
          E &isin; &#8477;<sup>V&times;d</sup>
        </code>
        . The dimension{" "}
        <code className="font-mono text-chrome-200">d</code> is the
        model&rsquo;s internal width &mdash; 768 for the original BERT,
        1,024 for GPT-2 medium, 4,096 for Llama-3 8B, 8,192 for the
        larger frontier models. The whole point of the embedding is
        that tokens with related meaning land near each other in
        &#8477;<sup>d</sup>, so the geometry of the space is already
        doing semantic work before any attention has happened.
      </p>

      <p>
        <strong>Why position has to be told.</strong> Self-attention is
        permutation-invariant by construction &mdash; shuffle the
        token vectors before feeding them in and the output shuffles
        the same way. That is fatal for language, where{" "}
        <em>&ldquo;dog bites man&rdquo;</em> and{" "}
        <em>&ldquo;man bites dog&rdquo;</em> share a vocabulary and
        differ only in order. A <em>positional encoding</em> repairs
        this by mixing a position-dependent signal into each token
        vector. Three families do the job:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Absolute (sinusoidal).</strong> The original Vaswani
          paper assigned position{" "}
          <code className="font-mono text-chrome-200">p</code> a
          deterministic vector of sines and cosines at geometrically
          spaced frequencies:{" "}
          <code className="font-mono text-chrome-200">
            PE(p, 2i) = sin(p / 10000<sup>2i/d</sup>)
          </code>
          ,{" "}
          <code className="font-mono text-chrome-200">
            PE(p, 2i+1) = cos(p / 10000<sup>2i/d</sup>)
          </code>
          . Added to the token embedding before the first attention
          layer. Cheap, parameter-free, and the wave-frequency
          arrangement means the model can in principle read relative
          offsets out of phase differences.
        </li>
        <li>
          <strong>Learned absolute.</strong> Replace the sin/cos table
          with a learned matrix of position embeddings. Easier to
          implement; harder to extrapolate to sequences longer than
          training saw.
        </li>
        <li>
          <strong>Rotary (RoPE).</strong> Pair adjacent dimensions of
          the query and key vectors and rotate each pair by an angle{" "}
          <code className="font-mono text-chrome-200">p &middot; &theta;</code>{" "}
          that depends on absolute position{" "}
          <code className="font-mono text-chrome-200">p</code>. The
          dot-product of two rotated vectors then depends only on the{" "}
          <em>relative</em> offset &mdash; relative positional
          information falls out of absolute rotation. This is the
          mechanism Llama, Qwen, Mistral and most modern open models
          use, and it extrapolates more gracefully than the
          alternatives.<sup>2</sup>
        </li>
      </ul>

      <p>
        <strong>Scaled dot-product attention.</strong> The geometric
        heart of the transformer is one equation:
      </p>
      <p className="ml-6 font-mono text-chrome-200">
        Attention(Q, K, V) = softmax(Q K&#7531; / &radic;d<sub>k</sub>)
        &middot; V
      </p>
      <p>
        Read this as a content-addressable look-up. Each token produces
        three vectors from learned linear maps applied to its embedding:
        a <em>query</em>{" "}
        <code className="font-mono text-chrome-200">q</code>{" "}
        (&ldquo;what am I looking for?&rdquo;), a <em>key</em>{" "}
        <code className="font-mono text-chrome-200">k</code>{" "}
        (&ldquo;what do I advertise about myself?&rdquo;), and a{" "}
        <em>value</em>{" "}
        <code className="font-mono text-chrome-200">v</code>{" "}
        (&ldquo;what I will hand over if asked&rdquo;). The
        dot-product{" "}
        <code className="font-mono text-chrome-200">q &middot; k</code>{" "}
        is high when the query and key point the same way in
        &#8477;<sup>d</sup>; the softmax over all keys turns those
        scores into a probability distribution; the output is the
        weighted sum of the values. The{" "}
        <code className="font-mono text-chrome-200">&radic;d<sub>k</sub></code>{" "}
        denominator prevents the dot-products from growing with
        dimension and saturating the softmax.<sup>3</sup>
      </p>

      <p>
        <strong>A four-token attention worked by hand.</strong> Take
        an embedding dimension of 2 and four tokens &mdash;{" "}
        <em>the</em>, <em>cat</em>, <em>sat</em>, <em>down</em>{" "}
        &mdash; with embeddings
      </p>
      <p className="ml-6 font-mono text-chrome-200">
        x&#8321; = (1, 0), &nbsp; x&#8322; = (0, 1), &nbsp;
        x&#8323; = (1, 1), &nbsp; x&#8324; = (&minus;1, 1)
      </p>
      <p>
        Assume the linear maps{" "}
        <code className="font-mono text-chrome-200">W<sub>Q</sub></code>
        ,{" "}
        <code className="font-mono text-chrome-200">W<sub>K</sub></code>
        ,{" "}
        <code className="font-mono text-chrome-200">W<sub>V</sub></code>{" "}
        are all the 2&times;2 identity, so{" "}
        <code className="font-mono text-chrome-200">q<sub>i</sub> = k<sub>i</sub> = v<sub>i</sub> = x<sub>i</sub></code>
        . Compute the attention output for token 3,{" "}
        <em>sat</em>:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          Raw scores{" "}
          <code className="font-mono text-chrome-200">q&#8323; &middot; k<sub>j</sub></code>
          : 1, 1, 2, 0.
        </li>
        <li>
          Scaled by{" "}
          <code className="font-mono text-chrome-200">&radic;2 &asymp; 1.414</code>
          : 0.707, 0.707, 1.414, 0.
        </li>
        <li>
          Softmax (exponentiate, then normalise): exp values 2.028,
          2.028, 4.113, 1.000, sum 9.169; weights 0.221, 0.221, 0.449,
          0.109.
        </li>
        <li>
          Output = 0.221&middot;(1,0) + 0.221&middot;(0,1) +
          0.449&middot;(1,1) + 0.109&middot;(&minus;1, 1) =
          (0.561, 0.779).
        </li>
      </ul>
      <p>
        Token 3 has pulled most of its new value from itself (weight
        0.449, because its own key points in its own query direction)
        and the rest from a weighted blend of the other three. That is
        the entire mechanism. Stack twelve to ninety-six of these
        attention blocks, sprinkle in the feed-forward and norms below,
        and you have GPT.
      </p>

      <p>
        <strong>Multi-head attention.</strong> One attention block has
        a single query/key/value space; multi-head attention splits the
        embedding dimension into{" "}
        <code className="font-mono text-chrome-200">h</code> parallel
        heads &mdash; each with its own{" "}
        <code className="font-mono text-chrome-200">W<sub>Q</sub>, W<sub>K</sub>, W<sub>V</sub></code>{" "}
        of width{" "}
        <code className="font-mono text-chrome-200">d / h</code>{" "}
        &mdash; runs the same attention computation in parallel, and
        concatenates the results. The motivation is that different
        heads end up asking different &ldquo;questions&rdquo; about the
        sequence: one head attends to the immediately previous token,
        another to the matching opening bracket eighty positions back,
        another to the subject of the current clause. Eight to
        sixty-four heads is typical; a single head is rarely enough,
        and beyond a few dozen the returns diminish.
      </p>

      <p>
        <strong>The KV cache.</strong> Autoregressive generation
        produces one token at a time. Naively the cost per new token
        is{" "}
        <code className="font-mono text-chrome-200">O(n<sup>2</sup>)</code>{" "}
        in the sequence length{" "}
        <code className="font-mono text-chrome-200">n</code>: the new
        token attends to every previous token, and every previous
        token&rsquo;s keys and values must be re-derived. The trick is
        that those keys and values do not change once computed &mdash;
        cache them. A KV cache is a pair of tensors per layer,
        per head, of shape{" "}
        <code className="font-mono text-chrome-200">(n, d/h)</code>{" "}
        that grows by one row per generation step. Cost per new token
        drops to{" "}
        <code className="font-mono text-chrome-200">O(n)</code>; cost
        for the whole sequence remains{" "}
        <code className="font-mono text-chrome-200">O(n<sup>2</sup>)</code>{" "}
        but the constant is dramatically smaller. KV cache memory is
        usually the binding constraint on context length: for an 8B
        model at{" "}
        <code className="font-mono text-chrome-200">d = 4096</code>,
        32 layers, fp16, the cache costs roughly{" "}
        <code className="font-mono text-chrome-200">4 &middot; n</code>{" "}
        kilobytes per token, so a 128k-token window wants something
        north of half a gigabyte of cache before the weights even
        load.<sup>4</sup>
      </p>

      <p>
        <strong>The transformer block.</strong> One block is
        attention plus a position-wise feed-forward network, each
        wrapped in a residual connection and a layer-norm:
      </p>
      <p className="ml-6 font-mono text-chrome-200">
        x &larr; x + Attention(LayerNorm(x))
        <br />
        x &larr; x + FFN(LayerNorm(x))
      </p>
      <p>
        The feed-forward is two linear maps with a non-linearity
        between &mdash; usually a gated variant such as SwiGLU in
        modern models &mdash; widened to{" "}
        <code className="font-mono text-chrome-200">4d</code> in the
        hidden layer. It is, by parameter count, the larger half of the
        block; attention gets the headlines but feed-forward does the
        heavier lifting on storage of facts.
      </p>
      <p>
        The placement of the layer-norm matters. <em>Post-norm</em>{" "}
        (the original Vaswani arrangement, with the norm after the
        residual addition) trains unstably at depth and largely fell
        out of use after 2020. <em>Pre-norm</em> (the norm applied
        before the sub-layer, as written above) keeps the residual
        path clean and is what every credible modern model uses. The
        switch is small in description and load-bearing in practice:
        most of the reason 70B-parameter models train at all is that
        the norm is on the correct side of the residual.
      </p>

      <p>
        <strong>From logits to a token.</strong> The final layer
        projects the top-of-stack hidden state back into vocabulary
        space, yielding a <em>logits</em> vector of length{" "}
        <code className="font-mono text-chrome-200">V</code>. Softmax
        turns it into a probability over the next token; sampling
        picks one. The studio cares about four sampling decisions:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Greedy.</strong> Always pick{" "}
          <code className="font-mono text-chrome-200">argmax</code>.
          Deterministic, dull, prone to repetitive loops.
        </li>
        <li>
          <strong>Temperature.</strong> Divide the logits by a scalar{" "}
          <code className="font-mono text-chrome-200">T</code> before
          softmax. {" "}
          <code className="font-mono text-chrome-200">T &rarr; 0</code>{" "}
          collapses to greedy; {" "}
          <code className="font-mono text-chrome-200">T = 1</code>{" "}
          leaves the distribution unchanged;{" "}
          <code className="font-mono text-chrome-200">T &gt; 1</code>{" "}
          flattens it. The studio defaults to 0.7 for prose and 0.0
          for tool-call extraction.
        </li>
        <li>
          <strong>Top-k.</strong> Keep only the{" "}
          <code className="font-mono text-chrome-200">k</code> highest-
          probability tokens; re-normalise; sample from those. A blunt
          tail-truncation.
        </li>
        <li>
          <strong>Top-p (nucleus).</strong> Sort tokens by descending
          probability and keep the smallest prefix whose cumulative
          probability exceeds{" "}
          <code className="font-mono text-chrome-200">p</code> (commonly
          0.9 or 0.95). Adaptive: when the model is confident the
          nucleus is small, when it is uncertain the nucleus widens.
          Holtzman <em>et al.</em> showed this fixes the &ldquo;text
          degeneration&rdquo; problem that pure likelihood-maximising
          samplers fall into.<sup>5</sup>
        </li>
      </ul>
      <p>
        A <em>repetition penalty</em> additionally divides the logit
        of any token that already appeared in the context by a factor
        slightly greater than 1, which discourages the model from
        looping on the same phrase. Most studio-side calls leave it at
        the provider default; the ReAct loop&rsquo;s &ldquo;do not
        retry the same call with the same args&rdquo; rule does
        coarser work at the prompt level.
      </p>

      <p>
        <strong>The ReAct loop.</strong> Reason + Act, after Yao{" "}
        <em>et al.</em>, ICLR 2023. The pattern wraps a vanilla
        chat-completion model in a four-beat prompt contract:{" "}
        <em>Thought</em>, <em>Action</em>, <em>Observation</em>,
        either repeating or terminating with <em>Final Answer</em>. No
        weights are changed; the cleverness is in the prompt format
        and a parser that runs after each turn. The studio&rsquo;s
        engine at{" "}
        <code className="font-mono text-chrome-200">
          lib/agents/loop/react-loop.ts
        </code>{" "}
        renders the two-shape spec verbatim into every system prompt
        (Shape A for a tool call, Shape B for a final answer), parses
        each model turn with a tolerant regex pair, runs the named
        tool, and feeds the result back as an{" "}
        <code className="font-mono text-chrome-200">Observation:</code>{" "}
        line on the next iteration. A hard ceiling of eight
        iterations stops a runaway loop; every malformed turn,
        unknown tool, bad args JSON, or thrown handler is folded into
        a{" "}
        <code className="font-mono text-chrome-200">
          ReactLoopResult
        </code>{" "}
        with{" "}
        <code className="font-mono text-chrome-200">ok: false</code>{" "}
        and a descriptive error &mdash; the loop never throws.
      </p>

      <p>
        <strong>Vector embeddings and RAG.</strong> The same embedding
        idea that lifts tokens into vectors lifts whole sentences,
        paragraphs, or documents into vectors &mdash; via a dedicated
        embedding model whose output is a single fixed-width vector,
        typically 384 to 1,536 dimensions. Cosine similarity{" "}
        <code className="font-mono text-chrome-200">
          cos(u, v) = (u &middot; v) / (||u|| ||v||)
        </code>{" "}
        ranges from &minus;1 to 1 and approximates semantic closeness
        cheaply: documents about the same topic land near each other
        on the unit sphere regardless of whether they share keywords.
        Retrieval-Augmented Generation is the obvious composition:
        embed the user&rsquo;s question, find the top-{" "}
        <em>k</em>{" "}
        nearest neighbours in a corpus by cosine, paste them into the
        prompt as context, and let the model answer with the
        retrieved material in view. The vector-store implementations
        the studio reaches for are Qdrant on the bench and pgvector
        in production; the maths underneath either is the same dot
        product on normalised vectors, accelerated by an approximate-
        nearest-neighbour index (HNSW, IVF-PQ) so a million-vector
        search returns in milliseconds.
      </p>

      <p>
        <strong>Where this lives at Holoflow.</strong> I keep the
        client at{" "}
        <code className="font-mono text-chrome-200">
          lib/agents/llm-client.ts
        </code>
        : a single{" "}
        <code className="font-mono text-chrome-200">callLLM()</code>{" "}
        with a{" "}
        <code className="font-mono text-chrome-200">via</code>{" "}
        switch &mdash; Aperture (Tailscale&rsquo;s gateway at{" "}
        <code className="font-mono text-chrome-200">
          ai.tail99b2a4.ts.net
        </code>
        , OpenAI-compatible wire), the provider&rsquo;s own REST when
        I want to test directly against Anthropic or OpenAI, or local
        Ollama on the bench (default fallback model{" "}
        <code className="font-mono text-chrome-200">qwen3:8b</code>).
        Auth-class and 5xx failures fall back to Ollama if it is
        reachable; 400/422 don&rsquo;t, because that&rsquo;s the
        caller&rsquo;s bug to fix. The ReAct loop at{" "}
        <code className="font-mono text-chrome-200">
          lib/agents/loop/react-loop.ts
        </code>{" "}
        is the engine, the specialist definitions live in{" "}
        <code className="font-mono text-chrome-200">
          lib/agents/specialists/
        </code>{" "}
        (Aura, Marcel, Coco, Penny, the Scribe &mdash; each with its
        own tool allow-list and preferred model), and the public
        surface is{" "}
        <code className="font-mono text-chrome-200">
          app/api/agents/crew/route.ts
        </code>
        . That whole stack is one function plus a parser plus a JSON
        file per specialist; no LangChain, no agentic framework. The
        whole agent layer is shorter than this codex entry.
      </p>

      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/linear-algebra-essentials"
          className="text-pink-200 underline underline-offset-4"
        >
          linear algebra essentials
        </a>
        ,{" "}
        <a
          href="/codex/numerical-optimization-essentials"
          className="text-pink-200 underline underline-offset-4"
        >
          numerical optimisation essentials
        </a>
        , and a future{" "}
        <em>embeddings and vector search</em> entry which will pick up
        the index-side mathematics (HNSW graphs, product quantisation,
        approximate-nearest-neighbour trade-offs) where this one stops.
        The long-form companion lives at{" "}
        <code className="font-mono text-chrome-200">
          docs/MATH-AI-AGENTS.md
        </code>
        .
      </p>

      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          Vaswani <em>et al.</em>,{" "}
          <a
            href="https://arxiv.org/abs/1706.03762"
            className="text-pink-200 underline underline-offset-4"
          >
            <em>Attention Is All You Need</em>
          </a>
          {" "}(NeurIPS 2017). The paper that introduced the
          transformer. The eight-page core has aged better than almost
          anything else in the decade since.
        </li>
        <li>
          Yao <em>et al.</em>,{" "}
          <a
            href="https://arxiv.org/abs/2210.03629"
            className="text-pink-200 underline underline-offset-4"
          >
            <em>ReAct: Synergizing Reasoning and Acting in Language Models</em>
          </a>
          {" "}(ICLR 2023). The Thought / Action / Observation pattern
          the studio&rsquo;s loop is built on. Mostly empirical; the
          prompt template is the deliverable.
        </li>
        <li>
          Su <em>et al.</em>,{" "}
          <a
            href="https://arxiv.org/abs/2104.09864"
            className="text-pink-200 underline underline-offset-4"
          >
            <em>
              RoFormer: Enhanced Transformer with Rotary Position
              Embedding
            </em>
          </a>
          {" "}(2021, journal version 2024). The RoPE paper. The
          rotation-as-relative-position derivation is short and
          worth reading in original.
        </li>
        <li>
          Holtzman <em>et al.</em>,{" "}
          <a
            href="https://arxiv.org/abs/1904.09751"
            className="text-pink-200 underline underline-offset-4"
          >
            <em>The Curious Case of Neural Text Degeneration</em>
          </a>
          {" "}(ICLR 2020). The top-p / nucleus sampling paper, and the
          best-argued case for why pure likelihood maximisation
          produces flat, repetitive text.
        </li>
        <li>
          Andrej Karpathy,{" "}
          <a
            href="https://www.youtube.com/watch?v=kCc8FmEb1nY"
            className="text-pink-200 underline underline-offset-4"
          >
            <em>Let&rsquo;s build GPT: from scratch, in code, spelled out</em>
          </a>
          {" "}(2023). Two hours of bottom-up implementation. The
          fastest way for an engineer to feel where every tensor in
          the transformer block actually goes.
        </li>
        <li>
          Jay Alammar,{" "}
          <a
            href="https://jalammar.github.io/illustrated-transformer/"
            className="text-pink-200 underline underline-offset-4"
          >
            <em>The Illustrated Transformer</em>
          </a>
          . The diagrams in nearly every other transformer
          explainer descend from this one.
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The framing the studio sticks to: a language model is a
          conditional probability table over next tokens, factored
          through learned matrices. Tool use does not change that
          fact; it changes what conditions the distribution. An agent
          loop is not a different kind of model, it is the same model
          called repeatedly with a particular prompt discipline.
        </li>
        <li>
          The geometric reading of RoPE is that two query/key pairs at
          positions{" "}
          <code className="font-mono text-chrome-200">p</code> and{" "}
          <code className="font-mono text-chrome-200">q</code> have
          their dot-product modulated by{" "}
          <code className="font-mono text-chrome-200">
            cos((p &minus; q) &middot; &theta;)
          </code>{" "}
          across each rotation pair &mdash; so any function of{" "}
          <code className="font-mono text-chrome-200">p &minus; q</code>{" "}
          is representable, and absolute positions cancel. This is
          also why &ldquo;NTK-aware&rdquo; RoPE rescaling extends a
          model trained at 4k tokens to run at 128k: rescaling the
          base frequency{" "}
          <code className="font-mono text-chrome-200">&theta;</code>{" "}
          stretches the relative-position basis without retraining.
        </li>
        <li>
          The softmax has the inconvenient property that its output
          magnitudes depend on input scale. Without the{" "}
          <code className="font-mono text-chrome-200">
            &radic;d<sub>k</sub>
          </code>{" "}
          factor, dot-products of two random{" "}
          <code className="font-mono text-chrome-200">d</code>-vectors
          drawn from a unit-variance distribution have variance{" "}
          <code className="font-mono text-chrome-200">d</code>, so the
          softmax saturates and the gradient vanishes. The square-
          root scaling brings the variance back to 1. A tiny
          correction with outsized consequences for trainability.
        </li>
        <li>
          The KV cache also explains why prompt caching at the API
          level is so cheap: the provider can persist the cache for a
          shared prefix across calls and only re-run attention for the
          new tail. For the studio&rsquo;s longer system prompts and
          cast bibles, this is the difference between a fifty-millisecond
          first-token latency and a five-second one. The cache is
          per-prefix, not per-conversation &mdash; identical opening
          text shares cache across requests on the same backend.
        </li>
        <li>
          Holtzman <em>et al.</em>&rsquo;s diagnosis &mdash; that
          beam-search and maximum-likelihood decoding produce text
          with sharply lower variance than human prose &mdash; is the
          empirical core of the top-p method. The pragmatic upshot:
          for any open-ended generation the studio runs, a
          temperature of 0.7 to 0.9 with{" "}
          <code className="font-mono text-chrome-200">top_p = 0.95</code>{" "}
          is the safe default. For tool-call extraction, the studio
          runs temperature 0.0 because the answer wants to be
          deterministic and parseable, not interesting.
        </li>
      </ol>
    </>
  );
}
