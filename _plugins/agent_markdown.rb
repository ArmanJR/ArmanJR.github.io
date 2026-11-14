# frozen_string_literal: true

require "jekyll"

# Publishes a plain Markdown copy of every post for AI agents and other
# non-browser readers. A post at /posts/<slug>/ gets a sibling
# /posts/<slug>.md, and /llms-full.txt concatenates all copies, newest first.
# Each post exposes its copy's URL as `markdown_url` for templates.
#
# The copy is the post's Markdown source, not a conversion of the rendered
# HTML. Liquid in a post is left unrendered.
module AgentMarkdown
  LOG_TOPIC = "AgentMarkdown:"

  FENCE = /\A {0,3}(`{3,}|~{3,})/
  # kramdown block attribute or extension on its own line, e.g. `{:toc}` or `{: .note}`.
  STANDALONE_IAL = /\A {0,3}\{:[^}]*\}\s*\z/
  # The list item kramdown replaces with a table of contents (`* TOC` + `{:toc}`).
  TOC_PLACEHOLDER = /\A {0,3}(?:[*+-]|1\.) +TOC\s*\z/
  INLINE_CODE = /(`+[^`]*`+)/

  module_function

  # "/posts/hello-world/" -> "/posts/hello-world.md"
  def markdown_url(url)
    "#{url.chomp("/").delete_suffix(".html")}.md"
  end

  # Removes kramdown-only markup and makes root-relative links absolute, so the
  # text reads cleanly outside this site. Fenced code is left untouched.
  def clean(markdown, root)
    out = []
    fence = nil
    dropped = false
    markdown.each_line do |line|
      if fence
        fence = nil if line.lstrip.start_with?(fence) && line.strip.delete(fence[0]).empty?
        out << line
      elsif STANDALONE_IAL.match?(line)
        out.pop if line.include?("{:toc}") && out.last&.match?(TOC_PLACEHOLDER)
        dropped = true
        next
      elsif dropped && line.strip.empty? && (out.empty? || out.last.strip.empty?)
        # Skip the blank line a removed line would otherwise leave doubled.
      elsif (match = FENCE.match(line))
        fence = match[1]
        out << line
      else
        out << absolutize(line, root)
      end
      dropped = false
    end
    out.join.strip
  end

  # Prefixes root-relative Markdown and HTML link targets with `root`, skipping
  # inline code spans and protocol-relative URLs ("//host/...").
  def absolutize(line, root)
    return line if root.empty?

    line.split(INLINE_CODE).each_with_index.map do |part, index|
      next part if index.odd? # captured code span

      part
        .gsub(%r{\]\(/(?!/)}) { "](#{root}/" }
        .gsub(%r{\b(src|href)=(["'])/(?!/)}) { "#{Regexp.last_match(1)}=#{Regexp.last_match(2)}#{root}/" }
        .sub(%r{\A( {0,3}\[[^\]]+\]:\s+)/(?!/)}) { "#{Regexp.last_match(1)}#{root}/" }
    end.join
  end

  def document(title:, body:, url:, date:, description: nil, author: nil)
    lines = ["# #{title}", ""]
    lines.push("> #{description}", "") unless description.to_s.strip.empty?
    lines << "- Published: #{date}"
    lines << "- Author: #{author}" unless author.to_s.strip.empty?
    lines.push("- HTML version: #{url}", "", body, "")
    lines.join("\n")
  end

  # A page whose content is written verbatim (no Liquid, Markdown conversion or
  # layout) to exactly the URL given.
  class TextPage < Jekyll::PageWithoutAFile
    def initialize(site, url, content)
      # A .txt source name selects Jekyll's pass-through converter.
      super(site, site.source, File.dirname(url), "#{File.basename(url, ".*")}.txt")
      self.content = content
      data.merge!("permalink" => url, "layout" => nil, "render_with_liquid" => false, "sitemap" => false)
      @output_ext = File.extname(url)
    end

    attr_reader :output_ext
  end

  class Generator < Jekyll::Generator
    safe true
    priority :low

    def generate(site)
      root = "#{site.config["url"].to_s.chomp("/")}#{site.baseurl}"
      if site.config["url"].to_s.empty?
        Jekyll.logger.warn LOG_TOPIC, "site.url is not set; links in Markdown copies stay root-relative."
      end

      documents = site.posts.docs.sort_by(&:date).reverse.map { |post| publish(site, post, root) }
      site.pages << TextPage.new(site, "/llms-full.txt", documents.join("\n"))
      Jekyll.logger.info LOG_TOPIC, "Wrote Markdown copies of #{documents.size} post(s) and /llms-full.txt"
    end

    private

    def publish(site, post, root)
      url = AgentMarkdown.markdown_url(post.url)
      post.data["markdown_url"] = url
      text = AgentMarkdown.document(
        title: post.data["title"],
        description: post.data["description"],
        author: post.data["author"] || site.config["author"],
        date: post.date.strftime("%Y-%m-%d"),
        url: "#{root}#{post.url}",
        body: AgentMarkdown.clean(post.content, root)
      )
      site.pages << TextPage.new(site, url, text)
      Jekyll.logger.debug LOG_TOPIC, "#{post.relative_path} -> #{url} (#{text.bytesize} bytes)"
      text
    end
  end
end
