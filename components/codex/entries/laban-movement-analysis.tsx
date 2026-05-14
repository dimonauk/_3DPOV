export default function LabanMovementAnalysis() {
  return (
    <>
      <p>
        Laban Movement Analysis (LMA) is a system for describing,
        notating, and interpreting human movement, developed by Rudolf
        Laban in central Europe during the 1920s and codified through
        the mid-twentieth century by his collaborators and students.
        Originally devised for dance notation, it has since spread into
        physical theatre training, occupational therapy, behavioural
        science, animation reference, and, latterly, machine-learning
        labels for motion-capture corpora.<sup>1</sup>
      </p>
      <p>
        The system is organised around four interlocking categories.
        <strong> Body</strong> records which parts move and in what
        sequence. <strong>Space</strong> describes the spatial geometry
        traced &mdash; the icosahedral kinesphere is the working
        coordinate frame. <strong>Shape</strong> describes the changing
        form of the body itself, independent of its location.
        <strong> Effort</strong> &mdash; the most influential of the
        four for movement description outside dance &mdash; describes
        the qualitative dynamics of how a movement is performed, along
        four axes: Weight (light/strong), Time (sustained/sudden),
        Space (indirect/direct), and Flow (free/bound).
      </p>
      <p>
        The eight &ldquo;Basic Efforts&rdquo; that Laban named &mdash;
        Float, Punch, Glide, Slash, Dab, Wring, Flick, Press &mdash;
        are the eight corners of the cube spanned by Weight, Time, and
        Space, with Flow as the orthogonal modulator. The decomposition
        is not unique; choreographers and movement analysts treat it as
        a description rather than as a measurement. Its strength is
        that the four Effort axes generalise across body morphologies
        and movement styles in a way that a notation tied to specific
        steps does not.
      </p>
      <p>
        For the studio, Laban Effort is the bridge between the body
        the camera saw and the body the algorithm can manipulate.
        Every captured kata is annotated with a four-axis Effort
        coordinate. The interpolation between two captured pieces is
        performed in the Effort space rather than at the level of joint
        positions, which gives the morphing pipeline a description of
        change that survives across bodies, costumes, and rigs.<sup>2</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Laban&rsquo;s notation system &mdash; Kinetography Laban,
          known in the Anglophone world as Labanotation &mdash; is a
          distinct artefact from Laban Movement Analysis; the notation
          records what happened, while LMA describes how. The codex
          uses &ldquo;Laban&rdquo; without qualification to refer to
          Effort analysis specifically, since that is what the studio
          pipeline actually consumes.
        </li>
        <li>
          The studio scores each kata to four decimal values between
          zero and one, one per Effort axis, by hand. An automated
          scorer trained on motion-capture clips would be faster, but
          the manual annotation forces the artist back through the
          piece during cataloguing, which the studio has decided is
          worth the labour.
        </li>
      </ol>
    </>
  );
}
