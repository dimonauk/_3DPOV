# Termius — Tailnet hosts for Holoflow / Hangar

Quick reference for setting up Termius to SSH into the studio's
machines over Tailscale. Three SSH targets (Sovereign-PC, Swift,
Aperture) plus optional port-forwards for service ports the bench
exposes.

> **Prerequisite**: the device running Termius must be on the
> tailnet. Install the Tailscale app on the phone / laptop, sign in,
> and it'll handle DNS resolution for `*.tail99b2a4.ts.net`. Without
> Tailscale, none of these hosts resolve.

---

## Hosts to add in Termius

Two patterns work — pick one consistently:

- **By MagicDNS hostname** (recommended): use `chonky.tail99b2a4.ts.net`
  etc. Survives the tailnet IP renumbering you can't predict.
- **By Tailscale IP**: use `100.122.69.49` etc. Slightly faster on
  first connection (no DNS round-trip).

### 1. Sovereign-PC (the bench)

| Field | Value |
|---|---|
| Label | `Sovereign-PC` |
| Host / Address | `chonky.tail99b2a4.ts.net` (or `100.122.69.49`) |
| Port | `22` |
| Username | `dimon` |
| Group | `Hangar` |

This is the main bench machine: Windows 11, RTX 3080 Ti, primary
working directory `D:\The_Hangar\`. Everything the studio builds
either runs here or proxies through here.

### 2. Swift (the laptop / display satellite)

| Field | Value |
|---|---|
| Label | `Swift` |
| Host / Address | `swift.tail99b2a4.ts.net` (or `100.71.193.101`) |
| Port | `22` |
| Username | `dimon` |
| Group | `Hangar` |

Windows laptop, Looking Glass Portrait host, working directory
`D:\The_Hangar_Mobile\`. Comes out for finishing-school sessions and
on-the-road work.

### 3. Aperture (the LLM gateway)

| Field | Value |
|---|---|
| Label | `Aperture` |
| Host / Address | `ai.tail99b2a4.ts.net` (or `100.108.16.5`) |
| Port | `22` |
| Username | _ssh user on the Aperture host — set when you provisioned it_ |
| Group | `Services` |

Linux box hosting the multi-provider LLM proxy at
`https://ai.tail99b2a4.ts.net/`. Primarily an HTTP service — you
rarely need SSH here unless restarting the gateway. Skip if
unsure of the user.

---

## OpenSSH config snippet

Termius can import an SSH config block via **Settings → Sync &
Backup → Import from SSH config**, or you can paste this into
`~/.ssh/config` (macOS / Linux) or
`C:\Users\dimon\.ssh\config` (Windows) and Termius will pick it up.

```ssh-config
# Sovereign-PC — bench / compute / MCP host
Host sovereign chonky
    HostName chonky.tail99b2a4.ts.net
    User dimon
    Port 22
    ServerAliveInterval 60

# Swift — Looking Glass / mobile satellite
Host swift
    HostName swift.tail99b2a4.ts.net
    User dimon
    Port 22
    ServerAliveInterval 60

# Aperture — LLM gateway (set User to whatever you provisioned)
Host aperture ai
    HostName ai.tail99b2a4.ts.net
    Port 22
    ServerAliveInterval 60
```

With that block in place, `ssh sovereign` or `ssh swift` from any
shell on the same device hits the right machine.

---

## Authentication — two options

### A. Tailscale SSH (recommended; no key management)

If `tailscale ssh on` is enabled on the target machines, Tailscale
handles auth via the tailnet ACL. No keys to generate, no
`authorized_keys` to maintain — the tailnet identity is the
credential. Run on each target:

```powershell
# Sovereign-PC / Swift (run in elevated PowerShell)
tailscale set --ssh
```

```bash
# Aperture (Linux)
sudo tailscale set --ssh
```

Then in the tailnet admin (`https://login.tailscale.com/admin/acls/`)
make sure your devices have an `ssh` rule that allows your phone /
laptop's tailnet identity to connect to the target tags.

