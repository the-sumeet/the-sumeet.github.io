+++
title = 'Design a Rate Limiter'
description = 'My notes for designing a rate limiter'
date = 2026-02-01
tags = ['system-design', 'distributed-systems', 'rate-limiter']
+++

Designing a rate limiter is a classic problem in system design interviews. Its primary job is to control the rate of traffic sent by a client or a service to ensure the system remains stable and protected against abuse (like DDoS attacks) or cascading failures.

We will discuss here the rate limiter algorithms (the "how" of the logic), the architecture (the "where" and "who"), and the high level requirements (the "what"), like low latency, high availability, and how to handle "hard" vs "soft" limits.

# Algorithms

We can start with different rate limiter algorithms.

Here is the list we will be exploring,

- Token bucket, the most popular; allows for "bursty" traffic.
- Leaky bucket, turns bursts into a steady, constant stream.
- Fixed window counter, the simplest, resets every minute/hour.
- Sliding window log, the most accurate, tracks every single timestamp.
- Sliding window counter, a memory-efficient hybrid of fixed window and sliding log.

Each one solves a specific problem. For example, some are great for saving memory, while others are better at making sure your servers don't crash during a sudden spike.

## Token Bucket

This is simplest algorithm. Here, we have a **bucket with a pre-defined capacity.**

- Tokens drop into the bucket at a fixed rate (e.g., 5 tokens per second).
- Every time a user makes an API call, it "costs" one token. If a token is there, the request passes. If the bucket is empty, the request is blocked, or limited.
- Because tokens can accumulate up to the bucket's capacity, a user who hasn't made a request in a while can suddenly send a "burst" of multiple requests at once.

## Leaky Bucket

Like token bucket, we will have **bucket with a pre-defined capacity.**

- But, instead of tokens, requests enter a bucket (a queue) and "leak" out to be processed at a strictly constant rate.
- If the bucket is full of pending requests, any new incoming requests are discarded immediately.
- Unlike the token bucket, it does not allow bursts. It forces traffic into a perfectly steady stream, which is great if your backend can only handle a specific, unmoving load.

## Fixed Window Counter

This is the simplest algorithm to implement.

- Divide time into fixed units (e.g., 1-minute blocks). Each block has a counter.
- When a new minute starts, the counter resets to zero.
- It suffers from a "boundary problem." If a user sends a burst of requests right at the end of one minute and another burst right at the start of the next, they could technically double the allowed limit in a very short span of time.

## Sliding Window Log

This is the most "accurate" algorithm because it tracks every single request.

- We keep a log of timestamps for every request a user makes.
- When a new request comes in, add timestamp of the new request to the log. We look back exactly 1 minute (or whatever window length is) from the current timestamp and count how many entries are in the log.
    - We might have to remove the requests older that the current window.
- While extremely accurate, it consumes a lot of memory because you have to store a timestamp for every single request.

## Sliding Window Counter

Assume following scenario

```
                     Rolling Minute                                  
               ┌───────────────────────────┐                         
               │                           │                         
               │                           │                         
               │                           │                         
   ┌───────────│──────────────────┬────────│─────────────────────┐   
   │           │             ┌──┐ │ ┌──┐   │                     │   
   │           │             │  │ │ │  │   │                     │   
   │           │             └──┘ │ └──┘   │                     │   
   │           │        ┌──┐ ┌──┐ │ ┌──┐   │                     │   
   │           │        │  │ │  │ │ │  │   │                     │   
   │           │        └──┘ └──┘ │ └──┘   │                     │   
   │           │        ┌──┐ ┌──┐ │ ┌──┐   │                     │   
   │           │        │  │ │  │ │ │  │   │                     │   
   │           │        └──┘ └──┘ │ └──┘   │                     │   
   └───────────│──────────────────┴────────│─────────────────────┘   
               │                           │                         
               └───────────────────────────┘                         
                                                                     
                                                                     
   ◄──────────────────────────────►◄──────────────────────────────►  
               Last Minute                   Current Minute          
                                                                     
                ◄─────────────────►◄───────►                         
                         70%          30%                                                                                              
```

To calculate requests in current rolling minute
- A fixed window count algorithm will just count the requests in current window which are 3 requests.
- A sliding window log would count the requests in the rolling window with timestamps which are 8. 

Sliding window counter is a clever hybrid that tries to get the accuracy of the log without the high memory cost. The number of requests in the rolling window is calculated using the following formula,

**Current Window Count + (Previous Window Count × Percentage of overlap)**

Using this formula, we get 3 + 5 * 0.7% = 6.5 request. Depending on the use case, the
number can either be rounded up or down. In our example, it is rounded down to 6.