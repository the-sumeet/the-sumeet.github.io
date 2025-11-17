+++
title = 'Design Distributed ID Generator'
description = 'Learn how to design a scalable distributed ID generator using Twitter Snowflake approach with 64-bit IDs'
date = 2025-11-17
tags = ['system-design', 'distributed-systems']
+++

## The Problem

In a distributed system with multiple servers/nodes, you can't rely on simple auto-incrementing database IDs because:
- Multiple nodes might generate the same ID simultaneously
- Coordination between nodes would be too slow
- You need globally unique IDs without a single point of failure

This post explores how to design a distributed ID generator that can scale to hundreds of thousands of IDs per second across multiple data centers.

## Requirements & Constraints

### Functional Requirements

**Scale**:
- Initial: 10,000 IDs per second
- Target: 100,000 IDs per second
- Calculate: 100,000 IDs/sec × 86,400 seconds = 8.64 billion IDs per day

**ID Properties**:
- Format: 64-bit numeric integers (database-friendly)
- Ordering: Time-sortable for efficient indexing and range queries
- Gaps: Acceptable (uniqueness is more important than sequential ordering)
- Security: Predictability is acceptable (internal use only)

**Infrastructure**:
- Servers: Start with 10, scale to 1,024 servers
- Data centers: 3 regions
- Clock sync: NTP with <1 second skew

**Performance**:
- Latency: Sub-millisecond preferred
- No single point of failure
- Losing IDs on crash is acceptable (but no duplicates ever)

### Key Design Questions

**Architecture Decision**: Centralized vs Distributed?
- Centralized: Easy to maintain, but creates bottleneck and single point of failure
- **Distributed (Chosen)**: Each server generates IDs independently

**Bit Allocation**: How to structure the 64-bit ID?
- Need to balance timestamp range, machine capacity, and throughput

**Machine ID Assignment**: How do servers get unique IDs?
- Options: Manual configuration, ZooKeeper coordination, or configuration service

**Clock Issues**: What if the system clock goes backwards?
- Must detect and handle to prevent duplicate IDs

## Why Not UUIDs?

Before diving into our solution, let's understand why random UUIDs aren't ideal:

**Problems with Random UUIDs**:
- **Page splits**: Database reorganizes index pages constantly
- **Poor locality**: Related data scattered across disk
- **Cache misses**: Can't keep "hot" data in memory efficiently
- **Slow writes**: Every insert might touch different disk pages
- **Index bloat**: B-tree becomes fragmented
- **Storage**: 128 bits vs our 64-bit solution

**Solution**: Time-ordered IDs (Snowflake approach) solve these issues by keeping related IDs together.

## The Solution: 64-Bit Snowflake ID Structure

Our ID is composed of 4 parts within 64 bits:

```
| 1 bit | 41 bits    | 10 bits   | 12 bits   |
|-------|------------|-----------|-----------|
| Sign  | Timestamp  | Machine   | Sequence  |
|   0   | Millisec   | ID        | Number    |
```

### Bit Allocation Breakdown

**1. Sign Bit (1 bit)**: Always 0
- Ensures the ID is positive when treated as signed integer

**2. Timestamp (41 bits)**:
- Capacity: 2^41 = 2,199,023,255,552 milliseconds ≈ 69.73 years
- With custom epoch (e.g., Jan 1, 2020), we get ~70 years of IDs
- Provides natural time-ordering for database efficiency

**3. Machine ID (10 bits)**:
- Capacity: 2^10 = 1,024 unique machines
- Can be split for multi-datacenter: 5 bits datacenter (32 DCs) + 5 bits machine (32 per DC)
- Ensures uniqueness across distributed servers

**4. Sequence Number (12 bits)**:
- Capacity: 2^12 = 4,096 IDs per millisecond per machine
- Equals 4 million IDs per second per machine
- Total capacity: 1,024 machines × 4M IDs = 4.1 billion IDs/second
- **Far exceeds our requirement of 100K IDs/second**

### Capacity Analysis

With our bit allocation:
- **Per machine**: 4,096,000 IDs/second
- **10 machines**: 40,960,000 IDs/second
- **100 machines**: 409,600,000 IDs/second
- **Requirement**: 100,000 IDs/second ✓

This provides excellent headroom for growth.

