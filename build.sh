#!/bin/bash

html-minifier original.html \
  --remove-comments \
  --collapse-whitespace \
  --minify-js \
  --minify-css \
  -o index.html