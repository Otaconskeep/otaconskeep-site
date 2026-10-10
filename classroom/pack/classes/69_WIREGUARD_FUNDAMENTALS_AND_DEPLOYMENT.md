# Class 69: WireGuard Fundamentals and Deployment

**Learning objective:** Describe WireGuard's peer-to-peer architecture and public-key identity model; Explain the roles of PrivateKey, PublicKey, Endpoint, ListenPort, AllowedIPs, and PersistentKeepalive; Distinguish tunnel addresses from transport addresses; Explain how AllowedIPs participates in both routing decisions and peer authorization; Generate WireGuard private and public keys with restrictive file permissions; Construct complementary server and client configurations; Validate configuration syntax without activating an interface or changing host networking; Identify common causes of handshakes without traffic, one-way traffic, and endpoint reachability failures; Plan a production deployment with least privilege, narrow routes, key protection, and explicit forwarding policy
**Bloom level:** Understand / Apply
**Track:** Networking and Secure Remote Access · **Difficulty:** intermediate · **Duration:** ~120 minutes · **Lab risk:** low
**Build output:** Explain WireGuard's cryptographic peer model, routing behavior, configuration structure, and safe deployment workflow. The lab generates real WireGuard keys and validates paired server and client configurations without creating interfaces, changing routes, enabling forwarding, or modifying files outside the class workspace.
**Mastery unlock:** ≥80% quiz + completed Feynman teach-back + lab verification + homework evidence.
**Last reviewed:** 2025-03-08
**Compatibility:** ### supported_environment
Linux with wireguard-tools providing wg and wg-quick, a POSIX-compatible shell with the demonstrated common utilities, and authorized access to /opt/lab-classroom/class69/.

### tested_design_scope
Offline key generation, configuration construction, key derivation checks, permission inspection, and wg-quick strip parsing.

### not_performed
Kernel module loading
WireGuard interface creation
Address assignment
Route modification
Packet forwarding changes
Resolver changes
Service enablement
Production endpoint testing

### portability_notes
The configuration concepts apply across WireGuard implementations, but interface activation, routing integration, secure key storage, and service management differ among Linux distributions, containers, BSD systems, macOS, Windows, routers, and mobile clients.

## Learning objective

- Describe WireGuard's peer-to-peer architecture and public-key identity model
- Explain the roles of PrivateKey, PublicKey, Endpoint, ListenPort, AllowedIPs, and PersistentKeepalive
- Distinguish tunnel addresses from transport addresses
- Explain how AllowedIPs participates in both routing decisions and peer authorization
- Generate WireGuard private and public keys with restrictive file permissions
- Construct complementary server and client configurations
- Validate configuration syntax without activating an interface or changing host networking
- Identify common causes of handshakes without traffic, one-way traffic, and endpoint reachability failures
- Plan a production deployment with least privilege, narrow routes, key protection, and explicit forwarding policy

## Why this matters

Explain WireGuard's cryptographic peer model, routing behavior, configuration structure, and safe deployment workflow. The lab generates real WireGuard keys and validates paired server and client configurations without creating interfaces, changing routes, enabling forwarding, or modifying files outside the class workspace.

## Prerequisites

- Comfort with Linux command-line navigation and file redirection
- Basic understanding of IPv4 addresses, CIDR notation, routes, UDP, and network interfaces
- A Linux host with wireguard-tools installed, including wg and wg-quick
- Permission to create and manage /opt/lab-classroom/class69/
- Awareness that WireGuard private keys must be protected like passwords

## Required reading

- WireGuard Quick Start: https://www.wireguard.com/quickstart/
- WireGuard conceptual overview: https://www.wireguard.com/
- wg(8) manual page: https://man7.org/linux/man-pages/man8/wg.8.html
- wg-quick(8) manual page: https://man7.org/linux/man-pages/man8/wg-quick.8.html
- RFC 5737 documentation address blocks: https://www.rfc-editor.org/rfc/rfc5737

## Prior-knowledge check

Answer briefly before reading Instruction.

1. What problem does this class prevent in a homelab?
2. What disposable lab boundary will you use?
3. What evidence will prove you succeeded?

## Vocabulary

| Term | Meaning |
|---|---|
| Peer | A WireGuard participant identified by a public key. WireGuard does not fundamentally assign permanent client and server roles; those labels describe deployment behavior. |
| PrivateKey | The secret key that proves a peer's identity. It must remain readable only by the intended administrator and WireGuard process. |
| PublicKey | A value derived from a private key and distributed to other peers so they can authenticate encrypted traffic from its owner. |
| Endpoint | The transport-layer IP address or hostname and UDP port where a peer can currently be reached. |
| Tunnel address | An address assigned to the logical WireGuard interface and used inside the encrypted tunnel. |
| Transport address | The ordinary network address used to carry encrypted WireGuard UDP packets between peers. |
| AllowedIPs | A list of prefixes associated with a peer. It acts as an outbound peer-selection table and as an inbound source-address authorization rule. |
| ListenPort | The local UDP port on which a WireGuard interface receives encrypted packets. |
| PersistentKeepalive | An optional interval that causes periodic authenticated packets to preserve state in intervening address-translation devices. It is commonly configured only on a peer behind such a device. |
| Handshake | The authenticated cryptographic exchange through which peers establish fresh session keys. |
| Full tunnel | A design in which a peer routes most or all ordinary IP traffic through WireGuard, commonly represented by broad AllowedIPs values. |
| Split tunnel | A design in which only selected destination prefixes are routed through WireGuard. |