## Handling Edge Cases

### Clock Drift: When Time Goes Backwards

**The Problem**: If the system clock moves backwards, we risk generating duplicate IDs.

**Detection**: Simple comparison
```
if current_time < last_timestamp:
    # Clock moved backwards!
```

**Handling Strategies**:

1. **Wait Strategy** (Small drift < 5ms):
   - Pause and wait for clock to catch up
   - Best for minor NTP adjustments

2. **Continue Strategy** (Medium drift 5-100ms):
   - Keep using last_timestamp
   - Continue incrementing sequence number
   - Acceptable since IDs don't need precise timestamps

3. **Reject Strategy** (Large drift > 100ms):
   - Return error and log incident
   - Prevents service from generating bad IDs
   - Requires manual intervention

4. **Hybrid Approach** (Recommended):
   ```
   drift = last_timestamp - current_time

   if drift < 5ms:
       wait_until(last_timestamp)
   elif drift < 100ms:
       use last_timestamp + increment sequence
   else:
       raise ClockDriftError
   ```

**Prevention & Monitoring**:
- Configure NTP properly on all servers
- Monitor clock drift metrics continuously
- Alert on any backward clock movements
- Log all clock anomalies for analysis

### Sequence Number Exhaustion

**Problem**: What if we generate 4,096 IDs within the same millisecond?

**Solution Options**:
1. **Wait for next millisecond** (Recommended): Brief pause, guaranteed uniqueness
2. **Return error**: Fail fast, let caller retry
3. **Spin wait**: Busy-wait until clock advances

### Machine ID Assignment

**Options**:

1. **Manual Configuration**:
   - Simple: Add machine ID to config file
   - Pros: No external dependencies
   - Cons: Human error risk, manual tracking

2. **ZooKeeper/Consul**:
   - Auto-assign IDs from a range
   - Pros: Automated, centralized tracking
   - Cons: External dependency

3. **Database Registration**:
   - Servers register on startup
   - Pros: Audit trail, easy monitoring
   - Cons: Database dependency

**Recommendation**: Use ZooKeeper for automatic assignment with manual override capability.

## Implementation Considerations

### Multi-Datacenter Support

Split the 10-bit machine ID:
- **5 bits for datacenter**: Supports 32 datacenters
- **5 bits for machine**: 32 machines per datacenter
- Total: 32 × 32 = 1,024 unique ID generators

### Time Precision Trade-offs

**Milliseconds (Chosen)**:
- ✓ Good balance between precision and lifespan
- ✓ 69+ years of IDs
- ✓ Sufficient granularity for most applications

**Seconds**:
- ✓ 2,199+ years of IDs
- ✗ Lower granularity (need more sequence bits)

### ID Generation Algorithm

```
function generate_id():
    current_time = get_current_milliseconds()

    if current_time < last_timestamp:
        handle_clock_backwards(current_time)

    if current_time == last_timestamp:
        sequence = (sequence + 1) & 4095  # 12-bit mask
        if sequence == 0:
            # Exhausted sequence, wait for next millisecond
            current_time = wait_next_millisecond(last_timestamp)
    else:
        sequence = 0

    last_timestamp = current_time

    # Construct the ID
    id = ((current_time - EPOCH) << 22) |
         (machine_id << 12) |
         sequence

    return id
```

## Advantages of This Design

1. **Scalable**: Supports up to 1,024 machines generating 4B+ IDs/second
2. **Time-ordered**: IDs naturally sort by creation time
3. **Database-friendly**: Sequential IDs improve B-tree index performance
4. **Compact**: Only 64 bits (vs 128 for UUIDs)
5. **Independent**: No coordination needed between servers
6. **Fast**: Sub-millisecond latency, no network calls
7. **Debuggable**: Can extract timestamp and machine ID from any ID

## Conclusion

The Snowflake approach provides an excellent balance between simplicity, performance, and scalability for distributed ID generation. By carefully allocating bits across timestamp, machine ID, and sequence number, we achieve:

- **100K+ IDs/second** capacity (with room for 40x growth)
- **69+ years** of unique IDs
- **Zero coordination** overhead between servers
- **Database-optimized** time-ordered IDs

This design has been battle-tested at scale by Twitter, Instagram, Discord, and many others, making it a proven solution for distributed systems.