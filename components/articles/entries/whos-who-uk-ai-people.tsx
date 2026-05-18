import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhosWhoUkAiPeople() {
  return (
    <>
      <p>
        The princess is going to draw you a map. UK artificial
        intelligence is not one room. It is six rooms arranged in a
        loose pentagon, and the wall between each of them is thinner
        than the inhabitants pretend. A frontier-lab director can sit
        at dinner with a safety researcher who can sit next to an
        artist who trained on the same papers. A who&rsquo;s-who that
        sorts them all into the same alphabetical list misses the
        point. So this one sorts by <em>lineage</em> &mdash; the
        school of thought, the funding pipeline, the founding myth
        that each cluster recognises itself by.
      </p>

      <p>
        Boundary rule, declared up front. UK-located OR UK-trained
        and currently working in the UK. Demis Hassabis is born in
        London and runs Google DeepMind from King&rsquo;s Cross
        &mdash; clearly in. Geoffrey Hinton is Toronto and Google
        Brain &mdash; out, despite the Cambridge PhD. Holly Herndon
        is Berlin-based and US-born but her partner Mat Dryhurst is
        UK-born and their major 2024 work was made with British
        choirs at the Serpentine &mdash; in, with the boundary
        flagged. The line moves entry by entry; it is shown rather
        than smoothed.
      </p>

      <p>
        Same rule as the sibling lists. Every name resolves to a
        public URL. No invented credits. No implied mentorships of
        the studio. The piece reports what is verifiably <em>there</em>
        and does not moralise; the reader may hold their own
        position on the labs, the safety debates and the art.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The frontier-lab lineage</h2>

      <p>
        The first lineage is the one the world recognises first,
        because it is the one that put the union flag on the front of
        a paper in <em>Nature</em>. DeepMind was founded in London in
        2010 by three people who still anchor the field. The lineage
        is not just the company; it is the alumni who left and
        seeded the next labs &mdash; Inflection, then Microsoft AI &mdash;
        and the chief scientists who never left and quietly shipped
        AlphaFold, AlphaZero and Gemini from a desk in King&rsquo;s
        Cross.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Sir Demis Hassabis &mdash; Google DeepMind.</strong>{" "}
          Born 1976, London. CEO and co-founder of Google DeepMind
          and Isomorphic Labs. Nobel Prize in Chemistry 2024 with
          John M. Jumper for AlphaFold. The most decorated AI
          scientist working from Britain, and the one who has gone
          on the public record saying London was a deliberate choice
          over Silicon Valley.{" "}
          <a
            href="https://deepmind.google/about/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            deepmind.google{arrow}
          </a>
        </li>
        <li>
          <strong>Mustafa Suleyman CBE &mdash; Microsoft AI.</strong>{" "}
          Born 1984, London. Co-founded DeepMind in 2010, headed
          applied AI there, left in 2022 to co-found Inflection AI
          with Reid Hoffman and Karen Simonyan. Joined Microsoft in
          March 2024 as EVP and CEO of the new Microsoft AI division
          when Microsoft hired most of Inflection&rsquo;s staff.
          Author of <em>The Coming Wave</em>.{" "}
          <a
            href="https://mustafa-suleyman.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            mustafa-suleyman.ai{arrow}
          </a>
        </li>
        <li>
          <strong>Shane Legg CBE &mdash; Google DeepMind.</strong>{" "}
          Co-founder of DeepMind; now Chief AGI Scientist at Google
          DeepMind, leading the Technical AGI Safety team. PhD from
          IDSIA under Marcus Hutter on machine super-intelligence
          (the AIXI work). Signed the 2023 statement on AI extinction
          risk; appointed CBE 2019.{" "}
          <a
            href="https://en.wikipedia.org/wiki/Shane_Legg"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Wikipedia profile{arrow}
          </a>
        </li>
        <li>
          <strong>Kar&eacute;n Simonyan &mdash; Microsoft AI.</strong>{" "}
          VGGNet co-author (with Andrew Zisserman, Oxford
          postdoc 2013). Principal Research Scientist at DeepMind
          from 2014; played a role in AlphaZero, AlphaFold, WaveNet,
          BigGAN, Flamingo. Co-founded Inflection AI; moved to
          Microsoft AI as Chief Scientist in March 2024 alongside
          Suleyman.{" "}
          <a
            href="https://scholar.google.com/citations?user=L7lMQkQAAAAJ&hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Google Scholar{arrow}
          </a>
        </li>
        <li>
          <strong>Zoubin Ghahramani FRS &mdash; Google DeepMind &amp; Cambridge.</strong>{" "}
          British-Iranian, Fellow of St John&rsquo;s, Cambridge since
          2009; Vice President of Research at Google DeepMind and
          Professor of Information Engineering at Cambridge. Chief
          Scientist of Uber 2016&ndash;2020. Headed Google Brain
          until its merger with DeepMind. The senior figure who
          bridges the Cambridge ML group and Mountain View.{" "}
          <a
            href="https://mlg.eng.cam.ac.uk/zoubin/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            mlg.eng.cam.ac.uk/zoubin{arrow}
          </a>
        </li>
        <li>
          <strong>Pushmeet Kohli &mdash; Google DeepMind.</strong>{" "}
          VP of Research at Google DeepMind, leading the AI for
          Science and Strategic Initiatives Unit; founder of the
          team behind the spin-off Isomorphic Labs and a co-author
          on AlphaFold. Also actively leads research on AI robustness
          and safety, with a stated partnership with the UK AI
          Security Institute.{" "}
          <a
            href="https://scholar.google.co.uk/citations?user=3pyzQQ8AAAAJ"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Google Scholar{arrow}
          </a>
        </li>
        <li>
          <strong>Murray Shanahan &mdash; DeepMind &amp; Imperial.</strong>{" "}
          Professor of Cognitive Robotics at Imperial College London;
          Senior Scientist at DeepMind since 2017. Scientific advisor
          to <em>Ex Machina</em>. The lineage&rsquo;s most public
          voice on consciousness and embodiment in machines; his
          book <em>Embodiment and the Inner Life</em> seeded Alex
          Garland&rsquo;s screenplay.{" "}
          <a
            href="https://www.doc.ic.ac.uk/~mpsha/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            doc.ic.ac.uk/~mpsha{arrow}
          </a>
        </li>
        <li>
          <strong>Neel Nanda &mdash; Google DeepMind.</strong>{" "}
          Cambridge maths 2020. Mechanistic Interpretability Team
          Lead at Google DeepMind; creator of the TransformerLens
          library; one of the public faces of mechanistic
          interpretability as a discipline through his YouTube
          walkthroughs and explainer notes.{" "}
          <a
            href="https://www.neelnanda.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            neelnanda.io{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">The startup-founder lineage</h2>

      <p>
        The second lineage is the founders who have built UK-
        headquartered AI companies large enough to draw international
        capital without leaving British soil. Synthesia at $4bn,
        Wayve past $1bn in funding, ElevenLabs opening its worldwide
        HQ in Soho rather than New York. The posture is
        product-first: ship a thing, charge for it, fold the science
        back into the next release. It is the lineage that overlaps
        most directly with the studio&rsquo;s own work on{" "}
        <Link href="/articles/nine-seconds-prompt-to-printable" className={ext}>
          the generative pipeline
        </Link>{" "}
        and{" "}
        <Link href="/articles/on-the-shoulders-of-open-source" className={ext}>
          open-source foundations
        </Link>
        .
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Victor Riparbelli &mdash; Synthesia.</strong>{" "}
          London. Co-founded Synthesia in 2017 with Matthias
          Nie&szlig;ner, Lourdes Agapito and Steffen Tjerrild as a
          synthetic-media company; now Britain&rsquo;s largest
          generative-AI firm by revenue, used by a reported 70% of
          the FTSE 100. Raised a Series E in October 2025 at a
          $4&thinsp;bn valuation led by GV, Nvidia and Accel.{" "}
          <a
            href="https://www.synthesia.io/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            synthesia.io{arrow}
          </a>
        </li>
        <li>
          <strong>Alex Kendall OBE &mdash; Wayve.</strong>{" "}
          King&rsquo;s Cross, London. Co-founded Wayve in 2017 out of
          Cambridge robotics research; CEO since 2020 when his co-
          founder Amar Shah departed. Pioneered end-to-end deep
          learning for autonomous driving on public roads (the AV2.0
          framing). Wayve has raised over $1&thinsp;bn; OBE for
          services to AI in the 2025 honours.{" "}
          <a
            href="https://wayve.ai/company/leadership-team/alex-kendall/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wayve.ai{arrow}
          </a>
        </li>
        <li>
          <strong>Mati Staniszewski &amp; Piotr D&#x105;bkowski &mdash; ElevenLabs.</strong>{" "}
          Soho, London. Co-founded ElevenLabs in 2022; the UK Eleven
          Labs Ltd entity (Companies House 13826669) is registered at
          33 Broadwick Street and was declared the company&rsquo;s
          worldwide HQ in 2024. Voice cloning and AI dubbing at scale.
          Staniszewski named to TIME&rsquo;s 100 most influential
          people in AI 2025.{" "}
          <a
            href="https://elevenlabs.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            elevenlabs.io{arrow}
          </a>
        </li>
        <li>
          <strong>Nikola Mrk&scaron;i&#263; &mdash; PolyAI.</strong>{" "}
          London. Cambridge PhD; first hire at VocalIQ, the Cambridge
          ML spin-out Apple bought in 2015 and folded into Siri.
          Co-founded PolyAI in 2017 with Tsung-Hsien Wen and Pei-Hao
          Su. Voice agents for enterprise contact-centres; clients
          include Starling Bank and Landry&rsquo;s.{" "}
          <a
            href="https://poly.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            poly.ai{arrow}
          </a>
        </li>
        <li>
          <strong>Raza Habib &mdash; Humanloop.</strong>{" "}
          London. UCL ML PhD; founding engineer at Monolith AI; built
          speech systems at Google. Co-founded Humanloop in 2020 as
          a UCL spin-out with Peter Hayes and Jordan Burgess; an LLM
          evaluation platform for enterprises.{" "}
          <a
            href="https://humanloop.com/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            humanloop.com{arrow}
          </a>
        </li>
        <li>
          <strong>Prem Akkaraju &mdash; Stability AI.</strong>{" "}
          London-headquartered (post the Mostaque era). Former CEO of
          Weta Digital; appointed CEO of Stability AI on 25 June
          2024 as part of the Sean Parker-led rescue. Stability is
          the British company behind Stable Diffusion and the
          original release that pulled image generation off OpenAI&rsquo;s
          API and into open weights.{" "}
          <a
            href="https://stability.ai/board-of-directors"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            stability.ai{arrow}
          </a>
        </li>
        <li>
          <strong>Aidan Gomez &mdash; Cohere.</strong>{" "}
          British-Canadian, co-author of <em>Attention Is All You
          Need</em>. Cohere is Toronto-headquartered but operates a
          large London office, and Cohere UK Ltd is a Companies
          House entity (number 13987418). The London presence pairs
          enterprise LLM sales to UK government and finance with
          frontier research.{" "}
          <a
            href="https://cohere.com/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            cohere.com{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">The academic lineage</h2>

      <p>
        The third lineage is the university chairs &mdash; the
        people who hold the EPSRC grants, run the labs that train
        the next cohort of PhDs, and write the papers that the
        frontier labs hire from. UCL DeepMind chair, Cambridge ML,
        Oxford OATML, Edinburgh ELLIS, Imperial Robotics, Manchester
        AI Fundamentals, Goldsmiths embodied AI. They are the
        scaffolding the rest of the lineages climb. The studio reads
        these papers when working on{" "}
        <Link href="/articles/spiral-cognition" className={ext}>
          spiral cognition
        </Link>{" "}
        and on{" "}
        <Link href="/articles/vr-as-psychological-system" className={ext}>
          VR as a psychological system
        </Link>
        .
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Yarin Gal &mdash; OATML, Oxford.</strong>{" "}
          Group leader of the Oxford Applied and Theoretical Machine
          Learning Group; Tutor in Computer Science at Christ
          Church; Turing AI Fellow; Research Director at the UK AI
          Security Institute. The bridge figure between Bayesian
          deep learning, uncertainty in neural nets, and the
          government&rsquo;s evaluation programme. The OATML paper in{" "}
          <em>Nature</em> on detecting LLM hallucination is one of
          the most cited 2024 results.{" "}
          <a
            href="https://oatml.cs.ox.ac.uk/members/yarin/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            oatml.cs.ox.ac.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Andrew Davison &mdash; Dyson Robotics Lab, Imperial.</strong>{" "}
          Professor of Robot Vision; leads the Dyson Robotics Lab at
          Imperial. Real-time SLAM, monocular scene mapping, the
          MASt3R-SLAM line. The reference point for anyone building
          spatial intelligence on a single camera &mdash; relevant
          to the studio&rsquo;s splat capture work.{" "}
          <a
            href="https://www.doc.ic.ac.uk/~ajd/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            doc.ic.ac.uk/~ajd{arrow}
          </a>
        </li>
        <li>
          <strong>Aldo Faisal &mdash; Imperial.</strong>{" "}
          Professor of AI &amp; Neuroscience at Imperial; runs the
          Brain &amp; Behaviour Lab. Neurotechnology, biomedical AI,
          and the algorithmic prediction of human behaviour. The lab
          that thinks the hardest in the UK about what theory-of-
          mind in machines would actually mean.{" "}
          <a
            href="https://www.imperial.ac.uk/people/a.faisal"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Imperial profile{arrow}
          </a>
        </li>
        <li>
          <strong>Iain Murray &mdash; School of Informatics, Edinburgh.</strong>{" "}
          Professor of Machine Learning and Inference; PhD from UCL
          under Zoubin Ghahramani. Fellow of the ELLIS Unit
          Edinburgh. The MCMC and probabilistic-modelling tradition
          at Edinburgh runs through his group.{" "}
          <a
            href="https://homepages.inf.ed.ac.uk/imurray2/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            homepages.inf.ed.ac.uk/imurray2{arrow}
          </a>
        </li>
        <li>
          <strong>Centre for AI Fundamentals &mdash; Manchester.</strong>{" "}
          Cross-disciplinary home for foundational AI at the
          University of Manchester &mdash; probabilistic modelling,
          reinforcement learning, causal modelling, explainable AI.
          Partnered with the Alan Turing Institute and ELLIS.{" "}
          <a
            href="https://www.ai-fun.manchester.ac.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            ai-fun.manchester.ac.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Marco Gillies &mdash; Goldsmiths.</strong>{" "}
          Professor in the Department of Computing at Goldsmiths;
          interactive machine learning for embodied interaction
          design (with Rebecca Fiebrink at the UAL Creative
          Computing Institute). The Goldsmiths line on machine
          learning as a creative tool the studio reads alongside its
          own work on bodies in space.{" "}
          <a
            href="https://www.gold.ac.uk/computing/people/m-gillies/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            gold.ac.uk/computing{arrow}
          </a>
        </li>
        <li>
          <strong>Mick Grierson &mdash; UAL Creative Computing Institute.</strong>{" "}
          Professor and Research Leader at UAL CCI, which he co-
          founded in 2018 after a decade developing Creative
          Computing at Goldsmiths. Signal processing, ML and
          information retrieval for creative practice. Supervises
          PhDs from the Goldsmiths / UAL pipeline that has produced
          most UK creative-AI artists below.{" "}
          <a
            href="https://www.arts.ac.uk/research/ual-creative-computing-institute"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            UAL CCI{arrow}
          </a>
        </li>
        <li>
          <strong>The Alan Turing Institute.</strong>{" "}
          UK&rsquo;s independent national institute for data science
          and AI, based at the British Library, London. George
          Williamson incoming Chief Executive from May 2026; Jean
          Innes 2023&ndash;2025; Adrian Smith 2018&ndash;2023. The
          institute that distributes the Turing Fellowships across
          UK universities and convenes the field at AI UK.{" "}
          <a
            href="https://www.turing.ac.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            turing.ac.uk{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">The safety + governance lineage</h2>

      <p>
        The fourth lineage is the one that grew up around the
        question <em>what if this works</em>. UK AI safety became a
        formal field with the 2023 Bletchley Park summit and the
        founding of the AI Safety Institute &mdash; renamed the AI
        Security Institute in February 2025 when the language shifted
        from <em>safety</em> to <em>security</em>. The lineage runs
        from civil-service safety evaluations through Oxford&rsquo;s
        GovAI to the alignment-startup pole at Conjecture. The
        studio reports this lineage as it is and does not adjudicate
        between its internal debates.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Ian Hogarth &mdash; AI Security Institute.</strong>{" "}
          Chair of the UK Government&rsquo;s AI Safety Institute
          from June 2023; remained Chair when the body was renamed
          the AI Security Institute in February 2025. Investor and
          entrepreneur background; co-author of the annual <em>State
          of AI Report</em> with Nathan Benaich.{" "}
          <a
            href="https://www.aisi.gov.uk/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            aisi.gov.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Ben Garfinkel &mdash; GovAI, Oxford.</strong>{" "}
          Director of the Centre for the Governance of AI &mdash;
          founded by Allan Dafoe in 2016, an Oxford academic centre
          2018&ndash;2021, now an independent non-profit. Holds a
          research position at Oxford. The British centre of
          gravity for AI-governance research as an academic
          discipline.{" "}
          <a
            href="https://www.governance.ai/about-us"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            governance.ai{arrow}
          </a>
        </li>
        <li>
          <strong>David Krueger &mdash; Cambridge ML &amp; CSER.</strong>{" "}
          Assistant Professor of Machine Learning at Cambridge;
          member of the Computational and Biological Learning lab
          and the Machine Learning Group; research affiliate at
          CSER and CHAI. Former research director at the UK AI
          Safety Institute. Works on alignment failure modes,
          algorithmic manipulation, robustness and the avoidance of
          extinction-class outcomes.{" "}
          <a
            href="https://www.cser.ac.uk/team/david-krueger/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            cser.ac.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Connor Leahy &mdash; Conjecture (closing) &raquo; ControlAI.</strong>{" "}
          Co-founded Conjecture in London in March 2022 with Sid
          Black and Gabriel Alfour, out of the open-source ML
          collective EleutherAI. CEO until the March 2026 announcement
          that Conjecture was winding down; moved to non-profit
          ControlAI as US Director. The most public voice on the UK
          side advocating tight controls on frontier model
          development.{" "}
          <a
            href="https://www.conjecture.dev/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            conjecture.dev{arrow}
          </a>
        </li>
        <li>
          <strong>Stephen Cave &mdash; Leverhulme CFI, Cambridge.</strong>{" "}
          Academic Director of the Leverhulme Centre for the Future
          of Intelligence; Co-Director of the Institute for
          Technology and Humanity at Cambridge. Cambridge philosophy
          PhD; nearly a decade in the Foreign Office before
          academia. Co-editor of <em>AI Narratives</em> (OUP 2020),
          <em>Imagining AI</em> (OUP 2023) and <em>Feminist AI</em>{" "}
          (OUP 2023).{" "}
          <a
            href="https://www.lcfi.ac.uk/people/stephen-cave"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            lcfi.ac.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Helen Margetts OBE &mdash; OII &amp; Alan Turing Institute.</strong>{" "}
          Professor of Society and the Internet at the Oxford
          Internet Institute; Programme Director for Public Policy
          at the Alan Turing Institute. Directed the OII 2011&ndash;
          2018. The bridge figure between data-science research and
          UK government practice; sits on the Home Office Scientific
          Advisory Council and the Ada Lovelace Institute.{" "}
          <a
            href="https://www.oii.ox.ac.uk/people/profiles/helen-margetts/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            OII profile{arrow}
          </a>
        </li>
        <li>
          <strong>Carl Benedikt Frey &mdash; Oxford Martin / OII.</strong>{" "}
          Dieter Schwarz Associate Professor of AI &amp; Work at the
          Oxford Internet Institute; Director of the Future of Work
          Programme at the Oxford Martin School. The 2013 paper with
          Michael Osborne (&ldquo;The Future of Employment&rdquo;) is
          the most cited piece of economic research on automation
          globally; the 2024 reappraisal sits on generative AI.{" "}
          <a
            href="https://www.oxfordmartin.ox.ac.uk/people/carl-benedikt-frey"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Oxford Martin{arrow}
          </a>
        </li>
        <li>
          <strong>Vidushi Marda &mdash; AI Collaborative.</strong>{" "}
          Human-rights lawyer with a UK research base. Director of
          Ecosystem Building at the AI Collaborative; previously
          led ARTICLE 19&rsquo;s inaugural international AI
          portfolio. Co-founded REAL ML. Her research has been cited
          by the Supreme Court of India and the House of Lords
          Select Committee on Artificial Intelligence.{" "}
          <a
            href="https://just-tech.ssrc.org/our-network/vidushi-marda/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Just Tech profile{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">The generative-art lineage</h2>

      <p>
        The fifth lineage is the artists. UK creative-AI practice
        does not run on the same time-scale as the labs; the artists
        below were training GANs on hand-labelled datasets in 2018
        when most of the world was still asking what a GAN was. The
        majority trained at Goldsmiths or UAL, or both. The work is
        the conscience of the field as much as its showroom &mdash;
        the artists are reading the same papers as the labs and
        making different things with them. Adjacent to the studio&rsquo;s
        own pieces on{" "}
        <Link href="/articles/from-picasso-forward" className={ext}>
          generative lineage in painting
        </Link>{" "}
        and{" "}
        <Link href="/articles/what-the-studio-wont-do" className={ext}>
          what the studio won&rsquo;t do
        </Link>
        .
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Memo Akten.</strong>{" "}
          Multidisciplinary artist based in London (Istanbul-born).
          PhD from Goldsmiths Computing under Mick Grierson and
          Rebecca Fiebrink. Prix Ars Electronica Golden Nica. Work
          shown at Venice Biennale, Barbican, Grand Palais, Mori Art
          Museum; presented at NeurIPS and SIGGRAPH. The
          <em>Learning to See</em> series is one of the founding
          works of contemporary AI art.{" "}
          <a
            href="https://www.memo.tv/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            memo.tv{arrow}
          </a>
        </li>
        <li>
          <strong>Anna Ridler.</strong>{" "}
          London-based conceptual artist; over a decade working with
          machine learning. <em>Myriad (Tulips)</em> (2018) &mdash;
          ten thousand hand-labelled photographs of tulips shot over
          three months in Utrecht; <em>Mosaic Virus</em> the GAN
          piece trained on that dataset, where bitcoin price drives
          the bloom. Beazley Design of the Year nominee.{" "}
          <a
            href="http://annaridler.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            annaridler.com{arrow}
          </a>
        </li>
        <li>
          <strong>Jake Elwes.</strong>{" "}
          British media artist; AI, queer theory and technical bias.
          <em>Zizi &mdash; Queering the Dataset</em> (2019) and
          <em>The Zizi Show</em>, a deepfake drag cabaret; the
          ongoing Zizi Project intervenes in face-recognition
          training data with drag king and queen photographs.{" "}
          <a
            href="https://www.jakeelwes.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            jakeelwes.com{arrow}
          </a>
        </li>
        <li>
          <strong>Dr Libby Heaney.</strong>{" "}
          British artist and quantum physicist. Imperial physics
          first-class 2005; PhD on mode entanglement in ultra-cold
          atomic gases, Leeds; postdocs at Oxford and NUS; MA at
          Central Saint Martins 2015. The first artist to use
          quantum computing as a working medium. Lumen Prize
          Immersive Environment 2022; <em>Ent-</em> won the Falling
          Walls Art Science category 2022. Shown at the V&amp;A,
          Tate Modern, Science Gallery.{" "}
          <a
            href="https://libbyheaney.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            libbyheaney.co.uk{arrow}
          </a>
        </li>
        <li>
          <strong>Eric Drass / Shardcore.</strong>{" "}
          Brighton-based. Oxford BSc in Philosophy, PhD in cognitive
          psycholinguistics. Works under the pseudonym Shardcore on
          AI, surveillance and synthetic media. Made the BBC&rsquo;s
          Ian Hislop deepfake; collaborated with John Higgs on an
          early ChatGPT-co-authored novel (<em>The Future Has
          Already Begun</em>, 2019). Lectures on AI in art at
          institutional venues including the Royal Institution.{" "}
          <a
            href="https://www.shardcore.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            shardcore.org{arrow}
          </a>
        </li>
        <li>
          <strong>Holly Herndon &amp; Mat Dryhurst.</strong>{" "}
          Berlin-based but with deep UK ties; Dryhurst is UK-born,
          and their major 2024 work <em>The Call</em> was made with
          fifteen UK community choirs for the Serpentine Galleries.
          Co-founded Spawning in 2022, the consent layer for AI
          training data behind haveibeentrained.com, Kudurru and
          Source.Plus. The Holly+ AI voice clone (2021) is the
          canonical example of artist-led consent infrastructure.{" "}
          <a
            href="https://www.serpentinegalleries.org/whats-on/holly-herndon-mat-dryhurst-the-call/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Serpentine &mdash; The Call{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">The critic + public-thinker lineage</h2>

      <p>
        The sixth lineage is the people who write about all the
        others for a public readership. UK AI criticism is a real
        tradition with a strong feminist and post-colonial line,
        anchored in Cambridge (LCFI), Oxford (OII), Southampton
        (Web Science Institute) and the BBC. The lineage&rsquo;s
        posture is that the future is not given &mdash; that asking
        clearly what AI is doing, and to whom, is part of the work.
        Sister to the studio&rsquo;s own pieces on{" "}
        <Link href="/articles/the-osint-stack-for-creative-research" className={ext}>
          the OSINT stack for creative research
        </Link>{" "}
        and{" "}
        <Link href="/articles/osint-for-finding-your-people" className={ext}>
          OSINT for finding your people
        </Link>
        .
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>James Bridle.</strong>{" "}
          British writer and artist born 1980, based in Greece for
          some years but with the UK publishing footprint. Author of
          <em> New Dark Age: Technology and the End of the Future</em>{" "}
          (Verso 2018) and <em>Ways of Being: Animals, Plants,
          Machines: The Search for a Planetary Intelligence</em>
          {" "}(2022). Hosted BBC Radio 4&rsquo;s <em>New Ways of
          Seeing</em>. Critic and artist both; the rare British voice
          that holds both positions credibly.{" "}
          <a
            href="https://jamesbridle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            jamesbridle.com{arrow}
          </a>
        </li>
        <li>
          <strong>Dame Wendy Hall &mdash; Southampton.</strong>{" "}
          Regius Professor of Computer Science at the University of
          Southampton; Executive Director of the Web Science
          Institute. Co-chaired the UK government&rsquo;s 2017 AI
          Review; first UK government Skills Champion for AI; member
          of the original AI Council. With Sir Tim Berners-Lee and
          Sir Nigel Shadbolt, co-founded the Web Science Research
          Initiative in 2006.{" "}
          <a
            href="https://www.southampton.ac.uk/people/5wyswr/dame-wendy-hall"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Southampton profile{arrow}
          </a>
        </li>
        <li>
          <strong>Sir Nigel Shadbolt &mdash; Jesus College, Oxford.</strong>{" "}
          Principal of Jesus College, Oxford; Professorial Research
          Fellow in the Oxford CS department. Chairman of the Open
          Data Institute, which he co-founded with Tim Berners-Lee.
          The senior British voice on the open-data side of the AI
          question.{" "}
          <a
            href="https://www.jesus.ox.ac.uk/people/professor-sir-nigel-shadbolt/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Jesus College Oxford{arrow}
          </a>
        </li>
        <li>
          <strong>Professor Sue Black OBE &mdash; Durham.</strong>{" "}
          Professor of Computer Science and Technology Evangelist
          at Durham. Research on algorithmic bias and software
          fairness, including published work on GPT-3 and sexualised
          violence. Founded the UK&rsquo;s first online network for
          women in tech (BCSWomen) in 1998; led the campaign to save
          Bletchley Park; runs the #TechUPWomen retraining
          programme.{" "}
          <a
            href="https://www.durham.ac.uk/staff/sue-black/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Durham profile{arrow}
          </a>
        </li>
        <li>
          <strong>Beth Singler.</strong>{" "}
          British anthropologist of AI and religion; now Assistant
          Professor in Digital Religion(s) at the University of
          Zurich, Co-Director of the URPP in Digital Religion(s).
          Previously Junior Research Fellow in Artificial
          Intelligence at Homerton College, Cambridge. Co-editor of
          <em>The Cambridge Companion to Religion and Artificial
          Intelligence</em> with Fraser Watts.{" "}
          <a
            href="https://bvlsingler.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            bvlsingler.com{arrow}
          </a>
        </li>
        <li>
          <strong>Professor Mariana Mazzucato &mdash; UCL IIPP.</strong>{" "}
          Professor in the Economics of Innovation and Public Value
          at UCL; founding Director of the UCL Institute for
          Innovation and Public Purpose. Author of <em>The
          Entrepreneurial State</em>, <em>The Value of Everything</em>,
          <em> Mission Economy</em>. The mission-oriented framing of
          AI &mdash; what is the public-good direction we want it
          pointed at &mdash; is hers as much as anyone&rsquo;s.{" "}
          <a
            href="https://www.ucl.ac.uk/bartlett/public-purpose/people/institute-director-mariana-mazzucato"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            UCL IIPP profile{arrow}
          </a>
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">Why this map</h2>

      <p>
        The point of arranging the field by lineage rather than by
        alphabet is that each lineage shows a posture &mdash; a way
        of standing toward the technology. The frontier-lab lineage
        treats AI as a research instrument that pays for its own
        next round of equipment. The founder lineage treats it as a
        product. The academic lineage treats it as a phenomenon
        worth understanding for its own sake. The safety lineage
        treats it as a risk to be evaluated. The art lineage treats
        it as a medium to think with. The critic lineage treats it
        as a politics that needs daylight. None of these postures is
        wrong, and almost no one occupies only one.
      </p>

      <p>
        The studio&rsquo;s own posture is closest to the artist
        lineage and reads the safety lineage carefully; the work
        published on this site uses the founder lineage&rsquo;s
        products on top of the academic lineage&rsquo;s open weights
        and writes about all of it in the critic lineage&rsquo;s
        register. A who&rsquo;s-who that respects the field is one
        that lets each room keep its own furniture and walks the
        reader through politely. If a person belongs on this page
        and is not yet on it, that is an omission the studio will
        correct.
      </p>

      <p>
        The siblings on this same map:{" "}
        <Link href="/articles/whos-who-uk-vr-people" className={ext}>
          UK VR people
        </Link>
        ,{" "}
        <Link href="/articles/whos-who-uk-ar-people" className={ext}>
          UK AR people
        </Link>
        ,{" "}
        <Link href="/articles/whos-who-uk-motion-capture" className={ext}>
          UK motion capture
        </Link>
        ,{" "}
        <Link href="/articles/whos-who-uk-light-painters" className={ext}>
          UK light painters
        </Link>
        ,{" "}
        <Link href="/articles/whos-who-uk-pixel-artists" className={ext}>
          UK pixel artists
        </Link>
        , and{" "}
        <Link href="/articles/whos-who-uk-fire-art-photographers" className={ext}>
          UK fire-art photographers
        </Link>
        . The studio&rsquo;s own thinking on the open-source
        foundations the field stands on is in{" "}
        <Link href="/articles/on-the-shoulders-of-open-source" className={ext}>
          On the Shoulders of Open Source
        </Link>
        , and the principle behind <em>not</em> doing certain things
        with these tools is in{" "}
        <Link href="/articles/what-the-studio-wont-do" className={ext}>
          What the Studio Won&rsquo;t Do
        </Link>
        .
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Sources / Further Reading</h2>

      <p className="text-sm text-chrome-400">
        Every external URL touched in the research above, grouped by
        domain. Audit-friendly footnote convention; no
        call-to-action.
      </p>

      <h3 className="mt-6 text-lg text-chrome-100">deepmind.google / google</h3>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://deepmind.google/about/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            deepmind.google/about &mdash; Google DeepMind, London{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://research.google/people/105667/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            research.google &mdash; Pushmeet Kohli{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">wikipedia.org</h3>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Demis_Hassabis"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Demis Hassabis{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Mustafa_Suleyman"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Mustafa Suleyman{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Shane_Legg"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Shane Legg{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Wayve"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Wayve{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Synthesia_(company)"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Synthesia{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/ElevenLabs"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            ElevenLabs{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Stability_AI"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Stability AI{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Cohere"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Cohere{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Aidan_Gomez"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Aidan Gomez{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Zoubin_Ghahramani"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Zoubin Ghahramani{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Murray_Shanahan"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Murray Shanahan{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Pushmeet_Kohli"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Pushmeet Kohli{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Connor_Leahy"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Connor Leahy{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Ian_Hogarth"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Ian Hogarth{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/AI_Safety_Institute_(United_Kingdom)"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            AI Safety / Security Institute (UK){arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Anna_Ridler"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Anna Ridler{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Jake_Elwes"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Jake Elwes{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Libby_Heaney"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Libby Heaney{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Eric_Drass"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Eric Drass{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Beth_Singler"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Beth Singler{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Mariana_Mazzucato"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Mariana Mazzucato{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Nigel_Shadbolt"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Nigel Shadbolt{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Alan_Turing_Institute"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Alan Turing Institute{arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">company &amp; institutional sites</h3>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://www.synthesia.io/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            synthesia.io/about{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://wayve.ai/company/leadership-team/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            wayve.ai/company/leadership-team{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://elevenlabs.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            elevenlabs.io{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://find-and-update.company-information.service.gov.uk/company/13826669"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Companies House &mdash; Eleven Labs Ltd{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://poly.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            poly.ai{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://humanloop.com/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            humanloop.com/about{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://stability.ai/board-of-directors"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            stability.ai/board-of-directors{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://cohere.com/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            cohere.com/about{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.conjecture.dev/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            conjecture.dev/about{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.aisi.gov.uk/about"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            aisi.gov.uk/about &mdash; AI Security Institute{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.governance.ai/about-us"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            governance.ai/about-us &mdash; GovAI{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.turing.ac.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            turing.ac.uk{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.lcfi.ac.uk/people/stephen-cave"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            lcfi.ac.uk &mdash; Stephen Cave{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.cser.ac.uk/team/david-krueger/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            cser.ac.uk &mdash; David Krueger{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.serpentinegalleries.org/whats-on/holly-herndon-mat-dryhurst-the-call/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Serpentine &mdash; The Call (Herndon &amp; Dryhurst){arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">academic &amp; lab profiles</h3>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://mlg.eng.cam.ac.uk/zoubin/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            mlg.eng.cam.ac.uk/zoubin &mdash; Zoubin Ghahramani{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://oatml.cs.ox.ac.uk/members/yarin/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            oatml.cs.ox.ac.uk &mdash; Yarin Gal{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.doc.ic.ac.uk/~mpsha/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            doc.ic.ac.uk/~mpsha &mdash; Murray Shanahan{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.doc.ic.ac.uk/~ajd/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            doc.ic.ac.uk/~ajd &mdash; Andrew Davison{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://homepages.inf.ed.ac.uk/imurray2/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            homepages.inf.ed.ac.uk/imurray2 &mdash; Iain Murray{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.ai-fun.manchester.ac.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            ai-fun.manchester.ac.uk &mdash; Centre for AI Fundamentals{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.gold.ac.uk/computing/people/m-gillies/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            gold.ac.uk &mdash; Marco Gillies{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.arts.ac.uk/research/ual-creative-computing-institute"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            arts.ac.uk &mdash; UAL Creative Computing Institute{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.oii.ox.ac.uk/people/profiles/helen-margetts/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            oii.ox.ac.uk &mdash; Helen Margetts{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.oxfordmartin.ox.ac.uk/people/carl-benedikt-frey"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            oxfordmartin.ox.ac.uk &mdash; Carl Benedikt Frey{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.southampton.ac.uk/people/5wyswr/dame-wendy-hall"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            southampton.ac.uk &mdash; Dame Wendy Hall{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.durham.ac.uk/staff/sue-black/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            durham.ac.uk &mdash; Sue Black{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.ucl.ac.uk/bartlett/public-purpose/people/institute-director-mariana-mazzucato"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            ucl.ac.uk &mdash; Mariana Mazzucato (IIPP){arrow}
          </a>
        </li>
      </ul>

      <h3 className="mt-6 text-lg text-chrome-100">artist &amp; writer sites</h3>
      <ul className="mt-2 list-none space-y-1 pl-0">
        <li>
          <a
            href="https://www.memo.tv/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            memo.tv &mdash; Memo Akten{arrow}
          </a>
        </li>
        <li>
          <a
            href="http://annaridler.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            annaridler.com &mdash; Anna Ridler{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.jakeelwes.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            jakeelwes.com &mdash; Jake Elwes{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://libbyheaney.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            libbyheaney.co.uk &mdash; Libby Heaney{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.shardcore.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            shardcore.org &mdash; Eric Drass{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://jamesbridle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            jamesbridle.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://bvlsingler.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            bvlsingler.com &mdash; Beth Singler{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.neelnanda.io/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            neelnanda.io &mdash; Neel Nanda{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://mustafa-suleyman.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            mustafa-suleyman.ai{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

/**
 * Colocated entry record for the UK AI people who's-who.
 *
 * Format: lineages (six). The boundary rule applied is UK-located
 * OR UK-trained-and-currently-working-in-the-UK; explicit
 * judgement calls flagged in the opening paragraphs (Hassabis in,
 * Hinton out, Herndon-Dryhurst flagged). The frontier-lab lineage
 * spans Google DeepMind London + the Inflection diaspora to
 * Microsoft AI. The founder lineage is the UK-HQ company set
 * (Synthesia, Wayve, ElevenLabs, PolyAI, Humanloop, Stability,
 * plus Cohere's substantial London office). The academic lineage
 * covers Oxford OATML, Imperial Robotics/Neuroscience, Edinburgh
 * Informatics, Manchester AI Fundamentals, Goldsmiths Computing,
 * UAL CCI, and the Alan Turing Institute. The safety lineage runs
 * AISI -> GovAI -> Cambridge ML/CSER -> Conjecture/ControlAI plus
 * Cave at LCFI and the policy researchers (Margetts, Frey, Marda).
 * The art lineage is the Goldsmiths/UAL-trained generation (Akten,
 * Ridler, Elwes, Heaney, Drass) plus the Herndon-Dryhurst Serpentine
 * residency. The critic lineage is Bridle + the senior UK academic
 * voices on AI in public life (Hall, Shadbolt, Black, Singler,
 * Mazzucato).
 *
 * Strictness rule: every named entry resolves to at least one
 * public URL on its own institution or personal site. No claimed
 * Dimona mentorships. No identity classification. No invented
 * credits. Numbers (valuations, funding totals) sourced from
 * cited URLs at time of writing.
 */
export const entry: Entry = {
  slug: "whos-who-uk-ai-people",
  title: "Who's Who — UK AI people",
  date: "2026-05-18",
  kind: "article",
  excerpt:
    "Six lineages of UK AI thinking — frontier labs, founders, academics, safety, art and criticism — with every named figure verified by public URL. Reports what is there, does not moralise.",
  Body: WhosWhoUkAiPeople,
  related: [
    {
      href: "/articles/whos-who-uk-vr-people",
      label: "Who's Who — UK VR people",
      note: "Sibling list on the virtual-reality side.",
    },
    {
      href: "/articles/whos-who-uk-ar-people",
      label: "Who's Who — UK AR people",
      note: "Sibling list on the augmented-reality side.",
    },
    {
      href: "/articles/whos-who-uk-motion-capture",
      label: "Who's Who — UK motion capture",
      note: "Sibling list on the body-capture side.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the Shoulders of Open Source",
      note: "Studio's own line on the open-weights foundations the field stands on.",
    },
    {
      href: "/articles/what-the-studio-wont-do",
      label: "What the Studio Won't Do",
      note: "The principle behind not doing certain things with these tools.",
    },
    {
      href: "/articles/the-osint-stack-for-creative-research",
      label: "The OSINT Stack for Creative Research",
      note: "How a who's-who like this gets compiled in the first place.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.aisi.gov.uk/about",
      label: "AI Security Institute (UK)",
      note: "The official government body the safety lineage anchors at.",
    },
    {
      href: "https://www.turing.ac.uk/",
      label: "The Alan Turing Institute",
      note: "UK's national institute for data science and AI.",
    },
    {
      href: "https://www.governance.ai/about-us",
      label: "GovAI — Centre for the Governance of AI",
      note: "The Oxford-origin non-profit that holds the academic AI-governance line.",
    },
    {
      href: "https://www.lcfi.ac.uk/",
      label: "Leverhulme Centre for the Future of Intelligence",
      note: "Cambridge's interdisciplinary AI-impact centre.",
    },
    {
      href: "https://deepmind.google/about/",
      label: "Google DeepMind — about",
      note: "The frontier lab the first lineage circles.",
    },
  ],
};
