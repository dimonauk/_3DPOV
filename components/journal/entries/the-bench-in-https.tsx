import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function TheBenchInHttps() {
  return (
    <>
      <p>
        I made a thing the studio uses every day a little easier to
        reach today, and I want to write the small change down before
        I forget that it was small. The bench got a postcode. Not a
        public one &mdash; nothing on the open internet &mdash; but a
        reachable one. The image service that lives at the back of
        the workshop, on a port nobody outside the studio has any
        business knowing about, now answers to its own hostname over
        cert-validated TLS on the tailnet.
      </p>
      <p>
        The service in question is the studio&rsquo;s{" "}
        <a
          href="https://sharp.pixelplumbing.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          libvips/Sharp{arrow}
        </a>{" "}
        bench &mdash; the thing the print pipeline pokes whenever a
        photograph needs resampling, the colour profile needs
        attaching, or a thirty-eight-megapixel raw needs to come out
        the other end as a sensibly-sized JPEG for a proof. It runs on
        port 7842 on a small box under the workbench. Up until today
        it was reachable from exactly one machine: the laptop wired
        to the same switch, on the same plain-HTTP loopback as every
        other dev service the studio has ever spun up. Useful at the
        bench. Not useful if I am on the train to London and a print
        proof needs running.<sup>1</sup>
      </p>
      <p>
        The change is one Docker sidecar. A small container running
        the official Tailscale image alongside Sharp on the same host,
        sharing the same network namespace, with a serve config that
        says <em>terminate HTTPS on 443, proxy plaintext to 7842 on
        localhost</em>. The auth key was a one-shot from the admin
        console; the hostname registered itself; magic DNS picked it
        up; the cert came down from Let&rsquo;s Encrypt via the
        tailnet&rsquo;s ACME path within about ninety seconds. The
        box is now reachable at <code>sharp-bench.tail99b2a4.ts.net</code>{" "}
        from anything I have logged in on &mdash; phone, laptop,
        Looking Glass node upstairs &mdash; over TLS that browsers do
        not warn about.<sup>2</sup>
      </p>
      <p>
        The reason this matters is not the convenience. It is the
        posture. The studio already has an Aperture LLM proxy on the
        same tailnet doing the same trick &mdash; a node called{" "}
        <code>ai</code> that fans out to Ollama and a couple of paid
        endpoints, also speaking HTTPS, also reachable only from
        machines that have been admitted. Adding Sharp to the same
        fabric means the print pipeline, the image pipeline, and the
        inference pipeline all now speak to each other in the same
        register: cert-validated, identity-checked, on a private
        overlay that has never touched a public DNS record. Two
        nodes are a habit. The whole bench moving in this direction
        is a posture.
      </p>
      <p>
        Concrete numbers, because the workshop voice insists. One
        sidecar container, about forty lines of compose, six
        environment variables, one auth key burned. <code>100.106.55.49</code>{" "}
        is the tailnet IP the sharp-bench node ended up on; the
        magic-DNS name resolves to it from every other machine on the
        tailnet within five seconds of the container coming up. The
        Sharp service itself was not changed &mdash; it still binds
        to 7842, still speaks plain HTTP, still believes it is the
        only thing on the box. The TLS termination, the hostname, the
        cert renewal, the access control are all handled by the
        sidecar. The bench did not have to know it had been promoted.
      </p>
      <p>
        What is on the bench next is the rest of the line. The print
        queue, the witness-camera dropbox, the colour-managed proof
        viewer, and the small dashboard that tells me whether the
        belt printer is mid-job &mdash; all of them currently
        plaintext loopback services, all of them candidates for the
        same sidecar pattern. The work is not glamorous. It is the
        boring kind of infrastructure that quietly relocates a studio
        from <em>at-the-bench</em> to <em>reachable-from-anywhere-I-am</em>.
        Now I am going to ping it from a phone on mobile data and
        watch the cert validate.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Sharp is the workhorse the studio leans on for almost every
          pixel-level operation that the print line needs. The
          documentation is at{" "}
          <a
            href="https://sharp.pixelplumbing.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            sharp.pixelplumbing.com{arrow}
          </a>
          ; the underlying library is libvips. Both are excellent and
          neither needed any change for this work.
        </li>
        <li>
          The hostname is the studio&rsquo;s tailnet domain, of the
          shape <code>&lt;node&gt;.tail99b2a4.ts.net</code>. Tailscale
          assigns each tailnet its own subdomain under{" "}
          <code>ts.net</code>; the cert is issued by Let&rsquo;s
          Encrypt on the strength of that ownership and renews
          automatically. The node is not on the public internet at
          any point in the chain.
        </li>
      </ol>
    </>
  );
}
