#!/usr/bin/env python3
"""
Visualize the flaw in min-max normalization for layout scoring.

This marimo notebook demonstrates that with min-max normalization, the relative ranking
of two layouts can change depending on how many other layouts are in the dataset.

Run with: uv run marimo run scripts/visualize_minmax_flaw.py
Or edit: uv run marimo edit scripts/visualize_minmax_flaw.py
"""

import marimo

__generated_with = "0.18.1"
app = marimo.App(width="medium", app_title="Min-Max Normalization Flaw")


@app.cell
def _():
    import marimo as mo
    return (mo,)


@app.cell
def _(mo):
    mo.md(r"""
    # Min-Max Normalization Flaw in Layout Scoring

    This notebook demonstrates a critical flaw in using min-max normalization for scoring keyboard layouts.

    ## The Problem

    With min-max normalization, the **relative ranking of two layouts can change** depending on which other layouts are in the dataset. This violates the principle:

    > If layout A beats layout B in isolation, then A should beat B in any superset.

    We'll demonstrate this by:
    1. Starting with just **graphite** and **octa8** (2 layouts)
    2. Randomly adding layouts one by one
    3. Observing how the scores change

    With equal weights, graphite wins on 4 metrics (SFB, SFS, redirect, pinky) while octa8 wins on 3 metrics (LSB, scissors, rolls). So graphite should **always** beat octa8.
    """)
    return


@app.cell
def _():
    import json
    import random
    from pathlib import Path

    import matplotlib.pyplot as plt
    import seaborn as sns

    # Load data
    data_path = Path(__file__).parent.parent / "site" / "data.json"
    with open(data_path) as f:
        data = json.load(f)

    layouts = data["layouts"]
    print(f"Loaded {len(layouts)} layouts")
    return layouts, plt, random, sns


@app.cell
def _():
    def parse_metric_value(value):
        """Extract numeric value from a metric string (removes % sign)."""
        # if value is None:
        #     return 0.0
        return float(str(value).replace("%", "")) or 0.0

    def extract_metric_values(metrics):
        """Extract all metric values from a layout's metrics object."""
        # if not metrics:
        #     return {"sfb": 0, "sfs": 0, "lsb": 0, "scissors": 0, "rolls": 0, "redirect": 0, "pinky": 0}

        sfb = parse_metric_value(metrics.get("same_finger_bigrams"))
        sfs = parse_metric_value(metrics.get("skip_bigrams_1u"))
        lsb = parse_metric_value(metrics.get("lat_stretch_bigrams"))
        scissors = parse_metric_value(metrics.get("scissors"))
        redirect = parse_metric_value(metrics.get("redirect"))
        pinky = parse_metric_value(metrics.get("pinky_off"))

        rolls = (
            parse_metric_value(metrics.get("bigram_roll_in"))
            + parse_metric_value(metrics.get("bigram_roll_out"))
            + parse_metric_value(metrics.get("roll_in"))
            + parse_metric_value(metrics.get("roll_out"))
        )

        return {"sfb": sfb, "sfs": sfs, "lsb": lsb, "scissors": scissors, "rolls": rolls, "redirect": redirect, "pinky": pinky}
    return (extract_metric_values,)


@app.cell
def _(extract_metric_values):
    def calculate_scores_minmax(layouts_subset, weights, language="english"):
        """
        Calculate scores using the FLAWED min-max normalization approach.
        """
        if not layouts_subset:
            return {}

        metric_values_list = []
        for layout in layouts_subset:
            metrics = layout.get("metrics", {}).get(language, {})
            metric_values_list.append({
                "name": layout["name"],
                "values": extract_metric_values(metrics)
            })

        keys = ["sfb", "sfs", "lsb", "scissors", "rolls", "redirect", "pinky"]
        min_max = {}
        for key in keys:
            values = [m["values"][key] for m in metric_values_list]
            min_max[key] = {"min": min(values), "max": max(values)}

        def normalize(value, min_val, max_val):
            if max_val == min_val:
                return 0.5
            return (value - min_val) / (max_val - min_val)

        raw_scores = []
        for item in metric_values_list:
            values = item["values"]
            normalized = {
                key: normalize(values[key], min_max[key]["min"], min_max[key]["max"])
                for key in keys
            }

            raw_score = (
                weights["sfb"] * (1 - normalized["sfb"])
                + weights["sfs"] * (1 - normalized["sfs"])
                + weights["lsb"] * (1 - normalized["lsb"])
                + weights["scissors"] * (1 - normalized["scissors"])
                + weights["rolls"] * normalized["rolls"]
                + weights["redirect"] * (1 - normalized["redirect"])
                + weights["pinky"] * (1 - normalized["pinky"])
            )
            raw_scores.append({"name": item["name"], "raw_score": raw_score})

        raw_values = [r["raw_score"] for r in raw_scores]
        raw_min = min(raw_values)
        raw_max = max(raw_values)

        scores = {}
        for item in raw_scores:
            if raw_max == raw_min:
                final_score = 50
            else:
                final_score = 100 * (item["raw_score"] - raw_min) / (raw_max - raw_min)
            scores[item["name"]] = round(final_score, 1)

        return scores
    return (calculate_scores_minmax,)


