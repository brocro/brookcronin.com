---
title: Consistent, Eventually
slug: consistent-eventually
date: 2026-05-27
subtitle: On eventual consistency, dead reckoning, and how design systems spread slowly.
summary: Nobody adopts a design system all at once without a mandate. Teams navigate by dead reckoning for a while, accumulating until the canon arrives. That's how forests grow.
---

*Drafted in conversation with Claude.*

# A project I can't stop thinking about

Someone showed me a project once, at a hackspace near my home, and it stuck. A network of small, solar-powered environmental sensors deployed through a forest. Temperature, humidity, light levels, soil moisture. Each device would take its readings and then, when it had power to spare, send them on.

Not continuously and not in real time, just when it could.

The data would arrive in irregular bursts. It would thin out at night when the panels weren't charging. It would pick up again at dawn. It would get busier and richer through spring and into summer as the canopy filled out and the light levels changed, and then gradually quieten again as autumn came. On overcast days a trickle of information. On clear days in July, a dense and intricate stream.

And over time — weeks, months, seasons — a coherent picture of the forest would form.

Slow, incomplete, but accurate when you look at it over time, at the forest's own pace. Complete enough to be useful, accurate enough to be true.

The technical term for this, borrowed from distributed systems, is **eventual consistency**.

# What eventual consistency actually means

In database engineering, eventual consistency describes a system where nodes don't need to agree at every moment. Different parts of the network may hold slightly different views of the truth. But given time, and absent further changes, they converge. The system as a whole tends toward coherence.

It's the alternative to **strong consistency**, where every read reflects the most recent write, everywhere, immediately. Strong consistency is expensive. It requires coordination. It requires every part of the system to wait for every other part before committing to an answer.

It's less immediate but it works.

The difference, of course, is that a distributed system's convergence is architectural. In a design system, the restoring force is a team, and it requires tending.

# Design systems want to be forests

Almost everyone who has tried to grow a design system inside a real organisation has tried, consciously or not, to make it strongly consistent.

Ship the library. Mandate the library. Watch the numbers go up.

Sometimes it works. If leadership enforces it, if someone has the authority to block releases that don't use the components. If it is anchored tightly to the brand values, if it is used to define decision making itself, you can get adoption fast. Strong consistency, enforced from the top down.

But I don't believe many organisations really work like that. 

Zeroheight's 2026 Design Systems Report found that for most teams, the honest description is: *"encouraged but not enforced"*.

Mandate is the exception. Design authority is distributed. Product teams own their surfaces (the screens they ship).

Someone built the checkout flow two years ago and it still ships revenue, and nobody has a mandate to touch it.

In those organisations, you don't get strong consistency. You never will. And if you wait for it, you'll wait forever.

What you can get, if you're patient enough to see it, is eventual consistency.

# Dead reckoning

Before GPS, ships navigated by dead reckoning.

You know your last confirmed position. You know your heading. You know roughly how fast you're going. From those three things, you calculate where you must be now.

It's approximate. The currents affect you. The wind affects you. Small errors compound over time. But it's not random. It's disciplined approximation.

The best answer available given what you have, updated as new information arrives.

Product teams that aren't yet on your design system are dead reckoning. They're using the colour they think is the brand blue. They're approximating the spacing. They're referencing a Figma file that's six months out of date. They're not ignoring the system. They're navigating toward it with the instruments they have.

Design system teams often misread this as resistance.

It isn't resistance. It's dead reckoning. It will converge if you stay the course.

> *"Products own their destiny… systems equip products to realize that destiny."*
> 
> Nathan Curtis — Principles of Designing Systems, EightShapes, 2017

# How the signal spreads

Where I work, we started without a mandate.

No top-down directive. No migration sprint. No authority to block a release because it used the wrong blue. Just a system, some documentation, and the question of whether anyone would find it easier to use than whatever they already had.

The landscape is what you'd expect in an organisation that has been building software for a long time across multiple teams. There are legacy applications with their own established patterns, some of them years old and still shipping. There are teams working across different tech stacks, which means that even "use the same spacing" is a non-trivial request when the tooling doesn't share a common layer. And there are internal demos and showcase applications, the ones nobody calls products but everyone sees, that have developed their own colour sensibilities: vivid, idiosyncratic, cheerfully divorced from the brand palette. 

They are not wrong exactly. They are just their own thing.

In this environment, the signal spreads slowly and unevenly. A team adopts the typography because they were starting something new and it was there. Another team uses the system's colour for their new components but leaves the legacy screens untouched. 

