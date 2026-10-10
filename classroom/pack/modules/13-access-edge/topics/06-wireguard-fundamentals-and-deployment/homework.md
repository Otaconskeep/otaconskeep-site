# Homework: WireGuard Fundamentals and Deployment

**Module:** Edge Access & VPN
**Activity type:** Homework / independent application
**Objective:** Describe WireGuard's peer-to-peer architecture and public-key identity model

## Requirements

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

## Submit / record

- [ ] Evidence artifacts (secrets redacted)
- [ ] Spiral connections written
- [ ] Ready for topic quiz
