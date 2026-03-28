export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Patient Detail</h1>
      <p className="text-muted-foreground">Coming soon — patient {id} overview, encounters, and observations.</p>
    </div>
  );
}
