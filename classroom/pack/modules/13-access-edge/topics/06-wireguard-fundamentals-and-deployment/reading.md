# Reading: WireGuard Fundamentals and Deployment

**Module:** Edge Access & VPN
**Activity type:** Reading (Learn)
**Objective:** Describe WireGuard's peer-to-peer architecture and public-key identity model

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

## Required reading

- WireGuard Quick Start: https://www.wireguard.com/quickstart/
- WireGuard conceptual overview: https://www.wireguard.com/
- wg(8) manual page: https://man7.org/linux/man-pages/man8/wg.8.html
- wg-quick(8) manual page: https://man7.org/linux/man-pages/man8/wg-quick.8.html
- RFC 5737 documentation address blocks: https://www.rfc-editor.org/rfc/rfc5737

## References

- WireGuard official site: https://www.wireguard.com/
- WireGuard Quick Start: https://www.wireguard.com/quickstart/
- WireGuard protocol and cryptography: https://www.wireguard.com/protocol/
- wg(8) manual page: https://man7.org/linux/man-pages/man8/wg.8.html
- wg-quick(8) manual page: https://man7.org/linux/man-pages/man8/wg-quick.8.html
- Linux kernel WireGuard documentation: https://www.kernel.org/doc/html/latest/networking/wireguard.html
- RFC 5737, IPv4 Address Blocks Reserved for Documentation: https://www.rfc-editor.org/rfc/rfc5737
- RFC 1918, Address Allocation for Private Internets: https://www.rfc-editor.org/rfc/rfc1918
