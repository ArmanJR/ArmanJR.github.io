# frozen_string_literal: true

# Run with: bundle exec ruby tests/agent_markdown_test.rb
require "minitest/autorun"
require_relative "../_plugins/agent_markdown"

class AgentMarkdownTest < Minitest::Test
  ROOT = "https://dev.arman.ac"

  def test_markdown_url
    assert_equal "/posts/hello-world.md", AgentMarkdown.markdown_url("/posts/hello-world/")
    assert_equal "/posts/hello-world.md", AgentMarkdown.markdown_url("/posts/hello-world.html")
  end

  def test_removes_toc_and_attribute_lines
    source = "Intro.\n\n* TOC\n{:toc}\n\n## Part\n{: .note}\nText.\n"
    assert_equal "Intro.\n\n## Part\nText.", AgentMarkdown.clean(source, ROOT)
  end

  def test_keeps_blank_lines_in_code
    source = "```python\nimport os\n\n\ndef f():\n    pass\n```\n"
    assert_equal source.strip, AgentMarkdown.clean(source, ROOT)
  end

  def test_keeps_fenced_code_verbatim
    source = <<~MD
      ````md
      * TOC
      {:toc}
      ![x](/a.png)
      ```
      still code
      ````
      ![x](/a.png)
    MD
    code = source.lines.first(7).join
    assert_equal "#{code}![x](#{ROOT}/a.png)", AgentMarkdown.clean(source, ROOT)
  end

  def test_absolutizes_root_relative_links
    source = <<~MD
      See [the diagram](/assets/d.svg) and <img src="/assets/d.svg" alt="">.
      <a href='/about/'>About</a>, [ext](https://example.com/x), [cdn](//cdn.example/x).
      [ref]: /posts/other/
    MD
    expected = <<~MD.strip
      See [the diagram](#{ROOT}/assets/d.svg) and <img src="#{ROOT}/assets/d.svg" alt="">.
      <a href='#{ROOT}/about/'>About</a>, [ext](https://example.com/x), [cdn](//cdn.example/x).
      [ref]: #{ROOT}/posts/other/
    MD
    assert_equal expected, AgentMarkdown.clean(source, ROOT)
  end

  def test_leaves_inline_code_and_empty_root_alone
    source = "Write `[a](/b)` for [a](/b)."
    assert_equal "Write `[a](/b)` for [a](#{ROOT}/b).", AgentMarkdown.clean(source, ROOT)
    assert_equal source, AgentMarkdown.clean(source, "")
  end

  def test_document_header
    text = AgentMarkdown.document(
      title: "Hello", description: "Lede.", author: "Arman", date: "2026-11-13",
      url: "#{ROOT}/posts/hello/", body: "Body."
    )
    assert_equal <<~MD, text
      # Hello

      > Lede.

      - Published: 2026-11-13
      - Author: Arman
      - HTML version: #{ROOT}/posts/hello/

      Body.
    MD
  end

  def test_document_header_skips_missing_fields
    text = AgentMarkdown.document(title: "T", date: "2026-01-01", url: "u", body: "B")
    assert_equal "# T\n\n- Published: 2026-01-01\n- HTML version: u\n\nB\n", text
  end
end
