# Lab: WireGuard Fundamentals and Deployment

**Module:** Edge Access & VPN
**Activity type:** Lab (Practice)
**Lab risk:** low
**Objective:** Describe WireGuard's peer-to-peer architecture and public-key identity model

## Before you start

- Comfort with Linux command-line navigation and file redirection
- Basic understanding of IPv4 addresses, CIDR notation, routes, UDP, and network interfaces
- A Linux host with wireguard-tools installed, including wg and wg-quick
- Permission to create and manage /opt/lab-classroom/class69/
- Awareness that WireGuard private keys must be protected like passwords

## Guided lab

### name
Generate and validate a two-peer WireGuard configuration

### safety_boundary
Run only the listed commands. The exercise writes exclusively beneath /opt/lab-classroom/class69/. Do not activate these example configurations on a remotely administered system as part of this class.

### address_plan
### server_tunnel_address
10.69.0.1/24

### client_tunnel_address
10.69.0.2/24

### illustrative_server_endpoint
198.51.100.10:51820

### wireguard_udp_port
51820

### steps
### step
1

### instruction
Confirm that the required user-space utilities are already available. These checks do not install software or alter the host.

### commands
command -v wg
command -v wg-quick
wg --version
### step
2

### instruction
Create private server and client directories owned by the invoking account.

### commands
sudo install -d -m 700 -o "$(id -u)" -g "$(id -g)" /opt/lab-classroom/class69/server /opt/lab-classroom/class69/client
### step
3

### instruction
Generate one private and public key pair for each peer. The restrictive umask protects newly created files.

### commands
umask 077; wg genkey | tee /opt/lab-classroom/class69/server/private.key | wg pubkey > /opt/lab-classroom/class69/server/public.key
umask 077; wg genkey | tee /opt/lab-classroom/class69/client/private.key | wg pubkey > /opt/lab-classroom/class69/client/public.key
### step
4

### instruction
Verify that each stored public key can be independently derived from its stored private key.

### commands
test "$(wg pubkey < /opt/lab-classroom/class69/server/private.key)" = "$(cat /opt/lab-classroom/class69/server/public.key)" && echo 'server key pair verified'
test "$(wg pubkey < /opt/lab-classroom/class69/client/private.key)" = "$(cat /opt/lab-classroom/class69/client/public.key)" && echo 'client key pair verified'
### step
5

### instruction
Create the server-side configuration using the generated keys. This file is not activated.

### commands
ROOT=/opt/lab-classroom/class69; SERVER_PRIVATE=$(cat "$ROOT/server/private.key"); CLIENT_PUBLIC=$(cat "$ROOT/client/public.key"); umask 077; cat > "$ROOT/server/wg0.conf" <<EOF
[Interface]
Address = 10.69.0.1/24
ListenPort = 51820
PrivateKey = $SERVER_PRIVATE
SaveConfig = false

[Peer]
PublicKey = $CLIENT_PUBLIC
AllowedIPs = 10.69.0.2/32
EOF
### step
6

### instruction
Create the client-side configuration. The endpoint uses an RFC 5737 documentation address and is not expected to be reachable.

### commands
ROOT=/opt/lab-classroom/class69; CLIENT_PRIVATE=$(cat "$ROOT/client/private.key"); SERVER_PUBLIC=$(cat "$ROOT/server/public.key"); umask 077; cat > "$ROOT/client/wg0.conf" <<EOF
[Interface]
Address = 10.69.0.2/24
PrivateKey = $CLIENT_PRIVATE
SaveConfig = false

[Peer]
PublicKey = $SERVER_PUBLIC
Endpoint = 198.51.100.10:51820
AllowedIPs = 10.69.0.0/24
PersistentKeepalive = 25
EOF
### step
7

### instruction
Use wg-quick's strip operation as an offline parser. It removes wg-quick-only keys and emits the configuration understood by wg without creating an interface.

### commands
umask 077; wg-quick strip /opt/lab-classroom/class69/server/wg0.conf > /opt/lab-classroom/class69/server/stripped.conf
umask 077; wg-quick strip /opt/lab-classroom/class69/client/wg0.conf > /opt/lab-classroom/class69/client/stripped.conf
### step
8

