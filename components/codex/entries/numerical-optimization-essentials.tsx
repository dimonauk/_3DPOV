export default function NumericalOptimizationEssentials() {
  return (
    <>
      <p>
        Numerical optimisation is the mathematics of finding the lowest
        point in a landscape you cannot see whole &mdash; the value of
        a parameter vector{" "}
        <code className="font-mono text-chrome-200">x</code> that
        minimises a function{" "}
        <code className="font-mono text-chrome-200">f(x)</code>,
        possibly with constraints attached. Every neural network ever
        trained, every photogrammetric reconstruction ever solved,
        every gaussian splat ever fitted, every caustic disc ever
        designed is, underneath the marketing, a particular instance
        of this same framing.<sup>1</sup>
      </p>
      <p>
        The canonical statement is short:
      </p>
      <p className="ml-6 font-mono text-chrome-200">
        minimise&nbsp; f(x)&nbsp; subject to&nbsp; g(x) &le; 0,
        &nbsp; h(x) = 0
      </p>
      <p>
        Three pieces. The <em>objective</em>{" "}
        <code className="font-mono text-chrome-200">f</code> &mdash;
        what we are trying to make small (reconstruction error,
        rendering loss, energy of a configuration). The{" "}
        <em>decision variable</em>{" "}
        <code className="font-mono text-chrome-200">x</code> &mdash;
        whatever knobs we are allowed to turn (network weights, splat
        positions, camera poses, lens heights). And the{" "}
        <em>constraints</em>{" "}
        <code className="font-mono text-chrome-200">g, h</code> &mdash;
        the rules of the room (non-negativity, manufacturing tolerance,
        unit norm, energy conservation). If the constraints are absent
        the problem is <em>unconstrained</em>; if they are present and
        active the problem becomes meaningfully harder, and you reach
        for Lagrangians.
      </p>
      <p>
        Most of what follows is dedicated to iterative methods: pick a
        starting point{" "}
        <code className="font-mono text-chrome-200">x&#8320;</code>,
        propose a step, accept or shrink it, repeat until something
        stops moving. The methods differ in how cleverly they pick the
        step, and how much information about{" "}
        <code className="font-mono text-chrome-200">f</code> they
        demand in return.
      </p>

      <h3 className="mt-10 mb-3 font-display text-xl text-chrome-100">
        Gradient descent &mdash; the workhorse
      </h3>
      <p>
        The gradient{" "}
        <code className="font-mono text-chrome-200">&nabla;f(x)</code>{" "}
        is the vector of partial derivatives; it points uphill, in the
        direction of steepest ascent. The first instinct of every
        optimisation method is to step in the opposite direction:
      </p>
      <p className="ml-6 font-mono text-chrome-200">
        x<sub>k+1</sub> = x<sub>k</sub> &minus; &alpha; &middot;
        &nabla;f(x<sub>k</sub>)
      </p>
      <p>
        The scalar{" "}
        <code className="font-mono text-chrome-200">&alpha;</code> is
        the <em>learning rate</em> and the entire field has, with
        only minor exaggeration, spent twenty years inventing ways to
        choose it. Too small and convergence crawls; too large and the
        iterates bounce around the bowl or diverge entirely.{" "}
        <em>Momentum</em> &mdash; carrying a fraction of the previous
        step into the current one &mdash; lets the iterate accumulate
        speed along long shallow valleys and resist being pushed
        sideways by noise.
      </p>
      <p>
        Worked example. Let{" "}
        <code className="font-mono text-chrome-200">f(x) = (x &minus; 3)&sup2; + 2</code>.
        The gradient is{" "}
        <code className="font-mono text-chrome-200">f&#8242;(x) = 2(x &minus; 3)</code>.
        Start from{" "}
        <code className="font-mono text-chrome-200">x&#8320; = 0</code>{" "}
        with learning rate{" "}
        <code className="font-mono text-chrome-200">&alpha; = 0.3</code>.
        The iterates run:
      </p>
      <ul className="ml-6 list-disc space-y-1 font-mono text-chrome-200">
        <li>x&#8320; = 0.000, f&#8242; = &minus;6.0, step to 1.800</li>
        <li>x&#8321; = 1.800, f&#8242; = &minus;2.4, step to 2.520</li>
        <li>x&#8322; = 2.520, f&#8242; = &minus;0.96, step to 2.808</li>
        <li>x&#8323; = 2.808, f&#8242; = &minus;0.384, step to 2.923</li>
        <li>x&#8324; = 2.923, f&#8242; = &minus;0.154, step to 2.969</li>
        <li>&hellip; converging geometrically to x* = 3</li>
      </ul>
      <p>
        That is the entire flavour of gradient descent: each step
        shrinks the remaining distance by a constant factor (here, 0.4
        per iteration). In one dimension the picture is friendly. In a
        million dimensions, with a non-convex landscape full of
        saddles and ridges, the same algorithm is still the workhorse
        &mdash; it just needs more guile to stay on track.<sup>2</sup>
      </p>
      <p>
        Saddle points deserve a note. At a saddle the gradient
        vanishes &mdash; gradient descent stalls &mdash; even though
        the point is not a minimum. In high dimensions saddles are
        much more common than local minima, which is part of why
        plain gradient descent struggles on deep networks and why
        every modern variant adds either momentum, noise, or curvature
        information to push through them.
      </p>

      <h3 className="mt-10 mb-3 font-display text-xl text-chrome-100">
        Newton&rsquo;s method &mdash; use the curvature
      </h3>
      <p>
        Newton&rsquo;s method asks for second-order information &mdash;
        the Hessian{" "}
        <code className="font-mono text-chrome-200">H = &nabla;&sup2;f</code>{" "}
        &mdash; and uses it to step directly toward where the gradient
        ought to vanish:
      </p>
      <p className="ml-6 font-mono text-chrome-200">
        x<sub>k+1</sub> = x<sub>k</sub> &minus; H(x<sub>k</sub>)<sup>&minus;1</sup> &middot; &nabla;f(x<sub>k</sub>)
      </p>
      <p>
        Near a minimum where{" "}
        <code className="font-mono text-chrome-200">f</code> is
        well-approximated by a quadratic, Newton converges{" "}
        <em>quadratically</em>: the number of correct digits roughly
        doubles with each iteration. The price is the Hessian itself,
        which is{" "}
        <code className="font-mono text-chrome-200">n &times; n</code>{" "}
        for an{" "}
        <code className="font-mono text-chrome-200">n</code>-dimensional
        problem, and inverting it costs{" "}
        <code className="font-mono text-chrome-200">O(n&sup3;)</code>.
        For a small bundle adjustment Newton is glorious. For a neural
        network with ten million parameters it is unthinkable.
      </p>

      <h3 className="mt-10 mb-3 font-display text-xl text-chrome-100">
        Gauss-Newton and Levenberg-Marquardt &mdash; for least squares
      </h3>
      <p>
        A great many bench problems are <em>least-squares</em>{" "}
        problems: the objective is a sum of squared residuals,
      </p>
      <p className="ml-6 font-mono text-chrome-200">
        f(x) = &frac12; &Sigma;<sub>i</sub> r<sub>i</sub>(x)&sup2;
      </p>
      <p>
        which is the shape of every photogrammetric bundle
        adjustment, every gaussian-splat training loss against
        observed pixels, every shape-from-X reconstruction. For this
        family the Hessian factors usefully into the Jacobian of the
        residuals: Gauss-Newton approximates{" "}
        <code className="font-mono text-chrome-200">H &asymp; J<sup>T</sup>J</code>{" "}
        and ignores the second-derivative term, which is cheap and
        works well near the optimum.{" "}
        <em>Levenberg-Marquardt</em> blends Gauss-Newton with gradient
        descent by adding a damping term{" "}
        <code className="font-mono text-chrome-200">&lambda;I</code> to{" "}
        <code className="font-mono text-chrome-200">J<sup>T</sup>J</code>:
        large{" "}
        <code className="font-mono text-chrome-200">&lambda;</code>{" "}
        gives a short, safe gradient step; small{" "}
        <code className="font-mono text-chrome-200">&lambda;</code>{" "}
        gives a Gauss-Newton step. The algorithm tunes{" "}
        <code className="font-mono text-chrome-200">&lambda;</code>{" "}
        on the fly. Levenberg-Marquardt is the algorithm inside Ceres
        Solver, inside COLMAP&rsquo;s bundle adjuster, and inside
        every commercial photogrammetry tool the studio has ever
        used.
      </p>

      <h3 className="mt-10 mb-3 font-display text-xl text-chrome-100">
        Stochastic gradient descent &mdash; the case for noise
      </h3>
      <p>
        If the objective is a sum over millions of training examples,
        computing the full gradient is prohibitive. Stochastic
        gradient descent (SGD) samples a small batch, computes the
        gradient on the batch, and steps. The estimate is noisy &mdash;
        and that is the point. Noise rattles the iterate out of
        shallow saddles and dubious local minima that a clean
        gradient would happily descend into.
      </p>
      <p>
        <em>Adam</em> (Kingma &amp; Ba, 2014) is the variant most
        often reached for: it maintains exponentially-weighted moving
        averages of both the gradient and its squared magnitude, and
        uses the ratio to give every parameter its own adaptive
        learning rate. It behaves like SGD-with-momentum on flat
        landscapes and like a normaliser on steep ones, and it is
        almost certainly the optimiser inside whatever splat-training
        code, vocoder-training code, or diffusion fine-tune the
        studio is currently running.{" "}
        <em>AdamW</em> &mdash; Adam with weight decay properly
        decoupled from the gradient step &mdash; is the version that
        actually appears in modern training scripts.<sup>3</sup>
      </p>

      <h3 className="mt-10 mb-3 font-display text-xl text-chrome-100">
        Convex vs non-convex
      </h3>
      <p>
        A function is <em>convex</em> if the line segment between any
        two points on its graph lies on or above the graph itself.
        Convex problems are the friendly half of optimisation: any
        local minimum is a global minimum, gradient descent is
        guaranteed to find it (with reasonable step sizes), and a
        substantial body of theory delivers exact convergence rates.
        Linear and logistic regression, support-vector machines, and
        many problems in signal processing are convex.
      </p>
      <p>
        Almost nothing in the studio&rsquo;s pipeline is. Neural
        networks are wildly non-convex; gaussian-splat training is
        non-convex; caustic inverse design is non-convex with sharp
        constraint boundaries; genetic-algorithm fitness landscapes
        are non-convex by construction. Non-convex problems have
        multiple local minima, the global one of which is generally
        impossible to certify. The honest answer is that practical
        methods find a sufficiently good local minimum and call it
        the answer; the bench discipline is checking that the answer
        survives perturbation and that the seed of the run did not
        smuggle in a hidden bias.
      </p>

      <h3 className="mt-10 mb-3 font-display text-xl text-chrome-100">
        Constraints &mdash; Lagrangians, light touch
      </h3>
      <p>
        Constrained problems are handled by re-framing them as
        unconstrained problems via the Lagrangian:
      </p>
      <p className="ml-6 font-mono text-chrome-200">
        L(x, &lambda;, &mu;) = f(x) + &Sigma; &lambda;<sub>i</sub> h<sub>i</sub>(x) + &Sigma; &mu;<sub>j</sub> g<sub>j</sub>(x)
      </p>
      <p>
        The auxiliary variables{" "}
        <code className="font-mono text-chrome-200">&lambda;</code>{" "}
        and{" "}
        <code className="font-mono text-chrome-200">&mu;</code>{" "}
        (multipliers) buy back the constraints at the cost of extra
        unknowns. The KKT conditions &mdash; Karush-Kuhn-Tucker &mdash;
        are the first-order optimality conditions a constrained
        optimum must satisfy; they generalise &ldquo;the gradient is
        zero&rdquo; to the constrained case. The reader does not need
        the algebra here. The reader needs the awareness that any
        line that says &ldquo;subject to&rdquo; in a paper is hiding a
        Lagrangian, and that solving the constrained problem is
        almost always more delicate than the unconstrained one.
      </p>

      <h3 className="mt-10 mb-3 font-display text-xl text-chrome-100">
        Where the studio meets these
      </h3>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Gaussian splat training</strong> &mdash; Adam over
          per-splat position, covariance, opacity, and spherical-
          harmonic colour, against a differentiable rasteriser loss.
          See the future{" "}
          <strong>
            <a
              href="/codex/gaussian-splat-mathematics"
              className="text-pink-200 underline underline-offset-4"
            >
              gaussian splat mathematics
            </a>
          </strong>{" "}
          entry for the splat-side specifics.
        </li>
        <li>
          <strong>Caustic inverse design</strong> &mdash; a
          Monge-Amp&egrave;re gradient flow that solves an optimal-
          transport problem between source illumination and target
          image; the height field of the disc falls out of the
          converged map.
        </li>
        <li>
          <strong>Photogrammetry bundle adjustment</strong> &mdash;
          Levenberg-Marquardt over camera poses and 3D point positions,
          minimising re-projection error across all views.
        </li>
        <li>
          <strong>Genetic-algorithm fitness exploration</strong>{" "}
          &mdash; gradient-free, but the same framing: minimise a
          fitness function over a population of candidate solutions.
          See the future{" "}
          <strong>
            <a
              href="/codex/genetic-algorithm-mathematics"
              className="text-pink-200 underline underline-offset-4"
            >
              genetic algorithm mathematics
            </a>
          </strong>{" "}
          entry for the evolutionary specifics.
        </li>
        <li>
          <strong>Neural vocoder training</strong> &mdash; AdamW over
          tens of millions of parameters with a learning-rate schedule
          that warms up and decays.
        </li>
      </ul>
      <p>
        The matrix machinery underneath all of this &mdash; the
        Jacobians, Hessians, normal equations &mdash; is the subject
        of the companion{" "}
        <strong>
          <a
            href="/codex/linear-algebra-essentials"
            className="text-pink-200 underline underline-offset-4"
          >
            linear algebra essentials
          </a>
        </strong>{" "}
        entry. Optimisation is what we do with the matrices once we
        have them.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The standard reference is Nocedal &amp; Wright,{" "}
          <em>Numerical Optimization</em> (Springer, 2nd ed., 2006).
          For the convex side specifically, Boyd &amp; Vandenberghe,{" "}
          <em>Convex Optimization</em> (Cambridge, 2004) is free
          online and is the textbook used by every graduate course in
          the field; the Adam paper proper is Kingma &amp; Ba,{" "}
          &ldquo;Adam: A Method for Stochastic Optimization,&rdquo;
          ICLR 2015 (arXiv 1412.6980).
        </li>
        <li>
          The convergence rate for gradient descent on a quadratic
          with Hessian eigenvalues bounded between{" "}
          <code className="font-mono text-chrome-300">m</code> and{" "}
          <code className="font-mono text-chrome-300">M</code> is{" "}
          <code className="font-mono text-chrome-300">(M&minus;m)/(M+m)</code>
          {" "}per iteration with optimal step size. The ratio{" "}
          <code className="font-mono text-chrome-300">M/m</code> is
          the <em>condition number</em>; ill-conditioned problems
          (long, thin valleys) are why preconditioning exists.
        </li>
        <li>
          The connection to reinforcement learning is via the policy
          gradient: REINFORCE and its descendants treat expected
          reward as the objective and perform stochastic gradient
          ascent on the policy parameters. Sutton &amp; Barto,{" "}
          <em>Reinforcement Learning: An Introduction</em> (MIT Press,
          2nd ed., 2018) is the textbook; chapter 13 is the policy-
          gradient material, and it reads as numerical optimisation
          wearing different hats.
        </li>
      </ol>
    </>
  );
}
