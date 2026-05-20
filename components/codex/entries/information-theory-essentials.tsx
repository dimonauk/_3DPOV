export default function InformationTheoryEssentials() {
  return (
    <>
      <p>
        Information theory is the mathematics of surprise. Claude
        Shannon, working at Bell Labs in 1948, asked a question that
        every prior engineer had managed not to ask out loud &mdash; if
        a telegraph sends a message, what exactly is the quantity being
        sent? &mdash; and answered it with a single paper that founded
        a field and named its fundamental unit. The bit, the entropy
        function, the channel capacity theorem, and the source coding
        theorem all arrived in roughly seventy pages. The studio leans
        on that paper, directly and indirectly, every time it picks a
        codec, trains a model, quantises a spherical harmonic
        coefficient, or worries about what an AR card reveals about its
        owner.<sup>1</sup>
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        The bit, and the surprise interpretation
      </h2>
      <p>
        Shannon&rsquo;s first move was to define{" "}
        <strong>information</strong> as a numerical property of an
        event drawn from a probability distribution, rather than as a
        property of the message itself. The information content of an
        outcome <code className="font-mono text-chrome-200">x</code>{" "}
        with probability{" "}
        <code className="font-mono text-chrome-200">p(x)</code> is:
      </p>
      <p className="text-center font-mono text-chrome-200">
        I(x) = &minus;log<sub>2</sub> p(x)
      </p>
      <p>
        The minus sign is there because probabilities are less than one
        and their logarithms are negative; the surprise is positive. The
        base-2 logarithm is a convention; choosing it means the unit
        comes out in <strong>bits</strong>. The intuition is that an
        event one expects (high p) carries little information when it
        happens, and an event one did not expect (low p) carries a
        great deal. A coin landing heads when the coin is honest gives
        the receiver one bit. A coin landing heads when the coin was
        loaded 99-to-1 in favour of heads gives the receiver roughly
        0.0145 bits &mdash; barely any news at all. A coin landing
        tails in that same loaded scenario gives the receiver about
        6.64 bits, because something genuinely improbable just
        happened.
      </p>
      <p>
        That asymmetry is the whole point. The studio inherits it
        directly: every compression codec it touches is, at root, a
        machine for spending fewer bits on the things that happen
        often and more bits on the things that don&rsquo;t.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Entropy: the average surprise
      </h2>
      <p>
        The <strong>entropy</strong> of a random variable{" "}
        <code className="font-mono text-chrome-200">X</code> is the
        expected information content of a draw from{" "}
        <code className="font-mono text-chrome-200">X</code>:
      </p>
      <p className="text-center font-mono text-chrome-200">
        H(X) = &minus;&Sigma;<sub>x</sub> p(x) &middot; log
        <sub>2</sub> p(x)
      </p>
      <p>
        Read aloud: the average number of bits one needs to describe a
        draw, given an optimal code. A worked example is the cleanest
        way to internalise this. The studio offers three:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Fair coin.</strong> Two outcomes, each with{" "}
          <code className="font-mono text-chrome-200">p = 0.5</code>.
          H = &minus;(0.5 &middot; log<sub>2</sub> 0.5 + 0.5 &middot;
          log<sub>2</sub> 0.5) = &minus;(0.5 &middot; &minus;1 + 0.5
          &middot; &minus;1) = <strong>1 bit</strong> exactly. The bit
          is, by construction, the entropy of a fair coin flip. This
          is Shannon&rsquo;s definition of his own unit.
        </li>
        <li>
          <strong>Biased coin,</strong>{" "}
          <code className="font-mono text-chrome-200">p = 0.9</code>{" "}
          for heads. H = &minus;(0.9 &middot; log<sub>2</sub> 0.9 + 0.1
          &middot; log<sub>2</sub> 0.1) &approx; &minus;(0.9 &middot;
          &minus;0.152 + 0.1 &middot; &minus;3.322) &approx;{" "}
          <strong>0.469 bits</strong>. The coin still has two faces,
          but the certainty makes most of its draws uninformative; the
          information per flip falls by more than half.
        </li>
        <li>
          <strong>Uniform 8-sided die.</strong> Eight outcomes, each
          with <code className="font-mono text-chrome-200">p = 1/8</code>
          . H = &minus;8 &middot; (1/8 &middot; log<sub>2</sub> 1/8) =
          &minus;8 &middot; (1/8 &middot; &minus;3) ={" "}
          <strong>3 bits</strong>. The maximum entropy distribution on
          eight outcomes; one cannot do better than three bits per
          throw because three bits is exactly enough to name an
          element of an eight-element set.
        </li>
      </ul>
      <p>
        These three examples give the two principles one needs.
        Entropy is maximised by the uniform distribution &mdash; a fair
        coin beats any biased coin, a fair die beats any loaded die
        &mdash; and entropy is a lower bound. Shannon proved that no
        lossless code can encode draws from{" "}
        <code className="font-mono text-chrome-200">X</code> at a rate
        below <code className="font-mono text-chrome-200">H(X)</code>{" "}
        bits per symbol on average. The <em>source coding theorem</em>{" "}
        is the proof that this floor is also achievable in the limit,
        provided one is allowed to encode long blocks at a time.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Maximum entropy under constraint
      </h2>
      <p>
        The principle generalises. Given a list of constraints &mdash;
        a fixed mean, a fixed variance, a fixed support &mdash; the
        distribution that maximises entropy subject to those
        constraints is the one that &ldquo;assumes the least&rdquo;
        beyond what was specified. The uniform distribution is the
        max-entropy distribution on a bounded interval with no other
        constraint. The Gaussian is the max-entropy distribution on the
        real line given a fixed variance. The exponential distribution
        is the max-entropy distribution on the non-negative real line
        given a fixed mean. These results explain why those particular
        distributions keep appearing wherever a physicist or
        statistician hasn&rsquo;t bothered to motivate them: they are
        the laziest possible answers, in the precise sense that they
        commit to nothing the constraints didn&rsquo;t force.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Joint, conditional, mutual
      </h2>
      <p>
        Two random variables{" "}
        <code className="font-mono text-chrome-200">X</code> and{" "}
        <code className="font-mono text-chrome-200">Y</code> have a{" "}
        <strong>joint entropy</strong>{" "}
        <code className="font-mono text-chrome-200">H(X, Y)</code>{" "}
        &mdash; the average surprise of a draw from the pair &mdash;
        and a <strong>conditional entropy</strong>{" "}
        <code className="font-mono text-chrome-200">H(X | Y)</code>{" "}
        &mdash; the average surprise that remains in{" "}
        <code className="font-mono text-chrome-200">X</code> once{" "}
        <code className="font-mono text-chrome-200">Y</code> is known.
        The chain rule connects them:{" "}
        <code className="font-mono text-chrome-200">
          H(X, Y) = H(Y) + H(X | Y)
        </code>
        .
      </p>
      <p>
        The reduction in uncertainty about{" "}
        <code className="font-mono text-chrome-200">X</code> that{" "}
        <code className="font-mono text-chrome-200">Y</code> provides
        is the <strong>mutual information</strong>:
      </p>
      <p className="text-center font-mono text-chrome-200">
        I(X; Y) = H(X) + H(Y) &minus; H(X, Y)
      </p>
      <p>
        Symmetric in its arguments, zero if and only if the two
        variables are independent, and bounded above by the smaller of
        the two marginal entropies. The studio uses mutual information
        as a feature-selection tool when picking which subset of a
        twenty-eight-dimensional gene space to feed downstream:{" "}
        <em>which gene tells me the most about the trait I&rsquo;m
        breeding for, conditional on the genes I&rsquo;ve already
        selected?</em> The question is operational, and mutual
        information makes it computable.<sup>2</sup>
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        KL divergence: the cost of being wrong about the distribution
      </h2>
      <p>
        Suppose one builds a code optimal for distribution{" "}
        <code className="font-mono text-chrome-200">Q</code> and then
        uses it to encode draws from a different distribution{" "}
        <code className="font-mono text-chrome-200">P</code>. The
        average extra bits one wastes per symbol is the{" "}
        <strong>Kullback&ndash;Leibler divergence</strong>:
      </p>
      <p className="text-center font-mono text-chrome-200">
        D<sub>KL</sub>(P || Q) = &Sigma;<sub>x</sub> p(x) &middot; log
        <sub>2</sub> [ p(x) / q(x) ]
      </p>
      <p>
        Always non-negative, zero if and only if{" "}
        <code className="font-mono text-chrome-200">P = Q</code>, and{" "}
        <em>asymmetric</em> &mdash;{" "}
        <code className="font-mono text-chrome-200">D(P||Q)</code> is
        not in general{" "}
        <code className="font-mono text-chrome-200">D(Q||P)</code>. The
        asymmetry is not a bug; it has physical meaning. The forward
        KL{" "}
        <code className="font-mono text-chrome-200">D(P||Q)</code>{" "}
        punishes <code className="font-mono text-chrome-200">Q</code>{" "}
        for assigning low probability to events that{" "}
        <code className="font-mono text-chrome-200">P</code> says are
        common (mode-covering). The reverse KL{" "}
        <code className="font-mono text-chrome-200">D(Q||P)</code>{" "}
        punishes <code className="font-mono text-chrome-200">Q</code>{" "}
        for assigning probability to events{" "}
        <code className="font-mono text-chrome-200">P</code> says are
        rare (mode-seeking). Variational inference, RLHF, and most
        modern alignment objectives are written as one of these two
        KLs, and which way around it points is exactly the question of
        which failure mode the trainer prefers.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Cross-entropy and the loss function
      </h2>
      <p>
        Closely related, and routinely confused with KL,{" "}
        <strong>cross-entropy</strong> is the total bits one spends
        coding <code className="font-mono text-chrome-200">P</code>{" "}
        with a code built for{" "}
        <code className="font-mono text-chrome-200">Q</code>:
      </p>
      <p className="text-center font-mono text-chrome-200">
        H(P, Q) = &minus;&Sigma;<sub>x</sub> p(x) &middot; log
        <sub>2</sub> q(x) = H(P) + D<sub>KL</sub>(P || Q)
      </p>
      <p>
        Since <code className="font-mono text-chrome-200">H(P)</code>{" "}
        depends only on the data and not on the model, minimising
        cross-entropy with respect to{" "}
        <code className="font-mono text-chrome-200">Q</code> is the
        same as minimising the KL divergence; the constant difference
        cancels in the gradient. This is why every classification
        network the studio has ever trained &mdash; from a four-class
        sculpture-style classifier on the bench to the language models
        underwriting the agent crew &mdash; uses{" "}
        <strong>cross-entropy loss</strong>: it is the
        information-theoretic measure of how badly the model&rsquo;s
        predicted distribution disagrees with the empirical labels. An
        LLM trained by next-token prediction is, mathematically, a
        machine being descended down the cross-entropy gradient of the
        training corpus against the model&rsquo;s own conditional
        distributions. See{" "}
        <em>transformer-and-agent-mathematics</em> for the
        architectural side of that story.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Channel capacity: the limit of error-free communication
      </h2>
      <p>
        Shannon&rsquo;s second great theorem &mdash; the{" "}
        <strong>noisy-channel coding theorem</strong> &mdash; addresses
        the question of how much information can be sent through a
        noisy channel without errors. For a channel with input{" "}
        <code className="font-mono text-chrome-200">X</code> and noisy
        output <code className="font-mono text-chrome-200">Y</code>,
        the <strong>channel capacity</strong> is:
      </p>
      <p className="text-center font-mono text-chrome-200">
        C = max<sub>p(x)</sub> I(X; Y)
      </p>
      <p>
        the maximum mutual information between input and output over
        all possible input distributions. The theorem states that for
        any rate R below C, there exists a code that achieves
        arbitrarily low error rates over long enough block lengths; and
        for any rate above C, no such code exists. This is one of the
        most counter-intuitive results in twentieth-century mathematics
        &mdash; before Shannon, the working assumption was that noise
        forced a graceful trade-off, and the price of arbitrarily low
        error was arbitrarily slow transmission. Shannon proved that
        the trade-off is in fact a cliff, and the cliff edge has a
        formula.
      </p>
      <p>
        Every WiFi router, 5G base station, deep-space probe,
        satellite link, and hard-disk read head the studio has ever
        used reaches for codes designed against this limit &mdash;
        LDPC, turbo, Reed&ndash;Solomon, polar codes &mdash; and the
        modern ones come within fractions of a decibel of theoretical
        capacity. The cliff is real and it is climbed all the way to
        the edge.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Source coding: Huffman, arithmetic, the entropy floor
      </h2>
      <p>
        The other direction is <strong>data compression</strong>.
        Given a source emitting symbols from a distribution{" "}
        <code className="font-mono text-chrome-200">p</code> with
        entropy <code className="font-mono text-chrome-200">H</code>{" "}
        bits per symbol, no lossless code can encode it at fewer than{" "}
        <code className="font-mono text-chrome-200">H</code> bits per
        symbol on average. The two classic constructive proofs that
        the floor is reachable:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Huffman coding</strong> (David Huffman, 1952, as a
          term project). Build a binary tree by repeatedly merging the
          two least-probable symbols. Read off the codeword for each
          symbol as its root-to-leaf path. Provably optimal among
          codes that assign an integer number of bits per symbol; the
          worst case overhead is less than one bit per symbol above
          entropy. JPEG, PNG, ZIP, and DEFLATE all run a Huffman pass
          somewhere in their pipelines.
        </li>
        <li>
          <strong>Arithmetic coding</strong> (Rissanen and Pasco,
          1976). Encode an entire message as a single fractional
          number lying inside a sub-interval of [0, 1) whose width
          equals the message&rsquo;s probability under the model. The
          codeword length is within two bits of{" "}
          <code className="font-mono text-chrome-200">
            &minus;log<sub>2</sub> P(message)
          </code>
          , beating Huffman whenever symbol probabilities are
          fractional powers of two. H.264, H.265, AV1, and the
          state-of-the-art lossless image codecs all use arithmetic or
          range coding as their entropy back-end.
        </li>
      </ul>
      <p>
        A third strand runs alongside &mdash; <strong>dictionary
        coding</strong>, the Lempel&ndash;Ziv family of 1977 and 1978
        &mdash; which doesn&rsquo;t require a probability model at
        all, only the assumption that the source is repetitive. LZ77
        is the engine inside gzip, zstd, brotli, and most everyday
        compressed archives the studio ships.<sup>3</sup>
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Rate&ndash;distortion: when perfect isn&rsquo;t the goal
      </h2>
      <p>
        Lossless compression has a floor. Lossy compression doesn&rsquo;t
        &mdash; one can go arbitrarily small by throwing away enough
        signal &mdash; but the price is reconstruction error. The
        formal trade-off is captured by{" "}
        <strong>rate&ndash;distortion theory</strong>. For a given
        source and a chosen distortion measure (mean-squared error,
        perceptual loss, whatever the application calls for), the{" "}
        <em>rate&ndash;distortion function</em>{" "}
        <code className="font-mono text-chrome-200">R(D)</code> gives
        the minimum number of bits per symbol needed to encode the
        source while keeping average distortion at or below{" "}
        <code className="font-mono text-chrome-200">D</code>. It is
        monotone non-increasing: pay fewer bits, accept more error.
      </p>
      <p>
        Every lossy codec the studio uses sits on a curve of this
        shape. JPEG&rsquo;s quality slider, H.265&rsquo;s CRF
        parameter, the bitrate ladder for an Opus audio stream, the
        spherical-harmonic coefficient bit-depth in the studio&rsquo;s
        Gaussian splat encoder &mdash; all of them are operating
        points on rate&ndash;distortion curves. The studio&rsquo;s
        decision to ship masters in ProRes (low distortion, fat
        bitrate) and delivery copies in H.265 (higher distortion,
        slim bitrate) is exactly the choice of which operating point
        the situation calls for. See{" "}
        <em>gaussian-splat-mathematics</em> for the
        spherical-harmonic-quantisation case in detail.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Where this lives in Holoflow
      </h2>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>The agent crew.</strong> Every specialist in{" "}
          <code className="font-mono text-chrome-200">lib/agents/</code>{" "}
          is the output of a language model trained by cross-entropy
          descent on a corpus, and aligned by KL-regularised RLHF
          against a reward model. Cross-entropy is the loss; KL is the
          regulariser; both are information theory under different
          names.
        </li>
        <li>
          <strong>Compression codecs throughout the delivery
          pipeline.</strong> JPEG and PNG for stills, H.264 and H.265
          and AV1 for video, Opus and FLAC for audio. Each of them is
          a wavelet or DCT or learned transform on the front, an
          entropy coder on the back. The studio&rsquo;s codec choices
          &mdash; ProRes for masters, H.265 for delivery, FLAC for
          archival audio, Opus for streaming &mdash; are
          rate&ndash;distortion decisions made under different
          constraints.
        </li>
        <li>
          <strong>Splat encoding.</strong> A Gaussian splat scene
          carries spherical-harmonic coefficients per splat for
          view-dependent colour. Quantising those coefficients
          aggressively saves megabytes; quantising too aggressively
          shows up as banding in the view-dependent specular
          highlights. The bit-depth-per-coefficient choice is a
          rate&ndash;distortion problem solved per-scene.
        </li>
        <li>
          <strong>Feature selection in the gene space.</strong> The
          studio&rsquo;s sculpture-evolution pipeline runs over a
          twenty-eight-dimensional gene space. Mutual information
          between candidate gene subsets and the trait the breeder is
          selecting for picks the most-informative combinations; this
          is the same maths a bioinformatician runs against a single-
          cell expression matrix, applied to a twenty-eight-gene
          synthetic problem.
        </li>
        <li>
          <strong>Privacy and AR cards.</strong> The looser link.
          Differential privacy&rsquo;s formal guarantee is bounded in
          terms of a divergence (R&eacute;nyi or KL) between
          distributions on outputs given neighbouring inputs;
          k-anonymity is a much weaker but cousin notion. If the
          studio ever publishes aggregate analytics on AR-card use,
          information theory is the framework inside which the
          privacy guarantee is stated.
        </li>
      </ul>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        The single take-away
      </h2>
      <p>
        Information theory is short, sharp, and uniformly useful.
        Surprise is{" "}
        <code className="font-mono text-chrome-200">
          &minus;log p
        </code>
        , entropy is its average, joint and conditional and mutual
        forms compose by a chain rule, KL measures the cost of being
        wrong about a distribution, cross-entropy is the training loss
        of any classifier worth its salt, channel capacity sets the
        ceiling on noisy communication, and rate&ndash;distortion sets
        the floor on lossy compression. Every codec, every model, and
        every honest privacy guarantee the studio ships is somewhere
        on one of those curves. The longer companion at{" "}
        <code className="font-mono text-chrome-200">
          docs/MATH-INFORMATION-THEORY.md
        </code>{" "}
        walks the proofs and the historical context; see also{" "}
        <em>signal-processing-essentials</em> for the
        sampling-and-spectrum side of the same maths,{" "}
        <em>gaussian-splat-mathematics</em> for the
        rate&ndash;distortion case the studio runs daily, and{" "}
        <em>transformer-and-agent-mathematics</em> for cross-entropy
        and KL as model training and alignment objectives.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Claude E. Shannon, &ldquo;A Mathematical Theory of
          Communication,&rdquo; <em>Bell System Technical Journal</em>{" "}
          27 (1948), 379&ndash;423 and 623&ndash;656. The founding
          paper; readable in an afternoon and still the clearest
          introduction to its own ideas.
        </li>
        <li>
          Thomas M. Cover and Joy A. Thomas,{" "}
          <em>Elements of Information Theory</em> (Wiley, 2nd ed.
          2006). The canonical textbook. David J. C. MacKay,{" "}
          <em>Information Theory, Inference, and Learning
          Algorithms</em> (Cambridge, 2003) is freely available as a
          PDF at <code className="font-mono text-chrome-200">
            inference.org.uk/itila/
          </code>{" "}
          and is the friendliest entry point for a working engineer
          who would rather see the maths in motion than in axioms.
        </li>
        <li>
          Jacob Ziv and Abraham Lempel, &ldquo;A Universal Algorithm
          for Sequential Data Compression,&rdquo;{" "}
          <em>IEEE Transactions on Information Theory</em> 23
          (1977), 337&ndash;343. The LZ77 paper. Every gzip,
          zstd, and brotli archive the studio has ever opened or
          shipped descends from this seven-page note.
        </li>
      </ol>
    </>
  );
}
