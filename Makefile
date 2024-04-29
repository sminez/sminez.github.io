.PHONY: check
check:
	zola check
	
.PHONY: serve
serve:
	zola serve

.PHONY: serve-drafts
serve-drafts:
	zola serve --drafts

.PHONY: new-post
new-post:
	./scripts/new-blog-post.sh $(title)
