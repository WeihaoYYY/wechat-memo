# Wemo architecture and isolation boundaries

Status: design authority for the Wemo fork. Features described as future work are not implemented merely because they appear here.

## Product shape

Wemo uses one shared core codebase with separate deployments and optional connectors:

```text
Wemo Core
    ├── Private single-tenant deployment
    │    ├── Personal Codex Connector
    │    ├── Local computer/browser capabilities
    │    ├── Memo Connector
    │    └── Trading Connector (private, optional, not implemented)
    │
    └── Public Memo deployment (future)
         ├── Multi-user authentication
         ├── One user-owned WeChat connection per account
         ├── Tenant-isolated Memo data and attachments
         └── No access to private computers or Trading
```

The code and protocol may be shared. Identity, credentials, business state, Codex threads, process lifecycles, and failure domains must not be shared.

## Wemo Core responsibilities

The core owns only domain-neutral capabilities:

- WeChat connection lifecycle and sender authorization;
- inbound and outbound messages and media;
- generic managed sessions and task status;
- rate-limit aware delivery, progress coalescing, and pending delivery;
- generic approval and audit interfaces;
- routing an already classified request to an optional connector.

The core must not implement Memo database rules or Trading task recovery. A connector outage must not prevent the core from starting.

## Private deployment

The owner's private deployment may enable high-trust capabilities that are forbidden in the public product:

- personal Codex authentication;
- explicitly allowed local workspaces;
- local browser or computer control;
- a private Memo instance;
- a future private Trading Connector.

It has its own WeChat binding, state directory, port, process, browser profile, workspaces, notification queue, approvals, and audit trail.

## Public Memo deployment

The future public product requires real application authentication. Each user signs in to their own Memo account and connects their own WeChat identity. The developer's WeChat binding, Codex login, browser profile, files, and local bridge state are never shared.

`userId` and `tenantId` become mandatory authorization boundaries for:

- channel credentials and context tokens;
- Memo records and projects;
- original attachments and extracted content;
- conversations and notification queues;
- approvals, usage, and audit records.

An early private beta may run one isolated worker or container per user while sharing a single build. A mature multi-tenant worker pool requires encrypted credentials and tested cross-tenant access denial. Source-code copies are not a tenancy mechanism.

## Connector contract

A connector receives a narrow request containing a request ID, actor/tenant identity, target capability, prompt, and controlled attachment references. It returns status, result, approval requests, and verifiable delivery receipts.

Every connector contract must define:

- idempotency and replay behavior;
- timeout and cancellation behavior;
- authentication and authorization scope;
- attachment ownership and retention;
- audit identity and result binding;
- health behavior when the connector is unavailable.

Business modules must not modify Wemo process locks, sessions, or startup scripts. Wemo must not edit a connector's durable state directly.

## Trading boundary

Trading is intentionally absent from Wemo `v0.1.0`. It may be added later only as a private optional connector after independent review and acceptance.

Required properties before integration:

- Wemo starts and handles personal/Memo work while Trading is stopped;
- disabling the connector needs no state deletion or migration in Wemo;
- every dispatch has exact task, attempt, thread/turn, result, and receipt identity;
- unknown execution state fails closed for that Trading request only;
- no blind resend after timeout or uncertain delivery;
- implementation, deployment, restart, and live canary remain separate approvals;
- connector code, state, port, logs, process lock, and scheduled task are independent.

No Trading source, credentials, state database, broker configuration, or startup dependency may be copied into the Wemo repository.

## Change classes

### Core-only

WeChat transport, attachments, UI, sessions, and rate-limit behavior. These changes must build and test with every optional connector disabled.

### Connector protocol

Request/status/result envelopes and mock connectors. These changes use offline contract tests and do not dispatch real Trading work.

### Trading implementation or deployment

Broker, recovery, writer lease, native result binding, or production routing. These require separate review, authorization, deployment, and bounded canary evidence.

A Core-only change never authorizes a Trading change.

## Failure-isolation acceptance

The architecture is not complete until tests prove that:

- Trading can be stopped without affecting personal Codex or Memo;
- Memo can be stopped while Wemo still returns an explicit module status;
- one user's channel failure cannot affect another user;
- connector timeouts terminate only their own request;
- retries cannot create duplicate execution or duplicate delivery;
- core upgrades do not read or migrate Trading durable state;
- each service has independent health, logs, port, lock, and rollback.

## Initial roadmap

1. Establish the clean Wemo identity, state directory, port, tests, and repository.
2. Stabilize the private single-tenant WeChat-to-Codex path.
3. Add Memo through its HTTP API using an idempotent connector.
4. Add application authentication and per-user WeChat connections for the public Memo product.
5. Design and test a narrow Trading Connector with mocks.
6. Integrate Trading only after independent acceptance and failure-isolation canaries.