The team closest to the Design System use the system the most faithfully (in our organisation this is my team), but even we need to add noise to it, bend the rules just for us, add components no-one else will ever need in our own version of the library.

This is, I think, what most design system teams actually face, at least the ones working without executive mandate. 

Zeroheight's 2025 Design Systems Report found that 42% of respondents were satisfied with their ability to secure buy-in. By 2026, that had dropped to 32%.

The *"road to mass adoption"* — their phrase, not mine — is longer than the tools would suggest.

# The mistake design system teams make

They read the adoption curve as evidence that the system isn't working.

The sensors aren't all online yet. The data is thin. The coherent picture hasn't formed. Conclusion: the system is failing.

But a forest in February isn't a failed forest. It's a forest in February.

# What patience looks like in practice

The patience required here is active, not passive. You're making the canonical version progressively easier to reach than the approximation. Better documentation. Faster onboarding. Components that handle the edge cases teams actually have. A Figma library that stays current.

Every time you do that, you shorten the gap between dead reckoning and the real position. Teams stop approximating not because they've been told to, but because the approximation now takes more effort than just using the thing.

There are teams in your organisation right now using something close to your design system without using your design system.

These teams are sensors already transmitting. The data they're sending is coherent with the picture you're building. They're closer than they look.

Treat them as early signal, look at what they built independently and ask: what does it mean that they landed here? What's the gap between where they are and where the system is, and how small can you make it? When a team has built their own version of a component, the most useful question isn't *"why haven't they adopted ours?"* It's *"what did ours not do?"*

# The picture forms

I keep coming back to the image of the forest data getting busier in summer.

The system isn't more correct in summer. It's not more legitimate. The individual readings in February were accurate, they just weren't always dense enough yet to reveal the patterns. The density comes with time, and the patterns are only visible once you have enough of it.

A design system that's been running for three years in a large organisation looks like this. The early adopters are fully on the library. The next wave is mostly there, with a few surfaces still on old components. The legacy app is dead reckoning on colours and typography, approximating the newer work as best it can. The third-party integration sends whatever signal it can.

And the picture — a coherent experience across all of those surfaces — is forming. Not because someone mandated it. Because the system kept making the canonical version easier to reach, and teams kept choosing the easier path, one component at a time.

# References

- **Eventual consistency.** Werner Vogels, "Eventually Consistent," *ACM Queue*, December 2007. [All Things Distributed](https://www.allthingsdistributed.com/2008/12/eventually_consistent.html).
- **The CAP theorem.** Eric Brewer, "Towards Robust Distributed Systems," Keynote, PODC 2000. [CAP theorem](https://en.wikipedia.org/wiki/CAP_theorem), Wikipedia.
- **Dead reckoning.** [Dead reckoning](https://en.wikipedia.org/wiki/Dead_reckoning), Wikipedia.
- **Design system adoption patterns.** Nathan Curtis, "Adopting Design System Generations," EightShapes, 2024. [medium.com/eightshapes-llc](https://medium.com/eightshapes-llc/adopting-design-system-generations-900535442a16). Pull quote from Curtis, "Principles of Designing Systems," EightShapes, 2017. [medium.com/eightshapes-llc](https://medium.com/eightshapes-llc/principles-of-designing-systems-294ee45dcf81).
- **Zeroheight Design Systems Report 2025 — The Road to Mass Adoption.** 42% of respondents were satisfied with their ability to secure buy-in — dropping to 32% by 2026. [zeroheight.com/resource/design-system-report-2025](https://zeroheight.com/resource/design-system-report-2025/).
- **Zeroheight Design Systems Report 2026.** "Encouraged but not enforced" identified as the most commonly reported mandate situation. [report.zeroheight.com](https://report.zeroheight.com/).
- **The Dynamo paper.** Giuseppe DeCandia et al., "Dynamo: Amazon's Highly Available Key-value Store," *ACM SOSP*, 2007. [dl.acm.org](https://dl.acm.org/doi/10.1145/1294261.1294281).
- **The forest monitoring project.** Demonstrated at Hebewerk e.V., Havellandstraße 15, Eberswalde — a makerspace and open workshop active since 2013. [hebewerk-eberswalde.de](https://hebewerk-eberswalde.de/).
- **Wireless sensor networks in environmental monitoring.** [Wireless sensor network](https://en.wikipedia.org/wiki/Wireless_sensor_network), Wikipedia.
