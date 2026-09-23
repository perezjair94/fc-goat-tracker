import { MatchDetailView } from "@/components/match-detail-view";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MatchDetailView id={id} />;
}
