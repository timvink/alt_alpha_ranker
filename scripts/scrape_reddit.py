#!/usr/bin/env python3
"""
Script to scrape r/KeyboardLayouts subreddit for new layout announcements.

Scrapes posts from the last 48 hours and uses an LLM to determine if they
announce a new keyboard layout. Creates GitHub issues for:
1. Posts that appear to announce new layouts
2. Posts containing cyanophage playground URLs not already in layouts.yml

Usage:
    uv run scripts/scrape_reddit.py

Environment variables required:
    GEMINI_API_KEY: API key for Google Gemini
    GITHUB_TOKEN: GitHub token for creating issues (optional locally, available in GitHub Actions)

For local testing, create a .env file with these variables.
"""

import os
import re
import yaml
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from pathlib import Path

import requests
from dotenv import load_dotenv
from pydantic import BaseModel
from pydantic_ai import Agent

# Load environment variables from .env file for local development
load_dotenv()

# Constants
SUBREDDIT_JSON_URL = "https://old.reddit.com/r/KeyboardLayouts.json"
HOURS_TO_LOOK_BACK = 48
CYANOPHAGE_URL_PATTERN = r"https://cyanophage\.github\.io/playground\.html\?layout=[^\s\)\]\>\"']+"
LAYOUTS_YML_PATH = "config/layouts.yml"
GITHUB_REPO_OWNER = "timvink"
GITHUB_REPO_NAME = "alt_alpha_ranker"

# Reddit API requires a proper User-Agent to avoid 403 errors
# Using browser-like headers to avoid being blocked by Reddit's bot detection
REDDIT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}


@dataclass
class RedditComment:
    """Represents a Reddit comment."""

    text: str
    url: str
    author: str


@dataclass
class RedditPost:
    """Represents a Reddit post with its comments."""

    title: str
    text: str
    url: str
    created_utc: datetime
    comments: list[RedditComment] = field(default_factory=list)


class LayoutAnnouncementResult(BaseModel):
    """Result from LLM analysis of whether a post announces a new layout."""

    is_new_layout: bool
    reasoning: str


def fetch_post_comments(permalink: str) -> list[RedditComment]:
    """Fetch comments for a specific post."""
    comments = []

    try:
        # Reddit JSON endpoint for post with comments (using old.reddit.com to avoid blocking)
        url = f"https://old.reddit.com{permalink}.json"
        response = requests.get(url, headers=REDDIT_HEADERS)
        response.raise_for_status()
        data = response.json()

        # Comments are in the second element of the response array
        if len(data) > 1:
            comments_data = data[1].get("data", {}).get("children", [])
            for child in comments_data:
                if child.get("kind") == "t1":  # t1 = comment
                    comment_data = child.get("data", {})
                    comment_id = comment_data.get("id", "")
                    comments.append(
                        RedditComment(
                            text=comment_data.get("body", ""),
                            url=f"https://www.reddit.com{permalink}{comment_id}/",
                            author=comment_data.get("author", "[deleted]"),
                        )
                    )
    except Exception as e:
        print(f"    Warning: Could not fetch comments: {e}")

    return comments


def scrape_recent_posts(hours: int = HOURS_TO_LOOK_BACK) -> list[RedditPost]:
    """Scrape posts from r/KeyboardLayouts from the last N hours using JSON endpoint."""
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
    posts = []

    print("Fetching posts from r/KeyboardLayouts JSON endpoint...")

    # Fetch the JSON data (contains ~14 days of posts)
    response = requests.get(SUBREDDIT_JSON_URL, headers=REDDIT_HEADERS)
    response.raise_for_status()
    data = response.json()

    for child in data.get("data", {}).get("children", []):
        post_data = child.get("data", {})
        post_time = datetime.fromtimestamp(post_data.get("created_utc", 0), tz=timezone.utc)

        if post_time < cutoff_time:
            # Skip posts older than cutoff
            continue

        permalink = post_data.get("permalink", "")
        post = RedditPost(
            title=post_data.get("title", ""),
            text=post_data.get("selftext", ""),
            url=f"https://www.reddit.com{permalink}",
            created_utc=post_time,
        )

        # Fetch comments for this post
        print(f"  Fetching comments for: {post.title[:50]}...")
        post.comments = fetch_post_comments(permalink)

        posts.append(post)

    print(f"Found {len(posts)} posts in the last {hours} hours")
    return posts


def load_existing_cyanophage_urls() -> set[str]:
    """Load all cyanophage playground URLs from layouts.yml."""
    layouts_path = Path(LAYOUTS_YML_PATH)
    if not layouts_path.exists():
        return set()

    with open(layouts_path) as f:
        data = yaml.safe_load(f)

    urls = set()
    for layout in data.get("layouts", []):
        link = layout.get("link", "")
        if link:
            # Extract just the layout parameter for comparison
            # This normalizes the URL for comparison
            urls.add(normalize_cyanophage_url(link))

    return urls


