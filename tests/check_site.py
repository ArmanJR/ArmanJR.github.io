# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Smoke-test the deployed blog using only the standard library."""

import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from html import unescape
from html.parser import HTMLParser


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.links = []
        self.canonical = None
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a":
            self.links.append(attrs.get("href"))
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical = attrs.get("href")


def fetch(url, expected_status=200):
    try:
        response = urllib.request.urlopen(url, timeout=30)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        if response.status != expected_status:
            raise AssertionError(
                f"{url}: expected HTTP {expected_status}, got {response.status}"
            )
        return response.read().decode("utf-8")


def check(base):
    home = fetch(base + "/")
    page = Page(home)
    assert "Arman's technical blog" in unescape(home), "Homepage title missing"
    assert page.canonical == "https://dev.arman.ac/", "Incorrect canonical URL"
    assert "/about/" in page.links, "About navigation missing"
    assert "/feed.xml" in page.links, "RSS link missing"
    assert "Your first post" not in home, "Draft appears on homepage"
    about = fetch(base + "/about/")
    assert "https://github.com/ArmanJR" in Page(about).links
    feed = ET.fromstring(fetch(base + "/feed.xml"))
    assert feed.tag == "{http://www.w3.org/2005/Atom}feed", "Invalid Atom feed"
    assert "Your first post" not in ET.tostring(feed, encoding="unicode")
    missing = fetch(base + "/missing-smoke-test-page/", 404)
    assert "Return to the blog" in missing, "Custom 404 page missing"
    for path in ("/_drafts/first-post.md", "/README.md", "/tests/check_site.py"):
        fetch(base + path, 404)
    print(f"PASS: homepage, navigation, RSS, 404, and exclusions at {base}")


if __name__ == "__main__":
    if len(sys.argv) != 2 or not sys.argv[1].startswith("https://"):
        sys.exit("Usage: uv run tests/check_site.py https://dev.arman.ac")
    try:
        check(sys.argv[1].rstrip("/"))
    except (AssertionError, OSError, ET.ParseError) as error:
        sys.exit(f"Site check failed: {error}")
