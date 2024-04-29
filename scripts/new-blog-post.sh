#!/usr/bin/env bash
# A simple helper for stubbing out a new blog post entry

DATE="$(date +%F)"
TITLE="$*"
SLUG=$(
  echo "$TITLE" |
  tr -d "'" |
  sed -E 's/[^a-zA-Z0-9]+/-/g; s/^-+|-+$//g' |
  tr '[:upper:]' '[:lower:]'
)
FNAME="content/${DATE}_$SLUG.md"

cat <<EOF
:: generating stub page for new post...
filename: $FNAME
title: $TITLE
date: $DATE

:: remember to specify tags and run using 'make serve-drafts'
EOF

cat <<EOF > "$FNAME"
+++
title = "$TITLE"
draft = true

[taxonomies]
tags = []
+++

...
EOF