## Instruction

WireGuard is a compact encrypted network tunnel built around peers and public keys. Each interface owns a private key, and each configured peer is identified by the corresponding public key. The words server and client are operational conveniences rather than distinct protocol roles. A continuously reachable peer usually has a stable UDP port and is called the server, while roaming laptops or phones are commonly called clients. WireGuard separates the transport network from the tunneled network. For example, 198.51.100.10:51820 can describe how encrypted UDP packets reach a peer, while 10.69.0.1 and 10.69.0.2 identify the peers inside the tunnel.

AllowedIPs is the most important configuration concept to understand. For outbound traffic, WireGuard compares the destination address with peer prefixes and selects the peer having the most specific matching prefix. For inbound decrypted traffic, WireGuard verifies that the packet's source address belongs to the AllowedIPs assigned to the peer that authenticated it. AllowedIPs therefore behaves both like a route-selection map and a cryptographic source authorization policy. It is not merely a list of networks that a user would like to access. Duplicate or overlapping prefixes can create surprising peer selection, while broad prefixes can direct more traffic into the tunnel than intended.

An Endpoint tells one peer where to send encrypted packets. A stable listener generally does not need to declare an Endpoint for a roaming client because it learns the client's current endpoint from authenticated traffic. The roaming peer normally declares the stable listener's address. PersistentKeepalive is not an encryption-strength setting and should not be added automatically to every peer. It is useful when a quiet peer sits behind address translation and needs to preserve the mapping required for return traffic. A common interval is documented by the project, but administrators should choose it according to their network behavior rather than treating it as mandatory.

A successful handshake proves that key identity and basic UDP reachability are working, but it does not prove that every tunneled flow is correctly routed or permitted. Traffic can still fail because of incorrect prefixes, disabled forwarding, missing return routes, packet-filter policy, DNS behavior, path MTU problems, or an application listening only on another address. Troubleshooting should therefore proceed in layers: confirm configuration syntax, confirm keys, confirm endpoint resolution and UDP reachability, inspect handshake state, inspect byte counters, inspect routes, and finally test the destination service. This class deliberately stops before interface activation. It creates authentic key material and parseable configurations while preserving the host's live network state.

## Architecture

### topology
A stable peer uses tunnel address 10.69.0.1/24 and an illustrative transport endpoint of 198.51.100.10:51820. A roaming peer uses tunnel address 10.69.0.2/24. The server associates 10.69.0.2/32 with the client's public key. The client associates 10.69.0.0/24 with the server's public key and sends encrypted packets to the server endpoint.

### control_plane
Administrators exchange public keys and assign non-conflicting AllowedIPs. Private keys remain local. Configuration establishes identity, peer selection, endpoint hints, and optional keepalive behavior.

### data_plane
An outbound packet matching a peer's AllowedIPs is encrypted for that peer and encapsulated in UDP. The receiving peer authenticates and decrypts it, then checks whether its inner source address is authorized for the public key that sent it.

### trust_boundaries
Possession of a private key establishes peer identity.
AllowedIPs limits the source prefixes an authenticated peer may present.
Operating-system routing and packet-filter policy remain separate from WireGuard cryptography.
Forwarding traffic beyond the WireGuard host requires an explicit production design and is not performed in this lab.

### lab_scope
All generated keys, configurations, and parser output remain under /opt/lab-classroom/class69/. No WireGuard interface is created and no route, resolver, forwarding, kernel, service, or system-wide configuration is changed.

## Worked example

See the worked example embedded in Instruction; reproduce it on your disposable lab path.

## Guided practice

Complete the guided lab steps with hints allowed, then restate results in your own words.

## Independent practice

### assignment
Design, but do not activate, a three-peer WireGuard topology consisting of one stable hub and two roaming peers. Give every peer a unique tunnel address from 10.69.1.0/24. Write a table listing each peer's public-key owner, tunnel address, endpoint requirement, and AllowedIPs on every other peer.

### constraints
Do not reuse private keys between roaming peers.
Do not use a broad default route.
Ensure the hub assigns a unique /32 prefix to each roaming peer.
Explain whether direct roaming-peer communication should traverse the hub.
State what forwarding and return-routing behavior would be required if inter-peer communication is permitted.
Store any homework files only below /opt/lab-classroom/class69/.