### instruction
Inspect metadata and non-secret public values. Do not print private keys or complete configuration files into shared logs.

### commands
stat -c '%a %n' /opt/lab-classroom/class69/server/private.key /opt/lab-classroom/class69/server/wg0.conf /opt/lab-classroom/class69/client/private.key /opt/lab-classroom/class69/client/wg0.conf
printf 'Server public key: '; cat /opt/lab-classroom/class69/server/public.key
printf 'Client public key: '; cat /opt/lab-classroom/class69/client/public.key
grep -E '^\[|^ListenPort|^PublicKey|^AllowedIPs|^Endpoint|^PersistentKeepalive' /opt/lab-classroom/class69/server/wg0.conf /opt/lab-classroom/class69/client/wg0.conf

## Expected results

- The wg and wg-quick commands are found before any lab files are created.
- Separate server and client directories exist beneath /opt/lab-classroom/class69/.
- Each peer has a private.key and public.key file containing a valid WireGuard key pair.
- Both key-pair verification commands print a successful verification message.
- The server configuration assigns 10.69.0.2/32 to the client's public key.
- The client configuration assigns 10.69.0.0/24 to the server's public key and declares 198.51.100.10:51820 as its endpoint.
- Both wg-quick strip commands exit successfully and create non-empty stripped.conf files.
- Sensitive key and configuration files report mode 600 when created under the restrictive umask.
- No WireGuard interface is created, and the host's active routes and forwarding settings remain unchanged.

## Verification

- [ ] Run: test -s /opt/lab-classroom/class69/server/private.key && test -s /opt/lab-classroom/class69/server/public.key && echo 'server files present'
- [ ] Run: test -s /opt/lab-classroom/class69/client/private.key && test -s /opt/lab-classroom/class69/client/public.key && echo 'client files present'
- [ ] Run: test "$(wg pubkey < /opt/lab-classroom/class69/server/private.key)" = "$(cat /opt/lab-classroom/class69/server/public.key)" && echo 'server derivation valid'
- [ ] Run: test "$(wg pubkey < /opt/lab-classroom/class69/client/private.key)" = "$(cat /opt/lab-classroom/class69/client/public.key)" && echo 'client derivation valid'
- [ ] Run: test "$(stat -c '%a' /opt/lab-classroom/class69/server/private.key)" = 600 && test "$(stat -c '%a' /opt/lab-classroom/class69/client/private.key)" = 600 && echo 'private-key modes valid'
- [ ] Run: grep -q '^AllowedIPs = 10.69.0.2/32$' /opt/lab-classroom/class69/server/wg0.conf && echo 'server peer prefix valid'
- [ ] Run: grep -q '^AllowedIPs = 10.69.0.0/24$' /opt/lab-classroom/class69/client/wg0.conf && echo 'client routed prefix valid'
- [ ] Run: test -s /opt/lab-classroom/class69/server/stripped.conf && test -s /opt/lab-classroom/class69/client/stripped.conf && echo 'offline parsing completed'
- [ ] Run: test ! -e /opt/lab-classroom/class69/server/public.key.tmp && test ! -e /opt/lab-classroom/class69/client/public.key.tmp && echo 'no temporary key files detected'

## Break/fix

