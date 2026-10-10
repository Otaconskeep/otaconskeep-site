# Reading: Local DNS and Friendly Service Names

**Module:** Edge Access & VPN
**Activity type:** Reading (Learn)
**Objective:** Explain the roles of DNS clients, recursive resolvers, authoritative data, caching, and search domains

## Vocabulary

| Term | Meaning |
|---|---|
| DNS | The Domain Name System, a distributed naming system that maps names to data such as IP addresses. |
| stub resolver | The client-side resolver library that sends DNS questions to a configured DNS server on behalf of applications. |
| recursive resolver | A DNS server that obtains answers on behalf of clients, often caching the results for later requests. |
| authoritative data | DNS information supplied by the source responsible for a namespace rather than learned from another resolver. |
| A record | A DNS record that maps a name to an IPv4 address. |
| AAAA record | A DNS record that maps a name to an IPv6 address. |
| CNAME record | A DNS record that makes one DNS name an alias of another DNS name. |
| PTR record | A reverse-DNS record that maps an address-oriented name back to a host name. |
| FQDN | A fully qualified domain name that identifies a name within the complete DNS hierarchy, such as nas.lab.home.arpa. |
| TTL | Time to live, the number of seconds for which a DNS answer may normally be cached. |
| search domain | A suffix that a client resolver may append to an unqualified name, allowing a short input such as nas to be attempted as nas.lab.home.arpa. |
| split-horizon DNS | A design in which the answer for a name depends on which resolver or network view receives the query. |
| home.arpa | The special-use DNS domain reserved by RFC 8375 for naming within residential home networks. |

## Instruction

Humans prefer names such as nas.lab.home.arpa, while network connections ultimately use addresses. DNS provides the controlled mapping between those forms. A client application normally asks the operating system's stub resolver for an address. The stub resolver sends a query to a configured DNS server, which can answer from local data, answer from cache, or obtain an answer from elsewhere. An A record returns an IPv4 address, an AAAA record returns an IPv6 address, and a PTR record supports reverse lookup. These are independent records: creating an A record does not automatically prove that a service is running, create a reverse record, or make the destination reachable.

For a home environment, stable service names reduce dependence on memorized addresses and make later address changes less disruptive. A bookmark can target grafana.lab.home.arpa while DNS controls which address currently hosts Grafana. Names should describe stable roles rather than temporary implementation details when practical. The home.arpa namespace is specifically reserved for residential private use. Avoid treating .local as a general unicast DNS suffix because .local is conventionally associated with multicast DNS and can produce confusing differences between clients. Inventing a suffix that resembles a public top-level domain can also create collisions or information leakage.

DNS does not include a port number in an A record. DNS can map dashboard.lab.home.arpa to an address, but the user may still need a URL such as https://dashboard.lab.home.arpa:8443 unless a reverse proxy or a service-specific discovery mechanism handles the port. DNS also does not replace certificate validation. An HTTPS certificate must contain the name the client uses.

This lab runs dnsmasq only on the loopback address and the nonstandard UDP/TCP port 1053. It deliberately does not edit the machine's resolver settings or expose DNS to the LAN. The configuration supplies three local A records using documentation-only IPv4 addresses. Those addresses are suitable for a naming exercise but are not expected to host reachable applications. Querying the server explicitly with dig proves that the DNS data works. A production deployment would use actual stable addresses, listen only on intended interfaces, provide both UDP and TCP service on the standard DNS port, and distribute the resolver address through a controlled client or DHCP configuration. Production changes are intentionally outside this lab because all lab filesystem mutations must remain under /opt/lab-classroom/class65/.

## Architecture

### components
### name
dig client

### role
Sends an explicit DNS query to 127.0.0.1 on port 1053 and displays the response.
### name
isolated dnsmasq process

### role
Listens only on loopback, returns configured local records, and does not consult upstream resolvers.
### name
lab configuration

### role
Stores the local namespace and host records in /opt/lab-classroom/class65/dnsmasq.conf.
### name
lab.home.arpa namespace

### role
Provides a clearly scoped naming area beneath the home.arpa special-use domain.

### query_flow
The learner runs dig with an explicit server address and port.
dig sends a DNS question for an A record to 127.0.0.1:1053.
dnsmasq matches the question against a host-record entry.
dnsmasq returns the configured IPv4 address.
dig displays the answer without changing the host's normal DNS path.

### records
### nas.lab.home.arpa
192.0.2.10

### dashboard.lab.home.arpa
192.0.2.20

### git.lab.home.arpa
192.0.2.30

### scope_note
192.0.2.0/24 is reserved for documentation. The records demonstrate DNS behavior and do not imply that an application exists at any returned address.

## Required reading

- RFC 1034, Domain Names—Concepts and Facilities: https://www.rfc-editor.org/rfc/rfc1034
- RFC 1035, Domain Names—Implementation and Specification: https://www.rfc-editor.org/rfc/rfc1035
- RFC 8375, Special-Use Domain home.arpa: https://www.rfc-editor.org/rfc/rfc8375
- dnsmasq manual page, especially --host-record, --local, --no-resolv, --listen-address, and --port

## References

- RFC 1034, Domain Names—Concepts and Facilities: https://www.rfc-editor.org/rfc/rfc1034
- RFC 1035, Domain Names—Implementation and Specification: https://www.rfc-editor.org/rfc/rfc1035
- RFC 6762, Multicast DNS: https://www.rfc-editor.org/rfc/rfc6762
- RFC 8375, Special-Use Domain home.arpa: https://www.rfc-editor.org/rfc/rfc8375
- RFC 5737, IPv4 Address Blocks Reserved for Documentation: https://www.rfc-editor.org/rfc/rfc5737
- dnsmasq project documentation: https://thekelleys.org.uk/dnsmasq/doc.html
- BIND 9 dig manual: https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility
