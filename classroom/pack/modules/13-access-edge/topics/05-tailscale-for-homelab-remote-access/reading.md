# Reading: Tailscale for Homelab Remote Access

**Module:** Edge Access & VPN
**Activity type:** Reading (Learn)
**Objective:** Explain the roles of the Tailscale coordination service, node identity, WireGuard tunnels, and DERP relays

## Vocabulary

| Term | Meaning |
|---|---|
| Tailnet | The private Tailscale network associated with an organization or identity domain. |
| Coordination service | The service that authenticates nodes and distributes the information required for authorized peers to discover and establish encrypted connections. It is not normally in the data path. |
| WireGuard | The encrypted tunneling protocol used for Tailscale data traffic between nodes. |
| DERP | A Tailscale relay system used when two peers cannot establish a direct path. Relayed traffic remains end-to-end encrypted. |
| Direct connection | A peer-to-peer data path established between two Tailscale nodes without carrying application traffic through a DERP relay. |
| Subnet router | A Tailscale node that advertises reachability to one or more non-Tailscale IP subnets. |
| Exit node | A Tailscale node selected to carry a client's general internet-bound traffic, similar to a full-tunnel VPN gateway. |
| MagicDNS | Tailscale-provided naming that allows devices to be addressed by tailnet DNS names instead of only Tailscale IP addresses. |
| Tag | A non-human identity label assigned to a device or service role and governed by tag ownership rules. |
| Grant | A tailnet policy rule expressing which sources may reach which destinations and, where supported, what application-level capabilities are allowed. |
| Route approval | An administrative control that determines whether a route advertised by a node is accepted for use by the tailnet. |
| Key expiry | A control that requires a node to reauthenticate after its node key reaches the configured expiration point. |

## Instruction

Traditional remote access often begins by publishing a management port, forwarding traffic through a residential router, or placing a broad remote-access server in front of the entire home network. Each approach can work, but it increases the importance of patching, credential protection, perimeter configuration, and careful routing. Tailscale takes an identity-aware overlay approach. Each enrolled node receives a tailnet identity and encrypted addressing. The coordination service helps authenticated nodes learn public keys, endpoints, policy, and network-map information. Application traffic normally travels directly between peers over WireGuard when network address translation and path conditions permit. If a direct path cannot be established, traffic can traverse a DERP relay while remaining encrypted between the endpoints.

A Tailscale IP does not automatically mean every device may access every service. Authorization is controlled by the tailnet policy, device posture features where available, identity groups, tags, and administrative approval settings. Human-owned clients are commonly represented by user identities, while durable infrastructure should use carefully governed tags. A useful design separates administrators, ordinary users, infrastructure nodes, and temporary devices. For example, an administrator group might reach a hypervisor management interface, while a media-user group may reach only a media service. Avoid creating one broad rule simply because every system belongs to the same homelab.

A subnet router extends access to devices that cannot run Tailscale, such as an appliance or isolated management interface. This convenience also expands the trust boundary: the router becomes a transit point, the advertised prefixes must not overlap unexpectedly with remote networks, and both route approval and policy authorization must be considered. An exit node has a different purpose. It carries general client traffic rather than merely providing access to a selected private subnet. Selecting an exit node can affect latency, DNS behavior, internet geolocation, and the operator's responsibility for traffic leaving that node.

Operational verification should separate three questions. First, is the device authenticated and present in the intended tailnet? Second, does policy authorize the attempted source, destination, and service? Third, can the peers establish a usable path? A failed connection is not always an authentication failure. It may be a policy denial, an unapproved route, a service listening only on a different interface, an overlapping subnet, or a path that has fallen back to a relay. Tailscale status and ping diagnostics can help distinguish these layers, but sensitive inventory information should not be pasted into public tickets. This class deliberately does not enroll a device, advertise routes, select an exit node, or change host networking. Learners instead inspect existing state read-only and create a design that can be reviewed before any production deployment.

## Architecture

### components
Remote client: an administrator-controlled laptop, phone, or tablet enrolled in the tailnet
Coordination service: authenticates identities and distributes peer, key, endpoint, and policy information
Homelab Tailscale node: a server that runs Tailscale and exposes only specifically authorized services
DERP relay: an encrypted fallback data path when a direct peer-to-peer path cannot be established
Optional subnet router: a node that forwards authorized traffic toward selected non-Tailscale networks
Optional exit node: a node that forwards a client's general internet traffic when explicitly selected
Tailnet policy: the authorization layer governing source-to-destination access

### normal_flow
The client and homelab node authenticate independently and receive tailnet network information.
Policy determines whether the source identity may reach the destination and service.
The peers attempt to discover a direct network path.
If direct connectivity succeeds, encrypted application traffic travels peer to peer.
If direct connectivity fails, encrypted traffic can use a DERP relay.
The destination service still applies its own application authentication and authorization.

### trust_boundaries
Identity provider and tailnet administrator accounts
Endpoint operating systems and local credential stores
Tag ownership and tailnet policy administration
Subnet-router forwarding boundary
Exit-node internet egress boundary
The application authentication boundary behind the encrypted network path

### design_principle
Use Tailscale as a private connectivity and authorization layer, not as a replacement for endpoint patching, application authentication, logging, backups, or service-specific authorization.

## Required reading

- Tailscale documentation: How Tailscale works — https://tailscale.com/kb/1151/what-is-tailscale
- Tailscale documentation: Connection types — https://tailscale.com/kb/1257/connection-types
- Tailscale documentation: Access control — https://tailscale.com/kb/1018/acls
- Tailscale documentation: Subnet routers — https://tailscale.com/kb/1019/subnets
- Tailscale documentation: Device approval — https://tailscale.com/kb/1099/device-approval

## References

- Tailscale documentation: What is Tailscale? — https://tailscale.com/kb/1151/what-is-tailscale
- Tailscale documentation: How Tailscale works — https://tailscale.com/blog/how-tailscale-works
- Tailscale documentation: Connection types — https://tailscale.com/kb/1257/connection-types
- Tailscale documentation: DERP servers — https://tailscale.com/kb/1232/derp-servers
- Tailscale documentation: Access control policies — https://tailscale.com/kb/1018/acls
- Tailscale documentation: Grants syntax — https://tailscale.com/kb/1324/grants
- Tailscale documentation: Subnet routers — https://tailscale.com/kb/1019/subnets
- Tailscale documentation: Exit nodes — https://tailscale.com/kb/1103/exit-nodes
- Tailscale documentation: MagicDNS — https://tailscale.com/kb/1081/magicdns
- Tailscale documentation: Device approval — https://tailscale.com/kb/1099/device-approval
- Tailscale documentation: Auth keys — https://tailscale.com/kb/1085/auth-keys
- WireGuard protocol overview — https://www.wireguard.com/protocol/