@app.cell
def _(extract_metric_values):
    def calculate_scores_qwerty(layouts_subset, weights, language="english"):
        """
        Calculate scores using the FIXED QWERTY-based normalization approach.
        """
        if not layouts_subset:
            return {}

        # Find QWERTY layout
        qwerty_layout = next((l for l in layouts_subset if l["name"].lower() == "qwerty"), None)
        if not qwerty_layout:
            return {}  # Need QWERTY as reference

        qwerty_metrics = qwerty_layout.get("metrics", {}).get(language, {})
        qwerty_values = extract_metric_values(qwerty_metrics)

        metric_values_list = []
        for layout in layouts_subset:
            metrics = layout.get("metrics", {}).get(language, {})
            metric_values_list.append({
                "name": layout["name"],
                "values": extract_metric_values(metrics)
            })

        # Calculate best values
        keys = ["sfb", "sfs", "lsb", "scissors", "rolls", "redirect", "pinky"]
        lower_is_better = ["sfb", "sfs", "lsb", "scissors", "redirect", "pinky"]
        higher_is_better = ["rolls"]

        best_values = {}
        for key in lower_is_better:
            values = [m["values"][key] for m in metric_values_list]
            best_values[key] = min(values)
        for key in higher_is_better:
            values = [m["values"][key] for m in metric_values_list]
            best_values[key] = max(values)

        def normalize_to_qwerty(value, qwerty_val, best_val, lower_better):
            if lower_better:
                range_val = qwerty_val - best_val
                if range_val == 0:
                    return 0
                return (qwerty_val - value) / range_val
            else:
                range_val = best_val - qwerty_val
                if range_val == 0:
                    return 0
                return (value - qwerty_val) / range_val

        raw_scores = []
        for item in metric_values_list:
            values = item["values"]
            normalized = {}
            for key in lower_is_better:
                normalized[key] = normalize_to_qwerty(values[key], qwerty_values[key], best_values[key], True)
            for key in higher_is_better:
                normalized[key] = normalize_to_qwerty(values[key], qwerty_values[key], best_values[key], False)

            raw_score = sum(weights[key] * normalized[key] for key in keys)
            raw_scores.append({"name": item["name"], "raw_score": raw_score})

        # Convert to percentage of max possible
        max_raw_score = sum(weights.values())

        scores = {}
        for item in raw_scores:
            score = (item["raw_score"] / max_raw_score) * 100 if max_raw_score > 0 else 0
            scores[item["name"]] = round(score, 1)

        return scores
    return (calculate_scores_qwerty,)


