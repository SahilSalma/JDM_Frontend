import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CompatibilityEntry {
  make: string;
  model: string;
  year_start: number;
  year_end: number;
  notes?: string;
}

interface PrimaryFitment {
  make: string;
  model: string;
  year_start: number;
  year_end: number;
}

interface FitmentTableProps {
  compatibility: CompatibilityEntry[];
  primaryFitment?: PrimaryFitment;
}

export default function FitmentTable({ compatibility, primaryFitment }: FitmentTableProps) {
  const rows: (CompatibilityEntry & { isPrimary?: boolean })[] = [];

  if (primaryFitment) {
    rows.push({ ...primaryFitment, notes: 'Primary fitment', isPrimary: true });
  }

  for (const entry of compatibility) {
    const isDuplicate =
      primaryFitment &&
      entry.make === primaryFitment.make &&
      entry.model === primaryFitment.model &&
      entry.year_start === primaryFitment.year_start &&
      entry.year_end === primaryFitment.year_end;

    if (!isDuplicate) {
      rows.push(entry);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No fitment information available.
      </p>
    );
  }

  // Group rows by Make (case-insensitive deduplication of keys, display in uppercase)
  const grouped: Record<string, typeof rows> = {};
  for (const row of rows) {
    const key = row.make.trim();
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(row);
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([make, entries]) => (
        <div key={make} className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border bg-muted/30 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-[#DC2626]">
            {make}
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground w-1/3">Model</TableHead>
                <TableHead className="text-muted-foreground w-1/4">Years</TableHead>
                <TableHead className="text-muted-foreground">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, idx) => (
                <TableRow
                  key={idx}
                  className={
                    entry.isPrimary
                      ? 'border-border bg-[#DC2626]/5 hover:bg-[#DC2626]/10'
                      : 'border-border bg-background hover:bg-muted/40'
                  }
                >
                  <TableCell className="font-semibold text-foreground">{entry.model}</TableCell>
                  <TableCell className="text-foreground/80">
                    {entry.year_start === entry.year_end
                      ? entry.year_start
                      : `${entry.year_start}–${entry.year_end}`}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{entry.notes ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
