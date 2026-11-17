#!/usr/bin/env python3
"""
ContextOS Sentence-Transformers Embedding Generator
Generates 384-dimensional normalized vector embeddings using all-MiniLM-L6-v2.
Used for Qdrant Vector Cloud indexing and semantic RAG retrieval without Gemini API key.
"""

import sys
import json
import os

# Suppress noisy HuggingFace/PyTorch warnings
os.environ['TOKENIZERS_PARALLELISM'] = 'false'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

MODEL_NAME = 'all-MiniLM-L6-v2'

def load_model():
    from sentence_transformers import SentenceTransformer
    try:
        # Try local cache first for sub-second offline execution
        return SentenceTransformer(MODEL_NAME, local_files_only=True)
    except Exception:
        # Fallback to downloading or standard load
        return SentenceTransformer(MODEL_NAME)

def main():
    try:
        # Read JSON input from stdin or argument
        raw_input = ""
        if len(sys.argv) > 1:
            raw_input = sys.argv[1]
        else:
            raw_input = sys.stdin.read().strip()

        if not raw_input:
            print(json.dumps({"error": "No input text provided", "embeddings": []}))
            sys.exit(0)

        data = json.loads(raw_input)
        if isinstance(data, str):
            texts = [data]
        elif isinstance(data, list):
            texts = data
        elif isinstance(data, dict):
            texts = data.get('texts', [])
        else:
            texts = [str(data)]

        if not texts:
            print(json.dumps({"embeddings": [], "dimension": 384}))
            sys.exit(0)

        # Sanitize texts (ensure non-empty strings and truncate extreme lengths)
        sanitized = [str(t)[:4096] if (t and str(t).strip()) else " " for t in texts]

        model = load_model()
        # normalize_embeddings=True ensures vectors have unit length (L2 norm = 1.0)
        embeddings = model.encode(sanitized, normalize_embeddings=True, show_progress_bar=False)

        # Convert numpy array to list of floats
        result_embeddings = embeddings.tolist()
        if len(sanitized) == 1 and not isinstance(result_embeddings[0], list):
            result_embeddings = [result_embeddings]

        print(json.dumps({
            "success": True,
            "dimension": len(result_embeddings[0]) if result_embeddings else 384,
            "count": len(result_embeddings),
            "embeddings": result_embeddings
        }))
        sys.exit(0)

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "embeddings": []
        }), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
