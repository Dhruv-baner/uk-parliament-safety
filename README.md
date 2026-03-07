# UK Parliament Safety Pipeline

This project contains the data pipeline for fetching, classifying, and profiling UK Parliament speeches.

## Project Structure

- `data/` - Contains raw, processed, and output data (ignored in git).
- `pipeline/` - Python scripts for the data pipeline steps.
- `notebooks/` - Jupyter notebooks for data exploration.

## Setup

1. Create a virtual environment and install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Copy `.env.example` to `.env` and fill in your API keys.
