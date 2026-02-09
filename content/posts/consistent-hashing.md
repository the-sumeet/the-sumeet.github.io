+++
title = 'Consistent Hashing'
description = 'My notes about consistent hashing'
date = 2026-02-10
tags = ['consistent-hashing', 'system-design']
+++

Consistent hashing is a technique used in distributed systems to distribute data across a changing set of nodes (like servers) with minimal disruption.

In a traditional hashing system, if you add or remove a server, almost every single piece of data has to be moved to a new location. Consistent hashing solves this by ensuring that when the number of servers changes, only a small fraction of keys need to be remapped.

# The Hash Ring Mechanism

In a standard system, you might use a simple formula like `server = key(mod n)`, where `n` is the number of servers. But if `n` changes (a server crashes or you add a new one), almost every key's location changes. Consistent hashing avoids this mess.

How the Ring Works

Imagine a circle representing a range of numbers (for example, from 0 to 232−1).

- **Placing Servers:** We hash the server names (like "Server A", "Server B") to get a position for each one on the ring.
- **Placing Data:** We hash the data keys (like "User_123") to get their positions on the same ring.
- **The Assignment:** To find which server stores a key, you move clockwise from the key's position until you hit the first server.

# Virtual Servers

## The Problem of Clumping

In the real world, hash functions don't always distribute servers perfectly evenly around the circle. You might end up with a situation where Server `A` and Server `B` are very close together, but there is a massive gap between Server B and Server `C`.

If the gap between `B` and `C` is huge, Server `C` ends up being responsible for a much larger portion of the ring than the others.

- **Server A:** Handles 10% of the ring.
- **Server B:** Handles 10% of the ring.
- **Server C:** Handles 80% of the ring.

If Server `C` is doing 8 times the work of the others, it might crash under the pressure, leading to a "cascading failure" where other servers start failing one by one.

## Using Virtual Servers

Instead of placing a server on the ring just once, we hash it multiple times using different labels (e.g., "Server A#1", "Server A#2", "Server A#3"). This scatters many "virtual" points for a single physical server all across the ring.

The virtual nodes are completely mixed together on the ring.

- **Better Balance:** With hundreds of virtual nodes for each server, the gaps between nodes become much smaller and more uniform. It's like spreading a deck of cards across the table instead of just three big piles.
- **Adaptive Power:** If Server A is twice as powerful as Server B, we can simply give Server A twice as many virtual nodes. It will naturally "claim" more segments of the ring and handle more data.
- **Smoother Handover:** If a server fails, its many virtual nodes disappear, and its load is distributed across all the remaining servers' virtual nodes, rather than dumping everything onto just one neighbor.

# The "Hot Key" Challenge

Even with a perfectly balanced ring and virtual nodes, you can still run into trouble. Imagine a social media app where 99% of your users are looking at one specific "celebrity" profile.

In a consistent hashing setup:

- That celebrity's data hashes to one specific spot on the ring.
- That spot belongs to one specific server (and its virtual nodes).
- Even though the ring is "fair," that one server gets slammed with 99% of the traffic.

If everyone wants to see the same celebrity profile, one server gets crushed even with a perfect hash ring. To solve this, systems often use layering:

- **Local Caching:** The client or a load balancer saves a copy of that specific hot data so it doesn't even have to ask the hash ring.
- **Dynamic Replication:** If the system detects a "hot" spot, it can temporarily copy that specific data to multiple servers on the ring, spreading the load.

# The Metadata Trade-off

Consistent hashing isn't "free." For a client, to find data, it needs to know the current state of the ring.

- **The Cost:** Every time a server joins or leaves, every client needs to be updated. If you have 10,000 clients, that's a lot of update messages.
- **Gossip Protocols:** Many systems use a "Gossip" method where servers constantly whisper to each other: "Hey, I'm still here" or "New guy just joined at position 400." This information eventually trickles down to everyone.

# Replication

In systems like Apache Cassandra, they don't just store data on the "first" server they hit. To ensure they don't lose your data if a server blows up, they use a Replication Factor (RF).

If RF=3, the system finds the first server (the "Coordinator"), and then automatically saves copies of that data on the next two distinct physical servers walking clockwise around the ring.

The Replication Dilemma 🛡️

When we talked about replication, a tricky question arises: **If you write data to the ring, do you wait for all 3 servers to confirm they have it before telling the user "Success"?**
 
- **Wait for all 3:** Your data is super safe, but the system feels slow. If one server is laggy, the whole write is laggy.
- **Wait for 1:** It’s lightning-fast, but if that one server crashes immediately after, you might "lose" the update before it reaches the other two.

Most systems like Cassandra use a "Quorum" (N/2) + 1. For a replication factor of 3, they usually wait for 2 servers to acknowledge the write. This balances speed with safety.

# Case Studies

## Discord: Managing Millions of Voice Chats

Discord uses a variation of consistent hashing to manage their voice servers.

**The Problem:** When you join a voice channel, you have a persistent connection to a specific server. if Discord used simple hashing and added a new server to handle more users, the "modulo" would shift, and everyone would get disconnected and have to reconnect.

**The Solution:** With the hash ring, they can add new servers to their "fleet" during peak hours, and only a tiny fraction of users—those who land in the new server's slice—need to move. Everyone else keeps talking without a hiccup.

## Netflix: The Content Delivery "Open Connect"

Netflix doesn't just use this for small bits of data; they use it to decide which physical hard drives across the world should hold specific movie files.

**The Problem:** Some servers have 200TB of spinning disks, while others are ultra-fast SSDs with only 18TB. A "fair" ring would overwhelm the small ones.

**The Solution:** They use Weighted Virtual Nodes. They give the big 200TB servers thousands of virtual nodes on the ring, while the 18TB servers get far fewer. This ensures that the movies are distributed exactly in proportion to what each server can handle.


