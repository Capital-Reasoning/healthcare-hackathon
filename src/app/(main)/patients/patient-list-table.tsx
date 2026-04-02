'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useTransition } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Users,
} from 'lucide-react';

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Deterministic color based on name — always returns the same color for the same patient
const AVATAR_COLORS = [
  'bg-teal-100 text-teal-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-emerald-100 text-emerald-700',
  'bg-indigo-100 text-indigo-700',
  'bg-cyan-100 text-cyan-700',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

interface PatientRow {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  age: number | null;
  sex: string | null;
  postalCode: string | null;
  bloodType: string | null;
  insuranceNumber: string | null;
  primaryLanguage: string | null;
  emergencyContactPhone: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface PatientListTableProps {
  patients: PatientRow[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
}

export function PatientListTable({
  patients,
  total,
  page,
  pageSize,
  search,
}: PatientListTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(search);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const updateSearch = useCallback(
    (newSearch: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newSearch) {
        params.set('search', newSearch);
      } else {
        params.delete('search');
      }
      params.delete('page'); // Reset to page 1 on new search
      startTransition(() => {
        router.push(`/patients?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition],
  );

  const goToPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newPage > 1) {
        params.set('page', String(newPage));
      } else {
        params.delete('page');
      }
      startTransition(() => {
        router.push(`/patients?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition],
  );

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateSearch(searchValue);
            }
          }}
          onBlur={() => {
            if (searchValue !== search) {
              updateSearch(searchValue);
            }
          }}
          placeholder="Search by name or patient ID..."
          className="w-full rounded-md border border-border bg-white pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total === 0
            ? 'No patients found'
            : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} patients`}
        </span>
        {isPending && (
          <span className="text-xs text-primary animate-pulse">Loading...</span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border border-border bg-white overflow-hidden">
        {patients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="size-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              {search ? 'No matching patients' : 'No patients in the system'}
            </p>
            <p className="text-xs text-muted-foreground">
              {search
                ? 'Try a different search term.'
                : 'Seed the database to populate the patient panel.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Patient Name
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Patient ID
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Age
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Sex
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Date of Birth
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    {/* Chevron column */}
                  </th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="group border-b border-border last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/patients/${patient.patientId}`}
                        className="flex items-center gap-3 group/name"
                      >
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(patient.firstName + patient.lastName)}`}
                        >
                          {getInitials(patient.firstName, patient.lastName)}
                        </span>
                        <span className="font-medium text-foreground group-hover/name:text-primary transition-colors">
                          {patient.lastName}, {patient.firstName}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      <Link href={`/patients/${patient.patientId}`}>
                        {patient.patientId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <Link href={`/patients/${patient.patientId}`}>
                        {patient.age != null ? `${patient.age}y` : '--'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">
                      <Link href={`/patients/${patient.patientId}`}>
                        {patient.sex ?? '--'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      <Link href={`/patients/${patient.patientId}`}>
                        {patient.dateOfBirth
                          ? new Date(patient.dateOfBirth).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              },
                            )
                          : '--'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/patients/${patient.patientId}`}>
                        <ChevronRight className="inline-block size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="size-4" />
            Previous
          </button>

          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