@app.cell
def _(extract_metric_values):
    def calculate_scores_qwerty_fixed(layouts_subset, weights, language="english"):
        """
        Calculate scores using QWERTY-fixed normalization approach.
        
        For lower-is-better metrics: 0 is best, qwerty's value is worst.
        For higher-is-better metrics: 100 is best, qwerty's value is worst.
        """
        if not layouts_subset:
            return {}

        # Find QWERTY layout
        qwerty_layout = next((l for l in layouts_subset if l["name"].lower() == "qwerty"), None)
        if not qwerty_layout:
            return {}  # Need QWERTY as reference

        qwerty_metrics = qwerty_layout.get("metrics", {}).get(language, {})
        qwerty_values = extract_metric_values(qwerty_metrics)

        metric_values_list = []
        for layout in layouts_subset:
            metrics = layout.get("metrics", {}).get(language, {})
            metric_values_list.append({
                "name": layout["name"],
                "values": extract_metric_values(metrics)
            })

        keys = ["sfb", "sfs", "lsb", "scissors", "rolls", "redirect", "pinky"]
        lower_is_better = ["sfb", "sfs", "lsb", "scissors", "redirect", "pinky"]
        higher_is_better = ["rolls"]

        # Fixed best values: 0 for lower-is-better, 100 for higher-is-better
        best_values = {}
        for key in lower_is_better:
            best_values[key] = 0
        for key in higher_is_better:
            best_values[key] = 100

        def normalize_to_qwerty_fixed(value, qwerty_val, best_val, lower_better):
            if lower_better:
                # best = 0, worst = qwerty_val
                # normalized = (qwerty - value) / (qwerty - 0) = (qwerty - value) / qwerty
                if qwerty_val == 0:
                    return 1.0 if value == 0 else 0.0
                return (qwerty_val - value) / qwerty_val
            else:
                # best = 100, worst = qwerty_val
                # normalized = (value - qwerty) / (100 - qwerty)
                range_val = best_val - qwerty_val
                if range_val == 0:
                    return 0
                return (value - qwerty_val) / range_val

        raw_scores = []
        for item in metric_values_list:
            values = item["values"]
            normalized = {}
            for key in lower_is_better:
                normalized[key] = normalize_to_qwerty_fixed(values[key], qwerty_values[key], best_values[key], True)
            for key in higher_is_better:
                normalized[key] = normalize_to_qwerty_fixed(values[key], qwerty_values[key], best_values[key], False)

            raw_score = sum(weights[key] * normalized[key] for key in keys)
            raw_scores.append({"name": item["name"], "raw_score": raw_score})

        # Convert to percentage of max possible
        max_raw_score = sum(weights.values())

        scores = {}
        for item in raw_scores:
            score = (item["raw_score"] / max_raw_score) * 100 if max_raw_score > 0 else 0
            scores[item["name"]] = round(score, 1)

        return scores
    return (calculate_scores_qwerty_fixed,)


@app.cell
def _(layouts):
    # Extract key layouts and define weights
    graphite = next(l for l in layouts if l["name"] == "graphite")
    octa8 = next(l for l in layouts if l["name"] == "octa8")
    qwerty = next(l for l in layouts if l["name"] == "qwerty")
    other_layouts = [l for l in layouts if l["name"] not in ("graphite", "octa8", "qwerty")]

    weights = {"sfb": 50, "sfs": 50, "lsb": 50, "scissors": 50, "rolls": 50, "redirect": 50, "pinky": 50}
    n_simulations = 10
    return graphite, n_simulations, octa8, other_layouts, qwerty, weights


@app.cell
def _(
    calculate_scores_minmax,
    graphite,
    n_simulations,
    octa8,
    other_layouts,
    random,
    weights,
):
    # Run simulation for min-max approach
    all_graphite_minmax = []
    all_octa8_minmax = []

    random.seed(42)

    for _sim in range(n_simulations):
        _shuffled_others = other_layouts.copy()
        random.shuffle(_shuffled_others)

        _graphite_scores = []
        _octa8_scores = []
        _current_layouts = [graphite, octa8]

        for _i in range(len(_shuffled_others) + 1):
            _scores = calculate_scores_minmax(_current_layouts, weights, "english")
            _graphite_scores.append(_scores.get("graphite", 0))
            _octa8_scores.append(_scores.get("octa8", 0))

            if _i < len(_shuffled_others):
                _current_layouts.append(_shuffled_others[_i])

        all_graphite_minmax.append(_graphite_scores)
        all_octa8_minmax.append(_octa8_scores)

    print(f"Ran {n_simulations} simulations for min-max approach")
    return all_graphite_minmax, all_octa8_minmax


