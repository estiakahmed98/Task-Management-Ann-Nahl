// app/data_entry/clients/[clientId]/complete/page.tsx

import DataEntryCompleteTasksPanel from "@/components/dataentry/DataEntryCompleteTasksPanel";

export default function DataEntryCompletePage({ params }: { params: { clientId: string } }) {
  return (
    <div className="p-2 sm:p-4">
      <DataEntryCompleteTasksPanel clientId={params.clientId} />
    </div>
  );
}