def normalize_cyanophage_url(url: str) -> str:
    """Normalize a cyanophage URL for comparison by extracting the layout parameter."""
    # Extract the layout parameter value
    match = re.search(r"layout=([^&\s]+)", url)
    if match:
        return match.group(1)
    return url


def extract_cyanophage_urls(text: str) -> list[str]:
    """Extract all cyanophage playground URLs from text."""
    return re.findall(CYANOPHAGE_URL_PATTERN, text)


def create_layout_announcement_agent() -> Agent[None, LayoutAnnouncementResult]:
    """Create a PydanticAI agent for analyzing posts."""
    return Agent(
        "google-gla:gemini-2.5-flash",
        output_type=LayoutAnnouncementResult,
        system_prompt="""You are an expert at analyzing keyboard layout discussions.
Your task is to determine if a Reddit post or comment is announcing a NEW keyboard layout.

A post/comment announces a new layout if it:
- Introduces a layout the author created or is releasing
- Presents a layout that appears to be new/original
- Shares a new variant or modification of an existing layout

A post/comment does NOT announce a new layout if it:
- Just asks questions about existing layouts
- Discusses or reviews existing layouts without introducing anything new
- Is about typing tests, typing speed, or general keyboard discussions
- Is asking for help or recommendations
- Is sharing someone else's existing layout without modifications

Be conservative - only return true if you're reasonably confident this is announcing a new layout.""",
    )


async def analyze_content_for_new_layout(
    agent: Agent[None, LayoutAnnouncementResult], title: str, content: str, is_comment: bool = False
) -> LayoutAnnouncementResult:
    """Use LLM to analyze if content announces a new layout."""
    content_type = "comment" if is_comment else "post"
    prompt = f"""Analyze this Reddit {content_type} from r/KeyboardLayouts:

Post Title: {title}

{content_type.capitalize()} Content:
{content[:2000] if content else "(No text content)"}

Does this {content_type} announce a NEW keyboard layout?"""

    result = await agent.run(prompt)
    return result.output


def create_github_issue(title: str, body: str, labels: list[str] | None = None) -> bool:
    """Create a GitHub issue using the GitHub API or gh CLI."""
    import subprocess

    # Check if we're in GitHub Actions (GITHUB_TOKEN is set automatically)
    github_token = os.getenv("GITHUB_TOKEN")

    if github_token:
        # Use the GitHub API via curl or the gh CLI
        try:
            # Try using gh CLI first (available in GitHub Actions)
            cmd = [
                "gh",
                "issue",
                "create",
                "--repo",
                f"{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}",
                "--title",
                title,
                "--body",
                body,
                "--assignee",
                "timvink",
            ]
            if labels:
                for label in labels:
                    cmd.extend(["--label", label])

            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            print(f"Created issue: {result.stdout.strip()}")
            return True
        except subprocess.CalledProcessError as e:
            print(f"Failed to create issue with gh CLI: {e.stderr}")
            return False
        except FileNotFoundError:
            print("gh CLI not found, skipping issue creation")
            return False
    else:
        # Local development - just print what would be created
        print("\n[DRY RUN] Would create GitHub issue:")
        print(f"  Title: {title}")
        print(f"  Labels: {labels}")
        return True


@dataclass
class NewLayoutMatch:
    """Represents a detected new layout announcement."""

    post: RedditPost
    triggered_by_comment: RedditComment | None  # None if triggered by post itself
    reasoning: str


async def process_posts_for_new_layouts(posts: list[RedditPost]) -> list[NewLayoutMatch]:
    """Process posts and their comments to find new layout announcements using LLM."""
    if not posts:
        return []

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY not set, skipping LLM analysis")
        return []

    # Set the API key for google-generativeai
    os.environ["GOOGLE_API_KEY"] = api_key

    agent = create_layout_announcement_agent()
    matches: list[NewLayoutMatch] = []

    total_comments = sum(len(p.comments) for p in posts)
    print(f"\nAnalyzing {len(posts)} posts ({total_comments} comments) for new layout announcements...")

    for post in posts:
        try:
            # First, analyze the post itself
            result = await analyze_content_for_new_layout(agent, post.title, post.text, is_comment=False)
            status = "NEW LAYOUT (post)" if result.is_new_layout else "checking comments..."

            if result.is_new_layout:
                print(f"  - '{post.title[:50]}...' -> {status}")
                matches.append(NewLayoutMatch(post=post, triggered_by_comment=None, reasoning=result.reasoning))
                # Create issue and skip comments for this post
                create_issue_for_new_layout(post, None, result.reasoning)
                continue

            # If post didn't trigger, check comments
            found_in_comments = False
            for comment in post.comments:
                comment_result = await analyze_content_for_new_layout(
                    agent, post.title, comment.text, is_comment=True
                )
                if comment_result.is_new_layout:
                    print(f"  - '{post.title[:50]}...' -> NEW LAYOUT (comment by {comment.author})")
                    matches.append(
                        NewLayoutMatch(post=post, triggered_by_comment=comment, reasoning=comment_result.reasoning)
                    )
                    create_issue_for_new_layout(post, comment, comment_result.reasoning)
                    found_in_comments = True
                    break  # Stop checking other comments for this post

            if not found_in_comments:
                print(f"  - '{post.title[:50]}...' -> not a new layout")

        except Exception as e:
            print(f"  - Error analyzing '{post.title[:30]}...': {e}")

    return matches