@app.cell
def _(
    calculate_scores_qwerty,
    graphite,
    n_simulations,
    octa8,
    other_layouts,
    qwerty,
    random,
    weights,
):
    # Run simulation for QWERTY-based approach
    all_graphite_qwerty = []
    all_octa8_qwerty = []

    random.seed(42)  # Same seed for fair comparison

    for _sim in range(n_simulations):
        _shuffled_others = other_layouts.copy()
        random.shuffle(_shuffled_others)

        _graphite_scores = []
        _octa8_scores = []
        # Start with graphite, octa8, and qwerty (need qwerty as reference)
        _current_layouts = [graphite, octa8, qwerty]

        for _i in range(len(_shuffled_others) + 1):
            _scores = calculate_scores_qwerty(_current_layouts, weights, "english")
            _graphite_scores.append(_scores.get("graphite", 0))
            _octa8_scores.append(_scores.get("octa8", 0))

            if _i < len(_shuffled_others):
                _current_layouts.append(_shuffled_others[_i])

        all_graphite_qwerty.append(_graphite_scores)
        all_octa8_qwerty.append(_octa8_scores)

    print(f"Ran {n_simulations} simulations for QWERTY-based approach")
    return all_graphite_qwerty, all_octa8_qwerty


@app.cell
def _(
    calculate_scores_qwerty_fixed,
    graphite,
    n_simulations,
    octa8,
    other_layouts,
    qwerty,
    random,
    weights,
):
    # Run simulation for QWERTY-fixed approach
    all_graphite_qwerty_fixed = []
    all_octa8_qwerty_fixed = []

    random.seed(42)  # Same seed for fair comparison

    for _sim in range(n_simulations):
        _shuffled_others = other_layouts.copy()
        random.shuffle(_shuffled_others)

        _graphite_scores = []
        _octa8_scores = []
        # Start with graphite, octa8, and qwerty (need qwerty as reference)
        _current_layouts = [graphite, octa8, qwerty]

        for _i in range(len(_shuffled_others) + 1):
            _scores = calculate_scores_qwerty_fixed(_current_layouts, weights, "english")
            _graphite_scores.append(_scores.get("graphite", 0))
            _octa8_scores.append(_scores.get("octa8", 0))

            if _i < len(_shuffled_others):
                _current_layouts.append(_shuffled_others[_i])

        all_graphite_qwerty_fixed.append(_graphite_scores)
        all_octa8_qwerty_fixed.append(_octa8_scores)

    print(f"Ran {n_simulations} simulations for QWERTY-fixed approach")
    return all_graphite_qwerty_fixed, all_octa8_qwerty_fixed


@app.cell
def _(mo):
    mo.md(r"""
    ## Plot 1: Min-Max Normalization (Flawed Approach)

    Watch how the lines cross as we add more layouts. The relative ranking of graphite vs octa8 is **unstable**.
    """)
    return


@app.cell
def _(
    all_graphite_minmax,
    all_octa8_minmax,
    n_simulations,
    other_layouts,
    plt,
    sns,
):
    # Create plot for min-max approach
    sns.set_theme(style="whitegrid")
    fig_minmax, ax_minmax = plt.subplots(figsize=(12, 6))

    # The loop runs len(other_layouts) + 1 times (starting with 2 layouts, ending with all)
    num_points = len(other_layouts) + 1
    x_minmax = list(range(2, 2 + num_points))

    # Plot all simulations with low alpha
    for _i in range(n_simulations):
        ax_minmax.plot(x_minmax, all_graphite_minmax[_i], color="blue", alpha=0.2, linewidth=1)
        ax_minmax.plot(x_minmax, all_octa8_minmax[_i], color="red", alpha=0.2, linewidth=1)

    # Plot average lines
    avg_graphite_mm = [sum(scores[_j] for scores in all_graphite_minmax) / n_simulations for _j in range(len(x_minmax))]
    avg_octa8_mm = [sum(scores[_j] for scores in all_octa8_minmax) / n_simulations for _j in range(len(x_minmax))]

    ax_minmax.plot(x_minmax, avg_graphite_mm, color="blue", linewidth=2.5, label="graphite (avg)")
    ax_minmax.plot(x_minmax, avg_octa8_mm, color="red", linewidth=2.5, label="octa8 (avg)")

    # Count crossovers
    crossovers_minmax = 0
    for _sim in range(n_simulations):
        for _i in range(1, len(x_minmax)):
            if (all_graphite_minmax[_sim][_i - 1] > all_octa8_minmax[_sim][_i - 1] and 
                all_graphite_minmax[_sim][_i] < all_octa8_minmax[_sim][_i]):
                crossovers_minmax += 1
            elif (all_graphite_minmax[_sim][_i - 1] < all_octa8_minmax[_sim][_i - 1] and 
                  all_graphite_minmax[_sim][_i] > all_octa8_minmax[_sim][_i]):
                crossovers_minmax += 1

    ax_minmax.set_xlabel("Number of layouts in dataset", fontsize=12)
    ax_minmax.set_ylabel("Score (0-100)", fontsize=12)
    ax_minmax.set_title("Min-Max Normalization: Ranking Instability", fontsize=14, fontweight="bold")
    ax_minmax.legend(loc="upper right")

    ax_minmax.annotate(
        f"With 2 layouts: graphite always wins (100 vs 0)\n"
        f"Crossovers detected: {crossovers_minmax} across {n_simulations} simulations\n"
        f"The relative ranking should NOT change!",
        xy=(0.02, 0.02),
        xycoords="axes fraction",
        fontsize=10,
        verticalalignment="bottom",
        bbox=dict(boxstyle="round", facecolor="lightyellow", alpha=0.9, edgecolor="orange"),
    )

    ax_minmax.axhline(y=50, color="gray", linestyle="--", alpha=0.5, linewidth=1)
    ax_minmax.set_ylim(-5, 105)

    plt.tight_layout()
    plt.gca()
    return


