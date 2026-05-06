#!/usr/bin/env python3
"""
Replay e resumo de logs NDJSON do monitor através da engine NodeScope.

Uso:
    python scripts/replay_monitor_log.py
    python scripts/replay_monitor_log.py --file logs/2026-04-22-monitor.ndjson
    python scripts/replay_monitor_log.py --log-dir logs/
"""

import argparse
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from engine import load_snapshot  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Replay de logs NDJSON do monitor pela engine NodeScope."
    )
    parser.add_argument(
        "--log-dir",
        type=pathlib.Path,
        default=ROOT / "logs",
        help="Diretório com arquivos .ndjson (padrão: logs/)",
    )
    parser.add_argument(
        "--file",
        type=pathlib.Path,
        default=None,
        help="Arquivo NDJSON específico para replay",
    )
    args = parser.parse_args()

    if args.file and not args.file.exists():
        print(f"[erro] arquivo não encontrado: {args.file}")
        sys.exit(1)

    snapshot = load_snapshot(log_dir=args.log_dir, file=args.file)

    print("\n=== NodeScope Engine — Replay Summary ===")
    print(f"Fonte:          {snapshot.source}")
    print(f"Total eventos:  {snapshot.analytics.total_events}")
    print(f"  zmq_rawtx:    {snapshot.rawtx_count}")
    print(f"  zmq_rawblock: {snapshot.rawblock_count}")
    print(f"  outros:       {snapshot.other_count}")
    print(f"  ignorados:    {snapshot.reader_stats.ignored_lines}")
    print(f"  skipped:      {snapshot.skipped_events}")

    print("\nClassificações:")
    for kind, count in snapshot.analytics.classification_counts.items():
        print(f"  {kind}: {count}")
    if snapshot.analytics.script_type_counts:
        print("\nScript types:")
        for script_type, count in snapshot.analytics.script_type_counts.items():
            print(f"  {script_type}: {count}")
    print(
        "\nSinais tx:      "
        f"coinbase_input_present={snapshot.analytics.coinbase_input_present_count}  "
        f"has_op_return={snapshot.analytics.op_return_count}"
    )

    if snapshot.latest_block and snapshot.latest_block.block:
        b = snapshot.latest_block.block
        print(f"\nÚltimo bloco:  altura={b.height}  hash={b.hash}")

    if snapshot.latest_tx and snapshot.latest_tx.tx:
        t = snapshot.latest_tx.tx
        print(
            f"Última tx:     txid={t.txid}  "
            f"total_out={t.total_out} BTC  "
            f"classificação={snapshot.latest_tx.kind}"
        )

    print()


if __name__ == "__main__":
    main()
