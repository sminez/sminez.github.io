# Install local tooling needed for building, running and linting
install-tools:
	cargo install typos-cli

# Check that site configuration and post metadata is correct
check:
	zola check

# Serve the site locally
serve:
	zola serve

# Serve the site locally (including drafts)
serve-drafts:
	zola serve --drafts

# Create a new stub blog post
new-post TITLE:
	./scripts/new-blog-post.sh {{TITLE}}

# Check for spelling mistakes using 'typos'
check-spelling:
	typos

# Fix spelling mistakes with 'typos'
fix-spelling:
	typos --write-changes