@app.cell
def _(mo):
    mo.md(r"""
    ## Plot 2: QWERTY-Based Normalization (Fixed Approach)

    With QWERTY as a fixed reference point, the relative ranking is **stable**. Graphite always beats octa8.
    """)
    return


@app.cell
def _(
    all_graphite_qwerty,
    all_octa8_qwerty,
    n_simulations,
    other_layouts,
    plt,
    sns,
):
    # Create plot for QWERTY-based approach
    sns.set_theme(style="whitegrid")
    fig_qwerty, ax_qwerty = plt.subplots(figsize=(12, 6))

    # The loop runs len(other_layouts) + 1 times (starting with 3 layouts, ending with all)
    num_points_qw = len(other_layouts) + 1
    x_qwerty = list(range(3, 3 + num_points_qw))

    # Plot all simulations with low alpha
    for _i in range(n_simulations):
        ax_qwerty.plot(x_qwerty, all_graphite_qwerty[_i], color="blue", alpha=0.2, linewidth=1)
        ax_qwerty.plot(x_qwerty, all_octa8_qwerty[_i], color="red", alpha=0.2, linewidth=1)

    # Plot average lines
    avg_graphite_qw = [sum(scores[_j] for scores in all_graphite_qwerty) / n_simulations for _j in range(len(x_qwerty))]
    avg_octa8_qw = [sum(scores[_j] for scores in all_octa8_qwerty) / n_simulations for _j in range(len(x_qwerty))]

    ax_qwerty.plot(x_qwerty, avg_graphite_qw, color="blue", linewidth=2.5, label="graphite (avg)")
    ax_qwerty.plot(x_qwerty, avg_octa8_qw, color="red", linewidth=2.5, label="octa8 (avg)")

    # Count crossovers
    crossovers_qwerty = 0
    for _sim in range(n_simulations):
        for _i in range(1, len(x_qwerty)):
            if (all_graphite_qwerty[_sim][_i - 1] > all_octa8_qwerty[_sim][_i - 1] and 
                all_graphite_qwerty[_sim][_i] < all_octa8_qwerty[_sim][_i]):
                crossovers_qwerty += 1
            elif (all_graphite_qwerty[_sim][_i - 1] < all_octa8_qwerty[_sim][_i - 1] and 
                  all_graphite_qwerty[_sim][_i] > all_octa8_qwerty[_sim][_i]):
                crossovers_qwerty += 1

    ax_qwerty.set_xlabel("Number of layouts in dataset", fontsize=12)
    ax_qwerty.set_ylabel("Score (% improvement over QWERTY)", fontsize=12)
    ax_qwerty.set_title("QWERTY-Based Normalization: Stable Rankings", fontsize=14, fontweight="bold")
    ax_qwerty.legend(loc="upper right")

    ax_qwerty.annotate(
        f"Graphite always beats octa8\n"
        f"Crossovers detected: {crossovers_qwerty} across {n_simulations} simulations\n"
        f"QWERTY = 0% (reference point)",
        xy=(0.02, 0.02),
        xycoords="axes fraction",
        fontsize=10,
        verticalalignment="bottom",
        bbox=dict(boxstyle="round", facecolor="lightgreen", alpha=0.9, edgecolor="green"),
    )

    ax_qwerty.axhline(y=0, color="gray", linestyle="--", alpha=0.5, linewidth=1, label="QWERTY baseline")

    plt.tight_layout()
    plt.gca()
    return


