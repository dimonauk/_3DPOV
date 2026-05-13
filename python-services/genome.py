"""
genome.py — backwards-compatibility shim for the HoloFlow genome package.

The genome logic has been modularised into the `genome/` package.
Import from there directly:

    from genome import Genome, crossover, mutate, init_population...

This shim re-exports everything so existing call-sites continue to work.
"""
from genome import (
    Genome, 
    GENE_NAMES, GENE_RANGES, SCULPTURE_TYPES, TYPE_CONSTRAINTS, GENE_SENSITIVITY,
    random_genome, crossover, mutate, tournament_select, init_population, evolve_population
)

__all__ = [
    "Genome",
    "GENE_NAMES",
    "GENE_RANGES",
    "SCULPTURE_TYPES",
    "TYPE_CONSTRAINTS",
    "GENE_SENSITIVITY",
    "random_genome",
    "crossover",
    "mutate",
    "tournament_select",
    "init_population",
    "evolve_population",
]
