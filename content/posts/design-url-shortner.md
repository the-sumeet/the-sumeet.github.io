+++
title = 'Design URL Shortner    '
description = 'My notes about designing URL shortner'
date = 2026-02-22
tags = ['uurl-shortner', 'system-design']
+++

URL shortners, like (tinyURL), maps a long URL to a short, unique key.

The most fundamental task of a URL shortener is to take a long URL (the input) and generate a short, unique code (the alias). When a user visits `<domain>/abc123`, our system looks up `abc123` in the database and redirects them to the original long address.

# Requirements

- 100 million URLs generated per day.
- 1:10 write to read ratio.
- Maximum 10 characters long.
- Alphanumeric characters are allowed.

# Calculations

- Since 100 million records added per day, we will have (100,000,000 / (24 * 60 * 60)) = **1160 writes per seconds.**
- As write to read ratio is 1:10, **we will have 11600 reads per second.**
- If we want our service to run for 10 years, **we have to generate (100,000,000 * 365 * 10), which is 356 billion records.**
- If we assume that the input length is 100 characters, which is 100 bytes, then **for 10 years, we shall need 365 billion * 100 bytes = 36.5 TB of storage.**

# URL shortening

There are two main ways to generate that short code:

## Hashing

We pass the long URL through a mathematical function (like `MD5` or `SHA-256`) to get a unique fingerprint. However, these hashes are usually very long, so we have to truncate them, which can lead to collisions (two different URLs getting the same short code).

## Base62 Encoding 

We assign every new URL a unique ID (like a row number in a database: 1, 2, 3...) and convert unique ID into a string using 62 characters (a-z, A-Z, 0-9).

Since we're generating max 10 character long short URLs (or aliases), we can have 62^10, that is `839,299,365,868,340,224`. That is over `839` quadrillion unique URLs. To put that in perspective, if you shortened a billion URLs every single second, it would take you about 26 years to run out of combinations.

Now, even if we have plenty of "room" for IDs, we still have to generate them. If we have a single "master counter" (a central database or service) that hands out the next number (1, 2, 3...) to every web server in our system.

Hence, we have hame multiple unique ID generator servers, which will generate IDs in certain chunk (see [Unique ID Generator](/posts/unique-id-generator/)).