### deliverable
Submit the address and peer-policy table plus a short explanation of how overlapping AllowedIPs would affect peer selection.

## Feynman teach-back

### prompt
Explain WireGuard to a classmate without using the phrases virtual private network or magic tunnel. Include how a peer knows whom to encrypt for, how the receiver validates an inner source address, and why a handshake does not guarantee that an application will work.

### model_explanation
Each participant keeps a secret key and gives the matching public key to trusted participants. When the operating system sends a packet toward a configured prefix, WireGuard uses AllowedIPs to choose which peer should receive it and encrypts it for that peer. The receiver proves which public-key identity sent the packet and accepts the packet's inner source only if that source belongs to the AllowedIPs assigned to the authenticated peer. A handshake confirms identity and basic encrypted UDP reachability, but the packet may still encounter an incorrect route, forwarding policy, packet-filter decision, name-resolution problem, or unavailable application.

### self_check
Can you clearly separate transport addresses from tunnel addresses?
Can you describe both the outbound and inbound meanings of AllowedIPs?
Can you explain why the stable peer may omit an Endpoint for a roaming peer?
Can you explain why PersistentKeepalive is situational rather than universally required?

## Retrieval check

1. 1. What cryptographic value identifies a WireGuard peer to other peers?
2. 2. What are the two principal functions of AllowedIPs?
3. 3. Why does the server-side peer entry in this lab use 10.69.0.2/32 instead of 10.69.0.0/24?
4. 4. What is the difference between the client tunnel address and the Endpoint address?
5. 5. Does a recent WireGuard handshake prove that application traffic is correctly routed and permitted?
6. 6. When is PersistentKeepalive commonly useful?
7. 7. Why should each device have a distinct WireGuard key pair?
8. 8. Why does the lab use wg-quick strip instead of activating the configurations?
9. 9. Which key may be distributed to other peers, and which key must remain secret?
10. 10. What should be checked first when a peer has a handshake and increasing transmit counters but no received application data?

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

## Verification checkpoints

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

## Security considerations

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

## Video narration notes

Begin by drawing two separate layers. On the outside, show ordinary network addresses carrying UDP packets. On the inside, show 10.69.0.1 and 10.69.0.2 as tunnel addresses. Emphasize that these address sets serve different purposes. Next, introduce each peer's private and public key. The private key never leaves its owner, while the public key is installed in the opposite peer's configuration. Walk through an outbound packet from the client to 10.69.0.1. The client compares the destination with AllowedIPs, selects the server peer, encrypts the packet for the server's public-key identity, and sends the encrypted result to 198.51.100.10 on UDP port 51820. On receipt, the server authenticates the client and checks that the inner source is 10.69.0.2, the address authorized for that client's key.

Move to the lab and explain the safety boundary before running any command. The exercise creates real key material and real configuration syntax, but it does not activate an interface. Demonstrate the restrictive umask and point out that the public key is derived through wg pubkey rather than invented or copied manually. Build the server configuration first and explain why its client AllowedIPs value is a narrow /32. Build the client configuration and explain why its server AllowedIPs covers the lab tunnel subnet. Describe the example Endpoint as a documentation-only transport address. Discuss PersistentKeepalive as a response to idle address-translation state, not as a performance or security enhancement.

Use wg-quick strip to validate both files offline. Explain that Address is interpreted by wg-quick, while the stripped output contains settings understood by wg. Inspect permissions and public values without printing private keys. Finish with a troubleshooting sequence: syntax, key correspondence, endpoint and UDP path, handshake, counters, routes, forwarding policy, return path, and application availability. Reinforce that a handshake is an important checkpoint but is not proof of complete end-to-end service delivery.

## References

- WireGuard official site: https://www.wireguard.com/
- WireGuard Quick Start: https://www.wireguard.com/quickstart/
- WireGuard protocol and cryptography: https://www.wireguard.com/protocol/
- wg(8) manual page: https://man7.org/linux/man-pages/man8/wg.8.html
- wg-quick(8) manual page: https://man7.org/linux/man-pages/man8/wg-quick.8.html
- Linux kernel WireGuard documentation: https://www.kernel.org/doc/html/latest/networking/wireguard.html
- RFC 5737, IPv4 Address Blocks Reserved for Documentation: https://www.rfc-editor.org/rfc/rfc5737
- RFC 1918, Address Allocation for Private Internets: https://www.rfc-editor.org/rfc/rfc1918

## Mastery gate

- [ ] Objectives demonstrated with evidence
- [ ] Feynman complete
- [ ] Quiz self-scored ≥80%
- [ ] Lab verification boxes checked
- [ ] Rollback understood

## Reflection

1. What did I learn?
2. What did I struggle with?
3. How does this connect to earlier classes?

## Spiral hook

Return to this class whenever a later service fails for identity, process, log, remote access, update, or routing reasons covered here.
