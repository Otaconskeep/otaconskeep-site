# Reading: Tailscale for Homelab Remote Access

**Module:** Edge Access & VPN
**Activity type:** Reading (Learn)
**Objective:** Explain how Tailscale separates its coordination control plane from its encrypted data plane

## Vocabulary

| Term | Meaning |
|---|---|
| Tailnet | The private Tailscale network associated with an organization or account, including its users, devices, identities, policy, and configuration. |
| Control plane | The coordination system that authenticates participants, distributes peer information and policy, and assists with connection establishment. It is distinct from the encrypted path carrying application traffic. |
| Data plane | The encrypted path over which peers exchange application packets. Tailscale uses WireGuard-based tunnels for this traffic. |
| DERP | Tailscale's encrypted packet relay mechanism used when peers cannot establish a usable direct path. A DERP relay forwards already encrypted traffic and is not the endpoint holding the peer session keys. |
| NAT traversal | Techniques used to establish communication between devices located behind address translation or restrictive network boundaries. |
| Subnet router | A Tailscale node that advertises routes to one or more networks so authorized tailnet devices can reach systems that do not run Tailscale themselves. |
| Exit node | A Tailscale node that can carry a client's general internet-bound traffic, similar to a default-route VPN gateway, when explicitly selected and authorized. |
| MagicDNS | Tailscale's DNS feature for resolving tailnet device names and, when configured, integrating additional DNS naming behavior. |
| Device identity | The cryptographic and administrative identity assigned to a device participating in a tailnet. |
| User identity | The authenticated person or account associated with tailnet access and policy decisions. |
| Tag | A non-human identity label used to represent the role of a device or service in access policy. |
| Route approval | The administrative authorization that determines whether a route advertised by a subnet router or exit node becomes available for use. |
| Least privilege | The practice of granting only the destinations, protocols, and access needed for a specific role rather than broad network-wide reachability. |

## Instruction

Traditional remote access often begins with a public port forwarded from an internet router to an internal service. That approach can work, but it makes the service's authentication surface, patch state, protocol implementation, and logging quality part of the public perimeter. Tailscale offers a different model: devices authenticate into a private tailnet, receive cryptographic identities, learn authorized peer information, and exchange application traffic through WireGuard-based encrypted tunnels. This does not eliminate the need to secure applications, accounts, operating systems, or backups. It changes how reachable the service is and adds an identity-aware authorization layer before ordinary application authentication.

The architecture has two important planes. The control plane coordinates identity, keys, peer discovery, routes, names, and policy. The data plane carries packets between devices. When network conditions permit, peers communicate directly. If a direct path cannot be established, traffic can pass through a DERP relay. The relay forwards encrypted packets; it is not equivalent to a conventional gateway that terminates and re-encrypts the session. A relayed connection may have different latency or throughput characteristics, but this lesson makes no benchmark claim because results depend on geography, networks, devices, and path conditions.

There are two common homelab deployment patterns. In the first, Tailscale runs directly on each server. Each server has its own tailnet identity, can be addressed individually, and can receive narrowly scoped policy. This usually gives clearer attribution and smaller trust boundaries. In the second, a subnet router advertises a LAN prefix so remote clients can reach devices that cannot run Tailscale. That is useful for appliances, hypervisors, printers, management interfaces, or legacy systems, but it enlarges the reachable network behind one routing identity. Advertise only the required prefixes, avoid overlapping routes, approve routes deliberately, and restrict which identities may use them.

An exit node is different from a subnet router. A subnet router provides paths to designated private prefixes. An exit node can provide a default route for a client's broader traffic. Running one does not automatically make every client use it; the route must be offered, authorized, and selected. An exit node creates capacity, privacy, policy, and trust considerations because the node's local network becomes the apparent source for forwarded traffic.

Name resolution should be designed rather than assumed. MagicDNS can make tailnet device names convenient, but a subnet-routed application may still depend on an internal DNS zone. A packet route and a DNS answer are separate dependencies. If an IP address works but a name does not, investigate naming and resolver configuration rather than treating the tunnel as completely broken. Similarly, successful tailnet reachability does not prove that an application is listening on the intended interface or that its own authorization permits the user.

Access policy should describe intended communication, not merely reproduce broad LAN trust. Human users can be organized by role, while infrastructure devices can use tags whose ownership is controlled. A useful policy design names the source identity, destination identity or subnet, application port, business purpose, and expected denial cases. Tests should include negative assertions such as a media user being unable to reach a hypervisor management endpoint. Default-deny reasoning is strongest when each permission has a named owner and test.