Termius then connects as normal — Tailscale intercepts the SSH
handshake transparently.

### B. Public-key auth (the classic path)

Generate a key pair in Termius (Keychain → New key → Ed25519). Copy
the public key to each target:

```powershell
# Sovereign-PC / Swift — paste the public key as one line into:
notepad C:\Users\dimon\.ssh\authorized_keys
```

```bash
# Aperture
mkdir -p ~/.ssh && echo "<paste public key>" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

In Termius, attach the key to each host or to a reusable Identity
(Settings → Identities → New → "Hangar Default" → key + username
`dimon`) and apply that Identity to all three hosts.

---

## Optional: port-forwards for bench services

Termius supports port-forwarding under each host's settings →
**Port forwarding**. Forward these if you want the bench services
reachable as `localhost:<port>` on your local device:

| Service | Bench host:port | Suggested local port | What it is |
|---|---|---|---|
| Ollama | `chonky.tail99b2a4.ts.net:11434` | `11434` | Local LLM endpoint (Ollama API) |
| ComfyUI | `chonky.tail99b2a4.ts.net:8188` | `8188` | ComfyUI web UI + API |
| DollyOS Vite | `chonky.tail99b2a4.ts.net:5199` | `5199` | DollyOS Crystal dev server |
| Evolution Suite | `chonky.tail99b2a4.ts.net:5139` | `5139` | Evolution Suite bench |
| Blender MCP | `chonky.tail99b2a4.ts.net:9876` | `9876` | Blender MCP socket |
| Gateway MCP | `chonky.tail99b2a4.ts.net:8005` | `8005` | Tool MCP server |

You don't _need_ port-forwards if the local device is on the
tailnet — you can just hit `chonky.tail99b2a4.ts.net:11434`
directly. Forwarding is convenient when an app on the local device
is hardcoded to `localhost:<port>`.

---

## Useful Termius snippets

Save these under **Snippets** to one-tap-run on the connected host.

```bash
# Tailscale: who am I, who else is here?
tailscale status

# Tailscale: re-enable SSH (Windows; run in elevated PowerShell)
tailscale set --ssh

# Sovereign-PC: status of every Hangar dev server (rough)
Get-Process | Where-Object { $_.ProcessName -match "node|pnpm|python|comfy" } | Format-Table Id, ProcessName, CPU -AutoSize

# Aperture: tail the gateway logs
docker logs --tail 100 -f aperture
```

---

## Troubleshooting

**`Connection timed out` on a host**: Tailscale on the local device
isn't connected. Open the Tailscale app, sign in, then retry.

**`Connection refused` (port 22 closed)**: OpenSSH Server isn't
running on the target. On Windows, install + start it once:

```powershell
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Start-Service sshd
Set-Service -Name sshd -StartupType Automatic
```

**Password keeps being asked even with a key uploaded**: the file
permissions on `authorized_keys` are wrong, or the file lives in the
wrong user's profile. Verify the path matches your Windows username
exactly (`C:\Users\dimon\.ssh\authorized_keys`).

**MagicDNS doesn't resolve `*.tail99b2a4.ts.net`**: MagicDNS is
disabled in the tailnet admin, or the local Tailscale daemon hasn't
synced yet. Run `tailscale status` to confirm the daemon is up;
toggle Tailscale off/on if MagicDNS lookups still fail.

---

## What this doc isn't

- **Not a substitute for the tailnet admin ACLs.** If a host
  refuses your SSH attempt with "tailnet policy denies SSH", fix
  it in `https://login.tailscale.com/admin/acls/` first.
- **Not the bench-bridge runbook.** For exposing a bench service
  to the public Vercel deploy (Tailscale Funnel + bearer token),
  see the `holoflow-bench-bridge` skill.
- **Not finishing-school orchestration.** For the
  Sovereign-PC ↔ Swift cross-node MCP / Looking Glass workflow,
  see the `finishing-school-protocol` skill.
