---
title: "Hello, world"
description: "A tour of everything a post on this blog can contain, written as the reference I'll copy from."
math: true
---

This first post doubles as a style reference. Every element a technical write-up
here can use appears below once, with a note on how to write it.

* TOC
{:toc}

## Text

Paragraphs are plain Markdown. **Bold** marks the one thing to remember,
*italics* add emphasis, and [links](https://github.com/ArmanJR) look like this.
Inline code such as `O(n log n)` or `git rebase --onto` sits inside a sentence.
Keyboard shortcuts use `<kbd>`: press <kbd>Ctrl</kbd> + <kbd>C</kbd> to stop the run.

Footnotes keep the main text short while still citing the source.[^cite]

### Lists

1. Reproduce the bug with the smallest input.
2. Write the failing test.
3. Fix it, then delete the workaround.

- Unordered lists work too.
- They can nest:
  - like this.

> Quotes are for other people's words, or for the sentence you want the reader
> to remember when they forget the rest of the post.

## Code

Fenced blocks get syntax highlighting, a language label, and a copy button.
Write the language after the opening fence:

```go
// Overlaps reports whether two weekly schedules share any half-hour slot.
func (w Week) Overlaps(o Week) bool {
	for i := range w {
		if w[i]&o[i] != 0 {
			return true
		}
	}
	return false
}
```

```python
import logging

logger = logging.getLogger(__name__)


def dedupe(items: list[str]) -> list[str]:
    """Keep the first occurrence of each item, preserving order."""
    seen: set[str] = set()
    out = [x for x in items if not (x in seen or seen.add(x))]
    logger.debug("dedupe: %d -> %d items", len(items), len(out))
    return out
```

```sh
uv run tests/check_site.py https://dev.arman.ac
```

Diffs show what changed in a fix:

```diff
- timeout = 5
+ timeout = 30  # the upstream p99 is 12 s
```

## Math

Posts that set `math: true` in front matter render LaTeX with KaTeX. Inline math
uses double dollars, so the expected false-positive rate of a Bloom filter with
$$m$$ bits, $$k$$ hash functions and $$n$$ items is about $$\left(1 - e^{-kn/m}\right)^k$$.
Display math goes on its own lines:

$$
k_{\text{opt}} = \frac{m}{n} \ln 2
\qquad
\Rightarrow
\qquad
p \approx 0.6185^{\,m/n}
$$

## Tables

Numbers are aligned with tabular figures. A colon in the separator row
right-aligns a column:

| Approach        | Median (ms) | p99 (ms) | Memory |
|-----------------|------------:|---------:|-------:|
| Brute force     |       4,210 |   31,800 |  12 MB |
| SAT solver      |          96 |    1,420 |  48 MB |
| Greedy + prune  |           3 |       41 |   2 MB |

## Figures

Images and diagrams go in `assets/posts/<post-name>/`. A bare image gets the wide
column; use a `<figure>` when it needs a caption:

<figure>
  <img src="/assets/posts/hello-world/pipeline.svg" alt="Markdown is converted by Jekyll with kramdown and Rouge into HTML, which GitHub Pages serves.">
  <figcaption>How a post gets from Markdown to this page.</figcaption>
</figure>

---

A horizontal rule (`---`) separates major parts of a long post. The last
paragraph of every post ends with a tombstone, the way a proof does.

[^cite]: Footnotes are written as `[^name]` in the text and defined anywhere in the file.