@app.cell
def _(mo):
    mo.md(r"""
    ## Plot 3: QWERTY-Fixed Normalization (Alternative Fixed Approach)

    With QWERTY as the worst value and 0 (for lower-is-better) or 100 (for higher-is-better) as the best,
    the relative ranking is **completely stable**. Scores don't change as layouts are added.
    """)
    return


@app.cell
def _(
    all_graphite_qwerty_fixed,
    all_octa8_qwerty_fixed,
    n_simulations,
    other_layouts,
    plt,
    sns,
):
    # Create plot for QWERTY-fixed approach
    sns.set_theme(style="whitegrid")
    fig_qwerty_fixed, ax_qwerty_fixed = plt.subplots(figsize=(12, 6))

    # The loop runs len(other_layouts) + 1 times (starting with 3 layouts, ending with all)
    num_points_qf = len(other_layouts) + 1
    x_qwerty_fixed = list(range(3, 3 + num_points_qf))

    # Plot all simulations with low alpha
    for _i in range(n_simulations):
        ax_qwerty_fixed.plot(x_qwerty_fixed, all_graphite_qwerty_fixed[_i], color="blue", alpha=0.2, linewidth=1)
        ax_qwerty_fixed.plot(x_qwerty_fixed, all_octa8_qwerty_fixed[_i], color="red", alpha=0.2, linewidth=1)

    # Plot average lines
    avg_graphite_qf = [sum(scores[_j] for scores in all_graphite_qwerty_fixed) / n_simulations for _j in range(len(x_qwerty_fixed))]
    avg_octa8_qf = [sum(scores[_j] for scores in all_octa8_qwerty_fixed) / n_simulations for _j in range(len(x_qwerty_fixed))]

    ax_qwerty_fixed.plot(x_qwerty_fixed, avg_graphite_qf, color="blue", linewidth=2.5, label="graphite (avg)")
    ax_qwerty_fixed.plot(x_qwerty_fixed, avg_octa8_qf, color="red", linewidth=2.5, label="octa8 (avg)")

    # Count crossovers
    crossovers_qwerty_fixed = 0
    for _sim in range(n_simulations):
        for _i in range(1, len(x_qwerty_fixed)):
            if (all_graphite_qwerty_fixed[_sim][_i - 1] > all_octa8_qwerty_fixed[_sim][_i - 1] and 
                all_graphite_qwerty_fixed[_sim][_i] < all_octa8_qwerty_fixed[_sim][_i]):
                crossovers_qwerty_fixed += 1
            elif (all_graphite_qwerty_fixed[_sim][_i - 1] < all_octa8_qwerty_fixed[_sim][_i - 1] and 
                  all_graphite_qwerty_fixed[_sim][_i] > all_octa8_qwerty_fixed[_sim][_i]):
                crossovers_qwerty_fixed += 1

    ax_qwerty_fixed.set_xlabel("Number of layouts in dataset", fontsize=12)
    ax_qwerty_fixed.set_ylabel("Score (% improvement over QWERTY)", fontsize=12)
    ax_qwerty_fixed.set_title("QWERTY-Fixed Normalization: Perfectly Stable Rankings", fontsize=14, fontweight="bold")
    ax_qwerty_fixed.legend(loc="upper right")

    ax_qwerty_fixed.annotate(
        f"Graphite always beats octa8\n"
        f"Crossovers detected: {crossovers_qwerty_fixed} across {n_simulations} simulations\n"
        f"Best = 0 (lower-is-better) or 100 (higher-is-better)\n"
        f"Worst = QWERTY's value (fixed reference)",
        xy=(0.02, 0.02),
        xycoords="axes fraction",
        fontsize=10,
        verticalalignment="bottom",
        bbox=dict(boxstyle="round", facecolor="lightblue", alpha=0.9, edgecolor="blue"),
    )

    ax_qwerty_fixed.axhline(y=0, color="gray", linestyle="--", alpha=0.5, linewidth=1, label="QWERTY baseline")

    plt.tight_layout()
    plt.gca()
    return


if __name__ == "__main__":
    app.run()
