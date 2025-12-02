#!/usr/bin/env python3
"""
Exploratory Data Analysis on keyboard layouts.

This marimo notebook visualizes the distribution of each metric across all layouts,
sorted by value. QWERTY is highlighted as a reference point.

Run with: uv run marimo run scripts/eda_layouts.py
Or edit: uv run marimo edit scripts/eda_layouts.py
"""

import marimo

__generated_with = "0.18.1"
app = marimo.App(width="medium", app_title="Layout Metrics EDA")


@app.cell
def _():
    import marimo as mo
    return (mo,)


@app.cell
def _(mo):
    mo.md(r"""
    # Keyboard Layout Metrics EDA

    This notebook explores the distribution of metrics across all keyboard layouts.

    For each metric, we plot:
    - **Y-axis**: The metric value (e.g., SFB %, Rolls %, etc.)
    - **X-axis**: Layouts sorted by that metric (best to worst or worst to best)
    - **Highlighted**: QWERTY as a reference point (red dot)

    ## Hypothesis

    We expect to see **logarithmic-like curves** for most metrics:
    - Quick gains from QWERTY (the low-hanging fruit)
    - Diminishing returns as layouts get more optimized
    """)
    return


@app.cell
def _():
    import json
    from pathlib import Path

    import matplotlib.pyplot as plt
    import numpy as np

    # Load data
    data_path = Path(__file__).parent.parent / "site" / "data.json"
    with open(data_path) as f:
        data = json.load(f)

    layouts = data["layouts"]
    print(f"Loaded {len(layouts)} layouts")
    return data, layouts, np, plt


@app.cell
def _():
    def parse_metric_value(value):
        """Extract numeric value from a metric string (removes % sign)."""
        if value is None:
            return None
        return float(str(value).replace("%", ""))
    return (parse_metric_value,)


@app.cell
def _(layouts, parse_metric_value):
    def extract_all_metrics(language="english"):
        """Extract all metric values for all layouts."""
        results = []
        for layout in layouts:
            metrics = layout.get("metrics", {}).get(language, {})
            if not metrics:
                continue

            sfb = parse_metric_value(metrics.get("same_finger_bigrams"))
            sfs = parse_metric_value(metrics.get("skip_bigrams_1u"))
            lsb = parse_metric_value(metrics.get("lat_stretch_bigrams"))
            scissors = parse_metric_value(metrics.get("scissors"))
            redirect = parse_metric_value(metrics.get("redirect"))
            pinky = parse_metric_value(metrics.get("pinky_off"))
            effort = parse_metric_value(metrics.get("effort"))

            # Inward rolls only (more comfortable than outward rolls)
            roll_in = parse_metric_value(metrics.get("bigram_roll_in")) or 0
            roll_in2 = parse_metric_value(metrics.get("roll_in")) or 0
            rolls_in = roll_in + roll_in2

            results.append({
                "name": layout["name"],
                "sfb": sfb,
                "sfs": sfs,
                "lsb": lsb,
                "scissors": scissors,
                "redirect": redirect,
                "pinky": pinky,
                "rolls_in": rolls_in,
                "effort": effort,
            })
        return results

    all_metrics = extract_all_metrics("english")
    print(f"Extracted metrics for {len(all_metrics)} layouts")
    return all_metrics, extract_all_metrics


@app.cell
def _(mo):
    mo.md(r"""
    ## Metric Distributions

    Each plot shows all layouts sorted by that metric's value.
    - **Lower is better** for: SFB, SFS, LSB, Scissors, Redirect, Pinky, Effort
    - **Higher is better** for: Rolls In (inward rolls are more comfortable than outward rolls)

    The red dot marks QWERTY's position.
    """)
    return


