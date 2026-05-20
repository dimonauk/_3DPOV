export default function GeneticAlgorithmMathematics() {
  return (
    <>
      <p>
        The studio breeds its sculptures with a genetic algorithm, and a
        genetic algorithm is, underneath the costume, a piece of
        mathematics. Every sculpture is a point in a
        twenty-eight-dimensional space; every generation is a cloud of
        such points being nudged about by three small operations
        (selection, crossover, mutation); every &ldquo;good drop&rdquo;
        is a region of that space the population has learned to settle
        in. The breeding article in plain workshop voice already
        describes the loop. This entry is the underlying maths, named
        plainly, with one worked example at the end.<sup>1</sup>
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The genome as a point in &#8477;&sup2;&#8312;
      </h2>
      <p>
        Each sculpture genome is a vector{" "}
        <code className="font-mono text-chrome-200">
          g = (g&#8321;, g&#8322;, &hellip;, g&#8322;&#8328;)
        </code>{" "}
        of twenty-eight real numbers, every entry normalised to the
        unit interval{" "}
        <code className="font-mono text-chrome-200">[0, 1]</code> before
        the generator denormalises it back to a printable parameter.
        The twenty-eight are partitioned by the source-of-truth in{" "}
        <code className="font-mono text-chrome-200">
          lib/evolution/genome.ts
        </code>{" "}
        into five categories &mdash; twelve Form genes (silhouette,
        symmetry, density, curvature, branching, surface noise, twist,
        and so on), eight Material (refractive index, opacity, dye
        gradient, roughness, weight), four Optics (caustic profile,
        Fresnel rings, GRIN gradient, refraction tightness), four
        Waveguide (channel diameter, branch count, root LED count,
        exit aperture), and a further eight Canon-extension genes
        carrying narrative bindings (kingdom affinity, parentage hint,
        ritual gesture, OCEAN bias, fitness target, scale class, edition
        class, narrative tag).
      </p>
      <p>
        Geometrically the search space is the unit hypercube{" "}
        <code className="font-mono text-chrome-200">[0, 1]&sup2;&#8312;</code>.
        That is a perfectly ordinary subset of{" "}
        <code className="font-mono text-chrome-200">&#8477;&sup2;&#8312;</code>{" "}
        and inherits the standard Euclidean metric, which is what
        makes it sensible to talk about &ldquo;nearby&rdquo; genomes,
        gene-vector readouts, and the descent tree as a directed graph
        embedded in that hypercube. The studio&rsquo;s evolution suite
        renders this as a 2D fan-chart only because{" "}
        <em>visualising twenty-eight dimensions on a screen</em> would be
        ungentlemanly.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The fitness landscape, and why the terrain metaphor is a fib
      </h2>
      <p>
        The fitness function{" "}
        <code className="font-mono text-chrome-200">
          f : [0, 1]&sup2;&#8312; &rarr; &#8477;
        </code>{" "}
        assigns to every genome a real-valued score. Plot that scalar
        over a two-dimensional slice of the search space and the
        result genuinely looks like rolling country: peaks where good
        sculptures live, valleys where the awful ones lurk, ridges
        connecting families of related forms. The mental image is
        useful, and it is also misleading.<sup>2</sup>
      </p>
      <p>
        It is misleading because twenty-eight-dimensional terrain
        does not behave like the three-dimensional terrain the
        metaphor borrows from. Nearly all of the hypercube&rsquo;s
        volume sits within a thin shell near its boundary; uniform
        random sampling almost never hits the &ldquo;middle&rdquo;.
        Gradients become useless because the function isn&rsquo;t
        differentiable when the fitness is a human pressing a star
        button. Local maxima multiply combinatorially. Most distressing
        of all, the fitness landscape <em>moves under the feet of the
        population</em> &mdash; the maker&rsquo;s taste drifts across a
        session, and the same genome scored at generation 5 and
        generation 25 attracts different stars. Treat the landscape
        as a working metaphor for talking about hill-climbing,
        crossover-as-jumping-between-basins, and the wildcard mutations
        that lob a probe over the next ridge. Don&rsquo;t treat it as
        a literal map.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Pareto fronts &mdash; why &ldquo;aesthetic plus printable plus
        cost&rdquo; refuses to be one number
      </h2>
      <p>
        The breeding article reports fitness as a single one-to-five
        star score. That is fine for the studio&rsquo;s interactive
        sessions, where the maker is the fitness function and can hold
        several criteria in her head at once. The moment the engine is
        asked to optimise without a human in the loop &mdash; for
        instance, when the planned bridge in{" "}
        <code className="font-mono text-chrome-200">
          lib/evolution/genomeKingdomBridge.ts
        </code>{" "}
        proposes candidates against a kingdom&rsquo;s probability
        profile &mdash; the fitness is genuinely multi-objective:
        aesthetic merit, printability, material cost, optical fidelity,
        edition uniqueness. Three or four numbers, not one.
      </p>
      <p>
        Two ways to handle several objectives. The first is{" "}
        <strong>scalarisation</strong>: pick weights{" "}
        <code className="font-mono text-chrome-200">
          (w&#8321;, w&#8322;, &hellip;, w&#8336;)
        </code>{" "}
        and collapse the objectives into{" "}
        <code className="font-mono text-chrome-200">
          F(g) = w&#8321; f&#8321;(g) + w&#8322; f&#8322;(g) + &hellip; +
          w&#8336; f&#8336;(g)
        </code>
        . Quick to implement, mathematically equivalent to drawing a
        line through the criterion space and ranking by projection.
        Useful when the criteria genuinely trade off in a known ratio.
        Hopeless when the trade-off is unknown &mdash; and the
        sculpture-cost-printability trade-off is exactly that.
      </p>
      <p>
        The second is the <strong>Pareto front</strong>. A genome{" "}
        <code className="font-mono text-chrome-200">g</code> dominates{" "}
        <code className="font-mono text-chrome-200">g&#8242;</code> if{" "}
        <code className="font-mono text-chrome-200">f&#8336;(g) &ge; f&#8336;(g&#8242;)</code>{" "}
        for every objective <em>k</em> and strictly better on at least
        one. The Pareto front is the set of non-dominated genomes
        &mdash; the genomes such that no other in the population beats
        them on every axis at once. Multi-objective evolutionary
        algorithms such as NSGA-II maintain populations spread along
        this front rather than collapsed onto a single peak.<sup>3</sup>{" "}
        A drop curated from a Pareto front offers the buyer a genuine
        choice between &ldquo;more optically clever&rdquo; and
        &ldquo;cheaper to cast&rdquo;, both of which are valid.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Crossover semantics &mdash; three flavours, three rates
      </h2>
      <p>
        Once two parents <code className="font-mono text-chrome-200">a</code>{" "}
        and <code className="font-mono text-chrome-200">b</code> have
        been chosen, the engine produces a child by combining their
        genes. Three flavours of crossover, with different convergence
        behaviour:
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Blend crossover.</strong>{" "}
          <code className="font-mono text-chrome-200">
            c&#7522; = &alpha; a&#7522; + (1 &minus; &alpha;) b&#7522;
          </code>{" "}
          per gene <em>i</em>, with{" "}
          <code className="font-mono text-chrome-200">&alpha; &isin; [0, 1]</code>{" "}
          either fixed at 0.5 or drawn at random. The child is a linear
          interpolation between its parents in gene-vector space.
          Convergence is fast and smooth; the population implodes
          towards the mean rather quickly.
        </li>
        <li>
          <strong>Uniform crossover.</strong> Per gene, copy from parent
          A with probability 0.5, otherwise from parent B. No blending
          &mdash; every gene is one parent&rsquo;s value or the
          other&rsquo;s. This is the studio&rsquo;s operational default.
          Convergence is slower than blend, but the population retains
          discrete combinations the parents had between them.
        </li>
        <li>
          <strong>Single-point crossover.</strong> Pick an index{" "}
          <em>k</em>, give the child genes 1&hellip;<em>k</em> from
          parent A and <em>k</em>+1&hellip;28 from parent B. Cheap to
          compute, and useful when adjacency in the gene vector encodes
          something meaningful &mdash; which it doesn&rsquo;t for the
          studio&rsquo;s alphabet, since the gene order is mostly
          editorial. Convergence behaviour sits between blend and
          uniform.
        </li>
      </ul>
      <p>
        Goldberg&rsquo;s textbook treatment proves that uniform
        crossover has lower bias on long, weakly-coupled genomes and
        higher disruption on tightly-coupled ones &mdash; which is
        exactly why a fixed-length, weakly-structured alphabet like the
        studio&rsquo;s sits comfortably with uniform.<sup>4</sup>
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Mutation &mdash; Gaussian noise, and the sigma trap
      </h2>
      <p>
        After crossover, each child gene is perturbed with probability{" "}
        <em>p</em><sub>m</sub> by adding Gaussian noise{" "}
        <code className="font-mono text-chrome-200">
          &epsilon; &sim; N(0, &sigma;&sup2;)
        </code>{" "}
        and clamping the result back into{" "}
        <code className="font-mono text-chrome-200">[0, 1]</code>. The
        studio runs <em>p</em><sub>m</sub> = 0.15 and{" "}
        <code className="font-mono text-chrome-200">&sigma; = 0.1</code>,
        with 5% of mutated genes promoted to wildcards (a fresh
        uniform sample rather than a perturbation). Wildcards exist
        precisely because of the failure mode of a fixed sigma.
      </p>
      <p>
        The failure mode: too small a sigma and the population can only
        do local search &mdash; it climbs the nearest hill and never
        sees the better hill behind it. Too large a sigma and useful
        structure is shaken to pieces every generation. A constant
        sigma under-explores once the population has settled near a
        peak, because the same noise that was usefully exploratory at
        generation 1 is now a tax on the genes that already work. The
        textbook escape route is the{" "}
        <strong>(&mu; + &lambda;) evolution strategy</strong> with
        self-adaptive step sizes, where each genome carries its own
        sigma and the sigma itself is mutated and inherited; the
        children whose sigmas happen to be well-tuned out-reproduce
        the rest, and the step size shrinks naturally as the population
        zeroes in.<sup>5</sup> The studio&rsquo;s engine uses the
        cruder constant-sigma-plus-wildcards approximation because the
        loop is short enough (twenty-five candidates, twenty
        generations) that the elegant theory doesn&rsquo;t pay back the
        complexity.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Selection &mdash; tournament wins on temperament
      </h2>
      <p>
        Three selection strategies are taught in every evolutionary
        computation course; one is the studio&rsquo;s operational
        default for a reason.
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Roulette wheel (fitness-proportional).</strong> Each
          genome is selected with probability proportional to its
          fitness, like a roulette wheel whose slot widths reflect
          scores. Mathematically clean. Behaviourally fragile: a single
          high-scoring outlier hoovers up the probability mass and the
          population collapses to its descendants in two or three
          generations.
        </li>
        <li>
          <strong>Rank-based.</strong> Sort the population by fitness;
          select with probability proportional to rank rather than raw
          score. Robust to fitness outliers but loses the actual
          magnitude information &mdash; a generation where every
          genome scores three stars is treated the same as one where
          every genome scores five.
        </li>
        <li>
          <strong>Tournament (size <em>k</em>).</strong> Pick{" "}
          <em>k</em> random genomes; the highest-scoring becomes a
          parent. Repeat. Selection pressure is controlled by{" "}
          <em>k</em>: <em>k</em> = 1 is random selection, large{" "}
          <em>k</em> approaches always-pick-the-best. The studio uses{" "}
          <em>k</em> = 3, which is moderate pressure &mdash; a
          score-two candidate can still parent if it beats two
          score-ones.
        </li>
      </ul>
      <p>
        Tournament is the operational default because it is
        invariant to monotonic rescaling of the fitness (it only uses
        comparisons, not absolute values), it is trivially parallel,
        and its selection pressure is a single tunable knob. Roulette
        and rank-based are taught for completeness; the working studio
        uses tournament.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Kingdom-bias probability profiles
      </h2>
      <p>
        Each of the eight kingdoms in the studio&rsquo;s taxonomy
        (techno, artistic, choreographic, biomech, thermal, protean,
        assemblage, ritual) corresponds to a weight vector{" "}
        <code className="font-mono text-chrome-200">
          w<sup>(K)</sup> &isin; &#8477;&sup2;&#8312;
        </code>{" "}
        over the twenty-eight genes. The lookup table planned for{" "}
        <code className="font-mono text-chrome-200">
          lib/evolution/genomeKingdomBridge.ts
        </code>{" "}
        is precisely this map: kingdom &rarr; weight vector.
      </p>
      <p>
        The weights bias sampling through soft-constraint
        scalarisation. When sampling a new genome targeted at kingdom{" "}
        <em>K</em>, the engine draws each gene from a non-uniform
        distribution whose mean is shifted by{" "}
        <code className="font-mono text-chrome-200">w<sup>(K)</sup></code>{" "}
        and whose variance is reduced for genes the kingdom cares
        about. <em>Techno</em>, for instance, biases towards high cell
        density, high symmetry, and low organic drift; the kingdom
        weight pulls those three genes towards their high or low ends
        and tightens their variance, while leaving the genes the
        kingdom doesn&rsquo;t care about (say, dye gradient) at the
        default broad uniform.
      </p>
      <p>
        Two important properties. First, the bias is <em>soft</em>:
        nothing prevents a techno genome from carrying a low symmetry
        value, just makes it improbable. Second, the same weight vector
        can be re-used as a fitness ingredient &mdash; an off-kingdom
        genome scores lower on kingdom-fit, which makes the kingdom
        profile both a sampling distribution and a fitness axis. This
        is why a Pareto formulation matters: kingdom-fit and aesthetic
        merit are separate objectives that occasionally pull in
        different directions.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Diversity maintenance &mdash; and why the sample population
        doesn&rsquo;t need it
      </h2>
      <p>
        Real-world genetic algorithms famously collapse: after a few
        generations the population becomes a cloud of near-identical
        copies of whichever genome first scored well, and the
        remaining generations refine the same idea instead of
        exploring new ones. Two textbook countermeasures:
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Niching.</strong> Partition the population into
          subgroups (niches) and run selection within each niche.
          Different niches converge on different peaks. The
          implementation usually involves a similarity radius and a
          rule that genomes inside the radius of an existing niche
          either join it or get rejected.
        </li>
        <li>
          <strong>Fitness sharing.</strong> Penalise a genome&rsquo;s
          fitness by how many of its near neighbours also score well.
          The crowded peaks effectively share their fitness budget
          between their occupants, which makes the population spread
          itself across multiple peaks rather than piling onto the
          tallest.
        </li>
      </ul>
      <p>
        The studio&rsquo;s sample population in{" "}
        <code className="font-mono text-chrome-200">
          lib/evolution/sample-population.ts
        </code>{" "}
        sidesteps both. It builds a four- or five-generation lineage
        of around thirty-six genomes <em>deterministically</em> from a
        single seed, using a fixed generation plan{" "}
        <code className="font-mono text-chrome-200">[8, 10, 8, 6, 4]</code>{" "}
        and a seeded pseudo-random number generator. Because the
        descent tree is written from a seed rather than evolved
        against a moving fitness, there is no convergence pressure,
        and therefore no diversity to collapse. The lineage exists
        purely to populate the Evolution Hub fan-chart with a
        believable family tree; it is not a real optimisation.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The overfitting trap
      </h2>
      <p>
        One failure mode deserves its own paragraph because it is
        invisible until it isn&rsquo;t. When the same fitness scorer
        judges every generation &mdash; whether that scorer is a
        human, a vision-language-model auditor, or a hand-coded
        heuristic &mdash; the population eventually converges not on
        good sculptures but on <em>the scorer&rsquo;s blind spots</em>.
        Any peculiarity in how the scorer weighs criteria is amplified
        across generations until the engine learns to exploit it: a
        VLM that over-rewards symmetry produces ever more symmetrical
        sculptures; a tired maker who clicks four stars by reflex
        breeds reflex-pleasers; a printability heuristic that
        rewards small bounding boxes shrinks the population towards
        the trivial.<sup>6</sup> The studio mitigates this with three
        levers: keep the human awake (sessions of thirty minutes to
        two hours, never longer), inject five wildcard genomes per
        generation, and switch between scorers periodically so no
        single set of blind spots dominates the lineage. The maths is
        the maths; the discipline around the maths is what keeps the
        output honest.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        A worked example
      </h2>
      <p>
        Two parent genomes, five of the twenty-eight genes shown for
        legibility. Uniform crossover, then Gaussian mutation with{" "}
        <code className="font-mono text-chrome-200">&sigma; = 0.1</code>
        , clamped to <code className="font-mono text-chrome-200">[0, 1]</code>.
      </p>
      <table className="my-4 w-full border-collapse text-sm text-chrome-300">
        <thead>
          <tr className="border-b border-warm-black-700 text-chrome-200">
            <th className="py-2 pr-3 text-left">Gene</th>
            <th className="py-2 pr-3 text-left">Parent A</th>
            <th className="py-2 pr-3 text-left">Parent B</th>
            <th className="py-2 pr-3 text-left">Uniform pick</th>
            <th className="py-2 pr-3 text-left">After mutation</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-warm-black-800">
            <td className="py-2 pr-3 font-mono">cell_density</td>
            <td className="py-2 pr-3 font-mono">0.62</td>
            <td className="py-2 pr-3 font-mono">0.31</td>
            <td className="py-2 pr-3 font-mono">0.62 (A)</td>
            <td className="py-2 pr-3 font-mono">0.58</td>
          </tr>
          <tr className="border-b border-warm-black-800">
            <td className="py-2 pr-3 font-mono">twist</td>
            <td className="py-2 pr-3 font-mono">0.45</td>
            <td className="py-2 pr-3 font-mono">0.82</td>
            <td className="py-2 pr-3 font-mono">0.82 (B)</td>
            <td className="py-2 pr-3 font-mono">0.82</td>
          </tr>
          <tr className="border-b border-warm-black-800">
            <td className="py-2 pr-3 font-mono">ior</td>
            <td className="py-2 pr-3 font-mono">0.50</td>
            <td className="py-2 pr-3 font-mono">0.75</td>
            <td className="py-2 pr-3 font-mono">0.50 (A)</td>
            <td className="py-2 pr-3 font-mono">0.61</td>
          </tr>
          <tr className="border-b border-warm-black-800">
            <td className="py-2 pr-3 font-mono">transmission</td>
            <td className="py-2 pr-3 font-mono">0.88</td>
            <td className="py-2 pr-3 font-mono">0.40</td>
            <td className="py-2 pr-3 font-mono">0.88 (A)</td>
            <td className="py-2 pr-3 font-mono">0.88</td>
          </tr>
          <tr className="border-b border-warm-black-800">
            <td className="py-2 pr-3 font-mono">tube_radius</td>
            <td className="py-2 pr-3 font-mono">0.20</td>
            <td className="py-2 pr-3 font-mono">0.55</td>
            <td className="py-2 pr-3 font-mono">0.55 (B)</td>
            <td className="py-2 pr-3 font-mono">0.49</td>
          </tr>
        </tbody>
      </table>
      <p>
        The uniform-pick column applies the per-gene fair coin: three
        genes came from parent A, two from parent B. The mutation
        column shows the result of the 15% per-gene mutation roll;
        three of the five genes were mutated (cell_density, ior,
        tube_radius) with Gaussian noise of{" "}
        <code className="font-mono text-chrome-200">&minus;0.04</code>,{" "}
        <code className="font-mono text-chrome-200">+0.11</code> and{" "}
        <code className="font-mono text-chrome-200">&minus;0.06</code>{" "}
        respectively. Two genes (twist, transmission) survived the
        mutation roll unchanged. The child is then denormalised by the
        generator, rendered through one of the five biomimetic
        kingdoms, validated for watertightness, and presented to the
        maker for scoring. If she clicks four stars, the engine has
        learned that the neighbourhood around this point in{" "}
        <code className="font-mono text-chrome-200">[0, 1]&sup2;&#8312;</code>{" "}
        is worth exploring; if she clicks two, it has learned to
        steer away.
      </p>
      <p>
        That is the whole mathematical machinery. A point in a
        twenty-eight-dimensional unit hypercube, a function on it
        defined by a human pressing buttons, three operators that move
        the cloud of points around, and a discipline that prevents the
        cloud from collapsing into one of the scorer&rsquo;s blind
        spots. The studio&rsquo;s sculpture genome lives in this
        space; the planned linear-algebra essentials entry will say
        more about the metric and the projections used to read it
        back into two dimensions, and the numerical-optimisation
        essentials entry will compare this gradient-free evolutionary
        approach against gradient-based alternatives the engine
        deliberately does not use.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Holland, J. H. (1975). <em>Adaptation in Natural and Artificial
          Systems.</em> University of Michigan Press. The founding text
          of the genetic-algorithm tradition; introduced the
          schema-theorem analysis of why bit-string crossover works.
        </li>
        <li>
          Goldberg, D. E. (1989). <em>Genetic Algorithms in Search,
          Optimization, and Machine Learning.</em> Addison-Wesley. The
          textbook treatment of operator bias, schema disruption,
          building-block hypothesis, and the comparative analysis of
          one-point, two-point, and uniform crossover.
        </li>
        <li>
          Deb, K., Pratap, A., Agarwal, S., &amp; Meyarivan, T. (2002).{" "}
          <em>A fast and elitist multiobjective genetic algorithm:
          NSGA-II.</em> IEEE Transactions on Evolutionary Computation,
          6(2), 182&ndash;197. The canonical multi-objective genetic
          algorithm and the source of the &ldquo;non-dominated sort plus
          crowding distance&rdquo; pattern.
        </li>
        <li>
          Eiben, A. E., &amp; Smith, J. E. (2015).{" "}
          <em>Introduction to Evolutionary Computing</em> (2nd ed.).
          Springer. The modern reference for the family of evolutionary
          algorithms &mdash; genetic algorithms, evolution strategies,
          genetic programming &mdash; including the self-adaptive
          (&mu; + &lambda;) strategies referenced for adaptive sigma.
        </li>
        <li>
          The bench&rsquo;s working choice not to implement self-adaptive
          sigma is a deliberate complexity budget. The interactive
          aesthetic loop is short enough that a constant sigma plus 5%
          wildcards covers most of the exploration-exploitation balance
          the theory recommends. A longer headless run (the planned
          kingdom-bridge sampler) is where adaptive sigma will earn its
          keep.
        </li>
        <li>
          The blind-spot collapse mode is the structural reason the
          studio is reluctant to delegate scoring to a single
          vision-language model auditor. A VLM is a fine sieve; it is a
          poor sole judge. The breeding article&rsquo;s reminder that
          &ldquo;nothing in this loop is automated decision-making&rdquo;
          is operationally a hedge against this exact failure mode.
        </li>
      </ol>
    </>
  );
}
