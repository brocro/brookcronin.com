---
title: The Folly of Exactitude
slug: the-folly-of-exactitude
date: 2026-07-21
subtitle: On the handoff, the map you made, and the questions you couldn't answer.
summary: Every design is a map. The moment you hand it over is the moment you find out which parts of the territory you left out.
---

*Drafted in conversation with Claude.*

> *"In the Deserts of the West, still today, there are Tattered Ruins of that Map, inhabited by Animals and Beggars; in all the Land there is no other Relic of the Disciplines of Geography."*
> Jorge Luis Borges, *On Exactitude in Science*, 1946

# The question

I can't put an exact number to how many times I've presented a piece of design I thought was done, finished, perfect. Only to have an engineer point out a piece of real data that it didn't handle that would break it completely. Too many times to count, you would have thought I would have learned but it's never that easy. We design for the cases we want and when something disturbs that, we keep pushing on our design, and the map grows.

# The map you made

The design file looked complete. Every state accounted for. Every edge case considered. The spacing was right, the typography was right, the colours were right. You'd been thorough. More than thorough.

The dummy data helped. "John Smith." "Sample Album." One artist, one title, a clean short string that sat perfectly in the field. You looked at the form full of that data and it worked, every element in the right place, nothing broken, nothing overflowing.

Of course it worked. The dummy data was chosen to fit the form. It was made for it.

Then someone had to build it. And then real data had to go in.

# The territory

Say you're designing a music library. Artist, album, title. Three fields, simple enough. You fill the form with your dummy data and it looks great. Then the engineer asks: what goes in the artist field for `★`? That's David Bowie's last album. Justice released one called `†`. Sigur Rós released `()`. Frank Zappa released *Apostrophe (')*, titled for a punctuation mark. These are real albums with real titles. They are not edge cases in the sense of being unusual, they are just music, which turns out to be stranger than any form anticipated.

What's the title field for an album with no title? Led Zeppelin's fourth album has none. Neither does Rammstein's 2019 self-titled record. The Byrds released one literally called `(untitled)`. Your schema needs a null state for "title," but some artists went ahead and named their album that.

What do you store when the track title is `X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*`? That is a real song. It's also the standard antivirus test string — any security scanner that reads filenames will flag it. Marco.V has a track called `C:/del*mp3`, which on a Windows machine is a command. A band called MASTER BOOT RECORD named their albums after filesystem paths that both Windows and Linux choke on.

Who is the artist on a track with 119 credited performers? Two different jazz musicians named Avishai Cohen, both from Israel. Two bands called Bulldog Breed, both from the UK, both with an album called *Made in England*.

Tchaikovsky has 31 names on MusicBrainz. Aphex Twin performs under at least 19 aliases. An artist called brouillard released a catalogue where the band name, the member's name, every album title, and every track title is brouillard. Every single one.

Fiona Apple released an album in 1999 whose full title is 90 words long. It holds the Guinness record. Your title field has a character limit. How long did you make it?

The form was designed for music. But it was designed for imaginary music, the music that exists in the dummy data, with its clean ASCII names and its sensible lengths and its one artist per track. Real music arrived and the form had never met it.

This happens everywhere the model meets the world. Jennifer Null cannot buy an airline ticket online because her surname is a reserved word in most databases, it means "no value," and the booking system reads her name as an empty field. She exists. The form says she doesn't. Randall Munroe drew a comic about a student named `Robert'); DROP TABLE Students;--` whose enrolment deletes the school database. It's a joke about what happens when a database receives text it treats as an instruction rather than data. It is also a precise description of a real, documented, and still-active vulnerability class, even if Bobby Tables is not a real student.

The form looked complete. The dummy data said so. The question the examples raise isn't why the form broke. It's what the designer should have done differently.

# The folly

Borges named the failure mode before we'd built the systems to demonstrate it. In *On Exactitude in Science*, the cartographers of an imaginary empire build a map so detailed it matches the empire point for point. Every province. Every road. Every house. Perfect.

It is immediately useless.

The following generations, not as fond of cartography as their ancestors, abandon it to the desert. Animals and beggars live in its ruins. In all the land, there is no other relic of the disciplines of geography.

Ruin is what remains when you try to close the gap entirely.

We do this with designs. With specifications. With documentation. We try to specify everything, to answer every question in advance, to make the handoff seamless by making it complete. We work toward the 1:1 map and wonder why the engineers still have questions.

They have questions because the territory always has more detail than the map. The territory always will.

# What compression is

A map's value is in what it leaves out.

It compresses the territory into something navigable, something a person can hold, read, use to find their way. The moment it tries to include everything, it stops being a map. It becomes the thing itself, which you already have, and which is already the problem.

A good design does the same thing. It answers the questions that matter and leaves the rest to judgement. It trusts the person building it to close the remaining gaps, because they are closer to the terrain than you are. They can see things the map can't show.

The trap is what happens when the engineer's questions start arriving. Each one is specific. What about ★? What about the 90-word title? What about two artists with the same name from the same country? The questions are reasonable. The pressure they create is toward specificity, toward answering each case, one by one, until the design accounts for all of them.

That's the road to the 1:1 map. The list of cases is infinite. The session never ends.

# The right abstraction

The move is not to answer the case. It's to ask what category the case belongs to and design for the category.

The engineer asks: what happens when the artist name is a symbol? You could answer: the field accepts symbols. But that's transcription, not design, they'll be back with the next one. The real answer is: the title field accepts any unicode string. One rule. It handles ★ and `†` and `()` and the Aphex Twin formula and everything else in the category "things that can be a title," including things neither of you thought of, without a single additional design decision.

Once you've settled that, the design decisions start: where it truncates, what the overflow state looks like, what you surface on hover or expand. Those are yours. What characters the field will hold is not.

That's what MusicBrainz figured out. MusicBrainz is an open music encyclopaedia whose schema has to handle all of this in practice. It doesn't enumerate what an artist name can be. It defines what an artist name *is*, a string with a sort variant, zero or more aliases, each with a locale and a type. One abstraction. It handles Tchaikovsky's 31 names, Aphex Twin's 19 aliases, and brouillard all at once, without knowing any of them existed.

The folly of exactitude is that the only way to achieve it is to build the thing itself. Design has to stop before then — even if not every question is answered.

# The handoff

The engineer's questions are a map of your compressions. Each one is the terrain showing through the gaps you left. Some gaps you left deliberately, good judgement, right call. Some you left because you didn't see them. Some because you saw them and hoped nobody would ask.

Not every question has a design answer. Some have an abstraction answer, a rule or a model that handles the whole category without touching the design again. Some are engineering constraints that were never design decisions to make. The ones you couldn't answer are the most useful, because they show you which kind you're dealing with.

Some questions deserve a design answer. Some deserve an abstraction. Some deserve neither: they are an engineering constraint, not a design decision.

Knowing which is which is the actual handoff.

The ruins in the desert are what's left of every map someone tried to make complete.

# References

- **Jorge Luis Borges,** "On Exactitude in Science," 1946. Collected in *Collected Fictions*, translated by Andrew Hurley. Penguin, 1999.

- **Julien Voisin,** "Horrible edge cases to consider when dealing with music," April 2022. dustri.org/b/horrible-edge-cases-to-consider-when-dealing-with-music.html

- **Patrick McKenzie,** "Falsehoods Programmers Believe About Names," 2010. kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/

- **Randall Munroe,** "Exploits of a Mom," *xkcd* no. 327. xkcd.com/327/

- **OWASP Foundation,** "A05 Injection," *OWASP Top 10*, 2025. owasp.org/Top10/2025/A05_2025-Injection/