Tailscale account access is part of the homelab security boundary. Protect identity-provider accounts with strong multifactor authentication, review administrators, remove stale devices, understand key-expiry behavior, and define a response for a lost laptop or compromised account. Do not confuse encryption with endpoint safety: an authorized but compromised client can still attack destinations that policy allows.

A safe rollout keeps an independent management path until verification is complete. First inventory services and routes. Next enroll one noncritical device, confirm identity and policy, and test both allowed and denied flows. Then add a single administrative destination or a narrowly scoped subnet route. Observe whether connections are direct or relayed, validate DNS separately, and only then expand coverage. Avoid disabling the existing access method during the same change window. Rollback should be designed before enrollment, including route withdrawal, device revocation, policy reversion, and confirmation that local-only services remain available.

The lab deliberately stops before enrollment or network mutation. It creates a machine-readable architecture plan, an access test matrix, and a rollout checklist. This separates design correctness from account-specific execution and ensures every lab-created file remains under /opt/lab-classroom/class68/.

## Architecture

### components
### name
Identity provider and tailnet administration

### role
Authenticate users and administrators, manage devices, review routes, and publish access policy.
### name
Tailscale coordination service

### role
Distribute peer metadata, public keys, policy, naming information, and connection-coordination data.
### name
Remote administrative client

### role
Provide an authenticated endpoint from which an administrator reaches approved homelab services.
### name
Directly enrolled homelab server

### role
Represent a server with its own tailnet identity and narrowly scoped service access.
### name
Subnet router

### role
Advertise selected homelab prefixes for systems that cannot participate directly.
### name
DERP relay

### role
Forward encrypted packets when a direct peer path is unavailable.
### name
Internal DNS service

### role
Resolve private application names when those names are not represented by tailnet device naming alone.

### traffic_flow
The user authenticates and the client obtains tailnet coordination information.
Policy determines whether the source identity is authorized for the requested destination and service.
Peers attempt to establish a direct encrypted path.
If a direct path is unavailable, encrypted packets may be relayed through DERP.
For directly enrolled servers, traffic terminates at that server's Tailscale interface.
For subnet-routed systems, traffic reaches the subnet router and is forwarded toward an approved private prefix.
The destination application still performs its own authentication and authorization.

### trust_boundaries
Identity-provider account and recovery security
Tailnet administrator and policy-author privileges
Each enrolled endpoint and its local users
The subnet router and every network reachable behind its approved routes
The destination application's credentials and authorization model
DNS configuration used to map names to destinations

### recommended_pattern
Install Tailscale directly on capable administrative servers where practical. Use a dedicated subnet router only for devices that cannot run a client, advertise the smallest useful prefixes, and grant route use only to roles that need it. Keep general user services separate from management interfaces in policy.

## Required reading

- Tailscale documentation, How Tailscale works: https://tailscale.com/kb/1151/what-is-tailscale
- Tailscale documentation, Connection types: https://tailscale.com/kb/1257/connection-types
- Tailscale documentation, Access control: https://tailscale.com/kb/1018/acls
- Tailscale documentation, Subnet routers: https://tailscale.com/kb/1019/subnets
- Tailscale documentation, MagicDNS: https://tailscale.com/kb/1081/magicdns
- WireGuard protocol overview: https://www.wireguard.com/protocol/

## References

- Tailscale, What is Tailscale?: https://tailscale.com/kb/1151/what-is-tailscale
- Tailscale, How Tailscale works: https://tailscale.com/blog/how-tailscale-works
- Tailscale, Connection types: https://tailscale.com/kb/1257/connection-types
- Tailscale, DERP servers: https://tailscale.com/kb/1232/derp-servers
- Tailscale, Access control: https://tailscale.com/kb/1018/acls
- Tailscale, Grants syntax: https://tailscale.com/kb/1324/grants
- Tailscale, Subnet routers: https://tailscale.com/kb/1019/subnets
- Tailscale, Exit nodes: https://tailscale.com/kb/1103/exit-nodes
- Tailscale, MagicDNS: https://tailscale.com/kb/1081/magicdns
- Tailscale, Device approval: https://tailscale.com/kb/1099/device-approval
- WireGuard, Protocol and cryptography: https://www.wireguard.com/protocol/