| Symptom | Likely cause | Fix |
|---|---|---|
| command -v wg or command -v wg-quick produces no path. | wireguard-tools is not installed or its executable directory is absent from PATH. | Stop the lab and install the distribution-supported wireguard-tools package using the site's approved software-management process. Then repeat the prerequisite checks. Do not substitute an unreviewed download pipeline. |
| Creating /opt/lab-classroom/class69/ fails with permission denied. | The current account cannot create directories under /opt or cannot use the approved privilege mechanism. | Obtain authorized access for the specified lab path. Do not move the exercise to another path because the class safety boundary permits mutations only below /opt/lab-classroom/class69/. |
| wg genkey reports an error or creates an empty file. | The WireGuard utility is unavailable, storage is full, or a redirection or permission failure interrupted the pipeline. | Check command availability, available storage, directory ownership, and the pipeline exit status. Delete only the failed files within the class workspace and repeat key generation. |
| A derived public key does not equal the stored public key. | The private and public files came from different generation runs, a file was overwritten, or whitespace was introduced during manual editing. | Treat that pair as invalid. Regenerate both files together with the documented pipeline and do not manually edit key material. |
| wg-quick strip rejects Address or another configuration line. | The file contains a spelling, section, key, or value-format error, or the installed wireguard-tools version is incompatible. | Review the reported line, confirm that Interface and Peer headings use brackets, verify CIDR and key formats, and compare supported options with the local wg-quick manual page. |
| Private key or configuration files are more permissive than mode 600. | The restrictive umask was omitted, an existing file retained older permissions, or another process changed metadata. | Do not use the exposed files for a real deployment. Remove the affected lab files using the constrained cleanup procedure, regenerate them with umask 077, and verify metadata before continuing. |
| A future live deployment shows a recent handshake but application traffic fails. | Peer identity and UDP transport work, but AllowedIPs, forwarding, return routing, packet-filter policy, service binding, DNS, or path MTU is incorrect. | Check byte counters and routes in both directions, verify source and destination prefixes against AllowedIPs, confirm the destination service is listening, and inspect every forwarding and packet-filter boundary in the path. |
| A future deployment works briefly from a roaming peer and then becomes unreachable while idle. | An intermediate address-translation mapping expires before the stable peer sends return traffic. | Configure a justified PersistentKeepalive interval on the roaming peer behind address translation, not indiscriminately on every peer. |
| A future full-tunnel deployment disrupts remote administration. | Broad AllowedIPs changed the route used by the existing management session or created an incorrect return path. | Recover through an independent console, restore the previous routing state, and test broad route changes with staged access and an automatic recovery plan. This class does not activate full-tunnel routing. |

## Security

### principles
Never transmit or publish a WireGuard private key.
Keep private keys and configurations containing them readable only by their intended owner.
Distribute public keys through an authenticated administrative channel so substitution can be detected.
Assign the narrowest practical AllowedIPs to each peer.
Use a distinct key pair per device or peer so one device can be revoked without rotating every participant.
Treat a copied private key as compromised even if the original file remains present.
Do not infer application authorization solely from tunnel membership.
Review forwarding and packet-filter policy separately from WireGuard peer configuration.
Protect backups because a backup containing a private key has the same sensitivity as the live key.
Avoid recording complete configurations in terminals, tickets, screenshots, shell histories, or centralized logs.

### key_rotation
Generate a new private key on the peer that will own it, derive the new public key locally, update the opposite peer through an authenticated administrative process, verify connectivity during a controlled overlap if the design permits it, and then remove the old public-key authorization. A suspected private-key compromise requires revocation rather than merely changing the endpoint.

### production_warning
The documentation endpoint 198.51.100.10 is reserved for examples. Replace it only during a separately reviewed production deployment. Before activating any tunnel, document route ownership, address uniqueness, forwarding requirements, name resolution, recovery access, and expected traffic policy.

## Rollback

### scope
Because the lab never activates an interface or changes live networking, rollback consists only of securely removing the class workspace.

### precheck
Confirm the canonical target with: test "$(realpath -m /opt/lab-classroom/class69)" = "/opt/lab-classroom/class69" && find /opt/lab-classroom/class69 -xdev -print

### cleanup_command
test "$(realpath -m /opt/lab-classroom/class69)" = "/opt/lab-classroom/class69" && find /opt/lab-classroom/class69 -xdev -mindepth 1 -delete && rmdir /opt/lab-classroom/class69

### postcheck
Run: test ! -e /opt/lab-classroom/class69 && echo 'class 69 workspace removed'

### recovery_note
Deleted private keys cannot be reconstructed from their public keys. If cleanup was accidental, restore an authorized protected backup or rerun the lab to create entirely new identities.