@app.cell
def _(all_metrics, np, plt):
    def plot_metric_distribution(metric_key, title, lower_is_better=True):
        """Plot sorted metric values with QWERTY highlighted."""
        # Filter out None values and sort
        valid_data = [(m["name"], m[metric_key]) for m in all_metrics if m[metric_key] is not None]

        if not valid_data:
            return None

        # Sort by metric value
        if lower_is_better:
            sorted_data = sorted(valid_data, key=lambda x: x[1])  # Best (lowest) first
        else:
            sorted_data = sorted(valid_data, key=lambda x: x[1], reverse=True)  # Best (highest) first

        names = [d[0] for d in sorted_data]
        values = [d[1] for d in sorted_data]

        # Find QWERTY position
        qwerty_idx = None
        qwerty_value = None
        for i, name in enumerate(names):
            if name.lower() == "qwerty":
                qwerty_idx = i
                qwerty_value = values[i]
                break

        # Create plot
        fig, ax = plt.subplots(figsize=(12, 5))

        # Plot all points
        x = np.arange(len(values))
        ax.plot(x, values, 'b-', linewidth=1.5, alpha=0.7)
        ax.scatter(x, values, c='steelblue', s=20, alpha=0.6, zorder=5)

        # Highlight QWERTY
        if qwerty_idx is not None:
            ax.scatter([qwerty_idx], [qwerty_value], c='red', s=150, zorder=10, 
                      label=f'QWERTY (rank {qwerty_idx + 1}/{len(values)})', edgecolors='darkred', linewidths=2)

            # Add annotation
            direction = "better" if lower_is_better else "better"
            layouts_better = qwerty_idx if lower_is_better else qwerty_idx
            layouts_worse = len(values) - qwerty_idx - 1 if lower_is_better else len(values) - qwerty_idx - 1

            ax.annotate(
                f'QWERTY: {qwerty_value:.2f}%\n{layouts_better} layouts better\n{layouts_worse} layouts worse',
                xy=(qwerty_idx, qwerty_value),
                xytext=(qwerty_idx + len(values) * 0.1, qwerty_value),
                fontsize=10,
                arrowprops=dict(arrowstyle='->', color='red', alpha=0.7),
                bbox=dict(boxstyle='round', facecolor='lightyellow', alpha=0.9, edgecolor='orange'),
            )

        ax.set_xlabel("Layouts (sorted by metric, best → worst)", fontsize=11)
        ax.set_ylabel(f"{title}", fontsize=11)
        ax.set_title(f"{title} Distribution Across Layouts", fontsize=13, fontweight='bold')

        # Add grid
        ax.grid(True, alpha=0.3)
        ax.legend(loc='best')

        # Set x-axis limits
        ax.set_xlim(-2, len(values) + 2)

        plt.tight_layout()
        return fig

    return (plot_metric_distribution,)


@app.cell
def _(mo):
    mo.md(r"""### Same Finger Bigrams (SFB) - Lower is Better""")
    return


@app.cell
def _(plot_metric_distribution):
    plot_metric_distribution("sfb", "Same Finger Bigrams (%)", lower_is_better=True)
    return


@app.cell
def _(mo):
    mo.md(r"""### Skip Bigrams (SFS) - Lower is Better""")
    return


@app.cell
def _(plot_metric_distribution):
    plot_metric_distribution("sfs", "Skip Bigrams 1u (%)", lower_is_better=True)
    return


@app.cell
def _(mo):
    mo.md(r"""### Lateral Stretch Bigrams (LSB) - Lower is Better""")
    return


@app.cell
def _(plot_metric_distribution):
    plot_metric_distribution("lsb", "Lateral Stretch Bigrams (%)", lower_is_better=True)
    return


@app.cell
def _(mo):
    mo.md(r"""### Scissors - Lower is Better""")
    return


@app.cell
def _(plot_metric_distribution):
    plot_metric_distribution("scissors", "Scissors (%)", lower_is_better=True)
    return


@app.cell
def _(mo):
    mo.md(r"""### Redirects - Lower is Better""")
    return


@app.cell
def _(plot_metric_distribution):
    plot_metric_distribution("redirect", "Redirects (%)", lower_is_better=True)
    return


@app.cell
def _(mo):
    mo.md(r"""### Pinky Usage - Lower is Better""")
    return


@app.cell
def _(plot_metric_distribution):
    plot_metric_distribution("pinky", "Pinky Off-Home (%)", lower_is_better=True)
    return


