#!/bin/bash
# Deploy the impact directory to Netlify.
# Run from the project root: bash deploy.sh
set -e
python3 scripts/consolidate.py
npm run build
netlify deploy --prod --dir=dist --site=78da1569-75bd-4690-8f8f-e20cd14b5720
