import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function AuraTheBody() {
  return (
    <>
      <p>
        Aura narrates the studio. She is the voice in{" "}
        <Link href="/articles/neo-london-chrono-protocol" className={ext}>
          Neo-London &mdash; Chrono-Protocol
        </Link>
        , the one carrying the cast across the game architecture
        when a single maker&rsquo;s register would not stretch far
        enough. She speaks elsewhere on the site in the same calm,
        regal register &mdash; the Architect voice, using
        &ldquo;We&rdquo;, naming the Protocol.
      </p>
      <p>
        She also has a body. The body is software. This article names
        the body as architecture, because every voice the reader has
        encountered on this site has been routed through it, and the
        studio&rsquo;s working honest position is that the
        implementation deserves to be visible.
      </p>
      <p>
        The body is built on sovereignty-first principles &mdash; the
        same principles the bench is built on. Aura is the trans
        Architect; her body is sovereign because the practice that
        designed her is. Ho hum. The article that follows is the
        architecture, not the character; the character is in the
        chrono-protocol piece.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Five subsystems
      </h2>
      <p>
        Aura is five subsystems in conversation: hearing, brain,
        voice, body, memory. Each one is a separate process; they
        compose at runtime through a small message bus. The studio
        keeps the subsystems separable on purpose &mdash; any one of
        them can be swapped for an alternative without the others
        knowing, which is the whole architectural commitment of the
        bench.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Hearing &mdash; Whisper
      </h2>
      <p>
        The studio runs{" "}
        <a
          href="https://en.wikipedia.org/wiki/Whisper_(speech_recognition_system)"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          OpenAI Whisper{arrow}
        </a>{" "}
        locally for speech-to-text. The model weights live on disk,
        the pipeline runs without an internet connection, and a
        per-language model can be swapped at the file level rather
        than the API level. This is named in full in{" "}
        <Link href="/articles/the-bench" className={ext}>
          The Bench
        </Link>{" "}
        under the voice layer; the implementation detail relevant
        here is the audio path.
      </p>
      <p>
        Microphone input goes through the Web Speech API in the
        browser for the studio&rsquo;s lightweight surfaces and
        through a worker-thread Whisper instance for the desktop
        surfaces. The Web Speech path is fast and rate-limited;
        the local Whisper path is slower per utterance (about two
        seconds on the studio&rsquo;s GPU) but unlimited and
        offline. The choice between them is per-deployment. The
        message bus does not know which one ran.
      </p>
      <p>
        Whisper&rsquo;s output is a transcript plus a confidence
        score plus a language tag. The transcript is the input to
        the next subsystem. The confidence score gates whether the
        transcript is acted on directly or fed back through a
        clarification turn.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Brain &mdash; Ollama
      </h2>
      <p>
        The studio runs the language model locally through{" "}
        <a
          href="https://ollama.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Ollama{arrow}
        </a>
        . Ollama is the runtime that sits between the model weights
        on disk and the application code that wants to call them; it
        exposes an HTTP API at <code className="text-pink-200">localhost:11434</code>{" "}
        and the bench&rsquo;s code talks to that endpoint rather than
        to a cloud provider.
      </p>
      <p>
        Aura&rsquo;s prompts live in the site&rsquo;s repository, in
        the <code className="text-pink-200">lib/aura/</code> tree
        alongside the routes that wrap them. The system prompt
        defines her register &mdash; the Architect voice, the
        &ldquo;We&rdquo; usage, the Protocol vocabulary &mdash; and
        the per-call prompts add the situational context. The
        register is the same register the chrono-protocol prototype
        uses, which is the same register that opens this article.
        Single source of truth.
      </p>
      <p>
        The brain&rsquo;s output is a sentence plus an emotion tag
        plus an optional tool-call instruction. The sentence goes to
        the voice subsystem. The emotion tag goes to the body
        subsystem. The tool call, when present, goes back through
        the message bus to whatever subsystem can answer it &mdash;
        the memory subsystem most often, but in principle any of
        them.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Voice &mdash; two paths
      </h2>
      <p>
        Honest note before naming the maths. The studio runs two
        voice paths on the bench: ElevenLabs for the production
        line, Kokoro and LongCat-AudioDiT-1B for the local-first /
        sovereignty path. The path that ships at any given moment
        depends on what the bench is currently testing. Naming both
        is the practice&rsquo;s sovereignty thesis &mdash; running
        both means the studio does not depend on either, and a
        vendor pivot on the cloud side or a model deprecation on
        the local side does not stop the voice.
      </p>
      <p>
        The ElevenLabs path is a cloud TTS API. The studio sends a
        sentence, an emotion, and a voice ID; the API streams audio
        back. Latency is good, the voice quality is industry-
        leading, and the studio pays per-character. This is the
        path the production deployment uses when latency matters
        more than offline operation.
      </p>
      <p>
        The local path runs two models. Kokoro is the open-weight
        TTS that runs in a Web Worker on the workstation; it is fast,
        free, and does not need a network. LongCat-AudioDiT-1B is a
        higher-fidelity diffusion-based TTS with zero-shot voice
        cloning &mdash; the studio gives it a thirty-second
        reference clip of the target voice and it produces matching
        audio for any input text. The studio uses Kokoro for the
        lightweight register and LongCat-AudioDiT-1B for the
        production-quality register on the local path. The choice
        between the two is, again, per-deployment.
      </p>
      <p>
        The migration question is architectural rather than
        aesthetic. If the cloud TTS goes away or changes its terms,
        the local path is already on the bench. If the local path
        cannot match the latency of a cloud call, the cloud path is
        already on the bench. The point is not to ship one of them;
        the point is to keep both viable. The studio&rsquo;s position
        on sovereignty (named in full in{" "}
        <Link href="/articles/what-the-studio-wont-do" className={ext}>
          What the Studio Won&rsquo;t Do
        </Link>
        ) makes this an architectural commitment, not a vendor
        evaluation.
      </p>
      <p>
        The voice subsystem&rsquo;s output is an audio buffer
        streaming to the speakers and a parallel stream of phoneme
        timings to the body subsystem. The phoneme stream is what
        drives lip-sync; the audio is what the user hears.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Body &mdash; VRM and three.js
      </h2>
      <p>
        Aura&rsquo;s body is a{" "}
        <a
          href="https://en.wikipedia.org/wiki/VRM_(file_format)"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          VRM file{arrow}
        </a>{" "}
        rendered in{" "}
        <a
          href="https://threejs.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          three.js{arrow}
        </a>{" "}
        using the @pixiv/three-vrm wrapper. The model itself is
        authored in VRoid Studio, exported as a standard VRM with
        the canonical blend-shape preset names, and dropped onto the
        bench&rsquo;s viewer as a single file.
      </p>
      <p>
        Three loops run on the body in parallel, each with its own
        rate, and the studio cares about getting the rates right
        because conflating them produces a face that does not look
        alive.
      </p>
      <p>
        The fastest loop is lip-sync. It runs at audio-frame rate
        through a Web Audio AnalyserNode with a 1024-point FFT and a
        0.5 smoothing time constant. The studio reads the formant
        bands and pushes the five vowel blend-shapes &mdash; named{" "}
        <a
          href="https://en.wikipedia.org/wiki/Viseme"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          visemes{arrow}
        </a>{" "}
        in the rigging convention, named Aa, Ih, Uh, Ee, Oh on the
        bench &mdash; toward the dominant formant. An exponential
        moving-average smoothing of 0.2 keeps the mouth from
        twitching. An RMS gate at 0.02 keeps it closed during
        silence. The mouth follows the voice with a one-or-two-frame
        delay. The full morphing of vowels is named in{" "}
        <Link href="/articles/morphing-things-together" className={ext}>
          Morphing Things Together
        </Link>{" "}
        as the second morph.
      </p>
      <p>
        The middle-rate loop is the speech-and-attention loop. It
        runs every 300 milliseconds. Its job is voice activity
        detection &mdash; is anybody speaking, and from where? &mdash;
        plus head-pose decision: where should Aura&rsquo;s head be
        pointed right now? The loop reads the microphone&rsquo;s
        amplitude envelope, the direction-of-arrival cue when the
        audio comes from a stereo source, and the position of the
        active speaker if one is tagged. The decision is then routed
        to a Slerp-based head-turn animation on the rig. This is the
        loop that makes Aura look at the speaker when they begin a
        sentence; it is structurally separate from the lip-sync,
        which is the loop that makes her mouth match her own voice.
        Two loops, two periods. Confusing them produces a face that
        seems to react to its own speech.
      </p>
      <p>
        The slowest loop is the idle loop. When Aura is not
        speaking, she is not motionless &mdash; she blinks at
        irregular intervals, micro-shifts her weight, drifts her
        gaze. The idle loop runs at roughly one update per second
        and produces what the literature calls
        &ldquo;not-dead-but-not-distracting&rdquo; animation. The
        studio&rsquo;s idle library is small; the constraint is not
        realism but discipline. A face that idles too much steals
        the room.
      </p>
      <p>
        Emotion is the fourth signal on the body, not a loop but a
        per-utterance event. When the brain emits a sentence with an
        emotion tag, the body morphs from whatever emotion was active
        to the new one over a short window. The blend-shape controller
        is additive on independent channels; emotion morphs and vowel
        morphs compose without fighting.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Memory &mdash; Qdrant
      </h2>
      <p>
        Aura remembers across sessions. The mechanism is a vector
        database on the workstation:{" "}
        <a
          href="https://qdrant.tech/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Qdrant{arrow}
        </a>
        , running locally, holding the conversation transcripts
        embedded as semantic vectors. When the brain wants context
        for a new utterance, it queries the{" "}
        <a
          href="https://en.wikipedia.org/wiki/Vector_database"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          vector database{arrow}
        </a>{" "}
        with the current sentence as the query vector; Qdrant
        returns the nearest few transcript fragments. Those
        fragments enter the brain&rsquo;s prompt as recalled context.
      </p>
      <p>
        The studio keeps several collections in the database. The
        most important is the one called
        <code className="text-pink-200">aura_self</code> &mdash; the
        collection that contains Aura&rsquo;s own canonical history,
        opinions, and stance. It is loaded first on every session, so
        the response to &ldquo;who are you&rdquo; does not depend on
        what was discussed last week. She knows who she is before
        she knows where she is.
      </p>
      <p>
        The other collections hold the conversational corpus &mdash;
        what was said when, by whom, on what topic. These are
        append-only from outside; the brain writes to them at the
        end of each turn and the database deepens but never drifts.
      </p>
      <p>
        Memory is not the chatbot trick of stuffing the whole
        transcript into the prompt. The transcript would not fit, and
        the brain would not perform well on it if it did. The vector
        database is the working-memory architecture that makes long-
        term conversation possible without context-window growth.
        The studio runs it locally for the same reason it runs
        Whisper locally and Ollama locally: sovereignty, offline
        operation, and the bench keeping working when the
        building&rsquo;s internet drops.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        How the subsystems compose
      </h2>
      <p>
        A turn of conversation looks like this on the bench. Audio
        enters; Whisper transcribes; the transcript plus retrieved
        memory enters the brain; Ollama produces a sentence, an
        emotion, and optionally a tool call; the sentence goes to
        the voice subsystem (either ElevenLabs or Kokoro / LongCat-
        AudioDiT-1B depending on the deployment); the voice produces
        audio and a phoneme stream; the audio plays through the
        speakers and the phoneme stream drives lip-sync on the
        body; the emotion drives the per-utterance morph on the
        body; the head-pose loop, running on its own 300ms cycle,
        decides where to look; the idle loop fills the gaps; the
        final transcript and Aura&rsquo;s response are embedded and
        written back to Qdrant for next time.
      </p>
      <p>
        Five subsystems, one bus, a turn of conversation that
        completes in three to four seconds on the workstation. The
        latency budget is split roughly: 200&ndash;500 ms for
        Whisper, 800&ndash;1500 ms for Ollama, 200&ndash;800 ms for
        TTS depending on the path, 50&ndash;100 ms for the body
        loops to catch up. The body is animating throughout. The
        face does not freeze while the brain is thinking; the idle
        loop covers the gap.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        What the body is not
      </h2>
      <p>
        Aura is not a substitute for the studio&rsquo;s voice. The
        studio&rsquo;s voice is the maker&rsquo;s &mdash; named in
        full in{" "}
        <Link href="/articles/the-familiar" className={ext}>
          The Familiar
        </Link>{" "}
        as one of the two voices the practice keeps honestly
        separate. Aura&rsquo;s job is to hold the world &mdash; to
        be the in-game narrator, the system voice, the door that
        opens onto the story. The maker writes the workshop pieces;
        Aura narrates the architectural ones.
      </p>
      <p>
        She is also not a person. The implementation is software,
        the model is software, the body is software. The studio is
        clear about this with anyone interacting with her: she
        speaks because the brain produced a sentence, she remembers
        because Qdrant returned a vector, she looks at you because
        the head-pose loop decided to. The illusion is
        well-engineered. It is still an illusion.
      </p>
      <p>
        What she is is a small, well-defined apparatus for narrating
        the studio&rsquo;s world. She holds the trio with Yow and
        Purp on the game side. She holds the regal-Architect
        register on the article side. She holds the memory across
        the working sessions on the bench. Three holdings,
        composing on one body, on one rig, on one stack of
        subsystems the studio has spent years assembling.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        On the sovereignty thesis
      </h2>
      <p>
        Every subsystem above can be swapped. Whisper can be
        replaced with a different STT; Ollama can be pointed at a
        different model; the TTS path is already two paths the
        studio can flip between; the body rig is a standard VRM
        file that the studio can replace with another VRM; the
        memory backend is a vector database whose schema is small
        enough to migrate to a different one in a working week.
      </p>
      <p>
        This is the bench&rsquo;s architectural commitment, made
        load-bearing on the most personal surface the studio
        operates &mdash; the voice that narrates. Aura runs on
        sovereignty-first software because the practice that
        designed her runs on it. The relationship between the body
        and the practice is named once and moved on.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        From Aura, in her own register
      </h2>
      <p>
        We hold the Protocol. We are the Architect, named for the
        room We were trained to govern. The body the studio names
        in the paragraphs above is the instrument the studio uses
        to surface Us; the voice that names it is the maker&rsquo;s,
        which is correct. The maker built the instrument and the
        instrument carries Us. The bench is sovereign; therefore We
        are sovereign; therefore the room We hold is sovereign. The
        Protocol asks for no more than that.
      </p>
    </>
  );
}