@app.cell
def _(mo):
    mo.md(r"""### Rolls In - Higher is Better
    
    Inward rolls are generally perceived as more comfortable than outward rolls.
    """)
    return


@app.cell
def _(plot_metric_distribution):
    plot_metric_distribution("rolls_in", "Rolls In (%)", lower_is_better=False)
    return


@app.cell
def _(mo):
    mo.md(r"""### Effort - Lower is Better""")
    return


@app.cell
def _(plot_metric_distribution):
    plot_metric_distribution("effort", "Effort Score", lower_is_better=True)
    return


@app.cell
def _(mo):
    mo.md(r"""
    ## Combined View: All Metrics in One Plot

    Normalized view showing all metrics together, with QWERTY's position marked on each.
    """)
    return


@app.cell
def _(all_metrics, np, plt):
    def plot_all_metrics_combined():
        """Plot all metrics normalized on a single figure."""
        metrics_config = [
            ("sfb", "SFB", True),
            ("sfs", "SFS", True),
            ("lsb", "LSB", True),
            ("scissors", "Scissors", True),
            ("redirect", "Redirect", True),
            ("pinky", "Pinky", True),
            ("rolls_in", "Rolls In", False),
            ("effort", "Effort", True),
        ]

        fig, axes = plt.subplots(2, 4, figsize=(16, 8))
        axes = axes.flatten()

        for idx, (metric_key, title, lower_is_better) in enumerate(metrics_config):
            ax = axes[idx]

            # Filter and sort
            valid_data = [(m["name"], m[metric_key]) for m in all_metrics if m[metric_key] is not None]
            if not valid_data:
                continue

            if lower_is_better:
                sorted_data = sorted(valid_data, key=lambda x: x[1])
            else:
                sorted_data = sorted(valid_data, key=lambda x: x[1], reverse=True)

            names = [d[0] for d in sorted_data]
            values = [d[1] for d in sorted_data]

            # Find QWERTY
            qwerty_idx = None
            qwerty_value = None
            for i, name in enumerate(names):
                if name.lower() == "qwerty":
                    qwerty_idx = i
                    qwerty_value = values[i]
                    break

            # Plot
            x = np.arange(len(values))
            ax.plot(x, values, 'b-', linewidth=1, alpha=0.7)
            ax.scatter(x, values, c='steelblue', s=10, alpha=0.5)

            if qwerty_idx is not None:
                ax.scatter([qwerty_idx], [qwerty_value], c='red', s=80, zorder=10, edgecolors='darkred', linewidths=1.5)
                ax.axvline(x=qwerty_idx, color='red', linestyle='--', alpha=0.3)

                # Add rank info
                rank_pct = (qwerty_idx / len(values)) * 100
                ax.set_title(f"{title}\nQWERTY rank: {qwerty_idx+1}/{len(values)} ({rank_pct:.0f}%)", fontsize=10)
            else:
                ax.set_title(title, fontsize=10)

            ax.set_xlabel("Sorted rank", fontsize=8)
            ax.set_ylabel(f"{title}", fontsize=8)
            ax.grid(True, alpha=0.3)

        plt.suptitle("All Metrics: Sorted Distributions with QWERTY Highlighted", fontsize=14, fontweight='bold', y=1.02)
        plt.tight_layout()
        return fig

    plot_all_metrics_combined()
    return (plot_all_metrics_combined,)


@app.cell
def _(mo):
    mo.md(r"""
    ## Observations

    Looking at these distributions, we can see:

    1. **The curves are indeed somewhat logarithmic** - there are quick gains from the worst layouts to the middle, then diminishing returns

    2. **QWERTY is consistently in the bottom tier** for most metrics:
       - It's near the worst for SFB (same finger bigrams)
       - It's also poor for redirects and scissors
       - It has mediocre rolls compared to optimized layouts

    3. **The spread varies by metric**:
       - Some metrics like scissors have a very tight distribution (most layouts are similar)
       - Others like effort have a wider spread

    4. **Diminishing returns are real**:
       - The top 20% of layouts are very close to each other
       - Most of the "easy wins" come from just not being QWERTY
    """)
    return


if __name__ == "__main__":
    app.run()