def create_issue_for_new_layout(post: RedditPost, comment: RedditComment | None, reasoning: str) -> None:
    """Create a GitHub issue for a detected new layout announcement."""
    if comment:
        # Triggered by a comment
        title = f"Review potential new layout: {post.title[:50]}"
        body = f"""A new keyboard layout may have been announced in a Reddit comment.

**Post Title:** {post.title}
**Post URL:** {post.url}

**Triggering Comment:**
- Author: {comment.author}
- URL: {comment.url}
- Content:
```
{comment.text[:1500]}
```

**LLM Analysis:** {reasoning}

Please review this post and comment to determine if the layout should be added to the ranker.
"""
    else:
        # Triggered by the post itself
        title = f"Review potential new layout: {post.title[:50]}"
        body = f"""A new keyboard layout may have been announced on Reddit.

**Post Title:** {post.title}
**Post URL:** {post.url}

**LLM Analysis:** {reasoning}

Please review this post to determine if the layout should be added to the ranker.
"""

    create_github_issue(title, body, labels=["new-layout", "review-needed"])


def check_for_missing_cyanophage_urls(posts: list[RedditPost]) -> list[tuple[str, RedditPost, RedditComment | None]]:
    """Check posts and comments for cyanophage URLs not in our layouts.yml."""
    existing_urls = load_existing_cyanophage_urls()
    missing_urls: list[tuple[str, RedditPost, RedditComment | None]] = []
    total_found = 0
    already_have = 0

    print("\nChecking posts and comments for cyanophage playground URLs...")

    for post in posts:
        # Check post title and text
        full_text = f"{post.title}\n{post.text}"
        found_urls = extract_cyanophage_urls(full_text)
        total_found += len(found_urls)

        for url in found_urls:
            normalized = normalize_cyanophage_url(url)
            if normalized in existing_urls:
                already_have += 1
            else:
                missing_urls.append((url, post, None))

        # Check comments
        for comment in post.comments:
            comment_urls = extract_cyanophage_urls(comment.text)
            total_found += len(comment_urls)

            for url in comment_urls:
                normalized = normalize_cyanophage_url(url)
                if normalized in existing_urls:
                    already_have += 1
                else:
                    missing_urls.append((url, post, comment))

    print(f"  Found {total_found} cyanophage URLs total")
    print(f"  Already in database: {already_have}")
    print(f"  New URLs found: {len(missing_urls)}")
    print(f"  (Database has {len(existing_urls)} layouts)")

    return missing_urls


def create_issues_for_missing_urls(missing_urls: list[tuple[str, RedditPost, RedditComment | None]]) -> None:
    """Create GitHub issues for cyanophage URLs not in our database."""
    # Deduplicate by URL
    seen_urls = set()
    unique_missing: list[tuple[str, RedditPost, RedditComment | None]] = []

    for url, post, comment in missing_urls:
        normalized = normalize_cyanophage_url(url)
        if normalized not in seen_urls:
            seen_urls.add(normalized)
            unique_missing.append((url, post, comment))

    print(f"\nCreating issues for {len(unique_missing)} missing cyanophage layouts...")

    for url, post, comment in unique_missing:
        if comment:
            body = f"""A cyanophage playground URL was found in a Reddit comment that is not in our layouts.yml.

**Cyanophage URL:** {url}

**Source Post:** {post.url}
**Post Title:** {post.title}

**Found in comment by:** {comment.author}
**Comment URL:** {comment.url}

Please review this layout and add it to `config/layouts.yml` if appropriate.
"""
        else:
            body = f"""A cyanophage playground URL was found on Reddit that is not in our layouts.yml.

**Cyanophage URL:** {url}

**Source Post:** {post.url}
**Post Title:** {post.title}

Please review this layout and add it to `config/layouts.yml` if appropriate.
"""

        create_github_issue(
            title="Review missing cyanophage layout from Reddit",
            body=body,
            labels=["missing-layout", "review-needed"],
        )


async def main():
    """Main entry point for the script."""
    print("=" * 60)
    print("Reddit Layout Scraper")
    print("=" * 60)

    # Scrape recent posts
    posts = scrape_recent_posts(HOURS_TO_LOOK_BACK)

    if not posts:
        print("No recent posts found.")
        return

    # Process posts for new layout announcements
    await process_posts_for_new_layouts(posts)

    # Check for missing cyanophage URLs
    missing_urls = check_for_missing_cyanophage_urls(posts)
    if missing_urls:
        create_issues_for_missing_urls(missing_urls)
    else:
        print("\nNo new cyanophage URLs found.")

    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
