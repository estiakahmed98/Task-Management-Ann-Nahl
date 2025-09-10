//data_entry/clients/[clientId]/tasks/page.tsx

import PostingTasksPanel from "@/components/dataentry/PostingTasksPanel"

export default function TasksPage({ params }: { params: { clientId: string } }) {
  return (
    <div>
      <PostingTasksPanel clientId={params.clientId} />
    </div>
  )
}
